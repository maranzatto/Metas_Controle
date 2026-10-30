import type { Timestamp } from 'firebase/firestore'
import type { Categoria } from '@/constants/categorias'

/** Metas mensais por categoria, sempre em valor (R$). */
export interface MetaCategoria {
  meta80: number
  meta100: number
}

export type MetasPorCategoria = Record<Categoria, MetaCategoria>

export interface Vendedor {
  id: string
  ownerUid: string
  nome: string
  email?: string
  telefone?: string
  ativo: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** Doc em vendedores/{vendedorId}/metas/{competencia}. */
export interface MetasVendedor {
  competencia: string
  categorias: MetasPorCategoria
  updatedAt: Timestamp
}

/** Meta global da loja, vinculada ao proprietário autenticado. */
export interface MetasLoja extends MetasVendedor {
  ownerUid: string
}

export interface Venda {
  id: string
  ownerUid: string
  vendedorId: string
  categoria: Categoria
  quantidade: number
  valor?: number
  data: Timestamp
  observacao?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}