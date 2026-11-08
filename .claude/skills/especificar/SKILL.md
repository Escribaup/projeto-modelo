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
3. Mostre o plano e as tarefas e peça aprovação.
4. **Execute uma tarefa por vez:** implemente, verifique (rode os testes ou mostre o resultado), marque `- [x]` e só então passe para a próxima. Se algo da especificação se mostrar errado, pare e proponha a correção na especificação antes de continuar.

## Regras

- Siga o `CLAUDE.md` do projeto, em especial a confidencialidade: use dados fictícios nos exemplos e nunca copie dados reais de clientes para a especificação.
- Não peça dados sensíveis desnecessários.
- Textos em português do Brasil, claros e sem jargão desnecessário. Quem lê a especificação pode não ser técnico.
- Mantenha os três arquivos atualizados. Eles são a memória do projeto entre conversas: para retomar, basta pedir "Leia specs/NNN-nome e continue da próxima tarefa".
