<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

// --- LÓGICA DE CONEXIÓN ---
const API_URL = window.location.hostname.includes('localhost')
  ? 'http://localhost:7292/api'
  : 'https://cng-backend.azurewebsites.net/api';

const router = useRouter()
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const cargando = ref(false)

const login = async () => {
  cargando.value = true
  errorMsg.value = ''

  try {
    const response = await axios.post(`${API_URL}/Login`, {
      email: email.value,
      password: password.value
    })

    if (response.data) {
      localStorage.setItem('usuario', JSON.stringify(response.data))
      if (response.data.rol === 'Admin') {
        router.push('/admin')
      } else {
        router.push('/inicio')
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
  <div class="login-fullscreen">

    <div class="brand-side d-none d-md-flex">
      <video autoplay muted loop playsinline class="bg-video">
        <source src="/IMG_2327.MP4" type="video/mp4">
      </video>
      <div class="video-overlay"></div>

      <div class="brand-content">
        <img src="/logo-cng.png" alt="Logo CNG" class="logo-hero">
        <h1 class="display-4 fw-bold text-white mt-3">Centro de Negocios Ganaderos</h1>
        <p class="lead text-white opacity-75">Plataforma de Gestión y Monitoreo</p>
      </div>
    </div>

    <div class="auth-side">
      <div class="form-container">

        <div class="text-center d-md-none mb-4">
          <img src="/logo-cng.png" alt="Logo" style="height: 80px;">
        </div>

        <h2 class="fw-bold text-dark-green mb-1">¡Bienvenido!</h2>
        <p class="text-muted mb-4">Ingresa tus credenciales para acceder al sistema.</p>

        <form @submit.prevent="login">
          <div class="mb-3">
            <label class="form-label fw-bold small text-secondary">Correo Electrónico</label>
            <div class="input-group shadow-sm">
              <span class="input-group-text bg-light border-end-0">✉️</span>
              <input v-model="email" type="email" required class="form-control border-start-0 ps-0" placeholder="usuario@cng.com">
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label fw-bold small text-secondary">Contraseña</label>
            <div class="input-group shadow-sm">
              <span class="input-group-text bg-light border-end-0">🔒</span>
              <input v-model="password" type="password" required class="form-control border-start-0 ps-0" placeholder="••••••••">
            </div>
          </div>

          <div v-if="errorMsg" class="alert alert-danger py-2 small text-center mb-3">
            {{ errorMsg }}
          </div>

          <button type="submit" :disabled="cargando" class="btn btn-primary-custom w-100 py-3 fw-bold">
            {{ cargando ? 'Verificando...' : 'INICIAR SESIÓN' }}
          </button>
        </form>

        <div class="text-center mt-5 pt-3 border-top">
          <small class="text-muted">© 2026 Centro de Negocios Ganaderos | v1.0</small>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.login-fullscreen {
  height: 100vh;
  width: 100vw;
  display: flex;
  overflow: hidden;
  margin: 0;
}

/* --- SECCIÓN IZQUIERDA --- */
.brand-side {
  flex: 2.8; /* Video con mayor protagonismo */
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1B5E20;
  /* Bloqueo de selección de texto y cursor */
  user-select: none;
  cursor: default;
}

.bg-video {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  z-index: 0;
}

.video-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: linear-gradient(135deg, rgba(27, 94, 32, 0.8) 0%, rgba(0, 0, 0, 0.4) 100%);
  z-index: 1;
}

.brand-content {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 2rem;
}

.logo-hero {
  width: 375px; /* 50% más grande que el original (250px) */
  height: auto;
  filter: drop-shadow(0 15px 30px rgba(0,0,0,0.5));
  pointer-events: none; /* Evita que el logo sea arrastrable */
}

/* --- SECCIÓN DERECHA (BLANCO SÓLIDO) --- */
.auth-side {
  flex: 1;
  background-color: #ffffff; /* Sólido como pidió el cliente */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  z-index: 10;
  box-shadow: -10px 0 30px rgba(0,0,0,0.1);
}

.form-container {
  width: 100%;
  max-width: 380px;
}

/* --- UI ELEMENTS --- */
.text-dark-green { color: #1B5E20; }

.input-group-text {
  color: #1B5E20;
  border-color: #e0e0e0;
}

.form-control {
  border-color: #e0e0e0;
  padding: 0.75rem;
}

.form-control:focus {
  border-color: #1B5E20;
  box-shadow: none;
}

.btn-primary-custom {
  background-color: #F9A825;
  color: #212121;
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.btn-primary-custom:hover:not(:disabled) {
  background-color: #FBC02D;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(249, 168, 37, 0.4);
}

@media (max-width: 768px) {
  .brand-side { display: none; }
  .auth-side { flex: 1; padding: 2rem; }
}
</style>
