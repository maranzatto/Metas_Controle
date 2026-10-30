import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
<<<<<<< HEAD
  where,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { requireAuthenticatedUser } from '@/firebase/session'
=======
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/firebase'
>>>>>>> fd676deb5e8cac857d419617d908a0ff5fbfa9b1
import type { MetasLoja, MetasPorCategoria, MetasVendedor, Vendedor } from '@/types'

const col = () => collection(db, 'vendedores')
const metaDoc = (vendedorId: string, competencia: string) =>
  doc(db, 'vendedores', vendedorId, 'metas', competencia)
<<<<<<< HEAD
const metaLojaCol = () => collection(db, 'metasLoja')

export async function assertVendedorProprio(vendedorId: string, uid: string): Promise<void> {
  const snap = await getDoc(doc(col(), vendedorId))
  if (!snap.exists() || snap.data().uid !== uid) {
    throw new Error('Vendedor não encontrado para este usuário')
  }
}

async function buscarMetaLojaDoc(uid: string, competencia: string) {
  const snap = await getDocs(
    query(metaLojaCol(), where('uid', '==', uid), where('competencia', '==', competencia)),
  )
  if (snap.size > 1) throw new Error('Existem metas duplicadas para esta competência')
  return snap.docs[0]
}
=======
const metaLojaDoc = (competencia: string) => doc(db, 'metasLoja', competencia)
>>>>>>> fd676deb5e8cac857d419617d908a0ff5fbfa9b1

function toVendedor(id: string, d: DocumentData): Vendedor {
  return {
    id,
<<<<<<< HEAD
    uid: d.uid,
=======
>>>>>>> fd676deb5e8cac857d419617d908a0ff5fbfa9b1
    nome: d.nome,
    email: d.email ?? undefined,
    telefone: d.telefone ?? undefined,
    ativo: d.ativo,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }
}

export async function listarVendedores(): Promise<Vendedor[]> {
<<<<<<< HEAD
  const user = await requireAuthenticatedUser()
  const snap = await getDocs(query(col(), where('uid', '==', user.uid), orderBy('nome')))
=======
  const snap = await getDocs(query(col(), orderBy('nome')))
>>>>>>> fd676deb5e8cac857d419617d908a0ff5fbfa9b1
  return snap.docs.map((d) => toVendedor(d.id, d.data()))
}

/** Cria/atualiza apenas os dados pessoais do vendedor. */
export async function salvarVendedor(dados: {
  id?: string
  nome: string
  email?: string
  telefone?: string
  ativo: boolean
}): Promise<string> {
<<<<<<< HEAD
  const user = await requireAuthenticatedUser()
  const ref = dados.id ? doc(col(), dados.id) : doc(col())
  if (dados.id) await assertVendedorProprio(dados.id, user.uid)
  await setDoc(
    ref,
    {
      uid: user.uid,
=======
  const batch = writeBatch(db)
  const ref = dados.id ? doc(col(), dados.id) : doc(col())
  batch.set(
    ref,
    {
>>>>>>> fd676deb5e8cac857d419617d908a0ff5fbfa9b1
      nome: dados.nome.trim(),
      email: dados.email?.trim() || null,
      telefone: dados.telefone?.trim() || null,
      ativo: dados.ativo,
      updatedAt: serverTimestamp(),
      ...(dados.id ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  )
<<<<<<< HEAD
=======
  await batch.commit()
>>>>>>> fd676deb5e8cac857d419617d908a0ff5fbfa9b1
  return ref.id
}

/** Cria/atualiza as metas de um vendedor para uma competência ("YYYY-MM"). */
export async function salvarMetas(
  vendedorId: string,
  competencia: string,
  categorias: MetasPorCategoria,
): Promise<void> {
<<<<<<< HEAD
  const user = await requireAuthenticatedUser()
  await assertVendedorProprio(vendedorId, user.uid)
=======
>>>>>>> fd676deb5e8cac857d419617d908a0ff5fbfa9b1
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
<<<<<<< HEAD
  const user = await requireAuthenticatedUser()
  await assertVendedorProprio(vendedorId, user.uid)
=======
>>>>>>> fd676deb5e8cac857d419617d908a0ff5fbfa9b1
  const snap = await getDoc(metaDoc(vendedorId, competencia))
  return snap.exists() ? (snap.data() as MetasVendedor) : null
}

/** Busca metas de vários vendedores em paralelo (1 doc get por vendedor). */
export async function buscarMetasDeVarios(
  vendedorIds: string[],
  competencia: string,
): Promise<Map<string, MetasVendedor>> {
<<<<<<< HEAD
  const user = await requireAuthenticatedUser()
  const vendedores = await Promise.all(
    vendedorIds.map(async (id) => {
      await assertVendedorProprio(id, user.uid)
      return id
    }),
  )
  const resultados = await Promise.all(vendedores.map((id) => buscarMetas(id, competencia)))
  const mapa = new Map<string, MetasVendedor>()
  vendedores.forEach((id, i) => {
=======
  const resultados = await Promise.all(vendedorIds.map((id) => buscarMetas(id, competencia)))
  const mapa = new Map<string, MetasVendedor>()
  vendedorIds.forEach((id, i) => {
>>>>>>> fd676deb5e8cac857d419617d908a0ff5fbfa9b1
    if (resultados[i]) mapa.set(id, resultados[i])
  })
  return mapa
}

/** Cria/atualiza a meta da loja para uma competência ("YYYY-MM"). */
export async function salvarMetaLoja(
  competencia: string,
  categorias: MetasPorCategoria,
): Promise<void> {
<<<<<<< HEAD
  const user = await requireAuthenticatedUser()
  const existing = await buscarMetaLojaDoc(user.uid, competencia)
  const ref = existing?.ref ?? doc(metaLojaCol(), `${user.uid}_${competencia}`)
  await setDoc(
    ref,
    {
      uid: user.uid,
      competencia,
      categorias,
      updatedAt: serverTimestamp(),
      ...(!existing ? { createdAt: serverTimestamp() } : {}),
    },
=======
  await setDoc(
    metaLojaDoc(competencia),
    { competencia, categorias, updatedAt: serverTimestamp() },
>>>>>>> fd676deb5e8cac857d419617d908a0ff5fbfa9b1
    { merge: true },
  )
}

export async function buscarMetaLoja(competencia: string): Promise<MetasLoja | null> {
<<<<<<< HEAD
  const user = await requireAuthenticatedUser()
  const snap = await buscarMetaLojaDoc(user.uid, competencia)
  return snap ? (snap.data() as MetasLoja) : null
=======
  const snap = await getDoc(metaLojaDoc(competencia))
  return snap.exists() ? (snap.data() as MetasLoja) : null
>>>>>>> fd676deb5e8cac857d419617d908a0ff5fbfa9b1
}
