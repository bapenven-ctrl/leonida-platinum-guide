// Rendering: header stats, the next-up strip, the checklist with its detail
// pane, the six-stage platinum roadmap and the missables view.

import { isShielded, SHIELD_TEXT } from './filters.js';

export const STAGES = [
  { n: 1, title: 'Story first, in order', why: 'The chapters and named story missions unlock in sequence, so play the story straight through. Two guests ride along inside this stage: the VCIA departure, which belongs to the VCIA Takedown mission window, and the final mission, which closes the stage and the story together.' },
  { n: 2, title: 'Side stories & partners', why: 'Once the story is rolling, clear the character strands: the final missions for Andy, Kenton, Billy, Randy and Tyrone, plus the eight stranger strands. The two partner trophies live here too, while a partner is regularly at your side.' },
  { n: 3, title: 'Collectibles & exploration', why: 'With the map open, sweep the collection work: meditation spots, card sets, WAiNK locations, vehicles, the full map of Leonida, garages and Scooter Bros registrations. These reward one deliberate pass rather than scattered trips.' },
  { n: 4, title: 'Activities & challenges', why: 'The structured tests: stunts, shooting-range golds, drone races, races, the fishing and arcade wins, and the challenge count. Several carry tracked counters, so work them steadily instead of in one sitting.' },
  { n: 5, title: 'Free-roam feats & money', why: 'Everything the open world lets you attempt at any moment: robberies, combat feats, odd one-off moments, and the two big money totals. Dip into these between other stages whenever a chance appears.' },
  { n: 6, title: 'The 100% push, then platinum', why: 'The endgame is accounting: the 100% completion trophy confirms nothing was left behind anywhere in Leonida, and the platinum follows automatically once the other 54 trophies are earned.' },
];

// Roadmap order inside stage 1 follows the story itself: chapters and named
// missions in play order, the VCIA departure during its mission, the final
// mission last.
const STAGE_ONE_ORDER = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 37, 7];

export function roadmapOrder(trophies) {
  const byStage = new Map(STAGES.map((s) => [s.n, []]));
  for (const t of trophies) byStage.get(t.stage).push(t);
  const out = [];
  for (const s of STAGES) {
    const list = byStage.get(s.n);
    if (s.n === 1) list.sort((a, b) => STAGE_ONE_ORDER.indexOf(a.id) - STAGE_ONE_ORDER.indexOf(b.id));
    else list.sort((a, b) => a.id - b.id);
    out.push(...list);
  }
  return out;
}

function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function kindLabel(kind) {
  return { story: 'Story', collectibles: 'Collectibles', activities: 'Activities' }[kind] || kind;
}

function shortSourceName(name) {
  if (name.includes('Exophase')) return 'Exophase (official list)';
  if (name.includes('PSNProfiles')) return 'PSNProfiles (counts)';
  if (name.includes('PowerPyx')) return 'PowerPyx (watch report)';
  if (name.includes('Leonida Platinum')) return 'Leonida Platinum roadmap notes';
  return name;
}

// Bare source names for the one-line source note on each checklist row:
// names only, no URLs, no annotations.
function rowSourceName(name) {
  if (name.includes('Exophase')) return 'Exophase';
  if (name.includes('PSNProfiles')) return 'PSNProfiles';
  if (name.includes('PowerPyx')) return 'PowerPyx';
  if (name.includes('Leonida Platinum')) return 'Leonida Platinum roadmap notes';
  return name;
}

// The counter chip carries the count's unit only when the unit is short
// enough to fit on the row; longer labels stay in the detail pane's stepper.
function shortUnit(label) {
  if (!label) return '';
  return label.length <= 16 ? ` ${label}` : '';
}

// A guide is written as three movements: what to do, where and how, and the
// timing. Split it back into those labelled parts for the detail pane.
export function guideParts(guide) {
  const sentences = guide.match(/[^.!?]+[.!?]+/g) || [guide];
  const clean = sentences.map((s) => s.trim()).filter(Boolean);
  if (clean.length <= 2) return { what: guide, how: '', when: '' };
  return {
    what: clean[0],
    how: clean.slice(1, -1).join(' '),
    when: clean[clean.length - 1],
  };
}

export function renderHeader(trophies, progress) {
  const earned = trophies.filter((t) => progress.earned.includes(t.id));
  document.getElementById('earned-count').textContent = String(earned.length);
  document.getElementById('bar-fill').style.width = `${(earned.length / trophies.length) * 100}%`;
  const tally = (g) => earned.filter((t) => t.grade === g).length;
  const total = (g) => trophies.filter((t) => t.grade === g).length;
  document.getElementById('grade-tallies').innerHTML =
    `<b>${tally('platinum')}/${total('platinum')}</b> Platinum · <b>${tally('gold')}/${total('gold')}</b> Gold · ` +
    `<b>${tally('silver')}/${total('silver')}</b> Silver · <b>${tally('bronze')}/${total('bronze')}</b> Bronze`;
  // Spoiler-hidden trophies are skipped entirely, so the strip always names
  // the next three unearned trophies the reader can actually see.
  const next = roadmapOrder(trophies)
    .filter((t) => !progress.earned.includes(t.id) && !isShielded(t, progress))
    .slice(0, 3);
  document.getElementById('next-up').innerHTML = next.length
    ? `<strong>Next up</strong> — ` + next.map((t) => `<span class="nu-item">${esc(t.name)}</span>`).join(' · ')
    : `<strong>Next up</strong> — nothing left. Leonida is yours.`;
}

