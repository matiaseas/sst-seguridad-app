import { state } from '../state.js';
import { api } from '../api.js';

export async function renderAdmin(container) {
  if (!state.isAdmin()) {
    container.innerHTML = `
      <div class="max-w-md mx-auto py-16 text-center">
        <div class="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200">
          <h3 class="font-bold text-lg mb-1">Acceso Restringido</h3>
          <p class="text-xs">Se requieren privilegios de Administrador para acceder a esta sección.</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      <!-- ENCABEZADO -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-black text-slate-900">ADMINISTRACIÓN DEL SISTEMA</h2>
          <p class="text-xs text-slate-500">Gestión de usuarios, ubicaciones del taller y configuración general</p>
        </div>
      </div>

      <!-- GRILLA DE SECCIONES -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- SECCIÓN 1: GESTIÓN DE USUARIOS -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Usuarios Registrados</h3>
            <button id="btn-toggle-new-user" class="text-xs font-bold text-sky-600 hover:text-sky-800">
              + Agregar Usuario
            </button>
          </div>

          <!-- Formulario colapsable nuevo usuario -->
          <form id="form-new-user" class="hidden p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-bold mb-1">Usuario</label>
                <input type="text" id="user-username" required class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300">
              </div>
              <div>
                <label class="block font-bold mb-1">Rol</label>
                <select id="user-role" required class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white">
                  <option value="1">Trabajador</option>
                  <option value="2">Responsable SST</option>
                  <option value="3">Administrador</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block font-bold mb-1">Nombre Completo</label>
              <input type="text" id="user-fullname" required class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300">
            </div>
            <div>
              <label class="block font-bold mb-1">Correo Electrónico</label>
              <input type="email" id="user-email" required class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300">
            </div>
            <div>
              <label class="block font-bold mb-1">Contraseña</label>
              <input type="password" id="user-password" required class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300">
            </div>
            <div class="flex justify-end gap-2 pt-1">
              <button type="button" id="btn-cancel-user" class="px-3 py-1 text-slate-500 font-bold">Cancelar</button>
              <button type="submit" class="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-1 rounded-lg">Guardar</button>
            </div>
          </form>

          <div id="users-table-container" class="overflow-x-auto max-h-72 overflow-y-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-slate-400 font-bold border-b border-slate-100">
                  <th class="pb-2">Usuario</th>
                  <th class="pb-2">Nombre</th>
                  <th class="pb-2">Rol</th>
                </tr>
              </thead>
              <tbody id="users-tbody" class="divide-y divide-slate-100">
                <tr><td colspan="3" class="text-center py-4 text-slate-400">Cargando usuarios...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SECCIÓN 2: SECTORES Y UBICACIONES -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Sectores del Taller</h3>
            <button id="btn-toggle-new-loc" class="text-xs font-bold text-sky-600 hover:text-sky-800">
              + Agregar Sector
            </button>
          </div>

          <form id="form-new-loc" class="hidden p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
            <div>
              <label class="block font-bold mb-1">Nombre del Sector</label>
              <input type="text" id="loc-name" required placeholder="Ej: Bahía de Pintura" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300">
            </div>
            <div>
              <label class="block font-bold mb-1">Descripción</label>
              <input type="text" id="loc-desc" placeholder="Detalle de actividades del sector" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300">
            </div>
            <div class="flex justify-end gap-2 pt-1">
              <button type="button" id="btn-cancel-loc" class="px-3 py-1 text-slate-500 font-bold">Cancelar</button>
              <button type="submit" class="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-1 rounded-lg">Guardar Sector</button>
            </div>
          </form>

          <div id="locs-list" class="space-y-1.5 max-h-72 overflow-y-auto">
            <div class="text-center py-4 text-slate-400 text-xs">Cargando ubicaciones...</div>
          </div>
        </div>

      </div>

      <!-- SECCIÓN 3: CONTROL DE DATOS DEMO -->
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-base font-bold text-amber-900">Restauración de Datos de Demostración</h3>
            <p class="text-xs text-amber-700 mt-0.5">
              Reinicia la base de datos limpia con los 4 casos ficticios del taller de soldadura industrial para presentaciones académicas.
            </p>
          </div>
          <button id="btn-reset-demo" class="touch-btn bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm whitespace-nowrap">
            Restaurar Base Demo
          </button>
        </div>
      </div>

    </div>
  `;

  // Cargar usuarios
  async function loadUsers() {
    try {
      const users = await api.getUsers();
      const tbody = document.getElementById('users-tbody');
      tbody.innerHTML = users.map(u => `
        <tr class="hover:bg-slate-50">
          <td class="py-2 font-mono font-bold text-slate-700">${u.username}</td>
          <td class="py-2 text-slate-900 font-medium">${u.full_name}</td>
          <td class="py-2"><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100">${u.role.name}</span></td>
        </tr>
      `).join('');
    } catch (_) {}
  }

  // Cargar ubicaciones
  async function loadLocations() {
    try {
      const locs = await api.getLocations();
      const containerLocs = document.getElementById('locs-list');
      containerLocs.innerHTML = locs.map(l => `
        <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
          <span class="font-bold text-slate-800">${l.name}</span>
          <span class="text-slate-400 text-[11px]">${l.description || 'Activo'}</span>
        </div>
      `).join('');
    } catch (_) {}
  }

  loadUsers();
  loadLocations();

  // Toggle forms
  const formUser = document.getElementById('form-new-user');
  document.getElementById('btn-toggle-new-user')?.addEventListener('click', () => formUser.classList.toggle('hidden'));
  document.getElementById('btn-cancel-user')?.addEventListener('click', () => formUser.classList.add('hidden'));

  formUser?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api.createUser({
        username: document.getElementById('user-username').value.trim(),
        full_name: document.getElementById('user-fullname').value.trim(),
        email: document.getElementById('user-email').value.trim(),
        password: document.getElementById('user-password').value,
        role_id: parseInt(document.getElementById('user-role').value)
      });
      state.showToast('Usuario creado con éxito', 'success');
      formUser.reset();
      formUser.classList.add('hidden');
      loadUsers();
    } catch (err) {
      state.showToast(err.message, 'error');
    }
  });

  const formLoc = document.getElementById('form-new-loc');
  document.getElementById('btn-toggle-new-loc')?.addEventListener('click', () => formLoc.classList.toggle('hidden'));
  document.getElementById('btn-cancel-loc')?.addEventListener('click', () => formLoc.classList.add('hidden'));

  formLoc?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('loc-name').value.trim();
    const desc = document.getElementById('loc-desc').value.trim();
    try {
      await api.createLocation(name, desc);
      state.showToast('Sector agregado con éxito', 'success');
      formLoc.reset();
      formLoc.classList.add('hidden');
      loadLocations();
    } catch (err) {
      state.showToast(err.message, 'error');
    }
  });

  // Reset demo
  document.getElementById('btn-reset-demo')?.addEventListener('click', async () => {
    if (confirm('¿Estás seguro de restaurar los datos de demostración? Se reestablecerán los casos iniciales del taller de soldadura.')) {
      try {
        await api.resetDemo();
        state.showToast('Base de datos restablecida al estado de demostración inicial', 'success');
        state.setView('dashboard');
      } catch (err) {
        state.showToast(err.message, 'error');
      }
    }
  });
}
