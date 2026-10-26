
/* MI WRESTLING 2.0 | CATÁLOGO: CATEGORÍAS + FILTRO DE AÑO (SIN PÁGINA INTERMEDIA DE TEMPORADA) */
(async function(){
  "use strict";
  const root=document.querySelector("[data-events-catalog]");if(!root)return;
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const get=async p=>{const r=await fetch(p);if(!r.ok)throw Error(`No se pudo cargar ${p} (HTTP ${r.status})`);return r.json()};
  const fmtDate=e=>e.date?new Intl.DateTimeFormat("es-AR",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(e.date+"T00:00:00Z")):"Fecha pendiente";
  try{
    const [catalog,indexEvents,brands,promotions,wrestlers]=await Promise.all([
      get("data/events/catalog.json"),get("data/events/events.json").catch(()=>[]),get("data/brands/brands.json").catch(()=>[]),get("data/promotions/promotions.json").catch(()=>[]),get("data/wrestlers/wrestlers.json").catch(()=>[])
    ]);
    const allEvents=[];
    for(const category of catalog.categories||[]){
      for(const ref of category.seasons||[]){
        try{const file=await get(ref.path);for(const e of file.events||[])if(!allEvents.some(x=>x.id===e.id))allEvents.push({...e,categoryId:category.id,categoryName:category.name,year:e.year||file.year,seasonId:file.id});}catch(error){console.warn(error);}
      }
    }
    for(const e of indexEvents||[])if(!allEvents.some(x=>x.id===e.id))allEvents.push(e);
    const hasTNA=allEvents.some(e=>String(e.categoryId||"").toLowerCase()==="tna"||String(e.brand||"").toLowerCase()==="tna")||brands.some(x=>/tna/i.test(`${x.id||""} ${x.name||""}`))||promotions.some(x=>/tna/i.test(`${x.id||""} ${x.name||""}`))||wrestlers.some(x=>/tna/i.test(String(x.brand||"")));
    const categories=(catalog.categories||[]).filter(c=>c.id!=="tna"||hasTNA||c.show===true).sort((a,b)=>(a.order||0)-(b.order||0));
    const params=new URLSearchParams(location.search),selectedId=params.get("category"),selectedYear=params.get("year")||"all";
    const selected=categories.find(c=>c.id===selectedId)||null;
    const categoryEvents=selected?allEvents.filter(e=>String(e.categoryId||"").toLowerCase()===selected.id):[];
    const years=[...new Set(categoryEvents.map(e=>Number(e.year||String(e.date||"").slice(0,4))).filter(Number.isFinite).filter(Boolean))].sort((a,b)=>b-a);
    const filtered=selected?categoryEvents.filter(e=>selectedYear==="all"||Number(e.year||String(e.date||"").slice(0,4))===Number(selectedYear)).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))||String(a.title||a.name||"").localeCompare(String(b.title||b.name||""))):[];
    const categoriesHTML=categories.map(c=>{
      const list=allEvents.filter(e=>e.categoryId===c.id||String(e.brand||"").toLowerCase()===c.id);
      const yearCount=new Set(list.map(e=>e.year||String(e.date||"").slice(0,4)).filter(Boolean)).size;
      return `<a class="mw-event-category-card theme-${esc(c.theme||c.id)}" href="events.html?category=${encodeURIComponent(c.id)}"><span class="mw-event-category-card__eyebrow">EVENT ARCHIVE</span><strong>${esc(c.name)}</strong><span class="mw-event-category-card__subtitle">${esc(c.subtitle||c.description||"")}</span><span class="mw-event-category-card__footer"><span>${yearCount||"—"} año(s)</span><span>${list.length} evento(s) ↗</span></span></a>`;
    }).join("");
    const eventCards=filtered.map(e=>`<a class="mw-event-card" href="event.html?id=${encodeURIComponent(e.id)}"><span class="mw-event-card__meta">${esc(e.status||e.mode||e.type||"EVENTO")}</span><strong>${esc(e.name||e.title||e.id)}</strong><span>${esc(fmtDate(e))}${e.location?" · "+esc(e.location):""}</span><span class="mw-event-card__open">VER CARTELERA ↗</span></a>`).join("");
    let html=`<section class="page-hero mw-events-hero"><div class="eyebrow">MI WRESTLING 2.0 / EVENT ARCHIVE</div><h1>EVENTOS</h1><p class="lead">Elegí una categoría. El archivo se organiza por año en el código; acá filtrás sin pasar por páginas intermedias de temporadas.</p></section>`;
    if(!selected){html+=`<section class="mw-event-category-section"><div class="mw-event-section-heading"><div><span class="mw-event-kicker">ELEGÍ TU UNIVERSO</span><h2>Catálogo de eventos</h2></div><span>${categories.length} categorías</span></div><div class="mw-event-category-grid">${categoriesHTML}</div></section>`;}
    else{
      const yearOptions=[`<option value="all" ${selectedYear==="all"?"selected":""}>Todos los años</option>`,...years.map(y=>`<option value="${y}" ${String(y)===selectedYear?"selected":""}>${y}</option>`)].join("");
      html+=`<a class="mw-event-back" href="events.html">← TODAS LAS CATEGORÍAS</a><section class="mw-event-category-hero theme-${esc(selected.theme||selected.id)}"><span>${esc(selected.subtitle||"EVENT ARCHIVE")}</span><h1>${esc(selected.name)}</h1><p>${esc(selected.description||"")}</p>${selected.id==="weekly"?'<div class="mw-event-show-pills"><span>RAW</span><span>SMACKDOWN</span></div>':""}</section><section class="mw-event-section"><div class="mw-event-section-heading"><div><span class="mw-event-kicker">ARCHIVO</span><h2>Carteleras</h2></div><span>${filtered.length} evento(s)</span></div><div class="mw-event-year-filter"><label for="event-year">FILTRAR POR AÑO</label><select id="event-year">${yearOptions}</select></div><div class="mw-event-grid">${eventCards||`<div class="mw-event-empty"><h3>${categoryEvents.length?"No hay eventos en ese año":"Archivo preparado"}</h3><p>${categoryEvents.length?"Probá con otro año para ver más carteleras.":"Todavía no hay eventos reales cargados en esta categoría. Los archivos por año ya están preparados; no agregamos resultados inventados."}</p></div>`}</div></section>`;
    }
    root.innerHTML=html;
    const yearSelect=root.querySelector("#event-year");if(yearSelect)yearSelect.addEventListener("change",()=>{const p=new URLSearchParams(location.search);if(yearSelect.value==="all")p.delete("year");else p.set("year",yearSelect.value);location.href=`events.html?${p.toString()}`;});
    document.title=`${selected?selected.name+" · "+(selectedYear==="all"?"Todos los años":selectedYear):"Eventos"} | MI WRESTLING 2.0`;
  }catch(error){root.innerHTML=`<section class="mw-event-empty"><h1>No se pudo cargar el catálogo</h1><p>${esc(error.message||error)}</p></section>`;}
})();
