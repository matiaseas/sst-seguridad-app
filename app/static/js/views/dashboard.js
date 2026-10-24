import { state } from '../state.js';
import { api } from '../api.js';

let chartTypeInstance = null;
let chartLocationInstance = null;
let chartRiskInstance = null;
let chartMonthInstance = null;

export async function renderDashboard(container) {
  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      <!-- ENCABEZADO Y FILTROS TEMPORALES -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black text-slate-900">DASHBOARD & INDICADORES SST</h2>
          <p class="text-xs text-slate-500">Métricas en tiempo real sobre condiciones, incidentes y acciones correctivas</p>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-xs font-bold text-slate-500">Período:</label>
          <select id="select-dashboard-period" class="touch-btn h-10 px-3 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 shadow-sm focus:ring-2 focus:ring-sky-500">
            <option value="all">Todo el Historial</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="year">Año actual (2026)</option>
          </select>
        </div>
      </div>

      <!-- CARDS DE KPIS NUMÉRICOS -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" id="kpis-container">
        <div class="col-span-full py-8 text-center text-slate-400 text-xs">Cargando indicadores...</div>
      </div>

      <!-- SEGUNDA FILA: ALERTAS Y CRITICIDAD -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" id="kpis-subcontainer"></div>

      <!-- GRÁFICOS INTERACTIVOS (CHART.JS) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- GRÁFICO 1: DISTRIBUCIÓN POR TIPO -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 class="text-sm font-bold text-slate-800 mb-1">Distribución de Reportes por Tipo</h3>
          <p class="text-xs text-slate-400 mb-4">Condiciones inseguras, actos, incidentes y accidentes</p>
          <div class="h-64 relative">
            <canvas id="chart-by-type"></canvas>
          </div>
        </div>

        <!-- GRÁFICO 2: REPORTES POR SECTOR -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 class="text-sm font-bold text-slate-800 mb-1">Sectores Críticos del Taller</h3>
          <p class="text-xs text-slate-400 mb-4">Ubicaciones operativas con mayor concentración de reportes</p>
          <div class="h-64 relative">
            <canvas id="chart-by-location"></canvas>
          </div>
        </div>

        <!-- GRÁFICO 3: NIVEL DE RIESGO -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 class="text-sm font-bold text-slate-800 mb-1">Evaluación de Riesgo Técnico</h3>
          <p class="text-xs text-slate-400 mb-4">Criticidad determinada por la Matriz 5x5 (P x C)</p>
          <div class="h-64 relative">
            <canvas id="chart-by-risk"></canvas>
          </div>
        </div>

        <!-- GRÁFICO 4: EVOLUCIÓN MENSUAL -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 class="text-sm font-bold text-slate-800 mb-1">Evolución de Notificaciones</h3>
          <p class="text-xs text-slate-400 mb-4">Tendencia mensual de reporte de situaciones</p>
          <div class="h-64 relative">
            <canvas id="chart-by-month"></canvas>
          </div>
        </div>

      </div>

      <!-- SITUACIONES RECIENTES -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold text-slate-800">Últimos Reportes Registrados</h3>
          <button id="btn-dash-view-all" class="text-xs font-bold text-sky-600 hover:text-sky-800">
            Ver todos los reportes →
          </button>
        </div>

        <div id="dash-recent-table" class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-slate-400 uppercase font-bold border-b border-slate-100">
                <th class="pb-2">Código</th>
                <th class="pb-2">Fecha</th>
                <th class="pb-2">Tipo</th>
                <th class="pb-2">Sector</th>
                <th class="pb-2">Riesgo</th>
                <th class="pb-2">Estado</th>
              </tr>
            </thead>
            <tbody id="dash-recent-body" class="divide-y divide-slate-100"></tbody>
          </table>
        </div>
      </div>

    </div>
  `;

  document.getElementById('btn-dash-view-all')?.addEventListener('click', () => state.setView('reports_list'));

  const selectPeriod = document.getElementById('select-dashboard-period');
  selectPeriod.addEventListener('change', () => loadDashboardData(selectPeriod.value));

  loadDashboardData('all');
}

async function loadDashboardData(period) {
  try {
    const data = await api.getDashboardStats(period);
    const kpis = data.kpis;
    const charts = data.charts;

    // Renderizar KPIs
    const kpisContainer = document.getElementById('kpis-container');
    kpisContainer.innerHTML = `
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Total Reportes</span>
        <span class="text-2xl font-black text-slate-900">${kpis.total_reports}</span>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Abiertos</span>
        <span class="text-2xl font-black text-sky-600">${kpis.open_reports}</span>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Cerrados</span>
        <span class="text-2xl font-black text-emerald-600">${kpis.closed_reports}</span>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Condiciones</span>
        <span class="text-2xl font-black text-amber-600">${kpis.unsafe_conditions}</span>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Actos Inseguros</span>
        <span class="text-2xl font-black text-orange-600">${kpis.unsafe_acts}</span>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Incidentes</span>
        <span class="text-2xl font-black text-indigo-600">${kpis.incidents}</span>
      </div>
    `;

    const subContainer = document.getElementById('kpis-subcontainer');
    subContainer.innerHTML = `
      <div class="bg-red-50 p-4 rounded-xl border border-red-200">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-red-900">Peligros Inmediatos</span>
          <span class="text-xs font-bold text-red-700">⚠️</span>
        </div>
        <span class="text-2xl font-black text-red-700">${kpis.immediate_dangers}</span>
        <span class="text-[10px] text-red-600 block mt-0.5">Alertas críticas atendidas</span>
      </div>

      <div class="bg-amber-50 p-4 rounded-xl border border-amber-200">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-amber-900">Acciones Pendientes</span>
          <span class="text-xs font-bold text-amber-700">⚙️</span>
        </div>
        <span class="text-2xl font-black text-amber-700">${kpis.pending_actions}</span>
        <span class="text-[10px] text-amber-600 block mt-0.5">En proceso de resolución</span>
      </div>

      <div class="bg-purple-50 p-4 rounded-xl border border-purple-200">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-purple-900">Acciones Vencidas</span>
          <span class="text-xs font-bold text-purple-700">⏰</span>
        </div>
        <span class="text-2xl font-black text-purple-700">${kpis.overdue_actions}</span>
        <span class="text-[10px] text-purple-600 block mt-0.5">Fuera de plazo límite</span>
      </div>

      <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-emerald-900">Resolución Promedio</span>
          <span class="text-xs font-bold text-emerald-700">⏱️</span>
        </div>
        <span class="text-2xl font-black text-emerald-700">${kpis.avg_resolution_days} días</span>
        <span class="text-[10px] text-emerald-600 block mt-0.5">Tiempo medio de cierre</span>
      </div>
    `;

    // Renderizar Gráficos con Chart.js si la librería está disponible
    if (window.Chart) {
      renderCharts(charts);
    }

    // Tabla de situaciones recientes
    const recentBody = document.getElementById('dash-recent-body');
    if (data.recent_reports.length > 0) {
      recentBody.innerHTML = data.recent_reports.map(r => `
        <tr class="hover:bg-slate-50 cursor-pointer" onclick="window.sstViewReport(${r.id})">
          <td class="py-2.5 font-mono font-bold text-sky-700">${r.code}</td>
          <td class="py-2.5 text-slate-500">${r.created_at}</td>
          <td class="py-2.5 font-medium text-slate-800">${r.type}</td>
          <td class="py-2.5 text-slate-600">${r.location}</td>
          <td class="py-2.5"><span class="font-bold">${r.risk_level}</span></td>
          <td class="py-2.5 font-semibold text-slate-700">${r.status}</td>
        </tr>
      `).join('');
    } else {
      recentBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-slate-400">Sin reportes registrados en este período.</td></tr>`;
    }

    window.sstViewReport = (id) => state.setView('report_detail', { reportId: id });

  } catch (err) {
    state.showToast('Error cargando métricas del dashboard', 'error');
  }
}

