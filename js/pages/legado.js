/* MI WRESTLING 2.0 — LEGADO | estadísticas desde JSON existentes */
(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const DATA = {
    matches: 'data/matches/matches.json', events: 'data/events/events.json',
    wrestlers: 'data/wrestlers/wrestlers.json', teams: 'data/teams/teams.json',
    championships: 'data/championships/championships.json', reigns: 'data/reigns/reigns.json'
  };
  const state = {tab:'overview', search:'', sort:'wins', brand:'all', status:'all', data:{}, stats:new Map(), byId:new Map(), eventById:new Map(), matchEvent:new Map()};
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arr = x => Array.isArray(x) ? x : [];
  const num = x => Number.isFinite(Number(x)) ? Number(x) : 0;
  const safeImage = (src, fallback='images/Vacante.webp') => {
    const s = String(src || '').trim();
    if (!s) return fallback;
    return s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/') ? s : s.replace(/^\.\.\//,'');
  };
  const image = (src, name, cls='legacy-avatar') => `<img class="${cls}" src="${esc(safeImage(src))}" alt="${esc(name)}" loading="lazy" onerror="this.onerror=null;this.src='images/Vacante.webp'">`;
  const fmt = n => new Intl.NumberFormat('es-AR').format(n || 0);
  const ratio = s => s.matches ? Math.round((s.wins / s.matches) * 100) : 0;
  const getId = p => p?.wrestlerId || p?.id || '';
  const getWinners = m => {
    const ids = arr(m.winnerIds).filter(Boolean);
    if (ids.length) return ids;
    const participants = arr(m.participants);
    const marked = participants.filter(p => ['win','winner','victory','ganador'].includes(String(p.result||'').toLowerCase())).map(getId).filter(Boolean);
    if (marked.length) return marked;
    if (m.winnerId) return [m.winnerId];
    if (typeof m.winner === 'string') {
      const p = participants.find(x => String(x.name||'').toLowerCase() === m.winner.toLowerCase());
      if (p) return [getId(p)].filter(Boolean);
    }
    const scores = participants.filter(p => p.score !== null && p.score !== undefined && p.score !== '').map(p => ({id:getId(p),score:Number(p.score)})).filter(p=>p.id&&Number.isFinite(p.score));
    if (scores.length >= 2) { const max = Math.max(...scores.map(p=>p.score)); const winners = scores.filter(p=>p.score===max); if (winners.length===1) return [winners[0].id]; }
    return [];
  };
  const eventTitle = id => state.eventById.get(id)?.title || id || 'Evento sin registrar';
  const dateOf = m => state.eventById.get(m.eventId)?.date || m.date || '';
  const sortMatches = list => [...list].sort((a,b) => String(dateOf(a)).localeCompare(String(dateOf(b))) || num(a.order)-num(b.order));
  function calculateStats(){
    const wrestlers=arr(state.data.wrestlers), matches=arr(state.data.matches);
    wrestlers.forEach(w=>state.stats.set(w.id,{entity:w,matches:0,wins:0,losses:0,draws:0,unknown:0,streak:0,bestStreak:0,lastDate:'',matchList:[]}));
    matches.forEach(m=>{
      const parts=arr(m.participants); const ids=[...new Set(parts.map(getId).filter(Boolean))];
      ids.forEach(id=>{
        const s=state.stats.get(id); if(!s) return;
        s.matches++; s.matchList.push(m); s.lastDate = dateOf(m) > s.lastDate ? dateOf(m) : s.lastDate;
        const winners=getWinners(m);
        if(!winners.length){s.unknown++;return;}
        if(winners.includes(id)) s.wins++;
        else if(parts.length>1) s.losses++;
        else s.unknown++;
      });
    });
    state.stats.forEach(s=>{
      let run=0; sortMatches(s.matchList).forEach(m=>{const w=getWinners(m);if(!w.length){run=0;return;}if(w.includes(s.entity.id)){run++;s.bestStreak=Math.max(s.bestStreak,run);}else run=0;});
      const ordered=sortMatches(s.matchList).reverse(); for(const m of ordered){const w=getWinners(m);if(!w.length)continue;if(w.includes(s.entity.id))s.streak++;else break;}
      s.draws=Math.max(0,s.matches-s.wins-s.losses-s.unknown);
    });
  }
  async function fetchJSON(path){const r=await fetch(path,{cache:'no-cache'});if(!r.ok)throw new Error(`${path}: HTTP ${r.status}`);return r.json();}
  async function loadData(){
    const keys=Object.keys(DATA); const results=await Promise.allSettled(keys.map(k=>fetchJSON(DATA[k])));
    results.forEach((r,i)=>{state.data[keys[i]]=r.status==='fulfilled'?r.value:[]; if(r.status==='rejected')console.warn('[Legado] No se pudo cargar',DATA[keys[i]],r.reason);});
    for(const e of arr(state.data.events))state.eventById.set(e.id,e);
    for(const w of arr(state.data.wrestlers))state.byId.set(w.id,w);
    calculateStats(); renderAll();
    const missing=results.filter(r=>r.status==='rejected').length;
    $('#legacy-status').textContent=missing ? `Archivo cargado con limitaciones: ${missing} fuente(s) de datos no respondieron. Revisá la ruta del JSON en el despliegue.` : `Archivo conectado · ${fmt(arr(state.data.matches).length)} combates · estadísticas calculadas al cargar la página.`;
  }
  function renderAll(){
    $('#stat-matches').textContent=fmt(arr(state.data.matches).length);
    $('#stat-wrestlers').textContent=fmt(arr(state.data.wrestlers).length);
    $('#stat-events').textContent=fmt(arr(state.data.events).length);
    $('#stat-titles').textContent=fmt(arr(state.data.championships).length);
    populateBrands(); renderOverview(); renderSuperstars(); renderInterpreters(); renderTeams(); renderChampions(); renderAwards(); renderMoments(); applySearch();
  }
  function recordLeaders(){return [...state.stats.values()].filter(s=>s.matches>0).sort((a,b)=>b.wins-a.wins||b.matches-a.matches);}
  function statFeature(label, stat, explanation, suffix='') {return `<article class="legacy-feature"><span class="legacy-feature-label">${esc(label)}</span><strong>${esc(stat)}</strong><p>${esc(explanation)}</p>${suffix?`<em>${esc(suffix)}</em>`:''}</article>`;}
  function renderOverview(){
    const leaders=recordLeaders(); const winRate=[...leaders].filter(s=>s.matches>=3).sort((a,b)=>ratio(b)-ratio(a)||b.wins-a.wins)[0];
    const streak=[...leaders].sort((a,b)=>b.streak-a.streak||b.wins-a.wins)[0];
    const mostActive=[...leaders].sort((a,b)=>b.matches-a.matches)[0];
    const top=leaders[0]; const feature=$('#legacy-feature-grid');
    feature.innerHTML=[
      statFeature('REY DE LAS VICTORIAS',top?top.entity.name:'Sin datos',top?`${top.wins} victorias registradas en ${top.matches} combates.`:'Todavía no hay resultados suficientes para calcular este récord.','MÁS VICTORIAS'),
      statFeature('MAYOR EFECTIVIDAD',winRate?winRate.entity.name:'Sin datos',winRate?`${ratio(winRate)}% de victorias en ${winRate.matches} combates registrados.`:'Se requieren al menos 3 combates con resultados identificables.','MÍNIMO 3 COMBATES'),
      statFeature('RACHA ACTIVA',streak&&streak.streak?streak.entity.name:'Sin racha registrada',streak&&streak.streak?`${streak.streak} victorias consecutivas al cierre de los datos.`:'No se detectó una racha de victorias activa.','VICTORIAS SEGUIDAS'),
      statFeature('MÁS COMBATES',mostActive?mostActive.entity.name:'Sin datos',mostActive?`${mostActive.matches} apariciones registradas.`:'No hay combates enlazados con perfiles.','ACTIVIDAD HISTÓRICA'),
      statFeature('MÁS REINADOS REGISTRADOS',reignLeader()?.name||'Sin datos',reignLeader()?`${reignLeader().count} reinados vinculados en el archivo de campeonatos.`:'No hay reinados disponibles para calcular este dato.','HISTORIAL DE TÍTULOS')
    ].join('');
    $('#overview-leaders').innerHTML=leaders.slice(0,8).map((s,i)=>rankRow(s,i)).join('')||empty('Todavía no hay estadísticas calculables.');
  }
  function rankRow(s,i){return `<article class="legacy-rank-row"><span class="legacy-rank-number">${String(i+1).padStart(2,'0')}</span>${image(s.entity.image,s.entity.name,'legacy-rank-avatar')}<div class="legacy-rank-name"><strong>${esc(s.entity.name)}</strong><small>${esc(s.entity.brand||s.entity.division||'Superstar')} · ${s.matches} combates</small></div><div class="legacy-rank-metrics"><div><strong>${s.wins}</strong><small>VICTORIAS</small></div><div><strong>${ratio(s)}%</strong><small>EFECTIVIDAD</small></div></div></article>`;}
  function empty(text){return `<div class="legacy-empty">${esc(text)}</div>`;}
  function populateBrands(){const brands=[...new Set(arr(state.data.wrestlers).map(w=>w.brand).filter(Boolean))].sort((a,b)=>a.localeCompare(b));$('#filter-brand').innerHTML='<option value="all">Todas las marcas</option>'+brands.map(b=>`<option value="${esc(b)}">${esc(b)}</option>`).join('');}
  function sortedStats(list){const sort=state.sort;return [...list].sort((a,b)=>sort==='name'?a.entity.name.localeCompare(b.entity.name):sort==='rate'?ratio(b)-ratio(a)||b.wins-a.wins:sort==='matches'?b.matches-a.matches:sort==='streak'?b.streak-a.streak||b.wins-a.wins:b.wins-a.wins||b.matches-a.matches);}
  function entityCard(s, accent){const e=s.entity;return `<article class="legacy-entity-card" style="--entity-accent:${accent||'var(--legacy-accent)'}">${image(e.image,e.name)}<div class="legacy-entity-copy"><h3>${esc(e.name)}</h3><p>${esc(e.brand||e.division||e.type||'MI WRESTLING')} · ${esc(e.status==='inactive'?'ALUMNI':'SUPERSTAR')}</p><div class="legacy-entity-metrics"><span><strong>${s.wins}</strong><small>VICTORIAS</small></span><span><strong>${s.matches}</strong><small>COMBATES</small></span><span><strong>${ratio(s)}%</strong><small>EFECTIVIDAD</small></span></div><div class="legacy-bar"><span style="width:${ratio(s)}%"></span></div><p style="margin-top:7px">Racha actual: <b>${s.streak}</b> · Mejor racha: <b>${s.bestStreak}</b></p></div></article>`;}
  function renderSuperstars(){let list=sortedStats([...state.stats.values()].filter(s=>s.matches>0));$('#superstar-grid').innerHTML=list.map(s=>entityCard(s)).join('')||empty('No hay estadísticas individuales disponibles.');}
  function renderInterpreters(){
    const groups=new Map(); arr(state.data.wrestlers).forEach(w=>{const name=String(w.interpreter||'').trim();if(!name)return;const key=name.toLocaleLowerCase();if(!groups.has(key))groups.set(key,{name,profiles:[],matches:0,wins:0,losses:0,streak:0});const g=groups.get(key);g.profiles.push(w);const s=state.stats.get(w.id);if(s){g.matches+=s.matches;g.wins+=s.wins;g.losses+=s.losses;g.streak=Math.max(g.streak,s.streak);}});
    const list=[...groups.values()].sort((a,b)=>b.wins-a.wins||b.matches-a.matches||a.name.localeCompare(b.name));
    $('#interpreter-grid').innerHTML=list.length?list.map((g,i)=>`<article class="legacy-entity-card" style="--entity-accent:${['#c17bff','#46a5ff','#f2c45d','#ff687b'][i%4]}">${image(g.profiles[0]?.image,g.name)}<div class="legacy-entity-copy"><h3>${esc(g.name)}</h3><p>INTÉRPRETE · ${g.profiles.length} personaje(s)/perfil(es) vinculados</p><div class="legacy-entity-metrics"><span><strong>${g.wins}</strong><small>VICTORIAS</small></span><span><strong>${g.matches}</strong><small>APARICIONES*</small></span><span><strong>${g.matches?Math.round(g.wins/g.matches*100):0}%</strong><small>EFECTIVIDAD*</small></span></div><p style="margin-top:8px">Perfiles: ${g.profiles.map(w=>esc(w.name)).join(', ')}</p><small style="color:#818b9b">*Agregado de perfiles enlazados; un mismo combate puede contar más de una vez si varios perfiles comparten intérprete.</small></div></article>`).join(''):empty('No hay intérpretes identificados en el campo interpreter de los perfiles. Cuando se completen esos vínculos, aparecerán acá automáticamente.');
  }
  function renderTeams(){
    const teams=arr(state.data.teams); const matches=arr(state.data.matches);
    $('#team-grid').innerHTML=teams.length?teams.map((t,i)=>{
      const ids=new Set(arr(t.memberWrestlerIds).concat(arr(t.members).map(m=>m.wrestlerId)).filter(Boolean));
      const appearances=matches.filter(m=>arr(m.participants).filter(p=>ids.has(getId(p))).length>=2);
      const wins=appearances.filter(m=>getWinners(m).some(id=>ids.has(id))).length;
      const accent=['#ff687b','#46a5ff','#c17bff','#f2c45d'][i%4];
      return `<article class="legacy-entity-card" style="--entity-accent:${accent}">${image(t.image,t.name)}<div class="legacy-entity-copy"><h3>${esc(t.name)}</h3><p>${esc(t.type||'Equipo')} · ${esc(t.status||'Estado sin registrar')}</p><div class="legacy-entity-metrics"><span><strong>${ids.size}</strong><small>MIEMBROS</small></span><span><strong>${appearances.length}</strong><small>COMBATES* </small></span><span><strong>${wins}</strong><small>VICTORIAS*</small></span></div><p style="margin-top:8px">${arr(t.memberWrestlerIds).map(id=>state.byId.get(id)?.name||id).map(esc).join(' · ')||'Integrantes sin detallar'}</p>${t.membershipReviewRequired?'<small style="color:#d9b86b">Membresía pendiente de confirmar</small>':''}<small style="display:block;color:#818b9b;margin-top:5px">*Estimación por miembros registrados en el mismo combate; no sustituye un resultado oficial por equipo.</small></div></article>`;
    }).join(''):empty('No hay equipos en data/teams/teams.json.');
  }
  function reignLeader(){const counts=new Map();arr(state.data.reigns).forEach(r=>{const id=r.championId||arr(r.championWrestlerIds)[0]||r.championName;if(!id)return;const key=String(id);const obj=counts.get(key)||{id:key,count:0,name:r.championName||state.byId.get(key)?.name||key};obj.count++;counts.set(key,obj);});return [...counts.values()].sort((a,b)=>b.count-a.count)[0]||null;}
  function renderChampions(){
    const reigns=arr(state.data.reigns), titles=arr(state.data.championships); const counts=new Map();reigns.forEach(r=>{const id=r.championshipId;if(id)counts.set(id,(counts.get(id)||0)+1);});
    const champLeaders=new Map();reigns.forEach(r=>{const ids=arr(r.championWrestlerIds).length?arr(r.championWrestlerIds):[r.championId||r.championName];ids.filter(Boolean).forEach(id=>{const key=String(id);const x=champLeaders.get(key)||{name:r.championName||state.byId.get(key)?.name||key,count:0,days:0};x.count++;x.days+=num(r.durationDays);champLeaders.set(key,x);});});
    const top=[...champLeaders.values()].sort((a,b)=>b.count-a.count)[0]; const longest=[...reigns].sort((a,b)=>num(b.durationDays)-num(a.durationDays))[0];
    $('#champion-highlights').innerHTML=[statFeature('MÁS REINADOS REGISTRADOS',top?.name||'Sin datos',top?`${top.count} reinados en el archivo disponible.`:'No hay reinados suficientes.','REINADOS'),statFeature('REINADO MÁS LARGO REGISTRADO',longest?.championName||'Sin datos',longest?`${num(longest.durationDays)} días${longest.durationIsApproximate?' (aproximados)':''}.`:'No hay duración registrada.','DURACIÓN DOCUMENTADA'),statFeature('HISTORIAL DE REINADOS',fmt(reigns.length),`${titles.length} campeonatos catalogados en el sistema.`,'ARCHIVO DE TÍTULOS')].join('');
    $('#reign-grid').innerHTML=titles.map((t,i)=>{const champReigns=reigns.filter(r=>r.championshipId===t.id);const champCount=new Map();champReigns.forEach(r=>{const n=r.championName||r.championId||'Sin campeón';champCount.set(n,(champCount.get(n)||0)+1);});const topChamp=[...champCount.entries()].sort((a,b)=>b[1]-a[1])[0];return `<article class="legacy-entity-card" style="--entity-accent:${['#f2c45d','#46a5ff','#c17bff','#ff687b'][i%4]}">${image(t.image,t.name)}<div class="legacy-entity-copy"><h3>${esc(t.name)}</h3><p>${esc(t.promotion||'MI WRESTLING')} · ${esc(t.category||'Campeonato')}</p><div class="legacy-entity-metrics"><span><strong>${champReigns.length}</strong><small>REINADOS</small></span><span><strong>${esc(t.champion||'—')}</strong><small>CAMPEÓN ACTUAL*</small></span><span><strong>${topChamp?topChamp[1]:0}</strong><small>RÉCORD DEL ARCHIVO</small></span></div><p style="margin-top:8px">${topChamp?`Más reinados en los datos: ${esc(topChamp[0])}`:'Sin reinados enlazados.'}</p><small style="color:#818b9b">*Se muestra el campeón que figura en el catálogo; revisar si no coincide con el último reinado.</small></div></article>`;}).join('')||empty('No hay campeonatos disponibles.');
  }
  function renderAwards(){
    const stats=recordLeaders(), with3=stats.filter(s=>s.matches>=3), teams=arr(state.data.teams);
    const bestRate=[...with3].sort((a,b)=>ratio(b)-ratio(a)||b.wins-a.wins)[0]; const mostWins=stats[0];const mostMatches=[...stats].sort((a,b)=>b.matches-a.matches)[0];const longestStreak=[...stats].sort((a,b)=>b.bestStreak-a.bestStreak)[0];
    const bestMatch=[...arr(state.data.matches)].filter(m=>arr(m.participants).length>=2&&getWinners(m).length).sort((a,b)=>{const score=m=>arr(m.participants).reduce((s,p)=>s+Math.max(0,num(p.score)),0);return score(b)-score(a)||num(a.order)-num(b.order)}).slice(0,1)[0];
    const awards=[['SUPERSTAR DEL AÑO',mostWins?`${mostWins.entity.name} · ${mostWins.wins} victorias`:'Sin candidatos',mostWins?mostWins.entity.image:null,mostWins?mostWins.wins:0,'Basado en victorias registradas'],['MEJOR EFECTIVIDAD',bestRate?`${bestRate.entity.name} · ${ratio(bestRate)}%`:'Sin candidatos',bestRate?.entity.image,bestRate?ratio(bestRate):0,'Mínimo de 3 combates registrados'],['MÁS ACTIVO',mostMatches?`${mostMatches.entity.name} · ${mostMatches.matches} combates`:'Sin candidatos',mostMatches?.entity.image,mostMatches?mostMatches.matches:0,'Apariciones registradas'],['RACHA DEL AÑO',longestStreak?`${longestStreak.entity.name} · ${longestStreak.bestStreak} seguidas`:'Sin candidatos',longestStreak?.entity.image,longestStreak?longestStreak.bestStreak:0,'Mejor racha consecutiva detectada'],['COMBATE DESTACADO',bestMatch?`${eventTitle(bestMatch.eventId)} · ${arr(bestMatch.participants).map(p=>p.name||state.byId.get(getId(p))?.name||getId(p)).join(' vs ')}`:'Sin candidatos',null,bestMatch?arr(bestMatch.participants).reduce((s,p)=>s+Math.max(0,num(p.score)),0):0,'Candidato por puntuación registrada; no equivale a elección editorial'],['EQUIPO DEL AÑO',teams.length?`${teams[0].name} · equipo catalogado`:'Sin equipos',teams[0]?.image,0,'Candidato de catálogo; faltan datos fiables para premiar victorias de equipo']];
    $('#award-grid').innerHTML=awards.map((a,i)=>`<article class="legacy-award-card"><header><h3>${esc(a[0])}</h3><span>CATEGORÍA ${String(i+1).padStart(2,'0')}</span></header><div class="legacy-award-candidate">${a[2]?image(a[2],a[1]):'<div class="legacy-avatar" aria-hidden="true" style="display:grid;place-items:center;color:#d2b965;font-size:1.5rem">✦</div>'}<div><strong>${esc(a[1])}</strong><small>${esc(a[4])}</small></div>${a[3]?`<b>${fmt(a[3])}</b>`:''}</div></article>`).join('');
  }
  function renderMoments(){
    const candidates=arr(state.data.matches).filter(m=>arr(m.participants).length>=2&&getWinners(m).length).map(m=>({m,score:arr(m.participants).reduce((s,p)=>s+Math.max(0,num(p.score)),0)})).sort((a,b)=>b.score-a.score||String(dateOf(b.m)).localeCompare(String(dateOf(a.m)))).slice(0,12);
    $('#moment-grid').innerHTML=candidates.length?candidates.map(({m,score},i)=>`<article class="legacy-moment-card"><div class="legacy-moment-index">${String(i+1).padStart(2,'0')}</div><div><h3>${esc(eventTitle(m.eventId))}</h3><p>${esc(dateOf(m)||'Fecha no registrada')} · ${esc(m.type||'Combate')} ${m.stipulation?`· ${esc(typeof m.stipulation==='string'?m.stipulation:m.stipulation.name||'Estipulación')}`:''}</p><strong>${arr(m.participants).map(p=>`${p.name||state.byId.get(getId(p))?.name||getId(p)}${p.score!==undefined&&p.score!==null?` (${p.score})`:''}`).map(esc).join(' VS ')}</strong><p style="margin-top:7px">Ganador(es): ${esc(getWinners(m).map(id=>state.byId.get(id)?.name||arr(m.participants).find(p=>getId(p)===id)?.name||id).join(', '))}</p><small style="color:#818b9b">Selección automática por puntuación registrada (${score}); no es un ranking editorial de calidad.</small></div></article>`).join(''):empty('No hay combates con resultados identificables para destacar.');
  }
  function applySearch(){
    const q=state.search.toLocaleLowerCase(); const active=$(`[data-panel="${state.tab}"]`);if(!active)return;
    const cards=$$('.legacy-entity-card,.legacy-rank-row,.legacy-award-card,.legacy-moment-card,.legacy-feature',active);
    let shown=0;cards.forEach(c=>{const yes=!q||c.textContent.toLocaleLowerCase().includes(q);c.hidden=!yes;if(yes)shown++;});
    const grid=active.querySelector('.legacy-entity-grid'); if(grid&&state.tab==='superstars'){
      const cardsList=[...grid.querySelectorAll('.legacy-entity-card')]; cardsList.forEach(c=>{const w=arr(state.data.wrestlers).find(x=>x.name===c.querySelector('h3')?.textContent);const ok=(!q||c.textContent.toLocaleLowerCase().includes(q))&&(state.brand==='all'||w?.brand===state.brand)&&(state.status==='all'||w?.status===state.status);c.hidden=!ok;});
    }
  }
  function setTab(tab){state.tab=tab;$$('.legacy-tab').forEach(b=>{const active=b.dataset.tab===tab;b.classList.toggle('is-active',active);b.setAttribute('aria-selected',String(active));});$$('.legacy-panel').forEach(p=>{const active=p.dataset.panel===tab;p.classList.toggle('is-visible',active);p.hidden=!active;});$('#legacy-detail').hidden=true;applySearch();}
  function events(){
    // La ruta existente recaps.html pasa a presentarse como LEGADO sin tocar el core compartido.
    document.querySelectorAll('a[href]').forEach(a=>{if(/(?:^|\/)recaps\.html(?:[?#].*)?$/.test(a.getAttribute('href')||'')){a.setAttribute('aria-label','Legado');a.setAttribute('title','Legado');a.childNodes.forEach(n=>{if(n.nodeType===Node.TEXT_NODE&&/recaps/i.test(n.textContent))n.textContent=n.textContent.replace(/recaps/ig,'Legado');});}});
    $$('.legacy-tab').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
    $$('[data-jump]').forEach(b=>b.addEventListener('click',()=>{setTab(b.dataset.jump);$('.legacy-tabs').scrollIntoView({behavior:'smooth',block:'start'});}));
    $('#legacy-search').addEventListener('input',e=>{state.search=e.target.value;applySearch();});
    $('#legacy-sort').addEventListener('change',e=>{state.sort=e.target.value;renderSuperstars();renderOverview();applySearch();});
    $('#filter-brand').addEventListener('change',e=>{state.brand=e.target.value;applySearch();});$('#filter-status').addEventListener('change',e=>{state.status=e.target.value;applySearch();});
  }
  document.addEventListener('DOMContentLoaded',()=>{events();loadData().catch(err=>{console.error('[Legado]',err);$('#legacy-status').textContent='No se pudo conectar con los datos. Comprobá que esta página esté publicada en la raíz del proyecto y que existan los archivos data/*.json.';const panels=$$('.legacy-panel');panels.forEach(p=>{const grid=p.querySelector('.legacy-feature-grid,.legacy-entity-grid,.legacy-ranking-list,.legacy-award-grid,.legacy-moment-grid');if(grid)grid.innerHTML=empty('No se pudieron cargar los datos. Revisá las rutas de los archivos JSON.');});});});
})();
