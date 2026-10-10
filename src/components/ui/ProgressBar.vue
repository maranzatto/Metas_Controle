<script setup lang="ts">
import { computed } from 'vue'
import type { FaixaAtingimento } from '@/utils/metas'

const props = defineProps<{ percentual: number; faixa: FaixaAtingimento }>()

const largura = computed(() => Math.min(100, Math.max(0, props.percentual)))

const cor = computed(
  () =>
    ({
      abaixo80: 'bg-gradient-to-r from-rose-500 to-red-400',
      entre80e100: 'bg-gradient-to-r from-amber-400 to-orange-400',
      acima100: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    })[props.faixa],
)
</script>

<template>
  <div class="h-2.5 w-full overflow-hidden rounded-full bg-brand-100">
    <div
      class="h-full rounded-full shadow-sm transition-all duration-700 ease-out"
      :class="cor"
      :style="{ width: `${largura}%` }"
    />
  </div>
</template>
