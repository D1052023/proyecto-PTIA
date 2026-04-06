// ── Leer ingredientes desde la URL ───────────────────────
const params   = new URLSearchParams(location.search);
const URL_INGS = params.get('ings')
  ? params.get('ings').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  : [];

const modoGeneral = URL_INGS.length === 0;

if (URL_INGS.length) {
  const display = URL_INGS.map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(', ');
  document.getElementById('ing-display').textContent = display;
} else {
  document.getElementById('ing-display').textContent = 'Recetas populares';
}

if (modoGeneral) {
  const sub = document.getElementById('ing-subtitle');
  if (sub) sub.innerHTML = 'Las recetas más populares de nuestra colección';
}

// ── Estado global ─────────────────────────────────────────
let ALL_RECIPES   = [];
let currentOffset = 0;
let visibleCount  = 6;
let activeFilter  = 'todas';
let searchQ       = '';
let sortBy        = 'match';
let favorites     = new Set();

try {
  const saved = JSON.parse(localStorage.getItem('rf_favorites')) || [];
  favorites   = new Set(saved.map(r => r.id));
} catch(e) {}

// ── Helpers de puntaje ────────────────────────────────────
function getStars(rating) {
  const r = Math.round(rating || 0);
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

// ── Indicador de carga ────────────────────────────────────
function showLoading() {
  document.getElementById('result-title').textContent  = modoGeneral ? 'Cargando recetas populares...' : 'Buscando recetas...';
  document.getElementById('visible-count').textContent = '0';
  document.getElementById('recipes-grid').innerHTML = `
    <div class="loading-state" style="grid-column:1/-1; display:flex; flex-direction:column;
         align-items:center; justify-content:center; gap:12px; padding:60px 0; color:#9ca3af;">
      <div class="loading-spinner"></div>
      <span style="font-size:13px;">${modoGeneral ? 'Cargando recetas populares...' : 'Buscando recetas con tu modelo...'}</span>
    </div>`;
}

// ── Llamar al modelo ──────────────────────────────────────
async function cargarRecetas(offset = 0) {
  if (offset === 0) showLoading();

  try {
    const response = await fetch('/api/recetas', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ingredientes: URL_INGS, offset })
    });

    if (!response.ok) throw new Error(`Error ${response.status}`);

    const data   = await response.json();
    const nuevas = (data.recetas || []).map((r, i) => ({ ...r, id: offset + i + 1 }));

    if (offset === 0) ALL_RECIPES = nuevas;
    else              ALL_RECIPES = [...ALL_RECIPES, ...nuevas];

    currentOffset = data.offset;

    document.getElementById('result-title').textContent = modoGeneral
      ? `Recetas populares · ${ALL_RECIPES.length} encontradas`
      : `Encontradas: ${ALL_RECIPES.length} recetas`;

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
  if (modoGeneral) return 0;
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
    data = modoGeneral
      ? data.filter(r => (r.num_reviews || 0) >= 10)
      : data.filter(r => matchCount(r) >= 2);
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

  if (sortBy === 'match')       data.sort((a, b) => modoGeneral ? (b.popularity_score || 0) - (a.popularity_score || 0) : matchCount(b) - matchCount(a));
  else if (sortBy === 'time')   data.sort((a, b) => a.minutes - b.minutes);
  else if (sortBy === 'kcal')   data.sort((a, b) => a.calories - b.calories);
  else if (sortBy === 'rating') data.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
  else if (sortBy === 'name')   data.sort((a, b) => a.name.localeCompare(b.name));

  return data;
}

