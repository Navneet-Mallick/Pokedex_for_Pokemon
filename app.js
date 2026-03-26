const ALL_TYPES = [
  'fire', 'water', 'grass', 'electric', 'poison', 'normal',
  'psychic', 'bug', 'dragon', 'ice', 'fighting', 'flying',
  'ground', 'rock', 'ghost', 'steel', 'dark', 'fairy'
];

const TYPE_COLORS = {
  fire:     '#ff6b35',
  water:    '#4fc3f7',
  grass:    '#66bb6a',
  electric: '#ffd740',
  poison:   '#ce93d8',
  normal:   '#a0aec0',
  psychic:  '#f48fb1',
  bug:      '#aed581',
  dragon:   '#7986cb',
  ice:      '#80deea',
  fighting: '#ef9a9a',
  flying:   '#90caf9',
  ground:   '#ffcc80',
  rock:     '#bcaaa4',
  ghost:    '#9575cd',
  steel:    '#b0bec5',
  dark:     '#78909c',
  fairy:    '#f48fb1',
};

const TOTAL = 150;
const DEFAULT_SHOW = 30;

let allPokemon = [];
let activeType = '';

// ─── DOM REFERENCES ───────────────────────────────────────
const grid          = document.getElementById('grid');
const searchInput   = document.getElementById('searchName');
const sortSelect    = document.getElementById('sortBy');
const heightSelect  = document.getElementById('filterHeight');
const resetBtn      = document.getElementById('resetBtn');
const countText     = document.getElementById('countText');
const loadingFill   = document.getElementById('loadingFill');
const typePills     = document.getElementById('typePills');
const modalOverlay  = document.getElementById('modalOverlay');
const modalClose    = document.getElementById('modalClose');
const modalImg      = document.getElementById('modalImg');
const modalId       = document.getElementById('modalId');
const modalName     = document.getElementById('modalName');
const modalTypes    = document.getElementById('modalTypes');
const modalStats    = document.getElementById('modalStats');
const statBars      = document.getElementById('statBars');

// ─── BUILD TYPE PILLS ─────────────────────────────────────
ALL_TYPES.forEach(type => {
  const pill = document.createElement('span');
  pill.className = `pill t-${type}`;
  pill.textContent = type;
  pill.addEventListener('click', () => {
    activeType = activeType === type ? '' : type;
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    if (activeType) pill.classList.add('active');
    applyFilters();
  });
  typePills.appendChild(pill);
});

// ─── FETCH POKEMON ────────────────────────────────────────
async function loadPokemon() {
  for (let i = 1; i <= TOTAL; i++) {
    try {
      const res  = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
      const data = await res.json();

      allPokemon.push({
        id:      data.id,
        name:    data.name,
        image:   data.sprites.front_default,
        types:   data.types.map(t => t.type.name),
        hp:      data.stats[0].base_stat,
        attack:  data.stats[1].base_stat,
        defense: data.stats[2].base_stat,
        speed:   data.stats[5].base_stat,
        height:  data.height / 10,
        weight:  data.weight / 10,
      });

      const progress = (i / TOTAL) * 100;
      loadingFill.style.width = `${progress}%`;

      if (i === TOTAL) {
        loadingFill.classList.add('done');
      }

      applyFilters();
    } catch (err) {
      console.error(`Failed to fetch Pokémon #${i}`, err);
    }
  }
}

// ─── FILTER & SORT LOGIC ─────────────────────────────────
function isFiltering() {
  return (
    searchInput.value.trim() !== '' ||
    activeType !== '' ||
    heightSelect.value !== ''
  );
}

function applyFilters() {
  const name         = searchInput.value.toLowerCase().trim();
  const sortBy       = sortSelect.value;
  const heightFilter = heightSelect.value;

  const pool = isFiltering() ? allPokemon : allPokemon.slice(0, DEFAULT_SHOW);

  let filtered = pool.filter(p => {
    const matchName   = p.name.includes(name);
    const matchType   = !activeType || p.types.includes(activeType);
    let   matchHeight = true;

    if (heightFilter === 'small')  matchHeight = p.height < 0.5;
    if (heightFilter === 'medium') matchHeight = p.height >= 0.5 && p.height <= 1;
    if (heightFilter === 'large')  matchHeight = p.height > 1;

    return matchName && matchType && matchHeight;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'name')   return a.name.localeCompare(b.name);
    if (sortBy === 'hp')     return b.hp - a.hp;
    if (sortBy === 'height') return b.height - a.height;
    if (sortBy === 'weight') return b.weight - a.weight;
    return a.id - b.id;
  });

  renderCards(filtered);
  updateStatusText(filtered.length);
}

