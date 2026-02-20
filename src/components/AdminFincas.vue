<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

// --- 1. CONFIGURACIÓN Y ESTADO ---
const API_URL = window.location.hostname.includes('localhost')
  ? 'http://localhost:7292/api/Fincas'
  : 'https://cng-backend.azurewebsites.net/api/Fincas';

  const BASE_URL = window.location.hostname.includes('localhost')
  ? 'http://localhost:7292/api'
  : 'https://cng-backend.azurewebsites.net/api';

const FINCAS_URL = `${BASE_URL}/Fincas`;
const GUID_VACIO = '00000000-0000-0000-0000-000000000000';
const router = useRouter()
const usuarioLogueado = ref({ nombre: 'Usuario' })
const fincas = ref([])
const cargando = ref(false)
const mostrarModal = ref(false)
const guardando = ref(false)

// Filtros de búsqueda
const filtroNombre = ref('')
const filtroFase = ref('')

const fechaSeleccionada = ref(new Date().toISOString().split('T')[0]); // Fecha global del formulario
const formatearFecha = (fecha) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-CO');
};
// Listas de Opciones
const tiposFinca = ['Censo', 'Asesoría Virtual', 'Mixta'];
const listaFases = ['Censo', 'Diagnostico', 'Implementacion', 'Seguimiento', 'Inactivo'];
const catalogoEspecies = {
  'Vacuno': [
    'Vaca parida', 'Vaca horra', 'Vaca preñada', 'Vaca vacía',
    'Novilla de vientre', 'Novilla de levante', 'Ternero', 'Toro', 'Macho de ceba'
  ],
  'Bufalino': [
    'Búfala parida', 'Búfala horra', 'Búfala preñada',
    'Bucerro', 'Búfalo Reproductor', 'Búfalo de ceba'
  ],
  'Otros': [
    'Equino (Caballo/Yegua)', 'Mular', 'Asnal', 'Ovino', 'Caprino', 'Porcino'
  ]
};

// 2. Estado para el primer selector
const especieSeleccionada = ref('Vacuno');

// 3. Computed para llenar el segundo selector automáticamente
const listaCategoriasDisponibles = computed(() => {
  return catalogoEspecies[especieSeleccionada.value] || [];
});

// 4. Función para resetear la categoría cuando cambia la especie
const alCambiarEspecie = () => {
  // Selecciona automáticamente la primera opción de la nueva lista
  inventarioTemp.value.categoria = listaCategoriasDisponibles.value[0];
};
const agregarComentario = async () => {
  // 1. Validar texto
  if (!nuevoComentario.value.trim()) return;

  // 2. Validar que la finca EXISTA
  if (!formFinca.value.id || formFinca.value.id === GUID_VACIO) {
    alert("⚠️ Debes guardar la finca por primera vez antes de agregar comentarios.");
    return;
  }

  try {
    const url = `${BASE_URL}/Fincas/${formFinca.value.id}/Comentarios`;

    // 👇 AQUÍ ESTÁ EL CAMBIO IMPORTANTE:
    // Agregamos 'autor' al envío para que el Backend no de error 500
    const payload = {
        texto: nuevoComentario.value,
        autor: 'Administración CNG' // O usa usuarioLogueado.value.nombre si prefieres
    };

    const respuesta = await axios.post(url, payload);

    // 4. Actualizar la vista
    formFinca.value.comentarios.unshift({
      id: respuesta.data.id,
      texto: nuevoComentario.value,
      autor: payload.autor, // Visualmente mostramos el mismo autor
      fecha: respuesta.data.fecha || new Date().toISOString()
    });

    nuevoComentario.value = ''; // Limpiar input

  } catch (error) {
    console.error(error);
    alert("Error al enviar el comentario. Revisa que el Backend esté corriendo.");
  }
};

