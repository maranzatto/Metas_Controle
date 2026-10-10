<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  items: { label: string; realizado: number; meta: number }[]
  format?: (n: number) => string
}>()

const W = 640
const H = 230
const TOPO = 14
const BASE = 200 // y da linha de base
const ALTURA = BASE - TOPO

const max = computed(() => Math.max(1, ...props.items.map((i) => Math.max(i.realizado, i.meta))))
const fmt = computed(() => props.format ?? ((n: number) => String(n)))

const grupoW = computed(() => W / Math.max(1, props.items.length))
const barraW = computed(() => Math.min(30, grupoW.value / 3))

const barras = computed(() =>
  props.items.map((i, idx) => {
    const centro = idx * grupoW.value + grupoW.value / 2
    const hR = (i.realizado / max.value) * ALTURA
    const hM = (i.meta / max.value) * ALTURA
    return {
      ...i,
      xR: centro - barraW.value - 2,
      xM: centro + 2,
      hR,
      hM,
      yR: BASE - hR,
      yM: BASE - hM,
      xLabel: centro,
    }
  }),
)

const linhasGuia = computed(() => [0.25, 0.5, 0.75, 1].map((f) => BASE - f * ALTURA))
</script>

<template>
  <div class="overflow-x-auto">
    <svg :viewBox="`0 0 ${W} ${H}`" class="min-w-[560px]">
      <defs>
        <linearGradient id="gradBar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#660099" />
          <stop offset="100%" stop-color="#d946ef" />
        </linearGradient>
      </defs>

      <!-- linhas-guia horizontais -->
      <line
        v-for="(y, i) in linhasGuia"
        :key="i"
        x1="0"
        :x2="W"
        :y1="y"
        :y2="y"
        stroke="#f3e8ff"
        stroke-width="1"
      />
      <line x1="0" :x2="W" :y1="BASE" :y2="BASE" stroke="#e9d5ff" stroke-width="1.5" />

      <g v-for="(b, i) in barras" :key="i">
        <!-- meta (fundo claro) -->
        <rect
          :x="b.xM"
          :y="b.yM"
          :width="barraW"
          :height="b.hM"
          rx="5"
          fill="#e9d5ff"
        >
          <title>Meta 100% — {{ b.label }}: {{ fmt(b.meta) }}</title>
        </rect>
        <!-- realizado (gradiente) -->
        <rect
          :x="b.xR"
          :y="b.yR"
          :width="barraW"
          :height="b.hR"
          rx="5"
          fill="url(#gradBar)"
          class="transition-all duration-700"
        >
          <title>Realizado — {{ b.label }}: {{ fmt(b.realizado) }}</title>
        </rect>
        <text
          :x="b.xLabel"
          :y="H - 8"
          text-anchor="middle"
          font-size="10.5"
          class="fill-brand-900/60"
        >
          {{ b.label }}
        </text>
      </g>
    </svg>

    <div class="mt-2 flex items-center gap-5 text-xs text-brand-900/60">
      <span class="flex items-center gap-1.5">
        <span class="size-3 rounded-sm bg-gradient-to-t from-brand-800 to-fuchsia-500" /> Realizado
      </span>
      <span class="flex items-center gap-1.5">
        <span class="size-3 rounded-sm bg-brand-200" /> Meta 100%
      </span>
    </div>
  </div>
</template>
