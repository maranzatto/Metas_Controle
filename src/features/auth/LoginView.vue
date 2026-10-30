<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FirebaseError } from 'firebase/app'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const CHAVE_EMAIL = 'painel.ultimoEmail'

const emailSalvo = localStorage.getItem(CHAVE_EMAIL)
const email = ref(emailSalvo ?? '')
const senha = ref('')
const lembrar = ref(true)
const mostrarSenha = ref(false)
const erro = ref('')
const entrando = ref(false)
const versao = __APP_VERSION__

const MENSAGENS: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha inválidos.',
  'auth/user-not-found': 'Usuário não encontrado.',
  'auth/wrong-password': 'E-mail ou senha inválidos.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde e tente novamente.',
}

async function entrar() {
  erro.value = ''
  entrando.value = true
  try {
    await auth.login(email.value, senha.value, lembrar.value)
    if (lembrar.value) localStorage.setItem(CHAVE_EMAIL, email.value)
    else localStorage.removeItem(CHAVE_EMAIL)
    router.push((route.query.redirect as string) ?? '/')
  } catch (e) {
    erro.value =
      e instanceof FirebaseError
        ? (MENSAGENS[e.code] ?? 'Falha ao entrar. Tente novamente.')
        : 'Falha ao entrar. Tente novamente.'
  } finally {
    entrando.value = false
  }
}
</script>

<template>
  <div
    class="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-50 p-4"
  >
    <div class="pointer-events-none absolute inset-0">
      <div
        class="absolute inset-0 opacity-[0.035]"
        style="
          background-image: linear-gradient(#315f7e 1px, transparent 1px), linear-gradient(90deg, #315f7e 1px, transparent 1px);
          background-size: 36px 36px;
        "
      />
    </div>

    <form
      class="animate-fade-up relative z-10 w-full max-w-md rounded-2xl border border-brand-200 bg-white p-8 shadow-xl shadow-brand-950/10 sm:p-10"
      @submit.prevent="entrar"
    >
      <div class="mb-8 flex flex-col items-center text-center">
        <div
          class="mb-4 flex size-14 items-center justify-center rounded-xl bg-brand-700"
        >
          <svg class="size-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M17 7h4v4" />
          </svg>
        </div>
        <h1 class="text-2xl font-extrabold tracking-tight text-brand-950">Painel da Loja</h1>
        <p class="mt-1 text-sm text-brand-600">Metas e vendas em um só lugar</p>
      </div>

      <div class="space-y-4">
        <label class="block text-sm">
          <span class="mb-1.5 block font-semibold text-brand-900">E-mail</span>
          <input
            v-model="email"
            type="email"
            required
            placeholder="voce@email.com"
            class="w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-brand-950 transition-all duration-200 outline-none placeholder:text-brand-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
          />
        </label>

        <label class="block text-sm">
          <span class="mb-1.5 block font-semibold text-brand-900">Senha</span>
          <div class="relative">
            <input
              v-model="senha"
              :type="mostrarSenha ? 'text' : 'password'"
              required
              placeholder="••••••••"
              class="w-full rounded-xl border border-brand-200 bg-white px-4 py-3 pr-11 text-brand-950 transition-all duration-200 outline-none placeholder:text-brand-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
            />
            <button
              type="button"
              :aria-label="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
              class="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-brand-500 transition hover:text-brand-800"
              @click="mostrarSenha = !mostrarSenha"
            >
              <svg
                v-if="!mostrarSenha"
                class="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg
                v-else
                class="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M9.88 9.88a3 3 0 1 0 4.24 4.24M6.72 6.72C3.73 8.72 2 12 2 12s3.5 7 10 7c1.79 0 3.43-.5 4.83-1.32M10.58 5.06c.46-.04.92-.06 1.42-.06 6.5 0 10 7 10 7a17.3 17.3 0 0 1-2.16 3.19M14.12 14.12 3 3m18 18-3.29-3.29"
                />
              </svg>
            </button>
          </div>
        </label>

        <label class="flex cursor-pointer items-center gap-2.5 pt-1 text-sm select-none">
          <input
            v-model="lembrar"
            type="checkbox"
            class="size-4 cursor-pointer rounded accent-brand-700"
          />
          <span class="text-brand-800">Lembrar conta neste dispositivo</span>
        </label>
      </div>

      <p
        v-if="erro"
        class="animate-fade-up mt-4 rounded-xl border border-rose-400/30 bg-rose-500/20 px-4 py-2.5 text-sm text-rose-100"
      >
        {{ erro }}
      </p>

      <button
        type="submit"
        :disabled="entrando"
        class="mt-6 w-full cursor-pointer rounded-xl bg-brand-700 py-3 text-sm font-bold tracking-wide text-white shadow-sm transition-all duration-200 hover:bg-brand-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ entrando ? 'Entrando…' : 'Entrar' }}
      </button>

      <p class="mt-6 text-center text-xs text-brand-500">Acesso restrito a administradores</p>
    </form>

    <p class="absolute right-4 bottom-3 z-10 text-[10px] text-brand-400">v{{ versao }}</p>
  </div>
</template>
