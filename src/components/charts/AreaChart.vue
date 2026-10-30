<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  points: { label: string; value: number }[]
  /** Meta diária de referência (R$) — desenhada como linha tracejada. */
  meta?: number
  format?: (n: number) => string
}>()

const W = 720
const H = 200
const PAD_X = 12
const TOPO = 14
const BASE = 168
const ALTURA = BASE - TOPO

const max = computed(() => Math.max(1, ...props.points.map((p) => p.value), props.meta ?? 0))
const fmt = computed(() => props.format ?? ((n: number) => String(n)))

const passo = computed(() => (props.points.length > 1 ? (W - PAD_X * 2) / (props.points.length - 1) : 0))
const xDe = (i: number) => PAD_X + i * passo.value
const yDe = (v: number) => BASE - (v / max.value) * ALTURA

const coords = computed(() => props.points.map((p, i) => ({ ...p, x: xDe(i), y: yDe(p.value) })))

const linha = computed(() => coords.value.map((p) => `${p.x},${p.y}`).join(' '))

const area = computed(() => {
  if (!coords.value.length) return ''
  const primeiro = coords.value[0]
  const ultimo = coords.value[coords.value.length - 1]
  return `M ${primeiro.x},${BASE} ` + coords.value.map((p) => `L ${p.x},${p.y}`).join(' ') + ` L ${ultimo.x},${BASE} Z`
})

const passoLabel = computed(() => Math.ceil(props.points.length / 10))
</script>

<template>
  <div class="overflow-x-auto">
    <svg :viewBox="`0 0 ${W} ${H}`" class="min-w-[560px]">
      <defs>
        <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5a416b" stop-opacity="0.24" />
          <stop offset="100%" stop-color="#5a416b" stop-opacity="0.02" />
        </linearGradient>
      </defs>

      <line
        v-for="f in [0.33, 0.66, 1]"
        :key="f"
        x1="0"
        :x2="W"
        :y1="BASE - f * ALTURA"
        :y2="BASE - f * ALTURA"
        stroke="#eaf0f5"
      />

      <path :d="area" fill="url(#gradArea)" />
      <g v-if="meta && meta > 0">
        <line
          x1="0"
          :x2="W"
          :y1="yDe(meta)"
          :y2="yDe(meta)"
          stroke="#698b8c"
          stroke-width="1.5"
          stroke-dasharray="6 4"
        />
        <text
          :x="W - 6"
          :y="yDe(meta) - 6"
          text-anchor="end"
          font-size="10"
          font-weight="600"
          class="fill-vivo-600"
        >
          Meta/dia {{ fmt(meta) }}
        </text>
      </g>
      <polyline
        :points="linha"
        fill="none"
        stroke="#5a416b"
        stroke-width="2.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <circle
        v-for="(p, i) in coords"
        :key="i"
        :cx="p.x"
        :cy="p.y"
        r="3.5"
        fill="#fff"
        stroke="#5a416b"
        stroke-width="2"
      >
        <title>{{ p.label }}: {{ fmt(p.value) }}</title>
      </circle>
      <text
        v-for="(p, i) in coords"
        v-show="i % passoLabel === 0"
        :key="`l${i}`"
        :x="p.x"
        :y="H - 6"
        text-anchor="middle"
        font-size="10"
        class="fill-brand-900/50"
      >
        {{ p.label }}
      </text>
    </svg>
  </div>
</template>
