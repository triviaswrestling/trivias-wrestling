
/* MI WRESTLING 2.0 — MOTOR PÚBLICO UNIFICADO
   Tema, navegación, JSON, catálogos, combates y pie de página.
   La página de inicio conserva su catálogo propio.
*/
(function () {
  "use strict";

  const VERSION = "2.2.0";

  const THEMES = [
    { name: "azul eléctrico", accent: "#168cff", rgb: "22,140,255", second: "#00e5ff" },
    { name: "rojo arena", accent: "#ff3156", rgb: "255,49,86", second: "#ffb347" },
    { name: "violeta", accent: "#9a5bff", rgb: "154,91,255", second: "#f05bff" },
    { name: "cian", accent: "#00cfe8", rgb: "0,207,232", second: "#8df8ff" },
    { name: "dorado", accent: "#d9a62e", rgb: "217,166,46", second: "#ffe18a" },
    { name: "verde", accent: "#19c786", rgb: "25,199,134", second: "#9affd8" },
    { name: "naranja", accent: "#ff7a24", rgb: "255,122,36", second: "#ffd06a" }
  ];

  const NAV = [
    ["Inicio", "index.html"],
    ["Roster", "roster.html"],
    ["Alumni", "alumni.html"],
    ["Marcas", "brands.html"],
    ["Temporadas", "seasons.html"],
    ["Calendario", "calendar.html"],
    ["Eventos", "events.html"],
    ["Torneos", "tournaments.html"],
    ["Campeonatos", "championships.html"],
    ["Rankings", "ranking.html"],
    ["Récords", "records.html"],
    ["Equipos", "teams.html"],
    ["Personas", "personas.html"],
    ["Rivalidades", "rivalries.html"],
    ["Recaps", "recaps.html"],
    ["Guía", "guide.html"],
    ["Reglas", "rules.html"],
    ["Estipulaciones", "stipulations.html"],
    ["Promociones", "promotions.html"],
    ["Acerca de", "about.html"]
  ];

  const PAGES = {
    roster: {
      title: "Roster",
      eyebrow: "Roster activo",
      description: "Perfiles, presentaciones y estadísticas de los luchadores.",
      data: "wrestlers"
    },
    alumni: {
      title: "Alumni",
      eyebrow: "Archivo histórico",
      description: "Luchadores inactivos y sus trayectorias registradas.",
      data: "wrestlers"
    },
    events: {
      title: "Eventos",
      eyebrow: "Calendario de shows",
      description: "Eventos y carteleras del archivo MI WRESTLING.",
      data: "events"
    },
    event: {
      title: "Evento",
      eyebrow: "Cartelera oficial",
      description: "Detalles del evento, combates y resultados.",
      data: "events"
    },
    tournaments: {
      title: "Torneos",
      eyebrow: "Competencia",
      description: "Formatos, participantes, temporadas y finales.",
      data: "tournaments"
    },
    tournament: {
      title: "Torneo",
      eyebrow: "Ficha de torneo",
      description: "Participantes, rondas y resultados.",
      data: "tournaments"
    },
    championships: {
      title: "Campeonatos",
      eyebrow: "Historia titular",
      description: "Títulos, campeones y reinados registrados.",
      data: "championships"
    },
    championship: {
      title: "Campeonato",
      eyebrow: "Título oficial",
      description: "Información del campeonato y su historial.",
      data: "championships"
    },
    ranking: {
      title: "Rankings",
      eyebrow: "Clasificación",
      description: "Consultá y compará los perfiles del archivo.",
      data: "wrestlers"
    },
    rankings: {
      title: "Rankings",
      eyebrow: "Clasificación",
      description: "Consultá y compará los perfiles del archivo.",
      data: "wrestlers"
    },
    records: {
      title: "Récords",
      eyebrow: "Estadísticas",
      description: "Registros y métricas disponibles en los datos.",
      data: "wrestlers"
    },
    superstar: {
      title: "Superstar",
      eyebrow: "Ficha individual",
      description: "Perfil principal, estadísticas y presentaciones alternativas.",
      data: "wrestlers"
    },
    personas: {
      title: "Personas alternativas",
      eyebrow: "Presentaciones",
      description: "Alter egos vinculados al perfil principal, sin duplicar su historial.",
      data: "personas"
    },
    persona: {
      title: "Presentación",
      eyebrow: "Persona alternativa",
      description: "Una presentación vinculada a un luchador principal.",
      data: "personas"
    },
    teams: {
      title: "Equipos",
      eyebrow: "Alianzas",
      description: "Equipos y miembros registrados.",
      data: "teams"
    },
    team: {
      title: "Equipo",
      eyebrow: "Ficha de equipo",
      description: "Miembros y resultados de la alianza.",
      data: "teams"
    },
    brands: {
      title: "Marcas",
      eyebrow: "Universo MIW",
      description: "Marcas y divisiones de competencia.",
      data: "brands"
    },
    promotions: {
      title: "Promociones",
      eyebrow: "Organizaciones",
      description: "Promociones y sus registros.",
      data: "promotions"
    },
    promotion: {
      title: "Promoción",
      eyebrow: "Ficha de promoción",
      description: "Información y archivo de la promoción.",
      data: "promotions"
    },
    recaps: {
      title: "Recaps",
      eyebrow: "Resumen de eventos",
      description: "Resultados y resúmenes publicados.",
      data: "recaps"
    },
    recap: {
      title: "Recap",
      eyebrow: "Resumen",
      description: "Resumen del evento seleccionado.",
      data: "recaps"
    },
    rivalries: {
      title: "Rivalidades",
      eyebrow: "Historias",
      description: "Rivalidades y enfrentamientos registrados.",
      data: "wrestlers"
    },
    rivalry: {
      title: "Rivalidad",
      eyebrow: "Historia de rivalidad",
      description: "Participantes y resultados relacionados.",
      data: "wrestlers"
    },
    seasons: {
      title: "Temporadas",
      eyebrow: "Archivo por temporada",
      description: "Organización histórica por temporadas.",
      data: "seasons"
    },
    calendar: {
      title: "Calendario",
      eyebrow: "Agenda",
      description: "Explorá las fechas registradas.",
      data: "events"
    },
    search: {
      title: "Buscar",
      eyebrow: "Buscador global",
      description: "Encontrá luchadores, eventos, títulos y torneos.",
      data: "wrestlers"
    },
    guide: {
      title: "Guía",
      eyebrow: "Cómo usar el archivo",
      description: "Conocé las secciones y el sistema de registros."
    },
    rules: {
      title: "Reglas",
      eyebrow: "Reglamento",
      description: "Reglas de la competencia."
    },
    stipulations: {
      title: "Estipulaciones",
      eyebrow: "Tipos de combate",
      description: "Formatos y condiciones de los combates."
    },
    about: {
      title: "Acerca de",
      eyebrow: "MI WRESTLING 2.0",
      description: "Archivo de lucha, trivia y resultados históricos."
    },
    "404": {
      title: "Página no encontrada",
      eyebrow: "404",
      description: "La página que buscás no está disponible."
    }
  };

  const FOOTER_DESCRIPTION =
    "La base de datos definitiva para las trivias de WWE. Explorá luchadores, campeonatos y eventos, y seguí los récords de nuestra comunidad.";

  const DISCLAIMER =
    "MI WRESTLING utiliza imágenes de luchadores, campeonatos y eventos únicamente con fines de identificación. No reclama derechos de propiedad sobre ellas. Todos los derechos de esas imágenes pertenecen a los luchadores y a las organizaciones de lucha libre correspondientes, incluida WWE.";

  const SOCIALS = [
    {
      label: "Instagram",
      href: "#instagram",
      icon: "◎",
      className: "social-instagram"
    },
    {
      label: "YouTube",
      href: "#youtube",
      icon: "▶",
      className: "social-youtube"
    },
    {
      label: "Discord",
      href: "#discord",
      icon: "◉",
      className: "social-discord"
    },
    {
      label: "WhatsApp",
      href: "#whatsapp",
      icon: "◔",
      className: "social-whatsapp"
    }
  ];

  function currentPage() {
    const file = location.pathname.split("/").filter(Boolean).pop() || "index.html";
    return file.replace(/\.html?$/i, "").toLowerCase() || "index";
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function safeId(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function siteRoot() {
    const scripts = Array.from(document.scripts);
    const script = scripts.find(function (item) {
      return item.src && /\/js\/mi-wrestling\.js(?:\?.*)?$/i.test(new URL(item.src, location.href).pathname);
    });

    if (script) {
      const url = new URL(script.src, location.href);
      return url.pathname.replace(/\/js\/mi-wrestling\.js$/i, "/");
    }

    return location.pathname.slice(0, location.pathname.lastIndexOf("/") + 1) || "/";
  }

  function applyTheme() {
    const page = currentPage();
    let hash = 0;

    for (let i = 0; i < page.length; i++) {
      hash = (hash * 31 + page.charCodeAt(i)) >>> 0;
    }

    let index = hash % THEMES.length;

    try {
      const previous = sessionStorage.getItem("miw-theme-index");

      if (previous !== null && Number.isInteger(Number(previous))) {
        index = (Number(previous) + 1) % THEMES.length;
      }

      sessionStorage.setItem("miw-theme-index", String(index));
    } catch (_) {
      /* El sitio sigue funcionando aunque sessionStorage esté bloqueado. */
    }

    const theme = THEMES[index];
    const root = document.documentElement;

    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-rgb", theme.rgb);
    root.style.setProperty("--accent-2", theme.second);

    root.dataset.theme = theme.name;
    root.dataset.page = page;
    root.dataset.app = "mi-wrestling";
    root.dataset.version = VERSION;
  }

  function makeNavigation() {
    if (document.querySelector(".site-nav")) return;

    const root = siteRoot();
    const page = currentPage();
    const header = document.createElement("header");

    header.className = "site-nav";
    header.innerHTML =
      '<nav class="nav-inner" aria-label="Navegación principal">' +
        '<a class="nav-brand" href="' + escapeHTML(root + "index.html") + '">' +
          '<img src="' + escapeHTML(root + "images/logo.png") + '" alt="" width="38" height="38">' +
          '<span>MI WRESTLING <span class="accent-text">2.0</span></span>' +
        '</a>' +
        '<button class="nav-toggle" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="miw-nav-links">☰</button>' +
        '<div class="nav-links" id="miw-nav-links"></div>' +
      '</nav>';

    const links = header.querySelector(".nav-links");

    NAV.forEach(function (item) {
      const label = item[0];
      const file = item[1];
      const anchor = document.createElement("a");

      anchor.href = root + file;
      anchor.textContent = label;

      if (file.replace(/\.html?$/i, "") === page) {
        anchor.setAttribute("aria-current", "page");
      }

      links.appendChild(anchor);
    });

    const toggle = header.querySelector(".nav-toggle");

    function closeMenu() {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menú");
      toggle.textContent = "☰";
    }

    toggle.addEventListener("click", function () {
      const open = !links.classList.contains("is-open");

      links.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      toggle.textContent = open ? "×" : "☰";
    });

    links.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("click", function (event) {
      if (!header.contains(event.target)) closeMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && links.classList.contains("is-open")) {
        closeMenu();
        toggle.focus();
      }
    });

    const main = document.querySelector("main");

    if (main) {
      document.body.insertBefore(header, main);
    } else {
      document.body.prepend(header);
    }
  }

  async function loadJSON(file) {
    if (!/^[a-z0-9_-]+$/i.test(String(file))) {
      throw new Error("Nombre de archivo JSON no válido");
    }

    const response = await fetch(
      siteRoot() + "data/" + file + "/" + file + ".json",
      {
        cache: "no-store",
        headers: { Accept: "application/json" }
      }
    );

    if (!response.ok) {
      throw new Error(
        "No se pudo cargar data/" + file + "/" + file + ".json (" + response.status + ")"
      );
    }

    const result = await response.json();

    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.items)) return result.items;
    if (result && Array.isArray(result.data)) return result.data;

    throw new Error(
      "El JSON de " + file + " debe contener una lista o una propiedad items/data con una lista"
    );
  }

  function dataName(item) {
    return item.name ||
      item.nombre ||
      item.title ||
      item.nombreEvento ||
      item.eventName ||
      item.id ||
      "Registro sin nombre";
  }

  function recordHref(kind, item) {
    const id = item.id != null ? String(item.id) : safeId(dataName(item));

    const routes = {
      wrestlers: "superstar.html",
      events: "event.html",
      tournaments: "tournament.html",
      championships: "championship.html",
      personas: "persona.html",
      teams: "team.html",
      promotions: "promotion.html",
      recaps: "recap.html",
      seasons: "seasons.html",
      brands: "brands.html"
    };

    const route = routes[kind];

    return route
      ? siteRoot() + route + "?id=" + encodeURIComponent(id)
      : "#";
  }

  function createCard(item, kind) {
    const category =
      item.category ||
      item.categoria ||
      item.brand ||
      item.status ||
      item.estado ||
      kind;

    const subtitle =
      item.nickname ||
      item.apodo ||
      item.description ||
      item.descripcion ||
      item.date ||
      item.fecha ||
      "Abrir ficha y consultar detalles";

    const image =
      item.image ||
      item.imageUrl ||
      item.photo ||
      item.foto ||
      item.portrait ||
      "";

    const imageHTML = typeof image === "string" && image.trim()
      ? '<img class="record-image" src="' + escapeHTML(image) +
        '" alt="" loading="lazy" decoding="async" onerror="this.hidden=true">'
      : "";

    return (
      '<a class="wrestler-card catalog-card" href="' +
        escapeHTML(recordHref(kind, item)) + '">' +
        imageHTML +
        '<div class="card-copy">' +
          '<span class="pill">' + escapeHTML(category) + '</span>' +
          '<h2 class="card-name">' + escapeHTML(dataName(item)) + '</h2>' +
          '<p class="card-meta">' + escapeHTML(subtitle) + '</p>' +
        '</div>' +
      '</a>'
    );
  }

  function itemMatchesId(item, id) {
    const itemId = item.id != null ? item.id : safeId(dataName(item));
    return String(itemId) === String(id);
  }

  async function renderPublicPage() {
    const page = currentPage();

    if (page === "index" || page === "home") return;

    const meta = PAGES[page];

    if (!meta) return;

    let main = document.querySelector("main");

    if (!main) {
      main = document.createElement("main");
      main.className = "site-main";
      document.body.appendChild(main);
    }

    if (
      main.dataset.keepContent === "true" ||
      main.dataset.miwManaged === "false" ||
      main.querySelector("[data-miw-custom-content]")
    ) {
      return;
    }

    const id = new URLSearchParams(location.search).get("id");

    main.classList.add("site-main");

    main.innerHTML =
      '<section class="page-heading">' +
        '<div class="eyebrow">' + escapeHTML(meta.eyebrow) + '</div>' +
        '<h1 class="page-title">' + escapeHTML(meta.title) + '</h1>' +
        '<p class="page-description">' + escapeHTML(meta.description) + '</p>' +
      '</section>';

    if (!meta.data) {
      main.insertAdjacentHTML(
        "beforeend",
        '<section class="panel">' + escapeHTML(meta.description) + '</section>'
      );
      return;
    }

    main.insertAdjacentHTML(
      "beforeend",
      '<div class="filters">' +
        '<input class="search-input" type="search" placeholder="Buscar en ' +
          escapeHTML(meta.title.toLowerCase()) + '…" aria-label="Buscar en ' +
          escapeHTML(meta.title) + '">' +
        '<span class="text-muted" data-count aria-live="polite">Preparando archivo…</span>' +
      '</div>' +
      '<section class="data-grid" data-results><div class="loading" aria-label="Cargando"></div></section>'
    );

    const results = main.querySelector("[data-results]");
    const count = main.querySelector("[data-count]");
    const search = main.querySelector('input[type="search"]');
    const kind = meta.data;

    try {
      let rows = await loadJSON(kind);

      if (page === "roster") {
        rows = rows.filter(function (item) {
          return ![
            "inactive", "alumni", "retired", "inactivo", "inactiva"
          ].includes(String(item.status || item.estado || "").toLowerCase());
        });
      }

      if (page === "alumni") {
        rows = rows.filter(function (item) {
          return [
            "inactive", "alumni", "retired", "inactivo", "inactiva"
          ].includes(String(item.status || item.estado || "").toLowerCase());
        });
      }

      const detailPages = [
        "superstar", "event", "tournament", "championship",
        "persona", "team", "promotion", "recap"
      ];

      if (detailPages.includes(page) && id) {
        rows = rows.filter(function (item) {
          return itemMatchesId(item, id);
        });
      }

      function draw(query) {
        const normalized = String(query || "").trim().toLocaleLowerCase();

        const filtered = rows.filter(function (item) {
          const haystack = [
            dataName(item),
            item.nickname,
            item.apodo,
            item.brand,
            item.status,
            item.estado,
            item.description,
            item.descripcion,
            item.date,
            item.fecha,
            item.id
          ].filter(Boolean).join(" ").toLocaleLowerCase();

          return haystack.includes(normalized);
        });

        count.textContent = filtered.length +
          (filtered.length === 1 ? " registro" : " registros");

        if (!filtered.length) {
          const message = id && detailPages.includes(page)
            ? 'No encontramos el ID <strong>' + escapeHTML(id) + '</strong> en el archivo de datos.'
            : 'Todavía no hay registros cargados para esta sección. Agregalos en data/' +
              escapeHTML(kind) + '/' + escapeHTML(kind) + '.json.';

          results.innerHTML = '<div class="empty-state">' + message + '</div>';
          return;
        }

        results.innerHTML = filtered.map(function (item) {
          return createCard(item, kind);
        }).join("");
      }

      draw("");
      search.addEventListener("input", function () {
        draw(search.value);
      });
    } catch (error) {
      results.innerHTML =
        '<div class="error-state">' +
          escapeHTML(error && error.message
            ? error.message
            : "Error inesperado al cargar los datos") +
          '. Revisá que el JSON exista, sea válido y esté publicado en la ruta indicada.' +
        '</div>';

      count.textContent = "Archivo no disponible";
    }
  }

  function enhanceMatchCards() {
    document.querySelectorAll(".match-card").forEach(function (match) {
      const sides = Array.from(match.querySelectorAll(".match-side"));

      if (sides.length < 2) return;

      const scores = sides.map(function (side) {
        const raw = side.dataset.score;

        return raw === undefined || raw.trim() === ""
          ? NaN
          : Number(raw);
      });

      if (
        scores.every(Number.isFinite) &&
        scores.some(function (score, index) {
          return index > 0 && score !== scores[0];
        })
      ) {
        const highest = Math.max.apply(null, scores);

        sides.forEach(function (side, index) {
          side.classList.toggle("is-winner", scores[index] === highest);
          side.classList.toggle("is-loser", scores[index] < highest);
        });
      }

      let controls = match.querySelector(".match-controls");

      if (!controls) {
        controls = document.createElement("div");
        controls.className = "match-controls";
        controls.setAttribute("aria-label", "Controles del resultado");
        match.appendChild(controls);
      }

      if (controls.querySelector("[data-miw-result-toggle]")) return;

      const button = document.createElement("button");

      button.className = "button";
      button.type = "button";
      button.dataset.miwResultToggle = "true";
      button.textContent = "Resaltar resultado";
      button.setAttribute("aria-pressed", "false");

      button.addEventListener("click", function () {
        const active = match.classList.toggle("result-active");

        button.setAttribute("aria-pressed", String(active));
        button.textContent = active
          ? "Restaurar colores"
          : "Resaltar resultado";
      });

      controls.appendChild(button);
    });
  }

  function renderFooter() {
    if (document.querySelector("footer[data-miw-footer]")) return;

    const footer = document.createElement("footer");
    footer.className = "footer site-footer";
    footer.dataset.miwFooter = "true";

    const socials = SOCIALS.map(function (social) {
      return (
        '<a class="miw-social ' + escapeHTML(social.className) +
          '" href="' + escapeHTML(social.href) +
          '" target="_blank" rel="noopener noreferrer" aria-label="' +
          escapeHTML(social.label) + '">' +
          '<span class="miw-social-icon" aria-hidden="true">' +
            escapeHTML(social.icon) +
          '</span>' +
          '<span>' + escapeHTML(social.label) + '</span>' +
        '</a>'
      );
    }).join("");

    footer.innerHTML =
      '<div class="miw-footer-inner">' +
        '<p class="miw-footer-description">' +
          escapeHTML(FOOTER_DESCRIPTION) +
        '</p>' +
        '<h2 class="miw-footer-heading">Comunidad MI WRESTLING</h2>' +
        '<nav class="miw-socials" aria-label="Redes sociales">' +
          socials +
        '</nav>' +
        '<p class="miw-disclaimer">' +
          escapeHTML(DISCLAIMER) +
        '</p>' +
        '<p class="miw-copyright">' +
          'Desarrollado por © 2026 Trivias WWE para la comunidad.' +
        '</p>' +
      '</div>';

    if (!document.querySelector("style[data-miw-footer-styles]")) {
      const style = document.createElement("style");
      style.dataset.miwFooterStyles = "true";

      style.textContent = `
        .site-footer {
          padding: 30px 16px 24px;
          text-align: center;
          color: #aab5c7;
          border-top: 1px solid var(--border);
          background: rgba(2,4,8,.92);
          font-size: .86rem;
        }
        .miw-footer-inner {
          width: min(100%,1100px);
          margin: 0 auto;
        }
        .miw-footer-description {
          max-width: 760px;
          margin: 0 auto 22px;
          line-height: 1.65;
        }
        .miw-footer-heading {
          margin: 0 0 14px;
          color: #f6f8ff;
          font: 800 1.45rem/1.1 var(--font-display);
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .miw-socials {
          display: grid;
          grid-template-columns: repeat(4,minmax(0,1fr));
          gap: 10px;
          margin: 0 auto 24px;
        }
        .miw-social {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          border: 1px solid rgba(255,255,255,.17);
          border-radius: 4px;
          color: #fff;
          font-weight: 800;
          box-shadow: inset 0 1px rgba(255,255,255,.14), 0 5px 14px rgba(0,0,0,.25);
          transition: transform .2s, filter .2s;
        }
        .miw-social:hover {
          transform: translateY(-2px);
          filter: brightness(1.12);
        }
        .miw-social-icon {
          font-size: 1.25rem;
          line-height: 1;
        }
        .social-instagram {
          background: linear-gradient(120deg,#833ab4,#fd1d1d,#fcb045);
        }
        .social-youtube {
          background: linear-gradient(120deg,#a50000,#ff2020);
        }
        .social-discord {
          background: linear-gradient(120deg,#3446a8,#5865f2);
        }
        .social-whatsapp {
          background: linear-gradient(120deg,#087c43,#25d366);
          color: #04170c;
        }
        .miw-disclaimer {
          margin: 0 auto 12px;
          max-width: 1000px;
          font-size: .78rem;
          line-height: 1.65;
          color: #8492a8;
        }
        .miw-copyright {
          margin: 0;
          color: #d2d9e5;
          font-size: .8rem;
        }
        @media(max-width:600px) {
          .miw-socials {
            grid-template-columns: 1fr;
            gap: 9px;
          }
          .miw-social {
            width: 100%;
            min-height: 48px;
          }
          .site-footer {
            padding: 25px 14px 20px;
          }
        }
        @media(prefers-reduced-motion:reduce) {
          .miw-social {
            transition: none;
          }
        }
      `;

      document.head.appendChild(style);
    }

    document.body.appendChild(footer);
  }

  function boot() {
    applyTheme();

    const page = currentPage();
    const home = page === "index" || page === "home";

    if (home) {
      document.body.dataset.homeMenu =
        document.body.dataset.homeMenu || "catalog";
    } else {
      makeNavigation();
    }

    renderPublicPage();
    enhanceMatchCards();
    renderFooter();

    document.dispatchEvent(new CustomEvent("miw:ready", {
      detail: { version: VERSION, page: page }
    }));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  window.MIW = {
    version: VERSION,
    themes: THEMES,
    pages: PAGES,
    navigation: NAV,
    loadJSON: loadJSON,
    makeNavigation: makeNavigation,
    renderPublicPage: renderPublicPage,
    enhanceMatchCards: enhanceMatchCards,
    renderFooter: renderFooter
  };
})();
