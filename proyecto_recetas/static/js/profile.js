/* ── Estado ── */
let editing = false;
let pendingPhotoUrl = null;
let currentPhotoUrl = null;

/* ── Toast ── */
const toast = document.getElementById('toast');
function showToast(msg, duration = 2800) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ══════════════════════════════════════
   PREFERENCIAS – Dark / Compact / Autoplay
   Se persisten en localStorage bajo la
   clave 'recetafacil_prefs'
   ══════════════════════════════════════ */

const PREFS_KEY = 'recetafacil_prefs';

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; }
  catch { return {}; }
}

function savePrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

function applyPrefs(prefs) {
  /* Clases en <html> que activan preferences.css */
  document.documentElement.classList.toggle('dark',    !!prefs.dark);
  document.documentElement.classList.toggle('compact', !!prefs.compact);

  /* Sincronizar estado visual de los toggles */
  const tDark    = document.getElementById('toggle-dark');
  const tCompact = document.getElementById('toggle-compact');

  if (tDark)    tDark.checked    = !!prefs.dark;
  if (tCompact) tCompact.checked = !!prefs.compact;
  applyFontSize(prefs.fontSize || 'normal');
}

function onToggle(el, name) {
  const prefs = loadPrefs();

  if (el.id === 'toggle-dark') {
    prefs.dark = el.checked;
    document.documentElement.classList.toggle('dark', el.checked);
  }

  if (el.id === 'toggle-compact') {
    prefs.compact = el.checked;
    document.documentElement.classList.toggle('compact', el.checked);
  }


  savePrefs(prefs);
  showToast((el.checked ? '✓ ' : '○ ') + name + (el.checked ? ' activado' : ' desactivado'));
}

/* ── Inicializar al cargar página ── */
window.addEventListener('DOMContentLoaded', () => {
  /* Aplicar preferencias guardadas */
  applyPrefs(loadPrefs());

  /* Avatar: mostrar foto o inicial */
  const img         = document.getElementById('avatar-img');
  const placeholder = document.getElementById('avatar-placeholder');

  if (img && img.getAttribute('src')) {
    img.style.display         = 'block';
    placeholder.style.display = 'none';
  } else {
    if (img) img.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
  }
});

/* ── Edit info personal ── */
function toggleEdit() {
  editing = !editing;
  const grid    = document.getElementById('info-grid');
  const actions = document.getElementById('edit-actions');
  const btnEdit = document.getElementById('btn-edit-info');

  if (editing) {
    grid.classList.add('editing');
    actions.classList.add('show');
    btnEdit.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg> Cancelar`;
    btnEdit.onclick = cancelEdit;
    document.querySelectorAll('.no-edit').forEach(input => { input.disabled = true; });
    document.getElementById('inp-nombre').focus();
  } else {
    cancelEdit();
  }
}

function cancelEdit() {
  editing = false;
  document.getElementById('inp-nombre').value = document.getElementById('val-nombre').textContent;
  document.getElementById('inp-email').value  = document.getElementById('val-email').textContent;
  document.getElementById('inp-tel').value    = document.getElementById('val-tel').textContent;
  document.getElementById('inp-loc').value    = document.getElementById('val-loc').textContent;

  document.getElementById('info-grid').classList.remove('editing');
  document.getElementById('edit-actions').classList.remove('show');

  const btnEdit = document.getElementById('btn-edit-info');
  btnEdit.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Editar`;
  btnEdit.onclick = toggleEdit;
}

async function saveInfo() {
  const nombre = document.getElementById('inp-nombre').value.trim();
  const tel    = document.getElementById('inp-tel').value.trim();
  const loc    = document.getElementById('inp-loc').value.trim();
  const idioma = document.getElementById('val-idioma').textContent;
  const zona   = document.getElementById('val-zona').textContent;

  if (!nombre) { showToast('⚠ El nombre no puede estar vacío'); return; }

  const res = await fetch('/profile/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: nombre, phone: tel, location: loc, language: idioma, timezone: zona })
  });

  const data = await res.json();
  if (!data.success) { showToast('⚠ Error: ' + data.message); return; }

  document.getElementById('val-nombre').textContent   = nombre;
  document.getElementById('val-tel').textContent      = tel;
  document.getElementById('val-loc').textContent      = loc;
  document.getElementById('display-name').textContent = nombre;

  const img         = document.getElementById('avatar-img');
  const placeholder = document.getElementById('avatar-placeholder');
  if (!img.getAttribute('src')) {
    placeholder.textContent = nombre ? nombre[0].toUpperCase() : '?';
  }

  cancelEdit();
  showToast('✓ Información guardada correctamente');
}

/* ── Save all ── */
function saveAll() {
  if (editing) saveInfo();
  showToast('✓ Todos los cambios han sido guardados');
}

