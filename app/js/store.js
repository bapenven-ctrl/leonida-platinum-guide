// Progress store: earned set, tracked counters and the spoiler setting,
// persisted in localStorage, with JSON export / import round-tripping.

const KEY = 'leonida-platinum-progress-v1';

export function emptyProgress() {
  return { earned: [], counters: {}, spoiler: false };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const data = JSON.parse(raw);
    return {
      earned: Array.isArray(data.earned) ? data.earned.filter((n) => Number.isInteger(n)) : [],
      counters: data.counters && typeof data.counters === 'object' ? data.counters : {},
      spoiler: data.spoiler === true,
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Storage can be unavailable (private mode); the guide still works.
  }
}

export function isEarned(progress, id) {
  return progress.earned.includes(id);
}

export function toggleEarned(progress, id) {
  const at = progress.earned.indexOf(id);
  if (at === -1) progress.earned.push(id);
  else progress.earned.splice(at, 1);
  progress.earned.sort((a, b) => a - b);
  saveProgress(progress);
}

export function setCounter(progress, id, value) {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  progress.counters[id] = n;
  saveProgress(progress);
}

export function setSpoiler(progress, on) {
  progress.spoiler = on === true;
  saveProgress(progress);
}

export function resetProgress() {
  const fresh = emptyProgress();
  saveProgress(fresh);
  return fresh;
}

// Demo progress used only for the ?shot= screenshots, so the contact sheet
// shows a tracker mid-run: a believable spread of story and activity wins,
// plus three counters part-way to their targets.
export function demoProgress() {
  return {
    earned: [2, 3, 4, 5, 8, 9, 10, 16, 20, 21, 35, 44, 46],
    counters: { 17: 31, 15: 140, 31: 57 },
    spoiler: false,
  };
}

export function exportProgress(progress) {
  const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-platinum-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function importProgress(file, done) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      const clean = {
        earned: Array.isArray(data.earned) ? data.earned.filter((n) => Number.isInteger(n)) : [],
        counters: data.counters && typeof data.counters === 'object' ? data.counters : {},
        spoiler: data.spoiler === true,
      };
      saveProgress(clean);
      done(clean);
    } catch {
      done(null);
    }
  };
  reader.onerror = () => done(null);
  reader.readAsText(file);
}
