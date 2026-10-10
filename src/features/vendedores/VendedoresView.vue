<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useVendedoresStore } from '@/stores/vendedores'
import type { Vendedor } from '@/types'
import BaseButton from '@/components/ui/BaseButton.vue'
import VendedorForm from './VendedorForm.vue'

const store = useVendedoresStore()
const router = useRouter()

const formAberto = ref(false)
const selecionado = ref<Vendedor | null>(null)

onMounted(() => store.carregar())

function novo() {
  selecionado.value = null
  formAberto.value = true
}

function editar(v: Vendedor) {
  selecionado.value = v
  formAberto.value = true
}

function editarMetas(v: Vendedor) {
  router.push({ name: 'vendedor-metas', params: { id: v.id } })
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-brand-900/60">
        {{ store.lista.length }} vendedor(es) cadastrado(s)
      </p>
      <BaseButton @click="novo">+ Novo vendedor</BaseButton>
    </div>

    <section
      class="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm shadow-brand-100"
    >
      <table class="w-full min-w-[560px] text-sm">
        <thead>
          <tr class="border-b border-brand-100 bg-brand-50/60 text-left">
            <th class="px-3 py-3 sm:px-5 sm:py-3.5 text-xs font-bold tracking-wider text-brand-900/60 uppercase">
              Nome
            </th>
            <th class="px-3 py-3 sm:px-5 sm:py-3.5 text-xs font-bold tracking-wider text-brand-900/60 uppercase">
              Contato
            </th>
            <th class="px-3 py-3 sm:px-5 sm:py-3.5 text-xs font-bold tracking-wider text-brand-900/60 uppercase">
              Status
            </th>
            <th class="px-3 py-3 sm:px-5 sm:py-3.5 text-right text-xs font-bold tracking-wider text-brand-900/60 uppercase">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.carregando">
            <td colspan="4" class="px-5 py-10 text-center text-brand-300">Carregando…</td>
          </tr>
          <tr v-else-if="store.lista.length === 0">
            <td colspan="4" class="px-5 py-10 text-center text-brand-300">
              Nenhum vendedor cadastrado.
            </td>
          </tr>
          <tr
            v-for="v in store.lista"
            v-else
            :key="v.id"
            class="border-b border-brand-50 transition-colors last:border-0 hover:bg-brand-50/50"
          >
            <td class="px-3 py-3 sm:px-5 sm:py-3.5">
              <div class="flex items-center gap-3">
                <span
                  class="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-fuchsia-500 text-sm font-bold text-white"
                >
                  {{ v.nome.charAt(0).toUpperCase() }}
                </span>
                <span class="font-semibold text-brand-950">{{ v.nome }}</span>
              </div>
            </td>
            <td class="px-3 py-3 sm:px-5 sm:py-3.5 text-brand-900/60">
              {{ [v.email, v.telefone].filter(Boolean).join(' · ') || '—' }}
            </td>
            <td class="px-3 py-3 sm:px-5 sm:py-3.5">
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                :class="
                  v.ativo
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-200 text-gray-500'
                "
              >
                <span
                  class="size-1.5 rounded-full"
                  :class="v.ativo ? 'bg-emerald-500' : 'bg-gray-400'"
                />
                {{ v.ativo ? 'Ativo' : 'Inativo' }}
              </span>
            </td>
            <td class="px-3 py-3 sm:px-5 sm:py-3.5 text-right whitespace-nowrap">
              <BaseButton variant="secondary" class="mr-1 !px-3 !py-1.5 text-xs" @click="editarMetas(v)">
                Metas
              </BaseButton>
              <BaseButton variant="ghost" class="!px-3 !py-1.5 text-xs" @click="editar(v)">
                Editar
              </BaseButton>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <VendedorForm :open="formAberto" :vendedor="selecionado" @close="formAberto = false" />
  </div>
</template>
