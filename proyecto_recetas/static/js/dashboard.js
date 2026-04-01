const TIPS = [
  { emoji: '🍅', name: 'Pasta al pomodoro', tags: ['Tomate', 'Ajo', 'Albahaca'], time: '20 min' },
  { emoji: '🥚', name: 'Tortilla española', tags: ['Huevo', 'Papa', 'Cebolla'], time: '25 min' },
  { emoji: '🍗', name: 'Pollo al limón', tags: ['Pollo', 'Limón', 'Ajo'], time: '35 min' },
  { emoji: '🥑', name: 'Bowl de aguacate', tags: ['Aguacate', 'Arroz', 'Limón'], time: '15 min' },
];

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

  /* Renderizar tips */
  TIPS.forEach(t => {
    tipsGrid.innerHTML += `
      <div class="tip-card" onclick="addTip(${JSON.stringify(t.tags).replace(/"/g, "'")})">
        <span class="tip-emoji">${t.emoji}</span>
        <p class="tip-name">${t.name}</p>
        <p class="tip-desc">${t.tags.join(' · ')}</p>
        <span class="tip-tag">⏱ ${t.time}</span>
      </div>`;
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