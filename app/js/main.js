// Boot and routing for Leonida Platinum: loads the trophy data, holds the
// view state, wires the toolbar, and applies the ?shot= demo seeding the
// screenshots are taken with.

import {
  loadProgress, saveProgress, toggleEarned, setCounter, setSpoiler,
  resetProgress, demoProgress, exportProgress, importProgress,
} from './store.js';
import { defaultFilters, matchesFilters } from './filters.js';
import { renderHeader, renderChecklist, renderRoadmap, renderMissables } from './views.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');

let trophies = [];
let progress = loadProgress();
let filters = defaultFilters();
let view = 'checklist';
let selectedId = null;

// Screenshot seeding: only when ?shot is present. Normal visits start clean
// unless saved progress exists.
if (shot) {
  progress = demoProgress();
  if (shot === '1') {
    view = 'checklist';
    selectedId = 17;
    progress.spoiler = true;
  } else if (shot === '2') {
    view = 'roadmap';
  } else if (shot === '3') {
    view = 'missables';
  } else if (shot === '4') {
    view = 'checklist';
    filters.kind = 'activities';
    selectedId = 40;
  }
}

const main = document.getElementById('main');

function visibleTrophies() {
  if (view !== 'checklist') return trophies;
  return trophies.filter((t) => matchesFilters(t, filters, progress));
}

function render() {
  renderHeader(trophies, progress);
  document.querySelectorAll('.view-tabs .tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.view === view);
  });
  document.getElementById('toolbar').style.display = view === 'checklist' ? '' : 'none';
  document.querySelectorAll('#kind-chips .chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.kind === filters.kind);
  });
  document.getElementById('q').value = filters.q;
  document.getElementById('grade').value = filters.grade;
  document.getElementById('status').value = filters.status;
  document.getElementById('spoiler').checked = progress.spoiler;
  if (view === 'checklist') renderChecklist(main, visibleTrophies(), progress, selectedId);
  else if (view === 'roadmap') renderRoadmap(main, trophies, progress);
  else renderMissables(main, trophies, progress);
}

function wire() {
  document.querySelectorAll('.view-tabs .tab').forEach((tab) => {
    tab.addEventListener('click', () => { view = tab.dataset.view; render(); });
  });
  document.getElementById('q').addEventListener('input', (e) => { filters.q = e.target.value; render(); });
  document.getElementById('grade').addEventListener('change', (e) => { filters.grade = e.target.value; render(); });
  document.getElementById('status').addEventListener('change', (e) => { filters.status = e.target.value; render(); });
  document.querySelectorAll('#kind-chips .chip').forEach((chip) => {
    chip.addEventListener('click', () => { filters.kind = chip.dataset.kind; render(); });
  });
  document.getElementById('spoiler').addEventListener('change', (e) => { setSpoiler(progress, e.target.checked); render(); });
  document.getElementById('export').addEventListener('click', () => exportProgress(progress));
  document.getElementById('import').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    importProgress(file, (clean) => { if (clean) { progress = clean; render(); } });
    e.target.value = '';
  });
  document.getElementById('reset').addEventListener('click', () => {
    progress = resetProgress();
    selectedId = null;
    render();
  });
  main.addEventListener('click', (e) => {
    const check = e.target.closest('[data-check]');
    if (check) {
      toggleEarned(progress, Number(check.dataset.check));
      render();
      return;
    }
    const row = e.target.closest('[data-row]');
    if (row) {
      selectedId = Number(row.dataset.row);
      render();
    }
  });
  main.addEventListener('change', (e) => {
    const counter = e.target.closest('[data-counter]');
    if (counter) {
      setCounter(progress, Number(counter.dataset.counter), counter.value);
      renderHeader(trophies, progress);
    }
  });
}

fetch('data/trophies.json')
  .then((r) => r.json())
  .then((data) => {
    trophies = data.trophies;
    if (shot) saveProgress(progress);
    wire();
    render();
  })
  .catch(() => {
    main.innerHTML = '<p class="empty">The trophy data could not be loaded.</p>';
  });
