<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CATEGORIA_LABELS } from '@/constants/categorias'
import { useAuthStore } from '@/stores/auth'
import { useVendedoresStore } from '@/stores/vendedores'
import { competenciaAtual, formatarData, toDateInput } from '@/utils/date'
import { formatarCompetencia, formatarMoeda, formatarPercentual } from '@/utils/format'
import type { Periodo } from '@/utils/metas'
import { useResultados } from '@/features/metas/composables/useResultados'
import BaseInput from '@/components/ui/BaseInput.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import AreaChart from '@/components/charts/AreaChart.vue'
import BarsCompare from '@/components/charts/BarsCompare.vue'
import DonutChart from '@/components/charts/DonutChart.vue'

const auth = useAuthStore()
const vendedoresStore = useVendedoresStore()

// Dashboard: visão loja com todos os vendedores ativos; período alternável.
const periodo = ref<Periodo>('mes')
const dataRef = ref(toDateInput(new Date()))
const competencia = ref(competenciaAtual())
const idsAtivos = ref<string[]>([])

// A Home é sempre visão loja: usa a meta global da loja quando existir.
const usarMetaLoja = ref(true)
const { linhas, vendas, carregando, erro, intervalo, competenciaEfetiva } = useResultados(
  periodo,
  dataRef,
  competencia,
  idsAtivos,
  usarMetaLoja,
)

const PERIODOS: { valor: Periodo; label: string }[] = [
  { valor: 'dia', label: 'Dia' },
  { valor: 'semana', label: 'Semana' },
  { valor: 'mes', label: 'Mês' },
]

const CORES = ['#315f7e', '#168a9a', '#548b7c', '#73899b', '#a0a9b5', '#4f8795', '#7f927a']

/* ---- KPIs (todos em R$, pois as metas são monetárias) ---- */
const totalValor = computed(() => vendas.value.reduce((acc, v) => acc + (v.valor ?? 0), 0))
const ticketMedio = computed(() => (vendas.value.length ? totalValor.value / vendas.value.length : 0))
const atingimentoMedio = computed(() => {
  const finitos = linhas.value.filter((l) => Number.isFinite(l.percentual))
  if (!finitos.length) return 0
  return finitos.reduce((acc, l) => acc + l.percentual, 0) / finitos.length
})

// Σ das metas 100% já proporcionais ao período (dia/semana/mês).
const metaPeriodo = computed(() => linhas.value.reduce((acc, l) => acc + l.meta100, 0))
// Referência diária para a linha do gráfico: meta do período ÷ dias do período.
const metaDiaria = computed(() =>
  vendasPorDia.value.length ? metaPeriodo.value / vendasPorDia.value.length : 0,
)

const FAIXAS = [
  { chave: 'acima100', label: 'Categorias em 100%+', dot: 'bg-emerald-500', texto: 'text-emerald-600', fundo: 'bg-emerald-50' },
  { chave: 'entre80e100', label: 'Entre 80% e 100%', dot: 'bg-amber-400', texto: 'text-amber-600', fundo: 'bg-amber-50' },
  { chave: 'abaixo80', label: 'Abaixo de 80%', dot: 'bg-rose-500', texto: 'text-rose-600', fundo: 'bg-rose-50' },
] as const

const porFaixa = computed(() => ({
  acima100: linhas.value.filter((l) => l.faixa === 'acima100').length,
  entre80e100: linhas.value.filter((l) => l.faixa === 'entre80e100').length,
  abaixo80: linhas.value.filter((l) => l.faixa === 'abaixo80').length,
}))

/* ---- gráficos ---- */
const barras = computed(() =>
  linhas.value.map((l) => ({
    label: CATEGORIA_LABELS[l.categoria],
    realizado: l.realizado,
    meta: l.meta100,
  })),
)

const donut = computed(() =>
  linhas.value.map((l, i) => ({
    label: CATEGORIA_LABELS[l.categoria],
    value: l.realizado,
    color: CORES[i % CORES.length],
  })),
)

