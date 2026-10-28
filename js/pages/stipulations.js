

(() => {
    "use strict";

    const categories = [
        {
            id: "standard",
            name: "Combates clásicos",
            subtitle: "INDIVIDUALES Y POR EQUIPOS",
            description: "Las bases de la competición individual y por parejas.",
            icon: "01",
            items: [
                {
                    name: "Singles",
                    rule: "Lucha clásica a 5 preguntas (10 si es titular)."
                },
                {
                    name: "Tag Team",
                    rule: `Lucha a 5 preguntas donde dos luchadores forman un equipo.

El árbitro informa qué luchador de cada equipo disputará las primeras 4 preguntas, de modo que todos se enfrenten con todos en una pregunta. En la última pregunta, cada equipo debe decidir qué luchador la disputará e informarlo al árbitro.

Está totalmente prohibido que un luchador responda una pregunta que no le corresponda. De lo contrario, el punto en disputa se lo llevará automáticamente el equipo rival.

Ejemplo: Daniel Bryan & Jon Moxley vs. Seth Rollins & Bron Breakker.
• Primera pregunta: Bryan & Seth.
• Segunda pregunta: Moxley & Bron.
• Tercera pregunta: Bryan & Bron.
• Cuarta pregunta: Moxley & Seth.
• Última pregunta: cada equipo decide quién responde.`
                },
                {
                    name: "Triple Threat",
                    rule: "Lucha de tres integrantes a 7 preguntas (10 si es titular)."
                },
                {
                    name: "Fatal 4-Way",
                    rule: "Lucha de cuatro integrantes a 9 preguntas (10 si es titular)."
                },
                {
                    name: "6-Man Tag Team",
                    rule: `Lucha a 9 preguntas donde tres luchadores forman un equipo.

El árbitro informa qué luchador de cada trío disputará cada pregunta, de modo que todos se enfrenten con todos una vez. Está prohibido que un luchador responda una pregunta que no le corresponda; de lo contrario, el punto se lo llevará automáticamente el trío rival.

Ejemplo: Daniel Bryan, Jon Moxley & Cody Rhodes vs. Seth Rollins, Bron Breakker & Buddy Murphy.
• Primera: Bryan & Seth.
• Segunda: Moxley & Bron.
• Tercera: Cody & Murphy.
• Cuarta: Bryan & Bron.
• Quinta: Cody & Seth.
• Sexta: Moxley & Murphy.
• Séptima: Cody & Bron.
• Octava: Bryan & Murphy.
• Novena: Moxley & Seth.`
                },
                {
                    name: "2 out of 3 Falls",
                    rule: "Tres rondas. Cada ronda la gana el primero que llega a 5, en lugar de disputar 5 preguntas."
                },
                {
                    name: "Iron Man",
                    rule: "Lucha de relevos australianos con un límite de 30 minutos. Ganará el equipo que más caídas obtenga durante ese lapso. Para ganar una caída, es necesario obtener más puntos en cada combate normal Tag Team de 5 preguntas."
                },
                {
                    name: "Samoan Tag Team",
                    rule: "Las reglas son las mismas que las de un combate Tag Team clásico, pero las preguntas estarán referidas a los samoanos y su historia en la lucha libre profesional."
                }
            ]
        },
        {
            id: "multiman",
            name: "Multijugador",
            subtitle: "VARIOS COMPETIDORES",
            description: "Combates con múltiples participantes y eliminaciones.",
            icon: "02",
            items: [
                {
                    name: "Royal Rumble",
                    rule: `Para presentarse, cada participante debe subir su imagen con su número de entrada.

Cada 3 preguntas entra un luchador nuevo al ring. Todos empiezan con 3 vidas, que también es la cantidad máxima que pueden tener.

Al ganar un punto, el participante decide si se suma una vida o le resta una vida a un rival. Como es un combate largo, el árbitro empieza a contar «Nula en…» desde 5, en lugar de 10.

Cuando ingresa el número 30, se deshabilita la opción de sumarse vidas. Gana el único participante que quede con vida dentro del ring y obtiene la posibilidad de retar a un campeón mundial en WrestleMania.`
                },
                {
                    name: "Battle Royal",
                    rule: "No hay reglas especiales para esta estipulación."
                },
                {
                    name: "Andre The Giant Memorial Battle Royal",
                    rule: "No hay reglas especiales para esta estipulación."
                },
                {
                    name: "Elimination Chamber",
                    rule: `Empiezan 2 luchadores, mientras los 4 restantes esperan su turno en las cámaras. Cada luchador tendrá 4 vidas.

Cada 3 preguntas entra un nuevo luchador. Tendrán 3 minutos para presentarse cuando les toque entrar.

La persona que responda último correctamente en cada pregunta, o no responda, perderá una vida. Ganará el luchador que termine con todas las vidas de sus adversarios.`
                },
                {
                    name: "Elimination Chamber Qualifying",
                    rule: "No hay reglas especiales para esta estipulación."
                },
                {
                    name: "Handicap",
                    rule: "No hay reglas especiales para esta estipulación."
                }
            ]
        },
        {
            id: "hardcore",
            name: "Hardcore y sin descalificación",
            subtitle: "SIN REGLAS CONVENCIONALES",
            description: "Modalidades con condiciones especiales, riesgos y ventajas.",
            icon: "03",
            items: [
                {
                    name: "Ladder",
                    rule: "Gana el luchador que llega a 7 respuestas correctas. Cuando un luchador gana un punto, puede elegir si sumárselo o restárselo al rival."
                },
                {
                    name: "Tables",
                    rule: `Lucha a 7 preguntas (10 si es titular). El árbitro establece una temática en cada ronda.

Los competidores tendrán 20 segundos para UNA respuesta con tantas subrespuestas como quieran. Cada respuesta incorrecta resta una correcta.

Para ganar: más aciertos; si hay empate, menos fallos; si persiste, gana quien haya respondido primero.`
                },
                {
                    name: "TLC",
                    rule: `Gana quien responda 10 preguntas y descuelgue el título subiendo a la escalera.

• Chairs (2 veces): descuenta 1 punto al rival.
• Tables (1 vez): descuenta 2 puntos al rival.
• Ladders: tras 10 puntos, hay que contestar 3 preguntas cortas para ganar el título.`
                },
                {
                    name: "Falls Count Anywhere",
                    rule: `Lucha a 15 preguntas. Gana el luchador que más puntos obtenga al finalizar la pregunta 15. En caso de empate, se debe desempatar, ya que no hay descalificación ni count out.

Quien logre dos puntos seguidos, sin contar nulas, podrá elegir el área donde tendrá lugar esa parte de la lucha. Cada área tiene características diferentes:

• Ring: reglas normales.
• Ringside: abreviaciones de 2 letras no permitidas; a partir de 3, válidas.
• Stage: preguntas sobre personajes.
• Backstage: finishers y theme songs.
• Estacionamiento: main events.
• Entre el público: elegir un período de años.`
                },
                {
                    name: "No Holds Barred",
                    rule: `Lucha a 7 preguntas (10 si es titular). El árbitro elige la primera pregunta como de costumbre.

El ganador de la primera pregunta, salvo que sea nula, debe elegir una palabra o un conjunto numérico para darle temática a la pregunta siguiente. Siempre elegirá la temática quien gane la pregunta actual. En caso de nulas, el árbitro hará una pregunta normal.`
                },
                {
                    name: "Extreme Rules",
                    rule: "Lucha a 7 preguntas. Cada pregunta tendrá como temática una de siete promociones distintas de la lucha libre profesional: WWE, WCW, ECW, AEW, TNA, ROH y NJPW."
                },
                {
                    name: "Street Fight",
                    rule: "Lucha a 7 preguntas (10 si es titular). Las abreviaciones de 2 letras no están permitidas; a partir de 3 letras, son válidas."
                },
                {
                    name: "Steel Cage",
                    rule: "Lucha a 7 puntos (10 si es titular). Si un luchador contesta 3 preguntas seguidas, ganará la lucha por salir del ring. En esa pregunta clave, el rival debe evitarlo contestando correctamente y cortando la racha."
                },
                {
                    name: "Hell in a Cell",
                    rule: "Lucha a 25 preguntas."
                },
                {
                    name: "Strap",
                    rule: "No hay reglas especiales para esta estipulación."
                },
                {
                    name: "Unsanctioned",
                    rule: "No hay reglas especiales para esta estipulación."
                }
            ]
        },
        {
            id: "special",
            name: "Reglas especiales",
            subtitle: "MECÁNICAS ÚNICAS",
            description: "Combates que modifican la forma de responder o puntuar.",
            icon: "04",
            items: [
                {
                    name: "Only-One-Shot",
                    rule: "Lucha a 7 preguntas (10 si es titular). Cada participante solo puede responder UNA única vez por cada pregunta que haga el árbitro."
                },
                {
                    name: "Pitch Black",
                    rule: "Lucha a 7 preguntas (10 si es titular). Las preguntas estarán encriptadas sustituyendo letras por números. Ejemplo: «Luch4 p0r 3l WW3 Ch4mp10nsh1p»."
                },
                {
                    name: "WarGames",
                    rule: "Dos luchadores de equipos distintos comienzan en jaulas. Cada respuesta correcta suma 1 punto. Cada 3 preguntas entra un nuevo luchador, empezando por el equipo con ventaja. Al activar las reglas WarGames, cada acierto resta 1 punto al rival. Gana el equipo que deje al otro con 0 puntos."
                },
                {
                    name: "Death",
                    rule: `Combate titular a 7 preguntas. Consiste en ir subiendo de nivel a través de las épocas en las que WWE y sus empresas derivadas funcionaron como empresa.

Se aplica la regla Only-One-Shot: no se puede responder más de una vez por pregunta. Hay 30 segundos por pregunta. Cuando el cronómetro llega a cero, el árbitro escribe «⌛TIEMPO⌛». Solo cuenta la respuesta enviada antes de ese mensaje.

Las preguntas se desarrollan según estos períodos:
• 2020 a 2025
• 2010 a 2019
• 2000 a 2009
• 1990 a 1999
• 1980 a 1989
• 1970 a 1979
• 1950 a 1969`
                },
                {
                    name: "Tribal Combat",
                    rule: "Lucha a 7 preguntas con preguntas samoanas y su traducción. El ganador se quedará con el Ula Fala y será reconocido como Jefe Tribal."
                },
                {
                    name: "Undisputed Era Rules",
                    rule: "Lucha a 7 preguntas (10 si es titular). Undisputed Era tiene reglas especiales: se debe escribir «ERA» para permitir que cualquier miembro responda. Los rivales juegan con reglas normales."
                },
                {
                    name: "Three Stages of Hell",
                    rule: "No hay reglas especiales para esta estipulación."
                },
                {
                    name: "Money in the Bank Ladder",
                    rule: "No hay reglas especiales para esta estipulación."
                }
            ]
        },
        {
            id: "team",
            name: "Combates por equipos",
            subtitle: "ESTRATEGIA Y COORDINACIÓN",
            description: "Variantes con equipos, relevos y reglas de grupo.",
            icon: "05",
            items: [
                {
                    name: "Samoan Tag Team",
                    rule: "Las reglas son las mismas que las de un combate Tag Team clásico, pero las preguntas estarán referidas a los samoanos y su historia en la lucha libre profesional."
                },
                {
                    name: "Iron Man",
                    rule: "Lucha de relevos australianos con 30 minutos de límite. Gana el equipo que más caídas consiga durante ese lapso. Cada caída se gana obteniendo más puntos en un combate normal Tag Team de 5 preguntas."
                },
                {
                    name: "6-Man Tag Team",
                    rule: "Lucha a 9 preguntas con tres integrantes por equipo. El árbitro asigna los participantes de cada pregunta para que todos se enfrenten con todos. Responder una pregunta que no corresponde al luchador hace que el punto se otorgue automáticamente al equipo rival."
                }
            ]
        },
        {
            id: "stakes",
            name: "Combates de apuestas",
            subtitle: "MÁSCARA, CABELLO Y LEGADO",
            description: "Modalidades en las que hay una apuesta vinculada a la rivalidad.",
            icon: "06",
            items: [
                {
                    name: "Mask vs Hair",
                    rule: "Lucha de apuestas con una estipulación que depende de la rivalidad."
                },
                {
                    name: "Mask vs Mask",
                    rule: "Lucha de apuestas con una estipulación que depende de la rivalidad."
                }
            ]
        }
    ];

    const colors = [
        ["#d7b16b", "#fff0c5", "#72502a"],
        ["#c6d4e2", "#ffffff", "#536779"],
        ["#c67cff", "#f3d6ff", "#5b287d"],
        ["#ed665e", "#ffd3c8", "#812e32"],
        ["#72d6b2", "#d8fff0", "#276d5b"],
        ["#e4e5ea", "#ffffff", "#737887"],
        ["#f09e56", "#ffe1b9", "#81451d"],
        ["#8ea8ff", "#e1e7ff", "#3b4e91"]
    ];

    const categoryGrid = document.getElementById("stip-category-grid");
    const drawer = document.getElementById("stip-drawer");
    const optionGrid = document.getElementById("stip-option-grid");
    const detail = document.getElementById("stip-detail");
    const closeButton = document.getElementById("stip-close");

    const drawerTitle = document.getElementById("stip-drawer-title");
    const drawerKicker = document.querySelector("[data-drawer-kicker]");
    const drawerDescription = document.querySelector("[data-drawer-description]");
    const detailTitle = document.getElementById("stip-detail-title");
    const detailNumber = document.getElementById("stip-detail-number");
    const detailRule = document.getElementById("stip-detail-rule");

    const total = categories.reduce((sum, category) => {
        return sum + category.items.length;
    }, 0);

    const pad = (number) => String(number).padStart(2, "0");

    function shuffleColors() {
        const shuffled = [...colors];

        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled;
    }

    const palette = shuffleColors();

    function applyColor(element, index) {
        const color = palette[index % palette.length];

        element.style.setProperty("--stip-accent", color[0]);
        element.style.setProperty("--stip-highlight", color[1]);
        element.style.setProperty("--stip-shadow", color[2]);
    }

    function makeElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;

        return element;
    }

    function renderCategories() {
        categoryGrid.replaceChildren();

        categories.forEach((category, index) => {
            const button = makeElement("button", "stip-category");
            button.type = "button";
            button.setAttribute("aria-expanded", "false");
            button.setAttribute("aria-controls", "stip-drawer");
            button.dataset.categoryId = category.id;

            applyColor(button, index);

            const top = makeElement("span", "stip-category-top");
            top.append(
                makeElement("span", "stip-category-index", category.icon),
                makeElement("span", "stip-category-count", `${pad(category.items.length)} MODOS`)
            );

            const name = makeElement("span", "stip-category-name", category.name);
            const subtitle = makeElement("span", "stip-category-subtitle", category.subtitle);

            const bottom = makeElement("span", "stip-category-bottom");
            bottom.append(
                makeElement("span", "stip-category-open", "EXPLORAR"),
                makeElement("span", "stip-category-arrow", "↗")
            );

            button.append(top, name, subtitle, bottom);

            button.addEventListener("click", () => {
                openCategory(category, button);
            });

            categoryGrid.append(button);
        });

        document.querySelector("[data-stip-total]").textContent =
            `${pad(total)} STIPULATIONS`;

        document.querySelector("[data-stip-count]").textContent = pad(total);
    }

    function openCategory(category, button) {
        const wasOpen = drawer.classList.contains("is-open")
            && drawer.dataset.categoryId === category.id;

        document.querySelectorAll(".stip-category").forEach((item) => {
            item.classList.remove("is-selected");
            item.setAttribute("aria-expanded", "false");
        });

        if (wasOpen) {
            closeDrawer();
            return;
        }

        button.classList.add("is-selected");
        button.setAttribute("aria-expanded", "true");

        drawer.dataset.categoryId = category.id;
        drawerTitle.textContent = category.name;
        drawerKicker.textContent = category.subtitle;
        drawerDescription.textContent = category.description;

        renderOptions(category);

        detail.hidden = true;
        drawer.classList.add("is-open");
        drawer.setAttribute("aria-hidden", "false");

        requestAnimationFrame(() => {
            drawer.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                    ? "auto"
                    : "smooth",
                block: "nearest"
            });
        });
    }

    function renderOptions(category) {
        optionGrid.replaceChildren();

        category.items.forEach((item, index) => {
            const button = makeElement("button", "stip-option");
            button.type = "button";
            button.setAttribute("aria-expanded", "false");

            const number = makeElement("span", "stip-option-number", pad(index + 1));
            const name = makeElement("span", "stip-option-name", item.name);
            const arrow = makeElement("span", "stip-option-arrow", "＋");

            button.append(number, name, arrow);

            button.addEventListener("click", () => {
                showDetail(category, item, index, button);
            });

            optionGrid.append(button);
        });
    }

    function showDetail(category, item, index, button) {
        optionGrid.querySelectorAll(".stip-option").forEach((option) => {
            option.classList.remove("is-active");
            option.setAttribute("aria-expanded", "false");
            option.querySelector(".stip-option-arrow").textContent = "＋";
        });

        button.classList.add("is-active");
        button.setAttribute("aria-expanded", "true");
        button.querySelector(".stip-option-arrow").textContent = "−";

        const categoryIndex = categories.findIndex((entry) => entry.id === category.id);
        applyColor(detail, categoryIndex);

        detailTitle.textContent = item.name;
        detailNumber.textContent = pad(index + 1);

        detailRule.replaceChildren();

        item.rule.split("\n").forEach((line) => {
            const trimmed = line.trim();

            if (!trimmed) {
                detailRule.append(makeElement("div", "stip-rule-spacer"));
            } else if (trimmed.startsWith("•")) {
                detailRule.append(makeElement("p", "stip-rule-bullet", trimmed));
            } else {
                detailRule.append(makeElement("p", "stip-rule-paragraph", trimmed));
            }
        });

        detail.hidden = false;

        detail.classList.remove("is-revealing");
        void detail.offsetWidth;
        detail.classList.add("is-revealing");

        requestAnimationFrame(() => {
            detail.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                    ? "auto"
                    : "smooth",
                block: "nearest"
            });
        });
    }

    function closeDrawer() {
        drawer.classList.remove("is-open");
        drawer.setAttribute("aria-hidden", "true");

        document.querySelectorAll(".stip-category").forEach((item) => {
            item.classList.remove("is-selected");
            item.setAttribute("aria-expanded", "false");
        });
    }

    closeButton.addEventListener("click", closeDrawer);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && drawer.classList.contains("is-open")) {
            closeDrawer();
        }
    });

    renderCategories();
})();
