import admin from 'firebase-admin'

const projectId = process.env.FIREBASE_PROJECT_ID
if (!projectId) {
  throw new Error('Defina FIREBASE_PROJECT_ID antes de executar a migração.')
}

admin.initializeApp({ projectId })

const db = admin.firestore()

function log(message, details = {}) {
  console.log(JSON.stringify({ message, ...details }, null, 2))
}

async function migrate() {
  const snapshot = await db.collection('vendedores').get()
  const pending = []

  for (const vendedorDoc of snapshot.docs) {
    const vendedor = vendedorDoc.data()
    if (vendedor.uid) continue

    const metasSnap = await db.collection('vendedores').doc(vendedorDoc.id).collection('metas').get()
    for (const metaDoc of metasSnap.docs) {
      const meta = metaDoc.data()
      if (meta && !meta.uid) {
        pending.push({
          collection: `vendedores/${vendedorDoc.id}/metas`,
          docId: metaDoc.id,
          reason: 'Metadado legado sem uid, depende do proprietário do vendedor',
        })
      }
    }
  }

  const vendasSnap = await db.collection('vendas').get()
  const vendasParaAtualizar = []
  const vendasPendentes = []

  for (const vendaDoc of vendasSnap.docs) {
    const venda = vendaDoc.data()
    if (venda.uid) continue

    const vendedorId = venda.vendedorId
    if (!vendedorId) {
      vendasPendentes.push({ docId: vendaDoc.id, reason: 'Sem vendedorId para inferir propriedade' })
      continue
    }

    const vendedorDoc = await db.collection('vendedores').doc(vendedorId).get()
    if (!vendedorDoc.exists || !vendedorDoc.data()?.uid) {
      vendasPendentes.push({ docId: vendaDoc.id, reason: 'Vendedor dono não existe ou também está sem uid' })
      continue
    }

    vendasParaAtualizar.push({
      docId: vendaDoc.id,
      uid: vendedorDoc.data().uid,
    })
  }

  if (pending.length || vendasPendentes.length) {
    log('Documentos legados sem uid que exigem revisão manual', {
      pending,
      vendasPendentes,
    })
    throw new Error('Há documentos legados sem uid e com propriedade não determinável automaticamente. Revisão manual obrigatória.')
  }

  for (const item of vendasParaAtualizar) {
    await db.collection('vendas').doc(item.docId).update({ uid: item.uid })
    log('Atualizou uid da venda', { docId: item.docId, uid: item.uid })
  }

  const vendedoresSemUid = []
  for (const vendedorDoc of snapshot.docs) {
    if (!vendedorDoc.data().uid) {
      vendedoresSemUid.push(vendedorDoc.id)
    }
  }

  if (vendedoresSemUid.length > 0) {
    log('Vendedores sem uid precisam de atribuição manual por e-mail ou identidade externa', {
      vendedoresSemUid,
    })
  }

  log('Migração concluída com sucesso. Nenhum documento foi atribuído de forma arbitrária.', {
    vendasAtualizadas: vendasParaAtualizar.length,
  })
}

try {
  await migrate()
} catch (error) {
  console.error('Erro durante a migração:', error)
  process.exitCode = 1
}
