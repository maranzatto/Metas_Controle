import type { Timestamp } from 'firebase/firestore'
import type { Categoria } from '@/constants/categorias'

/** Metas mensais por categoria, sempre em valor (R$). */
export interface MetaCategoria {
  meta80: number // R$
  meta100: number // R$
}

export type MetasPorCategoria = Record<Categoria, MetaCategoria>

export interface Vendedor {
  id: string
  nome: string
  email?: string
  telefone?: string
  ativo: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

/**
 * Doc em vendedores/{vendedorId}/metas/{competencia}.
 * Subcoleção (em vez de mapa no doc do vendedor) permite metas diferentes a cada
 * mês sem inchar o documento principal, com leitura direta por id "YYYY-MM".
 */
export interface MetasVendedor {
  competencia: string // "2026-10"
  categorias: MetasPorCategoria
  updatedAt: Timestamp
}

/** Doc em metasLoja/{competencia}: meta global da loja, mesmo formato do vendedor. */
export type MetasLoja = MetasVendedor

export interface Venda {
  id: string
  vendedorId: string
  categoria: Categoria
  quantidade: number
  valor?: number
  data: Timestamp // apenas o dia da venda
  observacao?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
