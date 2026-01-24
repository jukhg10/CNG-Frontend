<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
// --- 1. CONFIGURACIÓN Y ESTADO ---
const API_URL = import.meta.env.PROD
  ? 'https://cng-backend.azurewebsites.net/api'  // URL DE PRODUCCIÓN
  : 'http://localhost:7292/api';

const router = useRouter()
const usuarioLogueado = ref({ nombre: 'Usuario' })
const fincas = ref([])
const cargando = ref(false)
const mostrarModal = ref(false)
const guardando = ref(false)
const subiendoArchivo = ref(false) // <--- NUEVO: Estado para la subida

// Filtros de búsqueda
const filtroNombre = ref('')
const filtroFase = ref('')

// Listas de Opciones
const listaFases = ['Diagnostico', 'Implementacion', 'Seguimiento', 'Retiro']
const categoriasGanado = ['Vaca parida', 'Novilla', 'Ternera', 'Toro', 'Macho de ceba', 'Búfalo']

// --- 2. MODELO DE DATOS (FORMULARIO) ---
const formFinca = ref({
  id: null,
  nombre: '',
  tipoFinca: 'Administrar',
  departamento: '',
  municipio: '',
  vereda: '',
  coordenadas: '',
  restorUrl: '', // Aquí se guardará el link del documento/mapa
  faseAvance: 'Diagnostico',
  lineaBase: '',
  tipoProduccion: '',
  asistioEvento: false,
  documentos: [],
  // --- NUEVO: LOS 4 PILARES ---
  pilarProductivo: 0,
  pilarSocioEconomico: 0,
  pilarAmbiental: 0,
  pilarParticipacion: 0,

  // Lista de animales (Relación 1 a muchos)
  inventario: []
})

// Estado temporal para agregar una fila de inventario
const inventarioTemp = ref({
  categoria: 'Vaca parida',
  cantidad: 0
})

// --- 3. FUNCIONES DE LÓGICA ---

const cargarFincas = async () => {
  cargando.value = true
  try {
    const respuesta = await axios.get(API_URL)
    fincas.value = respuesta.data
  } catch (error) {
    alert('Error: ' + error.message)
  } finally {
    cargando.value = false
  }
}
const cerrarSesion = () => {
  localStorage.removeItem('usuario')
  router.push('/')
}
// 2. Guardar (Crear o Editar)
const guardarFinca = async () => {
  guardando.value = true
  try {
    // 1. Creamos una copia de los datos para no modificar el formulario visual
    const payload = { ...formFinca.value }

    // 2. TRUCO CLAVE: Si el ID es null o vacío, LO BORRAMOS del paquete.
    // Así C# generará uno nuevo automáticamente en lugar de chillar por el null.
    if (!payload.id) {
      delete payload.id
    }

    if (formFinca.value.id) {
      // Si TIENE id, es una ACTUALIZACIÓN (PUT)
      await axios.put(API_URL, payload)
      alert('¡Finca actualizada correctamente!')
    } else {
      // Si NO tiene id, es CREACIÓN (POST)
      await axios.post(API_URL, payload)
      alert('¡Finca creada exitosamente!')
    }

    cerrarModal()
    cargarFincas()
  } catch (error) {
    console.error(error)
    // Mostramos el mensaje exacto que devuelve el servidor si existe
    const mensajeServidor = error.response && error.response.data ? error.response.data : error.message
    alert('Error al guardar: ' + mensajeServidor)
  } finally {
    guardando.value = false
  }
}

// 3. Eliminar
const eliminarFinca = async (id) => {
  if (!confirm('¿Estás seguro de que deseas eliminar esta finca? Esta acción no se puede deshacer.')) return

  try {
    // Llamamos al endpoint con ID: /api/Fincas/{id}
    await axios.delete(`${API_URL}/${id}`)
    alert('Finca eliminada.')
    cargarFincas()
  } catch (error) {
    alert('Error al eliminar: ' + error.message)
  }
}