function rowHtml(trophy, progress, selectedId) {
  const earned = progress.earned.includes(trophy.id);
  const hidden = isShielded(trophy, progress);
  const name = hidden ? SHIELD_TEXT : trophy.name;
  const desc = hidden ? 'Its name and description stay hidden until you earn it in the story.' : trophy.description;
  const count = trophy.count != null
    ? `<span class="tag count">${progress.counters[trophy.id] ?? 0} / ${trophy.count}${esc(shortUnit(trophy.countLabel))}</span>` : '';
  const miss = trophy.missable ? `<span class="tag miss">MISSABLE</span>` : '';
  const watch = trophy.watch ? `<span class="tag watch">WATCH</span>` : '';
  const sourceLine = trophy.sources.map((s) => rowSourceName(s.name)).join(' · ');
  return `<button type="button" class="row${earned ? ' earned' : ''}${trophy.id === selectedId ? ' selected' : ''}" data-row="${trophy.id}">
    <input type="checkbox" data-check="${trophy.id}" ${earned ? 'checked' : ''} aria-label="Mark ${esc(trophy.name)} earned">
    <span class="dot ${trophy.grade}"></span>
    <span class="body"><span class="name">${esc(name)}</span><br><span class="desc">${esc(desc)}</span><br><span class="srcline">Sources: ${esc(sourceLine)}</span></span>
    <span class="tags">${miss}${watch}${count}<span class="tag grade-${trophy.grade}">${gradeLabel(trophy.grade)}</span><span class="tag">${kindLabel(trophy.kind)}</span></span>
  </button>`;
}

function detailHtml(trophy, progress) {
  if (!trophy) {
    return `<div class="detail"><p class="placeholder">Select a trophy to read its full guide, its roadmap stage and its sources.</p></div>`;
  }
  const earned = progress.earned.includes(trophy.id);
  const hidden = isShielded(trophy, progress);
  const parts = guideParts(trophy.guide);
  const stage = STAGES.find((s) => s.n === trophy.stage);
  const stepper = trophy.count != null ? `
    <h3>Tracked count — ${esc(trophy.countLabel)}</h3>
    <div class="stepper">
      <input type="number" min="0" max="${trophy.count}" value="${progress.counters[trophy.id] ?? 0}" data-counter="${trophy.id}" aria-label="Progress count for ${esc(trophy.name)}">
      <span>of ${trophy.count} ${esc(trophy.countLabel)}</span>
    </div>` : '';
  const sources = trophy.sources.map((s) => s.url
    ? `<a href="${esc(s.url)}" rel="noopener">${esc(s.name)}</a>`
    : esc(s.name)).join(' · ');
  const watchBox = trophy.watch ? `
    <p class="watch-box" style="margin:2px 0 10px;padding:7px 9px;background:#2a2417;border:1px solid #4a3f22;border-left:3px solid #f0b93e;border-radius:6px;font-size:12.5px;line-height:1.5;color:#ece7dd"><strong style="color:#f0b93e">Missable watch — unconfirmed.</strong> ${esc(trophy.watchNote)}</p>` : '';
  return `<div class="detail">
    <h2>${esc(hidden ? SHIELD_TEXT : trophy.name)}</h2>
    <p class="official">“${esc(hidden ? 'Hidden until earned.' : trophy.description)}”</p>
    <div class="meta">
      <span class="tag grade-${trophy.grade}">${gradeLabel(trophy.grade)}</span>
      <span class="tag">${kindLabel(trophy.kind)}</span>
      ${trophy.missable ? '<span class="tag miss">MISSABLE</span>' : ''}
      ${trophy.watch ? '<span class="tag watch">WATCH</span>' : ''}
      <span class="tag">${earned ? 'Earned' : 'Unearned'}</span>
    </div>
    <p class="sources sources-top" style="margin:2px 0 10px;padding:7px 9px;background:#1d2431;border:1px solid #2a3242;border-left:3px solid #ff6b4a;border-radius:6px;font-size:12.5px;line-height:1.5;color:#ece7dd"><strong style="color:#ff6b4a">Sources:</strong> ${sources}</p>
    ${watchBox}
    ${stepper}
    <h3>What to do</h3><p>${esc(parts.what)}</p>
    ${parts.how ? `<h3>Where &amp; how</h3><p>${esc(parts.how)}</p>` : ''}
    <h3>When it can be missed</h3><p>${esc(trophy.missable ? trophy.missableNote : parts.when || trophy.missableNote)}</p>
    <h3>Roadmap stage</h3><p>Stage ${stage.n} — ${esc(stage.title)}. ${esc(stage.why.split('.')[0])}.</p>
  </div>`;
}

