/* MI WRESTLING 2.0 | RÉCORDS DE SUPERSTRELLAS E INTÉRPRETES */
(async function(){
  "use strict";
  const main=document.querySelector("[data-records-main]");
  if(!main)return;
  const params=new URLSearchParams(location.search);
  const wrestlerId=params.get("wrestler"),interpreterId=params.get("interpreter"),season=params.get("season");
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const statMarkup=r=>`<div class="mw-record-stat-grid"><article class="mw-record-stat"><span>VICTORIAS</span><strong>${r.wins}</strong></article><article class="mw-record-stat"><span>DERROTAS</span><strong>${r.losses}</strong></article><article class="mw-record-stat"><span>EMPATES</span><strong>${r.draws}</strong></article><article class="mw-record-stat"><span>COMBATES</span><strong>${r.appearances}</strong></article></div>`;
  try{
    const [wrestlers,personas,matches,events,tournaments,championshipData]=await Promise.all([
      fetch("data/wrestlers/wrestlers.json").then(r=>{if(!r.ok)throw Error("No se pudo cargar el registro de superestrellas.");return r.json()}),
      fetch("data/personas/personas.json").then(r=>r.ok?r.json():[]),
      fetch("data/matches/matches.json").then(r=>r.ok?r.json():[]),
      fetch("data/events/events.json").then(r=>r.ok?r.json():[]),
      fetch("data/tournaments/tournaments.json").then(r=>r.ok?r.json():[]),
      window.MIW_CHAMPIONSHIP_HISTORY?window.MIW_CHAMPIONSHIP_HISTORY.load():Promise.resolve(null)
    ]);
    if(championshipData)championshipData.wrestlers=wrestlers;
    if(wrestlerId){
      const w=wrestlers.find(x=>x.id===wrestlerId);
      if(!w)throw Error("No se encontró esa superestrella.");
      const own=matches.filter(m=>(m.participants||[]).some(p=>String(p.wrestlerId)===String(w.id)));
      const calculated=window.MIW_STATS?.recordForWrestler(matches,w.id,season)||{wins:0,losses:0,draws:0,appearances:own.length,winRate:0};
      const legacy=w.record||w.legacyStats||{};
      const recordHTML=own.length?statMarkup(calculated):`<section class="mw-record-legacy"><h2>Récord histórico conservado</h2><div class="mw-record-stat-grid"><article class="mw-record-stat"><span>RECORD 2026</span><strong>${esc(legacy.season2026||legacy.overall2026||"Sin datos")}</strong></article><article class="mw-record-stat"><span>RECORD DE CARRERA</span><strong>${esc(legacy.career||legacy.careerOverall||"Sin datos")}</strong></article></div><p>Estos valores provienen del resumen histórico que ya estaba en el ZIP. No existen registros individuales de combates para reconstruir una cartelera real todavía.</p></section>`;
      const titleCards=championshipData?window.MIW_CHAMPIONSHIP_HISTORY.titleCards(w.id,championshipData):"";
      const tournamentTimeline=championshipData?window.MIW_CHAMPIONSHIP_HISTORY.tournamentTimeline(w.id,{...championshipData,tournaments,matches,events}):"";
      const linked=own.length&&window.MIW_MATCH_CARD?own.map(m=>window.MIW_MATCH_CARD.render(m,{wrestlers,personas,events})).join(""):'<p class="mw-record-note">Todavía no hay combates individuales vinculados a esta superestrella.</p>';
      main.innerHTML=`<header class="mw-record-hero"><p class="mw-record-eyebrow">MI WRESTLING 2.0 / MATCH ARCHIVE</p><h1>${esc(w.name)}</h1><p>Récord de superestrella${season?" · Temporada "+esc(season):""}</p></header>${recordHTML}${titleCards?`<section class="mw-record-note mw-record-titles"><h2>Campeonatos ganados</h2>${titleCards}</section>`:""}<section class="mw-record-note mw-record-tournaments"><h2>Cronología de torneos</h2>${tournamentTimeline}</section><section class="mw-record-note"><h2>Historial de combates</h2>${linked}</section><a class="mw-record-back" href="superstar.html?id=${encodeURIComponent(w.id)}">← VOLVER A LA FICHA</a>`;
      document.title=`Récord de ${w.name} | MI WRESTLING 2.0`;return;
    }
    if(interpreterId){
      const person=personas.find(p=>p.id===interpreterId);
      if(!person)throw Error("No se encontró ese intérprete.");
      const own=matches.filter(m=>(m.participants||[]).some(p=>String(p.interpreterId||"")===String(person.id)&&(p.role||"competitor")==="competitor"));
      const r=window.MIW_STATS?.recordForInterpreter(matches,person.id,season)||{wins:0,losses:0,draws:0,appearances:own.length,winRate:0};
      const interpreterTitles=championshipData?window.MIW_CHAMPIONSHIP_HISTORY.interpreterTitleCards(person.id,championshipData,wrestlers):"";
      const cards=own.length&&window.MIW_MATCH_CARD?own.map(m=>window.MIW_MATCH_CARD.render(m,{wrestlers,personas,events})).join(""):'<p class="mw-record-note">No hay combates individuales cargados para este intérprete. Las estadísticas se calcularán automáticamente cuando se registren resultados reales.</p>';
      main.innerHTML=`<header class="mw-record-hero"><p class="mw-record-eyebrow">PLAYER PROFILE / MATCH ARCHIVE</p><h1>${esc(person.name)}</h1><p>${esc(person.country||"País no registrado")} · ${person.status==="active"?"Intérprete activo":"Intérprete inactivo"}</p></header>${statMarkup(r)}${interpreterTitles?`<section class="mw-record-note mw-record-titles"><h2>Campeonatos de superestrellas interpretadas</h2>${interpreterTitles}</section>`:""}<section class="mw-record-note"><h2>Historial de participación</h2>${cards}</section><a class="mw-record-back" href="persona.html?id=${encodeURIComponent(person.id)}">← VOLVER A LA FICHA DEL INTÉRPRETE</a>`;
      document.title=`Récord de ${person.name} | MI WRESTLING 2.0`;return;
    }
    main.innerHTML=`<header class="mw-record-hero"><p class="mw-record-eyebrow">MI WRESTLING 2.0 / MATCH ARCHIVE</p><h1>RÉCORDS</h1><p>Elegí una superestrella o un intérprete para consultar su historial.</p></header><section class="mw-record-list-section"><h2>Intérpretes</h2><div class="mw-record-links">${personas.map(p=>`<a href="records.html?interpreter=${encodeURIComponent(p.id)}"><span>${esc(p.name)} ${p.country?"· "+esc(p.country):""}</span><span>↗</span></a>`).join("")}</div><a class="mw-record-back" href="personas.html">VER CATÁLOGO DE INTÉRPRETES</a></section><section class="mw-record-list-section"><h2>Superestrellas</h2><div class="mw-record-links">${wrestlers.map(w=>`<a href="records.html?wrestler=${encodeURIComponent(w.id)}"><span>${esc(w.name)}</span><span>↗</span></a>`).join("")}</div></section>`;
  }catch(error){
    main.innerHTML=`<section class="mw-record-note"><h1>No se pudieron cargar los récords</h1><p>${esc(error.message||"Error de carga")}</p></section>`;
  }
})();
