/* MI WRESTLING 2.0 | CONEXIONES DE CAMPEONATOS, REINADOS Y CRONOLOGÍA */
(function(){
  "use strict";
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const date=v=>{if(!v)return "Fecha no registrada";const d=new Date(v+"T00:00:00Z");return Number.isNaN(d.getTime())?"Fecha no registrada":new Intl.DateTimeFormat("es-AR",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"}).format(d)};
  async function load(){
    const get=(p)=>fetch(p).then(r=>r.ok?r.json():[]).catch(()=>[]);
    const [championships,reigns,teams,tournaments,matches,events,assignments]=await Promise.all([
      get("data/championships/championships.json"),get("data/reigns/reigns.json"),get("data/teams/teams.json"),Promise.all([get("data/tournaments/tournaments.json"),get("data/tournaments/outsider-tournaments.json")]).then(a=>[...a[0],...a[1]]),get("data/matches/matches.json"),get("data/events/events.json"),get("data/personas/assignments.json")
    ]);
    return {championships,reigns,teams,tournaments,matches,events,assignments};
  }
  function titleCards(wrestlerId,data){
    const wrestler=(data.wrestlers||[]).find(w=>String(w.id)===String(wrestlerId));
    const teamIds=new Set((data.teams||[]).filter(t=>(t.members||[]).some(m=>String(m.wrestlerId)===String(wrestlerId)&&m.status==="confirmed")&&!t.membershipReviewRequired).map(t=>t.id));
    const wins=data.championships.map(c=>{
      const own=data.reigns.filter(r=>r.championshipId===c.id&&r.status!=="vacant"&&(String(r.championId||"")===String(wrestlerId)||teamIds.has(r.championTeamId||r.championId)||String(r.championName||"").toLowerCase()===String(wrestler?.name||"").toLowerCase()));
      return {c,own};
    }).filter(x=>x.own.length);
    if(!wins.length)return "";
    return `<div class="mw-title-win-grid">${wins.map(({c,own})=>`<a class="mw-title-win-card title-${esc(c.id)}" href="championship.html?id=${encodeURIComponent(c.id)}"><span class="mw-title-win-art"><span class="mw-title-orbit"></span><b>${esc(c.promotion||"MIW")}</b></span><span class="mw-title-win-name">${esc(c.name)}</span><span class="mw-title-win-count">${own.length} ${own.length===1?"REINADO":"REINADOS"}</span><span class="mw-title-win-current">${own.some(r=>r.status==="current")?"CAMPEÓN ACTUAL":"HISTORIAL"}</span></a>`).join("")}</div>`;
  }
  function interpreterTitleCards(interpreterId,data,wrestlers){
    const wrestlerIds=new Set(data.assignments.filter(a=>String(a.interpreterId)===String(interpreterId)).map(a=>String(a.wrestlerId)));
    const confirmedTeams=new Set(data.teams.filter(t=>!t.membershipReviewRequired&&(t.members||[]).some(m=>wrestlerIds.has(String(m.wrestlerId))&&m.status==="confirmed")).map(t=>t.id));
    const wins=data.championships.map(c=>({c,own:data.reigns.filter(r=>r.championshipId===c.id&&r.status!=="vacant"&&(wrestlerIds.has(String(r.championId||""))||confirmedTeams.has(String(r.championTeamId||""))))})).filter(x=>x.own.length);
    if(!wins.length)return "";
    return `<div class="mw-title-win-grid">${wins.map(({c,own})=>`<a class="mw-title-win-card title-${esc(c.id)}" href="championship.html?id=${encodeURIComponent(c.id)}"><span class="mw-title-win-art"><span class="mw-title-orbit"></span><b>${esc(c.promotion||"MIW")}</b></span><span class="mw-title-win-name">${esc(c.name)}</span><span class="mw-title-win-count">${own.length} ${own.length===1?"REINADO":"REINADOS"}</span><span class="mw-title-win-current">POR PERSONAJES ASIGNADOS</span></a>`).join("")}</div>`;
  }
  function teamTitleCards(teamId,data){
    const wins=data.championships.map(c=>({c,own:data.reigns.filter(r=>r.championshipId===c.id&&r.status!=="vacant"&&String(r.championTeamId||r.championId||"")===String(teamId))})).filter(x=>x.own.length);
    if(!wins.length)return "";
    return `<div class="mw-title-win-grid">${wins.map(({c,own})=>`<a class="mw-title-win-card title-${esc(c.id)}" href="championship.html?id=${encodeURIComponent(c.id)}"><span class="mw-title-win-art"><span class="mw-title-orbit"></span><b>${esc(c.promotion||"MIW")}</b></span><span class="mw-title-win-name">${esc(c.name)}</span><span class="mw-title-win-count">${own.length} ${own.length===1?"REINADO":"REINADOS"}</span><span class="mw-title-win-current">${own.some(r=>r.status==="current")?"CAMPEÓN ACTUAL":"HISTORIAL"}</span></a>`).join("")}</div>`;
  }
  function tournamentTimeline(wrestlerId,data){
    const wrestler=(data.wrestlers||[]).find(w=>String(w.id)===String(wrestlerId));
    const linked=data.matches.filter(m=>(m.participants||[]).some(p=>String(p.wrestlerId)===String(wrestlerId))&&m.tournamentId);
    const nameKey=String(wrestler?.name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    const rosterLinked=data.tournaments.filter(t=>{const values=[...(t.participantIds||[]),...(t.participantNames||[]),...(t.draft?.participantNames||[]),...(t.roster||[])].map(x=>typeof x==="string"?x:x?.name||x?.id||"");return values.some(v=>String(v)===String(wrestlerId)||String(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()===nameKey&&nameKey);});
    const ids=[...new Set([...linked.map(m=>String(m.tournamentId)),...rosterLinked.map(t=>String(t.id))])];
    const entries=ids.map(id=>{
      const t=data.tournaments.find(x=>String(x.id)===id); const ms=linked.filter(m=>String(m.tournamentId)===id);
      const dates=ms.map(m=>data.events.find(e=>String(e.id)===String(m.eventId))?.date).filter(Boolean).sort();
      return {id,t,ms,year:dates[0]?.slice(0,4)||t?.year||t?.seasonNumber||"AÑO ?",date:dates[0]||""};
    }).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    if(!entries.length)return '<div class="mw-title-empty">Todavía no hay torneos vinculados a los combates de esta superestrella.</div>';
    return `<div class="mw-tournament-timeline">${entries.map(x=>`<a class="mw-tournament-timeline-card" href="tournament.html?id=${encodeURIComponent(x.id)}"><span class="mw-tournament-timeline-year">${esc(x.year)}</span><span class="mw-tournament-timeline-line"></span><span class="mw-tournament-timeline-body"><b>${esc(x.t?.name||x.t?.title||x.id)}</b><small>${esc(x.t?.brand||"Torneo")} · ${x.ms.length?x.ms.length+" combate(s) conectado(s)":"Participación registrada en el roster"}</small></span><span class="mw-tournament-timeline-arrow">↗</span></a>`).join("")}</div>`;
  }
  window.MIW_CHAMPIONSHIP_HISTORY=Object.freeze({load,titleCards,interpreterTitleCards,teamTitleCards,tournamentTimeline,date,esc});
})();
