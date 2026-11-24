
/* =========================================================================
   TRIVIAS WRESTLING
   ARCHIVO CENTRAL: LUCHADORES.JS

   Responsabilidades:
   - Base de datos de luchadores.
   - Historial de renders y alter egos.
   - Clasificación automática.
   - Consultas y filtros.
   - Administración del catálogo.
   - Conexión con wrestler-card.js.

   IMPORTANTE:
   Las tarjetas y los modales se dibujan en wrestler-card.js.
   Este archivo administra los datos y decide qué información entregar.
   ========================================================================= */
import {
  card,
  openModal
} from "./components/wrestler-card.js";
/* =========================================================================
   1. BASE DE DATOS
   ========================================================================= */
export const wrestlers = [

  /* -----------------------------------------------------------------------
     CODY RHODES
     ----------------------------------------------------------------------- */

  { id: "Cody Rhodes",
    name: "Cody Rhodes",
    nickname: "The American Nightmare",
    stable: "",
    brand: "RAW",
    timeline: [
      { from: "01/01/2023",
        to: "31/12/2023",
        image: "images/renders/cody-rhodes-2023.webp"
      },
      { from: "01/01/2026",
        to: null,
        image: "images/renders/cody-rhodes-actual.webp"
      }
    ],

    alteregos: [
      { name: "Undashing Cody Rhodes",
        from: "10/02/2025",
        to: "08/08/2025",
        image: "images/renders/cody-undashing.webp"
      }
    ]
  },
  /* -----------------------------------------------------------------------
     TOMMASO CIAMPA
     ----------------------------------------------------------------------- */
  { id: "Tommaso Ciampa",
    name: "Tommaso Ciampa",
    nickname: "",
    stable: "",
    brand: "Alumni",
    timeline: [
      {
        from: "07/02/2024",
        to: "27/06/2025",
        image: "images/renders/tommaso-ciampa.webp"
      },
      {
        from: "19/08/2025",
        to: null,
        image: "images/renders/tommaso-ciampa.webp"
      }
    ],

    alteregos: [
      { name: "The Riddler",
        from: "28/06/2025",
        to: "18/08/2025",
        image: "images/renders/the-riddler.webp"
      }
    ]
  }

];
/* =========================================================================
   2. CONFIGURACIÓN
   ========================================================================= */
const CONFIG = {
  fallbackImage: "images/renders/Vacante.webp",
  selectors: {
    catalog: "[data-wrestlers-catalog]",
    search: "[data-wrestlers-search]",
    category: "[data-roster-filter]",
    brand: "[data-brand-filter]"
  }
};
/* =========================================================================
   3. UTILIDADES
   ========================================================================= */
function normalize(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
/* =========================================================================
   4. SISTEMA DE FECHAS

   Formato oficial: DD/MM/YYYY
   Los períodos incluyen tanto el día inicial como el final.
   ========================================================================= */

export function parseDate(value) {

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;

    return (
      value.getFullYear() * 10000 +
      (value.getMonth() + 1) * 100 +
      value.getDate()
    );
  }

  if (typeof value !== "string") return null;

  const match = value.trim().match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/
  );

  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

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


function getToday() {
  const today = new Date();

  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  return `${day}/${month}/${year}`;
}


/* =========================================================================
   5. CLASIFICACIÓN AUTOMÁTICA

   RAW / SmackDown = Main Roster
   NXT / AAA       = Segunda Liga
   ADMIN           = Administración
   Alumni          = Fuera del roster activo
   HOF             = Hall of Fame
   ========================================================================= */

export function getRosterCategory(wrestlerOrBrand) {

  const brand = normalize(
    typeof wrestlerOrBrand === "object"
      ? wrestlerOrBrand?.brand
      : wrestlerOrBrand
  );

  if (!brand) return null;

  if (brand === "raw" || brand === "smackdown") {
    return "Main Roster";
  }

  if (brand === "nxt" || brand === "aaa") {
    return "Segunda Liga";
  }

  if (brand === "admin") {
    return "ADMIN";
  }

  if (
    brand === "hof" ||
    brand === "hall of fame"
  ) {
    return "HOF";
  }

  if (brand === "alumni") {
    return "Alumni";
  }

  return null;
}


