/* ============================================================================
   NEON SERPENT v2.0 — coin shop.
   Skins, trails, eat-burst styles, board borders, profile icons, titles and
   victory effects. Everything is bought with coins earned by playing.
   ========================================================================== */
(function(){
"use strict";
const NS = window.NS, C = window.NSCore || {}, U = NS.util;
const P  = NS.profile;

/* ================================ catalogue =============================== */
const TRAILS = [
  {id:'none',    name:'No Trail',    price:0,    rarity:'common',    col:'#64748b', desc:'Clean and classic.'},
  {id:'sparks',  name:'Spark Trail', price:250,  rarity:'common',    col:'#fcd34d', desc:'Tiny sparks flicker off the tail.'},
  {id:'embers',  name:'Ember Trail', price:450,  rarity:'rare',      col:'#f97316', desc:'Glowing embers drift upward.'},
  {id:'frost',   name:'Frost Trail', price:450,  rarity:'rare',      col:'#a5f3fc', desc:'A wake of settling ice crystals.'},
  {id:'stars',   name:'Star Trail',  price:800,  rarity:'epic',      col:'#e0e7ff', desc:'Leaves a constellation behind you.'},
  {id:'plasma',  name:'Plasma Trail',price:1200, rarity:'epic',      col:'#e879f9', desc:'Unstable plasma bleeds off the body.'},
  {id:'prism',   name:'Prism Trail', price:2000, rarity:'legendary', col:'#22d3ee', desc:'Every colour at once, all the time.'}
];
const PARTICLES = [
  {id:'classic', name:'Classic Burst', price:0,    rarity:'common',    col:'#22d3ee', desc:'The original explosion.'},
  {id:'confetti',name:'Confetti',      price:300,  rarity:'common',    col:'#f472b6', desc:'Celebrate every single bite.'},
  {id:'shards',  name:'Crystal Shards',price:550,  rarity:'rare',      col:'#a5f3fc', desc:'Food shatters into glass.'},
  {id:'nova',    name:'Nova',          price:900,  rarity:'epic',      col:'#fbbf24', desc:'A collapsing ring of light.'},
  {id:'voltage', name:'Voltage',       price:1100, rarity:'epic',      col:'#fde047', desc:'Arcs of electricity scatter out.'},
  {id:'blossom', name:'Blossom',       price:1600, rarity:'legendary', col:'#fb7185', desc:'Petals bloom outward on impact.'}
];
const BORDERS = [
  {id:'none',    name:'Standard',   price:0,    rarity:'common',    col:'#22d3ee', desc:'The default neon frame.'},
  {id:'gold',    name:'Gilded',     price:600,  rarity:'rare',      col:'#fbbf24', desc:'A heavy gold surround.'},
  {id:'plasma',  name:'Plasma Rim', price:900,  rarity:'epic',      col:'#e879f9', desc:'Pulsing magenta containment field.'},
  {id:'circuit', name:'Circuit',    price:900,  rarity:'epic',      col:'#22c55e', desc:'Etched green circuitry.'},
  {id:'frost',   name:'Frostbite',  price:1200, rarity:'epic',      col:'#a5f3fc', desc:'Ice creeping in from the edges.'},
  {id:'magma',   name:'Magma',      price:1800, rarity:'legendary', col:'#f97316', desc:'Molten rock, barely contained.'}
];
const ICONS = [
  {id:'🐍', name:'Serpent',  price:0,    rarity:'common'},
  {id:'⚡', name:'Bolt',     price:150,  rarity:'common'},
  {id:'🔥', name:'Flame',    price:150,  rarity:'common'},
  {id:'❄️', name:'Frost',    price:150,  rarity:'common'},
  {id:'💎', name:'Diamond',  price:400,  rarity:'rare'},
  {id:'👑', name:'Crown',    price:400,  rarity:'rare'},
  {id:'🐉', name:'Dragon',   price:800,  rarity:'epic'},
  {id:'🌌', name:'Galaxy',   price:800,  rarity:'epic'},
  {id:'☠️', name:'Skull',    price:1200, rarity:'legendary'},
  {id:'🏆', name:'Trophy',   price:2000, rarity:'legendary'}
];
const TITLES = [
  {id:'rookie',   name:'Rookie',            price:0,    rarity:'common'},
  {id:'snake',    name:'Snake Handler',     price:200,  rarity:'common'},
  {id:'hunter',   name:'Orb Hunter',        price:350,  rarity:'common'},
  {id:'combo',    name:'Combo Artist',      price:600,  rarity:'rare'},
  {id:'golden',   name:'Golden Touch',      price:900,  rarity:'rare'},
  {id:'survivor', name:'Survivor',          price:1200, rarity:'epic'},
  {id:'legend',   name:'Living Legend',     price:1800, rarity:'epic'},
  {id:'master',   name:'Serpent Master',    price:2600, rarity:'legendary'},
  {id:'void',     name:'Void Walker',       price:3500, rarity:'legendary'},
  {id:'eternal',  name:'The Eternal',       price:5000, rarity:'mythic'}
];
const VICTORY = [
  {id:'none',      name:'None',        price:0,    rarity:'common',    col:'#64748b', desc:'No celebration.'},
  {id:'fireworks', name:'Fireworks',   price:700,  rarity:'rare',      col:'#f472b6', desc:'Rockets on every new record.'},
  {id:'confetti',  name:'Confetti Rain',price:700, rarity:'rare',      col:'#fbbf24', desc:'A downpour of confetti.'},
  {id:'shockwave', name:'Shockwave',   price:1100, rarity:'epic',      col:'#22d3ee', desc:'A ring that blows the board apart.'},
  {id:'starfall',  name:'Starfall',    price:1600, rarity:'legendary', col:'#e0e7ff', desc:'The sky falls in your honour.'}
];

const CATS = [
  {id:'skin',     name:'Snakes',    ic:'🐍'},
  {id:'trail',    name:'Trails',    ic:'☄️'},
  {id:'particle', name:'Bursts',    ic:'✨'},
  {id:'border',   name:'Borders',   ic:'🖼️'},
  {id:'victory',  name:'Victory',   ic:'🎆'},
  {id:'icon',     name:'Icons',     ic:'😀'},
  {id:'title',    name:'Titles',    ic:'📛'}
];

function skinItems(){
  return NS.skins.list.map(s => ({
    id:s.id, name:s.name, price:s.price, rarity:s.rarity,
    desc:s.desc, unlock:s.unlock, skin:s
  }));
}
const CATALOG = {
  trail:TRAILS, particle:PARTICLES, border:BORDERS,
  icon:ICONS.map(i=>({id:i.id,name:i.name,price:i.price,rarity:i.rarity,desc:'Profile icon',glyph:i.id})),
  title:TITLES.map(t=>({id:t.id,name:t.name,price:t.price,rarity:t.rarity,desc:'Shown on your profile'})),
  victory:VICTORY
};
function items(cat){ return cat === 'skin' ? skinItems() : (CATALOG[cat] || []); }

/* =============================== shop logic =============================== */
const api = NS.shop = {
  CATS, items,
  find(cat, id){ return items(cat).filter(x => x.id === id)[0] || null; },
  title(cat, id){
    const it = api.find(cat, id);
    return it ? it.name : id;
  },
  /* gate text, e.g. "Player level 12" */
  gate(it){
    if(it.unlock && NS.skins.requirement) return NS.skins.requirement(it.skin || it);
    return {met:true, text:''};
  },
  buy(cat, id){
    const it = api.find(cat, id);
    if(!it || P.owns(cat, id)) return false;
    const g = api.gate(it);
    if(!g.met){
      NS.toast('🔒','LOCKED', g.text);
      if(C.Audio_) C.Audio_.hurt();
      return false;
    }
    if(!P.canAfford(it.price)){
      NS.toast('🪙','NOT ENOUGH COINS', 'Need ' + U.num(it.price - P.data.coins) + ' more');
      if(C.Audio_) C.Audio_.hurt();
      if(C.vib) C.vib(30);
      return false;
    }
    P.spend(it.price);
    P.grant(cat, id);
    P.equip(cat, id);
    NS.toast(it.glyph || '🛒', 'UNLOCKED', it.name);
    if(C.Audio_){ C.Audio_.golden(); }
    if(C.vib) C.vib([14,30,14]);
    NS.emit('purchase', {cat, id, price:it.price});
    render();
    return true;
  },
  equip(cat, id){
    if(!P.owns(cat, id)) return false;
    P.equip(cat, id);
    if(C.Audio_) C.Audio_.power();
    render();
    return true;
  },
  open(){
    NS.show('scShop');
    render();
    startPreviews();
  },
  close(){ NS.hide('scShop'); stopPreviews(); }
};

/* ================================== UI =================================== */
NS.css('ns-shop-css', `
.ns-item{border-radius:16px;border:1px solid var(--stroke);background:rgba(255,255,255,.04);
  padding:10px;display:flex;flex-direction:column;gap:7px;text-align:center;position:relative;
  overflow:hidden;transition:transform .28s var(--ease),border-color .28s,box-shadow .28s,background .28s}
.ns-item:hover{transform:translateY(-3px);background:rgba(255,255,255,.07)}
.ns-item.owned{border-color:color-mix(in srgb,var(--a2) 45%,transparent)}
.ns-item.on{border-color:var(--a2);box-shadow:0 0 30px -12px color-mix(in srgb,var(--a2) 95%,transparent),
  0 0 0 1px color-mix(in srgb,var(--a2) 45%,transparent) inset}
.ns-item.locked{opacity:.72}
.ns-item .prev{height:72px;border-radius:12px;background:radial-gradient(circle at 50% 60%,rgba(255,255,255,.07),rgba(0,0,0,.25));
  display:grid;place-items:center;overflow:hidden;position:relative}
.ns-item .prev canvas{width:100%;height:100%;display:block}
.ns-item .prev .glyph{font-size:34px;filter:drop-shadow(0 0 10px currentColor)}
.ns-item .prev .swatch{width:56px;height:56px;border-radius:50%}
.ns-item .nm{font-size:12px;font-weight:900;letter-spacing:.04em;line-height:1.25}
.ns-item .rar{font-size:8.5px;font-weight:900;letter-spacing:.22em}
.ns-item .ds{font-size:10px;color:var(--txt-dim);line-height:1.5;min-height:30px}
.ns-item .act{margin-top:auto}
.ns-item .act .btn{width:100%;padding:9px 8px;font-size:11px;border-radius:11px;letter-spacing:.06em}
.ns-item .tag{position:absolute;top:8px;right:8px;font-size:8.5px;font-weight:900;letter-spacing:.14em;
  padding:3px 7px;border-radius:99px;background:rgba(0,0,0,.45);border:1px solid var(--stroke)}
.ns-item.on .tag{background:linear-gradient(96deg,var(--a2),var(--a1));color:#07070f;border-color:transparent}
.ns-shophead{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px;flex-wrap:wrap}
`);

let curCat = 'skin';
let rafId = 0, previews = [];

function priceLabel(it){
  const owned = P.owns(it.cat || curCat, it.id);
  return owned ? '' : U.num(it.price) + ' 🪙';
}

function itemCard(cat, it){
  const owned = P.owns(cat, it.id);
  const on    = P.equipped(cat) === it.id;
  const gate  = api.gate(it);
  const rar   = (NS.skins.RARITY[it.rarity] || {label:'COMMON', col:'#94a3b8'});
  let prev;
  if(cat === 'skin'){
    prev = '<canvas class="skinprev" data-skin="'+it.id+'" width="260" height="150"></canvas>';
  } else if(cat === 'icon'){
    prev = '<div class="glyph" style="color:'+rar.col+'">'+it.glyph+'</div>';
  } else if(cat === 'title'){
    prev = '<div class="nm" style="font-size:15px;color:'+rar.col+'">“'+U.esc(it.name)+'”</div>';
  } else {
    prev = '<div class="swatch" style="background:radial-gradient(circle at 35% 30%,#fff,'+
           (it.col||'#22d3ee')+' 55%,transparent 78%);box-shadow:0 0 26px -4px '+(it.col||'#22d3ee')+'"></div>';
  }
  let action;
  if(on)             action = '<button class="btn sm" disabled style="opacity:.7">Equipped</button>';
  else if(owned)     action = '<button class="btn ghost sm" data-act="equip">Equip</button>';
  else if(!gate.met) action = '<button class="btn ghost sm" disabled>🔒 '+U.esc(gate.text)+'</button>';
  else               action = '<button class="btn sm" data-act="buy">'+U.num(it.price)+' 🪙</button>';

  return '<div class="ns-item'+(owned?' owned':'')+(on?' on':'')+(!gate.met&&!owned?' locked':'')+
         '" data-id="'+U.esc(it.id)+'">'+
    (on ? '<div class="tag">ACTIVE</div>' : (owned ? '<div class="tag">OWNED</div>' : '')) +
    '<div class="prev">'+prev+'</div>'+
    '<div class="nm">'+U.esc(it.name)+'</div>'+
    '<div class="rar" style="color:'+rar.col+'">'+rar.label+'</div>'+
    '<div class="ds">'+U.esc(it.desc || '')+'</div>'+
    '<div class="act">'+action+'</div>'+
  '</div>';
}

function render(){
  const body = document.getElementById('scShopBody');
  if(!body) return;
  const list = items(curCat);
  const ownedN = list.filter(x => P.owns(curCat, x.id)).length;

  body.innerHTML =
    '<div class="ns-shophead">'+
      '<span class="ns-pill coin" id="shopCoins"><span class="i">🪙</span>'+U.num(P.data.coins)+'</span>'+
      '<span class="ns-pill xp">'+ownedN+' / '+list.length+' owned</span>'+
    '</div>'+
    '<div class="ns-tabs">'+
      CATS.map(c=>'<button data-c="'+c.id+'"'+(curCat===c.id?' class="on"':'')+'>'+
                  c.ic+' '+c.name.toUpperCase()+'</button>').join('')+
    '</div>'+
    '<div class="ns-scroll"><div class="ns-grid g3">'+
      list.map(it => itemCard(curCat, it)).join('')+
    '</div></div>';

  body.querySelectorAll('.ns-tabs button').forEach(b=>{
    b.addEventListener('click', ()=>{
      curCat = b.dataset.c;
      if(C.Audio_) C.Audio_.click();
      render(); startPreviews();
    });
  });
  body.querySelectorAll('.ns-item').forEach(card=>{
    const id = card.dataset.id;
    const btn = card.querySelector('[data-act]');
    if(!btn) return;
    btn.addEventListener('click', ()=>{
      if(btn.dataset.act === 'buy') api.buy(curCat, id);
      else api.equip(curCat, id);
      startPreviews();
    });
  });

  const sub = document.getElementById('scShopSub');
  if(sub) sub.textContent = 'EARN COINS BY PLAYING · ' + U.num(P.data.coins) + ' AVAILABLE';
}
api.render = render;

/* ------------------------- animated skin previews ------------------------- */
function startPreviews(){
  stopPreviews();
  const nodes = document.querySelectorAll('#scShopBody canvas.skinprev, #scProfileBody canvas.skinprev');
  previews = [];
  nodes.forEach(cv=>{
    const skin = NS.skins.get(cv.dataset.skin);
    previews.push({ctx:cv.getContext('2d'), skin, w:cv.width, h:cv.height});
  });
  if(!previews.length) return;
  let last = 0;
  const loop = ts => {
    rafId = requestAnimationFrame(loop);
    if(ts - last < 33) return;                    // 30fps is plenty for previews
    last = ts;
    const t = ts/1000;
    for(const p of previews){
      p.ctx.clearRect(0,0,p.w,p.h);
      NS.skins.drawPreview(p.ctx, p.skin, p.w, p.h, t);
    }
  };
  rafId = requestAnimationFrame(loop);
}
function stopPreviews(){
  if(rafId) cancelAnimationFrame(rafId);
  rafId = 0; previews = [];
}
api.startPreviews = startPreviews;
api.stopPreviews  = stopPreviews;

/* -------------------------------- screen --------------------------------- */
NS.ready(()=>{
  const el = NS.screen('scShop', {title:'SHOP', sub:'EARN COINS BY PLAYING', wide:true});
  el.querySelector('[data-close]').addEventListener('click', stopPreviews);
  render();
});
})();
