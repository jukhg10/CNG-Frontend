<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NotificationBell from './NotificationBell.vue'

const router = useRouter()
const route = useRoute()

const nombre = ref('')
const rol = ref('')

const cargarUsuario = () => {
    const u = JSON.parse(localStorage.getItem('usuario') || '{}')
    nombre.value = u.nombre || 'Usuario'
    rol.value = u.rol || ''
}

watch(() => route.path, () => {
    cargarUsuario()
})

onMounted(() => {
    cargarUsuario()
})

const cerrarSesion = () => {
    localStorage.clear()
    router.push('/')
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark shadow-sm custom-navbar">
    <div class="container-fluid px-4">
      <a class="navbar-brand fw-bold d-flex align-items-center gap-2" href="#">
        <span class="fs-4">🐮</span> CNG
      </a>

      <button class="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">

        <div class="d-flex align-items-center gap-4 user-zone mt-3 mt-lg-0 ms-auto">

          <NotificationBell />

          <div class="text-white text-end d-none d-sm-block">
            <div class="fw-bold lh-1">{{ nombre }}</div>
            <small class="opacity-75 role-badge">{{ rol }}</small>
          </div>

          <button @click="cerrarSesion" class="btn btn-light btn-sm fw-bold text-success rounded-pill px-3 shadow-sm">
            Salir
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.custom-navbar {
    background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%);
    padding-top: 0.8rem;
    padding-bottom: 0.8rem;
}
.role-badge {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
@media (max-width: 991px) {
    .user-zone {
        justify-content: flex-end; /* Alinea a la derecha en móviles */
        border-top: 1px solid rgba(255,255,255,0.1);
        padding-top: 1rem;
    }
}
</style>
