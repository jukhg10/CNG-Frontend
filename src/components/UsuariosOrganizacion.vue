<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const API_URL = window.location.hostname.includes('localhost')
  ? 'http://localhost:7292/api/Users'
  : 'https://cng-backend.azurewebsites.net/api/Users'

// --- ESTADO ---
const usuarios = ref([])
const cargando = ref(false)
const mostrarModal = ref(false)
const guardando = ref(false)

// Datos del Admin de Organización
const miOrganizacion = ref('')
const miNombre = ref('')

// Formulario (Sin campo organización, ya que es implícito)
const formUsuario = ref({
  id: 0,
  nombre: '',
  email: '',
  password: '',
  rol: 'Usuario',
  organizacion: '' // Se llena automático al guardar
})

// Roles permitidos para crear (NUNCA 'Admin')
const rolesPermitidos = ['Veterinario', 'Auditor', 'Usuario']

// --- FUNCIONES ---

const cargarUsuarios = async () => {
  cargando.value = true
  try {
    const config = {
        headers: {
            'X-Rol': localStorage.getItem('usuario_rol'),
            'X-Org': localStorage.getItem('usuario_org')
        }
    }
    const res = await axios.get(API_URL, config)

    // FILTRADO DE SEGURIDAD CLIENT-SIDE
    // Aunque el backend filtre, aseguramos visualmente que solo vea los suyos
    usuarios.value = res.data.filter(u => u.organizacion === miOrganizacion.value);

  } catch (error) {
    console.error(error)
  } finally {
    cargando.value = false
  }
}

const guardarUsuario = async () => {
  // ASIGNACIÓN AUTOMÁTICA
  formUsuario.value.organizacion = miOrganizacion.value;

  guardando.value = true
  try {
    if (formUsuario.value.id) {
      await axios.put(`${API_URL}/${formUsuario.value.id}`, formUsuario.value)
      alert('Usuario actualizado correctamente')
    } else {
      await axios.post(API_URL, formUsuario.value)
      alert('Usuario creado correctamente')
    }
    cerrarModal()
    cargarUsuarios()
  } catch (error) {
    alert('Error al guardar: ' + (error.response?.data || error.message))
  } finally {
    guardando.value = false
  }
}

const eliminarUsuario = async (id) => {
  if(!confirm('¿Seguro que deseas eliminar este usuario de tu organización?')) return
  try {
    await axios.delete(`${API_URL}/${id}`)
    cargarUsuarios()
  } catch (error) {
    alert('Error eliminando el usuario: ' + (error.response?.data || error.message))
  }
}

// --- MODALES ---
const abrirModal = (usuario = null) => {
  if (usuario) {
    formUsuario.value = { ...usuario, password: '' }
  } else {
    // CREAR NUEVO
    formUsuario.value = {
        id: 0,
        nombre: '',
        email: '',
        password: '',
        rol: 'Usuario', // Por defecto
        organizacion: miOrganizacion.value // Ya lo asignamos por si acaso
    }
  }
  mostrarModal.value = true
}

const cerrarModal = () => mostrarModal.value = false

// Navegación
const volverAlPanel = () => router.push('/admin-org') // 👈 Vuelve a SU panel
const cerrarSesion = () => {
  localStorage.clear();
  router.push('/')
}

onMounted(() => {
  const rol = localStorage.getItem('usuario_rol');
  const org = localStorage.getItem('usuario_org');

  // Seguridad básica: Si intenta entrar un Super Admin aquí, lo mandamos a su vista correcta
  if (rol === 'Admin') {
      router.push('/usuarios'); // Vista de super admin
      return;
  }

  miOrganizacion.value = org || '';
  miNombre.value = localStorage.getItem('usuario_nombre');
  cargarUsuarios()
})
</script>

