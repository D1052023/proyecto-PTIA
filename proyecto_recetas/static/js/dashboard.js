const TIPS = [
  { emoji: '🍅', name: 'Pasta al pomodoro',  tags: ['Tomate', 'Ajo', 'Albahaca'], time: '20 min', kcal: '320 kcal', badge: 'ITALIANA',   match: 2 },
  { emoji: '🥚', name: 'Tortilla española',  tags: ['Huevo', 'Papa', 'Cebolla'],  time: '25 min', kcal: '350 kcal', badge: 'SALUDABLE',  match: 3 },
  { emoji: '🍗', name: 'Pollo al limón',     tags: ['Pollo', 'Limón', 'Ajo'],     time: '35 min', kcal: '410 kcal', badge: 'TRADICIONAL', match: 2 },
  { emoji: '🥑', name: 'Bowl de aguacate',   tags: ['Aguacate', 'Arroz', 'Limón'],time: '15 min', kcal: '280 kcal', badge: 'VEGANO',      match: 1 },
];

const BADGE_COLORS = {
  SALUDABLE:   '#4caf50',
  TRADICIONAL: '#ff9800',
  VEGANO:      '#8bc34a',
  ITALIANA:    '#e91e63',
  RAPIDA:      '#2196f3',
};

const ingrs = [];
let inp, chips, list, ctr, btn, toast, tipsGrid;

document.addEventListener('DOMContentLoaded', () => {
  inp      = document.getElementById('ing-input');
  chips    = document.getElementById('chips');
  list     = document.getElementById('list');
  ctr      = document.getElementById('counter');
  btn      = document.getElementById('btn-recipes');
  toast    = document.getElementById('toast');
  tipsGrid = document.getElementById('tips-grid');

  /* Renderizar tips como recipe cards */
  TIPS.forEach(t => {
    const total = t.tags.length;
    const filled = t.match;
    const empty  = total - filled;
    const color  = BADGE_COLORS[t.badge] || '#4caf50';

    const dots = [
      ...Array(filled).fill('<span class="tip-dot tip-dot--filled"></span>'),
      ...Array(empty).fill('<span class="tip-dot tip-dot--empty"></span>'),
    ].join('');

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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${t.time}
          </span>
          <span class="tip-meta-item">
            🔥 ${t.kcal}
          </span>
        </div>
        <div class="tip-tags">${tagsHTML}</div>
      </div>`;

    card.addEventListener('click', () => addTip(t.tags));
    tipsGrid.appendChild(card);
  });

  inp.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
});

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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
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