<script setup>
import { ref, onMounted, computed } from 'vue'; // Quitamos 'watch' que no hace falta
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

// --- CONFIGURACIÓN ---
const route = useRoute();
const router = useRouter();

const BASE_URL = window.location.hostname.includes('localhost')
  ? 'http://localhost:7292/api'
  : 'https://cng-backend.azurewebsites.net/api';

const API_PLAN = `${BASE_URL}/PlanOperativo`;
const API_FINCAS = `${BASE_URL}/Fincas`;

// --- ESTADO ---
const fincaSeleccionada = ref(null);
const listaFincas = ref([]);
const terminoBusqueda = ref('');
const tareas = ref([]);
const cargando = ref(false);
const mostrarModal = ref(false);
const guardando = ref(false);

// Listas (ahora son refs para poder empujarles datos nuevos)
const listaTemas = ref(['Reunión', 'Montaje', 'Capacitación', 'Infraestructura', 'Sanidad', 'Nutrición']);
const listaTipos = ref(['Seguimiento', 'Compra de insumos', 'Mano de obra', 'Servicios', 'Otros']);
const listaEstados = ['Por hacer', 'En progreso', 'Terminado', 'Cancelado'];

// Variables para manejar inputs personalizados
const temaPersonalizado = ref('');
const tipoPersonalizado = ref('');

const form = ref({
  id: 0,
  fincaId: null,
  tema: '',       // Lo dejamos vacío para obligar a seleccionar
  actividad: '',
  responsable: 'CNG - Propietarios',
  observaciones: '',
  tipoTarea: '',  // Lo dejamos vacío
  actualizacion: '',
  estado: 'Por hacer',
  presupuesto: 0
});

// --- LÓGICA DE BUSCADOR ---
const cargarListaFincas = async () => {
  try {
    const res = await axios.get(API_FINCAS);
    listaFincas.value = res.data;
    if (route.params.id) {
      const encontrada = listaFincas.value.find(f => f.id === route.params.id);
      if (encontrada) seleccionarFinca(encontrada);
    }
  } catch (error) { console.error("Error cargando fincas:", error); }
};

const seleccionarFinca = (finca) => {
  fincaSeleccionada.value = finca;
  terminoBusqueda.value = finca.nombre;
  cargarTareas(finca.id);
  router.replace(`/admin/plan-operativo/${finca.id}`);
};

const cambiarFinca = () => {
  fincaSeleccionada.value = null;
  tareas.value = [];
  terminoBusqueda.value = '';
  router.replace('/admin/plan-operativo');
};

// --- LÓGICA CRUD ---
const cargarTareas = async (id) => {
  cargando.value = true;
  try {
    const res = await axios.get(`${API_PLAN}/${id}`);
    tareas.value = res.data;
  } catch (error) { console.error(error); }
  finally { cargando.value = false; }
};

const guardarTarea = async () => {
  // 1. Validaciones
  if (!form.value.actividad.trim()) return alert("La actividad es obligatoria.");

  // 2. Procesar Tema Personalizado
  if (form.value.tema === 'OTRO') {
    if (!temaPersonalizado.value.trim()) return alert("Escribe el nombre del nuevo tema.");
    form.value.tema = temaPersonalizado.value.trim();
    // Agregarlo a la lista para el futuro
    if (!listaTemas.value.includes(form.value.tema)) {
      listaTemas.value.push(form.value.tema);
    }
  }

  // 3. Procesar Tipo Personalizado
  if (form.value.tipoTarea === 'OTRO') {
    if (!tipoPersonalizado.value.trim()) return alert("Escribe el nombre del nuevo tipo.");
    form.value.tipoTarea = tipoPersonalizado.value.trim();
    if (!listaTipos.value.includes(form.value.tipoTarea)) {
      listaTipos.value.push(form.value.tipoTarea);
    }
  }

  // Validar que no se hayan quedado vacíos
  if (!form.value.tema) return alert("Selecciona un tema.");
  if (!form.value.tipoTarea) return alert("Selecciona un tipo.");

  guardando.value = true;
  try {
    form.value.fincaId = fincaSeleccionada.value.id;

    if (form.value.id === 0) {
      await axios.post(API_PLAN, form.value);
    } else {
      await axios.put(`${API_PLAN}/${form.value.id}`, form.value);
    }
    cerrarModal();
    cargarTareas(fincaSeleccionada.value.id);
  } catch (error) {
    alert('Error al guardar. Revisa conexión: ' + error.message );
  } finally {
    guardando.value = false;
  }
};