<template>
  <div class="main-container">

    <div class="header-section mb-4 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center">
        <img src="/logo-cng.png" alt="Logo" class="logo-img me-3">
        <div>
          <h2 class="page-title">Usuarios de {{ miOrganizacion }}</h2>
          <p class="subtitle">Gestión de personal operativo</p>
        </div>
      </div>

      <div class="d-flex gap-2">
         <button @click="volverAlPanel" class="btn btn-outline-custom">
           ⬅ Volver al Panel
         </button>
         <button @click="cerrarSesion" class="btn btn-danger btn-sm">
           Salir
         </button>
      </div>
    </div>

    <div class="control-panel shadow-sm d-flex justify-content-end mb-4">
      <button @click="abrirModal()" class="btn btn-primary-custom">
        + Registrar Nuevo Usuario
      </button>
    </div>

    <div class="table-container shadow-sm">
      <table class="table custom-table mb-0">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="usuarios.length === 0">
              <td colspan="4" class="text-center py-5 text-muted">
                  No has registrado usuarios para {{ miOrganizacion }} todavía.
              </td>
          </tr>
          <tr v-for="u in usuarios" :key="u.id">
            <td class="fw-bold text-dark-green">{{ u.nombre }}</td>
            <td>{{ u.email }}</td>
            <td>
              <span class="badge bg-info text-dark border border-info">
                {{ u.rol }}
              </span>
            </td>
            <td class="text-end">
              <button @click="abrirModal(u)" class="btn-icon">✏️</button>
              <button @click="eliminarUsuario(u.id)" class="btn-icon text-danger">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="mostrarModal" class="modal-backdrop">
      <div class="modal-card shadow-lg">
        <div class="modal-header-custom">
          <h4 class="m-0">{{ formUsuario.id ? 'Editar Personal' : 'Nuevo Personal' }}</h4>
          <button @click="cerrarModal" class="close-btn">×</button>
        </div>
        <div class="modal-body-custom">
          <form @submit.prevent="guardarUsuario">

            <div class="mb-3">
              <label class="form-label fw-bold small">Nombre Completo</label>
              <input v-model="formUsuario.nombre" required class="form-control" placeholder="Ej: Juan Pérez">
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold small">Correo Electrónico</label>
              <input v-model="formUsuario.email" type="email" required class="form-control" placeholder="juan@ejemplo.com">
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold small">Rol en la Empresa</label>
              <select v-model="formUsuario.rol" class="form-select">
                <option v-for="rol in rolesPermitidos" :key="rol" :value="rol">{{ rol }}</option>
              </select>
            </div>

            <div class="alert alert-success py-2 small mb-3">
                <i class="me-2">🏢</i> Asignado automáticamente a: <strong>{{ miOrganizacion }}</strong>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold small">Contraseña</label>
              <input v-model="formUsuario.password" type="password" class="form-control"
                :placeholder="formUsuario.id ? '(Dejar vacío para no cambiar)' : 'Obligatorio al crear'">
            </div>

            <div class="modal-footer-custom mt-4 pt-3 border-top text-end">
              <button type="button" @click="cerrarModal" class="btn btn-secondary me-2">Cancelar</button>
              <button type="submit" :disabled="guardando" class="btn btn-primary-custom">
                  {{ guardando ? 'Guardando...' : 'Guardar Datos' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Estilos idénticos para mantener consistencia visual */
:root { --color-primary: #1B5E20; --color-secondary: #F9A825; }
.main-container { padding: 2rem; background-color: #f4f6f8; min-height: 100vh; }
.header-section { background: white; padding: 1.5rem; border-radius: 8px; border-left: 5px solid #1B5E20; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.logo-img { height: 60px; width: auto; }
.control-panel { background: white; padding: 1rem; border-radius: 8px; }
.table-container { background: white; border-radius: 8px; overflow: hidden; }
.custom-table thead th { background-color: #2E7D32; color: white; padding: 1rem; font-weight: 500; }
.custom-table tbody td { padding: 1rem; border-bottom: 1px solid #eee; vertical-align: middle; }
.btn-primary-custom { background-color: #F9A825; color: #212121; border: none; padding: 10px 20px; border-radius: 4px; font-weight: 600; transition: transform 0.2s; }
.btn-primary-custom:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
.btn-outline-custom { border: 1px solid #1B5E20; color: #1B5E20; background: transparent; padding: 5px 15px; border-radius: 4px; margin-right: 10px; font-weight: 600; }
.btn-icon { background: none; border: none; font-size: 1.2rem; cursor: pointer; transition: transform 0.2s; }
.btn-icon:hover { transform: scale(1.2); }
.modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-card { background: white; width: 90%; max-width: 500px; border-radius: 8px; overflow: hidden; animation: fadeIn 0.3s ease; }
.modal-header-custom { background: #1B5E20; color: white; padding: 1rem; display: flex; justify-content: space-between; align-items: center; }
.modal-body-custom { padding: 2rem; }
.close-btn { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
.text-dark-green { color: #1B5E20; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
</style>
