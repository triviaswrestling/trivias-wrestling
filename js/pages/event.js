
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
        const response = await fetch(path, { headers: { Accept: "application/json" } });

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
                    decoding="async"
                    onerror="this.hidden=true; this.parentElement.classList.add('is-empty')"
                >
                <div class="mw-event-poster__fallback">${esc(eventName(event))}</div>
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

    const asArray = value => Array.isArray(value) ? value : [];
    const norm = value => String(value || "").trim().toLowerCase();
    const hasResult = match => {
        const participants = asArray(match.participants);
        return participants.some(p => ["win", "loss", "draw", "no-contest"].includes(norm(p.result))) ||
            Boolean(match.winner) || asArray(match.winnerIds).length > 0;
    };
    const participantResult = (match, participant) => {
        const explicit = norm(participant.result);
        if (["win", "loss", "draw", "no-contest"].includes(explicit)) return explicit;
        const winnerIds = asArray(match.winnerIds).map(String);
        if (participant.wrestlerId && winnerIds.includes(String(participant.wrestlerId))) return "win";
        if (winnerIds.length && participant.wrestlerId && !winnerIds.includes(String(participant.wrestlerId))) return "loss";
        return "pending";
    };
    const resultLabel = result => ({ win: "Victoria", loss: "Derrota", draw: "Empate", "no-contest": "Sin resultado", pending: "Pendiente" })[result] || "Pendiente";
    const personName = (participant, wrestlerMap) => {
        const wrestler = wrestlerMap.get(String(participant.wrestlerId || ""));
        return wrestler?.name || participant.wrestlerName || participant.name || participant.wrestlerId || "Superestrella sin vincular";
    };
    const imagePath = value => {
        const raw = String(value || "").trim();
        if (!raw || /^(javascript|data|vbscript):/i.test(raw)) return "";
        return raw;
    };

    function renderMatchCard(match, context) {
        const { wrestlerMap, personaMap, teamMap } = context;
        const participants = asArray(match.participants).filter(p => !p.role || p.role === "competitor");
        const legacy = match.legacy || {};
        const rawType = norm(match.type || "");
        const typeLabels = {
            singles: "Singles", "one-on-one": "Singles", tag: "Tag Team", "tag-team": "Tag Team",
            trios: "Trios", "six-man-tag": "Six-Man Tag", "multi-person": "Combate multitudinario",
            "battle-royal": "Battle Royal", "royal-rumble": "Royal Rumble", fatal4way: "Fatal 4-Way",
            "fatal-4-way": "Fatal 4-Way", tournament: "Combate de torneo", "triple-threat": "Triple Threat"
        };
        const type = typeLabels[rawType] || match.type || (participants.length === 2 ? "Singles" : participants.length > 2 ? "Combate multitudinario" : "Combate");
        const score = Array.isArray(match.sideScores) ? match.sideScores : Array.isArray(match.score) ? match.score :
            legacy.score1 !== undefined && legacy.score2 !== undefined && legacy.score1 !== null && legacy.score2 !== null ? [legacy.score1, legacy.score2] : null;
        const championship = match.championship || match.championshipName || (match.championshipId ? String(match.championshipId).replace(/-/g, " ") : "");
        const isRumble = /rumble|battle.?royal|multi.?person|fatal.?4|triple.?threat/i.test(`${rawType} ${type}`) || participants.length > 4;
        const sideValue = p => String(p.side || p.teamId || p.sideLabel || "");
        const sideKeys = [...new Set(participants.map(sideValue).filter(Boolean))];
        const grouped = sideKeys.length > 1;
        const resultMarkup = p => {
            const result = participantResult(match, p);
            const scoreValue = p.score !== undefined && p.score !== null && p.score !== "" ? `<strong>${esc(p.score)}</strong>` : "";
            return `<span class="mw-match-participant__result">${scoreValue}<span class="mw-match-result is-${esc(result)}">${esc(resultLabel(result))}</span></span>`;
        };
        const participantMarkup = (p, index, asFaceoff = false) => {
            const tag = asFaceoff ? "div" : "li";
            const wrestler = wrestlerMap.get(String(p.wrestlerId || ""));
            const persona = personaMap.get(String(p.interpreterId || ""));
            const team = teamMap.get(String(p.teamId || ""));
            const name = personName(p, wrestlerMap);
            const image = imagePath(wrestler?.image || p.image || "");
            const result = participantResult(match, p);
            return `<${tag} class="mw-match-participant mw-match-participant--visual is-${esc(result)}">
                <div class="mw-match-participant__portrait">${image ? `<img src="${esc(image)}" alt="" loading="lazy" decoding="async" onerror="this.hidden=true;this.parentElement.classList.add('is-empty')">` : ""}<span aria-hidden="true">${esc(name.split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase())}</span></div>
                <div class="mw-match-participant__identity"><a class="mw-match-wrestler" href="superstar.html?id=${encodeURIComponent(p.wrestlerId || "")}">${esc(name)}</a>${team ? `<a class="mw-match-team-link" href="team.html?id=${encodeURIComponent(team.id)}">${esc(team.name)}</a>` : ""}${persona ? `<span class="mw-match-interpreter">Intérprete: <a href="persona.html?id=${encodeURIComponent(persona.id)}">${esc(persona.name)}</a></span>` : ""}</div>
                ${resultMarkup(p)}
            </${tag}>`;
        };
        let participantsMarkup = "";
        if (grouped) {
            participantsMarkup = `<div class="mw-match-sides">${sideKeys.map((key, i) => {
                const group = participants.filter(p => sideValue(p) === key);
                const team = teamMap.get(String(group.find(p => p.teamId)?.teamId || ""));
                return `<section class="mw-match-side"><h4>${esc(team?.name || group[0]?.sideLabel || `Equipo ${i+1}`)}</h4><ul>${group.map((p, j) => participantMarkup(p, j)).join("")}</ul></section>`;
            }).join('<span class="mw-match-vs" aria-label="contra">VS</span>')}</div>`;
        } else if (participants.length === 2 && !isRumble) {
            participantsMarkup = `<div class="mw-match-faceoff">${participantMarkup(participants[0], 0, true)}<div class="mw-match-faceoff__center"><span>VS</span>${score ? `<strong>${esc(score[0] ?? "—")} <i>–</i> ${esc(score[1] ?? "—")}</strong>` : `<strong class="is-pending">${hasResult(match) ? "RESULTADO" : "POR LUCHAR"}</strong>`}</div>${participantMarkup(participants[1], 1, true)}</div>`;
        } else {
            participantsMarkup = `<ul class="mw-match-participants${isRumble ? " is-multitudinous" : ""}">${participants.map((p, i) => participantMarkup(p, i)).join("") || "<li class=\"mw-match-no-participants\">Participantes pendientes de registrar.</li>"}</ul>${score ? `<div class="mw-match-scoreline"><strong>${esc(score[0] ?? "—")}</strong><span>–</span><strong>${esc(score[1] ?? "—")}</strong></div>` : ""}`;
        }
        const officials = asArray(match.officials).map(o => {
            const person = personaMap.get(String(o.interpreterId || ""));
            const role = ({ referee: "Árbitro", timekeeper: "Cronometrador", commentator: "Comentarista", other: "Oficial" })[o.role] || "Oficial";
            return `<li><b>${esc(role)}:</b> ${esc(person?.name || o.interpreterId || "No registrado")}</li>`;
        });
        const notes = match.notes ? `<p>${esc(match.notes)}</p>` : "";
        return `<article class="mw-match-card${isRumble ? " is-multitudinous" : ""}" data-match-type="${esc(rawType || "unknown")}">
            <header class="mw-match-card__header"><span class="mw-match-type">${esc(type)}${match.format ? ` · ${esc(match.format)}` : ""}</span><time>${esc(shortDate(match.date || ""))}</time></header>
            ${championship ? `<div class="mw-match-title-ribbon">${esc(championship)}${match.titleOnLine || match.forTitle ? " · EN JUEGO" : ""}</div>` : ""}
            ${match.position ? `<div class="mw-match-position">${esc(match.position)}</div>` : ""}
            ${participantsMarkup}
            <details class="mw-match-details"><summary>Detalles del combate</summary><div class="mw-match-details__content"><h4>Formato</h4><p>${esc(type)}${match.format ? ` (${esc(match.format)})` : ""}</p><h4>Participantes e intérpretes</h4><ul>${participants.map(p => { const wrestler = wrestlerMap.get(String(p.wrestlerId || "")); const persona = personaMap.get(String(p.interpreterId || "")); return `<li>${esc(wrestler?.name || p.name || p.wrestlerId || "Superestrella")}: ${esc(persona?.name || "intérprete no registrado")}</li>`; }).join("") || "<li>Sin participantes registrados.</li>"}</ul><h4>Árbitros y oficiales</h4><ul>${officials.join("") || "<li>No se registraron oficiales.</li>"}</ul>${notes}</div></details>
        </article>`;
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

        if (!catalog || !Array.isArray(catalog.categories)) {
            throw new Error("El catálogo de eventos no contiene una lista válida de categorías.");
        }
        if (!Array.isArray(matches) || !Array.isArray(wrestlers) || !Array.isArray(personas)) {
            throw new Error("Uno de los archivos principales de datos no tiene el formato esperado.");
        }

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

        // 3. Las tarjetas se generan aquí: event.html no depende de match-card.js.
        const wrestlerMap = new Map(asArray(wrestlers).map(item => [String(item.id), item]));
        const personaMap = new Map(asArray(personas).map(item => [String(item.id), item]));
        const teamMap = new Map(asArray(teams).map(item => [String(item.id), item]));
        const matchContext = { wrestlerMap, personaMap, teamMap };
        const cards = eventMatches.length
            ? eventMatches.map(match => renderMatchCard(match, matchContext)).join("")
            : `<div class="mw-event-empty"><h2>Cartelera pendiente</h2><p>Este evento todavía no tiene combates vinculados. No se inventan participantes ni resultados.</p></div>`;

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
        const finishedCount = eventMatches.filter(hasResult).length;

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
                        ${event.location ? `<span class="mw-event-detail-meta__location">${esc(event.location)}</span>` : ""}
                        ${event.venue ? `<span>${esc(event.venue)}</span>` : ""}
                        ${event.country ? `<span>${esc(event.country)}</span>` : ""}
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

        // Acento visual por marca/categoría; el resto de la página conserva la identidad global.
        const brandKey = norm([event.brand, event.categoryId, event.categoryName, event.type].join(" "));
        const themes = [
            { test: /raw/, color: "#e83b46", rgb: "232, 59, 70" },
            { test: /smack.?down/, color: "#168cff", rgb: "22, 140, 255" },
            { test: /nxt/, color: "#f4c542", rgb: "244, 197, 66" },
            { test: /aew/, color: "#e7e7e7", rgb: "231, 231, 231" },
            { test: /aaa/, color: "#d52c36", rgb: "213, 44, 54" },
            { test: /tna/, color: "#ef3038", rgb: "239, 48, 56" },
            { test: /speed/, color: "#00d5ff", rgb: "0, 213, 255" },
            { test: /ple|premium/, color: "#ffcf52", rgb: "255, 207, 82" },
            { test: /special/, color: "#a98aff", rgb: "169, 138, 255" }
        ];
        const theme = themes.find(item => item.test.test(brandKey));
        if (theme) {
            document.body.style.setProperty("--event-accent", theme.color);
            document.body.style.setProperty("--event-accent-rgb", theme.rgb);
        }

        // Permite que otros scripts conozcan el evento cargado.
        main.dataset.eventId = String(event.id);
        main.dataset.eventCategory = String(event.categoryId || "");

    } catch (error) {
        console.error("[MI WRESTLING] Error al cargar el evento:", error);

        renderEmpty(
            "NO SE PUDO CARGAR EL EVENTO",
            error.message || "Ocurrió un error al leer los archivos de datos."
        );
    }
})();
