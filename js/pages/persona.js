
/* MI WRESTLING 2.0 | FICHA DE INTÉRPRETE */
(async function(){
  "use strict";
  const main=document.querySelector("[data-interpreter-profile]");
  if(!main)return;
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const countryNames={AR:"Argentina",CL:"Chile",MX:"México",CO:"Colombia",PE:"Perú",ES:"España",VE:"Venezuela",EC:"Ecuador",UY:"Uruguay",IT:"Italia",NI:"Nicaragua",BO:"Bolivia",PY:"Paraguay",US:"Estados Unidos",CR:"Costa Rica",GQ:"Guinea Ecuatorial",GT:"Guatemala"};
  const flag=code=>/^[A-Z]{2}$/.test(String(code||""))?String.fromCodePoint(...String(code).toUpperCase().split("").map(c=>127397+c.charCodeAt(0))):"🌐";
  const date=value=>{if(!value)return "Fecha no registrada";const d=new Date(value+"T00:00:00Z");return Number.isNaN(d.getTime())?"Fecha no registrada":new Intl.DateTimeFormat("es-AR",{day:"2-digit",month:"long",year:"numeric",timeZone:"UTC"}).format(d);};
  const params=new URLSearchParams(location.search),id=params.get("id")||params.get("interpreter");
  if(!id){main.innerHTML='<section class="mw-interpreter-list"><h1>Falta el identificador</h1><p>Abrí una ficha desde el <a href="personas.html">catálogo de intérpretes</a>.</p></section>';return;}
  try{
    const [personas,assignments,wrestlers,matches,events,championshipData]=await Promise.all([
      fetch("data/personas/personas.json").then(r=>{if(!r.ok)throw Error("No se pudo cargar el registro de intérpretes.");return r.json()}),
      fetch("data/personas/assignments.json").then(r=>r.ok?r.json():[]),
      fetch("data/wrestlers/wrestlers.json").then(r=>r.ok?r.json():[]),
      fetch("data/matches/matches.json").then(r=>r.ok?r.json():[]),
      fetch("data/events/events.json").then(r=>r.ok?r.json():[]),
      window.MIW_CHAMPIONSHIP_HISTORY?window.MIW_CHAMPIONSHIP_HISTORY.load():Promise.resolve(null)
    ]);
    if(championshipData)championshipData.wrestlers=wrestlers;
    const person=personas.find(p=>String(p.id)===String(id));
    if(!person)throw new Error("No se encontró el intérprete con ID "+id+".");
    const titleCards=championshipData?window.MIW_CHAMPIONSHIP_HISTORY.interpreterTitleCards(person.id,championshipData,wrestlers):"";
    const personAssignments=assignments.filter(a=>String(a.interpreterId)===String(person.id)).sort((a,b)=>String(b.startDate||"").localeCompare(String(a.startDate||"")));
    const compMatches=matches.filter(m=>(m.participants||[]).some(p=>String(p.interpreterId||"")===String(person.id)&&(p.role||"competitor")==="competitor"));
    const officialMatches=matches.filter(m=>(m.officials||[]).some(o=>String(o.interpreterId)===String(person.id))||(m.refereeIds||[]).some(x=>String(x)===String(person.id)));
    const record=window.MIW_STATS?window.MIW_STATS.recordForInterpreter(matches,person.id):{wins:0,losses:0,draws:0,noContests:0,appearances:compMatches.length,winRate:0};
    const initial=String(person.name||"?").trim().split(/\s+/).map(x=>x[0]).join("").slice(0,3).toUpperCase();
    const assignmentsHTML=personAssignments.length?personAssignments.map(a=>{
      const wrestler=wrestlers.find(w=>String(w.id)===String(a.wrestlerId));
      const current=a.status==="active"&&!a.endDate;
      return `<article class="mw-assignment"><div><a href="superstar.html?id=${encodeURIComponent(a.wrestlerId)}">${esc(wrestler?.name||a.wrestlerId)}</a><small>${esc(date(a.startDate))} — ${esc(a.endDate?date(a.endDate):(current?"Presente":"Fin no registrado"))}</small>${a.notes?`<small>${esc(a.notes)}</small>`:""}</div><span class="mw-assignment-status">${current?"Actual":a.status==="ended"?"Finalizada":"Sin confirmar"}</span></article>`;
    }).join(""):'<div class="mw-interpreter-list">Todavía no hay períodos de uso de superestrellas vinculados a esta persona.</div>';
    const matchCards=compMatches.length&&window.MIW_MATCH_CARD?compMatches.map(m=>window.MIW_MATCH_CARD.render(m,{wrestlers,personas,events})).join(""):'<div class="mw-interpreter-list">No hay combates individuales vinculados a este intérprete todavía. No se inventan resultados: se calcularán cuando carguemos los combates reales.</div>';
    const officialCards=officialMatches.length&&window.MIW_MATCH_CARD?officialMatches.map(m=>window.MIW_MATCH_CARD.render(m,{wrestlers,personas,events})).join(""):'<div class="mw-interpreter-list">No hay participaciones como árbitro u oficial registradas.</div>';
    main.innerHTML=`<a class="mw-interpreter-action" href="personas.html">← VOLVER A INTÉRPRETES</a><header class="mw-interpreter-hero"><div class="mw-interpreter-avatar" aria-hidden="true">${esc(initial)}</div><div><div class="mw-interpreter-eyebrow">MI WRESTLING 2.0 / PLAYER PROFILE</div><h1>${esc(person.name)}</h1><div class="mw-interpreter-meta"><span>${flag(person.country)} ${esc(countryNames[person.country]||"País no registrado")}</span><span>·</span><span class="mw-interpreter-status ${person.status==="active"?"is-active":""}">${person.status==="active"?"ACTIVO":person.status==="inactive"?"INACTIVO":"ESTADO SIN REGISTRAR"}</span><span>· ID ${esc(person.id)}</span></div><div class="mw-interpreter-actions"><a class="mw-interpreter-action is-primary" href="records.html?interpreter=${encodeURIComponent(person.id)}">VER RÉCORD COMPLETO ↗</a></div></div></header><section class="mw-interpreter-stats" aria-label="Récord calculado desde combates"><article class="mw-interpreter-stat"><strong>${record.wins}</strong><span>VICTORIAS</span></article><article class="mw-interpreter-stat"><strong>${record.losses}</strong><span>DERROTAS</span></article><article class="mw-interpreter-stat"><strong>${record.draws}</strong><span>EMPATES</span></article><article class="mw-interpreter-stat"><strong>${record.appearances}</strong><span>COMBATES</span></article><article class="mw-interpreter-stat"><strong>${record.winRate}%</strong><span>VICTORIAS*</span></article></section><p class="mw-interpreter-muted">* Porcentaje sobre combates con resultado decidido. Los arbitrajes no suman victorias, derrotas ni empates.</p>${titleCards?`<section class="mw-interpreter-section mw-championship-achievements"><div class="mw-interpreter-section__heading"><h2>Campeonatos de superestrellas interpretadas</h2><span>TÍTULOS</span></div>${titleCards}</section>`:""}<section class="mw-interpreter-section"><div class="mw-interpreter-section__heading"><h2>Historial de superestrellas</h2><span>${personAssignments.length} asignación(es)</span></div><div class="mw-assignment-list">${assignmentsHTML}</div></section><section class="mw-interpreter-section"><div class="mw-interpreter-section__heading"><h2>Historial de combates</h2><span>${compMatches.length} combate(s)</span></div>${matchCards}</section><section class="mw-interpreter-section"><div class="mw-interpreter-section__heading"><h2>Arbitrajes y oficiales</h2><span>${officialMatches.length} participación(es)</span></div><p class="mw-interpreter-muted">Estas apariciones se muestran por separado y nunca se cuentan como combates competitivos.</p>${officialCards}</section>`;
    document.title=`${person.name} — Intérprete | MI WRESTLING 2.0`;
  }catch(error){
    main.innerHTML=`<section class="mw-interpreter-list"><h1>No se pudo cargar la ficha</h1><p>${esc(error.message||"Error de carga")}</p><a href="personas.html">Volver al catálogo</a></section>`;
  }
})();