const eliminarComentario = async (index, comentarioId) => {
  // 1. Confirmación
  if (!confirm("¿Estás seguro de eliminar este comentario permanentemente?")) return;

  try {
    // 2. Llamada directa al Backend
    // DELETE /api/Comentarios/{ID}
    await axios.delete(`${BASE_URL}/Comentarios/${comentarioId}`);

    // 3. Quitar de la lista visual
    formFinca.value.comentarios.splice(index, 1);

  } catch (error) {
    console.error(error);
    alert("Error al eliminar. Intenta recargar la página.");
  }
};
const formFinca = ref({
  id: null,
  nombre: '',
  afiliacion: '',
  areaTotal: 0,
  areaBosques: 0,
  nombreProductor: '',
  usuarioId: null,
  emailProductor: '',
  tipoFinca: 'Censo',
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
  pilarProductivo: 0,
  pilarSocioEconomico: 0,
  pilarAmbiental: 0,
  pilarParticipacion: 0,
  inventario: [],
  comentarios: []
})
const nuevoComentario = ref('');

// --- 4. Función auxiliar para mostrar hora bonita ---
const formatoHora = (fechaIso) => {
  if (!fechaIso) return '';
  const d = new Date(fechaIso);
  // Devuelve ej: "27/1/2026 10:30 AM"
  return d.toLocaleString('es-CO', { hour12: true });
};
// Estado temporal para agregar una fila de inventario
const inventarioTemp = ref({
  categoria: 'Vaca parida', // Valor por defecto
  cantidad: 0
});

const archivosPendientes = ref([]);
const subiendoArchivos = ref(false); // Para mostrar un spinner de carga

// Función que se dispara al elegir archivos en el <input>
const prepararArchivo = (event) => {
    const files = Array.from(event.target.files); // Convertimos a array real
    if (!files.length) return;

    files.forEach(file => {
        archivosPendientes.value.push({
            // Generamos un ID único para que el borrado no falle
            id: Math.random().toString(36).substring(2, 9),
            file: file,
            nombre: file.name, // Este campo ahora será reactivo y editable
            tamano: (file.size / 1024 / 1024).toFixed(2) + ' MB'
        });
    });
    event.target.value = '';
};

const quitarPendiente = (id) => {
    // Filtramos por ID en lugar de índice para evitar errores de posición
    archivosPendientes.value = archivosPendientes.value.filter(arch => arch.id !== id);
};
// --- 3. FUNCIONES DE LÓGICA ---
const listaAfiliaciones = ref([

]);

const afiliacionPersonalizada = ref('');

