/* MI WRESTLING 2.0 — CHAMPIONSHIPS
   Data sources: data/championships/championships.json, data/reigns/reigns.json,
   data/wrestlers/wrestlers.json and data/teams/teams.json. No duplicate hard-coded reign history.
*/
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const state = { championships: [], reigns: [], wrestlers: [], teams: [], filter: 'all', search: '', activeView: 'catalog' };
  const MAIN_IDS = ['wwe-championship', 'world-championship', 'intercontinental-championship', 'usa-championship', 'world-tag-championship'];
  const CATEGORY_IDS = {
    world: new Set(['wwe-championship', 'world-championship']),
    midcard: new Set(['intercontinental-championship', 'usa-championship']),
    tag: new Set(['world-tag-championship'])
  };
  const COLORS = {
    'wwe-championship': ['#f0d99c', '240,217,156'], 'world-championship': ['#d5e1f4', '213,225,244'],
    'intercontinental-championship': ['#d5b77b', '213,183,123'], 'usa-championship': ['#9fc7ff', '159,199,255'],
    'world-tag-championship': ['#e1e5ed', '225,229,237'], 'speed-championship': ['#64eaff', '100,234,255'],
    'nxt-championship': ['#c8d0dc', '200,208,220'], 'crown-jewel-championship': ['#ffd36b', '255,211,107'],
    'aaa-megacampeonato': ['#8affae', '138,255,174'], 'aew-championship': ['#ead9b9', '234,217,185']
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const norm = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
  const slug = value => norm(value).replace(/\s+/g, '-');
  const titleCategory = id => CATEGORY_IDS.world.has(id) ? 'world' : CATEGORY_IDS.midcard.has(id) ? 'midcard' : CATEGORY_IDS.tag.has(id) ? 'tag' : 'other';
  const categoryLabel = category => ({ world: 'CAMPEONATO MUNDIAL', midcard: 'CAMPEONATO MIDCARD', tag: 'CAMPEONATO DE PAREJAS', other: 'CAMPEONATO ESPECIAL' }[category] || 'CAMPEONATO');
  const imagePath = path => {
    if (!path) return '';
    const clean = String(path).replace(/^\.\.\//, '').replace(/^\.\//, '');
    return clean;
  };
  async function readJSON(path) {
    const response = await fetch(path, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`No se pudo cargar ${path} (${response.status}).`);
    return response.json();
  }
  function daysBetween(start, end) {
    if (!start) return null;
    const a = new Date(`${start}T00:00:00Z`);
    const b = end ? new Date(`${end}T00:00:00Z`) : new Date();
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
    return Math.max(0, Math.floor((b - a) / 86400000));
  }
  function duration(reign) {
    if (reign.status === 'current' || reign.normalizedStatus === 'current' || (!reign.endDate && reign.status !== 'vacant')) {
      return { days: (daysBetween(reign.startDate) ?? Number(reign.durationDays)) || 0, current: true, approximate: Boolean(reign.durationIsApproximate) };
    }
    const calculated = daysBetween(reign.startDate, reign.endDate);
    return { days: (calculated ?? Number(reign.durationDays)) || 0, current: false, approximate: Boolean(reign.durationIsApproximate) };
  }
  function formatDate(value) {
    if (!value) return 'Fecha sin registrar';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  }
  function titleById(id) { return state.championships.find(title => String(title.id) === String(id)); }
  function displayTitle(title) { return title?.id === 'world-championship' ? 'World Heavyweight Championship' : (title?.name || 'Championship'); }
  function wrestlerById(id) { return state.wrestlers.find(w => String(w.id) === String(id)); }
  function wrestlerByName(name) { const key = norm(name); return state.wrestlers.find(w => norm(w.name) === key || norm(w.legacy?.name) === key); }
  function teamByName(name) { const key = norm(name); return state.teams.find(team => norm(team.name) === key); }
  function reignsFor(titleId) {
    return state.reigns.filter(reign => String(reign.championshipId) === String(titleId)).sort((a, b) => {
      const pa = Number(a.sourcePosition); const pb = Number(b.sourcePosition);
      if (Number.isFinite(pa) && Number.isFinite(pb) && pa !== pb) return pa - pb;
      return String(b.startDate || '').localeCompare(String(a.startDate || ''));
    });
  }
  function currentReign(title) {
    const rows = reignsFor(title.id);
    return rows.find(reign => reign.status === 'current' || reign.normalizedStatus === 'current') || rows.find(reign => !reign.endDate && reign.status !== 'vacant') || null;
  }
  function championLink(name, id) {
    const wrestler = (id && wrestlerById(id)) || wrestlerByName(name);
    if (wrestler) return `<a href="superstar.html?id=${encodeURIComponent(wrestler.id)}">${esc(wrestler.name)}</a>`;
    const team = teamByName(name);
    if (team) return `<a href="team.html?id=${encodeURIComponent(team.id)}">${esc(team.name)}</a>`;
    return esc(name || 'Campeón no registrado');
  }
  function beltArt(title) {
    const parts = String(title.id === 'world-championship' ? 'World Heavyweight' : (title.shortName || title.name || 'CHAMPIONSHIP')).replace(/\bChampionship\b/i, '').trim().split(/\s+/).slice(0, 3).join(' ');
    return `<div class="mw-champ-belt" aria-hidden="true"><span class="mw-belt-side"></span><span class="mw-belt-center"><b>MI WRESTLING</b><strong>${esc(parts || title.name || 'TITLE')}</strong><small>CHAMPION</small></span><span class="mw-belt-side"></span></div>`;
  }
  function currentChampionMarkup(title) {
    const reign = currentReign(title);
    const name = reign?.championName || title.champion || title.legacy?.champion || (title.status === 'vacant' ? 'Vacante' : 'Sin registrar');
    return `<strong>${championLink(name, reign?.championId)}</strong><span>${reign ? `Desde ${esc(formatDate(reign.startDate))}` : (title.status === 'vacant' ? 'Título vacante' : 'Reinado actual no identificado')}</span>`;
  }
  function renderCatalog() {
    const root = $('[data-champ-catalog]');
    if (!root) return;
    const titles = state.championships.filter(title => {
      const cat = titleCategory(title.id);
      const filterOk = state.filter === 'all' || (state.filter === 'other' ? cat === 'other' : cat === state.filter);
      const haystack = norm(`${title.name} ${title.shortName} ${title.promotion} ${title.champion}`);
      return filterOk && haystack.includes(norm(state.search));
    });
    $('[data-champ-count]').textContent = `${titles.length} TÍTULO${titles.length === 1 ? '' : 'S'} · ${state.championships.length} EN ARCHIVO`;
    root.innerHTML = titles.length ? titles.map(title => {
      const category = titleCategory(title.id);
      const reigns = reignsFor(title.id);
      const current = currentReign(title);
      const championName = current?.championName || title.champion || title.legacy?.champion || (title.status === 'vacant' ? 'Vacante' : 'Sin registrar');
      const accent = COLORS[title.id] || ['#dce1e9', '220,225,233'];
      const isVacant = !current && (String(title.status).toLowerCase() === 'vacant' || norm(championName) === 'vacante');
      return `<button type="button" class="mw-champ-card title-${esc(title.id)}" data-open-title="${esc(title.id)}" style="--title-accent:${accent[0]};--title-rgb:${accent[1]}" aria-label="Abrir ${esc(title.name)}">
        <span class="mw-champ-card__top"><span>${esc(categoryLabel(category))}</span><span class="mw-champ-card__status">${isVacant ? 'VACANTE' : current ? 'ACTUAL' : title.status === 'inactive' ? 'INACTIVO' : 'ARCHIVO'}</span></span>
        ${beltArt(title)}
        <span class="mw-champ-card__body"><strong class="mw-champ-card__name">${esc(displayTitle(title))}</strong><span class="mw-champ-card__champion">${currentChampionMarkup(title)}</span><span class="mw-champ-card__foot"><span>${reigns.length} REINADO${reigns.length === 1 ? '' : 'S'} REGISTRADO${reigns.length === 1 ? '' : 'S'}</span><b>VER HISTORIAL ↗</b></span></span>
      </button>`;
    }).join('') : '<div class="mw-champ-empty">No hay campeonatos que coincidan con esa búsqueda.</div>';
  }
  function renderReignCard(reign, title, index) {
    const current = duration(reign).current;
    const days = duration(reign).days;
    const name = reign.championName || 'Campeón no registrado';
    const person = (reign.championId && wrestlerById(reign.championId)) || wrestlerByName(name);
    const image = person?.image ? imagePath(person.image) : (reign.image ? imagePath(reign.image) : 'images/Vacante.jpg');
    const initials = name.split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase();
    const number = reign.reignNumber ?? (reign.legacy?.numberLabel?.match(/\d+/)?.[0]) ?? (state.reigns.filter(r => r.championshipId === title.id).length - index);
    const vacant = reign.status === 'vacant' || norm(name) === 'vacante';
    const dateLabel = `${formatDate(reign.startDate)}${reign.endDate ? ` — ${formatDate(reign.endDate)}` : current ? ' — ACTUALIDAD' : ''}`;
    const durationLabel = `${days}${reign.durationIsApproximate ? '+' : ''}`;
    const linkedName = person ? championLink(name, person.id) : championLink(name, reign.championId);
    const description = reign.description ? esc(reign.description) : '';
    return `<article class="mw-reign-card ${current ? 'is-current' : ''}" style="--title-accent:${(COLORS[title.id] || ['#d6ba6a'])[0]}">
      <div class="mw-reign-card__visual">${image ? `<img src="${esc(image)}" alt="${esc(name)}" loading="lazy" onerror="this.remove();this.parentElement.insertAdjacentHTML('beforeend','<span class=&quot;mw-reign-placeholder&quot;>${esc(initials || 'MW')}</span>')">` : `<span class="mw-reign-placeholder">${esc(initials || 'MW')}</span>`}${current ? '<span class="mw-reign-card__badge">CAMPEÓN ACTUAL</span>' : vacant ? '<span class="mw-reign-card__badge">VACANTE</span>' : ''}</div>
      <div class="mw-reign-card__number">REINADO #${esc(number)}</div>
      <h3 class="mw-reign-card__champion">${linkedName}</h3>
      <p class="mw-reign-card__description">${description}</p>
      <footer class="mw-reign-card__footer"><div class="mw-reign-card__duration"><strong>${esc(durationLabel)}</strong><span>DÍAS${reign.durationIsApproximate ? ' APROX.' : ''}</span></div><div class="mw-reign-card__dates"><span>${esc(dateLabel)}</span><span>${current ? 'EN CURSO' : vacant ? 'SIN CAMPEÓN' : 'REINADO FINALIZADO'}</span></div></footer>
    </article>`;
  }
  function renderDetail(titleId) {
    const title = titleById(titleId);
    const root = $('[data-champ-detail]');
    if (!title || !root) return;
    const rows = reignsFor(title.id);
    const current = currentReign(title);
    const championName = current?.championName || title.champion || title.legacy?.champion || 'Sin registrar';
    const longest = rows.filter(r => r.status !== 'vacant' && norm(r.championName) !== 'vacante').reduce((best, reign) => Math.max(best, duration(reign).days), 0);
    const accent = COLORS[title.id] || ['#dce1e9', '220,225,233'];
    root.innerHTML = `<header class="mw-champ-detail-hero title-${esc(title.id)}" style="--title-accent:${accent[0]};--title-rgb:${accent[1]}"><div><span class="mw-champ-detail-kicker">${esc(categoryLabel(titleCategory(title.id)))} / ${esc(title.promotion || 'MI WRESTLING')}</span><h2>${esc(displayTitle(title))}</h2><div class="mw-champ-detail-champion">Campeón actual: <strong>${championLink(championName, current?.championId)}</strong><br>${current?.startDate ? `Desde ${esc(formatDate(current.startDate))}` : 'Inicio del reinado no confirmado'}</div><div class="mw-champ-detail-stats"><article><strong>${rows.length}</strong><span>REINADOS</span></article><article><strong>${longest}</strong><span>DÍAS · RÉCORD DE DURACIÓN</span></article><article><strong>${rows.filter(r => duration(r).current).length}</strong><span>ACTUALES</span></article></div></div>${beltArt(title)}</header>
      <div class="mw-reign-heading"><h3>LIST OF CHAMPIONS</h3><span>${rows.length} REGISTRO(S)</span></div>
      <div class="mw-reign-grid">${rows.length ? rows.map((reign, index) => renderReignCard(reign, title, index)).join('') : '<div class="mw-champ-empty">Todavía no hay reinados registrados para este campeonato.</div>'}</div>`;
  }
  function wrestlerIdsForReign(reign, title) {
    if (titleCategory(title.id) !== 'tag') {
      const ids = [...(Array.isArray(reign.championWrestlerIds) ? reign.championWrestlerIds : [])];
      if (reign.championId) ids.push(reign.championId);
      const found = wrestlerByName(reign.championName);
      if (found) ids.push(found.id);
      return [...new Set(ids.filter(Boolean))];
    }
    const team = teamByName(reign.championName);
    if (!team) return [];
    // No adjudicar títulos de parejas a personas si la composición del equipo sigue marcada como no confirmada.
    if (team.membershipReviewRequired === true) return [];
    const members = Array.isArray(team.members) ? team.members : [];
    const confirmedMembers = members.filter(member => ['confirmed', 'active'].includes(String(member.status || '').toLowerCase())).map(member => member.wrestlerId);
    const ids = confirmedMembers.length ? confirmedMembers : (team.memberWrestlerIds || []);
    return [...new Set(ids.filter(Boolean))];
  }
  function crownProfiles() {
    const profiles = new Map(state.wrestlers.map(w => [w.id, { wrestler: w, titleIds: new Set(), world: new Set(), midcard: new Set(), tag: new Set() }]));
    state.reigns.forEach(reign => {
      if (reign.status === 'vacant' || norm(reign.championName) === 'vacante') return;
      const title = titleById(reign.championshipId);
      if (!title || !MAIN_IDS.includes(title.id)) return;
      const category = titleCategory(title.id);
      wrestlerIdsForReign(reign, title).forEach(id => {
        const profile = profiles.get(id);
        if (!profile) return;
        profile.titleIds.add(title.id);
        if (category === 'world') profile.world.add(title.id);
        if (category === 'midcard') profile.midcard.add(title.id);
        if (category === 'tag') profile.tag.add(title.id);
      });
    });
    return [...profiles.values()].map(profile => {
      const triple = profile.world.size > 0 && profile.midcard.size > 0 && profile.tag.size > 0;
      const grand = MAIN_IDS.every(id => profile.titleIds.has(id));
      const earned = MAIN_IDS.filter(id => profile.titleIds.has(id));
      return { ...profile, triple, grand, earned, missing: MAIN_IDS.filter(id => !profile.titleIds.has(id)) };
    }).filter(profile => profile.earned.length > 0);
  }
  function crownProgress(profile) {
    return MAIN_IDS.map(id => {
      const title = titleById(id);
      const earned = profile.titleIds.has(id);
      return `<span class="${earned ? 'is-earned' : ''}" title="${esc(title?.name || id)}">${earned ? '✓ ' : '○ '}${esc(({ 'wwe-championship':'WWE', 'world-championship':'WORLD', 'intercontinental-championship':'IC', 'usa-championship':'USA', 'world-tag-championship':'TAG' })[id])}</span>`;
    }).join('');
  }
  function renderCrowns() {
    const profiles = crownProfiles().sort((a, b) => Number(b.grand) - Number(a.grand) || Number(b.triple) - Number(a.triple) || b.earned.length - a.earned.length || a.wrestler.name.localeCompare(b.wrestler.name));
    const achieved = profiles.filter(profile => profile.triple || profile.grand);
    const potential = profiles.filter(profile => !profile.grand).sort((a, b) => b.earned.length - a.earned.length || a.wrestler.name.localeCompare(b.wrestler.name));
    const card = (profile, achievedCard) => `<article class="mw-crown-card"><div class="mw-crown-card__top"><h3><a href="superstar.html?id=${encodeURIComponent(profile.wrestler.id)}">${esc(profile.wrestler.name)}</a></h3><span class="mw-crown-card__tag">${profile.grand ? 'GRAND SLAM' : profile.triple ? 'TRIPLE CROWN' : `${profile.earned.length}/5 TÍTULOS`}</span></div><p>${achievedCard ? (profile.grand ? 'Completó los cinco campeonatos clave.' : 'Completó al menos un mundial, un midcard y el título de parejas.') : `Le faltan ${profile.missing.length} campeonato(s) para completar el Grand Slam.`}</p><div class="mw-crown-progress">${crownProgress(profile)}</div></article>`;
    $('[data-crown-achieved]').innerHTML = achieved.length ? achieved.map(profile => card(profile, true)).join('') : '<div class="mw-champ-empty">Con los datos de reinados actuales, todavía no se puede confirmar una Triple Crown o Grand Slam completo.</div>';
    $('[data-crown-potential]').innerHTML = potential.length ? potential.map(profile => card(profile, false)).join('') : '<div class="mw-champ-empty">No hay aspirantes parciales adicionales en los cinco campeonatos clave.</div>';
  }
  function renderRecords() {
    const root = $('[data-champ-records]');
    const cards = state.championships.map(title => {
      const rows = reignsFor(title.id).filter(reign => reign.status !== 'vacant' && norm(reign.championName) !== 'vacante');
      const counts = new Map();
      rows.forEach(reign => {
        const name = reign.championName || 'Sin registrar';
        const key = norm(name);
        if (!counts.has(key)) counts.set(key, { name, reigns: 0, days: 0, longest: 0 });
        const row = counts.get(key); const days = duration(reign).days;
        row.reigns += 1; row.days += days; row.longest = Math.max(row.longest, days);
      });
      const leaders = [...counts.values()].sort((a, b) => b.reigns - a.reigns || b.longest - a.longest || a.name.localeCompare(b.name)).slice(0, 3);
      const longest = [...rows].sort((a, b) => duration(b).days - duration(a).days)[0];
      const totalDays = longest ? duration(longest).days : 0;
      const titleColor = (COLORS[title.id] || ['#dce1e9'])[0];
      return `<article class="mw-record-card"><h3>${esc(displayTitle(title))}</h3>${leaders.length ? leaders.map((leader, index) => `<div class="mw-record-card__line"><span class="mw-record-card__rank">${String(index + 1).padStart(2, '0')}</span><span class="mw-record-card__name">${championLink(leader.name)}<small>${leader.reigns} reinado(s)</small></span><span class="mw-record-card__value">${leader.reigns}</span></div>`).join('') : '<p class="mw-champ-empty">Sin reinados históricos disponibles.</p>'}<div class="mw-record-card__line"><span class="mw-record-card__rank">★</span><span class="mw-record-card__name">Reinado más largo<small>${longest ? `${esc(longest.championName || 'Sin registrar')} · ${esc(formatDate(longest.startDate))}` : 'Sin datos suficientes'}</small></span><span class="mw-record-card__value">${totalDays}d</span></div></article>`;
    });
    root.innerHTML = cards.join('');
  }
  function switchView(view) {
    state.activeView = view;
    $$('[data-champ-view]').forEach(section => {
      const active = section.dataset.champView === view;
      section.hidden = !active;
      section.classList.toggle('is-active', active);
    });
    $$('[data-champ-tabs] button').forEach(button => {
      const active = button.dataset.view === view;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function showError(error) {
    const node = $('[data-champ-error]');
    node.hidden = false;
    node.textContent = `No se pudieron cargar los datos de campeonatos. ${error?.message || 'Revisá que los archivos JSON estén publicados en sus rutas.'}`;
  }
  function bindEvents() {
    $('[data-champ-tabs]')?.addEventListener('click', event => {
      const button = event.target.closest('[data-view]');
      if (button) switchView(button.dataset.view);
    });
    $('[data-champ-search]')?.addEventListener('input', event => { state.search = event.target.value; renderCatalog(); });
    $('[data-champ-filters]')?.addEventListener('click', event => {
      const button = event.target.closest('[data-filter]'); if (!button) return;
      state.filter = button.dataset.filter;
      $$('[data-filter]').forEach(item => item.classList.toggle('is-active', item === button));
      renderCatalog();
    });
    $('[data-champ-catalog]')?.addEventListener('click', event => {
      const button = event.target.closest('[data-open-title]'); if (!button) return;
      renderDetail(button.dataset.openTitle); switchView('detail');
    });
    $('[data-back-catalog]')?.addEventListener('click', () => switchView('catalog'));
  }
  async function init() {
    if (!document.body || document.body.dataset.page !== 'championships') return;
    bindEvents();
    try {
      const [championships, reigns, wrestlers, teams] = await Promise.all([
        readJSON('data/championships/championships.json'), readJSON('data/reigns/reigns.json'),
        readJSON('data/wrestlers/wrestlers.json'), readJSON('data/teams/teams.json').catch(() => [])
      ]);
      state.championships = (Array.isArray(championships) ? championships : []).slice().sort((a, b) => Number(a.displayOrder ?? a.order ?? 999) - Number(b.displayOrder ?? b.order ?? 999));
      state.reigns = Array.isArray(reigns) ? reigns : [];
      state.wrestlers = Array.isArray(wrestlers) ? wrestlers : [];
      state.teams = Array.isArray(teams) ? teams : [];
      renderCatalog(); renderRecords(); renderCrowns();
      const params = new URLSearchParams(window.location.search);
      const requested = params.get('id');
      if (requested && titleById(requested)) { renderDetail(requested); switchView('detail'); }
    } catch (error) {
      console.error('[MIW Championships]', error);
      showError(error);
      $('[data-champ-catalog]').innerHTML = '<div class="mw-champ-empty">No se pudieron cargar los campeonatos. Comprobá las rutas de los JSON.</div>';
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

