
/* MI WRESTLING 2.0 | DETALLE DE EVENTO: DATOS DE TEMPORADA + MATCHES CENTRALIZADOS */
(async function(){
 "use strict";
 const main=document.querySelector("[data-event-main]")||document.querySelector("main.site-main");if(!main)return;
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const get=async p=>{const r=await fetch(p);if(!r.ok)throw Error(`No se pudo cargar ${p} (HTTP ${r.status})`);return r.json()};
 const date=e=>e?new Intl.DateTimeFormat("es-AR",{day:"2-digit",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(e+"T00:00:00Z")):"Fecha no registrada";
 try{
  const [catalog,matches,wrestlers,personas,teams,indexEvents]=await Promise.all([get("data/events/catalog.json"),get("data/matches/matches.json"),get("data/wrestlers/wrestlers.json"),get("data/personas/personas.json"),get("data/teams/teams.json").catch(()=>[]),get("data/events/events.json").catch(()=>[])]);
  const events=[],seasons=[];
  for(const c of catalog.categories||[])for(const s of c.seasons||[]){try{const data=await get(s.path);seasons.push({...data,_path:s.path,_category:c});for(const e of data.events||[])if(!events.some(x=>x.id===e.id))events.push({...e,categoryId:c.id,categoryName:c.name,seasonId:data.id,year:e.year||data.year});}catch(error){console.warn(error);}}
  for(const e of indexEvents||[])if(!events.some(x=>x.id===e.id))events.push(e);
  const id=new URLSearchParams(location.search).get("id");
  if(!id){main.innerHTML=`<section class="page-hero"><div class="eyebrow">MI WRESTLING 2.0 / EVENT ARCHIVE</div><h1>EVENTOS</h1><p class="lead">Explorá las carteleras por categoría y año.</p><a class="mw-event-back" href="events.html">ABRIR CATÁLOGO DE EVENTOS ↗</a></section>`;return;}
  const event=events.find(e=>String(e.id)===String(id));
  if(!event){main.innerHTML=`<section class="mw-event-empty"><h1>Evento no encontrado</h1><p>No existe el ID <code>${esc(id)}</code> en el archivo.</p><a href="events.html">Volver al catálogo</a></section>`;return;}
  const eventMatches=matches.filter(m=>String(m.eventId||"")===String(event.id)||(event.matchIds||[]).some(mid=>String(mid)===String(m.id))).sort((a,b)=>(a.order??9999)-(b.order??9999)||String(a.id).localeCompare(String(b.id)));
  const category=(catalog.categories||[]).find(c=>c.id===event.categoryId)||null;
  const backLink=`events.html?category=${encodeURIComponent(event.categoryId||category?.id||"ple")}${event.year?`&year=${encodeURIComponent(event.year)}`:""}`;
  const cards=eventMatches.length&&window.MIW_MATCH_CARD?eventMatches.map(m=>window.MIW_MATCH_CARD.render(m,{wrestlers,personas,events,teams})).join(""):'<div class="mw-event-empty">Este evento todavía no tiene combates vinculados. No se inventan resultados.</div>';
  main.innerHTML=`<a class="mw-event-back" href="${backLink}">← VOLVER AL ARCHIVO</a><header class="page-hero mw-event-detail-hero"><div class="eyebrow">${esc(category?.name||event.categoryName||"MI WRESTLING 2.0")} / ${esc(event.year||String(event.date||"").slice(0,4)||"ARCHIVO")}</div><h1>${esc(event.name||event.title||event.id)}</h1><p class="lead">${esc(date(event.date))}${event.location?" · "+esc(event.location):""}</p>${event.description?`<p>${esc(event.description)}</p>`:""}<div class="mw-event-detail-meta"><span>${esc(event.status||event.mode||"Estado pendiente")}</span><span>${eventMatches.length} combate(s)</span>${event.type?`<span>${esc(event.type)}</span>`:""}${event.brand?`<span>${esc(event.brand)}</span>`:""}</div></header><section class="mw-event-section"><div class="mw-event-section-heading"><div><span class="mw-event-kicker">OFFICIAL CARD</span><h2>Cartelera y resultados</h2></div><span>${eventMatches.length} combate(s)</span></div>${cards}</section>`;
  document.title=`${event.name||event.title||event.id} | MI WRESTLING 2.0`;
 }catch(error){main.innerHTML=`<section class="mw-event-empty"><h1>No se pudo cargar el evento</h1><p>${esc(error.message||error)}</p></section>`;}
})();