const cargarFincas = async () => {
  cargando.value = true
  try {
    const respuesta = await axios.get(API_URL)
    fincas.value = respuesta.data

    fincas.value.forEach(f => {
      if (f.afiliacion && !listaAfiliaciones.value.includes(f.afiliacion)) {
        listaAfiliaciones.value.push(f.afiliacion);
      }
    });

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
  try {
    if (formFinca.value.afiliacion === 'OTRO') {
       if (!afiliacionPersonalizada.value.trim()) {
         alert("Por favor escribe el nombre de la nueva afiliación.");
         return;
       }

       const nuevaAfiliacion = afiliacionPersonalizada.value.trim();

       formFinca.value.afiliacion = nuevaAfiliacion;

       if (!listaAfiliaciones.value.includes(nuevaAfiliacion)) {
         listaAfiliaciones.value.push(nuevaAfiliacion);
       }
    }
    subiendoArchivos.value = true;
    if (!formFinca.value.documentos) formFinca.value.documentos = [];
    if (!formFinca.value.inventario) formFinca.value.inventario = [];
    if (!formFinca.value.documentos) {
      formFinca.value.documentos = [];
    }
    if (!formFinca.value.id) {
        formFinca.value.id = GUID_VACIO;
    }
    // 1. Subir archivos a la raíz de la API (No a /Fincas)
    if (archivosPendientes.value.length > 0) {
      for (const item of archivosPendientes.value) {
        const formData = new FormData();
        formData.append('archivo', item.file);

        // USAMOS BASE_URL aquí para que la ruta sea /api/SubirDocumento
        const res = await axios.post(`${BASE_URL}/SubirDocumento`, formData);

        formFinca.value.documentos.push({
          nombreArchivo: item.nombre, // El nombre que editaste en el input
          url: res.data.url
        });
      }
    }

    // 2. Guardar Finca (Usamos FINCAS_URL)
    if (formFinca.value.id && formFinca.value.id !== GUID_VACIO) {
      // Es Edición
      await axios.put(FINCAS_URL, formFinca.value);
    } else {
      // Es Creación (El ID va como 00000000...)
      await axios.post(FINCAS_URL, formFinca.value);
    }

    archivosPendientes.value = [];
    cerrarModal();
    cargarFincas();
    alert('Guardado exitosamente');
  } catch (error) {
    console.error(error);
    alert('Error en el proceso');
  } finally {
    subiendoArchivos.value = false;
  }
};

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
        if (!formFinca.value.documentos) formFinca.value.documentos = []
    }
  } catch (error) {
    console.error("Error cargando detalles", error)
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
    nombreProductor: '',
    emailProductor: '',
    tipoFinca: 'Censo',
    faseAvance: 'Diagnostico',
    tipoProduccion: '',
    asistioEvento: false,
    // Resetear pilares
    pilarProductivo: 0,
    pilarSocioEconomico: 0,
    pilarAmbiental: 0,
    pilarParticipacion: 0,
    comentarios: [],
    inventario: [],
    documentos: [],
  }

  // Resetear temp
  afiliacionPersonalizada.value = '';
  inventarioTemp.value = { categoria: 'Vaca parida', cantidad: 0 }

  mostrarModal.value = true
}

const cerrarModal = () => mostrarModal.value = false

// Agregar fila a la tabla local de inventario
const agregarAnimal = () => {
  if (inventarioTemp.value.cantidad > 0) {
    formFinca.value.inventario.push({
      fecha: fechaSeleccionada.value, // 👈 Toma la fecha de la variable global
      categoria: inventarioTemp.value.categoria,
      cantidad: inventarioTemp.value.cantidad
    });

    // Limpiamos SOLO la cantidad para el siguiente animal
    inventarioTemp.value.cantidad = 0;
  } else {
    alert('La cantidad debe ser mayor a 0');
  }
};

// Eliminar fila de la tabla local
const borrarAnimal = (index) => {
  formFinca.value.inventario.splice(index, 1)
}

// --- Filtros Computados ---
const fincasFiltradas = computed(() => {
  // 1. Primero filtramos por búsqueda
  let lista = fincas.value.filter(f => {
    const coincideNombre = f.nombre.toLowerCase().includes(filtroNombre.value.toLowerCase())
    const coincideFase = filtroFase.value ? f.faseAvance === filtroFase.value : true
    return coincideNombre && coincideFase
  });

  const pesoFase = {
    'Censo': 1,
    'Diagnostico': 2,
    'Diagnóstico': 2,
    'Implementacion': 3,
    'Implementación': 3,
    'Seguimiento': 4,
    'Inactivo': 5
  };

  return lista.sort((a, b) => {
    const pesoA = pesoFase[a.faseAvance] || 99;
    const pesoB = pesoFase[b.faseAvance] || 99;
    return pesoA - pesoB;
  });
});
const listaUsuarios = ref([]);