export function getWrestlersByCategory(category) {

  const target = normalize(category);

  return wrestlers.filter(wrestler =>
    normalize(getRosterCategory(wrestler)) === target
  );
}


export function getWrestlersByBrand(brand) {

  const target = normalize(brand);

  return wrestlers.filter(wrestler =>
    normalize(wrestler.brand) === target
  );
}


export function getMainRoster() {
  return getWrestlersByCategory("Main Roster");
}


export function getSecondLeague() {
  return getWrestlersByCategory("Segunda Liga");
}


export function getAlumni() {
  return getWrestlersByCategory("Alumni");
}


export function getHallOfFamers() {
  return getWrestlersByCategory("HOF");
}


export function getAdministration() {
  return getWrestlersByCategory("ADMIN");
}


/* =========================================================================
   6. CONSULTAS DE LUCHADORES
   ========================================================================= */

export function getWrestler(identifier) {

  if (identifier === null || identifier === undefined) {
    return null;
  }

  const target = normalize(identifier);

  return wrestlers.find(wrestler =>
    normalize(wrestler.id) === target ||
    normalize(wrestler.name) === target
  ) ?? null;
}


export function getWrestlerById(id) {

  const target = normalize(id);

  return wrestlers.find(wrestler =>
    normalize(wrestler.id) === target
  ) ?? null;
}


export function getWrestlerByName(name) {

  const target = normalize(name);

  return wrestlers.find(wrestler =>
    normalize(wrestler.name) === target
  ) ?? null;
}


/* =========================================================================
   7. ALTER EGOS
   ========================================================================= */

export function getAlteregoByDate(identifier, date = getToday()) {

  const wrestler = getWrestler(identifier);

  if (!wrestler) return null;

  return wrestler.alteregos.find(alterego =>
    isDateBetween(date, alterego.from, alterego.to)
  ) ?? null;
}


export function getWrestlerAlteregos(identifier) {

  const wrestler = getWrestler(identifier);

  return wrestler
    ? [...wrestler.alteregos]
    : [];
}


/* =========================================================================
   8. HISTORIAL DE RENDERS
   ========================================================================= */

export function getTimelineRender(identifier, date = getToday()) {

  const wrestler = getWrestler(identifier);

  if (!wrestler) return null;

  return wrestler.timeline.find(period =>
    isDateBetween(date, period.from, period.to)
  ) ?? null;
}


export function getWrestlerTimeline(identifier) {

  const wrestler = getWrestler(identifier);

  return wrestler
    ? [...wrestler.timeline]
    : [];
}


/* =========================================================================
   9. RESOLUCIÓN DEL RENDER

   Prioridad:
   1. Alter ego correspondiente a la fecha.
   2. Render normal correspondiente a la fecha.
   3. Render de Vacante.

   No se inventan renders para períodos sin información.
   ========================================================================= */

export function getCurrentRender(identifier) {

  return getWrestlerRender(identifier, getToday());
}


export function getWrestlerRender(identifier, date = getToday()) {

  const wrestler = getWrestler(identifier);

  if (!wrestler) return CONFIG.fallbackImage;

  const alterego = getAlteregoByDate(wrestler.id, date);

  if (alterego?.image) {
    return alterego.image;
  }

  const timeline = getTimelineRender(wrestler.id, date);

  if (timeline?.image) {
    return timeline.image;
  }

  return CONFIG.fallbackImage;
}


/* =========================================================================
   10. PRESENTACIÓN COMPLETA

   Prepara los datos que necesita wrestler-card.js.
   ========================================================================= */

