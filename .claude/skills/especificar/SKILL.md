---
name: especificar
description: Conduz a especificação de uma tarefa grande (funcionalidade ou sistema novo) antes de qualquer código, no estilo Spec-Driven Development com as fases do AI-DLC. Gera specs/NNN-nome/ com especificacao.md, plano.md e tarefas.md. Use quando a pessoa pedir /especificar, disser que a tarefa é grande ou quiser planejar algo novo com várias partes.
---

# Especificar

Transforma uma ideia em uma especificação validada, um plano e uma lista de tarefas, **antes** de escrever código. O fluxo segue as fases do AI-DLC: **Concepção** (entender e validar o quê e por quê), depois **Construção** (como fazer, em ciclos curtos).

## Antes de começar

1. Confirme que a tarefa é grande de verdade. Se couber em uma conversa e em poucos arquivos, sugira o caminho médio (um `PLAN.md` curto) e pergunte se a pessoa prefere seguir com ele.
2. Pergunte o modo:
   - **Rápido**: poucas perguntas. Gera o rascunho com as lacunas marcadas como `[a confirmar]`.
   - **Guiado**: aprofunda as perguntas. Só avança quando não houver lacuna crítica nem contradição.
   Se a pessoa não escolher, use o **rápido**.
3. Escolha o número e o nome da pasta: `specs/NNN-nome-curto/`. NNN é o próximo número livre (001, 002…). O nome é curto, em minúsculas e com hífens.

## Fase 1: Concepção (o quê e por quê)

1. **Pergunte antes de escrever.** Faça de 3 a 7 perguntas objetivas de cada vez sobre o problema, quem usa, o que precisa acontecer, regras de negócio, o que fica de fora e como saber que ficou pronto. Não pergunte o que dá para descobrir lendo o projeto.
2. **Escreva `especificacao.md`** a partir de `modelos/especificacao.md` (nesta pasta da skill).
   - Fale do problema e do resultado, não de tecnologia.
   - Cada requisito tem um ou mais **critérios de aceite** verificáveis.
   - **Rastreabilidade:** marque cada item como `[confirmado]` (a pessoa disse), `[assumido]` (você deduziu) ou `[a confirmar]` (lacuna). Nunca apresente uma suposição como fato.
3. **Relatório de prontidão.** No fim da especificação, preencha a seção "Prontidão": lacunas críticas, contradições e suposições que precisam de confirmação. Diga claramente se está **pronta** ou **não pronta** para a construção.
4. **Validação (o "mob elaboration" do AI-DLC).** Apresente um resumo curto e as perguntas abertas. Peça para a pessoa confirmar ou corrigir. Se houver mais gente envolvida, sugira revisar junto com ela.
   - No modo guiado, **não avance** enquanto houver lacuna crítica.
   - No modo rápido, avance com as lacunas visíveis e repita o aviso.

## Fase 2: Construção (como fazer)

Só depois de a especificação ser aprovada:

1. **`plano.md`** (de `modelos/plano.md`): como construir, as decisões técnicas com o motivo, o que pode dar errado e como cada requisito será verificado. Se o projeto já tem um padrão, siga-o.
2. **`tarefas.md`** (de `modelos/tarefas.md`): tarefas pequenas, cada uma com caixa `- [ ]`, ligada a um requisito (R1, R2…) e com como verificar. Agrupe em **ciclos curtos** (os "bolts" do AI-DLC), de algumas horas cada.
   - Cada tarefa tem um "Verificar:" **objetivo**: um teste, um comando ou uma conferência contra uma referência (por exemplo, "o total bate com a planilha de referência"). Evite "ver se ficou bom".
   - Só marque `[paralela]` se a pessoa disse que vai usar o `/construir-paralelo` (recurso avançado): tarefas que podem ser feitas ao mesmo tempo que as vizinhas marcadas, sem depender uma da outra e sem alterar os mesmos arquivos. Na dúvida, não marque.
3. **Revisão de olhos frescos** (recomendada em tarefas grandes; pergunte se a pessoa quer, avisando que consome mais da assinatura). Revisores que **não conhecem esta conversa** leem a especificação e o plano, como um colega recém-chegado:
   - **Se o plugin Elephant-Goldfish (EGM) estiver instalado** (existem os agentes `egm:egm-zoom-out`, `egm:egm-comprehension`, `egm:egm-design` e `egm:egm-implementation-readiness`): chame os quatro **ao mesmo tempo**, cada um com `Mode: REVIEW`, os caminhos absolutos de `especificacao.md` e `plano.md`, o público ("colaboradores de um escritório de contabilidade, muitos não técnicos") e o pedido de responder **em português do Brasil**, com gravidade, local e sugestão em cada achado.
   - **Se não estiver**, chame o agente `revisor-especificacao`, que faz os mesmos quatro olhares (escopo, clareza, decisões, prontidão para construir).
   - Junte os achados em `specs/<pasta>/revisao.md` (sem duplicatas, do mais grave ao mais leve) e apresente um resumo curto. A pessoa escolhe o que corrigir; corrija na especificação ou no plano e, se algo grave mudou, ofereça revisar de novo. Achados não corrigidos ficam registrados como riscos conhecidos.
4. Mostre o plano e as tarefas (e o resultado da revisão, se houve) e peça aprovação. Quando a pessoa aprovar, mude a linha de situação da especificação para `Situação: aprovada` e a Prontidão para `pronta`.
5. Pergunte como a pessoa quer construir:
   - **Acompanhando**: você executa uma tarefa por vez nesta conversa (passo 6). Melhor quando a verificação depende do olho humano.
   - **Autônomo**: a pessoa roda `/construir`, que faz as tarefas em sequência com subagentes e para sozinho ao terminar, travar ou atingir o limite da rodada. No fim, `/concluir-construcao` junta o resultado à versão principal.
   - Mencione o `/construir-paralelo` só se a pessoa perguntar por algo mais rápido: é um recurso avançado.
6. **Execute uma tarefa por vez:** implemente, verifique (rode os testes ou mostre o resultado), marque `- [x]` e só então passe para a próxima. Se algo da especificação se mostrar errado, pare e proponha a correção na especificação antes de continuar.

## Regras

- Siga o `CLAUDE.md` do projeto, em especial a confidencialidade: use dados fictícios nos exemplos e nunca copie dados reais de clientes para a especificação.
- Não peça dados sensíveis desnecessários.
- Textos em português do Brasil, claros e sem jargão desnecessário. Quem lê a especificação pode não ser técnico.
- Mantenha os três arquivos atualizados. Eles são a memória do projeto entre conversas: para retomar, basta pedir "Leia specs/NNN-nome e continue da próxima tarefa".