// Nueva función
const cargarUsuarios = async () => {
  try {

    const res = await axios.get(`${BASE_URL}/Users`);
    listaUsuarios.value = res.data;
  } catch (error) {
    console.error("Error cargando usuarios:", error);
  }
};
// Cargar al iniciar
onMounted(() => {
  // Recuperar datos del usuario guardado
  const datosUsuario = localStorage.getItem('usuario')
  if (datosUsuario) {
    usuarioLogueado.value = JSON.parse(datosUsuario)
  }

  cargarFincas();
  cargarUsuarios();
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
        <button
          @click="$router.push('/admin/plan-operativo')"
          class="btn btn-warning fw-bold shadow-sm"
        >
          📊 Gestionar Planes Operativos
        </button>
                <button @click="cerrarSesion" class="btn btn-outline-danger btn-sm" title="Cerrar Sesión">
          Salir 🚪
        </button>
      </div>
    </div>

    <div class="control-panel shadow-sm">
  <div class="row g-3 align-items-end">

    <div class="col-12 col-md-4">
      <label class="form-label custom-label">Buscar Predio</label>
      <div class="input-group">
        <span class="input-group-text bg-white border-end-0">🔍</span>
        <input v-model="filtroNombre" type="text" class="form-control border-start-0 ps-0" placeholder="Nombre de la finca...">
      </div>
    </div>

    <div class="col-12 col-md-3">
      <label class="form-label custom-label">Filtro por Fase</label>
      <select v-model="filtroFase" class="form-select">
        <option value="">Todas las fases</option>
        <option v-for="fase in listaFases" :key="fase" :value="fase">{{ fase }}</option>
      </select>
    </div>

    <div class="col-6 col-md-2">
      <button @click="cargarFincas" class="btn btn-outline-custom w-100">
          Actualizar
      </button>
    </div>

    <div class="col-6 col-md-3 text-end">
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
            <th style="width: 120px;">Última Act.</th>
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

            <td data-label="Nombre del Predio" class="fw-bold text-dark-green">
              {{ finca.nombre }}
            </td>

            <td data-label="Tipo">
              <span class="badge-custom" :class="finca.tipoFinca === 'Censo' ? 'badge-censo' : 'badge-admin'">
                {{ finca.tipoFinca }}
              </span>
            </td>

            <td data-label="Ubicación" class="text-muted">
              {{ finca.municipio }}
            </td>

            <td data-label="Estado Actual">
              <span class="status-indicator">
                <span class="dot" :class="finca.faseAvance.toLowerCase()"></span> {{ finca.faseAvance }}
              </span>
            </td>

            <td data-label="Última Act." class="text-muted small">
                📅 {{ formatearFecha(finca.fechaActualizacion) }}
            </td>

            <td class="text-end actions-cell">
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
              <div class="col-12 bg-primary bg-opacity-10 p-3 rounded mb-3 border border-primary">
  <label class="form-label fw-bold text-primary">👤 Vincular Cuenta de Usuario</label>
  <select v-model="formFinca.usuarioId" class="form-select border-primary fw-bold">
    <option :value="null">-- Sin cuenta vinculada (Solo texto) --</option>
    <option v-for="user in listaUsuarios" :key="user.id" :value="user.id">
      {{ user.nombre }} ({{ user.email }})
    </option>
  </select>
  <small class="text-muted d-block mt-1">
    Si seleccionas un usuario, él podrá ver esta finca al iniciar sesión.
  </small>
</div>
              <div class="col-md-6">
    <label class="form-label">Nombre del Productor *</label>
    <div class="input-group">
        <span class="input-group-text bg-light text-muted">👤</span>
        <input
            v-model="formFinca.nombreProductor"
            required
            type="text"
            class="form-control"
            placeholder="Nombre completo"
        >
    </div>
    </div>

    <div class="col-md-6">
        <label class="form-label">Correo Electrónico</label>
        <div class="input-group">
            <span class="input-group-text bg-light text-muted">@</span>
            <input
                v-model="formFinca.emailProductor"
                type="email"
                class="form-control"
                placeholder="ejemplo@correo.com"
            >
        </div>
    </div>
              <div class="col-md-6">
                <label class="form-label">Propósito</label>
                <select v-model="formFinca.tipoFinca" class="form-select">
                  <option disabled value="">Seleccione una opción...</option>
                  <option v-for="tipo in tiposFinca" :key="tipo" :value="tipo">
                    {{ tipo }}
                  </option>
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
                <div class="input-group">
                  <input
                    v-model="formFinca.restorUrl"
                    type="text"
                    class="form-control"
                    placeholder="Pegue el link aquí"
                  >

                  <a
                    v-if="formFinca.restorUrl"
                    :href="formFinca.restorUrl"
                    target="_blank"
                    class="btn btn-outline-success"
                    title="Probar enlace"
                  >
                    🌐 Abrir
                  </a>
                </div>
                <small class="text-muted">Si el link es incorrecto, simplemente bórrelo y pegue uno nuevo arriba.</small>
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
              <div class="col-md-6">
                <label class="form-label">Afiliación / Grupo</label>
                <select v-model="formFinca.afiliacion" class="form-select">
                  <option value="" disabled>Seleccione...</option>
                  <option v-for="af in listaAfiliaciones" :key="af" :value="af">{{ af }}</option>
                  <option value="OTRO" class="fw-bold text-primary">➕ Crear nueva afiliación...</option>
                </select>

                <div v-if="formFinca.afiliacion === 'OTRO'" class="mt-2 animate__animated animate__fadeIn">
                  <input
                    v-model="afiliacionPersonalizada"
                    type="text"
                    class="form-control border-primary bg-primary bg-opacity-10 fw-bold"
                    placeholder="Escribe el nombre del nuevo grupo..."
                    autofocus
                  >
                </div>
              </div>

              <div class="col-md-4">
                <label class="form-label">Área Total (Hectáreas)</label>
                <div class="input-group">
                  <span class="input-group-text bg-light">Ha</span>
                  <input v-model.number="formFinca.areaTotal" type="number" step="0.01" class="form-control" placeholder="0.00">
                </div>
              </div>

              <div class="col-md-4">
                <label class="form-label">Área en Bosques</label>
                <div class="input-group">
                  <span class="input-group-text bg-light">🌳</span>
                  <input v-model.number="formFinca.areaBosques" type="number" step="0.01" class="form-control" placeholder="0.00">
                </div>
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
                <label class="form-label text-muted small">Marketing</label>
                <input v-model.number="formFinca.pilarParticipacion" type="number" step="0.1" class="form-control">
              </div>

              <div class="col-12 section-title mt-4">Inventario Ganadero</div>

<div class="col-12 bg-light p-3 rounded border">
  <div class="row mb-3 pb-3 border-bottom">
    <div class="col-md-6">
      <label class="form-label fw-bold text-success">📅 Fecha del Conteo General</label>
      <input v-model="fechaSeleccionada" type="date" class="form-control">
      <small class="text-muted">Todos los animales que agregue abajo se registrarán para este día.</small>
    </div>
  </div>

  <div class="row g-2 align-items-end">
    <div class="col-md-3">
    <label class="form-label small fw-bold text-dark-green">1. Especie</label>
    <select v-model="especieSeleccionada" @change="alCambiarEspecie" class="form-select form-select-sm">
      <option value="Vacuno">Vacuno 🐮</option>
      <option value="Bufalino">Bufalino 🐃</option>
      <option value="Otros">Otros 🐴</option>
    </select>
  </div>

    <div class="col-md-4">
    <label class="form-label small fw-bold text-dark-green">2. Categoría</label>
    <select v-model="inventarioTemp.categoria" class="form-select form-select-sm">
      <option v-for="cat in listaCategoriasDisponibles" :key="cat" :value="cat">
        {{ cat }}
      </option>
    </select>
  </div>

  <div class="col-md-2">
    <label class="form-label small fw-bold text-dark-green">Cant.</label>
    <input v-model.number="inventarioTemp.cantidad" type="number" class="form-control form-control-sm" placeholder="0">
  </div>

    <div class="col-md-3">
    <button type="button" @click="agregarAnimal" class="btn btn-sm btn-success w-100 fw-bold">
      + Agregar
    </button>
  </div>
  </div>

  <div v-if="formFinca.inventario.length > 0" class="mt-3 table-responsive bg-white border rounded shadow-sm">
    <table class="table table-sm mb-0">
      <thead class="table-light">
        <tr>
          <th class="ps-3">Fecha</th>
          <th>Categoría</th>
          <th>Cant.</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in formFinca.inventario" :key="index">
          <td class="ps-3 text-muted small">{{ formatearFecha(item.fecha) }}</td>
          <td>{{ item.categoria }}</td>
          <td class="fw-bold">{{ item.cantidad }}</td>
          <td class="text-end pe-3">
            <button type="button" @click="borrarAnimal(index)" class="btn btn-link text-danger p-0">×</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="col-12 section-title mt-4">Historial y Bitácora</div>

<div class="col-12">
    <div class="d-flex gap-2 mb-3">
    <input
        v-model="nuevoComentario"
        @keyup.enter="agregarComentario"
        type="text"
        class="form-control"
        placeholder="Escribe una nota o evento..."
        :disabled="!formFinca.id || formFinca.id === GUID_VACIO"
    >
    <button
        type="button"
        @click="agregarComentario"
        class="btn btn-primary-custom"
        :disabled="!formFinca.id || formFinca.id === GUID_VACIO"
    >
        Enviar 💬
    </button>
</div>
<small v-if="!formFinca.id || formFinca.id === GUID_VACIO" class="text-danger fw-bold">
    * Guarda la finca primero para habilitar los comentarios.
</small>

    <div class="historial-container bg-light p-3 rounded border" style="max-height: 250px; overflow-y: auto;">

        <div v-if="formFinca.comentarios.length === 0" class="text-center text-muted small py-3">
            No hay comentarios registrados.
        </div>

        <div v-else v-for="(com, index) in formFinca.comentarios" :key="index" class="mb-2">
    <div class="bg-white p-2 rounded border-start border-4 border-success shadow-sm">

        <div class="d-flex justify-content-between align-items-start mb-1">

            <div class="d-flex align-items-center gap-2">
                <span class="badge bg-success bg-opacity-10 text-success rounded-pill small">
                    👤 {{ com.autor || 'Desconocido' }}
                </span>
                <small class="text-muted" style="font-size: 0.75rem;">
                    🕒 {{ formatoHora(com.fecha) }}
                </small>
            </div>

            <button
    type="button"
    @click="eliminarComentario(index, com.id)"
    class="btn btn-link text-danger p-0 border-0"
    title="Eliminar permanentemente"
>
    🗑️ </button>

        </div>

        <div class="text-dark small ps-1" style="white-space: pre-wrap;">{{ com.texto }}</div>
    </div>
</div>

    </div>
</div>
</div>
            <div class="col-12 section-title mt-4">Documentación y Mapas</div>

<div class="col-12">
    <div class="mb-3">
        <label class="form-label small text-muted">Seleccionar archivos para cargar:</label>
        <div class="input-group">
            <input type="file" @change="prepararArchivo" class="form-control" multiple :disabled="subiendoArchivos">
            <span class="input-group-text bg-light text-primary">📎</span>
        </div>
        <small class="text-muted">Los archivos se subirán permanentemente al hacer clic en "Guardar Finca".</small>
    </div>

    <div v-if="archivosPendientes.length > 0" class="mb-4">
    <p class="small fw-bold text-warning mb-2">⚠️ Archivos por subir (puedes editar el nombre):</p>

    <div v-for="arch in archivosPendientes" :key="arch.id"
         class="d-flex align-items-center mb-2 bg-warning bg-opacity-10 p-2 rounded border border-warning shadow-sm">

        <div class="me-3 fs-4">📤</div>

        <div class="flex-grow-1 me-3">
            <input
                v-model="arch.nombre"
                type="text"
                class="form-control form-control-sm fw-bold border-warning"
                placeholder="Nombre del archivo..."
            >
            <div class="text-muted small" style="font-size: 0.7rem;">
                Original: {{ arch.file.name }} | {{ arch.tamano }}
            </div>
        </div>

        <button
            type="button"
            @click="quitarPendiente(arch.id)"
            class="btn btn-sm btn-danger px-2"
            title="Eliminar de la cola"
        >
            ✕
        </button>
    </div>
</div>

    <div v-if="formFinca.documentos && formFinca.documentos.length > 0">
        <p class="small fw-bold text-success mb-1">✅ Documentos guardados en la finca:</p>
        <div class="card border-0 bg-light">
            <div class="card-body p-2">
                <div v-for="(doc, index) in formFinca.documentos" :key="index"
                     class="d-flex align-items-center mb-2 bg-white p-2 rounded border shadow-sm">
                    <div class="me-3 fs-4">📄</div>
                    <div class="flex-grow-1 me-3">
                        <input v-model="doc.nombreArchivo" type="text" class="form-control form-control-sm fw-bold text-primary border-0 bg-transparent" placeholder="Nombre del documento...">
                        <a :href="doc.url" target="_blank" class="small text-muted text-decoration-none mt-1 d-inline-block">
                            👁️ Ver archivo original
                        </a>
                    </div>
                    <button type="button" @click="quitarDocumento(index)" class="btn btn-outline-danger btn-sm">
                        🗑️
                    </button>
                </div>
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
  height: 10px; width: 10px; border-radius: 50%; display: inline-block; margin-right: 6px;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.1); /* Borde sutil para colores claros */
}

