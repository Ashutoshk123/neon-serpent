/* ============================================================================
   SEEDED RNG (§12) — mulberry32.
   Every roll the mutation system makes goes through a named stream seeded from
   the run seed, so the same seed always produces the same draft sequence on any
   machine. Streams are independent: drawing extra cards from 'draft' can never
   shift what 'events' rolls next.
   ========================================================================== */
(function(){
"use strict";
const NS = window.NS;

function mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* deterministic 32-bit hash of a string — used for shareable / daily seeds */
function hashSeed(str){
  let h = 2166136261 >>> 0;
  str = String(str);
  for(let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function makeStream(seed){
  const next = mulberry32(seed >>> 0);
  let calls = 0;
  const s = {
    seed: seed >>> 0,
    get calls(){ return calls; },
    float(){ calls++; return next(); },
    range(a, b){ return a + s.float()*(b-a); },
    int(a, b){ return Math.floor(a + s.float()*(b-a+1)); },
    pick(arr){ return arr[Math.floor(s.float()*arr.length)]; },
    chance(p){ return s.float() < p; },
    /* Fisher-Yates on a copy — never mutates the caller's array */
    shuffle(arr){
      const a = arr.slice();
      for(let i=a.length-1;i>0;i--){
        const j = Math.floor(s.float()*(i+1));
        const t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    },
    /* weighted pick: items need a numeric .weight (default 1) */
    weighted(arr){
      let total = 0;
      for(const it of arr) total += (it.weight === undefined ? 1 : it.weight);
      let r = s.float()*total;
      for(const it of arr){
        r -= (it.weight === undefined ? 1 : it.weight);
        if(r <= 0) return it;
      }
      return arr[arr.length-1];
    }
  };
  return s;
}

const streams = Object.create(null);
let runSeed = 0;
let seedLabel = '';

const api = NS.rng = {
  hashSeed,
  mulberry32,

  /* start a run. seed may be a number, a string, or omitted for a random one */
  newRun(seed){
    if(seed === undefined || seed === null || seed === ''){
      runSeed = (Date.now() ^ (Math.random()*0xFFFFFFFF)) >>> 0;
      seedLabel = api.toLabel(runSeed);
    } else if(typeof seed === 'number'){
      runSeed = seed >>> 0;
      seedLabel = api.toLabel(runSeed);
    } else {
      seedLabel = String(seed).toUpperCase();
      runSeed = hashSeed(seedLabel);
    }
    for(const k in streams) delete streams[k];
    NS.emit('seed', {seed:runSeed, label:seedLabel});
    return runSeed;
  },

  /* today's daily-challenge seed — identical worldwide for a given UTC date */
  dailySeed(d){
    d = d || new Date();
    const key = d.getUTCFullYear() + '-' + (d.getUTCMonth()+1) + '-' + d.getUTCDate();
    return 'DAILY-' + key;
  },

  /* named independent stream */
  stream(name){
    if(!streams[name]) streams[name] = makeStream((runSeed ^ hashSeed(name)) >>> 0);
    return streams[name];
  },

  get seed(){ return runSeed; },
  get label(){ return seedLabel; },

  /* short human-typable label, e.g. "K7F-2QX" */
  toLabel(n){
    const A = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let v = n >>> 0, out = '';
    for(let i=0;i<6;i++){ out = A[v % A.length] + out; v = Math.floor(v / A.length); }
    return out.slice(0,3) + '-' + out.slice(3);
  }
};

/* a fresh seed per run unless a specific one was requested */
NS.on('start', () => { if(!api.pending) api.newRun(); else { api.newRun(api.pending); api.pending = null; } });
api.newRun();
})();
