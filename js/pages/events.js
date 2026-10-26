/* ==========================================================
   MI WRESTLING 2.0 | EVENT CATALOG
   WWE 2K26 / NETWORK STYLE
   ========================================================== */

(async function () {
    "use strict";

    const root = document.querySelector("[data-events-catalog]");
    if (!root) return;

    const PAGE_URL = "events.html";
    let animationTimer = null;

    /* ======================================================
       UTILIDADES
       ====================================================== */

    const esc = value =>
        String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);

    const normalize = value =>
        String(value ?? "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");

    const get = async path => {
        const response = await fetch(path);

        if (!response.ok) {
            throw new Error(
                `No se pudo cargar ${path} (HTTP ${response.status})`
            );
        }

        return response.json();
    };

    const asArray = value => {
        if (Array.isArray(value)) return value;
        if (value && Array.isArray(value.events)) return value.events;
        if (value && Array.isArray(value.items)) return value.items;
        if (value && Array.isArray(value.brands)) return value.brands;
        if (value && Array.isArray(value.promotions)) return value.promotions;
        if (value && Array.isArray(value.wrestlers)) return value.wrestlers;
        return [];
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

    const eventYear = event =>
        Number(event.year || String(event.date || "").slice(0, 4)) || 0;

    const eventName = event =>
        event.name || event.title || event.id || "Evento sin título";

    const params = new URLSearchParams(location.search);
    const selectedId = params.get("category");
    const selectedYear = params.get("year") || "all";
    const selectedShow = params.get("show");

    /* ======================================================
       IDENTIDAD VISUAL
       ====================================================== */

    const brandInfo = {
        raw: {
            name: "RAW",
            subtitle: "RAW · NETFLIX",
            description: "El archivo semanal de RAW.",
            theme: "raw",
            showId: "raw"
        },
        smackdown: {
            name: "SmackDown",
            subtitle: "SMACKDOWN · USA NETWORK",
            description: "El archivo semanal de SmackDown.",
            theme: "smackdown",
            showId: "smackdown"
        }
    };

    const themeAliases = {
        ple: "ple",
        premiumliveevents: "ple",
        weekly: "weekly",
        raw: "raw",
        wwraw: "raw",
        mondaynightraw: "raw",
        smackdown: "smackdown",
        wwesmackdown: "smackdown",
        fridaynightsmackdown: "smackdown",
        nxt: "nxt",
        speed: "speed",
        wwespeed: "speed",
        aaa: "aaa",
        lucha libre aaa: "aaa",
        aew: "aew",
        tna: "tna",
        specials: "specials",
        special: "specials",
        especiales: "specials"
    };

    const themeFor = value => {
        const key = normalize(value);
        return themeAliases[key] || key || "specials";
    };

    const categoryTheme = category =>
        themeFor(category.theme || category.id);

    const matchesShow = (event, showId) => {
        const values = [
            event.brand,
            event.brandId,
            event.show,
            event.showId,
            event.categoryId,
            event.category,
            event.promotion
        ].map(normalize);

        const accepted = showId === "raw"
            ? ["raw", "wwraw", "mondaynightraw"]
            : ["smackdown", "wwesmackdown", "fridaynightsmackdown"];

        return values.some(value => accepted.includes(value));
    };

    const matchesNxtDivision = (event, division) => {
        const values = [
            event.division,
            event.subcategory,
            event.eventType,
            event.tournamentType,
            event.mode,
            event.type,
            event.brand,
            event.show
        ].map(normalize);

        if (division === "takeover") {
            return values.some(value =>
                value.includes("takeover") ||
                value.includes("ascenso")
            );
        }

        return !values.some(value =>
            value.includes("takeover") ||
            value.includes("ascenso")
        );
    };

    const eventTheme = (event, selected, showId) => {
        if (selected?.id === "weekly" && brandInfo[showId]) {
            return brandInfo[showId].theme;
        }

        if (selected?.id === "ple") return "ple";
        if (selected?.id === "nxt") return "nxt";
        if (selected?.id === "speed") return "speed";
        if (selected?.id === "aaa") return "aaa";
        if (selected?.id === "aew") return "aew";
        if (selected?.id === "tna") return "tna";
        if (selected?.id === "specials") return "specials";

        return themeFor(
            event.brandId ||
            event.brand ||
            event.showId ||
            event.show ||
            event.categoryId ||
            selected?.theme ||
            selected?.id
        );
    };

    /* ======================================================
       CARGA DE DATOS
       ====================================================== */

    try {
        const [
            catalog,
            indexData,
            brandsData,
            promotionsData,
            wrestlersData
        ] = await Promise.all([
            get("data/events/catalog.json"),
            get("data/events/events.json").catch(() => []),
            get("data/brands/brands.json").catch(() => []),
            get("data/promotions/promotions.json").catch(() => []),
            get("data/wrestlers/wrestlers.json").catch(() => [])
        ]);

        if (!Array.isArray(catalog.categories)) {
            throw new Error(
                "El catálogo no contiene una lista válida de categorías."
            );
        }

        const indexEvents = asArray(indexData);
        const brands = asArray(brandsData);
        const promotions = asArray(promotionsData);
        const wrestlers = asArray(wrestlersData);

        /* ==================================================
           CARGA DE TEMPORADAS
           ================================================== */

        const allEvents = [];
        const knownIds = new Set();

        for (const category of catalog.categories) {
            for (const season of category.seasons || []) {
                try {
                    const file = await get(season.path);
                    const events = asArray(file);

                    if (!events.length && !Array.isArray(file)) {
                        console.warn(
                            "[MI WRESTLING] Temporada sin eventos o formato inesperado:",
                            season.path
                        );
                    }

                    for (const event of events) {
                        if (!event || !event.id) continue;

                        const id = String(event.id);
                        if (knownIds.has(id)) continue;

                        knownIds.add(id);

                        allEvents.push({
                            ...event,
                            id,
                            categoryId: event.categoryId || category.id,
                            categoryName: event.categoryName || category.name,
                            year: event.year || file.year || season.year,
                            seasonId: event.seasonId || season.id || file.id || null
                        });
                    }
                } catch (error) {
                    console.warn(
                        "[MI WRESTLING] Temporada no disponible:",
                        season.path,
                        error
                    );
                }
            }
        }

        /* Incorporar índice general sin duplicar IDs */

        for (const event of indexEvents) {
            if (!event || !event.id) continue;

            const id = String(event.id);
            if (knownIds.has(id)) continue;

            knownIds.add(id);
            allEvents.push({ ...event, id });
        }

        /* ==================================================
           CATEGORÍAS Y ORDEN
           ================================================== */

        const hasTNA =
            allEvents.some(event =>
                /tna/i.test(
                    `${event.categoryId || ""} ${event.brand || ""} ${event.promotion || ""}`
                )
            ) ||
            brands.some(item =>
                /tna/i.test(`${item.id || ""} ${item.name || ""}`)
            ) ||
            promotions.some(item =>
                /tna/i.test(`${item.id || ""} ${item.name || ""}`)
            ) ||
            wrestlers.some(item =>
                /tna/i.test(String(item.brand || ""))
            );

        const priority = {
            ple: 1,
            weekly: 2,
            nxt: 3,
            speed: 4,
            aaa: 5,
            aew: 6,
            specials: 7,
            tna: 8
        };

        const categories = catalog.categories
            .filter(category =>
                category.id !== "tna" ||
                hasTNA ||
                category.show === true
            )
            .sort((a, b) =>
                (priority[a.id] || 99) - (priority[b.id] || 99) ||
                (a.order || 99) - (b.order || 99)
            );

        const selected =
            categories.find(category => category.id === selectedId) || null;

        const isWeeklySelector =
            selected?.id === "weekly" && !selectedShow;

        const isWeeklyBrand =
            selected?.id === "weekly" && Boolean(brandInfo[selectedShow]);

        const display = isWeeklyBrand
            ? brandInfo[selectedShow]
            : selected;

        /* ==================================================
           EVENTOS DE LA CATEGORÍA
           ================================================== */

        const categoryEvents = selected
            ? allEvents.filter(event => {
                if (selected.id === "weekly") {
                    if (selectedShow && brandInfo[selectedShow]) {
                        return matchesShow(event, selectedShow);
                    }

                    return (
                        matchesShow(event, "raw") ||
                        matchesShow(event, "smackdown") ||
                        normalize(event.categoryId) === "weekly"
                    );
                }

                return (
                    normalize(event.categoryId) === normalize(selected.id) ||
                    normalize(event.brand) === normalize(selected.id) ||
                    normalize(event.promotion) === normalize(selected.id)
                );
            })
            : [];

        const nxtRoadEvents = selected?.id === "nxt"
            ? categoryEvents.filter(event =>
                matchesNxtDivision(event, "road")
            )
            : [];

        const nxtTakeoverEvents = selected?.id === "nxt"
            ? categoryEvents.filter(event =>
                matchesNxtDivision(event, "takeover")
            )
            : [];

        const years = [
            ...new Set(
                categoryEvents
                    .map(eventYear)
                    .filter(year => year > 0)
            )
        ].sort((a, b) => b - a);

        const filterByYear = events =>
            events
                .filter(event =>
                    selectedYear === "all" ||
                    eventYear(event) === Number(selectedYear)
                )
                .sort((a, b) =>
                    String(b.date || "").localeCompare(String(a.date || "")) ||
                    eventName(a).localeCompare(eventName(b), "es")
                );

        const filtered = filterByYear(categoryEvents);
        const filteredRoad = filterByYear(nxtRoadEvents);
        const filteredTakeover = filterByYear(nxtTakeoverEvents);

        const countFor = category => {
            if (category.id === "weekly") {
                return allEvents.filter(event =>
                    matchesShow(event, "raw") ||
                    matchesShow(event, "smackdown") ||
                    normalize(event.categoryId) === "weekly"
                );
            }

            return allEvents.filter(event =>
                normalize(event.categoryId) === normalize(category.id) ||
                normalize(event.brand) === normalize(category.id) ||
                normalize(event.promotion) === normalize(category.id)
            );
        };

        /* ==================================================
           TARJETAS DE CATEGORÍA
           ================================================== */

        const categoryCard = category => {
            const list = countFor(category);
            const theme = categoryTheme(category);

            const yearCount = new Set(
                list.map(eventYear).filter(year => year > 0)
            ).size;

            return `
                <a
                    class="mw-event-category-card theme-${esc(theme)}"
                    href="${PAGE_URL}?category=${encodeURIComponent(category.id)}"
                    aria-label="Explorar ${esc(category.name)}"
                >
                    <span class="mw-event-category-card__eyebrow">
                        ${category.id === "ple"
                            ? "PREMIUM LIVE EVENTS"
                            : "EVENT ARCHIVE"}
                    </span>

                    <strong>${esc(category.name)}</strong>

                    <span class="mw-event-category-card__subtitle">
                        ${esc(category.subtitle || category.description || "")}
                    </span>

                    <span class="mw-event-category-card__footer">
                        <span>${yearCount || "—"} año(s)</span>
                        <span>${list.length} evento(s) ↗</span>
                    </span>
                </a>
            `;
        };

        /* ==================================================
           TARJETAS RAW / SMACKDOWN
           ================================================== */

        const weeklyShowCard = showId => {
            const brand = brandInfo[showId];
            const count = allEvents.filter(event =>
                matchesShow(event, showId)
            ).length;

            return `
                <a
                    class="mw-event-category-card theme-${brand.theme}"
                    href="${PAGE_URL}?category=weekly&amp;show=${showId}"
                >
                    <span class="mw-event-category-card__eyebrow">
                        ${showId === "raw" ? "MONDAY NIGHT" : "FRIDAY NIGHT"}
                    </span>

                    <strong>${esc(brand.name)}</strong>

                    <span class="mw-event-category-card__subtitle">
                        ${esc(brand.subtitle)} · Archivo semanal
                    </span>

                    <span class="mw-event-category-card__footer">
                        <span>${count} evento(s)</span>
                        <span>EXPLORAR ↗</span>
                    </span>
                </a>
            `;
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
                    ${weeklyShowCard("raw")}
                    ${weeklyShowCard("smackdown")}
                </div>
            </section>
        `;

        /* ==================================================
           BOTONES DE AÑO
           ================================================== */

        const yearButtons = `
            <div class="mw-event-year-filter">
                <label>FILTRAR POR AÑO</label>
                <div class="mw-event-year-buttons">
                    <button
                        type="button"
                        class="mw-event-year-button ${selectedYear === "all" ? "is-active" : ""}"
                        data-event-year="all"
                        aria-pressed="${selectedYear === "all"}"
                    >TODOS</button>

                    ${years.map(year => `
                        <button
                            type="button"
                            class="mw-event-year-button ${String(year) === selectedYear ? "is-active" : ""}"
                            data-event-year="${year}"
                            aria-pressed="${String(year) === selectedYear}"
                        >${year}</button>
                    `).join("")}
                </div>
            </div>
        `;

        /* ==================================================
           TARJETAS DE EVENTOS
           ================================================== */

        const eventCards = (events, theme) => {
            if (!events.length) {
                return `
                    <div class="mw-event-empty">
                        <h3>Archivo preparado</h3>
                        <p>Todavía no hay eventos cargados para esta selección.</p>
                    </div>
                `;
            }

            return events.map(event => {
                const actualTheme = eventTheme(
                    event,
                    selected,
                    selectedShow
                ) || theme;

                const status = event.status || event.mode || event.type || "EVENTO";
                const date = fmtDate(event);
                const locationText = event.location
                    ? ` · ${esc(event.location)}`
                    : "";

                return `
                    <a
                        class="mw-event-card theme-${esc(actualTheme)}"
                        href="event.html?id=${encodeURIComponent(event.id)}"
                    >
                        <span class="mw-event-card__meta">
                            ${esc(status)}
                        </span>

                        <strong>${esc(eventName(event))}</strong>

                        <span>${esc(date)}${locationText}</span>

                        <span class="mw-event-card__open">
                            VER CARTELERA ↗
                        </span>
                    </a>
                `;
            }).join("");
        };

        const emptyYearMessage = `
            <div class="mw-event-empty">
                <h3>No hay eventos en ese año</h3>
                <p>Probá con otro año para consultar más carteleras.</p>
            </div>
        `;

        /* ==================================================
           HERO PRINCIPAL
           ================================================== */

        let html = `
            <section class="page-hero mw-events-hero">
                <div class="eyebrow">MI WRESTLING 2.0 / EVENT ARCHIVE</div>
                <h1>EVENTOS</h1>
                <p class="lead">
                    Explorá las marcas, los eventos premium y sus carteleras por año.
                </p>
            </section>
        `;

        /* ==================================================
           CATÁLOGO GENERAL
           ================================================== */

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
                </section>
            `;
        }

        /* ==================================================
           WEEKLY — SELECTOR DE MARCAS
           ================================================== */

        else if (isWeeklySelector) {
            html += `
                <a class="mw-event-back" href="${PAGE_URL}">
                    ← TODOS LOS EVENTOS
                </a>

                <section class="mw-event-category-hero theme-weekly">
                    <span>WEEKLY ARCHIVE</span>
                    <h1>RAW + SMACKDOWN</h1>
                    <p>Elegí una marca para consultar sus carteleras semanales.</p>
                </section>

                <section class="mw-event-section">
                    <div class="mw-event-disclosure is-open">
                        <button
                            type="button"
                            class="mw-event-disclosure__toggle"
                            aria-expanded="true"
                            aria-controls="weekly-shows"
                        >PROGRAMACIÓN SEMANAL</button>

                        <div
                            class="mw-event-disclosure__content"
                            id="weekly-shows"
                        >
                            <div class="mw-event-category-grid">
                                ${weeklyShowCard("raw")}
                                ${weeklyShowCard("smackdown")}
                            </div>
                        </div>
                    </div>
                </section>
            `;
        }

        /* ==================================================
           ARCHIVO DE UNA MARCA / CATEGORÍA
           ================================================== */

        else {
            const theme = display.theme || display.id;
            const title = display.name;
            const description = display.description || "";

            const backUrl = isWeeklyBrand
                ? `${PAGE_URL}?category=weekly`
                : PAGE_URL;

            html += `
                <a class="mw-event-back" href="${backUrl}">
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

                    ${yearButtons}

                    ${selected.id === "nxt" ? `
                        <div class="mw-event-disclosure is-open">
                            <button
                                type="button"
                                class="mw-event-disclosure__toggle"
                                aria-expanded="true"
                                aria-controls="nxt-road-events"
                            >NXT ROAD</button>

                            <div class="mw-event-disclosure__content" id="nxt-road-events">
                                <div class="mw-event-grid">
                                    ${filteredRoad.length
                                        ? eventCards(filteredRoad, "nxt")
                                        : emptyYearMessage}
                                </div>
                            </div>
                        </div>

                        <div class="mw-event-disclosure">
                            <button
                                type="button"
                                class="mw-event-disclosure__toggle"
                                aria-expanded="false"
                                aria-controls="nxt-takeover-events"
                            >NXT TAKEOVER · TORNEO DE ASCENSO</button>

                            <div class="mw-event-disclosure__content" id="nxt-takeover-events">
                                <div class="mw-event-grid">
                                    ${filteredTakeover.length
                                        ? eventCards(filteredTakeover, "nxt")
                                        : emptyYearMessage}
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="mw-event-grid">
                            ${filtered.length
                                ? eventCards(filtered, theme)
                                : emptyYearMessage}
                        </div>
                    `}
                </section>
            `;
        }

        /* ==================================================
           PINTAR PÁGINA
           ================================================== */

        root.innerHTML = html;

        /* ==================================================
           FILTRO DE AÑOS
           ================================================== */

        root.querySelectorAll("[data-event-year]").forEach(button => {
            button.addEventListener("click", () => {
                const next = new URLSearchParams(location.search);
                const year = button.dataset.eventYear;

                if (year === "all") {
                    next.delete("year");
                } else {
                    next.set("year", year);
                }

                const query = next.toString();
                location.href = `${PAGE_URL}${query ? `?${query}` : ""}`;
            });
        });

        /* ==================================================
           DESPLEGABLES
           ================================================== */

        root.querySelectorAll(".mw-event-disclosure__toggle").forEach(button => {
            button.addEventListener("click", () => {
                const panel = button.closest(".mw-event-disclosure");
                if (!panel) return;

                const isOpen = panel.classList.toggle("is-open");
                button.setAttribute("aria-expanded", String(isOpen));
            });
        });

        /* ==================================================
           CHROMA TEMPORAL
           ================================================== */

        const clearChroma = () => {
            if (animationTimer) {
                clearTimeout(animationTimer);
                animationTimer = null;
            }

            root.querySelectorAll(".mw-event-category-card.is-animating")
                .forEach(card => card.classList.remove("is-animating"));
        };

        root.querySelectorAll(".mw-event-category-card").forEach(card => {
            card.addEventListener("click", () => {
                clearChroma();
                card.classList.add("is-animating");

                animationTimer = setTimeout(() => {
                    card.classList.remove("is-animating");
                    animationTimer = null;
                }, 1550);
            });
        });

        document.addEventListener("pointerdown", event => {
            if (!event.target.closest(".mw-event-category-card")) {
                clearChroma();
            }
        }, { passive: true });

        /* ==================================================
           TÍTULO DEL DOCUMENTO
           ================================================== */

        const currentName = selected
            ? (
                isWeeklyBrand
                    ? brandInfo[selectedShow].name
                    : selected.name
            )
            : "Eventos";

        document.title =
            `${currentName}${selectedYear !== "all" ? " · " + selectedYear : ""} | MI WRESTLING 2.0`;

    } catch (error) {
        console.error("[MI WRESTLING] Error cargando eventos:", error);

        root.innerHTML = `
            <section class="mw-event-empty">
                <h1>No se pudo cargar el catálogo</h1>
                <p>${esc(error.message || error)}</p>
            </section>
        `;
    }
})();
