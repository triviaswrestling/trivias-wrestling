/* ==========================================================
   MI WRESTLING — GLOBAL NAVBAR / FOOTER / ACCENT ROTATION
   Core unificado y corregido (Versión Completa Full)
   ========================================================== */

(() => {
  "use strict";

  const THEMES = [
    { name: "blue", accent: "#168cff", rgb: "22, 140, 255", second: "#00e5ff", primary: "#0051ff", secondary: "#00e5ff" },
    { name: "red", accent: "#ff3156", rgb: "255, 49, 86", second: "#ffb347", primary: "#e60000", secondary: "#ffb347" },
    { name: "violet", accent: "#9a5bff", rgb: "154, 91, 255", second: "#f05bff", primary: "#9a5bff", secondary: "#f05bff" },
    { name: "cyan", accent: "#00cfe8", rgb: "0, 207, 232", second: "#8df8ff", primary: "#00cfe8", secondary: "#8df8ff" },
    { name: "gold", accent: "#d9a62e", rgb: "217, 166, 46", second: "#ffe18a", primary: "#d9a62e", secondary: "#ffe18a" },
    { name: "green", accent: "#19c786", rgb: "25, 199, 134", second: "#9affd8", primary: "#19c786", secondary: "#9affd8" },
    { name: "orange", accent: "#ff7a24", rgb: "255, 122, 36", second: "#ffd06a", primary: "#ff7a24", secondary: "#ffd06a" }
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

  const SOCIALS = [
    {
      id: "instagram",
      label: "Instagram",
      url: "",
      icon: "instagram"
    },
    {
      id: "youtube",
      label: "YouTube",
      url: "https://www.youtube.com/@TriviasWWE",
      icon: "youtube"
    },
    {
      id: "discord",
      label: "Discord",
      url: "https://discord.gg/YmBJQPfQ",
      icon: "discord"
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      url: "https://chat.whatsapp.com/D7vkfUKTujZ8nr6xlQj02C",
      icon: "whatsapp"
    }
  ];

  const FOOTER_DESCRIPTION =
    "La base de datos definitiva para las trivias de WWE. Explorá luchadores, campeonatos y eventos, y seguí los récords de nuestra comunidad.";

  const FOOTER_LEGAL =
    "MI WRESTLING utiliza imágenes de luchadores, campeonatos y eventos únicamente con fines de identificación. No reclama derechos de propiedad sobre ellas. Todos los derechos de esas imágenes pertenecen a los luchadores y a las organizaciones de lucha libre correspondientes, incluida WWE.";

  const THEME_KEY = "mw-global-theme-index";

  function safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (_) {}
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function getRootPath() {
    const scripts = Array.from(document.scripts);
    const script = scripts.find(item =>
      /(?:^|\/)js\/mi-wrestling\.js(?:[?#].*)?$/i.test(item.src || "")
    );

    if (script && script.src) {
      const url = new URL(script.src, location.href);
      return url.pathname.replace(/\/js\/mi-wrestling\.js$/i, "/");
    }

    const parts = location.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";

    if (/\.[a-z0-9]+$/i.test(last)) {
      parts.pop();
    }

    return "/" + (parts.length ? parts.join("/") + "/" : "");
  }

  const ROOT = getRootPath();

  function siteURL(path) {
    return ROOT + String(path).replace(/^\/+/, "");
  }

  function currentPageName() {
    return (
      location.pathname.split("/").filter(Boolean).pop() || "index.html"
    ).toLowerCase();
  }

  function isHomePage() {
    return currentPageName() === "index.html";
  }

  function applyTheme() {
    let index = Number.parseInt(safeGet(THEME_KEY) || "0", 10);

    if (!Number.isFinite(index)) index = 0;

    index = ((index % THEMES.length) + THEMES.length) % THEMES.length;

    const theme = THEMES[index];
    const root = document.documentElement;

    // Aplicar variables de acento principales y secundarias (compatibilidad total)
    root.style.setProperty("--mw-accent", theme.accent);
    root.style.setProperty("--mw-accent-rgb", theme.rgb);
    root.style.setProperty("--mw-accent-2", theme.second);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-rgb", theme.rgb);
    root.style.setProperty("--theme-primary", theme.primary);
    root.style.setProperty("--theme-secondary", theme.secondary);
    root.style.setProperty("--theme-glow", `rgba(${theme.rgb}, 0.6)`);
    root.dataset.mwTheme = theme.name;
  }

  function rotateAccent() {
    const current = Number.parseInt(safeGet(THEME_KEY) || "0", 10);
    const next = Number.isFinite(current)
      ? (current + 1) % THEMES.length
      : 0;

    safeSet(THEME_KEY, String(next));
    applyTheme();
  }

  function iconSVG(name) {
    const common = 'viewBox="0 0 24 24" aria-hidden="true" focusable="false"';

    const icons = {
      instagram: `<svg ${common}>
        <rect x="3.5" y="3.5" width="17" height="17" rx="5"></rect>
        <circle cx="12" cy="12" r="4"></circle>
        <circle cx="17.7" cy="6.5" r=".8" fill="currentColor" stroke="none"></circle>
      </svg>`,

      youtube: `<svg ${common}>
        <path d="M21 7.3a2.7 2.7 0 0 0-1.9-1.9C17.4 5 12 5 12 5s-5.4 0-7.1.4A2.7 2.7 0 0 0 3 7.3 28 28 0 0 0 2.6 12a28 28 0 0 0 .4 4.7 2.7 2.7 0 0 0 1.9 1.9C6.6 19 12 19 12 19s5.4 0 7.1-.4a2.7 2.7 0 0 0 1.9-1.9 28 28 0 0 0 .4-4.7 28 28 0 0 0-.4-4.7Z"></path>
        <path d="m10 9 5 3-5 3Z" fill="#05070b" stroke="none"></path>
      </svg>`,

      discord: `<svg ${common}>
        <path d="M7 7.2a13 13 0 0 1 3-.9l.4.8a12 12 0 0 1 3.2 0l.4-.8a13 13 0 0 1 3 .9c1.8 2.6 2.3 5.1 2 7.6a12 12 0 0 1-3.7 1.9l-.8-1.3a8 8 0 0 0 1.2-.6 9 9 0 0 1-8.2 0 8 8 0 0 0 1.2.6l-.8 1.3A12 12 0 0 1 3 14.8c-.3-2.5.2-5 2-7.6Z"></path>
        <circle cx="9" cy="11.5" r="1"></circle>
        <circle cx="15" cy="11.5" r="1"></circle>
      </svg>`,

      whatsapp: `<svg ${common}>
        <path d="M20.2 11.7a8.2 8.2 0 0 1-12.1 7.2L3.5 20l1.1-4.4a8.2 8.2 0 1 1 15.6-3.9Z"></path>
        <path d="M8.2 7.8c.2-.4.5-.4.8-.4h.5l.8 1.9c.1.2 0 .4-.1.6l-.6.7c-.2.2-.1.4 0 .6.5.9 1.3 1.7 2.2 2.2.2.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l1.8.9c.2.1.3.3.2.6-.1.7-.6 1.3-1.2 1.5-.7.3-1.6.1-2.7-.4-1.4-.6-2.7-1.8-3.6-3.1-.8-1.1-1-2.1-.8-2.9.1-.4.4-.8.7-1Z"></path>
      </svg>`
    };

    return icons[name] || "";
  }

  function socialMarkup(social) {
    const available = Boolean(social.url);
    const attrs = available
      ? `href="${escapeHTML(social.url)}" target="_blank" rel="noopener noreferrer"`
      : 'href="#" aria-disabled="true" data-social-unavailable="true" title="Enlace pendiente"';

    return `
      <a class="mw-global-social mw-global-social--${social.id}"
         ${attrs}
         aria-label="${social.label}">
        <span class="mw-global-social__icon">${iconSVG(social.icon)}</span>
        <span>${social.label}</span>
      </a>`;
  }

  function buildNavbar() {
    const links = NAV_LINKS.map(([label, path]) => {
      const active = currentPageName() === path.toLowerCase();

      return `
        <a class="mw-global-nav__link ${active ? 'active' : ''}"
           href="${escapeHTML(siteURL(path))}"
           ${active ? 'aria-current="page"' : ""}>
          ${escapeHTML(label)}
        </a>`;
    }).join("");

    return `
      <header class="mw-global-nav" data-mw-global-nav>
        <div class="mw-global-nav__inner">
          <a class="mw-global-nav__brand"
             href="${escapeHTML(siteURL("index.html"))}"
             aria-label="MI WRESTLING, inicio">
            <span class="mw-global-nav__mark">
              <img src="${escapeHTML(siteURL("images/logo.png"))}"
                   alt=""
                   onerror="this.style.display='none'">
            </span>
            <span class="mw-global-nav__brand-copy">
              <span class="mw-global-nav__brand-title">MI WRESTLING</span>
              <span class="mw-global-nav__brand-subtitle">SUPERSTAR DATABASE</span>
            </span>
          </a>

          <button class="mw-global-nav__toggle"
                  type="button"
                  aria-label="Abrir menú"
                  aria-expanded="false"
                  aria-controls="mw-global-nav-links">
            <span></span><span></span><span></span>
          </button>

          <nav class="mw-global-nav__links"
               id="mw-global-nav-links"
               aria-label="Navegación principal">
            ${links}
            <a class="mw-global-nav__social-cta" href="#mw-socials">
              <span class="mw-global-nav__social-dot"></span>
              REDES
              <span class="mw-global-nav__social-arrow">↗</span>
            </a>
          </nav>
        </div>
      </header>`;
  }

  function buildFooter() {
    return `
      <footer class="mw-global-footer" data-mw-global-footer>
        <div class="mw-global-footer__inner">
          <p class="mw-global-footer__copy">${FOOTER_DESCRIPTION}</p>

          <div class="mw-global-footer__meta">
            <p class="mw-global-footer__caption">Seguinos en nuestras redes</p>
            <div class="mw-global-socials" id="mw-socials">
              ${SOCIALS.map(socialMarkup).join("")}
            </div>
          </div>

          <p class="mw-global-footer__legal">${FOOTER_LEGAL}</p>
        </div>
      </footer>`;
  }

  function setupNavbar() {
    if (isHomePage()) return;
    if (document.querySelector("[data-mw-global-nav], .site-nav")) return;

    const holder = document.createElement("div");
    holder.innerHTML = buildNavbar().trim();

    const nav = holder.firstElementChild;
    const existingHeader = document.querySelector("body > header, body > .site-header");

    if (existingHeader) {
      existingHeader.insertAdjacentElement("beforebegin", nav);
    } else {
      document.body.insertAdjacentElement("afterbegin", nav);
    }

    const toggle = nav.querySelector(".mw-global-nav__toggle");
    const links = nav.querySelector(".mw-global-nav__links");

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";

      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      links.classList.toggle("is-open", open);
    });

    links.addEventListener("click", event => {
      if (!event.target.closest("a")) return;

      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menú");
      links.classList.remove("is-open");
    });

    document.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;

      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menú");
      links.classList.remove("is-open");
    });
  }

  function setupFooter() {
    if (document.querySelector(
      "[data-mw-global-footer], footer.site-footer, footer.mw-footer, .mw-home__footer"
    )) return;

    const holder = document.createElement("div");
    holder.innerHTML = buildFooter().trim();

    const footer = holder.firstElementChild;
    const existingFooter = document.querySelector("body > footer, body > .site-footer");

    if (existingFooter) {
      existingFooter.insertAdjacentElement("beforebegin", footer);
    } else {
      document.body.appendChild(footer);
    }
  }

  function setupInteractions() {
    console.log("🔥 Mi-Wrestling Engine Activado");

    const currentPath = currentPageName();
    const navLinks = document.querySelectorAll('.mw-nav-item, nav a, .mw-global-nav__link');

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href.toLowerCase() === currentPath || (currentPath === '' && href.includes('index.html')))) {
        link.classList.add('active');
      }

      link.addEventListener('mouseenter', () => {
        link.style.letterSpacing = '2px';
      });
      link.addEventListener('mouseleave', () => {
        link.style.letterSpacing = '1.5px';
      });
    });
  }

  function init() {
    applyTheme();
    setupNavbar();
    setupFooter();
    setupInteractions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.MIWrestlingTheme = {
    apply: applyTheme,
    next: rotateAccent,
    themes: THEMES.map(theme => ({ ...theme }))
  };
})();
