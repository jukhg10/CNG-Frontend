<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import DashboardGraficos from '../components/DashboardGraficos.vue'; // Asegúrate de tener este componente

const router = useRouter();
const BASE_URL = window.location.hostname.includes('localhost')
  ? 'http://localhost:7292/api'
  : 'https://cng-backend.azurewebsites.net/api';

const fincas = ref([]);
const cargando = ref(true);
const totalFincas = ref(0);

const cargarDatosPublicos = async () => {
  cargando.value = true;
  try {
    // Al no enviar Headers (X-Rol, X-Org), tu Backend actual asume
    // que queremos ver TODO (por la lógica que hicimos antes).
    // Esto es perfecto para estadísticas globales.
    const res = await axios.get(`${BASE_URL}/Fincas`);
    fincas.value = res.data;
    totalFincas.value = res.data.length;
  } catch (error) {
    console.error("Error cargando estadísticas", error);
  } finally {
    cargando.value = false;
  }
};

onMounted(() => {
  cargarDatosPublicos();
});
</script>

<template>
  <div class="public-container">

    <div class="header-banner shadow-sm d-flex justify-content-between align-items-center px-4 py-3">
        <div class="d-flex align-items-center">
            <img src="/logo-cng.png" alt="Logo" height="50" class="me-3">
            <div>
                <h4 class="m-0 fw-bold text-white">Centro de Negocios Ganaderos</h4>
                <small class="text-white opacity-75">Portal de Estadísticas en Tiempo Real</small>
            </div>
        </div>
        <button @click="router.push('/')" class="btn btn-light fw-bold text-success shadow-sm">
            🔐 Iniciar Sesión
        </button>
    </div>

    <div class="container py-5">

        <div class="text-center mb-5 animate__animated animate__fadeInDown">
            <h1 class="display-5 fw-bold text-dark-green">Impacto del Proyecto</h1>
            <p class="lead text-muted">Monitoreo transparente de {{ totalFincas }} predios ganaderos registrados.</p>
        </div>

        <div v-if="cargando" class="text-center py-5">
            <div class="spinner-border text-success" role="status"></div>
            <p class="mt-2 text-muted">Calculando indicadores...</p>
        </div>

        <div v-else-if="fincas.length > 0">
            <DashboardGraficos :fincas="fincas" />
        </div>

        <div v-else class="text-center py-5 text-muted">
            <p>No hay datos públicos disponibles en este momento.</p>
        </div>

    </div>

    <footer class="text-center py-4 text-muted small border-top bg-white mt-auto">
        © 2026 Centro de Negocios Ganaderos. Datos actualizados en tiempo real.
    </footer>

  </div>
</template>

<style scoped>
.public-container {
    background-color: #f8f9fa;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}
.header-banner {
    background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%);
    color: white;
}
.text-dark-green { color: #1B5E20; }
</style>
