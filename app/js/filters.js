// Filtering for the checklist: kind chips, grade and status selects, the
// search box, and the spoiler-shield rule for unearned story trophies.

export function defaultFilters() {
  return { q: '', kind: 'all', grade: 'all', status: 'all' };
}

export function matchesFilters(trophy, filters, progress) {
  if (filters.kind === 'missable') {
    if (!trophy.missable) return false;
  } else if (filters.kind !== 'all' && trophy.kind !== filters.kind) {
    return false;
  }
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  const earned = progress.earned.includes(trophy.id);
  if (filters.status === 'earned' && !earned) return false;
  if (filters.status === 'unearned' && earned) return false;
  const q = filters.q.trim().toLowerCase();
  if (q) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

// The spoiler shield hides the name and description of an unearned story
// trophy; earned story trophies and everything else stay readable.
export function isShielded(trophy, progress) {
  return progress.spoiler === true
    && trophy.kind === 'story'
    && !progress.earned.includes(trophy.id);
}

export const SHIELD_TEXT = 'Hidden story trophy — earn it to reveal';
