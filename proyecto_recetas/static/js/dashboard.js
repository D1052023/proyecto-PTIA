const TIPS = [
  { emoji: '🍅', name: 'Pasta al pomodoro',  tags: ['Tomate', 'Ajo', 'Albahaca'], time: '20 min', kcal: '320 kcal', badge: 'ITALIANA',    match: 2 },
  { emoji: '🥚', name: 'Tortilla española',  tags: ['Huevo', 'Papa', 'Cebolla'],  time: '25 min', kcal: '350 kcal', badge: 'SALUDABLE',   match: 3 },
  { emoji: '🍗', name: 'Pollo al limón',     tags: ['Pollo', 'Limón', 'Ajo'],     time: '35 min', kcal: '410 kcal', badge: 'TRADICIONAL', match: 2 },
  { emoji: '🥑', name: 'Bowl de aguacate',   tags: ['Aguacate', 'Arroz', 'Limón'],time: '15 min', kcal: '280 kcal', badge: 'VEGANO',       match: 1 },
];

const BADGE_COLORS = {
  SALUDABLE:   '#4caf50',
  TRADICIONAL: '#ff9800',
  VEGANO:      '#8bc34a',
  ITALIANA:    '#e91e63',
  RAPIDA:      '#2196f3',
};

// ── Estado global ─────────────────────────────────────────
const ingrs = [];
let inp, chips, list, ctr, btn, toast, tipsGrid;

// ── Estado del modal ──────────────────────────────────────
let currentFile         = null;
let detectedIngredients = [];
let selectedDetected    = new Set();
let activeTab           = 'ingredients';

const TAB_TEXTS = {
  ingredients: {
    desc: 'Sube una foto de tu nevera o ingredientes sueltos para detectarlos automáticamente',
    btn:  'Detectar ingredientes',
  },
  dish: {
    desc: 'Sube una foto de un platillo preparado y extraeremos sus ingredientes automáticamente',
    btn:  'Detectar platillo',
  }
};

// ── DOMContentLoaded ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  inp      = document.getElementById('ing-input');
  chips    = document.getElementById('chips');
  list     = document.getElementById('list');
  ctr      = document.getElementById('counter');
  btn      = document.getElementById('btn-recipes');
  toast    = document.getElementById('toast');
  tipsGrid = document.getElementById('tips-grid');

  TIPS.forEach(t => {
    const color    = BADGE_COLORS[t.badge] || '#4caf50';
    const tagsHTML = t.tags
      .map(tag => `<span class="tip-tag">${tag.toLowerCase()}</span>`)
      .join('');

    const card = document.createElement('div');
    card.className = 'tip-card';
    card.innerHTML = `
      <div class="tip-image">
        <span class="tip-emoji">${t.emoji}</span>
        <span class="tip-badge" style="background:${color}">${t.badge}</span>
      </div>
      <div class="tip-body">
        <p class="tip-name">${t.name}</p>
        <div class="tip-meta">
          <span class="tip-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            ${t.time}
          </span>
          <span class="tip-meta-item">🔥 ${t.kcal}</span>
        </div>
        <div class="tip-tags">${tagsHTML}</div>
      </div>`;

    card.addEventListener('click', () => addTip(t.tags));
    tipsGrid.appendChild(card);
  });

  inp.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });

  document.querySelector('.btn-cam').addEventListener('click', openCamModal);

  document.getElementById('cam-modal').addEventListener('click', function(e) {
    if (e.target === this) closeCamModal();
  });

  // ── Botón "Ver recetas" → pasa ingredientes por URL ──
  btn.addEventListener('click', () => {
    if (!ingrs.length) return;
    const query = encodeURIComponent(ingrs.join(','));
    window.location.href = `/recipe?ings=${query}`;
  });
});

// ════════════════════════════════════════════════════════════
// LÓGICA DE INGREDIENTES (dashboard)
// ════════════════════════════════════════════════════════════

function addTip(tags) {
  tags.forEach(tag => {
    if (!ingrs.includes(tag.toLowerCase())) {
      ingrs.push(tag.toLowerCase());
      addChip(tag);
      addItem(tag);
    }
  });
  sync();
  showToast('✓ Ingredientes de la receta agregados');
}

function add() {
  const val = inp.value.trim();
  if (!val) return;
  const items = val.split(',').map(s => s.trim()).filter(Boolean);
  const added = [];
  items.forEach(name => {
    if (!ingrs.includes(name.toLowerCase())) {
      ingrs.push(name.toLowerCase());
      addChip(name);
      addItem(name);
      added.push(name);
    }
  });
  inp.value = '';
  sync();
  if (added.length) showToast('✓ ' + added.join(', ') + ' agregado');
}

