<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  items: { label: string; value: number; color: string }[]
  format?: (n: number) => string
}>()

const R = 70
const C = 2 * Math.PI * R

const total = computed(() => props.items.reduce((a, i) => a + i.value, 0))
const fmt = computed(() => props.format ?? ((n: number) => String(n)))

const segmentos = computed(() => {
  let acumulado = 0
  return props.items
    .filter((i) => i.value > 0)
    .map((i) => {
      const frac = total.value ? i.value / total.value : 0
      const seg = { ...i, dash: frac * C, offset: -acumulado * C, pct: frac * 100 }
      acumulado += frac
      return seg
    })
})

// A legenda lista TODAS as categorias (zeradas inclusas) — preenche o card e
// deixa claro o que não teve venda no período.
const legenda = computed(() =>
  props.items.map((i) => ({
    ...i,
    pct: total.value ? (i.value / total.value) * 100 : 0,
  })),
)
</script>

<template>
  <div class="flex h-full flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
    <svg viewBox="0 0 200 200" class="size-48 shrink-0">
      <circle cx="100" cy="100" :r="R" fill="none" stroke="#eaf0f5" stroke-width="30" />
      <circle
        v-for="(s, i) in segmentos"
        :key="i"
        cx="100"
        cy="100"
        :r="R"
        fill="none"
        :stroke="s.color"
        stroke-width="30"
        :stroke-dasharray="`${s.dash} ${C - s.dash}`"
        :stroke-dashoffset="s.offset"
        transform="rotate(-90 100 100)"
        class="transition-all duration-700"
      >
        <title>{{ s.label }}: {{ fmt(s.value) }}</title>
      </circle>
      <text x="100" y="93" text-anchor="middle" class="fill-brand-900/60" font-size="11">
        Total
      </text>
      <text x="100" y="112" text-anchor="middle" class="fill-brand-950" font-size="15" font-weight="800">
        {{ fmt(total) }}
      </text>
    </svg>

    <ul class="w-full min-w-0 space-y-1.5 text-sm">
      <li v-for="(s, i) in legenda" :key="i" class="flex items-center gap-2">
        <span class="size-3 shrink-0 rounded-full" :style="{ background: s.color }" />
        <span
          class="min-w-0 flex-1 truncate"
          :class="s.value > 0 ? 'text-brand-950/80' : 'text-brand-950/40'"
        >
          {{ s.label }}
        </span>
        <strong class="shrink-0" :class="s.value > 0 ? 'text-brand-950' : 'text-brand-950/40'">
          {{ fmt(s.value) }}
        </strong>
        <span class="w-12 shrink-0 text-right text-xs text-brand-900/50">
          {{ s.pct.toFixed(0) }}%
        </span>
      </li>
      <li v-if="!legenda.length" class="text-sm text-brand-300">Sem dados no período.</li>
    </ul>
  </div>
</template>
