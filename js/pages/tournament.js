/* MI WRESTLING 2.0 — Tournament engine
 * Compatible con torneos, temporadas, zonas, ligas, matrices, brackets y combates extra.
 * No requiere librerías. Conserva los datos originales; el ordenamiento solo afecta la vista.
 */
(() => {
  'use strict';

  const main = document.querySelector('[data-tournament-main]') || document.querySelector('[data-page-content]');
  if (!main) return;

  const $ = (selector, root = main) => root.querySelector(selector);
  const $$ = (selector, root = main) => [...root.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const norm = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const slug = value => norm(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const isNumber = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
  const num = (value, fallback = 0) => isNumber(value) ? Number(value) : fallback;
  const list = value => Array.isArray(value) ? value : [];
  const unique = values => [...new Set(values)];
  const formatDate = value => {
    if (!value) return 'Fecha no registrada';
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? `${value}T00:00:00Z` : value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
  };
  const initials = value => String(value || '?').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';
  const href = (page, id) => `${page}?id=${encodeURIComponent(String(id ?? ''))}`;
  const imageMarkup = (src, name, className) => {
    const safeSrc = String(src || '').trim();
    if (!safeSrc) return `<span class="${className} mw-image-fallback" aria-label="${esc(name)}">${esc(initials(name))}</span>`;
    return `<img class="${className}" src="${esc(safeSrc)}" alt="${esc(name)}" loading="lazy" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="${className} mw-image-fallback" hidden aria-label="${esc(name)}">${esc(initials(name))}</span>`;
  };
  const fetchJSON = async path => {
    const response = await fetch(path, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`No se pudo cargar ${path} (HTTP ${response.status})`);
    return response.json();
  };

  async function loadOptional(path, fallback = []) {
    try { return await fetchJSON(path); } catch (error) { console.warn(`[MI WRESTLING] Recurso opcional no disponible: ${path}`, error); return fallback; }
  }

  function showError(error) {
    console.error('[MI WRESTLING] Error en tournament.js:', error);
    main.innerHTML = `<section class="mw-event-empty mw-tournament-error"><span class="mw-event-kicker">SYSTEM ALERT</span><h1>No se pudo cargar el torneo</h1><p>${esc(error?.message || error || 'Error desconocido')}</p><a class="mw-tournament-action" href="tournaments.html">Volver al archivo</a></section>`;
  }

  function catalogCard(tournament) {
    const count = list(tournament.matchIds).length;
    const brand = tournament.brand || 'MI WRESTLING';
    const title = tournament.name || tournament.title || tournament.id || 'Torneo sin nombre';
    const format = tournament.formatLabel || String(tournament.format || 'Formato flexible').replace(/[_-]/g, ' ');
    const status = tournament.status || (tournament.isComplete ? 'Finalizado' : 'Temporada');
    return `<a class="mw-tournament-catalog-card" href="${href('tournament.html', tournament.id)}">
      <span class="mw-tournament-catalog-card__brand">${esc(brand)}</span>
      <span class="mw-tournament-catalog-card__index">${esc(tournament.year || 'ARCHIVO')}</span>
      <strong>${esc(title)}</strong>
      <small>${esc(format)}</small>
      <span class="mw-tournament-catalog-card__footer"><span>${count} combate${count === 1 ? '' : 's'}</span><span>${esc(status)} ↗</span></span>
    </a>`;
  }

  function renderCatalog(tournaments) {
    const usable = tournaments.filter(t => t && t.hasData !== false && !t.isTemplate && (
      list(t.matchIds).length || list(t.participantNames).length || list(t.roster).length || list(t.participantIds).length || list(t.stages).length
    ));
    const years = unique(usable.map(t => t.year).filter(value => value !== undefined && value !== null && value !== '')).sort((a, b) => Number(b) - Number(a));
    main.innerHTML = `<header class="mw-tournament-hero mw-tournament-hero--catalog">
      <div class="mw-tournament-hero__eyebrow"><span class="mw-live-mark"></span> MI WRESTLING 2.0 / ARCHIVE SYSTEM</div>
      <h1>TOURNAMENT<br><span>ARCHIVE</span></h1>
      <p class="mw-tournament-hero__lead">Temporadas, ligas, brackets y resultados conectados en un solo lugar.</p>
      <div class="mw-tournament-hero__stats"><span><b>${usable.length}</b> TORNEOS</span><span><b>${years.length}</b> TEMPORADAS</span></div>
    </header>
    <section class="mw-tournament-catalog-tools" aria-label="Filtros de torneos">
      <label for="mw-tournament-year">TEMPORADA</label><select id="mw-tournament-year"><option value="all">Todas</option>${years.map(year => `<option value="${esc(year)}">${esc(year)}</option>`).join('')}</select>
      <label class="mw-tournament-search-label" for="mw-tournament-search">BUSCAR</label><input id="mw-tournament-search" type="search" placeholder="Torneo, marca o formato…" autocomplete="off">
      <span class="mw-tournament-catalog-count" id="mw-tournament-count">${usable.length} resultados</span>
    </section>
    <div class="mw-tournament-catalog-grid" id="mw-tournament-catalog-grid">${usable.map(catalogCard).join('') || '<div class="mw-event-empty">Todavía no hay torneos publicados.</div>'}</div>`;

    const yearControl = $('#mw-tournament-year');
    const searchControl = $('#mw-tournament-search');
    const grid = $('#mw-tournament-catalog-grid');
    const count = $('#mw-tournament-count');
    const update = () => {
      const year = yearControl.value;
      const query = norm(searchControl.value);
      const filtered = usable.filter(t => (year === 'all' || String(t.year) === year) && norm([t.name, t.title, t.brand, t.format, t.formatLabel, t.id, t.year].join(' ')).includes(query));
      grid.innerHTML = filtered.map(catalogCard).join('') || '<div class="mw-event-empty">No hay torneos que coincidan con la búsqueda.</div>';
      count.textContent = `${filtered.length} resultado${filtered.length === 1 ? '' : 's'}`;
    };
    yearControl.addEventListener('change', update);
    searchControl.addEventListener('input', update);
  }

  function buildTournamentPage(data, tournament) {
    const { matches, wrestlers, personas, events, teams, allTournaments } = data;
    const wrestlerById = new Map(wrestlers.map(w => [String(w.id), w]));
    const wrestlerByName = new Map();
    wrestlers.forEach(w => { if (w?.name && !wrestlerByName.has(norm(w.name))) wrestlerByName.set(norm(w.name), w); });
    const eventById = new Map(events.map(event => [String(event.id), event]));
    const matchById = new Map(matches.map(match => [String(match.id), match]));
    const teamById = new Map(teams.map(team => [String(team.id), team]));
    const id = String(tournament.id);

    document.body.dataset.tournament = id;
    document.body.dataset.tournamentBrand = slug(tournament.brand || '');
    document.body.dataset.tournamentFormat = slug(tournament.format || '');

    function personLabel(participant) {
      if (typeof participant === 'string') return wrestlerById.get(participant)?.name || participant;
      if (!participant || typeof participant !== 'object') return wrestlerById.get(String(participant))?.name || String(participant ?? 'Participante');
      const wrestler = wrestlerById.get(String(participant.wrestlerId || participant.id || ''));
      return participant.personaName || participant.displayName || participant.wrestlerName || wrestler?.name || participant.name || participant.wrestlerId || 'Participante';
    }

    const rawRoster = list(tournament.draft?.participantNames).length ? tournament.draft.participantNames
      : list(tournament.participantNames).length ? tournament.participantNames
      : list(tournament.roster).length ? tournament.roster
      : list(tournament.participantIds);
    const roster = [];
    const rosterSeen = new Set();
    rawRoster.forEach((entry, index) => {
      let idValue, name;
      if (typeof entry === 'string' || typeof entry === 'number') {
        const wrestler = wrestlerById.get(String(entry));
        idValue = wrestler?.id || String(entry);
        name = wrestler?.name || String(entry).trim();
      } else if (entry && typeof entry === 'object') {
        const wrestler = wrestlerById.get(String(entry.wrestlerId || entry.participantId || entry.id || ''));
        idValue = entry.wrestlerId || entry.participantId || entry.id || wrestler?.id || `roster-${index}`;
        name = entry.name || entry.wrestlerName || wrestler?.name || '';
      }
      if (!name) return;
      const key = norm(name);
      if (!key || rosterSeen.has(key)) return;
      rosterSeen.add(key);
      roster.push({ id: String(idValue || name), name: String(name), wrestler: wrestlerById.get(String(idValue)) || wrestlerByName.get(key) || null });
    });

    const stages = list(tournament.stages || tournament.structure?.stages).slice().sort((a, b) => num(a.order) - num(b.order));
    const stageIds = stage => list(stage?.matchIds).map(String);
    const stageMatches = stage => stageIds(stage).map(matchId => matchById.get(matchId)).filter(Boolean);
    const tournamentIds = unique([
      ...list(tournament.matchIds).map(String),
      ...stages.flatMap(stageIds),
      ...list(tournament.bonusChampionshipMatches).map(item => typeof item === 'object' ? String(item.id) : String(item))
    ]);
    const belongs = match => String(match.tournamentId || '') === id || list(match.tournamentIds).map(String).includes(id) || Boolean(match.tournamentLinks?.[id]);
    const tournamentMatches = unique([...tournamentIds.map(matchId => matchById.get(matchId)).filter(Boolean), ...matches.filter(belongs)].map(match => String(match.id)))
      .map(matchId => matchById.get(matchId)).filter(Boolean);
    const matchLinkMeta = match => match.tournamentLinks?.[id] || {};
    const isTitleMatch = match => Boolean(match.isChampionshipMatch || match.championship || match.championshipName || match.championshipId || matchLinkMeta(match).matchRole === 'championship-extra');
    const canCount = (match, stage) => {
      if (!match || isTitleMatch(match)) return false;
      const meta = matchLinkMeta(match);
      if (meta.countsForStandings === false || match.countsForStandings === false) return false;
      if (stage && stage.type && !['league', 'round-robin', 'zone', 'group'].includes(norm(stage.type))) return false;
      return true;
    };

    function sideData(match) {
      if (Array.isArray(match.sides) && match.sides.length) {
        return match.sides.map((side, index) => {
          const participantIds = list(side.participantIds || side.members).map(String);
          const names = list(side.participantNames).map(String);
          const score = isNumber(side.score) ? Number(side.score) : isNumber(match.sideScores?.[index]) ? Number(match.sideScores[index]) : null;
          const team = teamById.get(String(side.teamId || side.id || ''));
          return {
            key: String(side.id || side.teamId || side.name || `side-${index + 1}`),
            name: String(side.name || side.label || team?.name || names.join(' / ') || `Lado ${index + 1}`),
            score,
            participantIds,
            participantNames: names.length ? names : participantIds.map(pid => wrestlerById.get(pid)?.name || pid),
            image: side.image || team?.image || wrestlerById.get(participantIds[0])?.image || wrestlerByName.get(norm(side.name))?.image || ''
          };
        });
      }
      const participants = list(match.participants).filter(participant => !participant?.role || participant.role === 'competitor');
      if (!participants.length) return [];
      const sideKeys = unique(participants.map(participant => participant.side || participant.teamId || '').filter(Boolean).map(String));
      if (sideKeys.length >= 2) {
        return sideKeys.map((sideKey, index) => {
          const group = participants.filter(participant => String(participant.side || participant.teamId || '') === sideKey);
          const team = teamById.get(String(group.find(participant => participant.teamId)?.teamId || sideKey));
          const first = group[0] || {};
          let score = first.sideScore ?? first.score;
          if (!isNumber(score) && isNumber(match.sideScores?.[index])) score = match.sideScores[index];
          if (!isNumber(score) && isNumber(match.score?.[index])) score = match.score[index];
          const participantNames = group.map(personLabel);
          return { key: sideKey, name: team?.name || first.teamName || first.sideLabel || participantNames.join(' / ') || `Lado ${index + 1}`, score: isNumber(score) ? Number(score) : null, participantIds: group.map(p => String(p.wrestlerId || p.id || p.name || '')), participantNames, image: team?.image || wrestlerById.get(String(first.wrestlerId || ''))?.image || '' };
        });
      }
      // Legacy 1v1: participant.score, match.score[] or match.sideScores[] are accepted.
      return participants.map((participant, index) => {
        const name = personLabel(participant);
        const wrestler = wrestlerById.get(String(participant.wrestlerId || participant.id || '')) || wrestlerByName.get(norm(name));
        let score = participant.sideScore ?? participant.score;
        if (!isNumber(score) && isNumber(match.sideScores?.[index])) score = match.sideScores[index];
        if (!isNumber(score) && isNumber(match.score?.[index])) score = match.score[index];
        return { key: String(participant.wrestlerId || participant.id || name), name, score: isNumber(score) ? Number(score) : null, participantIds: [String(participant.wrestlerId || participant.id || name)], participantNames: [name], image: participant.image || wrestler?.image || '' };
      });
    }

    function scoreSides(match) {
      const sides = sideData(match);
      return sides.length >= 2 && sides.every(side => side.score !== null && Number.isFinite(side.score)) ? sides : null;
    }

    function rosterNamesForSide(side) {
      const sideName = norm(side.name);
      if (roster.some(person => norm(person.name) === sideName)) return [roster.find(person => norm(person.name) === sideName).name];
      const candidates = side.participantNames || [];
      return candidates.map(name => roster.find(person => norm(person.name) === norm(name))?.name).filter(Boolean);
    }

    function calculateStandings(people, usableMatches) {
      const rows = new Map(people.map(person => [norm(person.name), { id: person.id || person.name, name: person.name, played: 0, wins: 0, draws: 0, losses: 0, points: 0, for: 0, against: 0, difference: 0 }]));
      const countedIds = new Set();
      usableMatches.forEach(match => {
        if (countedIds.has(String(match.id))) return;
        countedIds.add(String(match.id));
        const sides = scoreSides(match);
        if (!sides) return;
        sides.forEach((side, index) => {
          const names = rosterNamesForSide(side);
          if (!names.length) return;
          const opponents = sides.filter((_, opponentIndex) => opponentIndex !== index);
          const against = opponents.reduce((total, opponent) => total + num(opponent.score), 0);
          const win = side.score > against;
          const loss = side.score < against;
          names.forEach(name => {
            const row = rows.get(norm(name));
            if (!row) return;
            row.played += 1;
            row.for += side.score;
            row.against += against;
            if (win) { row.wins += 1; row.points += num(tournament.pointsSystem?.win, 3); }
            else if (loss) { row.losses += 1; row.points += num(tournament.pointsSystem?.loss, 0); }
            else { row.draws += 1; row.points += num(tournament.pointsSystem?.draw, 1); }
          });
        });
      });
      return [...rows.values()].map(row => ({ ...row, difference: row.for - row.against })).sort((a, b) =>
        b.points - a.points || b.difference - a.difference || b.wins - a.wins || b.for - a.for || a.name.localeCompare(b.name, 'es')
      );
    }

    function buildMatrix(people, usableMatches) {
      const results = new Map();
      usableMatches.forEach(match => {
        const sides = scoreSides(match);
        if (!sides) return;
        sides.forEach((left, leftIndex) => sides.forEach((right, rightIndex) => {
          if (leftIndex === rightIndex) return;
          const leftNames = rosterNamesForSide(left);
          const rightNames = rosterNamesForSide(right);
          leftNames.forEach(leftName => rightNames.forEach(rightName => {
            const a = norm(leftName), b = norm(rightName);
            if (!a || !b || a === b) return;
            const key = `${a}::${b}`;
            const result = results.get(key) || { for: 0, against: 0, wins: 0, draws: 0, losses: 0, ids: [] };
            result.for += left.score;
            result.against += right.score;
            if (left.score > right.score) result.wins++;
            else if (left.score < right.score) result.losses++;
            else result.draws++;
            if (!result.ids.includes(String(match.id))) result.ids.push(String(match.id));
            results.set(key, result);
          }));
        }));
      });
      return { people, results };
    }

    function wrestlerLink(name) {
      const wrestler = wrestlerByName.get(norm(name));
      return `<a href="${href('superstar.html', wrestler?.id || slug(name))}">${esc(name)}</a>`;
    }

    function draftHTML() {
      if (!roster.length) return '<div class="mw-event-empty">No hay participantes registrados en el roster de este torneo.</div>';
      return `<div class="mw-tournament-draft-grid">${roster.map((person, index) => {
        const wrestler = person.wrestler || wrestlerByName.get(norm(person.name));
        return `<a class="mw-tournament-draft-card" href="${href('superstar.html', wrestler?.id || slug(person.name))}" style="--draft-index:${index}">
          <span class="mw-tournament-draft-card__seed">${String(index + 1).padStart(2, '0')}</span>
          ${imageMarkup(wrestler?.image, person.name, 'mw-tournament-draft-card__image')}
          <strong>${esc(person.name)}</strong><span class="mw-tournament-draft-card__open">VER PERFIL ↗</span>
        </a>`;
      }).join('')}</div>`;
    }

    function renderStandings(people, usableMatches, title) {
      const rows = calculateStandings(people, usableMatches);
      if (!rows.length) return '';
      const winPoints = num(tournament.pointsSystem?.win, 3), drawPoints = num(tournament.pointsSystem?.draw, 1), lossPoints = num(tournament.pointsSystem?.loss, 0);
      const hasResults = rows.some(row => row.played > 0);
      const columns = [ ['played', 'PJ'], ['wins', 'G'], ['draws', 'E'], ['losses', 'P'], ['points', 'PTS'], ['for', 'RF'], ['against', 'RC'], ['difference', 'DIF'] ];
      return `<section class="mw-tournament-panel mw-tournament-panel--standings">
        <div class="mw-tournament-panel__heading"><div><span class="mw-event-kicker">LEAGUE STANDINGS</span><h2>${esc(title)}</h2><p>La clasificación se recalcula con los marcadores válidos de esta fase.</p></div><span class="mw-tournament-panel__count">${rows.length} PARTICIPANTES</span></div>
        <div class="mw-table-tools"><span class="mw-table-tools__label">CLASIFICACIÓN OFICIAL</span><button type="button" class="mw-table-difference-toggle" aria-expanded="false"><span class="mw-table-toggle-icon">＋</span> VER DIFERENCIA DE RONDAS</button><span class="mw-table-points">V +${winPoints} / E +${drawPoints} / D +${lossPoints}</span></div>
        ${hasResults ? '' : '<p class="mw-tournament-note">Todavía no hay marcadores completos. La tabla muestra a los participantes sin inventar resultados.</p>'}
        <div class="mw-tournament-table-wrap" role="region" aria-label="Tabla de posiciones; desplazamiento horizontal disponible" tabindex="0"><table class="mw-tournament-table"><thead><tr><th class="mw-table-position">POS</th><th class="mw-standing-name">COMPETIDOR</th>${columns.map(([key, label]) => `<th class="${['for', 'against', 'difference'].includes(key) ? 'is-difference-column' : ''}"><button type="button" data-sort="${key}" data-order="desc" aria-label="Ordenar por ${label}">${label}<span aria-hidden="true"> ↕</span></button></th>`).join('')}</tr></thead>
        <tbody>${rows.map((row, index) => `<tr data-row data-name="${esc(norm(row.name))}" data-played="${row.played}" data-wins="${row.wins}" data-draws="${row.draws}" data-losses="${row.losses}" data-points="${row.points}" data-for="${row.for}" data-against="${row.against}" data-difference="${row.difference}" class="${index === 0 ? 'is-leader' : index === rows.length - 1 ? 'is-last' : ''}">
          <td class="mw-table-position"><span>${String(index + 1).padStart(2, '0')}</span></td><td class="mw-standing-name">${wrestlerLink(row.name)}</td>
          <td data-col="played">${row.played}</td><td data-col="wins">${row.wins}</td><td data-col="draws">${row.draws}</td><td data-col="losses">${row.losses}</td><td data-col="points" class="mw-standing-points"><strong>${row.points}</strong></td>
          <td data-col="for" class="is-difference-column">${row.for}</td><td data-col="against" class="is-difference-column">${row.against}</td><td data-col="difference" class="is-difference-column ${row.difference > 0 ? 'is-positive' : row.difference < 0 ? 'is-negative' : ''}">${row.difference > 0 ? '+' : ''}${row.difference}</td>
        </tr>`).join('')}</tbody></table></div>
        <p class="mw-tournament-note">PJ: jugados · G: ganados · E: empatados · P: perdidos · PTS: puntos · RF/RC: rondas a favor/en contra. Los desempates se ordenan por puntos, diferencia, victorias, rondas a favor y nombre.</p>
      </section>`;
    }

    function renderMatrix(people, usableMatches, title) {
      if (!people.length) return '';
      const { results } = buildMatrix(people, usableMatches);
      const zones = tournament.zones && typeof tournament.zones === 'object' ? Object.entries(tournament.zones) : [];
      const zoneOf = name => zones.find(([, entries]) => list(entries).some(entry => norm(typeof entry === 'string' ? entry : entry?.name || wrestlerById.get(String(entry?.wrestlerId || entry?.id || ''))?.name) === norm(name)))?.[0] || '';
      const zoneClass = zone => zone ? `matrix-zone-${slug(zone)}` : '';
      const cell = (a, b) => {
        if (norm(a.name) === norm(b.name)) return '<td class="matrix-self" aria-label="Mismo participante"><span>—</span></td>';
        const result = results.get(`${norm(a.name)}::${norm(b.name)}`);
        if (!result) return '<td class="matrix-empty" aria-label="Sin enfrentamiento registrado"><span>·</span></td>';
        const outcome = result.wins > result.losses ? 'W' : result.losses > result.wins ? 'L' : 'D';
        const className = result.wins > result.losses ? 'matrix-win' : result.losses > result.wins ? 'matrix-loss' : 'matrix-draw';
        const record = `${result.wins}V · ${result.draws}E · ${result.losses}D`;
        return `<td><button type="button" class="matrix-cell ${className}" data-matches="${esc(result.ids.join(','))}" title="${esc(record)} · ${result.for}-${result.against}" aria-label="${esc(a.name)} contra ${esc(b.name)}: ${esc(record)}">${outcome}<small>${result.for}–${result.against}</small></button></td>`;
      };
      const legend = zones.length ? `<div class="mw-matrix-legend">${zones.map(([zone]) => `<span class="mw-matrix-legend__item ${zoneClass(zone)}"><i></i>${esc(zone)}</span>`).join('')}</div>` : '';
      return `<section class="mw-tournament-panel mw-tournament-panel--matrix">
        <div class="mw-tournament-panel__heading"><div><span class="mw-event-kicker">HEAD-TO-HEAD MATRIX</span><h2>${esc(title)}</h2><p>Cruces directos con retratos, nombres completos y balance acumulado. Deslizá la matriz horizontalmente para recorrerla.</p></div><span class="mw-tournament-panel__count">${people.length} COMPETIDORES</span></div>
        ${legend}<div class="mw-tournament-matrix-wrap" role="region" aria-label="Matriz de enfrentamientos; desplazar horizontalmente" tabindex="0"><table class="mw-tournament-matrix"><thead><tr><th class="matrix-corner">COMPETIDOR</th>${people.map(person => `<th class="${zoneClass(zoneOf(person.name))}" title="${esc(person.name)}"><span>${esc(person.name)}</span></th>`).join('')}</tr></thead>
        <tbody>${people.map((person, index) => {
          const wrestler = person.wrestler || wrestlerByName.get(norm(person.name));
          return `<tr><th scope="row" class="matrix-row-name ${zoneClass(zoneOf(person.name))}"><span class="matrix-row-name__seed">${String(index + 1).padStart(2, '0')}</span>${imageMarkup(wrestler?.image, person.name, 'matrix-row-name__portrait')}<span class="matrix-row-name__full-name">${esc(person.name)}</span></th>${people.map(opponent => cell(person, opponent)).join('')}</tr>`;
        }).join('')}</tbody></table></div>
        <div class="mw-tournament-matrix-detail" aria-live="polite"><span class="mw-matrix-detail__eyebrow">CRUCE SELECCIONADO</span><p>Elegí una celda con resultado para consultar los combates que la componen.</p></div>
        <p class="mw-tournament-note">W = balance favorable · L = balance desfavorable · D = balance igualado. La celda muestra el balance total de los marcadores registrados.</p>
      </section>`;
    }

    function matchScoreCard(match) {
      const sides = sideData(match);
      if (!sides.length) return '';
      const left = sides[0];
      const right = sides[1] || { name: 'Rival por confirmar', score: null, image: '' };
      const complete = sides.length >= 2 && sides.every(side => side.score !== null);
      const winnerIndex = complete ? (left.score === right.score ? -1 : left.score > right.score ? 0 : 1) : -1;
      const leftImage = left.image || wrestlerByName.get(norm(left.name))?.image || wrestlerById.get(String(left.participantIds?.[0] || ''))?.image;
      const rightImage = right.image || wrestlerByName.get(norm(right.name))?.image || wrestlerById.get(String(right.participantIds?.[0] || ''))?.image;
      const championshipName = match.championship || match.championshipName || (match.championshipId ? String(match.championshipId).replace(/[-_]/g, ' ') : '');
      const championship = championshipName ? `<a class="mw-tournament-title-ribbon" href="${href('championship.html', match.championshipId || slug(championshipName))}"><span class="mw-title-ribbon__icon">✦</span><span>${esc(championshipName)}</span><span class="mw-title-ribbon__label">TITLE MATCH</span></a>` : '';
      const event = eventById.get(String(match.eventId || match.linkedEventId || ''));
      const meta = [match.position, match.phaseName, match.date ? formatDate(match.date) : '', event?.title || event?.name || ''].filter(Boolean)[0] || 'RESULTADO REGISTRADO';
      const sideHTML = (side, sideIndex, image) => `<div class="mw-matchup-side ${sideIndex === 0 ? 'is-left' : 'is-right'} ${winnerIndex === sideIndex ? 'is-winner' : ''}">
        ${imageMarkup(image, side.name, 'mw-matchup-portrait')}
        <div class="mw-matchup-identity"><span class="mw-matchup-role">${sideIndex === 0 ? 'RED CORNER' : 'OPPOSITE CORNER'}</span><strong class="mw-matchup-name">${esc(side.name)}</strong>${side.participantNames?.length > 1 && norm(side.name) !== norm(side.participantNames.join(' / ')) ? `<small>${esc(side.participantNames.join(' · '))}</small>` : ''}</div>
        ${winnerIndex === sideIndex ? '<span class="mw-matchup-winner" aria-label="Ganador">W</span>' : ''}
      </div>`;
      const score = complete ? `${left.score}<span>:</span>${right.score}` : '—<span>:</span>—';
      const resultText = complete ? (winnerIndex === -1 ? 'EMPATE' : `GANADOR: ${winnerIndex === 0 ? left.name : right.name}`) : 'RESULTADO PENDIENTE';
      return `<article class="mw-tournament-score-card" data-match-id="${esc(match.id)}">${championship}
        <div class="mw-matchup-bar">${sideHTML(left, 0, leftImage)}
          <div class="mw-matchup-scoreboard" aria-label="Marcador ${complete ? `${left.score} a ${right.score}` : 'pendiente'}"><span class="mw-matchup-scoreboard__label">SCORE</span><strong>${score}</strong><span class="mw-matchup-scoreboard__state">${esc(resultText)}</span></div>
          ${sideHTML(right, 1, rightImage)}</div>
        <div class="mw-tournament-score-meta"><span>${esc(meta)}</span>${event ? `<a href="${href('event.html', event.id)}">VER EVENTO ↗</a>` : ''}</div>
      </article>`;
    }

    function stageResults(stage, stageMatchList) {
      const visible = stageMatchList.filter(match => !isTitleMatch(match));
      if (!visible.length) return '';
      const event = eventById.get(String(stage.eventId || ''));
      const title = stage.name || stage.title || 'Resultados';
      return `<section class="mw-tournament-panel mw-tournament-panel--results"><div class="mw-tournament-panel__heading"><div><span class="mw-event-kicker">${esc(String(stage.type || 'RESULTADOS').replace(/[-_]/g, ' ').toUpperCase())}</span><h2>${esc(title)}</h2></div><span class="mw-tournament-panel__count">${visible.length} COMBATE${visible.length === 1 ? '' : 'S'}</span></div>
        ${stage.date ? `<p class="mw-stage-date">${esc(formatDate(stage.date))}</p>` : ''}${event ? `<a class="mw-tournament-event-link" href="${href('event.html', event.id)}">${esc(event.title || event.name || event.id)} · VER CARTELERA ↗</a>` : ''}
        <div class="mw-tournament-results-list">${visible.map(matchScoreCard).join('')}</div></section>`;
    }

    function renderBracket(stage, stageMatchList) {
      if (!stageMatchList.length) return '';
      // Prefer explicit round metadata. Fall back to the complete stage as one round; never infer rounds from array length.
      const roundMap = new Map();
      stageMatchList.forEach((match, index) => {
        const round = match.roundName || match.round || match.bracketRound || match.phaseName || stage.roundName || stage.name || 'FASE ELIMINATORIA';
        const key = String(round);
        if (!roundMap.has(key)) roundMap.set(key, { title: key, order: num(match.roundOrder ?? match.order, index), matches: [] });
        roundMap.get(key).matches.push(match);
      });
      const rounds = [...roundMap.values()].sort((a, b) => a.order - b.order);
      const event = eventById.get(String(stage.eventId || ''));
      return `<section class="mw-tournament-panel mw-tournament-panel--bracket"><div class="mw-tournament-panel__heading"><div><span class="mw-event-kicker">KNOCKOUT ROAD</span><h2>${esc(stage.name || stage.title || 'Bracket')}</h2></div><span class="mw-tournament-panel__count">${stageMatchList.length} COMBATE${stageMatchList.length === 1 ? '' : 'S'}</span></div>
        ${event ? `<a class="mw-tournament-event-link" href="${href('event.html', event.id)}">VER EVENTO VINCULADO ↗</a>` : ''}<div class="mw-tournament-bracket">${rounds.map(round => `<section class="mw-tournament-bracket-round"><h3>${esc(round.title)}</h3><div class="mw-tournament-bracket-round__matches">${round.matches.map(matchScoreCard).join('')}</div></section>`).join('')}</div></section>`;
    }

    const titleMatches = tournamentMatches.filter(isTitleMatch);
    const regularStages = stages.filter(stage => ['league', 'round robin', 'round-robin', 'zone', 'group'].includes(norm(stage.type)));
    const zoneEntries = tournament.zones && typeof tournament.zones === 'object' ? Object.entries(tournament.zones) : [];
    let standingsHTML = '', matrixHTML = '';
    if (zoneEntries.length) {
      const peopleForZone = entries => entries.map(entry => {
        if (typeof entry === 'string') return roster.find(person => norm(person.name) === norm(entry)) || { id: entry, name: entry, wrestler: wrestlerByName.get(norm(entry)) || null };
        const name = entry?.name || wrestlerById.get(String(entry?.wrestlerId || entry?.id || ''))?.name || '';
        return name ? roster.find(person => norm(person.name) === norm(name)) || { id: entry.id || entry.wrestlerId || name, name, wrestler: wrestlerByName.get(norm(name)) || null } : null;
      }).filter(Boolean);
      standingsHTML = zoneEntries.map(([zone, entries]) => {
        const zonePeople = peopleForZone(list(entries));
        const zoneStages = regularStages.filter(stage => norm(stage.zone) === norm(zone) || norm(stage.name).includes(norm(zone)));
        const zoneMatches = unique(zoneStages.flatMap(stage => stageMatches(stage).filter(match => canCount(match, stage))).map(match => String(match.id))).map(matchId => matchById.get(matchId)).filter(Boolean);
        return renderStandings(zonePeople, zoneMatches, `Tabla · Zona ${zone}`);
      }).join('');
      matrixHTML = zoneEntries.map(([zone, entries]) => {
        const zonePeople = peopleForZone(list(entries));
        const zoneStages = regularStages.filter(stage => norm(stage.zone) === norm(zone) || norm(stage.name).includes(norm(zone)));
        const zoneMatches = unique(zoneStages.flatMap(stage => stageMatches(stage).filter(match => canCount(match, stage))).map(match => String(match.id))).map(matchId => matchById.get(matchId)).filter(Boolean);
        return renderMatrix(zonePeople, zoneMatches, `Matriz · Zona ${zone}`);
      }).join('');
    } else if (regularStages.length) {
      const leagueMatches = unique(regularStages.flatMap(stage => stageMatches(stage).filter(match => canCount(match, stage))).map(match => String(match.id))).map(matchId => matchById.get(matchId)).filter(Boolean);
      standingsHTML = renderStandings(roster, leagueMatches, 'Tabla general');
      matrixHTML = renderMatrix(roster, leagueMatches, 'Matriz de enfrentamientos');
    }

    const stageHTML = stages.map(stage => {
      const stageMatchList = stageMatches(stage);
      const type = norm(stage.type);
      if (type === 'bracket' || type === 'knockout' || type === 'elimination') return renderBracket(stage, stageMatchList) || stageResults(stage, stageMatchList);
      return stageResults(stage, stageMatchList);
    }).join('');

    const extraHTML = titleMatches.length ? `<section class="mw-tournament-panel mw-tournament-panel--bonus"><div class="mw-tournament-panel__heading"><div><span class="mw-event-kicker">CHAMPIONSHIP BOUTS</span><h2>Combates por campeonatos</h2><p>Se muestran aparte para evitar que alteren la clasificación de la liga.</p></div><span class="mw-tournament-panel__count">${titleMatches.length} COMBATE${titleMatches.length === 1 ? '' : 'S'}</span></div>
      <div class="mw-tournament-results-list">${titleMatches.map(match => `<div class="mw-tournament-extra-match">${matchScoreCard(match)}</div>`).join('')}</div></section>` : '';

    const finalLink = tournament.final?.eventId || tournament.final?.event || tournament.finalEvent;
    const finalEvent = finalLink ? eventById.get(String(finalLink)) : null;
    const finalHTML = finalLink ? `<section class="mw-tournament-panel mw-tournament-final-event"><div class="mw-tournament-panel__heading"><div><span class="mw-event-kicker">FINAL DESTINATION</span><h2>${esc(tournament.final?.bracketTitle || finalEvent?.title || finalEvent?.name || 'Evento final')}</h2></div>${finalEvent ? `<a class="mw-tournament-event-link" href="${href('event.html', finalEvent.id)}">ABRIR EVENTO ↗</a>` : `<span class="mw-tournament-panel__count">ID: ${esc(finalLink)}</span>`}</div>${finalEvent ? `<p>${esc(formatDate(finalEvent.date))} · ${esc(finalEvent.title || finalEvent.name || finalEvent.id)}</p>` : ''}</section>` : '';

    const format = tournament.formatLabel || String(tournament.format || 'Formato flexible').replace(/[_-]/g, ' ');
    const dateLine = tournament.startDate ? `<span>${esc(formatDate(tournament.startDate))}${tournament.endDate && tournament.endDate !== tournament.startDate ? ` — ${esc(formatDate(tournament.endDate))}` : ''}</span>` : '';
    main.innerHTML = `<a class="mw-event-back" href="tournaments.html">← VOLVER AL ARCHIVO</a>
      <header class="mw-tournament-hero"><div class="mw-tournament-hero__eyebrow"><span class="mw-live-mark"></span> ${esc(tournament.brand || 'MI WRESTLING')} <i>/</i> ${esc(tournament.year || 'ARCHIVE')}</div>
        <h1>${esc(tournament.name || tournament.title || tournament.id)}</h1><p class="mw-tournament-hero__lead">${esc(format)}${tournament.division ? ` <span class="mw-hero-separator">/</span> ${esc(tournament.division)}` : ''}</p>
        <div class="mw-tournament-hero__stats"><span><b>${roster.length}</b> PARTICIPANTES</span><span><b>${tournamentMatches.length}</b> COMBATES VINCULADOS</span><span><b>${stages.length}</b> FASES</span>${dateLine}</div>
      </header>
      <section class="mw-tournament-panel mw-tournament-panel--draft"><div class="mw-tournament-panel__heading"><div><span class="mw-event-kicker">ROSTER / DRAFT BOARD</span><h2>Participantes</h2></div><span class="mw-tournament-panel__count">${roster.length} ATLETAS</span></div>${draftHTML()}</section>
      ${standingsHTML}${matrixHTML}
      <section class="mw-tournament-panel mw-tournament-panel--road"><div class="mw-tournament-panel__heading"><div><span class="mw-event-kicker">ROAD TO GLORY</span><h2>Fases y resultados</h2></div><span class="mw-tournament-panel__count">${stages.length} FASE${stages.length === 1 ? '' : 'S'}</span></div>${stageHTML || '<div class="mw-event-empty">Este torneo todavía no tiene fases conectadas.</div>'}</section>
      ${finalHTML}${extraHTML}`;

    bindInteractions({ matchById, wrestlers, personas, events, teams, matchScoreCard, calculateStandings });
    document.title = `${tournament.name || tournament.title || tournament.id} | MI WRESTLING 2.0`;
  }

  function bindInteractions(context) {
    $$('.mw-table-difference-toggle').forEach(button => button.addEventListener('click', () => {
      const panel = button.closest('.mw-tournament-panel--standings');
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      panel?.classList.toggle('show-difference', open);
      const icon = $('.mw-table-toggle-icon', button);
      if (icon) icon.textContent = open ? '−' : '+';
      button.lastChild && (button.setAttribute('aria-label', open ? 'Ocultar diferencia de rondas' : 'Ver diferencia de rondas'));
    }));

    $$('.mw-tournament-table [data-sort]').forEach(button => button.addEventListener('click', () => {
      const table = button.closest('table');
      const body = $('tbody', table);
      if (!body) return;
      const key = button.dataset.sort;
      const ascending = button.dataset.order !== 'asc';
      $$('.mw-tournament-table [data-sort]', table).forEach(other => { if (other !== button) other.dataset.order = ''; });
      button.dataset.order = ascending ? 'asc' : 'desc';
      const rows = $$('tr[data-row]', body);
      rows.sort((a, b) => {
        const av = a.dataset[key] ?? '';
        const bv = b.dataset[key] ?? '';
        if (key === 'name') return ascending ? av.localeCompare(bv, 'es') : bv.localeCompare(av, 'es');
        return ascending ? num(av) - num(bv) : num(bv) - num(av);
      });
      rows.forEach((row, index) => {
        const position = $('.mw-table-position span', row) || $('.mw-table-position', row);
        if (position) position.textContent = String(index + 1).padStart(2, '0');
        row.classList.toggle('is-leader', index === 0);
        row.classList.toggle('is-last', index === rows.length - 1 && rows.length > 1);
        body.appendChild(row);
      });
    }));

    $$('.matrix-cell').forEach(button => button.addEventListener('click', () => {
      const panel = button.closest('.mw-tournament-panel--matrix');
      const host = $('.mw-tournament-matrix-detail', panel);
      if (!host) return;
      $$('.matrix-cell.is-selected', panel).forEach(cell => cell.classList.remove('is-selected'));
      button.classList.add('is-selected');
      const ids = String(button.dataset.matches || '').split(',').filter(Boolean);
      const selected = ids.map(matchId => context.matchById.get(String(matchId))).filter(Boolean);
      const cards = selected.map(match => context.matchScoreCard(match)).join('');
      host.innerHTML = `<span class="mw-matrix-detail__eyebrow">${selected.length} COMBATE${selected.length === 1 ? '' : 'S'} EN ESTE CRUCE</span>${cards || '<p>No hay resultados completos asociados a este cruce.</p>'}`;
    }));
  }

  async function init() {
    try {
      const [standard, outsiders, matches, wrestlers, personas, events, teams] = await Promise.all([
        fetchJSON('data/tournaments/tournaments.json'),
        loadOptional('data/tournaments/outsider-tournaments.json'),
        fetchJSON('data/matches/matches.json'),
        fetchJSON('data/wrestlers/wrestlers.json'),
        loadOptional('data/personas/personas.json'),
        fetchJSON('data/events/events.json'),
        loadOptional('data/teams/teams.json')
      ]);
      const data = { matches: list(matches), wrestlers: list(wrestlers), personas: list(personas), events: list(events), teams: list(teams), allTournaments: [...list(standard), ...list(outsiders)] };
      const params = new URLSearchParams(window.location.search);
      const tournamentId = params.get('id');
      if (!tournamentId) { renderCatalog(data.allTournaments); return; }
      const tournament = data.allTournaments.find(item => String(item.id) === String(tournamentId));
      if (!tournament) {
        main.innerHTML = `<section class="mw-event-empty mw-tournament-error"><span class="mw-event-kicker">404 / TOURNAMENT NOT FOUND</span><h1>Torneo no encontrado</h1><p>No existe un torneo con el ID <code>${esc(tournamentId)}</code>.</p><a class="mw-tournament-action" href="tournaments.html">Volver al archivo</a></section>`;
        return;
      }
      buildTournamentPage(data, tournament);
    } catch (error) { showError(error); }
  }

  init();
})();
