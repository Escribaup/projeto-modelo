# Projeto modelo

Ponto de partida para projetos no Claude Code com as boas práticas já configuradas.

## Guia vivo

O mod **Guia vivo** (`plugins/guia-vivo`) abre um painel ao lado da conversa com o método dos 5 passos (Explorar → Planejar → Implementar → Verificar → Salvar), o checklist do projeto e dicas no momento certo. Detalhes em [`plugins/guia-vivo/README.md`](plugins/guia-vivo/README.md).

### Instalação

No prompt do Claude Code (terminal):

```
/plugin install guia-vivo --marketplace Escribaup/projeto-modelo
```

Responda `y` para adicionar o marketplace e escolha o escopo (de usuário, para valer em todos os projetos).

Pelo shell:

```
claude plugin install guia-vivo --marketplace Escribaup/projeto-modelo
```

No app desktop, onde `/plugin` não roda: clique em **+** ao lado da caixa de mensagem, depois **Plugins**, **Add marketplace** com `Escribaup/projeto-modelo` e **Add plugin**.

Se o repositório for privado, só instala quem tem acesso a ele no GitHub e já tem o git autenticado no computador (`gh auth login` e depois `gh auth setup-git`).

Depois de instalado, digite `/guia` para abrir o painel.
