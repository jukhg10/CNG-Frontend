<script setup>
import { computed } from 'vue';
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js'
import { Doughnut, Radar, Bar } from 'vue-chartjs'

// Registramos los componentes de Chart.js
ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Filler)

// Recibimos los datos desde el padre (AdminFincas o AdminOrg)
const props = defineProps({
  fincas: {
    type: Array,
    required: true
  }
});

// --- 1. DATOS PARA GRÁFICO DE FASES (DONA) ---
const dataFases = computed(() => {
  const conteo = { 'Censo': 0, 'Diagnostico': 0, 'Implementacion': 0, 'Seguimiento': 0, 'Inactivo': 0 };

  props.fincas.forEach(f => {
    // Normalizamos el texto (quitando tildes por si acaso)
    let fase = f.faseAvance || 'Censo';
    if(conteo[fase] !== undefined) conteo[fase]++;
  });

  return {
    labels: ['Censo', 'Diagnóstico', 'Implementación', 'Seguimiento', 'Inactivo'],
    datasets: [{
      backgroundColor: ['#FFECB3', '#F9A825', '#2E7D32', '#1565C0', '#B0BEC5'],
      data: [conteo['Censo'], conteo['Diagnostico'], conteo['Implementacion'], conteo['Seguimiento'], conteo['Inactivo']]
    }]
  }
});

// --- 2. DATOS PARA GRÁFICO DE PILARES (RADAR) ---
const dataPilares = computed(() => {
  let sumProd = 0, sumSoc = 0, sumAmb = 0, sumPart = 0;
  const total = props.fincas.length || 1; // Evitar división por cero

  props.fincas.forEach(f => {
    sumProd += f.pilarProductivo || 0;
    sumSoc += f.pilarSocioEconomico || 0;
    sumAmb += f.pilarAmbiental || 0;
    sumPart += f.pilarParticipacion || 0;
  });

  return {
    labels: ['Productivo', 'Socio-Econ', 'Ambiental', 'Marketing'],
    datasets: [{
      label: 'Promedio General',
      backgroundColor: 'rgba(46, 125, 50, 0.2)',
      borderColor: '#2E7D32',
      pointBackgroundColor: '#2E7D32',
      pointBorderColor: '#fff',
      data: [
        (sumProd / total).toFixed(1),
        (sumSoc / total).toFixed(1),
        (sumAmb / total).toFixed(1),
        (sumPart / total).toFixed(1)
      ]
    }]
  }
});

// --- 3. DATOS PARA CONTEO DE ANIMALES (BARRAS) ---
const dataInventario = computed(() => {
  let vacunos = 0;
  let bufalinos = 0;
  let otros = 0;

  props.fincas.forEach(f => {
    if (f.inventario && f.inventario.length > 0) {
        f.inventario.forEach(item => {
            // Lógica simple basada en el texto de la categoría
            const cat = item.categoria.toLowerCase();
            if (cat.includes('vaca') || cat.includes('toro') || cat.includes('novilla') || cat.includes('ternero')) {
                vacunos += item.cantidad;
            } else if (cat.includes('búfala') || cat.includes('bufalo') || cat.includes('bucerro')) {
                bufalinos += item.cantidad;
            } else {
                otros += item.cantidad;
            }
        });
    }
  });

  return {
    labels: ['Vacunos 🐮', 'Bufalinos 🐃', 'Otros 🐴'],
    datasets: [{
      label: 'Total Cabezas',
      backgroundColor: ['#795548', '#424242', '#FFCA28'],
      data: [vacunos, bufalinos, otros]
    }]
  }
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
      legend: { position: 'bottom' }
  }
};
</script>

<template>
  <div class="row g-4 mb-4 animate__animated animate__fadeIn">

    <div class="col-md-4">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-header bg-white fw-bold border-bottom-0 pt-3">
            🏗️ Estado de los Predios
        </div>
        <div class="card-body" style="height: 250px; position: relative;">
            <Doughnut :data="dataFases" :options="chartOptions" />
        </div>
      </div>
    </div>

    <div class="col-md-4">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-header bg-white fw-bold border-bottom-0 pt-3">
            🌍 Sostenibilidad Promedio
        </div>
        <div class="card-body" style="height: 250px; position: relative;">
            <Radar :data="dataPilares" :options="chartOptions" />
        </div>
      </div>
    </div>

    <div class="col-md-4">
      <div class="card border-0 shadow-sm h-100">
        <div class="card-header bg-white fw-bold border-bottom-0 pt-3">
            🐄 Población Ganadera
        </div>
        <div class="card-body" style="height: 250px; position: relative;">
            <Bar :data="dataInventario" :options="chartOptions" />
        </div>
      </div>
    </div>

  </div>
</template>
