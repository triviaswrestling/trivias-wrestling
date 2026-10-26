/* MI WRESTLING 2.0 | EVENT CATALOG */
(async function () {
"use strict";

const root = document.querySelector("[data-events-catalog]");
if (!root) return;

const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
"&": "&",
"<": "<",
">": ">",
'"': """,
"'": "'"
})[char]);

const get = async path => {
const response = await fetch(path);
if (!response.ok) {
throw new Error("No se pudo cargar ${path} (HTTP ${response.status})");
}
return response.json();
};

const fmtDate = event => {
if (!event.date) return "Fecha pendiente";

const date = new Date(`${event.date}T00:00:00Z`);

return Number.isNaN(date.getTime())
  ? "Fecha pendiente"
  : new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    }).format(date);

};

const params = new URLSearchParams(location.search);
const selectedId = params.get("category");
const selectedYear = params.get("year") || "all";
const selectedShow = params.get("show");

const brandInfo = {
raw: {
name: "RAW",
subtitle: "RAW · NETFLIX",
description: "El archivo semanal de RAW.",
theme: "raw"
},
smackdown: {
name: "SmackDown",
subtitle: "SMACKDOWN · USA NETWORK",
description: "El archivo semanal de SmackDown.",
theme: "smackdown"
}
};

try {
const [catalog, indexEvents, brands, promotions, wrestlers] =
await Promise.all([
get("data/events/catalog.json"),
get("data/events/events.json").catch(() => []),
get("data/brands/brands.json").catch(() => []),
get("data/promotions/promotions.json").catch(() => []),
get("data/wrestlers/wrestlers.json").catch(() => [])
]);

const allEvents = [];
const knownIds = new Set();

for (const category of catalog.categories || []) {
  for (const season of category.seasons || []) {
    try {
      const file = await get(season.path);

      for (const event of file.events || []) {
        if (!event.id || knownIds.has(event.id)) continue;

        knownIds.add(event.id);

        allEvents.push({
          ...event,
          categoryId: event.categoryId || category.id,
          categoryName: category.name,
          year: event.year || file.year || season.year,
          seasonId: season.id || file.id
        });
      }
    } catch (error) {
      console.warn("[MI WRESTLING] Temporada no disponible:", error);
    }
  }
}

for (const event of indexEvents || []) {
  if (!event.id || knownIds.has(event.id)) continue;

  knownIds.add(event.id);
  allEvents.push(event);
}

const hasTNA =
  allEvents.some(event =>
    /tna/i.test(`${event.categoryId || ""} ${event.brand || ""}`)
  ) ||
  brands.some(item => /tna/i.test(`${item.id || ""} ${item.name || ""}`)) ||
  promotions.some(item => /tna/i.test(`${item.id || ""} ${item.name || ""}`)) ||
  wrestlers.some(item => /tna/i.test(String(item.brand || "")));

const categories = (catalog.categories || [])
  .filter(category =>
    category.id !== "tna" ||
    hasTNA ||
    category.show === true
  )
  .sort((a, b) => (a.order || 99) - (b.order || 99));

const selected = categories.find(category => category.id === selectedId) || null;
const isWeeklySelector = selected?.id === "weekly" && !selectedShow;

const matchesShow = (event, showId) => {
  const values = [
    event.brand,
    event.brandId,
    event.show,
    event.showId,
    event.categoryId,
    event.category,
    event.promotion
  ];

  return values.some(value =>
    String(value || "").trim().toLowerCase() === showId
  );
};

const categoryEvents = selected
  ? allEvents.filter(event => {
      if (selected.id === "weekly" && selectedShow) {
        return matchesShow(event, selectedShow);
      }

      return String(event.categoryId || "").toLowerCase() === selected.id;
    })
  : [];

const years = [
  ...new Set(
    categoryEvents
      .map(event => Number(event.year || String(event.date || "").slice(0, 4)))
      .filter(year => Number.isFinite(year) && year > 0)
  )
].sort((a, b) => b - a);

const filtered = selected
  ? categoryEvents
      .filter(event =>
        selectedYear === "all" ||
        Number(event.year || String(event.date || "").slice(0, 4)) ===
          Number(selectedYear)
      )
      .sort((a, b) =>
        String(b.date || "").localeCompare(String(a.date || "")) ||
        String(a.title || a.name || "").localeCompare(String(b.title || b.name || ""))
      )
  : [];

const countFor = category => {
  if (category.id === "weekly") {
    return allEvents.filter(event =>
      matchesShow(event, "raw") || matchesShow(event, "smackdown") ||
      String(event.categoryId || "").toLowerCase() === "weekly"
    );
  }

  return allEvents.filter(event =>
    String(event.categoryId || "").toLowerCase() === category.id ||
    String(event.brand || "").toLowerCase() === category.id
  );
};

const categoryCard = category => {
  const list = countFor(category);
  const yearCount = new Set(
    list.map(event => event.year || String(event.date || "").slice(0, 4))
      .filter(Boolean)
  ).size;

  return `
    <a class="mw-event-category-card theme-${esc(category.theme || category.id)}"
       href="events.html?category=${encodeURIComponent(category.id)}">
      <span class="mw-event-category-card__eyebrow">
        ${category.id === "ple" ? "PREMIUM LIVE EVENTS" : "EVENT ARCHIVE"}
      </span>
      <strong>${esc(category.name)}</strong>
      <span class="mw-event-category-card__subtitle">
        ${esc(category.subtitle || category.description || "")}
      </span>
      <span class="mw-event-category-card__footer">
        <span>${yearCount || "—"} año(s)</span>
        <span>${list.length} evento(s) ↗</span>
      </span>
    </a>`;
};

const showSelector = `
  <section class="mw-event-category-section mw-weekly-selector">
    <div class="mw-event-section-heading">
      <div>
        <span class="mw-event-kicker">PROGRAMACIÓN SEMANAL</span>
        <h2>Elegí tu marca</h2>
      </div>
      <span>RAW + SmackDown</span>
    </div>

    <div class="mw-event-category-grid">
      <a class="mw-event-category-card theme-raw"
         href="events.html?category=weekly&amp;show=raw">
        <span class="mw-event-category-card__eyebrow">MONDAY NIGHT</span>
        <strong>RAW</strong>
        <span class="mw-event-category-card__subtitle">
          Netflix · Archivo semanal
        </span>
        <span class="mw-event-category-card__footer">
          <span>Todos los años</span>
          <span>EXPLORAR ↗</span>
        </span>
      </a>

      <a class="mw-event-category-card theme-smackdown"
         href="events.html?category=weekly&amp;show=smackdown">
        <span class="mw-event-category-card__eyebrow">FRIDAY NIGHT</span>
        <strong>SMACKDOWN</strong>
        <span class="mw-event-category-card__subtitle">
          USA Network · Archivo semanal
        </span>
        <span class="mw-event-category-card__footer">
          <span>Todos los años</span>
          <span>EXPLORAR ↗</span>
        </span>
      </a>
    </div>
  </section>`;

const eventCards = filtered.map(event => `
  <a class="mw-event-card" href="event.html?id=${encodeURIComponent(event.id)}">
    <span class="mw-event-card__meta">
      ${esc(event.status || event.mode || event.type || "EVENTO")}
    </span>
    <strong>${esc(event.name || event.title || event.id)}</strong>
    <span>
      ${esc(fmtDate(event))}${event.location ? " · " + esc(event.location) : ""}
    </span>
    <span class="mw-event-card__open">VER CARTELERA ↗</span>
  </a>`).join("");

let html = `
  <section class="page-hero mw-events-hero">
    <div class="eyebrow">MI WRESTLING 2.0 / EVENT ARCHIVE</div>
    <h1>EVENTOS</h1>
    <p class="lead">
      Explorá las marcas, los eventos premium y sus carteleras por año.
    </p>
  </section>`;

if (!selected) {
  html += `
    <section class="mw-event-category-section">
      <div class="mw-event-section-heading">
        <div>
          <span class="mw-event-kicker">ELEGÍ TU UNIVERSO</span>
          <h2>Catálogo de eventos</h2>
        </div>
        <span>${categories.length} categorías</span>
      </div>
      <div class="mw-event-category-grid">
        ${categories.map(categoryCard).join("")}
      </div>
    </section>`;
} else if (isWeeklySelector) {
  html += `
    <a class="mw-event-back" href="events.html">← TODOS LOS EVENTOS</a>
    <section class="mw-event-category-hero theme-weekly">
      <span>WEEKLY ARCHIVE</span>
      <h1>RAW + SMACKDOWN</h1>
      <p>Elegí una marca para consultar sus carteleras semanales.</p>
    </section>
    ${showSelector}`;
} else {
  const isWeeklyBrand = selected.id === "weekly" && brandInfo[selectedShow];
  const display = isWeeklyBrand ? brandInfo[selectedShow] : selected;
  const theme = display.theme || display.id;
  const title = display.name;
  const description = display.description || "";
  const yearOptions = [
    `<option value="all" ${selectedYear === "all" ? "selected" : ""}>Todos los años</option>`,
    ...years.map(year =>
      `<option value="${year}" ${String(year) === selectedYear ? "selected" : ""}>${year}</option>`
    )
  ].join("");

  html += `
    <a class="mw-event-back" href="${isWeeklyBrand
      ? "events.html?category=weekly"
      : "events.html"}">
      ← ${isWeeklyBrand ? "RAW + SMACKDOWN" : "TODAS LAS CATEGORÍAS"}
    </a>

    <section class="mw-event-category-hero theme-${esc(theme)}">
      <span>${esc(display.subtitle || "EVENT ARCHIVE")}</span>
      <h1>${esc(title)}</h1>
      <p>${esc(description)}</p>
    </section>

    <section class="mw-event-section">
      <div class="mw-event-section-heading">
        <div>
          <span class="mw-event-kicker">ARCHIVO</span>
          <h2>Carteleras</h2>
        </div>
        <span>${filtered.length} evento(s)</span>
      </div>

      <div class="mw-event-year-filter">
        <label for="event-year">FILTRAR POR AÑO</label>
        <select id="event-year">${yearOptions}</select>
      </div>

      <div class="mw-event-grid">
        ${eventCards || `
          <div class="mw-event-empty">
            <h3>${categoryEvents.length ? "No hay eventos en ese año" : "Archivo preparado"}</h3>
            <p>${categoryEvents.length
              ? "Probá con otro año para ver más carteleras."
              : "Todavía no hay eventos cargados para esta selección."}
            </p>
          </div>`}
      </div>
    </section>`;
}

root.innerHTML = html;

const yearSelect = root.querySelector("#event-year");

if (yearSelect) {
  yearSelect.addEventListener("change", () => {
    const next = new URLSearchParams(location.search);

    if (yearSelect.value === "all") next.delete("year");
    else next.set("year", yearSelect.value);

    location.href = `events.html?${next.toString()}`;
  });
}

const currentName = selected
  ? (selected.id === "weekly" && brandInfo[selectedShow]
      ? brandInfo[selectedShow].name
      : selected.name)
  : "Eventos";

document.title =
  `${currentName}${selectedYear !== "all" ? " · " + selectedYear : ""} | MI WRESTLING 2.0`;

} catch (error) {
console.error("[MI WRESTLING] Error cargando eventos:", error);

root.innerHTML = `
  <section class="mw-event-empty">
    <h1>No se pudo cargar el catálogo</h1>
    <p>${esc(error.message || error)}</p>
  </section>`;

}
})();
