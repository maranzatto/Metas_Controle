import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { requireAuthenticatedUser } from '@/firebase/session'
import type { MetasLoja, MetasPorCategoria, MetasVendedor, Vendedor } from '@/types'

const col = () => collection(db, 'vendedores')
const metaDoc = (vendedorId: string, competencia: string) =>
  doc(db, 'vendedores', vendedorId, 'metas', competencia)
const metaLojaCol = () => collection(db, 'metasLoja')

export async function assertVendedorProprio(vendedorId: string, ownerUid: string): Promise<void> {
  const snap = await getDoc(doc(col(), vendedorId))
  if (!snap.exists() || snap.data().ownerUid !== ownerUid) {
    throw new Error('Vendedor não encontrado para este usuário')
  }
}

async function buscarMetaLojaDoc(ownerUid: string, competencia: string) {
  const snap = await getDocs(
    query(metaLojaCol(), where('ownerUid', '==', ownerUid), where('competencia', '==', competencia)),
  )
  if (snap.size > 1) throw new Error('Existem metas duplicadas para esta competência')
  return snap.docs[0]
}

function toVendedor(id: string, data: DocumentData): Vendedor {
  return {
    id,
    ownerUid: data.ownerUid,
    nome: data.nome,
    email: data.email ?? undefined,
    telefone: data.telefone ?? undefined,
    ativo: data.ativo,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

export async function listarVendedores(): Promise<Vendedor[]> {
  const user = await requireAuthenticatedUser()
  const snap = await getDocs(query(col(), where('ownerUid', '==', user.uid), orderBy('nome')))
  return snap.docs.map((document) => toVendedor(document.id, document.data()))
}

/** Cria/atualiza apenas os dados pessoais do vendedor. */
export async function salvarVendedor(dados: {
  id?: string
  nome: string
  email?: string
  telefone?: string
  ativo: boolean
}): Promise<string> {
  const user = await requireAuthenticatedUser()
  const ref = dados.id ? doc(col(), dados.id) : doc(col())
  if (dados.id) await assertVendedorProprio(dados.id, user.uid)
  await setDoc(
    ref,
    {
      ownerUid: user.uid,
      nome: dados.nome.trim(),
      email: dados.email?.trim() || null,
      telefone: dados.telefone?.trim() || null,
      ativo: dados.ativo,
      updatedAt: serverTimestamp(),
      ...(dados.id ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  )
  return ref.id
}

/** Cria/atualiza as metas de um vendedor para uma competência ("YYYY-MM"). */
export async function salvarMetas(
  vendedorId: string,
  competencia: string,
  categorias: MetasPorCategoria,
): Promise<void> {
  const user = await requireAuthenticatedUser()
  await assertVendedorProprio(vendedorId, user.uid)
  await setDoc(
    metaDoc(vendedorId, competencia),
    { competencia, categorias, updatedAt: serverTimestamp() },
    { merge: true },
  )
}

export async function buscarMetas(
  vendedorId: string,
  competencia: string,
): Promise<MetasVendedor | null> {
  const user = await requireAuthenticatedUser()
  await assertVendedorProprio(vendedorId, user.uid)
  const snap = await getDoc(metaDoc(vendedorId, competencia))
  return snap.exists() ? (snap.data() as MetasVendedor) : null
}

/** Busca metas de vários vendedores, confirmando antes o proprietário de cada um. */
export async function buscarMetasDeVarios(
  vendedorIds: string[],
  competencia: string,
): Promise<Map<string, MetasVendedor>> {
  const user = await requireAuthenticatedUser()
  await Promise.all(vendedorIds.map((id) => assertVendedorProprio(id, user.uid)))
  const resultados = await Promise.all(vendedorIds.map((id) => buscarMetas(id, competencia)))
  const mapa = new Map<string, MetasVendedor>()
  vendedorIds.forEach((id, index) => {
    if (resultados[index]) mapa.set(id, resultados[index])
  })
  return mapa
}

/** Cria/atualiza a meta da loja para uma competência ("YYYY-MM"). */
export async function salvarMetaLoja(
  competencia: string,
  categorias: MetasPorCategoria,
): Promise<void> {
  const user = await requireAuthenticatedUser()
  const existing = await buscarMetaLojaDoc(user.uid, competencia)
  const ref = existing?.ref ?? doc(metaLojaCol(), `${user.uid}_${competencia}`)
  await setDoc(
    ref,
    {
      ownerUid: user.uid,
      competencia,
      categorias,
      updatedAt: serverTimestamp(),
      ...(!existing ? { createdAt: serverTimestamp() } : {}),
    },
    { merge: true },
  )
}

export async function buscarMetaLoja(competencia: string): Promise<MetasLoja | null> {
  const user = await requireAuthenticatedUser()
  const snap = await buscarMetaLojaDoc(user.uid, competencia)
  return snap ? (snap.data() as MetasLoja) : null
}