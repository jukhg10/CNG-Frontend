<template>
  <div class="container mt-5 mb-5">
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-6">
        <div class="card shadow-lg border-0 rounded-lg">
          <div class="card-body p-5">
            <h2 class="text-center mb-4 fw-bold text-success">Trabaje con Nosotros 🐮</h2>
            <p class="text-center text-muted mb-4">
              Déjenos sus datos y un asesor del Centro de Negocios Ganaderos se pondrá en contacto pronto.
            </p>

            <form @submit.prevent="enviarFormulario">
              <div class="mb-3">
                <label class="form-label fw-bold">Nombre Completo <span class="text-danger">*</span></label>
                <input type="text" v-model="formulario.nombre" class="form-control" required placeholder="Ej. Juan Pérez">
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Correo Electrónico <span class="text-danger">*</span></label>
                  <input type="email" v-model="formulario.correo" class="form-control" required placeholder="juan@correo.com">
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Celular <span class="text-danger">*</span></label>
                  <input type="tel" v-model="formulario.celular" class="form-control" required placeholder="300 123 4567">
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">Área del Predio</label>
                <input type="text" v-model="formulario.areaPredio" class="form-control" placeholder="Ej. 50 hectáreas">
              </div>

              <div class="form-check mb-3 mt-4">
                <input class="form-check-input" type="checkbox" v-model="formulario.interesadoAsesoria" id="checkAsesoria">
                <label class="form-check-label fw-bold" for="checkAsesoria">
                  ¿Está interesado en recibir asesoría personalizada?
                </label>
              </div>

              <div class="mb-4 mt-3">
                <label class="form-label fw-bold">Déjenos un comentario</label>
                <textarea v-model="formulario.comentario" class="form-control" rows="3" placeholder="¿En qué podemos ayudarle?"></textarea>
              </div>

              <div class="d-grid mt-4">
                <button type="submit" class="btn btn-success btn-lg" :disabled="cargando">
                  <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
                  {{ cargando ? 'Enviando...' : 'Enviar Información' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2'; // ¡Importante para las alertas bonitas!

// El estado reactivo de nuestro formulario
const formulario = ref({
  nombre: '',
  correo: '',
  celular: '',
  areaPredio: '',
  interesadoAsesoria: false,
  comentario: ''
});

const cargando = ref(false);

const enviarFormulario = async () => {
  cargando.value = true;

  try {
    // Apuntamos al endpoint que acabamos de crear en C#
    await axios.post('http://localhost:7292/api/Prospectos', formulario.value);

    // Mostramos la alerta de éxito con SweetAlert2
    Swal.fire({
      icon: 'success',
      title: '¡Información enviada!',
      text: 'Gracias por su interés. Un asesor se comunicará con usted en breve.',
      confirmButtonColor: '#198754' // Color verde Bootstrap
    });

    // Vaciamos el formulario para dejarlo limpio
    formulario.value = {
      nombre: '',
      correo: '',
      celular: '',
      areaPredio: '',
      interesadoAsesoria: false,
      comentario: ''
    };

  } catch (error) {
    console.error('Error enviando los datos:', error);

    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Hubo un problema al enviar sus datos. Por favor, intente de nuevo.',
      confirmButtonColor: '#198754'
    });
  } finally {
    cargando.value = false;
  }
};
</script>

<style scoped>
/* Un pequeño toque extra para que la tarjeta resalte */
.card {
  border-radius: 15px;
}
.form-control:focus {
  border-color: #198754;
  box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25);
}
</style>