function renderCharts(charts) {
  // 1. Por Tipo
  if (chartTypeInstance) chartTypeInstance.destroy();
  const ctxType = document.getElementById('chart-by-type')?.getContext('2d');
  if (ctxType) {
    chartTypeInstance = new Chart(ctxType, {
      type: 'doughnut',
      data: {
        labels: Object.keys(charts.by_type),
        datasets: [{
          data: Object.values(charts.by_type),
          backgroundColor: ['#f59e0b', '#f97316', '#3b82f6', '#ef4444', '#14b8a6', '#94a3b8']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
      }
    });
  }

  // 2. Por Sector / Ubicación
  if (chartLocationInstance) chartLocationInstance.destroy();
  const ctxLoc = document.getElementById('chart-by-location')?.getContext('2d');
  if (ctxLoc) {
    chartLocationInstance = new Chart(ctxLoc, {
      type: 'bar',
      data: {
        labels: Object.keys(charts.by_location),
        datasets: [{
          label: 'Reportes por Sector',
          data: Object.values(charts.by_location),
          backgroundColor: '#0284c7'
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { stepSize: 1, font: { size: 10 } } } }
      }
    });
  }

  // 3. Por Nivel de Riesgo
  if (chartRiskInstance) chartRiskInstance.destroy();
  const ctxRisk = document.getElementById('chart-by-risk')?.getContext('2d');
  if (ctxRisk) {
    chartRiskInstance = new Chart(ctxRisk, {
      type: 'bar',
      data: {
        labels: Object.keys(charts.by_risk_level),
        datasets: [{
          label: 'Cantidad',
          data: Object.values(charts.by_risk_level),
          backgroundColor: ['#10b981', '#eab308', '#f97316', '#ef4444', '#991b1b', '#94a3b8']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { stepSize: 1, font: { size: 10 } } } }
      }
    });
  }

  // 4. Por Mes
  if (chartMonthInstance) chartMonthInstance.destroy();
  const ctxMonth = document.getElementById('chart-by-month')?.getContext('2d');
  if (ctxMonth) {
    chartMonthInstance = new Chart(ctxMonth, {
      type: 'line',
      data: {
        labels: Object.keys(charts.by_month),
        datasets: [{
          label: 'Reportes',
          data: Object.values(charts.by_month),
          borderColor: '#0f172a',
          backgroundColor: 'rgba(15, 23, 42, 0.05)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { stepSize: 1, font: { size: 10 } } } }
      }
    });
  }
}
