import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Checklist, Etapa } from '../types'

// ---------------------------------------------------------------------------
// Estado da sessão (sobrevive a recarregamentos do mod)
// ---------------------------------------------------------------------------

const PAINEL = 'guia-vivo'

const etapa = atom({ plugin: 'guia-vivo', key: 'etapa' } as const, 'explorar' as Etapa)
const checklist = atom({ plugin: 'guia-vivo', key: 'checklist' } as const, null, {
  shape: 'checklist-1',
})
const edicoes = atom({ plugin: 'guia-vivo', key: 'edicoesSemVerificar' } as const, 0)
const turnos = atom({ plugin: 'guia-vivo', key: 'turnos' } as const, 0)
const contexto = atom({ plugin: 'guia-vivo', key: 'contexto' } as const, 0)
const envTocado = atom({ plugin: 'guia-vivo', key: 'envTocado' } as const, false)
const dispensadas = atom({ plugin: 'guia-vivo', key: 'dispensadas' } as const, [], {
  shape: 'dispensadas-1',
})

// ---------------------------------------------------------------------------
// Conteúdo do guia
// ---------------------------------------------------------------------------

const ETAPAS: { id: Etapa; nome: string; agora: string; proximo: string }[] = [
  {
    id: 'explorar',
    nome: 'Explorar',
    agora: 'Entender antes de mudar.',
    proximo:
      'Peça: "Leia como funciona X e me explique. Não altere nada ainda."',
  },
  {
    id: 'planejar',
    nome: 'Planejar',
    agora: 'Combinar o caminho antes de mexer em arquivos.',
    proximo:
      'Revise o plano. Tarefa grande? Peça um PLAN.md com etapas pequenas. Quando convencer, dê o sinal verde.',
  },
  {
    id: 'implementar',
    nome: 'Implementar',
    agora: 'O Claude está alterando arquivos.',
    proximo:
      'Acompanhe uma etapa por vez. Saiu do plano? Esc para, Esc Esc (/rewind) desfaz.',
  },
  {
    id: 'verificar',
    nome: 'Verificar',
    agora: 'Conferir se funciona de verdade.',
    proximo:
      'Peça: "Me mostre que funciona" (testes rodando, página aberta, saída conferida).',
  },
  {
    id: 'salvar',
    nome: 'Salvar',
    agora: 'Registrar o que foi feito.',
    proximo:
      'Rode /code-review e faça o commit. Próxima tarefa? /clear antes de começar.',
  },
]

type Dica = { id: string; texto: string; urgente?: boolean }

