/* ==========================================================
   MI WRESTLING 2.0 — CATÁLOGO DE EVENTOS
   ========================================================== */
(async function () {
    "use strict";
    const root = document.querySelector("[data-events-catalog]");
    if (!root) return;

    /* ==========================================================
       UTILIDADES
       ========================================================== */
    const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);

    const normalize = value => String(value ?? "").trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

    const get = async path => {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`No se pudo cargar ${path} (HTTP ${response.status})`);
        return response.json();
    };

    const asArray = value => {
        if (Array.isArray(value)) return value;
        if (value && Array.isArray(value.events)) return value.events;
        if (value && Array.isArray(value.items)) return value.items;
        return [];
    };

    const fmtDate = event => {
        if (!event.date) return "Fecha pendiente";
        const date = new Date(`${event.date}T00:00:00Z`);
        return Number.isNaN(date.getTime()) ? "Fecha pendiente" :
            new Intl.DateTimeFormat("es-AR", {
                day: "2-digit", month: "short", year: "numeric", timeZone: "UTC"
            }).format(date);
    };

    const eventYear = event => Number(event.year || String(event.date || "").slice(0, 4)) || 0;
    const eventName = event => event.name || event.title || event.id || "Evento sin título";
    const params = new URLSearchParams(location.search);
    const selectedId = params.get("category");
    const selectedYear = params.get("year") || "all";
    const selectedShow = params.get("show");

    /* ==========================================================
       MARCAS Y TEMAS
       ========================================================== */
    const brandInfo = {
        raw: { name: "RAW", subtitle: "RAW · NETFLIX", description: "El archivo semanal de RAW.", theme: "raw" },
        smackdown: { name: "SmackDown", subtitle: "SMACKDOWN · USA NETWORK", description: "El archivo semanal de SmackDown.", theme: "smackdown" }
    };

    const themeAliases = {
        ple: "ple", premiumliveevents: "ple", weekly: "weekly",
        raw: "raw", wwraw: "raw", mondaynightraw: "raw",
        smackdown: "smackdown", wwesmackdown: "smackdown", fridaynightsmackdown: "smackdown",
        nxt: "nxt", speed: "speed", wwespeed: "speed", aaa: "aaa",
        aew: "aew", tna: "tna", specials: "specials", special: "specials", especiales: "specials"
    };

    const themeFor = value => themeAliases[normalize(value)] || normalize(value) || "specials";

    const matchesShow = (event, showId) => {
        const values = [
            event.brand, event.brandId, event.show, event.showId,
            event.categoryId, event.category, event.promotion
        ].map(normalize);
        const accepted = showId === "raw"
            ? ["raw", "wwraw", "mondaynightraw"]
            : ["smackdown", "wwesmackdown", "fridaynightsmackdown"];
        return values.some(value => accepted.includes(value));
    };

    const isTakeover = event => [
        event.id, event.name, event.title, event.division, event.subcategory,
        event.eventType, event.tournamentType, event.mode, event.type,
        event.category, event.categoryName
    ].some(value => /takeover|ascenso/i.test(String(value ?? "")));

    /* ==========================================================
       CARGA DEL CATÁLOGO Y TEMPORADAS DISPONIBLES
       ========================================================== */
    try {
        const [catalog, indexData, brandsData, promotionsData, wrestlersData] = await Promise.all([
            get("data/events/catalog.json"),
            get("data/events/events.json").catch(() => []),
            get("data/brands/brands.json").catch(() => []),
            get("data/promotions/promotions.json").catch(() => []),
            get("data/wrestlers/wrestlers.json").catch(() => [])
        ]);

        if (!Array.isArray(catalog.categories)) throw new Error("El catálogo no contiene una lista válida de categorías.");

        const indexEvents = asArray(indexData);
        const brands = asArray(brandsData);
        const promotions = asArray(promotionsData);
        const wrestlers = asArray(wrestlersData);
        const allEvents = [];
        const knownIds = new Set();

        for (const category of catalog.categories) {
            for (const season of category.seasons || []) {
                try {
                    const file = await get(season.path);
                    const events = Array.isArray(file) ? file : file?.events;
                    if (!Array.isArray(events)) {
                        console.warn("[MI WRESTLING] Formato de temporada inválido:", season.path);
                        continue;
                    }

                    for (const event of events) {
                        if (!event || !event.id || knownIds.has(String(event.id))) continue;
                        knownIds.add(String(event.id));
                        allEvents.push({
                            ...event,
                            id: String(event.id),
                            categoryId: event.categoryId || category.id,
                            categoryName: event.categoryName || category.name,
                            year: event.year || file.year || season.year,
                            seasonId: event.seasonId || season.id || file.id || null
                        });
                    }
                } catch (error) {
                    console.warn("[MI WRESTLING] Temporada omitida; se continuará con las demás:", season.path);
                }
            }
        }

        for (const event of indexEvents) {
            if (!event || !event.id || knownIds.has(String(event.id))) continue;
            knownIds.add(String(event.id));
            allEvents.push({ ...event, id: String(event.id) });
        }

        /* ==========================================================
           CATEGORÍAS Y ORDEN
           ========================================================== */
        const hasTNA = allEvents.some(event =>
            /tna/i.test(`${event.categoryId || ""} ${event.brand || ""} ${event.promotion || ""}`)
        ) || brands.some(item => /tna/i.test(`${item.id || ""} ${item.name || ""}`))
          || promotions.some(item => /tna/i.test(`${item.id || ""} ${item.name || ""}`))
          || wrestlers.some(item => /tna/i.test(String(item.brand || "")));

        const priority = { ple: 1, weekly: 2, nxt: 3, speed: 4, aaa: 5, aew: 6, specials: 7, tna: 8 };
        const categories = catalog.categories
            .filter(category => category.id !== "tna" || hasTNA || category.show === true)
            .sort((a, b) => (priority[a.id] || 99) - (priority[b.id] || 99) || (a.order || 99) - (b.order || 99));

        const selected = categories.find(category => category.id === selectedId) || null;
        const isWeeklySelector = selected?.id === "weekly" && !selectedShow;
        const isWeeklyBrand = selected?.id === "weekly" && Boolean(brandInfo[selectedShow]);
        const display = isWeeklyBrand ? brandInfo[selectedShow] : selected;

        /* ==========================================================
           FILTROS DE EVENTOS
           ========================================================== */
        const categoryEvents = selected ? allEvents.filter(event => {
            if (selected.id === "weekly") {
                if (isWeeklyBrand) return matchesShow(event, selectedShow);
                return matchesShow(event, "raw") || matchesShow(event, "smackdown") ||
                    normalize(event.categoryId) === "weekly";
            }
            return normalize(event.categoryId) === normalize(selected.id) ||
                normalize(event.brand) === normalize(selected.id) ||
                normalize(event.promotion) === normalize(selected.id);
        }) : [];

        const years = [...new Set(categoryEvents.map(eventYear).filter(year => year > 0))]
            .sort((a, b) => b - a);

        const filterByYear = events => events
            .filter(event => selectedYear === "all" || eventYear(event) === Number(selectedYear))
            .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) ||
                eventName(a).localeCompare(eventName(b), "es"));

        const filtered = filterByYear(categoryEvents);
        const roadEvents = filterByYear(categoryEvents.filter(event => !isTakeover(event)));
        const takeoverEvents = filterByYear(categoryEvents.filter(isTakeover));

        const countFor = category => {
            if (category.id === "weekly") return allEvents.filter(event =>
                matchesShow(event, "raw") || matchesShow(event, "smackdown") ||
                normalize(event.categoryId) === "weekly"
            );
            return allEvents.filter(event =>
                normalize(event.categoryId) === normalize(category.id) ||
                normalize(event.brand) === normalize(category.id) ||
                normalize(event.promotion) === normalize(category.id)
            );
        };

        /* ==========================================================
           TARJETAS DE CATEGORÍAS
           ========================================================== */
        const categoryCard = category => {
            const events = countFor(category);
            const yearCount = new Set(events.map(eventYear).filter(year => year > 0)).size;
            return `
                <a class="mw-event-category-card theme-${esc(themeFor(category.theme || category.id))}"
                   href="events.html?category=${encodeURIComponent(category.id)}">
                    <span class="mw-event-category-card__eyebrow">${category.id === "ple" ? "PREMIUM LIVE EVENTS" : "EVENT ARCHIVE"}</span>
                    <strong>${esc(category.name)}</strong>
                    <span class="mw-event-category-card__subtitle">${esc(category.subtitle || category.description || "")}</span>
                    <span class="mw-event-category-card__footer">
                        <span>${yearCount || "—"} año(s)</span><span>${events.length} evento(s) ↗</span>
                    </span>
                </a>`;
        };

        /* ==========================================================
           TARJETAS RAW Y SMACKDOWN
           ========================================================== */
        const weeklyShowCard = showId => {
            const brand = brandInfo[showId];
            const count = allEvents.filter(event => matchesShow(event, showId)).length;
            return `
                <a class="mw-event-category-card theme-${brand.theme}"
                   href="events.html?category=weekly&amp;show=${showId}">
                    <span class="mw-event-category-card__eyebrow">${showId === "raw" ? "MONDAY NIGHT" : "FRIDAY NIGHT"}</span>
                    <strong>${esc(brand.name)}</strong>
                    <span class="mw-event-category-card__subtitle">${esc(brand.subtitle)} · Archivo semanal</span>
                    <span class="mw-event-category-card__footer"><span>${count} evento(s)</span><span>EXPLORAR ↗</span></span>
                </a>`;
        };

        /* ==========================================================
           BOTONES DE AÑO
           ========================================================== */
        const yearButtons = `
            <div class="mw-event-year-filter">
                <label>FILTRAR POR AÑO</label>
                <div class="mw-event-year-buttons">
                    <button type="button" class="mw-event-year-button ${selectedYear === "all" ? "is-active" : ""}"
                        data-event-year="all" aria-pressed="${selectedYear === "all"}">TODOS</button>
                    ${years.map(year => `
                        <button type="button" class="mw-event-year-button ${String(year) === selectedYear ? "is-active" : ""}"
                            data-event-year="${year}" aria-pressed="${String(year) === selectedYear}">${year}</button>
                    `).join("")}
                </div>
            </div>`;

        /* ==========================================================
           TARJETAS DE EVENTOS
           ========================================================== */
        const eventCards = (events, fallbackTheme) => {
            if (!events.length) return `
                <div class="mw-event-empty"><h3>No hay eventos cargados</h3>
                <p>Probá con otro año o volvé más adelante.</p></div>`;

            return events.map(event => {
                const theme = isWeeklyBrand ? brandInfo[selectedShow].theme :
                    (selected?.id ? themeFor(selected.theme || selected.id) :
                    themeFor(event.brandId || event.brand || event.showId || event.show || event.categoryId || fallbackTheme));
                const status = event.status || event.mode || event.type || "EVENTO";
                const locationText = event.location ? ` · ${esc(event.location)}` : "";
                return `
                    <a class="mw-event-card theme-${esc(theme)}" href="event.html?id=${encodeURIComponent(event.id)}">
                        <span class="mw-event-card__meta">${esc(status)}</span>
                        <strong>${esc(eventName(event))}</strong>
                        <span>${esc(fmtDate(event))}${locationText}</span>
                        <span class="mw-event-card__open">VER CARTELERA ↗</span>
                    </a>`;
            }).join("");
        };

        /* ==========================================================
           RENDERIZADO PRINCIPAL
           ========================================================== */
        let html = `
            <section class="page-hero mw-events-hero">
                <div class="eyebrow">MI WRESTLING 2.0 / EVENT ARCHIVE</div>
                <h1>EVENTOS</h1>
                <p class="lead">Explorá las marcas, los eventos premium y sus carteleras por año.</p>
            </section>`;

        if (!selected) {
            html += `
                <section class="mw-event-category-section">
                    <div class="mw-event-section-heading">
                        <div><span class="mw-event-kicker">ELEGÍ TU UNIVERSO</span><h2>Catálogo de eventos</h2></div>
                        <span>${categories.length} categorías</span>
                    </div>
                    <div class="mw-event-category-grid">${categories.map(categoryCard).join("")}</div>
                </section>`;
        } else if (isWeeklySelector) {
            html += `
                <a class="mw-event-back" href="events.html">← TODOS LOS EVENTOS</a>
                <section class="mw-event-category-hero theme-weekly">
                    <span>WEEKLY ARCHIVE</span><h1>RAW + SMACKDOWN</h1>
                    <p>Elegí una marca para consultar sus carteleras semanales.</p>
                </section>
                <section class="mw-event-section">
                    <div class="mw-event-disclosure">
                        <button type="button" class="mw-event-disclosure__toggle" aria-expanded="false" aria-controls="weekly-shows">PROGRAMACIÓN SEMANAL</button>
                        <div class="mw-event-disclosure__content" id="weekly-shows">
                            <div class="mw-event-category-grid">${weeklyShowCard("raw")}${weeklyShowCard("smackdown")}</div>
                        </div>
                    </div>
                </section>`;
        } else {
            const theme = display.theme || display.id;
            const backUrl = isWeeklyBrand ? "events.html?category=weekly" : "events.html";
            html += `
                <a class="mw-event-back" href="${backUrl}">← ${isWeeklyBrand ? "RAW + SMACKDOWN" : "TODAS LAS CATEGORÍAS"}</a>
                <section class="mw-event-category-hero theme-${esc(theme)}">
                    <span>${esc(display.subtitle || "EVENT ARCHIVE")}</span>
                    <h1>${esc(display.name)}</h1><p>${esc(display.description || "")}</p>
                </section>
                <section class="mw-event-section theme-${esc(theme)}">
                    <div class="mw-event-section-heading">
                        <div><span class="mw-event-kicker">ARCHIVO</span><h2>Carteleras</h2></div>
                        <span>${filtered.length} evento(s)</span>
                    </div>
                    ${yearButtons}
                    ${selected.id === "nxt" ? `
                        <div class="mw-event-disclosure is-open">
                            <button type="button" class="mw-event-disclosure__toggle" aria-expanded="true" aria-controls="nxt-road-events">NXT ROAD</button>
                            <div class="mw-event-disclosure__content" id="nxt-road-events"><div class="mw-event-grid">${eventCards(roadEvents, "nxt")}</div></div>
                        </div>
                        <div class="mw-event-disclosure">
                            <button type="button" class="mw-event-disclosure__toggle" aria-expanded="false" aria-controls="nxt-takeover-events">NXT TAKEOVER · TORNEO DE ASCENSO</button>
                            <div class="mw-event-disclosure__content" id="nxt-takeover-events"><div class="mw-event-grid">${eventCards(takeoverEvents, "nxt")}</div></div>
                        </div>
                    ` : `<div class="mw-event-grid">${eventCards(filtered, theme)}</div>`}
                </section>`;
        }

        root.innerHTML = html;

        /* ==========================================================
           FILTRO DE AÑO
           ========================================================== */
        root.querySelectorAll("[data-event-year]").forEach(button => {
            button.addEventListener("click", () => {
                const next = new URLSearchParams(location.search);
                const year = button.dataset.eventYear;
                if (year === "all") next.delete("year");
                else next.set("year", year);
                const query = next.toString();
                location.href = `events.html${query ? `?${query}` : ""}`;
            });
        });

        /* ==========================================================
           DESPLEGABLES
           ========================================================== */
        root.querySelectorAll(".mw-event-disclosure__toggle").forEach(button => {
            button.addEventListener("click", () => {
                const panel = button.closest(".mw-event-disclosure");
                if (!panel) return;
                const open = panel.classList.toggle("is-open");
                button.setAttribute("aria-expanded", String(open));
            });
        });

        /* ==========================================================
           ANIMACIÓN TEMPORAL DE TARJETAS
           ========================================================== */
        let activeCard = null;
        let animationTimer = null;

        const clearChroma = () => {
            if (animationTimer) clearTimeout(animationTimer);
            animationTimer = null;
            if (activeCard) activeCard.classList.remove("is-animating");
            activeCard = null;
        };

        root.querySelectorAll(".mw-event-category-card").forEach(card => {
            card.addEventListener("pointerdown", () => {
                clearChroma();
                activeCard = card;
                activeCard.classList.add("is-animating");
                animationTimer = setTimeout(clearChroma, 1550);
            });
        });

        document.addEventListener("pointerdown", event => {
            if (!event.target.closest(".mw-event-category-card")) clearChroma();
        }, { passive: true });

        /* ==========================================================
           TÍTULO DEL DOCUMENTO
           ========================================================== */
        const currentName = selected
            ? (isWeeklyBrand ? brandInfo[selectedShow].name : selected.name)
            : "Eventos";
        document.title = `${currentName}${selectedYear !== "all" ? ` · ${selectedYear}` : ""} | MI WRESTLING 2.0`;

    } catch (error) {
        console.error("[MI WRESTLING] Error cargando eventos:", error);
        root.innerHTML = `
            <section class="mw-event-empty">
                <h1>No se pudo cargar el catálogo</h1>
                <p>${esc(error.message || error)}</p>
            </section>`;
    }
})();
