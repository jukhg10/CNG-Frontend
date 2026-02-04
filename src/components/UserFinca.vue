<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const fincaId = route.params.id;

// URL Base
const BASE_URL = window.location.hostname.includes('localhost')
  ? 'http://localhost:7292/api'
  : 'https://cng-backend.azurewebsites.net/api';

// Estado
const finca = ref({
  nombre: '',
  areaTotal: 0,
  areaBosques: 0,
  restorUrl: '',
  inventario: [],
  documentos: [],
  comentarios: []
});
const tareasPendientes = ref([]);
const cargando = ref(true);
const nuevoComentario = ref('');
const enviandoComentario = ref(false);

// --- CARGA DE DATOS ---
const cargarTodo = async () => {
  cargando.value = true;
  try {
    // 1. Cargar Datos de la Finca
    const resFinca = await axios.get(`${BASE_URL}/Fincas/${fincaId}`);
    finca.value = resFinca.data;

    // 2. Cargar Plan Operativo
    const resPlan = await axios.get(`${BASE_URL}/PlanOperativo/${fincaId}`);
    tareasPendientes.value = resPlan.data.filter(t => t.estado !== 'Terminado' && t.estado !== 'Cancelado');

  } catch (error) {
    console.error("Error cargando dashboard:", error);
  } finally {
    cargando.value = false;
  }
};

// --- LÓGICA COMPUTADA ---
const totalGanado = computed(() => {
  if (!finca.value.inventario) return 0;
  return finca.value.inventario.reduce((sum, item) => sum + item.cantidad, 0);
});

const porcentajeBosque = computed(() => {
  if (!finca.value.areaTotal || !finca.value.areaBosques) return 0;
  return Math.round((finca.value.areaBosques / finca.value.areaTotal) * 100);
});

// --- ACCIONES ---
const usuarioLogueado = ref({ nombre: 'Usuario' });

onMounted(() => {
    const data = localStorage.getItem('usuario');
    if (data) usuarioLogueado.value = JSON.parse(data);
    cargarTodo();
});

const enviarComentario = async () => {
  if (!nuevoComentario.value.trim()) return;
  enviandoComentario.value = true;
  try {
    const url = `${BASE_URL}/Fincas/${fincaId}/Comentarios`;

    // 👇 CAMBIO AQUÍ: Enviamos el nombre de la Finca como autor
    const autorNombre = finca.value.nombre || 'Propietario';

    const payload = {
        texto: nuevoComentario.value,
        autor: autorNombre
    };

    const res = await axios.post(url, payload);

    finca.value.comentarios.unshift({
      id: res.data.id,
      texto: nuevoComentario.value,
      autor: payload.autor,
      fecha: new Date().toISOString()
    });
    nuevoComentario.value = '';
  } catch (error) {
    alert("Error enviando nota: " + error.message);
  } finally {
    enviandoComentario.value = false;
  }
};

const descargarDoc = (url) => {
  window.open(url, '_blank');
};

const irRestor = () => {
  if (finca.value.restorUrl) window.open(finca.value.restorUrl, '_blank');
  else alert("No hay enlace de mapa configurado para esta finca.");
};

const formatoFecha = (f) => new Date(f).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' });

onMounted(() => {
  cargarTodo();
});
</script>

