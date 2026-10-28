/* MI WRESTLING 2.0 | MOTOR MULTIFORMATO DE TORNEOS
   Compatible con liga, zonas, matriz, bracket, draft, fases mixtas y combates extra por títulos. */
(async function(){
 "use strict";
 const main=document.querySelector("[data-tournament-main]")||document.querySelector("[data-page-content]");if(!main)return;
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const norm=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
 const isNum=v=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));
 const get=async p=>{const r=await fetch(p);if(!r.ok)throw Error(`No se pudo cargar ${p} (HTTP ${r.status})`);return r.json()};
 const fmtDate=v=>{if(!v)return "Fecha no registrada";const d=new Date(v+"T00:00:00Z");return Number.isNaN(d.getTime())?String(v):new Intl.DateTimeFormat("es-AR",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"}).format(d)};
 function catalogCard(t){return `<a class="mw-tournament-catalog-card" href="tournament.html?id=${encodeURIComponent(t.id)}"><span>${esc(t.brand||'MI WRESTLING')}</span><strong>${esc(t.name||t.title||t.id)}</strong><small>${esc(t.year||'Año no definido')} · ${esc(t.formatLabel||String(t.format||'Formato flexible').replace(/_/g,' '))}</small><b>${(t.matchIds||[]).length} combates ↗</b></a>`;}
 try{
  const [standard,outsiders,matches,wrestlers,personas,events,teams]=await Promise.all([
   get("data/tournaments/tournaments.json"),get("data/tournaments/outsider-tournaments.json").catch(()=>[]),get("data/matches/matches.json"),get("data/wrestlers/wrestlers.json"),get("data/personas/personas.json"),get("data/events/events.json"),get("data/teams/teams.json").catch(()=>[])
  ]);
  const allTournaments=[...(standard||[]),...(outsiders||[])];
  const wrestlerByName=new Map((wrestlers||[]).map(w=>[norm(w.name),w]));
  const eventById=new Map((events||[]).map(e=>[String(e.id),e]));
  const matchById=new Map((matches||[]).map(m=>[String(m.id),m]));
  const params=new URLSearchParams(location.search),id=params.get("id");
  if(!id){
   const usable=allTournaments.filter(t=>t.hasData!==false&&!t.isTemplate&&(t.matchIds?.length||t.participantNames?.length||t.roster?.length));
   const years=[...new Set(usable.map(t=>t.year).filter(Boolean))].sort((a,b)=>b-a);
   main.innerHTML=`<section class="page-hero"><div class="eyebrow">MI WRESTLING 2.0 / TOURNAMENT ARCHIVE</div><h1>TORNEOS</h1><p class="lead">Temporadas y formatos conectados con sus eventos, resultados, zonas, matrices y finales.</p></section><div class="mw-tournament-catalog-tools"><label for="tournament-year">FILTRAR POR AÑO</label><select id="tournament-year"><option value="all">Todos los años</option>${years.map(y=>`<option value="${y}">${y}</option>`).join("")}</select><input id="tournament-search" placeholder="Buscar torneo, marca o formato" aria-label="Buscar torneo"></div><div class="mw-tournament-catalog-grid" id="tournament-catalog-grid">${usable.map(t=>catalogCard(t)).join("")}</div>`;
   const yr=main.querySelector("#tournament-year"),search=main.querySelector("#tournament-search"),grid=main.querySelector("#tournament-catalog-grid");
   const rerender=()=>{const y=yr.value,q=norm(search.value);grid.innerHTML=usable.filter(t=>(y==="all"||String(t.year)===y)&&norm([t.name,t.title,t.brand,t.format,t.id].join(" ")).includes(q)).map(t=>catalogCard(t)).join("")||'<div class="mw-event-empty">No hay torneos para ese filtro.</div>';};
   yr.addEventListener("change",rerender);search.addEventListener("input",rerender);return;
  }
  const tournament=allTournaments.find(t=>String(t.id)===String(id));
  if(!tournament){main.innerHTML=`<section class="mw-event-empty"><h1>Torneo no encontrado</h1><p>No existe el ID <code>${esc(id)}</code>.</p><a href="tournaments.html">Volver a torneos</a></section>`;return;}
  document.body.dataset.tournament=String(tournament.id||id);
  document.body.dataset.tournamentBrand=norm(tournament.brand||"").replace(/[^a-z0-9]+/g,"-");
  const rawRoster=tournament.draft?.participantNames?.length?tournament.draft.participantNames:(tournament.participantNames?.length?tournament.participantNames:(tournament.roster||[]));
  const wrestlerById=new Map((wrestlers||[]).map(w=>[String(w.id),w]));
  const names=[...new Set((rawRoster||[]).map(x=>{
   if(typeof x==="string")return x.trim();
   if(x&&typeof x==="object")return x.name||wrestlerById.get(String(x.wrestlerId||x.id||x.participantId))?.name||"";
   return wrestlerById.get(String(x))?.name||"";
  }).filter(Boolean))];
  if(!names.length&&Array.isArray(tournament.participantIds)){
   names.push(...tournament.participantIds.map(pid=>wrestlerById.get(String(pid))?.name||String(pid)).filter(Boolean));
  }
  const stages=(tournament.stages||tournament.structure?.stages||[]).slice().sort((a,b)=>(a.order||0)-(b.order||0));
  const idsFor=stage=>stage.matchIds||[];
  const matchForId=mid=>matchById.get(String(mid));
  const stageMatches=stage=>idsFor(stage).map(matchForId).filter(Boolean);
  const allIds=[...new Set([...(tournament.matchIds||[]),...stages.flatMap(idsFor),...(tournament.bonusChampionshipMatches||[])])];
  const own=allIds.map(matchForId).filter(Boolean);
  const belongs=m=>String(m.tournamentId||"")===String(id)||(m.tournamentIds||[]).map(String).includes(String(id));
  const matchesForTournament=[...new Map([...own,...matches.filter(belongs)].map(m=>[String(m.id),m])).values()];
  const linkMeta=m=>m.tournamentLinks?.[id]||{};
  const isTitle=m=>Boolean(m.isChampionshipMatch||m.championship||m.championshipId||linkMeta(m).matchRole==="championship-extra");
  const canCount=(m,stage)=>{
   const meta=linkMeta(m);if(isTitle(m)||meta.countsForStandings===false||(!m.tournamentLinks?.[id]&&m.countsForStandings===false))return false;
   if(stage&&stage.type&&stage.type!=="league"&&stage.type!=="round-robin"&&stage.type!=="zone"&&stage.type!=="group")return false;
   return true;
  };
  function sideData(match){
   if(Array.isArray(match.sides)&&match.sides.length){return match.sides.map((s,i)=>({key:String(s.id||s.teamId||s.name||`side-${i+1}`),name:s.name||s.label||`Lado ${i+1}`,score:isNum(s.score)?Number(s.score):null,participants:s.participantIds||[],participantNames:s.participantNames||[]}));}
   const ps=(match.participants||[]).filter(p=>!p.role||p.role==="competitor");
   const keys=[...new Set(ps.map(p=>p.side||p.teamId||"").filter(Boolean))];
   if(keys.length>1){return keys.map((key,i)=>{const group=ps.filter(p=>(p.side||p.teamId||"")===key);const team=teams.find(t=>String(t.id)===String(group.find(p=>p.teamId)?.teamId));const first=group[0]||{};let score=first.sideScore??first.score;if(!isNum(score)&&Array.isArray(match.sideScores))score=match.sideScores[i];if(!isNum(score)&&Array.isArray(match.score))score=match.score[i];return {key:String(key),name:team?.name||first.teamName||first.sideLabel||`Lado ${i+1}`,score:isNum(score)?Number(score):null,participants:group.map(p=>p.wrestlerId||p.name),participantNames:group.map(p=>personLabel(p))};});}
   if(ps.length===2){return ps.map((p,i)=>({key:String(p.wrestlerId||p.name||`side-${i+1}`),name:personLabel(p),score:isNum(p.score)?Number(p.score):Array.isArray(match.score)&&isNum(match.score[i])?Number(match.score[i]):null,participants:[p.wrestlerId||p.name],participantNames:[personLabel(p)]}));}
   return ps.map((p,i)=>({key:String(p.wrestlerId||p.name||`side-${i+1}`),name:personLabel(p),score:isNum(p.score)?Number(p.score):null,participants:[p.wrestlerId||p.name],participantNames:[personLabel(p)]}));
  }
  function personLabel(p){const w=wrestlers.find(x=>String(x.id)===String(p.wrestlerId));return w?.name||p.wrestlerName||p.name||p.wrestlerId||"Participante";}
  function scoreSides(m){const sides=sideData(m);return sides.length>=2&&sides.every(s=>s.score!==null&&Number.isFinite(s.score))?sides:null;}
  function normalizedRoster(input){return (input||[]).map(x=>typeof x==="string"?{id:x,name:x}:x).filter(x=>x&&x.name);}
  function standings(roster,usableMatches){
   const rows=new Map(normalizedRoster(roster).map(p=>[norm(p.name),{name:p.name,id:p.id||p.name,played:0,wins:0,draws:0,losses:0,points:0,for:0,against:0,difference:0}]));
   for(const m of usableMatches){const sides=scoreSides(m);if(!sides)continue;
    // Standings are for the participant roster; a team/trio can be a competitor in its own right.
    for(let i=0;i<sides.length;i++){
     const side=sides[i],opponents=sides.filter((_,j)=>j!==i);if(!opponents.length)continue;
     const sideNameExists=rows.has(norm(side.name));
     const names=sideNameExists?[side.name]:(side.participantNames||[]).filter(n=>rows.has(norm(n)));
     const oppScore=opponents.reduce((sum,s)=>sum+(s.score??0),0);
     for(const competitorName of names){const row=rows.get(norm(competitorName));if(!row)continue;row.played++;row.for+=side.score;row.against+=oppScore;
      if(side.score>oppScore){row.wins++;row.points+=Number(tournament.pointsSystem?.win??3);}else if(side.score<oppScore){row.losses++;row.points+=Number(tournament.pointsSystem?.loss??0);}else{row.draws++;row.points+=Number(tournament.pointsSystem?.draw??1);}}

    }
   }
   return [...rows.values()].map(r=>({...r,difference:r.for-r.against})).sort((a,b)=>b.points-a.points||b.difference-a.difference||b.wins-a.wins||a.name.localeCompare(b.name));
  }
  function eligibleForStage(stage){return stageMatches(stage).filter(m=>canCount(m,stage));}
  function matrix(roster,usableMatches){
   const list=normalizedRoster(roster),results=new Map();
   for(const m of usableMatches){const sides=scoreSides(m);if(!sides)continue;for(let i=0;i<sides.length;i++)for(let j=0;j<sides.length;j++){if(i===j)continue;const left=sides[i],right=sides[j];const leftNames=list.some(p=>norm(p.name)===norm(left.name))?[left.name]:(left.participantNames||[]).filter(n=>list.some(p=>norm(p.name)===norm(n)));const rightNames=list.some(p=>norm(p.name)===norm(right.name))?[right.name]:(right.participantNames||[]).filter(n=>list.some(p=>norm(p.name)===norm(n)));for(const an of leftNames)for(const bn of rightNames){const a=norm(an),b=norm(bn);if(a===b)continue;const key=`${a}::${b}`;const item=results.get(key)||{for:0,against:0,w:0,d:0,l:0,ids:[]};item.for+=left.score;item.against+=right.score;if(left.score>right.score)item.w++;else if(left.score<right.score)item.l++;else item.d++;item.ids.push(m.id);results.set(key,item);}}}
   return {list,results};
  }
  function renderTable(roster,usableMatches,title){
   const rows=standings(roster,usableMatches);if(!rows.length)return `<section class="mw-tournament-panel"><h3>${esc(title)}</h3><div class="mw-event-empty">Todavía no hay resultados suficientes para calcular la tabla.</div></section>`;
   return `<section class="mw-tournament-panel mw-tournament-panel--standings"><div class="mw-tournament-panel__heading"><div><span class="mw-event-kicker">CLASIFICACIÓN</span><h2>${esc(title)}</h2></div><span>Victoria +${Number(tournament.pointsSystem?.win??3)} · Empate +${Number(tournament.pointsSystem?.draw??1)} · Derrota +${Number(tournament.pointsSystem?.loss??0)}</span></div><div class="mw-table-tools"><span>POSICIONES ACTUALES</span><button type="button" class="mw-table-difference-toggle" aria-expanded="false"><span class="mw-table-toggle-icon">＋</span> DIFERENCIA DE RONDAS <span class="mw-table-toggle-arrow">⌄</span></button></div><div class="mw-tournament-table-wrap"><table class="mw-tournament-table"><thead><tr>${[['position','#',''],['name','LUCHADOR',''],['played','PJ',''],['wins','G',''],['draws','E',''],['losses','P',''],['points','PTS',''],['for','RF','diff'],['against','RC','diff'],['difference','DIF','diff']].map(([key,label,extra])=>`<th class="${extra==='diff'?'is-difference-column':''}"><button type="button" data-sort="${key}">${label}</button></th>`).join('')}</tr></thead><tbody>${rows.map((r,i)=>`<tr data-row data-position="${i+1}" data-name="${esc(norm(r.name))}" data-played="${r.played}" data-wins="${r.wins}" data-draws="${r.draws}" data-losses="${r.losses}" data-points="${r.points}" data-for="${r.for}" data-against="${r.against}" data-difference="${r.difference}" class="${i===0?'is-leader':i===rows.length-1?'is-last':''}"><td>${i+1}</td><td class="mw-standing-name">${wrestlerLink(r.name)}</td><td>${r.played}</td><td>${r.wins}</td><td>${r.draws}</td><td>${r.losses}</td><td class="mw-standing-points"><strong>${r.points}</strong></td><td class="is-difference-column">${r.for}</td><td class="is-difference-column">${r.against}</td><td class="is-difference-column ${r.difference>0?'is-positive':r.difference<0?'is-negative':''}">${r.difference>0?'+':''}${r.difference}</td></tr>`).join('')}</tbody></table></div><p class="mw-tournament-note">PJ: jugados · G: ganados · E: empatados · P: perdidos · PTS: puntos de clasificación. Abrí «Diferencia de rondas» para consultar rondas a favor, en contra y diferencia neta.</p></section>`;
  }
  function renderMatrix(roster,usableMatches,title){
   const {list,results}=matrix(roster,usableMatches);if(!list.length)return '';
   const zoneEntries=tournament.zones&&typeof tournament.zones==='object'?Object.entries(tournament.zones):[];
   const zoneOf=name=>{const found=zoneEntries.find(([zone,people])=>(people||[]).some(p=>norm(typeof p==='string'?p:p?.name)===norm(name)));return found?.[0]||'';};
   const zoneClass=zone=>zone?`matrix-zone-${slug(zone)}`:'';
   const labelFor=(a,b)=>{
    if(norm(a.name)===norm(b.name))return '<td class="matrix-self" aria-label="Mismo participante">—</td>';
    const r=results.get(`${norm(a.name)}::${norm(b.name)}`);
    if(!r)return '<td class="matrix-empty" aria-label="Sin enfrentamiento registrado"><span>·</span></td>';
    const outcome=r.ids.length===1?(r.w>r.l?'W':r.l>r.w?'L':'D'):`${r.w}-${r.l}-${r.d}`;
    const cls=r.w>r.l?'matrix-win':r.l>r.w?'matrix-loss':'matrix-draw';
    const record=`${r.w}V · ${r.d}E · ${r.l}D`;
    return `<td class="matrix-result-cell"><button type="button" class="matrix-cell ${cls}" data-matches="${esc(r.ids.join(','))}" title="${esc(record)} · Marcador acumulado ${r.for}-${r.against}" aria-label="${esc(a.name)} contra ${esc(b.name)}: ${esc(record)}">${outcome}<small>${r.for}–${r.against}</small></button></td>`;
   };
   const zoneLegend=zoneEntries.length?`<div class="mw-matrix-legend">${zoneEntries.map(([zone])=>`<span class="mw-matrix-legend__item ${zoneClass(zone)}"><i></i>${esc(zone)}</span>`).join('')}</div>`:'';
   return `<section class="mw-tournament-panel mw-tournament-panel--matrix"><div class="mw-tournament-panel__heading"><div><span class="mw-event-kicker">HEAD-TO-HEAD</span><h2>${esc(title)}</h2><p>Cada cruce muestra el balance y el marcador registrado. Deslizá horizontalmente para recorrer todos los participantes.</p></div><span>${list.length} participantes</span></div>${zoneLegend}<div class="mw-tournament-matrix-wrap" role="region" aria-label="Matriz de enfrentamientos; deslizar horizontalmente" tabindex="0"><table class="mw-tournament-matrix"><thead><tr><th class="matrix-corner">PARTICIPANTE</th>${list.map(p=>`<th class="${zoneClass(zoneOf(p.name))}" title="${esc(p.name)}"><span>${esc(p.name)}</span></th>`).join('')}</tr></thead><tbody>${list.map(a=>{const w=wrestlerByName.get(norm(a.name));const initials=esc(a.name.split(/\s+/).map(x=>x[0]).slice(0,2).join(''));return `<tr><th class="matrix-row-name ${zoneClass(zoneOf(a.name))}"><span class="matrix-row-name__seed">${String(list.indexOf(a)+1).padStart(2,'0')}</span>${w?.image?`<img class="matrix-row-name__portrait" src="${esc(w.image)}" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="matrix-row-name__initials" hidden>${initials}</span>`:`<span class="matrix-row-name__initials">${initials}</span>`}<span class="matrix-row-name__full-name">${esc(a.name)}</span></th>${list.map(b=>labelFor(a,b)).join('')}</tr>`;}).join('')}</tbody></table></div><div class="mw-tournament-matrix-detail" aria-live="polite">Elegí un cruce para consultar sus combates registrados.</div><p class="mw-tournament-note">V = victorias · E = empates · D = derrotas. Los colores indican el resultado del cruce; los guiones corresponden a cruces sin resultado cargado.</p></section>`;
  }
  function shortName(name){const parts=String(name).split(/\s+/);return parts.length>1?`${parts[0]} ${parts[parts.length-1]}`:name;}
  function wrestlerLink(name){const w=wrestlerByName.get(norm(name));return `<a href="superstar.html?id=${encodeURIComponent(w?.id||slug(name))}">${esc(name)}</a>`;}
  function slug(name){return norm(name).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
  function draftHTML(){if(!names.length)return '<div class="mw-event-empty">No hay participantes confirmados en el draft.</div>';return `<div class="mw-tournament-draft-grid">${names.map(name=>{const w=wrestlerByName.get(norm(name));const image=w?.image;const initials=esc(name.split(/\s+/).map(x=>x[0]).slice(0,2).join(''));return `<a class="mw-tournament-draft-card" href="superstar.html?id=${encodeURIComponent(w?.id||slug(name))}">${image?`<img src="${esc(image)}" alt="${esc(name)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="mw-tournament-draft-placeholder" hidden>${initials}</span>`:`<span class="mw-tournament-draft-placeholder">${initials}</span>`}<strong>${esc(name)}</strong></a>`;}).join('')}</div>`;}
  function renderBracket(stage,stageMatchesList){
   const clean=stageMatchesList;if(!clean.length)return '';
   const format=String(stage.format||tournament.final?.bracketFormat||tournament.bracketFormat||'').toUpperCase();
   let rounds=[];
   if(clean.length===7){rounds=[{title:'CUARTOS DE FINAL',matches:clean.slice(0,4)},{title:'SEMIFINALES',matches:clean.slice(4,6)},{title:'FINAL',matches:clean.slice(6,7)}];}
   else if(format.includes('BACKLASH'))rounds=[{title:'PLAY-IN',matches:clean.slice(0,2)},{title:'SEMIFINALES',matches:clean.slice(2,4)},{title:'FINAL — UNDISPUTED CHAMPIONSHIP',matches:clean.slice(4,5)}];
   else if(clean.length===6&&/chamber/i.test(String(stage.name||''))){rounds=[{title:'CUARTOS DE FINAL',matches:clean.slice(0,4)},{title:'SEMIFINALES',matches:clean.slice(4,6)}];}
   else if(format.includes('QUARTERS')||format.includes('CUARTER'))rounds=[{title:'CUARTOS DE FINAL',matches:clean.slice(0,4)},{title:'SEMIFINALES',matches:clean.slice(4,6)},{title:'FINAL',matches:clean.slice(6,7)}];
   else if(format.includes('SEMIFINALS_FINAL_CHAMPION')||format.includes('SEMIFINALS FINAL CHAMPION'))rounds=[{title:'SEMIFINALES',matches:clean.slice(0,2)},{title:'FINAL',matches:clean.slice(2,3)},{title:'DESAFÍO POR EL CAMPEONATO',matches:clean.slice(3)}];
   else if(format.includes('SEMIFINALS_FINAL'))rounds=[{title:'SEMIFINALES',matches:clean.slice(0,2)},{title:'FINAL',matches:clean.slice(2)}];
   else rounds=[{title:stage.name||'FASE ELIMINATORIA',matches:clean}];
   rounds=rounds.filter(r=>r.matches.length);
   return `<section class="mw-tournament-panel"><div class="mw-tournament-panel__heading"><div><span class="mw-event-kicker">KNOCKOUT STAGE</span><h2>${esc(stage.name||stage.title||'Bracket')}</h2></div>${stage.eventId?`<a href="event.html?id=${encodeURIComponent(stage.eventId)}">Ver evento final ↗</a>`:''}</div><div class="mw-tournament-bracket">${rounds.map(r=>`<div class="mw-tournament-bracket-round"><h3>${esc(r.title)}</h3>${r.matches.map(m=>matchScoreCard(m)).join('')}</div>`).join('')}</div></section>`;
  }
  function matchScoreCard(m){const sides=sideData(m);const max=Math.max(...sides.map(s=>s.score??-Infinity));const sideHTML=(s,i)=>{const w=wrestlerByName.get(norm(s.name));const initials=esc(s.name.split(/\s+/).map(x=>x[0]).slice(0,2).join(''));return `<div class="mw-matchup-side ${s.score===max?'is-winner':''} ${i===0?'is-left':'is-right'}">${i===0?`<span class="mw-matchup-name">${esc(s.name)}</span>`:''}${w?.image?`<img class="mw-matchup-portrait" src="${esc(w.image)}" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="mw-matchup-initials" hidden>${initials}</span>`:`<span class="mw-matchup-initials">${initials}</span>`}<strong class="mw-matchup-score">${s.score===null?'—':esc(s.score)}</strong>${i===1?`<span class="mw-matchup-name">${esc(s.name)}</span>`:''}</div>`;};return `<article class="mw-tournament-score-card">${(m.championship||m.championshipName||m.championshipId)?`<a class="mw-tournament-title-ribbon" href="championship.html?id=${encodeURIComponent(m.championshipId||"")}">${esc(m.championship||m.championshipName||String(m.championshipId).replace(/-/g," "))} ↗</a>`:''}<div class="mw-matchup-bar">${sides.slice(0,2).map(sideHTML).join('')}<span class="mw-matchup-vs" aria-label="contra">VS</span></div><div class="mw-tournament-score-meta">${esc(m.position||m.phaseId||m.date||'Resultado registrado')}</div></article>`;}
  function stageResults(stage,stageMatchesList){const list=stageMatchesList.filter(m=>!isTitle(m));if(!list.length)return '';const linked=stage.eventId?eventById.get(stage.eventId):null;return `<section class="mw-tournament-panel"><div class="mw-tournament-panel__heading"><div><span class="mw-event-kicker">${esc(stage.type||'RESULTADOS').toUpperCase()}</span><h2>${esc(stage.name||'Resultados')}</h2></div>${stage.date?`<span>${esc(fmtDate(stage.date))}</span>`:''}</div>${linked?`<a class="mw-tournament-event-link" href="event.html?id=${encodeURIComponent(linked.id)}">${esc(linked.title||linked.name||linked.id)} · VER CARTELERA ↗</a>`:''}<div class="mw-tournament-results-list">${list.map(matchScoreCard).join('')}</div></section>`;}
  const titleMatches=matchesForTournament.filter(isTitle);
  const regularStages=stages.filter(s=>['league','round-robin','zone','group'].includes(String(s.type||'').toLowerCase()));
  const leagueMatches=[...new Set(regularStages.flatMap(s=>stageMatches(s)).filter((m)=>canCount(m,regularStages.find(s=>idsFor(s).includes(m.id)))))];
  const zoneEntries=tournament.zones&&typeof tournament.zones==='object'?Object.entries(tournament.zones):[];
  let standingsHTML='',matrixHTML='';
  if(zoneEntries.length){
   standingsHTML=zoneEntries.map(([zone,participants])=>{const stagesInZone=regularStages.filter(s=>String(s.zone||'').toLowerCase()===String(zone).toLowerCase()||String(s.name||'').toLowerCase().includes(String(zone).toLowerCase()));const ms=stagesInZone.flatMap(s=>stageMatches(s)).filter(m=>canCount(m,stagesInZone.find(s=>idsFor(s).includes(m.id))));return renderTable(participants,ms,`Tabla · Zona ${zone}`);}).join('');
   matrixHTML=zoneEntries.map(([zone,participants])=>{const stagesInZone=regularStages.filter(s=>String(s.zone||'').toLowerCase()===String(zone).toLowerCase()||String(s.name||'').toLowerCase().includes(String(zone).toLowerCase()));const ms=stagesInZone.flatMap(s=>stageMatches(s)).filter(m=>canCount(m,stagesInZone.find(s=>idsFor(s).includes(m.id))));return renderMatrix(participants,ms,`Matriz · Zona ${zone}`);}).join('');
  }else if(regularStages.length){
   standingsHTML=renderTable(names,leagueMatches,'Tabla general');matrixHTML=renderMatrix(names,leagueMatches,'Matriz de enfrentamientos');
  }
  let stageHTML='';
  if(String(tournament.format||'').toUpperCase()==='BRACKET'&&stages.length&&stages.every(s=>String(s.type||'').toLowerCase()==='bracket')){
   stageHTML=`<section class=\"mw-tournament-panel\"><div class=\"mw-tournament-panel__heading\"><div><span class=\"mw-event-kicker\">KNOCKOUT ROAD</span><h2>Bracket de la Road</h2></div><span>${stages.length} ronda(s) / evento final</span></div><div class=\"mw-tournament-bracket\">${stages.map(stage=>`<div class=\"mw-tournament-bracket-round\"><h3>${esc(stage.name||'Ronda')}</h3>${stageMatches(stage).map(matchScoreCard).join('')}</div>`).join('')}</div></section>`;
  }else{
   stageHTML=stages.map(stage=>{const ms=stageMatches(stage);const typ=String(stage.type||'').toLowerCase();if(typ==='bracket')return renderBracket(stage,ms)||stageResults(stage,ms);return stageResults(stage,ms);}).join('');
  }
  const extraHTML=titleMatches.length?`<section class="mw-tournament-panel mw-tournament-bonus"><div class="mw-tournament-panel__heading"><div><span class="mw-event-kicker">BONUS TITLE BOUTS</span><h2>Combates extra por campeonatos</h2><p>Estos combates forman parte de la cartelera o de la Road, pero no suman puntos ni diferencia en la tabla.</p></div><span>${titleMatches.length} combate(s)</span></div>${titleMatches.map(m=>{const ev=eventById.get(m.eventId||m.linkedEventId);return `<div class="mw-tournament-extra-match">${ev?`<a href="event.html?id=${encodeURIComponent(ev.id)}" class="mw-tournament-event-link">${esc(ev.title||ev.name||ev.id)} ↗</a>`:''}${matchScoreCard(m)}</div>`;}).join('')}</section>`:'';
  const finalLink=tournament.final?.eventId||tournament.final?.event||tournament.finalEvent;
  const finalEvent=finalLink?eventById.get(finalLink):null;
  const finalLinkHTML=finalLink?`<section class="mw-tournament-panel mw-tournament-final-event"><div class="mw-tournament-panel__heading"><div><span class="mw-event-kicker">FINAL EVENT</span><h2>${esc(tournament.final?.bracketTitle||finalEvent?.title||finalEvent?.name||'Evento final')}</h2></div>${finalEvent?`<a href="event.html?id=${encodeURIComponent(finalEvent.id)}">Abrir evento ↗</a>`:`<span>Referencia heredada: ${esc(finalLink)}</span>`}</div>${finalEvent?`<p>${esc(fmtDate(finalEvent.date))} · ${esc(finalEvent.title||finalEvent.name||finalEvent.id)}</p>`:''}</section>`:'';
  main.innerHTML=`<a class="mw-event-back" href="tournaments.html">← VOLVER A TORNEOS</a><header class="page-hero mw-tournament-hero"><div class="eyebrow">MI WRESTLING 2.0 / ${esc(tournament.brand||'TOURNAMENT')} · ${esc(tournament.year||'ARCHIVO')}</div><h1>${esc(tournament.name||tournament.title||tournament.id)}</h1><p class="lead">${esc(tournament.formatLabel||String(tournament.format||'Formato flexible').replace(/_/g,' '))}${tournament.division?` · ${esc(tournament.division)}`:''}</p><div class="mw-event-detail-meta"><span>${names.length} participantes</span><span>${matchesForTournament.length} combates vinculados</span>${tournament.startDate?`<span>${esc(fmtDate(tournament.startDate))}${tournament.endDate&&tournament.endDate!==tournament.startDate?' – '+esc(fmtDate(tournament.endDate)):''}</span>`:''}</div></header><section class="mw-tournament-panel"><div class="mw-tournament-panel__heading"><div><span class="mw-event-kicker">ROSTER / DRAFT</span><h2>Participantes</h2></div><span>${names.length}</span></div>${draftHTML()}</section>${standingsHTML}${matrixHTML}<section class="mw-tournament-panel"><div class="mw-tournament-panel__heading"><div><span class="mw-event-kicker">ROAD & RESULTS</span><h2>Fases y resultados</h2></div><span>${stages.length} fase(s)</span></div>${stageHTML||'<div class="mw-event-empty">Este torneo todavía no tiene fases conectadas.</div>'}</section>${finalLinkHTML}${extraHTML}`;
  main.querySelectorAll('.mw-table-difference-toggle').forEach(btn=>btn.addEventListener('click',()=>{const panel=btn.closest('.mw-tournament-panel--standings');const open=btn.getAttribute('aria-expanded')!=='true';btn.setAttribute('aria-expanded',String(open));panel.classList.toggle('show-difference',open);btn.querySelector('.mw-table-toggle-icon').textContent=open?'−':'＋';}));
  // Table sorting is client-side and doesn't change saved data.
  main.querySelectorAll('[data-sort]').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.sort,tbody=btn.closest('table').querySelector('tbody');const rows=[...tbody.querySelectorAll('tr[data-row]')];const asc=btn.dataset.order!=='asc';btn.dataset.order=asc?'asc':'desc';rows.sort((a,b)=>{const av=a.dataset[key]??'',bv=b.dataset[key]??'';if(key==='name')return asc?av.localeCompare(bv):bv.localeCompare(av);return asc?Number(av)-Number(bv):Number(bv)-Number(av);});rows.forEach((r,i)=>{r.children[0].textContent=i+1;tbody.appendChild(r);});}));
  // Matrix cells open the corresponding match cards below the matrix.
  main.querySelectorAll('.matrix-cell').forEach(btn=>btn.addEventListener('click',()=>{const ids=btn.dataset.matches.split(',').filter(Boolean);const host=btn.closest('.mw-tournament-panel').querySelector('.mw-tournament-matrix-detail');const selected=ids.map(matchForId).filter(Boolean);host.innerHTML=selected.map(m=>window.MIW_MATCH_CARD?window.MIW_MATCH_CARD.render(m,{wrestlers,personas,events,teams}):matchScoreCard(m)).join('')||'No hay resultados para este cruce.';}));
  document.title=`${tournament.name||tournament.title||tournament.id} | MI WRESTLING 2.0`;
 }catch(error){main.innerHTML=`<section class="mw-event-empty"><h1>No se pudo cargar el torneo</h1><p>${esc(error.message||error)}</p></section>`;}
})();
