<script setup lang="ts">
defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/45 p-4 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div
          class="animate-fade-up max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl shadow-brand-950/30 ring-1 ring-brand-100"
        >
          <header
            class="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 bg-white/90 px-6 py-4 backdrop-blur"
          >
            <h2
              class="text-lg font-bold text-brand-800"
            >
              {{ title }}
            </h2>
            <!-- ações sempre visíveis no topo (slot mantém o nome por compatibilidade) -->
            <div class="flex items-center gap-2">
              <slot name="footer" />
              <button
                class="flex size-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition hover:bg-brand-50 hover:text-brand-700"
                @click="emit('close')"
              >
                ✕
              </button>
            </div>
          </header>
          <div class="px-6 py-5">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
