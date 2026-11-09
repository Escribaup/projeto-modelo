---
name: construir-paralelo
description: Construção autônoma EM PARALELO de uma especificação aprovada - executa ao mesmo tempo (até 3) as tarefas marcadas [paralela] em specs/<pasta>/tarefas.md, cada uma numa cópia isolada do projeto (git worktree), com construtor e revisor por tarefa, e junta os resultados. Tarefas sem a marca rodam uma por vez. Separado do /construir (sequencial) para os dois modos serem testados de forma independente. Use quando a pessoa pedir /construir-paralelo.
argument-hint: "[pasta da especificação] [limite de tarefas, padrão 10]"
---

# Construir em paralelo (modo autônomo)

Você é o **orquestrador**. Funciona como o `/construir`, com uma diferença: tarefas **independentes**, marcadas `[paralela]` em `tarefas.md`, são feitas **ao mesmo tempo**, cada uma numa cópia isolada do projeto. Todo o resto (pré-condições, limites, paradas, proibições) é igual ao modo sequencial e vale aqui também.

## 1. Pré-condições
Verifique as mesmas do `/construir`: a especificação escolhida está **aprovada** (`Situação: aprovada`, Prontidão `pronta`), há tarefas pendentes, o `git status` está limpo e você está numa **branch de construção**. Na branch principal, crie e mude para `construcao/<pasta>`.

Confirme com a pessoa **uma única vez**: a especificação, a branch, as tarefas pendentes, quais grupos vão rodar em paralelo e o limite da rodada (padrão **10**). Avise que o paralelo consome o plano mais rápido. Depois siga sem pedir confirmações.

## 2. Registro
Use `specs/<pasta>/registro-construcao.md` como no `/construir`, com `Situação: em andamento` e `Modo: paralelo`. Registre também, para cada grupo, quais tarefas rodaram juntas.

## 3. Montar os grupos
Percorra as tarefas pendentes **na ordem do arquivo**:
- Tarefas `[paralela]` **seguidas** formam um **grupo** de no máximo **3**. Um grupo maior é dividido em vários.
- Uma tarefa **sem** a marca é sempre feita **sozinha**, depois do grupo anterior.
- Antes de rodar um grupo, confira de novo se as tarefas são mesmo independentes: não dependem uma da outra e não citam os mesmos arquivos no plano. **Na dúvida, tire a tarefa do grupo** e rode-a sozinha.

## 4. Rodar um grupo em paralelo
Para cada tarefa `Tn` do grupo:

1. **Cópia isolada:** crie um worktree a partir da branch de construção atual:
   `git worktree add ../<projeto>-wt-Tn -b construcao/<pasta>-Tn`
2. **Construtores ao mesmo tempo:** chame o subagente `construtor` para **todas** as tarefas do grupo **na mesma mensagem**, para rodarem juntos. Diga a cada um, logo no início, que trabalhe **somente** na pasta `../<projeto>-wt-Tn` (caminhos absolutos), que é a sua cópia, e passe a tarefa, a pasta da especificação e a verificação esperada.
3. **Revisores:** para cada construtor que terminar CONCLUÍDA, chame o subagente `revisor` **na pasta do worktree daquela tarefa**. Pode chamar os revisores juntos também.
4. **Correções:** se reprovada, até 2 correções com o mesmo construtor e na mesma pasta. Depois, uma escalada sua (orquestrador). Ainda reprovada: a tarefa fica de fora e conta como parada (seção 6).
5. **Commit no worktree:** em cada worktree aprovado, faça o commit da tarefa (`git -C ../<projeto>-wt-Tn add -A` e `git -C ../<projeto>-wt-Tn commit -m "<pasta> Tn: <resumo>"`).

## 5. Juntar o grupo
De volta à pasta principal, na branch `construcao/<pasta>`:
1. Junte as tarefas aprovadas **uma por vez, na ordem do arquivo**:
   `git merge --no-ff construcao/<pasta>-Tn -m "<pasta>: junta Tn"`
2. **Conflito:** cancele aquela junção (`git merge --abort`), não tente resolver sozinho. Refaça essa tarefa **no modo sequencial**, direto na branch de construção (construtor, depois revisor), e anote no registro que houve conflito.
3. **Teste combinado:** depois de juntar o grupo, chame o `revisor` na pasta principal para rodar **todos** os testes sobre o resultado junto. Se falhar, pare: o problema está na combinação, e a pessoa precisa olhar.
4. Marque `- [x]` nas tarefas do grupo em `tarefas.md` (na branch de construção), anote no registro as tarefas do grupo com os hashes dos commits de cada uma (`git log --format=%h --grep=" Tn:" -1`) e faça um commit com isso. **Nunca reescreva commits** (`--amend`, rebase).
5. **Limpe as cópias:** `git worktree remove ../<projeto>-wt-Tn` e `git branch -d construcao/<pasta>-Tn` para cada tarefa juntada. Não apague uma cópia com trabalho que não foi juntado: deixe e cite no relatório.

**Tarefa sozinha (sem `[paralela]`):** faça como no `/construir`, direto na branch de construção. Se ela usa resultados do grupo anterior, repasse ao construtor os **riscos que os revisores apontaram** nas tarefas desse grupo.

## 6. Condições de parada
As mesmas do `/construir`: todas concluídas; limite da rodada atingido (cada tarefa conta 1, rodando em paralelo ou não, e não comece um grupo que passaria do limite: reduza-o); tarefa reprovada após a escalada; construtor BLOQUEADO; especificação parece errada; falha repetida. Mais duas, próprias do paralelo:
- **teste combinado falhou** depois de juntar um grupo;
- **dois conflitos** na mesma rodada, sinal de que as marcas `[paralela]` estão erradas.

Nunca: `git push`, merge na branch principal, ler ou alterar `.env`, apagar ou desativar testes para passar, alterar a especificação ou as marcas `[paralela]` por conta própria.

## 7. Relatório final
Como no `/construir` (resumo, o que foi feito com commits, por que parou, o que revisar, próximos passos). Acrescente:
- quais grupos rodaram em paralelo e quantos conflitos houve;
- se alguma cópia (worktree) ficou para trás, onde está e por quê.
