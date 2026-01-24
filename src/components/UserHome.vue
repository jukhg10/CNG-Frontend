<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const usuario = ref({ nombre: '', rol: '' })

onMounted(() => {
  const data = localStorage.getItem('usuario')
  if (data) usuario.value = JSON.parse(data)
})

const cerrarSesion = () => {
  localStorage.removeItem('usuario')
  router.push('/')
}
</script>

<template>
  <div class="main-container">

    <div class="header-section mb-4 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center">
        <img src="/logo-cng.png" alt="Logo" class="logo-img me-3">
        <div>
          <h2 class="page-title">Bienvenido, {{ usuario.nombre }}</h2>
          <p class="subtitle">Panel de {{ usuario.rol || 'Colaborador' }}</p>
        </div>
      </div>
      <button @click="cerrarSesion" class="btn btn-outline-danger btn-sm">Salir 🚪</button>
    </div>

    <div class="row">
      <div class="col-md-12">
        <div class="card shadow-sm p-5 text-center empty-state">
          <div class="icon-placeholder">📋</div>
          <h3 class="mt-3 text-dark-green">Mis Asignaciones</h3>
          <p class="text-muted">
            Actualmente no tienes fincas asignadas para revisión o auditoría.
            <br>Cuando el administrador te asigne predios, aparecerán aquí.
          </p>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Reutilizamos el estilo Agro-Corporativo */
:root { --color-primary: #1B5E20; --color-secondary: #F9A825; }
.main-container { padding: 2rem; background-color: #f4f6f8; min-height: 100vh; }
.header-section { background: white; padding: 1.5rem; border-radius: 8px; border-left: 5px solid #1B5E20; }
.logo-img { height: 70px; width: auto; }
.page-title { color: #1B5E20; font-weight: 700; margin: 0; }
.subtitle { color: #546E7A; font-size: 0.95rem; margin: 0; }
.empty-state { background: white; border-radius: 8px; border: 1px dashed #ccc; }
.icon-placeholder { font-size: 4rem; color: #1B5E20; opacity: 0.5; }
.text-dark-green { color: #1B5E20; }
</style>
