<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CATEGORIA_LABELS } from '@/constants/categorias'
import { useVendedoresStore } from '@/stores/vendedores'
import { competenciaAtual, formatarData, toDateInput } from '@/utils/date'
import { formatarCompetencia, formatarMoeda, formatarPercentual } from '@/utils/format'
import type { Periodo } from '@/utils/metas'
import { useResultados } from './composables/useResultados'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'

const vendedoresStore = useVendedoresStore()

const periodo = ref<Periodo>('mes')
const dataRef = ref(toDateInput(new Date()))
const competencia = ref(competenciaAtual())

type Visao = 'loja' | 'vendedor'
const visao = ref<Visao>('loja')
const vendedorId = ref('')
const selecionadosLoja = ref<string[]>([])

const vendedorIdsEfetivos = computed(() =>
  visao.value === 'vendedor'
    ? vendedorId.value
      ? [vendedorId.value]
      : []
    : selecionadosLoja.value,
)

const usarMetaLoja = computed(() => visao.value === 'loja')

const { linhas, carregando, erro, intervalo, competenciaEfetiva } = useResultados(
  periodo,
  dataRef,
  competencia,
  vendedorIdsEfetivos,
  usarMetaLoja,
)

onMounted(async () => {
  await vendedoresStore.carregar()
  selecionadosLoja.value = vendedoresStore.ativos.map((v) => v.id)
})

const PERIODOS: { valor: Periodo; label: string }[] = [
  { valor: 'dia', label: 'Dia' },
  { valor: 'semana', label: 'Semana' },
  { valor: 'mes', label: 'Mês' },
]

const VISAO_OPCOES: { valor: Visao; label: string }[] = [
  { valor: 'loja', label: 'Loja' },
  { valor: 'vendedor', label: 'Vendedor' },
]

const FAIXA_TEXTO = {
  abaixo80: 'text-rose-600',
  entre80e100: 'text-amber-600',
  acima100: 'text-emerald-600',
} as const
</script>