const eliminarTarea = async (id) => {
  if (!confirm('¿Eliminar tarea permanentemente?')) return;
  try {
    await axios.delete(`${API_PLAN}/${id}`);
    cargarTareas(fincaSeleccionada.value.id);
  } catch (error) { alert('Error al eliminar: ' + error.message); }
};

const cambioRapidoEstado = async (tarea) => {
  try { await axios.put(`${API_PLAN}/${tarea.id}`, tarea); }
  catch (error) { alert("Error al actualizar estado: " + error.message); cargarTareas(fincaSeleccionada.value.id); }
};

// --- MODALES ---
const abrirModal = (tarea = null) => {
  // Limpiamos variables temporales
  temaPersonalizado.value = '';
  tipoPersonalizado.value = '';

  if (tarea) {
    form.value = { ...tarea };
  } else {
    form.value = {
      id: 0,
      fincaId: fincaSeleccionada.value.id,
      tema: listaTemas.value[0], // Pre-seleccionar el primero
      actividad: '',
      responsable: 'CNG - Propietarios',
      observaciones: '',
      tipoTarea: listaTipos.value[0], // Pre-seleccionar el primero
      actualizacion: '',
      estado: 'Por hacer',
      presupuesto: 0
    };
  }
  mostrarModal.value = true;
};
const cerrarModal = () => mostrarModal.value = false;

const totalPresupuesto = computed(() => tareas.value.reduce((sum, t) => sum + (t.presupuesto || 0), 0));
const formatoMoneda = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0);

const claseEstado = (e) => {
  if(e==='Terminado') return 'bg-success text-white';
  if(e==='En progreso') return 'bg-warning text-dark';
  if(e==='Cancelado') return 'bg-danger text-white';
  return 'bg-light text-dark border';
};

const fincasFiltradas = computed(() => {
  if (!terminoBusqueda.value) return listaFincas.value;
  return listaFincas.value.filter(f =>
    f.nombre.toLowerCase().includes(terminoBusqueda.value.toLowerCase())
  );
});


onMounted(() => {
  cargarListaFincas();
});
</script>

