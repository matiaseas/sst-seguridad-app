import { state } from './state.js';
import { api } from './api.js';

import { renderHome } from './views/home.js';
import { renderReportForm } from './views/report_form.js';
import { renderTrack } from './views/track.js';
import { renderMyReports } from './views/my_reports.js';
import { renderReportsList } from './views/reports_list.js';
import { renderReportDetail } from './views/report_detail.js';
import { renderDashboard } from './views/dashboard.js';
import { renderAdmin } from './views/admin.js';

// Router de vistas
function renderCurrentView() {
  const container = document.getElementById('app-main');
  if (!container) return;

  updateNavigation();

  switch (state.currentView) {
    case 'home':
      renderHome(container);
      break;
    case 'new_report':
      renderReportForm(container);
      break;
    case 'track':
      renderTrack(container);
      break;
    case 'my_reports':
      renderMyReports(container);
      break;
    case 'reports_list':
      renderReportsList(container);
      break;
    case 'report_detail':
      renderReportDetail(container);
      break;
    case 'dashboard':
      renderDashboard(container);
      break;
    case 'admin':
      renderAdmin(container);
      break;
    default:
      renderHome(container);
  }
}

// Actualizar barra de navegación superior según rol
function updateNavigation() {
  const navContainer = document.getElementById('nav-links');
  const authContainer = document.getElementById('nav-auth');
  const user = state.currentUser;
  const isLogged = state.isLoggedIn();
  const role = state.getRole();

  if (navContainer) {
    let linksHtml = `
      <button data-view="home" class="nav-item text-xs font-bold px-3 py-2 rounded-lg transition-colors ${state.currentView === 'home' ? 'text-sky-600 bg-sky-50' : 'text-slate-600 hover:text-slate-900'}">
        Inicio
      </button>
      <button data-view="new_report" class="nav-item text-xs font-bold px-3 py-2 rounded-lg transition-colors ${state.currentView === 'new_report' ? 'text-sky-600 bg-sky-50' : 'text-slate-600 hover:text-slate-900'}">
        + Nuevo Reporte
      </button>
      <button data-view="track" class="nav-item text-xs font-bold px-3 py-2 rounded-lg transition-colors ${state.currentView === 'track' ? 'text-sky-600 bg-sky-50' : 'text-slate-600 hover:text-slate-900'}">
        Consultar Código
      </button>
    `;

    if (isLogged) {
      if (role === 'trabajador') {
        linksHtml += `
          <button data-view="my_reports" class="nav-item text-xs font-bold px-3 py-2 rounded-lg transition-colors ${state.currentView === 'my_reports' ? 'text-sky-600 bg-sky-50' : 'text-slate-600 hover:text-slate-900'}">
            Mis Reportes
          </button>
        `;
      } else if (role === 'responsable_sst' || role === 'administrador') {
        linksHtml += `
          <button data-view="dashboard" class="nav-item text-xs font-bold px-3 py-2 rounded-lg transition-colors ${state.currentView === 'dashboard' ? 'text-sky-600 bg-sky-50' : 'text-slate-600 hover:text-slate-900'}">
            Dashboard
          </button>
          <button data-view="reports_list" class="nav-item text-xs font-bold px-3 py-2 rounded-lg transition-colors ${state.currentView === 'reports_list' ? 'text-sky-600 bg-sky-50' : 'text-slate-600 hover:text-slate-900'}">
            Bandeja General
          </button>
        `;
        if (role === 'administrador') {
          linksHtml += `
            <button data-view="admin" class="nav-item text-xs font-bold px-3 py-2 rounded-lg transition-colors ${state.currentView === 'admin' ? 'text-sky-600 bg-sky-50' : 'text-slate-600 hover:text-slate-900'}">
              Administración
            </button>
          `;
        }
      }
    }

    navContainer.innerHTML = linksHtml;

    navContainer.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        state.setView(btn.dataset.view);
      });
    });
  }

  // Zona de usuario y login
  if (authContainer) {
    if (isLogged) {
      authContainer.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="hidden sm:block text-right">
            <span class="text-xs font-bold text-slate-800 block">${user.full_name}</span>
            <span class="text-[10px] text-slate-400 uppercase font-semibold">${user.role.name}</span>
          </div>
          <button id="btn-logout" class="text-xs text-red-600 hover:text-red-800 font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-colors">
            Salir
          </button>
        </div>
      `;
      document.getElementById('btn-logout')?.addEventListener('click', () => {
        api.logout();
        state.setUser(null);
        state.showToast('Sesión cerrada correctamente', 'info');
        state.setView('home');
      });
    } else {
      authContainer.innerHTML = `
        <button id="btn-open-login" class="text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-3.5 py-2 rounded-xl border border-sky-200 transition-colors">
          Iniciar Sesión
        </button>
      `;
      document.getElementById('btn-open-login')?.addEventListener('click', () => {
        document.getElementById('modal-login')?.showModal();
      });
    }
  }
}

// Inicialización global
document.addEventListener('DOMContentLoaded', async () => {
  state.subscribe(renderCurrentView);

  // Verificar si hay token guardado
  if (api.getToken()) {
    try {
      const user = await api.getMe();
      state.setUser(user);
    } catch (_) {
      api.logout();
      state.setUser(null);
    }
  }

  // Setup Modal Login
  const modalLogin = document.getElementById('modal-login');
  const formLogin = document.getElementById('form-login');

  window.addEventListener('auth:open-login', () => modalLogin?.showModal());
  document.getElementById('btn-close-login')?.addEventListener('click', () => modalLogin?.close());

  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value;

    try {
      const res = await api.login(u, p);
      state.setUser(res.user);
      modalLogin.close();
      state.showToast(`Bienvenido, ${res.user.full_name}`, 'success');

      if (state.isWorker()) {
        state.setView('home');
      } else {
        state.setView('dashboard');
      }
    } catch (err) {
      state.showToast(err.message, 'error');
    }
  });

  // Acceso Rápido Demo (1-Click Login)
  document.querySelectorAll('.btn-quick-login').forEach(btn => {
    btn.addEventListener('click', async () => {
      const user = btn.dataset.user;
      const pwd = btn.dataset.pwd;
      try {
        const res = await api.login(user, pwd);
        state.setUser(res.user);
        modalLogin?.close();
        state.showToast(`Conectado como ${res.user.full_name}`, 'success');
        if (state.isWorker()) {
          state.setView('home');
        } else {
          state.setView('dashboard');
        }
      } catch (err) {
        state.showToast(err.message, 'error');
      }
    });
  });

  // Setup Modal QR para Conexión de Celular por Wi-Fi
  const modalQr = document.getElementById('modal-qr');
  const qrLink = document.getElementById('qr-link-url');
  const btnCloseQr = document.getElementById('btn-close-qr');
  const btnOpenQrTop = document.getElementById('btn-open-qr-top');

  async function openQrModal() {
    if (!modalQr) return;
    try {
      const res = await fetch('/api/system/network-info');
      if (res.ok) {
        const data = await res.json();
        if (qrLink) {
          qrLink.href = data.report_url || data.mobile_url;
          qrLink.textContent = data.report_url || data.mobile_url;
        }
      }
    } catch (_) {}
    modalQr.showModal();
  }

  btnOpenQrTop?.addEventListener('click', openQrModal);
  window.addEventListener('qr:open-modal', openQrModal);
  btnCloseQr?.addEventListener('click', () => modalQr?.close());
  modalQr?.addEventListener('click', (e) => {
    if (e.target === modalQr) modalQr.close();
  });
  modalLogin?.addEventListener('click', (e) => {
    if (e.target === modalLogin) modalLogin.close();
  });

  window.addEventListener('app:go-home', () => state.setView('home'));

  // Soporte para apertura directa vía hash en móviles (ej: #new_report)
  function handleHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['home', 'new_report', 'track'].includes(hash)) {
      state.setView(hash);
    }
  }

  window.addEventListener('hashchange', handleHash);

  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && ['home', 'new_report', 'track'].includes(initialHash)) {
    state.setView(initialHash);
  } else {
    // Render inicial
    renderCurrentView();
  }
});
