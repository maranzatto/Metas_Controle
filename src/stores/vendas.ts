<<<<<<< HEAD
import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth'
=======
import { ref } from 'vue'
import { defineStore } from 'pinia'
>>>>>>> fd676deb5e8cac857d419617d908a0ff5fbfa9b1
import type { Venda } from '@/types'
import type { Intervalo } from '@/utils/date'
import {
  atualizarVenda,
  criarVenda,
  excluirVenda,
  listarVendas,
  type VendaInput,
} from '@/services/vendas.service'

export const useVendasStore = defineStore('vendas', () => {
<<<<<<< HEAD
  const auth = useAuthStore()
  const lista = ref<Venda[]>([])
  const carregando = ref(false)

  watch(
    () => auth.user?.uid,
    () => {
      lista.value = []
      carregando.value = false
    },
  )

  async function carregar(intervalo: Intervalo) {
    await auth.whenReady()
    const uid = auth.user?.uid
    if (!uid) {
      lista.value = []
      return
    }
    carregando.value = true
    try {
      const resultado = await listarVendas(intervalo)
      if (auth.user?.uid === uid) lista.value = resultado
    } finally {
      if (auth.user?.uid === uid) carregando.value = false
=======
  const lista = ref<Venda[]>([])
  const carregando = ref(false)

  async function carregar(intervalo: Intervalo) {
    carregando.value = true
    try {
      lista.value = await listarVendas(intervalo)
    } finally {
      carregando.value = false
>>>>>>> fd676deb5e8cac857d419617d908a0ff5fbfa9b1
    }
  }

  async function criar(input: VendaInput, intervalo: Intervalo) {
    await criarVenda(input)
    await carregar(intervalo)
  }

  async function atualizar(id: string, input: VendaInput, intervalo: Intervalo) {
    await atualizarVenda(id, input)
    await carregar(intervalo)
  }

  async function excluir(id: string, intervalo: Intervalo) {
    await excluirVenda(id)
    await carregar(intervalo)
  }

  return { lista, carregando, carregar, criar, atualizar, excluir }
})
