
/* ==========================================================
   MI WRESTLING 2.0 — EVENTOS DINÁMICOS · ESTILO PS5
   ========================================================== */
(async function () {
    "use strict";

    const root = document.querySelector("[data-events-catalog]");
    if (!root) return;

    /* ==========================================================
       UTILIDADES
       ========================================================== */
    const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);

    const norm = value => String(value ?? "").toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

    const get = async path => {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`No se pudo cargar ${path} (HTTP ${response.status})`);
        return response.json();
    };

    const arr = value => Array.isArray(value) ? value :
        Array.isArray(value?.events) ? value.events :
        Array.isArray(value?.items) ? value.items : [];

    const yearOf = event => Number(event.year || String(event.date || "").slice(0, 4)) || 0;
    const nameOf = event => event.name || event.title || event.id || "Evento";
    const fmtDate = event => {
        if (!event.date) return "Fecha pendiente";
        const date = new Date(`${event.date}T00:00:00Z`);
        return Number.isNaN(date.getTime()) ? "Fecha pendiente" :
            new Intl.DateTimeFormat("es-AR", {
                day: "2-digit", month: "short", year: "numeric", timeZone: "UTC"
            }).format(date);
    };

    const brandInfo = {
        raw: { name: "RAW", subtitle: "RAW · NETFLIX", theme: "raw", description: "Archivo semanal de RAW." },
        smackdown: { name: "SmackDown", subtitle: "SMACKDOWN · USA NETWORK", theme: "smackdown", description: "Archivo semanal de SmackDown." }
    };

    const themes = {
        ple: "ple", premiumliveevents: "ple", weekly: "weekly",
        raw: "raw", wwraw: "raw", mondaynightraw: "raw",
        smackdown: "smackdown", wwesmackdown: "smackdown",
        fridaynightsmackdown: "smackdown", nxt: "nxt",
        speed: "speed", wwespeed: "speed", aaa: "aaa",
        aew: "aew", tna: "tna", specials: "specials",
        special: "specials", especiales: "specials"
    };

    const themeOf = value => themes[norm(value)] || norm(value) || "specials";

    const matchesShow = (event, showId) => {
        const values = [
            event.brand, event.brandId, event.show, event.showId,
            event.categoryId, event.category, event.promotion
        ].map(norm);

        const accepted = showId === "raw"
            ? ["raw", "wwraw", "mondaynightraw"]
            : ["smackdown", "wwesmackdown", "fridaynightsmackdown"];

        return values.some(value => accepted.includes(value));
    };

    const isTakeover = event => [
        event.id, event.name, event.title, event.division,
        event.subcategory, event.eventType, event.tournamentType,
        event.mode, event.type, event.category, event.categoryName
    ].some(value => /takeover|ascenso/i.test(String(value ?? "")));

    /* ==========================================================
       CARGA DE DATOS — SE OMITEN TEMPORADAS INEXISTENTES
       ========================================================== */
    try {
        const [catalog, indexData, brandsData, promotionsData, wrestlersData] =
            await Promise.all([
                get("data/events/catalog.json"),
                get("data/events/events.json").catch(() => []),
                get("data/brands/brands.json").catch(() => []),
                get("data/promotions/promotions.json").catch(() => []),
                get("data/wrestlers/wrestlers.json").catch(() => [])
            ]);

        if (!Array.isArray(catalog.categories)) {
            throw new Error("El catálogo no contiene categorías válidas.");
        }

        const allEvents = [];
        const knownIds = new Set();

        for (const category of catalog.categories) {
            for (const season of category.seasons || []) {
                try {
                    const file = await get(season.path);
                    const events = Array.isArray(file) ? file : file?.events;
                    if (!Array.isArray(events)) continue;

                    for (const event of events) {
                        if (!event?.id || knownIds.has(String(event.id))) continue;
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
                    console.warn("[MI WRESTLING] Temporada omitida:", season.path);
                }
            }
        }

        for (const event of arr(indexData)) {
            if (!event?.id || knownIds.has(String(event.id))) continue;
            knownIds.add(String(event.id));
            allEvents.push({ ...event, id: String(event.id) });
        }

        const brands = arr(brandsData);
        const promotions = arr(promotionsData);
        const wrestlers = arr(wrestlersData);

        const hasTNA = allEvents.some(event =>
            /tna/i.test(`${event.categoryId || ""} ${event.brand || ""} ${event.promotion || ""}`)
        ) || brands.some(item => /tna/i.test(`${item.id || ""} ${item.name || ""}`))
          || promotions.some(item => /tna/i.test(`${item.id || ""} ${item.name || ""}`))
          || wrestlers.some(item => /tna/i.test(String(item.brand || "")));

        const priority = {
            ple: 1, weekly: 2, nxt: 3, speed: 4,
            aaa: 5, aew: 6, specials: 7, tna: 8
        };

        const categories = catalog.categories
            .filter(category => category.id !== "tna" || hasTNA || category.show === true)
            .sort((a, b) =>
                (priority[a.id] || 99) - (priority[b.id] || 99) ||
                (a.order || 99) - (b.order || 99)
            );

        /* ==========================================================
           ESTADO DE LA VISTA
           ========================================================== */
        const readState = () => {
            const params = new URLSearchParams(location.search);
            return {
                category: params.get("category"),
                year: params.get("year") || "all",
                show: params.get("show")
            };
        };

        let state = readState();
        let transitionId = 0;

        /* ==========================================================
           FILTRADO
           ========================================================== */
        const countFor = category => allEvents.filter(event => {
            if (category.id === "weekly") {
                return matchesShow(event, "raw") ||
                    matchesShow(event, "smackdown") ||
                    norm(event.categoryId) === "weekly";
            }
            return norm(event.categoryId) === norm(category.id) ||
                norm(event.brand) === norm(category.id) ||
                norm(event.promotion) === norm(category.id);
        });

        const cardTheme = (event, selected, show) => {
            if (selected?.id === "weekly" && brandInfo[show]) {
                return brandInfo[show].theme;
            }
            if (selected) return themeOf(selected.theme || selected.id);
            return themeOf(event.brand || event.show || event.categoryId);
        };

        /* ==========================================================
           COMPONENTES HTML
           ========================================================== */
        const categoryCard = category => {
            const events = countFor(category);
            const years = new Set(events.map(yearOf).filter(Boolean)).size;
            return `
                <a class="mw-event-category-card theme-${esc(themeOf(category.theme || category.id))}"
                   href="events.html?category=${encodeURIComponent(category.id)}">
                    <span class="mw-event-category-card__eyebrow">${category.id === "ple" ? "PREMIUM LIVE EVENTS" : "EVENT ARCHIVE"}</span>
                    <strong>${esc(category.name)}</strong>
                    <span class="mw-event-category-card__subtitle">${esc(category.subtitle || category.description || "")}</span>
                    <span class="mw-event-category-card__footer">
                        <span>${years || "—"} año(s)</span><span>${events.length} evento(s) ↗</span>
                    </span>
                </a>`;
        };

        const showCard = showId => {
            const brand = brandInfo[showId];
            const count = allEvents.filter(event => matchesShow(event, showId)).length;
            return `
                <a class="mw-event-category-card theme-${brand.theme}"
                   href="events.html?category=weekly&amp;show=${showId}">
                    <span class="mw-event-category-card__eyebrow">${showId === "raw" ? "MONDAY NIGHT" : "FRIDAY NIGHT"}</span>
                    <strong>${esc(brand.name)}</strong>
                    <span class="mw-event-category-card__subtitle">${esc(brand.subtitle)}</span>
                    <span class="mw-event-category-card__footer"><span>${count} evento(s)</span><span>EXPLORAR ↗</span></span>
                </a>`;
        };

        const eventCards = (events, selected, show) => {
            if (!events.length) {
                return `<div class="mw-event-empty"><h3>Sin eventos disponibles</h3><p>Probá con otro año o volvé más adelante.</p></div>`;
            }

            return events.map(event => `
                <a class="mw-event-card theme-${esc(cardTheme(event, selected, show))}"
                   href="event.html?id=${encodeURIComponent(event.id)}">
                    <span class="mw-event-card__meta">${esc(event.status || event.mode || event.type || "EVENTO")}</span>
                    <strong>${esc(nameOf(event))}</strong>
                    <span>${esc(fmtDate(event))}${event.location ? ` · ${esc(event.location)}` : ""}</span>
                    <span class="mw-event-card__open">VER CARTELERA ↗</span>
                </a>`).join("");
        };

        const yearFilter = (years, selectedYear) => `
            <div class="mw-event-year-filter">
                <label>FILTRAR POR AÑO</label>
                <div class="mw-event-year-buttons">
                    <button type="button" class="mw-event-year-button ${selectedYear === "all" ? "is-active" : ""}"
                        data-year="all" aria-pressed="${selectedYear === "all"}">TODOS</button>
                    ${years.map(year => `
                        <button type="button" class="mw-event-year-button ${String(year) === selectedYear ? "is-active" : ""}"
                            data-year="${year}" aria-pressed="${String(year) === selectedYear}">${year}</button>
                    `).join("")}
                </div>
            </div>`;

        /* ==========================================================
           CONSTRUIR LA VISTA ACTUAL
           ========================================================== */
        const render = () => {
            state = readState();

            const selected = categories.find(category => category.id === state.category) || null;
            const weeklySelector = selected?.id === "weekly" && !state.show;
            const weeklyBrand = selected?.id === "weekly" && Boolean(brandInfo[state.show]);
            const display = weeklyBrand ? brandInfo[state.show] : selected;

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
            } else if (weeklySelector) {
                html += `
                    <a class="mw-event-back" href="events.html">← TODOS LOS EVENTOS</a>
                    <section class="mw-event-category-hero theme-weekly">
                        <span>WEEKLY ARCHIVE</span><h1>RAW + SMACKDOWN</h1>
                        <p>Elegí una marca para consultar sus carteleras.</p>
                    </section>
                    <section class="mw-event-section">
                        <div class="mw-event-disclosure">
                            <button type="button" class="mw-event-disclosure__toggle" aria-expanded="false">PROGRAMACIÓN SEMANAL</button>
                            <div class="mw-event-disclosure__content">
                                <div class="mw-event-category-grid">${showCard("raw")}${showCard("smackdown")}</div>
                            </div>
                        </div>
                    </section>`;
            } else {
                const events = allEvents.filter(event => {
                    if (selected.id === "weekly") return matchesShow(event, state.show);
                    return norm(event.categoryId) === norm(selected.id) ||
                        norm(event.brand) === norm(selected.id) ||
                        norm(event.promotion) === norm(selected.id);
                });

                const years = [...new Set(events.map(yearOf).filter(Boolean))].sort((a, b) => b - a);
                const filtered = events.filter(event => state.year === "all" || yearOf(event) === Number(state.year))
                    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

                const backUrl = weeklyBrand ? "events.html?category=weekly" : "events.html";

                html += `
                    <a class="mw-event-back" href="${backUrl}">← ${weeklyBrand ? "RAW + SMACKDOWN" : "TODAS LAS CATEGORÍAS"}</a>
                    <section class="mw-event-category-hero theme-${esc(display.theme || display.id)}">
                        <span>${esc(display.subtitle || "EVENT ARCHIVE")}</span>
                        <h1>${esc(display.name)}</h1>
                        <p>${esc(display.description || "")}</p>
                    </section>
                    <section class="mw-event-section theme-${esc(display.theme || display.id)}">
                        <div class="mw-event-section-heading">
                            <div><span class="mw-event-kicker">ARCHIVO</span><h2>Carteleras</h2></div>
                            <span>${filtered.length} evento(s)</span>
                        </div>
                        ${yearFilter(years, state.year)}
                        ${selected.id === "nxt" ? `
                            <div class="mw-event-disclosure is-open">
                                <button type="button" class="mw-event-disclosure__toggle" aria-expanded="true">NXT ROAD</button>
                                <div class="mw-event-disclosure__content">
                                    <div class="mw-event-grid">${eventCards(filtered.filter(event => !isTakeover(event)), selected, state.show)}</div>
                                </div>
                            </div>
                            <div class="mw-event-disclosure">
                                <button type="button" class="mw-event-disclosure__toggle" aria-expanded="false">NXT TAKEOVER · TORNEO DE ASCENSO</button>
                                <div class="mw-event-disclosure__content">
                                    <div class="mw-event-grid">${eventCards(filtered.filter(isTakeover), selected, state.show)}</div>
                                </div>
                            </div>
                        ` : `<div class="mw-event-grid">${eventCards(filtered, selected, state.show)}</div>`}
                    </section>`;
            }

            root.innerHTML = html;
            document.title = `${displayName(selected, state)}${state.year !== "all" ? " · " + state.year : ""} | MI WRESTLING 2.0`;
        };

        const displayName = (selected, current) => {
            if (!selected) return "Eventos";
            if (selected.id === "weekly" && brandInfo[current.show]) return brandInfo[current.show].name;
            return selected.name;
        };

        /* ==========================================================
           NAVEGACIÓN INTERNA SIN RECARGAR
           ========================================================== */
        const navigate = (url, direction = "forward") => {
            const target = new URL(url, location.href);
            if (target.pathname !== location.pathname) {
                location.href = target.href;
                return;
            }

            if (target.search === location.search) return;

            history.pushState({}, "", target.pathname + target.search + target.hash);
            transition(direction);
        };

        const transition = (direction = "forward") => {
            const id = ++transitionId;
            root.classList.remove("mw-panel-enter-right", "mw-panel-enter-left");
            root.classList.add(direction === "back" ? "mw-panel-leave-right" : "mw-panel-leave-left");

            setTimeout(() => {
                if (id !== transitionId) return;
                render();
                root.classList.remove("mw-panel-leave-left", "mw-panel-leave-right");
                root.classList.add(direction === "back" ? "mw-panel-enter-left" : "mw-panel-enter-right");

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (id === transitionId) {
                            root.classList.remove("mw-panel-enter-right", "mw-panel-enter-left");
                        }
                    });
                });

                window.scrollTo({ top: 0, behavior: "smooth" });
            }, 160);
        };

        root.addEventListener("click", event => {
            const yearButton = event.target.closest("[data-year]");
            if (yearButton) {
                const next = new URL(location.href);
                if (yearButton.dataset.year === "all") next.searchParams.delete("year");
                else next.searchParams.set("year", yearButton.dataset.year);
                navigate(next.href);
                return;
            }

            const disclosure = event.target.closest(".mw-event-disclosure__toggle");
            if (disclosure) {
                const panel = disclosure.closest(".mw-event-disclosure");
                const open = panel.classList.toggle("is-open");
                disclosure.setAttribute("aria-expanded", String(open));
                return;
            }

            const link = event.target.closest("a[href]");
            if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            if (link.target === "_blank" || link.hasAttribute("download")) return;

            const target = new URL(link.href, location.href);
            if (target.pathname !== location.pathname) return;

            event.preventDefault();
            navigate(target.href);
        });

        window.addEventListener("popstate", () => transition("back"));

        /* ==========================================================
           INICIO
           ========================================================== */
        root.classList.add("mw-events-panel");
        render();

    } catch (error) {
        console.error("[MI WRESTLING] Error cargando eventos:", error);
        root.innerHTML = `
            <section class="mw-event-empty">
                <h1>No se pudo cargar el catálogo</h1>
                <p>${esc(error.message || error)}</p>
            </section>`;
    }
})();
