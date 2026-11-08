# Guia vivo

Um mod para o Claude Code que funciona como um guia de boas práticas sempre à vista. Ele abre um painel ao lado da conversa e acompanha o seu trabalho:

- **Método dos 5 passos** (Explorar → Planejar → Implementar → Verificar → Salvar). O passo atual muda sozinho conforme o Claude lê, planeja, edita, testa ou faz commit, e também pode ser ajustado pelos botões.
- **Próximo passo**: o que pedir ao Claude agora.
- **Checklist do projeto**: CLAUDE.md, `.env` protegido no `.gitignore` e repositório git.
- **Dicas no momento certo**: a conversa ficou cheia (`/compact` ou `/clear`), muitas alterações sem teste ("me mostre que funciona"), um `.env` foi acessado, o projeto não tem CLAUDE.md (`/init`). Cada dica some com o botão "Entendi".
- **Proteção do `.env`**: o Guia vivo recusa qualquer tentativa do Claude de ler, alterar ou usar em comandos um arquivo `.env` (onde ficam senhas e chaves) e avisa no painel. Arquivos de modelo sem senha, como `.env.example`, continuam liberados.

## Como usar

- `/guia` abre o painel e escreve o próximo passo recomendado na conversa.
- A linha de status mostra a etapa atual (por exemplo, `Guia: 3/5 Implementar · /guia`).
- No aplicativo para computador, o painel abre sozinho quando a sessão começa. No terminal, use `/guia`.
- No Claude Code na web (claude.ai/code) o Guia vivo não funciona, porque as sessões na web não carregam plugins.
