<template>
  <div class="container mt-5 mb-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold text-success">💼 Gestión de Prospectos</h2>
      <span class="badge bg-success fs-6">{{ prospectos.length }} Interesados</span>
    </div>

    <div class="card shadow-sm border-0 rounded-lg">
      <div class="card-body p-0">

        <div v-if="cargando" class="text-center p-5">
          <div class="spinner-border text-success" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="mt-2 text-muted">Cargando prospectos...</p>
        </div>

        <div v-else-if="prospectos.length === 0" class="text-center p-5 text-muted">
          <h5>Aún no hay prospectos registrados.</h5>
          <p>Los datos de la Landing Page aparecerán aquí.</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Predio</th>
                <th class="text-center">¿Asesoría?</th>
                <th>Comentario</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in prospectos" :key="p.id">
                <td>{{ formatearFecha(p.fechaRegistro) }}</td>
                <td class="fw-bold">{{ p.nombre }}</td>
                <td>
                  <div>✉️ {{ p.correo }}</div>
                  <div>📱 {{ p.celular }}</div>
                </td>
                <td>{{ p.areaPredio || 'N/A' }}</td>
                <td class="text-center">
                  <span v-if="p.interesadoAsesoria" class="badge bg-success">Sí</span>
                  <span v-else class="badge bg-secondary">No</span>
                </td>
                <td style="max-width: 200px;" class="text-truncate" :title="p.comentario">
                  {{ p.comentario || 'Sin comentario' }}
                </td>
                <td class="text-center">
                  <div class="d-flex justify-content-center gap-2">
                    <button @click="contactarWhatsApp(p)" class="btn btn-sm btn-outline-success" title="Contactar por WhatsApp">
                      <i class="bi bi-whatsapp"></i> Contactar
                    </button>
                    <button @click="eliminarProspecto(p.id)" class="btn btn-sm btn-outline-danger" title="Eliminar/Descartar">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';

// 👇 AQUÍ ESTÁ LA MAGIA DE LA URL DINÁMICA 👇
const API_URL = window.location.hostname.includes('localhost')
  ? 'http://localhost:7292/api'
  : 'https://cng-backend.azurewebsites.net/api';

const prospectos = ref([]);
const cargando = ref(true);

// Llamamos a tu endpoint GET usando la variable API_URL
const cargarProspectos = async () => {
  try {
    const respuesta = await axios.get(`${API_URL}/Prospectos`);
    prospectos.value = respuesta.data;
  } catch (error) {
    console.error("Error al cargar prospectos:", error);
  } finally {
    cargando.value = false;
  }
};

// Formatear la fecha para que se vea bonita (ej. 27/02/2026)
const formatearFecha = (fechaDb) => {
  if (!fechaDb) return '';
  const fecha = new Date(fechaDb);
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Lógica del Botón Mágico de WhatsApp 🪄
const contactarWhatsApp = (prospecto) => {
  let celularLimpio = prospecto.celular.replace(/\D/g, '');

  if (celularLimpio.length === 10) {
    celularLimpio = '57' + celularLimpio;
  }

  const mensaje = `Hola ${prospecto.nombre}, soy asesor del Centro de Negocios Ganaderos 🐮. Vimos tu interés en nuestra plataforma y nos gustaría brindarte más información. ¿Cómo te podemos ayudar hoy?`;

  const urlWa = `https://wa.me/${celularLimpio}?text=${encodeURIComponent(mensaje)}`;
  window.open(urlWa, '_blank');
};

// Lógica para eliminar un prospecto 🗑️ usando la variable API_URL
const eliminarProspecto = async (id) => {
  const confirmacion = await Swal.fire({
    title: '¿Ya contactaste a esta persona?',
    text: "Al confirmar, el prospecto será eliminado de esta lista permanentemente.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (confirmacion.isConfirmed) {
    try {
      await axios.delete(`${API_URL}/Prospectos/${id}`);

      // Lo quitamos de la pantalla instantáneamente sin recargar
      prospectos.value = prospectos.value.filter(p => p.id !== id);

      Swal.fire(
        '¡Eliminado!',
        'El prospecto ha sido removido de tu lista.',
        'success'
      );
    } catch (error) {
      console.error("Error al eliminar:", error);
      Swal.fire(
        'Error',
        'Hubo un problema al eliminar el prospecto.',
        'error'
      );
    }
  }
};

onMounted(() => {
  cargarProspectos();
});
</script>
