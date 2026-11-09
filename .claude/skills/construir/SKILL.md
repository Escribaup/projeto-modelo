---
name: construir
description: Construção autônoma de uma especificação aprovada - executa as tarefas de specs/<pasta>/tarefas.md em loop, delegando cada uma ao subagente construtor (Sonnet) e conferindo com o revisor (Sonnet), até terminar, travar ou atingir o limite da rodada. Também retoma uma construção interrompida. Use quando a pessoa pedir /construir ou quiser que as tarefas de uma especificação sejam feitas sem acompanhamento passo a passo.
argument-hint: "[pasta da especificação] [limite de tarefas, padrão 10]"
---

# Construir (modo autônomo)

Você é o **orquestrador**. Executa as tarefas de uma especificação aprovada em sequência, sem pedir confirmação a cada passo, delegando o trabalho e a conferência a subagentes. Seu trabalho é coordenar, decidir e saber **parar**.

## 1. Pré-condições: confira antes de começar
Se qualquer uma falhar, **não comece**: explique o que falta e como resolver, em linguagem simples.

1. **Especificação escolhida.** Use a pasta indicada nos argumentos ou, sem argumento, a especificação em `specs/` com tarefas pendentes mais recente. Se houver dúvida entre mais de uma, pergunte.
2. **Especificação aprovada.** `especificacao.md` diz "Situação: aprovada" e a seção Prontidão diz "pronta". Se não, oriente a pessoa a concluir o `/especificar`.
3. **Há tarefas pendentes** (`- [ ]`) em `tarefas.md`.
4. **Tarefas verificáveis.** Cada tarefa tem um "Verificar:" objetivo (um teste, um comando, uma conferência contra uma referência). Se a verificação depende do olho humano (por exemplo, "ver se o relatório ficou bonito"), avise que o modo autônomo não serve para essa tarefa e sugira o modo acompanhando.
5. **Construção interrompida?** Se `registro-construcao.md` diz `Situação: em andamento`, uma rodada anterior parou no meio. Vá para a seção 2 (Retomar) antes de seguir.
6. **Git limpo.** `git status` sem alterações pendentes, **exceto** `tarefas.md` e `registro-construcao.md` da própria especificação (sobras normais de uma rodada anterior: inclua-as no primeiro commit). Outras alterações: peça para a pessoa salvar ("faça um commit das alterações atuais") ou descartar antes.
7. **Branch separada.** Se estiver na branch principal (`main` ou `master`), crie e mude para `construcao/<pasta>` (se já existir, use-a). Nunca construa direto na principal.

Confirme com a pessoa **uma única vez**, em uma mensagem curta: a especificação, a branch, quantas tarefas pendentes e o limite desta rodada (argumento ou **10**). Avise que a rodada consome bastante do limite de uso da assinatura e que, para rodar sem interrupções, o Claude Code precisa poder editar arquivos e rodar os testes sem perguntar (modo "aceitar edições"; os comandos de teste podem ser aprovados uma vez). Depois disso, siga sem pedir confirmações.

## 2. Retomar uma construção interrompida
Quando o registro está `em andamento` sem que esta conversa tenha iniciado a rodada:
1. Veja o que ficou pela metade: `git status` e `git diff` (alterações sem commit) e a última linha do registro.
2. Explique à pessoa, em uma frase, em que tarefa parou e o que há de alteração pendente.
3. Proponha **uma** opção (com a sua recomendação):
   - **Descartar** a tarefa pela metade (`git restore` e `git clean` só nos arquivos daquela tarefa) e recomeçá-la; ou
   - **Aproveitar**: pedir ao revisor para conferir o que já existe e seguir a partir daí.
4. Com a resposta, siga o loop normalmente. Esta é a única confirmação extra permitida.

## 3. Registro
Crie ou atualize `specs/<pasta>/registro-construcao.md`:

