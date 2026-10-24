import { state } from '../state.js';
import { api } from '../api.js';

export async function renderReportDetail(container) {
  const reportId = state.activeReportId;
  if (!reportId) {
    state.setView('reports_list');
    return;
  }

  container.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="text-center py-12 text-slate-400">
        <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        Cargando ficha del reporte...
      </div>
    </div>
  `;

  try {
    const report = await api.getReport(reportId);
    renderDetailContent(container, report);
  } catch (err) {
    container.innerHTML = `
      <div class="max-w-xl mx-auto px-4 py-12 text-center">
        <div class="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl mb-4">
          <h3 class="text-lg font-bold mb-1">Error al abrir el reporte</h3>
          <p class="text-xs">${err.message}</p>
        </div>
        <button id="btn-err-back" class="bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs">
          ← Volver a la lista
        </button>
      </div>
    `;
    document.getElementById('btn-err-back')?.addEventListener('click', () => state.setView('reports_list'));
  }
}

function renderDetailContent(container, rep) {
  const isPrivileged = state.isSST();
  const reporterStr = rep.is_anonymous ? 'Anónimo (Confidencial)' : (rep.reporter?.full_name || 'No registrado');

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

  const currentRisk = rep.risk_assessment;
  const initialProb = currentRisk?.probability || 3;
  const initialCons = currentRisk?.consequence || 3;

  container.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      <!-- BARRA DE NAVEGACIÓN Y ACCIONES SUPERIORES -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center gap-3">
          <button id="btn-back" class="text-slate-500 hover:text-slate-900 font-bold text-sm flex items-center gap-1">
            ← Volver
          </button>
          <div class="h-4 w-px bg-slate-200"></div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono text-base font-black text-sky-700">${rep.code}</span>
              <span class="badge-status ${statusClasses[rep.status] || ''}">${rep.status}</span>
              ${rep.immediate_danger ? '<span class="bg-red-600 text-white font-bold text-xs px-2 py-0.5 rounded-full animate-pulse">⚠️ Peligro Inmediato</span>' : ''}
            </div>
            <span class="text-xs text-slate-400">Registrado el ${new Date(rep.created_at).toLocaleString()}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <!-- Botón PDF Formal -->
          <a href="${api.getPdfUrl(rep.id)}" target="_blank" class="touch-btn bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all">
            <svg class="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>
            Descargar Informe PDF
          </a>

          ${isPrivileged ? `
            <!-- Cambio de Estado Rápido -->
            <select id="select-change-status" class="touch-btn text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800">
              <option value="" disabled selected>Cambiar Estado...</option>
              <option value="En revisión">En revisión</option>
              <option value="En análisis">En análisis</option>
              <option value="Acción asignada">Acción asignada</option>
              <option value="En proceso">En proceso</option>
              <option value="Pendiente de verificación">Pendiente de verificación</option>
              <option value="Cerrado">Cerrar Reporte...</option>
              <option value="Descartado">Descartar Reporte...</option>
            </select>
          ` : ''}
        </div>
      </div>

      <!-- GRILLA PRINCIPAL DE 2 COLUMNAS -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- COLUMNA IZQUIERDA (2 COLS): DETALLES, FOTOS, ACCIONES -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- 1. INFORMACIÓN GENERAL -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Información de la Situación</h3>
            
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <span class="text-xs text-slate-400 block font-medium">Tipo:</span>
                <span class="text-sm font-bold text-slate-900">${rep.report_type.name}</span>
              </div>
              <div>
                <span class="text-xs text-slate-400 block font-medium">Sector:</span>
                <span class="text-sm font-bold text-slate-900">${rep.location.name}</span>
              </div>
              <div>
                <span class="text-xs text-slate-400 block font-medium">Urgencia:</span>
                <span class="text-sm font-bold text-slate-900">${rep.urgency}</span>
              </div>
              <div>
                <span class="text-xs text-slate-400 block font-medium">Reportado por:</span>
                <span class="text-sm font-bold text-slate-900">${reporterStr}</span>
              </div>
            </div>

            <div class="border-t border-slate-100 pt-3">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Descripción del hecho:</span>
              <p class="text-sm text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed font-normal">
                ${rep.description}
              </p>
            </div>

            ${rep.close_reason ? `
              <div class="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <strong class="font-bold text-emerald-900 block mb-0.5">Dictamen de Cierre:</strong>
                <span class="text-emerald-800">${rep.close_reason}</span>
              </div>
            ` : ''}
          </div>

          <!-- 2. REGISTRO FOTOGRÁFICO -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider">Fotografías Iniciales</h3>
              <span class="text-xs text-slate-400">${rep.attachments.filter(a => !a.is_evidence).length} foto(s)</span>
            </div>

            ${rep.attachments.filter(a => !a.is_evidence).length > 0 ? `
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                ${rep.attachments.filter(a => !a.is_evidence).map(att => `
                  <div class="relative group aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer photo-thumb" data-src="${att.file_path}">
                    <img src="${att.file_path}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="Evidencia">
                    <div class="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                      Ampliar 🔍
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <p class="text-xs text-slate-400 italic py-2">No se adjuntaron fotografías al emitir el reporte.</p>
            `}
          </div>

          <!-- 3. PLAN DE ACCIONES Y JERARQUÍA DE CONTROLES -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider">Plan de Acciones y Controles</h3>
                <p class="text-xs text-slate-500">Medidas correctivas y preventivas con responsables y fechas límite</p>
              </div>

              ${isPrivileged ? `
                <button id="btn-add-action" class="touch-btn bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-sm">
                  + Asignar Acción
                </button>
              ` : ''}
            </div>

            <!-- Listado de acciones -->
            <div id="actions-list" class="space-y-3">
              ${rep.actions.length > 0 ? rep.actions.map((act, i) => `
                <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">${i+1}</span>
                      <span class="text-xs font-bold text-slate-900">${act.action_type}</span>
                      <span class="text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                        ${act.control_hierarchy}
                      </span>
                    </div>
                    <span class="text-xs font-bold px-2.5 py-0.5 rounded-full ${act.status === 'Verificada' || act.status === 'Completada' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                      ${act.status}
                    </span>
                  </div>

                  <p class="text-xs text-slate-700 font-medium">${act.description}</p>

                  <div class="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span>Responsable: <strong>${act.assigned_to?.full_name || 'Sin asignar'}</strong></span>
                    <span>Vencimiento: <strong>${act.due_date ? new Date(act.due_date).toLocaleDateString() : 'Sin fecha'}</strong></span>
                  </div>

                  <!-- Evidencias adjuntas a la acción -->
                  ${act.evidences?.length > 0 ? `
                    <div class="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                      <span class="font-bold text-emerald-900 block">✓ Evidencia de cumplimiento:</span>
                      ${act.evidences.map(ev => `
                        <div class="flex items-center justify-between">
                          <span class="text-emerald-800">${ev.notes || 'Evidencia fotográfica adjunta'}</span>
                          ${ev.file_path ? `<a href="${ev.file_path}" target="_blank" class="text-sky-700 font-bold underline ml-2">Ver Foto</a>` : ''}
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}

                  <!-- Botones operativos de la acción -->
                  <div class="flex items-center justify-end gap-2 pt-2">
                    ${act.status !== 'Verificada' ? `
                      <button data-action-id="${act.id}" class="btn-action-evidence text-xs font-bold text-sky-700 bg-white hover:bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-lg transition-colors">
                        📷 Subir Evidencia
                      </button>
                    ` : ''}

                    ${isPrivileged && act.status === 'Completada' ? `
                      <button data-action-id="${act.id}" class="btn-action-verify text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg transition-colors">
                        ✓ Verificar Eficacia
                      </button>
                    ` : ''}
                  </div>
                </div>
              `).join('') : `
                <p class="text-xs text-slate-400 italic py-3 text-center">No se han definido acciones para este reporte.</p>
              `}
            </div>
          </div>

          <!-- 4. HISTORIAL Y TRAZABILIDAD (AUDIT LOG) -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Historial de Trazabilidad (Auditoría)</h3>
            
            <div class="relative pl-6 space-y-4">
              ${rep.audit_logs.map(log => `
                <div class="timeline-item relative">
                  <span class="absolute -left-6 top-1 w-3 h-3 rounded-full bg-sky-500 ring-4 ring-white"></span>
                  <div class="text-xs">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-900">${log.action_type}</span>
                      <span class="text-slate-400">• ${new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <p class="text-slate-600 mt-0.5">${log.details}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- COLUMNA DERECHA (1 COL): EVALUACIÓN DE RIESGOS 5x5 -->
        <div class="space-y-6">
          
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Evaluación de Riesgo</h3>
              <span class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">P x C</span>
            </div>
            <p class="text-xs text-slate-500 mb-4">
              Metodología paramétrica matricial $5 \\times 5$ para determinación del nivel de criticidad.
            </p>

            <!-- SELECTORES DE PROBABILIDAD Y CONSECUENCIA -->
            <div class="space-y-4 mb-4">
              
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs font-bold text-slate-700">Probabilidad (P):</label>
                  <span id="prob-label" class="text-xs font-bold text-sky-700">${initialProb} / 5</span>
                </div>
                <input type="range" id="range-prob" min="1" max="5" value="${initialProb}" ${!isPrivileged ? 'disabled' : ''} class="w-full accent-sky-600 cursor-pointer">
                <div class="flex justify-between text-[10px] text-slate-400 px-1 mt-0.5 font-medium">
                  <span>1-Muy baja</span>
                  <span>2-Baja</span>
                  <span>3-Media</span>
                  <span>4-Alta</span>
                  <span>5-Muy alta</span>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs font-bold text-slate-700">Consecuencia (C):</label>
                  <span id="cons-label" class="text-xs font-bold text-sky-700">${initialCons} / 5</span>
                </div>
                <input type="range" id="range-cons" min="1" max="5" value="${initialCons}" ${!isPrivileged ? 'disabled' : ''} class="w-full accent-sky-600 cursor-pointer">
                <div class="flex justify-between text-[10px] text-slate-400 px-1 mt-0.5 font-medium">
                  <span>1-Leve</span>
                  <span>2-Moderada</span>
                  <span>3-Importante</span>
                  <span>4-Grave</span>
                  <span>5-Muy grave</span>
                </div>
              </div>

            </div>

            <!-- RESULTADO DEL CÁLCULO EN VIVO -->
            <div id="risk-result-card" class="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center mb-4 transition-all">
              <span class="text-xs uppercase tracking-wider text-slate-400 block font-semibold mb-0.5">Puntaje de Riesgo (R = P x C)</span>
              <div class="text-3xl font-black mb-1" id="risk-score-display">-</div>
              <div id="risk-level-badge" class="inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase mb-2">-</div>
              <p id="risk-priority-text" class="text-[11px] text-slate-600 font-medium leading-tight">-</p>
            </div>

            <!-- OBSERVACIONES TÉCNICAS -->
            ${isPrivileged ? `
              <div class="mb-4">
                <label class="block text-xs font-bold text-slate-700 mb-1">Observaciones técnicas del especialista:</label>
                <textarea id="risk-observations" rows="2" class="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800" placeholder="Justificación técnica de la evaluación...">${currentRisk?.observations || ''}</textarea>
              </div>

              <button id="btn-save-risk" class="touch-btn w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm">
                Guardar Evaluación Técnica
              </button>
            ` : `
              <p class="text-[11px] text-slate-400 italic text-center">La evaluación de riesgos solo puede ser editada por el Responsable de Seguridad.</p>
            `}

          </div>

        </div>

      </div>

      <!-- MODAL PARA AGREGAR ACCIÓN -->
      <dialog id="modal-new-action" class="p-0 rounded-2xl max-w-lg w-full shadow-2xl backdrop:bg-slate-950/70 border border-slate-200">
        <form id="form-new-action" class="p-6 space-y-4 bg-white">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-lg font-bold text-slate-900">Asignar Acción Correctiva / Preventiva</h3>
            <button type="button" id="btn-close-modal-action" class="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Descripción de la medida a implementar <span class="text-red-500">*</span></label>
            <textarea id="action-desc" required rows="2" class="w-full p-3 rounded-xl border border-slate-300 text-xs" placeholder="Detalla la acción preventiva o correctiva..."></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Tipo de Acción</label>
              <select id="action-type-select" class="w-full h-10 px-2.5 rounded-xl border border-slate-300 text-xs bg-white">
                <option value="Acción correctiva">Acción correctiva</option>
                <option value="Acción preventiva">Acción preventiva</option>
                <option value="Mejora">Mejora</option>
                <option value="Control inmediato">Control inmediato</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Jerarquía de Controles</label>
              <select id="action-hierarchy-select" class="w-full h-10 px-2.5 rounded-xl border border-slate-300 text-xs bg-white">
                <option value="Control de ingeniería">Control de ingeniería</option>
                <option value="Control administrativo">Control administrativo</option>
                <option value="Equipo de protección personal">Equipo de protección personal (EPP)</option>
                <option value="Sustitución">Sustitución</option>
                <option value="Eliminación">Eliminación</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Responsable de Ejecución</label>
              <select id="action-assignee-select" class="w-full h-10 px-2.5 rounded-xl border border-slate-300 text-xs bg-white">
                <option value="">Cargando usuarios...</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Fecha Límite</label>
              <input type="date" id="action-due-date" class="w-full h-10 px-2.5 rounded-xl border border-slate-300 text-xs bg-white">
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" id="btn-cancel-action" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" class="bg-sky-600 hover:bg-sky-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm">Crear Acción</button>
          </div>
        </form>
      </dialog>

      <!-- MODAL PARA SUBIR EVIDENCIA DE ACCIÓN -->
      <dialog id="modal-action-evidence" class="p-0 rounded-2xl max-w-md w-full shadow-2xl backdrop:bg-slate-950/70 border border-slate-200">
        <form id="form-action-evidence" class="p-6 space-y-4 bg-white">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-base font-bold text-slate-900">Cargar Evidencia de Cumplimiento</h3>
            <button type="button" id="btn-close-modal-ev" class="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
          </div>
          <input type="hidden" id="evidence-action-id">

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Fotografía de la medida implementada <span class="text-red-500">*</span></label>
            <input type="file" id="evidence-file" accept="image/*" required capture="environment" class="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Notas / Observaciones de resolución</label>
            <textarea id="evidence-notes" rows="2" class="w-full p-2.5 rounded-xl border border-slate-300 text-xs" placeholder="Explica cómo se implementó la solución..."></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" id="btn-cancel-ev" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm">Registrar Cumplimiento</button>
          </div>
        </form>
      </dialog>

      <!-- MODAL PARA ZOOM DE FOTOGRAFÍA -->
      <dialog id="modal-photo-zoom" class="p-0 rounded-2xl max-w-3xl w-full shadow-2xl backdrop:bg-slate-950/80 border border-slate-200 overflow-hidden">
        <div class="relative bg-slate-950 p-2 text-center">
          <button id="btn-close-zoom" class="absolute top-4 right-4 bg-slate-800 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold z-10 hover:bg-slate-700">✕</button>
          <img id="zoom-img" src="" class="max-h-[80vh] mx-auto rounded-lg object-contain">
        </div>
      </dialog>

      <!-- MODAL DE CIERRE CON JUSTIFICACIÓN -->
      <dialog id="modal-close-report" class="p-0 rounded-2xl max-w-md w-full shadow-2xl backdrop:bg-slate-950/70 border border-slate-200">
        <form id="form-close-report" class="p-6 space-y-4 bg-white">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-base font-bold text-slate-900" id="close-modal-title">Cierre Formal del Reporte</h3>
            <button type="button" id="btn-close-modal-close" class="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
          </div>
          <input type="hidden" id="target-close-status" value="Cerrado">

          <p class="text-xs text-slate-600" id="close-modal-desc">
            Indica el dictamen final o motivo de cierre para dejar constancia en la bitácora técnica de seguridad.
          </p>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Motivo o Dictamen Final <span class="text-red-500">*</span></label>
            <textarea id="close-reason-text" required rows="3" class="w-full p-2.5 rounded-xl border border-slate-300 text-xs" placeholder="Ej: Se comprobó la correcta instalación y capacitación del personal..."></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" id="btn-cancel-close-modal" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm">Confirmar</button>
          </div>
        </form>
      </dialog>

    </div>
  `;

  // Listeners de navegación
  document.getElementById('btn-back')?.addEventListener('click', () => {
    if (state.isWorker()) {
      state.setView('my_reports');
    } else {
      state.setView('reports_list');
    }
  });

  // Modal zoom
  const modalZoom = document.getElementById('modal-photo-zoom');
  const zoomImg = document.getElementById('zoom-img');
  document.querySelectorAll('.photo-thumb').forEach(el => {
    el.addEventListener('click', () => {
      zoomImg.src = el.dataset.src;
      modalZoom.showModal();
    });
  });
  document.getElementById('btn-close-zoom')?.addEventListener('click', () => modalZoom.close());
  modalZoom.addEventListener('click', (e) => {
    if (e.target === modalZoom) modalZoom.close();
  });

  // Cálculo en vivo de la Matriz de Riesgo
  const rangeProb = document.getElementById('range-prob');
  const rangeCons = document.getElementById('range-cons');
  const probLabel = document.getElementById('prob-label');
  const consLabel = document.getElementById('cons-label');
  const scoreDisplay = document.getElementById('risk-score-display');
  const levelBadge = document.getElementById('risk-level-badge');
  const priorityText = document.getElementById('risk-priority-text');
  const resultCard = document.getElementById('risk-result-card');

  async function updateRiskCalculation() {
    const p = parseInt(rangeProb.value);
    const c = parseInt(rangeCons.value);
    probLabel.textContent = `${p} / 5`;
    consLabel.textContent = `${c} / 5`;

    try {
      const calc = await api.calculateRisk(p, c);
      scoreDisplay.textContent = calc.risk_score;
      scoreDisplay.style.color = calc.color_hex;
      levelBadge.textContent = calc.risk_level;
      levelBadge.style.backgroundColor = calc.color_hex;
      levelBadge.style.color = calc.risk_level === 'Moderado' ? '#000000' : '#ffffff';
      priorityText.textContent = calc.action_priority;
    } catch (_) {}
  }

  rangeProb?.addEventListener('input', updateRiskCalculation);
  rangeCons?.addEventListener('input', updateRiskCalculation);
  updateRiskCalculation();

  // Guardar Evaluación Técnica de Riesgo
  document.getElementById('btn-save-risk')?.addEventListener('click', async () => {
    const p = parseInt(rangeProb.value);
    const c = parseInt(rangeCons.value);
    const obs = document.getElementById('risk-observations').value.trim();

    try {
      await api.assessRisk(rep.id, {
        probability: p,
        consequence: c,
        observations: obs
      });
      state.showToast('Evaluación técnica registrada con éxito', 'success');
      state.setView('report_detail', { reportId: rep.id });
    } catch (err) {
      state.showToast(err.message, 'error');
    }
  });

  // Manejo de Estados con Reglas de Negocio
  const statusSelect = document.getElementById('select-change-status');
  statusSelect?.addEventListener('change', async () => {
    const targetStatus = statusSelect.value;
    if (!targetStatus) return;

    if (targetStatus === 'Cerrado' || targetStatus === 'Descartado') {
      const modalClose = document.getElementById('modal-close-report');
      document.getElementById('target-close-status').value = targetStatus;
      document.getElementById('close-modal-title').textContent = targetStatus === 'Cerrado' ? 'Cierre Formal del Reporte' : 'Descartar Reporte';
      modalClose.showModal();
      statusSelect.value = '';
    } else {
      try {
        await api.updateReportStatus(rep.id, { status: targetStatus });
        state.showToast(`Estado actualizado a: ${targetStatus}`, 'success');
        state.setView('report_detail', { reportId: rep.id });
      } catch (err) {
        state.showToast(err.message, 'error');
        statusSelect.value = '';
      }
    }
  });

  // Formulario de Cierre / Descarte
  const formClose = document.getElementById('form-close-report');
  formClose?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetStatus = document.getElementById('target-close-status').value;
    const reason = document.getElementById('close-reason-text').value.trim();

    try {
      await api.updateReportStatus(rep.id, {
        status: targetStatus,
        close_reason: reason
      });
      document.getElementById('modal-close-report').close();
      state.showToast(`Reporte ${targetStatus.toLowerCase()} formalmente`, 'success');
      state.setView('report_detail', { reportId: rep.id });
    } catch (err) {
      state.showToast(err.message, 'error');
    }
  });
  document.getElementById('btn-close-modal-close')?.addEventListener('click', () => document.getElementById('modal-close-report').close());
  document.getElementById('btn-cancel-close-modal')?.addEventListener('click', () => document.getElementById('modal-close-report').close());

  // Modal Nueva Acción
  const modalAction = document.getElementById('modal-new-action');
  document.getElementById('btn-add-action')?.addEventListener('click', async () => {
    // Cargar usuarios en el select
    const selectAssignee = document.getElementById('action-assignee-select');
    try {
      const users = await api.getUsers();
      selectAssignee.innerHTML = '<option value="">Sin asignar (a definir)</option>' +
        users.map(u => `<option value="${u.id}">${u.full_name} (${u.role.name})</option>`).join('');
    } catch (_) {
      selectAssignee.innerHTML = '<option value="">No disponible</option>';
    }
    modalAction.showModal();
  });
  document.getElementById('btn-close-modal-action')?.addEventListener('click', () => modalAction.close());
  document.getElementById('btn-cancel-action')?.addEventListener('click', () => modalAction.close());

  document.getElementById('form-new-action')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const desc = document.getElementById('action-desc').value.trim();
    const aType = document.getElementById('action-type-select').value;
    const hierarchy = document.getElementById('action-hierarchy-select').value;
    const assigneeVal = document.getElementById('action-assignee-select').value;
    const dueDateVal = document.getElementById('action-due-date').value;

    try {
      await api.createAction({
        report_id: rep.id,
        description: desc,
        action_type: aType,
        control_hierarchy: hierarchy,
        assigned_to_id: assigneeVal ? parseInt(assigneeVal) : null,
        due_date: dueDateVal ? new Date(dueDateVal).toISOString() : null
      });
      modalAction.close();
      state.showToast('Acción asignada correctamente', 'success');
      state.setView('report_detail', { reportId: rep.id });
    } catch (err) {
      state.showToast(err.message, 'error');
    }
  });

  // Modal Cargar Evidencia
  const modalEv = document.getElementById('modal-action-evidence');
  document.querySelectorAll('.btn-action-evidence').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('evidence-action-id').value = btn.dataset.actionId;
      modalEv.showModal();
    });
  });
  document.getElementById('btn-close-modal-ev')?.addEventListener('click', () => modalEv.close());
  document.getElementById('btn-cancel-ev')?.addEventListener('click', () => modalEv.close());

  document.getElementById('form-action-evidence')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const actionId = document.getElementById('evidence-action-id').value;
    const file = document.getElementById('evidence-file').files[0];
    const notes = document.getElementById('evidence-notes').value.trim();

    if (!file) {
      state.showToast('Selecciona una fotografía de evidencia', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('notes', notes);

    try {
      await api.uploadActionEvidence(actionId, formData);
      modalEv.close();
      state.showToast('Evidencia registrada y acción completada', 'success');
      state.setView('report_detail', { reportId: rep.id });
    } catch (err) {
      state.showToast(err.message, 'error');
    }
  });

  // Verificar Eficacia de Acción
  document.querySelectorAll('.btn-action-verify').forEach(btn => {
    btn.addEventListener('click', async () => {
      const actionId = btn.dataset.actionId;
      try {
        await api.updateAction(actionId, { status: 'Verificada' });
        state.showToast('Acción verificada formalmente', 'success');
        state.setView('report_detail', { reportId: rep.id });
      } catch (err) {
        state.showToast(err.message, 'error');
      }
    });
  });
}
