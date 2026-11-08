import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Checklist, Especificacao, Etapa, Tamanho } from '../types'

// ---------------------------------------------------------------------------
// Estado da sessão (sobrevive a recarregamentos do mod)
// ---------------------------------------------------------------------------

const PAINEL = 'guia-vivo'

const etapa = atom({ plugin: 'guia-vivo', key: 'etapa' } as const, 'explorar' as Etapa)
const tamanho = atom({ plugin: 'guia-vivo', key: 'tamanho' } as const, null, {
  shape: 'tamanho-1',
})
const checklist = atom({ plugin: 'guia-vivo', key: 'checklist' } as const, null, {
  shape: 'checklist-1',
})
const especificacao = atom({ plugin: 'guia-vivo', key: 'especificacao' } as const, null, {
  shape: 'especificacao-2',
})
const arquivos = atom({ plugin: 'guia-vivo', key: 'arquivosEditados' } as const, [], {
  shape: 'arquivos-1',
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

type InfoEtapa = { id: Etapa; nome: string; agora: string }

const ETAPAS: InfoEtapa[] = [
  { id: 'explorar', nome: 'Explorar', agora: 'Entender antes de mudar.' },
  { id: 'planejar', nome: 'Planejar', agora: 'Combinar o caminho antes de mexer em arquivos.' },
  { id: 'implementar', nome: 'Implementar', agora: 'O Claude está alterando arquivos.' },
  { id: 'verificar', nome: 'Verificar', agora: 'Conferir se funciona de verdade.' },
  { id: 'salvar', nome: 'Salvar', agora: 'Registrar o que foi feito.' },
]

type InfoTamanho = {
  id: Tamanho
  nome: string
  quando: string
  caminho: string
  // O que o Claude recebe quando este tamanho é escolhido.
  instrucao: string
  proximo: Record<Etapa, string>
}

const TAMANHOS: InfoTamanho[] = [
  {
    id: 'pequena',
    nome: 'Pequena',
    quando: 'Ajuste ou correção em 1 ou 2 arquivos, que dá para explicar em uma frase.',
    caminho: '5 passos direto, com intenção e critério de pronto.',
    instrucao:
      'A pessoa classificou esta tarefa como PEQUENA. Siga os 5 passos de forma leve: antes de alterar, confirme em uma frase a intenção e o critério de pronto (como saber que ficou certo); faça a mudança; mostre a evidência de que o critério foi atendido. Não crie PLAN.md nem especificação. Se perceber que a tarefa é maior do que parecia, avise e sugira mudar para média.',
    proximo: {
      explorar: 'Diga em uma frase o que quer e como saber que ficou pronto. Ex.: "Corrigir o total da nota; pronto quando bater com a planilha".',
      planejar: 'Peça ao Claude para dizer em 2 ou 3 linhas o que vai mudar, antes de mexer.',
      implementar: 'Acompanhe. Saiu do combinado? Esc para; Esc Esc (/rewind) desfaz.',
      verificar: 'Confira o critério de pronto que você definiu: "Me mostre que funciona".',
      salvar: 'Faça o commit. Próxima tarefa? /clear antes de começar.',
    },
  },
  {
    id: 'media',
    nome: 'Média',
    quando: 'Vários arquivos ou algumas decisões, mas cabe em uma conversa.',
    caminho: 'Plano curto em PLAN.md com critérios de aceite e etapas pequenas.',
    instrucao:
      'A pessoa classificou esta tarefa como MÉDIA. Antes de alterar arquivos, proponha um plano em PLAN.md com: objetivo, critérios de aceite verificáveis, perguntas em aberto, o que fica fora do escopo e etapas pequenas (cada uma com como verificar). Marque cada informação como [confirmado] (a pessoa disse) ou [assumido] (você deduziu) e peça confirmação das suposições. Espere aprovação. Depois execute uma etapa por vez, verifique e registre em PROGRESS.md.',
    proximo: {
      explorar: 'Peça: "Leia como funciona X e me explique. Não altere nada ainda." Anote as dúvidas.',
      planejar: 'Peça: "Monte o plano em PLAN.md com critérios de aceite e etapas pequenas". Confirme as suposições e aprove.',
      implementar: 'Uma etapa do PLAN.md por vez, cada uma verificada antes da próxima.',
      verificar: 'Confira cada critério de aceite do PLAN.md e peça a evidência.',
      salvar: 'Atualize o PROGRESS.md, rode /code-review e faça o commit.',
    },
  },
  {
    id: 'grande',
    nome: 'Grande',
    quando: 'Funcionalidade ou sistema novo, várias conversas, regras de negócio ou outras pessoas envolvidas.',
    caminho: 'Especificação completa (/especificar): requisitos validados, plano técnico e tarefas.',
    instrucao:
      'A pessoa classificou esta tarefa como GRANDE. Use a skill /especificar se ela existir no projeto. Se não existir, siga o mesmo fluxo: (1) Concepção: faça perguntas, escreva specs/NNN-nome/especificacao.md com o problema, quem usa, requisitos e critérios de aceite, marcando cada item como [confirmado], [assumido] ou [a confirmar], e um relatório de prontidão com as lacunas; (2) depois da aprovação, escreva plano.md (como construir) e tarefas.md (lista de tarefas pequenas com caixas "- [ ]"); (3) Construção: uma tarefa por vez, verificada e marcada como "- [x]". Não escreva código antes da especificação ser aprovada.',
    proximo: {
      explorar: 'Concepção: rode /especificar. O Claude faz perguntas e escreve os requisitos com você.',
      planejar: 'Valide a especificação: responda às perguntas, confirme o que está [assumido] e aprove o plano e as tarefas.',
      implementar: 'Construção em ciclos curtos: "Faça a próxima tarefa de tarefas.md" (acompanhando) ou /construir (autônomo, para sozinho ao terminar ou travar).',
      verificar: 'Confira os critérios de aceite da especificação para as tarefas feitas.',
      salvar: 'Rode /code-review e faça o commit. Ainda há tarefas? Volte para Implementar.',
    },
  },
]

const PROXIMO_SEM_TAMANHO: Record<Etapa, string> = {
  explorar: 'Primeiro, escolha o tamanho da tarefa abaixo. Depois peça: "Leia como funciona X e me explique. Não altere nada ainda."',
  planejar: 'Revise o plano. Quando convencer, dê o sinal verde.',
  implementar: 'Acompanhe uma etapa por vez. Saiu do plano? Esc para; Esc Esc (/rewind) desfaz.',
  verificar: 'Peça: "Me mostre que funciona" (testes rodando, página aberta, saída conferida).',
  salvar: 'Rode /code-review e faça o commit. Próxima tarefa? /clear antes de começar.',
}

type Dica = { id: string; texto: string; urgente?: boolean }

const LEITURA = new Set(['Read', 'Grep', 'Glob', 'LS'])
const EDICAO = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])
const PLANO = new Set(['EnterPlanMode', 'ExitPlanMode'])
const VERIFICA =
  /\b(test|tests|pytest|jest|vitest|mocha|playwright|tsc|lint|eslint|ruff|mypy|build|check)\b/
