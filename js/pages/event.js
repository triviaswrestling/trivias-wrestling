
/* ==========================================================
   MI WRESTLING 2.0 — EVENTO INDIVIDUAL
   Collision Match Cards · Responsive · Data-driven
   Compatible con:
   - Singles, Tag Team, Trios, 4v4 y 5v5
   - Triple Threat, Fatal 4-Way y combates múltiples
   - Royal Rumble y Elimination Chamber
   - Resultados, campeonatos y estipulaciones
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
        if (!url || /^(javascript|data|vbscript):/i.test(url)) return "";
        return url;
    }

    function firstValue(...values) {
        return values.find(value =>
            value !== undefined &&
            value !== null &&
            str(value) !== ""
        );
    }

    function safeColor(value) {
        const color = str(value);
        if (
            /^#[0-9a-f]{3,8}$/i.test(color) ||
            /^rgba?\(\s*[\d.%\s,]+\)$/i.test(color) ||
            /^hsla?\(\s*[\d.%\s,deg]+\)$/i.test(color)
        ) return color;
        return "";
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
                console.warn("[MI WRESTLING] Archivo opcional no disponible:", path);
                return [];
            }
            throw error;
        }
    }

    function dateValue(value) {
        if (!value) return null;

        const raw = str(value);
        const date = new Date(
            /^\d{4}-\d{2}-\d{2}$/.test(raw)
                ? `${raw}T00:00:00Z`
                : raw
        );

        return Number.isNaN(date.getTime()) ? null : date;
    }

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
        firstValue(event?.name, event?.title, event?.id, "Evento sin nombre");

    const eventDate = event =>
        firstValue(event?.date, event?.startDate, event?.scheduledDate, "");

    const eventUrl = event =>
        `event.html?id=${encodeURIComponent(event.id)}`;

    const categoryName = event =>
        firstValue(event?.categoryName, event?.brand, event?.type, "Evento");

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
       Prioridad: logo específico, nunca confundirlo con póster.
       ====================================================== */

    function getEventLogo(event) {
        return safeUrl(firstValue(
            event.logo,
            event.logoUrl,
            event.eventLogo,
            event.logoImage,
            event.imageLogo,
            event.brandLogo,
            event.logoWebp,
            event.image
        ));
    }

    function eventLogoMarkup(event) {
        const logo = getEventLogo(event);

        return `
            <div class="mw-event-logo${logo ? " has-logo" : ""}">
                ${logo ? `
                    <img
                        src="${esc(logo)}"
                        alt="Logo de ${esc(eventName(event))}"
                        fetchpriority="high"
                        decoding="async"
                        onerror="this.hidden=true;this.parentElement.classList.remove('has-logo')">
                    <span class="mw-event-logo__fallback">
                        ${esc(eventName(event))}
                    </span>
                ` : `
                    <span class="mw-event-logo__fallback">
                        ${esc(eventName(event))}
                    </span>
                `}
            </div>`;
    }

    function timelineCard(event, currentId) {
        const image = getEventLogo(event);
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
                            decoding="async"
                            onerror="this.hidden=true">
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

        function item(event, label, arrow, right = false) {
            if (!event) return "<span></span>";

            return `
                <a href="${eventUrl(event)}" ${right ? 'class="is-next"' : ""}>
                    ${!right ? `<span class="mw-event-nav-arrow">${arrow}</span>` : ""}
                    <span class="mw-event-nav-copy">
                        <small>${label}</small>
                        <strong>${esc(eventName(event))}</strong>
                    </span>
                    ${right ? `<span class="mw-event-nav-arrow">${arrow}</span>` : ""}
                </a>`;
        }

        return `
            <nav class="mw-event-timeline-nav" aria-label="Navegación entre eventos">
                ${item(previous, "EVENTO ANTERIOR", "←")}
                ${item(next, "EVENTO SIGUIENTE", "→", true)}
            </nav>`;
    }

    /* ======================================================
       RESULTADOS
       ====================================================== */

    const validResults = ["win", "loss", "draw", "no-contest"];

    function winnerIds(match) {
        const values = [
            ...arr(match.winnerIds),
            ...(match.winnerId != null ? [match.winnerId] : [])
        ];

        return values.map(String);
    }

    function participantResult(match, participant) {
        const explicit = norm(participant.result);

        if (validResults.includes(explicit)) return explicit;

        const winners = winnerIds(match);
        const participantIds = [
            participant.wrestlerId,
            participant.id
        ].filter(value => value != null).map(String);

        if (winners.length && participantIds.length) {
            return participantIds.some(id => winners.includes(id))
                ? "win"
                : "loss";
        }

        const global = norm(match.result);

        if (global === "draw") return "draw";
        if (global === "no-contest") return "no-contest";

        return "pending";
    }

    function hasResult(match) {
        if (
            ["draw", "no-contest"].includes(norm(match.result)) ||
            winnerIds(match).length > 0
        ) return true;

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
        const global = norm(match.result);

        if (global === "draw" ||
            participants.some(p => participantResult(match, p) === "draw")) {
            return "EMPATE";
        }

        if (global === "no-contest" ||
            participants.some(p => participantResult(match, p) === "no-contest")) {
            return "SIN RESULTADO";
        }

        return hasResult(match) ? "RESULTADO OFICIAL" : "POR LUCHAR";
    }

    /* ======================================================
       PARTICIPANTES
       ====================================================== */

    function getWrestler(participant, context) {
        return context.wrestlerMap.get(str(participant.wrestlerId)) ||
            context.wrestlerMap.get(str(participant.wrestler?.id)) ||
            null;
    }

    function getPersona(participant, context) {
        return context.personaMap.get(str(
            participant.personaId ||
            participant.alterEgoId ||
            participant.alteregoId ||
            participant.interpreterId ||
            participant.persona?.id
        )) || null;
    }

    function participantInfo(participant, context) {
        const wrestler = getWrestler(participant, context);
        const persona = getPersona(participant, context);

        const name = firstValue(
            participant.displayName,
            participant.name,
            participant.personaName,
            persona?.name,
            participant.wrestlerName,
            wrestler?.name,
            participant.wrestlerId,
            "Superestrella sin vincular"
        );

        return { wrestler, persona, name };
    }

    function participantImage(participant, context) {
        const wrestler = getWrestler(participant, context);
        const persona = getPersona(participant, context);

        return safeUrl(firstValue(
            participant.render,
            participant.renderImage,
            participant.webp,
            participant.imageWebp,
            participant.portrait,
            participant.image,
            persona?.render,
            persona?.renderImage,
            persona?.webp,
            persona?.image,
            wrestler?.render,
            wrestler?.renderImage,
            wrestler?.webp,
            wrestler?.imageWebp,
            wrestler?.portrait,
            wrestler?.image
        ));
    }

    function initials(name) {
        return str(name).split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0])
            .join("")
            .toUpperCase() || "?";
    }

    function wrestlerHref(participant) {
        const id = str(participant.wrestlerId);
        return id ? `superstar.html?id=${encodeURIComponent(id)}` : "";
    }

    function portraitMarkup(participant, context, index, compact = false) {
        const info = participantInfo(participant, context);
        const image = participantImage(participant, context);
        const result = participantResult(context.match, participant);
        const href = wrestlerHref(participant);
        const wrestlerName = info.wrestler?.name;
        const personaName = info.persona?.name;

        const nameMarkup = href
            ? `<a class="mw-match-fighter__name" href="${href}">${esc(info.name)}</a>`
            : `<strong class="mw-match-fighter__name">${esc(info.name)}</strong>`;

        return `
            <div
                class="mw-match-fighter${compact ? " is-compact" : ""} ${resultClass(result)}"
                data-result="${esc(result)}"
                data-fighter-index="${index}">
                <div class="mw-match-fighter__render">
                    ${image ? `
                        <img
                            src="${esc(image)}"
                            alt="${esc(info.name)}"
                            loading="lazy"
                            decoding="async"
                            onerror="this.hidden=true;this.parentElement.classList.add('has-fallback')">
                    ` : ""}
                    <span class="mw-match-fighter__fallback">
                        ${esc(initials(info.name))}
                    </span>
                </div>
                <div class="mw-match-fighter__identity">
                    ${nameMarkup}
                    ${personaName && personaName !== wrestlerName ? `
                        <span class="mw-match-fighter__persona">${esc(personaName)}</span>
                    ` : ""}
                    ${result !== "pending" ? `
                        <span class="mw-match-fighter__result">${esc(resultLabel(result))}</span>
                    ` : ""}
                </div>
            </div>`;
    }

    /* ======================================================
       TIPO DE COMBATE Y AGRUPACIÓN DE EQUIPOS
       ====================================================== */

    function matchType(match, participants) {
        const raw = norm(match.type);
        const format = norm(match.format);
        const all = `${raw} ${format}`;

        if (/royal.?rumble/.test(all)) return "ROYAL RUMBLE";
        if (/battle.?royal/.test(all)) return "BATTLE ROYAL";
        if (/elimination.?chamber/.test(all)) return "ELIMINATION CHAMBER";
        if (/fatal.?5|five.?way|5.?way/.test(all)) return "FATAL 5-WAY";
        if (/fatal.?4|four.?way|4.?way/.test(all)) return "FATAL 4-WAY";
        if (/triple.?threat|3.?way/.test(all)) return "TRIPLE THREAT";
        if (/ladder/.test(all)) return "LADDER MATCH";
        if (/iron.?man/.test(all)) return "IRON MAN MATCH";
        if (/handicap/.test(all)) return "HANDICAP MATCH";
        if (/war.?games/.test(all)) return "WAR GAMES";
        if (/tag|team|trios|six.?man|eight.?man|ten.?man/.test(all)) {
            return participants.length > 2 ? "TAG TEAM MATCH" : "TAG TEAM";
        }
        if (/multi.?person/.test(all)) return "COMBATE MÚLTIPLE";
        if (participants.length === 2) return "SINGLES MATCH";
        if (participants.length === 3) return "TRIPLE THREAT";
        if (participants.length === 4) return "FATAL 4-WAY";

        return str(match.type || "COMBATE").replace(/-/g, " ").toUpperCase();
    }

    function explicitSides(participants) {
        const groups = new Map();

        participants.forEach((participant, index) => {
            const key = str(
                participant.side ??
                participant.teamId ??
                participant.team?.id ??
                participant.teamName ??
                ""
            );

            if (!key) return;

            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push({ participant, index });
        });

        return [...groups.entries()].map(([key, items]) => ({
            key,
            items,
            label: str(
                items[0]?.participant.sideLabel ||
                items[0]?.participant.teamName ||
                items[0]?.participant.team?.name ||
                ""
            )
        }));
    }

    function makeSides(match, participants) {
        const explicit = explicitSides(participants);

        if (explicit.length === 2) return explicit;
        if (explicit.length > 2) return [];

        const all = norm(`${match.type || ""} ${match.format || ""}`);
        const isTeamMatch =
            /tag|team|trios|six.?man|eight.?man|ten.?man|war.?games/.test(all) ||
            /^\s*[2-9]\s*v\s*[2-9]\s*$/.test(norm(match.format));

        if (!isTeamMatch || participants.length < 4 || participants.length % 2 !== 0) {
            return [];
        }

        const half = participants.length / 2;

        return [
            {
                key: "team-left",
                label: str(match.team1Name || match.side1Name || "EQUIPO 1"),
                items: participants.slice(0, half).map((participant, index) => ({
                    participant, index
                }))
            },
            {
                key: "team-right",
                label: str(match.team2Name || match.side2Name || "EQUIPO 2"),
                items: participants.slice(half).map((participant, index) => ({
                    participant, index: index + half
                }))
            }
        ];
    }

    function isFreeForAll(match) {
        return /royal.?rumble|battle.?royal|elimination.?chamber|triple.?threat|fatal.?4|fatal.?5|five.?way|four.?way|3.?way|4.?way/.test(
            norm(`${match.type || ""} ${match.format || ""}`)
        );
    }

    /* ======================================================
       MARCADOR ÚNICO
       Una sola zona central; las filas inferiores solo muestran
       el resultado, no repiten las puntuaciones.
       ====================================================== */

    function scoreData(match) {
        const raw = match.sideScores ?? match.score;

        if (Array.isArray(raw) && raw.length >= 2) {
            return [raw[0], raw[1]];
        }

        if (raw && typeof raw === "object") {
            const first = raw.red ?? raw.home ?? raw.side1 ?? raw.team1;
            const second = raw.blue ?? raw.away ?? raw.side2 ?? raw.team2;

            if (first != null && second != null) return [first, second];
        }

        const legacy = match.legacy || {};

        if (legacy.score1 != null && legacy.score2 != null) {
            return [legacy.score1, legacy.score2];
        }

        if (match.score1 != null && match.score2 != null) {
            return [match.score1, match.score2];
        }

        return null;
    }

    function scoreMarkup(value) {
        return value == null || value === ""
            ? `<span class="mw-match-score__empty">—</span>`
            : `<strong class="mw-match-score__value">${esc(value)}</strong>`;
    }

    function centerMarkup(match, participants, scores, hasSides) {
        const status = resultText(match, participants);
        const hasOfficialScore = Boolean(scores);

        return `
            <div class="mw-match-center" aria-label="${esc(status)}">
                <span class="mw-match-center__versus">
                    ${hasOfficialScore ? "FINAL" : "VS"}
                </span>
                ${hasOfficialScore ? `
                    <div class="mw-match-center__score">
                        ${scoreMarkup(scores[0])}
                        <span class="mw-match-center__separator">:</span>
                        ${scoreMarkup(scores[1])}
                    </div>
                ` : `
                    <span class="mw-match-center__status">
                        ${esc(status)}
                    </span>
                `}
            </div>`;
    }

    /* ======================================================
       ESCENA GRÁFICA 16:9
       Renders a ambos lados, nombres debajo y centro despejado.
       ====================================================== */

    function sideMarkup(side, context, sideIndex) {
        const members = side.items.map(item =>
            portraitMarkup(item.participant, context, item.index, side.items.length > 3)
        ).join("");

        return `
            <div class="mw-match-side mw-match-side--${sideIndex === 0 ? "left" : "right"}"
                 data-side="${esc(side.key)}">
                ${side.label ? `
                    <span class="mw-match-side__label">${esc(side.label)}</span>
                ` : ""}
                <div class="mw-match-side__renders">
                    ${members}
                </div>
            </div>`;
    }

    function singlesLayout(match, participants, context, scores) {
        return `
            <div class="mw-match-art mw-match-art--singles">
                <div class="mw-match-art__background" aria-hidden="true"></div>
                <div class="mw-match-side mw-match-side--left">
                    <div class="mw-match-side__renders">
                        ${portraitMarkup(participants[0], context, 0)}
                    </div>
                </div>
                ${centerMarkup(match, participants, scores, false)}
                <div class="mw-match-side mw-match-side--right">
                    <div class="mw-match-side__renders">
                        ${portraitMarkup(participants[1], context, 1)}
                    </div>
                </div>
            </div>`;
    }

    function teamLayout(match, participants, context, sides, scores) {
        return `
            <div class="mw-match-art mw-match-art--teams"
                 data-team-size="${Math.max(sides[0].items.length, sides[1].items.length)}">
                <div class="mw-match-art__background" aria-hidden="true"></div>
                ${sideMarkup(sides[0], context, 0)}
                ${centerMarkup(match, participants, scores, true)}
                ${sideMarkup(sides[1], context, 1)}
            </div>`;
    }

    function multiLayout(match, participants, context) {
        const all = norm(`${match.type || ""} ${match.format || ""}`);
        const rumble = /rumble|battle.?royal/.test(all);
        const chamber = /elimination.?chamber/.test(all);
        const triple = /triple.?threat|3.?way/.test(all) || participants.length === 3;
        const fourWay = /fatal.?4|four.?way|4.?way/.test(all) || participants.length === 4;

        const mode = rumble
            ? "royal-rumble"
            : chamber
                ? "elimination-chamber"
                : triple
                    ? "triple-threat"
                    : fourWay
                        ? "fatal-four-way"
                        : "multi";

        return `
            <div class="mw-match-art mw-match-art--multi is-${mode}"
                 data-participant-count="${participants.length}">
                <div class="mw-match-art__background" aria-hidden="true"></div>
                <div class="mw-match-multi-grid">
                    ${participants.map((participant, index) =>
                        portraitMarkup(participant, context, index, participants.length > 4)
                    ).join("")}
                </div>
                <div class="mw-match-multi-label">
                    ${esc(matchType(match, participants))}
                </div>
            </div>`;
    }

    /* ======================================================
       CAMPEONATO Y ESTIPULACIÓN
       ====================================================== */

    function championshipName(match, context) {
        const direct = firstValue(
            match.championshipName,
            match.titleName,
            match.championship?.name,
            typeof match.championship === "string" ? match.championship : ""
        );

        if (direct) return str(direct);

        const id = str(match.championshipId || match.titleId);
        if (!id) return "";

        const title = context.championshipMap.get(id);

        return str(title?.name || title?.title || id.replace(/-/g, " "));
    }

    function isTitleMatch(match) {
        return Boolean(
            match.isChampionshipMatch ||
            match.titleOnLine ||
            match.forTitle ||
            match.championship?.isOnLine ||
            match.championshipId ||
            match.titleId
        );
    }

    function championshipMarkup(match, context) {
        const name = championshipName(match, context);
        if (!name || !isTitleMatch(match)) return "";

        return `
            <div class="mw-match-title-ribbon">
                <span class="mw-match-title-ribbon__icon" aria-hidden="true">★</span>
                <span class="mw-match-title-ribbon__name">${esc(name)}</span>
                <span class="mw-match-title-ribbon__status">EN JUEGO</span>
            </div>`;
    }

    function stipulationNames(match, context) {
        const ids = [
            ...arr(match.stipulationIds),
            ...(match.stipulationId ? [match.stipulationId] : [])
        ];

        return ids.map(id => {
            const item = context.stipulationMap.get(str(id));
            return item?.name || item?.title || str(id).replace(/-/g, " ");
        });
    }

    /* ======================================================
       RESUMEN INFERIOR
       No repite el marcador central.
       ====================================================== */

    function resultRows(match, participants, context) {
        return `
            <div class="mw-match-results" data-has-result="${hasResult(match)}">
                ${participants.map(participant => {
                    const info = participantInfo(participant, context);
                    const result = participantResult(match, participant);

                    return `
                        <div class="mw-match-result-row ${resultClass(result)}"
                             data-result="${esc(result)}">
                            <span class="mw-match-result-row__name">${esc(info.name)}</span>
                            <span class="mw-match-result-row__status">${esc(resultLabel(result))}</span>
                        </div>`;
                }).join("")}
            </div>`;
    }

    function detailsMarkup(match, participants, context, type) {
        const officials = arr(match.officials).map(official => {
            const persona = context.personaMap.get(str(official.interpreterId));
            const role = ({
                referee: "Árbitro",
                timekeeper: "Cronometrador",
                commentator: "Comentarista"
            })[norm(official.role)] || "Oficial";

            return `<li><b>${esc(role)}:</b> ${esc(persona?.name || official.name || "No registrado")}</li>`;
        }).join("");

        const stipulations = stipulationNames(match, context);
        const notes = str(match.notes);

        return `
            <details class="mw-match-details">
                <summary class="mw-match-details__summary">
                    <span>DETALLES DEL COMBATE</span>
                    <span class="mw-match-details__icon" aria-hidden="true"></span>
                </summary>
                <div class="mw-match-details__content">
                    <div class="mw-match-details__meta">
                        <p><b>Formato:</b> ${esc(type)}${match.format ? ` · ${esc(match.format)}` : ""}</p>
                        ${match.date ? `<p><b>Fecha:</b> ${esc(shortDate(match.date))}</p>` : ""}
                        ${stipulations.length ? `<p><b>Estipulación:</b> ${esc(stipulations.join(", "))}</p>` : ""}
                    </div>

                    <h4>Participantes</h4>
                    <ul class="mw-match-details__participants">
                        ${participants.map(participant => {
                            const info = participantInfo(participant, context);
                            return `<li>${esc(info.name)}<span>${esc(resultLabel(participantResult(match, participant)))}</span></li>`;
                        }).join("") || "<li>Sin participantes registrados.</li>"}
                    </ul>

                    <h4>Oficiales</h4>
                    <ul>${officials || "<li>No se registraron oficiales.</li>"}</ul>

                    ${notes ? `<div class="mw-match-details__notes">${esc(notes)}</div>` : ""}
                </div>
            </details>`;
    }

    /* ======================================================
       MATCH CARD COMPLETA
       ====================================================== */

    function renderMatchCard(match, context) {
        const participants = arr(match.participants).filter(participant =>
            !participant.role || norm(participant.role) === "competitor"
        );

        const type = matchType(match, participants);
        const sides = makeSides(match, participants);
        const scores = scoreData(match);
        const all = norm(`${match.type || ""} ${match.format || ""}`);

        let visual;

        if (
            participants.length === 2 &&
            !sides.length &&
            !isFreeForAll(match)
        ) {
            visual = singlesLayout(match, participants, context, scores);
        } else if (sides.length === 2 && !isFreeForAll(match)) {
            visual = teamLayout(match, participants, context, sides, scores);
        } else {
            visual = multiLayout(match, participants, context);
        }

        const matchNumber = firstValue(match.order, match.positionOrder, "");
        const date = match.date ? shortDate(match.date) : "";

        return `
            <article
                class="mw-match-card ${sides.length ? "is-tag" : ""}"
                data-match-id="${esc(match.id || "")}"
                data-match-type="${esc(match.type || "unknown")}"
                data-participant-count="${participants.length}"
                data-format="${esc(match.format || "")}">

                <header class="mw-match-card__header">
                    <span class="mw-match-card__number">
                        ${matchNumber !== "" ? `MATCH ${esc(matchNumber)}` : "COMBATE"}
                    </span>
                    <span class="mw-match-card__type">
                        ${esc(type)}${match.format ? ` · ${esc(match.format)}` : ""}
                    </span>
                    ${date ? `<time class="mw-match-card__date">${esc(date)}</time>` : ""}
                </header>

                ${championshipMarkup(match, context)}

                <div class="mw-match-card__graphic">
                    ${visual}
                    ${resultRows(match, participants, context)}
                </div>

                ${detailsMarkup(match, participants, context, type)}
            </article>`;
    }

    /* ======================================================
       TEMAS VISUALES
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

        const themes = [
            { test: /\bnxt\b/, accent: "#d6ff35", secondary: "#ffffff", rgb: "214,255,53", name: "nxt" },
            { test: /smack.?down/, accent: "#168cff", secondary: "#ffffff", rgb: "22,140,255", name: "smackdown" },
            { test: /\braw\b/, accent: "#e32636", secondary: "#ffffff", rgb: "227,38,54", name: "raw" },
            { test: /evolve/, accent: "#b8ff3b", secondary: "#ffffff", rgb: "184,255,59", name: "evolve" },
            { test: /speed/, accent: "#00d5ff", secondary: "#ffffff", rgb: "0,213,255", name: "speed" },
            { test: /collision/, accent: "#e32636", secondary: "#ffffff", rgb: "227,38,54", name: "collision" },
            { test: /dynamite/, accent: "#37d7ff", secondary: "#ffffff", rgb: "55,215,255", name: "dynamite" },
            { test: /\baew\b/, accent: "#37d7ff", secondary: "#ffffff", rgb: "55,215,255", name: "aew" },
            { test: /\bple\b|premium.?live|wrestlemania/, accent: "#ffcc54", secondary: "#ffffff", rgb: "255,204,84", name: "ple" },
            { test: /special|especial/, accent: "#a98aff", secondary: "#ffffff", rgb: "169,138,255", name: "special" }
        ];

        const theme = themes.find(item => item.test.test(identity)) || {
            accent: "#e32636",
            secondary: "#ffffff",
            rgb: "227,38,54",
            name: "default"
        };

        const accent = safeColor(event.themeAccent || event.color);
        const secondary = safeColor(event.themeSecondary);
        const rgb = str(event.themeAccentRgb).match(/^[\d\s,.]+$/)
            ? str(event.themeAccentRgb)
            : theme.rgb;

        const root = document.documentElement;

        root.style.setProperty("--event-accent", accent || theme.accent);
        root.style.setProperty("--event-accent-rgb", rgb);
        root.style.setProperty("--event-secondary", secondary || theme.secondary);

        main.dataset.eventTheme = str(event.theme || theme.name);
        main.dataset.eventBrand = str(event.brand || "");
    }

    /* ======================================================
       CARGA Y MAPEO DE DATOS
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
            throw new Error("Uno de los archivos principales no tiene el formato esperado.");
        }

        const events = [];

        for (const category of catalog.categories) {
            for (const season of arr(category.seasons)) {
                if (!season.path) continue;

                try {
                    const data = await get(season.path);

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

        const category = catalog.categories.find(item =>
            String(item.id) === String(event.categoryId)
        );

        const eventMatches = matches
            .filter(match =>
                String(match.eventId || "") === String(event.id) ||
                arr(event.matchIds).some(matchId => String(matchId) === String(match.id))
            )
            .sort((a, b) =>
                Number(a.order ?? a.positionOrder ?? 9999) -
                Number(b.order ?? b.positionOrder ?? 9999) ||
                String(a.id).localeCompare(String(b.id))
            );

        const wrestlerMap = new Map(wrestlers.map(item => [String(item.id), item]));
        const personaMap = new Map(personas.map(item => [String(item.id), item]));
        const teamMap = new Map(arr(teams).map(item => [String(item.id), item]));

        const context = {
            wrestlerMap,
            personaMap,
            teamMap,
            championshipMap: new Map(),
            stipulationMap: new Map()
        };

        const cards = eventMatches.length
            ? eventMatches.map(match =>
                renderMatchCard(match, { ...context, match })
            ).join("")
            : `
                <div class="mw-event-empty">
                    <h2>Cartelera pendiente</h2>
                    <p>Este evento todavía no tiene combates vinculados.</p>
                </div>`;

        const backCategory = event.categoryId || category?.id || "ple";
        const backLink =
            `events.html?category=${encodeURIComponent(backCategory)}` +
            (event.year ? `&year=${encodeURIComponent(event.year)}` : "");

        const categoryEvents = events
            .filter(item =>
                String(item.categoryId || "") === String(event.categoryId || "")
            )
            .filter(item => dateValue(eventDate(item)))
            .sort((a, b) =>
                dateValue(eventDate(a)) - dateValue(eventDate(b))
            );

        const currentIndex = categoryEvents.findIndex(item =>
            String(item.id) === String(event.id)
        );

        const previous = currentIndex > 0 ? categoryEvents[currentIndex - 1] : null;
        const next = currentIndex >= 0 && currentIndex < categoryEvents.length - 1
            ? categoryEvents[currentIndex + 1]
            : null;

        const timelineEvents = currentIndex >= 0
            ? categoryEvents.slice(Math.max(0, currentIndex - 2), currentIndex + 3)
            : [];

        const timelineMarkup = timelineEvents.length
            ? timelineEvents.map(item => timelineCard(item, event.id)).join("")
            : `
                <div class="mw-event-empty">
                    <p>No hay otros eventos fechados en esta categoría.</p>
                </div>`;

        const matchCount = eventMatches.length;
        const finishedCount = eventMatches.filter(hasResult).length;

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
                        ${esc(category?.name || event.categoryName || "MI WRESTLING")}
                        <span>/</span>
                        ${esc(event.year || String(event.date || "").slice(0, 4) || "ARCHIVO")}
                    </div>

                    <h1>${esc(eventName(event))}</h1>

                    <p class="mw-event-description">
                        ${esc(event.description || "La cartelera oficial, los resultados y la historia del evento.")}
                    </p>

                    <div class="mw-event-detail-meta">
                        <span>${esc(formatDate(eventDate(event)))}</span>
                        <span>${esc(event.type || category?.name || "Evento")}</span>
                        <span>${esc(event.status || event.mode || "Archivo")}</span>
                        ${event.brand ? `<span>${esc(event.brand)}</span>` : ""}
                        ${event.location ? `<span>${esc(event.location)}</span>` : ""}
                        ${event.venue ? `<span>${esc(event.venue)}</span>` : ""}
                    </div>
                </div>
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
                    <span>${matchCount} ${matchCount === 1 ? "combate" : "combates"}</span>
                </div>
                <div class="mw-event-matches" id="mw-event-matches">
                    ${cards}
                </div>
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

        applyEventTheme(event);

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
