# Projeto modelo

Um ponto de partida para qualquer projeto no Claude Code, já com as boas práticas configuradas. Em vez de lembrar de tudo, você começa o projeto a partir deste modelo e o **Guia vivo** acompanha você pelo caminho.

## O que já vem pronto

| Arquivo | Para que serve |
|---|---|
| `CLAUDE.md` | O "manual de boas-vindas" que o Claude lê toda vez que você abre o projeto. Já traz o método de trabalho e as regras da IDVL. Falta só preencher a seção **Sobre este projeto**. |
| `.gitignore` | Impede que o arquivo `.env`, onde ficam senhas e chaves, seja enviado ao GitHub. |
| `.claude/settings.json` | Ativa o Guia vivo e define o que o Claude pode fazer sem perguntar. Também impede o Claude de ler o `.env` (uma segunda proteção, além do bloqueio do Guia vivo). |
| `PLAN.md` e `PROGRESS.md` | Modelos para tarefas grandes: o plano em etapas e o registro do que já foi feito. |
| `plugins/guia-vivo/` | O próprio Guia vivo. Não precisa mexer. |

---

## 1. Criar um projeto novo a partir deste modelo

Você faz isso uma vez para cada projeto novo.

1. Abra a página **github.com/Escribaup/projeto-modelo** no navegador.
2. Clique no botão verde **Use this template** e depois em **Create a new repository**.
3. Dê um nome ao projeto (por exemplo, `relatorio-clientes`), escolha **Private** e clique em **Create repository**.
4. Abra o projeto novo no Claude Code, pelo ambiente que você usa (veja a seção 2).
5. Na primeira conversa, peça: *"Leia o CLAUDE.md e me ajude a preencher a seção Sobre este projeto"*.

> Não está vendo o botão **Use this template**? Peça para o responsável pelo repositório ativá-lo (veja a seção 4).

---

## 2. Usar o Guia vivo em cada ambiente

O Guia vivo é um painel ao lado da conversa. Ele mostra em que passo você está, o próximo passo recomendado e dicas no momento certo. Ele também **bloqueia** qualquer tentativa do Claude de ler ou alterar o arquivo `.env`, onde ficam senhas e chaves, e avisa você no painel. Para abrir, digite **`/guia`** na caixa de mensagem.

Escolha abaixo o ambiente que você usa.

### No aplicativo Claude para computador (aba Code)

**Em um projeto criado a partir deste modelo:**
1. Na aba **Code**, abra a pasta do projeto.
2. Se aparecer uma pergunta sobre **confiar nesta pasta**, responda que sim. É essa confirmação que libera o Guia vivo.
3. Digite `/guia`. O painel abre e a linha de status mostra a etapa atual.

**Para ter o Guia vivo em todos os projetos (inclusive os que não vieram do modelo):**
1. Clique no **+** ao lado da caixa de mensagem e depois em **Plugins**.
2. Clique em **Add marketplace** e digite `Escribaup/projeto-modelo`.
3. Escolha **Guia vivo**, clique em **Add plugin** e escolha a opção de **usuário** (vale para todos os seus projetos).

> Não encontrou a opção **Add marketplace**? Faça uma vez a instalação pelo terminal (abaixo). Depois disso, o Guia vivo aparece no aplicativo também.

### No terminal (Claude Code na linha de comando)

**Em um projeto criado a partir deste modelo:** abra o Claude Code na pasta do projeto e responda que sim quando ele perguntar se você confia na pasta. Depois, digite `/guia`.

**Para ter o Guia vivo em todos os projetos**, digite na caixa de mensagem do Claude Code:

```
/plugin install guia-vivo --marketplace Escribaup/projeto-modelo
```

Quando ele perguntar se quer adicionar o marketplace, digite `y` e aperte Enter. Depois, escolha a opção de **usuário**.

Se preferir, rode direto no terminal, fora do Claude Code:

```
claude plugin install guia-vivo --marketplace Escribaup/projeto-modelo
```

### No navegador (Claude Code na web, claude.ai/code)

Aqui o painel do Guia vivo **não aparece**: as sessões na web ainda não carregam plugins. O restante do modelo funciona normalmente. O `CLAUDE.md` com o método de trabalho, os modelos `PLAN.md` e `PROGRESS.md` e o `.gitignore` continuam valendo.

Na web, você pode pedir ao Claude no começo da conversa: *"Siga o método dos 5 passos do CLAUDE.md e me avise em que passo estamos"*.

### Repositório privado: um passo a mais no computador

Se o repositório `projeto-modelo` for privado, o seu computador precisa estar conectado ao GitHub para baixar o Guia vivo. Se a instalação der erro de acesso, peça ajuda ao suporte de TI para "autenticar o git com o GitHub" (`gh auth login` e depois `gh auth setup-git`). Isso só precisa ser feito uma vez.

---

## 3. Primeiros passos no dia a dia

- **Uma tarefa, uma conversa.** Terminou um assunto? Digite `/clear` antes de começar o próximo.
- **Plano antes de mexer.** Em tarefas grandes, aperte `Shift+Tab` para o modo plano, ou peça "monte o plano antes".
- **Me mostre que funciona.** Peça sempre a prova de que o resultado está certo.
- **O que se repete vira skill.** Explicou o mesmo processo duas vezes? Peça para transformá-lo em uma skill.

O Guia vivo lembra você de tudo isso na hora certa.

---

## 4. Para o responsável pelo repositório

- **Ativar o modelo:** no GitHub, abra **Settings → General** deste repositório e marque **Template repository**. Isso faz o botão **Use this template** aparecer.
- **Atualizar o Guia vivo:** as mudanças ficam em `plugins/guia-vivo/`. Quem já instalou recebe a nova versão com `claude plugin update guia-vivo` (no terminal) ou `/plugin` → atualizar.
- **Ajustar as regras:** as regras da IDVL ficam no `CLAUDE.md`. As permissões ficam em `.claude/settings.json`.
