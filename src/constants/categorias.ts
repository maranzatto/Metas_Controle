export const CATEGORIAS = [
  'POS',
  'CONTROLE',
  'FIXA',
  'APARELHO',
  'ACESSORIOS',
  'NOVOS_NEGOCIOS',
  'SVA',
] as const

export type Categoria = (typeof CATEGORIAS)[number]

export const CATEGORIA_LABELS: Record<Categoria, string> = {
  POS: 'Pós',
  CONTROLE: 'Controle',
  FIXA: 'Fixa',
  APARELHO: 'Aparelho',
  ACESSORIOS: 'Acessórios',
  NOVOS_NEGOCIOS: 'Novos Negócios',
  SVA: 'SVA',
}
