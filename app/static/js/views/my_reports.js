import { state } from '../state.js';
import { api } from '../api.js';

export async function renderMyReports(container) {
  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-8">
      
      <div class="flex items-center justify-between mb-6">
        <div>
          <button id="btn-back-home" class="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium mb-1">
            ← Volver al inicio
          </button>
          <h2 class="text-2xl font-black text-slate-900">MIS REPORTES DE SEGURIDAD</h2>
          <p class="text-xs text-slate-500">Historial de situaciones notificadas por tu usuario</p>
        </div>
        <button id="btn-create-another" class="touch-btn bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm">
          + Nuevo Reporte
        </button>
      </div>

      <div id="my-reports-list" class="space-y-3">
        <div class="text-center py-12 text-slate-400 text-sm">Cargando tus reportes...</div>
      </div>

    </div>
  `;

  document.getElementById('btn-back-home')?.addEventListener('click', () => state.setView('home'));
  document.getElementById('btn-create-another')?.addEventListener('click', () => state.setView('new_report'));

  const listContainer = document.getElementById('my-reports-list');

  try {
    const reports = await api.listReports({ only_mine: true });

    if (reports.length === 0) {
      listContainer.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <span class="text-4xl block mb-3">📋</span>
          <h3 class="text-lg font-bold text-slate-800 mb-1">Aún no has registrado ningún reporte</h3>
          <p class="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Cuando detectes una condición o acto inseguro en el taller, utiliza el botón de nuevo reporte para comunicarlo.
          </p>
          <button id="btn-empty-create" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm">
            Crear mi primer reporte
          </button>
        </div>
      `;
      document.getElementById('btn-empty-create')?.addEventListener('click', () => state.setView('new_report'));
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

    listContainer.innerHTML = reports.map(r => `
      <div data-report-id="${r.id}" class="report-item cursor-pointer bg-white rounded-xl border border-slate-200 p-4 hover:border-sky-400 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">${r.code}</span>
            <span class="badge-status ${statusClasses[r.status] || ''}">${r.status}</span>
            <span class="text-xs text-slate-400">• ${new Date(r.created_at).toLocaleDateString()}</span>
          </div>
          <h4 class="font-bold text-sm text-slate-900">${r.report_type.name} - <span class="text-slate-600 font-normal">${r.location.name}</span></h4>
          <p class="text-xs text-slate-600 mt-1 line-clamp-2">${r.description}</p>
        </div>

        <div class="flex items-center gap-2 sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
          <span class="text-xs text-slate-400">
            ${r.actions_count > 0 ? `⚙️ ${r.actions_count} acción(es)` : ''}
          </span>
          <button class="text-xs font-bold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-200 transition-colors">
            Ver Ficha →
          </button>
        </div>
      </div>
    `).join('');

    listContainer.querySelectorAll('.report-item').forEach(el => {
      el.addEventListener('click', () => {
        state.setView('report_detail', { reportId: parseInt(el.dataset.reportId) });
      });
    });

  } catch (err) {
    listContainer.innerHTML = `<div class="p-4 bg-red-50 text-red-700 text-sm rounded-xl">Error cargando reportes: ${err.message}</div>`;
  }
}
