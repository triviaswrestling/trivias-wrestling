
/* MI WRESTLING 2.0 | RECORDS ARCHIVE */
(async function () {
  "use strict";

  const main = document.querySelector("[data-records-main]");
  if (!main) return;

  /* PALETA ALEATORIA POR RECARGA */
  const palettes = [
    ["#38a8ff", "#a66cff", "#ff5579", "#ffb454", "#42e4cf", "#b8ed62"],
    ["#f45b69", "#ff9f43", "#f7d154", "#55d6be", "#4d96ff", "#b967ff"],
    ["#55d6ff", "#6574ff", "#bd63ff", "#ff6392", "#ffad66", "#8de969"],
    ["#ff7043", "#ffca58", "#7ce0c3", "#49b9ff", "#aa82ff", "#ff78b7"],
    ["#4edbca", "#65a9ff", "#c18aff", "#ff6f91", "#ffc36e", "#b4e769"],
    ["#e96bff", "#8c7bff", "#56c7ff", "#53e0b0", "#ffd166", "#ff6b6b"]
  ];

  const palette = palettes[Math.floor(Math.random() * palettes.length)];

  ["--rc1", "--rc2", "--rc3", "--rc4", "--rc5", "--rc6"]
    .forEach((name, index) => {
      main.style.setProperty(name, palette[index]);
    });

  const params = new URLSearchParams(location.search);
  const wrestlerId = params.get("wrestler");
  const interpreterId = params.get("interpreter");
  const season = params.get("season");

  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

  const link = (label, url) =>
    `<a class="mw-record-back" href="${url}">${esc(label)}</a>`;

  const empty = message =>
    `<p class="mw-record-empty">${esc(message)}</p>`;

  const statMarkup = record => `
    <div class="mw-record-stat-grid">
      ${[
        ["VICTORIAS", record.wins],
        ["DERROTAS", record.losses],
        ["EMPATES", record.draws],
        ["COMBATES", record.appearances]
      ].map(([label, value]) => `
        <article class="mw-record-stat">
          <span>${label}</span>
          <strong>${esc(value ?? 0)}</strong>
        </article>
      `).join("")}
    </div>`;

  /* DATOS FLEXIBLES DE INTÉRPRETES */

  const getCountry = person =>
    person.country ||
    person.nationality ||
    person.pais ||
    person.nacionalidad ||
    "";

  const getBrand = person =>
    person.currentBrand ||
    person.currentブランド ||
    person.current_brand ||
    person.brand ||
    person.marcaActual ||
    person.marca ||
    "";

  const getStatus = person =>
    person.status ||
    person.estado ||
    "";

  const normalize = value =>
    String(value ?? "").trim().toLocaleLowerCase("es");

  const countryFlag = country => {
    const name = normalize(country);

    const flags = {
      "argentina": "🇦🇷",
      "estados unidos": "🇺🇸",
      "united states": "🇺🇸",
      "usa": "🇺🇸",
      "ee. uu.": "🇺🇸",
      "méxico": "🇲🇽",
      "mexico": "🇲🇽",
      "canadá": "🇨🇦",
      "canada": "🇨🇦",
      "reino unido": "🇬🇧",
      "inglaterra": "🏴",
      "escocia": "🏴",
      "irlanda": "🇮🇪",
      "españa": "🇪🇸",
      "japón": "🇯🇵",
      "japon": "🇯🇵",
      "australia": "🇦🇺",
      "francia": "🇫🇷",
      "alemania": "🇩🇪",
      "italia": "🇮🇹",
      "brasil": "🇧🇷",
      "brazil": "🇧🇷",
      "chile": "🇨🇱",
      "colombia": "🇨🇴",
      "puerto rico": "🇵🇷",
      "nueva zelanda": "🇳🇿",
      "sudáfrica": "🇿🇦",
      "corea del sur": "🇰🇷",
      "china": "🇨🇳",
      "india": "🇮🇳",
      "suiza": "🇨🇭",
      "países bajos": "🇳🇱",
      "holanda": "🇳🇱",
      "cuba": "🇨🇺",
      "perú": "🇵🇪",
      "venezuela": "🇻🇪",
      "bolivia": "🇧🇴",
      "uruguay": "🇺🇾",
      "ecuador": "🇪🇨",
      "panamá": "🇵🇦",
      "república dominicana": "🇩🇴",
      "jamaica": "🇯🇲",
      "nigeria": "🇳🇬",
      "rusia": "🇷🇺",
      "polonia": "🇵🇱",
      "grecia": "🇬🇷",
      "israel": "🇮🇱"
    };

    return flags[name] || "🌎";
  };

  const statusLabel = status => {
    const value = normalize(status);

    if (["active", "activo", "activa", "activos", "activas"].includes(value)) {
      return "Activo";
    }

    if (["inactive", "inactivo", "inactiva", "inactivos", "inactivas"].includes(value)) {
      return "Inactivo";
    }

    if (["retired", "retirado", "retirada", "retirados"].includes(value)) {
      return "Retirado";
    }

    if (["released", "despedido", "despedida", "liberado", "liberada"].includes(value)) {
      return "Liberado";
    }

    return status ? String(status) : "Sin estado registrado";
  };

  /* CATÁLOGOS */

  const catalog = (title, description, items, type) => `
    <section class="mw-record-catalog" data-catalog="${esc(type)}">
      <div class="mw-record-catalog__heading">
        <div>
          <h2>${esc(title)}</h2>
          <p>${esc(description)}</p>
        </div>
        <span class="mw-record-count" data-visible-count>
          ${items.length}
        </span>
      </div>

      <div class="mw-record-links" data-record-list="${esc(type)}">
        ${items.map(item => `
          <a class="mw-record-link" href="${esc(item.url)}">
            <span class="mw-record-link__name">${esc(item.name)}</span>
            <span class="mw-record-link__arrow" aria-hidden="true">↗</span>
          </a>
        `).join("") || empty("Todavía no hay registros disponibles.")}
      </div>
    </section>`;

  /* FILTROS DE JUGADORES */

  function buildInterpreterCatalog(personas) {
    const brands = [...new Set(
      personas.map(getBrand).filter(Boolean).map(String)
    )].sort((a, b) => a.localeCompare(b, "es"));

    const countries = [...new Set(
      personas.map(getCountry).filter(Boolean).map(String)
    )].sort((a, b) => a.localeCompare(b, "es"));

    const statuses = [...new Set(
      personas.map(person => statusLabel(getStatus(person)))
    )].sort((a, b) => a.localeCompare(b, "es"));

    const people = [...personas].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "es")
    );

    return `
      <section class="mw-record-catalog mw-player-directory"
        data-catalog="interpreters">

        <div class="mw-record-catalog__heading">
          <div>
            <h2>JUGADORES</h2>
            <p>Seleccioná un intérprete.</p>
          </div>
          <span class="mw-record-count" data-player-count>
            ${people.length}
          </span>
        </div>

        <div class="mw-player-filters">
          <label class="mw-player-filter">
            <span>MARCA ACTUAL</span>
            <select data-player-brand>
              <option value="">Todas las marcas</option>
              ${brands.map(brand => `
                <option value="${esc(brand)}">${esc(brand)}</option>
              `).join("")}
            </select>
          </label>

          <label class="mw-player-filter">
            <span>PAÍS</span>
            <select data-player-country>
              <option value="">Todos los países</option>
              ${countries.map(country => `
                <option value="${esc(country)}">${esc(country)}</option>
              `).join("")}
            </select>
          </label>

          <label class="mw-player-filter">
            <span>ESTADO</span>
            <select data-player-status>
              <option value="">Todos los estados</option>
              ${statuses.map(status => `
                <option value="${esc(status)}">${esc(status)}</option>
              `).join("")}
            </select>
          </label>
        </div>

        <div class="mw-record-links" data-player-list>
          ${people.map(person => {
            const country = getCountry(person);
            const brand = getBrand(person);
            const status = statusLabel(getStatus(person));

            return `
              <a class="mw-record-link mw-player-link"
                href="records.html?interpreter=${encodeURIComponent(person.id)}"
                data-brand="${esc(normalize(brand))}"
                data-country="${esc(normalize(country))}"
                data-status="${esc(normalize(status))}">

                <span class="mw-record-link__name">
                  <span class="mw-player-flag" aria-label="${esc(country || "País no registrado")}">
                    ${countryFlag(country)}
                  </span>
                  ${esc(person.name || "Intérprete sin nombre")}
                  <span class="mw-player-details">
                    ${esc([brand, status].filter(Boolean).join(" · "))}
                  </span>
                </span>

                <span class="mw-record-link__arrow" aria-hidden="true">↗</span>
              </a>`;
          }).join("") || empty("Todavía no hay intérpretes registrados.")}
        </div>

        <p class="mw-record-no-results" data-player-empty hidden>
          No hay intérpretes que coincidan con esos filtros.
        </p>
      </section>`;
  }

  function bindPlayerFilters(container) {
    const brandFilter = container.querySelector("[data-player-brand]");
    const countryFilter = container.querySelector("[data-player-country]");
    const statusFilter = container.querySelector("[data-player-status]");
    const count = container.querySelector("[data-player-count]");
    const emptyState = container.querySelector("[data-player-empty]");
    const items = [...container.querySelectorAll(".mw-player-link")];

    const update = () => {
      const brand = normalize(brandFilter?.value);
      const country = normalize(countryFilter?.value);
      const status = normalize(statusFilter?.value);
      let visible = 0;

      items.forEach(item => {
        const matchesBrand = !brand || item.dataset.brand === brand;
        const matchesCountry = !country || item.dataset.country === country;
        const matchesStatus = !status || item.dataset.status === status;
        const show = matchesBrand && matchesCountry && matchesStatus;

        item.hidden = !show;
        if (show) visible++;
      });

      if (count) count.textContent = visible;
      if (emptyState) emptyState.hidden = visible > 0;
    };

    [brandFilter, countryFilter, statusFilter].forEach(filter => {
      filter?.addEventListener("change", update);
    });
  }

  try {
    const [
      wrestlers,
      personas,
      matches,
      events,
      tournaments,
      championshipData
    ] = await Promise.all([
      fetch("data/wrestlers/wrestlers.json").then(response => {
        if (!response.ok) {
          throw Error("No se pudo cargar el registro de superestrellas.");
        }
        return response.json();
      }),
      fetch("data/personas/personas.json").then(response =>
        response.ok ? response.json() : []
      ),
      fetch("data/matches/matches.json").then(response =>
        response.ok ? response.json() : []
      ),
      fetch("data/events/events.json").then(response =>
        response.ok ? response.json() : []
      ),
      fetch("data/tournaments/tournaments.json").then(response =>
        response.ok ? response.json() : []
      ),
      window.MIW_CHAMPIONSHIP_HISTORY
        ? window.MIW_CHAMPIONSHIP_HISTORY.load()
        : Promise.resolve(null)
    ]);

    if (
      !Array.isArray(wrestlers) ||
      !Array.isArray(personas) ||
      !Array.isArray(matches)
    ) {
      throw Error("El formato de los datos del archivo no es válido.");
    }

    if (championshipData) championshipData.wrestlers = wrestlers;

    /* FICHA DE SUPERSTRELLA */

    if (wrestlerId) {
      const wrestler = wrestlers.find(
        item => String(item.id) === wrestlerId
      );

      if (!wrestler) throw Error("No se encontró esa superestrella.");

      const own = matches.filter(match =>
        (match.participants || []).some(
          participant =>
            String(participant.wrestlerId) === String(wrestler.id)
        )
      );

      const record = window.MIW_STATS?.recordForWrestler(
        matches, wrestler.id, season
      ) || {
        wins: 0,
        losses: 0,
        draws: 0,
        appearances: own.length,
        winRate: 0
      };

      const legacy = wrestler.record || wrestler.legacyStats || {};

      const recordHTML = own.length
        ? statMarkup(record)
        : `
          <section class="mw-record-legacy">
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

      const titleCards = championshipData &&
        window.MIW_CHAMPIONSHIP_HISTORY?.titleCards
        ? window.MIW_CHAMPIONSHIP_HISTORY.titleCards(
            wrestler.id, championshipData
          )
        : "";

      const timeline = championshipData &&
        window.MIW_CHAMPIONSHIP_HISTORY?.tournamentTimeline
        ? window.MIW_CHAMPIONSHIP_HISTORY.tournamentTimeline(
            wrestler.id,
            { ...championshipData, tournaments, matches, events }
          )
        : "";

      const cards = own.length && window.MIW_MATCH_CARD
        ? own.map(match =>
            window.MIW_MATCH_CARD.render(
              match, { wrestlers, personas, events }
            )
          ).join("")
        : empty("Todavía no hay combates individuales vinculados a esta superestrella.");

      main.innerHTML = `
        <header class="mw-record-hero">
          <p class="mw-record-eyebrow">SUPERSTAR ARCHIVE</p>
          <h1>${esc(wrestler.name)}</h1>
          <p>Récord individual${season ? ` · Temporada ${esc(season)}` : ""}</p>
        </header>

        ${recordHTML}

        ${titleCards ? `
          <section class="mw-record-note mw-record-titles">
            <h2>Campeonatos ganados</h2>
            ${titleCards}
          </section>` : ""}

        <section class="mw-record-note mw-record-tournaments">
          <h2>Cronología de torneos</h2>
          ${timeline || empty("No hay una cronología disponible.")}
        </section>

        <section class="mw-record-note">
          <h2>Historial de combates</h2>
          ${cards}
        </section>

        ${link("← VOLVER AL ARCHIVO", "records.html")}
        ${link("VER FICHA DE SUPERSTRELLA",
          `superstar.html?id=${encodeURIComponent(wrestler.id)}`)}
      `;

      document.title = `Récord de ${wrestler.name} | MI WRESTLING 2.0`;
      return;
    }

    /* FICHA DE INTÉRPRETE */

    if (interpreterId) {
      const person = personas.find(
        item => String(item.id) === interpreterId
      );

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
        wins: 0,
        losses: 0,
        draws: 0,
        appearances: own.length,
        winRate: 0
      };

      const titles = championshipData &&
        window.MIW_CHAMPIONSHIP_HISTORY?.interpreterTitleCards
        ? window.MIW_CHAMPIONSHIP_HISTORY.interpreterTitleCards(
            person.id, championshipData, wrestlers
          )
        : "";

      const cards = own.length && window.MIW_MATCH_CARD
        ? own.map(match =>
            window.MIW_MATCH_CARD.render(
              match, { wrestlers, personas, events }
            )
          ).join("")
        : empty("Todavía no hay combates individuales cargados para este intérprete.");

      const country = getCountry(person);

      main.innerHTML = `
        <header class="mw-record-hero">
          <p class="mw-record-eyebrow">PLAYER PROFILE</p>
          <h1>${countryFlag(country)} ${esc(person.name)}</h1>
          <p>${esc(country || "País no registrado")} ·
            ${esc(statusLabel(getStatus(person)))}
          </p>
        </header>

        ${statMarkup(record)}

        ${titles ? `
          <section class="mw-record-note mw-record-titles">
            <h2>Campeonatos de superestrellas interpretadas</h2>
            ${titles}
          </section>` : ""}

        <section class="mw-record-note">
          <h2>Historial de participación</h2>
          ${cards}
        </section>

        ${link("← VOLVER AL ARCHIVO", "records.html")}
        ${link("VER FICHA DEL INTÉRPRETE",
          `persona.html?id=${encodeURIComponent(person.id)}`)}
      `;

      document.title = `Récord de ${person.name} | MI WRESTLING 2.0`;
      return;
    }

    /* PORTADA Y CATEGORÍAS */

    const wrestlerItems = [...wrestlers]
      .map(wrestler => ({
        id: wrestler.id,
        name: wrestler.name,
        url: `records.html?wrestler=${encodeURIComponent(wrestler.id)}`
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    main.innerHTML = `
      <header class="mw-record-hero">
        <p class="mw-record-eyebrow">MI WRESTLING 2.0</p>
        <h1>RECORDS<br>ARCHIVE</h1>
        <p>Las estadísticas, las rivalidades y la historia de cada competidor.</p>
        <div class="mw-record-hero__meta">
          <span>${wrestlers.length} SUPERSTRELLAS</span>
          <span>${personas.length} INTÉRPRETES</span>
        </div>
      </header>

      <section class="mw-record-category-section">
        <div class="mw-record-section-heading">
          <h2>ELEGÍ TU CATEGORÍA</h2>
        </div>

        <div class="mw-record-category-grid">
          <button class="mw-record-category" type="button"
            data-open-catalog="wrestlers">
            <span class="mw-record-category__number">01</span>
            <span class="mw-record-category__title">WRESTLERS</span>
            <span class="mw-record-category__description">Récords e historial individual</span>
            <span class="mw-record-category__count">${wrestlers.length} REGISTROS</span>
            <span class="mw-record-category__arrow" aria-hidden="true">↗</span>
          </button>

          <button class="mw-record-category" type="button"
            data-open-catalog="interpreters">
            <span class="mw-record-category__number">02</span>
            <span class="mw-record-category__title">JUGADORES</span>
            <span class="mw-record-category__description">Estadísticas por intérprete</span>
            <span class="mw-record-category__count">${personas.length} REGISTROS</span>
            <span class="mw-record-category__arrow" aria-hidden="true">↗</span>
          </button>

          <button class="mw-record-category" type="button"
            data-open-catalog="teams">
            <span class="mw-record-category__number">03</span>
            <span class="mw-record-category__title">TAG TEAMS</span>
            <span class="mw-record-category__description">Parejas y equipos de combate</span>
            <span class="mw-record-category__count">PRÓXIMAMENTE</span>
            <span class="mw-record-category__arrow" aria-hidden="true">↗</span>
          </button>

          <button class="mw-record-category" type="button"
            data-open-catalog="factions">
            <span class="mw-record-category__number">04</span>
            <span class="mw-record-category__title">FACCIONES</span>
            <span class="mw-record-category__description">Grupos y trayectorias colectivas</span>
            <span class="mw-record-category__count">PRÓXIMAMENTE</span>
            <span class="mw-record-category__arrow" aria-hidden="true">↗</span>
          </button>
        </div>
      </section>

      <section class="mw-record-catalogs" data-record-catalogs hidden>
        <div data-catalog-content></div>
      </section>
    `;

    const catalogs = {
      wrestlers: {
        title: "WRESTLERS",
        html: catalog(
          "WRESTLERS",
          "Seleccioná una superestrella.",
          wrestlerItems,
          "wrestlers"
        )
      },

      interpreters: {
        title: "JUGADORES",
        html: buildInterpreterCatalog(personas)
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
    const categorySection = main.querySelector(".mw-record-category-section");

    main.querySelectorAll("[data-open-catalog]").forEach(button => {
      button.addEventListener("click", () => {
        const selected = catalogs[button.dataset.openCatalog];
        if (!selected) return;

        catalogContent.innerHTML = selected.html;
        categorySection.hidden = true;
        catalogSection.hidden = false;

        if (button.dataset.openCatalog === "interpreters") {
          bindPlayerFilters(catalogContent);
        }

        catalogSection.scrollIntoView({
          behavior: "auto",
          block: "start"
        });
      });
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
