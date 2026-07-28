/* ============================================================================
   NEON SERPENT v2.0 — progression glue.
   Wires the shop and profile into the existing UI, applies purchased
   cosmetics (trails, bursts, borders, victory effects) and shows the
   end-of-run reward summary. Nothing here replaces core behaviour.
   ========================================================================== */
(function(){
"use strict";
const NS = window.NS, C = window.NSCore || {}, U = NS.util;
const P  = NS.profile;

/* ============================ cosmetic effects ============================ */
function spark(o){
  const G = C.G;
  if(!G || !G.parts || G.parts.length > 360) return;
  const life = o.life || .5;
  G.parts.push({x:o.x, y:o.y, vx:o.vx||0, vy:o.vy||0, life, max:life,
                r:o.r || G.cell*.1, col:o.col || '#fff', g:1});
}
function tailPt(G){
  const pts = G.snake.pts;
  return pts[Math.min(4, pts.length-1)] || pts[0];
}

const TRAIL_FX = {
  none: null,
  sparks(G){
    const p = tailPt(G);
    spark({x:p.x, y:p.y, vx:U.rand(-16,16), vy:U.rand(-16,16), life:.35,
           r:G.cell*.06, col:'#fcd34d'});
  },
  embers(G){
    const p = tailPt(G);
    spark({x:p.x+U.rand(-4,4), y:p.y, vx:U.rand(-8,8), vy:U.rand(-30,-12), life:.7,
           r:G.cell*.08, col: Math.random()<.4 ? '#fbbf24' : '#f97316'});
  },
  frost(G){
    const p = tailPt(G);
    spark({x:p.x+U.rand(-6,6), y:p.y+U.rand(-6,6), vx:U.rand(-5,5), vy:U.rand(-2,12),
           life:1, r:G.cell*.055, col:'#e0f7ff'});
  },
  stars(G){
    if(Math.random() > .5) return;
    const p = tailPt(G);
    spark({x:p.x, y:p.y, vx:U.rand(-3,3), vy:U.rand(-3,3), life:1.2,
           r:G.cell*.07, col: Math.random()<.5 ? '#ffffff' : '#c7d2fe'});
  },
  plasma(G){
    const p = tailPt(G);
    spark({x:p.x, y:p.y, vx:U.rand(-22,22), vy:U.rand(-22,22), life:.45,
           r:G.cell*.09, col: Math.random()<.5 ? '#e879f9' : '#a855f7'});
  },
  prism(G){
    const p = tailPt(G);
    spark({x:p.x, y:p.y, vx:U.rand(-14,14), vy:U.rand(-14,14), life:.6,
           r:G.cell*.08, col: U.hsl((G.t*260 + Math.random()*80)%360, 100, 62)});
  }
};

const BURST_FX = {
  classic: null,
  confetti(x,y,G){
    for(let i=0;i<14;i++){
      const a = Math.random()*6.2832, s = U.rand(.4,1)*G.cell*9;
      spark({x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s - G.cell*3, life:U.rand(.5,1),
             r:G.cell*U.rand(.05,.1),
             col:U.pick(['#f472b6','#fbbf24','#22d3ee','#a3e635','#c084fc'])});
    }
  },
  shards(x,y,G){
    for(let i=0;i<10;i++){
      const a = Math.random()*6.2832, s = U.rand(.7,1)*G.cell*14;
      spark({x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, life:.45,
             r:G.cell*.09, col:U.pick(['#a5f3fc','#e0f7ff','#67e8f9'])});
    }
  },
  nova(x,y,G){
    if(C.burst) C.burst(x, y, 4, '#fbbf24', 1.1, true);
    for(let i=0;i<12;i++){
      const a = i/12*6.2832;
      spark({x, y, vx:Math.cos(a)*G.cell*12, vy:Math.sin(a)*G.cell*12, life:.4,
             r:G.cell*.07, col:'#fde68a'});
    }
  },
  voltage(x,y,G){
    for(let i=0;i<12;i++){
      const a = Math.random()*6.2832, s = U.rand(.5,1)*G.cell*18;
      spark({x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, life:.28,
             r:G.cell*.05, col: Math.random()<.5 ? '#fef9c3' : '#fde047'});
    }
  },
  blossom(x,y,G){
    for(let i=0;i<12;i++){
      const a = i/12*6.2832 + Math.random()*.3, s = U.rand(.3,.7)*G.cell*8;
      spark({x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s - G.cell*2, life:U.rand(.8,1.3),
             r:G.cell*.1, col:U.pick(['#fb7185','#fda4af','#fecdd3'])});
    }
  }
};

let trailAcc = 0;
NS.on('tick', dt => {
  const G = C.G;
  if(!G || G.state !== 'play' || G.demo) return;
  const fx = TRAIL_FX[P.equipped('trail')];
  if(!fx) return;
  trailAcc += dt;
  if(trailAcc < .035) return;
  trailAcc = 0;
  fx(G);
});

NS.on('eat', e => {
  const fx = BURST_FX[P.equipped('particle')];
  if(fx) fx(e.x, e.y, C.G);
});

/* -------------------------------- borders -------------------------------- */
NS.css('ns-border-css', `
#board.bd-gold{border-color:rgba(251,191,36,.6);
  box-shadow:0 0 0 1px rgba(255,255,255,.05) inset,0 30px 70px -30px rgba(0,0,0,.9),
             0 0 40px -6px rgba(251,191,36,.55),0 0 110px -34px rgba(251,191,36,.8)}
#board.bd-plasma{border-color:rgba(232,121,249,.6);
  box-shadow:0 0 0 1px rgba(255,255,255,.05) inset,0 30px 70px -30px rgba(0,0,0,.9),
             0 0 44px -6px rgba(232,121,249,.6),0 0 120px -30px rgba(168,85,247,.85);
  animation:bdPulse 2.6s ease-in-out infinite}
#board.bd-circuit{border-color:rgba(34,197,94,.6);border-style:dashed;
  box-shadow:0 0 0 1px rgba(255,255,255,.05) inset,0 30px 70px -30px rgba(0,0,0,.9),
             0 0 34px -8px rgba(34,197,94,.7)}
#board.bd-frost{border-color:rgba(165,243,252,.65);
  box-shadow:0 0 0 1px rgba(255,255,255,.06) inset,0 30px 70px -30px rgba(0,0,0,.9),
             0 0 40px -8px rgba(165,243,252,.7),inset 0 0 80px -30px rgba(224,247,255,.9)}
#board.bd-magma{border-color:rgba(249,115,22,.7);
  box-shadow:0 0 0 1px rgba(255,255,255,.05) inset,0 30px 70px -30px rgba(0,0,0,.9),
             0 0 46px -6px rgba(249,115,22,.75),inset 0 0 90px -40px rgba(239,68,68,.9);
  animation:bdPulse 3.4s ease-in-out infinite}
@keyframes bdPulse{50%{filter:brightness(1.22)}}
`);
function applyBorder(){
  const b = document.getElementById('board');
  if(!b) return;
  Array.prototype.slice.call(b.classList).forEach(c=>{
    if(c.indexOf('bd-') === 0) b.classList.remove(c);
  });
  const id = P.equipped('border');
  if(id && id !== 'none') b.classList.add('bd-' + id);
}

/* ---------------------------- victory effects ---------------------------- */
const VICTORY_FX = {
  none(){},
  fireworks(){
    const G = C.G; if(!G || !C.burst) return;
    for(let i=0;i<6;i++){
      setTimeout(()=>{
        C.burst(U.rand(G.w*.15, G.w*.85), U.rand(G.h*.15, G.h*.6), 26,
                U.pick(['#f472b6','#fbbf24','#22d3ee','#a3e635']), 1.3, true);
        if(C.Audio_) C.Audio_.tone(600 + Math.random()*500, .18, 'triangle', .12, 1.6);
      }, i*220);
    }
  },
  confetti(){
    const G = C.G; if(!G) return;
    for(let i=0;i<70;i++){
      spark({x:U.rand(0,G.w), y:U.rand(-G.h*.2, 0), vx:U.rand(-14,14), vy:U.rand(30,90),
             life:U.rand(1.2,2.2), r:G.cell*U.rand(.06,.12),
             col:U.pick(['#f472b6','#fbbf24','#22d3ee','#a3e635','#c084fc','#ffffff'])});
    }
  },
  shockwave(){
    const G = C.G; if(!G || !C.burst) return;
    C.burst(G.w/2, G.h/2, 46, '#22d3ee', 1.8, true);
    if(C.shake) C.shake(1.2);
    if(C.flash) C.flash(.5);
  },
  starfall(){
    const G = C.G; if(!G) return;
    for(let i=0;i<50;i++){
      setTimeout(()=>{
        spark({x:U.rand(0,G.w), y:-10, vx:U.rand(-6,6), vy:U.rand(60,140),
               life:1.6, r:G.cell*.08, col: Math.random()<.5 ? '#ffffff' : '#c7d2fe'});
      }, i*26);
    }
  }
};

/* ============================== reward strip ============================== */
NS.css('ns-prog-css', `
.ns-rewards{display:flex;gap:8px;justify-content:center;margin:14px 0 2px;flex-wrap:wrap}
.ns-rw{display:flex;align-items:center;gap:7px;padding:9px 14px;border-radius:14px;
  border:1px solid var(--stroke);background:rgba(255,255,255,.05);
  animation:rwIn .55s var(--ease-out) both}
.ns-rw:nth-child(2){animation-delay:.09s}
.ns-rw:nth-child(3){animation-delay:.18s}
@keyframes rwIn{from{opacity:0;transform:translateY(14px) scale(.9)}to{opacity:1;transform:none}}
.ns-rw .ri{font-size:19px;filter:drop-shadow(0 0 8px currentColor)}
.ns-rw b{font-size:17px;font-weight:900;font-variant-numeric:tabular-nums}
.ns-rw small{font-size:9px;letter-spacing:.18em;color:var(--txt-dim);font-weight:800}
.ns-rw.coin{border-color:rgba(251,191,36,.45);color:#fde68a}
.ns-rw.xp{border-color:color-mix(in srgb,var(--a2) 45%,transparent)}
.ns-rw.lvl{background:linear-gradient(96deg,var(--a2),var(--a1));color:#07070f;font-weight:900;
  letter-spacing:.1em;font-size:12px;border:0;box-shadow:0 0 26px -8px color-mix(in srgb,var(--a2) 95%,transparent)}

/* top bar coin pill */
#coinTop{display:flex;align-items:center;gap:6px;padding:0 12px;height:38px;border-radius:13px;
  border:1px solid rgba(251,191,36,.4);background:rgba(255,255,255,.05);backdrop-filter:blur(14px);
  font-size:12px;font-weight:900;color:#fde68a;font-variant-numeric:tabular-nums;cursor:pointer;
  transition:transform .22s var(--ease),box-shadow .22s,background .22s}
#coinTop:hover{transform:translateY(-2px);background:rgba(255,255,255,.09);
  box-shadow:0 8px 24px -10px rgba(251,191,36,.8)}
@media (max-width:520px){#coinTop{padding:0 9px;font-size:11px}}

/* profile */
.ns-prof{display:flex;gap:16px;align-items:center;flex-wrap:wrap;justify-content:center;margin-bottom:16px}
.ns-ring{width:104px;height:104px;border-radius:50%;display:grid;place-items:center;position:relative;
  background:conic-gradient(var(--a2) calc(var(--p) * 1%), rgba(255,255,255,.08) 0);
  box-shadow:0 0 34px -12px color-mix(in srgb,var(--a2) 95%,transparent)}
.ns-ring::after{content:"";position:absolute;inset:7px;border-radius:50%;background:rgba(10,10,22,.92)}
.ns-ring .rv{position:relative;z-index:1;text-align:center;line-height:1}
.ns-ring .rv b{font-size:30px;font-weight:900;display:block;
  background:linear-gradient(180deg,#fff,var(--a2));-webkit-background-clip:text;background-clip:text;color:transparent}
.ns-ring .rv small{font-size:8.5px;letter-spacing:.22em;color:var(--txt-dim);font-weight:800}
.ns-prof .who{text-align:left;min-width:180px}
.ns-prof .ic{font-size:34px;filter:drop-shadow(0 0 12px var(--a2))}
.ns-prof .tt{font-size:17px;font-weight:900;letter-spacing:.05em}
.ns-prof .st{font-size:10.5px;color:var(--txt-dim);letter-spacing:.1em;font-weight:700;margin-top:2px}
.ns-xprow{display:flex;align-items:center;gap:9px;margin-top:9px;font-size:10px;font-weight:800;color:var(--txt-dim)}
.ns-xprow .ns-bar{flex:1;min-width:120px}
.ns-eq{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px;margin:14px 0}
.ns-eq .e{border-radius:13px;border:1px solid var(--stroke);background:rgba(255,255,255,.04);padding:9px}
.ns-eq .e .k{font-size:8.5px;letter-spacing:.2em;color:var(--txt-dim);font-weight:800}
.ns-eq .e .v{font-size:12px;font-weight:900;margin-top:3px}
.ns-stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(122px,1fr));gap:8px}
.ns-stats .s{border-radius:13px;border:1px solid var(--stroke);background:rgba(255,255,255,.04);padding:10px}
.ns-stats .s .k{font-size:8.5px;letter-spacing:.18em;color:var(--txt-dim);font-weight:800}
.ns-stats .s .v{font-size:16px;font-weight:900;font-variant-numeric:tabular-nums;margin-top:3px}
.ns-showcase{height:96px;border-radius:14px;border:1px solid var(--stroke);overflow:hidden;
  background:radial-gradient(circle at 50% 60%,rgba(255,255,255,.07),rgba(0,0,0,.25))}
.ns-showcase canvas{width:100%;height:100%;display:block}
`);

/* --------------------------- game over rewards --------------------------- */
function ensureRewardStrip(){
  let strip = document.getElementById('nsRewards');
  if(strip) return strip;
  const best = document.getElementById('oBest');
  if(!best) return null;
  strip = document.createElement('div');
  strip.className = 'ns-rewards';
  strip.id = 'nsRewards';
  best.parentNode.insertBefore(strip, best.nextSibling);
  return strip;
}
NS.on('rewards', r => {
  const strip = ensureRewardStrip();
  if(!strip) return;
  strip.innerHTML =
    '<div class="ns-rw coin"><span class="ri">🪙</span><b>+'+U.num(r.coins)+'</b><small>COINS</small></div>'+
    '<div class="ns-rw xp"><span class="ri">⭐</span><b>+'+U.num(r.xp)+'</b><small>XP</small></div>'+
    (r.levelUp ? '<div class="ns-rw lvl">LEVEL '+r.plevel+'!</div>' : '');
  refreshCoinTop();
});

NS.on('gameover', r => {
  if(!r.best) return;
  const fx = VICTORY_FX[P.equipped('victory')];
  if(fx) setTimeout(fx, 260);
});

NS.on('plevel', d => {
  NS.toast('⭐','PLAYER LEVEL '+d.level, 'New rewards unlocked in the shop');
  if(C.Audio_) C.Audio_.level();
  P.addCoins(d.level * 50, 'levelup');
});

/* ------------------------------- top bar --------------------------------- */
function refreshCoinTop(){
  const el = document.getElementById('coinTop');
  if(!el) return;
  el.innerHTML = '<span>🪙</span>' + U.num(P.data.coins);
  el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}
NS.on('coins', refreshCoinTop);
NS.on('purchase', ()=>{ refreshCoinTop(); applyBorder(); });
NS.on('equipped', ()=>{ applyBorder(); });

/* ============================ profile screen ============================== */
function profileHTML(){
  const d = P.data, s = d.stats, li = P.levelInfo();
  const title = NS.shop.title('title', d.equipped.title);
  const skin  = NS.skins.get(d.equipped.skin);
  const achN  = NS.ach ? NS.ach.count() : 0;
  const achT  = NS.ach ? NS.ach.total : 0;
  const row = (k,v) => '<div class="s"><div class="k">'+k+'</div><div class="v">'+v+'</div></div>';

  return '<div class="ns-prof">'+
      '<div class="ns-ring" style="--p:'+(li.pct*100).toFixed(1)+'">'+
        '<div class="rv"><b>'+li.level+'</b><small>LEVEL</small></div>'+
      '</div>'+
      '<div class="who">'+
        '<div class="ic">'+d.equipped.icon+'</div>'+
        '<div class="tt">'+U.esc(title)+'</div>'+
        '<div class="st">'+U.num(s.games)+' GAMES · '+U.dur(s.playTime)+' PLAYED</div>'+
        '<div class="ns-xprow">'+
          '<div class="ns-bar"><i style="width:'+(li.pct*100).toFixed(1)+'%"></i></div>'+
          '<span>'+U.num(li.xp)+' / '+U.num(li.need)+' XP</span>'+
        '</div>'+
        '<div class="ns-xprow"><span class="ns-pill coin"><span class="i">🪙</span>'+U.num(d.coins)+'</span>'+
          '<span class="ns-pill xp">🏆 '+achN+'/'+achT+'</span></div>'+
      '</div>'+
    '</div>'+
    '<div class="ns-showcase"><canvas class="skinprev" data-skin="'+skin.id+'" width="620" height="190"></canvas></div>'+
    '<div class="ns-eq">'+
      '<div class="e"><div class="k">SNAKE</div><div class="v">'+U.esc(skin.name)+'</div></div>'+
      '<div class="e"><div class="k">TRAIL</div><div class="v">'+U.esc(NS.shop.title('trail', d.equipped.trail))+'</div></div>'+
      '<div class="e"><div class="k">BURST</div><div class="v">'+U.esc(NS.shop.title('particle', d.equipped.particle))+'</div></div>'+
      '<div class="e"><div class="k">BORDER</div><div class="v">'+U.esc(NS.shop.title('border', d.equipped.border))+'</div></div>'+
      '<div class="e"><div class="k">VICTORY</div><div class="v">'+U.esc(NS.shop.title('victory', d.equipped.victory))+'</div></div>'+
    '</div>'+
    '<div class="ns-stats">'+
      row('BEST SCORE', U.num(s.best))+
      row('LIFETIME', U.num(s.score))+
      row('FOOD EATEN', U.num(s.eats))+
      row('GOLDEN', U.num(s.golden))+
      row('DIAMONDS', U.num(s.gems))+
      row('POWER-UPS', U.num(s.powers))+
      row('BEST COMBO', '×'+s.bestCombo)+
      row('LONGEST', U.num(s.bestLen))+
      row('MAX LEVEL', U.num(s.maxLevel))+
      row('DISTANCE', U.num(s.distance)+' cells')+
      row('PLAY TIME', U.dur(s.playTime))+
      row('COINS EARNED', U.num(s.coinsEarned))+
    '</div>';
}
function renderProfile(){
  const body = document.getElementById('scProfileBody');
  if(!body) return;
  body.innerHTML = profileHTML();
  const sub = document.getElementById('scProfileSub');
  if(sub) sub.textContent = 'PLAYER LEVEL ' + P.data.plvl + ' · ' + U.num(P.data.coins) + ' COINS';
  NS.shop.startPreviews();
}

/* ================================= boot ================================== */
NS.ready(()=>{
  /* profile screen */
  const prof = NS.screen('scProfile', {title:'PROFILE', sub:'', wide:true});
  prof.querySelector('[data-close]').addEventListener('click', NS.shop.stopPreviews);

  /* start-screen buttons */
  const bShop = document.getElementById('bShop');
  if(bShop) bShop.addEventListener('click', ()=>{ NS.shop.open(); if(C.Audio_) C.Audio_.click(); });
  const bProf = document.getElementById('bProfile');
  if(bProf) bProf.addEventListener('click', ()=>{
    NS.show('scProfile'); renderProfile(); if(C.Audio_) C.Audio_.click();
  });

  /* coin pill in the top bar, opens the shop */
  const bar = document.querySelector('.topbar .sp');
  if(bar && !document.getElementById('coinTop')){
    const pill = document.createElement('button');
    pill.id = 'coinTop';
    pill.title = 'Coins — tap to open the shop';
    bar.parentNode.insertBefore(pill, bar.nextSibling);
    pill.addEventListener('click', ()=>{ NS.shop.open(); if(C.Audio_) C.Audio_.click(); });
    refreshCoinTop();
  }

  applyBorder();

  /* keep the shop reachable from the game-over screen too */
  const overRow = document.querySelector('#scOver .btnrow');
  if(overRow && !document.getElementById('bShopOver')){
    const b = document.createElement('button');
    b.className = 'btn ghost sm'; b.id = 'bShopOver'; b.textContent = '🛒 Shop';
    overRow.appendChild(b);
    b.addEventListener('click', ()=>{ NS.shop.open(); if(C.Audio_) C.Audio_.click(); });
  }

  NS.on('profilereset', ()=>{ applyBorder(); refreshCoinTop(); renderProfile(); });
});
})();
