<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppNavbar from './components/AppNavbar.vue' // 👈 Importamos la barra de navegación

const route = useRoute()

// El Navbar solo se muestra si NO estamos en la pantalla de Login (ruta '/')
const mostrarNavbar = computed(() => {
  return route.path !== '/'
})
</script>

<template>
  <AppNavbar v-if="mostrarNavbar" />

  <RouterView />
</template>

<style>
/* Estilos globales */
body {
    margin: 0;
    font-family: 'Segoe UI', sans-serif;
    background-color: #f8f9fa; /* Le añadimos un fondo gris muy claro para que resalten las tarjetas blancas */
}
</style>
