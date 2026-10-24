
/* =========================================================
   MI WRESTLING 2.0 — MOTOR GLOBAL
   Responsabilidades exclusivas:
   - Rotación del tema de color.
   - Navbar universal.
   - Menú hamburguesa para móviles.
   - Footer universal.
   - Año de copyright.
   ========================================================= */

(function () {
  "use strict";

  const VERSION = "3.0.0";
  const ROOT = document.documentElement;

  const THEMES = [
    {
      name: "azul eléctrico",
      accent: "#168cff",
      rgb: "22,140,255",
      second: "#00e5ff"
    },
    {
      name: "rojo arena",
      accent: "#ff3156",
      rgb: "255,49,86",
      second: "#ffb347"
    },
    {
      name: "violeta",
      accent: "#9a5bff",
      rgb: "154,91,255",
      second: "#f05bff"
    },
    {
      name: "cian",
      accent: "#00cfe8",
      rgb: "0,207,232",
      second: "#8df8ff"
    },
    {
      name: "dorado",
      accent: "#d9a62e",
      rgb: "217,166,46",
      second: "#ffe18a"
    },
    {
      name: "verde",
      accent: "#19c786",
      rgb: "25,199,134",
      second: "#9affd8"
    },
    {
      name: "naranja",
      accent: "#ff7a24",
      rgb: "255,122,36",
      second: "#ffd06a"
    }
  ];

  const NAV_LINKS = [
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

  const FOOTER_DESCRIPTION =
    "La base de datos definitiva para las trivias de WWE. " +
    "Explorá luchadores, campeonatos y eventos, y seguí los récords de nuestra comunidad.";

  const DISCLAIMER =
    "MI WRESTLING utiliza imágenes de luchadores, campeonatos y eventos " +
    "únicamente con fines de identificación. No reclama derechos de propiedad " +
    "sobre ellas. Todos los derechos de esas imágenes pertenecen a los luchadores " +
    "y a las organizaciones de lucha libre correspondientes, incluida WWE.";

  const SOCIAL_LINKS = [
    {
      name: "Instagram",
      label: "IG",
      href: "#instagram"
    },
    {
      name: "YouTube",
      label: "YT",
      href: "#youtube"
    },
    {
      name: "Discord",
      label: "DC",
      href: "#discord"
    },
    {
      name: "WhatsApp",
      label: "WA",
      href: "#whatsapp"
    }
  ];

  /* =========================================================
     UTILIDADES
     ========================================================= */

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_) {
      // El sitio sigue funcionando aunque el almacenamiento esté bloqueado.
    }
  }

  function safeSessionGet(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function safeSessionSet(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (_) {
      // El tema también funciona sin sessionStorage.
    }
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(
      /[&<>"']/g,
      function (character) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[character];
      }
    );
  }

  function getBasePath() {
    const path = window.location.pathname;
    const directory = path.slice(0, path.lastIndexOf("/") + 1);

    return directory || "/";
  }

  function getLogoPath() {
    return getBasePath() + "images/logo.png";
  }

  function normalizePath(path) {
    return String(path || "")
      .split("?")[0]
      .split("#")[0]
      .replace(/\/+/g, "/");
  }

  function currentPath() {
    return normalizePath(window.location.pathname);
  }

  function isCurrentLink(href) {
    const target = normalizePath(
      new URL(href, window.location.href).pathname
    );

    const current = currentPath();

    if (target === current) return true;

    return (
      target.endsWith("/index.html") &&
      current === target.slice(0, -"index.html".length)
    );
  }

  function createElementFromHTML(html) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return template.content.firstElementChild;
  }

  /* =========================================================
     ROTACIÓN DEL TEMA
     El color cambia en cada carga cuando es posible guardar
     el último tema utilizado.
     ========================================================= */

  function applyTheme() {
    const storageKey = "mw-global-theme-index";
    const sessionKey = "mw-global-theme-session-index";

    let previousIndex = Number(safeStorageGet(storageKey));

    if (
      !Number.isInteger(previousIndex) ||
      previousIndex < 0 ||
      previousIndex >= THEMES.length
    ) {
      previousIndex = -1;
    }

    let nextIndex;

    if (previousIndex < 0) {
      nextIndex = Math.floor(Math.random() * THEMES.length);
    } else {
      nextIndex = (previousIndex + 1) % THEMES.length;
    }

    safeStorageSet(storageKey, String(nextIndex));
    safeSessionSet(sessionKey, String(nextIndex));

    const theme = THEMES[nextIndex];

    ROOT.style.setProperty("--mw-accent", theme.accent);
    ROOT.style.setProperty("--mw-accent-rgb", theme.rgb);
    ROOT.style.setProperty("--mw-accent-2", theme.second);

    // Compatibilidad con estilos globales existentes.
    ROOT.style.setProperty("--accent", theme.accent);
    ROOT.style.setProperty("--accent-rgb", theme.rgb);
    ROOT.style.setProperty("--accent-2", theme.second);

    ROOT.dataset.mwTheme = theme.name;
    ROOT.dataset.mwVersion = VERSION;

    document.documentElement.style.colorScheme = "dark";
  }

  /* =========================================================
     NAVBAR UNIVERSAL
     Si ya existe una navbar universal, no crea otra.
     No reemplaza el encabezado propio de la página de inicio.
     ========================================================= */

  function isHomePage() {
    const path = currentPath();
    const lastPart = path.split("/").filter(Boolean).pop() || "";

    return (
      lastPart === "" ||
      lastPart.toLowerCase() === "index.html"
    );
  }

  function getNavigationMarkup() {
    const links = NAV_LINKS.map(function (item) {
      const label = item[0];
      const href = getBasePath() + item[1];
      const active = isCurrentLink(href);

      return `
        <a
          class="mw-nav__link${active ? " is-active" : ""}"
          href="${escapeHTML(href)}"
          ${active ? 'aria-current="page"' : ""}
        >${escapeHTML(label)}</a>
      `;
    }).join("");

    return `
      <header class="mw-global-nav" data-mw-global-nav>
        <div class="mw-global-nav__inner">
          <a
            class="mw-global-nav__brand"
            href="${escapeHTML(getBasePath() + "index.html")}"
            aria-label="MI WRESTLING — Inicio"
          >
            <img
              class="mw-global-nav__logo"
              src="${escapeHTML(getLogoPath())}"
              alt=""
              width="43"
              height="43"
              onerror="this.style.display='none'"
            >
            <span class="mw-global-nav__brand-copy">
              <strong>MI WRESTLING</strong>
              <small>SUPERSTAR DATABASE</small>
            </span>
          </a>

          <button
            class="mw-global-nav__toggle"
            type="button"
            aria-label="Abrir menú de navegación"
            aria-expanded="false"
            aria-controls="mw-global-nav-menu"
            data-mw-nav-toggle
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <nav
            class="mw-global-nav__menu"
            id="mw-global-nav-menu"
            aria-label="Navegación principal"
            data-mw-nav-menu
          >
            <div class="mw-global-nav__links">
              ${links}
            </div>

            <a
              class="mw-global-nav__social"
              href="#instagram"
              aria-label="Seguinos en Instagram"
            >
              Seguinos en Instagram <span aria-hidden="true">↗</span>
            </a>
          </nav>
        </div>
      </header>
    `;
  }

  function setupNavigation() {
    // La página de inicio conserva su cabecera y diseño propios.
    if (isHomePage()) return;

    if (
      document.querySelector("[data-mw-global-nav]") ||
      document.querySelector(".site-nav")
    ) {
      return;
    }

    const navbar = createElementFromHTML(getNavigationMarkup());

    if (!navbar) return;

    document.body.insertBefore(navbar, document.body.firstChild);

    const toggle = navbar.querySelector("[data-mw-nav-toggle]");
    const menu = navbar.querySelector("[data-mw-nav-menu]");

    if (!toggle || !menu) return;

    function closeMenu() {
      navbar.classList.remove("is-menu-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menú de navegación");
    }

    toggle.addEventListener("click", function () {
      const isOpen = navbar.classList.toggle("is-menu-open");

      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute(
        "aria-label",
        isOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"
      );
    });

    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });

    document.addEventListener("click", function (event) {
      if (!navbar.contains(event.target)) closeMenu();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  /* =========================================================
     FOOTER UNIVERSAL
     ========================================================= */

  function getFooterMarkup() {
    const socialMarkup = SOCIAL_LINKS.map(function (social) {
      return `
        <a
          class="mw-global-footer__social"
          href="${escapeHTML(social.href)}"
          aria-label="${escapeHTML(social.name)}"
          title="${escapeHTML(social.name)}"
        >${escapeHTML(social.label)}</a>
      `;
    }).join("");

    return `
      <footer class="mw-global-footer" data-mw-global-footer>
        <div class="mw-global-footer__inner">
          <div class="mw-global-footer__main">
            <a
              class="mw-global-footer__brand"
              href="${escapeHTML(getBasePath() + "index.html")}"
            >MI WRESTLING</a>

            <p class="mw-global-footer__description">
              ${escapeHTML(FOOTER_DESCRIPTION)}
            </p>

            <div class="mw-global-footer__socials"
              aria-label="Redes sociales">
              ${socialMarkup}
            </div>
          </div>

          <div class="mw-global-footer__legal">
            <p class="mw-global-footer__disclaimer">
              ${escapeHTML(DISCLAIMER)}
            </p>

            <p class="mw-global-footer__copyright">
              Desarrollado por © ${new Date().getFullYear()}
              Trivias WWE para la comunidad.
            </p>
          </div>
        </div>
      </footer>
    `;
  }

  function setupFooter() {
    if (
      document.querySelector("[data-mw-global-footer]") ||
      document.querySelector(".site-footer") ||
      document.querySelector(".mw-footer")
    ) {
      return;
    }

    document.body.appendChild(createElementFromHTML(getFooterMarkup()));
  }

  /* =========================================================
     INICIALIZACIÓN
     ========================================================= */

  function initialize() {
    applyTheme();
    setupNavigation();
    setupFooter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }
})();