// 4. Preparar Edición
const editarFinca = async (fincaSeleccionada) => {
  // Primero abrimos el modal
  mostrarModal.value = true

  // Ponemos un estado de carga temporal en el formulario si quieres, o simplemente esperamos
  // Cargamos los datos básicos que ya tenemos en la tabla
  formFinca.value = { ...fincaSeleccionada, inventario: [] }

  // AHORA: Llamamos a la API para traer el inventario completo de esta finca
  try {
    const respuesta = await axios.get(`${API_URL}/${fincaSeleccionada.id}`)
    // Si la API responde bien, llenamos el inventario y los pilares detallados
    if (respuesta.data) {
        formFinca.value = respuesta.data
        // Aseguramos que si el inventario viene nulo, sea un array vacío
        if (!formFinca.value.inventario) formFinca.value.inventario = []
    }
  } catch (error) {
    console.error("Error cargando detalles", error)
  }
}

// --- NUEVO: FUNCIÓN PARA SUBIR ARCHIVO ---
const subirArchivo = async (event) => {
  const archivo = event.target.files[0]
  if (!archivo) return

  subiendoArchivo.value = true
  const formData = new FormData()
  formData.append('archivo', archivo)

  try {
    // 1. Subimos el físico a Azure
    const respuesta = await axios.post('http://localhost:7292/api/SubirDocumento', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    // 2. Agregamos a la lista visual para que el usuario edite el nombre
    // Nota: Usamos Date.now() como ID temporal para evitar problemas de borrado con Vue
    formFinca.value.documentos.push({
      tempId: Date.now(),
      nombreArchivo: archivo.name, // Nombre original por defecto
      url: respuesta.data.url
    })

    // Limpiamos el input para poder subir otro
    event.target.value = ''

  } catch (error) {
    console.error(error)
    alert("Error al subir archivo: " + error.message)
  } finally {
    subiendoArchivo.value = false
  }
}
const quitarDocumento = (index) => {
  // Agregamos la confirmación nativa del navegador
  if (confirm("¿Estás seguro de que deseas eliminar este documento de la lista?")) {
    formFinca.value.documentos.splice(index, 1)
  }
}
// --- Gestión del Modal e Inventario ---

const abrirModalCrear = () => {
  // Resetear formulario completamente
  formFinca.value = {
    id: null,
    nombre: '',
    tipoFinca: 'Administrar',
    faseAvance: 'Diagnostico',
    tipoProduccion: '',
    asistioEvento: false,
    // Resetear pilares
    pilarProductivo: 0,
    pilarSocioEconomico: 0,
    pilarAmbiental: 0,
    pilarParticipacion: 0,
    inventario: []
  }
  // Resetear temp
  inventarioTemp.value = { categoria: 'Vaca parida', cantidad: 0 }

  mostrarModal.value = true
}

const cerrarModal = () => mostrarModal.value = false

// Agregar fila a la tabla local de inventario
const agregarAnimal = () => {
  if (inventarioTemp.value.cantidad > 0) {
    formFinca.value.inventario.push({
      categoria: inventarioTemp.value.categoria,
      cantidad: inventarioTemp.value.cantidad
    })
    // Limpiar input de cantidad para el siguiente
    inventarioTemp.value.cantidad = 0
  } else {
    alert('La cantidad debe ser mayor a 0')
  }
}

// Eliminar fila de la tabla local
const borrarAnimal = (index) => {
  formFinca.value.inventario.splice(index, 1)
}

// --- Filtros Computados ---
const fincasFiltradas = computed(() => {
  return fincas.value.filter(f => {
    const coincideNombre = f.nombre.toLowerCase().includes(filtroNombre.value.toLowerCase())
    const coincideFase = filtroFase.value ? f.faseAvance === filtroFase.value : true
    return coincideNombre && coincideFase
  })
})

// Cargar al iniciar
onMounted(() => {
  // Recuperar datos del usuario guardado
  const datosUsuario = localStorage.getItem('usuario')
  if (datosUsuario) {
    usuarioLogueado.value = JSON.parse(datosUsuario)
  }

  cargarFincas()
})
</script>

<template>
  <div class="main-container">

    <div class="header-section mb-4 d-flex justify-content-between align-items-center">

      <div class="d-flex align-items-center">
        <img src="/logo-cng.png" alt="Logo CNG" class="logo-img me-3">
        <div>
          <h2 class="page-title">Centro de Negocios Ganaderos</h2>
          <p class="subtitle">Plataforma de Gestión y Monitoreo</p>
        </div>
      </div>

      <div class="user-panel d-flex align-items-center gap-3">
        <div class="text-end d-none d-md-block">
          <div class="fw-bold text-dark-green">{{ usuarioLogueado.nombre }}</div>
          <div class="small text-muted">{{ usuarioLogueado.rol || 'Administrador' }}</div>
        </div>
        <div class="user-avatar">
          {{ usuarioLogueado.nombre.charAt(0).toUpperCase() }}
        </div>
        <button
          v-if="usuarioLogueado.rol === 'Admin'"
          @click="$router.push('/usuarios')"
          class="btn btn-sm btn-outline-primary">
          👥 Usuarios
        </button>
        <button @click="cerrarSesion" class="btn btn-outline-danger btn-sm" title="Cerrar Sesión">
          Salir 🚪
        </button>
      </div>
    </div>

    <div class="control-panel shadow-sm">
      <div class="row g-3 align-items-end">
        <div class="col-md-4">
          <label class="form-label custom-label">Buscar Predio</label>
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0">🔍</span>
            <input v-model="filtroNombre" type="text" class="form-control border-start-0 ps-0" placeholder="Nombre de la finca...">
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label custom-label">Filtro por Fase</label>
          <select v-model="filtroFase" class="form-select">
            <option value="">Todas las fases</option>
            <option v-for="fase in listaFases" :key="fase" :value="fase">{{ fase }}</option>
          </select>
        </div>
        <div class="col-md-2">
          <button @click="cargarFincas" class="btn btn-outline-custom w-100">
             Actualizar
          </button>
        </div>
        <div class="col-md-3 text-end">
          <button @click="abrirModalCrear" class="btn btn-primary-custom w-100">
             + Nueva Finca
          </button>
        </div>
      </div>
    </div>

    <div class="table-container shadow-sm">
      <table class="table custom-table">
        <thead>
          <tr>
            <th>Nombre del Predio</th>
            <th>Tipo</th>
            <th>Ubicación</th>
            <th>Estado Actual</th>
            <th>Producción</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando">
            <td colspan="6" class="text-center py-4 text-muted">Cargando información...</td>
          </tr>
          <tr v-else-if="fincasFiltradas.length === 0">
            <td colspan="6" class="text-center py-4 text-muted">No se encontraron registros.</td>
          </tr>
          <tr v-for="finca in fincasFiltradas" :key="finca.id">
            <td class="fw-bold text-dark-green">{{ finca.nombre }}</td>
            <td>
              <span class="badge-custom" :class="finca.tipoFinca === 'Administrar' ? 'badge-admin' : 'badge-censo'">
                {{ finca.tipoFinca }}
              </span>
            </td>
            <td class="text-muted">{{ finca.municipio }}</td>
            <td>
              <span class="status-indicator">
                <span class="dot" :class="finca.faseAvance.toLowerCase()"></span> {{ finca.faseAvance }}
              </span>
            </td>
            <td>{{ finca.tipoProduccion }}</td>
            <td class="text-end">
              <button @click="editarFinca(finca)" class="btn-icon" title="Editar">✏️</button>

              <button @click="eliminarFinca(finca.id)" class="btn-icon delete" title="Eliminar">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="mostrarModal" class="modal-backdrop">
      <div class="modal-card shadow-lg">

        <div class="modal-header-custom">
          <h4>Registro de Nuevo Predio</h4>
          <button @click="cerrarModal" class="close-btn">×</button>
        </div>

        <div class="modal-body-custom">
          <form @submit.prevent="guardarFinca">
            <div class="row g-3">

              <div class="col-12 section-title">Datos Generales</div>
              <div class="col-md-6">
                <label class="form-label">Nombre de la Finca *</label>
                <input v-model="formFinca.nombre" required type="text" class="form-control">
              </div>
              <div class="col-md-6">
                <label class="form-label">Propósito</label>
                <select v-model="formFinca.tipoFinca" class="form-select">
                  <option value="Administrar">Administrar</option>
                  <option value="Censo">Censo</option>
                </select>
              </div>

              <div class="col-12 section-title mt-4">Ubicación Geográfica</div>
              <div class="col-md-4">
                <label class="form-label">Departamento</label>
                <input v-model="formFinca.departamento" type="text" class="form-control">
              </div>
              <div class="col-md-4">
                <label class="form-label">Municipio</label>
                <input v-model="formFinca.municipio" type="text" class="form-control">
              </div>
              <div class="col-md-4">
                <label class="form-label">Vereda</label>
                <input v-model="formFinca.vereda" type="text" class="form-control">
              </div>
              <div class="col-md-6">
                <label class="form-label">Coordenadas</label>
                <input v-model="formFinca.coordenadas" type="text" class="form-control" placeholder="Lat, Long">
              </div>
              <div class="col-md-6">
                <label class="form-label">Enlace Mapa (Texto)</label>
                <input v-model="formFinca.restorUrl" type="text" class="form-control" placeholder="URL generada automáticamente abajo">
              </div>

              <div class="col-12 section-title mt-4">Detalles Técnicos</div>
              <div class="col-md-4">
                <label class="form-label">Fase Actual</label>
                <select v-model="formFinca.faseAvance" class="form-select">
                  <option v-for="fase in listaFases" :key="fase" :value="fase">{{ fase }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Sistema Productivo</label>
                <input v-model="formFinca.tipoProduccion" type="text" class="form-control" placeholder="Ej: Leche, Cría">
              </div>
              <div class="col-md-4 pt-4">
                <label class="custom-checkbox">
                  <input v-model="formFinca.asistioEvento" type="checkbox">
                  <span class="checkmark"></span>
                  Asistió a Capacitación
                </label>
              </div>

              <div class="col-12 section-title mt-4">Puntaje 4 Pilares</div>
              <div class="col-md-3">
                <label class="form-label text-muted small">Productivo</label>
                <input v-model.number="formFinca.pilarProductivo" type="number" step="0.1" class="form-control">
              </div>
              <div class="col-md-3">
                <label class="form-label text-muted small">Socio-Económico</label>
                <input v-model.number="formFinca.pilarSocioEconomico" type="number" step="0.1" class="form-control">
              </div>
              <div class="col-md-3">
                <label class="form-label text-muted small">Ambiental</label>
                <input v-model.number="formFinca.pilarAmbiental" type="number" step="0.1" class="form-control">
              </div>
              <div class="col-md-3">
                <label class="form-label text-muted small">Participación</label>
                <input v-model.number="formFinca.pilarParticipacion" type="number" step="0.1" class="form-control">
              </div>

              <div class="col-12 section-title mt-4">Inventario Ganadero</div>

              <div class="col-12 bg-light p-3 rounded">
                <div class="row g-2 align-items-end">
                  <div class="col-md-5">
                    <label class="form-label small text-muted">Categoría</label>
                    <select v-model="inventarioTemp.categoria" class="form-select form-select-sm">
                      <option v-for="cat in categoriasGanado" :key="cat" :value="cat">{{ cat }}</option>
                    </select>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label small text-muted">Cantidad</label>
                    <input v-model.number="inventarioTemp.cantidad" type="number" min="0" class="form-control form-control-sm">
                  </div>
                  <div class="col-md-4">
                    <button type="button" @click="agregarAnimal" class="btn btn-sm btn-outline-success w-100">
                      + Agregar
                    </button>
                  </div>
                </div>

                <div v-if="formFinca.inventario.length > 0" class="mt-3 table-responsive bg-white border rounded">
                  <table class="table table-sm mb-0">
                    <thead class="table-light">
                      <tr>
                        <th class="ps-3">Categoría</th>
                        <th>Cant.</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in formFinca.inventario" :key="index">
                        <td class="ps-3">{{ item.categoria }}</td>
                        <td class="fw-bold">{{ item.cantidad }}</td>
                        <td class="text-end pe-3">
                          <button type="button" @click="borrarAnimal(index)" class="btn btn-link text-danger p-0 text-decoration-none">×</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="text-center mt-2 text-muted small">
                  No se han agregado animales aún.
                </div>
              </div>

            <div class="col-12 section-title mt-4">Documentación y Mapas</div>

              <div class="col-12">
                  <div class="mb-3">
                      <label class="form-label small text-muted">Agregar nuevo documento:</label>
                      <div class="input-group">
                          <input type="file" @change="subirArchivo" class="form-control" :disabled="subiendoArchivo">
                          <span v-if="subiendoArchivo" class="input-group-text bg-warning text-dark">⏳ Subiendo...</span>
                      </div>
                  </div>

                  <div v-if="formFinca.documentos && formFinca.documentos.length > 0" class="card border-0 bg-light">
                      <div class="card-body p-2">
                          <div v-for="(doc, index) in formFinca.documentos" :key="doc.tempId || index" class="d-flex align-items-center mb-2 bg-white p-2 rounded border shadow-sm">

                              <div class="me-3 fs-4">📄</div>

                              <div class="flex-grow-1 me-3">
                                  <label class="form-label visually-hidden">Nombre del archivo</label>
                                  <input
                                    v-model="doc.nombreArchivo"
                                    type="text"
                                    class="form-control form-control-sm fw-bold text-primary"
                                    placeholder="Nombre del documento..."
                                  >
                                  <a :href="doc.url" target="_blank" class="small text-muted text-decoration-none mt-1 d-inline-block">
                                      👁️ Ver archivo original
                                  </a>
                              </div>

                              <button type="button" @click="quitarDocumento(index)" class="btn btn-outline-danger btn-sm" title="Quitar de la lista">
                                  🗑️
                              </button>
                          </div>
                      </div>
                  </div>

                  <div v-else class="text-center p-4 border border-dashed rounded text-muted">
                      <p class="mb-0 small">No hay documentos adjuntos todavía.</p>
                  </div>
              </div>
            </div>

            <div class="modal-footer-custom mt-4 pt-3 border-top">
              <button type="button" @click="cerrarModal" class="btn btn-outline-secondary me-2">Cancelar</button>
              <button type="submit" :disabled="guardando" class="btn btn-primary-custom px-4">
                {{ guardando ? 'Guardando...' : 'Guardar Registro' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* --- VARIABLES DE COLOR --- */
:root {
  --color-primary: #1B5E20;      /* Verde Bosque */
  --color-secondary: #F9A825;    /* Amarillo Ámbar */
  --color-text-dark: #263238;
}

/* --- ESTRUCTURA --- */
.main-container {
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: #263238;
  background-color: #f4f6f8;
  min-height: 100vh;
  padding: 2rem;
}

/* --- HEADER --- */
.header-section {
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 8px;
  border-left: 5px solid #1B5E20;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.logo-img {
  height: 80px;
  width: auto;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
  transition: transform 0.3s ease;
}
.logo-img:hover { transform: scale(1.05); }

.page-title { color: #1B5E20; font-weight: 700; margin: 0; }
.subtitle { color: #546E7A; font-size: 0.95rem; margin: 0; }

/* --- CONTROLES --- */
.control-panel {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border-top: 4px solid #1B5E20;
  margin-bottom: 2rem;
}

/* --- BOTONES --- */
.btn-primary-custom {
  background-color: #F9A825;
  color: #212121;
  border: none;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 4px;
  transition: all 0.3s;
}
.btn-primary-custom:hover {
  background-color: #FBC02D;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
}

.btn-outline-custom {
  border: 1px solid #1B5E20;
  color: #1B5E20;
  background: transparent;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 4px;
}
.btn-outline-custom:hover { background-color: #E8F5E9; }

/* --- TABLA --- */
.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}
.custom-table thead th {
  background-color: #2E7D32;
  color: white;
  font-weight: 500;
  padding: 1rem;
}
.custom-table tbody td {
  padding: 1rem;
  vertical-align: middle;
  border-bottom: 1px solid #f0f0f0;
}
.text-dark-green { color: #1B5E20; }

/* --- BADGES --- */
.badge-custom {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}
.badge-admin { background-color: #E3F2FD; color: #1565C0; border: 1px solid #BBDEFB; }
.badge-censo { background-color: #FFF3E0; color: #EF6C00; border: 1px solid #FFE0B2; }

.status-indicator { font-size: 0.9rem; font-weight: 500; }
.dot {
  height: 10px; width: 10px; border-radius: 50%; display: inline-block; margin-right: 5px;
}
.dot.diagnostico { background-color: #F9A825; }
.dot.implementacion { background-color: #2E7D32; }

.btn-icon {
  background: none; border: none; cursor: pointer; opacity: 0.7; font-size: 1.1rem;
}
.btn-icon:hover { opacity: 1; }

/* --- MODAL --- */
.modal-backdrop {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(33, 33, 33, 0.7);
  display: flex; justify-content: center; align-items: center; z-index: 1050;
  backdrop-filter: blur(2px);
}
.modal-card {
  background: white;
  width: 90%;
  max-width: 800px;
  max-height: 90vh; /* Para pantallas pequeñas */
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}
.modal-header-custom {
  background-color: #1B5E20;
  color: white;
  padding: 1.5rem;
  display: flex; justify-content: space-between; align-items: center;
}
.modal-header-custom h4 { margin: 0; font-size: 1.25rem; font-weight: 400; }
.close-btn { background: none; border: none; color: white; font-size: 2rem; line-height: 1; cursor: pointer; }

.modal-body-custom {
  padding: 2rem;
  overflow-y: auto; /* Scroll interno */
}

.section-title {
  color: #1B5E20;
  border-bottom: 2px solid #E0E0E0;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* --- FORMS --- */
.form-label { font-size: 0.85rem; font-weight: 600; color: #455A64; margin-bottom: 0.3rem; }
.form-control, .form-select { border-radius: 4px; border: 1px solid #CFD8DC; padding: 0.6rem; font-size: 0.95rem; }
.form-control:focus { border-color: #1B5E20; box-shadow: 0 0 0 3px rgba(27, 94, 32, 0.1); }

/* --- CHECKBOX --- */
.custom-checkbox {
  display: block; position: relative; padding-left: 30px; cursor: pointer; font-size: 0.95rem; user-select: none;
}
.custom-checkbox input { position: absolute; opacity: 0; }
.checkmark {
  position: absolute; top: 0; left: 0; height: 20px; width: 20px; background-color: #eee; border-radius: 4px;
}
.custom-checkbox:hover input ~ .checkmark { background-color: #ccc; }
.custom-checkbox input:checked ~ .checkmark { background-color: #F9A825; }
.checkmark:after { content: ""; position: absolute; display: none; }
.custom-checkbox input:checked ~ .checkmark:after { display: block; }
.custom-checkbox .checkmark:after {
  left: 7px; top: 3px; width: 5px; height: 10px; border: solid white; border-width: 0 3px 3px 0; transform: rotate(45deg);
}
</style>
