<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

// --- CONFIGURACIÓN ---
const router = useRouter()
const usuario = ref({ id: 0, nombre: '', rol: '' })
const fincas = ref([])
const cargando = ref(true)

// Detectar URL (Local vs Azure)
const BASE_URL = window.location.hostname.includes('localhost')
  ? 'http://localhost:7292/api'
  : 'https://cng-backend.azurewebsites.net/api';

// --- CICLO DE VIDA ---
onMounted(() => {
  // 1. Validar Sesión
  const data = localStorage.getItem('usuario')
  if (data) {
    usuario.value = JSON.parse(data)
    // 2. Cargar fincas de ESTE usuario
    cargarMisFincas(usuario.value.id)
  } else {
    router.push('/') // Si no hay sesión, echar fuera
  }
})

// --- LÓGICA ---
const cargarMisFincas = async (userId) => {
  cargando.value = true
  try {
    // Usamos el endpoint específico de "Fincas por Usuario"
    const res = await axios.get(`${BASE_URL}/Fincas/Usuario/${userId}`)
    fincas.value = res.data
  } catch (error) {
    console.error("Error cargando fincas:", error)
  } finally {
    cargando.value = false
  }
}

const cerrarSesion = () => {
  localStorage.removeItem('usuario')
  router.push('/')
}

const irADetalle = (fincaId) => {
  // Redirige al nuevo Dashboard completo que creamos
  router.push(`/fincas/${fincaId}/detalle`)
}

// --- AYUDANTES VISUALES ---
const formatearFecha = (fecha) => {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

const claseEstado = (fase) => {
  const map = {
    'Diagnostico': 'bg-warning text-dark',
    'Implementacion': 'bg-primary text-white',
    'Seguimiento': 'bg-success text-white',
    'Retiro': 'bg-secondary text-white'
  }
  return map[fase] || 'bg-light text-dark'
}
</script>

<template>
  <div class="main-container">

    <div class="header-section mb-4 d-flex justify-content-between align-items-center shadow-sm">
      <div class="d-flex align-items-center">
        <img src="/logo-cng.png" alt="Logo" class="logo-img me-3">
        <div>
          <h2 class="page-title">Hola, {{ usuario.nombre }} 👋</h2>
          <p class="subtitle">Panel de Productor - {{ usuario.email }}</p>
        </div>
      </div>
      <button @click="cerrarSesion" class="btn btn-outline-danger btn-sm fw-bold px-3">
        Cerrar Sesión 🚪
      </button>
    </div>

    <div class="content-area">

      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="text-success fw-bold m-0 border-bottom border-3 border-success pb-1 d-inline-block">
          🏡 Mis Predios Asignados
        </h4>
        <span v-if="!cargando && fincas.length > 0" class="badge bg-success bg-opacity-10 text-success border border-success">
          {{ fincas.length }} Predios
        </span>
      </div>

      <div v-if="cargando" class="text-center py-5">
        <div class="spinner-border text-success" style="width: 3rem; height: 3rem;" role="status"></div>
        <p class="mt-3 text-muted fw-bold">Cargando tu información...</p>
      </div>

      <div v-else-if="fincas.length === 0" class="row justify-content-center">
        <div class="col-md-8">
          <div class="card shadow-sm p-5 text-center empty-state border-0">
            <div class="icon-placeholder mb-3">🌱</div>
            <h3 class="text-dark-green fw-bold">Aún no tienes predios asignados</h3>
            <p class="text-muted">
              Bienvenido al sistema CNG. Actualmente el equipo administrativo no ha vinculado ninguna finca a tu cuenta.
              <br>Por favor, espera a que se realice la asignación o contacta a soporte.
            </p>
          </div>
        </div>
      </div>

      <div v-else class="row g-4">
        <div v-for="finca in fincas" :key="finca.id" class="col-md-6 col-lg-4">

          <div class="card h-100 shadow-sm border-0 finca-card">

            <div class="card-header border-0 d-flex justify-content-between align-items-center py-3 bg-light">
              <span class="badge rounded-pill fw-normal" :class="claseEstado(finca.faseAvance)">
                {{ finca.faseAvance }}
              </span>
              <small class="text-muted fw-bold" style="font-size: 0.8rem;">
                {{ finca.tipoFinca }}
              </small>
            </div>

            <div class="card-body">
              <h4 class="card-title fw-bold text-dark-green mb-1">{{ finca.nombre }}</h4>

              <div class="d-flex align-items-center text-muted mb-3 small">
                <span class="me-1">📍</span>
                <span>{{ finca.municipio }}, {{ finca.departamento }}</span>
              </div>

              <hr class="my-3 opacity-25">

              <div class="row g-2 small text-secondary">
                <div class="col-6">
                  <span class="d-block fw-bold text-dark">Producción</span>
                  <span>{{ finca.tipoProduccion || 'Sin definir' }}</span>
                </div>
                <div class="col-6">
                  <span class="d-block fw-bold text-dark">Última Visita</span>
                  <span>{{ formatearFecha(finca.fechaActualizacion) }}</span>
                </div>
              </div>
            </div>

            <div class="card-footer bg-white border-top-0 pb-3 pt-0">
              <button
                @click="irADetalle(finca.id)"
                class="btn btn-success w-100 fw-bold shadow-sm d-flex justify-content-center align-items-center gap-2"
              >
                <span>Ver Panel de Control</span>
                <span>➜</span>
              </button>
            </div>

          </div>

        </div>
      </div>

    </div>

  </div>
</template>

<style scoped>
/* Variables y Reset */
:root {
  --color-primary: #1B5E20;
  --color-secondary: #F9A825;
}

.main-container {
  padding: 2rem;
  background-color: #f4f6f8;
  min-height: 100vh;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

/* Header */
.header-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 6px solid #1B5E20;
}
.logo-img { height: 60px; width: auto; }
.page-title { color: #1B5E20; font-weight: 800; margin: 0; font-size: 1.5rem; }
.subtitle { color: #607D8B; font-size: 0.9rem; margin: 0; }
.text-dark-green { color: #1B5E20; }

/* Empty State */
.empty-state { background: white; border-radius: 12px; }
.icon-placeholder { font-size: 4rem; color: #1B5E20; opacity: 0.3; }

/* Tarjetas (Cards) */
.finca-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
}

.finca-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(27, 94, 32, 0.15) !important;
}

.card-title {
  letter-spacing: -0.5px;
}

/* Botones */
.btn-success {
  background-color: #1B5E20;
  border: none;
  padding: 10px;
  border-radius: 8px;
}
.btn-success:hover {
  background-color: #144418;
}

/* Responsive */
@media (max-width: 768px) {
  .main-container { padding: 1rem; }
  .header-section { flex-direction: column; text-align: center; gap: 1rem; }
  .logo-img { margin-bottom: 0.5rem; margin-right: 0 !important; }
}
</style>
