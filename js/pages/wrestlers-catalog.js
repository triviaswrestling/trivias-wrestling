/* ============================================================================
   MI WRESTLING 2.0 — CATÁLOGO WWE 2K
   Filtros dinámicos por marca, campeones actuales y carga ligera de perfiles.
   No descarga retratos extra ni duplica fichas: renderiza únicamente tarjetas visibles.
   ============================================================================ */
(function () {
  "use strict";
  const root = document.querySelector("[data-wrestlers-catalog]");
  if (!root || !window.MIWrestlerCards) return;

  const pageType = root.dataset.wrestlersCatalog || document.body.dataset.page || "roster";
  const grid = root.querySelector(".roster-grid-container");
  const filters = root.querySelector("[data-brand-filters]");
  const count = root.querySelector("[data-wrestler-count]");
  const championsRoot = root.querySelector("[data-current-champions]");
  let allWrestlers = [];
  let selectedBrand = "all";
  const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const isInactive = (w) => /inactive|retired|alumni|retirad/i.test(String(w.status || ""));
  const relevant = () => allWrestlers.filter((w) => pageType === "alumni" ? isInactive(w) : !isInactive(w));

  function renderBrandFilters() {
    if (!filters) return;
    const list = relevant();
    const brands = [...new Set(list.map((w) => String(w.brand || "").trim()).filter(Boolean))]
      .sort((a,b) => a.localeCompare(b, "es", { sensitivity: "base" }));
    // Solo se crean botones para marcas realmente presentes en esta sección.
    filters.innerHTML = [{label:"TODAS", value:"all"}, ...brands.map((brand) => ({label:brand.toUpperCase(),value:brand}))]
      .map((item) => `<button type="button" class="mw-brand-filter${normalize(item.value) === normalize(selectedBrand) ? " is-active" : ""}" data-brand-value="${escapeHTML(item.value)}" aria-pressed="${normalize(item.value) === normalize(selectedBrand)}">${escapeHTML(item.label)}</button>`).join("");
    filters.querySelectorAll("[data-brand-value]").forEach((button) => button.addEventListener("click", () => {
      selectedBrand = button.dataset.brandValue || "all";
      filters.querySelectorAll("[data-brand-value]").forEach((b) => {
        const active = normalize(b.dataset.brandValue) === normalize(selectedBrand);
        b.classList.toggle("is-active", active); b.setAttribute("aria-pressed", String(active));
      });
      applyFilters();
    }));
  }

  function applyFilters() {
    const filtered = relevant().filter((w) => selectedBrand === "all" || normalize(w.brand) === normalize(selectedBrand));
    window.MIWrestlerCards.renderCatalog(grid, filtered, { status: "all" });
    if (count) count.textContent = `${filtered.length} ${pageType === "alumni" ? "LEYENDAS" : "SUPERSTRELLAS"}`;
  }

  function getTitleName(title) { return title.name || title.title || title.nombre || title.championshipName || "Campeonato"; }
  function getTitleId(title) { return title.id || title.championshipId || title.titleId || ""; }
  function renderChampions(titles, reigns) {
    if (!championsRoot) return;
    const active = (Array.isArray(reigns) ? reigns : []).filter((r) => {
      const status = normalize(r.status || r.state || "");
      return r.current === true || r.isCurrent === true || r.endDate == null && (status === "current" || status === "active" || status === "actual");
    });
    const currentTitles = (Array.isArray(titles) ? titles : []).filter((t) => t.currentChampionId || t.championId || t.currentChampion || t.champion || t.holderId);
    const cards = [];
    currentTitles.forEach((title) => {
      const championId = title.currentChampionId || title.championId || title.holderId;
      const championName = title.currentChampion || title.champion || allWrestlers.find((w) => w.id === championId)?.name || "Campeón por confirmar";
      cards.push({title:getTitleName(title), champion:championName, brand:title.brand || title.promotion || title.company || "MI WRESTLING", image:title.championImage || allWrestlers.find((w) => w.id === championId)?.image || "", href:`championship.html?id=${encodeURIComponent(getTitleId(title))}`});
    });
    active.forEach((reign) => {
      const title = titles.find((t) => getTitleId(t) === (reign.championshipId || reign.titleId || reign.championship));
      if (!title) return;
      const champ = allWrestlers.find((w) => w.id === (reign.wrestlerId || reign.championId));
      cards.push({title:getTitleName(title),champion:reign.championName || champ?.name || "Campeón por confirmar",brand:title.brand || title.promotion || "MI WRESTLING",image:champ?.image || "",href:`championship.html?id=${encodeURIComponent(getTitleId(title))}`});
    });
    const unique = [...new Map(cards.map((c) => [`${c.title}|${c.champion}`,c])).values()];
    championsRoot.innerHTML = `<div class="mw-champions-heading"><span class="mw-champions-kicker">THE GOLD STANDARD</span><h2>CAMPEONES ACTUALES</h2><span class="mw-champions-rule"></span></div>` +
      (unique.length ? `<div class="mw-champions-track">${unique.map((c) => `<a class="mw-champion-card" href="${escapeHTML(c.href)}"><span class="mw-champion-card__shine"></span>${c.image ? `<img src="${escapeHTML(c.image)}" alt="" loading="lazy" onerror="this.remove()">` : `<span class="mw-champion-card__crest" aria-hidden="true">♛</span>`}<span class="mw-champion-card__copy"><small>${escapeHTML(c.brand)}</small><strong>${escapeHTML(c.champion)}</strong><span>${escapeHTML(c.title)}</span></span><span class="mw-champion-card__arrow">↗</span></a>`).join("")}</div>` : `<p class="mw-champions-empty">El archivo de campeonatos todavía no tiene reinados vigentes registrados.</p>`);
  }

  async function readJSON(path, fallback) {
    try { const response = await fetch(path, {cache:"no-cache"}); if (!response.ok) return fallback; const value = await response.json(); return value; }
    catch (_) { return fallback; }
  }
  async function init() {
    if (grid) grid.innerHTML = '<p class="mw-catalog-loading">CARGANDO ARCHIVO DE SUPERSTRELLAS…</p>';
    try {
      const [wrestlers, championships, reigns] = await Promise.all([
        readJSON("data/wrestlers/wrestlers.json", []),
        readJSON("data/championships/championships.json", []),
        readJSON("data/reigns/reigns.json", [])
      ]);
      allWrestlers = Array.isArray(wrestlers) ? wrestlers : (wrestlers.wrestlers || []);
      renderBrandFilters(); applyFilters();
      renderChampions(Array.isArray(championships) ? championships : championships.championships || [], Array.isArray(reigns) ? reigns : reigns.reigns || []);
    } catch (error) {
      console.error("No se pudo cargar el roster", error);
      if (grid) grid.innerHTML = '<p class="mw-catalog-error">No se pudo cargar el archivo. Comprobá los datos publicados.</p>';
    }
  }
  init();
})();