<template>
  <div class="dashboard-container">

    <div class="d-flex justify-content-between align-items-center mb-4 bg-white p-4 rounded-3 shadow-sm border-top border-5 border-success">
      <div>
        <button @click="router.push('/inicio')" class="btn btn-link text-muted p-0 text-decoration-none mb-1">⬅ Volver a mis predios</button>
        <h2 class="text-success fw-bold m-0">{{ finca.nombre }}</h2>
        <small class="text-muted">📍 {{ finca.municipio }}, {{ finca.departamento }}</small>
      </div>

      <button @click="irRestor" class="btn btn-success btn-lg fw-bold shadow-sm d-flex align-items-center gap-2">
        🌍 Ver Mapa Interactivo
      </button>
    </div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border text-success"></div>
    </div>

    <div v-else class="row g-4">

      <div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm overflow-hidden">
          <div class="card-body p-4 position-relative">
            <div class="display-4 text-success mb-2">🐮</div>
            <h3 class="fw-bold">{{ totalGanado }} Animales</h3>
            <p class="text-muted mb-0">Último conteo registrado</p>
            <div class="position-absolute top-0 end-0 p-3 opacity-25">
              <i class="fs-1">📊</i>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-body p-4">
            <div class="d-flex justify-content-between">
              <div>
                <h6 class="text-muted text-uppercase fw-bold">Área Total</h6>
                <h3 class="fw-bold text-dark">{{ finca.areaTotal || 0 }} Ha</h3>
              </div>
              <div class="text-end">
                <h6 class="text-muted text-uppercase fw-bold">Bosques 🌳</h6>
                <h3 class="fw-bold text-success">{{ finca.areaBosques || 0 }} Ha</h3>
              </div>
            </div>
            <div class="progress mt-3" style="height: 10px;">
              <div class="progress-bar bg-success" :style="{ width: porcentajeBosque + '%' }"></div>
            </div>
            <small class="text-muted mt-2 d-block">{{ porcentajeBosque }}% del predio es conservación</small>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm bg-primary bg-opacity-10">
          <div class="card-body p-4 d-flex flex-column justify-content-center text-center">
            <h5 class="text-primary fw-bold mb-3">📋 Plan Operativo</h5>
            <h2 class="display-6 fw-bold">{{ tareasPendientes.length }}</h2>
            <p class="text-muted">Tareas pendientes</p>
          </div>
        </div>
      </div>

      <div class="col-lg-7">

        <div class="card border-0 shadow-sm mb-4">
          <div class="card-header bg-white border-bottom-0 pt-4 px-4">
            <h5 class="fw-bold text-dark-green">✅ Tareas Pendientes</h5>
          </div>
          <div class="card-body px-4 pb-4">
            <div v-if="tareasPendientes.length === 0" class="alert alert-success bg-opacity-25 border-0">
              ¡Todo al día! No hay tareas pendientes.
            </div>
            <ul v-else class="list-group list-group-flush">
              <li v-for="tarea in tareasPendientes" :key="tarea.id" class="list-group-item px-0 py-3 d-flex align-items-start">
                <input class="form-check-input me-3 mt-1" type="checkbox" disabled>
                <div>
                  <div class="fw-bold text-dark">{{ tarea.actividad }}</div>
                  <small class="text-muted">{{ tarea.tema }} - {{ tarea.responsable }}</small>
                  <span class="badge bg-warning text-dark ms-2 small">{{ tarea.estado }}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-bottom-0 pt-4 px-4 d-flex justify-content-between">
            <h5 class="fw-bold text-dark-green">📂 Documentos del Predio</h5>
          </div>
          <div class="card-body px-4 pb-4">
            <div v-if="!finca.documentos || finca.documentos.length === 0" class="text-center text-muted py-3">
              No hay documentos cargados.
            </div>
            <div v-else class="row g-3">
              <div v-for="(doc, idx) in finca.documentos" :key="idx" class="col-md-6">
                <div class="d-flex align-items-center p-3 border rounded bg-light">
                  <span class="fs-2 me-3">📄</span>
                  <div class="overflow-hidden me-auto">
                    <div class="fw-bold text-truncate">{{ doc.nombreArchivo }}</div>
                    <small class="text-primary cursor-pointer" @click="descargarDoc(doc.url)">Descargar</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div class="col-lg-5">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-success text-white p-3">
            <h5 class="m-0 fw-bold">💬 Notas y Equipo</h5>
          </div>
          <div class="card-body p-0 d-flex flex-column" style="height: 500px;">

            <div class="flex-grow-1 p-3 overflow-auto" style="background: #f8f9fa;">
              <div v-if="finca.comentarios.length === 0" class="text-center text-muted mt-5">
                <p>No hay notas aún.</p>
                <small>Escribe la primera nota abajo.</small>
              </div>
              <div v-else v-for="com in finca.comentarios" :key="com.id" class="mb-3">

                <div class="bg-white p-3 rounded shadow-sm border-start border-3 border-success">

                  <div class="d-flex justify-content-between mb-1">
                    <strong class="text-success small">
                      👤 {{ com.autor || 'Desconocido' }}
                    </strong>
                    <small class="text-muted" style="font-size: 0.7rem;">
                      {{ formatoFecha(com.fecha) }}
                    </small>
                  </div>

                  <p class="mb-0 text-dark">{{ com.texto }}</p>

                </div>

              </div>
            </div>

            <div class="p-3 bg-white border-top">
              <label class="form-label small fw-bold text-muted">Dejar una nota al equipo CNG:</label>
              <textarea v-model="nuevoComentario" class="form-control mb-2" rows="2" placeholder="Escribe aquí..."></textarea>
              <button @click="enviarComentario" :disabled="enviandoComentario" class="btn btn-success w-100 fw-bold">
                {{ enviandoComentario ? 'Enviando...' : 'Enviar Nota 📨' }}
              </button>
            </div>

          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 2rem;
  background-color: #f0f2f5;
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
}
.text-dark-green { color: #1B5E20; }
.cursor-pointer { cursor: pointer; text-decoration: underline; }
.cursor-pointer:hover { color: #1B5E20; }
</style>
