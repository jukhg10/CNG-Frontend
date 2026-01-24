<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const API_URL = import.meta.env.VITE_API_URL;

// Datos
const usuarios = ref([])
const cargando = ref(false)
const mostrarModal = ref(false)
const guardando = ref(false)
const usuarioLogueado = ref({ nombre: '' })

// Formulario
const formUsuario = ref({
  id: 0,
  nombre: '',
  email: '',
  password: '', // Se manda vacío si no se quiere cambiar al editar
  rol: 'Usuario'
})

// Opciones de Rol
const roles = ['Admin', 'Usuario', 'Veterinario', 'Auditor']

// --- FUNCIONES ---

const cargarUsuarios = async () => {
  cargando.value = true
  try {
    const res = await axios.get(API_URL)
    usuarios.value = res.data
  } catch (error) {
    console.error(error)
    alert('Error al cargar usuarios')
  } finally {
    cargando.value = false
  }
}

const guardarUsuario = async () => {
  guardando.value = true
  try {
    if (formUsuario.value.id) {
      // Editar (PUT)
      await axios.put(API_URL, formUsuario.value)
      alert('Usuario actualizado')
    } else {
      // Crear (POST)
      await axios.post(API_URL, formUsuario.value)
      alert('Usuario creado')
    }
    cerrarModal()
    cargarUsuarios()
  } catch (error) {
    alert('Error al guardar: ' + error.message)
  } finally {
    guardando.value = false
  }
}

const eliminarUsuario = async (id) => {
  if(!confirm('¿Seguro que deseas eliminar este usuario?')) return
  try {
    await axios.delete(`${API_URL}/${id}`)
    cargarUsuarios()
  } catch (error) {
    console.error(error) // <--- AQUI USAMOS LA VARIABLE
    alert('Error eliminando el usuario')
  }
}

const abrirModal = (usuario = null) => {
  if (usuario) {
    // Modo Edición: Copiamos datos y limpiamos password (para que no se muestre)
    formUsuario.value = { ...usuario, password: '' }
  } else {
    // Modo Crear
    formUsuario.value = { id: 0, nombre: '', email: '', password: '', rol: 'Usuario' }
  }
  mostrarModal.value = true
}

const cerrarModal = () => mostrarModal.value = false

const cerrarSesion = () => {
  localStorage.removeItem('usuario')
  router.push('/')
}

const irAFincas = () => {
  router.push('/admin')
}

onMounted(() => {
  const data = localStorage.getItem('usuario')
  if (data) usuarioLogueado.value = JSON.parse(data)
  cargarUsuarios()
})
</script>

<template>
  <div class="main-container">

    <div class="header-section mb-4 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center">
        <img src="/logo-cng.png" alt="Logo" class="logo-img me-3">
        <div>
          <h2 class="page-title">Gestión de Usuarios</h2>
          <p class="subtitle">Administración de accesos</p>
        </div>
      </div>

      <div class="d-flex gap-2">
         <button @click="irAFincas" class="btn btn-outline-custom">
           🌾 Ir a Fincas
         </button>
         <button @click="cerrarSesion" class="btn btn-danger btn-sm">
           Salir
         </button>
      </div>
    </div>

    <div class="control-panel shadow-sm d-flex justify-content-end mb-4">
      <button @click="abrirModal()" class="btn btn-primary-custom">
        + Nuevo Usuario
      </button>
    </div>

    <div class="table-container shadow-sm">
      <table class="table custom-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u.id">
            <td class="fw-bold text-dark-green">{{ u.nombre }}</td>
            <td>{{ u.email }}</td>
            <td>
              <span class="badge" :class="u.rol === 'Admin' ? 'bg-warning text-dark' : 'bg-info text-dark'">
                {{ u.rol }}
              </span>
            </td>
            <td class="text-end">
              <button @click="abrirModal(u)" class="btn-icon">✏️</button>
              <button @click="eliminarUsuario(u.id)" class="btn-icon delete">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="mostrarModal" class="modal-backdrop">
      <div class="modal-card shadow-lg">
        <div class="modal-header-custom">
          <h4>{{ formUsuario.id ? 'Editar Usuario' : 'Nuevo Usuario' }}</h4>
          <button @click="cerrarModal" class="close-btn">×</button>
        </div>
        <div class="modal-body-custom">
          <form @submit.prevent="guardarUsuario">
            <div class="mb-3">
              <label class="form-label">Nombre Completo</label>
              <input v-model="formUsuario.nombre" required class="form-control">
            </div>
            <div class="mb-3">
              <label class="form-label">Correo Electrónico</label>
              <input v-model="formUsuario.email" type="email" required class="form-control">
            </div>
            <div class="mb-3">
              <label class="form-label">Rol</label>
              <select v-model="formUsuario.rol" class="form-select">
                <option v-for="rol in roles" :key="rol" :value="rol">{{ rol }}</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Contraseña</label>
              <input v-model="formUsuario.password" type="password" class="form-control"
                :placeholder="formUsuario.id ? '(Dejar vacío para no cambiar)' : 'Obligatorio al crear'">
            </div>

            <div class="modal-footer-custom mt-4 pt-3 border-top text-end">
              <button type="button" @click="cerrarModal" class="btn btn-secondary me-2">Cancelar</button>
              <button type="submit" class="btn btn-primary-custom">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Reutilizamos los mismos estilos de AdminFincas para consistencia */
:root { --color-primary: #1B5E20; --color-secondary: #F9A825; }
.main-container { padding: 2rem; background-color: #f4f6f8; min-height: 100vh; }
.header-section { background: white; padding: 1.5rem; border-radius: 8px; border-left: 5px solid #1B5E20; }
.logo-img { height: 60px; width: auto; }
.control-panel { background: white; padding: 1rem; border-radius: 8px; }
.table-container { background: white; border-radius: 8px; overflow: hidden; }
.custom-table thead th { background-color: #2E7D32; color: white; padding: 1rem; }
.custom-table tbody td { padding: 1rem; border-bottom: 1px solid #eee; }
.btn-primary-custom { background-color: #F9A825; color: #212121; border: none; padding: 10px 20px; border-radius: 4px; font-weight: 600; }
.btn-outline-custom { border: 1px solid #1B5E20; color: #1B5E20; background: transparent; padding: 5px 15px; border-radius: 4px; margin-right: 10px; }
.btn-icon { background: none; border: none; font-size: 1.2rem; cursor: pointer; }
.modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; }
.modal-card { background: white; width: 90%; max-width: 500px; border-radius: 8px; overflow: hidden; }
.modal-header-custom { background: #1B5E20; color: white; padding: 1rem; display: flex; justify-content: space-between; }
.modal-body-custom { padding: 2rem; }
.close-btn { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
</style>