const COMMIT = /\bgit\s+(commit|push)\b/

// Um nome de arquivo .env (ou .env.qualquer-coisa) em um caminho ou comando.
const ENV_NOME = /(?:^|[\/\\\s'"=<>:(])\.env(\.[\w.-]+)?(?=$|[\s'"\/\\;|&)<>,])/g
// Modelos sem senha, que podem ser lidos e editados.
const ENV_MODELO = /^\.(example|exemplo|sample|template|modelo|dist)(\.|$)/i

const MOTIVO_ENV =
  'Bloqueado pelo Guia vivo: arquivos .env guardam senhas e chaves e não devem ser lidos nem alterados pelo Claude. Se precisar de uma credencial, peça para a pessoa configurá-la. Arquivos de modelo como .env.example são permitidos.'

// ---------------------------------------------------------------------------
// Funções de apoio
// ---------------------------------------------------------------------------

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

function lerTamanho(texto: string): Tamanho | null {
  const t = texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  if (t.startsWith('peq')) return 'pequena'
  if (t.startsWith('med')) return 'media'
  if (t.startsWith('gra')) return 'grande'
  return null
}

function infoTamanho(t: Tamanho | null) {
  return TAMANHOS.find(x => x.id === t) ?? null
}

function nomeDaEtapa(id: Etapa) {
  return ETAPAS.find(e => e.id === id)?.nome ?? id
}

async function lerChecklist($: EngineInterface): Promise<Checklist> {
  const cwd = await $.session.cwd()
  const temClaudeMd =
    (await $.fs.exists(`${cwd}/CLAUDE.md`)) ||
    (await $.fs.exists(`${cwd}/.claude/CLAUDE.md`))
  const temGit = await $.fs.exists(`${cwd}/.git`)
  let envProtegido = false
  try {
    const gitignore = await $.fs.read(`${cwd}/.gitignore`)
    envProtegido = /^\s*(\*\*\/)?\.env\b|^\s*\*\.env\b|^\s*\.env\*/m.test(gitignore)
  } catch {
    envProtegido = false
  }

  return { temClaudeMd, envProtegido, temGit }
}

/** Acha a especificação mais recente (specs/<pasta>/tarefas.md) e conta as tarefas. */
async function lerEspecificacao($: EngineInterface): Promise<Especificacao | null> {
  const cwd = await $.session.cwd()
  const raiz = `${cwd}/specs`
  if (!(await $.fs.exists(raiz))) return null

  let melhor: { pasta: string; mtime: number } | null = null
  for (const item of await $.fs.list(raiz)) {
    if (item.kind !== 'dir' || item.name.startsWith('_') || item.name.startsWith('.')) continue
    const caminho = `${raiz}/${item.name}/tarefas.md`
    if (!(await $.fs.exists(caminho))) continue
    const { mtimeMs } = await $.fs.stat(caminho)
    if (melhor === null || mtimeMs > melhor.mtime) melhor = { pasta: item.name, mtime: mtimeMs }
  }
  if (melhor === null) return null

  const texto = await $.fs.read(`${raiz}/${melhor.pasta}/tarefas.md`)
  let feitas = 0
  let total = 0
  let proxima: string | null = null
  for (const linha of texto.split('\n')) {
    const m = /^\s*[-*]\s+\[([ xX])\]\s+(.*)$/.exec(linha)
    if (!m) continue
    total += 1
    if (m[1] !== ' ') feitas += 1
    else if (proxima === null) proxima = (m[2] ?? '').trim().slice(0, 90)
  }

  const lerSeExiste = async (arquivo: string) => {
    const caminho = `${raiz}/${melhor!.pasta}/${arquivo}`
    return (await $.fs.exists(caminho)) ? await $.fs.read(caminho) : ''
  }
  const aprovada = /Situa[çc][ãa]o:\s*aprovada/i.test(await lerSeExiste('especificacao.md'))
  const emConstrucao = /Situa[çc][ãa]o:\s*em andamento/i.test(
    await lerSeExiste('registro-construcao.md'),
  )

  return { pasta: melhor.pasta, feitas, total, proxima, aprovada, emConstrucao }
}

async function atualizarProjeto($: EngineInterface) {
  const novoCheck = await lerChecklist($)
  await update($, checklist, () => novoCheck)
  let novaSpec: Especificacao | null = null
  try {
    novaSpec = await lerEspecificacao($)
  } catch {
    novaSpec = null
  }
  await update($, especificacao, () => novaSpec)
  await mostrarStatus($)
}

async function mostrarStatus($: EngineInterface) {
  const atual = await read($, etapa)
  const t = infoTamanho(await read($, tamanho))
  const spec = await read($, especificacao)
  if (spec?.emConstrucao) {
    $.ui.status(`Guia: construção autônoma ${spec.feitas}/${spec.total} · /guia`)
    return
  }
  const n = ETAPAS.findIndex(e => e.id === atual) + 1
  const sufixo = t ? ` · ${t.nome}` : ''
  $.ui.status(`Guia: ${n}/5 ${nomeDaEtapa(atual)}${sufixo} · /guia`)
}

async function irPara($: EngineInterface, nova: Etapa) {
  const antes = await read($, etapa)
  if (antes === nova) return
  await update($, etapa, () => nova)
  await mostrarStatus($)
}

async function dispensar($: EngineInterface, id: string) {
  await update($, dispensadas, lista => [...new Set([...lista, id])])
}

async function liberar($: EngineInterface, ...ids: string[]) {
  await update($, dispensadas, lista => lista.filter(id => !ids.includes(id)))
}

/** Grava o tamanho escolhido e devolve a instrução para o Claude. */
async function definirTamanho($: EngineInterface, t: Tamanho) {
  await update($, tamanho, () => t)
  await liberar($, 'cresceu-media', 'cresceu-grande', 'grande-sem-spec')
  await mostrarStatus($)

  return `[Guia vivo] ${infoTamanho(t)!.instrucao}`
}

/** Escolha feita pelo botão do painel: avisa o Claude com uma nota na conversa. */
async function escolherPeloPainel($: EngineInterface, t: Tamanho) {
  const instrucao = await definirTamanho($, t)
  await $.session.append({
    message: { type: 'user', content: [{ type: 'text', text: instrucao }] },
  })
  $.ui.toast(`Guia vivo: tarefa ${infoTamanho(t)!.nome.toLowerCase()}. O Claude foi avisado.`)
}

async function novaTarefa($: EngineInterface) {
  await update($, etapa, () => 'explorar' as Etapa)
  await update($, tamanho, () => null)
  await update($, arquivos, () => [])
  await update($, edicoes, () => 0)
  await liberar($, 'cresceu-media', 'cresceu-grande', 'grande-sem-spec', 'verificar', 'modo-plano')
  await mostrarStatus($)
}

async function calcularDicas($: EngineInterface): Promise<Dica[]> {
  const lista: Dica[] = []
  const check = await read($, checklist)
  const nEdicoes = await read($, edicoes)
  const nArquivos = (await read($, arquivos)).length
  const nTurnos = await read($, turnos)
  const pct = await read($, contexto)
  const atual = await read($, etapa)
  const t = await read($, tamanho)
  const spec = await read($, especificacao)
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
      texto: 'O .gitignore não protege o .env. Peça: "Adicione .env ao .gitignore".',
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
  if (t === 'pequena' && nArquivos >= 4) {
    lista.push({
      id: 'cresceu-media',
      texto: `Esta tarefa "pequena" já mexeu em ${nArquivos} arquivos. Vale mudar para Média e fazer um plano curto?`,
    })
  }
  if (t === 'media' && nArquivos >= 12) {
    lista.push({
      id: 'cresceu-grande',
      texto: `A tarefa já mexeu em ${nArquivos} arquivos. Se ainda há muito pela frente, considere Grande e uma especificação (/especificar).`,
    })
  }
  if (spec && spec.aprovada && !spec.emConstrucao && spec.feitas < spec.total) {
    lista.push({
      id: 'pode-construir',
      texto: `A especificação ${spec.pasta} está aprovada e tem ${spec.total - spec.feitas} tarefas pendentes. Quer acompanhar uma por vez, ou rodar /construir para o modo autônomo (até 10 tarefas por rodada)?`,
    })
  }
  if (t === 'grande' && spec === null && atual !== 'explorar') {
    lista.push({
      id: 'grande-sem-spec',
      texto: 'Tarefa grande sem especificação em specs/. Rode /especificar antes de construir.',
    })
  }
  if (nEdicoes >= 5) {
    lista.push({
      id: 'verificar',
      texto: `${nEdicoes} alterações sem nenhum teste ou conferência. Peça: "Me mostre que funciona".`,
    })
  }
  if (t === null && atual === 'implementar' && nEdicoes >= 3 && !fora.has('plano-visto')) {
    lista.push({
      id: 'modo-plano',
      texto: 'O Claude já está alterando arquivos sem um tamanho definido. Escolha o tamanho acima para o guia ajustar o caminho.',
    })
  }
  if (check && !check.temClaudeMd) {
    lista.push({
      id: 'sem-claude-md',
      texto: 'Projeto sem CLAUDE.md. Rode /init para criar o manual de boas-vindas e depois enxugue.',
    })
  }
  if (check && !check.temGit) {
    lista.push({
      id: 'sem-git',
      texto: 'Projeto sem git: nada fica registrado. Peça: "Inicie um repositório git aqui".',
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

async function resumoProximoPasso($: EngineInterface) {
  const atual = await read($, etapa)
  const info = ETAPAS.find(e => e.id === atual) ?? ETAPAS[0]!
  const t = infoTamanho(await read($, tamanho))
  const spec = await read($, especificacao)
  const dicas = await calcularDicas($)

  const linhas = [
    `Etapa atual: ${info.nome}. ${info.agora}`,
    `Tamanho da tarefa: ${t ? `${t.nome} (${t.caminho})` : 'ainda não escolhido'}`,
    `Próximo passo: ${t ? t.proximo[atual] : PROXIMO_SEM_TAMANHO[atual]}`,
  ]
  if (t === null) {
    linhas.push('', 'Escolha o tamanho: /guia pequena, /guia media ou /guia grande.')
    for (const x of TAMANHOS) linhas.push(`- ${x.nome}: ${x.quando}`)
  }
  if (spec) {
    linhas.push(
      '',
      `Especificação ${spec.pasta}: ${spec.feitas}/${spec.total} tarefas concluídas${spec.proxima ? `. Próxima: ${spec.proxima}` : '.'}`,
    )
  }
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
      description: 'Abre o Guia vivo. Use /guia pequena, /guia media ou /guia grande para definir o tamanho da tarefa',
      argumentHint: '[pequena|media|grande]',
    })
    await atualizarProjeto($)
    await mostrarStatus($)
    if (e.surface !== null && e.surface !== 'terminal') {
      void $.ui.open({ id: PAINEL, title: 'Guia vivo' })
    }

    return next(e)
  })

  on('command.run', { command: 'guia' }, async ($, e) => {
    await $.ui.open({ id: PAINEL, title: 'Guia vivo' })
    const escolhido = lerTamanho(e.args)
    if (escolhido === null) {
      const aviso =
        e.args.trim() === ''
          ? ''
          : `Não entendi "${e.args.trim()}". Use pequena, media ou grande.\n\n`

      return { text: aviso + (await resumoProximoPasso($)) }
    }
    const instrucao = await definirTamanho($, escolhido)

    return {
      text: `Tarefa ${infoTamanho(escolhido)!.nome.toLowerCase()}: ${infoTamanho(escolhido)!.caminho}\n\n${await resumoProximoPasso($)}`,
      context: [instrucao],
    }
  })

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      await novaTarefa($)
      await update($, turnos, () => 0)
      await update($, contexto, () => 0)
      await update($, envTocado, () => false)
      await update($, dispensadas, () => [])
    }

    return next(e)
  })

  // Um único gancho para chamadas de ferramenta:
  // 1. Guarda: recusa qualquer acesso a arquivos .env (senhas e chaves).
  // 2. Depois que a ferramenta roda, atualiza a etapa e o progresso.
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
    const caminho =
      typeof entrada.file_path === 'string'
        ? entrada.file_path
        : typeof entrada.notebook_path === 'string'
          ? entrada.notebook_path
          : ''
    const atual = await read($, etapa)
    const ehSpec = /(^|[\/\\])specs[\/\\]/.test(caminho)

    if (PLANO.has(ferramenta)) {
      await dispensar($, 'plano-visto')
      await irPara($, 'planejar')
    } else if (EDICAO.has(ferramenta)) {
      if (ehSpec || /(^|[\/\\])(PLAN|PROGRESS)\.md$/.test(caminho)) {
        // Escrever plano ou especificação ainda é planejamento.
        if (atual === 'explorar') await irPara($, 'planejar')
        await update($, especificacao, () => null)
        const nova = await lerEspecificacao($).catch(() => null)
        await update($, especificacao, () => nova)
      } else {
        await update($, edicoes, n => n + 1)
        if (caminho !== '') {
          await update($, arquivos, lista =>
            lista.includes(caminho) ? lista : [...lista, caminho].slice(-200),
          )
        }
        await irPara($, 'implementar')
      }
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
    await atualizarProjeto($)

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PAINEL }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const atual = await read($, etapa)
    const t = infoTamanho(await read($, tamanho))
    const check = await read($, checklist)
    const spec = await read($, especificacao)
    const dicas = await calcularDicas($)
    const indice = Math.max(0, ETAPAS.findIndex(x => x.id === atual))
    const info = ETAPAS[indice]!
    const proximo = t ? t.proximo[atual] : PROXIMO_SEM_TAMANHO[atual]

    const marca = (ok: boolean) => (ok ? '✓' : '✗')

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text bold>Tamanho da tarefa</Text>
          {t === null ? (
            <Box flexDirection="column">
              <Text>Escolha para o guia ajustar o caminho:</Text>
              {TAMANHOS.map(x => (
                <Box flexDirection="column">
                  <Button
                    key={`tam-${x.id}`}
                    label={x.nome}
                    variant={x.id === 'media' ? 'primary' : undefined}
                    onPress={() => escolherPeloPainel($, x.id)}
                  />
                  <Text dimColor>{x.quando}</Text>
                </Box>
              ))}
            </Box>
          ) : (
            <Box flexDirection="column">
              <Text color="claude" bold>
                {t.nome}
              </Text>
              <Text dimColor>{t.caminho}</Text>
              <Box flexDirection="row" gap={1}>
                {TAMANHOS.filter(x => x.id !== t.id).map(x => (
                  <Button
                    key={`trocar-${x.id}`}
                    label={`Mudar para ${x.nome}`}
                    onPress={() => escolherPeloPainel($, x.id)}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>

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
          <Text>{proximo}</Text>
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
            <Button key="recomecar" label="Nova tarefa" onPress={() => novaTarefa($)} />
          </Box>
        </Box>

        {spec !== null && (
          <Box flexDirection="column">
            <Text bold>Especificação: {spec.pasta}</Text>
            {spec.emConstrucao && (
              <Text color="claude" bold>
                🔨 Construção autônoma em andamento
              </Text>
            )}
            <Text color={spec.total > 0 && spec.feitas === spec.total ? 'success' : undefined}>
              {spec.feitas}/{spec.total} tarefas concluídas
              {spec.aprovada ? ' · aprovada' : ' · ainda não aprovada'}
            </Text>
            {spec.proxima !== null && <Text dimColor>Próxima: {spec.proxima}</Text>}
          </Box>
        )}

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
          {dicas.length === 0 && <Text dimColor>Tudo em ordem por aqui.</Text>}
          {dicas.map(d => (
            <Box flexDirection="column">
              <Text color={d.urgente ? 'error' : undefined}>
                {d.urgente ? '⚠ ' : '💡 '}
                {d.texto}
              </Text>
              <Button key={`ok-${d.id}`} label="Entendi" onPress={() => dispensar($, d.id)} />
            </Box>
          ))}
        </Box>

        <Text dimColor>
          4 regras: uma tarefa por conversa · plano antes de mexer · "me mostre que funciona" · o
          que se repete vira skill
        </Text>
      </Box>
    )
  })
}
