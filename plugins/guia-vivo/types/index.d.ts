export type Etapa = 'explorar' | 'planejar' | 'implementar' | 'verificar' | 'salvar'

export type Tamanho = 'pequena' | 'media' | 'grande'

export type Checklist = {
  temClaudeMd: boolean
  envProtegido: boolean
  temGit: boolean
}

/** A especificação mais recente em specs/, lida do seu tarefas.md. */
export type Especificacao = {
  pasta: string
  feitas: number
  total: number
  proxima: string | null
}

declare module 'claude-code' {
  interface PluginState {
    'guia-vivo': {
      etapa: Etapa
      tamanho: Shaped<Tamanho | null>
      checklist: Shaped<Checklist | null>
      especificacao: Shaped<Especificacao | null>
      arquivosEditados: Shaped<string[]>
      edicoesSemVerificar: number
      turnos: number
      contexto: number
      envTocado: boolean
      dispensadas: Shaped<string[]>
    }
  }
}