export function renderChecklist(main, trophies, progress, selectedId) {
  // Rows are grouped under stage header bars in roadmap order. Grouping
  // follows the active filter/search: a stage bar appears only when that
  // stage has at least one visible row, and its tally counts visible rows.
  let rows;
  if (!trophies.length) {
    rows = `<p class="empty">No trophies match the current filters.</p>`;
  } else {
    const ordered = roadmapOrder(trophies);
    rows = STAGES.map((s) => {
      const group = ordered.filter((t) => t.stage === s.n);
      if (!group.length) return '';
      const done = group.filter((t) => progress.earned.includes(t.id)).length;
      const head = `<div class="stage-head">Stage ${s.n} — ${esc(s.title)} · ${done}/${group.length} earned in stage</div>`;
      return head + group.map((t) => rowHtml(t, progress, selectedId)).join('');
    }).join('');
  }
  const selected = trophies.find((t) => t.id === selectedId)
    || null;
  main.innerHTML = `<div class="split"><div class="rows">${rows}</div>${detailHtml(selected, progress)}</div>`;
  return selected;
}

export function renderRoadmap(main, trophies, progress) {
  const ordered = roadmapOrder(trophies);
  main.innerHTML = STAGES.map((s) => {
    const list = ordered.filter((t) => t.stage === s.n);
    const done = list.filter((t) => progress.earned.includes(t.id)).length;
    const items = list.map((t) => {
      const earned = progress.earned.includes(t.id);
      const hidden = isShielded(t, progress);
      return `<li class="${earned ? 'done' : ''}">${earned ? '✓ ' : ''}${esc(hidden ? SHIELD_TEXT : t.name)}${t.missable ? ' — MISSABLE' : ''}${t.watch ? ' — WATCH' : ''}</li>`;
    }).join('');
    return `<section class="stage"><h2><span class="n">Stage ${s.n}</span> — ${esc(s.title)}</h2>
      <p class="why">${esc(s.why)}</p>
      <p class="prog">${done} of ${list.length} earned in this stage</p>
      <ul>${items}</ul></section>`;
  }).join('');
}

export function renderMissables(main, trophies, progress) {
  const flagged = trophies.filter((t) => t.missable);
  const note = `<div class="method-note"><strong>How these were flagged.</strong> The confirmed flags above come from the official descriptions alone: a trophy is flagged only when its description ties it to a partner sequence or a named one-time mission location. Every other trophy's description shows no one-time window, so it is treated as earnable any time. Separately, the watch list below carries one item flagged by community guides rather than the descriptions — Positive Mental Attitude, reported by PowerPyx — which stays unconfirmed and is not counted among the confirmed missables.</div>`;
  const cards = flagged.map((t) => {
    const earned = progress.earned.includes(t.id);
    const sourceLine = t.sources.map((s) => shortSourceName(s.name)).join(' · ');
    return `<section class="miss-card"><h2><span class="n">Missable</span> — ${esc(t.name)}</h2>
      <p class="official">“${esc(t.description)}”</p>
      <p class="why">${esc(t.missableNote)}</p>
      <p>${esc(t.guide)}</p>
      <p class="sources" style="margin:6px 0;font-size:12.5px;line-height:1.5;color:#ece7dd">Sources: ${esc(sourceLine)}</p>
      <p class="prog">${earned ? '✓ Earned' : 'Not yet earned'} · Roadmap stage ${t.stage} · ${gradeLabel(t.grade)}</p>
    </section>`;
  }).join('');
  const watched = trophies.filter((t) => t.watch && !t.missable);
  const watchCards = watched.map((t) => {
    const earned = progress.earned.includes(t.id);
    const sourceLine = t.sources.map((s) => shortSourceName(s.name)).join(' · ');
    return `<section class="miss-card watch-card"><h2><span class="n">Watch</span> — ${esc(t.name)}</h2>
      <p class="official">“${esc(t.description)}”</p>
      <p class="why">${esc(t.watchNote)}</p>
      <p>${esc(t.guide)}</p>
      <p class="sources" style="margin:6px 0;font-size:12.5px;line-height:1.5;color:#ece7dd">Sources: ${esc(sourceLine)}</p>
      <p class="prog">${earned ? '✓ Earned' : 'Not yet earned'} · Roadmap stage ${t.stage} · ${gradeLabel(t.grade)}</p>
    </section>`;
  }).join('');
  const watchSection = watched.length
    ? `<h2 class="watch-head">Watch list — reported, not confirmed</h2>` + watchCards
    : '';
  main.innerHTML = note + cards + watchSection;
}
