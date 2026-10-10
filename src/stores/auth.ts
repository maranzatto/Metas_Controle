import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '@/firebase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const ready = ref(false)

  let resolveReady: () => void
  const readyPromise = new Promise<void>((r) => (resolveReady = r))

  onAuthStateChanged(auth, (u) => {
    user.value = u
    if (!ready.value) {
      ready.value = true
      resolveReady()
    }
  })

  const email = computed(() => user.value?.email ?? '')

  function whenReady(): Promise<void> {
    return readyPromise
  }

  // lembrar=false → sessão dura só enquanto a aba estiver aberta.
  async function login(emailInput: string, senha: string, lembrar = true) {
    await setPersistence(
      auth,
      lembrar ? browserLocalPersistence : browserSessionPersistence,
    )
    await signInWithEmailAndPassword(auth, emailInput, senha)
  }

  async function logout() {
    await signOut(auth)
  }

  return { user, ready, email, whenReady, login, logout }
})