function addChip(name) {
  const d = document.createElement('div');
  d.className = 'chip';
  d.dataset.k = name.toLowerCase();
  d.innerHTML = `${name} <button onclick="del('${name.toLowerCase()}')">×</button>`;
  chips.appendChild(d);
}

function addItem(name) {
  const e = document.getElementById('empty');
  if (e) e.remove();
  const d = document.createElement('div');
  d.className = 'item';
  d.dataset.k = name.toLowerCase();
  d.innerHTML = `<span>${name}</span><button onclick="del('${name.toLowerCase()}')">×</button>`;
  list.appendChild(d);
}

function del(k) {
  ingrs.splice(ingrs.indexOf(k), 1);
  document.querySelectorAll(`[data-k="${k}"]`).forEach(el => el.remove());
  if (!ingrs.length) {
    list.innerHTML = `
      <div id="empty">
        <div class="empty-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 21h6"/>
          </svg>
        </div>
        <span>Aún no hay ingredientes.<br>¡Empieza agregando uno!</span>
      </div>`;
  }
  sync();
}

function sync() {
  const n = ingrs.length;
  ctr.textContent = n + (n === 1 ? ' agregado' : ' agregados');
  btn.disabled = !n;
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

// ════════════════════════════════════════════════════════════
// MODAL — TABS
// ════════════════════════════════════════════════════════════

function switchTab(tab) {
  activeTab = tab;
  document.getElementById('tab-ingredients').classList.toggle('active', tab === 'ingredients');
  document.getElementById('tab-dish').classList.toggle('active', tab === 'dish');
  document.getElementById('tab-desc').textContent         = TAB_TEXTS[tab].desc;
  document.getElementById('btn-detect-label').textContent = TAB_TEXTS[tab].btn;
  document.getElementById('detection-result').style.display = 'none';
  document.getElementById('detection-error').style.display  = 'none';
  document.getElementById('dish-result').style.display      = 'none';
  document.getElementById('detected-chips').innerHTML       = '';
  const old = document.getElementById('btn-add-detected');
  if (old) old.remove();
}

// ════════════════════════════════════════════════════════════
// MODAL — ABRIR / CERRAR / RESET
// ════════════════════════════════════════════════════════════

function openCamModal() {
  resetCamModal();
  document.getElementById('cam-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeCamModal() {
  document.getElementById('cam-modal').style.display = 'none';
  document.body.style.overflow = '';
}

function resetCamModal() {
  currentFile         = null;
  detectedIngredients = [];
  selectedDetected.clear();
  activeTab           = 'ingredients';

  document.getElementById('tab-ingredients').classList.add('active');
  document.getElementById('tab-dish').classList.remove('active');
  document.getElementById('tab-desc').textContent         = TAB_TEXTS.ingredients.desc;
  document.getElementById('btn-detect-label').textContent = TAB_TEXTS.ingredients.btn;

  showDzState('idle');
  document.getElementById('detection-result').style.display = 'none';
  document.getElementById('detection-error').style.display  = 'none';
  document.getElementById('dish-result').style.display      = 'none';
  document.getElementById('detected-chips').innerHTML       = '';
  document.getElementById('file-input').value               = '';

  const old = document.getElementById('btn-add-detected');
  if (old) old.remove();

  document.getElementById('btn-detect').disabled = true;
  setDetectBtnLoading(false);
}

// ════════════════════════════════════════════════════════════
// MODAL — DROPZONE
// ════════════════════════════════════════════════════════════

function dragOver(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.add('drag-over');
}
function dragLeave(e) {
  document.getElementById('dropzone').classList.remove('drag-over');
}
function dropFile(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) loadFile(file);
}
function fileSelected(e) {
  const file = e.target.files[0];
  if (file) loadFile(file);
}
function changeImage(e) {
  e.stopPropagation();
  document.getElementById('file-input').click();
}
function loadFile(file) {
  currentFile = file;
  document.getElementById('detection-result').style.display = 'none';
  document.getElementById('detection-error').style.display  = 'none';
  document.getElementById('dish-result').style.display      = 'none';
  const reader = new FileReader();
  reader.onload = (ev) => {
    document.getElementById('preview-img').src = ev.target.result;
    showDzState('preview');
    document.getElementById('btn-detect').disabled = false;
  };
  reader.readAsDataURL(file);
}
function showDzState(state) {
  document.getElementById('dz-idle').style.display    = state === 'idle'    ? 'flex' : 'none';
  document.getElementById('dz-preview').style.display = state === 'preview' ? 'flex' : 'none';
}
function setDetectBtnLoading(loading) {
  const btnDetect = document.getElementById('btn-detect');
  const label     = document.getElementById('btn-detect-label');
  const spinner   = document.getElementById('btn-detect-spinner');
  btnDetect.disabled    = loading;
  label.style.display   = loading ? 'none'         : 'inline';
  spinner.style.display = loading ? 'inline-block' : 'none';
}

// ════════════════════════════════════════════════════════════
// DETECCIÓN
// ════════════════════════════════════════════════════════════

function detectAuto() {
  if (activeTab === 'ingredients') detectIngredients();
  else detectDish();
}

async function detectIngredients() {
  if (!currentFile) return;

  document.getElementById('detection-result').style.display = 'none';
  document.getElementById('detection-error').style.display  = 'none';

  setDetectBtnLoading(true);

  try {
    const formData = new FormData();
    formData.append('file', currentFile);

    const response = await fetch('/detect-ingredient', { method: 'POST', body: formData });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Error del servidor: ${response.status}`);
    }

    const data = await response.json();
    const ingrediente = data.ingrediente || '';

    if (!ingrediente) {
      showDetectionError('No se pudo identificar ningún ingrediente en la imagen.');
      return;
    }

    detectedIngredients = [ingrediente];
    renderDetectedChips(detectedIngredients);
    document.getElementById('detection-result').style.display = 'block';

  } catch (err) {
    showDetectionError(err.message || 'No se pudo analizar la imagen.');
  } finally {
    setDetectBtnLoading(false);
  }
}
async function detectDish() {
  if (!currentFile) return;
  document.getElementById('detection-result').style.display = 'none';
  document.getElementById('detection-error').style.display  = 'none';
  document.getElementById('dish-result').style.display      = 'none';
  setDetectBtnLoading(true);
  try {
    const formData = new FormData();
    formData.append('file', currentFile);
    const response = await fetch('/detect-dish', { method: 'POST', body: formData });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Error del servidor: ${response.status}`);
    }
    const data = await response.json();
    document.getElementById('dish-name').textContent     = data.plato || '';
    document.getElementById('dish-result').style.display = 'block';
    detectedIngredients = data.ingredientes || [];
    if (detectedIngredients.length === 0) {
      showDetectionError('Platillo detectado pero sin ingredientes registrados.');
      return;
    }
    renderDetectedChips(detectedIngredients);
    document.getElementById('detection-result').style.display = 'block';
  } catch (err) {
    showDetectionError(err.message || 'No se pudo reconocer el platillo.');
  } finally {
    setDetectBtnLoading(false);
  }
}

