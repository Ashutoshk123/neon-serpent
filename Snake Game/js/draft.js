/* ============================================================================
   DRAFT SCREEN (§2) — every 5 foods, time freezes, the world desaturates and
   the player picks 1 of 3 mutations. Every third draft one card is a Devil's
   Bargain. Also owns the held-build HUD strip and the synergy banner.
   ========================================================================== */
(function(){
"use strict";
const NS = window.NS, C = window.NSCore || {}, U = NS.util;

const FOODS_PER_DRAFT = 5;
let eatsSince = 0, draftNo = 0, open = false, cards = [], cursor = 0;

const RAR = {
  common:    {label:'COMMON',    col:'#94a3b8', w:10},
  rare:      {label:'RARE',      col:'#38bdf8', w:6},
  epic:      {label:'EPIC',      col:'#c084fc', w:3},
  legendary: {label:'LEGENDARY', col:'#fbbf24', w:1}
};
const FAM = {
  body:     {name:'BODY',     col:'#34d399'},
  hunt:     {name:'HUNT',     col:'#38bdf8'},
  violence: {name:'VIOLENCE', col:'#f43f5e'},
  chaos:    {name:'CHAOS',    col:'#c084fc'},
  curse:    {name:"DEVIL'S BARGAIN", col:'#ef4444'}
};

/* ================================= styles ================================ */
NS.css('ns-draft-css', `
#nsDraft{position:fixed;inset:0;z-index:40;display:none;place-items:center;padding:16px;
  background:radial-gradient(120% 100% at 50% 0%,rgba(6,8,20,.72),rgba(3,4,10,.94));
  backdrop-filter:blur(14px) saturate(35%)}
#nsDraft.show{display:grid;animation:dfIn .34s var(--ease-out)}
@keyframes dfIn{from{opacity:0;backdrop-filter:blur(0) saturate(100%)}to{opacity:1}}
#nsDraft.out{animation:dfOut .26s var(--ease) forwards}
@keyframes dfOut{to{opacity:0}}
/* the arena desaturates behind the draft */
body.drafting #shaker{filter:saturate(.12) brightness(.6);transition:filter .34s var(--ease)}
#shaker{transition:filter .5s var(--ease)}

.df-wrap{width:min(940px,97vw);text-align:center}
.df-head{font-size:clamp(11px,2.4vw,13px);font-weight:900;letter-spacing:.42em;color:var(--txt-dim);
  margin-bottom:4px}
.df-title{font-size:clamp(24px,6vw,42px);font-weight:900;letter-spacing:.06em;line-height:1;
  background:linear-gradient(96deg,var(--a1),var(--a2) 55%,var(--a3));
  -webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 24px color-mix(in srgb,var(--a2) 55%,transparent))}
.df-sub{font-size:10.5px;letter-spacing:.24em;color:var(--txt-dim);font-weight:800;margin:8px 0 20px}
.df-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
@media (max-width:720px){.df-cards{grid-template-columns:1fr;gap:9px}}

.df-card{position:relative;border-radius:20px;padding:18px 15px;cursor:pointer;overflow:hidden;
  border:1px solid var(--stroke);text-align:center;
  background:linear-gradient(165deg,rgba(255,255,255,.075),rgba(255,255,255,.02));
  backdrop-filter:blur(18px);
  transition:transform .3s var(--ease),box-shadow .3s var(--ease),border-color .3s,background .3s;
  animation:cardIn .5s var(--ease-out) both}
.df-card:nth-child(2){animation-delay:.07s}
.df-card:nth-child(3){animation-delay:.14s}
@keyframes cardIn{from{opacity:0;transform:translateY(26px) scale(.94) rotate(-1deg)}to{opacity:1;transform:none}}
.df-card:hover,.df-card.sel{transform:translateY(-6px) scale(1.02)}
.df-card.sel{border-color:var(--pick);box-shadow:0 24px 60px -26px #000,0 0 44px -12px var(--pick)}
.df-card::before{content:"";position:absolute;inset:0 0 auto 0;height:2px;background:var(--pick);
  box-shadow:0 0 18px var(--pick)}
.df-card .fam{font-size:8.5px;font-weight:900;letter-spacing:.26em;color:var(--pick)}
.df-card .ic{font-size:44px;margin:10px 0 6px;filter:drop-shadow(0 0 16px var(--pick));line-height:1}
.df-card .nm{font-size:17px;font-weight:900;letter-spacing:.03em}
.df-card .rar{font-size:8.5px;font-weight:900;letter-spacing:.2em;margin-top:4px}
.df-card .ds{font-size:11.5px;line-height:1.65;color:var(--txt-dim);margin-top:9px;min-height:56px}
.df-card .own{position:absolute;top:12px;right:13px;font-size:9px;font-weight:900;letter-spacing:.1em;
  padding:3px 8px;border-radius:99px;background:rgba(0,0,0,.45);border:1px solid var(--stroke)}
.df-card .key{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);font-size:9px;
  letter-spacing:.2em;color:var(--txt-dim);font-weight:800}
.df-card.curse{border-color:rgba(239,68,68,.5);
  background:linear-gradient(165deg,rgba(239,68,68,.16),rgba(20,4,8,.5))}
.df-card.curse::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(90% 70% at 50% 110%,rgba(239,68,68,.25),transparent 70%);
  animation:cursePulse 2.4s ease-in-out infinite}
@keyframes cursePulse{50%{opacity:.55}}
.df-foot{margin-top:16px;font-size:10px;letter-spacing:.2em;color:var(--txt-dim);font-weight:800}

/* synergy banner */
#nsSyn{position:fixed;left:50%;top:22%;transform:translate(-50%,-50%) scale(.8);z-index:45;
  opacity:0;pointer-events:none;text-align:center}
#nsSyn.on{animation:synIn 2.4s var(--ease-out)}
@keyframes synIn{
  0%{opacity:0;transform:translate(-50%,-50%) scale(.6);filter:blur(14px)}
  14%{opacity:1;transform:translate(-50%,-50%) scale(1.06);filter:blur(0)}
  78%{opacity:1;transform:translate(-50%,-50%) scale(1)}
  100%{opacity:0;transform:translate(-50%,-60%) scale(1.1);filter:blur(6px)}}
#nsSyn .sn{font-size:clamp(20px,5vw,34px);font-weight:900;letter-spacing:.16em;color:#fff;
  text-shadow:0 0 24px var(--a2),0 0 60px var(--a1)}
#nsSyn .sd{font-size:11px;letter-spacing:.12em;color:var(--txt-dim);font-weight:700;margin-top:6px}
#nsSyn .st{font-size:9px;letter-spacing:.4em;color:var(--a2);font-weight:900;margin-bottom:6px}

/* build strip in the HUD */
#nsBuild{display:flex;flex-wrap:wrap;gap:5px}
#nsBuild .mu{position:relative;width:30px;height:30px;border-radius:10px;display:grid;place-items:center;
  font-size:15px;border:1px solid var(--stroke);background:rgba(255,255,255,.06);
  animation:chipin .3s var(--ease)}
#nsBuild .mu.curse{border-color:rgba(239,68,68,.6);background:rgba(239,68,68,.14)}
#nsBuild .mu b{position:absolute;right:-3px;bottom:-3px;font-size:8.5px;font-weight:900;
  background:var(--a2);color:#07070f;border-radius:99px;padding:1px 4px;line-height:1.3}
#nsBuild .syn{font-size:9px;font-weight:900;letter-spacing:.1em;color:#fbbf24;
  padding:5px 8px;border-radius:9px;border:1px solid rgba(251,191,36,.45);background:rgba(251,191,36,.1)}
@media (max-width:900px){#nsBuildCard{flex:0 0 auto}#nsBuild{flex-wrap:nowrap}}
`);

/* ================================= markup ================================ */
function ensureUI(){
  if(document.getElementById('nsDraft')) return;
  const el = document.createElement('div');
  el.id = 'nsDraft';
  el.innerHTML =
    '<div class="df-wrap">'+
      '<div class="df-head" id="dfHead">MUTATION</div>'+
      '<div class="df-title">CHOOSE YOUR EVOLUTION</div>'+
      '<div class="df-sub" id="dfSub"></div>'+
      '<div class="df-cards" id="dfCards"></div>'+
      '<div class="df-foot">← → TO BROWSE · ENTER OR TAP TO TAKE</div>'+
    '</div>';
  document.body.appendChild(el);

  const syn = document.createElement('div');
  syn.id = 'nsSyn';
  document.body.appendChild(syn);

  /* build strip lives in the existing HUD, styled like the other cards */
  const hud = document.querySelector('.hud');
  const pwr = document.getElementById('pwrcard');
  if(hud && pwr && !document.getElementById('nsBuildCard')){
    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'nsBuildCard';
    card.innerHTML = '<div class="k" style="margin-bottom:8px">Build</div><div id="nsBuild"></div>';
    hud.insertBefore(card, pwr.nextSibling);
  }
}

/* =============================== the draft =============================== */
/* Pure-ish: rollCards(n) is a function of (run seed, draft index, current pool).
   Called with no argument it advances the run's own draft counter.            */
function rollCards(index){
  const n = (index === undefined) ? ++draftNo : index;
  if(index === undefined) draftNo = n;
  const rng = NS.rng.stream('draft-' + n);
  const withCurse = (n % 3 === 0);
  const picks = [];

  /* weight by rarity, and let the run's depth pull rarer cards in */
  const depth = Math.min(1, n/14);
  function rollFrom(pool){
    const weighted = pool.map(x => {
      const r = RAR[x.rarity] || RAR.common;
      let w = r.w;
      if(x.rarity === 'epic')      w += depth*4;
      if(x.rarity === 'legendary') w += depth*3;
      return {x, weight:w};
    }).filter(o => !picks.some(p => p.id === o.x.id));
    if(!weighted.length) return null;
    return rng.weighted(weighted).x;
  }

  const normal = NS.mut.pool(false);
  for(let i=0;i<(withCurse?2:3);i++){
    const c = rollFrom(normal);
    if(c) picks.push(c);
  }
  if(withCurse){
    const curses = NS.mut.pool('only');
    const c = curses.length ? rollFrom(curses) : rollFrom(normal);
    if(c) picks.push(c);
  }
  /* pad if the pool ran dry (very long runs) */
  while(picks.length < 3){
    const c = rollFrom(NS.mut.ALL);
    if(!c) break;
    picks.push(c);
  }
  return picks;
}

function cardHTML(x, idx){
  const fam = FAM[x.curse ? 'curse' : x.family] || FAM.body;
  const rar = RAR[x.rarity] || RAR.common;
  const h = NS.mut.held.filter(k => k.id === x.id)[0];
  const col = x.curse ? fam.col : rar.col;
  return '<div class="df-card'+(x.curse?' curse':'')+(idx===cursor?' sel':'')+'" data-i="'+idx+'" '+
         'style="--pick:'+col+'">'+
    (h ? '<div class="own">OWNED ×'+h.stacks+'</div>' : '')+
    '<div class="fam">'+fam.name+'</div>'+
    '<div class="ic">'+x.ic+'</div>'+
    '<div class="nm">'+U.esc(x.name)+'</div>'+
    '<div class="rar" style="color:'+rar.col+'">'+rar.label+'</div>'+
    '<div class="ds">'+U.esc(x.desc)+'</div>'+
    '<div class="key">'+(idx+1)+'</div>'+
  '</div>';
}

function paint(){
  const box = document.getElementById('dfCards');
  if(!box) return;
  box.innerHTML = cards.map(cardHTML).join('');
  box.querySelectorAll('.df-card').forEach(el=>{
    el.addEventListener('pointerenter', ()=>{ cursor = +el.dataset.i; mark(); });
    el.addEventListener('click', ()=>{ cursor = +el.dataset.i; choose(); });
  });
}
function mark(){
  const box = document.getElementById('dfCards');
  if(!box) return;
  box.querySelectorAll('.df-card').forEach(el=>
    el.classList.toggle('sel', +el.dataset.i === cursor));
}

function show(){
  ensureUI();
  cards = rollCards();
  if(!cards.length) return;
  cursor = 0;
  open = true;
  const g = C.G;
  if(g) g.state = 'draft';                        // core pauses the simulation
  document.body.classList.add('drafting');
  document.getElementById('dfHead').textContent =
    'MUTATION ' + (NS.mut.count()+1) + '  ·  DRAFT ' + draftNo;
  document.getElementById('dfSub').textContent =
    cards.some(c=>c.curse) ? 'ONE OF THESE WANTS SOMETHING IN RETURN'
                           : 'YOUR BUILD IS TAKING SHAPE';
  paint();
  const el = document.getElementById('nsDraft');
  el.classList.remove('out'); el.classList.add('show');
  if(C.Audio_){ C.Audio_.resume(); C.Audio_.tone(520,.16,'triangle',.16,1.8); C.Audio_.tone(780,.2,'sine',.1,1.4,.08); }
  if(C.vib) C.vib(18);
}

function choose(){
  if(!open) return;
  const x = cards[cursor];
  if(!x) return;
  open = false;
  NS.mut.take(x.id);
  const el = document.getElementById('nsDraft');
  el.classList.add('out');
  setTimeout(()=>{ el.classList.remove('show','out'); }, 260);
  document.body.classList.remove('drafting');
  const g = C.G;
  if(g && g.state === 'draft') g.state = 'play';
  if(C.Audio_){
    if(x.curse){ C.Audio_.tone(160,.5,'sawtooth',.2,.5); C.Audio_.noise(.5,.12,600); }
    else C.Audio_.big();
  }
  if(C.flash) C.flash(x.curse ? .45 : .28);
  if(NS.juice) NS.juice.trauma(x.curse ? .8 : .4);
  if(C.vib) C.vib(x.curse ? [30,60,30] : [14,30]);
  if(C.toast) C.toast(x.ic, x.curse ? "DEVIL'S BARGAIN" : 'MUTATION GAINED', x.name);
  renderBuild();
}

/* ------------------------------- synergies ------------------------------- */
NS.on('synergy', sy => {
  const el = document.getElementById('nsSyn');
  if(!el) return;
  el.innerHTML = '<div class="st">SYNERGY</div><div class="sn">'+U.esc(sy.name)+
                 '</div><div class="sd">'+U.esc(sy.desc)+'</div>';
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  if(C.Audio_){
    [523,659,784,1046,1318].forEach((f,i)=>C.Audio_.tone(f,.3,'triangle',.15,1,i*.07));
  }
  if(C.flash) C.flash(.4);
  if(NS.juice) NS.juice.trauma(.7);
  if(C.vib) C.vib([20,40,20,40]);
  renderBuild();
});

/* ------------------------------ build strip ------------------------------ */
function renderBuild(){
  const box = document.getElementById('nsBuild');
  if(!box) return;
  const held = NS.mut.held;
  if(!held.length){
    box.innerHTML = '<span class="hint">No mutations yet</span>';
    return;
  }
  box.innerHTML =
    held.map(h => '<span class="mu'+(h.def.curse?' curse':'')+'" title="'+U.esc(h.def.name)+
                  ' — '+U.esc(h.def.desc)+'">'+h.def.ic+
                  (h.stacks>1 ? '<b>'+h.stacks+'</b>' : '')+'</span>').join('') +
    NS.mut.synergies.map(s => '<span class="syn">'+U.esc(s.name)+'</span>').join('');
}

/* ------------------------------ draft trigger ---------------------------- */
NS.on('start', () => {
  eatsSince = 0; draftNo = 0; open = false;
  ensureUI();
  renderBuild();
});

NS.on('eat', () => {
  if(NS.settings.mode !== 'rogue') return;
  const g = C.G;
  if(!g || g.demo) return;
  eatsSince++;
  if(eatsSince < FOODS_PER_DRAFT) return;
  eatsSince = 0;
  setTimeout(show, 120);                 // let the eat juice land first
});

/* keep the strip honest if a run ends mid-draft */
NS.on('gameover', () => {
  open = false;
  document.body.classList.remove('drafting');
  const el = document.getElementById('nsDraft');
  if(el) el.classList.remove('show','out');
});

/* -------------------------------- input ---------------------------------- */
addEventListener('keydown', e => {
  if(!open) return;
  const k = e.code;
  if(k==='ArrowLeft' || k==='KeyA'){ cursor = (cursor+cards.length-1)%cards.length; mark(); e.preventDefault(); e.stopPropagation(); }
  else if(k==='ArrowRight' || k==='KeyD'){ cursor = (cursor+1)%cards.length; mark(); e.preventDefault(); e.stopPropagation(); }
  else if(k==='Enter' || k==='Space'){ choose(); e.preventDefault(); e.stopPropagation(); }
  else if(k==='Digit1'||k==='Digit2'||k==='Digit3'){ cursor = +k.slice(5)-1; mark(); choose(); e.preventDefault(); }
}, true);

NS.ready(()=>{ ensureUI(); renderBuild(); });
NS.draft = {
  show, choose, rollCards,
  reset(){ eatsSince = 0; draftNo = 0; open = false; },
  get open(){ return open; },
  get number(){ return draftNo; },
  get pending(){ return FOODS_PER_DRAFT - eatsSince; }
};
})();
