import { state } from '../state.js';
import { api } from '../api.js';

export function renderTrack(container) {
  container.innerHTML = `
    <div class="max-w-xl mx-auto px-4 py-8">
      
      <div class="mb-6">
        <button id="btn-back-home" class="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium mb-1">
          ← Volver al inicio
        </button>
        <h2 class="text-2xl font-black text-slate-900">CONSULTAR ESTADO DE REPORTE</h2>
        <p class="text-xs text-slate-500">Ingresa tu código de reporte para conocer su evolución en tiempo real</p>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <form id="form-track" class="flex gap-2">
          <input type="text" id="input-track-code" required placeholder="Ej: SST-2026-00001" class="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-800 font-mono uppercase tracking-wider focus:ring-2 focus:ring-sky-500 text-sm">
          <button type="submit" class="touch-btn bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            Buscar
          </button>
        </form>
      </div>

      <!-- RESULTADO DE BÚSQUEDA -->
      <div id="track-result" class="hidden"></div>

    </div>
  `;

  document.getElementById('btn-back-home')?.addEventListener('click', () => {
    state.setView('home');
  });

  const form = document.getElementById('form-track');
  const inputCode = document.getElementById('input-track-code');
  const resultDiv = document.getElementById('track-result');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = inputCode.value.trim().toUpperCase();
    if (!code) return;

    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = `
      <div class="text-center py-8 text-slate-400 text-sm">
        <svg class="animate-spin h-6 w-6 mx-auto mb-2 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        Buscando reporte...
      </div>
    `;

    try {
      const rep = await api.trackReport(code);

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

      resultDiv.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <span class="text-xs font-mono font-bold text-slate-400 block">${rep.code}</span>
              <h3 class="text-lg font-black text-slate-900">${rep.report_type.name}</h3>
              <span class="text-xs text-slate-500">${rep.location.name}</span>
            </div>
            <span class="badge-status ${statusClasses[rep.status] || ''}">
              ${rep.status}
            </span>
          </div>

          <div class="mb-4">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Descripción:</span>
            <p class="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">${rep.description}</p>
          </div>

          <!-- LÍNEA DE ESTADO VISUAL -->
          <div class="mb-6 bg-sky-50 border border-sky-100 rounded-xl p-4">
            <span class="text-xs font-bold text-sky-800 uppercase tracking-wider block mb-2">Evolución de la situación:</span>
            <div class="space-y-2 text-xs">
              <div class="flex items-center gap-2 text-slate-700">
                <span class="text-emerald-600 font-bold">✓</span>
                <span>Notificación registrada el ${new Date(rep.created_at).toLocaleDateString()}</span>
              </div>
              <div class="flex items-center gap-2 ${rep.risk_assessment ? 'text-slate-700' : 'text-slate-400'}">
                <span class="${rep.risk_assessment ? 'text-emerald-600 font-bold' : 'text-slate-300'}">✓</span>
                <span>Evaluación de riesgos: ${rep.risk_assessment ? `Nivel ${rep.risk_assessment.risk_level}` : 'En proceso'}</span>
              </div>
              <div class="flex items-center gap-2 ${rep.actions?.length > 0 ? 'text-slate-700' : 'text-slate-400'}">
                <span class="${rep.actions?.length > 0 ? 'text-emerald-600 font-bold' : 'text-slate-300'}">✓</span>
                <span>Acciones asignadas: ${rep.actions?.length || 0} medidas</span>
              </div>
              <div class="flex items-center gap-2 ${rep.status === 'Cerrado' ? 'text-slate-700 font-bold' : 'text-slate-400'}">
                <span class="${rep.status === 'Cerrado' ? 'text-emerald-600 font-bold' : 'text-slate-300'}">✓</span>
                <span>Cierre formal y verificación: ${rep.status === 'Cerrado' ? 'Completado' : 'Pendiente'}</span>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <button id="btn-view-full-detail" class="touch-btn flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all">
              Ver ficha completa
            </button>
          </div>
        </div>
      `;

      document.getElementById('btn-view-full-detail')?.addEventListener('click', () => {
        state.setView('report_detail', { reportId: rep.id });
      });

    } catch (err) {
      resultDiv.innerHTML = `
        <div class="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-center text-sm font-medium">
          No se encontró ningún reporte con el código <strong>${code}</strong>. Verifica el número e intenta nuevamente.
        </div>
      `;
    }
  });
}
