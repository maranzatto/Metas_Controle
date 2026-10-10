<script setup lang="ts">
import type { MaskName } from '@/utils/masks'

defineProps<{
  label?: string
  type?: string
  placeholder?: string
  required?: boolean
  min?: number | string
  step?: number | string
  mask?: MaskName
}>()

const model = defineModel<string | number>({ default: '' })
</script>

<template>
  <label class="block text-sm">
    <span v-if="label" class="mb-1.5 block font-semibold text-brand-950/80">
      {{ label }}<span v-if="required" class="text-fuchsia-500"> *</span>
    </span>
    <input
      v-model="model"
      v-mask="mask"
      :type="type ?? 'text'"
      :inputmode="mask === 'currency' || mask === 'int' ? 'numeric' : undefined"
      :placeholder="placeholder"
      :required="required"
      :min="min"
      :step="step"
      class="w-full rounded-xl border border-brand-200 bg-brand-50/50 px-3.5 py-2.5 text-brand-950 transition-all duration-200 outline-none placeholder:text-brand-300 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/15"
    />
  </label>
</template>
