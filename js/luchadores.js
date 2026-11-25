
/* =========================================================================
   TRIVIAS WRESTLING — LUCHADORES.JS
   Base de datos, historial, alter egos, intérpretes y catálogos.
   Referencias mediante nombres canónicos.
   ========================================================================= */

import { players } from "../data/jugadores.js";

/* 1. CONFIGURACIÓN */

const CONFIG = {
  fallbackImage: "images/renders/Vacante.webp",
  selectors: {
    catalog: "[data-wrestlers-catalog]",
    search: "[data-wrestlers-search]",
    category: "[data-roster-filter]",
    brand: "[data-brand-filter]",
    letter: "[data-roster-letter]",
    count: "[data-wrestler-count]"
  }
};

/* 2. BASE DE DATOS */

export const wrestlers = [
{ id: "Adam Cole", name: "Adam Cole", nickname: "The Panama City Playboy",
  stable: "", brand: "Alumni",
  timeline: [{
  from: "", to: null, image: "images/renders/adam-cole-actual.webp"}
  ],alteregos: []
},

{ id: "Axiom", name: "Axiom", nickname: "The Spanish Superstar", stable: "",
  brand: "Smackdown",
  timeline: [ { from: "", to: null,image: "images/renders/axiom-actual.webp"}
  ],
  alteregos: []},

  { id: "Cody Rhodes", name: "Cody Rhodes", nickname: "The American Nightmare",
    stable: "",brand: "RAW",
    timeline: [
      { from: "1/01/2023", to: "9/2/2025", image: "images/renders/cody-rhodes-2023.webp" },
      { from: "01/01/2026", to: null, image: "images/renders/cody-rhodes-actual.webp" }
    ],
    alteregos: [ { name: "Undashing Cody Rhodes",from: "10/02/2025", to: "08/08/2025", image: "images/renders/cody-undashing.webp" }
    ]
  },

 { id: "Chad Gable", name: "Chad Gable", nickname: "Alpha Male",
   stable: "",brand: "NXT",
   timeline: [
    { from: "12/07/2023", to: "25/10/2025",
      image: "images/renders/chad-gable-2023.webp"},
    { from: "24/09/2026", to: null,
      image: "images/renders/chad-gable-actual.webp"}
  ],
  alteregos: [
    { name: "OG Grande Americano", from: "26/10/2025", to: "23/09/2026", image: "images/renders/og-grande-americano.webp"}
  ]
},
   
 {id: "CM Punk", name: "CM Punk", nickname: "The Best in the World",
  stable: "", brand: "NXT",
  timeline: [
    {from: "", to: null, image: "images/renders/cm-punk-actual.webp"}
  ],
  alteregos: []
},

{id: "El Grande Americano",name: "El Grande Americano",nickname: "",
  stable: "",brand: "AAA", timeline:[
    {from: "", to: null, image: "images/renders/el-grande-americano-actual.webp"}],
  alteregos: [] },
   
  {id: "Tommaso Ciampa", name: "Tommaso Ciampa", nickname: "",
    stable: "", brand: "Alumni",
    timeline: [{ from: "07/02/2024", to: "27/06/2025",
        image: "images/renders/tommaso-ciampa.webp"
      },
      { from: "19/08/2025",to: null,
        image: "images/renders/tommaso-ciampa.webp"
      }
    ],
   
    alteregos:[{
        name: "The Riddler",
        from: "28/06/2025",
        to: "18/08/2025",
        image: "images/renders/the-riddler.webp"
      }
    ]
  },

{id: "Triple H",name: "Triple H",nickname: "The Game",
 stable: "",brand: "ADMIN",timeline: [
{from: "",to: null,image: "images/renders/triple-h-actual.webp"}
  ],
  alteregos: []
},
   
];

/* 3. UTILIDADES */

function normalize(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getToday() {
  const d = new Date();
  return [
    String(d.getDate()).padStart(2, "0"),
    String(d.getMonth() + 1).padStart(2, "0"),
    d.getFullYear()
  ].join("/");
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* 4. FECHAS */

export function parseDate(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;

    return value.getFullYear() * 10000 +
      (value.getMonth() + 1) * 100 +
      value.getDate();
  }

  if (typeof value !== "string") return null;

  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getDate() !== day ||
    date.getMonth() !== month - 1 ||
    date.getFullYear() !== year
  ) return null;

  return year * 10000 + month * 100 + day;
}

