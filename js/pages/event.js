
/* ==========================================================
   MI WRESTLING 2.0
   EVENTO INDIVIDUAL — HERO + CARTELERA + CRONOLOGÍA
   ========================================================== */

(async function () {
    "use strict";

    const main =
        document.querySelector("[data-event-main]") ||
        document.querySelector("main.site-main");

    if (!main) return;

    const $ = (selector, root = main) => root.querySelector(selector);

    const esc = value =>
        String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);

    const get = async path => {
        const response = await fetch(path);

        if (!response.ok) {
            throw new Error(
                `No se pudo cargar ${path} (HTTP ${response.status})`
            );
        }

        return response.json();
    };

    const getDate = value => {
        if (!value) return null;

        const date = new Date(`${value}T00:00:00Z`);

        return Number.isNaN(date.getTime()) ? null : date;
    };

    const formatDate = value => {
        const date = getDate(value);

        if (!date) return "Fecha no registrada";

        return new Intl.DateTimeFormat("es-AR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            timeZone: "UTC"
        }).format(date);
    };

    const shortDate = value => {
        const date = getDate(value);

        if (!date) return "Fecha pendiente";

        return new Intl.DateTimeFormat("es-AR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "UTC"
        }).format(date);
    };

    const eventName = event =>
        event?.name || event?.title || event?.id || "Evento sin nombre";

    const eventDate = event =>
        event?.date || event?.startDate || "";

    const eventImage = event =>
        typeof event?.image === "string" ? event.image : "";

    const eventUrl = event =>
        `event.html?id=${encodeURIComponent(event.id)}`;

    const categoryName = event =>
        event?.categoryName || event?.brand || event?.type || "Evento";

    function escapeUrl(value) {
        const url = String(value || "").trim();

        // Evita URLs ejecutables o esquemas no seguros.
        if (/^(javascript|data|vbscript):/i.test(url)) return "";

        return url;
    }

    function posterMarkup(event) {
        const image = escapeUrl(eventImage(event));

        if (!image) {
            return `
                <div class="mw-event-poster">
                    <div class="mw-event-poster__fallback">
                        ${esc(eventName(event))}
                    </div>
                </div>
            `;
        }

        return `
            <div class="mw-event-poster">
                <img
                    src="${esc(image)}"
                    alt="Póster de ${esc(eventName(event))}"
                    loading="eager"
                    fetchpriority="high"
                    onerror="
                        this.remove();
                        this.parentElement.innerHTML =
                            '<div class=&quot;mw-event-poster__fallback&quot;>' +
                            this.parentElement.dataset.fallback +
                            '</div>';
                    "
                    data-fallback="${esc(eventName(event))}"
                >
            </div>
        `;
    }

    function timelineCard(event, currentId) {
        const current = String(event.id) === String(currentId);
        const image = escapeUrl(eventImage(event));

        return `
            <a
                class="mw-event-timeline-card${current ? " is-current" : ""}"
                href="${eventUrl(event)}"
                ${current ? 'aria-current="page"' : ""}
                ${current ? 'aria-label="Evento actual: ' + esc(eventName(event)) + '"' : ""}
            >
                <div class="mw-event-timeline-card__image">
                    ${
                        image
                            ? `
                                <img
                                    src="${esc(image)}"
                                    alt="${esc(eventName(event))}"
                                    loading="lazy"
                                    onerror="
                                        this.remove();
                                        this.parentElement.innerHTML =
                                            '<span class=&quot;mw-event-timeline-card__fallback&quot;>' +
                                            this.dataset.fallback +
                                            '</span>';
                                    "
                                    data-fallback="${esc(eventName(event))}"
                                >
                            `
                            : `
                                <span class="mw-event-timeline-card__fallback">
                                    ${esc(eventName(event))}
                                </span>
                            `
                    }
                </div>

                <div class="mw-event-timeline-card__copy">
                    <span class="mw-event-timeline-card__date">
                        ${esc(shortDate(eventDate(event)))}
                    </span>

                    <strong class="mw-event-timeline-card__title">
                        ${esc(eventName(event))}
                    </strong>

                    <span class="mw-event-timeline-card__meta">
                        ${esc(categoryName(event))}
                        ${event.year ? ` · ${esc(event.year)}` : ""}
                    </span>
                </div>
            </a>
        `;
    }

    function timelineNavigation(previous, next) {
        if (!previous && !next) return "";

        return `
            <nav
                class="mw-event-timeline-nav"
                aria-label="Navegación entre eventos"
            >
                ${
                    previous
                        ? `
                            <a href="${eventUrl(previous)}">
                                <span aria-hidden="true">←</span>
                                <span>
                                    <small>EVENTO ANTERIOR</small>
                                    <strong>${esc(eventName(previous))}</strong>
                                </span>
                            </a>
                        `
                        : "<span></span>"
                }

                ${
                    next
                        ? `
                            <a href="${eventUrl(next)}">
                                <span>
                                    <small>EVENTO SIGUIENTE</small>
                                    <strong>${esc(eventName(next))}</strong>
                                </span>
                                <span aria-hidden="true">→</span>
                            </a>
                        `
                        : "<span></span>"
                }
            </nav>
        `;
    }

    function renderEmpty(title, message, backLink = "events.html") {
        main.innerHTML = `
            <section class="mw-event-empty">
                <h1>${esc(title)}</h1>
                <p>${esc(message)}</p>
                <a class="mw-event-back" href="${esc(backLink)}">
                    ← VOLVER AL ARCHIVO
                </a>
            </section>
        `;
    }

    main.innerHTML = `
        <div class="mw-event-loading" role="status">
            PREPARANDO EL EVENTO…
        </div>
    `;

    try {
        const [
            catalog,
            matches,
            wrestlers,
            personas,
            teams,
            indexEvents
        ] = await Promise.all([
            get("data/events/catalog.json"),
            get("data/matches/matches.json"),
            get("data/wrestlers/wrestlers.json"),
            get("data/personas/personas.json"),
            get("data/teams/teams.json").catch(() => []),
            get("data/events/events.json").catch(() => [])
        ]);

        const events = [];
        const seasons = [];

        // 1. Cargar temporadas declaradas en el catálogo.
        for (const category of catalog.categories || []) {
            for (const season of category.seasons || []) {
                try {
                    const data = await get(season.path);

                    seasons.push({
                        ...data,
                        _path: season.path,
                        _category: category
                    });

                    for (const event of data.events || []) {
                        if (events.some(item => String(item.id) === String(event.id))) {
                            continue;
                        }

                        events.push({
                            ...event,
                            categoryId: event.categoryId || category.id,
                            categoryName: event.categoryName || category.name,
                            seasonId: event.seasonId || data.id,
                            year: event.year || data.year
                        });
                    }
                } catch (error) {
                    console.warn(
                        "[MI WRESTLING] No se pudo cargar la temporada:",
                        season.path,
                        error
                    );
                }
            }
        }

        // 2. Añadir eventos del índice central que todavía no estén cargados.
        for (const event of Array.isArray(indexEvents) ? indexEvents : []) {
            if (!events.some(item => String(item.id) === String(event.id))) {
                events.push(event);
            }
        }

        const params = new URLSearchParams(location.search);
        const id = params.get("id");

        if (!id) {
            renderEmpty(
                "FALTA EL EVENTO",
                "Abrí esta página desde una tarjeta del catálogo para cargar el evento correcto."
            );
            return;
        }

        const event = events.find(item => String(item.id) === String(id));

        if (!event) {
            renderEmpty(
                "EVENTO NO ENCONTRADO",
                `No existe el ID "${id}" en los archivos de eventos.`
            );
            return;
        }

        const category =
            (catalog.categories || []).find(
                item => String(item.id) === String(event.categoryId)
            ) || null;

        const eventMatches = matches
            .filter(match =>
                String(match.eventId || "") === String(event.id) ||
                (event.matchIds || []).some(
                    matchId => String(matchId) === String(match.id)
                )
            )
            .sort((a, b) =>
                (a.order ?? a.positionOrder ?? 9999) -
                (b.order ?? b.positionOrder ?? 9999) ||
                String(a.id).localeCompare(String(b.id))
            );

        const backCategory =
            event.categoryId || category?.id || "ple";

        const backLink =
            `events.html?category=${encodeURIComponent(backCategory)}` +
            (event.year ? `&year=${encodeURIComponent(event.year)}` : "");

        // 3. Resultados: usa el componente central existente.
        const cards =
            eventMatches.length && window.MIW_MATCH_CARD
                ? eventMatches.map(match =>
                    window.MIW_MATCH_CARD.render(match, {
                        wrestlers,
                        personas,
                        events,
                        teams
                    })
                ).join("")
                : `
                    <div class="mw-event-empty">
                        <h2>Cartelera pendiente</h2>
                        <p>
                            ${
                                eventMatches.length
                                    ? "No se encontró el componente de tarjetas de combate."
                                    : "Este evento todavía no tiene combates vinculados. No se inventan resultados."
                            }
                        </p>
                    </div>
                `;

        // 4. Preparar cronología de la misma categoría.
        const categoryEvents = events
            .filter(item =>
                String(item.categoryId || "") === String(event.categoryId || "")
            )
            .filter(item => getDate(eventDate(item)))
            .sort((a, b) =>
                getDate(eventDate(a)) - getDate(eventDate(b))
            );

        const currentIndex = categoryEvents.findIndex(
            item => String(item.id) === String(event.id)
        );

        const previous =
            currentIndex > 0 ? categoryEvents[currentIndex - 1] : null;

        const next =
            currentIndex >= 0 && currentIndex < categoryEvents.length - 1
                ? categoryEvents[currentIndex + 1]
                : null;

        // Mostrar un tramo de la cronología alrededor del evento actual.
        const timelineEvents =
            currentIndex >= 0
                ? categoryEvents.slice(
                    Math.max(0, currentIndex - 2),
                    Math.min(categoryEvents.length, currentIndex + 3)
                )
                : [];

        const timelineMarkup = timelineEvents.length
            ? timelineEvents.map(item =>
                timelineCard(item, event.id)
            ).join("")
            : `
                <div class="mw-event-empty">
                    <p>No hay otros eventos fechados en esta categoría.</p>
                </div>
            `;

        // 5. Datos derivados del archivo, sin inventar cifras.
        const matchCount = eventMatches.length;
        const finishedCount = eventMatches.filter(match =>
            (match.participants || []).some(participant =>
                ["win", "loss", "draw", "no-contest"].includes(
                    String(participant.result || "").toLowerCase()
                )
            ) || Boolean(match.winner) ||
            (Array.isArray(match.winnerIds) && match.winnerIds.length > 0)
        ).length;

        const dateLabel = formatDate(event.date);
        const typeLabel = event.type || category?.name || "Evento";
        const statusLabel = event.status || event.mode || "Archivo";

        // 6. Construir página.
        main.innerHTML = `
            <a class="mw-event-back" href="${esc(backLink)}">
                ← VOLVER AL ARCHIVO
            </a>

            <header class="page-hero mw-event-detail-hero">

                <div class="mw-event-detail-hero__copy">

                    <div class="mw-event-eyebrow">
                        ${esc(category?.name || event.categoryName || "MI WRESTLING 2.0")}
                        <span>/</span>
                        ${esc(event.year || String(event.date || "").slice(0, 4) || "ARCHIVO")}
                    </div>

                    <h1>${esc(eventName(event))}</h1>

                    <p class="mw-event-description">
                        ${esc(event.description || "La cartelera oficial, los resultados y la historia del evento.")}
                    </p>

                    <div class="mw-event-detail-meta">
                        <span>${esc(dateLabel)}</span>
                        <span>${esc(typeLabel)}</span>
                        <span>${esc(statusLabel)}</span>
                        ${event.brand ? `<span>${esc(event.brand)}</span>` : ""}
                        ${event.location ? `<span>${esc(event.location)}</span>` : ""}
                    </div>

                </div>

                ${posterMarkup(event)}

            </header>

            <section class="mw-event-stats" aria-label="Resumen del evento">

                <div class="mw-event-stat">
                    <strong class="mw-event-stat__value">${matchCount}</strong>
                    <span class="mw-event-stat__label">Combates registrados</span>
                </div>

                <div class="mw-event-stat">
                    <strong class="mw-event-stat__value">${finishedCount}</strong>
                    <span class="mw-event-stat__label">Con resultado registrado</span>
                </div>

                <div class="mw-event-stat">
                    <strong class="mw-event-stat__value">${esc(event.year || "—")}</strong>
                    <span class="mw-event-stat__label">Año del evento</span>
                </div>

            </section>

            <section
                class="mw-event-section"
                aria-labelledby="mw-event-card-heading"
            >
                <div class="mw-event-section-heading">
                    <div>
                        <span class="mw-event-kicker">OFFICIAL MATCH CARD</span>
                        <h2 id="mw-event-card-heading">Cartelera y resultados</h2>
                    </div>

                    <span>${matchCount} combate${matchCount === 1 ? "" : "s"}</span>
                </div>

                <div class="mw-event-matches">
                    ${cards}
                </div>
            </section>

            <section
                class="mw-event-section"
                aria-labelledby="mw-event-timeline-heading"
            >
                <div class="mw-event-section-heading">
                    <div>
                        <span class="mw-event-kicker">EVENT HISTORY</span>
                        <h2 id="mw-event-timeline-heading">Cronología de eventos</h2>
                    </div>

                    <span>${esc(category?.name || event.categoryName || "Archivo")}</span>
                </div>

                <div class="mw-event-timeline">
                    ${timelineMarkup}
                </div>

                ${timelineNavigation(previous, next)}
            </section>
        `;

        document.title = `${eventName(event)} | MI WRESTLING 2.0`;

        // Permite que otros scripts conozcan el evento cargado.
        main.dataset.eventId = String(event.id);

    } catch (error) {
        console.error("[MI WRESTLING] Error al cargar el evento:", error);

        renderEmpty(
            "NO SE PUDO CARGAR EL EVENTO",
            error.message || "Ocurrió un error al leer los archivos de datos."
        );
    }
})();
