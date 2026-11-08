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
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

function motor(on: Parameters<Parameters<typeof test>[1]>[1], arquivos: string[]) {
  on('command.register', () => ({ value: { command: 'guia' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('session.cwd', () => ({ value: '/proj' }))
  on('fs.exists', (_, e) => ({ value: arquivos.includes(e.path) }))
  on('fs.read', () => ({ value: '.env\nnode_modules\n' }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))
}

test('projeto sem CLAUDE.md mostra a dica do /init, em toda superfície', async ($, on) => {
  motor(on, ['/proj/.git'])
  await $.session.start({ cwd: '/proj', surface: 'desktop', isInteractive: true })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PAINEL, surface })
    expect(await ui.find({ type: 'Text', text: /Rode \/init/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /▶ 1\. Explorar/ })).toBeDefined()
    await ui.unmount()
  }
})

test('editar arquivos leva à etapa Implementar e, depois de 5, pede verificação', async ($, on) => {
  motor(on, ['/proj/.git', '/proj/CLAUDE.md'])
  await $.session.start({ cwd: '/proj', surface: 'desktop', isInteractive: true })

  for (let i = 0; i < 5; i++) {
    await $.tool.call({ tool: 'Edit', file_path: `/proj/a${i}.ts`, old_string: 'a', new_string: 'b' })
  }

  const ui = await $.ui.mount({ ...PAINEL, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /▶ 3\. Implementar/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /Me mostre que funciona/ })).toBeDefined()
  await ui.unmount()

  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  const ui2 = await $.ui.mount({ ...PAINEL, surface: 'desktop' })
  expect(await ui2.find({ type: 'Text', text: /▶ 4\. Verificar/ })).toBeDefined()
  await ui2.unmount()
})

test('acesso ao .env é bloqueado, gera alerta, e "Entendi" dispensa a dica', async ($, on) => {
  motor(on, ['/proj/.git', '/proj/CLAUDE.md'])
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
  motor(on, ['/proj/.git', '/proj/CLAUDE.md'])
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