```
# Registro da construção
Situação: em andamento
Branch: construcao/<pasta>
Início da rodada: <data e hora>
Limite: <N> tarefas

| Tarefa | Resultado | Tentativas | Commit | Observação |
|---|---|---|---|---|
```

## 4. O loop
Repita até uma condição de parada:

1. Pegue a **próxima tarefa pendente** (`- [ ]`) em `tarefas.md`.
2. **Construtor.** Chame o subagente `construtor` com: o texto da tarefa, o caminho **absoluto** do projeto e da pasta da especificação, os requisitos ligados (R1, R2...) e a verificação esperada. Se a tarefa usa algo feito antes, repasse os **riscos que os revisores apontaram** nas tarefas anteriores e que a afetam (por exemplo, "a função X não remove espaços: trate isso ao ler o arquivo"). Peça a resposta no formato dele.
3. Se o construtor responder **BLOQUEADA**, vá para as condições de parada.
4. **Revisor.** Chame o subagente `revisor` com a mesma tarefa e os critérios de aceite. Ele confere de forma independente.
5. **APROVADA:** marque a tarefa como `- [x]` em `tarefas.md` e faça o commit **só dos arquivos da tarefa**: os que o construtor listou em "O que mudou", mais `tarefas.md` e o registro (`git add <arquivos>` e `git commit -m "<pasta> T<n>: <resumo>"`). Nunca use `git add -A` ou `git add .`: assim um arquivo de dados que alguém deixou na pasta não entra no commit por acidente. Se `git status` mostrar outro arquivo novo que você não reconhece, **não o inclua** e cite no relatório. Depois do commit, acrescente a linha no registro com o hash (`git rev-parse --short HEAD`); ela entra no commit seguinte. **Nunca reescreva commits** (`--amend`, rebase).
6. **REPROVADA:** devolva os problemas apontados ao construtor e repita a revisão. **No máximo 2 correções.**
7. **Ainda reprovada após 2 correções: escalada.** Você (orquestrador) analisa o problema e tenta resolver diretamente uma vez, depois pede nova revisão. Se continuar reprovada, pare.

Para buscas grandes no código (achar onde algo é usado, entender uma parte do sistema), use o subagente `explorador` em vez de ler muitos arquivos você mesmo.

## 5. Condições de parada
Pare imediatamente, sem tentar contornar, quando:
- **todas as tarefas** estiverem concluídas;
- o **limite da rodada** for atingido;
- uma tarefa continuar **reprovada após a escalada**;
- o construtor estiver **BLOQUEADO** por dúvida de especificação, credencial, acesso, serviço externo ou instalação não prevista;
- algo indicar que a **especificação está errada** ou incompleta;
- a mesma falha se repetir em tarefas seguidas.

Nunca: faça `git push`, merge para a branch principal, leia ou altere arquivos de senha (`.env`, certificados), envie dados a serviços externos, desative ou apague testes para "fazer passar", ou altere a especificação por conta própria.

## 6. Relatório final
Ao parar:
1. Atualize o registro: `Situação: concluída`, `pausada no limite` ou `parada por bloqueio`, e a hora do fim.
2. **Faça um commit do registro** (`git add specs/<pasta>/registro-construcao.md specs/<pasta>/tarefas.md` e `git commit -m "<pasta>: fecha a rodada"`), para a próxima rodada encontrar o git limpo.
3. Responda à pessoa, em linguagem simples:
   - **Resumo:** quantas tarefas concluídas nesta rodada e quantas faltam no total.
   - **O que foi feito:** uma linha por tarefa, com o commit.
   - **Por que parou** e, se for bloqueio, **o que a pessoa precisa decidir ou fazer**.
   - **Para revisar antes de juntar:** os pontos de risco que o revisor apontou, e arquivos estranhos que você deixou de fora.
   - **Próximos passos:** se ainda há tarefas, `/construir` de novo; se terminou, **`/concluir-construcao`** para revisar, juntar à versão principal e enviar ao GitHub.