/* ── Logout modal ── */
function openLogoutModal()  { document.getElementById('modal-logout').classList.add('open'); }
function closeLogoutModal() { document.getElementById('modal-logout').classList.remove('open'); }
function confirmLogout()    { window.location.href = '/logout'; }

/* ── Photo modal ── */
function openPhotoModal() {
  pendingPhotoUrl = null;
  document.getElementById('preview-img').style.display = 'none';
  document.getElementById('btn-apply-photo').disabled  = true;
  document.getElementById('modal-photo').classList.add('open');
}
function closePhotoModal() {
  document.getElementById('modal-photo').classList.remove('open');
  document.getElementById('file-input').value = '';
}

function onFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('⚠ La imagen no debe superar 5 MB'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    pendingPhotoUrl = e.target.result;
    const prev = document.getElementById('preview-img');
    prev.src           = pendingPhotoUrl;
    prev.style.display = 'block';
    document.getElementById('btn-apply-photo').disabled = false;
  };
  reader.readAsDataURL(file);
}

async function applyPhoto() {
  if (!pendingPhotoUrl) return;
  currentPhotoUrl = pendingPhotoUrl;

  document.getElementById('avatar-img').src                   = currentPhotoUrl;
  document.getElementById('avatar-img').style.display         = 'block';
  document.getElementById('avatar-placeholder').style.display = 'none';

  const res = await fetch('/profile/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photo: currentPhotoUrl })
  });

  const data = await res.json();
  showToast(data.success ? '✓ Foto actualizada' : '⚠ Error al guardar foto');
  closePhotoModal();
}

/* ── Drag & drop ── */
const dropZone = document.getElementById('drop-zone');
dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag'); });
dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('drag'));
dropZone.addEventListener('drop', e => {
  e.preventDefault(); dropZone.classList.remove('drag');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    const dt = new DataTransfer(); dt.items.add(file);
    const fi = document.getElementById('file-input');
    fi.files = dt.files; onFileSelect(fi);
  }
});

/* ── Close modals on backdrop ── */
document.getElementById('modal-logout').addEventListener('click', function(e) {
  if (e.target === this) closeLogoutModal();
});
document.getElementById('modal-photo').addEventListener('click', function(e) {
  if (e.target === this) closePhotoModal();
});

/* ── Idioma y Región ── */
function toggleLangEdit() {
  document.getElementById('field-idioma').classList.add('editing');
  document.getElementById('field-zona').classList.add('editing');
  document.getElementById('lang-edit-actions').classList.add('show');
  document.getElementById('btn-lang-edit').style.display = 'none';

  const selIdioma = document.getElementById('sel-idioma');
  const selZona   = document.getElementById('sel-zona');
  const valIdioma = document.getElementById('val-idioma').textContent;
  const valZona   = document.getElementById('val-zona').textContent;

  for (let o of selIdioma.options) o.selected = o.value === valIdioma;
  for (let o of selZona.options)   o.selected = o.value === valZona;
}

function cancelLangEdit() {
  document.getElementById('field-idioma').classList.remove('editing');
  document.getElementById('field-zona').classList.remove('editing');
  document.getElementById('lang-edit-actions').classList.remove('show');
  document.getElementById('btn-lang-edit').style.display = '';
}

async function saveLangEdit() {
  const idioma = document.getElementById('sel-idioma').value;
  const zona   = document.getElementById('sel-zona').value;

  document.getElementById('val-idioma').textContent = idioma;
  document.getElementById('val-zona').textContent   = zona;

  const res = await fetch('/profile/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name:     document.getElementById('val-nombre').textContent,
      phone:    document.getElementById('val-tel').textContent,
      location: document.getElementById('val-loc').textContent,
      language: idioma,
      timezone: zona
    })
  });

  const data = await res.json();
  if (data.success) {
    cancelLangEdit();
    showToast('✓ Idioma y zona horaria actualizados');
  } else {
    showToast('⚠ Error al actualizar preferencias');
  }
}
const FONT_SIZES = ['small', 'normal', 'large'];
const FONT_LABELS = ['Pequeño', 'Normal', 'Grande'];

function changeFontSize(delta) {
  const prefs = loadPrefs();
  let idx = FONT_SIZES.indexOf(prefs.fontSize || 'normal');
  idx = Math.max(0, Math.min(2, idx + delta));
  prefs.fontSize = FONT_SIZES[idx];
  savePrefs(prefs);
  applyFontSize(prefs.fontSize);
  showToast('✓ Tamaño de fuente: ' + FONT_LABELS[idx]);
}

function applyFontSize(size) {
  document.documentElement.classList.remove('font-small', 'font-normal', 'font-large');
  document.documentElement.classList.add('font-' + (size || 'normal'));
  const label = document.getElementById('font-size-label');
  if (label) label.textContent = FONT_LABELS[FONT_SIZES.indexOf(size || 'normal')];
}