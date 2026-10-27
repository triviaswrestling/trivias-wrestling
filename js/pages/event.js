
/* ==========================================================
   MI WRESTLING 2.0 — EVENTO INDIVIDUAL
   Collision-inspired Match Cards
   16:9 · Mobile-first · Singles · Teams · Multi-person
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
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);

    function safeUrl(value) {
        const url = str(value);

        if (!url || /^(javascript|data|vbscript):/i.test(url)) {
            return "";
        }

        return url;
    }

    async function get(path, optional = false) {
        try {
            const response = await fetch(path, {
                headers: { Accept: "application/json" }
            });

            if (!response.ok) {
                throw new Error(`${path}: HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            if (optional) {
                console.warn(
                    "[MI WRESTLING] Archivo opcional no disponible:",
                    path
                );
                return [];
            }

            throw error;
        }
    }

    const dateValue = value => {
        if (!value) return null;

        const date = new Date(
            `${String(value).slice(0, 10)}T00:00:00Z`
        );

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
        event?.name ||
        event?.title ||
        event?.id ||
        "Evento sin nombre";

    const eventDate = event => event?.date || event?.startDate || "";

    const eventUrl = event =>
        `event.html?id=${encodeURIComponent(event.id)}`;

    const categoryName = event =>
        event?.categoryName ||
        event?.brand ||
        event?.type ||
        "Evento";

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

    /* ======================================================
       IDENTIDAD DEL EVENTO
       Logo separado del póster promocional.
       ====================================================== */

    function eventLogoMarkup(event) {
        const logo = safeUrl(
            event.logo ||
            event.logoUrl ||
            event.brandLogo ||
            ""
        );

        return `
            <div class="mw-event-logo${logo ? " has-logo" : ""}">
                ${logo ? `
                    <img
                        src="${esc(logo)}"
                        alt="Logo de ${esc(eventName(event))}"
                        fetchpriority="high"
                        decoding="async">
                ` : `
                    <span class="mw-event-logo__fallback">
                        ${esc(eventName(event))}
                    </span>
                `}
            </div>`;
    }

    function timelineCard(event, currentId) {
        const image = safeUrl(event.logo || event.image || "");
        const current = String(event.id) === String(currentId);

        return `
            <a
                class="mw-event-timeline-card${current ? " is-current" : ""}"
                href="${eventUrl(event)}"
                ${current ? 'aria-current="page"' : ""}>

                <div class="mw-event-timeline-card__image">
                    ${image ? `
                        <img
                            src="${esc(image)}"
                            alt=""
                            loading="lazy"
                            decoding="async">
                    ` : `
                        <span class="mw-event-timeline-card__fallback">
                            ${esc(eventName(event))}
                        </span>
                    `}
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

        const item = (event, label, arrow, right = false) =>
            event ? `
                <a
                    href="${eventUrl(event)}"
                    ${right ? 'class="is-next"' : ""}>

                    ${right ? "" : `
                        <span class="mw-event-nav-arrow">${arrow}</span>
                    `}

                    <span class="mw-event-nav-copy">
                        <small>${label}</small>
                        <strong>${esc(eventName(event))}</strong>
                    </span>

                    ${right ? `
                        <span class="mw-event-nav-arrow">${arrow}</span>
                    ` : ""}
                </a>
            ` : "<span></span>";

        return `
            <nav
                class="mw-event-timeline-nav"
                aria-label="Navegación entre eventos">

                ${item(previous, "EVENTO ANTERIOR", "←")}
                ${item(next, "EVENTO SIGUIENTE", "→", true)}

            </nav>`;
    }

    /* ======================================================
       RESULTADOS
       ====================================================== */

    const validResults = [
        "win",
        "loss",
        "draw",
        "no-contest"
    ];

    function winnerIds(match) {
        const values = arr(match.winnerIds);

        if (match.winnerId != null) {
            values.push(match.winnerId);
        }

        return values.map(String);
    }

    function participantResult(match, participant) {
        const explicit = norm(participant.result);

        if (validResults.includes(explicit)) {
            return explicit;
        }

        const winners = winnerIds(match);
        const id = str(participant.wrestlerId);

        if (winners.length && id) {
            return winners.includes(id) ? "win" : "loss";
        }

        const globalResult = norm(match.result);

        if (globalResult === "draw") return "draw";
        if (globalResult === "no-contest") return "no-contest";

        return "pending";
    }

    function hasResult(match) {
        if (
            ["draw", "no-contest"].includes(norm(match.result)) ||
            winnerIds(match).length > 0
        ) {
            return true;
        }

        return arr(match.participants).some(participant =>
            validResults.includes(norm(participant.result))
        );
    }

    function resultLabel(result) {
        return ({
            win: "VICTORIA",
            loss: "DERROTA",
            draw: "EMPATE",
            "no-contest": "SIN RESULTADO",
            pending: "PENDIENTE"
        })[result] || "PENDIENTE";
    }

    function resultClass(result) {
        return ({
            win: "is-winner",
            loss: "is-loser",
            draw: "is-draw",
            "no-contest": "is-no-contest",
            pending: "is-pending"
        })[result] || "is-pending";
    }

    function resultText(match, participants) {
        const globalResult = norm(match.result);

        if (
            globalResult === "draw" ||
            participants.some(p => participantResult(match, p) === "draw")
        ) {
            return "EMPATE";
        }

        if (
            globalResult === "no-contest" ||
            participants.some(p =>
                participantResult(match, p) === "no-contest"
            )
        ) {
            return "SIN RESULTADO";
        }

        if (hasResult(match)) return "RESULTADO OFICIAL";

        return "POR LUCHAR";
    }

    /* ======================================================
       PARTICIPANTES E IMÁGENES
       ====================================================== */

    function participantName(participant, context) {
        const wrestler = context.wrestlerMap.get(
            str(participant.wrestlerId)
        );

        const persona = context.personaMap.get(
            str(participant.personaId || participant.interpreterId)
        );

        return {
            wrestler,
            persona,
            name:
                participant.name ||
                persona?.name ||
                participant.wrestlerName ||
                wrestler?.name ||
                participant.wrestlerId ||
                "Superestrella sin vincular"
        };
    }

    function participantImage(participant, context) {
        const wrestler = context.wrestlerMap.get(
            str(participant.wrestlerId)
        );

        const persona = context.personaMap.get(
            str(participant.personaId || participant.interpreterId)
        );

        return safeUrl(
            participant.image ||
            persona?.image ||
            wrestler?.webp ||
            wrestler?.image ||
            ""
        );
    }

    function initials(name) {
        return str(name)
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0])
            .join("")
            .toUpperCase() || "?";
    }

    function portraitMarkup(participant, context, index) {
        const info = participantName(participant, context);
        const image = participantImage(participant, context);
        const result = participantResult(context.match, participant);

        const wrestlerId = str(participant.wrestlerId);

        const href = wrestlerId
            ? `superstar.html?id=${encodeURIComponent(wrestlerId)}`
            : "";

        const personaName = info.persona?.name;
        const wrestlerName = info.wrestler?.name;

        return `
            <div
                class="mw-match-fighter"
                data-result="${esc(result)}"
                data-fighter-index="${index}">

                <div class="mw-match-fighter__render">
                    ${image ? `
                        <img
                            src="${esc(image)}"
                            alt="${esc(info.name)}"
                            loading="lazy"
                            decoding="async">
                    ` : `
                        <span class="mw-match-fighter__fallback">
                            ${esc(initials(info.name))}
                        </span>
                    `}
                </div>

                <div class="mw-match-fighter__identity">
                    ${href ? `
                        <a
                            class="mw-match-fighter__name"
                            href="${href}">
                            ${esc(info.name)}
                        </a>
                    ` : `
                        <strong class="mw-match-fighter__name">
                            ${esc(info.name)}
                        </strong>
                    `}

                    ${personaName && personaName !== wrestlerName ? `
                        <span class="mw-match-fighter__persona">
                            ${esc(personaName)}
                        </span>
                    ` : ""}
                </div>
            </div>`;
    }

    /* ======================================================
       FORMATO DE COMBATE
       ====================================================== */

    function matchType(match, participants) {
        const raw = norm(match.type);
        const format = norm(match.format);

        if (/royal.?rumble/.test(raw)) return "ROYAL RUMBLE";
        if (/battle.?royal/.test(raw)) return "BATTLE ROYAL";
        if (/elimination.?chamber/.test(raw)) return "ELIMINATION CHAMBER";
        if (/fatal.?5|five.?way/.test(raw)) return "FATAL 5-WAY";
        if (/fatal.?4|four.?way/.test(raw)) return "FATAL 4-WAY";
        if (/triple.?threat/.test(raw)) return "TRIPLE THREAT";
        if (/ladder/.test(raw)) return "LADDER MATCH";
        if (/iron.?man/.test(raw)) return "IRON MAN MATCH";
        if (/handicap/.test(raw)) return "HANDICAP MATCH";
        if (/tag|team/.test(raw) && participants.length > 2) {
            return "TAG TEAM";
        }

        if (/trios|six.?man/.test(raw)) return "TRIOS MATCH";
        if (/multi.?person/.test(raw)) return "COMBATE MÚLTIPLE";
        if (format === "2v2") return "TAG TEAM";
        if (format === "3v3") return "TRIOS MATCH";
        if (participants.length === 2) return "SINGLES MATCH";
        if (participants.length === 3) return "TRIPLE THREAT";
        if (participants.length === 4) return "FATAL 4-WAY";

        return str(match.type || "COMBATE")
            .replace(/-/g, " ")
            .toUpperCase();
    }

    /*
     * Se agrupan los participantes por side o teamId.
     * Ejemplo:
     * side: "red"  -> bando izquierdo
     * side: "blue" -> bando derecho
     *
     * Si no hay dos bandos claros, se usa el formato
     * de combate múltiple.
     */

    function makeSides(participants) {
        const buckets = new Map();

        participants.forEach((participant, index) => {
            const key = str(
                participant.side ||
                participant.teamId ||
                ""
            );

            if (!key) return;

            if (!buckets.has(key)) {
                buckets.set(key, []);
            }

            buckets.get(key).push({
                participant,
                index
            });
        });

        const sides = [...buckets.entries()].map(([key, items]) => ({
            key,
            items,
            label:
                str(items[0]?.participant.sideLabel) ||
                str(items[0]?.participant.teamName) ||
                ""
        }));

        return sides.length === 2 &&
            sides.every(side => side.items.length > 0)
            ? sides
            : [];
    }

    /* ======================================================
       MARCADOR
       No inventar puntuaciones ausentes.
       ====================================================== */

    function scoreData(match) {
        const raw = match.sideScores ?? match.score;
        const legacy = match.legacy || {};

        if (Array.isArray(raw) && raw.length >= 2) {
            return [raw[0], raw[1]];
        }

        if (raw && typeof raw === "object") {
            const first =
                raw.red ?? raw.home ?? raw.side1 ?? raw.team1;

            const second =
                raw.blue ?? raw.away ?? raw.side2 ?? raw.team2;

            if (first != null && second != null) {
                return [first, second];
            }
        }

        if (legacy.score1 != null && legacy.score2 != null) {
            return [legacy.score1, legacy.score2];
        }

        return null;
    }

    function participantScore(match, participant, index) {
        if (participant.score != null) {
            return participant.score;
        }

        const scores = arr(match.participantScores);

        if (scores[index] != null) {
            return scores[index];
        }

        return null;
    }

    function scoreMarkup(value) {
        return value == null || value === ""
            ? `<span class="mw-match-score__empty">—</span>`
            : `<strong class="mw-match-score__value">${esc(value)}</strong>`;
    }

    /* ======================================================
       COMPOSICIÓN GRÁFICA
       La zona visual se divide en dos bandos.
       Cada bando puede contener uno o varios renders.
       ====================================================== */

    function sideMarkup(side, context, sideIndex) {
        const members = side.items.map(item =>
            portraitMarkup(item.participant, context, item.index)
        ).join("");

        return `
            <div
                class="mw-match-side mw-match-side--${sideIndex === 0 ? "left" : "right"}"
                data-side="${esc(side.key)}">

                <div class="mw-match-side__renders">
                    ${members}
                </div>

            </div>`;
    }

    function centerMarkup(match, participants, scores) {
        const status = resultText(match, participants);

        return `
            <div class="mw-match-center" aria-label="${esc(status)}">
                <span class="mw-match-center__versus">VS</span>

                ${scores ? `
                    <div class="mw-match-center__score">
                        ${scoreMarkup(scores[0])}
                        <span>–</span>
                        ${scoreMarkup(scores[1])}
                    </div>
                ` : `
                    <span class="mw-match-center__status">
                        ${esc(status)}
                    </span>
                `}
            </div>`;
    }

    function singlesLayout(match, participants, context, scores) {
        return `
            <div class="mw-match-stage mw-match-stage--singles">
                <div class="mw-match-stage__side">
                    ${portraitMarkup(participants[0], context, 0)}
                </div>

                ${centerMarkup(match, participants, scores)}

                <div class="mw-match-stage__side">
                    ${portraitMarkup(participants[1], context, 1)}
                </div>
            </div>`;
    }

    function tagLayout(match, participants, context, sides, scores) {
        return `
            <div class="mw-match-stage mw-match-stage--teams">
                ${sideMarkup(sides[0], context, 0)}

                ${centerMarkup(match, participants, scores)}

                ${sideMarkup(sides[1], context, 1)}
            </div>`;
    }

    /*
     * Triple Threat, Fatal 4-Way, Royal Rumble y otras luchas
     * sin dos bandos definidos.
     *
     * Se permite una lista visual de altura variable para
     * formatos grandes, en vez de encoger todos los renders
     * hasta volverlos ilegibles.
     */

    function multiLayout(match, participants, context) {
        const rumble = /rumble|battle.?royal/i.test(
            `${match.type || ""} ${match.format || ""}`
        );

        const elimination = /elimination.?chamber/i.test(
            `${match.type || ""} ${match.format || ""}`
        );

        const mode = rumble
            ? "royal-rumble"
            : elimination
                ? "elimination-chamber"
                : participants.length === 3
                    ? "triple-threat"
                    : participants.length === 4
                        ? "fatal-four-way"
                        : "multi";

        return `
            <div
                class="mw-match-stage mw-match-stage--multi is-${mode}"
                data-participant-count="${participants.length}">

                <div class="mw-match-multi-grid">
                    ${participants.map((participant, index) => `
                        <div class="mw-match-multi-item">
                            ${portraitMarkup(participant, context, index)}
                        </div>
                    `).join("")}

                    ${participants.length ? "" : `
                        <p class="mw-match-no-participants">
                            Participantes pendientes de registrar.
                        </p>
                    `}
                </div>

                ${arr(match.participants).length > 0 && rumble ? `
                    <div class="mw-match-format-label">
                        TODOS CONTRA TODOS
                    </div>
                ` : ""}
            </div>`;
    }

    /* ======================================================
       CAMPEONATO EN JUEGO
       ====================================================== */

    function championshipName(match, context) {
        const direct =
            match.championshipName ||
            match.championship?.name ||
            (typeof match.championship === "string"
                ? match.championship
                : "");

        if (direct) return str(direct);

        const id = str(match.championshipId);

        if (!id) return "";

        const championship = context.championshipMap?.get(id);

        return championship?.name ||
            championship?.title ||
            id.replace(/-/g, " ");
    }

    function isTitleMatch(match) {
        return Boolean(
            match.isChampionshipMatch ||
            match.titleOnLine ||
            match.forTitle ||
            match.championship?.isOnLine
        );
    }

    function championshipMarkup(match, context) {
        const name = championshipName(match, context);

        if (!name || !isTitleMatch(match)) return "";

        return `
            <div class="mw-match-title-ribbon">
                <span class="mw-match-title-ribbon__icon" aria-hidden="true">
                    ★
                </span>

                <span class="mw-match-title-ribbon__name">
                    ${esc(name)}
                </span>

                <span class="mw-match-title-ribbon__status">
                    EN JUEGO
                </span>
            </div>`;
    }

    /* ======================================================
       FILA DE RESULTADOS
       Debajo de los renders: nombres y marcadores.
       ====================================================== */

    function resultRows(match, participants, context) {
        const scores = scoreData(match);

        return `
            <div
                class="mw-match-results"
                data-has-result="${hasResult(match)}">

                ${participants.map((participant, index) => {
                    const info = participantName(participant, context);
                    const result = participantResult(match, participant);

                    const score = participantScore(
                        match,
                        participant,
                        index
                    );

                    return `
                        <div
                            class="mw-match-result-row ${resultClass(result)}"
                            data-result="${esc(result)}">

                            <span class="mw-match-result-row__name">
                                ${esc(info.name)}
                            </span>

                            <span class="mw-match-result-row__score">
                                ${score != null
                                    ? esc(score)
                                    : scores && participants.length === 2
                                        ? esc(scores[index] ?? "—")
                                        : "—"}
                            </span>

                            <span class="mw-match-result-row__status">
                                ${esc(resultLabel(result))}
                            </span>

                        </div>`;
                }).join("")}
            </div>`;
    }

    /* ======================================================
       DETALLES DESPLEGABLES
       Funciona con el elemento nativo <details>.
       ====================================================== */

    function stipulationNames(match, context) {
        return arr(match.stipulationIds).map(id => {
            const item = context.stipulationMap?.get(str(id));

            return item?.name ||
                item?.title ||
                str(id).replace(/-/g, " ");
        });
    }

    function detailsMarkup(match, participants, context, type) {
        const officials = arr(match.officials).map(official => {
            const persona = context.personaMap.get(
                str(official.interpreterId)
            );

            const role = ({
                referee: "Árbitro",
                timekeeper: "Cronometrador",
                commentator: "Comentarista"
            })[norm(official.role)] || "Oficial";

            return `
                <li>
                    <b>${esc(role)}:</b>
                    ${esc(persona?.name || official.name || "No registrado")}
                </li>`;
        }).join("");

        const stipulations = stipulationNames(match, context);

        const notes = str(match.notes);

        return `
            <details class="mw-match-details">
                <summary class="mw-match-details__summary">
                    <span>DETALLES DEL COMBATE</span>

                    <span
                        class="mw-match-details__icon"
                        aria-hidden="true"></span>
                </summary>

                <div class="mw-match-details__content">

                    <div class="mw-match-details__meta">
                        <p>
                            <b>Formato:</b>
                            ${esc(type)}
                            ${match.format ? ` · ${esc(match.format)}` : ""}
                        </p>

                        ${match.date ? `
                            <p>
                                <b>Fecha:</b>
                                ${esc(shortDate(match.date))}
                            </p>
                        ` : ""}

                        ${stipulations.length ? `
                            <p>
                                <b>Estipulación:</b>
                                ${esc(stipulations.join(", "))}
                            </p>
                        ` : ""}
                    </div>

                    <h4>Participantes</h4>

                    <ul class="mw-match-details__participants">
                        ${participants.map(participant => {
                            const info = participantName(participant, context);

                            return `
                                <li>
                                    ${esc(info.name)}
                                    <span>
                                        ${esc(resultLabel(
                                            participantResult(match, participant)
                                        ))}
                                    </span>
                                </li>`;
                        }).join("") || "<li>Sin participantes registrados.</li>"}
                    </ul>

                    <h4>Oficiales</h4>

                    <ul>
                        ${officials || "<li>No se registraron oficiales.</li>"}
                    </ul>

                    ${notes ? `
                        <div class="mw-match-details__notes">
                            ${esc(notes)}
                        </div>
                    ` : ""}

                </div>
            </details>`;
    }

    /* ======================================================
       MATCH CARD PRINCIPAL
       ====================================================== */

    function renderMatchCard(match, context) {
        const participants = arr(match.participants).filter(participant =>
            !participant.role ||
            norm(participant.role) === "competitor"
        );

        const type = matchType(match, participants);
        const sides = makeSides(participants);
        const scores = scoreData(match);

        const rawType = norm(match.type);
        const date = match.date ? shortDate(match.date) : "";

        const isSingles = participants.length === 2 && !sides.length;

        let visual;

        if (isSingles) {
            visual = singlesLayout(
                match,
                participants,
                context,
                scores
            );
        } else if (sides.length === 2) {
            visual = tagLayout(
                match,
                participants,
                context,
                sides,
                scores
            );
        } else {
            visual = multiLayout(
                match,
                participants,
                context
            );
        }

        const matchNumber = match.order ??
            match.positionOrder ??
            "";

        return `
            <article
                class="mw-match-card ${sides.length ? "is-tag" : ""}"
                data-match-id="${esc(match.id || "")}"
                data-match-type="${esc(rawType || "unknown")}"
                data-participant-count="${participants.length}"
                data-format="${esc(match.format || "")}">

                <header class="mw-match-card__header">

                    <span class="mw-match-card__number">
                        ${matchNumber !== ""
                            ? `MATCH ${esc(matchNumber)}`
                            : "COMBATE"}
                    </span>

                    <span class="mw-match-card__type">
                        ${esc(type)}
                        ${match.format
                            ? ` · ${esc(match.format)}`
                            : ""}
                    </span>

                    ${date ? `
                        <time class="mw-match-card__date">
                            ${esc(date)}
                        </time>
                    ` : ""}

                </header>

                ${championshipMarkup(match, context)}

                <div class="mw-match-card__graphic">

                    ${visual}

                    ${resultRows(match, participants, context)}

                </div>

                ${detailsMarkup(
                    match,
                    participants,
                    context,
                    type
                )}

            </article>`;
    }

    /* ======================================================
       COLORES POR MARCA / EVENTO
       Los valores son personalizables desde los datos.
       ====================================================== */

    function applyEventTheme(event) {
        const identity = norm([
            event.brand,
            event.categoryId,
            event.categoryName,
            event.type,
            event.name,
            event.theme
        ].join(" "));

        /*
         * Los colores son variables visuales del sitio.
         * El CSS posterior debe usar --event-accent,
         * --event-accent-rgb y --event-secondary.
         */

        const themes = [
            {
                test: /\bnxt\b/,
                accent: "#d6ff35",
                secondary: "#ffffff",
                rgb: "214,255,53",
                name: "nxt"
            },
            {
                test: /smack.?down/,
                accent: "#168cff",
                secondary: "#ffffff",
                rgb: "22,140,255",
                name: "smackdown"
            },
            {
                test: /\braw\b/,
                accent: "#e32636",
                secondary: "#ffffff",
                rgb: "227,38,54",
                name: "raw"
            },
            {
                test: /evolve/,
                accent: "#b8ff3b",
                secondary: "#ffffff",
                rgb: "184,255,59",
                name: "evolve"
            },
            {
                test: /speed/,
                accent: "#00d5ff",
                secondary: "#ffffff",
                rgb: "0,213,255",
                name: "speed"
            },
            {
                test: /collision/,
                accent: "#e32636",
                secondary: "#ffffff",
                rgb: "227,38,54",
                name: "collision"
            },
            {
                test: /dynamite/,
                accent: "#e32636",
                secondary: "#ffffff",
                rgb: "227,38,54",
                name: "dynamite"
            },
            {
                test: /\baew\b/,
                accent: "#e32636",
                secondary: "#ffffff",
                rgb: "227,38,54",
                name: "aew"
            },
            {
                test: /\bple\b|premium.?live|wrestlemania/,
                accent: "#ffcc54",
                secondary: "#ffffff",
                rgb: "255,204,84",
                name: "ple"
            },
            {
                test: /special|especial/,
                accent: "#a98aff",
                secondary: "#ffffff",
                rgb: "169,138,255",
                name: "special"
            }
        ];

        const theme = themes.find(item => item.test.test(identity));

        /*
         * Si los datos del evento ya tienen colores explícitos,
         * esos valores tienen prioridad sobre los predeterminados.
         */

        const accent = safeUrl(event.themeAccent)
            ? ""
            : str(event.themeAccent || event.color || "");

        const rgb = str(event.themeAccentRgb || "");
        const secondary = str(event.themeSecondary || "");

        const chosen = theme || {
            accent: "#e32636",
            secondary: "#ffffff",
            rgb: "227,38,54",
            name: "default"
        };

        const root = document.documentElement;

        root.style.setProperty(
            "--event-accent",
            accent || chosen.accent
        );

        root.style.setProperty(
            "--event-accent-rgb",
            rgb || chosen.rgb
        );

        root.style.setProperty(
            "--event-secondary",
            secondary || chosen.secondary
        );

        main.dataset.eventTheme = str(event.theme || chosen.name);
        main.dataset.eventBrand = str(event.brand || "");
    }

    /* ======================================================
       CARGA DE DATOS
       Conserva las rutas actuales.
       ====================================================== */

    main.innerHTML = `
        <div class="mw-event-loading" role="status">
            PREPARANDO EL EVENTO…
        </div>`;

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
            get("data/teams/teams.json", true),
            get("data/events/events.json", true)
        ]);

        if (
            !Array.isArray(catalog?.categories) ||
            !Array.isArray(matches) ||
            !Array.isArray(wrestlers) ||
            !Array.isArray(personas)
        ) {
            throw new Error(
                "Uno de los archivos principales no tiene el formato esperado."
            );
        }

        const events = [];

        for (const category of catalog.categories) {
            for (const season of arr(category.seasons)) {
                try {
                    const data = await get(season.path);

                    for (const event of arr(data.events)) {
                        if (events.some(item =>
                            String(item.id) === String(event.id)
                        )) {
                            continue;
                        }

                        events.push({
                            ...event,
                            categoryId: event.categoryId || category.id,
                            categoryName:
                                event.categoryName || category.name,
                            seasonId: event.seasonId || data.id,
                            year: event.year || data.year
                        });
                    }
                } catch (error) {
                    console.warn(
                        "[MI WRESTLING] No se pudo cargar temporada:",
                        season.path,
                        error
                    );
                }
            }
        }

        for (const event of arr(indexEvents)) {
            if (!events.some(item =>
                String(item.id) === String(event.id)
            )) {
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

        const event = events.find(item =>
            String(item.id) === String(id)
        );

        if (!event) {
            renderEmpty(
                "EVENTO NO ENCONTRADO",
                `No existe el ID "${id}" en los archivos de eventos.`
            );
            return;
        }

        const category = catalog.categories.find(item =>
            String(item.id) === String(event.categoryId)
        );

        const eventMatches = matches
            .filter(match =>
                String(match.eventId || "") === String(event.id) ||
                arr(event.matchIds).some(matchId =>
                    String(matchId) === String(match.id)
                )
            )
            .sort((a, b) =>
                (
                    Number(a.order ?? a.positionOrder ?? 9999) -
                    Number(b.order ?? b.positionOrder ?? 9999)
                ) ||
                String(a.id).localeCompare(String(b.id))
            );

        const wrestlerMap = new Map(
            wrestlers.map(item => [String(item.id), item])
        );

        const personaMap = new Map(
            personas.map(item => [String(item.id), item])
        );

        const teamMap = new Map(
            arr(teams).map(item => [String(item.id), item])
        );

        /*
         * Estos mapas quedan preparados para integrarse con los
         * índices de campeonatos y estipulaciones cuando revisemos
         * sus rutas reales. No se solicitan archivos inexistentes.
         */

        const context = {
            wrestlerMap,
            personaMap,
            teamMap,
            championshipMap: new Map(),
            stipulationMap: new Map()
        };

        const cards = eventMatches.length
            ? eventMatches.map(match =>
                renderMatchCard(match, {
                    ...context,
                    match
                })
            ).join("")
            : `
                <div class="mw-event-empty">
                    <h2>Cartelera pendiente</h2>
                    <p>
                        Este evento todavía no tiene combates vinculados.
                    </p>
                </div>`;

        const backCategory = event.categoryId || category?.id || "ple";

        const backLink =
            `events.html?category=${encodeURIComponent(backCategory)}` +
            (event.year
                ? `&year=${encodeURIComponent(event.year)}`
                : "");

        const categoryEvents = events
            .filter(item =>
                String(item.categoryId || "") ===
                String(event.categoryId || "")
            )
            .filter(item => dateValue(eventDate(item)))
            .sort((a, b) =>
                dateValue(eventDate(a)) - dateValue(eventDate(b))
            );

        const currentIndex = categoryEvents.findIndex(item =>
            String(item.id) === String(event.id)
        );

        const previous = currentIndex > 0
            ? categoryEvents[currentIndex - 1]
            : null;

        const next = currentIndex >= 0 &&
            currentIndex < categoryEvents.length - 1
            ? categoryEvents[currentIndex + 1]
            : null;

        const timelineEvents = currentIndex >= 0
            ? categoryEvents.slice(
                Math.max(0, currentIndex - 2),
                currentIndex + 3
            )
            : [];

        const timelineMarkup = timelineEvents.length
            ? timelineEvents.map(item =>
                timelineCard(item, event.id)
            ).join("")
            : `
                <div class="mw-event-empty">
                    <p>
                        No hay otros eventos fechados en esta categoría.
                    </p>
                </div>`;

        const matchCount = eventMatches.length;
        const finishedCount = eventMatches.filter(hasResult).length;

        /* ==================================================
           RENDER FINAL DEL EVENTO
           ================================================== */

        main.innerHTML = `
            <a class="mw-event-back" href="${esc(backLink)}">
                ← VOLVER AL ARCHIVO
            </a>

            <header class="mw-event-detail-hero">

                <div class="mw-event-detail-hero__branding">
                    ${eventLogoMarkup(event)}
                </div>

                <div class="mw-event-detail-hero__copy">

                    <div class="mw-event-eyebrow">
                        ${esc(category?.name ||
                            event.categoryName ||
                            "MI WRESTLING")}

                        <span>/</span>

                        ${esc(
                            event.year ||
                            String(event.date || "").slice(0, 4) ||
                            "ARCHIVO"
                        )}
                    </div>

                    <h1>${esc(eventName(event))}</h1>

                    <p class="mw-event-description">
                        ${esc(
                            event.description ||
                            "La cartelera oficial, los resultados y la historia del evento."
                        )}
                    </p>

                    <div class="mw-event-detail-meta">
                        <span>${esc(formatDate(event.date))}</span>

                        <span>
                            ${esc(event.type || category?.name || "Evento")}
                        </span>

                        <span>
                            ${esc(event.status || event.mode || "Archivo")}
                        </span>

                        ${event.brand ? `
                            <span>${esc(event.brand)}</span>
                        ` : ""}

                        ${event.location ? `
                            <span>${esc(event.location)}</span>
                        ` : ""}

                        ${event.venue ? `
                            <span>${esc(event.venue)}</span>
                        ` : ""}
                    </div>

                </div>

            </header>

            <section
                class="mw-event-stats"
                aria-label="Resumen del evento">

                <div class="mw-event-stat">
                    <strong class="mw-event-stat__value">
                        ${matchCount}
                    </strong>
                    <span class="mw-event-stat__label">
                        Combates registrados
                    </span>
                </div>

                <div class="mw-event-stat">
                    <strong class="mw-event-stat__value">
                        ${finishedCount}
                    </strong>
                    <span class="mw-event-stat__label">
                        Con resultado registrado
                    </span>
                </div>

                <div class="mw-event-stat">
                    <strong class="mw-event-stat__value">
                        ${esc(event.year || "—")}
                    </strong>
                    <span class="mw-event-stat__label">
                        Año del evento
                    </span>
                </div>

            </section>

            <section
                class="mw-event-section"
                aria-labelledby="mw-event-card-heading">

                <div class="mw-event-section-heading">
                    <div>
                        <span class="mw-event-kicker">
                            OFFICIAL MATCH CARD
                        </span>

                        <h2 id="mw-event-card-heading">
                            Cartelera y resultados
                        </h2>
                    </div>

                    <span>
                        ${matchCount}
                        ${matchCount === 1 ? "combate" : "combates"}
                    </span>
                </div>

                <div class="mw-event-matches">
                    ${cards}
                </div>

            </section>

            <section
                class="mw-event-section"
                aria-labelledby="mw-event-timeline-heading">

                <div class="mw-event-section-heading">
                    <div>
                        <span class="mw-event-kicker">
                            EVENT HISTORY
                        </span>

                        <h2 id="mw-event-timeline-heading">
                            Cronología de eventos
                        </h2>
                    </div>

                    <span>
                        ${esc(category?.name ||
                            event.categoryName ||
                            "Archivo")}
                    </span>
                </div>

                <div class="mw-event-timeline">
                    ${timelineMarkup}
                </div>

                ${timelineNavigation(previous, next)}

            </section>`;

        document.title = `${eventName(event)} | MI WRESTLING 2.0`;

        applyEventTheme(event);

        main.dataset.eventId = String(event.id);
        main.dataset.eventCategory = String(event.categoryId || "");

    } catch (error) {
        console.error(
            "[MI WRESTLING] Error al cargar el evento:",
            error
        );

        renderEmpty(
            "NO SE PUDO CARGAR EL EVENTO",
            error.message ||
                "Ocurrió un error al leer los archivos de datos."
        );
    }
})();
