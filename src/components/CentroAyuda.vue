<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

// Lista simulada de videos (luego la puedes traer de BD o JSON)
const tutoriales = [
  {
    id: 1,
    titulo: "Cómo registrar una nueva finca",
    duracion: "3:45",
    img: "https://via.placeholder.com/300x180.png?text=Registro+Finca",
    url: "https://www.youtube.com/"
  },
  {
    id: 2,
    titulo: "Subir inventario masivo",
    duracion: "5:10",
    img: "https://via.placeholder.com/300x180.png?text=Inventario",
    url: "https://www.youtube.com/"
  },
  {
    id: 3,
    titulo: "Gestión de Planes Operativos",
    duracion: "8:20",
    img: "https://via.placeholder.com/300x180.png?text=Plan+Operativo",
    url: "https://www.youtube.com/"
  }
];
</script>

<template>
  <div class="container py-5">
    <div class="d-flex justify-content-between align-items-center mb-5">
      <div>
        <h2 class="fw-bold text-success">📚 Centro de Aprendizaje</h2>
        <p class="text-muted">Tutoriales y guías para el uso de la plataforma</p>
      </div>
      <button @click="router.go(-1)" class="btn btn-outline-secondary">⬅ Volver</button>
    </div>

    <div class="row g-4">
      <div v-for="video in tutoriales" :key="video.id" class="col-md-4">
        <div class="card h-100 border-0 shadow-sm video-card">
          <div class="position-relative">
            <img :src="video.img" class="card-img-top" alt="Thumbnail">
            <div class="play-icon">▶</div>
            <span class="badge bg-dark position-absolute bottom-0 end-0 m-2">{{ video.duracion }}</span>
          </div>
          <div class="card-body">
            <h5 class="card-title fw-bold fs-6">{{ video.titulo }}</h5>
            <a :href="video.url" target="_blank" class="btn btn-sm btn-success w-100 mt-2">Ver Tutorial</a>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card h-100 border-2 border-dashed d-flex align-items-center justify-content-center bg-light text-muted p-5">
          <div class="text-center">
            <h1 class="mb-0">➕</h1>
            <p>Próximamente más videos</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-card { transition: transform 0.2s; overflow: hidden; cursor: pointer; }
.video-card:hover { transform: translateY(-5px); }
.play-icon {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  color: white; font-size: 3rem; opacity: 0.8; text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}
.border-dashed { border-style: dashed !important; }
</style>
