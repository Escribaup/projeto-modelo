# Projeto modelo

Um ponto de partida para qualquer projeto no Claude Code, já com as boas práticas configuradas. Em vez de lembrar de tudo, você começa o projeto a partir deste modelo e o **Guia vivo** acompanha você pelo caminho.

**Sumário:** [Antes de começar](#antes-de-começar) · [1. Criar um projeto](#1-criar-um-projeto-novo-a-partir-deste-modelo) · [2. Como trabalhar](#2-como-trabalhar-o-método-e-o-tamanho-da-tarefa) · [3. Tarefas grandes](#3-tarefas-grandes-especificar-e-construir) · [4. Guia vivo](#4-o-guia-vivo-em-cada-ambiente) · [5. Comandos](#5-comandos-do-dia-a-dia) · [6. Segurança](#6-segurança-e-dados-de-clientes) · [7. Avançado](#7-recursos-avançados) · [8. Responsável](#8-para-o-responsável-pelo-repositório)

## O que já vem pronto

| Arquivo | Para que serve |
|---|---|
| `CLAUDE.md` | O "manual de boas-vindas" que o Claude lê toda vez que você abre o projeto: o método de trabalho e as regras da IDVL. Falta só preencher a seção **Sobre este projeto**. |
| `.gitignore` | A lista do que **nunca** vai para o GitHub: senhas (`.env`), certificados digitais, planilhas, PDFs, extratos e a pasta `dados-locais/`. |
| `.claude/settings.json` | Ativa o Guia vivo (que vem da [loja de plugins da IDVL](https://github.com/Escribaup/claude-plugins-idvl)) e define o que o Claude pode fazer sem perguntar, o que precisa confirmar e o que é proibido. |
| `PLAN.md` e `PROGRESS.md` | Modelos para tarefas médias: o plano com critérios de aceite e o registro do que já foi feito. |
| `specs/` | Onde ficam as especificações das tarefas grandes. |
| `.claude/skills/` | Os comandos prontos do projeto: `/especificar`, `/construir`, `/concluir-construcao` e `/construir-paralelo`. (Uma *skill* é um procedimento salvo que vira um comando.) |
| `.claude/agents/` | A equipe de agentes usada pelos comandos: construtor, revisor, explorador e revisor de especificação. |

---

## Antes de começar

Você precisa de (uma vez só):

1. **Claude Code** instalado: o aplicativo Claude para computador (aba **Code**) ou o Claude Code no terminal. Instruções oficiais em [code.claude.com](https://code.claude.com).
2. **Git** instalado no computador. No Windows, instale o [Git for Windows](https://git-scm.com/download/win). No Mac, ele costuma já vir instalado.
3. **Conta no GitHub** com acesso à organização **Escribaup** (peça ao responsável).
4. Opcional, mas facilita: o **[GitHub Desktop](https://desktop.github.com)**, para baixar projetos sem usar comandos.

> **O que é o "terminal"?** É a janela onde se digitam comandos. No Windows, procure por **Terminal** ou **PowerShell** no menu Iniciar; no Mac, abra **Terminal** (em Aplicativos › Utilitários). Para saber se o Claude Code está instalado, digite `claude --version` e aperte Enter. Se aparecer um erro, peça ajuda ao suporte de TI.

---

## 1. Criar um projeto novo a partir deste modelo

Você faz isso uma vez para cada projeto novo.

1. Abra **github.com/Escribaup/projeto-modelo** no navegador.
2. Clique no botão verde **Use this template** e depois em **Create a new repository**.
3. Preencha:
   - **Owner:** escolha **Escribaup** (não a sua conta pessoal), para o projeto ficar com a empresa.
   - **Repository name:** um nome curto, por exemplo `relatorio-clientes`.
   - Marque **Private** e clique em **Create repository**.
4. **Leve o projeto para o lugar onde você vai trabalhar:**
   - **No computador (aplicativo ou terminal):** no GitHub Desktop, use **File › Clone repository**, escolha o projeto novo e uma pasta (por exemplo, Documentos). Sem o GitHub Desktop, abra o Claude Code em qualquer pasta e peça: *"Clone o repositório github.com/Escribaup/relatorio-clientes na pasta Documentos"*.
   - **No navegador (claude.ai/code):** ao iniciar a sessão, escolha o repositório na lista.
5. Abra a pasta do projeto no Claude Code (veja a seção 4). Na primeira conversa, peça: *"Leia o CLAUDE.md e me ajude a preencher a seção Sobre este projeto"*.

> Não está vendo o botão **Use this template**? Peça para o responsável ativá-lo (seção 8).

---

## 2. Como trabalhar: o método e o tamanho da tarefa

**O método dos 5 passos**, que o Claude segue e o Guia vivo mostra no painel:
**Explorar** (entender antes de mudar) → **Planejar** (combinar o caminho) → **Implementar** (fazer) → **Verificar** (provar que funciona) → **Salvar** (registrar).

**O tamanho da tarefa.** Nem toda tarefa precisa do mesmo cuidado. No começo de cada uma, escolha o tamanho no painel do Guia vivo ou pelo comando:

| Tamanho | Quando usar | O que acontece | Comando |
|---|---|---|---|
| **Pequena** | Um ajuste ou correção que dá para explicar em uma frase | Você diz o que quer e como saber que ficou certo. O Claude faz e mostra a prova. | `/guia pequena` |
| **Média** | Mexe em vários arquivos, mas cabe em uma conversa | O Claude monta um plano curto (`PLAN.md`) com etapas e critérios de aceite. Você aprova antes. | `/guia media` |
| **Grande** | Uma funcionalidade ou sistema novo, que vai levar várias conversas | O Claude conduz uma **especificação** com você e só constrói depois da sua aprovação (seção 3). | `/guia grande` |

**Na dúvida, escolha Média.** Se a tarefa crescer, o Guia vivo avisa e sugere subir de nível.
**No navegador** (onde o Guia vivo não funciona), diga no começo da conversa: *"Esta tarefa é média"*.

**Verificar sem testes automáticos.** Em planilhas, relatórios e automações, "verificar" é conferir o resultado contra uma referência: totais batendo com uma planilha conhecida, a automação rodada em modo de teste com dados fictícios, um checklist conferido item a item. O Claude mostra a evidência.

<details>
<summary>De onde vem isso (leitura opcional)</summary>

A especificação segue duas metodologias de mercado: o *[Spec-Driven Development](https://github.com/github/spec-kit)* (escrever o quê e por quê antes de construir) e o *[AI-DLC da AWS](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)* (concepção validada pelas pessoas, depois construção em ciclos curtos). Mesmo nas tarefas pequenas e médias aproveitamos o principal delas: dizer antes como saber que ficou pronto e separar o que foi **confirmado** do que é só **suposição**.
</details>

---

## 3. Tarefas grandes: especificar e construir

### Especificar (`/especificar`)
O Claude faz perguntas, escreve a especificação com você (o quê, para quem, regras de negócio e critérios de aceite) e depois o plano e a lista de tarefas, em `specs/001-nome/`.

Antes da aprovação, ele oferece uma **revisão de olhos frescos**: revisores que não conhecem a conversa leem a especificação como um colega recém-chegado e apontam o que está confuso, incompleto ou difícil de construir. Se o plugin opcional **Elephant-Goldfish** estiver instalado (seção 7), quatro revisores dele fazem essa leitura; se não, um revisor do próprio projeto faz.

### Construir
Depois da aprovação, há dois jeitos:
- **Acompanhando:** o Claude faz uma tarefa por vez na conversa e você vê cada passo. Melhor quando conferir depende do seu olho.
- **Autônomo (`/construir`):** uma equipe de agentes faz as tarefas em sequência, sem pedir confirmação a cada passo, e para sozinha no fim.

| Quem | Modelo do Claude | O que faz |
|---|---|---|
| Orquestrador (a conversa principal) | O da sua sessão (recomendado: Opus) | Pega a próxima tarefa, delega, decide e resolve quando algo trava |
| Construtor | Sonnet | Faz a tarefa |
| Revisor | Sonnet | Confere a tarefa contra os critérios de aceite, sem ter escrito o código |
| Explorador | Haiku | Faz buscas rápidas no projeto |

*Opus, Sonnet e Haiku são modelos do Claude, do mais capaz (e que mais consome) ao mais rápido e econômico. Para trocar o modelo da conversa, digite `/model`.*

**Proteções do modo autônomo:**
- Só começa com a especificação **aprovada**.
- Trabalha numa **branch** chamada `construcao/...`: uma versão paralela do projeto. Os arquivos da pasta mudam, mas a versão principal guardada continua igual até você juntar as duas.
- **No máximo 10 tarefas por rodada.** Para continuar, rode `/construir` de novo. Se a rodada parar no meio (erro, Esc, conversa encerrada), `/construir` **retoma** de onde parou.
- **Para e chama você** quando termina, quando uma tarefa falha mesmo após correções, quando surge dúvida na especificação ou quando precisa de senha, acesso ou instalação nova.
- Salva só os arquivos de cada tarefa (nunca "tudo o que estiver na pasta"), anota tudo em `specs/<pasta>/registro-construcao.md`, nunca envia nada ao GitHub e nunca mexe em senhas.

**Antes de rodar:**
- **Salve o trabalho pendente.** Peça: *"Faça um commit das alterações atuais"*.
- **Permissões.** Para não parar a cada passo, deixe o Claude Code no modo que **aceita edições automaticamente** (no terminal, aperte `Shift+Tab` até aparecer "accept edits"; no aplicativo, use o seletor de modo ao lado da caixa de mensagem). Quando ele pedir para rodar os testes, aprove. As proteções de senhas e as confirmações de envio continuam valendo.
- **Consumo.** O modo autônomo gasta bastante do **limite de uso da sua assinatura do Claude**, porque cada tarefa usa pelo menos dois agentes.

### Concluir (`/concluir-construcao`)
Quando as tarefas terminam, este comando mostra em linguagem simples o que mudou, sugere uma revisão final (`/code-review`, o comando de revisão do Claude Code), junta o resultado à versão principal e envia ao GitHub, **pedindo sua confirmação em cada passo**.

---

## 4. O Guia vivo em cada ambiente

O Guia vivo é um painel ao lado da conversa: mostra em que passo você está, o próximo passo recomendado, o progresso da especificação e dicas no momento certo. Ele também **bloqueia** tentativas do Claude de ler ou alterar arquivos de senhas, chaves e certificados (como o `.env` e o `.pfx`) e avisa no painel. É uma camada de proteção que reduz bastante o risco, não uma garantia absoluta.

### No aplicativo Claude para computador (aba Code)
**Em um projeto criado a partir deste modelo:**
1. Na aba **Code**, abra a pasta do projeto.
2. Se aparecer uma pergunta sobre **confiar nesta pasta**, responda que sim. É essa confirmação que libera o Guia vivo.
3. O painel abre sozinho. Se não abrir, digite `/guia`.

**Para ter o Guia vivo em todos os projetos (inclusive os que não vieram do modelo):**
1. Clique no **+** ao lado da caixa de mensagem e depois em **Plugins**.
2. Clique em **Add marketplace** e digite `Escribaup/claude-plugins-idvl`.
3. Escolha **Guia vivo**, clique em **Add plugin** e escolha **usuário** (vale para todos os seus projetos; as outras opções valem só para um projeto).

> Não encontrou a opção **Add marketplace**? Faça uma vez a instalação pelo terminal (abaixo). Depois disso, o Guia vivo aparece no aplicativo também.

### No terminal
**Em um projeto criado a partir deste modelo:** abra o Claude Code na pasta do projeto (`claude`) e responda que sim quando ele perguntar se você confia na pasta. Depois, digite `/guia`.

**Para ter o Guia vivo em todos os projetos**, digite na caixa de mensagem do Claude Code:

```
/plugin install guia-vivo --marketplace Escribaup/claude-plugins-idvl
```

Quando ele perguntar se quer adicionar o marketplace, digite `y` e aperte Enter. Depois, escolha **usuário**.

Ou, direto no terminal, fora do Claude Code:

```
claude plugin install guia-vivo --marketplace Escribaup/claude-plugins-idvl
```

### No navegador (claude.ai/code)
Aqui o Guia vivo **não funciona**: as sessões na web não carregam plugins, então nem o painel nem os comandos `/guia` existem. O resto do modelo funciona: o `CLAUDE.md`, os comandos `/especificar`, `/construir` e `/concluir-construcao`, e as proteções do `.gitignore` e do `settings.json`. Diga o tamanho da tarefa no começo da conversa (*"Esta tarefa é média"*).

### Atualizar o Guia vivo
Quando sair uma versão nova, rode no terminal, fora do Claude Code:

```
claude plugin marketplace update plugins-idvl
claude plugin update guia-vivo@plugins-idvl
```

Depois, **feche e abra o Claude Code de novo** para a versão nova valer. Para ver a versão instalada: `claude plugin list`. Se você só usa o aplicativo e não quer usar o terminal, peça ao suporte de TI.

### Já tinha instalado pelo endereço antigo?
Até a versão 0.5.0 o Guia vivo era instalado a partir do `projeto-modelo`. Agora ele mora na **[loja de plugins da IDVL](https://github.com/Escribaup/claude-plugins-idvl)**. Se você instalou antes, faça a troca uma vez, no terminal:

```
claude plugin uninstall guia-vivo@projeto-modelo
claude plugin marketplace remove projeto-modelo
claude plugin install guia-vivo --marketplace Escribaup/claude-plugins-idvl
```

Depois, feche e abra o Claude Code de novo.

> Os repositórios `projeto-modelo` e `claude-plugins-idvl` são **públicos**, então não precisa de login no GitHub para instalar ou atualizar o Guia vivo. Já os projetos criados a partir do modelo devem ser **privados** (seção 1).

---

## 5. Comandos do dia a dia

| Comando | O que faz |
|---|---|
| `/guia` | Abre o painel e mostra o próximo passo recomendado |
| `/guia pequena` · `/guia media` · `/guia grande` | Define o tamanho da tarefa atual |
| `/especificar` | Inicia a especificação de uma tarefa grande |
| `/construir` | Constrói no modo autônomo as tarefas de uma especificação aprovada (até 10 por rodada; também retoma uma rodada interrompida) |
| `/concluir-construcao` | Revisa, junta à versão principal e envia ao GitHub o resultado do `/construir`, com sua confirmação |
| `/clear` | Limpa a conversa para começar outra tarefa. O Guia vivo recomeça do passo 1. |
| `/compact` | Resume a conversa quando ela fica longa, sem perder o fio |
| `/model` | Troca o modelo do Claude (Opus, Sonnet, Haiku) |

**Quatro hábitos:**
- **Uma tarefa, uma conversa.** Terminou um assunto? `/clear` antes do próximo.
- **Plano antes de mexer, do tamanho certo.** Escolha o tamanho e deixe o Claude combinar o caminho antes de alterar arquivos.
- **Me mostre que funciona.** Peça sempre a prova de que o resultado está certo.
- **O que se repete vira skill.** Explicou o mesmo processo duas vezes? Peça: *"Transforme este processo em uma skill chamada /fechamento-mensal"*.

---

## 6. Segurança e dados de clientes

- **Dados reais ficam em `dados-locais/`.** Crie essa pasta dentro do projeto e guarde ali planilhas, extratos, notas e relatórios reais. Ela nunca vai para o GitHub. Planilhas, CSV, PDF e OFX fora dela também ficam de fora, **exceto** em `tests/` e `exemplos/`, onde só entram dados **fictícios**.
- **Senhas e chaves ficam no `.env`.** Se o projeto precisar de uma senha ou chave, o Claude vai pedir que **você** crie o arquivo `.env` e coloque o valor. Ele nunca lê esse arquivo.
- **Certificados digitais** (`.pfx`, `.p12`) e arquivos de credenciais nunca são lidos nem enviados ao GitHub.
- **Ações externas pedem confirmação:** enviar e-mail ou mensagem, gravar em sistemas (Nibo, Domínio, Drive), ativar automações ou baixar coisas da internet. Leia o que o Claude descreve antes de confirmar.
- Nunca troque o modo de permissões para "liberar tudo" (*bypass*): ele desliga as confirmações acima.

---

## 7. Recursos avançados

### Revisão com o Elephant-Goldfish (opcional)
O [Elephant-Goldfish (EGM)](https://github.com/google/elephant-goldfish-model) é um plugin de código aberto do Google para revisar especificações "de olhos frescos". Com ele instalado, a revisão do `/especificar` usa quatro revisores especializados (escopo, clareza, decisões e prontidão para construir). Para instalar, no terminal:

```
claude plugin marketplace add google/elephant-goldfish-model
claude plugin install egm@egm
```

Consome mais da assinatura do que a revisão padrão e responde em português quando o projeto pede.

### Construção em paralelo (`/construir-paralelo`)
Faz até 3 tarefas **independentes** ao mesmo tempo, cada uma numa cópia separada do projeto, e junta os resultados. É mais rápido, mas consome a assinatura mais depressa e só ajuda quando a especificação tem tarefas que não dependem umas das outras. Para usar, diga no `/especificar` que vai construir em paralelo (ele marca as tarefas independentes com `[paralela]`) e rode `/construir-paralelo`. No fim, use `/concluir-construcao` normalmente.

---

## 8. Para o responsável pelo repositório

- **Ativar o modelo:** no GitHub, abra **Settings › General** deste repositório e marque **Template repository**. Isso faz o botão **Use this template** aparecer.
- **Proteger a branch `main`:** em **Settings › Branches**, exija revisão antes de juntar mudanças, aqui e na loja de plugins.
- **O Guia vivo mora em outro repositório:** [`Escribaup/claude-plugins-idvl`](https://github.com/Escribaup/claude-plugins-idvl). Mudanças e versões novas são feitas lá (veja o README daquele repositório). Este modelo só o ativa, pelo `.claude/settings.json`.
- **Ajustar as regras:** as regras da IDVL ficam no `CLAUDE.md`. As permissões ficam em `.claude/settings.json`.
