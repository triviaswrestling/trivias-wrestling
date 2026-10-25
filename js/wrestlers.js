/* ==========================================================
   MI WRESTLING 2.0 — WRESTLERS / CARD TEMPLATE / MODAL
   One stable wrestler ID; presentations never create duplicate profiles.
   ========================================================== */
(() => {
  "use strict";
  const DATA_URL = "data/wrestlers/wrestlers.json";
  const BRAND_COLORS = { raw: "#ef233c", smackdown: "#168cff", nxt: "#a855f7", legends: "#d6ad45", special: "#00cfe8", alumni: "#aab4c4" };
  const $ = (selector, root=document) => root.querySelector(selector);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const imagePath = value => value || "";
  let wrestlers = [];
  let activeModalWrestler = null;
  let activePresentationId = "default";
  const pageStatus = document.body.dataset.wrestlerStatus || (document.body.dataset.page === "alumni" ? "alumni" : "active");
  const brandColor = brand => BRAND_COLORS[String(brand || "").toLowerCase()] || "var(--mw-accent)";
  function currentPresentation(w, id="default") { return (w.presentations && (w.presentations[id] || Object.values(w.presentations).find(p=>p.id===id))) || {id:w.id+"-original",name:w.name,image:w.image,brand:w.brand}; }
  function activePresentation(w) { return currentPresentation(w, "default"); }
  function cardMarkup(w) {
    const p = activePresentation(w); const color = brandColor(p.brand || w.brand);
    return `<article class="mw-wrestler-card" tabindex="0" role="button" aria-label="Ver ficha de ${esc(w.name)}" data-wrestler-id="${esc(w.id)}" style="--card-accent:${color}">
      ${p.image ? `<img class="mw-wrestler-card__image" src="${esc(imagePath(p.image))}" alt="${esc(p.name || w.name)}" loading="lazy" onerror="this.style.display='none'">` : ""}<span class="mw-wrestler-card__fallback" aria-hidden="true">${esc((w.name||"MW").split(/\\s+/).map(x=>x[0]).join("").slice(0,3))}</span>
      <span class="mw-wrestler-card__overall">${esc(w.overall ?? "—")}<small>OVR</small></span><span class="mw-wrestler-card__brand">${esc((p.brand||w.brand||"WRESTLING").toUpperCase())}</span>
      <div class="mw-wrestler-card__content"><p class="mw-wrestler-card__nickname">${esc(w.nickname || w.division || "SUPERSTAR")}</p><h2 class="mw-wrestler-card__name">${esc(w.name)}</h2><div class="mw-wrestler-card__bottom"><span>${esc(w.status === "alumni" ? "HALL OF LEGENDS" : "ACTIVE ROSTER")}</span><span>VER FICHA ↗</span></div></div></article>`;
  }
  function renderGrid() {
    const grid = $("#wrestler-grid"); if (!grid) return;
    const search = ($("#wrestler-search")?.value || "").trim().toLocaleLowerCase("es");
    const brand = ($("#wrestler-brand")?.value || "").toLowerCase();
    const list = wrestlers.filter(w => (w.status || "active") === pageStatus && (!search || [w.name,w.nickname,w.brand,w.division].join(" ").toLocaleLowerCase("es").includes(search)) && (!brand || String(w.brand||"").toLowerCase()===brand));
    grid.innerHTML = list.length ? list.map(cardMarkup).join("") : `<div class="mw-empty">No hay luchadores cargados para esta sección o filtro. Agregalos en <code>data/wrestlers/wrestlers.json</code>.</div>`;
    const count = $("#wrestler-count"); if (count) count.textContent = `${list.length} ${list.length===1?"PERFIL":"PERFILES"}`;
  }
  function statsMarkup(stats={}) { const entries=Object.entries(stats); if(!entries.length)return `<p>Estadísticas todavía no cargadas.</p>`; return `<div class="mw-stat-grid">${entries.map(([name,value])=>`<div class="mw-stat"><div class="mw-stat__top"><span>${esc(name)}</span><b>${esc(value)}</b></div><div class="mw-stat__bar"><span style="width:${Math.max(0,Math.min(100,Number(value)||0))}%"></span></div></div>`).join("")}</div>`; }
  function achievementsMarkup(items=[]) { return items.length ? `<ul class="mw-achievements">${items.map(x=>`<li>🏆 ${esc(x)}</li>`).join("")}</ul>` : `<p>Los logros todavía no están cargados.</p>`; }
  function profileMarkup(w, presentationId="default") {
    const p=currentPresentation(w,presentationId); const color=brandColor(p.brand||w.brand); const achievements=w.achievements||[];
    const presentationButtons=Object.entries(w.presentations||{}).map(([key,item])=>`<button type="button" class="mw-presentation ${key===presentationId?"is-active":""}" data-presentation="${esc(key)}">${esc(item.name||key)}</button>`).join("");
    return `<div class="mw-modal__hero" style="--mw-accent:${color}">${p.image?`<img class="mw-modal__portrait" src="${esc(p.image)}" alt="${esc(p.name||w.name)}" onerror="this.style.display='none'">`:""}<div class="mw-modal__intro"><small>${esc((p.brand||w.brand||"MI WRESTLING").toUpperCase())} / ${esc(w.status||"active").toUpperCase()}</small><h2>${esc(p.name||w.name)}</h2><span class="mw-modal__overall">OVERALL ${esc(w.overall??"—")} · ${esc(w.division||"SUPERSTAR")}</span></div></div><div class="mw-modal__body"><section><h3>Perfil</h3><p>${esc(w.bio||"Perfil oficial de MI WRESTLING.")}</p><p><b>Nombre base:</b> ${esc(w.name)} · <b>ID estable:</b> <code>${esc(w.id)}</code></p></section><section><h3>Presentaciones / alter egos</h3><div class="mw-presentations">${presentationButtons||"<span>Presentación original</span>"}</div><p>Las presentaciones cambian nombre e imagen mostrados, pero conservan el mismo perfil, historial y estadísticas.</p></section><section><h3>Estadísticas</h3>${statsMarkup(w.stats||{})}</section><section><h3>Movimientos</h3><p><b>Finishers:</b> ${esc((w.finisher||[]).join(", ")||"Sin datos")}</p><p><b>Signatures:</b> ${esc((w.signature||[]).join(", ")||"Sin datos")}</p></section><section><h3>Logros y campeonatos</h3>${achievementsMarkup(achievements)}</section></div>`;
  }
  function openModal(w) {
    const root=$("#mw-modal-root"); if(!root)return; activeModalWrestler=w; activePresentationId="default";
    root.innerHTML=`<div class="mw-modal" data-modal-backdrop><section class="mw-modal__panel" role="dialog" aria-modal="true" aria-label="Ficha de ${esc(w.name)}"><button class="mw-modal__close" type="button" aria-label="Cerrar ficha">×</button><div data-modal-content>${profileMarkup(w)}</div></section></div>`;
    document.body.style.overflow="hidden"; root.querySelector(".mw-modal__close").focus();
  }
  function closeModal(){const root=$("#mw-modal-root");if(root)root.innerHTML="";document.body.style.overflow="";activeModalWrestler=null;}
  function renderProfilePage(){const host=$("#wrestler-profile");if(!host)return;const id=new URLSearchParams(location.search).get("id");const w=wrestlers.find(x=>x.id===id)||wrestlers[0];if(!w){host.innerHTML='<div class="mw-empty">No se encontró el perfil. Revisá el parámetro <code>?id=</code> y el archivo de luchadores.</div>';return;}host.innerHTML=profileMarkup(w,new URLSearchParams(location.search).get("presentation")||"default");}
  async function load() {
    try { const response=await fetch(DATA_URL); if(!response.ok)throw new Error("HTTP "+response.status); const data=await response.json(); wrestlers=Array.isArray(data)?data:[]; } catch(error) { console.error("MI WRESTLING: no se pudo cargar wrestlers.json",error); wrestlers=[]; }
    renderGrid(); renderProfilePage();
  }
  document.addEventListener("click",event=>{
    const card=event.target.closest("[data-wrestler-id]"); if(card){const w=wrestlers.find(x=>x.id===card.dataset.wrestlerId);if(w)openModal(w);return;}
    if(event.target.closest(".mw-modal__close")){closeModal();return;}
    if(event.target.matches("[data-modal-backdrop]")){closeModal();return;}
    const presentation=event.target.closest("[data-presentation]"); if(presentation&&activeModalWrestler){activePresentationId=presentation.dataset.presentation;const content=$("[data-modal-content]");if(content)content.innerHTML=profileMarkup(activeModalWrestler,activePresentationId);return;}
    const profilePresentation=event.target.closest("#wrestler-profile [data-presentation]"); if(profilePresentation){const host=$("#wrestler-profile");const w=wrestlers.find(x=>x.id===new URLSearchParams(location.search).get("id"))||wrestlers[0];if(host&&w)host.innerHTML=profileMarkup(w,profilePresentation.dataset.presentation);}
  });
  document.addEventListener("keydown",event=>{if(event.key==="Escape")closeModal();if((event.key==="Enter"||event.key===" ")&&event.target.matches(".mw-wrestler-card")){event.preventDefault();const w=wrestlers.find(x=>x.id===event.target.dataset.wrestlerId);if(w)openModal(w);}});
  document.addEventListener("input",event=>{if(event.target.id==="wrestler-search")renderGrid();});
  document.addEventListener("change",event=>{if(event.target.id==="wrestler-brand")renderGrid();});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});else load();
  window.MIWrestlingWrestlers={getAll:()=>wrestlers.map(w=>({...w})),getById:id=>wrestlers.find(w=>w.id===id)||null,getPresentation:(id,presentationId)=>{const w=wrestlers.find(x=>x.id===id);return w?currentPresentation(w,presentationId):null;}};
})();
