import './style.css';
import trashPng          from './assets/trash.png';
import calendarPng       from './assets/calendar.png';
import closePng          from './assets/close.png';
import sunPng            from './assets/sun.png';
import cloudPng          from './assets/cloud.png';
import cloudDrizzlePng   from './assets/cloud-drizzle.png';
import cloudRainPng      from './assets/cloud-rain.png';
import cloudSnowPng      from './assets/cloud-snow.png';
import cloudLightningPng from './assets/cloud-lightning.png';

const COLORS = ['#FFF6E7', '#E5FFE6', '#F3E4F7', '#EDBBB4', '#ECECEC'];
const DARK_BG = new Set(['#525252', '#000000']);
const grid = document.getElementById('listsGrid');
const emptyState = document.getElementById('emptyState');
const bulkBar = document.getElementById('bulkBar');
const bulkCount = document.getElementById('bulkCount');

let colorIdx = 0, uid = 1;
let activeTab = 'all', sortOrder = 'oldest', searchQuery = '';

/* ── Icon helpers ── */
const mkIcon = (src, size) =>
  `<img src="${src}" width="${size}" height="${size}" alt="" aria-hidden="true" style="display:block">`;

const TRASH_SVG = mkIcon(trashPng,    15);
const CAL_SVG   = mkIcon(calendarPng, 13);
const CLOSE_SVG = mkIcon(closePng,    11);

function weatherImg(code) {
  const src = code === 0 ? sunPng
    : code <= 3  ? cloudPng
    : code <= 48 ? cloudDrizzlePng
    : code <= 67 ? cloudRainPng
    : code <= 77 ? cloudSnowPng
    : cloudLightningPng;
  return `<img src="${src}" width="16" height="16" alt="" aria-hidden="true" style="display:inline-block;vertical-align:middle;margin-right:4px">`;
}

/* ── Helpers ── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function el(tag, props = {}, ...children) {
  const e = Object.assign(document.createElement(tag), props);
  children.forEach(c => e.append(c));
  return e;
}

function formatDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d), now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = (date - today) / 864e5;
  return diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── Task item ── */
function buildTaskItem(text, done = false) {
  const li = el('li', { className: 'task-item' + (done ? ' done' : '') });
  li.dataset.createdAt = Date.now();

  const selCb = el('input', { type: 'checkbox', className: 'task-select', ariaLabel: 'Select task' });
  const cb    = el('input', { type: 'checkbox', className: 'task-check', checked: done });
  const span  = el('span', { className: 'task-text', textContent: text });
  const del   = el('button', { className: 'delete-task-btn', ariaLabel: 'Delete task', innerHTML: CLOSE_SVG });

  li.append(selCb, cb, span, del);
  return li;
}

/* ── Card ── */
function buildCard({ title = '', date = '', dateISO = '', color, tasks = [] }) {
  const dark = DARK_BG.has(color);
  const card = el('article', { className: 'todo-card' + (dark ? ' dark' : '') });
  card.style.background = color;

  // Title
  const titleEl = el('h2', { className: 'card-title', contentEditable: 'true', spellcheck: false, textContent: title });
  titleEl.dataset.placeholder = 'Add Title';
  const delCardBtn = el('button', { className: 'delete-card-btn', ariaLabel: 'Delete list', innerHTML: TRASH_SVG });
  const top = el('div', { className: 'card-top' }, titleEl, delCardBtn);

  // Date
  const dateDisplay = el('span', { className: 'date-display' + (date ? '' : ' placeholder'), textContent: date || 'Due to' });
  const datePicker  = el('input', { className: 'date-picker' });
  datePicker.setAttribute('type', 'date');
  if (dateISO) datePicker.value = dateISO;
  const dateRow = el('div', { className: 'card-date', innerHTML: CAL_SVG });
  dateRow.append(dateDisplay, datePicker);

  // Tasks
  const ul = el('ul', { className: 'task-list' });
  tasks.forEach(t => ul.append(buildTaskItem(t.text, t.done)));

  // Add input
  const addInput = el('input', { type: 'text', className: 'add-task-input', placeholder: '+ Add a task' });
  const addRow   = el('div', { className: 'add-task-row' }, addInput);

  card.append(top, dateRow, ul, addRow);

  /* Events */
  delCardBtn.onclick = () => { card.remove(); refreshBulkBar(); checkEmptyState(); };

  titleEl.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); titleEl.blur(); } });
  titleEl.addEventListener('input',   () => { if (titleEl.innerHTML === '<br>') titleEl.innerHTML = ''; });

  dateRow.onclick = () => { try { datePicker.showPicker(); } catch { datePicker.click(); } };
  datePicker.onchange = () => {
    const label = formatDate(datePicker.value);
    dateDisplay.textContent = label || 'Due to';
    dateDisplay.classList.toggle('placeholder', !label);
  };

  ul.addEventListener('change', e => {
    if (e.target.classList.contains('task-check')) {
      e.target.closest('.task-item').classList.toggle('done', e.target.checked);
      applyFiltersAndSort();
    } else if (e.target.classList.contains('task-select')) {
      refreshBulkBar();
    }
  });

  ul.addEventListener('click', e => {
    const btn = e.target.closest('.delete-task-btn');
    if (btn) { btn.closest('.task-item').remove(); refreshBulkBar(); checkEmptyState(); }
  });

  addInput.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const text = addInput.value.trim();
    if (!text) return;
    ul.append(buildTaskItem(text));
    addInput.value = '';
    applyFiltersAndSort();
  });

  return card;
}

