import { createRouter, createWebHistory } from 'vue-router'
import UserLogin from '../components/UserLogin.vue'
import AdminFincas from '../components/AdminFincas.vue'
import AdminUsuarios from '../components/AdminUsuarios.vue'
import UserHome from '../components/UserHome.vue' // <--- IMPORTAR
import PlanOperativo from '../components/PlanOperativo.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: UserLogin
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminFincas,
      // 🔒 CANDADO: Requiere Login Y ser Admin
      meta: { requiresAuth: true, requireAdmin: true }
    },
    {
      path: '/usuarios',
      name: 'usuarios',
      component: AdminUsuarios,
      // 🔒 CANDADO: Requiere Login Y ser Admin
      meta: { requiresAuth: true, requireAdmin: true }
    },
   {
      path: '/admin/plan-operativo/:id?',
      name: 'plan-operativo-admin',
      component: PlanOperativo,
      meta: { requiresAuth: true, requireAdmin: true }
    },
    {
      path: '/inicio', // <--- RUTA PARA LOS DEMÁS
      name: 'inicio',
      component: UserHome,
      // 🔓 ABIERTO: Solo requiere Login (cualquier rol sirve)
      meta: { requiresAuth: true }
    }
  ]
})

// --- EL PORTERO INTELIGENTE ---
router.beforeEach((to, from, next) => {
  const usuarioString = localStorage.getItem('usuario')
  const usuario = usuarioString ? JSON.parse(usuarioString) : null

  // 1. Si la ruta requiere auth y no hay usuario -> LOGIN
  if (to.meta.requiresAuth && !usuario) {
    return next('/')
  }

  // 2. Si la ruta requiere ADMIN y el usuario NO es Admin -> PATEAR A INICIO
  if (to.meta.requireAdmin && usuario.rol !== 'Admin') {
    return next('/inicio')
  }

  // 3. (Opcional) Si un usuario logueado intenta ir al Login, mandarlo a su home
  if (to.path === '/' && usuario) {
    if (usuario.rol === 'Admin') return next('/admin')
    return next('/inicio')
  }

  next()
})

export default router
