# GEMINI.md — Instruções para o Gemini (Firebase Studio)

## Contexto

Painel administrativo de **metas e vendas de uma loja** (telefonia/varejo).
SPA com login por e-mail/senha, CRUD de vendedores com metas mensais por
categoria, lançamento de vendas e dashboard de resultados.

## Stack obrigatória

- Vue 3 — Composition API, `<script setup lang="ts">`, TypeScript estrito
- Vite + Vue Router 4 + Pinia (setup stores)
- Firebase v11 **modular**: `firebase/auth`, `firebase/firestore` — nunca o SDK namespaced v8
- Tailwind CSS v4 (plugin `@tailwindcss/vite`) — sem biblioteca de componentes
- Vitest para funções puras; ESLint flat config + Prettier (sem `;`, aspas simples)
- Alias `@/` = `src/` (configurado em vite.config.ts e tsconfig)

## Estrutura de pastas — seguir sempre

```
src/
  firebase/    init do app, auth, db (somente aqui se importa firebase/app)
  router/      rotas + guard global (rota pública usa meta.public)
  stores/      Pinia: auth, vendedores, vendas
  services/    acesso ao Firestore — SEM lógica de UI
  features/{auth,home,vendedores,vendas,metas}/  views, componentes, composables
  utils/       date.ts, metas.ts (puro/testável), format.ts
  types/       interfaces TS
  constants/   categorias.ts
  components/ui/  BaseButton, BaseInput, BaseSelect, BaseModal, ProgressBar
  layouts/     AdminLayout.vue (sidebar + header)
```

## Modelo Firestore — não mudar sem necessidade

- `vendedores/{id}`: `nome` string, `email?` string, `telefone?` string,
  `ativo` bool, `createdAt`, `updatedAt` — cadastro só tem dados pessoais;
  metas ficam na subcoleção abaixo, editadas na página `/vendedores/:id/metas`
- `vendedores/{id}/metas/{YYYY-MM}`: `competencia` string, `categorias` map
  `{POS: {meta80, meta100}, ...}` (7 categorias, metas em valor R$), `updatedAt`
- Inputs mascarados: `v-mask`/`mask=` em BaseInput — helpers em
  `src/utils/masks.ts` (currency, phone, cpf, date, int); currency no form
  trafega como string "1.234,56" e é convertido com `parseMoeda` ao salvar
- `vendas/{id}`: `vendedorId`, `categoria`, `quantidade` ≥ 0, `valor?`,
  `data` Timestamp (só o dia), `observacao?`, `createdAt`, `updatedAt`
- As 7 categorias vivem em `src/constants/categorias.ts`
  (`POS, CONTROLE, FIXA, APARELHO, ACESSORIOS, NOVOS_NEGOCIOS, SVA`).
  Sempre importar de lá — nunca duplicar a lista.

## Regras de negócio

- Metas são **mensais por competência**; metas de dia/semana derivam por
  proporção de dias corridos. A regra está isolada em `metaDoPeriodo()` /
  `diasDeReferencia()` em `src/utils/metas.ts` — usar, não reimplementar.
- Realizado é **sempre calculado** das vendas no intervalo — nunca persistir
  totais/agregados.
- Validar metas com `metasValidas()` (`meta100 >= meta80 >= 0`).
- Vendedor nunca é deletado — usar `ativo = false` (preserva histórico).
- Exclusão de venda exige confirmação via `BaseModal`.
- Filtro de vendedor nas vendas é feito no cliente (não usar `in` do Firestore).

## Convenções de código

- Componentes só acessam Firestore via `src/services/*` — nunca importar
  `firebase/firestore` em `.vue` ou `stores/`.
- UI com Tailwind + `src/components/ui/*`. Textos de UI em **pt-BR**.
- Datas sempre em horário local: `toDateInput`/`fromDateInput` em
  `utils/date.ts` (meio-dia local para não virar dia por fuso/DST).
  Competência = `"YYYY-MM"`.
- Comentários só quando não óbvio; código compacto; sem dependências novas
  sem justificativa.
- Toda função pura nova em `utils/` precisa de teste `*.test.ts` (Vitest).
- Nunca commitar `.env`; config Firebase só via `import.meta.env.VITE_*`.

## Verificação antes de entregar

`npm run test` · `npx vue-tsc --noEmit -p tsconfig.app.json` · `npx eslint .`
