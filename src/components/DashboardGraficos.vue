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

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Filler)

const props = defineProps({
  fincas: {
    type: Array,
    required: true
  }
});

// --- CÁLCULOS GENERALES (KPIs) ---
const kpis = computed(() => {
  let areaTotal = 0;
  let areaBosques = 0;
  const organizacionesUnicas = new Set();

  props.fincas.forEach(f => {
    if (f.areaTotal) areaTotal += f.areaTotal;
    if (f.areaBosques) areaBosques += f.areaBosques;
    if (f.afiliacion) organizacionesUnicas.add(f.afiliacion);
  });

  return {
    totalArea: areaTotal.toFixed(1),
    totalBosques: areaBosques.toFixed(1),
    totalOrgs: organizacionesUnicas.size
  };
});

// --- 1. GRÁFICO FASES ---
const dataFases = computed(() => {
  const conteo = { 'Censo': 0, 'Diagnostico': 0, 'Implementacion': 0, 'Seguimiento': 0, 'Inactivo': 0 };
  props.fincas.forEach(f => {
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

// --- 2. GRÁFICO PILARES ---
const dataPilares = computed(() => {
  let sumProd = 0, sumSoc = 0, sumAmb = 0, sumPart = 0;
  const total = props.fincas.length || 1;
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
      data: [(sumProd/total).toFixed(1), (sumSoc/total).toFixed(1), (sumAmb/total).toFixed(1), (sumPart/total).toFixed(1)]
    }]
  }
});

// --- 3. GRÁFICO INVENTARIO (CON CERDITO 🐷) ---
const dataInventario = computed(() => {
  let vacunos = 0;
  let bufalinos = 0;
  let otros = 0;

  props.fincas.forEach(f => {
    // 1. Detectamos la lista (puede venir como 'inventario' o 'Inventario')
    const listaAnimales = f.inventario || f.Inventario || [];

    if (listaAnimales.length > 0) {
        listaAnimales.forEach(item => {
            // 2. Detectamos las propiedades internas (Backend suele usar Mayúsculas)
            const nombreCategoria = item.categoria || item.Categoria || '';
            const cantidad = item.cantidad || item.Cantidad || 0;

            // Normalizamos a minúsculas para comparar
            const cat = nombreCategoria.toLowerCase();

            // 3. Lógica de clasificación
            if (cat.includes('vaca') || cat.includes('toro') || cat.includes('novilla') || cat.includes('ternero') || cat.includes('ceba')) {
                vacunos += cantidad;
            } else if (cat.includes('búfala') || cat.includes('bufalo') || cat.includes('bucerro')) {
                bufalinos += cantidad;
            } else {
                otros += cantidad;
            }
        });
    }
  });

  return {
    labels: ['Vacunos 🐮', 'Bufalinos 🐃', 'Otros 🐷'],
    datasets: [{
      label: 'Total Cabezas',
      backgroundColor: ['#795548', '#424242', '#FFCA28'],
      data: [vacunos, bufalinos, otros]
    }]
  }
});

// --- 4. NUEVO GRÁFICO: ÁREAS (IMPACTADA VS BOSQUE) ---
const dataAreas = computed(() => {
  return {
    labels: ['Área Total Impactada (Ha)', 'Bosque Protegido (Ha)'],
    datasets: [{
      label: 'Hectáreas',
      backgroundColor: ['#8D6E63', '#2E7D32'], // Café tierra y Verde bosque
      data: [kpis.value.totalArea, kpis.value.totalBosques]
    }]
  }
});

const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };
</script>

<template>
  <div class="animate__animated animate__fadeIn">

    <div class="alert alert-success d-flex justify-content-between align-items-center shadow-sm mb-4 border-0 bg-success text-white">
        <div>
            <h5 class="m-0 fw-bold">🌍 Validación Ambiental</h5>
            <small>Verifica la transparencia de los predios en la plataforma global Restor.</small>
        </div>
        <a href="https://restor.eco/es/organizations/8ecb9719-2529-4be3-9b3d-45c676cc7820/?utm_campaign=share-restor-profile&utm_medium=referral&utm_source=copy-link"
           target="_blank"
           class="btn btn-light fw-bold text-success shadow">
           Ver en Restor.eco ↗
        </a>
    </div>

    <div class="row g-3 mb-4">
        <div class="col-md-4">
            <div class="card border-0 shadow-sm p-3 text-center border-start border-5 border-primary">
                <h2 class="fw-bold text-primary m-0">{{ kpis.totalOrgs }}</h2>
                <small class="text-muted text-uppercase fw-bold">Organizaciones Vinculadas</small>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card border-0 shadow-sm p-3 text-center border-start border-5 border-warning">
                <h2 class="fw-bold text-warning m-0">{{ kpis.totalArea }} Ha</h2>
                <small class="text-muted text-uppercase fw-bold">Área Total Impactada</small>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card border-0 shadow-sm p-3 text-center border-start border-5 border-success">
                <h2 class="fw-bold text-success m-0">{{ kpis.totalBosques }} Ha</h2>
                <small class="text-muted text-uppercase fw-bold">Bosque Protegido</small>
            </div>
        </div>
    </div>

    <div class="row g-4">

        <div class="col-md-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-header bg-white fw-bold pt-3 border-0">🏗️ Fases del Proyecto</div>
                <div class="card-body" style="height: 220px;">
                    <Doughnut :data="dataFases" :options="chartOptions" />
                </div>
            </div>
        </div>

        <div class="col-md-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-header bg-white fw-bold pt-3 border-0">🌱 Sostenibilidad (Pilares)</div>
                <div class="card-body" style="height: 220px;">
                    <Radar :data="dataPilares" :options="chartOptions" />
                </div>
            </div>
        </div>

        <div class="col-md-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-header bg-white fw-bold pt-3 border-0">🌳 Cobertura de Tierra</div>
                <div class="card-body" style="height: 220px;">
                    <Bar :data="dataAreas" :options="chartOptions" />
                </div>
            </div>
        </div>

        <div class="col-md-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-header bg-white fw-bold pt-3 border-0">🐄 Población Animal</div>
                <div class="card-body" style="height: 220px;">
                    <Bar :data="dataInventario" :options="chartOptions" />
                </div>
            </div>
        </div>

    </div>
  </div>
</template>
