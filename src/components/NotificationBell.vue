<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();

// Conectado a tu puerto correcto
const BASE_URL = window.location.hostname.includes('localhost')
  ? 'http://localhost:7292/api'
  : 'https://cng-backend.azurewebsites.net/api';

const notificaciones = ref([]);
const mostrarMenu = ref(false);
const haySinLeer = ref(false);
let intervalo = null;

const cargarNotificaciones = async () => {
    const usuarioString = localStorage.getItem('usuario');
    if (!usuarioString) return;

    const usuario = JSON.parse(usuarioString);
    const userId = usuario.id || usuario.Id;

    try {
        const res = await axios.get(`${BASE_URL}/Notificaciones/${userId}`);
        notificaciones.value = res.data;
        haySinLeer.value = notificaciones.value.some(n => !(n.leido ?? n.Leido));
    } catch (e) {
        console.error("Silencio en las notificaciones...", e);
    }
};

const toggleMenu = async () => {
    mostrarMenu.value = !mostrarMenu.value;

    if (mostrarMenu.value && haySinLeer.value) {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        try {
            await axios.put(`${BASE_URL}/Notificaciones/${usuario.id || usuario.Id}/Leer`);
            haySinLeer.value = false;

            // Apagamos los fondos verdes visualmente al instante
            notificaciones.value.forEach(n => {
                if ('leido' in n) n.leido = true;
                if ('Leido' in n) n.Leido = true;
            });
        } catch (e) {
            console.error("Error marcando lectura", e);
        }
    }
};

// NUEVA FUNCIÓN: Eliminar Notificación
const borrarNotificacion = async (idNotif) => {
    // 1. Lo borramos de la vista inmediatamente (Optimistic UI) para que se sienta rápido
    notificaciones.value = notificaciones.value.filter(n => (n.id || n.Id) !== idNotif);

    // 2. Le decimos al backend que lo borre de verdad
    try {
        await axios.delete(`${BASE_URL}/Notificaciones/${idNotif}`);
    } catch (e) {
        console.error("Error borrando notificación", e);
    }
};

const irALink = (link) => {
    mostrarMenu.value = false;
    if (link) router.push(link);
};

const formatearFecha = (fechaString) => {
    if (!fechaString) return '';
    const date = new Date(fechaString);
    return isNaN(date) ? '' : date.toLocaleDateString();
};

onMounted(() => {
    cargarNotificaciones();
    intervalo = setInterval(cargarNotificaciones, 15000);
});

onUnmounted(() => clearInterval(intervalo));
</script>

<template>
    <div class="notif-wrapper">
        <button @click="toggleMenu" class="btn-campana" title="Notificaciones">
            🔔
            <span v-if="haySinLeer" class="puntito-rojo animate__animated animate__pulse animate__infinite"></span>
        </button>

        <div v-if="mostrarMenu" class="dropdown-notif shadow-lg animate__animated animate__fadeIn">
            <div class="header-notif">
                Notificaciones
                <button @click="mostrarMenu = false" class="btn-close-notif">×</button>
            </div>

            <div v-if="notificaciones.length === 0" class="vacio">
                💤 Sin novedades recientes.
            </div>

            <div v-else class="lista-scroll">
                <div
                    v-for="n in notificaciones"
                    :key="n.id || n.Id"
                    class="item-notif"
                    :class="{ 'no-leido': !(n.leido ?? n.Leido) }"
                >
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <strong class="titulo" @click="irALink(n.linkRedireccion || n.LinkRedireccion)" style="cursor: pointer;">
                            {{ n.titulo || n.Titulo }}
                        </strong>
                        <button @click.stop="borrarNotificacion(n.id || n.Id)" class="btn-borrar" title="Eliminar">✖</button>
                    </div>

                    <p class="mensaje" @click="irALink(n.linkRedireccion || n.LinkRedireccion)" style="cursor: pointer;">
                        {{ n.mensaje || n.Mensaje }}
                    </p>

                    <div class="text-end">
                        <span class="fecha">{{ formatearFecha(n.fecha || n.Fecha) }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.notif-wrapper { position: relative; display: inline-block; margin-left: 15px; }

.btn-campana {
    background: white; border: 1px solid #ddd; border-radius: 50%;
    width: 40px; height: 40px; font-size: 1.2rem;
    cursor: pointer; position: relative;
    transition: transform 0.2s;
    display: flex; align-items: center; justify-content: center;
}
.btn-campana:hover { transform: scale(1.1); background: #f8f9fa; }

.puntito-rojo {
    position: absolute; top: 0; right: 0;
    width: 12px; height: 12px; background: #dc3545;
    border-radius: 50%; border: 2px solid white;
}

.dropdown-notif {
    position: absolute; right: 0; top: 50px; width: 320px;
    background: white; border-radius: 8px; border: 1px solid #ddd;
    z-index: 3000; overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
}

.header-notif {
    background: #1B5E20; color: white; padding: 10px 15px;
    font-size: 0.9rem; font-weight: bold;
    display: flex; justify-content: space-between; align-items: center;
}
.btn-close-notif { background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; }

.lista-scroll { max-height: 350px; overflow-y: auto; }

.item-notif {
    padding: 12px 15px; border-bottom: 1px solid #f0f0f0;
    transition: background 0.2s;
}
.item-notif:hover { background-color: #f9f9f9; }
.item-notif.no-leido { background-color: #e8f5e9; border-left: 4px solid #1B5E20; }

/* Nuevo estilo para el botón de borrar */
.btn-borrar {
    background: none; border: none; color: #aaa; font-size: 0.8rem;
    cursor: pointer; padding: 0 5px; line-height: 1; transition: color 0.2s;
}
.btn-borrar:hover { color: #dc3545; }

.titulo { font-size: 0.85rem; color: #333; display: block; margin-bottom: 2px; }
.titulo:hover { color: #1B5E20; text-decoration: underline; }
.mensaje { font-size: 0.8rem; color: #666; margin: 0; line-height: 1.3; }
.fecha { font-size: 0.7rem; color: #999; }
.vacio { padding: 20px; text-align: center; color: #999; font-size: 0.9rem; }
</style>
