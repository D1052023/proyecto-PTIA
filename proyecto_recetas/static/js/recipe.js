// ── Leer ingredientes desde la URL ───────────────────────
const params   = new URLSearchParams(location.search);
const URL_INGS = params.get('ings')
  ? params.get('ings').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  : [];

// Mostrar ingredientes en el heading
if (URL_INGS.length) {
  const display = URL_INGS.map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(', ');
  document.getElementById('ing-display').textContent = display;
} else {
  document.getElementById('ing-display').textContent = 'Sin ingredientes';
}

// ── Estado global ─────────────────────────────────────────
let ALL_RECIPES  = [];       // recetas del modelo
let visibleCount = 6;
let activeFilter = 'todas';
let searchQ      = '';
let sortBy       = 'match';
let favorites    = new Set();

// Cargar favoritos guardados
try {
  const saved = JSON.parse(localStorage.getItem('rf_favorites')) || [];
  favorites   = new Set(saved.map(r => r.id));
} catch(e) {}

// ── Indicador de carga ────────────────────────────────────
function showLoading() {
  // Resetear contadores mientras carga
  document.getElementById('result-title').textContent  = 'Buscando recetas...';
  document.getElementById('visible-count').textContent = '0';

  document.getElementById('recipes-grid').innerHTML = `
    <div class="loading-state" style="grid-column:1/-1; display:flex; flex-direction:column;
         align-items:center; justify-content:center; gap:12px; padding:60px 0; color:#9ca3af;">
      <div class="loading-spinner"></div>
      <span style="font-size:13px;">Buscando recetas con tu modelo...</span>
    </div>`;
}

// ── Llamar al modelo TF-IDF ───────────────────────────────
async function cargarRecetas() {
  if (!URL_INGS.length) {
    document.getElementById('recipes-grid').innerHTML = `
      <div class="empty-search" style="grid-column:1/-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
             stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span>No se recibieron ingredientes.<br>Vuelve al dashboard y agrega algunos.</span>
      </div>`;
    return;
  }

  showLoading();

  try {
    const response = await fetch('/api/recetas', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ingredientes: URL_INGS })
    });

    if (!response.ok) throw new Error(`Error ${response.status}`);

    const data  = await response.json();
    ALL_RECIPES = (data.recetas || []).map((r, i) => ({ ...r, id: i + 1 }));

    document.getElementById('result-title').textContent =
      `Encontradas: ${ALL_RECIPES.length} recetas`;

    renderGrid();

  } catch (err) {
    console.error('Error cargando recetas:', err);
    document.getElementById('recipes-grid').innerHTML = `
      <div class="empty-search" style="grid-column:1/-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
             stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>No se pudieron cargar las recetas.<br>Verifica que el servidor esté corriendo.</span>
      </div>`;
  }
}

// ── Contar ingredientes que coinciden con la URL ──────────
function matchCount(recipe) {
  const recipeIngs = (recipe.ingredients_list || []).map(i => i.toLowerCase());
  return URL_INGS.filter(u => recipeIngs.some(r => r.includes(u) || u.includes(r))).length;
}

// ── Badge según tags ──────────────────────────────────────
function getBadge(recipe) {
  const tags = (recipe.tags_list || []).map(t => t.toLowerCase());
  if (tags.some(t => ['vegan','vegetarian','vegano','vegetariano'].includes(t)))
    return { key: 'vegano',      label: 'VEGANO',      color: '#8bc34a' };
  if (tags.some(t => ['healthy','light','saludable'].includes(t)))
    return { key: 'saludable',   label: 'SALUDABLE',   color: '#4caf50' };
  if (tags.some(t => ['italian','italiana','pasta','pizza'].includes(t)))
    return { key: 'italiana',    label: 'ITALIANA',    color: '#e91e63' };
  if (recipe.minutes <= 20)
    return { key: 'rapida',      label: 'RÁPIDA',      color: '#2196f3' };
  return      { key: 'tradicional', label: 'TRADICIONAL', color: '#ff9800' };
}

// ── Emoji según nombre ────────────────────────────────────
function getEmoji(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('pasta') || n.includes('spaghetti'))  return '🍝';
  if (n.includes('chicken') || n.includes('pollo'))    return '🍗';
  if (n.includes('salad') || n.includes('ensalada'))   return '🥗';
  if (n.includes('soup') || n.includes('sopa'))        return '🍲';
  if (n.includes('cake') || n.includes('torta'))       return '🎂';
  if (n.includes('rice') || n.includes('arroz'))       return '🍚';
  if (n.includes('egg') || n.includes('huevo'))        return '🍳';
  if (n.includes('fish') || n.includes('pescado'))     return '🐟';
  if (n.includes('burger') || n.includes('hamburgue')) return '🍔';
  if (n.includes('pizza'))                             return '🍕';
  if (n.includes('taco'))                              return '🌮';
  if (n.includes('avocado') || n.includes('aguacate')) return '🥑';
  return '🍽';
}

