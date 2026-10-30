<<<<<<< HEAD
import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth'
=======
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
>>>>>>> fd676deb5e8cac857d419617d908a0ff5fbfa9b1
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
<<<<<<< HEAD
  const auth = useAuthStore()
=======
>>>>>>> fd676deb5e8cac857d419617d908a0ff5fbfa9b1
  const lista = ref<Vendedor[]>([])
  const carregando = ref(false)
  const carregado = ref(false)

  const ativos = computed(() => lista.value.filter((v) => v.ativo))
  const porId = computed(() => new Map(lista.value.map((v) => [v.id, v])))

<<<<<<< HEAD
  watch(
    () => auth.user?.uid,
    () => {
      lista.value = []
      carregado.value = false
    },
  )

  async function carregar(force = false) {
    if (carregado.value && !force) return
    await auth.whenReady()
    const uid = auth.user?.uid
    if (!uid) {
      lista.value = []
      carregado.value = false
      return
    }
    carregando.value = true
    try {
      const resultado = await listarVendedores()
      if (auth.user?.uid === uid) {
        lista.value = resultado
        carregado.value = true
      }
    } finally {
      if (auth.user?.uid === uid) carregando.value = false
=======
  async function carregar(force = false) {
    if (carregado.value && !force) return
    carregando.value = true
    try {
      lista.value = await listarVendedores()
      carregado.value = true
    } finally {
      carregando.value = false
>>>>>>> fd676deb5e8cac857d419617d908a0ff5fbfa9b1
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
