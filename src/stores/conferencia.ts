import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { expandirCaixaIccid, ICCIDS_PER_PACKAGE, normalizarIccid } from '@/utils/iccid'

export interface GrupoChips {
  id: string
  caixaId: string
  tipo: 'planilha' | 'caixa'
  titulo: string
  iccids: string[]
}

type ResultadoLeitura = 'conferido' | 'duplicado' | 'fora-lista' | 'invalido'

interface EstadoPersistido {
  grupos: GrupoChips[]
  conferidos: Record<string, string>
}

const CHAVE = 'painel-vivo:conferencia-chips'

export const useConferenciaStore = defineStore('conferencia', () => {
  const uid = ref<string | null>(null)
  const grupos = ref<GrupoChips[]>([])
  const conferidos = ref<Record<string, string>>({})
  const avisoPersistencia = ref('')
  const ultimaLeitura = ref<{ iccid: string | null; resultado: ResultadoLeitura } | null>(null)

  const iccids = computed(() => grupos.value.flatMap((grupo) => grupo.iccids))
  const total = computed(() => iccids.value.length)
  const totalConferidos = computed(() => iccids.value.filter((iccid) => conferidos.value[iccid]).length)
  const pendentes = computed(() => total.value - totalConferidos.value)
  const percentual = computed(() => (total.value ? (totalConferidos.value / total.value) * 100 : 0))

  function persistir() {
    if (!uid.value) return
    try {
      const dados: EstadoPersistido = {
        grupos: grupos.value,
        conferidos: conferidos.value,
      }
      localStorage.setItem(`${CHAVE}:${uid.value}`, JSON.stringify(dados))
      avisoPersistencia.value = ''
    } catch {
      avisoPersistencia.value = 'Não foi possível salvar neste navegador. Exporte a conferência para não perder os dados.'
    }
  }

  function carregar(usuarioUid: string | null) {
    uid.value = usuarioUid
    grupos.value = []
    conferidos.value = {}
    ultimaLeitura.value = null
    avisoPersistencia.value = ''
    if (!usuarioUid) return

    try {
      const salvo = localStorage.getItem(`${CHAVE}:${usuarioUid}`)
      if (!salvo) return
      const dados = JSON.parse(salvo) as EstadoPersistido
      if (!Array.isArray(dados.grupos) || !dados.conferidos || typeof dados.conferidos !== 'object') {
        throw new Error('Dados inválidos')
      }
      grupos.value = dados.grupos.filter(
        (grupo) =>
          grupo &&
          typeof grupo.id === 'string' &&
          typeof grupo.caixaId === 'string' &&
          (grupo.tipo === 'caixa' || grupo.tipo === 'planilha') &&
          typeof grupo.titulo === 'string' &&
          Array.isArray(grupo.iccids) &&
          grupo.iccids.every((iccid) => normalizarIccid(iccid) === iccid),
      )
      const esperados = new Set(iccids.value)
      conferidos.value = Object.fromEntries(
        Object.entries(dados.conferidos).filter(
          ([iccid, data]) => esperados.has(iccid) && typeof data === 'string',
        ),
      )
    } catch {
      grupos.value = []
      conferidos.value = {}
      avisoPersistencia.value = 'Os dados salvos da conferência estão inválidos e não foram carregados.'
    }
  }

  function adicionarColagem(conteudo: string) {
    const tokens = conteudo.split(/[\s,;]+/).filter(Boolean)
    const existentes = new Set(iccids.value)
    const novos = new Set<string>()
    let invalidos = 0
    let duplicados = 0

    for (const token of tokens) {
      const iccid = normalizarIccid(token)
      if (!iccid) {
        invalidos += 1
      } else if (existentes.has(iccid) || novos.has(iccid)) {
        duplicados += 1
      } else {
        novos.add(iccid)
      }
    }

    const lista = [...novos]
    if (lista.length) {
      const id = crypto.randomUUID()
      grupos.value.push({
        id,
        caixaId: id,
        tipo: 'planilha',
        titulo: `Importação ${grupos.value.filter((grupo) => grupo.tipo === 'planilha').length + 1}`,
        iccids: lista,
      })
      persistir()
    }

    return { adicionados: lista.length, duplicados, invalidos }
  }

  function adicionarCaixa(inicio: string, fim: string) {
    const numeros = expandirCaixaIccid(inicio, fim)
    const existentes = new Set(iccids.value)
    if (numeros.some((iccid) => existentes.has(iccid))) {
      throw new Error('Esta caixa contém ICCIDs que já estão na conferência. Nenhum item foi adicionado.')
    }

    const id = crypto.randomUUID()
    const numeroCaixa = grupos.value.filter((grupo) => grupo.tipo === 'caixa').length / 10 + 1
    for (let pacote = 0; pacote < 10; pacote += 1) {
      const inicioPacote = pacote * ICCIDS_PER_PACKAGE
      grupos.value.push({
        id: `${id}-${pacote + 1}`,
        caixaId: id,
        tipo: 'caixa',
        titulo: `Caixa ${numeroCaixa} · pacote ${pacote + 1}/10`,
        iccids: numeros.slice(inicioPacote, inicioPacote + ICCIDS_PER_PACKAGE),
      })
    }
    persistir()
    return { adicionados: numeros.length }
  }

  function registrarLeitura(entrada: string): ResultadoLeitura {
    const iccid = normalizarIccid(entrada)
    if (!iccid) {
      ultimaLeitura.value = { iccid: null, resultado: 'invalido' }
      return 'invalido'
    }
    if (!iccids.value.includes(iccid)) {
      ultimaLeitura.value = { iccid, resultado: 'fora-lista' }
      return 'fora-lista'
    }
    if (conferidos.value[iccid]) {
      ultimaLeitura.value = { iccid, resultado: 'duplicado' }
      return 'duplicado'
    }

    conferidos.value[iccid] = new Date().toISOString()
    ultimaLeitura.value = { iccid, resultado: 'conferido' }
    persistir()
    return 'conferido'
  }

  function desfazerUltimaLeitura() {
    const ultima = ultimaLeitura.value
    if (!ultima || ultima.resultado !== 'conferido' || !ultima.iccid) return false
    delete conferidos.value[ultima.iccid]
    ultimaLeitura.value = { iccid: ultima.iccid, resultado: 'invalido' }
    persistir()
    return true
  }

  function removerGrupo(id: string) {
    const grupo = grupos.value.find((item) => item.id === id)
    if (!grupo) return
    grupos.value = grupos.value.filter((item) => item.id !== id)
    const restantes = new Set(iccids.value)
    for (const iccid of grupo.iccids) {
      if (!restantes.has(iccid)) delete conferidos.value[iccid]
    }
    persistir()
  }

  function limpar() {
    grupos.value = []
    conferidos.value = {}
    ultimaLeitura.value = null
    persistir()
  }

  return {
    uid,
    grupos,
    conferidos,
    avisoPersistencia,
    ultimaLeitura,
    iccids,
    total,
    totalConferidos,
    pendentes,
    percentual,
    carregar,
    adicionarColagem,
    adicionarCaixa,
    registrarLeitura,
    desfazerUltimaLeitura,
    removerGrupo,
    limpar,
  }
})
