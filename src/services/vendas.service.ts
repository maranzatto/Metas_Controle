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
import { dataInputValida, toDateInput, type Intervalo } from '@/utils/date'
import { CATEGORIAS } from '@/constants/categorias'
import type { Venda } from '@/types'

const col = () => collection(db, 'vendas')

function toVenda(id: string, data: DocumentData): Venda {
  return {
    id,
    ownerUid: data.ownerUid,
    vendedorId: data.vendedorId,
    categoria: data.categoria,
    quantidade: data.quantidade,
    valor: data.valor,
    data: data.data,
    observacao: data.observacao,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

/** Lista vendas no intervalo [inicio, fim), sempre limitadas ao proprietário. */
export async function listarVendas({ inicio, fim }: Intervalo): Promise<Venda[]> {
  const user = await requireAuthenticatedUser()
  if (
    !(inicio instanceof Date) ||
    !(fim instanceof Date) ||
    !Number.isFinite(inicio.getTime()) ||
    !Number.isFinite(fim.getTime()) ||
    inicio >= fim
  ) {
    throw new Error('Informe um intervalo de datas válido')
  }
  const q = query(
    col(),
    where('ownerUid', '==', user.uid),
    where('data', '>=', Timestamp.fromDate(inicio)),
    where('data', '<', Timestamp.fromDate(fim)),
    orderBy('data', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((document) => toVenda(document.id, document.data()))
}

export interface VendaInput {
  vendedorId: string
  categoria: Venda['categoria']
  quantidade: number
  valor: number
  data: Date
  observacao?: string
}

function validarVenda(input: VendaInput): void {
  if (!input.vendedorId.trim()) throw new Error('Selecione um vendedor')
  if (!CATEGORIAS.includes(input.categoria)) throw new Error('Categoria inválida')
  if (!Number.isInteger(input.quantidade) || input.quantidade <= 0) {
    throw new Error('A quantidade deve ser um inteiro maior que zero')
  }
  if (!Number.isFinite(input.valor) || input.valor < 0) {
    throw new Error('Informe um valor válido para a venda')
  }
  if (!(input.data instanceof Date) || !dataInputValida(toDateInput(input.data))) {
    throw new Error('Informe uma data válida para a venda')
  }
}

export async function criarVenda(input: VendaInput): Promise<string> {
  validarVenda(input)
  const user = await requireAuthenticatedUser()
  await assertVendedorProprio(input.vendedorId, user.uid)
  const ref = await addDoc(col(), {
    ownerUid: user.uid,
    ...payload(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function atualizarVenda(id: string, input: VendaInput): Promise<void> {
  validarVenda(input)
  const user = await requireAuthenticatedUser()
  const ref = doc(col(), id)
  const snap = await getDoc(ref)
  if (!snap.exists() || snap.data().ownerUid !== user.uid) {
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
  if (!snap.exists() || snap.data().ownerUid !== user.uid) {
    throw new Error('Venda não encontrada para este usuário')
  }
  await deleteDoc(ref)
}

function payload(input: VendaInput) {
  return {
    vendedorId: input.vendedorId,
    categoria: input.categoria,
    quantidade: input.quantidade,
    valor: input.valor,
    data: Timestamp.fromDate(input.data),
    observacao: input.observacao?.trim() || null,
  }
}