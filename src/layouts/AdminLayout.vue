<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const sidebarAberta = ref(false)

const links = [
  { to: '/', label: 'Home', exato: true },
  { to: '/vendas', label: 'Vendas' },
  { to: '/vendedores', label: 'Vendedores' },
  { to: '/metas', label: 'Metas' },
  { to: '/conferencia', label: 'CONFERENCIA' },
]

function ativo(link: (typeof links)[number]) {
  return link.exato ? route.path === link.to : route.path.startsWith(link.to)
}

const inicial = computed(() => auth.email.charAt(0).toUpperCase() || '?')
const versao = __APP_VERSION__

async function sair() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex min-h-screen bg-gradient-to-br from-brand-50 via-white to-fuchsia-50">
    <!-- overlay mobile -->
    <div
      v-if="sidebarAberta"
      class="fixed inset-0 z-30 bg-brand-950/40 backdrop-blur-sm lg:hidden"
      @click="sidebarAberta = false"
    />

    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col bg-gradient-to-b from-brand-950 via-brand-800 to-[#8a2be2]/90 text-brand-100 shadow-2xl shadow-brand-950/30 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0"
      :class="{ 'translate-x-0': sidebarAberta }"
    >
      <div class="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div
          class="animate-gradient-pan flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-400 to-violet-600 shadow-lg shadow-fuchsia-500/30"
        >
          <svg class="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M17 7h4v4" />
          </svg>
        </div>
        <span class="text-base font-extrabold tracking-tight text-white">Painel da Loja</span>
      </div>

      <nav class="flex-1 space-y-1.5 overflow-y-auto px-3 py-5">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="group relative block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200"
          :class="
            ativo(link)
              ? 'bg-white/15 text-white shadow-inner shadow-white/5'
              : 'text-brand-200 hover:bg-white/10 hover:text-white'
          "
          @click="sidebarAberta = false"
        >
          <span
            v-if="ativo(link)"
            class="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-fuchsia-400"
          />
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="border-t border-white/10 p-4">
        <div class="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur">
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-brand-500 text-sm font-bold text-white"
          >
            {{ inicial }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-medium text-white">{{ auth.email }}</p>
            <p class="text-[10px] tracking-wide text-brand-200 uppercase">Admin</p>
          </div>
        </div>
        <button
          class="mt-2 w-full cursor-pointer rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-brand-100 transition hover:bg-white/10 hover:text-white"
          @click="sair"
        >
          Sair
        </button>
        <p class="mt-3 text-center text-[10px] text-white/25">v{{ versao }}</p>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="glass-light sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-brand-100/80 px-4 lg:px-8"
      >
        <button
          class="cursor-pointer rounded-xl p-2 text-brand-700 transition hover:bg-brand-100 lg:hidden"
          @click="sidebarAberta = true"
        >
          ☰
        </button>
        <h1
          class="bg-gradient-to-r from-brand-900 via-brand-700 to-fuchsia-600 bg-clip-text text-lg font-extrabold tracking-tight text-transparent"
        >
          {{ route.meta.title }}
        </h1>
      </header>

      <main class="flex-1 p-4 lg:p-8">
        <router-view v-slot="{ Component }">
          <component :is="Component" class="animate-fade-up" />
        </router-view>
      </main>
    </div>
  </div>
</template>
