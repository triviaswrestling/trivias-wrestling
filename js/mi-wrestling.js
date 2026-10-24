/* ================================================================
   MI WRESTLING 2.0 — MOTOR PÚBLICO UNIFICADO
   Navegación global, acentos rotativos, renderizado de catálogos y combates.
   Las fichas y resultados enlazan siempre al ID estable del luchador.
   ================================================================ */
(function(){
  "use strict";
  const VERSION="2.1.0";
  const THEMES=[
    {name:"azul eléctrico",accent:"#168cff",rgb:"22,140,255",second:"#00e5ff"},
    {name:"rojo arena",accent:"#ff3156",rgb:"255,49,86",second:"#ffb347"},
    {name:"violeta",accent:"#9a5bff",rgb:"154,91,255",second:"#f05bff"},
    {name:"cian",accent:"#00cfe8",rgb:"0,207,232",second:"#8df8ff"},
    {name:"dorado",accent:"#d9a62e",rgb:"217,166,46",second:"#ffe18a"},
    {name:"verde",accent:"#19c786",rgb:"25,199,134",second:"#9affd8"},
    {name:"naranja",accent:"#ff7a24",rgb:"255,122,36",second:"#ffd06a"}
  ];
  const NAV=[
    ["Inicio","index.html"],["Roster","roster.html"],["Alumni","alumni.html"],
    ["Marcas","brands.html"],["Temporadas","seasons.html"],["Calendario","calendar.html"],
    ["Eventos","events.html"],["Torneos","tournaments.html"],["Campeonatos","championships.html"],
    ["Rankings","ranking.html"],["Récords","records.html"],["Equipos","teams.html"],
    ["Personas","personas.html"],["Rivalidades","rivalries.html"],["Recaps","recaps.html"],
    ["Guía","guide.html"],["Reglas","rules.html"],["Estipulaciones","stipulations.html"],
    ["Promociones","promotions.html"],["Acerca de","about.html"]
  ];
  const PAGES={
    roster:{title:"Roster",eyebrow:"Roster activo",description:"Perfiles, presentaciones y estadísticas de los luchadores.",data:"wrestlers"},
    alumni:{title:"Alumni",eyebrow:"Archivo histórico",description:"Luchadores inactivos y sus trayectorias registradas.",data:"wrestlers"},
    events:{title:"Eventos",eyebrow:"Calendario de shows",description:"Eventos y carteleras del archivo MI WRESTLING.",data:"events"},
    event:{title:"Evento",eyebrow:"Cartelera oficial",description:"Detalles del evento, combates y resultados.",data:"events"},
    tournaments:{title:"Torneos",eyebrow:"Competencia",description:"Formatos, participantes, temporadas y finales.",data:"tournaments"},
    tournament:{title:"Torneo",eyebrow:"Ficha de torneo",description:"Participantes, rondas y resultados.",data:"tournaments"},
    championships:{title:"Campeonatos",eyebrow:"Historia titular",description:"Títulos, campeones y reinados registrados.",data:"championships"},
    championship:{title:"Campeonato",eyebrow:"Título oficial",description:"Información del campeonato y su historial.",data:"championships"},
    ranking:{title:"Rankings",eyebrow:"Clasificación",description:"Consultá y compará los perfiles del archivo.",data:"wrestlers"},
    records:{title:"Récords",eyebrow:"Estadísticas",description:"Registros y métricas disponibles en los datos.",data:"wrestlers"},
    superstar:{title:"Superstar",eyebrow:"Ficha individual",description:"Perfil principal, estadísticas y presentaciones alternativas.",data:"wrestlers"},
    personas:{title:"Personas alternativas",eyebrow:"Presentaciones",description:"Alter egos vinculados al perfil principal, sin duplicar su historial.",data:"personas"},
    persona:{title:"Presentación",eyebrow:"Persona alternativa",description:"Una presentación vinculada a un luchador principal.",data:"personas"},
    teams:{title:"Equipos",eyebrow:"Alianzas",description:"Equipos y miembros registrados.",data:"teams"},
    team:{title:"Equipo",eyebrow:"Ficha de equipo",description:"Miembros y resultados de la alianza.",data:"teams"},
    brands:{title:"Marcas",eyebrow:"Universo MIW",description:"Marcas y divisiones de competencia.",data:"brands"},
    promotions:{title:"Promociones",eyebrow:"Organizaciones",description:"Promociones y sus registros.",data:"promotions"},
    promotion:{title:"Promoción",eyebrow:"Ficha de promoción",description:"Información y archivo de la promoción.",data:"promotions"},
    recaps:{title:"Recaps",eyebrow:"Resumen de eventos",description:"Resultados y resúmenes publicados.",data:"recaps"},
    recap:{title:"Recap",eyebrow:"Resumen",description:"Resumen del evento seleccionado.",data:"recaps"},
    rivalries:{title:"Rivalidades",eyebrow:"Historias",description:"Rivalidades y enfrentamientos registrados.",data:"wrestlers"},
    rivalry:{title:"Rivalidad",eyebrow:"Historia de rivalidad",description:"Participantes y resultados relacionados.",data:"wrestlers"},
    seasons:{title:"Temporadas",eyebrow:"Archivo por temporada",description:"Organización histórica por temporadas.",data:"seasons"},
    calendar:{title:"Calendario",eyebrow:"Agenda",description:"Explorá las fechas registradas.",data:"events"},
    search:{title:"Buscar",eyebrow:"Buscador global",description:"Encontrá luchadores, eventos, títulos y torneos.",data:"wrestlers"},
    guide:{title:"Guía",eyebrow:"Cómo usar el archivo",description:"Conocé las secciones y el sistema de registros."},
    rules:{title:"Reglas",eyebrow:"Reglamento",description:"Reglas de la competencia."},
    stipulations:{title:"Estipulaciones",eyebrow:"Tipos de combate",description:"Formatos y condiciones de los combates."},
    about:{title:"Acerca de",eyebrow:"MI WRESTLING 2.0",description:"Archivo de lucha, trivia y resultados históricos."},
    "404":{title:"Página no encontrada",eyebrow:"404",description:"La página que buscás no está disponible."}
  };
  const slug=()=>location.pathname.split("/").pop().replace(/\.html?$/i,"")||"index";
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const safeId=value=>String(value||"").trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"-");
  function applyTheme(){
    const page=slug();
    let hash=0;for(let i=0;i<page.length;i++)hash=(hash*31+page.charCodeAt(i))>>>0;
    const previous=Number(sessionStorage.getItem("miw-theme-index"));
    let index=(Number.isInteger(previous)?previous+1:hash)%THEMES.length;
    if(index<0)index=0;
    sessionStorage.setItem("miw-theme-index",String(index));
    const theme=THEMES[index],root=document.documentElement;
    root.style.setProperty("--accent",theme.accent);root.style.setProperty("--accent-rgb",theme.rgb);root.style.setProperty("--accent-2",theme.second);
    root.dataset.theme=theme.name;root.dataset.page=page;root.dataset.app="mi-wrestling";root.dataset.version=VERSION;
  }
  function makeNavigation(){
    if(document.querySelector(".site-nav"))return;
    const header=document.createElement("header");header.className="site-nav";
    const current=slug()+".html";
    header.innerHTML='<nav class="nav-inner" aria-label="Navegación principal"><a class="nav-brand" href="index.html"><img src="images/logo.png" alt="" width="38" height="38"><span>MI WRESTLING <span class="accent-text">2.0</span></span></a><button class="nav-toggle" type="button" aria-label="Abrir menú" aria-expanded="false">☰</button><div class="nav-links"></div></nav>';
    const links=header.querySelector(".nav-links");
    NAV.forEach(([label,url])=>{const a=document.createElement("a");a.href=url;a.textContent=label;if(url===current)a.setAttribute("aria-current","page");links.appendChild(a)});
    const toggle=header.querySelector(".nav-toggle");
    toggle.addEventListener("click",()=>{const open=links.classList.toggle("is-open");toggle.setAttribute("aria-expanded",String(open));toggle.setAttribute("aria-label",open?"Cerrar menú":"Abrir menú");toggle.textContent=open?"×":"☰"});
    document.addEventListener("click",event=>{if(!header.contains(event.target)){links.classList.remove("is-open");toggle.setAttribute("aria-expanded","false");toggle.textContent="☰"}});
    document.addEventListener("keydown",event=>{if(event.key==="Escape"){links.classList.remove("is-open");toggle.setAttribute("aria-expanded","false");toggle.textContent="☰"}});
    const main=document.querySelector("main");if(main)document.body.insertBefore(header,main);else document.body.prepend(header);
  }
  async function loadJSON(file){
    const response=await fetch("data/"+file+"/"+file+".json",{cache:"no-store"});
    if(!response.ok)throw new Error("No se pudo cargar data/"+file+"/"+file+".json ("+response.status+")");
    const result=await response.json();return Array.isArray(result)?result:(Array.isArray(result.items)?result.items:[]);
  }
  function dataName(item){return item.name||item.nombre||item.title||item.nombreEvento||item.id||"Registro sin nombre"}
  function card(item,kind){
    const id=safeId(item.id||dataName(item));let href="#";
    if(kind==="wrestlers")href="superstar.html?id="+encodeURIComponent(item.id||id);
    if(kind==="events")href="event.html?id="+encodeURIComponent(item.id||id);
    if(kind==="tournaments")href="tournament.html?id="+encodeURIComponent(item.id||id);
    if(kind==="championships")href="championship.html?id="+encodeURIComponent(item.id||id);
    if(kind==="personas")href="persona.html?id="+encodeURIComponent(item.id||id);
    if(kind==="teams")href="team.html?id="+encodeURIComponent(item.id||id);
    if(kind==="promotions")href="promotion.html?id="+encodeURIComponent(item.id||id);
    if(kind==="recaps")href="recap.html?id="+encodeURIComponent(item.id||id);
    const category=item.category||item.categoria||item.brand||item.status||item.estado||kind;
    return '<a class="wrestler-card" href="'+esc(href)+'"><div class="card-copy"><span class="pill">'+esc(category)+'</span><h2 class="card-name">'+esc(dataName(item))+'</h2><p class="card-meta">'+esc(item.nickname||item.apodo||item.description||item.descripcion||"Abrir ficha y consultar detalles")+'</p></div></a>';
  }
  async function renderPublicPage(){
    const page=slug();if(page==="index")return;
    const meta=PAGES[page];if(!meta)return;
    let main=document.querySelector("main");if(!main){main=document.createElement("main");main.className="site-main";document.body.appendChild(main)}
    if(main.dataset.keepContent==="true")return;
    main.classList.add("site-main");
    const id=new URLSearchParams(location.search).get("id");
    main.innerHTML='<section class="page-heading"><div class="eyebrow">'+esc(meta.eyebrow)+'</div><h1 class="page-title">'+esc(meta.title)+'</h1><p class="page-description">'+esc(meta.description)+'</p></section><div class="filters"><input class="search-input" type="search" placeholder="Buscar en '+esc(meta.title.toLowerCase())+'…" aria-label="Buscar"><span class="text-muted" data-count>Preparando archivo…</span></div><section class="data-grid" data-results><div class="loading"></div></section>';
    if(!meta.data){main.querySelector("[data-results]").innerHTML='<div class="panel">'+esc(meta.description)+'</div>';return}
    const kind=meta.data;
    try{
      let rows=await loadJSON(kind);
      if(page==="roster")rows=rows.filter(item=>!(["inactive","alumni","retired","inactivo"].includes(String(item.status||item.estado||"").toLowerCase())));
      if(page==="alumni")rows=rows.filter(item=>["inactive","alumni","retired","inactivo"].includes(String(item.status||item.estado||"").toLowerCase()));
      if(["superstar","event","tournament","championship","persona","team","promotion","recap"].includes(page)&&id)rows=rows.filter(item=>String(item.id)===id);
      const results=main.querySelector("[data-results]"),count=main.querySelector("[data-count]"),search=main.querySelector("input[type=search]");
      const draw=query=>{const filtered=rows.filter(item=>(dataName(item)+" "+(item.nickname||"")+" "+(item.brand||"")).toLowerCase().includes(query.toLowerCase()));count.textContent=filtered.length+" registro(s)";results.innerHTML=filtered.length?filtered.map(item=>card(item,kind)).join(""):'<div class="empty-state">Todavía no hay registros cargados para esta sección. Agregalos en data/'+esc(kind)+'/'+esc(kind)+'.json.</div>';};
      draw("");search.addEventListener("input",()=>draw(search.value));
      if(["event","tournament","championship","persona","team","promotion","recap","superstar"].includes(page)&&id&&rows.length===0){results.innerHTML='<div class="empty-state">No encontramos el ID <strong>'+esc(id)+'</strong> en el archivo de datos.</div>'}
    }catch(error){main.querySelector("[data-results]").innerHTML='<div class="error-state">'+esc(error.message)+'. Revisá que el JSON exista y tenga contenido válido.</div>';main.querySelector("[data-count]").textContent="Archivo no disponible";}
  }
  function enhanceMatchCards(){
    document.querySelectorAll(".match-card").forEach(match=>{
      const sides=[...match.querySelectorAll(".match-side")];if(sides.length<2)return;
      const scores=sides.map(side=>Number(side.dataset.score));
      if(scores.every(Number.isFinite)&&scores[0]!==scores[1]){sides[scores[0]>scores[1]?0:1].classList.add("is-winner");sides[scores[0]>scores[1]?1:0].classList.add("is-loser")}
      let controls=match.querySelector(".match-controls");if(!controls){controls=document.createElement("div");controls.className="match-controls";match.appendChild(controls)}
      if(!controls.querySelector("button")){const button=document.createElement("button");button.className="button";button.type="button";button.textContent="Resaltar resultado";button.setAttribute("aria-pressed","false");button.addEventListener("click",()=>{const active=match.classList.toggle("result-active");button.setAttribute("aria-pressed",String(active));button.textContent=active?"Restaurar colores":"Resaltar resultado"});controls.appendChild(button)}
    });
  }
  function boot(){
    applyTheme();
    const page=slug();
    // Inicio mantiene su propio catálogo central de botones grandes.
    if(page!=="index")makeNavigation();
    renderPublicPage();
    enhanceMatchCards();
    document.dispatchEvent(new CustomEvent("miw:ready",{detail:{version:VERSION,page}}));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.MIW={version:VERSION,themes:THEMES,pages:PAGES,loadJSON,enhanceMatchCards};
})();
