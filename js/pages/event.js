
/* ==========================================================
   MI WRESTLING 2.0 — EVENTO INDIVIDUAL
   Collision-inspired Match Cards
   Singles · Tag Team · Triple Threat · Fatal 4-Way
   ========================================================== */

(async function () {
    "use strict";

    const main =
        document.querySelector("[data-event-main]") ||
        document.querySelector("main.site-main");

    if (!main) return;

    const $ = (selector, root = main) => root.querySelector(selector);
    const arr = value => Array.isArray(value) ? value : [];
    const str = value => String(value ?? "").trim();
    const norm = value => str(value).toLowerCase();

    const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    })[char]);

    function safeUrl(value) {
        const url = str(value);
        if (!url || /^(javascript|data|vbscript):/i.test(url)) return "";
        return url;
    }

    async function get(path, optional = false) {
        try {
            const response = await fetch(path, {
                headers: { Accept: "application/json" }
            });

            if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            if (optional) {
                console.warn("[MI WRESTLING] Archivo opcional no disponible:", path);
                return [];
            }
            throw error;
        }
    }

    const dateValue = value => {
        if (!value) return null;
        const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
        return Number.isNaN(date.getTime()) ? null : date;
    };

    function formatDate(value, fallback = "Fecha pendiente") {
        const date = dateValue(value);
        return date
            ? new Intl.DateTimeFormat("es-AR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                timeZone: "UTC"
            }).format(date)
            : fallback;
    }

    function shortDate(value) {
        const date = dateValue(value);
        return date
            ? new Intl.DateTimeFormat("es-AR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                timeZone: "UTC"
            }).format(date)
            : "Fecha pendiente";
    }

    const eventName = event =>
        event?.name || event?.title || event?.id || "Evento sin nombre";

    const eventDate = event => event?.date || event?.startDate || "";

    const eventImage = event =>
        typeof event?.image === "string" ? safeUrl(event.image) : "";

    const eventUrl = event =>
        `event.html?id=${encodeURIComponent(event.id)}`;

    const categoryName = event =>
        event?.categoryName || event?.brand || event?.type || "Evento";

    function renderEmpty(title, message, backLink = "events.html") {
        main.innerHTML = `
            <section class="mw-event-empty">
                <h1>${esc(title)}</h1>
                <p>${esc(message)}</p>
                <a class="mw-event-back" href="${esc(backLink)}">
                    ← VOLVER AL ARCHIVO
                </a>
            </section>`;
    }

    function posterMarkup(event) {
        const image = eventImage(event);

        return `
            <div class="mw-event-poster${image ? "" : " is-empty"}">
                ${image ? `
                    <img src="${esc(image)}"
                         alt="Imagen promocional de ${esc(eventName(event))}"
                         fetchpriority="high"
                         decoding="async">
                ` : ""}
                <div class="mw-event-poster__fallback">
                    <span>MI WRESTLING</span>
                    <strong>${esc(eventName(event))}</strong>
                </div>
            </div>`;
    }

    function timelineCard(event, currentId) {
        const image = eventImage(event);
        const current = String(event.id) === String(currentId);

        return `
            <a class="mw-event-timeline-card${current ? " is-current" : ""}"
               href="${eventUrl(event)}"
               ${current ? 'aria-current="page"' : ""}>
                <div class="mw-event-timeline-card__image">
                    ${image
                        ? `<img src="${esc(image)}" alt=""
                               loading="lazy" decoding="async">`
                        : `<span class="mw-event-timeline-card__fallback">
                               ${esc(eventName(event))}
                           </span>`}
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
            </a>`;
    }

    function timelineNavigation(previous, next) {
        if (!previous && !next) return "";

        const item = (event, label, arrow, right = false) => event
            ? `<a href="${eventUrl(event)}" ${right ? 'class="is-next"' : ""}>
                    ${right ? "" : `<span class="mw-event-nav-arrow">${arrow}</span>`}
                    <span class="mw-event-nav-copy">
                        <small>${label}</small>
                        <strong>${esc(eventName(event))}</strong>
                    </span>
                    ${right ? `<span class="mw-event-nav-arrow">${arrow}</span>` : ""}
               </a>`
            : "<span></span>";

        return `
            <nav class="mw-event-timeline-nav" aria-label="Navegación entre eventos">
                ${item(previous, "EVENTO ANTERIOR", "←")}
                ${item(next, "EVENTO SIGUIENTE", "→", true)}
            </nav>`;
    }

    const validResults = ["win", "loss", "draw", "no-contest"];

    function winnerIds(match) {
        return arr(match.winnerIds).map(String);
    }

    function participantResult(match, participant) {
        const explicit = norm(participant.result);

        if (validResults.includes(explicit)) return explicit;

        const winners = winnerIds(match);
        const id = str(participant.wrestlerId);

        if (winners.length && id) {
            return winners.includes(id) ? "win" : "loss";
        }

        return "pending";
    }

    function hasResult(match) {
        return arr(match.participants).some(p =>
            validResults.includes(norm(p.result))
        ) || winnerIds(match).length > 0 ||
            ["draw", "no-contest"].includes(norm(match.result));
    }

    function participantName(participant, wrestlerMap, personaMap) {
        const wrestler = wrestlerMap.get(str(participant.wrestlerId));
        const persona = personaMap.get(
            str(participant.personaId || participant.interpreterId)
        );

        return {
            wrestler,
            persona,
            name: persona?.name ||
                participant.wrestlerName ||
                participant.name ||
                wrestler?.name ||
                participant.wrestlerId ||
                "Superestrella sin vincular"
        };
    }

    function participantImage(participant, wrestlerMap, personaMap) {
        const wrestler = wrestlerMap.get(str(participant.wrestlerId));
        const persona = personaMap.get(
            str(participant.personaId || participant.interpreterId)
        );

        // Si existe una imagen específica para esta aparición/persona,
        // tiene prioridad sobre la imagen base del luchador.
        return safeUrl(
            participant.image ||
            persona?.image ||
            wrestler?.image ||
            wrestler?.webp ||
            ""
        );
    }

    function initials(name) {
        return str(name).split(/\s+/).filter(Boolean)
            .slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";
    }

    function portraitMarkup(participant, context, index, variant = "") {
        const { wrestlerMap, personaMap, teamMap, match } = context;
        const info = participantName(participant, wrestlerMap, personaMap);
        const image = participantImage(participant, wrestlerMap, personaMap);
        const result = participantResult(match, participant);
        const team = teamMap.get(str(participant.teamId));

        const wrestlerId = str(participant.wrestlerId);
        const href = wrestlerId
            ? `superstar.html?id=${encodeURIComponent(wrestlerId)}`
            : "";

        return `
            <div class="mw-match-participant ${variant}"
                 data-result="${esc(result)}">
                <div class="mw-match-participant__portrait">
                    ${image ? `
                        <img src="${esc(image)}"
                             alt="${esc(info.name)}"
                             loading="lazy"
                             decoding="async">
                    ` : ""}
                    <span class="mw-match-participant__fallback">
                        ${esc(initials(info.name))}
                    </span>
                </div>

                <div class="mw-match-participant__identity">
                    ${href
                        ? `<a class="mw-match-wrestler" href="${href}">
                               ${esc(info.name)}
                           </a>`
                        : `<strong class="mw-match-wrestler">
                               ${esc(info.name)}
                           </strong>`}

                    ${team?.name ? `
                        <span class="mw-match-team-name">${esc(team.name)}</span>
                    ` : ""}

                    ${info.persona?.name && info.persona.name !== info.wrestler?.name
                        ? `<span class="mw-match-interpreter">
                               ${esc(info.persona.name)}
                           </span>`
                        : ""}
                </div>
            </div>`;
    }

    function scoreData(match, participants, grouped) {
        const raw = match.sideScores ?? match.score;
        const legacy = match.legacy || {};

        if (Array.isArray(raw) && raw.length >= 2) {
            return [raw[0], raw[1]];
        }

        if (raw && typeof raw === "object") {
            const first = raw.red ?? raw.home ?? raw.side1 ?? raw.team1;
            const second = raw.blue ?? raw.away ?? raw.side2 ?? raw.team2;
            if (first != null && second != null) return [first, second];
        }

        if (
            legacy.score1 != null &&
            legacy.score2 != null
        ) {
            return [legacy.score1, legacy.score2];
        }

        // No se fabrican marcadores: si no existen cifras, se muestran
        // los resultados oficiales o el estado pendiente.
        return null;
    }

    function resultText(match, participants) {
        if (norm(match.result) === "draw" ||
            participants.some(p => participantResult(match, p) === "draw")) {
            return "EMPATE";
        }

        if (norm(match.result) === "no-contest" ||
            participants.some(p => participantResult(match, p) === "no-contest")) {
            return "SIN RESULTADO";
        }

        if (hasResult(match)) return "RESULTADO OFICIAL";
        return "POR LUCHAR";
    }

    function matchType(match, participants) {
        const raw = norm(match.type);
        const format = norm(match.format);

        if (/royal.?rumble/.test(raw)) return "ROYAL RUMBLE";
        if (/battle.?royal/.test(raw)) return "BATTLE ROYAL";
        if (/fatal.?4|fatal4|four.?way/.test(raw)) return "FATAL 4-WAY";
        if (/triple.?threat/.test(raw)) return "TRIPLE THREAT";
        if (/tag|team/.test(raw) && participants.length === 4) return "TAG TEAM";
        if (/trios|six.?man/.test(raw)) return "TRIOS";
        if (/singles|one.?on.?one/.test(raw)) return "SINGLES";
        if (/multi.?person/.test(raw)) return "COMBATE MULTIPLE";
        if (format === "2v2") return "TAG TEAM";
        if (participants.length === 2) return "SINGLES";
        if (participants.length === 3) return "TRIPLE THREAT";
        if (participants.length === 4) return "FATAL 4-WAY";
        return str(match.type || "COMBATE").replace(/-/g, " ").toUpperCase();
    }

    function makeSides(participants) {
        const buckets = new Map();

        participants.forEach((participant, index) => {
            const key = str(participant.side || participant.teamId);

            if (!key) return;

            if (!buckets.has(key)) buckets.set(key, []);
            buckets.get(key).push({ participant, index });
        });

        const sides = [...buckets.entries()].map(([key, items]) => ({
            key,
            items,
            label: str(items[0]?.participant.sideLabel) ||
                `EQUIPO ${buckets.size}`
        }));

        // Solo se considera un combate por equipos si hay dos bandos claros.
        return sides.length === 2 && sides.every(side => side.items.length > 0)
            ? sides
            : [];
    }

    function teamCardMarkup(side, context, sideIndex, scores) {
        const { teamMap } = context;
        const first = side.items[0]?.participant;
        const team = teamMap.get(str(first?.teamId));
        const label = team?.name || first?.sideLabel ||
            (sideIndex === 0 ? "ESQUINA ROJA" : "ESQUINA AZUL");

        const members = side.items.map(item =>
            portraitMarkup(item.participant, context, item.index, "is-team-member")
        ).join("");

        const score = scores?.[sideIndex];
        const results = side.items.map(item =>
            participantResult(context.match, item.participant)
        );

        const result = results.includes("win") ? "VICTORIA" :
            results.includes("draw") ? "EMPATE" :
            results.includes("no-contest") ? "SIN RESULTADO" :
            results.includes("loss") ? "DERROTA" : "PENDIENTE";

        return `
            <div class="mw-match-team">
                <div class="mw-match-team__portraits">
                    ${members}
                </div>
                <div class="mw-match-team__footer">
                    <strong class="mw-match-team__name">${esc(label)}</strong>
                    <div class="mw-match-team__score">
                        ${score != null && score !== ""
                            ? `<strong>${esc(score)}</strong>`
                            : ""}
                        <span class="mw-match-result is-${norm(result).replace(/\s+/g, "-")}">
                            ${esc(result)}
                        </span>
                    </div>
                </div>
            </div>`;
    }

    function renderMatchCard(match, context) {
        const participants = arr(match.participants).filter(p =>
            !p.role || norm(p.role) === "competitor"
        );

        const type = matchType(match, participants);
        const sides = makeSides(participants);
        const rawType = norm(match.type);
        const multi = /rumble|battle.?royal|fatal.?4|triple.?threat|multi.?person/i
            .test(`${rawType} ${type}`) ||
            (!sides.length && participants.length > 2);

        const scores = scoreData(match, participants, Boolean(sides.length));
        const championship = str(
            match.championshipName ||
            match.championship?.name ||
            (typeof match.championship === "string" ? match.championship : "") ||
            (match.championshipId ? match.championshipId.replace(/-/g, " ") : "")
        );

        const date = match.date ? shortDate(match.date) : "";
        const stipulations = arr(match.stipulationIds)
            .map(id => str(id).replace(/-/g, " "))
            .filter(Boolean);

        let visual = "";

        if (sides.length) {
            visual = `
                <div class="mw-match-tag-layout">
                    ${teamCardMarkup(sides[0], context, 0, scores)}
                    <div class="mw-match-faceoff__center">
                        <span>VS</span>
                        ${scores
                            ? `<strong>${esc(scores[0] ?? "—")}<i>–</i>${esc(scores[1] ?? "—")}</strong>`
                            : `<small>${esc(resultText(match, participants))}</small>`}
                    </div>
                    ${teamCardMarkup(sides[1], context, 1, scores)}
                </div>`;
        } else if (participants.length === 2) {
            visual = `
                <div class="mw-match-singles-layout">
                    ${portraitMarkup(participants[0], context, 0, "is-singles")}
                    <div class="mw-match-faceoff__center">
                        <span>VS</span>
                        ${scores
                            ? `<strong>${esc(scores[0] ?? "—")}<i>–</i>${esc(scores[1] ?? "—")}</strong>`
                            : `<small>${esc(resultText(match, participants))}</small>`}
                    </div>
                    ${portraitMarkup(participants[1], context, 1, "is-singles")}
                </div>`;
        } else {
            visual = `
                <div class="mw-match-multi-layout ${participants.length === 3 ? "is-triple" : ""}">
                    ${participants.map((p, i) =>
                        portraitMarkup(p, context, i, "is-multi")
                    ).join("") || `
                        <p class="mw-match-no-participants">
                            Participantes pendientes de registrar.
                        </p>`}
                </div>
                ${scores ? `
                    <div class="mw-match-multi-score">
                        <strong>${esc(scores[0] ?? "—")}</strong>
                        <span>–</span>
                        <strong>${esc(scores[1] ?? "—")}</strong>
                    </div>` : ""}`;
        }

        const officials = arr(match.officials).map(official => {
            const persona = context.personaMap.get(str(official.interpreterId));
            const role = ({
                referee: "Árbitro",
                timekeeper: "Cronometrador",
                commentator: "Comentarista"
            })[norm(official.role)] || "Oficial";

            return `<li><b>${esc(role)}:</b> ${esc(persona?.name || official.interpreterId || "No registrado")}</li>`;
        }).join("");

        const details = `
            <details class="mw-match-details">
                <summary>Detalles del combate</summary>
                <div class="mw-match-details__content">
                    <p><b>Formato:</b> ${esc(type)}${match.format ? ` · ${esc(match.format)}` : ""}</p>
                    ${stipulations.length
                        ? `<p><b>Estipulación:</b> ${esc(stipulations.join(", "))}</p>`
                        : ""}
                    <h4>Participantes</h4>
                    <ul>${participants.map(p => {
                        const info = participantName(p, context.wrestlerMap, context.personaMap);
                        return `<li>${esc(info.name)} — ${esc(resultLabel(participantResult(match, p)))}</li>`;
                    }).join("") || "<li>Sin participantes registrados.</li>"}</ul>
                    <h4>Oficiales</h4>
                    <ul>${officials || "<li>No se registraron oficiales.</li>"}</ul>
                    ${match.notes ? `<p>${esc(match.notes)}</p>` : ""}
                </div>
            </details>`;

        return `
            <article class="mw-match-card ${sides.length ? "is-tag" : ""} ${multi ? "is-multitudinous" : ""}"
                     data-match-type="${esc(rawType || "unknown")}">
                <header class="mw-match-card__header">
                    <span class="mw-match-type">${esc(type)}${match.format ? ` · ${esc(match.format)}` : ""}</span>
                    ${date ? `<time>${esc(date)}</time>` : ""}
                </header>

                ${championship ? `
                    <div class="mw-match-title-ribbon">
                        <span aria-hidden="true">★</span>
                        ${esc(championship)}
                        ${match.isChampionshipMatch || match.titleOnLine || match.forTitle
                            ? `<b>EN JUEGO</b>` : ""}
                    </div>` : ""}

                ${match.position ? `
                    <div class="mw-match-position">${esc(match.position)}</div>
                ` : ""}

                ${visual}
                ${details}
            </article>`;
    }

    function resultLabel(result) {
        return ({
            win: "Victoria",
            loss: "Derrota",
            draw: "Empate",
            "no-contest": "Sin resultado",
            pending: "Pendiente"
        })[result] || "Pendiente";
    }

    main.innerHTML = `<div class="mw-event-loading" role="status">PREPARANDO EL EVENTO…</div>`;

    try {
        const [catalog, matches, wrestlers, personas, teams, indexEvents] =
            await Promise.all([
                get("data/events/catalog.json"),
                get("data/matches/matches.json"),
                get("data/wrestlers/wrestlers.json"),
                get("data/personas/personas.json"),
                get("data/teams/teams.json", true),
                get("data/events/events.json", true)
            ]);

        if (!Array.isArray(catalog?.categories) ||
            !Array.isArray(matches) ||
            !Array.isArray(wrestlers) ||
            !Array.isArray(personas)) {
            throw new Error("Uno de los archivos principales no tiene el formato esperado.");
        }

        const events = [];
        const seasons = [];

        for (const category of catalog.categories) {
            for (const season of arr(category.seasons)) {
                try {
                    const data = await get(season.path);
                    seasons.push({ ...data, _path: season.path, _category: category });

                    for (const event of arr(data.events)) {
                        if (events.some(item => String(item.id) === String(event.id))) continue;

                        events.push({
                            ...event,
                            categoryId: event.categoryId || category.id,
                            categoryName: event.categoryName || category.name,
                            seasonId: event.seasonId || data.id,
                            year: event.year || data.year
                        });
                    }
                } catch (error) {
                    console.warn("[MI WRESTLING] No se pudo cargar temporada:", season.path, error);
                }
            }
        }

        for (const event of arr(indexEvents)) {
            if (!events.some(item => String(item.id) === String(event.id))) {
                events.push(event);
            }
        }

        const params = new URLSearchParams(location.search);
        const id = params.get("id");

        if (!id) {
            renderEmpty("FALTA EL EVENTO", "Abrí esta página desde una tarjeta del catálogo para cargar el evento correcto.");
            return;
        }

        const event = events.find(item => String(item.id) === String(id));

        if (!event) {
            renderEmpty("EVENTO NO ENCONTRADO", `No existe el ID "${id}" en los archivos de eventos.`);
            return;
        }

        const category = catalog.categories.find(item =>
            String(item.id) === String(event.categoryId)
        );

        const eventMatches = matches.filter(match =>
            String(match.eventId || "") === String(event.id) ||
            arr(event.matchIds).some(matchId => String(matchId) === String(match.id))
        ).sort((a, b) =>
            (Number(a.order ?? a.positionOrder ?? 9999) -
             Number(b.order ?? b.positionOrder ?? 9999)) ||
            String(a.id).localeCompare(String(b.id))
        );

        const backCategory = event.categoryId || category?.id || "ple";
        const backLink = `events.html?category=${encodeURIComponent(backCategory)}` +
            (event.year ? `&year=${encodeURIComponent(event.year)}` : "");

        const wrestlerMap = new Map(wrestlers.map(item => [String(item.id), item]));
        const personaMap = new Map(personas.map(item => [String(item.id), item]));
        const teamMap = new Map(arr(teams).map(item => [String(item.id), item]));

        const context = { wrestlerMap, personaMap, teamMap };

        const cards = eventMatches.length
            ? eventMatches.map(match => renderMatchCard(match, { ...context, match })).join("")
            : `<div class="mw-event-empty">
                    <h2>Cartelera pendiente</h2>
                    <p>Este evento todavía no tiene combates vinculados.</p>
               </div>`;

        const categoryEvents = events
            .filter(item => String(item.categoryId || "") === String(event.categoryId || ""))
            .filter(item => dateValue(eventDate(item)))
            .sort((a, b) => dateValue(eventDate(a)) - dateValue(eventDate(b)));

        const currentIndex = categoryEvents.findIndex(item =>
            String(item.id) === String(event.id)
        );

        const previous = currentIndex > 0 ? categoryEvents[currentIndex - 1] : null;
        const next = currentIndex >= 0 && currentIndex < categoryEvents.length - 1
            ? categoryEvents[currentIndex + 1] : null;

        const timelineEvents = currentIndex >= 0
            ? categoryEvents.slice(Math.max(0, currentIndex - 2), currentIndex + 3)
            : [];

        const timelineMarkup = timelineEvents.length
            ? timelineEvents.map(item => timelineCard(item, event.id)).join("")
            : `<div class="mw-event-empty"><p>No hay otros eventos fechados en esta categoría.</p></div>`;

        const matchCount = eventMatches.length;
        const finishedCount = eventMatches.filter(hasResult).length;

        main.innerHTML = `
            <a class="mw-event-back" href="${esc(backLink)}">← VOLVER AL ARCHIVO</a>

            <header class="page-hero mw-event-detail-hero">
                <div class="mw-event-detail-hero__copy">
                    <div class="mw-event-eyebrow">
                        ${esc(category?.name || event.categoryName || "MI WRESTLING")}
                        <span>/</span>
                        ${esc(event.year || String(event.date || "").slice(0, 4) || "ARCHIVO")}
                    </div>

                    <h1>${esc(eventName(event))}</h1>

                    <p class="mw-event-description">
                        ${esc(event.description || "La cartelera oficial, los resultados y la historia del evento.")}
                    </p>

                    <div class="mw-event-detail-meta">
                        <span>${esc(formatDate(event.date))}</span>
                        <span>${esc(event.type || category?.name || "Evento")}</span>
                        <span>${esc(event.status || event.mode || "Archivo")}</span>
                        ${event.brand ? `<span>${esc(event.brand)}</span>` : ""}
                        ${event.location ? `<span>${esc(event.location)}</span>` : ""}
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

            <section class="mw-event-section" aria-labelledby="mw-event-card-heading">
                <div class="mw-event-section-heading">
                    <div>
                        <span class="mw-event-kicker">OFFICIAL MATCH CARD</span>
                        <h2 id="mw-event-card-heading">Cartelera y resultados</h2>
                    </div>
                    <span>${matchCount} combate${matchCount === 1 ? "" : "s"}</span>
                </div>
                <div class="mw-event-matches">${cards}</div>
            </section>

            <section class="mw-event-section" aria-labelledby="mw-event-timeline-heading">
                <div class="mw-event-section-heading">
                    <div>
                        <span class="mw-event-kicker">EVENT HISTORY</span>
                        <h2 id="mw-event-timeline-heading">Cronología de eventos</h2>
                    </div>
                    <span>${esc(category?.name || event.categoryName || "Archivo")}</span>
                </div>
                <div class="mw-event-timeline">${timelineMarkup}</div>
                ${timelineNavigation(previous, next)}
            </section>`;

        document.title = `${eventName(event)} | MI WRESTLING 2.0`;

        const brandKey = norm([
            event.brand, event.categoryId, event.categoryName, event.type
        ].join(" "));

        const themes = [
            { test: /raw/, color: "#e83b46", rgb: "232,59,70" },
            { test: /smack.?down/, color: "#168cff", rgb: "22,140,255" },
            { test: /nxt/, color: "#f4c542", rgb: "244,197,66" },
            { test: /collision/, color: "#e63c45", rgb: "230,60,69" },
            { test: /dynamite/, color: "#37d7ff", rgb: "55,215,255" },
            { test: /aew/, color: "#dce6f4", rgb: "220,230,244" },
            { test: /aaa/, color: "#d52c36", rgb: "213,44,54" },
            { test: /tna/, color: "#ef3038", rgb: "239,48,56" },
            { test: /speed/, color: "#00d5ff", rgb: "0,213,255" },
            { test: /ple|premium/, color: "#ffcf52", rgb: "255,207,82" },
            { test: /special/, color: "#a98aff", rgb: "169,138,255" }
        ];

        const theme = themes.find(item => item.test.test(brandKey));

        if (theme) {
            document.body.style.setProperty("--event-accent", theme.color);
            document.body.style.setProperty("--event-accent-rgb", theme.rgb);
        }

        main.dataset.eventId = String(event.id);
        main.dataset.eventCategory = String(event.categoryId || "");

    } catch (error) {
        console.error("[MI WRESTLING] Error al cargar el evento:", error);
        renderEmpty("NO SE PUDO CARGAR EL EVENTO", error.message || "Ocurrió un error al leer los archivos de datos.");
    }
})();