export function isDateBetween(date, from, to = null) {
  const current = parseDate(date);
  const start = parseDate(from);
  const end = to === null ? null : parseDate(to);

  if (current === null || start === null) return false;
  if (to !== null && end === null) return false;

  return current >= start && (end === null || current <= end);
}

/* 5. CLASIFICACIÓN */

export function getRosterCategory(wrestlerOrBrand) {
  const brand = normalize(
    typeof wrestlerOrBrand === "object"
      ? wrestlerOrBrand?.brand
      : wrestlerOrBrand
  );

  if (["raw", "smackdown"].includes(brand)) return "Main Roster";
  if (["nxt", "aaa"].includes(brand)) return "Segunda Liga";
  if (brand === "alumni") return "Alumni";
  if (["hof", "hall of fame"].includes(brand)) return "HOF";
  if (brand === "admin") return "ADMIN";

  return null;
}

export function getWrestlersByCategory(category) {
  const target = normalize(category);
  return wrestlers.filter(w =>
    normalize(getRosterCategory(w)) === target
  );
}

export function getWrestlersByBrand(brand) {
  const target = normalize(brand);
  return wrestlers.filter(w => normalize(w.brand) === target);
}

export const getMainRoster = () => getWrestlersByCategory("Main Roster");
export const getSecondLeague = () => getWrestlersByCategory("Segunda Liga");
export const getAlumni = () => getWrestlersByCategory("Alumni");
export const getHallOfFamers = () => getWrestlersByCategory("HOF");
export const getAdministration = () => getWrestlersByCategory("ADMIN");

/* 6. CONSULTAS POR NOMBRE CANÓNICO */

export function getWrestler(identifier) {
  if (identifier == null) return null;

  const target = normalize(identifier);

  return wrestlers.find(w =>
    normalize(w.name) === target
  ) ?? null;
}

export function getWrestlerById(id) {
  return getWrestler(id);
}

export function getWrestlerByName(name) {
  return getWrestler(name);
}

/* 7. ALTER EGOS */

export function getAlteregoByDate(identifier, date = getToday()) {
  const wrestler = getWrestler(identifier);
  if (!wrestler) return null;

  return wrestler.alteregos.find(a =>
    isDateBetween(date, a.from, a.to)
  ) ?? null;
}

export function getWrestlerAlteregos(identifier) {
  const wrestler = getWrestler(identifier);
  return wrestler ? [...wrestler.alteregos] : [];
}

/* 8. HISTORIAL DE RENDERS */

export function getTimelineRender(identifier, date = getToday()) {
  const wrestler = getWrestler(identifier);
  if (!wrestler) return null;

  return wrestler.timeline.find(period =>
    isDateBetween(date, period.from, period.to)
  ) ?? null;
}

export function getWrestlerTimeline(identifier) {
  const wrestler = getWrestler(identifier);
  return wrestler ? [...wrestler.timeline] : [];
}

/* 9. RESOLUCIÓN DEL RENDER */

export function getWrestlerRender(identifier, date = getToday()) {
  const wrestler = getWrestler(identifier);
  if (!wrestler) return CONFIG.fallbackImage;

  const alterego = getAlteregoByDate(wrestler.name, date);
  if (alterego?.image) return alterego.image;

  const timeline = getTimelineRender(wrestler.name, date);
  if (timeline?.image) return timeline.image;

  return CONFIG.fallbackImage;
}

export function getCurrentRender(identifier) {
  return getWrestlerRender(identifier, getToday());
}

/* 10. PRESENTACIÓN */

export function getWrestlerPresentation(identifier, date = getToday()) {
  const wrestler = getWrestler(identifier);
  if (!wrestler) return null;

  const alterego = getAlteregoByDate(wrestler.name, date);
  const timeline = getTimelineRender(wrestler.name, date);

  return {
    id: wrestler.name,
    name: wrestler.name,
    displayName: alterego?.name || wrestler.name,
    nickname: wrestler.nickname,
    stable: wrestler.stable,
    brand: wrestler.brand,
    category: getRosterCategory(wrestler),
    image: getWrestlerRender(wrestler.name, date),
    alterego,
    timeline,
    date
  };
}

