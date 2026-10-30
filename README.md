# Painel de Metas e Vendas

Painel administrativo (Vue 3 + TypeScript + Firebase) para controle de metas mensais
e vendas por categoria de uma loja.

## Stack

- Vue 3 (`<script setup>`) + TypeScript + Vite
- Vue Router 4 + Pinia
- Firebase v11 (Auth e-mail/senha + Firestore)
- Tailwind CSS v4 — utilitário suficiente para o layout, sem dependência de
  biblioteca de componentes
- ESLint (flat config) + Prettier + Vitest

## Setup

```bash
npm install
cp .env.example .env   # preencher com as credenciais do projeto Firebase
npm run dev
```

Firebase:

```bash
npm i -g firebase-tools
firebase login
firebase init   # selecionar Firestore (reutiliza firebase.json existente)
firebase deploy --only firestore:rules,firestore:indexes
```

No console do Firebase: ativar **Authentication → E-mail/senha** e criar o
primeiro usuário manualmente.

## Scripts

| Comando        | Ação                          |
| -------------- | ----------------------------- |
| `npm run dev`  | dev server                    |
| `npm run build`| typecheck + build             |
| `npm run test` | testes unitários (Vitest)     |
| `npm run lint` | ESLint                        |

## Modelo de dados

- `vendedores/{id}` — `nome`, `ativo`, timestamps
- `vendedores/{id}/metas/{YYYY-MM}` — metas por competência (subcoleção: metas
  mensais sem inchar o doc do vendedor, leitura direta por id)
- `vendas/{id}` — `vendedorId`, `categoria`, `quantidade`, `valor?`, `data`,
  `observacao?`, timestamps

Resultados são sempre calculados das vendas no intervalo; metas de dia/semana
são derivadas da meta mensal por proporção de dias corridos (ver
`src/utils/metas.ts` — regra isolada e fácil de trocar).