// Vendas (R$) agrupadas por dia dentro do período selecionado.
const vendasPorDia = computed(() => {
  const mapa = new Map<string, number>()
  for (const v of vendas.value) {
    const dia = toDateInput(v.data.toDate())
    mapa.set(dia, (mapa.get(dia) ?? 0) + (v.valor ?? 0))
  }
  const pts: { label: string; value: number }[] = []
  const d = new Date(intervalo.value.inicio)
  while (d < intervalo.value.fim) {
    pts.push({
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: mapa.get(toDateInput(d)) ?? 0,
    })
    d.setDate(d.getDate() + 1)
  }
  return pts
})

// Ranking por valor vendido (R$).
const ranking = computed(() => {
  const totais = new Map<string, number>()
  for (const v of vendas.value)
    totais.set(v.vendedorId, (totais.get(v.vendedorId) ?? 0) + (v.valor ?? 0))
  return [...totais.entries()]
    .map(([id, total]) => ({ nome: vendedoresStore.porId.get(id)?.nome ?? '—', total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
})

const MEDALHAS = [
  'bg-gradient-to-br from-amber-300 to-yellow-500',
  'bg-gradient-to-br from-slate-200 to-slate-400',
  'bg-gradient-to-br from-orange-300 to-amber-600',
]

onMounted(async () => {
  await vendedoresStore.carregar()
  idsAtivos.value = vendedoresStore.ativos.map((v) => v.id)
})
</script>

<template>
  <div class="space-y-5">
    <!-- Barra superior: saudação + período -->
    <section
      class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-sm"
    >
      <p class="min-w-0 text-sm text-brand-900/70">
        Olá, <strong class="text-brand-950">{{ auth.email }}</strong
        ><br class="sm:hidden" />
        <span class="text-brand-900/50">
          · {{ formatarData(intervalo.inicio) }} – {{ formatarData(intervalo.fim) }} · metas de
          {{ formatarCompetencia(competenciaEfetiva) }}{{ periodo !== 'mes' ? ' (proporcionais)' : '' }}
        </span>
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex rounded-xl bg-brand-100/70 p-1">
          <button
            v-for="p in PERIODOS"
            :key="p.valor"
            class="cursor-pointer rounded-lg px-4 py-1.5 text-sm font-bold transition-all duration-200"
            :class="
              periodo === p.valor
                ? 'bg-brand-700 text-white shadow-sm'
                : 'text-brand-700/70 hover:text-brand-800'
            "
            @click="periodo = p.valor"
          >
            {{ p.label }}
          </button>
        </div>
        <BaseInput v-if="periodo !== 'mes'" v-model="dataRef" type="date" class="w-36" required />
        <BaseInput v-else v-model="competencia" type="month" class="w-40" required />
      </div>
    </section>

    <p v-if="erro" class="text-sm font-medium text-rose-600">{{ erro }}</p>

    <!-- KPIs -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        class="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/10"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"
          >
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <p class="text-sm font-medium text-brand-900/60">Valor vendido</p>
        </div>
        <p class="mt-3 truncate text-2xl font-extrabold text-brand-950 sm:text-3xl">
          {{ formatarMoeda(totalValor) }}
        </p>
      </div>

      <div
        class="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/10"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700"
          >
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>
          </div>
          <p class="text-sm font-medium text-brand-900/60">Ticket médio</p>
        </div>
        <p class="mt-3 truncate text-2xl font-extrabold text-brand-950 sm:text-3xl">
          {{ formatarMoeda(ticketMedio) }}
        </p>
      </div>

      <div
        class="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/10"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800"
          >
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>
          </div>
          <p class="text-sm font-medium text-brand-900/60">Atingimento médio</p>
        </div>
        <p class="mt-3 text-2xl font-extrabold text-brand-950 sm:text-3xl">
          {{ formatarPercentual(atingimentoMedio) }}
        </p>
      </div>

      <div
        class="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/10"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700"
          >
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <p class="text-sm font-medium text-brand-900/60">Meta do período</p>
        </div>
        <p class="mt-3 truncate text-2xl font-extrabold text-brand-950 sm:text-3xl">
          {{ formatarMoeda(metaPeriodo) }}
        </p>
      </div>
    </div>

    <p v-if="carregando" class="text-sm text-brand-300">Carregando…</p>

    <template v-else>
      <!-- Realizado × Meta — largura total -->
      <section class="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 class="mb-5 font-bold text-brand-950">Realizado × Meta por categoria</h2>
        <BarsCompare :items="barras" :format="formatarMoeda" />
      </section>

      <!-- Distribuição 50% + Atingimento 50% -->
      <div class="grid gap-5 lg:grid-cols-2">
        <section class="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 class="mb-5 font-bold text-brand-950">Distribuição por categoria</h2>
          <DonutChart :items="donut" :format="formatarMoeda" />
        </section>

        <section class="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="font-bold text-brand-950">Atingimento por categoria</h2>
            <RouterLink
              to="/metas"
              class="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
            >
              Ver detalhes →
            </RouterLink>
          </div>

          <p v-if="linhas.length === 0" class="py-4 text-sm text-brand-300">
            Cadastre vendedores e metas para ver os indicadores.
          </p>
          <ul v-else class="space-y-4">
            <li v-for="(l, i) in linhas" :key="i" class="space-y-1.5 text-sm">
              <div class="flex flex-wrap items-baseline justify-between gap-x-2">
                <span class="font-medium text-brand-950/80">
                  {{ CATEGORIA_LABELS[l.categoria] }}
                </span>
                <span class="text-right">
                  <strong class="text-brand-950">{{ formatarMoeda(l.realizado) }}</strong>
                  <span class="text-brand-300"> / {{ formatarMoeda(l.meta100) }}</span>
                  <span class="ml-1 text-xs font-semibold text-brand-500">
                    {{ formatarPercentual(l.percentual) }}
                  </span>
                </span>
              </div>
              <ProgressBar :percentual="l.percentual" :faixa="l.faixa" />
            </li>
          </ul>
        </section>
      </div>

      <!-- Ranking 50% + Semáforo 50% -->
      <div class="grid gap-5 lg:grid-cols-2">
        <section class="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h2 class="mb-4 font-bold text-brand-950">Ranking (R$)</h2>
          <p v-if="!ranking.length" class="text-sm text-brand-300">Sem vendas no período.</p>
          <ol v-else class="space-y-2 text-sm">
            <li
              v-for="(r, i) in ranking"
              :key="i"
              class="flex items-center gap-3 rounded-xl bg-brand-50/60 px-3 py-2.5 transition hover:bg-brand-50"
            >
              <span
                class="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white"
                :class="MEDALHAS[i] ?? 'bg-gradient-to-br from-brand-300 to-brand-500'"
              >
                {{ i + 1 }}
              </span>
              <span class="min-w-0 flex-1 truncate font-medium text-brand-950">{{ r.nome }}</span>
              <strong class="shrink-0 text-brand-700">{{ formatarMoeda(r.total) }}</strong>
            </li>
          </ol>
        </section>

        <section class="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h2 class="mb-4 font-bold text-brand-950">Semáforo de metas</h2>
          <ul class="space-y-2">
            <li
              v-for="f in FAIXAS"
              :key="f.chave"
              class="flex items-center justify-between rounded-xl px-3 py-2.5"
              :class="f.fundo"
            >
              <span class="flex items-center gap-2 text-sm font-medium text-brand-950/70">
                <span class="size-2.5 rounded-full" :class="f.dot" />
                {{ f.label }}
              </span>
              <strong class="text-lg" :class="f.texto">{{ porFaixa[f.chave] }}</strong>
            </li>
          </ul>
        </section>
      </div>

      <!-- Evolução diária — largura total -->
      <section
        v-if="vendasPorDia.length > 1"
        class="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6"
      >
        <h2 class="mb-5 font-bold text-brand-950">Vendas por dia (R$)</h2>
        <AreaChart :points="vendasPorDia" :meta="metaDiaria" :format="formatarMoeda" />
      </section>
    </template>
  </div>
</template>
