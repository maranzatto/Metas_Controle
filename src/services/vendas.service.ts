import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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
import { requireAuthenticatedUser } from '@/firebase/session'
import { assertVendedorProprio } from '@/services/vendedores.service'
import type { Intervalo } from '@/utils/date'
import type { Venda } from '@/types'

const col = () => collection(db, 'vendas')

function toVenda(id: string, d: DocumentData): Venda {
  return {
    id,
    uid: d.uid,
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
  const user = await requireAuthenticatedUser()
  const q = query(
    col(),
    where('uid', '==', user.uid),
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
  const user = await requireAuthenticatedUser()
  await assertVendedorProprio(input.vendedorId, user.uid)
  const ref = await addDoc(col(), {
    uid: user.uid,
    ...payload(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function atualizarVenda(id: string, input: VendaInput): Promise<void> {
  const user = await requireAuthenticatedUser()
  const ref = doc(col(), id)
  const snap = await getDoc(ref)
  if (!snap.exists() || snap.data().uid !== user.uid) {
    throw new Error('Venda não encontrada para este usuário')
  }
  if (snap.data().vendedorId !== input.vendedorId) {
    throw new Error('Não é permitido transferir uma venda para outro vendedor')
  }
  await assertVendedorProprio(input.vendedorId, user.uid)
  await updateDoc(ref, { ...payload(input), updatedAt: serverTimestamp() })
}

export async function excluirVenda(id: string): Promise<void> {
  const user = await requireAuthenticatedUser()
  const ref = doc(col(), id)
  const snap = await getDoc(ref)
  if (!snap.exists() || snap.data().uid !== user.uid) {
    throw new Error('Venda não encontrada para este usuário')
  }
  await deleteDoc(ref)
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