// ════════════════════════════════════════════════════════════
// CHIPS SELECCIONABLES
// ════════════════════════════════════════════════════════════

function renderDetectedChips(items) {
  selectedDetected.clear();
  items.forEach(i => selectedDetected.add(i));
  const container = document.getElementById('detected-chips');
  container.innerHTML = '';
  updateAddButton();
  items.forEach(name => {
    const chip = document.createElement('div');
    chip.className = 'detected-chip selected';
    chip.dataset.name = name;
    chip.textContent = name;
    chip.addEventListener('click', () => toggleDetectedChip(chip, name));
    container.appendChild(chip);
  });
}

function toggleDetectedChip(chip, name) {
  if (selectedDetected.has(name)) {
    selectedDetected.delete(name);
    chip.classList.remove('selected');
  } else {
    selectedDetected.add(name);
    chip.classList.add('selected');
  }
  updateAddButton();
}

function updateAddButton() {
  let addBtn = document.getElementById('btn-add-detected');
  if (!addBtn) {
    addBtn = document.createElement('button');
    addBtn.id            = 'btn-add-detected';
    addBtn.className     = 'btn-detect';
    addBtn.style.cssText = 'width:100%; margin-top:4px;';
    addBtn.onclick       = addDetectedToList;
    document.querySelector('.cam-modal-footer').prepend(addBtn);
  }
  const n = selectedDetected.size;
  addBtn.textContent = n > 0 ? `Agregar ${n} ingrediente${n === 1 ? '' : 's'}` : 'Selecciona al menos uno';
  addBtn.disabled = n === 0;
}

function addDetectedToList() {
  const names = [...selectedDetected];
  const added = [];
  names.forEach(name => {
    if (!ingrs.includes(name)) {
      ingrs.push(name);
      addChip(name);
      addItem(name);
      added.push(name);
    }
  });
  sync();
  if (added.length) {
    showToast(`✓ ${added.length} ingrediente${added.length === 1 ? '' : 's'} agregado${added.length === 1 ? '' : 's'}`);
  } else {
    showToast('Esos ingredientes ya estaban en tu lista');
  }
  closeCamModal();
}

function showDetectionError(msg) {
  document.getElementById('error-msg').textContent = msg;
  document.getElementById('detection-error').style.display = 'flex';
}