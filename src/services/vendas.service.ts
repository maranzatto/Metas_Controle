import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { Intervalo } from '@/utils/date'
import type { Venda } from '@/types'

const col = () => collection(db, 'vendas')

function toVenda(id: string, d: DocumentData): Venda {
  return {
    id,
    vendedorId: d.vendedorId,
    categoria: d.categoria,
    quantidade: d.quantidade,
    valor: d.valor,
    data: d.data,
    observacao: d.observacao,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }
}

/**
 * Vendas no intervalo [inicio, fim). O filtro por vendedor é feito no cliente:
 * `where('vendedorId', 'in', ...)` aceita no máx. 30 valores e raramente compensa.
 */
export async function listarVendas({ inicio, fim }: Intervalo): Promise<Venda[]> {
  const q = query(
    col(),
    where('data', '>=', Timestamp.fromDate(inicio)),
    where('data', '<', Timestamp.fromDate(fim)),
    orderBy('data', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => toVenda(d.id, d.data()))
}

export interface VendaInput {
  vendedorId: string
  categoria: Venda['categoria']
  quantidade: number
  valor?: number
  data: Date
  observacao?: string
}

export async function criarVenda(input: VendaInput): Promise<string> {
  const ref = await addDoc(col(), {
    ...payload(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function atualizarVenda(id: string, input: VendaInput): Promise<void> {
  await updateDoc(doc(col(), id), { ...payload(input), updatedAt: serverTimestamp() })
}

export async function excluirVenda(id: string): Promise<void> {
  await deleteDoc(doc(col(), id))
}

function payload(input: VendaInput) {
  return {
    vendedorId: input.vendedorId,
    categoria: input.categoria,
    quantidade: input.quantidade,
    valor: input.valor ?? null,
    data: Timestamp.fromDate(input.data),
    observacao: input.observacao?.trim() || null,
  }
}