export function getWrestlerPresentation(identifier, date = getToday()) {

  const wrestler = getWrestler(identifier);

  if (!wrestler) return null;

  const alterego = getAlteregoByDate(wrestler.id, date);
  const timeline = getTimelineRender(wrestler.id, date);

  return {
    id: wrestler.id,
    name: wrestler.name,

    displayName: alterego?.name || wrestler.name,

    nickname: wrestler.nickname,
    stable: wrestler.stable,
    brand: wrestler.brand,

    category: getRosterCategory(wrestler),

    image: getWrestlerRender(wrestler.id, date),

    alterego: alterego,
    timeline: timeline,

    date: date
  };
}


/* =========================================================================
   11. BÚSQUEDA Y FILTRADO
   ========================================================================= */

export function searchWrestlers(query) {

  const target = normalize(query);

  if (!target) return [...wrestlers];

  return wrestlers.filter(wrestler => {

    const searchable = [
      wrestler.name,
      wrestler.nickname,
      wrestler.stable,
      wrestler.brand,
      wrestler.id
    ].map(normalize);

    return searchable.some(value =>
      value.includes(target)
    );
  });
}


export function filterWrestlers(options = {}) {

  const {
    category = "",
    brand = "",
    search = ""
  } = options;

  return wrestlers.filter(wrestler => {

    const wrestlerCategory = getRosterCategory(wrestler);

    if (
      category &&
      normalize(wrestlerCategory) !== normalize(category)
    ) {
      return false;
    }

    if (
      brand &&
      normalize(wrestler.brand) !== normalize(brand)
    ) {
      return false;
    }

    if (search) {

      const target = normalize(search);

      const searchable = [
        wrestler.name,
        wrestler.nickname,
        wrestler.stable,
        wrestler.brand
      ].map(normalize);

      if (!searchable.some(value => value.includes(target))) {
        return false;
      }
    }

    return true;
  });
}


/* =========================================================================
   12. VALIDACIÓN DE DATOS
   ========================================================================= */

function validatePeriod(period, label, errors) {

  if (!period || typeof period !== "object") {
    errors.push(`${label}: período inválido.`);
    return;
  }

  const start = parseDate(period.from);
  const end = period.to === null
    ? null
    : parseDate(period.to);

  if (start === null) {
    errors.push(`${label}: fecha inicial inválida.`);
  }

  if (period.to !== null && end === null) {
    errors.push(`${label}: fecha final inválida.`);
  }

  if (
    start !== null &&
    end !== null &&
    end < start
  ) {
    errors.push(`${label}: la fecha final es anterior a la inicial.`);
  }

  if (!period.image || typeof period.image !== "string") {
    errors.push(`${label}: falta la imagen.`);
  }
}


function validateOverlaps(wrestler, errors) {

  const periods = [
    ...wrestler.timeline.map(period => ({
      ...period,
      type: "timeline"
    })),

    ...wrestler.alteregos.map(period => ({
      ...period,
      type: "alterego"
    }))
  ];

  for (let i = 0; i < periods.length; i++) {

    const first = periods[i];

    const firstStart = parseDate(first.from);
    const firstEnd = first.to === null
      ? Infinity
      : parseDate(first.to);

    if (firstStart === null || firstEnd === null) continue;

    for (let j = i + 1; j < periods.length; j++) {

      const second = periods[j];

      const secondStart = parseDate(second.from);
      const secondEnd = second.to === null
        ? Infinity
        : parseDate(second.to);

      if (secondStart === null || secondEnd === null) continue;

      if (
        firstStart <= secondEnd &&
        secondStart <= firstEnd
      ) {
        errors.push(
          `${wrestler.name}: períodos superpuestos entre ${first.type} y ${second.type}.`
        );
      }
    }
  }
}


