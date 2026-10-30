<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    type?: 'button' | 'submit'
    disabled?: boolean
  }>(),
  { variant: 'primary', type: 'button', disabled: false },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
    :class="{
      'bg-brand-700 text-white shadow-sm shadow-brand-900/10 hover:bg-brand-800':
        variant === 'primary',
      'border border-brand-200 bg-white text-brand-800 hover:border-brand-300 hover:bg-brand-50':
        variant === 'secondary',
      'bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-lg shadow-red-500/30 hover:brightness-110':
        variant === 'danger',
      'text-brand-700 hover:bg-brand-100/70': variant === 'ghost',
    }"
  >
    <slot />
  </button>
</template>
