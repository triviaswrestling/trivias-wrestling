
/* =========================================================
   MI WRESTLING 2.0 — RULES
   Reglamento de competidores + Manual de árbitros
   ========================================================= */

(() => {
    'use strict';

    const panel = document.getElementById('rules-panel');
    const tabs = [...document.querySelectorAll('[data-rules-view]')];

    if (!panel || !tabs.length) return;

    const whatsappURL =
        'https://chat.whatsapp.com/D7vkfUKTujZ8nr6xlQj02C';

    const accordion = (number, title, content, open = false) => `
        <details class="rules-accordion"${open ? ' open' : ''}>
            <summary>
                <span class="rules-accordion-number">${number}</span>
                <span>${title}</span>
            </summary>
            <div class="rules-accordion-body">
                ${content}
            </div>
        </details>
    `;

    const callout = (content, type = '') => `
        <div class="rules-callout ${type}">
            ${content}
        </div>
    `;

    const score = (number, label) => `
        <div class="rules-score">
            <strong>${number}</strong>
            <span>${label}</span>
        </div>
    `;

    const competitorSections = [
        accordion('01', 'Descripción', `
            <p>
                El Campeonato de Trivias de WWE es una competencia emocionante
                que se lleva a cabo en tres marcas: <strong>Undisputed WWE
                Championship</strong> (para SmackDown), <strong>World
                Heavyweight Championship</strong> (para RAW) y
                <strong>NXT Championship</strong> (para NXT).
            </p>
            <p>
                Las preguntas giran en torno a la historia de la WWE,
                incluyendo luchadores, eventos históricos, movimientos
                especiales, títulos y campeonatos, entre otros temas relevantes.
            </p>
        `),

        accordion('02', 'Participación', `
            <p>
                Para unirte al Campeonato de Trivias de WWE, únete al grupo
                de <a href="${whatsappURL}" target="_blank"
                rel="noopener noreferrer">Backstage en WhatsApp</a>
                para recibir la invitación a los grupos correspondientes
                a cada marca.
            </p>
        `),

        accordion('03', 'Horarios y fechas', `
            ${callout(`
                <p><strong>ATENCIÓN:</strong> Todos tendrán como máximo
                <strong>5 minutos de tolerancia</strong> para presentarse
                con respecto al horario oficial de la lucha. En caso de no
                cumplir con esta norma, tendrá la lucha perdida por default.</p>
            `, 'warning')}

            <ul>
                <li><strong>RAW:</strong> Lunes 20:00hs (ARG).</li>
                <li><strong>NXT:</strong> Martes 20:00hs (ARG).</li>
                <li><strong>SmackDown:</strong> Viernes 20:00hs (ARG).</li>
                <li><strong>PLEs y Lives:</strong> Días y horarios a definir.</li>
            </ul>
        `),

        accordion('04', 'Plataforma y formato', `
            <p>
                El campeonato se lleva a cabo exclusivamente en
                <strong>WhatsApp</strong>. Cada marca tiene su grupo
                respectivo, además de un grupo de difusión donde se
                compartirán fechas, fixtures, tablas de posiciones
                y otras noticias relevantes.
            </p>

            <h4>Grupos de combate</h4>
            <p>
                Grupos para RAW, SmackDown, NXT y PLE. Solamente utilizados
                para las luchas. <strong>Prohibido hablar por ese medio.</strong>
            </p>

            <h4>Interacción social</h4>
            <ul>
                <li><strong>WWE Promo:</strong> Para armar storylines y desarrollar rivalidades.</li>
                <li><strong>WWE Backstage:</strong> Para discutir el torneo, lucha libre y otros temas.</li>
            </ul>

            <p>Todos los grupos están conectados por la Comunidad de Trivias de WWE.</p>
        `),

        accordion('05', 'Puntuación y clasificación', `
            <div class="rules-score-grid">
                ${score('3', 'Ganador')}
                ${score('1', 'Empate')}
                ${score('0', 'Derrotado')}
            </div>
        `),

        accordion('06', 'Elección de luchadores', `
            <p>
                A partir del año 2026, <strong>queda descartada la posibilidad
                de cambiar de luchador a interpretar</strong>. Cada competidor
                deberá elegir un luchador y mantenerlo durante toda su estadía
                en el grupo.
            </p>
            <p>
                <em>En caso de que el luchador elegido se retire, se podrá
                elegir ese luchador solo en caso de revisión por parte
                de la Junta Directiva.</em>
            </p>
        `),

        accordion('07', 'Reglas generales', `
            <ul>
                <li>
                    <strong>Formato de respuesta:</strong> Al presentarse,
                    se deberá especificar el formato de escritura
                    (MAYÚSCULAS, minúsculas o Formato frase). Una vez elegido,
                    no se podrá cambiar durante la lucha.
                </li>
                <li>
                    Las respuestas deben ser escritas de manera completa,
                    sin faltas de ortografía, y en el formato elegido.
                </li>
                <li>
                    <strong>Prohibido hacer trampa:</strong> No se puede salir
                    del chat para usar buscadores ni compartir respuestas.
                    Del mismo modo herramientas como el teclado predictivo
                    de WhatsApp o aplicaciones similares también están
                    completamente prohibidas.
                </li>
                <li>
                    Se usarán llamadas de atención por trampa. A la
                    <strong>2da llamada</strong> se resta un punto.
                    A la <strong>3ra llamada</strong>, descalificación
                    del combate.
                </li>
                <li>
                    Es obligatorio usar "The" en nombres de luchadores,
                    tag teams o stables de una sola palabra (ej: The Miz).
                    Es opcional en nombres de más de una palabra
                    (ej: Big Show).
                </li>
                <li>
                    No se tomará en cuenta un mensaje editado que contenía
                    una respuesta incorrecta; se debe enviar un nuevo mensaje.
                </li>
                <li>
                    Para "Finisher" o "Theme Song", cualquier canción o
                    finisher de toda su carrera es válido, salvo que el
                    árbitro indique lo contrario.
                </li>
                <li>
                    Cuando se pide nombrar una lucha, se debe agregar
                    <strong>SIN EXCEPCIÓN</strong> el "vs" entre participantes,
                    pero cuando se pide nombrar participantes,
                    <strong>NO</strong> se tomará por válido si escriben
                    "vs" entre los mismos.
                </li>
                <li>
                    Cuando se pide la estipulación de un combate, es
                    obligatorio agregar "match" al final de la estipulación
                    (ej: Steel Cage match).
                </li>
            </ul>
        `),

        accordion('08', 'Mecanismos de resolución de disputas', `
            <h4>Decisión de administradores</h4>
            <p>
                Cualquier queja o reclamación será analizada por los
                administradores del campeonato, quienes tomarán la decisión
                correspondiente a cada caso.
                <strong>Su determinación será definitiva y no estará sujeta
                a apelación.</strong>
            </p>
        `),

        accordion('09', 'Responsabilidades y sanciones', `
            <p>
                Los participantes deben cumplir con las reglas. El
                incumplimiento grave o reiterado puede resultar en
                descalificación.
            </p>

            <h3>Sanciones por trampa</h3>
            <h4>Casos de trampa</h4>
            <ol>
                <li>En combate de Road, alterar el combate aún perdiendo.</li>
                <li>En combate de Road, alterar el combate y ganar/empatar.</li>
                <li>En combate de Road, alterar el combate y obtener oportunidad titular/salvarse del descenso.</li>
                <li>En combate titular, alterar el combate y obtener el empate.</li>
                <li>En combate titular, alterar el combate y obtener la victoria.</li>
            </ol>

            <p>
                <strong>Puntos 1, 2 ó 3:</strong> El competidor recibe un aviso.
                La reiteración conlleva sanción.
            </p>
            <p>
                <strong>Puntos 4 ó 5:</strong> La sanción será directa.
            </p>

            <div class="rules-penalty">
                <span class="rules-penalty-title">Primera acción fraudulenta</span>
                <ul>
                    <li>1 Road de suspensión sin competir en ninguna marca.</li>
                    <li>2 Roads sin poder competir por un campeonato.</li>
                    <li>No poder competir en PLE Bookeado.</li>
                </ul>
            </div>

            <div class="rules-penalty">
                <span class="rules-penalty-title">Segunda acción fraudulenta</span>
                <p><strong>Baneo inmediato.</strong></p>
                <p>Mínimo un año.</p>
            </div>

            <h3>Sanciones por mal comportamiento</h3>
            <p>
                Un Road de suspensión con la imposibilidad de clasificar y
                competir por cualquier campeonato individual (no aplica a
                campeonatos en parejas). Si el sancionado posee un campeonato
                individual, la sanción correrá a partir de que lo pierda.
            </p>

            <div class="rules-penalty">
                <span class="rules-penalty-title">1ra acción</span>
                <p>Suspensión de título individual: <strong>1 Road</strong>.</p>
            </div>
            <div class="rules-penalty">
                <span class="rules-penalty-title">2da acción</span>
                <p>Suspensión de título individual: <strong>2 Roads</strong>.</p>
            </div>
            <div class="rules-penalty">
                <span class="rules-penalty-title">3ra acción</span>
                <p>Suspensión de título individual: <strong>3 Roads</strong>.</p>
            </div>
            <div class="rules-penalty">
                <span class="rules-penalty-title">4ta acción</span>
                <p><strong>Baneo inmediato.</strong></p>
                <p>Mínimo 6 meses.</p>
            </div>
        `)
    ].join('');

    const refereeSections = [
        accordion('01', 'Preparativos de la lucha', `
            <p>
                Para llamar a los competidores hay que copiar
                <strong>ÚNICAMENTE</strong> la lucha de la cartelera que se va
                a llevar a cabo a continuación (incluyendo las banderas que
                notifican el horario), y debajo de los nombres de los PJ,
                se les arroba para que les llegue la notificación, acompañado
                del tiempo restante que tienen para presentarse.
            </p>

            <h4>Tolerancia y plazo de espera</h4>
            <p>
                El tiempo restante puede variar, pero como máximo tienen
                <strong>CINCO MINUTOS</strong> pasada la hora de la mención
                para presentarse y empezar a competir.
            </p>

            <p><strong>Llamado en la hora fijada:</strong> Si la lucha está
            estipulada para las <strong>21:30</strong>, los competidores
            tienen como máximo hasta las <strong>21:35</strong> para
            presentarse, y se les debe notificar expresamente.</p>

            <p><strong>Llamado con margen anticipado:</strong> Si la lucha
            anterior deja suficiente margen y se les llama a las
            <strong>21:22</strong> para las <strong>21:30</strong>, se les
            debe notificar que disponen de <strong>13 minutos</strong>
            (8 min hasta la hora fijada + 5 min de margen permitido).</p>

            <h4>Otorgar rango de administrador</h4>
            <p>
                Tras el llamado, se les designa como administradores del
                grupo para que puedan escribir en el chat de combate.
            </p>

            <h4>Confirmar formato de respuesta</h4>
            <p>
                El árbitro debe conocer con cuál de los tres formatos
                (<strong>MAYÚSCULAS</strong>, <strong>minúsculas</strong>
                o <strong>Formato Frase</strong>) competirán los luchadores.
                Una vez sabido, la lucha puede comenzar.
            </p>
        `, true),

        accordion('02', 'Dinámica y desarrollo de la lucha', `
            <h4>Preparación previa de preguntas</h4>
            <p>
                El árbitro debe preparar las correspondientes preguntas antes
                de que comience la lucha (las cuales deben ser lo más
                específicas posibles) y haber comprobado minuciosamente que
                todo está correcto en sus apuntes, evitando posibles conflictos
                en mitad de la lucha que perjudicarían al show por retrasarlo
                en caso de polémicas.
            </p>

            <h4>Protocolo paso a paso durante cada pregunta</h4>
            <ol class="rules-step-list">
                <li>
                    <strong>1</strong>
                    <span>
                        <b>Separación estricta de mensajes.</b><br>
                        Para cada pregunta, se debe decir primero el número
                        en un mensaje aparte: <code>PRIMERA PREGUNTA</code>.
                        Nada de "1 - ¿Qué luchador...?". Es obligatorio que
                        el número de la pregunta y la formulación estén
                        separados. Luego se envía la pregunta en otro mensaje.
                    </span>
                </li>
                <li>
                    <strong>2</strong>
                    <span>
                        <b>Confirmación con reacción.</b><br>
                        Se espera a que un competidor acierte la respuesta.
                        Cuando lo haga, el árbitro debe reaccionar a ese
                        mensaje con el emoticono del pulgar hacia arriba (👍).
                    </span>
                </li>
                <li>
                    <strong>3</strong>
                    <span>
                        <b>Comprobación de actividad con puntos.</b><br>
                        Es importante enviar puntos (.) de vez en cuando
                        para asegurarse de que los competidores siguen
                        en el chat y la conexión fluye con normalidad.
                    </span>
                </li>
                <li>
                    <strong>4</strong>
                    <span>
                        <b>Cuenta regresiva de pregunta nula.</b><br>
                        Si tras un tiempo indefinido ninguno de los dos da
                        con la respuesta correcta, se comienza el conteo
                        escribiendo "Nula en" y después una cuenta regresiva
                        desde diez hasta cero (10, 9, 8... 0).
                    </span>
                </li>
                <li>
                    <strong>5</strong>
                    <span>
                        <b>Actualización de marcador y siguiente pregunta.</b><br>
                        Cuando el resultado de la pregunta esté decidido,
                        se notifica el marcador: <code>1-0</code> (o
                        <code>0-0</code> en caso de nula). Luego se anuncia
                        <code>SEGUNDA PREGUNTA</code> y se repite el proceso.
                    </span>
                </li>
            </ol>

            ${callout(`
                <p><strong>IMPORTANTE:</strong> En caso de que alguna pregunta
                quede nula, siempre se debe recordar el marcador anterior.
                Por ejemplo: si iban 2-1, y la cuarta pregunta queda nula,
                se vuelve a recordar que se mantiene ese 2-1.</p>
            `, 'warning')}
        `),

        accordion('03', 'Vocabulario oficial de corrección', `
            ${callout(`
                <p><strong>REGLA ESTRICTA:</strong> Son las únicas frases con
                las que el árbitro debe dirigirse a los competidores en mitad
                de una pregunta cuando formulen una respuesta errónea o incompleta.</p>
            `, 'warning')}

            <h3>NO</h3>
            <p>Se utiliza cuando la respuesta es directamente incorrecta.</p>
            <p><strong>Ejemplo (Main Event de WrestleMania 30):</strong>
            Respuesta: "The Undertaker vs Edge".</p>
            <span class="rules-quote">Árbitro responde: NO</span>

            <h3>MAL ESCRITO</h3>
            <p>
                Se utiliza cuando la respuesta es correcta en contenido pero
                tiene errores de ortografía, o cuando no se usa el gimmick /
                ring name que corresponde al período de tiempo en que se
                ubica la pregunta.
            </p>
            <p><strong>Ejemplo ortográfico (ME de WrestleMania 30):</strong>
            "Daniek Bryan vs Batistta vs Randy Oryon".</p>
            <span class="rules-quote">Árbitro responde: MAL ESCRITO</span>

            <h4>Gimmick o ring name histórico</h4>
            <p>
                Si se pregunta por los miembros de <em>League of Nations</em>
                y responden <em>Wade Barrett</em>, es erróneo porque en ese
                momento su gimmick era <strong>King Barrett</strong>.
                Lo mismo aplica a <strong>Theory vs Austin Theory</strong>,
                <strong>Antonio Cesaro vs Cesaro</strong>, o
                <strong>Johnny Nitro vs John Morrison</strong>. Se debe
                escribir el nombre del período exacto.
            </p>

            <h3>MAL FORMATO</h3>
            <p>
                Se utiliza cuando un competidor se sale del formato elegido
                previamente para responder con otro.
            </p>
            <p>
                Ejemplo: eligió minúsculas y aparece alguna mayúscula en
                su respuesta.
            </p>
            <span class="rules-quote">Árbitro responde: MAL FORMATO</span>
            <p>
                Por mucho que sea correcta, no se dará por válida por no
                haberla escrito dentro de su formato.
            </p>

            <h3>FALTA</h3>
            <p>
                Se utiliza cuando la respuesta está incompleta respecto a
                la consigna planteada.
            </p>
            <p><strong>Ejemplo (Main Event de WrestleMania 30):</strong>
            Respuesta: "Daniel Bryan vs Batista".</p>
            <span class="rules-quote">Árbitro responde: FALTA</span>
            <p>(Falta Randy Orton en la triple amenaza).</p>

            <h4>Combinación de señales de corrección</h4>
            <p>
                El "Mal escrito", "Mal formato" y "Falta" pueden incluso
                combinarse si el participante comete más de un error a la
                vez en su respuesta.
            </p>
            <p>
                Pregunta: Main Event de WM 30 (competidor en minúsculas).
                Respuesta enviada: "Daniek bryan vs randy ortin".
            </p>
            <span class="rules-quote">
                MAL ESCRITO, FALTA, MAL FORMATO
            </span>
            <p>
                Están mal escritos los nombres, falta agregar a Batista,
                y además contestó con una mayúscula fuera de su formato elegido.
            </p>
        `),

        accordion('04', 'Gestión de polémicas', `
            <h4>Resolución en Junta Directiva post-lucha</h4>
            <p>
                En caso de que alguna pregunta genere polémica, se les
                notifica a los competidores que <strong>se estudiará el caso
                en Junta Directiva una vez termine la lucha</strong>, y
                posteriormente se determinará un veredicto final.
            </p>
            <p>
                <strong>Propósito fundamental:</strong> No afectar al
                desarrollo normal del encuentro y resguardar la puntualidad
                con la que deben llevarse a cabo el resto de luchas de la
                cartelera del show.
            </p>
        `),

        accordion('05', 'Conclusión y registro de la cartelera', `
            <p>
                Una vez termine la lucha, el árbitro debe informar a los
                competidores sobre el resultado final (por ejemplo,
                <code>3-2</code>). Tras esto, el árbitro debe copiar la
                cartelera completa en la que ya se han establecido los
                resultados anteriores y agregar el resultado de la lucha
                que acaba de finalizar.
            </p>

            <h4>Lucha con ganador</h4>
            <p>
                Al ganador se le resalta en <strong>negrita</strong>
                colocando un asterisco al comienzo y al final de su nombre,
                y se coloca el resultado final entre los nombres de los
                competidores.
            </p>
            <span class="rules-quote">*Axiom* 3-2 Jacob Fatu</span>

            <h4>Lucha en empate</h4>
            <p>
                En caso de empate, <strong>no se resalta NADA en negrita</strong>:
                ni los nombres de los competidores, ni el resultado.
            </p>
            <span class="rules-quote">Axiom 2-2 Jacob Fatu</span>

            <h4>No presentación / default (5-0)</h4>
            <p>
                El ausente pierde por <strong>5-0</strong>. Se resalta al
                ganador en negrita, se coloca el marcador y al perdedor se
                le ubica un punto entre paréntesis <code>(.)</code> en la
                parte de su nombre más próxima al resultado.
            </p>
            <span class="rules-quote">*Axiom* 5-0 (.)Jacob Fatu</span>
            <p><strong>Orden inverso:</strong></p>
            <span class="rules-quote">Jacob Fatu(.) 0-5 *Axiom*</span>

            <h4>Paso de administrador</h4>
            <p>
                Cuando todo ese trabajo esté hecho, se les quita el admin
                a los competidores que hayan terminado, y se les entrega
                a los siguientes que vayan a competir.
            </p>
        `)
    ].join('');

    const renderDocument = (view) => {
        if (view === 'referees') {
            panel.setAttribute('aria-labelledby', 'rules-tab-referees');
            panel.innerHTML = `
                <header class="rules-document-header">
                    <span class="rules-document-label">DOCUMENTO 02 / ARBITRAJE</span>
                    <h2 class="rules-document-title">Manual de Árbitros</h2>
                    <p class="rules-document-intro">
                        Guía oficial y protocolos para arbitrar en Trivias WWE:
                        preparativos, dinámicas en combate, vocabulario estricto
                        y resolución de resultados.
                    </p>
                </header>

                ${accordion('00', '¿Cómo arbitrar en Trivias WWE?', `
                    <p>
                        Las funciones de un árbitro en Trivias WWE son varias:
                        primero debe avisar a los competidores al horario
                        correspondiente para su lucha, después debe saber el
                        formato con el que cada uno de los participantes va a
                        competir, realizar las preguntas y determinar quién es
                        el ganador de cada punto y por consiguiente de la lucha.
                    </p>

                    <ol class="rules-step-list">
                        <li><strong>1</strong><span>Avisar a competidores en su horario pactado.</span></li>
                        <li><strong>2</strong><span>Verificar el formato elegido de respuesta.</span></li>
                        <li><strong>3</strong><span>Formular preguntas claras y validadas.</span></li>
                        <li><strong>4</strong><span>Determinar los puntos y ganador final.</span></li>
                    </ol>
                `, true)}

                ${refereeSections}

                <div class="rules-manual-end">
                    <h3>Compromiso y neutralidad</h3>
                    <p>
                        Un arbitraje ordenado, riguroso y puntual garantiza
                        la legitimidad del Campeonato de Trivias de WWE.
                    </p>
                    <a href="${whatsappURL}" target="_blank"
                    rel="noopener noreferrer">Grupo de Backstage en WhatsApp ↗</a>
                </div>
            `;
            return;
        }

        panel.setAttribute('aria-labelledby', 'rules-tab-competitors');
        panel.innerHTML = `
            <header class="rules-document-header">
                <span class="rules-document-label">DOCUMENTO 01 / COMPETICIÓN</span>
                <h2 class="rules-document-title">Reglamento Oficial</h2>
                <p class="rules-document-intro">
                    Todo lo que necesitas saber sobre el Campeonato de Trivias
                    de WWE. Conoce las normas, horarios y sistema de competición.
                </p>
            </header>

            ${competitorSections}

            <div class="rules-manual-end">
                <h3>¿Listo para competir?</h3>
                <p>
                    ¡Disfruta del Campeonato de Trivias de WWE y demuestra
                    tus conocimientos sobre la lucha libre!
                </p>
                <a href="${whatsappURL}" target="_blank"
                rel="noopener noreferrer">Unirse al torneo en WhatsApp ↗</a>
            </div>
        `;
    };

    const selectView = (view) => {
        tabs.forEach((tab) => {
            const active = tab.dataset.rulesView === view;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', String(active));
            tab.tabIndex = active ? 0 : -1;
        });

        renderDocument(view);
    };

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            selectView(tab.dataset.rulesView);
        });

        tab.addEventListener('keydown', (event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
                return;
            }

            event.preventDefault();

            const nextIndex = event.key === 'ArrowRight'
                ? (index + 1) % tabs.length
                : (index - 1 + tabs.length) % tabs.length;

            tabs[nextIndex].focus();
            selectView(tabs[nextIndex].dataset.rulesView);
        });
    });

    selectView('competitors');
})();