/* ── Filter & Sort ── */
function applyFiltersAndSort() {
  const query = searchQuery.toLowerCase().trim();
  const noFilter = activeTab === 'all' && !query;

  $$('.todo-card', grid).forEach(card => {
    const ul = $('.task-list', card);
    const items = $$('.task-item', ul);

    // Sort
    [...items].sort((a, b) => {
      const tA = $('.task-text', a).textContent.toLowerCase();
      const tB = $('.task-text', b).textContent.toLowerCase();
      const cA = +a.dataset.createdAt, cB = +b.dataset.createdAt;
      if (sortOrder === 'az') return tA.localeCompare(tB);
      if (sortOrder === 'za') return tB.localeCompare(tA);
      if (sortOrder === 'newest') return cB - cA;
      return cA - cB;
    }).forEach(i => ul.append(i));

    // Filter
    let visible = 0;
    items.forEach(item => {
      const match =
        (query === '' || $('.task-text', item).textContent.toLowerCase().includes(query)) &&
        (activeTab === 'all' ||
         (activeTab === 'active'    && !item.classList.contains('done')) ||
         (activeTab === 'completed' &&  item.classList.contains('done')));
      item.classList.toggle('hidden', !match);
      if (match) visible++;
    });

    card.classList.toggle('card-hidden', !noFilter && visible === 0);
  });

  checkEmptyState();
}

function checkEmptyState() {
  const total  = $$('.todo-card', grid).length;
  const hidden = $$('.todo-card.card-hidden', grid).length;
  const noFilter = activeTab === 'all' && !searchQuery.trim();
  emptyState.hidden = !(total > 0 && !noFilter && hidden === total);
}

/* ── Bulk bar ── */
function refreshBulkBar() {
  const n = $$('.task-select:checked').length;
  bulkCount.textContent = `${n} selected`;
  bulkBar.classList.toggle('has-selection', n > 0);
}

function setSelectVisible(show) {
  $$('.task-select').forEach(cb => { cb.classList.toggle('visible', show); if (!show) cb.checked = false; });
}

/* ── Search ── */
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  searchClear.classList.toggle('visible', !!searchQuery);
  applyFiltersAndSort();
});
searchClear.onclick = () => {
  searchInput.value = searchQuery = '';
  searchClear.classList.remove('visible');
  applyFiltersAndSort();
  searchInput.focus();
};

/* ── Tabs ── */
document.addEventListener('click', e => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  $$('.tab').forEach(b => b.classList.remove('active'));
  tab.classList.add('active');
  activeTab = tab.dataset.tab;
  applyFiltersAndSort();
});

/* ── Sort dropdown ── */
const sortWrap    = document.getElementById('sortWrap');
const sortTrigger = document.getElementById('sortTrigger');
const sortMenu    = document.getElementById('sortMenu');
const sortLabel   = document.getElementById('sortLabel');

sortTrigger.addEventListener('click', e => {
  e.stopPropagation();
  const open = sortMenu.classList.toggle('open');
  sortTrigger.setAttribute('aria-expanded', open);
});

sortMenu.addEventListener('click', e => {
  const opt = e.target.closest('.sort-option');
  if (!opt) return;
  sortOrder = opt.dataset.value;
  sortLabel.textContent = opt.textContent.trim();
  $$('.sort-option', sortMenu).forEach(o => o.classList.remove('active'));
  opt.classList.add('active');
  sortMenu.classList.remove('open');
  sortTrigger.setAttribute('aria-expanded', 'false');
  applyFiltersAndSort();
});

document.addEventListener('click', e => {
  if (!sortWrap.contains(e.target)) {
    sortMenu.classList.remove('open');
    sortTrigger.setAttribute('aria-expanded', 'false');
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && sortMenu.classList.contains('open')) {
    sortMenu.classList.remove('open');
    sortTrigger.setAttribute('aria-expanded', 'false');
    sortTrigger.focus();
  }
});

/* ── Bulk actions ── */
document.getElementById('selectAllBtn').onclick = () => {
  setSelectVisible(true);
  $$('.task-item:not(.hidden) .task-select').forEach(cb => cb.checked = true);
  refreshBulkBar();
};
document.getElementById('unselectAllBtn').onclick = () => {
  setSelectVisible(false);
  refreshBulkBar();
};
document.getElementById('deleteSelectedBtn').onclick = () => {
  $$('.task-select:checked').forEach(cb => cb.closest('.task-item').remove());
  setSelectVisible(false);
  refreshBulkBar();
  checkEmptyState();
};

/* ── Add list ── */
document.getElementById('addListBtn').onclick = () => {
  const color = COLORS[colorIdx++ % COLORS.length];
  const card = buildCard({ color });
  grid.append(card);
  $('.card-title', card).focus();
  if ($$('.task-select.visible').length) $$('.task-select', card).forEach(cb => cb.classList.add('visible'));
  checkEmptyState();
};

/* ── Date & Weather ── */
document.getElementById('currentDate').textContent =
  new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

(async () => {
  try {
    const { latitude: lat, longitude: lon } = await (await fetch('https://ipapi.co/json/')).json();
    if (!lat) return;
    const { current: { temperature_2m: temp, weather_code: code } } =
      await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`)).json();
    document.getElementById('weather').innerHTML = `${weatherImg(code)}${Math.round(temp)}°C`;
  } catch { /* silent */ }
})();