/* 11. INTÉRPRETES */

export function getWrestlerPlayers(identifier, date = getToday()) {
  const wrestler = getWrestler(identifier);
  if (!wrestler) return [];

  return players.flatMap(player => {
    const periods = (player.wrestlers || []).filter(period =>
      normalize(period.id) === normalize(wrestler.name)
    );

    return periods.map(period => ({
      id: player.id,
      name: player.name,
      country: player.country || "",
      status: player.status || "",
      from: period.from,
      to: period.to,
      current: isDateBetween(date, period.from, period.to),
      recordUrl: `records.html?interpreter=${encodeURIComponent(player.id)}`
    }));
  }).sort((a, b) =>
    (parseDate(a.from) ?? 0) - (parseDate(b.from) ?? 0)
  );
}

export function getWrestlerInterpreterData(identifier, date = getToday()) {
  const history = getWrestlerPlayers(identifier, date);
  const current = history.find(entry => entry.current);

  return {
    interpreter: current?.id || null,
    interpreterHistory: history
  };
}

export function getPlayer(identifier) {
  if (identifier == null) return null;

  const target = normalize(identifier);

  return players.find(player =>
    normalize(player.id) === target ||
    normalize(player.name) === target
  ) ?? null;
}

export function getPlayerWrestlers(identifier) {
  const player = getPlayer(identifier);
  if (!player) return [];

  return (player.wrestlers || []).map(period => ({
    ...period,
    wrestler: getWrestler(period.id)
  }));
}

/* 12. BÚSQUEDA */

export function searchWrestlers(query) {
  const target = normalize(query);
  if (!target) return [...wrestlers];

  return wrestlers.filter(w => [
    w.name, w.nickname, w.stable, w.brand
  ].some(value => normalize(value).includes(target)));
}

/* 13. FILTROS */

export function filterWrestlers(options = {}) {
  const {
    category = "",
    brand = "",
    search = "",
    source = ""
  } = options;

  let result = [...wrestlers];

  if (source === "roster") {
    result = result.filter(w =>
      ["Main Roster", "Segunda Liga", "ADMIN"]
        .includes(getRosterCategory(w))
    );
  }

  if (source === "alumni") {
    result = result.filter(w =>
      ["Alumni", "HOF"].includes(getRosterCategory(w))
    );
  }

  if (category) {
    result = result.filter(w =>
      normalize(getRosterCategory(w)) === normalize(category)
    );
  }

  if (brand) {
    result = result.filter(w =>
      normalize(w.brand) === normalize(brand)
    );
  }

  if (search) {
    const target = normalize(search);

    result = result.filter(w => [
      w.name, w.nickname, w.stable, w.brand
    ].some(value => normalize(value).includes(target)));
  }

  return result;
}

/* 14. VALIDACIÓN */

function validatePeriod(period, label, errors) {
  if (!period || typeof period !== "object") {
    errors.push(`${label}: período inválido.`);
    return;
  }

  const start = parseDate(period.from);
  const end = period.to === null ? null : parseDate(period.to);

  if (start === null) errors.push(`${label}: fecha inicial inválida.`);
  if (period.to !== null && end === null) {
    errors.push(`${label}: fecha final inválida.`);
  }

  if (start !== null && end !== null && end < start) {
    errors.push(`${label}: período invertido.`);
  }

  if (!period.image || typeof period.image !== "string") {
    errors.push(`${label}: falta la imagen.`);
  }
}

function validatePeriodOverlaps(periods, label, errors) {
  const valid = periods.map(p => ({
    ...p,
    start: parseDate(p.from),
    end: p.to === null ? Infinity : parseDate(p.to)
  })).filter(p => p.start !== null && p.end !== null);

  for (let i = 0; i < valid.length; i++) {
    for (let j = i + 1; j < valid.length; j++) {
      if (
        valid[i].start <= valid[j].end &&
        valid[j].start <= valid[i].end
      ) {
        errors.push(
          `${label}: períodos superpuestos (${valid[i].from} y ${valid[j].from}).`
        );
      }
    }
  }
}