.dot.censo { background-color: #FFECB3; }
.dot.diagnostico { background-color: #F9A825; }
.dot.implementacion { background-color: #2E7D32; }
.dot.seguimiento { background-color: #1565C0; }
.dot.inactivo { background-color: #B0BEC5; }

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
@media screen and (max-width: 768px) {

  /* 1. Ocultar los encabezados de la tabla (no caben) */
  .custom-table thead {
    display: none;
  }

  /* 2. Convertir la tabla y filas en bloques apilados */
  .custom-table, .custom-table tbody, .custom-table tr, .custom-table td {
    display: block;
    width: 100%;
  }

  /* 3. Estilo de "Tarjeta" para cada fila */
  .custom-table tr {
    margin-bottom: 1.5rem;
    background-color: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    overflow: hidden;
  }

  /* 4. Estilo de las celdas internas */
  .custom-table td {
    text-align: right; /* El dato va a la derecha */
    padding: 12px 16px;
    position: relative;
    border-bottom: 1px solid #f0f0f0;
    min-height: 45px;
    display: flex;
    justify-content: space-between; /* Separa etiqueta y valor */
    align-items: center;
  }

  /* 5. Insertar el "Título" de la columna a la izquierda */
  .custom-table td::before {
    content: attr(data-label);
    font-weight: 700;
    color: #1B5E20;
    font-size: 0.85rem;
    text-transform: uppercase;
    margin-right: auto; /* Empuja el valor a la derecha */
  }

  /* 6. Ajuste especial para el Nombre (Encabezado de la tarjeta) */
  .custom-table td:first-child {
    background-color: #1B5E20;
    color: white !important;
    justify-content: center; /* Centrado */
    padding: 10px;
  }
  .custom-table td:first-child::before {
    display: none; /* No mostrar etiqueta "Nombre" */
  }

  /* 7. Ajuste para Acciones (Botones al final) */
  .custom-table td:last-child {
    border-bottom: 0;
    justify-content: center;
    background-color: #f9f9f9;
    padding: 15px;
  }
  .custom-table td:last-child::before {
    display: none;
  }

  /* Botones más grandes para dedos */
  .btn-icon {
    font-size: 1.5rem;
    padding: 10px 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin: 0 10px;
  }
}
</style>
