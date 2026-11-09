---
name: concluir-construcao
description: Finaliza uma construção - mostra em linguagem simples o que mudou na branch construcao/<pasta>, revisa, junta à versão principal e envia ao GitHub, sempre com confirmação da pessoa. Use quando a pessoa pedir /concluir-construcao ou quiser "juntar", "finalizar" ou "publicar" o resultado do /construir.
argument-hint: "[pasta da especificação]"
---

# Concluir uma construção

Leva o resultado do `/construir` (ou `/construir-paralelo`) da branch `construcao/<pasta>` para a versão principal, com revisão e com a pessoa no controle. **Cada passo que altera algo pede confirmação.**

## 1. Situação atual
1. Descubra a branch: a indicada nos argumentos (`construcao/<pasta>`), a branch atual se começar com `construcao/`, ou liste as que existem (`git branch --list "construcao/*"`) e pergunte.
2. Confira:
   - `git status` limpo (se não estiver, mostre o que há e pergunte se salva ou descarta);
   - o registro (`specs/<pasta>/registro-construcao.md`) não está `em andamento` (se estiver, a construção não terminou: oriente a rodar `/construir` antes);
   - quantas tarefas de `tarefas.md` estão feitas. Se faltam tarefas, pergunte se a pessoa quer juntar mesmo assim (parte pronta) ou terminar antes.
3. Descubra a branch principal (`main` ou `master`).

## 2. O que mudou, em linguagem simples
Mostre à pessoa, sem jargão:
- as tarefas concluídas (do registro), uma por linha;
- os arquivos criados ou alterados (`git diff --stat <principal>...construcao/<pasta>`), agrupados por assunto;
- os **riscos** que os revisores anotaram no registro.

## 3. Revisão final
Recomende uma revisão do conjunto antes de juntar e diga como: `/code-review construcao/<pasta>` (o comando de revisão do Claude Code, apontando para a branch). Se a pessoa preferir, faça você uma conferência rápida: rode os testes (ou a verificação do projeto) na branch e confira se não há arquivos de dados reais, senhas ou certificados entre os alterados.

Se a revisão encontrar problemas, **pare aqui**: proponha corrigir (por exemplo, uma nova tarefa em `tarefas.md` e `/construir`) antes de juntar.

## 4. Juntar à versão principal
Com a confirmação da pessoa:
1. `git switch <principal>`
2. `git merge --no-ff construcao/<pasta> -m "<pasta>: junta a construção"`
3. Se houver conflito: `git merge --abort`, explique em linguagem simples quais arquivos conflitam e **não resolva sozinho**: pergunte como a pessoa quer seguir.
4. Rode a verificação do projeto (testes) na principal e mostre o resultado.

**Alternativa mais segura para equipes:** em vez de juntar localmente, enviar a branch ao GitHub e abrir um *Pull Request*, para outra pessoa revisar e aprovar no site. Ofereça essa opção se o projeto for compartilhado com outras pessoas.

## 5. Enviar ao GitHub
Pergunte se pode enviar. Com a confirmação: `git push origin <principal>` (o Claude Code vai pedir permissão para o push; isso é esperado). Se o projeto ainda não tem repositório no GitHub (`git remote -v` vazio), explique e pare.

## 6. Arrumar
Com a confirmação da pessoa, apague a branch de construção, que já foi juntada (`git branch -d construcao/<pasta>`). No registro da especificação, acrescente `Juntada à <principal> em <data>`, faça o commit e envie (com confirmação).

## Regras
- Nunca `git push --force`, nunca reescreva commits, nunca resolva conflito sem a pessoa.
- Se algo der errado no meio, pare e explique em que passo parou e como desfazer.
