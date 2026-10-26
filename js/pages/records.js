
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
    `<a class="mw-record-back" href="${esc(url)}">${esc(label)}</a>`;

  const empty = message =>
    `<p class="mw-record-empty">${esc(message)}</p>`;

  const normalize = value =>
    String(value ?? "").trim().toLocaleLowerCase("es");

  /* PAÍSES */

  const countryNames = {
    AR: "Argentina",
    CL: "Chile",
    MX: "México",
    CO: "Colombia",
    PE: "Perú",
    ES: "España",
    VE: "Venezuela",
    EC: "Ecuador",
    UY: "Uruguay",
    IT: "Italia",
    NI: "Nicaragua",
    BO: "Bolivia",
    PY: "Paraguay",
    US: "Estados Unidos",
    CR: "Costa Rica",
    GQ: "Guinea Ecuatorial",
    GT: "Guatemala",
    PR: "Puerto Rico"
  };

  const getCountry = person =>
    String(
      person.country ||
      person.nationality ||
      person.pais ||
      person.nacionalidad ||
      ""
    ).trim().toUpperCase();

  const countryFlag = code => {
    const value = String(code || "").trim().toUpperCase();

    return /^[A-Z]{2}$/.test(value)
      ? String.fromCodePoint(
          ...value.split("").map(char => 127397 + char.charCodeAt(0))
        )
      : "🌐";
  };

  const countryLabel = code => {
    const value = String(code || "").toUpperCase();
    return countryNames[value] || (value || "País no registrado");
  };

  /* COLOR POR PAÍS */

  const countryColors = {
    AR: "#65aaff",
    CL: "#ff6575",
    MX: "#55d99b",
    CO: "#ffd45b",
    PE: "#ff747c",
    ES: "#ffb84d",
    VE: "#ffce58",
    EC: "#ffca55",
    UY: "#77caff",
    IT: "#5cda9e",
    NI: "#64d4ef",
    BO: "#ff7777",
    PY: "#ff747d",
    US: "#75aaff",
    CR: "#6ab8ff",
    GQ: "#61d6a0",
    GT: "#79c9ff",
    PR: "#70a8ff"
  };

  const countryColor = code => countryColors[code] || "#a66cff";

  /* ESTADO Y MARCA */

  const getStatus = person =>
    person.status || person.estado || "";

  const getBrand = person =>
    person.currentBrand ||
    person.current_brand ||
    person.brand ||
    person.currentShow ||
    person.current_show ||
    person.rosterBrand ||
    person.marcaActual ||
    person.marca ||
    person.show ||
    "";

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

  /* CATÁLOGO GENERAL */

  const catalog = (title, description, items, type) => `
    <section class="mw-record-catalog" data-catalog="${esc(type)}">
      <div class="mw-record-catalog__heading">
        <div>
          <h2>${esc(title)}</h2>
          <p>${esc(description)}</p>
        </div>
        <span class="mw-record-count">${items.length}</span>
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

  /* BOTONES DE FILTROS */

  function buildInterpreterCatalog(personas) {
    const people = [...personas].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "es")
    );

    const countries = [...new Set(
      people.map(getCountry).filter(Boolean)
    )].sort((a, b) =>
      countryLabel(a).localeCompare(countryLabel(b), "es")
    );

    const statuses = [...new Set(
      people.map(person => statusLabel(getStatus(person)))
    )].sort((a, b) => a.localeCompare(b, "es"));

    const brands = [...new Set(
      people.map(person => String(getBrand(person)).trim()).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "es"));

    const hasUnassignedBrand = people.some(person => !getBrand(person));
    const hasUnknownCountry = people.some(person => !getCountry(person));

    const filterButtons = (type, options, allLabel) => `
      <div class="mw-player-filter__options" data-filter-group="${type}">
        <button type="button"
          class="mw-player-filter__button mw-player-filter__button--all is-selected"
          data-filter-type="${type}"
          data-filter-value="__all__"
          aria-pressed="true">${allLabel}</button>

        ${options.map(option => `
          <button type="button"
            class="mw-player-filter__button"
            data-filter-type="${type}"
            data-filter-value="${esc(option.value)}"
            aria-pressed="false">${option.label}</button>
        `).join("")}
      </div>`;

    const brandOptions = [
      ...brands.map(brand => ({
        value: normalize(brand),
        label: esc(brand)
      })),
      ...(hasUnassignedBrand ? [{
        value: "__unassigned__",
        label: "Sin marca asignada"
      }] : [])
    ];

    const countryOptions = [
      ...countries.map(country => ({
        value: country,
        label: `${countryFlag(country)} ${esc(countryLabel(country))}`
      })),
      ...(hasUnknownCountry ? [{
        value: "__unknown__",
        label: "🌐 Sin país"
      }] : [])
    ];

    const statusOptions = statuses.map(status => ({
      value: normalize(status),
      label: esc(status)
    }));

    return `
      <section class="mw-record-catalog mw-player-directory"
        data-catalog="interpreters">

        <div class="mw-record-catalog__heading">
          <div>
            <h2>JUGADORES</h2>
            <p>Activá uno o varios filtros. Tocá otra vez para desactivarlos.</p>
          </div>
          <span class="mw-record-count" data-player-count>${people.length}</span>
        </div>

        <div class="mw-player-filters">

          <div class="mw-player-filter">
            <span>MARCA ACTUAL</span>
            ${filterButtons("brand", brandOptions, "TODAS")}
          </div>

          <div class="mw-player-filter">
            <span>PAÍS</span>
            ${filterButtons("country", countryOptions, "TODOS")}
          </div>

          <div class="mw-player-filter">
            <span>ESTADO</span>
            ${filterButtons("status", statusOptions, "TODOS")}
          </div>

        </div>

        <div class="mw-player-results-bar">
          <p>JUGADORES ENCONTRADOS</p>
          <strong data-player-visible-count>${people.length}</strong>
          <button type="button" class="mw-player-clear-filters"
            data-clear-player-filters>RESTABLECER</button>
        </div>

        <div class="mw-record-links" data-player-list>
          ${people.map(person => {
            const country = getCountry(person);
            const rawBrand = String(getBrand(person) || "").trim();
            const status = statusLabel(getStatus(person));

            const countryKey = country || "__unknown__";
            const brandKey = rawBrand ? normalize(rawBrand) : "__unassigned__";

            return `
              <a class="mw-record-link mw-player-link"
                href="records.html?interpreter=${encodeURIComponent(person.id)}"
                data-brand="${esc(brandKey)}"
                data-country="${esc(countryKey)}"
                data-status="${esc(normalize(status))}"
                style="--player-country:${countryColor(country)}">

                <span class="mw-player-name-line">
                  <span class="mw-player-flag"
                    role="img"
                    aria-label="${esc(countryLabel(country))}">${countryFlag(country)}</span>
                  <span class="mw-player-name">${esc(person.name || "Intérprete sin nombre")}</span>
                </span>

                <span class="mw-record-link__arrow" aria-hidden="true">↗</span>
              </a>`;
          }).join("") || empty("Todavía no hay intérpretes registrados.")}
        </div>

        <p class="mw-record-no-results" data-player-empty hidden>
          No hay jugadores que coincidan con los filtros seleccionados.
        </p>
      </section>`;
  }

  function bindPlayerFilters(container) {
    const count = container.querySelector("[data-player-count]");
    const visibleCount = container.querySelector("[data-player-visible-count]");
    const emptyState = container.querySelector("[data-player-empty]");
    const clearButton = container.querySelector("[data-clear-player-filters]");
    const items = [...container.querySelectorAll(".mw-player-link")];

    const selected = {
      brand: new Set(),
      country: new Set(),
      status: new Set()
    };

    const update = () => {
      let visible = 0;

      items.forEach(item => {
        const matchesBrand =
          selected.brand.size === 0 || selected.brand.has(item.dataset.brand);

        const matchesCountry =
          selected.country.size === 0 || selected.country.has(item.dataset.country);

        const matchesStatus =
          selected.status.size === 0 || selected.status.has(item.dataset.status);

        const show = matchesBrand && matchesCountry && matchesStatus;

        item.hidden = !show;

        if (show) visible++;
      });

      if (count) count.textContent = visible;
      if (visibleCount) visibleCount.textContent = visible;
      if (emptyState) emptyState.hidden = visible > 0;
    };

    container.querySelectorAll("[data-filter-type][data-filter-value]")
      .forEach(button => {
        button.addEventListener("click", () => {
          const type = button.dataset.filterType;
          const value = button.dataset.filterValue;

          if (!selected[type]) return;

          const group = container.querySelector(
            `[data-filter-group="${type}"]`
          );

          if (value === "__all__") {
            selected[type].clear();

            group?.querySelectorAll("[data-filter-type]").forEach(option => {
              const active = option.dataset.filterValue === "__all__";
              option.classList.toggle("is-selected", active);
              option.setAttribute("aria-pressed", String(active));
            });

            update();
            return;
          }

          selected[type].delete("__all__");

          if (selected[type].has(value)) {
            selected[type].delete(value);
            button.classList.remove("is-selected");
            button.setAttribute("aria-pressed", "false");
          } else {
            selected[type].add(value);
            button.classList.add("is-selected");
            button.setAttribute("aria-pressed", "true");
          }

          const allButton = group?.querySelector(
            '[data-filter-value="__all__"]'
          );

          if (allButton) {
            const noneSelected = selected[type].size === 0;
            allButton.classList.toggle("is-selected", noneSelected);
            allButton.setAttribute("aria-pressed", String(noneSelected));
          }

          update();
        });
      });

    clearButton?.addEventListener("click", () => {
      Object.values(selected).forEach(set => set.clear());

      container.querySelectorAll("[data-filter-type]").forEach(button => {
        const active = button.dataset.filterValue === "__all__";
        button.classList.toggle("is-selected", active);
        button.setAttribute("aria-pressed", String(active));
      });

      update();
    });

    /* Tinte por país al pulsar la tarjeta, sin bloquear el enlace. */

    items.forEach(item => {
      item.addEventListener("pointerdown", () => {
        items.forEach(other => other.classList.remove("is-country-active"));
        item.classList.add("is-country-active");
      });
    });

    update();
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
          <p>${esc(countryLabel(country))} · ${esc(statusLabel(getStatus(person)))}</p>
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
        html: catalog(
          "WRESTLERS",
          "Seleccioná una superestrella.",
          wrestlerItems,
          "wrestlers"
        )
      },

      interpreters: {
        html: buildInterpreterCatalog(personas)
      },

      teams: {
        html: empty(
          "Esta categoría necesita el archivo de datos de tag teams para mostrar parejas reales y enlazar sus historiales."
        )
      },

      factions: {
        html: empty(
          "Esta categoría necesita el archivo de datos de facciones para mostrar grupos reales y enlazar sus historiales."
        )
      }
    };

    const catalogSection = main.querySelector("[data-record-catalogs]");
    const catalogContent = main.querySelector("[data-catalog-content]");
    const categorySection = main.querySelector(".mw-record-category-section");

    main.querySelectorAll("[data-open-catalog]").forEach(button => {
      button.addEventListener("click", () => {
        const selectedCatalog = catalogs[button.dataset.openCatalog];
        if (!selectedCatalog) return;

        catalogContent.innerHTML = selectedCatalog.html;
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
