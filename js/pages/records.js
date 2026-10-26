/* MI WRESTLING 2.0 | RECORDS ARCHIVE */
(async function () {
  "use strict";

  const main = document.querySelector("[data-records-main]");
  if (!main) return;

  const params = new URLSearchParams(location.search);
  const wrestlerId = params.get("wrestler");
  const interpreterId = params.get("interpreter");
  const season = params.get("season");

  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  const link = (label, url, extra = "") =>
    `<a class="mw-record-back" href="${url}">${label}</a>${extra}`;

  const statMarkup = record => `
    <div class="mw-record-stat-grid">
      ${[
        ["VICTORIAS", record.wins],
        ["DERROTAS", record.losses],
        ["EMPATES", record.draws],
        ["COMBATES", record.appearances]
      ].map(([label, value]) => `
        <article class="mw-record-stat">
          <span>${label}</span><strong>${esc(value ?? 0)}</strong>
        </article>
      `).join("")}
    </div>`;

  const empty = message =>
    `<p class="mw-record-empty">${esc(message)}</p>`;

  const catalog = (title, description, items, type) => `
    <section class="mw-record-catalog" data-catalog="${type}">
      <div class="mw-record-catalog__heading">
        <div>
          <p class="mw-record-eyebrow">ARCHIVE / DATABASE</p>
          <h2>${title}</h2>
          <p>${description}</p>
        </div>
        <span class="mw-record-count">${items.length}</span>
      </div>
      <label class="mw-record-search">
        <span aria-hidden="true">⌕</span>
        <input type="search" data-record-search="${type}"
          placeholder="BUSCAR ${title}…" autocomplete="off">
      </label>
      <div class="mw-record-links" data-record-list="${type}">
        ${items.map(item => `
          <a class="mw-record-link" href="${item.url}"
             data-record-name="${esc(item.search)}">
            <span class="mw-record-link__name">${esc(item.name)}</span>
            <span class="mw-record-link__arrow" aria-hidden="true">↗</span>
          </a>
        `).join("") || empty("Todavía no hay registros disponibles.")}
      </div>
      <p class="mw-record-no-results" data-record-empty="${type}" hidden>
        No se encontraron resultados.
      </p>
    </section>`;

  function bindSearch() {
    main.querySelectorAll("[data-record-search]").forEach(input => {
      input.addEventListener("input", () => {
        const type = input.dataset.recordSearch;
        const query = input.value.trim().toLocaleLowerCase("es");
        const list = main.querySelector(`[data-record-list="${type}"]`);
        const emptyState = main.querySelector(`[data-record-empty="${type}"]`);
        let visible = 0;

        list?.querySelectorAll(".mw-record-link").forEach(item => {
          const match = item.dataset.recordName
            .toLocaleLowerCase("es").includes(query);
          item.hidden = !match;
          if (match) visible++;
        });

        if (emptyState) emptyState.hidden = visible > 0;
      });
    });
  }

  try {
    const [wrestlers, personas, matches, events, tournaments, championshipData] =
      await Promise.all([
        fetch("data/wrestlers/wrestlers.json").then(response => {
          if (!response.ok) throw Error("No se pudo cargar el registro de superestrellas.");
          return response.json();
        }),
        fetch("data/personas/personas.json").then(response =>
          response.ok ? response.json() : []),
        fetch("data/matches/matches.json").then(response =>
          response.ok ? response.json() : []),
        fetch("data/events/events.json").then(response =>
          response.ok ? response.json() : []),
        fetch("data/tournaments/tournaments.json").then(response =>
          response.ok ? response.json() : []),
        window.MIW_CHAMPIONSHIP_HISTORY
          ? window.MIW_CHAMPIONSHIP_HISTORY.load()
          : Promise.resolve(null)
      ]);

    if (!Array.isArray(wrestlers) || !Array.isArray(personas) ||
        !Array.isArray(matches)) {
      throw Error("El formato de los datos del archivo no es válido.");
    }

    if (championshipData) championshipData.wrestlers = wrestlers;

    /* FICHA DE SUPERSTRELLA */
    if (wrestlerId) {
      const wrestler = wrestlers.find(item => String(item.id) === wrestlerId);
      if (!wrestler) throw Error("No se encontró esa superestrella.");

      const own = matches.filter(match =>
        (match.participants || []).some(
          participant => String(participant.wrestlerId) === String(wrestler.id)
        )
      );

      const record = window.MIW_STATS?.recordForWrestler(
        matches, wrestler.id, season
      ) || {
        wins: 0, losses: 0, draws: 0,
        appearances: own.length, winRate: 0
      };

      const legacy = wrestler.record || wrestler.legacyStats || {};
      const recordHTML = own.length
        ? statMarkup(record)
        : `<section class="mw-record-legacy">
             <h2>Récord histórico conservado</h2>
             <div class="mw-record-stat-grid">
               <article class="mw-record-stat">
                 <span>RÉCORD 2026</span>
                 <strong>${esc(legacy.season2026 || legacy.overall2026 || "Sin datos")}</strong>
               </article>
               <article class="mw-record-stat">
                 <span>RÉCORD DE CARRERA</span>
                 <strong>${esc(legacy.career || legacy.careerOverall || "Sin datos")}</strong>
               </article>
             </div>
             <p>Se conservan los valores históricos originales. Todavía no hay suficientes registros individuales para reconstruir todos los combates.</p>
           </section>`;

      const titleCards = championshipData
        ? window.MIW_CHAMPIONSHIP_HISTORY.titleCards(wrestler.id, championshipData)
        : "";

      const timeline = championshipData
        ? window.MIW_CHAMPIONSHIP_HISTORY.tournamentTimeline(
            wrestler.id, { ...championshipData, tournaments, matches, events }
          )
        : "";

      const cards = own.length && window.MIW_MATCH_CARD
        ? own.map(match => window.MIW_MATCH_CARD.render(
            match, { wrestlers, personas, events }
          )).join("")
        : empty("Todavía no hay combates individuales vinculados a esta superestrella.");

      main.innerHTML = `
        <header class="mw-record-hero">
          <p class="mw-record-eyebrow">MI WRESTLING 2.0 / SUPERSTAR ARCHIVE</p>
          <h1>${esc(wrestler.name)}</h1>
          <p>Récord individual${season ? ` · Temporada ${esc(season)}` : ""}</p>
        </header>
        ${recordHTML}
        ${titleCards ? `<section class="mw-record-note mw-record-titles">
          <h2>Campeonatos ganados</h2>${titleCards}
        </section>` : ""}
        <section class="mw-record-note mw-record-tournaments">
          <h2>Cronología de torneos</h2>
          ${timeline || empty("No hay una cronología disponible.")}
        </section>
        <section class="mw-record-note">
          <h2>Historial de combates</h2>${cards}
        </section>
        ${link("← VOLVER AL ARCHIVO", "records.html")}
        ${link("VER FICHA DE SUPERSTRELLA",
          `superstar.html?id=${encodeURIComponent(wrestler.id)}`)}`;

      document.title = `Récord de ${wrestler.name} | MI WRESTLING 2.0`;
      return;
    }

    /* FICHA DE INTÉRPRETE */
    if (interpreterId) {
      const person = personas.find(item => String(item.id) === interpreterId);
      if (!person) throw Error("No se encontró ese intérprete.");

      const own = matches.filter(match =>
        (match.participants || []).some(participant =>
          String(participant.interpreterId || "") === String(person.id) &&
          (participant.role || "competitor") === "competitor"
        )
      );

      const record = window.MIW_STATS?.recordForInterpreter(
        matches, person.id, season
      ) || {
        wins: 0, losses: 0, draws: 0,
        appearances: own.length, winRate: 0
      };

      const titles = championshipData
        ? window.MIW_CHAMPIONSHIP_HISTORY.interpreterTitleCards(
            person.id, championshipData, wrestlers
          )
        : "";

      const cards = own.length && window.MIW_MATCH_CARD
        ? own.map(match => window.MIW_MATCH_CARD.render(
            match, { wrestlers, personas, events }
          )).join("")
        : empty("Todavía no hay combates individuales cargados para este intérprete.");

      main.innerHTML = `
        <header class="mw-record-hero">
          <p class="mw-record-eyebrow">PLAYER PROFILE / MATCH ARCHIVE</p>
          <h1>${esc(person.name)}</h1>
          <p>${esc(person.country || "País no registrado")} ·
            ${person.status === "active" ? "Intérprete activo" : "Intérprete inactivo"}
          </p>
        </header>
        ${statMarkup(record)}
        ${titles ? `<section class="mw-record-note mw-record-titles">
          <h2>Campeonatos de superestrellas interpretadas</h2>${titles}
        </section>` : ""}
        <section class="mw-record-note">
          <h2>Historial de participación</h2>${cards}
        </section>
        ${link("← VOLVER AL ARCHIVO", "records.html")}
        ${link("VER FICHA DEL INTÉRPRETE",
          `persona.html?id=${encodeURIComponent(person.id)}`)}`;

      document.title = `Récord de ${person.name} | MI WRESTLING 2.0`;
      return;
    }

    /* PORTADA Y CATÁLOGOS */
    const wrestlerItems = wrestlers.map(wrestler => ({
      id: wrestler.id,
      name: wrestler.name,
      search: wrestler.name,
      url: `records.html?wrestler=${encodeURIComponent(wrestler.id)}`
    })).sort((a, b) => a.name.localeCompare(b.name, "es"));

    const personItems = personas.map(person => ({
      id: person.id,
      name: person.name,
      search: `${person.name} ${person.country || ""}`,
      url: `records.html?interpreter=${encodeURIComponent(person.id)}`
    })).sort((a, b) => a.name.localeCompare(b.name, "es"));

    main.innerHTML = `
      <header class="mw-record-hero">
        <p class="mw-record-eyebrow">MI WRESTLING 2.0 / MATCH ARCHIVE</p>
        <h1>RECORDS<br>ARCHIVE</h1>
        <p>Las estadísticas, las rivalidades y la historia de cada competidor.</p>
        <div class="mw-record-hero__meta">
          <span>${wrestlers.length} SUPERSTRELLAS</span>
          <span>${personas.length} INTÉRPRETES</span>
        </div>
      </header>
      <section class="mw-record-category-section">
        <div class="mw-record-section-heading">
          <p class="mw-record-eyebrow">EXPLORAR BASE DE DATOS</p>
          <h2>ELEGÍ TU CATEGORÍA</h2>
        </div>
        <div class="mw-record-category-grid">
          <button class="mw-record-category" type="button"
            data-open-catalog="wrestlers">
            <span class="mw-record-category__number">01</span>
            <span class="mw-record-category__title">WRESTLERS</span>
            <span class="mw-record-category__description">Récords e historial individual</span>
            <span class="mw-record-category__count">${wrestlers.length} REGISTROS</span>
            <span class="mw-record-category__arrow">↗</span>
          </button>
          <button class="mw-record-category" type="button"
            data-open-catalog="interpreters">
            <span class="mw-record-category__number">02</span>
            <span class="mw-record-category__title">JUGADORES</span>
            <span class="mw-record-category__description">Estadísticas por intérprete</span>
            <span class="mw-record-category__count">${personas.length} REGISTROS</span>
            <span class="mw-record-category__arrow">↗</span>
          </button>
          <button class="mw-record-category" type="button"
            data-open-catalog="teams">
            <span class="mw-record-category__number">03</span>
            <span class="mw-record-category__title">TAG TEAMS</span>
            <span class="mw-record-category__description">Parejas y equipos de combate</span>
            <span class="mw-record-category__count">PRÓXIMAMENTE</span>
            <span class="mw-record-category__arrow">↗</span>
          </button>
          <button class="mw-record-category" type="button"
            data-open-catalog="factions">
            <span class="mw-record-category__number">04</span>
            <span class="mw-record-category__title">FACCIONES</span>
            <span class="mw-record-category__description">Grupos y trayectorias colectivas</span>
            <span class="mw-record-category__count">PRÓXIMAMENTE</span>
            <span class="mw-record-category__arrow">↗</span>
          </button>
        </div>
      </section>
      <section class="mw-record-catalogs" data-record-catalogs hidden>
        <div class="mw-record-catalogs__top">
          <div>
            <p class="mw-record-eyebrow">MATCH ARCHIVE / DIRECTORY</p>
            <h2 data-catalog-title>CATÁLOGO</h2>
          </div>
          <button class="mw-record-back" type="button" data-close-catalog>
            ← CATEGORÍAS
          </button>
        </div>
        <div data-catalog-content></div>
      </section>`;

    const catalogs = {
      wrestlers: {
        title: "WRESTLERS",
        html: catalog("WRESTLERS", "Seleccioná una superestrella.", wrestlerItems, "wrestlers")
      },
      interpreters: {
        title: "JUGADORES",
        html: catalog("JUGADORES", "Seleccioná un intérprete.", personItems, "interpreters")
      },
      teams: {
        title: "TAG TEAMS",
        html: empty("Esta categoría necesita el archivo de datos de tag teams para mostrar parejas reales y enlazar sus historiales.")
      },
      factions: {
        title: "FACCIONES",
        html: empty("Esta categoría necesita el archivo de datos de facciones para mostrar grupos reales y enlazar sus historiales.")
      }
    };

    const catalogSection = main.querySelector("[data-record-catalogs]");
    const catalogContent = main.querySelector("[data-catalog-content]");
    const catalogTitle = main.querySelector("[data-catalog-title]");

    main.querySelectorAll("[data-open-catalog]").forEach(button => {
      button.addEventListener("click", () => {
        const key = button.dataset.openCatalog;
        const selected = catalogs[key];
        if (!selected) return;

        catalogTitle.textContent = selected.title;
        catalogContent.innerHTML = selected.html;
        catalogSection.hidden = false;
        main.querySelector(".mw-record-category-section").hidden = true;
        bindSearch();
        catalogSection.scrollIntoView({ behavior: "auto", block: "start" });
      });
    });

    main.querySelector("[data-close-catalog]").addEventListener("click", () => {
      catalogSection.hidden = true;
      main.querySelector(".mw-record-category-section").hidden = false;
      main.querySelector(".mw-record-category-section")
        .scrollIntoView({ behavior: "auto", block: "start" });
    });

  } catch (error) {
    console.error("[MI WRESTLING] Records:", error);
    main.innerHTML = `
      <section class="mw-record-note">
        <h1>NO SE PUDIERON CARGAR LOS RÉCORDS</h1>
        <p>${esc(error.message || "Error de carga.")}</p>
        <a class="mw-record-back" href="records.html">REINTENTAR</a>
      </section>`;
  }
})();

/* PALETA ALEATORIA POR RECARGA */
  const palettes = [
    ["#38a8ff","#a66cff","#ff5579","#ffb454","#42e4cf","#b8ed62"],
    ["#f45b69","#ff9f43","#f7d154","#55d6be","#4d96ff","#b967ff"],
    ["#55d6ff","#6574ff","#bd63ff","#ff6392","#ffad66","#8de969"],
    ["#ff7043","#ffca58","#7ce0c3","#49b9ff","#aa82ff","#ff78b7"],
    ["#4edbca","#65a9ff","#c18aff","#ff6f91","#ffc36e","#b4e769"],
    ["#e96bff","#8c7bff","#56c7ff","#53e0b0","#ffd166","#ff6b6b"]
  ];

  const palette = palettes[Math.floor(Math.random() * palettes.length)];
  const style = document.querySelector(".mw-record-page");

  if (style) {
    ["--rc1","--rc2","--rc3","--rc4","--rc5","--rc6"].forEach((name,index) => {
      style.style.setProperty(name,palette[index]);
    });
  }
