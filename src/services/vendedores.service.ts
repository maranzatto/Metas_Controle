import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { MetasLoja, MetasPorCategoria, MetasVendedor, Vendedor } from '@/types'

const col = () => collection(db, 'vendedores')
const metaDoc = (vendedorId: string, competencia: string) =>
  doc(db, 'vendedores', vendedorId, 'metas', competencia)
const metaLojaDoc = (competencia: string) => doc(db, 'metasLoja', competencia)

function toVendedor(id: string, d: DocumentData): Vendedor {
  return {
    id,
    nome: d.nome,
    email: d.email ?? undefined,
    telefone: d.telefone ?? undefined,
    ativo: d.ativo,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }
}

export async function listarVendedores(): Promise<Vendedor[]> {
  const snap = await getDocs(query(col(), orderBy('nome')))
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
  const batch = writeBatch(db)
  const ref = dados.id ? doc(col(), dados.id) : doc(col())
  batch.set(
    ref,
    {
      nome: dados.nome.trim(),
      email: dados.email?.trim() || null,
      telefone: dados.telefone?.trim() || null,
      ativo: dados.ativo,
      updatedAt: serverTimestamp(),
      ...(dados.id ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  )
  await batch.commit()
  return ref.id
}

/** Cria/atualiza as metas de um vendedor para uma competência ("YYYY-MM"). */
export async function salvarMetas(
  vendedorId: string,
  competencia: string,
  categorias: MetasPorCategoria,
): Promise<void> {
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
  const snap = await getDoc(metaDoc(vendedorId, competencia))
  return snap.exists() ? (snap.data() as MetasVendedor) : null
}

/** Busca metas de vários vendedores em paralelo (1 doc get por vendedor). */
export async function buscarMetasDeVarios(
  vendedorIds: string[],
  competencia: string,
): Promise<Map<string, MetasVendedor>> {
  const resultados = await Promise.all(vendedorIds.map((id) => buscarMetas(id, competencia)))
  const mapa = new Map<string, MetasVendedor>()
  vendedorIds.forEach((id, i) => {
    if (resultados[i]) mapa.set(id, resultados[i])
  })
  return mapa
}

/** Cria/atualiza a meta da loja para uma competência ("YYYY-MM"). */
export async function salvarMetaLoja(
  competencia: string,
  categorias: MetasPorCategoria,
): Promise<void> {
  await setDoc(
    metaLojaDoc(competencia),
    { competencia, categorias, updatedAt: serverTimestamp() },
    { merge: true },
  )
}

export async function buscarMetaLoja(competencia: string): Promise<MetasLoja | null> {
  const snap = await getDoc(metaLojaDoc(competencia))
  return snap.exists() ? (snap.data() as MetasLoja) : null
}
