// API Client para la Plataforma de Gestión SST

const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('sst_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('sst_token', token);
    } else {
      localStorage.removeItem('sst_token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('sst_token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = options.headers || {};

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Token expirado o inválido
        this.setToken(null);
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }

      if (!response.ok) {
        let errorMsg = `Error ${response.status}`;
        try {
          const errData = await response.json();
          errorMsg = errData.detail || errData.message || errorMsg;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return response;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  }

  // --- AUTENTICACIÓN ---
  async login(username, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setToken(res.access_token);
    return res;
  }

  async getMe() {
    return await this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem('sst_user');
  }

  // --- METADATOS Y REPORTES ---
  async getReportTypes() {
    return await this.request('/reports/meta/types');
  }

  async getLocations() {
    return await this.request('/reports/meta/locations');
  }

  async createReport(formData) {
    return await this.request('/reports', {
      method: 'POST',
      body: formData
    });
  }

  async listReports(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await this.request(`/reports${qs}`);
  }

  async getReport(id) {
    return await this.request(`/reports/${id}`);
  }

  async trackReport(code) {
    return await this.request(`/reports/track/${encodeURIComponent(code)}`);
  }

  async updateReportStatus(id, payload) {
    return await this.request(`/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  // --- EVALUACIÓN DE RIESGOS ---
  async calculateRisk(probability, consequence) {
    return await this.request('/risks/calculate', {
      method: 'POST',
      body: JSON.stringify({ probability, consequence })
    });
  }

  async assessRisk(reportId, payload) {
    return await this.request(`/risks/assess/${reportId}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // --- ACCIONES Y EVIDENCIAS ---
  async createAction(payload) {
    return await this.request('/actions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async updateAction(id, payload) {
    return await this.request(`/actions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  async uploadActionEvidence(id, formData) {
    return await this.request(`/actions/${id}/evidence`, {
      method: 'POST',
      body: formData
    });
  }

  // --- DASHBOARD ---
  async getDashboardStats(period = 'all') {
    return await this.request(`/dashboard/stats?period=${period}`);
  }

  // --- NOTIFICACIONES ---
  async getNotifications() {
    return await this.request('/notifications');
  }

  async getUnreadCount() {
    return await this.request('/notifications/unread-count');
  }

  async markNotificationRead(id) {
    return await this.request(`/notifications/${id}/read`, { method: 'POST' });
  }

  async markAllNotificationsRead() {
    return await this.request('/notifications/read-all', { method: 'POST' });
  }

  // --- ADMINISTRACIÓN ---
  async getUsers() {
    return await this.request('/admin/users');
  }

  async createUser(payload) {
    return await this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async createLocation(name, description = '') {
    return await this.request(`/admin/locations?name=${encodeURIComponent(name)}&description=${encodeURIComponent(description)}`, {
      method: 'POST'
    });
  }

  async resetDemo() {
    return await this.request('/admin/reset-demo', { method: 'POST' });
  }

  // --- EXPORTACIÓN ---
  getPdfUrl(reportId) {
    return `${API_BASE}/export/pdf/${reportId}`;
  }

  getExcelUrl() {
    return `${API_BASE}/export/excel`;
  }

  getCsvUrl() {
    return `${API_BASE}/export/csv`;
  }
}

export const api = new ApiClient();