<template>
  <div class="space-y-5">
    <!-- Filtros -->
    <section class="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
      <div class="flex flex-wrap items-end gap-4">
        <div class="flex rounded-xl bg-brand-100/70 p-1">
          <button
            v-for="p in PERIODOS"
            :key="p.valor"
            class="cursor-pointer rounded-lg px-4 py-1.5 text-sm font-bold transition-all duration-200"
            :class="
              periodo === p.valor
                ? 'bg-gradient-to-r from-brand-700 to-fuchsia-600 text-white shadow-md shadow-brand-500/30'
                : 'text-brand-700/70 hover:text-brand-800'
            "
            @click="periodo = p.valor"
          >
            {{ p.label }}
          </button>
        </div>

        <BaseInput v-if="periodo !== 'mes'" v-model="dataRef" label="Data de referência" type="date" required />
        <BaseInput v-else v-model="competencia" label="Mês de referência" type="month" required />

        <div class="flex rounded-xl bg-brand-100/70 p-1">
          <button
            v-for="o in VISAO_OPCOES"
            :key="o.valor"
            class="cursor-pointer rounded-lg px-4 py-1.5 text-sm font-bold transition-all duration-200"
            :class="
              visao === o.valor
                ? 'bg-gradient-to-r from-brand-700 to-fuchsia-600 text-white shadow-md shadow-brand-500/30'
                : 'text-brand-700/70 hover:text-brand-800'
            "
            @click="visao = o.valor"
          >
            {{ o.label }}
          </button>
        </div>

        <!-- multiselect + edição da meta da loja -->
        <template v-if="visao === 'loja'">
          <RouterLink
            :to="{ name: 'metas-loja' }"
            class="rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-2.5 text-sm font-semibold text-brand-800 transition hover:border-brand-400 hover:bg-brand-100"
          >
            Editar meta da loja
          </RouterLink>
          <details class="relative text-sm">
          <summary
            class="cursor-pointer list-none rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-2.5 font-semibold text-brand-800 transition hover:border-brand-400"
          >
            Vendedores · {{ selecionadosLoja.length }}/{{ vendedoresStore.lista.length }}
          </summary>
          <div
            class="animate-fade-up absolute z-10 mt-2 max-h-56 w-60 overflow-y-auto rounded-xl border border-brand-100 bg-white p-2 shadow-xl shadow-brand-950/10"
          >
            <label
              v-for="v in vendedoresStore.lista"
              :key="v.id"
              class="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 transition hover:bg-brand-50"
            >
              <input
                v-model="selecionadosLoja"
                type="checkbox"
                :value="v.id"
                class="size-4 accent-brand-700"
              />
              {{ v.nome }}
            </label>
          </div>
          </details>
        </template>

        <BaseSelect v-else v-model="vendedorId" label="Vendedor">
          <option value="" disabled>Selecione…</option>
          <option v-for="v in vendedoresStore.lista" :key="v.id" :value="v.id">
            {{ v.nome }}
          </option>
        </BaseSelect>
      </div>

      <p class="mt-4 text-xs text-brand-900/50">
        Período: {{ formatarData(intervalo.inicio) }} – {{ formatarData(intervalo.fim) }} (fim
        exclusivo) · Metas de {{ formatarCompetencia(competenciaEfetiva) }}
        {{ periodo !== 'mes' ? '(proporcionais ao período)' : '' }}
      </p>
    </section>

    <p v-if="erro" class="text-sm font-medium text-rose-600">{{ erro }}</p>

    <!-- Resultado -->
    <section
      class="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm shadow-brand-100"
    >
      <table class="w-full min-w-[640px] text-sm">
        <thead>
          <tr class="border-b border-brand-100 bg-brand-50/60 text-left">
            <th class="px-3 py-3 sm:px-5 sm:py-3.5 text-xs font-bold tracking-wider text-brand-900/60 uppercase">Categoria</th>
            <th class="px-3 py-3 sm:px-5 sm:py-3.5 text-right text-xs font-bold tracking-wider text-brand-900/60 uppercase">Realizado</th>
            <th class="px-3 py-3 sm:px-5 sm:py-3.5 text-right text-xs font-bold tracking-wider text-brand-900/60 uppercase">Meta 80%</th>
            <th class="px-3 py-3 sm:px-5 sm:py-3.5 text-right text-xs font-bold tracking-wider text-brand-900/60 uppercase">Meta 100%</th>
            <th class="px-3 py-3 sm:px-5 sm:py-3.5 text-right text-xs font-bold tracking-wider text-brand-900/60 uppercase">% Atingido</th>
            <th class="w-52 px-3 py-3 sm:px-5 sm:py-3.5 text-xs font-bold tracking-wider text-brand-900/60 uppercase">Progresso</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="carregando">
            <td colspan="6" class="px-5 py-10 text-center text-brand-300">Carregando…</td>
          </tr>
          <tr v-else-if="linhas.length === 0">
            <td colspan="6" class="px-5 py-10 text-center text-brand-300">
              Selecione ao menos um vendedor.
            </td>
          </tr>
          <tr
            v-for="l in linhas"
            v-else
            :key="l.categoria"
            class="border-b border-brand-50 transition-colors last:border-0 hover:bg-brand-50/50"
          >
            <td class="px-3 py-3 sm:px-5 sm:py-3.5 font-semibold text-brand-950">
              {{ CATEGORIA_LABELS[l.categoria] }}
            </td>
            <td class="px-3 py-3 sm:px-5 sm:py-3.5 text-right font-bold">{{ formatarMoeda(l.realizado) }}</td>
            <td class="px-3 py-3 sm:px-5 sm:py-3.5 text-right text-brand-900/60">{{ formatarMoeda(l.meta80) }}</td>
            <td class="px-3 py-3 sm:px-5 sm:py-3.5 text-right text-brand-900/60">{{ formatarMoeda(l.meta100) }}</td>
            <td class="px-3 py-3 sm:px-5 sm:py-3.5 text-right font-extrabold" :class="FAIXA_TEXTO[l.faixa]">
              {{ formatarPercentual(l.percentual) }}
            </td>
            <td class="px-3 py-3 sm:px-5 sm:py-3.5">
              <ProgressBar :percentual="l.percentual" :faixa="l.faixa" />
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
