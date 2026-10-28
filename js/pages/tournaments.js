/* MI WRESTLING 2.0 — TORNEOS
   Fuentes reales: tournaments.json + outsider-tournaments.json + events.json + matches.json.
   Las plantillas vacías no se presentan como torneos disputados. No modifica datos globales.
*/
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const catalog = $("#mw-tournament-catalog");
  if (!catalog || document.body?.dataset.page !== "tournaments") return;

  const filters = $("#mw-tournament-filters");
  const searchInput = $("#mw-tournament-search");
  const sortSelect = $("#mw-tournament-sort");
  const resultCount = $("#mw-tournament-result-count");
  const stats = $("#mw-tournament-stats");
  const empty = $("#mw-tournament-empty");
  const resetButton = $("#mw-tournament-reset");

  const state = { filter: "all", query: "", sort: "newest", records: [] };
  const norm = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const list = value => Array.isArray(value) ? value : [];

  async function readJSON(path, optional = false) {
    try {
      const response = await fetch(path, { cache: "no-cache" });
      if (!response.ok) throw new Error(`${response.status} ${path}`);
      return await response.json();
    } catch (error) {
      if (optional) return [];
      throw error;
    }
  }

  function getCategory(tournament, relatedEvents) {
    const brand = norm(tournament.brand);
    const promotion = norm(tournament.promotion);
    const id = norm(tournament.id);
    if (brand.includes("championship") || id.startsWith("campeonato-") || id.startsWith("championship-")) return "specials";
    if (brand === "raw" || brand.includes("monday night raw")) return "raw";
    if (brand.includes("smackdown") || brand.includes("friday night smackdown")) return "smackdown";
    if (brand === "nxt" || brand.includes("takeover") || relatedEvents.some(event => norm(event.title).includes("takeover"))) return "nxt";
    if (brand === "speed") return "speed";
    if (brand === "aaa" || promotion === "aaa") return "aaa";
    if (brand === "aew" || promotion === "aew") return "aew";
    return "other";
  }

  const categoryMeta = {
    raw: { label: "RAW", mark: "RAW", subtitle: "MONDAY NIGHT", cls: "raw" },
    smackdown: { label: "SmackDown", mark: "SD", subtitle: "FRIDAY NIGHT", cls: "smackdown" },
    nxt: { label: "NXT + TakeOver", mark: "NXT", subtitle: "+ TAKEOVER", cls: "nxt" },
    speed: { label: "Speed", mark: "SPEED", subtitle: "QUICK-FIRE COMPETITION", cls: "speed" },
    specials: { label: "Especiales", mark: "MW", subtitle: "CHAMPIONSHIP SERIES", cls: "specials" },
    aaa: { label: "AAA", mark: "AAA", subtitle: "LUCHA LIBRE", cls: "aaa" },
    aew: { label: "AEW", mark: "AEW", subtitle: "ELITE COMPETITION", cls: "aew" },
    other: { label: "Torneo", mark: "MW", subtitle: "TOURNAMENT ARCHIVE", cls: "other" }
  };

  function formatLabel(value) {
    const raw = String(value || "Formato no especificado").replace(/_/g, " ").toLowerCase();
    const map = {
      "league elimination": "Liga + eliminación",
      "two zones elimination": "Dos zonas + eliminación",
      "league playin elimination": "Liga + play-in",
      bracket: "Cuadro eliminatorio",
      "round robin": "Todos contra todos"
    };
    return map[raw] || raw.replace(/\b\w/g, char => char.toUpperCase());
  }

  function parseYear(tournament, relatedEvents) {
    const direct = Number(tournament.year);
    if (Number.isFinite(direct) && direct > 1900) return direct;
    const dates = relatedEvents.map(event => String(event.date || "").slice(0, 4)).map(Number).filter(year => year > 1900);
    return dates.length ? Math.max(...dates) : null;
  }

  function tournamentCard(record) {
    const meta = categoryMeta[record.category] || categoryMeta.other;
    const season = record.seasonNumber ? `TEMPORADA ${record.seasonNumber}` : record.category === "specials" ? record.name.toUpperCase() : "ARCHIVO ESPECIAL";
    const related = record.relatedEvents.slice(0, 2).map(event => event.title || event.name || event.id).filter(Boolean);
    const relatedText = related.length ? related.join(" · ") : `${record.participantCount} participantes registrados`;
    const year = record.year ? String(record.year) : "AÑO NO REGISTRADO";
    const id = encodeURIComponent(record.id);
    return `
      <a class="mw-tournament-card mw-tournament-card--${meta.cls}" href="tournament.html?id=${id}" aria-label="Abrir ${esc(record.name)}">
        <div class="mw-tournament-card__art">
          <div class="mw-tournament-card__top"><span class="mw-tournament-card__brand">${esc(meta.label)}</span><span class="mw-tournament-card__season">${esc(season)}</span></div>
          <div class="mw-tournament-card__mark">${esc(meta.mark)}<small>${esc(meta.subtitle)}</small></div>
          <div class="mw-tournament-card__bottom"><span class="mw-tournament-card__year">${esc(year)}</span><span class="mw-tournament-card__format">${esc(formatLabel(record.format))}</span></div>
        </div>
        <div class="mw-tournament-card__body">
          <h3 class="mw-tournament-card__title">${esc(record.name)}</h3>
          <p class="mw-tournament-card__related">${esc(relatedText)}</p>
          <div class="mw-tournament-card__metrics">
            <div class="mw-tournament-card__metric"><strong>${record.matchCount}</strong><span>Combates</span></div>
            <div class="mw-tournament-card__metric"><strong>${record.participantCount}</strong><span>Participantes</span></div>
            <div class="mw-tournament-card__metric"><strong>${record.eventCount}</strong><span>Eventos</span></div>
          </div>
          <div class="mw-tournament-card__open"><span>VER TORNEO Y RESULTADOS</span><b aria-hidden="true">↗</b></div>
        </div>
      </a>`;
  }

  function sortRecords(records) {
    const copy = [...records];
    if (state.sort === "oldest") return copy.sort((a, b) => (a.year ?? 0) - (b.year ?? 0) || (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0) || a.name.localeCompare(b.name, "es"));
    if (state.sort === "name") return copy.sort((a, b) => a.name.localeCompare(b.name, "es"));
    if (state.sort === "matches") return copy.sort((a, b) => b.matchCount - a.matchCount || b.year - a.year);
    return copy.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || (b.seasonNumber ?? 0) - (a.seasonNumber ?? 0) || a.name.localeCompare(b.name, "es"));
  }

  function render() {
    const query = norm(state.query);
    const visible = sortRecords(state.records.filter(record => {
      const matchesCategory = state.filter === "all" || record.category === state.filter;
      const haystack = norm([record.name, record.id, record.brand, record.promotion, record.format, record.year, record.seasonNumber, ...record.relatedEvents.map(event => event.title)].join(" "));
      return matchesCategory && (!query || haystack.includes(query));
    }));
    catalog.innerHTML = visible.map(tournamentCard).join("");
    const categoryLabel = state.filter === "all" ? "torneos" : `${categoryMeta[state.filter]?.label || state.filter}`;
    resultCount.textContent = `${visible.length} ${categoryLabel}${visible.length === 1 ? "" : state.filter === "all" ? " registrados" : " registrados"}`;
    empty.hidden = visible.length > 0;
    catalog.hidden = visible.length === 0;
  }

  function wireControls() {
    filters?.addEventListener("click", event => {
      const button = event.target.closest("button[data-filter]");
      if (!button) return;
      state.filter = button.dataset.filter || "all";
      filters.querySelectorAll("button[data-filter]").forEach(item => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      render();
    });
    searchInput?.addEventListener("input", () => { state.query = searchInput.value; render(); });
    sortSelect?.addEventListener("change", () => { state.sort = sortSelect.value; render(); });
    resetButton?.addEventListener("click", () => {
      state.filter = "all"; state.query = "";
      if (searchInput) searchInput.value = "";
      filters?.querySelectorAll("button[data-filter]").forEach(button => {
        const active = button.dataset.filter === "all";
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      render();
    });
  }

  async function init() {
    wireControls();
    try {
      const [standard, outsiders, events, matches] = await Promise.all([
        readJSON("data/tournaments/tournaments.json"),
        readJSON("data/tournaments/outsider-tournaments.json", true),
        readJSON("data/events/events.json", true),
        readJSON("data/matches/matches.json", true)
      ]);
      const allEvents = list(events);
      const eventById = new Map(allEvents.map(event => [String(event.id), event]));
      const matchById = new Map(list(matches).map(match => [String(match.id), match]));
      const all = new Map();
      [...list(standard), ...list(outsiders)].forEach(tournament => {
        if (tournament?.id) all.set(String(tournament.id), tournament);
      });

      state.records = [...all.values()].filter(tournament => {
        if (tournament.isTemplate === true || tournament.hasData === false || tournament.status === "template") return false;
        const ids = new Set([...list(tournament.matchIds), ...list(tournament.showList).flatMap(show => list(show.matchIds))].map(String));
        const participantCount = list(tournament.participantNames).length || list(tournament.roster).filter(Boolean).length;
        return ids.size > 0 || participantCount > 0 || list(tournament.showList).some(show => Number(show.matchCount) > 0);
      }).map(tournament => {
        const matchIds = new Set([...list(tournament.matchIds), ...list(tournament.showList).flatMap(show => list(show.matchIds))].map(String));
        const linkedMatches = [...matchIds].map(id => matchById.get(id)).filter(Boolean);
        const relatedEventIds = new Set(linkedMatches.map(match => String(match.eventId || "")).filter(Boolean));
        const relatedEvents = [...relatedEventIds].map(id => eventById.get(id)).filter(Boolean);
        const shownEvents = list(tournament.showList).filter(show => show && (Number(show.matchCount) > 0 || list(show.matchIds).length > 0));
        shownEvents.forEach(show => {
          const linked = allEvents.find(event => String(event.id) === String(show.legacyKey) || String(event.id) === String(show.id) || norm(event.title) === norm(show.title));
          if (linked && !relatedEvents.some(event => String(event.id) === String(linked.id))) relatedEvents.push(linked);
        });
        const category = getCategory(tournament, relatedEvents);
        const matchCount = linkedMatches.length || matchIds.size || list(tournament.showList).reduce((sum, show) => sum + (Number(show.matchCount) || 0), 0);
        const participantCount = new Set(list(tournament.participantNames).concat(list(tournament.roster)).map(item => typeof item === "string" ? item.trim() : String(item?.name || "").trim()).filter(Boolean).map(norm)).size;
        return {
          id: String(tournament.id),
          name: String(tournament.name || tournament.title || tournament.id).replace(/\s+/g, " ").trim(),
          brand: tournament.brand || "",
          promotion: tournament.promotion || "",
          category,
          format: tournament.format || "",
          year: parseYear(tournament, relatedEvents),
          seasonNumber: Number.isFinite(Number(tournament.seasonNumber)) ? Number(tournament.seasonNumber) : null,
          matchCount,
          participantCount,
          eventCount: new Set([...relatedEvents.map(event => String(event.id)), ...shownEvents.map(show => String(show.id))]).size,
          relatedEvents: relatedEvents.sort((a, b) => String(a.date || "").localeCompare(String(b.date || ""))),
          raw: tournament
        };
      });

      const totalMatches = new Set(state.records.flatMap(record => list(record.raw.matchIds).map(String))).size;
      const totalEvents = new Set(state.records.flatMap(record => record.relatedEvents.map(event => String(event.id)))).size;
      if (stats) stats.innerHTML = `<div><strong>${state.records.length}</strong><span>TORNEOS CON DATOS</span></div><div><strong>${totalMatches}</strong><span>COMBATES VINCULADOS</span></div><div><strong>${totalEvents}</strong><span>EVENTOS VINCULADOS</span></div>`;
      render();
    } catch (error) {
      console.error("[MIW Torneos] No se pudo cargar el catálogo:", error);
      catalog.hidden = false;
      catalog.innerHTML = `<div class="mw-tournament-empty"><strong>NO SE PUDO CARGAR EL CATÁLOGO</strong><p>Revisá que existan <code>data/tournaments/tournaments.json</code> y la carpeta de datos en la publicación del sitio.</p><small>${esc(error.message || "Error de lectura")}</small></div>`;
      resultCount.textContent = "Error al cargar";
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();

