import { createRouter, createWebHistory } from 'vue-router'
import UserLogin from '../components/UserLogin.vue'
import AdminFincas from '../components/AdminFincas.vue'
import AdminUsuarios from '../components/AdminUsuarios.vue'
import UserHome from '../components/UserHome.vue'
import PlanOperativo from '../components/PlanOperativo.vue'
import UserFinca from '../components/UserFinca.vue'
import CentroAyuda from '../components/CentroAyuda.vue'
import AdminOrganizacion from '../components/AdminOrganizacion.vue'
import UsuariosOrganizacion from '../components/UsuariosOrganizacion.vue'
import PublicStats from '../components/PublicStats.vue'
import LandingPage from '../components/LandingPage.vue';
import ProspectosAdmin from '../components/ProspectosAdmin.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- 🟢 RUTAS PÚBLICAS (Sin restricciones) ---
    { path: '/', name: 'login', component: UserLogin },
    { path: '/contacto', name: 'Contacto', component: LandingPage },
    { path: '/estadisticas', name: 'PublicStats', component: PublicStats },

    // --- 🔴 RUTAS ADMIN (Requieren Login Y ser Admin) ---
    { path: '/admin', name: 'admin', component: AdminFincas, meta: { requiresAuth: true, requireAdmin: true } },
    { path: '/usuarios', name: 'usuarios', component: AdminUsuarios, meta: { requiresAuth: true, requireAdmin: true } },
    { path: '/admin/plan-operativo/:id?', name: 'plan-operativo-admin', component: PlanOperativo, meta: { requiresAuth: true, requireAdmin: true } },
    { path: '/admin/prospectos', name: 'ProspectosAdmin', component: ProspectosAdmin, meta: { requiresAuth: true, requireAdmin: true } },

    // --- 🔵 RUTAS ORGANIZACIÓN (Requieren Login) ---
    { path: '/admin-org', name: 'AdminOrganizacion', component: AdminOrganizacion, meta: { requiresAuth: true } },
    { path: '/usuarios-org', name: 'UsuariosOrganizacion', component: UsuariosOrganizacion, meta: { requiresAuth: true } },

    // --- 🟠 RUTAS GENERALES / PRODUCTORES (Requieren Login) ---
    { path: '/inicio', name: 'inicio', component: UserHome, meta: { requiresAuth: true } },
    { path: '/fincas/:id/detalle', name: 'user-finca', component: UserFinca, meta: { requiresAuth: true } },
    { path: '/ayuda', name: 'Ayuda', component: CentroAyuda, meta: { requiresAuth: true } }
  ]
})

// --- 🛑 EL PORTERO INTELIGENTE ---
router.beforeEach((to, from, next) => {
  const usuarioString = localStorage.getItem('usuario')
  const usuario = usuarioString ? JSON.parse(usuarioString) : null

  // 1. Si la ruta requiere auth y no hay usuario -> PATEAR AL LOGIN
  if (to.meta.requiresAuth && !usuario) {
    return next('/')
  }

  // 2. Si la ruta requiere ADMIN y el usuario NO es Admin -> REDIRIGIR A SU PANEL
  if (to.meta.requireAdmin && usuario.rol !== 'Admin') {
    if (usuario.rol === 'Organizacion') return next('/admin-org')
    return next('/inicio')
  }

  // 3. Si un usuario ya logueado intenta ir al Login -> MANDARLO A SU CASA
  if (to.path === '/' && usuario) {
    if (usuario.rol === 'Admin') return next('/admin')
    if (usuario.rol === 'Organizacion') return next('/admin-org')
    return next('/inicio')
  }

  next()
})

export default router
