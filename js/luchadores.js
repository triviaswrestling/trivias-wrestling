
/* =========================================================================
   TRIVIAS WRESTLING
   LUCHADORES.JS
   Centro de datos y funcionamiento del catálogo.

   RESPONSABILIDADES:
   - Base de datos de luchadores.
   - Historial de renders.
   - Alter egos.
   - Clasificación automática.
   - Búsqueda y filtros.
   - Catálogo de Roster y Alumni.
   - Conexión con wrestler-card.js.

   wrestler-card.js conserva el diseño de las tarjetas y los modales.
   ========================================================================= */


/* =========================================================================
   1. CONFIGURACIÓN
   ========================================================================= */

const CONFIG = {
  fallbackImage: "images/renders/Vacante.webp",
  selectors: {
    catalog: "[data-wrestlers-catalog]",
    search: "[data-wrestlers-search]",
    category: "[data-roster-filter]",
    brand: "[data-brand-filter]",
    count: "[data-wrestler-count]"
  }
};


/* =========================================================================
   2. BASE DE DATOS DE LUCHADORES

   ID: identificador permanente.
   BRAND: marca o situación actual dentro de Trivias Wrestling.

   timeline: renders normales según período.
   alteregos: presentaciones especiales según período.

   Las fechas utilizan DD/MM/YYYY.
   ========================================================================= */

export const wrestlers = [

  /* -----------------------------------------------------------------------
     CODY RHODES
     ----------------------------------------------------------------------- */

  {
    id: "cody-rhodes",
    name: "Cody Rhodes",
    nickname: "The American Nightmare",
    stable: "",
    brand: "RAW",

    timeline: [

      {
        from: "01/01/2023",
        to: "31/12/2023",
        image: "images/renders/cody-rhodes-2023.webp"
      },

      {
        from: "01/01/2026",
        to: null,
        image: "images/renders/cody-rhodes-actual.webp"
      }

    ],

    alteregos: [

      {
        name: "Undashing Cody Rhodes",
        from: "10/02/2025",
        to: "08/08/2025",
        image: "images/renders/cody-undashing.webp"
      }

    ]
  },


  /* -----------------------------------------------------------------------
     TOMMASO CIAMPA
     ----------------------------------------------------------------------- */

  {
    id: "tommaso-ciampa",
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

      {
        name: "The Riddler",
        from: "28/06/2025",
        to: "18/08/2025",
        image: "images/renders/the-riddler.webp"
      }

    ]
  }

];


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


function getToday() {

  const today = new Date();

  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  return `${day}/${month}/${year}`;

}


/* =========================================================================
   4. SISTEMA DE FECHAS

   Formato obligatorio: DD/MM/YYYY.
   Los períodos incluyen el día inicial y el final.
   to: null significa que continúa vigente.
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

  const end = to === null
    ? null
    : parseDate(to);

  if (current === null || start === null) return false;

  if (to !== null && end === null) return false;

  return (
    current >= start &&
    (end === null || current <= end)
  );

}


/* =========================================================================
   5. CLASIFICACIÓN AUTOMÁTICA

   RAW / SmackDown = Main Roster
   NXT / AAA       = Segunda Liga
   Alumni          = Alumni
   HOF             = Hall of Fame
   ADMIN           = Administración
   ========================================================================= */

