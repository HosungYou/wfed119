const VALUES_URL = 'values.json';
const BUCKETS = ['very_important', 'important', 'somewhat_important', 'not_important'];

function storageKey(set) { return `values-layout:${set}`; }

async function fetchValues() {
  const res = await fetch(VALUES_URL);
  if (!res.ok) throw new Error('Failed to load values.json');
  return res.json();
}

function makeNote(id, label, desc) {
  const el = document.createElement('div');
  el.className = 'note';
  el.draggable = true;
  el.dataset.id = id;
  el.innerHTML = `<div class="label"></div><div class="desc"></div>`;
  el.querySelector('.label').textContent = label;
  el.querySelector('.desc').textContent = desc || '';
  el.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  });
  return el;
}

function mountPalette(values) {
  const palette = document.getElementById('palette');
  palette.innerHTML = '';
  values.forEach(v => palette.appendChild(makeNote(v.id, v.label, v.desc)));
}

function saveLayout(set) {
  const layout = {};
  BUCKETS.forEach(b => {
    const ids = Array.from(document.getElementById(b).querySelectorAll('.note')).map(n => n.dataset.id);
    layout[b] = ids;
  });
  localStorage.setItem(storageKey(set), JSON.stringify(layout));
}

function loadLayout(set) {
  try {
    const raw = localStorage.getItem(storageKey(set));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setupDnD(currentSet) {
  document.querySelectorAll('.droppable').forEach(area => {
    area.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
    area.addEventListener('drop', (e) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      const note = document.querySelector(`.note[data-id="${CSS.escape(id)}"]`);
      if (note) area.appendChild(note);
      saveLayout(currentSet.value);
    });
  });
}

function clearBoards() {
  BUCKETS.forEach(b => document.getElementById(b).innerHTML = '');
}

function populateFromLayout(set, values) {
  clearBoards();
  const layout = loadLayout(set);
  const byId = Object.fromEntries(values.map(v => [v.id, v]));
  let placed = new Set();
  if (layout) {
    BUCKETS.forEach(b => {
      (layout[b] || []).forEach(id => {
        if (byId[id]) {
          document.getElementById(b).appendChild(makeNote(id, byId[id].label, byId[id].desc));
          placed.add(id);
        }
      });
    });
  }
  // Remaining go to palette
  const remaining = values.filter(v => !placed.has(v.id));
  mountPalette(remaining);
}

function materialize(set, allValues) {
  const values = allValues[set] || [];
  populateFromLayout(set, values);
}

async function main() {
  const setSelect = document.getElementById('set-select');
  const data = await fetchValues();
  setupDnD(setSelect);
  materialize(setSelect.value, data);

  setSelect.addEventListener('change', () => materialize(setSelect.value, data));
  document.getElementById('reset').addEventListener('click', () => {
    localStorage.removeItem(storageKey(setSelect.value));
    materialize(setSelect.value, data);
  });
  document.getElementById('export').addEventListener('click', () => {
    const layout = loadLayout(setSelect.value) || {};
    const payload = { set: setSelect.value, layout };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `values_${setSelect.value}_layout.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

main().catch(err => {
  alert('Failed to initialize: ' + err.message);
  console.error(err);
});

