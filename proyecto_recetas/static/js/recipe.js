const USER_INGS = ['huevo','cebolla'];

const ALL_RECIPES = [
  { id:1, emoji:'🥗', name:'Ensalada Fresca', badge:'saludable', badgeLabel:'SALUDABLE', time:10, kcal:210, popular:true, ings:['lechuga','tomate','cebolla'], steps:['Lava y seca las hojas de lechuga.','Corta el tomate y la cebolla en rodajas finas.','Mezcla todo en un bol. Aliña con aceite, limón y sal.'] },
  { id:2, emoji:'🥘', name:'Paella Valenciana', badge:'tradicional', badgeLabel:'TRADICIONAL', time:45, kcal:450, popular:true, ings:['arroz','pollo','azafrán','tomate'], steps:['Sofríe el pollo y las verduras en la paellera.','Añade el arroz y el caldo con azafrán.','Cocina 18 min a fuego medio sin remover.'] },
  { id:3, emoji:'🍗', name:'Pollo Salteado', badge:'saludable', badgeLabel:'SALUDABLE', time:30, kcal:380, popular:false, ings:['pollo','ajo','cebolla'], steps:['Trocea el pollo y salpimenta.','Saltea el ajo y la cebolla hasta dorar.','Añade el pollo y cocina 12 min a fuego alto.'] },
  { id:4, emoji:'🍳', name:'Tortilla Española', badge:'saludable', badgeLabel:'SALUDABLE', time:20, kcal:350, popular:true, ings:['huevo','papa','cebolla'], steps:['Pela y lamina las papas. Fríelas en aceite con la cebolla.','Bate los huevos y mezcla con las papas escurridas.','Cuaja la tortilla 4 min por cada lado.'] },
  { id:5, emoji:'🍅', name:'Gazpacho Andaluz', badge:'vegano', badgeLabel:'VEGANO', time:15, kcal:100, popular:false, ings:['tomate','pepino','pimiento','ajo'], steps:['Trocea todos los vegetales.','Bate en la licuadora con agua fría y aceite.','Cuela, añade sal y vinagre. Enfría 1h antes de servir.'] },
  { id:6, emoji:'🍝', name:'Pasta Carbonara', badge:'italiana', badgeLabel:'ITALIANA', time:25, kcal:520, popular:true, ings:['pasta','huevo','panceta','parmesano'], steps:['Cuece la pasta al dente en agua salada.','Dora la panceta en una sartén sin aceite.','Mezcla la pasta con huevo batido, queso y panceta fuera del fuego.'] },
  { id:7, emoji:'🥑', name:'Bowl de Aguacate', badge:'saludable', badgeLabel:'SALUDABLE', time:10, kcal:290, popular:false, ings:['aguacate','arroz','limón','cebolla'], steps:['Cocina el arroz según instrucciones.','Aplasta el aguacate con limón y sal.','Monta el bowl con arroz, aguacate y toppings.'] },
  { id:8, emoji:'🫔', name:'Tacos de Huevo', badge:'rapida', badgeLabel:'RÁPIDA', time:12, kcal:310, popular:false, ings:['huevo','tortilla','cebolla','chile'], steps:['Bate los huevos con sal.','Saltea la cebolla y el chile picado.','Añade el huevo batido y revuelve. Sirve en tortillas.'] },
];

let visibleCount = 6;
let favorites = new Set();
let activeFilter = 'todas';
let searchQ = '';
let sortBy = 'match';

function matchCount(recipe) {
  return recipe.ings.filter(i => USER_INGS.includes(i.toLowerCase())).length;
}

function getFiltered() {
  let data = [...ALL_RECIPES];

  if (searchQ) data = data.filter(r => r.name.toLowerCase().includes(searchQ));

  if (activeFilter === 'populares') data = data.filter(r => r.popular);
  else if (activeFilter === 'rapidas') data = data.filter(r => r.time <= 20);
  else if (activeFilter === 'saludables') data = data.filter(r => r.badge === 'saludable');
  else if (activeFilter === 'favoritos') data = data.filter(r => favorites.has(r.id));

  if (sortBy === 'match') data.sort((a,b) => matchCount(b) - matchCount(a));
  else if (sortBy === 'time') data.sort((a,b) => a.time - b.time);
  else if (sortBy === 'kcal') data.sort((a,b) => a.kcal - b.kcal);
  else if (sortBy === 'name') data.sort((a,b) => a.name.localeCompare(b.name));

  return data;
}

