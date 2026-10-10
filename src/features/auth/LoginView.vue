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
    class="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-fuchsia-800 p-4"
  >
    <!-- orbes flutuantes -->
    <div class="pointer-events-none absolute inset-0">
      <div
        class="animate-blob absolute -top-24 -left-24 size-[28rem] rounded-full bg-fuchsia-500/40 blur-3xl"
      />
      <div
        class="animate-blob absolute top-1/3 -right-32 size-[30rem] rounded-full bg-violet-600/45 blur-3xl [animation-delay:-4s]"
      />
      <div
        class="animate-blob absolute -bottom-32 left-1/4 size-[26rem] rounded-full bg-brand-500/40 blur-3xl [animation-delay:-8s]"
      />
      <!-- textura de grade sutil -->
      <div
        class="absolute inset-0 opacity-[0.06]"
        style="
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.6) 1px, transparent 1px);
          background-size: 44px 44px;
        "
      />
    </div>

    <!-- cartão de vidro -->
    <form
      class="glass animate-fade-up relative z-10 w-full max-w-md rounded-3xl p-8 shadow-2xl shadow-brand-950/50 sm:p-10"
      @submit.prevent="entrar"
    >
      <!-- marca abstrata -->
      <div class="mb-8 flex flex-col items-center text-center">
        <div
          class="animate-gradient-pan mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-brand-500 to-violet-600 shadow-lg shadow-fuchsia-500/40"
        >
          <svg class="size-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M17 7h4v4" />
          </svg>
        </div>
        <h1 class="text-2xl font-extrabold tracking-tight text-white">Painel da Loja</h1>
        <p class="mt-1 text-sm text-brand-200">Metas e vendas em um só lugar</p>
      </div>

      <div class="space-y-4">
        <label class="block text-sm">
          <span class="mb-1.5 block font-semibold text-brand-100">E-mail</span>
          <input
            v-model="email"
            type="email"
            required
            placeholder="voce@email.com"
            class="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white transition-all duration-200 outline-none placeholder:text-brand-200/50 focus:border-fuchsia-300/70 focus:bg-white/15 focus:ring-4 focus:ring-fuchsia-400/20"
          />
        </label>

        <label class="block text-sm">
          <span class="mb-1.5 block font-semibold text-brand-100">Senha</span>
          <div class="relative">
            <input
              v-model="senha"
              :type="mostrarSenha ? 'text' : 'password'"
              required
              placeholder="••••••••"
              class="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-11 text-white transition-all duration-200 outline-none placeholder:text-brand-200/50 focus:border-fuchsia-300/70 focus:bg-white/15 focus:ring-4 focus:ring-fuchsia-400/20"
            />
            <button
              type="button"
              :aria-label="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
              class="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-brand-200/60 transition hover:text-white"
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
            class="size-4 cursor-pointer rounded accent-fuchsia-400"
          />
          <span class="text-brand-100">Lembrar conta neste dispositivo</span>
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
        class="animate-gradient-pan mt-6 w-full cursor-pointer rounded-xl bg-gradient-to-r from-fuchsia-500 via-brand-500 to-violet-500 py-3 text-sm font-bold tracking-wide text-white shadow-lg shadow-fuchsia-600/40 transition-all duration-200 hover:shadow-xl hover:shadow-fuchsia-500/50 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ entrando ? 'Entrando…' : 'Entrar' }}
      </button>

      <p class="mt-6 text-center text-xs text-brand-200/60">Acesso restrito a administradores</p>
    </form>

    <p class="absolute right-4 bottom-3 z-10 text-[10px] text-white/20">v{{ versao }}</p>
  </div>
</template>
