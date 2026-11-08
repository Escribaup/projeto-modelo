import { expect, test } from 'claude-code/testing'

const PAINEL = {
  plugin: 'guia-vivo',
  component: 'Pane',
  requestId: 'guia-vivo',
  props: {
    title: 'Guia vivo',
    isFocused: false,
    bodyColumns: 50,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 60 },
    view: {},
  },
} as const

type On = Parameters<Parameters<typeof test>[1]>[1]

/** Um "motor" de mentira: arquivos é um mapa caminho -> conteúdo. */
function motor(on: On, arquivos: Record<string, string>, notas: string[] = []) {
  on('command.register', () => ({ value: { command: 'guia' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('session.cwd', () => ({ value: '/proj' }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 100, percent: 10 }, rateLimits: [] } }))
  on('fs.exists', (_, e) => ({ value: Object.keys(arquivos).some(p => p === e.path || p.startsWith(`${e.path}/`)) }))
  on('fs.read', (_, e) => ({ value: arquivos[e.path] ?? '.env\n' }))
  on('fs.stat', () => ({ value: { kind: 'file', size: 1, mtimeMs: 1, isLink: false } }))
  on('fs.list', (_, e) => {
    const nomes = new Set<string>()
    for (const p of Object.keys(arquivos)) {
      if (p.startsWith(`${e.path}/`)) nomes.add(p.slice(e.path.length + 1).split('/')[0]!)
    }
    return { value: [...nomes].map(name => ({ name, kind: 'dir', size: 0, mtimeMs: 0, isLink: false })) }
  })
  on('session.append', (_, e, next) => {
    const bloco = e.message.content[0] as { text?: string } | undefined
    notas.push(bloco?.text ?? '')
    return next(e)
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))
  on('turn.complete', () => ({}))
}

const BASICO = { '/proj/.git': '', '/proj/CLAUDE.md': '#', '/proj/.gitignore': '.env\n' }

test('sem CLAUDE.md mostra a dica do /init e pede o tamanho, em toda superfície', async ($, on) => {
  motor(on, { '/proj/.git': '' })
  await $.session.start({ cwd: '/proj', surface: 'desktop', isInteractive: true })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PAINEL, surface })
    expect(await ui.find({ type: 'Text', text: /Rode \/init/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /▶ 1\. Explorar/ })).toBeDefined()
    expect(await ui.find({ key: 'tam-pequena' })).toBeDefined()
    await ui.unmount()
  }
})

test('o botão de tamanho avisa o Claude e muda o próximo passo', async ($, on) => {
  const notas: string[] = []
  motor(on, BASICO, notas)
  await $.session.start({ cwd: '/proj', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PAINEL, surface: 'desktop' })
  await ui.press({ key: 'tam-pequena' })
  expect(notas[0]).toContain('PEQUENA')
  expect(await ui.find({ type: 'Text', text: /critério de pronto/ })).toBeDefined()
  expect(await ui.find({ key: 'trocar-media' })).toBeDefined()
  await ui.unmount()
})

test('/guia grande devolve a instrução para o Claude', async ($, on) => {
  motor(on, BASICO)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const r = (await $.command.run({ command: 'guia', args: 'Grande' })) as {
    text?: string
    context?: readonly string[]
  }
  expect(r.text).toContain('Tarefa grande')
  expect(r.context?.[0]).toContain('GRANDE')
})

test('tarefa pequena que cresce sugere mudar para média', async ($, on) => {
  motor(on, BASICO)
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  await $.command.run({ command: 'guia', args: 'pequena' })
  for (let i = 0; i < 4; i++) {
    await $.tool.call({ tool: 'Edit', file_path: `/proj/a${i}.ts`, old_string: 'a', new_string: 'b' })
  }
  const ui = await $.ui.mount({ ...PAINEL, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /mudar para Média/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /▶ 3\. Implementar/ })).toBeDefined()
  await ui.unmount()
})

