
/* MI WRESTLING 2.0 | NAVEGACIÓN GLOBAL */
(function(){
  "use strict";
  const script=document.currentScript;
  if(!script||document.querySelector(".site-nav"))return;
  const scriptURL=new URL(script.src,location.href);
  const marker="/js/core/navigation.js";
  const pathname=scriptURL.pathname;
  const root=pathname.endsWith(marker)?pathname.slice(0,-marker.length)+"/":"./";
  const links=[
    ["Inicio","index.html"],
    ["Roster","roster.html"],
    ["Alumni","alumni.html"],
    ["Brands","brands.html"],
    ["Temporadas","seasons.html"],
    ["Calendario","calendar.html"],
    ["Eventos","events.html"],
    ["Torneos","tournaments.html"],
    ["Campeonatos","championships.html"],
    ["Rankings","rankings.html"],
    ["Records","records.html"],
    ["Equipos","teams.html"],
    ["Personas","personas.html"],
    ["Rivalidades","rivalries.html"],
    ["Recaps","recaps.html"],
    ["Guía","guide.html"],
    ["Reglas","rules.html"],
    ["Estipulaciones","stipulations.html"],
    ["Promociones","promotions.html"],
    ["Acerca de","about.html"]
  ];
  const current=location.pathname.split("/").pop()||"index.html";
  const nav=document.createElement("header");
  nav.className="site-nav";
  nav.innerHTML='<nav class="nav-inner" aria-label="Navegación principal"><a class="nav-brand" href="'+root+'index.html"><img src="'+root+'images/logo.png" alt="" width="38" height="38" onerror="this.hidden=true"><span>MI WRESTLING</span></a><button class="nav-toggle" type="button" aria-label="Abrir menú" aria-expanded="false">☰</button><div class="nav-links"></div></nav>';
  const container=nav.querySelector(".nav-links");
  links.forEach(([label,file])=>{
    const a=document.createElement("a");
    a.href=root+file;
    a.textContent=label;
    if(file===current){a.setAttribute("aria-current","page")}
    container.appendChild(a);
  });
  const toggle=nav.querySelector(".nav-toggle");
  toggle.addEventListener("click",()=>{
    const open=container.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded",String(open));
    toggle.setAttribute("aria-label",open?"Cerrar menú":"Abrir menú");
    toggle.textContent=open?"✕":"☰";
  });
  const main=document.querySelector("main");
  if(main){document.body.insertBefore(nav,main)}
  else{document.body.prepend(nav)}
})();