function renderGrid() {
  const grid = document.getElementById('recipes-grid');
  const data = getFiltered().slice(0, visibleCount);

  document.getElementById('visible-count').textContent = Math.min(getFiltered().length, visibleCount);
  document.getElementById('result-title').textContent = `Encontradas: ${getFiltered().length} recetas`;

  if (data.length === 0) {
    grid.innerHTML = `<div class="empty-search" style="grid-column:1/-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>No se encontraron recetas</span></div>`;
    return;
  }

  grid.innerHTML = data.map(r => {
    const mc = matchCount(r);
    const dots = r.ings.map(ing => `<span class="dot ${USER_INGS.includes(ing.toLowerCase()) ? 'dot--filled' : 'dot--empty'}"></span>`).join('');
    const isFav = favorites.has(r.id);
    return `
      <div class="recipe-card" onclick="openModal(${r.id})">
        <div class="card-image">
          <div class="card-image-placeholder">${r.emoji}</div>
          <span class="badge badge--${r.badge}">${r.badgeLabel}</span>
          <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav(event,${r.id})" title="${isFav ? 'Quitar favorito' : 'Guardar'}">
            <svg viewBox="0 0 24 24" fill="${isFav ? '#e53935' : 'none'}" stroke="${isFav ? '#e53935' : '#6b7280'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          <div class="match-bar">
            <span class="match-text">${mc} de ${r.ings.length} ingredientes coinciden</span>
            <div class="match-dots">${dots}</div>
          </div>
        </div>
        <div class="card-body">
          <div class="card-title">${r.name}</div>
          <div class="card-meta">
            <div class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${r.time} min
            </div>
            <div class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c0 6-6 10-6 14a6 6 0 0 0 12 0c0-4-6-8-6-14z"/></svg>
              ${r.kcal} kcal
            </div>
          </div>
          <div class="card-tags">
            ${r.ings.map(ing => `<span class="ing-tag ${USER_INGS.includes(ing.toLowerCase()) ? 'ing-tag--match' : 'ing-tag--missing'}">${ing}</span>`).join('')}
          </div>
        </div>
      </div>`;
  }).join('');
}

function toggleFav(e, id) {
  e.stopPropagation();
  if (favorites.has(id)) {
    favorites.delete(id);
    showToast('Eliminado de favoritos');
  } else {
    favorites.add(id);
    showToast('✓ Guardado en favoritos');
  }
  renderGrid();
}

function setFilter(f, btn) {
  activeFilter = f;
  visibleCount = 6;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.className = 'filter-btn ' + (b === btn ? 'filter-btn--active' : 'filter-btn--inactive');
  });
  renderGrid();
}

function filterRecipes() {
  searchQ = document.getElementById('search-input').value.trim().toLowerCase();
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

function openModal(id) {
  const r = ALL_RECIPES.find(x => x.id === id);
  if (!r) return;
  const mc = matchCount(r);
  const isFav = favorites.has(r.id);
  const stepsHtml = r.steps.map((s, i) => `<div class="modal-step"><span class="step-num">${i+1}</span><span class="step-text">${s}</span></div>`).join('');
  const ingsHtml = r.ings.map(ing => `<span class="ing-tag ${USER_INGS.includes(ing.toLowerCase()) ? 'ing-tag--match' : 'ing-tag--missing'}" style="font-size:12px;padding:4px 10px">${ing}</span>`).join('');

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-img">${r.emoji}</div>
    <div class="modal-body">
      <div class="modal-header">
        <span class="modal-title">${r.name}</span>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-meta">
        <div class="modal-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${r.time} min
        </div>
        <div class="modal-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c0 6-6 10-6 14a6 6 0 0 0 12 0c0-4-6-8-6-14z"/></svg>
          ${r.kcal} kcal
        </div>
        <div class="modal-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          ${mc}/${r.ings.length} coinciden
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
          <svg width="15" height="15" viewBox="0 0 24 24" fill="${isFav ? '#e53935' : 'none'}" stroke="${isFav ? '#e53935' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          ${isFav ? 'En favoritos' : 'Guardar'}
        </button>
        <button class="btn-cook" onclick="showToast('¡Buen provecho! 🍴');closeModal()">Cocinar ahora</button>
      </div>
    </div>`;
  document.getElementById('modal').classList.add('open');
}

function toggleFavModal(id) {
  if (favorites.has(id)) { favorites.delete(id); showToast('Eliminado de favoritos'); }
  else { favorites.add(id); showToast('✓ Guardado en favoritos'); }
  renderGrid();
  openModal(id);
}

function closeModal(e) {
  if (!e || e.target === document.getElementById('modal')) {
    document.getElementById('modal').classList.remove('open');
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

// Read ingredients from URL params if coming from dashboard
const params = new URLSearchParams(location.search);
if (params.get('ings')) {
  const ings = params.get('ings').split(',').map(s => s.trim().toLowerCase());
  ings.forEach(i => { if (!USER_INGS.includes(i)) USER_INGS.push(i); });
  document.getElementById('ing-display').textContent = USER_INGS.map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(', ');
}

renderGrid();
