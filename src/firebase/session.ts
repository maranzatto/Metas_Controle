import { auth } from '@/firebase'

export async function requireAuthenticatedUser() {
  await auth.authStateReady()
  const user = auth.currentUser
  if (!user) throw new Error('Usuário não autenticado')
  return user
}