const LEITURA = new Set(['Read', 'Grep', 'Glob', 'LS'])
const EDICAO = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])
const PLANO = new Set(['EnterPlanMode', 'ExitPlanMode'])
// Um nome de arquivo .env (ou .env.qualquer-coisa) em um caminho ou comando.
const ENV_NOME = /(?:^|[\/\\\s'"=<>:(])\.env(\.[\w.-]+)?(?=$|[\s'"\/\\;|&)<>,])/g
// Modelos sem senha, que podem ser lidos e editados.
const ENV_MODELO = /^\.(example|exemplo|sample|template|modelo|dist)(\.|$)/i

const MOTIVO_ENV =
  'Bloqueado pelo Guia vivo: arquivos .env guardam senhas e chaves e não devem ser lidos nem alterados pelo Claude. Se precisar de uma credencial, peça para a pessoa configurá-la. Arquivos de modelo como .env.example são permitidos.'

function citaEnv(texto: string): boolean {
  for (const achado of texto.matchAll(ENV_NOME)) {
    const sufixo = achado[1]
    if (sufixo === undefined || !ENV_MODELO.test(sufixo)) return true
  }
  return false
}

function tentaUsarEnv(entrada: Record<string, unknown>): boolean {
  for (const campo of ['file_path', 'notebook_path', 'path', 'command']) {
    const valor = entrada[campo]
    if (typeof valor === 'string' && citaEnv(valor)) return true
  }
  return false
}
const VERIFICA =
  /\b(test|tests|pytest|jest|vitest|mocha|playwright|tsc|lint|eslint|ruff|mypy|build|check)\b/
const COMMIT = /\bgit\s+(commit|push)\b/

// ---------------------------------------------------------------------------
// Funções de apoio
// ---------------------------------------------------------------------------

async function lerChecklist($: EngineInterface): Promise<Checklist> {
  const cwd = await $.session.cwd()
  const temClaudeMd =
    (await $.fs.exists(`${cwd}/CLAUDE.md`)) ||
    (await $.fs.exists(`${cwd}/.claude/CLAUDE.md`))
  const temGit = await $.fs.exists(`${cwd}/.git`)
  let envProtegido = false
  try {
    const gitignore = await $.fs.read(`${cwd}/.gitignore`)
    envProtegido = /^\s*(\*\*\/)?\.env\b|^\s*\*\.env\b|^\s*\.env\*/m.test(
      gitignore,
    )
  } catch {
    envProtegido = false
  }

  return { temClaudeMd, envProtegido, temGit }
}

async function atualizarChecklist($: EngineInterface) {
  const novo = await lerChecklist($)
  await update($, checklist, () => novo)
}

function nomeDaEtapa(id: Etapa) {
  return ETAPAS.find(e => e.id === id)?.nome ?? id
}

async function mostrarStatus($: EngineInterface, atual: Etapa) {
  const n = ETAPAS.findIndex(e => e.id === atual) + 1
  $.ui.status(`Guia: ${n}/5 ${nomeDaEtapa(atual)} · /guia`)
}

async function irPara($: EngineInterface, nova: Etapa) {
  const antes = await read($, etapa)
  if (antes === nova) return
  await update($, etapa, () => nova)
  await mostrarStatus($, nova)
}

async function calcularDicas($: EngineInterface): Promise<Dica[]> {
  const lista: Dica[] = []
  const check = await read($, checklist)
  const nEdicoes = await read($, edicoes)
  const nTurnos = await read($, turnos)
  const pct = await read($, contexto)
  const atual = await read($, etapa)
  const fora = new Set(await read($, dispensadas))

  if (await read($, envTocado)) {
    lista.push({
      id: 'env-tocado',
      urgente: true,
      texto:
        'O Claude tentou acessar um arquivo .env (senhas e chaves) e o Guia vivo bloqueou. Se a tarefa precisa de uma credencial, configure você mesmo.',
    })
  }
  if (check && !check.envProtegido) {
    lista.push({
      id: 'env-gitignore',
      urgente: true,
      texto:
        'O .gitignore não protege o .env. Peça: "Adicione .env ao .gitignore".',
    })
  }
  if (check && !check.temClaudeMd) {
    lista.push({
      id: 'sem-claude-md',
      texto:
        'Projeto sem CLAUDE.md. Rode /init para criar o manual de boas-vindas e depois enxugue.',
    })
  }
  if (check && !check.temGit) {
    lista.push({
      id: 'sem-git',
      texto:
        'Projeto sem git: nada fica registrado. Peça: "Inicie um repositório git aqui".',
    })
  }
  if (pct >= 80) {
    lista.push({
      id: 'contexto-cheio',
      urgente: true,
      texto: `A mesa está ${pct}% cheia. Rode /compact dizendo o que manter, ou /clear se mudou de assunto.`,
    })
  } else if (pct >= 55) {
    lista.push({
      id: 'contexto-medio',
      texto: `A mesa já está ${pct}% ocupada. Tarefa nova? /clear. Mesma tarefa? /compact em breve.`,
    })
  }
  if (nEdicoes >= 5) {
    lista.push({
      id: 'verificar',
      texto: `${nEdicoes} alterações sem nenhum teste ou conferência. Peça: "Me mostre que funciona".`,
    })
  }
  if (atual === 'implementar' && nEdicoes >= 3 && !fora.has('plano-visto')) {
    lista.push({
      id: 'modo-plano',
      texto:
        'Tarefa grande? Da próxima vez comece no modo plano (Shift+Tab) para combinar o caminho antes.',
    })
  }
  if (nTurnos >= 25) {
    lista.push({
      id: 'conversa-longa',
      texto: `${nTurnos} trocas nesta conversa. Lembre: uma tarefa, uma conversa (/clear ao mudar de assunto).`,
    })
  }

  return lista.filter(d => !fora.has(d.id))
}

async function dispensar($: EngineInterface, id: string) {
  await update($, dispensadas, lista => [...new Set([...lista, id])])
}

async function liberar($: EngineInterface, ...ids: string[]) {
  await update($, dispensadas, lista => lista.filter(id => !ids.includes(id)))
}

async function resumoProximoPasso($: EngineInterface) {
  const atual = await read($, etapa)
  const info = ETAPAS.find(e => e.id === atual) ?? ETAPAS[0]!
  const dicas = await calcularDicas($)
  const linhas = [
    `Etapa atual: ${info.nome}. ${info.agora}`,
    `Próximo passo: ${info.proximo}`,
  ]
  if (dicas.length > 0) {
    linhas.push('', 'Dicas:')
    for (const d of dicas) linhas.push(`- ${d.urgente ? '⚠ ' : ''}${d.texto}`)
  }

  return linhas.join('\n')
}

// ---------------------------------------------------------------------------
// Ganchos
// ---------------------------------------------------------------------------

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'guia',
      description: 'Abre o Guia vivo e mostra o próximo passo recomendado',
    })
    await atualizarChecklist($)
    await mostrarStatus($, await read($, etapa))
    if (e.surface !== null && e.surface !== 'terminal') {
      void $.ui.open({ id: PAINEL, title: 'Guia vivo' })
    }

    return next(e)
  })

  on('command.run', { command: 'guia' }, async $ => {
    await $.ui.open({ id: PAINEL, title: 'Guia vivo' })

    return { text: await resumoProximoPasso($) }
  })

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      await update($, etapa, () => 'explorar' as Etapa)
      await update($, edicoes, () => 0)
      await update($, turnos, () => 0)
      await update($, contexto, () => 0)
      await update($, envTocado, () => false)
      await update($, dispensadas, () => [])
      await mostrarStatus($, 'explorar')
    }

    return next(e)
  })

  // Um único gancho para chamadas de ferramenta:
  // 1. Guarda: recusa qualquer acesso a arquivos .env (senhas e chaves).
  // 2. Depois que a ferramenta roda, atualiza a etapa do método.
  // Se algo falhar antes da ferramenta rodar, a chamada é recusada por
  // segurança; se falhar depois, o resultado da ferramenta é mantido.
  on('tool.call', async ($, e, next) => {
    const entrada = e as unknown as Record<string, unknown>

    if (tentaUsarEnv(entrada)) {
      if (!(await read($, envTocado))) {
        $.ui.toast('Guia vivo: acesso a um arquivo .env bloqueado. Veja no painel.')
      }
      await update($, envTocado, () => true)
      await liberar($, 'env-tocado')

      return { deny: MOTIVO_ENV }
    }

    const resultado = await next(e)
    if (resultado.deny !== undefined) return resultado

    const ferramenta = String(e.tool)
    const comando = typeof entrada.command === 'string' ? entrada.command : ''
    const atual = await read($, etapa)
    if (PLANO.has(ferramenta)) {
      await dispensar($, 'plano-visto')
      await irPara($, 'planejar')
    } else if (EDICAO.has(ferramenta)) {
      await update($, edicoes, n => n + 1)
      await irPara($, 'implementar')
    } else if (ferramenta === 'Bash' && COMMIT.test(comando)) {
      await irPara($, 'salvar')
    } else if (ferramenta === 'Bash' && VERIFICA.test(comando)) {
      await update($, edicoes, () => 0)
      await liberar($, 'verificar')
      await irPara($, 'verificar')
    } else if (LEITURA.has(ferramenta) && atual === 'salvar') {
      await irPara($, 'explorar')
    }

    return resultado
  }).catch(($, e, next) =>
    next.called
      ? next(e)
      : { deny: 'Guia vivo: a verificação de .env falhou; chamada recusada por segurança.' },
  )

  on('turn.complete', async ($, e, next) => {
    await update($, turnos, n => n + 1)
    const { context } = await $.session.usage()
    const pct = context.percent ?? 0
    await update($, contexto, () => pct)
    if (pct < 40) await liberar($, 'contexto-medio', 'contexto-cheio')
    await atualizarChecklist($)

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PAINEL }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const atual = await read($, etapa)
    const check = await read($, checklist)
    const dicas = await calcularDicas($)
    const indice = Math.max(
      0,
      ETAPAS.findIndex(x => x.id === atual),
    )
    const info = ETAPAS[indice]!

    const marca = (ok: boolean) => (ok ? '✓' : '✗')

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text bold>Método dos 5 passos</Text>
          {ETAPAS.map((x, i) => (
            <Text
              color={i === indice ? 'claude' : undefined}
              bold={i === indice}
              dimColor={i !== indice}
            >
              {i < indice ? '✓' : i === indice ? '▶' : '·'} {i + 1}. {x.nome}
            </Text>
          ))}
        </Box>

        <Box flexDirection="column">
          <Text bold>Agora</Text>
          <Text>{info.agora}</Text>
          <Text bold>Próximo passo</Text>
          <Text>{info.proximo}</Text>
          <Box flexDirection="row" gap={1}>
            {indice > 0 && (
              <Button
                key="voltar"
                label="◀ Etapa anterior"
                onPress={() => irPara($, ETAPAS[indice - 1]!.id)}
              />
            )}
            {indice < ETAPAS.length - 1 && (
              <Button
                key="avancar"
                label="Próxima etapa ▶"
                variant="primary"
                onPress={() => irPara($, ETAPAS[indice + 1]!.id)}
              />
            )}
            {indice === ETAPAS.length - 1 && (
              <Button
                key="recomecar"
                label="Nova tarefa"
                variant="primary"
                onPress={() => irPara($, 'explorar')}
              />
            )}
          </Box>
        </Box>

        <Box flexDirection="column">
          <Text bold>Checklist do projeto</Text>
          {check === null ? (
            <Text dimColor>Verificando…</Text>
          ) : (
            <Box flexDirection="column">
              <Text color={check.temClaudeMd ? 'success' : 'warning'}>
                {marca(check.temClaudeMd)} CLAUDE.md
              </Text>
              <Text color={check.envProtegido ? 'success' : 'warning'}>
                {marca(check.envProtegido)} .env protegido no .gitignore
              </Text>
              <Text color={check.temGit ? 'success' : 'warning'}>
                {marca(check.temGit)} Repositório git
              </Text>
            </Box>
          )}
        </Box>

        <Box flexDirection="column">
          <Text bold>Dicas</Text>
          {dicas.length === 0 && (
            <Text dimColor>Tudo em ordem por aqui.</Text>
          )}
          {dicas.map(d => (
            <Box flexDirection="column">
              <Text color={d.urgente ? 'error' : undefined}>
                {d.urgente ? '⚠ ' : '💡 '}
                {d.texto}
              </Text>
              <Button
                key={`ok-${d.id}`}
                label="Entendi"
                onPress={() => dispensar($, d.id)}
              />
            </Box>
          ))}
        </Box>

        <Text dimColor>
          4 regras: uma tarefa por conversa · plano antes de mexer · "me mostre
          que funciona" · o que se repete vira skill
        </Text>
      </Box>
    )
  })
}
