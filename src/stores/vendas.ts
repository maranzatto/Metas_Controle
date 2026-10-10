import { ref } from 'vue'
import { defineStore } from 'pinia'
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
  const lista = ref<Venda[]>([])
  const carregando = ref(false)

  async function carregar(intervalo: Intervalo) {
    carregando.value = true
    try {
      lista.value = await listarVendas(intervalo)
    } finally {
      carregando.value = false
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
