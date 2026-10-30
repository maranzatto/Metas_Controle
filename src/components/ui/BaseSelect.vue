<script setup lang="ts">
defineProps<{
  label?: string
  required?: boolean
}>()

const model = defineModel<string>({ default: '' })
</script>

<template>
  <label class="block text-sm">
    <span v-if="label" class="mb-1.5 block font-semibold text-brand-950/80">
      {{ label }}<span v-if="required" class="text-fuchsia-500"> *</span>
    </span>
    <select
      v-model="model"
      :required="required"
      class="w-full cursor-pointer rounded-xl border border-brand-200 bg-brand-50/50 px-3.5 py-2.5 text-brand-950 transition-all duration-200 outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/15"
    >
      <slot />
    </select>
  </label>
</template>