// ── Filtrar y ordenar ─────────────────────────────────────
function getFiltered() {
  let data = [...ALL_RECIPES];

  if (searchQ) {
    data = data.filter(r => r.name.toLowerCase().includes(searchQ));
  }

  if (activeFilter === 'populares') {
    data = data.filter(r => matchCount(r) >= 2);
  } else if (activeFilter === 'rapidas') {
    data = data.filter(r => r.minutes <= 20);
  } else if (activeFilter === 'saludables') {
    data = data.filter(r => {
      const tags = (r.tags_list || []).map(t => t.toLowerCase());
      return tags.some(t => ['healthy','light','saludable','vegan','vegetarian'].includes(t));
    });
  } else if (activeFilter === 'favoritos') {
    data = data.filter(r => favorites.has(r.id));
  }

  if (sortBy === 'match')      data.sort((a, b) => matchCount(b) - matchCount(a));
  else if (sortBy === 'time')  data.sort((a, b) => a.minutes - b.minutes);
  else if (sortBy === 'kcal')  data.sort((a, b) => a.calories - b.calories);
  else if (sortBy === 'name')  data.sort((a, b) => a.name.localeCompare(b.name));

  return data;
}

// ── Renderizar grid ───────────────────────────────────────
function renderGrid() {
  const grid    = document.getElementById('recipes-grid');
  const filtered = getFiltered();
  const data    = filtered.slice(0, visibleCount);

  document.getElementById('visible-count').textContent =
    Math.min(filtered.length, visibleCount);
  document.getElementById('result-title').textContent =
    `Encontradas: ${filtered.length} recetas`;

  if (data.length === 0) {
    grid.innerHTML = `
      <div class="empty-search" style="grid-column:1/-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
             stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span>No se encontraron recetas</span>
      </div>`;
    return;
  }

  grid.innerHTML = data.map(r => {
    const mc    = matchCount(r);
    const badge = getBadge(r);
    const emoji = getEmoji(r.name);
    const isFav = favorites.has(r.id);
    const ings  = r.ingredients_list || [];
    const total = ings.length;

    const dots = ings.slice(0, 5).map(ing => {
      const match = URL_INGS.some(u => ing.toLowerCase().includes(u) || u.includes(ing.toLowerCase()));
      return `<span class="dot ${match ? 'dot--filled' : 'dot--empty'}"></span>`;
    }).join('');

    const tagsHtml = ings.slice(0, 4).map(ing => {
      const match = URL_INGS.some(u => ing.toLowerCase().includes(u) || u.includes(ing.toLowerCase()));
      return `<span class="ing-tag ${match ? 'ing-tag--match' : 'ing-tag--missing'}">${ing}</span>`;
    }).join('');

    return `
      <div class="recipe-card" onclick="openModal(${r.id})">
        <div class="card-image">
          <div class="card-image-placeholder">${emoji}</div>
          <span class="badge badge--${badge.key}" style="background:${badge.color}">${badge.label}</span>
          <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav(event,${r.id})" title="${isFav ? 'Quitar favorito' : 'Guardar'}">
            <svg viewBox="0 0 24 24" fill="${isFav ? '#e53935' : 'none'}" stroke="${isFav ? '#e53935' : '#6b7280'}"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <div class="match-bar">
            <span class="match-text">${mc} de ${total} ingredientes coinciden</span>
            <div class="match-dots">${dots}</div>
          </div>
        </div>
        <div class="card-body">
          <div class="card-title">${r.name}</div>
          <div class="card-meta">
            <div class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              ${r.minutes} min
            </div>
            <div class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2c0 6-6 10-6 14a6 6 0 0 0 12 0c0-4-6-8-6-14z"/>
              </svg>
              ${r.calories} kcal
            </div>
          </div>
          <div class="card-tags">${tagsHtml}</div>
        </div>
      </div>`;
  }).join('');
}

