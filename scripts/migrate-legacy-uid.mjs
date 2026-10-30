import { readFile } from 'node:fs/promises'
import path from 'node:path'
import admin from 'firebase-admin'

const projectId = process.env.FIREBASE_PROJECT_ID
if (!projectId) {
  throw new Error('Defina FIREBASE_PROJECT_ID antes de executar a migração.')
}

const mappingFile = process.env.OWNER_UID_MAP_FILE
const mappings = mappingFile
  ? JSON.parse(await readFile(path.resolve(mappingFile), 'utf8'))
  : {}
const applyChanges = process.argv.includes('--apply')

admin.initializeApp({ projectId })
const db = admin.firestore()

function log(message, details = {}) {
  console.log(JSON.stringify({ message, ...details }, null, 2))
}

function mappedOwner(collection, id) {
  const value = mappings[collection]?.[id]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function resolveOwner(data, collection, id) {
  if (data.ownerUid && data.uid && data.ownerUid !== data.uid) {
    return { error: 'uid legado diverge de ownerUid existente' }
  }
  const knownOwner = data.ownerUid || data.uid
  const mapped = mappedOwner(collection, id)
  if (knownOwner && mapped && knownOwner !== mapped) {
    return { error: `Mapeamento conflita com ownerUid/uid existente (${knownOwner})` }
  }
  return { ownerUid: knownOwner || mapped, removeLegacyUid: Boolean(data.uid) }
}

async function migrate() {
  const vendedorSnapshot = await db.collection('vendedores').get()
  const vendedorOwners = new Map()
  const vendedoresParaAtualizar = []
  const pendencias = []

  for (const vendedorDoc of vendedorSnapshot.docs) {
    const data = vendedorDoc.data()
    const result = resolveOwner(data, 'vendedores', vendedorDoc.id)
    if (result.error) {
      pendencias.push({ collection: 'vendedores', docId: vendedorDoc.id, reason: result.error })
      continue
    }
    if (!result.ownerUid) {
      pendencias.push({
        collection: 'vendedores',
        docId: vendedorDoc.id,
        reason: 'Proprietário exige mapeamento manual comprovado',
      })
      continue
    }
    vendedorOwners.set(vendedorDoc.id, result.ownerUid)
    if (!data.ownerUid || result.removeLegacyUid) {
      vendedoresParaAtualizar.push({
        ref: vendedorDoc.ref,
        ownerUid: result.ownerUid,
        removeLegacyUid: result.removeLegacyUid,
      })
    }
  }

  const vendaSnapshot = await db.collection('vendas').get()
  const vendasParaAtualizar = []
  for (const vendaDoc of vendaSnapshot.docs) {
    const data = vendaDoc.data()
    const result = resolveOwner(data, 'vendas', vendaDoc.id)
    if (result.error) {
      pendencias.push({ collection: 'vendas', docId: vendaDoc.id, reason: result.error })
      continue
    }

    const sellerOwner = data.vendedorId ? vendedorOwners.get(data.vendedorId) : undefined
    if (!sellerOwner) {
      pendencias.push({
        collection: 'vendas',
        docId: vendaDoc.id,
        reason: 'Vendedor ausente ou sem proprietário comprovado',
      })
      continue
    }
    if (result.ownerUid && result.ownerUid !== sellerOwner) {
      pendencias.push({
        collection: 'vendas',
        docId: vendaDoc.id,
        reason: 'Proprietário da venda diverge do proprietário do vendedor',
      })
      continue
    }
    if (!data.ownerUid || result.removeLegacyUid) {
      vendasParaAtualizar.push({
        ref: vendaDoc.ref,
        ownerUid: result.ownerUid || sellerOwner,
        removeLegacyUid: result.removeLegacyUid,
      })
    }
  }

  const metasLojaSnapshot = await db.collection('metasLoja').get()
  const metasLojaParaAtualizar = []
  for (const metaDoc of metasLojaSnapshot.docs) {
    const data = metaDoc.data()
    const result = resolveOwner(data, 'metasLoja', metaDoc.id)
    if (result.error) {
      pendencias.push({ collection: 'metasLoja', docId: metaDoc.id, reason: result.error })
      continue
    }
    if (!result.ownerUid) {
      pendencias.push({
        collection: 'metasLoja',
        docId: metaDoc.id,
        reason: 'Proprietário exige mapeamento manual comprovado',
      })
      continue
    }
    if (!data.ownerUid || result.removeLegacyUid) {
      metasLojaParaAtualizar.push({
        ref: metaDoc.ref,
        ownerUid: result.ownerUid,
        removeLegacyUid: result.removeLegacyUid,
      })
    }
  }

  if (pendencias.length > 0) {
    log('Migração interrompida: propriedade não comprovada ou inconsistência encontrada.', {
      pendencias,
    })
    throw new Error('Nenhum documento foi alterado. Resolva as pendências com evidências antes de executar novamente.')
  }

  const updates = [...vendedoresParaAtualizar, ...vendasParaAtualizar, ...metasLojaParaAtualizar]
  log(applyChanges ? 'Pré-validação concluída; aplicando somente ownerUid ausente.' : 'Prévia concluída; nenhuma alteração foi aplicada.', {
    documentos: updates.length,
    vendedores: vendedoresParaAtualizar.length,
    vendas: vendasParaAtualizar.length,
    metasLoja: metasLojaParaAtualizar.length,
  })

  if (!applyChanges) return

  for (let offset = 0; offset < updates.length; offset += 400) {
    const batch = db.batch()
    for (const update of updates.slice(offset, offset + 400)) {
      batch.update(update.ref, {
        ownerUid: update.ownerUid,
        ...(update.removeLegacyUid ? { uid: admin.firestore.FieldValue.delete() } : {}),
      })
    }
    await batch.commit()
  }

  log('Migração concluída.', { documentosAtualizados: updates.length })
}

try {
  await migrate()
} catch (error) {
  console.error('Erro durante a migração:', error)
  process.exitCode = 1
}
