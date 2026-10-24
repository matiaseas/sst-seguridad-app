// Gestor de Estado Global y Notificaciones Toast

class AppState {
  constructor() {
    this.currentUser = JSON.parse(localStorage.getItem('sst_user')) || null;
    this.currentView = 'home';
    this.activeReportId = null;
    this.unreadNotifications = 0;
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this));
  }

  setUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('sst_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sst_user');
    }
    this.notify();
  }

  setView(viewName, params = {}) {
    this.currentView = viewName;
    if (params.reportId !== undefined) {
      this.activeReportId = params.reportId;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.notify();
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  getRole() {
    return this.currentUser?.role?.name || 'public';
  }

  isWorker() {
    return this.getRole() === 'trabajador';
  }

  isSST() {
    return this.getRole() === 'responsable_sst' || this.getRole() === 'administrador';
  }

  isAdmin() {
    return this.getRole() === 'administrador';
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColors = {
      success: 'bg-emerald-700 text-white',
      error: 'bg-red-700 text-white',
      warning: 'bg-amber-600 text-white',
      info: 'bg-slate-800 text-white'
    };
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.className = `toast-msg flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-sm font-medium ${bgColors[type] || bgColors.info}`;
    toast.innerHTML = `
      <span class="font-bold text-base">${icons[type] || '•'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }
}

export const state = new AppState();