function updateStatusText(count) {
  const total = allPokemon.length;
  if (isFiltering()) {
    countText.textContent = `${count} result${count !== 1 ? 's' : ''} found (${total} loaded)`;
  } else {
    countText.textContent = `Showing ${count} of ${total} loaded — search to explore all`;
  }
}

// ─── RENDER CARDS ─────────────────────────────────────────
function renderCards(list) {
  grid.innerHTML = '';

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty">
        <div class="big">😶</div>
        <p>No Pokémon found. Try a different search.</p>
      </div>
    `;
    return;
  }

  list.forEach((pokemon, idx) => {
    const color = TYPE_COLORS[pokemon.types[0]] || '#fff';
    const card  = createCard(pokemon, color, idx);
    grid.appendChild(card);
  });
}

function createCard(pokemon, color, idx) {
  const types = pokemon.types
    .map(t => `<span class="type-tag t-${t}">${t}</span>`)
    .join('');

  const card = document.createElement('div');
  card.className = 'card';
  card.style.setProperty('--card-color', color);
  card.style.animationDelay = `${idx * 0.05}s`;

  card.innerHTML = `
    <div class="card-number">#${String(pokemon.id).padStart(3, '0')}</div>
    <div class="card-img-wrap" style="--card-color: ${color}">
      <img src="${pokemon.image}" alt="${pokemon.name}" loading="lazy" />
    </div>
    <div class="card-name">${pokemon.name}</div>
    <div class="types">${types}</div>
    <div class="card-stats">
      <div class="stat">
        <div class="stat-val">${pokemon.hp}</div>
        <div class="stat-lbl">HP</div>
      </div>
      <div class="stat">
        <div class="stat-val">${pokemon.height}m</div>
        <div class="stat-lbl">Height</div>
      </div>
      <div class="stat">
        <div class="stat-val">${pokemon.weight}kg</div>
        <div class="stat-lbl">Weight</div>
      </div>
    </div>
  `;

  card.addEventListener('click', () => openModal(pokemon));
  return card;
}

// ─── MODAL ────────────────────────────────────────────────
function openModal(pokemon) {
  const types = pokemon.types
    .map(t => `<span class="type-tag t-${t}">${t}</span>`)
    .join('');

  modalImg.src            = pokemon.image;
  modalImg.alt            = pokemon.name;
  modalId.textContent     = `#${String(pokemon.id).padStart(3, '0')}`;
  modalName.textContent   = pokemon.name;
  modalTypes.innerHTML    = types;

  modalStats.innerHTML = `
    <div class="modal-stat">
      <span class="modal-stat-lbl">HP</span>
      <span class="modal-stat-val">${pokemon.hp}</span>
    </div>
    <div class="modal-stat">
      <span class="modal-stat-lbl">Attack</span>
      <span class="modal-stat-val">${pokemon.attack}</span>
    </div>
    <div class="modal-stat">
      <span class="modal-stat-lbl">Defense</span>
      <span class="modal-stat-val">${pokemon.defense}</span>
    </div>
    <div class="modal-stat">
      <span class="modal-stat-lbl">Speed</span>
      <span class="modal-stat-val">${pokemon.speed}</span>
    </div>
    <div class="modal-stat">
      <span class="modal-stat-lbl">Height</span>
      <span class="modal-stat-val">${pokemon.height}m</span>
    </div>
    <div class="modal-stat">
      <span class="modal-stat-lbl">Weight</span>
      <span class="modal-stat-val">${pokemon.weight}kg</span>
    </div>
  `;

  const statList = [
    { name: 'HP',      val: pokemon.hp,      max: 255 },
    { name: 'Attack',  val: pokemon.attack,  max: 190 },
    { name: 'Defense', val: pokemon.defense, max: 230 },
    { name: 'Speed',   val: pokemon.speed,   max: 200 },
  ];

  statBars.innerHTML = statList.map(s => `
    <div class="stat-bar-label">
      <span>${s.name}</span>
      <span>${s.val}</span>
    </div>
    <div class="stat-bar">
      <div class="stat-bar-fill" style="width: ${(s.val / s.max) * 100}%"></div>
    </div>
  `).join('');

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ─── EVENT LISTENERS ──────────────────────────────────────
searchInput.addEventListener('input', applyFilters);
sortSelect.addEventListener('change', applyFilters);
heightSelect.addEventListener('change', applyFilters);

resetBtn.addEventListener('click', () => {
  searchInput.value   = '';
  sortSelect.value    = 'id';
  heightSelect.value  = '';
  activeType          = '';
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  applyFilters();
});

modalClose.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ─── INIT ─────────────────────────────────────────────────
loadPokemon();
