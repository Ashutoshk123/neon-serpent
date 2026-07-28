/* ============================================================================
   NEON SERPENT v2.0 — expansion namespace
   Event bus, scoped storage, style injection and shared UI helpers.
   Loaded after the core game; never modifies core behaviour.
   ========================================================================== */
(function(){
"use strict";
const NS = window.NS = window.NS || {};
const C  = window.NSCore || {};

/* ------------------------------- event bus -------------------------------- */
const handlers = Object.create(null);
NS.on = function(ev, fn){ (handlers[ev] || (handlers[ev] = [])).push(fn); return NS; };
NS.emit = function(ev, data){
  const list = handlers[ev];
  if(!list) return;
  for(let i=0;i<list.length;i++){
    try{ list[i](data); }
    catch(e){ console.warn('[NS] handler error on "'+ev+'":', e); }
  }
};

/* ----------------------------- modifier stack ----------------------------- */
/* The core calls mod(key, base); every registered provider gets a shot at the
   value in registration order. No provider = the stock game, untouched.       */
NS.modProviders = NS.modProviders || [];
NS.mods = function(key, base){
  const list = NS.modProviders;
  let v = base;
  for(let i=0;i<list.length;i++){
    try{ v = list[i](key, v); }catch(e){}
  }
  return v;
};

/* --------------------------------- storage -------------------------------- */
NS.store = {
  load(key, defaults){
    let raw = null;
    try{ raw = localStorage.getItem(key); }catch(e){}
    let obj = {};
    if(raw){ try{ obj = JSON.parse(raw) || {}; }catch(e){ obj = {}; } }
    return Object.assign({}, defaults, obj);
  },
  save(key, obj){
    try{ localStorage.setItem(key, JSON.stringify(obj)); }catch(e){}
  }
};

/* --------------------------------- helpers -------------------------------- */
const U = NS.util = {
  clamp: (v,a,b)=> v<a?a:v>b?b:v,
  lerp:  (a,b,t)=> a+(b-a)*t,
  rand:  (a,b)=> a+Math.random()*(b-a),
  randi: (a,b)=> Math.floor(a+Math.random()*(b-a+1)),
  pick:  a => a[(Math.random()*a.length)|0],
  /* 12345 -> "12,345" */
  num: n => Math.floor(n||0).toLocaleString('en-US'),
  /* 3725 -> "1h 02m" */
  dur(s){
    s = Math.floor(s||0);
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60);
    if(h) return h+'h '+String(m).padStart(2,'0')+'m';
    if(m) return m+'m '+String(s%60).padStart(2,'0')+'s';
    return s+'s';
  },
  hsl: (h,s,l,a) => a===undefined ? `hsl(${h} ${s}% ${l}%)` : `hsla(${h} ${s}% ${l}% / ${a})`,
  /* smooth 0..1..0 ping-pong */
  pong: t => 1 - Math.abs((t%2) - 1),
  esc(str){
    return String(str).replace(/[&<>"']/g, c =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
};

/* ------------------------------ style injection --------------------------- */
NS.css = function(id, text){
  let el = document.getElementById(id);
  if(!el){
    el = document.createElement('style');
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = text;
  return el;
};

/* -------------------------- screen scaffolding ---------------------------- */
/* Builds a screen that matches the core's existing .screen/.panel markup so
   every new UI inherits the game's animations and glassmorphism for free.  */
NS.screen = function(id, opts){
  opts = opts || {};
  let el = document.getElementById(id);
  if(el) return el;
  el = document.createElement('div');
  el.className = 'screen';
  el.id = id;
  el.innerHTML =
    '<div class="panel'+(opts.wide ? ' panel-wide' : '')+'">' +
      (opts.title ? '<div class="h2">'+opts.title+'</div>' : '') +
      (opts.sub   ? '<div class="sub" id="'+id+'Sub">'+opts.sub+'</div>' : '') +
      '<div class="ns-body" id="'+id+'Body"></div>' +
      '<div class="btnrow"><button class="btn" data-close="'+id+'">Close</button></div>' +
    '</div>';
  document.body.appendChild(el);
  el.querySelector('[data-close]').addEventListener('click', ()=>{
    NS.hide(id);
    if(C.Audio_) C.Audio_.click();
  });
  return el;
};
NS.show = function(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.remove('hide');
  el.classList.add('show');
};
NS.hide = function(id){
  const el = document.getElementById(id);
  if(!el || !el.classList.contains('show')) return;
  el.classList.add('hide');
  setTimeout(()=>el.classList.remove('show','hide'), 300);
};

/* --------------------------------- toasts --------------------------------- */
/* Reuses the core toast when available, otherwise renders an equivalent one. */
NS.toast = function(icon, title, desc){
  if(C.toast){ C.toast(icon, title, desc); return; }
  const box = document.getElementById('toasts');
  if(!box) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = '<div class="ti">'+icon+'</div><div><div class="tt">'+title+
                 '</div><div class="td">'+(desc||'')+'</div></div>';
  box.appendChild(el);
  setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(), 420); }, 2100);
};

/* ------------------------- shared expansion styles ------------------------ */
NS.css('ns-base-css', `
.panel.panel-wide{width:min(760px,96vw)}
.ns-body{text-align:left}
.ns-tabs{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:16px;
  padding:4px;border-radius:14px;background:rgba(0,0,0,.3);border:1px solid var(--stroke)}
.ns-tabs button{border:0;background:transparent;color:var(--txt-dim);font:inherit;font-size:11px;
  font-weight:800;letter-spacing:.07em;padding:8px 12px;border-radius:10px;cursor:pointer;
  transition:all .26s var(--ease);white-space:nowrap}
.ns-tabs button.on{color:#07070f;background:linear-gradient(96deg,var(--a2),var(--a1));
  box-shadow:0 0 20px -6px color-mix(in srgb,var(--a2) 90%,transparent)}
.ns-tabs button:not(.on):hover{color:var(--txt);background:rgba(255,255,255,.07)}
.ns-scroll{max-height:min(52vh,460px);overflow-y:auto;padding-right:4px;scrollbar-width:thin}
.ns-scroll::-webkit-scrollbar{width:6px}
.ns-scroll::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--a2) 50%,transparent);border-radius:9px}
.ns-empty{text-align:center;color:var(--txt-dim);font-size:12px;padding:26px 0;letter-spacing:.08em}

/* coin / xp pills reused across shop, profile and the top bar */
.ns-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:99px;
  font-size:12px;font-weight:900;letter-spacing:.05em;border:1px solid var(--stroke);
  background:rgba(255,255,255,.06);backdrop-filter:blur(10px);font-variant-numeric:tabular-nums}
.ns-pill.coin{border-color:rgba(251,191,36,.45);color:#fde68a;
  box-shadow:0 0 18px -8px rgba(251,191,36,.9)}
.ns-pill.xp{border-color:color-mix(in srgb,var(--a2) 50%,transparent)}
.ns-pill .i{font-size:14px;filter:drop-shadow(0 0 6px currentColor)}
.ns-pill.bump{animation:nsPillBump .45s var(--ease)}
@keyframes nsPillBump{0%{transform:scale(1)}38%{transform:scale(1.18)}100%{transform:scale(1)}}

/* progress bars */
.ns-bar{height:6px;border-radius:99px;background:rgba(255,255,255,.09);overflow:hidden;position:relative}
.ns-bar i{display:block;height:100%;border-radius:99px;
  background:linear-gradient(90deg,var(--a2),var(--a1));
  box-shadow:0 0 12px -2px color-mix(in srgb,var(--a2) 90%,transparent);
  transition:width .6s var(--ease)}
.ns-bar.gold i{background:linear-gradient(90deg,#fbbf24,#f97316);box-shadow:0 0 12px -2px rgba(251,191,36,.9)}

/* generic card grid used by shop + achievements */
.ns-grid{display:grid;gap:9px}
.ns-grid.g3{grid-template-columns:repeat(auto-fill,minmax(158px,1fr))}
.ns-grid.g2{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
@media (max-width:520px){
  .ns-grid.g3{grid-template-columns:repeat(auto-fill,minmax(132px,1fr))}
  .ns-grid.g2{grid-template-columns:1fr}
}
`);

NS.ready = function(fn){
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
  else fn();
};

NS.version = '2.0.0';
})();
