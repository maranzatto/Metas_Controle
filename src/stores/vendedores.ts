import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Vendedor } from '@/types'
import {
  buscarMetaLoja,
  buscarMetas,
  listarVendedores,
  salvarMetaLoja,
  salvarMetas,
  salvarVendedor,
} from '@/services/vendedores.service'

export const useVendedoresStore = defineStore('vendedores', () => {
  const lista = ref<Vendedor[]>([])
  const carregando = ref(false)
  const carregado = ref(false)

  const ativos = computed(() => lista.value.filter((v) => v.ativo))
  const porId = computed(() => new Map(lista.value.map((v) => [v.id, v])))

  async function carregar(force = false) {
    if (carregado.value && !force) return
    carregando.value = true
    try {
      lista.value = await listarVendedores()
      carregado.value = true
    } finally {
      carregando.value = false
    }
  }

  async function salvar(dados: {
    id?: string
    nome: string
    email?: string
    telefone?: string
    ativo: boolean
  }) {
    await salvarVendedor(dados)
    await carregar(true)
  }

  return {
    lista,
    ativos,
    porId,
    carregando,
    carregar,
    salvar,
    buscarMetas,
    salvarMetas,
    buscarMetaLoja,
    salvarMetaLoja,
  }
})
