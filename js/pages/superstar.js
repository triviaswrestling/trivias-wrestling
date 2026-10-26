
/* MI WRESTLING 2.0 | FICHA INDIVIDUAL DE SUPERSTRELLA */
(async function(){
  "use strict";
  const main=document.querySelector("[data-superstar-main]")||document.querySelector("[data-page-content]");
  if(!main)return;
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const date=value=>{if(!value)return "Fecha no registrada";const d=new Date(value+"T00:00:00Z");return Number.isNaN(d.getTime())?"Fecha no registrada":new Intl.DateTimeFormat("es-AR",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"}).format(d);};
  try{
    const [wrestlers,people,assignments,matches,events,tournaments,championshipData]=await Promise.all([
      fetch("data/wrestlers/wrestlers.json").then(r=>r.json()),
      fetch("data/personas/personas.json").then(r=>r.json()),
      fetch("data/personas/assignments.json").then(r=>r.json()),
      fetch("data/matches/matches.json").then(r=>r.json()),
      fetch("data/events/events.json").then(r=>r.json()),
      fetch("data/tournaments/tournaments.json").then(r=>r.ok?r.json():[]).catch(()=>[]),
      window.MIW_CHAMPIONSHIP_HISTORY?window.MIW_CHAMPIONSHIP_HISTORY.load():Promise.resolve(null)
    ]);
    const id=new URLSearchParams(location.search).get("id");
    if(!id){main.innerHTML='<section class="mw-generic-empty"><h1>Falta el ID de la superestrella</h1><p>Abrí esta ficha desde el <a href="roster.html">roster</a>.</p></section>';return;}
    const w=wrestlers.find(x=>String(x.id)===String(id));
    if(!w){main.innerHTML=`<section class="mw-generic-empty"><h1>Superestrella no encontrada</h1><p>No existe el ID <code>${esc(id)}</code>.</p><a href="roster.html">Volver al roster</a></section>`;return;}
    if(championshipData)championshipDa;ta.wrestlers=wrestlers;
    const titleCards=championshipData?window.MIW_CHAMPIONSHIP_HISTORY.titleCards(w.id,championshipData):"";
    const tournamentTimeline=championshipData?window.MIW_CHAMPIONSHIP_HISTORY.tournamentTimeline(w.id,{...championshipData,tournaments,matches,events}):"";
    const history=assignments.filter(a=>String(a.wrestlerId)===String(w.id)).sort((a,b)=>String(b.startDate||"").localeCompare(String(a.startDate||"")));
    const ownMatches=matches.filter(m=>(m.participants||[]).some(p=>String(p.wrestlerId)===String(w.id)));
    const record=window.MIW_STATS?window.MIW_STATS.recordForWrestler(matches,w.id):{wins:0,losses:0,draws:0,appearances:ownMatches.length,winRate:0};
    const recordPanel=ownMatches.length?`<div class="mw-interpreter-stats"><article class="mw-interpreter-stat"><strong>${record.wins}</strong><span>VICTORIAS</span></article><article class="mw-interpreter-stat"><strong>${record.losses}</strong><span>DERROTAS</span></article><article class="mw-interpreter-stat"><strong>${record.draws}</strong><span>EMPATES</span></article><article class="mw-interpreter-stat"><strong>${record.appearances}</strong><span>COMBATES</span></article></div>`:`<div class="mw-record-legacy"><h2>Récord histórico conservado</h2><p>Temporada 2026: <strong>${esc(w.record?.season2026||w.legacyStats?.overall2026||"Sin datos")}</strong></p><p>Carrera: <strong>${esc(w.record?.career||w.legacyStats?.careerOverall||"Sin datos")}</strong></p><p>Estos son resúmenes históricos heredados. No hay combates individuales disponibles para reconstruir los resultados.</p></div>`;
    const historyHTML=history.length?history.map(a=>{const p=people.find(x=>String(x.id)===String(a.interpreterId));const current=a.status==="active"&&!a.endDate;return `<article class="mw-assignment"><div><a href="persona.html?id=${encodeURIComponent(a.interpreterId)}">${esc(p?.name||a.interpreterId)}</a><small>${esc(date(a.startDate))} — ${esc(a.endDate?date(a.endDate):(current?"Presente":"Fin no registrado"))}</small></div><span class="mw-assignment-status">${current?"Actual":"Historial"}</span></article>`}).join(""):'<div class="mw-interpreter-list">No hay intérpretes vinculados a esta superestrella todavía.</div>';
    const matchHTML=ownMatches.length&&window.MIW_MATCH_CARD?ownMatches.map(m=>window.MIW_MATCH_CARD.render(m,{wrestlers,personas:people,events})).join(""):'<div class="mw-interpreter-list">No hay combates individuales vinculados a esta superestrella.</div>';
    main.innerHTML=`<a class="mw-interpreter-action" href="roster.html">← VOLVER AL ROSTER</a><header class="mw-interpreter-hero mw-superstar-hero">${w.image?`<img class="mw-superstar-image" src="${esc(w.image)}" alt="${esc(w.name)}" onerror="this.style.display='none'">`:`<div class="mw-interpreter-avatar">${esc(String(w.name).split(/\s+/).map(x=>x[0]).join("").slice(0,3))}</div>`}<div><div class="mw-interpreter-eyebrow">${esc(w.brand||"MI WRESTLING 2.0")} / ${esc(w.status||"Sin estado")}</div><h1>${esc(w.name)}</h1>${w.nickname?`<p>${esc(w.nickname)}</p>`:""}<div class="mw-interpreter-meta"><span>ID ${esc(w.id)}</span>${w.division?`<span>· ${esc(w.division)}</span>`:""}${w.stable?`<span>· ${esc(w.stable)}</span>`:""}</div><div class="mw-interpreter-actions"><a class="mw-interpreter-action is-primary" href="records.html?wrestler=${encodeURIComponent(w.id)}">VER RÉCORD ↗</a></div></div></header>${recordPanel}${titleCards?`<section class="mw-interpreter-section mw-championship-achievements"><div class="mw-interpreter-section__heading"><h2>Campeonatos ganados</h2><span>POR TÍTULO</span></div>${titleCards}</section>`:""}<section class="mw-interpreter-section mw-tournament-history"><div class="mw-interpreter-section__heading"><h2>Cronología de torneos</h2><span>PARTICIPACIONES</span></div>${tournamentTimeline}</section><section class="mw-interpreter-section"><div class="mw-interpreter-section__heading"><h2>Intérpretes a lo largo de la historia</h2><span>${history.length}</span></div><div class="mw-assignment-list">${historyHTML}</div></section><section class="mw-interpreter-section"><div class="mw-interpreter-section__heading"><h2>Historial de combates</h2><span>${ownMatches.length}</span></div>${matchHTML}</section>`;
    document.title=`${w.name} | MI WRESTLING 2.0`;
  }catch(error){main.innerHTML=`<section class="mw-generic-empty"><h1>No se pudo cargar la ficha</h1><p>${esc(error.message||error)}</p></section>`;}
})()
