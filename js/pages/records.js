/* ============================================================================
   MI WRESTLING 2.0 — RÉCORDS
   Muestra récord real del luchador o del intérprete cuando exista en los datos.
   ============================================================================ */
(async function () {
  "use strict";
  const main = document.querySelector("[data-records-main]");
  if (!main) return;
  const params = new URLSearchParams(window.location.search);
  const wrestlerId = params.get("wrestler");
  const interpreterId = params.get("interpreter");
  const season = params.get("season");
  const safe = (value) => String(value ?? "").replace(/[&<>\"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" }[c]));
  try {
    const [wrestlerResponse, interpreterResponse] = await Promise.all([
      fetch("data/wrestlers/wrestlers.json", { cache: "no-cache" }),
      fetch("data/records/interpreters.json", { cache: "no-cache" }).catch(() => null)
    ]);
    if (!wrestlerResponse.ok) throw new Error("No se pudo cargar el archivo de superestrellas.");
    const wrestlers = await wrestlerResponse.json();
    const interpreterData = interpreterResponse?.ok ? await interpreterResponse.json() : [];
    if (wrestlerId) {
      const wrestler = wrestlers.find((item) => item.id === wrestlerId);
      if (!wrestler) throw new Error("No se encontró esa superestrella.");
      const legacy = wrestler.legacyStats || {};
      const current = wrestler.record?.season2026 || legacy.overall2026 || "Sin datos";
      const career = wrestler.record?.career || legacy.careerOverall || "Sin datos";
      main.innerHTML = `<header class="mw-record-hero"><p class="mw-record-eyebrow">MI WRESTLING 2.0 / MATCH ARCHIVE</p><h1>${safe(wrestler.name)}</h1><p>Registro de resultados y estadísticas de carrera.</p></header><div class="mw-record-stat-grid"><article class="mw-record-stat${season === "2026" ? " is-current" : ""}"><span>RECORD 2026</span><strong>${safe(current)}</strong><small>Temporada actual</small></article><article class="mw-record-stat"><span>RECORD TOTAL</span><strong>${safe(career)}</strong><small>Toda la carrera registrada</small></article></div><section class="mw-record-note"><h2>Historial de combates</h2><p>El resumen histórico conservado está disponible arriba. La lista detallada por combate se mostrará cuando se vinculen los registros individuales de este luchador.</p></section><a class="mw-record-back" href="superstar.html?id=${encodeURIComponent(wrestler.id)}">← VOLVER A LA FICHA</a>`;
      document.title = `Récord de ${wrestler.name} | MI WRESTLING 2.0`;
      return;
    }
    if (interpreterId) {
      const interpreter = interpreterData.find((item) => item.id === interpreterId);
      const displayName = interpreter?.name || (interpreterId === "yahir" ? "Yahir" : interpreterId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
      if (interpreter) {
        const record2026 = interpreter.record2026 || "Sin datos";
        const total = interpreter.careerRecord || "Sin datos";
        main.innerHTML = `<header class="mw-record-hero"><p class="mw-record-eyebrow">PLAYER PROFILE / MATCH ARCHIVE</p><h1>${safe(displayName)}</h1><p>Récord como intérprete de superestrellas.</p></header><div class="mw-record-stat-grid"><article class="mw-record-stat is-current"><span>RECORD 2026</span><strong>${safe(record2026)}</strong><small>Temporada actual</small></article><article class="mw-record-stat"><span>RECORD TOTAL</span><strong>${safe(total)}</strong><small>Historial acumulado</small></article></div><section class="mw-record-note"><h2>Historial de participación</h2><p>${safe(interpreter.notes || "Registro de intérprete vinculado al archivo de MI WRESTLING 2.0.")}</p></section>`;
      } else {
        main.innerHTML = `<header class="mw-record-hero"><p class="mw-record-eyebrow">PLAYER PROFILE / MATCH ARCHIVE</p><h1>${safe(displayName)}</h1><p>Récord como intérprete de superestrellas.</p></header><section class="mw-record-note"><h2>Registro pendiente de datos</h2><p>El enlace ya está preparado, pero todavía no hay resultados individuales cargados para este intérprete. No mostramos estadísticas inventadas.</p></section><a class="mw-record-back" href="roster.html">← VOLVER AL ROSTER</a>`;
      }
      document.title = `Récord de ${displayName} | MI WRESTLING 2.0`;
      return;
    }
    main.innerHTML = `<header class="mw-record-hero"><p class="mw-record-eyebrow">MI WRESTLING 2.0</p><h1>RECORDS</h1><p>Elegí una ficha para consultar sus récords de temporada y carrera.</p></header><div class="mw-record-links">${wrestlers.map((w) => `<a href="records.html?wrestler=${encodeURIComponent(w.id)}"><span>${safe(w.name)}</span><span>↗</span></a>`).join("")}</div>`;
  } catch (error) {
    console.error(error);
    main.innerHTML = `<section class="mw-record-note"><h1>No se pudieron cargar los récords</h1><p>${safe(error.message || "Error de carga")}</p></section>`;
  }
})();

