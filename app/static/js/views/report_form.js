import { state } from '../state.js';
import { api } from '../api.js';

export async function renderReportForm(container) {
  container.innerHTML = `
    <div class="max-w-2xl mx-auto px-4 py-6">
      
      <!-- ENCABEZADO -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <button id="btn-back-home" class="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium mb-1">
            ← Volver al inicio
          </button>
          <h2 class="text-2xl font-black text-slate-900">NUEVO REPORTE DE SEGURIDAD</h2>
          <p class="text-xs text-slate-500">Completa la información en solo 1 a 2 minutos</p>
        </div>
        <span class="text-2xl">📝</span>
      </div>

      <!-- FORMULARIO -->
      <form id="form-new-report" class="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        
        <!-- 1. TIPO DE SITUACIÓN -->
        <div>
          <label class="block text-sm font-bold text-slate-800 mb-2">
            1. ¿Qué tipo de situación observaste? <span class="text-red-500">*</span>
          </label>
          <div id="types-grid" class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div class="col-span-full py-4 text-center text-xs text-slate-400">Cargando tipos de reporte...</div>
          </div>
          <input type="hidden" name="report_type_id" id="input-report-type-id" required>
        </div>

        <!-- 2. UBICACIÓN / SECTOR -->
        <div>
          <label for="select-location" class="block text-sm font-bold text-slate-800 mb-1.5">
            2. ¿En qué lugar o sector ocurrió? <span class="text-red-500">*</span>
          </label>
          <select id="select-location" name="location_id" required class="w-full h-12 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm">
            <option value="" disabled selected>Selecciona el sector del taller...</option>
          </select>
        </div>

        <!-- 3. DESCRIPCIÓN SIMPLE -->
        <div>
          <label for="textarea-description" class="block text-sm font-bold text-slate-800 mb-1.5">
            3. ¿Qué observaste o qué ocurrió? <span class="text-red-500">*</span>
          </label>
          <textarea id="textarea-description" name="description" rows="3" required placeholder="Describe lo que viste con tus propias palabras (ej: cables en el suelo, falta de protección, caída de piezas)..." class="w-full p-3.5 rounded-xl border border-slate-300 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm leading-relaxed"></textarea>
        </div>

        <!-- 4. URGENCIA -->
        <div>
          <label class="block text-sm font-bold text-slate-800 mb-1.5">
            4. Nivel de urgencia estimado
          </label>
          <div class="grid grid-cols-4 gap-2" id="urgency-selector">
            <button type="button" data-urgency="Baja" class="touch-btn border border-slate-200 rounded-xl font-semibold text-xs py-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all">Baja</button>
            <button type="button" data-urgency="Media" class="touch-btn border border-sky-500 bg-sky-50 text-sky-700 font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm">Media</button>
            <button type="button" data-urgency="Alta" class="touch-btn border border-slate-200 rounded-xl font-semibold text-xs py-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all">Alta</button>
            <button type="button" data-urgency="Crítica" class="touch-btn border border-slate-200 rounded-xl font-semibold text-xs py-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all">Crítica</button>
          </div>
          <input type="hidden" name="urgency" id="input-urgency" value="Media">
        </div>

        <!-- 5. PELIGRO INMEDIATO -->
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-sm font-bold text-slate-800 block">¿Existe peligro inmediato para las personas?</span>
              <span class="text-xs text-slate-500">¿Hay riesgo inminente de accidente grave en este momento?</span>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="check-danger" class="sr-only peer">
              <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          <!-- AVISO DE PELIGRO INMEDIATO (OCULTO POR DEFECTO) -->
          <div id="danger-alert-box" class="hidden mt-4 p-3.5 bg-red-100 border-2 border-red-500 text-red-900 rounded-xl text-xs font-semibold flex items-start gap-2.5 animate-pulse">
            <span class="text-xl">⚠️</span>
            <div>
              <strong class="font-black uppercase tracking-wide block mb-0.5">¡AVISO IMPORTANTE DE SEGURIDAD!</strong>
              Si existe un peligro inmediato, comunícalo también directamente al responsable correspondiente. La aplicación no reemplaza la comunicación inmediata ante una situación de emergencia.
            </div>
          </div>
        </div>

        <!-- 6. FOTOGRAFÍAS -->
        <div>
          <label class="block text-sm font-bold text-slate-800 mb-1.5">
            5. Adjuntar fotografías (opcional pero muy recomendado)
          </label>
          
          <div class="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-4 text-center transition-colors bg-slate-50/50">
            <input type="file" id="file-photos" accept="image/*" multiple capture="environment" class="hidden">
            <label for="file-photos" class="cursor-pointer block py-2">
              <div class="w-12 h-12 mx-auto rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mb-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <span class="text-sm font-bold text-sky-700 block">Tomar foto con el teléfono o elegir de la galería</span>
              <span class="text-xs text-slate-400">Formatos JPG, PNG, WEBP (Hasta 5MB por foto)</span>
            </label>
          </div>

          <!-- Previsualización de imágenes seleccionadas -->
          <div id="photos-preview" class="grid grid-cols-3 gap-2 mt-3 empty:hidden"></div>
        </div>

        <!-- 7. REPORTE ANÓNIMO -->
        <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <span class="text-sm font-bold text-slate-800 block">Reportar de forma anónima</span>
            <span class="text-xs text-slate-500">No se registrará tu nombre ni usuario en el reporte</span>
          </div>
          <input type="checkbox" id="check-anonymous" class="w-5 h-5 rounded text-sky-600 focus:ring-sky-500">
        </div>

        <!-- BOTÓN DE ENVÍO -->
        <button type="submit" id="btn-submit-report" class="touch-btn w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black py-4 rounded-xl text-lg shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2">
          <span>ENVIAR REPORTE</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </button>

      </form>

      <!-- PANTALLA MODAL DE CONFIRMACIÓN DE ENVÍO -->
      <dialog id="modal-success" class="p-0 rounded-2xl max-w-md w-full shadow-2xl backdrop:bg-slate-950/70 border border-slate-200">
        <div class="p-8 text-center bg-white">
          <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-3xl">
            ✓
          </div>
          <h3 class="text-2xl font-black text-slate-900 mb-1">¡Reporte Enviado Correctamente!</h3>
          <p class="text-xs text-slate-500 mb-6">Se ha registrado de forma formal en el sistema de seguridad.</p>

          <div class="bg-slate-100 border border-slate-200 rounded-xl p-4 mb-6">
            <span class="text-xs uppercase tracking-wider text-slate-500 block font-semibold mb-1">Número de Reporte Único</span>
            <span id="modal-code-display" class="text-2xl font-black text-sky-700 tracking-wider font-mono">SST-2026-00000</span>
          </div>

          <p class="text-xs text-slate-600 mb-6">
            Guarda este número para consultar el avance y la solución de la situación reportada.
          </p>

          <div class="flex flex-col gap-2">
            <button id="modal-btn-view" class="touch-btn w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl text-sm transition-all">
              Ver detalle del reporte
            </button>
            <button id="modal-btn-new" class="touch-btn w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3 rounded-xl text-sm transition-all">
              Crear otro reporte
            </button>
            <button id="modal-btn-home" class="touch-btn w-full text-slate-500 hover:text-slate-800 text-xs py-2">
              Volver a la pantalla principal
            </button>
          </div>
        </div>
      </dialog>

    </div>
  `;

  // Cargar metadatos dinámicos
  let types = [];
  let locations = [];
  let selectedFiles = [];

  try {
    [types, locations] = await Promise.all([
      api.getReportTypes(),
      api.getLocations()
    ]);

    // Renderizar tipos como tarjetas seleccionables
    const typesGrid = document.getElementById('types-grid');
    typesGrid.innerHTML = types.map((t, idx) => `
      <div data-type-id="${t.id}" class="type-card cursor-pointer p-3 rounded-xl border border-slate-200 bg-slate-50 text-center flex flex-col items-center justify-center gap-1.5 ${idx === 0 ? 'active' : ''}">
        <span class="text-xl">
          ${t.name.includes('Condición') ? '⚠️' : (t.name.includes('Acto') ? '👤' : (t.name.includes('Incidente') ? '⚡' : (t.name.includes('Accidente') ? '🚨' : '👁️')))}
        </span>
        <span class="text-xs font-bold text-slate-800 leading-tight">${t.name}</span>
      </div>
    `).join('');

    // Preseleccionar el primero
    if (types.length > 0) {
      document.getElementById('input-report-type-id').value = types[0].id;
    }

    // Agregar listeners a las tarjetas de tipos
    typesGrid.querySelectorAll('.type-card').forEach(card => {
      card.addEventListener('click', () => {
        typesGrid.querySelectorAll('.type-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        document.getElementById('input-report-type-id').value = card.dataset.typeId;
      });
    });

    // Cargar select de ubicaciones
    const selectLoc = document.getElementById('select-location');
    locations.forEach(loc => {
      const opt = document.createElement('option');
      opt.value = loc.id;
      opt.textContent = loc.name;
      selectLoc.appendChild(opt);
    });

  } catch (err) {
    state.showToast('Error cargando catálogos del taller', 'error');
  }

  // Listener para Urgencia
  const urgencyButtons = document.querySelectorAll('#urgency-selector button');
  urgencyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      urgencyButtons.forEach(b => {
        b.className = 'touch-btn border border-slate-200 rounded-xl font-semibold text-xs py-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all';
      });
      btn.className = 'touch-btn border border-sky-500 bg-sky-50 text-sky-700 font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm';
      document.getElementById('input-urgency').value = btn.dataset.urgency;
    });
  });

  // Switch de Peligro Inmediato
  const checkDanger = document.getElementById('check-danger');
  const dangerAlert = document.getElementById('danger-alert-box');
  checkDanger.addEventListener('change', () => {
    if (checkDanger.checked) {
      dangerAlert.classList.remove('hidden');
    } else {
      dangerAlert.classList.add('hidden');
    }
  });

  // Manejo de fotografías
  const fileInput = document.getElementById('file-photos');
  const previewContainer = document.getElementById('photos-preview');

  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        state.showToast(`La imagen ${file.name} supera 5MB y fue omitida`, 'warning');
        return;
      }
      selectedFiles.push(file);

      const reader = new FileReader();
      reader.onload = (evt) => {
        const div = document.createElement('div');
        div.className = 'relative aspect-video rounded-lg overflow-hidden border border-slate-300 group';
        div.innerHTML = `
          <img src="${evt.target.result}" class="w-full h-full object-cover">
          <button type="button" class="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-700">✕</button>
        `;
        div.querySelector('button').addEventListener('click', () => {
          selectedFiles = selectedFiles.filter(f => f !== file);
          div.remove();
        });
        previewContainer.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  });

  // Enviar Formulario
  const form = document.getElementById('form-new-report');
  const btnSubmit = document.getElementById('btn-submit-report');
  let createdReportId = null;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const reportTypeId = document.getElementById('input-report-type-id').value;
    const locationId = document.getElementById('select-location').value;
    const description = document.getElementById('textarea-description').value.trim();
    const urgency = document.getElementById('input-urgency').value;
    const immediateDanger = document.getElementById('check-danger').checked;
    const isAnonymous = document.getElementById('check-anonymous').checked;

    if (!reportTypeId) {
      state.showToast('Por favor selecciona el tipo de situación', 'warning');
      return;
    }
    if (!locationId) {
      state.showToast('Por favor selecciona el sector o ubicación', 'warning');
      return;
    }
    if (!description) {
      state.showToast('Por favor ingresa una breve descripción', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('report_type_id', reportTypeId);
    formData.append('location_id', locationId);
    formData.append('description', description);
    formData.append('urgency', urgency);
    formData.append('immediate_danger', immediateDanger);
    formData.append('is_anonymous', isAnonymous);

    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      Enviando reporte...
    `;

    try {
      const res = await api.createReport(formData);
      createdReportId = res.id;

      // Mostrar modal de éxito
      const modal = document.getElementById('modal-success');
      document.getElementById('modal-code-display').textContent = res.code;
      modal.showModal();

    } catch (err) {
      state.showToast(err.message || 'Error al enviar reporte', 'error');
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<span>ENVIAR REPORTE</span><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>`;
    }
  });

  // Modal actions
  document.getElementById('modal-btn-view')?.addEventListener('click', () => {
    document.getElementById('modal-success')?.close();
    state.setView('report_detail', { reportId: createdReportId });
  });

  document.getElementById('modal-btn-new')?.addEventListener('click', () => {
    document.getElementById('modal-success')?.close();
    state.setView('new_report');
  });

  document.getElementById('modal-btn-home')?.addEventListener('click', () => {
    document.getElementById('modal-success')?.close();
    state.setView('home');
  });

  document.getElementById('btn-back-home')?.addEventListener('click', () => {
    state.setView('home');
  });
}
