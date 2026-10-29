
/* MI WRESTLING 2.0 — POWER RANKING / NU METAL */
(async function(){
"use strict";
const root=document.querySelector("[data-page-content]"); if(!root)return;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
try{
 const [wr,mr]=await Promise.all([
  fetch("data/wrestlers/wrestlers.json").then(r=>{if(!r.ok)throw Error("No se pudo leer el roster");return r.json()}),
  fetch("data/matches/matches.json").then(r=>r.ok?r.json():[]).catch(()=>[])
 ]);
 const wrestlers=Array.isArray(wr)?wr:[], matches=Array.isArray(mr)?mr:[];
 const statsFor=w=>{
  const bouts=matches.filter(m=>(m.participants||[]).some(p=>String(p.wrestlerId||"")===String(w.id)))
   .sort((a,b)=>String(b.date||b.eventDate||"").localeCompare(String(a.date||a.eventDate||""))||Number(b.order||0)-Number(a.order||0));
  let wins=0,losses=0,draws=0;
  bouts.forEach(m=>{const p=(m.participants||[]).find(x=>String(x.wrestlerId||"")===String(w.id));if(!p)return;
   const result=String(p.result||"").toLowerCase();
   if(["win","victory","winner"].includes(result))wins++;else if(["loss","lose","defeat"].includes(result))losses++;else if(["draw","tie","empate"].includes(result))draws++;
  });
  const recent=bouts.slice(0,15), points=recent.map(m=>{const p=(m.participants||[]).find(x=>String(x.wrestlerId||"")===String(w.id));return num(p?.score)}).filter(x=>x!==null);
  const avg=points.length?points.reduce((a,b)=>a+b,0)/points.length:0;
  const overall=num(w.overall??w.overallRating??w.attributes?.overall)??(w.attributes&&typeof w.attributes==="object"?(()=>{const a=Object.values(w.attributes).map(num).filter(x=>x!==null);return a.length?a.reduce((x,y)=>x+y,0)/a.length:50})():50);
  const active=["active","activo","current"].includes(String(w.status||"").toLowerCase());
  // Score interpretable and bounded: overall 50%, recent average 40% (5-point match scale), active status 10%.
  const power=Math.max(0,Math.min(100,overall*.5+(avg/5*100)*.4+(active?10:0)));
  return {bouts,wins,losses,draws,recent,avg,overall,active,power};
 };
 const rows=wrestlers.map(w=>({w,s:statsFor(w)})).sort((a,b)=>b.s.power-a.s.power||b.s.overall-a.s.overall||a.w.name.localeCompare(b.w.name));
 root.innerHTML=`<section class="page-hero"><div class="eyebrow">MI WRESTLING 2.0 / RANKING ENGINE</div><h1>POWER RANKING</h1><p class="lead">Overall, actividad y rendimiento reciente. El orden se actualiza con los combates cargados.</p></section>
 <section class="pr-controls"><label for="pr-search">BUSCAR SUPERSTAR</label><input id="pr-search" type="search" placeholder="Nombre del luchador…"><label for="pr-status">ESTADO</label><select id="pr-status"><option value="all">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos / Alumni</option></select><div class="pr-method"><b>FÓRMULA</b><span>50% Overall + 40% promedio de puntos en las últimas 15 luchas + 10% activo.</span><small>Si faltan datos de overall se usa promedio de atributos; sin atributos, base neutral 50. Solo se consideran luchas registradas.</small></div></section>
 <section class="pr-board"><div class="pr-board-head"><span>POS.</span><span>SUPERSTAR</span><span>POWER</span><span>OVR</span><span>ÚLT. 15</span><span>RÉCORD</span></div><div id="pr-list"></div><p class="pr-footnote">El promedio reciente usa los puntos anotados por el luchador en los combates que figuran en matches.json; cuando hay menos de 15, usa los disponibles.</p></section>`;
 const list=root.querySelector("#pr-list"), search=root.querySelector("#pr-search"), status=root.querySelector("#pr-status");
 function render(){
  const q=search.value.trim().toLocaleLowerCase("es"), st=status.value;
  const filtered=rows.filter(({w,s})=>(!q||`${w.name} ${w.nickname||""} ${w.brand||""}`.toLocaleLowerCase("es").includes(q))&&(st==="all"||(st==="active"&&s.active)||(st==="inactive"&&!s.active)));
  list.innerHTML=filtered.length?filtered.map(({w,s})=>`<a class="pr-row ${s.active?"is-active":"is-inactive"}" href="superstar.html?id=${encodeURIComponent(w.id)}"><span class="pr-position">#${rows.indexOf(rows.find(x=>x.w.id===w.id))+1}</span><span class="pr-star">${w.image?`<img src="${esc(w.image)}" alt="" loading="lazy" onerror="this.style.display='none'">`:""}<span><b>${esc(w.name)}</b><small>${esc(w.brand||w.division||"MI WRESTLING")} · ${s.active?"ACTIVO":"INACTIVO"}</small></span></span><span class="pr-power"><b>${s.power.toFixed(1)}</b><i><u style="width:${s.power}%"></u></i></span><span class="pr-ovr">${s.overall.toFixed(0)}</span><span class="pr-avg">${s.recent.length?s.avg.toFixed(2):"—"}<small>${s.recent.length}/15 combates</small></span><span class="pr-record"><b>${s.wins}-${s.losses}-${s.draws}</b><small>${s.bouts.length} combates</small></span></a>`).join(""):`<p class="pr-empty">No hay resultados con esos filtros.</p>`;
 }
 search.addEventListener("input",render);status.addEventListener("change",render);render();
}catch(e){root.innerHTML=`<section class="mw-generic-empty"><h1>No se pudo cargar el Power Ranking</h1><p>${esc(e.message||e)}</p><p>Verificá data/wrestlers/wrestlers.json y data/matches/matches.json.</p></section>`}
})();
