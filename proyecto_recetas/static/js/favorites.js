/* ============================================
   FAVORITES JS – RECETAFÁCIL
   favorites.js
   ============================================ */

const BADGE_COLORS = {
  saludable:   '#4caf50',
  tradicional: '#ff9800',
  vegano:      '#8bc34a',
  italiana:    '#e91e63',
  rapida:      '#2196f3',
  gourmet:     '#9c27b0',
};

const BADGE_LABELS = {
  saludable:   'SALUDABLE',
  tradicional: 'TRADICIONAL',
  vegano:      'VEGANO',
  italiana:    'ITALIANA',
  rapida:      'RÁPIDA',
  gourmet:     'GOURMET',
};

/* ── Estado global ── */
let favorites   = loadFavorites();
let collections = loadCollections();
let activeCol   = 'Todas';
let viewMode    = 'grid';
let sortBy      = 'date';
let searchQ     = '';

/* ── Persistencia localStorage ── */
function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem('rf_favorites')) || [];
  } catch(e) {
    return [];
  }
}

function saveFavorites() {
  try { localStorage.setItem('rf_favorites', JSON.stringify(favorites)); } catch(e) {}
}

function loadCollections() {
  try {
    return JSON.parse(localStorage.getItem('rf_collections')) || ['Todas', 'Sin colección'];
  } catch(e) {
    return ['Todas', 'Sin colección'];
  }
}

function saveCollections() {
  try { localStorage.setItem('rf_collections', JSON.stringify(collections)); } catch(e) {}
}

/* ── Filtrado y ordenamiento ── */
function getFiltered() {
  let data = [...favorites];

  if (searchQ) {
    data = data.filter(r => r.name.toLowerCase().includes(searchQ));
  }

  if (activeCol !== 'Todas') {
    data = data.filter(r => r.collection === activeCol);
  }

  if      (sortBy === 'name') data.sort((a,b) => a.name.localeCompare(b.name));
  else if (sortBy === 'time') data.sort((a,b) => a.time - b.time);
  else if (sortBy === 'kcal') data.sort((a,b) => a.kcal - b.kcal);
  else                        data.sort((a,b) => b.savedAt - a.savedAt);

  return data;
}

/* ── Stats ── */
function updateStats() {
  document.getElementById('stat-total').textContent = favorites.length;

  if (favorites.length) {
    const avg = Math.round(favorites.reduce((s,r) => s + r.time, 0) / favorites.length);
    document.getElementById('stat-time').textContent = avg;

    const cats = {};
    favorites.forEach(r => { cats[r.badge] = (cats[r.badge] || 0) + 1; });
    const top   = Object.entries(cats).sort((a,b) => b[1] - a[1])[0];
    const label = BADGE_LABELS[top[0]] || top[0];
    document.getElementById('stat-top').textContent =
      label.charAt(0) + label.slice(1).toLowerCase();
  } else {
    document.getElementById('stat-time').textContent = '0';
    document.getElementById('stat-top').textContent  = '–';
  }
}

/* ── Collection chips ── */
function renderCollections() {
  favorites.forEach(r => {
    if (r.collection && !collections.includes(r.collection)) {
      collections.push(r.collection);
    }
  });

  const counts = {};
  favorites.forEach(r => { counts[r.collection] = (counts[r.collection] || 0) + 1; });

  document.getElementById('collections-scroll').innerHTML = collections.map(c => {
    const cnt      = c === 'Todas' ? favorites.length : (counts[c] || 0);
    const isActive = activeCol === c;
    return `<button
      class="col-chip ${isActive ? 'col-chip--active' : ''}"
      onclick="setCollection('${c.replace(/'/g, "\\'")}')">
      ${c} <span class="chip-count">${cnt}</span>
    </button>`;
  }).join('');
}

