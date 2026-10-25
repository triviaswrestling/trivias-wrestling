
/* ============================================================================
   MI WRESTLING 2.0 — ROSTER POR DIVISIONES
   MAIN ROSTER: RAW + SMACKDOWN
   DEVELOPMENT: NXT + AAA
   Conserva filtros, campeones, fichas y modales.
   ============================================================================ */

(function () {
  "use strict";

  const root = document.querySelector("[data-wrestlers-catalog]");
  if (!root || !window.MIWrestlerCards) return;

  const pageType =
    root.dataset.wrestlersCatalog ||
    document.body.dataset.page ||
    "roster";

  const grid = root.querySelector(".roster-grid-container");
  const filters = root.querySelector("[data-brand-filters]");
  const count = root.querySelector("[data-wrestler-count]");
  const championsRoot = root.querySelector("[data-current-champions]");

  let allWrestlers = [];
  let selectedBrand = "all";

  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));

  const isInactive = (w) =>
    /inactive|retired|alumni|retirad/i.test(String(w.status || ""));

  const relevant = () =>
    allWrestlers.filter((w) =>
      pageType === "alumni" ? isInactive(w) : !isInactive(w)
    );

  /* =========================================================
     IDENTIFICAR LA DIVISIÓN DE CADA LUCHADOR
     ========================================================= */

  function getDivision(wrestler) {
    const brand = normalize(wrestler.brand);

    if (brand.includes("smack") || brand === "sd") {
      return "main";
    }

    if (brand.includes("raw")) {
      return "main";
    }

    if (brand.includes("nxt") || brand.includes("aaa")) {
      return "development";
    }

    return "other";
  }

  function renderBrandFilters() {
    if (!filters) return;

    const brands = [
      ...new Set(
        relevant()
          .map((w) => String(w.brand || "").trim())
          .filter(Boolean)
      )
    ].sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );

    const options = [
      { label: "TODAS", value: "all" },
      ...brands.map((brand) => ({
        label: brand.toUpperCase(),
        value: brand
      }))
    ];

    filters.innerHTML = options.map((item) => {
      const active =
        normalize(item.value) === normalize(selectedBrand);

      return `
        <button
          type="button"
          class="mw-brand-filter${active ? " is-active" : ""}"
          data-brand-value="${escapeHTML(item.value)}"
          aria-pressed="${active}"
        >${escapeHTML(item.label)}</button>
      `;
    }).join("");

    filters.querySelectorAll("[data-brand-value]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedBrand = button.dataset.brandValue || "all";

        filters.querySelectorAll("[data-brand-value]").forEach((item) => {
          const active =
            normalize(item.dataset.brandValue) === normalize(selectedBrand);

          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });

        applyFilters();
      });
    });
  }

  /* =========================================================
     CREAR SECCIONES Y RENDERIZAR LAS TARJETAS
     ========================================================= */

  function renderDivision(title, subtitle, wrestlers, className) {
    if (!wrestlers.length) return "";

    return `
      <section class="mw-roster-division mw-roster-division--${className}">
        <header class="mw-roster-division__header">
          <div class="mw-roster-division__heading">
            <span class="mw-roster-division__eyebrow">
              MI WRESTLING 2.0 · ROSTER
            </span>
            <h2 class="mw-roster-division__title">
              ${title}
            </h2>
            <p class="mw-roster-division__subtitle">
              ${subtitle}
            </p>
          </div>
          <span class="mw-roster-division__count">
            ${wrestlers.length} ${wrestlers.length === 1 ? "SUPERSTAR" : "SUPERSTARS"}
          </span>
        </header>

        <div class="roster-grid-container mw-roster-division__grid"
             data-division-grid="${className}"></div>
      </section>
    `;
  }

  function applyFilters() {
    if (!grid) return;

    const filtered = relevant().filter((w) =>
      selectedBrand === "all" ||
      normalize(w.brand) === normalize(selectedBrand)
    );

    if (count) {
      count.textContent =
        `${filtered.length} ${pageType === "alumni" ? "LEYENDAS" : "SUPERSTRELLAS"}`;
    }

    /* Alumni conserva su catálogo original, sin divisiones de marcas. */
    if (pageType === "alumni") {
      window.MIWrestlerCards.renderCatalog(grid, filtered, {
        status: "all"
      });
      return;
    }

    const mainRoster = filtered.filter(
      (w) => getDivision(w) === "main"
    );

    const development = filtered.filter(
      (w) => getDivision(w) === "development"
    );

    const otherBrands = filtered.filter(
      (w) => getDivision(w) === "other"
    );

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="mw-empty-state">
          No hay superestrellas para mostrar con este filtro.
        </div>
      `;
      return;
    }

    grid.innerHTML = [
      renderDivision(
        "MAIN ROSTER",
        "RAW · SMACKDOWN",
        mainRoster,
        "main"
      ),
      renderDivision(
        "DEVELOPMENT",
        "NXT · AAA",
        development,
        "development"
      ),
      renderDivision(
        "OTRAS MARCAS",
        "SUPERSTARS DATABASE",
        otherBrands,
        "other"
      )
    ].join("");

    /*
     * Cada luchador se renderiza una sola vez.
     * El componente compartido conserva las fichas y los modales.
     */
    [
      ["main", mainRoster],
      ["development", development],
      ["other", otherBrands]
    ].forEach(([division, wrestlers]) => {
      const container = grid.querySelector(
        `[data-division-grid="${division}"]`
      );

      if (container && wrestlers.length) {
        window.MIWrestlerCards.renderCatalog(
          container,
          wrestlers,
          { status: "all" }
        );
      }
    });
  }

  /* =========================================================
     CAMPEONATOS
     ========================================================= */

  function getTitleName(title) {
    return title.name || title.title || title.nombre ||
      title.championshipName || "Campeonato";
  }

  function getTitleId(title) {
    return title.id || title.championshipId || title.titleId || "";
  }

  function renderChampions(titles, reigns) {
    if (!championsRoot) return;

    const safeTitles = Array.isArray(titles) ? titles : [];
    const safeReigns = Array.isArray(reigns) ? reigns : [];

    const active = safeReigns.filter((reign) => {
      const status = normalize(reign.status || reign.state || "");

      return reign.current === true ||
        reign.isCurrent === true ||
        (
          reign.endDate == null &&
          ["current", "active", "actual"].includes(status)
        );
    });

    const cards = [];

    safeTitles.forEach((title) => {
      const championId =
        title.currentChampionId ||
        title.championId ||
        title.holderId;

      const champion = allWrestlers.find(
        (w) => String(w.id) === String(championId)
      );

      const championName =
        title.currentChampion ||
        title.champion ||
        champion?.name;

      if (!championName) return;

      cards.push({
        title: getTitleName(title),
        champion: championName,
        brand: title.brand || title.promotion || title.company || "",
        image: title.championImage || champion?.image || "",
        href: `championship.html?id=${encodeURIComponent(getTitleId(title))}`,
        division: champion ? getDivision(champion) : "other"
      });
    });

    active.forEach((reign) => {
      const title = safeTitles.find((item) =>
        String(getTitleId(item)) === String(
          reign.championshipId || reign.titleId || reign.championship
        )
      );

      if (!title) return;

      const champion = allWrestlers.find((w) =>
        String(w.id) === String(reign.wrestlerId || reign.championId)
      );

      cards.push({
        title: getTitleName(title),
        champion: reign.championName || champion?.name || "",
        brand: title.brand || title.promotion || title.company || "",
        image: champion?.image || "",
        href: `championship.html?id=${encodeURIComponent(getTitleId(title))}`,
        division: champion ? getDivision(champion) : "other"
      });
    });

    const unique = [
      ...new Map(
        cards
          .filter((card) => card.champion)
          .map((card) => [`${card.title}|${card.champion}`, card])
      ).values()
    ];

    function championSection(title, subtitle, division, className) {
      const items = unique.filter((card) => card.division === division);

      if (!items.length) return "";

      return `
        <section class="mw-champions-division mw-champions-division--${className}">
          <header class="mw-champions-division__header">
            <h3>${title}</h3>
            <span>${subtitle}</span>
          </header>
          <div class="mw-champions-track">
            ${items.map((card) => `
              <a class="mw-champion-card" href="${escapeHTML(card.href)}">
                <span class="mw-champion-card__shine"></span>
                ${card.image
                  ? `<img src="${escapeHTML(card.image)}" alt="" loading="lazy" onerror="this.remove()">`
                  : `<span class="mw-champion-card__crest" aria-hidden="true">♛</span>`
                }
                <span class="mw-champion-card__copy">
                  <small>${escapeHTML(card.brand)}</small>
                  <strong>${escapeHTML(card.champion)}</strong>
                  <span>${escapeHTML(card.title)}</span>
                </span>
                <span class="mw-champion-card__arrow">↗</span>
              </a>
            `).join("")}
          </div>
        </section>
      `;
    }

    championsRoot.innerHTML = `
      <div class="mw-champions-heading">
        <span class="mw-champions-kicker">THE GOLD STANDARD</span>
        <h2>CAMPEONES ACTUALES</h2>
        <span class="mw-champions-rule"></span>
      </div>
      ${
        unique.length
          ? (
              championSection(
                "MAIN ROSTER",
                "RAW · SMACKDOWN",
                "main",
                "main"
              ) +
              championSection(
                "DEVELOPMENT",
                "NXT · AAA",
                "development",
                "development"
              ) +
              championSection(
                "OTRAS MARCAS",
                "CHAMPIONSHIP ARCHIVE",
                "other",
                "other"
              )
            )
          : `<p class="mw-champions-empty">Todavía no hay campeones actuales registrados.</p>`
      }
    `;
  }

  /* =========================================================
     CARGA DE DATOS
     ========================================================= */

  async function readJSON(path, fallback) {
    try {
      const response = await fetch(path, { cache: "no-cache" });

      if (!response.ok) return fallback;

      return await response.json();
    } catch (_) {
      return fallback;
    }
  }

  async function init() {
    if (grid) {
      grid.innerHTML =
        '<p class="mw-catalog-loading">CARGANDO ARCHIVO DE SUPERSTRELLAS…</p>';
    }

    try {
      const [wrestlersData, championshipsData, reignsData] =
        await Promise.all([
          readJSON("data/wrestlers/wrestlers.json", []),
          readJSON("data/championships/championships.json", []),
          readJSON("data/reigns/reigns.json", [])
        ]);

      allWrestlers = Array.isArray(wrestlersData)
        ? wrestlersData
        : (wrestlersData.wrestlers || []);

      const championships = Array.isArray(championshipsData)
        ? championshipsData
        : (championshipsData.championships || []);

      const reigns = Array.isArray(reignsData)
        ? reignsData
        : (reignsData.reigns || []);

      renderBrandFilters();
      applyFilters();
      renderChampions(championships, reigns);
    } catch (error) {
      console.error("No se pudo cargar el roster", error);

      if (grid) {
        grid.innerHTML =
          '<p class="mw-catalog-error">No se pudo cargar el archivo. Comprobá los datos publicados.</p>';
      }
    }
  }

  init();
})();
