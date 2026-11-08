# Guia vivo

Um mod para o Claude Code que funciona como um guia de boas práticas sempre à vista. Ele abre um painel ao lado da conversa e acompanha o seu trabalho:

- **Tamanho da tarefa** (Pequena, Média ou Grande): você escolhe no painel ou com `/guia pequena`, `/guia media` ou `/guia grande`. O Guia vivo avisa o Claude e ajusta os próximos passos:
  - **Pequena**: intenção e critério de pronto em uma frase, mudança e prova.
  - **Média**: plano curto em `PLAN.md` com critérios de aceite e etapas.
  - **Grande**: especificação completa (`/especificar`), no estilo *Spec-Driven Development* com as fases do *AI-DLC*.
  Se a tarefa crescer além do tamanho escolhido, o guia sugere subir de nível.
- **Método dos 5 passos** (Explorar → Planejar → Implementar → Verificar → Salvar). O passo atual muda sozinho conforme o Claude lê, planeja, edita, testa ou faz commit, e também pode ser ajustado pelos botões.
- **Próximo passo**: o que pedir ao Claude agora, de acordo com o tamanho da tarefa.
- **Progresso da especificação**: quando existe `specs/<pasta>/tarefas.md`, o painel mostra quantas tarefas foram concluídas, qual é a próxima e se a especificação já foi aprovada. Com a especificação aprovada, sugere construir acompanhando ou com `/construir` (modo autônomo). Enquanto o `/construir` roda, o painel e a linha de status mostram "Construção autônoma".
- **Checklist do projeto**: CLAUDE.md, `.env` protegido no `.gitignore` e repositório git.
- **Dicas no momento certo**: a conversa ficou cheia (`/compact` ou `/clear`), muitas alterações sem teste ("me mostre que funciona"), a tarefa cresceu, o projeto não tem CLAUDE.md (`/init`). Cada dica some com o botão "Entendi".
- **Proteção do `.env`**: o Guia vivo recusa qualquer tentativa do Claude de ler, alterar ou usar em comandos um arquivo `.env` (onde ficam senhas e chaves) e avisa no painel. Arquivos de modelo sem senha, como `.env.example`, continuam liberados.

## Como usar

- `/guia` abre o painel e escreve o próximo passo recomendado na conversa.
- `/guia pequena`, `/guia media` ou `/guia grande` define o tamanho da tarefa atual.
- O botão **Nova tarefa** (ou `/clear`) recomeça o ciclo e pede o tamanho de novo.
- A linha de status mostra a etapa e o tamanho (por exemplo, `Guia: 3/5 Implementar · Média · /guia`).
- No aplicativo para computador, o painel abre sozinho quando a sessão começa. No terminal, use `/guia`.
- No Claude Code na web (claude.ai/code) o Guia vivo não funciona, porque as sessões na web não carregam plugins.
- O `/especificar` vem no projeto modelo. Em outros projetos, ao escolher **Grande**, o Claude segue o mesmo fluxo mesmo sem a skill.
