export type Etapa = 'explorar' | 'planejar' | 'implementar' | 'verificar' | 'salvar'

export type Checklist = {
  temClaudeMd: boolean
  envProtegido: boolean
  temGit: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'guia-vivo': {
      etapa: Etapa
      checklist: Shaped<Checklist | null>
      edicoesSemVerificar: number
      turnos: number
      contexto: number
      envTocado: boolean
      dispensadas: Shaped<string[]>
    }
  }
}