test('o painel mostra o progresso da especificação', async ($, on) => {
  motor(on, {
    ...BASICO,
    '/proj/specs/_modelo/tarefas.md': '- [ ] modelo',
    '/proj/specs/001-relatorio/tarefas.md':
      '# Tarefas\n- [x] Criar tabela\n- [ ] Gerar PDF\n- [ ] Enviar por e-mail\n',
  })
  await $.session.start({ cwd: '/proj', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PAINEL, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /1\/3 tarefas concluídas/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /Próxima: Gerar PDF/ })).toBeDefined()
  await ui.unmount()
})

test('especificação aprovada sugere /construir, e a construção autônoma aparece no painel', async ($, on) => {
  const pasta = '/proj/specs/002-cadastro'
  const arquivos: Record<string, string> = {
    ...BASICO,
    [`${pasta}/tarefas.md`]: '- [x] T1\n- [ ] T2 Validar CPF\n',
    [`${pasta}/especificacao.md`]: '# Especificação\n> Situação: aprovada\n',
  }
  motor(on, arquivos)
  await $.session.start({ cwd: '/proj', surface: 'desktop', isInteractive: true })
  let ui = await $.ui.mount({ ...PAINEL, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /rodar \/construir/ })).toBeDefined()
  await ui.unmount()

  arquivos[`${pasta}/registro-construcao.md`] = '# Registro\nSituação: em andamento\n'
  // O orquestrador escreve o registro: o guia relê a especificação.
  await $.tool.call({ tool: 'Write', file_path: `${pasta}/registro-construcao.md`, content: '' })
  ui = await $.ui.mount({ ...PAINEL, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /Construção autônoma em andamento/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /rodar \/construir/ })).toBeUndefined()
  await ui.unmount()
})

test('acesso ao .env é bloqueado, gera alerta, e "Entendi" dispensa a dica', async ($, on) => {
  motor(on, BASICO)
  await $.session.start({ cwd: '/proj', surface: 'desktop', isInteractive: true })
  const leitura = (await $.tool.call({ tool: 'Read', file_path: '/proj/.env' })) as { deny?: string }
  expect(leitura.deny).toContain('Bloqueado pelo Guia vivo')

  const ui = await $.ui.mount({ ...PAINEL, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /\.env \(senhas e chaves\)/ })).toBeDefined()
  await ui.press({ key: 'ok-env-tocado' })
  expect(await ui.find({ type: 'Text', text: /\.env \(senhas e chaves\)/ })).toBeUndefined()
  await ui.unmount()
})

test('a guarda pega .env em comandos e caminhos, mas libera os modelos', async ($, on) => {
  motor(on, BASICO)
  await $.session.start({ cwd: '/proj', surface: 'desktop', isInteractive: true })

  const bloqueados = [
    { tool: 'Bash', command: 'cat .env' },
    { tool: 'Bash', command: 'source ./.env.local && npm start' },
    { tool: 'Bash', command: 'grep SENHA config/.env.producao' },
    { tool: 'Edit', file_path: 'C:\\proj\\.env', old_string: 'a', new_string: 'b' },
    { tool: 'Write', file_path: '/proj/.env.local', content: 'X=1' },
    { tool: 'Grep', pattern: 'KEY', path: '/proj/.env' },
  ] as const
  for (const chamada of bloqueados) {
    const r = (await $.tool.call(chamada as never)) as { deny?: string }
    expect(r.deny).toContain('Bloqueado pelo Guia vivo')
  }

  const liberados = [
    { tool: 'Read', file_path: '/proj/.env.example' },
    { tool: 'Bash', command: 'cp .env.exemplo .env.exemplo.bak' },
    { tool: 'Bash', command: 'npm run build' },
    { tool: 'Read', file_path: '/proj/src/environment.ts' },
    { tool: 'Bash', command: 'python -m venv .venv' },
  ] as const
  for (const chamada of liberados) {
    const r = (await $.tool.call(chamada as never)) as { deny?: string }
    expect(r.deny).toBeUndefined()
  }
})