// ── Favoritos ─────────────────────────────────────────────
function toggleFav(e, id) {
  e.stopPropagation();
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem('rf_favorites')) || []; } catch(e) {}
  const recipe = ALL_RECIPES.find(r => r.id === id);
  const exists = saved.some(r => r.id === id);
  if (exists) {
    saved = saved.filter(r => r.id !== id);
    showToast('Eliminado de favoritos');
  } else {
    saved.push({
      id:         recipe.id,
      emoji:      getEmoji(recipe.name),
      name:       recipe.name,
      badge:      getBadge(recipe).key,
      time:       recipe.minutes,
      kcal:       recipe.calories,
      savedAt:    Date.now(),
      collection: 'Sin colección',
    });
    showToast('✓ Guardado en favoritos');
  }
  localStorage.setItem('rf_favorites', JSON.stringify(saved));
  favorites = new Set(saved.map(r => r.id));
  renderGrid();
}

// ── Filtros y ordenamiento ────────────────────────────────
function setFilter(f, btnEl) {
  activeFilter = f;
  visibleCount = 6;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.className = 'filter-btn ' + (b === btnEl ? 'filter-btn--active' : 'filter-btn--inactive');
  });
  renderGrid();
}

function filterRecipes() {
  searchQ      = document.getElementById('search-input').value.trim().toLowerCase();
  visibleCount = 6;
  renderGrid();
}

function sortRecipes(val) {
  sortBy = val;
  renderGrid();
}

function loadMore() {
  visibleCount += 3;
  renderGrid();
  showToast('Cargando más recetas...');
}

// ── Modal de detalle ──────────────────────────────────────
function openModal(id) {
  const r = ALL_RECIPES.find(x => x.id === id);
  if (!r) return;

  const mc    = matchCount(r);
  const isFav = favorites.has(r.id);
  const emoji = getEmoji(r.name);
  const ings  = r.ingredients_list || [];
  const steps = r.steps_list || [];

  const stepsHtml = steps.map((s, i) =>
    `<div class="modal-step">
       <span class="step-num">${i + 1}</span>
       <span class="step-text">${s}</span>
     </div>`
  ).join('');

  const ingsHtml = ings.map(ing => {
    const match = URL_INGS.some(u => ing.toLowerCase().includes(u) || u.includes(ing.toLowerCase()));
    return `<span class="ing-tag ${match ? 'ing-tag--match' : 'ing-tag--missing'}"
                  style="font-size:12px;padding:4px 10px">${ing}</span>`;
  }).join('');

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-img">${emoji}</div>
    <div class="modal-body">
      <div class="modal-header">
        <span class="modal-title">${r.name}</span>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-meta">
        <div class="modal-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          ${r.minutes} min
        </div>
        <div class="modal-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2c0 6-6 10-6 14a6 6 0 0 0 12 0c0-4-6-8-6-14z"/>
          </svg>
          ${r.calories} kcal
        </div>
        <div class="modal-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          ${mc}/${ings.length} coinciden
        </div>
      </div>
      <div>
        <p class="modal-section-title">Ingredientes</p>
        <div class="modal-ing-list">${ingsHtml}</div>
      </div>
      <div>
        <p class="modal-section-title">Preparación</p>
        <div class="modal-steps">${stepsHtml}</div>
      </div>
      <div class="modal-footer">
        <button class="btn-fav-modal" onclick="toggleFavModal(${r.id})">
          <svg width="15" height="15" viewBox="0 0 24 24"
               fill="${isFav ? '#e53935' : 'none'}"
               stroke="${isFav ? '#e53935' : 'currentColor'}"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          ${isFav ? 'En favoritos' : 'Guardar'}
        </button>
        <button class="btn-cook" onclick="showToast('¡Buen provecho! 🍴'); closeModal()">
          Cocinar ahora
        </button>
      </div>
    </div>`;

  document.getElementById('modal').classList.add('open');
}

function toggleFavModal(id) {
  if (favorites.has(id)) {
    favorites.delete(id);
    showToast('Eliminado de favoritos');
  } else {
    favorites.add(id);
    showToast('✓ Guardado en favoritos');
  }
  renderGrid();
  openModal(id);
}

function closeModal(e) {
  if (!e || e.target === document.getElementById('modal')) {
    document.getElementById('modal').classList.remove('open');
  }
}

// ── Toast ─────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

// ── Spinner CSS (inyectado dinámicamente) ─────────────────
const style = document.createElement('style');
style.textContent = `
  .loading-spinner {
    width: 36px; height: 36px;
    border: 3px solid #e5e7eb;
    border-top-color: #4caf50;
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
document.head.appendChild(style);

// ── Iniciar carga ─────────────────────────────────────────
cargarRecetas();