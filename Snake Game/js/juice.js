/* ============================================================================
   JUICE LAYER (§8) — hitstop, trauma shake and squash & stretch.
   The core already had screen shake and flash; this adds the timings the spec
   calls for and exposes them as independent, disableable settings.
   ========================================================================== */
(function(){
"use strict";
const NS = window.NS, C = window.NSCore || {}, U = NS.util;

const HITSTOP = { eat:0.060, hit:0.120, death:0.400, boss:0.120 };

let freezeLeft = 0;     // seconds of simulation freeze remaining
let stretch    = 0;     // current head stretch, 0..0.15
let stretchVel = 0;

const api = NS.juice = {
  HITSTOP,
  /* read by the core every update: true = freeze the sim, keep fx running */
  frozen: false,
  enabled: true,

  hitstop(kind){
    if(!api.enabled || !NS.settings.get('hitstop')) return;
    const d = typeof kind === 'number' ? kind : (HITSTOP[kind] || HITSTOP.eat);
    if(d > freezeLeft) freezeLeft = d;
    api.frozen = freezeLeft > 0;
  },

  /* trauma is added, shake renders as trauma² and decays at 1.8/sec in core */
  trauma(v){
    if(C.shake) C.shake(v * NS.settings.get('shakeAmount'));
  },

  /* head stretches along its velocity axis while moving, snaps back on eating */
  pokeStretch(v){ stretchVel += v; },

  update(dt){
    /* freezeLeft is counted down by the independent pump below, so it keeps
       draining while the simulation itself is frozen */
    /* spring back to the resting stretch over ~90ms */
    const target = (C.G && C.G.state === 'play' && !C.G.demo) ? 0.15 : 0;
    stretchVel += (target - stretch) * dt * 26;
    stretchVel *= (1 - Math.min(1, dt*16));
    stretch += stretchVel * dt;
    stretch = U.clamp(stretch, -0.28, 0.34);
  },

  get stretch(){ return NS.settings.get('squash') ? stretch : 0; }
};

/* ------------------------- settings (all disableable) --------------------- */
const SET_KEY = 'neon-serpent-juice-v1';
const SDEF = { hitstop:true, squash:true, shakeAmount:1, mode:'rogue', reducedMotion:false };
const sdata = NS.store.load(SET_KEY, SDEF);
if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  sdata.reducedMotion = true;
}
NS.settings = {
  data: sdata,
  get(k){
    if(sdata.reducedMotion && (k === 'hitstop' || k === 'squash')) return false;
    if(sdata.reducedMotion && k === 'shakeAmount') return 0;
    return sdata[k];
  },
  set(k, v){ sdata[k] = v; NS.store.save(SET_KEY, sdata); NS.emit('settings', {key:k, value:v}); },
  get mode(){ return sdata.mode; }
};

/* --------------------------- feed the core hooks -------------------------- */
NS.on('tick', dt => { if(dt) api.update(dt); });

NS.on('eat', e => {
  api.hitstop('eat');
  api.pokeStretch(-1.6);                       // snap: squash on the bite
  api.trauma(e && e.kind === 'golden' ? .55 : .18);
});
NS.on('gameover', () => { api.hitstop('death'); });
NS.on('bosshit',  () => { api.hitstop('boss'); });

/* frozen must also tick down while the sim is skipped — the core passes dt 0 */
(function pump(){
  let last = -1;
  function step(ts){
    /* clamped both ways: negative can't happen in a browser, but a stubbed or
       virtual clock must never be able to extend a freeze forever */
    const dt = last < 0 ? 0 : Math.max(0, Math.min(.05, (ts - last)/1000));
    last = ts;
    if(freezeLeft > 0){
      freezeLeft -= dt;
      api.frozen = freezeLeft > 0;
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
})();

/* the core asks for these through mod() */
NS.modProviders = NS.modProviders || [];
NS.modProviders.push((key, base) => key === 'stretch' ? base + api.stretch : base);

/* ---------------- settings rows injected into the existing panel ---------- */
function seg(id, label, note, opts, get, set){
  return '<div class="srow"><div class="lab">'+label+'<small>'+note+'</small></div>'+
    '<div class="seg" id="'+id+'">'+
      opts.map(o=>'<button data-v="'+o.v+'"'+(String(get())===String(o.v)?' class="on"':'')+'>'+
                  o.t+'</button>').join('')+
    '</div></div>';
}
NS.ready(()=>{
  const panel = document.querySelector('#scSet .panel');
  const row   = document.querySelector('#scSet .btnrow');
  if(!panel || !row || document.getElementById('segMode')) return;

  const box = document.createElement('div');
  box.innerHTML =
    seg('segMode','Game Mode','Roguelite drafts mutations',
        [{v:'rogue',t:'Roguelite'},{v:'classic',t:'Classic'}], ()=>sdata.mode) +
    seg('segShake','Screen Shake','Impact intensity',
        [{v:'0',t:'Off'},{v:'0.5',t:'Low'},{v:'1',t:'Normal'},{v:'1.5',t:'High'}], ()=>sdata.shakeAmount) +
    '<div class="srow"><div class="lab">Hit Stop<small>Freeze frames on impact</small></div>'+
      '<div class="sw'+(sdata.hitstop?' on':'')+'" id="swHitstop"></div></div>'+
    '<div class="srow"><div class="lab">Squash &amp; Stretch<small>Head deforms with speed</small></div>'+
      '<div class="sw'+(sdata.squash?' on':'')+'" id="swSquash"></div></div>'+
    '<div class="srow"><div class="lab">Reduced Motion<small>Disables shake, stretch, freeze</small></div>'+
      '<div class="sw'+(sdata.reducedMotion?' on':'')+'" id="swReduced"></div></div>';
  while(box.firstChild) panel.insertBefore(box.firstChild, row);

  const click = C.Audio_ ? () => C.Audio_.click() : ()=>{};
  function wireSeg(id, key, cast){
    document.querySelectorAll('#'+id+' button').forEach(b=>{
      b.addEventListener('click', ()=>{
        NS.settings.set(key, cast ? cast(b.dataset.v) : b.dataset.v);
        document.querySelectorAll('#'+id+' button').forEach(x=>x.classList.toggle('on', x===b));
        click();
      });
    });
  }
  function wireSw(id, key){
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('click', ()=>{
      NS.settings.set(key, !sdata[key]);
      el.classList.toggle('on', !!sdata[key]);
      click();
    });
  }
  wireSeg('segMode','mode');
  wireSeg('segShake','shakeAmount', Number);
  wireSw('swHitstop','hitstop');
  wireSw('swSquash','squash');
  wireSw('swReduced','reducedMotion');
});
})();