/* ── Render principal ── */
function renderGrid() {
  const data      = getFiltered();
  const container = document.getElementById('fav-container');
  document.getElementById('visible-count').textContent = data.length;

  if (!data.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
        <h3>${searchQ ? 'Sin resultados' : 'Aún no tienes favoritos'}</h3>
        <p>${searchQ
          ? 'Intenta con otro nombre de receta.'
          : 'Guarda recetas desde el listado tocando el corazón.'}</p>
        <button class="btn-explore" onclick="window.location.href='/recipe'">
          Explorar recetas
        </button>
      </div>`;
    return;
  }

  if (viewMode === 'grid') {
    container.innerHTML = `<div class="recipes-grid">${data.map(gridCard).join('')}</div>`;
  } else {
    container.innerHTML = `<div class="recipes-list">${data.map(listCard).join('')}</div>`;
  }
}

/* ── Plantillas de tarjeta ── */
function relativeDate(ts) {
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}

function gridCard(r) {
  return `
    <div class="recipe-card" onclick="openRecipeDetail(${r.id})">
      <div class="card-image">
        ${r.emoji}
        <div class="badge" style="background:${BADGE_COLORS[r.badge] || '#888'}">${BADGE_LABELS[r.badge] || r.badge}</div>
        <button class="fav-btn" onclick="removeFavorite(event,${r.id})" title="Quitar de favoritos">
          <svg viewBox="0 0 24 24" fill="#e53935" stroke="#e53935" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      <div class="card-body">
        <div class="card-title">${r.name}</div>
        <div class="card-meta">
          <div class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            ${r.time} min
          </div>
          <div class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2c0 6-6 10-6 14a6 6 0 0 0 12 0c0-4-6-8-6-14z"/>
            </svg>
            ${r.kcal} kcal
          </div>
        </div>
        <div class="card-footer">
          <span class="col-tag">${r.collection}</span>
          <span class="card-date">${relativeDate(r.savedAt)}</span>
        </div>
      </div>
    </div>`;
}

function listCard(r) {
  return `
    <div class="list-card" onclick="openRecipeDetail(${r.id})">
      <div class="list-emoji">${r.emoji}</div>
      <div class="list-info">
        <div class="list-title">${r.name}</div>
        <div class="list-meta">
          <div class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            ${r.time} min
          </div>
          <div class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px">
              <path d="M12 2c0 6-6 10-6 14a6 6 0 0 0 12 0c0-4-6-8-6-14z"/>
            </svg>
            ${r.kcal} kcal
          </div>
          <span class="col-tag">${r.collection}</span>
          <span class="list-date">${relativeDate(r.savedAt)}</span>
        </div>
      </div>
      <button class="list-remove" onclick="removeFavorite(event,${r.id})" title="Quitar de favoritos">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
    </div>`;
}

/* ── Acciones ── */
function removeFavorite(e, id) {
  e.stopPropagation();
  favorites = favorites.filter(r => r.id !== id);
  saveFavorites();
  fullRender();
  showToast('Eliminado de favoritos');
}

function setCollection(c) {
  activeCol = c;
  renderCollections();
  renderGrid();
}

function setView(v) {
  viewMode = v;
  document.getElementById('btn-grid').classList.toggle('view-btn--active', v === 'grid');
  document.getElementById('btn-list').classList.toggle('view-btn--active', v === 'list');
  renderGrid();
}

function filterRecipes() {
  searchQ = document.getElementById('search-input').value.trim().toLowerCase();
  renderGrid();
}

function sortRecipes(val) {
  sortBy = val;
  renderGrid();
}

function openRecipeDetail(id) {
  window.location.href = `/recipe?id=${id}`;
}

/* ── Modal nueva colección ── */
function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
  const inp = document.getElementById('col-name-input');
  inp.value = '';
  setTimeout(() => inp.focus(), 50);
}

function closeModal(e) {
  if (!e || e.target === document.getElementById('modal-overlay')) {
    document.getElementById('modal-overlay').classList.remove('open');
  }
}

function createCollection() {
  const name = document.getElementById('col-name-input').value.trim();
  if (!name)                       { showToast('Escribe un nombre para la colección'); return; }
  if (collections.includes(name))  { showToast('Esa colección ya existe'); return; }
  collections.push(name);
  saveCollections();
  activeCol = name;
  closeModal();
  renderCollections();
  renderGrid();
  showToast(`Colección "${name}" creada`);
}

/* ── Toast ── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ── Render completo ── */
function fullRender() {
  updateStats();
  renderCollections();
  renderGrid();
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  fullRender();
});