import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export const router = createRouter({
  // Hash (#/vendas): GitHub Pages não resolve rotas de SPA — com hash,
  // refresh e links diretos funcionam em qualquer subpasta sem 404.
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/features/auth/LoginView.vue'),
      meta: { public: true, title: 'Login' },
    },
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/features/home/HomeView.vue'),
          meta: { title: 'Dashboard' },
        },
        {
          path: 'vendas',
          name: 'vendas',
          component: () => import('@/features/vendas/VendasView.vue'),
          meta: { title: 'Vendas' },
        },
        {
          path: 'vendedores',
          name: 'vendedores',
          component: () => import('@/features/vendedores/VendedoresView.vue'),
          meta: { title: 'Vendedores' },
        },
        {
          path: 'vendedores/:id/metas',
          name: 'vendedor-metas',
          component: () => import('@/features/vendedores/MetasPage.vue'),
          meta: { title: 'Metas do vendedor' },
        },
        {
          path: 'metas',
          name: 'metas',
          component: () => import('@/features/metas/MetasView.vue'),
          meta: { title: 'Metas' },
        },
        {
          path: 'metas/loja',
          name: 'metas-loja',
          component: () => import('@/features/vendedores/MetasPage.vue'),
          props: { loja: true },
          meta: { title: 'Metas da loja' },
        },
        {
          path: 'conferencia',
          name: 'conferencia',
          component: () => import('@/features/conferencia/ConferenciaView.vue'),
          meta: { title: 'Conferência' },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.whenReady()

  if (to.meta.public) {
    return authStore.user ? { name: 'home' } : true
  }
  if (!authStore.user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} · Painel de Metas`
    : 'Painel de Metas'
})
