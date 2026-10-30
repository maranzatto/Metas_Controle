<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const sidebarAberta = ref(false)
const vivoLogo = `${import.meta.env.BASE_URL}vivo-logo.svg`

interface LinkNavegacao {
  to: string
  label: string
  exato?: boolean
  children?: { to: string; label: string }[]
}

const links: LinkNavegacao[] = [
  { to: '/', label: 'Home', exato: true },
  { to: '/vendas', label: 'Vendas' },
  { to: '/vendedores', label: 'Vendedores' },
  { to: '/metas', label: 'Metas' },
  {
    to: '/conferencia/chip',
    label: 'Conferência',
    children: [
      { to: '/conferencia/chip', label: 'Chip' },
      { to: '/conferencia/pelicula', label: 'Película' },
    ],
  },
]

function ativo(link: LinkNavegacao) {
  if (link.children) return route.path.startsWith('/conferencia')
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
  <div class="flex min-h-screen bg-brand-50">
    <!-- overlay mobile -->
    <div
      v-if="sidebarAberta"
      class="fixed inset-0 z-30 bg-brand-950/40 backdrop-blur-sm lg:hidden"
      @click="sidebarAberta = false"
    />

    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col bg-brand-950 text-brand-100 shadow-xl shadow-brand-950/15 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0"
      :class="{ 'translate-x-0': sidebarAberta }"
    >
      <div class="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white p-1">
          <img :src="vivoLogo" alt="Vivo" class="size-full object-contain" />
        </div>
        <span class="text-base font-extrabold tracking-tight text-white">Painel da Loja</span>
      </div>

      <nav class="flex-1 space-y-1.5 overflow-y-auto px-3 py-5">
        <div v-for="link in links" :key="link.to" class="space-y-1">
          <RouterLink
          :to="link.to"
          class="group relative block rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200"
          :class="
            ativo(link)
              ? 'bg-white/15 text-white shadow-inner shadow-white/5'
              : 'text-brand-200 hover:bg-white/8 hover:text-white'
          "
          @click="sidebarAberta = false"
        >
          <span
            v-if="ativo(link)"
            class="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-vivo-500"
          />
          {{ link.label }}
          </RouterLink>
          <div v-if="link.children && ativo(link)" class="ml-4 space-y-1 border-l border-white/15 pl-3">
            <RouterLink
              v-for="child in link.children"
              :key="child.to"
              :to="child.to"
              class="block rounded-lg px-3 py-2 text-sm transition-colors"
              :class="route.path === child.to ? 'bg-white/10 font-semibold text-white' : 'text-brand-300 hover:bg-white/5 hover:text-white'"
              @click="sidebarAberta = false"
            >
              {{ child.label }}
            </RouterLink>
          </div>
        </div>
      </nav>

      <div class="border-t border-white/10 p-4">
        <div class="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur">
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white"
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
          class="text-lg font-extrabold tracking-tight text-brand-900"
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