export function getRosterCategory(wrestlerOrBrand) {

  const brand = normalize(
    typeof wrestlerOrBrand === "object"
      ? wrestlerOrBrand?.brand
      : wrestlerOrBrand
  );

  if (brand === "raw" || brand === "smackdown") {
    return "Main Roster";
  }

  if (brand === "nxt" || brand === "aaa") {
    return "Segunda Liga";
  }

  if (brand === "alumni") {
    return "Alumni";
  }

  if (brand === "hof" || brand === "hall of fame") {
    return "HOF";
  }

  if (brand === "admin") {
    return "ADMIN";
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
   6. CONSULTAS
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

export function getAlteregoByDate(
  identifier,
  date = getToday()
) {

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

export function getTimelineRender(
  identifier,
  date = getToday()
) {

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
   1. Alter ego de la fecha.
   2. Render normal de la fecha.
   3. Vacante.

   Un período sin render definido utiliza Vacante.
   ========================================================================= */

export function getWrestlerRender(
  identifier,
  date = getToday()
) {

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


export function getCurrentRender(identifier) {

  return getWrestlerRender(identifier, getToday());

}


/* =========================================================================
   10. PRESENTACIÓN PARA LAS TARJETAS

   El componente recibe los datos ya resueltos.
   No necesita calcular fechas ni buscar alter egos.
   ========================================================================= */

export function getWrestlerPresentation(
  identifier,
  date = getToday()
) {

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

    alterego,

    timeline,

    date

  };

}


/* =========================================================================
   11. BÚSQUEDA
   ========================================================================= */

export function searchWrestlers(query) {

  const target = normalize(query);

  if (!target) return [...wrestlers];

  return wrestlers.filter(wrestler => {

    const searchable = [

      wrestler.id,
      wrestler.name,
      wrestler.nickname,
      wrestler.stable,
      wrestler.brand

    ].map(normalize);

    return searchable.some(value =>
      value.includes(target)
    );

  });

}


/* =========================================================================
   12. FILTROS DEL CATÁLOGO
   ========================================================================= */

export function filterWrestlers(options = {}) {

  const {
    category = "",
    brand = "",
    search = "",
    source = ""
  } = options;

  let result = [...wrestlers];

  // La página Alumni siempre queda limitada a Alumni.

  if (source === "alumni") {

    result = result.filter(wrestler =>
      normalize(wrestler.brand) === "alumni"
    );

  } else if (category) {

    result = result.filter(wrestler =>
      normalize(getRosterCategory(wrestler)) === normalize(category)
    );

  }

  if (brand) {

    result = result.filter(wrestler =>
      normalize(wrestler.brand) === normalize(brand)
    );

  }

  if (search) {

    const target = normalize(search);

    result = result.filter(wrestler => {

      const searchable = [

        wrestler.id,
        wrestler.name,
        wrestler.nickname,
        wrestler.stable,
        wrestler.brand

      ].map(normalize);

      return searchable.some(value =>
        value.includes(target)
      );

    });

  }

  return result;

}


/* =========================================================================
   13. VALIDACIÓN DE PERÍODOS
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
    errors.push(`${label}: período invertido.`);
  }

  if (!period.image || typeof period.image !== "string") {
    errors.push(`${label}: falta la imagen.`);
  }

}


function validatePeriodOverlaps(periods, label, errors) {

  const validPeriods = periods
    .map(period => ({
      ...period,
      start: parseDate(period.from),
      end: period.to === null
        ? Infinity
        : parseDate(period.to)
    }))
    .filter(period =>
      period.start !== null &&
      period.end !== null
    );

  for (let i = 0; i < validPeriods.length; i++) {

    for (let j = i + 1; j < validPeriods.length; j++) {

      const first = validPeriods[i];
      const second = validPeriods[j];

      if (
        first.start <= second.end &&
        second.start <= first.end
      ) {

        errors.push(
          `${label}: existen períodos superpuestos (${first.from} y ${second.from}).`
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
      errors: ["El luchador no es válido."]
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
      errors.push(`${wrestler.name}: alter ego sin nombre.`);
    }

  });

  // Se validan por separado:
  // un alter ego puede superponerse con el render normal,
  // porque tiene prioridad sobre él.

  validatePeriodOverlaps(
    wrestler.timeline,
    `${wrestler.name} timeline`,
    errors
  );

  validatePeriodOverlaps(
    wrestler.alteregos,
    `${wrestler.name} alteregos`,
    errors
  );

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
   14. CONEXIÓN CON WRESTLER-CARD.JS

   Compatibilidad con el componente anterior:
   window.MIWrestlerCards

   También acepta exports de módulo si se adapta el componente en el futuro.

   No hace falta cargar wrestler-card.js desde el HTML.
   ========================================================================= */

let wrestlerCards = null;


async function loadWrestlerCards() {

  try {

    const module = await import(
      "./components/wrestler-card.js"
    );

    wrestlerCards = {

      card:
        module.card ||
        module.renderCard ||
        window.MIWrestlerCards?.card,

      openModal:
        module.openModal ||
        window.MIWrestlerCards?.openModal,

      closeModal:
        module.closeModal ||
        window.MIWrestlerCards?.closeModal

    };

    if (typeof wrestlerCards.card !== "function") {

      throw new Error(
        "wrestler-card.js no ofrece una función card()."
      );

    }

    return true;

  } catch (error) {

    console.error(
      "[Trivias Wrestling] No se pudo cargar wrestler-card.js:",
      error
    );

    wrestlerCards = null;

    return false;

  }

}


/* =========================================================================
   15. TARJETA DE RESPALDO

   Se utiliza solamente si el componente visual no carga.
   Permite comprobar que la base de datos y el catálogo funcionan.
   ========================================================================= */

function fallbackCard(wrestler, presentation) {

  return `
    <button
      class="mw-wrestler-card"
      type="button"
      data-wrestler-open="${escapeHTML(wrestler.id)}"
    >

      <img
        src="${escapeHTML(presentation.image)}"
        alt="${escapeHTML(presentation.displayName)}"
        loading="lazy"
      >

      <span>
        ${escapeHTML(presentation.displayName)}
      </span>

      <small>
        ${escapeHTML(wrestler.brand)}
      </small>

    </button>
  `;

}


/* =========================================================================
   16. RENDERIZADO DEL CATÁLOGO
   ========================================================================= */

export function renderWrestlersCatalog(
  container,
  list = wrestlers
) {

  if (!container) return;

  if (!Array.isArray(list) || list.length === 0) {

    container.innerHTML = `
      <div class="mw-empty-state">
        NO SE ENCONTRARON SUPERSTRELLAS.
      </div>
    `;

    return;

  }

  container.innerHTML = list.map(wrestler => {

    const presentation = getWrestlerPresentation(
      wrestler.id
    );

    if (!presentation) return "";

    // Compatibilidad con el componente visual anterior.
    // Se agrega la imagen resuelta sin modificar la base de datos.

    const cardData = {

      ...wrestler,

      name: presentation.displayName,

      image: presentation.image,

      presentation

    };

    if (typeof wrestlerCards?.card === "function") {

      try {

        return wrestlerCards.card(
          cardData,
          presentation
        );

      } catch (error) {

        console.error(
          `Error creando tarjeta de ${wrestler.name}:`,
          error
        );

      }

    }

    return fallbackCard(wrestler, presentation);

  }).join("");

}


/* =========================================================================
   17. CONTADOR
   ========================================================================= */

function updateWrestlerCount(total) {

  document.querySelectorAll(
    CONFIG.selectors.count
  ).forEach(element => {

    element.textContent =
      `${total} SUPERSTRELLAS`;

  });

}


/* =========================================================================
   18. INICIALIZACIÓN DEL CATÁLOGO

   roster.html:
   muestra todas las categorías y permite filtrarlas.

   alumni.html:
   muestra únicamente brand: Alumni.
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

  const page = normalize(
    document.body.dataset.page
  );

  const isAlumniPage = page === "alumni";


  // En Alumni no se utiliza el filtro de marca:
  // actualmente brand representa la situación actual,
  // no el historial de marcas anteriores.

  if (isAlumniPage && brandFilter) {
    brandFilter.disabled = true;
    brandFilter.hidden = true;

    const label = document.querySelector(
      `label[for="${brandFilter.id}"]`
    );

    if (label) label.hidden = true;
  }


  function updateCatalog() {

    const filtered = filterWrestlers({

      search: searchInput?.value || "",

      category: isAlumniPage
        ? "Alumni"
        : categoryFilter?.value || "",

      brand: isAlumniPage
        ? ""
        : brandFilter?.value || "",

      source: isAlumniPage
        ? "alumni"
        : "roster"

    });

    renderWrestlersCatalog(
      catalog,
      filtered
    );

    updateWrestlerCount(filtered.length);

  }


  // Eventos de filtros.

  searchInput?.addEventListener(
    "input",
    updateCatalog
  );

  categoryFilter?.addEventListener(
    "change",
    updateCatalog
  );

  brandFilter?.addEventListener(
    "change",
    updateCatalog
  );


  // Un único evento para abrir las fichas.

  catalog.addEventListener("click", event => {

    const target = event.target.closest(
      "[data-wrestler-open]"
    );

    if (!target) return;

    const identifier = target.dataset.wrestlerOpen;

    const wrestler = getWrestler(identifier);

    if (!wrestler) return;

    const presentation = getWrestlerPresentation(
      wrestler.id
    );

    if (typeof wrestlerCards?.openModal === "function") {

      const cardData = {

        ...wrestler,

        name: presentation.displayName,

        image: presentation.image,

        presentation

      };

      wrestlerCards.openModal(
        cardData,
        presentation
      );

    } else {

      console.warn(
        "[Trivias Wrestling] El modal no está disponible."
      );

    }

  });


  updateCatalog();

}


/* =========================================================================
   19. INICIO DEL SISTEMA
   ========================================================================= */

async function startWrestlersModule() {

  console.info(
    "[Trivias Wrestling] Iniciando base de luchadores..."
  );

  const validation = validateRoster();

  if (!validation.valid) {

    console.error(
      "[Trivias Wrestling] Errores en la base de datos:",
      validation.errors
    );

  } else {

    console.info(
      `[Trivias Wrestling] ${validation.total} luchadores registrados.`
    );

  }

  await loadWrestlerCards();

  initWrestlersCatalog();

  console.info(
    "[Trivias Wrestling] Catálogo inicializado."
  );

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