<template>
  <div class="container-fluid py-4 bg-light min-vh-100">

    <div class="d-flex justify-content-between align-items-center mb-4 px-2">
      <button @click="$router.push('/admin')" class="btn btn-outline-secondary fw-bold shadow-sm">
        ⬅ Volver a Admin Fincas
      </button>
      <button @click="$router.push('/usuarios')" class="btn btn-outline-primary fw-bold shadow-sm">
        👥 Ir a Admin Usuarios
      </button>
    </div>

    <div v-if="!fincaSeleccionada" class="row justify-content-center animate__animated animate__fadeIn">
      <div class="col-md-8 col-lg-7 mt-3">
        <div class="card shadow-lg border-0 rounded-4 overflow-hidden">

          <div class="card-header bg-success text-white p-4 text-center border-0">
            <div class="display-4 mb-2">🔎</div>
            <h2 class="fw-bold m-0">Seleccionar Finca</h2>
            <p class="opacity-75 mb-0">Gestiona los planes operativos y presupuestos</p>
          </div>

          <div class="card-body p-4 bg-white">

            <div class="position-relative mb-4">
              <input
                v-model="terminoBusqueda"
                type="text"
                class="form-control form-control-lg border-success shadow-sm ps-5"
                placeholder="Escribe para filtrar..."
                autofocus
              >
              <span class="position-absolute top-50 start-0 translate-middle-y ms-3 fs-5 text-muted">🔍</span>
            </div>

            <div class="list-container border rounded shadow-sm">

              <div v-if="fincasFiltradas.length === 0" class="text-center py-5 text-muted">
                <p class="mb-0">No se encontraron fincas con ese nombre.</p>
              </div>

              <div
                v-else
                v-for="finca in fincasFiltradas"
                :key="finca.id"
                @click="seleccionarFinca(finca)"
                class="finca-item d-flex justify-content-between align-items-center p-3 border-bottom cursor-pointer"
              >
                <div class="d-flex align-items-center gap-3">
                  <div class="avatar-finca bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center fw-bold">
                    {{ finca.nombre.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <h5 class="mb-0 fw-bold text-dark">{{ finca.nombre }}</h5>
                    <small class="text-muted">Productor: {{ finca.nombreProductor }}</small>
                  </div>
                </div>
                <span class="text-primary fw-bold small">Ver Plan ➜</span>
              </div>

            </div>

            <div class="mt-3 text-center text-muted small">
              Mostrando {{ fincasFiltradas.length }} de {{ listaFincas.length }} predios
            </div>

          </div>
        </div>
      </div>
    </div>

    <div v-else class="animate__animated animate__fadeIn">
      <div class="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded shadow-sm border-start border-5 border-success">
        <div>
          <small class="text-muted text-uppercase fw-bold">Plan Operativo de:</small>
          <h2 class="text-success m-0 fw-bold">🏡 {{ fincaSeleccionada.nombre }}</h2>
          <small class="text-muted">Productor: {{ fincaSeleccionada.nombreProductor }}</small>
        </div>
        <div class="d-flex gap-2 align-items-center">
          <button @click="cambiarFinca" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2">
            <span>🔄</span> Cambiar Finca
          </button>
          <div class="vr mx-2"></div>
          <button @click="abrirModal()" class="btn btn-warning fw-bold shadow-sm">
            + Nueva Tarea
          </button>
        </div>
      </div>

      <div class="card border-0 shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-success text-white">
              <tr>
                <th class="ps-3">Tema</th>
                <th style="width: 25%">Actividad</th>
                <th>Responsable</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th class="text-end">Presupuesto</th>
                <th class="text-end pe-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="tareas.length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
                  <p class="mb-2">Esta finca aún no tiene tareas en su plan.</p>
                  <button @click="abrirModal()" class="btn btn-sm btn-outline-success">Crear primera tarea</button>
                </td>
              </tr>
              <tr v-for="tarea in tareas" :key="tarea.id">
                <td class="ps-3">
                  <span class="badge rounded-pill bg-success bg-opacity-10 text-success border border-success">{{ tarea.tema }}</span>
                </td>
                <td>
                  <div class="fw-bold">{{ tarea.actividad }}</div>
                  <small v-if="tarea.observaciones" class="text-muted d-block text-truncate" style="max-width: 250px;">{{ tarea.observaciones }}</small>
                  <div v-if="tarea.actualizacion" class="text-info small fw-bold">📢 {{ tarea.actualizacion }}</div>
                </td>
                <td class="small">{{ tarea.responsable }}</td>
                <td><span class="badge bg-light text-dark border">{{ tarea.tipoTarea }}</span></td>
                <td>
                  <select v-model="tarea.estado" @change="cambioRapidoEstado(tarea)" class="form-select form-select-sm fw-bold border-0" :class="claseEstado(tarea.estado)" style="width: 140px;">
                    <option v-for="e in listaEstados" :key="e" :value="e">{{ e }}</option>
                  </select>
                </td>
                <td class="text-end font-monospace fw-bold">{{ formatoMoneda(tarea.presupuesto) }}</td>
                <td class="text-end pe-3">
                  <button @click="abrirModal(tarea)" class="btn btn-sm btn-light text-primary me-1">✏️</button>
                  <button @click="eliminarTarea(tarea.id)" class="btn btn-sm btn-light text-danger">🗑️</button>
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-light">
              <tr>
                <td colspan="5" class="text-end fw-bold py-3 text-uppercase text-muted">Total Inversión:</td>
                <td class="text-end fw-bold fs-5 py-3 text-success">{{ formatoMoneda(totalPresupuesto) }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <div v-if="mostrarModal" class="modal-overlay animate__animated animate__fadeIn">

      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content shadow-lg border-0">

          <div class="modal-header bg-success text-white">
            <h5 class="modal-title fw-bold">
              {{ form.id === 0 ? '✨ Nueva Tarea' : '📝 Editar Tarea' }}
            </h5>
            <button @click="cerrarModal" class="btn-close btn-close-white"></button>
          </div>

          <div class="modal-body p-4 bg-white">
            <form @submit.prevent="guardarTarea">
              <div class="row g-3">

                <div class="col-md-6">
                  <label class="form-label fw-bold small text-muted">Tema</label>
                  <select v-model="form.tema" class="form-select">
                    <option v-for="t in listaTemas" :key="t" :value="t">{{ t }}</option>
                    <option value="OTRO" class="fw-bold text-primary">➕ Crear nuevo tema...</option>
                  </select>

                  <div v-if="form.tema === 'OTRO'" class="mt-2 animate__animated animate__fadeIn">
                    <input
                      v-model="temaPersonalizado"
                      ref="inputTemaRef"
                      type="text"
                      class="form-control border-primary bg-primary bg-opacity-10"
                      placeholder="Escribe el nombre del tema..."
                      autofocus
                    >
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-bold small text-muted">Tipo de Tarea</label>
                  <select v-model="form.tipoTarea" class="form-select">
                    <option v-for="t in listaTipos" :key="t" :value="t">{{ t }}</option>
                    <option value="OTRO" class="fw-bold text-primary">➕ Crear nuevo tipo...</option>
                  </select>

                  <div v-if="form.tipoTarea === 'OTRO'" class="mt-2 animate__animated animate__fadeIn">
                    <input
                      v-model="tipoPersonalizado"
                      type="text"
                      class="form-control border-primary bg-primary bg-opacity-10"
                      placeholder="Escribe el nombre del tipo..."
                    >
                  </div>
                </div>

                <div class="col-12">
                  <label class="form-label fw-bold small text-muted">Actividad Principal *</label>
                  <input v-model="form.actividad" required class="form-control" placeholder="Ej: Compra de fertilizantes">
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-bold small text-muted">Responsable</label>
                  <input v-model="form.responsable" class="form-control">
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-bold small text-muted">Presupuesto ($)</label>
                  <input v-model.number="form.presupuesto" type="number" class="form-control text-end">
                </div>

                <div class="col-12">
                  <label class="form-label fw-bold small text-muted">Observaciones</label>
                  <textarea v-model="form.observaciones" class="form-control" rows="2"></textarea>
                </div>

                <div v-if="form.id !== 0" class="col-12 bg-warning bg-opacity-10 p-3 rounded mt-2 border border-warning">
                  <label class="form-label fw-bold small text-dark">📢 Bitácora / Avance</label>
                  <textarea v-model="form.actualizacion" class="form-control" rows="2" placeholder="Novedades..."></textarea>
                </div>

              </div>

              <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button type="button" @click="cerrarModal" class="btn btn-light border">Cancelar</button>
                <button type="submit" :disabled="guardando" class="btn btn-success fw-bold px-4">
                  {{ guardando ? 'Guardando...' : 'Guardar Datos' }}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
    <div v-if="mostrarModal" class="modal-backdrop-bg"></div>

  </div>
</template>

<style scoped>
.list-container {
  max-height: 400px;
  overflow-y: auto;
  background: #f8f9fa;
}

.finca-item {
  transition: all 0.2s ease;
  background: white;
}
.finca-item:hover {
  background-color: #f1f8e9;
  padding-left: 1.5rem !important;
}

.avatar-finca {
  width: 45px; height: 45px;
  font-size: 1.2rem;
}

.cursor-pointer { cursor: pointer; }

/* --- ARREGLO DEL FONDO DEL MODAL --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  /* Fondo oscuro semitransparente REAL */
  background-color: rgba(0, 0, 0, 0.65);
  /* Efecto de desenfoque en el fondo (moderno) */
  backdrop-filter: blur(4px);
  z-index: 1050; /* Por encima de todo */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Aseguramos que el diálogo tenga ancho correcto */
.modal-dialog {
  width: 100%;
  max-width: 800px;
  margin: 1rem;
}

/* Forzamos fondo blanco solido en el contenido */
.modal-content {
  background-color: #ffffff !important;
  opacity: 1 !important;
}
</style>
