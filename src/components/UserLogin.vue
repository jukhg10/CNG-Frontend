<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const cargando = ref(false)

const login = async () => {
  cargando.value = true
  errorMsg.value = ''

  try {
    // Conectamos con tu nuevo Controller de Auth
    const response = await axios.post('http://localhost:7292/api/Login', {
      email: email.value,
      password: password.value
    })

    if (response.data) {
      localStorage.setItem('usuario', JSON.stringify(response.data))

      // --- LÓGICA DE REDIRECCIÓN POR ROL ---
      if (response.data.rol === 'Admin') {
        router.push('/admin') // El jefe va a la oficina
      } else {
        router.push('/inicio') // Los demás van al lobby
      }
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      errorMsg.value = 'Credenciales incorrectas o usuario no encontrado.'
    } else {
      errorMsg.value = 'Error de conexión con el servidor.'
      console.error(error)
    }
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-wrapper">
    <div class="login-card shadow-lg">

      <div class="text-center mb-4">
        <img src="/logo-cng.png" alt="Logo CNG" class="login-logo">
        <h4 class="mt-3 company-name">Centro de Negocios Ganaderos</h4>
        <p class="text-muted small">Acceso al Sistema de Gestión</p>
      </div>

      <form @submit.prevent="login">
        <div class="mb-3">
          <label class="form-label">Correo Electrónico</label>
          <div class="input-group">
            <span class="input-group-text bg-white">✉️</span>
            <input v-model="email" type="email" required class="form-control" placeholder="usuario@cng.com">
          </div>
        </div>

        <div class="mb-4">
          <label class="form-label">Contraseña</label>
          <div class="input-group">
            <span class="input-group-text bg-white">🔒</span>
            <input v-model="password" type="password" required class="form-control" placeholder="••••••••">
          </div>
        </div>

        <div v-if="errorMsg" class="alert alert-danger py-2 small text-center mb-3">
          {{ errorMsg }}
        </div>

        <button type="submit" :disabled="cargando" class="btn btn-primary-custom w-100 py-2">
          {{ cargando ? 'Verificando...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <div class="text-center mt-4 border-top pt-3">
        <small class="text-muted footer-text">CNG &copy; 2026 - v1.0</small>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- ESTILO DE FONDO Y CONTENEDOR --- */
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Fondo Verde Bosque Suave */
  background-color: #E8F5E9;
  background-image: radial-gradient(#1B5E20 0.5px, transparent 0.5px);
  background-size: 20px 20px;
}

/* --- TARJETA CENTRAL --- */
.login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  border-top: 6px solid #1B5E20; /* Borde superior verde corporativo */
}

.login-logo {
  height: 90px;
  width: auto;
  margin-bottom: 10px;
}

.company-name {
  color: #1B5E20;
  font-weight: 700;
  font-size: 1.2rem;
}

/* --- FORMULARIO --- */
.form-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #455A64;
}

.form-control {
  border-left: none;
  padding: 0.6rem;
}

.input-group-text {
  border-right: none;
  color: #1B5E20;
}

.form-control:focus {
  border-color: #1B5E20;
  box-shadow: none;
}
.input-group:focus-within {
  box-shadow: 0 0 0 3px rgba(27, 94, 32, 0.1);
  border-radius: 4px;
}

/* --- BOTÓN --- */
.btn-primary-custom {
  background-color: #F9A825; /* Ámbar */
  color: #212121;
  border: none;
  font-weight: 700;
  transition: all 0.3s;
}

.btn-primary-custom:hover {
  background-color: #FBC02D;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.btn-primary-custom:disabled {
  background-color: #ffe082;
  transform: none;
}
.user-panel {
  background-color: #f8f9fa;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  border: 1px solid #e0e0e0;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background-color: #1B5E20; /* Verde Corporativo */
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}
.footer-text {
  font-size: 0.75rem;
}
</style>