export function validateWrestler(wrestler) {
  const errors = [];

  if (!wrestler || typeof wrestler !== "object") {
    return { valid: false, errors: ["El luchador no es válido."] };
  }

  if (!wrestler.name) errors.push("Falta el nombre.");

  if (!Array.isArray(wrestler.timeline)) {
    errors.push(`${wrestler.name}: timeline debe ser un array.`);
  }

  if (!Array.isArray(wrestler.alteregos)) {
    errors.push(`${wrestler.name}: alteregos debe ser un array.`);
  }

  if (
    !Array.isArray(wrestler.timeline) ||
    !Array.isArray(wrestler.alteregos)
  ) {
    return { valid: false, errors };
  }

  wrestler.timeline.forEach((p, i) =>
    validatePeriod(p, `${wrestler.name} timeline ${i + 1}`, errors)
  );

  wrestler.alteregos.forEach((p, i) => {
    validatePeriod(p, `${wrestler.name} alterego ${i + 1}`, errors);
    if (!p?.name) errors.push(`${wrestler.name}: alter ego sin nombre.`);
  });

  validatePeriodOverlaps(wrestler.timeline, `${wrestler.name} timeline`, errors);
  validatePeriodOverlaps(wrestler.alteregos, `${wrestler.name} alteregos`, errors);

  return { valid: errors.length === 0, errors };
}