// ── Renderizar grid ───────────────────────────────────────
function renderGrid() {
  const grid     = document.getElementById('recipes-grid');
  const filtered = getFiltered();
  const data     = filtered.slice(0, visibleCount);

  document.getElementById('visible-count').textContent =
    Math.min(filtered.length, visibleCount);
  document.getElementById('result-title').textContent = modoGeneral
    ? `Recetas populares · ${filtered.length} encontradas`
    : `Encontradas: ${filtered.length} recetas`;

  grid.classList.remove('grid--1', 'grid--2');
  if (data.length === 1) grid.classList.add('grid--1');
  else if (data.length === 2) grid.classList.add('grid--2');

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
    const stars = getStars(r.avg_rating);

    const dots = ings.slice(0, 5).map(ing => {
      const match = !modoGeneral && URL_INGS.some(u => ing.toLowerCase().includes(u) || u.includes(ing.toLowerCase()));
      return `<span class="dot ${match ? 'dot--filled' : 'dot--empty'}"></span>`;
    }).join('');

    const matchBarHtml = modoGeneral
      ? `<div class="match-bar"><span class="match-text">★ ${(r.avg_rating || 0).toFixed(1)} · ${r.num_reviews || 0} reseñas</span></div>`
      : `<div class="match-bar">
           <span class="match-text">${mc} de ${total} ingredientes coinciden</span>
           <div class="match-dots">${dots}</div>
         </div>`;

    const tagsHtml = ings.slice(0, 4).map(ing => {
      const match = !modoGeneral && URL_INGS.some(u => ing.toLowerCase().includes(u) || u.includes(ing.toLowerCase()));
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
          ${matchBarHtml}
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
          <div class="card-rating">
            <span class="rating-stars">${stars}</span>
            <span class="rating-val">${(r.avg_rating || 0).toFixed(1)}</span>
            <span class="rating-reviews">(${r.num_reviews || 0})</span>
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
      id:          recipe.id,
      emoji:       getEmoji(recipe.name),
      name:        recipe.name,
      badge:       getBadge(recipe).key,
      time:        recipe.minutes,
      kcal:        recipe.calories,
      avg_rating:  recipe.avg_rating,
      num_reviews: recipe.num_reviews,
      savedAt:     Date.now(),
      collection:  'Sin colección',
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
  if (visibleCount > ALL_RECIPES.length) {
    cargarRecetas(currentOffset);
  }
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
  const stars = getStars(r.avg_rating);

  const stepsHtml = steps.map((s, i) =>
    `<div class="modal-step">
       <span class="step-num">${i + 1}</span>
       <span class="step-text">${s}</span>
     </div>`
  ).join('');

  const ingsHtml = ings.map(ing => {
    const match = !modoGeneral && URL_INGS.some(u => ing.toLowerCase().includes(u) || u.includes(ing.toLowerCase()));
    return `<span class="ing-tag ${match ? 'ing-tag--match' : 'ing-tag--missing'}"
                  style="font-size:12px;padding:4px 10px">${ing}</span>`;
  }).join('');

  const coincidenciaItem = modoGeneral ? '' : `
    <div class="modal-meta-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      ${mc}/${ings.length} coinciden
    </div>`;

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
        ${coincidenciaItem}
        <div class="modal-meta-item">
          <span style="color:#f59e0b; font-size:13px; letter-spacing:1px; line-height:1;">${stars}</span>
          ${(r.avg_rating || 0).toFixed(1)} · ${r.num_reviews || 0} reseñas
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

// ── Estilos inyectados ────────────────────────────────────
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
  .recipes-grid.grid--1 {
    grid-template-columns: 1fr;
    max-width: 400px;
  }
  .recipes-grid.grid--2 {
    grid-template-columns: repeat(2, 1fr);
    max-width: 820px;
  }
  .card-rating {
    display: flex; align-items: center; gap: 5px; margin-top: 2px;
  }
  .rating-stars {
    color: #f59e0b; font-size: 12px; letter-spacing: 1px; line-height: 1;
  }
  .rating-val {
    color: #374151; font-size: 12px; font-weight: 600;
  }
  .rating-reviews {
    color: #9ca3af; font-size: 11.5px;
  }
`;
document.head.appendChild(style);

// ── Iniciar carga ─────────────────────────────────────────
cargarRecetas();