export function validateWrestler(wrestler) {

  const errors = [];

  if (!wrestler || typeof wrestler !== "object") {
    return {
      valid: false,
      errors: ["El luchador no es un objeto válido."]
    };
  }

  if (!wrestler.id) {
    errors.push("Falta el ID.");
  }

  if (!wrestler.name) {
    errors.push("Falta el nombre.");
  }

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
    return {
      valid: errors.length === 0,
      errors
    };
  }

  wrestler.timeline.forEach((period, index) => {
    validatePeriod(
      period,
      `${wrestler.name} timeline ${index + 1}`,
      errors
    );
  });

  wrestler.alteregos.forEach((period, index) => {

    validatePeriod(
      period,
      `${wrestler.name} alterego ${index + 1}`,
      errors
    );

    if (!period.name) {
      errors.push(
        `${wrestler.name}: un alter ego no tiene nombre.`
      );
    }
  });

  validateOverlaps(wrestler, errors);

  return {
    valid: errors.length === 0,
    errors
  };
}


export function validateRoster() {

  const errors = [];
  const ids = new Set();

  wrestlers.forEach(wrestler => {

    const id = normalize(wrestler.id);

    if (ids.has(id)) {
      errors.push(`ID duplicado: ${wrestler.id}`);
    }

    ids.add(id);

    const result = validateWrestler(wrestler);

    errors.push(...result.errors);
  });

  return {
    valid: errors.length === 0,
    total: wrestlers.length,
    errors
  };
}


/* =========================================================================
   13. CATÁLOGO

   wrestler-card.js se encarga de crear el diseño de cada tarjeta.
   luchadores.js se encarga de elegir los datos y organizar el catálogo.

   Contrato esperado del componente:
   - card(wrestler, presentation): devuelve HTML de la tarjeta.
   - openModal(wrestler, presentation): abre el modal.
   ========================================================================= */

export function renderWrestlersCatalog(container, list = wrestlers) {

  if (!container) return;

  if (!Array.isArray(list) || list.length === 0) {
    container.innerHTML = `
      <div class="mw-empty-state">
        No se encontraron luchadores.
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(wrestler => {

    const presentation = getWrestlerPresentation(wrestler.id);

    return card(wrestler, presentation);

  }).join("");
}


/* =========================================================================
   14. INICIALIZACIÓN DE FILTROS Y EVENTOS
   ========================================================================= */

export function initWrestlersCatalog() {

  const catalog = document.querySelector(
    CONFIG.selectors.catalog
  );

  if (!catalog) return;

  const searchInput = document.querySelector(
    CONFIG.selectors.search
  );

  const categoryFilter = document.querySelector(
    CONFIG.selectors.category
  );

  const brandFilter = document.querySelector(
    CONFIG.selectors.brand
  );

  function updateCatalog() {

    const filtered = filterWrestlers({

      search: searchInput?.value || "",

      category: categoryFilter?.value || "",

      brand: brandFilter?.value || ""

    });

    renderWrestlersCatalog(catalog, filtered);
  }

  searchInput?.addEventListener("input", updateCatalog);

  categoryFilter?.addEventListener("change", updateCatalog);

  brandFilter?.addEventListener("change", updateCatalog);


  /* Abrir modal al tocar una tarjeta */

  catalog.addEventListener("click", event => {

    const target = event.target.closest("[data-wrestler-open]");

    if (!target) return;

    const identifier = target.dataset.wrestlerOpen;

    const wrestler = getWrestler(identifier);

    if (!wrestler) return;

    const presentation = getWrestlerPresentation(
      wrestler.id
    );

    openModal(wrestler, presentation);
  });

  updateCatalog();
}


/* =========================================================================
   15. INICIO AUTOMÁTICO
   ========================================================================= */

function startWrestlersModule() {

  const validation = validateRoster();

  if (!validation.valid) {

    console.error(
      "[Trivias Wrestling] Errores en la base de luchadores:",
      validation.errors
    );

  } else {

    console.info(
      `[Trivias Wrestling] ${validation.total} luchadores cargados correctamente.`
    );
  }
  initWrestlersCatalog();
}
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    startWrestlersModule,
    { once: true }
  );
} else {
startWrestlersModule();
}