export function validateRoster() {
  const errors = [];
  const names = new Set();

  wrestlers.forEach(w => {
    const name = normalize(w.name);

    if (names.has(name)) errors.push(`Nombre duplicado: ${w.name}`);
    names.add(name);

    errors.push(...validateWrestler(w).errors);
  });

  players.forEach(player => {
    if (!player.id || !player.name) {
      errors.push("Intérprete sin ID o nombre.");
    }

    (player.wrestlers || []).forEach(period => {
      if (!period.id || !parseDate(period.from)) {
        errors.push(`${player.name}: historial inválido.`);
      }

      if (period.to !== null && !parseDate(period.to)) {
        errors.push(`${player.name}: fecha final inválida.`);
      }

      if (
        period.to !== null &&
        parseDate(period.from) !== null &&
        parseDate(period.to) !== null &&
        parseDate(period.to) < parseDate(period.from)
      ) {
        errors.push(`${player.name}: período invertido.`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    total: wrestlers.length,
    errors
  };
}

/* 15. CONEXIÓN VISUAL */

let wrestlerCards = null;

function loadWrestlerCards() {
  const component = window.MIWrestlerCards;

  if (
    !component ||
    typeof component.card !== "function" ||
    typeof component.openModal !== "function"
  ) {
    console.error("[Trivias Wrestling] Wrestler Card no disponible.");
    wrestlerCards = null;
    return false;
  }

  wrestlerCards = component;
  console.info("[Trivias Wrestling] Wrestler Card conectado.");
  return true;
}

/* 16. TARJETA DE RESPALDO */

function fallbackCard(wrestler, presentation) {
  return `
    <button class="mw-wrestler-card" type="button"
      data-wrestler-open="${escapeHTML(wrestler.name)}">
      <img class="mw-wrestler-card__image"
        src="${escapeHTML(presentation.image)}"
        alt="${escapeHTML(presentation.displayName)}"
        loading="lazy">
      <span class="mw-wrestler-card__name">
        ${escapeHTML(presentation.displayName)}
      </span>
      <span class="mw-wrestler-card__brand">
        ${escapeHTML(wrestler.brand)}
      </span>
    </button>
  `;
}

/* 17. RENDERIZADO */

export function renderWrestlersCatalog(container, list = wrestlers) {
  if (!container) return;

  if (!Array.isArray(list) || !list.length) {
    container.innerHTML = `
      <div class="mw-empty-state">
        NO SE ENCONTRARON SUPERSTRELLAS.
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(w => {
    const presentation = getWrestlerPresentation(w.name);
    if (!presentation) return "";

    const cardData = {
      ...w,
      image: presentation.image,
      displayName: presentation.displayName,
      presentation
    };

    if (typeof wrestlerCards?.card === "function") {
      try {
        return wrestlerCards.card(cardData);
      } catch (error) {
        console.error(
          `[Trivias Wrestling] Error creando tarjeta de ${w.name}:`,
          error
        );
      }
    }

    return fallbackCard(w, presentation);
  }).join("");
}

/* 18. CONTADORES */

function updateWrestlerCounts() {
  document.querySelectorAll(CONFIG.selectors.count).forEach(element => {
    const group = element.dataset.wrestlerCount;
    let list = wrestlers;

    if (group === "main-roster") list = getMainRoster();
    if (group === "segunda") list = getSecondLeague();
    if (group === "admin") list = getAdministration();
    if (group === "alumni") list = [...getAlumni(), ...getHallOfFamers()];
    if (group === "hof") list = getHallOfFamers();

    element.textContent = `${list.length} SUPERSTRELLAS`;
  });
}

/* 19. INICIALIZACIÓN */

export function initWrestlersCatalog() {
  const containers = document.querySelectorAll(CONFIG.selectors.catalog);

  if (!containers.length) {
    console.warn("[Trivias Wrestling] No se encontraron catálogos.");
    return;
  }

  const searchInput = document.querySelector(CONFIG.selectors.search);
  const categoryFilter = document.querySelector(CONFIG.selectors.category);
  const brandFilter = document.querySelector(CONFIG.selectors.brand);
  const letterButtons = document.querySelectorAll(CONFIG.selectors.letter);

  let activeLetter = "";

  function updateCatalogs() {
    let filtered = filterWrestlers({
      source: document.body.dataset.page === "alumni" ? "alumni" : "roster",
      search: searchInput?.value || "",
      category: categoryFilter?.value || "",
      brand: brandFilter?.value || ""
    });

    if (activeLetter) {
      filtered = filtered.filter(w =>
        normalize(w.name).startsWith(activeLetter)
      );
    }

    containers.forEach(container => {
      const group = container.dataset.wrestlersCatalog;
      let list = filtered;

      if (group === "main-roster") {
        list = filtered.filter(w => getRosterCategory(w) === "Main Roster");
      }

      if (group === "segunda") {
        list = filtered.filter(w => getRosterCategory(w) === "Segunda Liga");
      }

      if (group === "admin") {
        list = filtered.filter(w => getRosterCategory(w) === "ADMIN");
      }

      if (group === "alumni") {
        list = filtered.filter(w =>
          ["Alumni", "HOF"].includes(getRosterCategory(w))
        );
      }

      if (group === "hof") {
        list = filtered.filter(w => getRosterCategory(w) === "HOF");
      }

      renderWrestlersCatalog(container, list);

      const wrapper = container.closest("[data-roster-group]");
      if (wrapper) wrapper.hidden = list.length === 0;
      else container.hidden = list.length === 0;
    });

    updateWrestlerCounts();
  }

  letterButtons.forEach(button => {
    button.addEventListener("click", () => {
      activeLetter = normalize(button.dataset.rosterLetter);

      letterButtons.forEach(item => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      updateCatalogs();
    });
  });

  searchInput?.addEventListener("input", updateCatalogs);
  categoryFilter?.addEventListener("change", updateCatalogs);
  brandFilter?.addEventListener("change", updateCatalogs);

  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-wrestler-open]");
    if (!trigger || !wrestlerCards?.openModal) return;

    const wrestler = getWrestler(trigger.dataset.wrestlerOpen);
    if (!wrestler) return;

    const presentation = getWrestlerPresentation(wrestler.name);

    wrestlerCards.openModal({
      ...wrestler,
      ...presentation,
      ...getWrestlerInterpreterData(wrestler.name)
    });
  });

  updateCatalogs();
}

/* 20. ARRANQUE */

function startWrestlersModule() {
  const validation = validateRoster();

  if (!validation.valid) {
    console.warn("[Trivias Wrestling] Revisar datos:", validation.errors);
  }

  loadWrestlerCards();
  initWrestlersCatalog();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startWrestlersModule, {
    once: true
  });
} else {
  startWrestlersModule();
}
