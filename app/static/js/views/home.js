import { state } from '../state.js';
import { api } from '../api.js';

export function renderHome(container) {
  const isLogged = state.isLoggedIn();
  const role = state.getRole();
  const userName = state.currentUser?.full_name || '';

  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 py-8">
      
      <!-- HERO PRINCIPAL -->
      <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 rounded-2xl text-white p-8 md:p-12 shadow-2xl text-center relative overflow-hidden">
        <div class="absolute inset-0 bg-grid-slate-700/[0.05] bg-[bottom_1px_center]"></div>
        
        <div class="relative z-10">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold tracking-wide uppercase mb-6 border border-amber-500/30">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            Prevención de Riesgos Laborales
          </div>
          
          <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            SEGURIDAD Y SALUD EN EL TRABAJO
          </h1>
          
          <p class="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-8 font-light">
            "Reportar una situación ayuda a prevenir accidentes."
          </p>

          ${isLogged ? `
            <div class="inline-block bg-slate-800/80 border border-slate-700 rounded-xl px-6 py-3 mb-8 text-sm">
              <span class="text-slate-400">Sesión iniciada como:</span>
              <span class="font-bold text-sky-400 ml-1">${userName}</span>
              <span class="ml-2 px-2 py-0.5 rounded text-xs uppercase bg-sky-900/60 text-sky-300 font-semibold border border-sky-700/50">
                ${role === 'trabajador' ? 'Trabajador' : (role === 'responsable_sst' ? 'Responsable SST' : 'Administrador')}
              </span>
            </div>
          ` : ''}

          <!-- BOTONES PRINCIPALES DE ACCIÓN -->
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
            <button id="btn-hero-new-report" class="touch-btn w-full sm:w-auto flex-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold px-8 py-4 rounded-xl text-lg shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              NUEVO REPORTE
            </button>

            <button id="btn-hero-track" class="touch-btn w-full sm:w-auto bg-slate-700/80 hover:bg-slate-700 active:bg-slate-800 text-white font-semibold px-6 py-4 rounded-xl text-base border border-slate-600 transition-all flex items-center justify-center gap-2">
              <svg class="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              CONSULTAR REPORTE
            </button>
            
            ${state.isSST() ? `
              <button id="btn-hero-mgmt" class="touch-btn w-full sm:w-auto bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold px-6 py-4 rounded-xl text-base transition-all flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                PANEL DE GESTIÓN
              </button>
            ` : (!isLogged ? `
              <button id="btn-hero-login" class="touch-btn w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium px-5 py-4 rounded-xl text-sm border border-slate-700 transition-all">
                ACCESO PERSONAL SST
              </button>
            ` : '')}
          </div>

          <!-- ACCESO MÓVIL POR CÓDIGO QR -->
          <div class="mt-8 pt-6 border-t border-slate-700/60 max-w-lg mx-auto flex items-center justify-between gap-4 bg-slate-900/60 rounded-xl p-3.5 border border-slate-800">
            <div class="text-left text-xs">
              <span class="text-amber-400 font-bold block">📱 ¿Estás en el puesto de trabajo?</span>
              <span class="text-slate-300 text-[11px]">Conectá tu celular por Wi-Fi y escaneá para reportar con fotos al instante.</span>
            </div>
            <button id="btn-hero-qr" class="shrink-0 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer">
              Ver QR
            </button>
          </div>
        </div>
      </div>

      <!-- CARACTERÍSTICAS OPERATIVAS -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        
        <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-12 h-12 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-1">Reporte en 1–2 Minutos</h3>
          <p class="text-sm text-slate-600">
            Formulario ágil diseñado para teléfonos móviles. Fotografías directas y lenguaje directo sin términos complejos.
          </p>
        </div>

        <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-1">Identificado o Anónimo</h3>
          <p class="text-sm text-slate-600">
            Libertad total para notificar con tus datos o de forma 100% anónima con código único de seguimiento.
          </p>
        </div>

        <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-12 h-12 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-1">Trazabilidad Total</h3>
          <p class="text-sm text-slate-600">
            Evaluación técnica de riesgos, asignación de acciones preventivas, evidencias fotográficas y cierre formal.
          </p>
        </div>

      </div>

      <!-- BANNER DE ENTORNO DE DEMOSTRACIÓN -->
      <div class="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm text-slate-600">
        <div class="flex items-start gap-3">
          <span class="text-xl">🏭</span>
          <div>
            <h4 class="font-bold text-slate-800">Escenario de demostración: Taller Industrial de Soldadura y Montaje</h4>
            <p class="mt-1">
              La plataforma incluye datos precargados reales de actividades de corte, soldadura, amolado y almacenamiento de acero para demostración académica.
            </p>
          </div>
        </div>
      </div>

    </div>
  `;

  // Event Listeners
  document.getElementById('btn-hero-new-report')?.addEventListener('click', () => {
    state.setView('new_report');
  });

  document.getElementById('btn-hero-track')?.addEventListener('click', () => {
    state.setView('track');
  });

  document.getElementById('btn-hero-mgmt')?.addEventListener('click', () => {
    state.setView('dashboard');
  });

  document.getElementById('btn-hero-login')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('auth:open-login'));
  });

  document.getElementById('btn-hero-qr')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('qr:open-modal'));
  });
}
