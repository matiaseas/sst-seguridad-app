import { state } from '../state.js';
import { api } from '../api.js';

export async function renderReportsList(container) {
  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-6">
      
      <!-- ENCABEZADO Y EXPORTACIÓN -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-2xl font-black text-slate-900">BANDEJA GENERAL DE REPORTES</h2>
          <p class="text-xs text-slate-500">Gestión, triaje y seguimiento de situaciones de higiene y seguridad</p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <a id="btn-export-excel" href="${api.getExcelUrl()}" target="_blank" class="touch-btn bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Exportar Excel
          </a>
          <a id="btn-export-csv" href="${api.getCsvUrl()}" target="_blank" class="touch-btn bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Exportar CSV
          </a>
          <button id="btn-list-new-report" class="touch-btn bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5">
            + Nuevo Reporte
          </button>
        </div>
      </div>

      <!-- BARRA DE FILTROS FACETADOS -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          <!-- Búsqueda rápida -->
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">Buscar por código o texto:</label>
            <input type="text" id="filter-search" placeholder="Ej: SST-2026 o cables..." class="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500">
          </div>

          <!-- Tipo -->
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">Tipo de situación:</label>
            <select id="filter-type" class="w-full h-10 px-2.5 rounded-xl border border-slate-300 text-xs bg-white">
              <option value="">Todos los tipos</option>
            </select>
          </div>

          <!-- Ubicación -->
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">Sector / Ubicación:</label>
            <select id="filter-location" class="w-full h-10 px-2.5 rounded-xl border border-slate-300 text-xs bg-white">
              <option value="">Todos los sectores</option>
            </select>
          </div>

          <!-- Estado -->
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">Estado del reporte:</label>
            <select id="filter-status" class="w-full h-10 px-2.5 rounded-xl border border-slate-300 text-xs bg-white">
              <option value="">Todos los estados</option>
              <option value="Reportado">Reportado</option>
              <option value="En revisión">En revisión</option>
              <option value="En análisis">En análisis</option>
              <option value="Acción asignada">Acción asignada</option>
              <option value="En proceso">En proceso</option>
              <option value="Pendiente de verificación">Pendiente de verificación</option>
              <option value="Cerrado">Cerrado</option>
              <option value="Descartado">Descartado</option>
            </select>
          </div>

          <!-- Nivel de Riesgo -->
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">Nivel de Riesgo:</label>
            <select id="filter-risk" class="w-full h-10 px-2.5 rounded-xl border border-slate-300 text-xs bg-white">
              <option value="">Todos los riesgos</option>
              <option value="Bajo">Bajo</option>
              <option value="Moderado">Moderado</option>
              <option value="Importante">Importante</option>
              <option value="Alto">Alto</option>
              <option value="Crítico">Crítico</option>
            </select>
          </div>

        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span id="reports-count-label">Cargando reportes...</span>
          <button id="btn-reset-filters" class="text-sky-600 hover:text-sky-800 font-semibold">
            Limpiar filtros
          </button>
        </div>
      </div>

      <!-- TABLA Y LISTADO DE REPORTES -->
      <div id="reports-table-container" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th class="py-3 px-4">Código</th>
                <th class="py-3 px-4">Fecha</th>
                <th class="py-3 px-4">Tipo</th>
                <th class="py-3 px-4">Ubicación</th>
                <th class="py-3 px-4">Descripción</th>
                <th class="py-3 px-4">Riesgo</th>
                <th class="py-3 px-4">Acciones</th>
                <th class="py-3 px-4">Estado</th>
                <th class="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody id="reports-table-body" class="divide-y divide-slate-100">
              <tr><td colspan="9" class="text-center py-12 text-slate-400">Cargando registros...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;

  document.getElementById('btn-list-new-report')?.addEventListener('click', () => state.setView('new_report'));

  // Cargar selects de tipos y ubicaciones
  try {
    const [types, locations] = await Promise.all([
      api.getReportTypes(),
      api.getLocations()
    ]);

    const selectType = document.getElementById('filter-type');
    types.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      selectType.appendChild(opt);
    });

    const selectLoc = document.getElementById('filter-location');
    locations.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.id;
      opt.textContent = l.name;
      selectLoc.appendChild(opt);
    });
  } catch (_) {}

  // Función para cargar y filtrar reportes
  async function loadReports() {
    const search = document.getElementById('filter-search')?.value.trim() || '';
    const report_type_id = document.getElementById('filter-type')?.value || '';
    const location_id = document.getElementById('filter-location')?.value || '';
    const statusVal = document.getElementById('filter-status')?.value || '';
    const risk_level = document.getElementById('filter-risk')?.value || '';

    const tbody = document.getElementById('reports-table-body');
    const countLabel = document.getElementById('reports-count-label');

    try {
      const reports = await api.listReports({
        search,
        report_type_id,
        location_id,
        status: statusVal,
        risk_level
      });

      countLabel.textContent = `Mostrando ${reports.length} reporte(s) encontrados`;

      if (reports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-12 text-slate-400">No se encontraron reportes con los filtros seleccionados.</td></tr>`;
        return;
      }

      const statusClasses = {
        'Reportado': 'status-reportado',
        'En revisión': 'status-en-revisión',
        'En análisis': 'status-en-análisis',
        'Acción asignada': 'status-acción-asignada',
        'En proceso': 'status-en-proceso',
        'Pendiente de verificación': 'status-pendiente-de-verificación',
        'Cerrado': 'status-cerrado',
        'Descartado': 'status-descartado'
      };

      const riskBadgeClasses = {
        'Bajo': 'risk-bajo',
        'Moderado': 'risk-moderado',
        'Importante': 'risk-importante',
        'Alto': 'risk-alto',
        'Crítico': 'risk-crítico'
      };

      tbody.innerHTML = reports.map(r => `
        <tr class="hover:bg-slate-50/80 transition-colors cursor-pointer" data-id="${r.id}">
          <td class="py-3 px-4 font-mono font-bold text-xs text-sky-700 whitespace-nowrap">
            ${r.code}
            ${r.immediate_danger ? '<span class="ml-1 text-red-500 font-bold" title="Peligro Inmediato">⚠️</span>' : ''}
          </td>
          <td class="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
            ${new Date(r.created_at).toLocaleDateString()}
          </td>
          <td class="py-3 px-4 font-medium text-xs text-slate-800 whitespace-nowrap">
            ${r.report_type.name}
          </td>
          <td class="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
            ${r.location.name}
          </td>
          <td class="py-3 px-4 text-xs text-slate-700 max-w-xs truncate" title="${r.description}">
            ${r.description}
          </td>
          <td class="py-3 px-4 whitespace-nowrap">
            ${r.risk_level ? `
              <span class="risk-badge ${riskBadgeClasses[r.risk_level] || ''}">
                ${r.risk_level} (${r.risk_score})
              </span>
            ` : '<span class="text-xs text-slate-400 italic">Sin evaluar</span>'}
          </td>
          <td class="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
            ${r.actions_count > 0 ? `
              <span class="font-bold text-slate-800">${r.actions_count}</span>
              ${r.pending_actions_count > 0 ? `<span class="text-amber-600 text-xs font-semibold">(${r.pending_actions_count} pend.)</span>` : '<span class="text-emerald-600 text-xs font-semibold">✓</span>'}
            ` : '<span class="text-slate-300">-</span>'}
          </td>
          <td class="py-3 px-4 whitespace-nowrap">
            <span class="badge-status ${statusClasses[r.status] || ''}">
              ${r.status}
            </span>
          </td>
          <td class="py-3 px-4 text-right whitespace-nowrap">
            <button class="btn-open-detail text-xs font-bold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-200 transition-colors">
              Gestionar →
            </button>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('tr[data-id]').forEach(row => {
        row.addEventListener('click', (e) => {
          const reportId = parseInt(row.dataset.id);
          state.setView('report_detail', { reportId });
        });
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-6 text-red-600 text-xs">Error cargando reportes: ${err.message}</td></tr>`;
    }
  }

  // Listeners de filtros
  let debounceTimeout;
  document.getElementById('filter-search')?.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(loadReports, 300);
  });
  document.getElementById('filter-type')?.addEventListener('change', loadReports);
  document.getElementById('filter-location')?.addEventListener('change', loadReports);
  document.getElementById('filter-status')?.addEventListener('change', loadReports);
  document.getElementById('filter-risk')?.addEventListener('change', loadReports);

  document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-location').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-risk').value = '';
    loadReports();
  });

  // Carga inicial
  loadReports();
}
