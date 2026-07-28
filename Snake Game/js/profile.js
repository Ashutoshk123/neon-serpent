/* ============================================================================
   NEON SERPENT v2.0 — player profile: coins, XP, player level, lifetime stats.
   Stored under its own key so the original save (high score, settings,
   achievements) is never touched or migrated.
   ========================================================================== */
(function(){
"use strict";
const NS = window.NS, C = window.NSCore || {}, U = NS.util;
const KEY = 'neon-serpent-profile-v1';

const DEFAULTS = {
  coins: 0,
  xp: 0,
  plvl: 1,
  created: 0,
  stats: {
    games:0, score:0, best:0, eats:0, golden:0, gems:0, powers:0, levelUps:0,
    bestCombo:1, bestLen:3, playTime:0, distance:0, maxLevel:1, coinsEarned:0,
    combo2:0, combo3:0, combo5:0, orbsS:0, orbsM:0, orbsL:0, fruit:0,
    wallDeaths:0, selfDeaths:0, runs60:0, runs120:0, runs300:0,
    themes:{}, diffs:{}, skins:{}, fruits:{}, powersById:{}
  },
  owned:    { skin:['neon'], trail:['none'], particle:['classic'],
              border:['none'], icon:['🐍'], title:['rookie'], victory:['none'] },
  equipped: { skin:'neon', trail:'none', particle:'classic',
              border:'none', icon:'🐍', title:'rookie', victory:'none' },
  ach: {}
};

/* deep-ish merge so new stat keys appear for existing players */
function load(){
  const raw = NS.store.load(KEY, {});
  const p = Object.assign({}, DEFAULTS, raw);
  p.stats    = Object.assign({}, DEFAULTS.stats, raw.stats || {});
  p.owned    = Object.assign({}, DEFAULTS.owned, raw.owned || {});
  p.equipped = Object.assign({}, DEFAULTS.equipped, raw.equipped || {});
  p.ach      = Object.assign({}, raw.ach || {});
  for(const k in DEFAULTS.owned){
    if(!Array.isArray(p.owned[k])) p.owned[k] = DEFAULTS.owned[k].slice();
    for(const must of DEFAULTS.owned[k]) if(p.owned[k].indexOf(must)<0) p.owned[k].push(must);
  }
  for(const k of ['themes','diffs','skins','fruits','powersById'])
    if(!p.stats[k] || typeof p.stats[k] !== 'object') p.stats[k] = {};
  if(!p.created) p.created = Date.now();
  return p;
}

const P = load();

/* ------------------------------ level curve ------------------------------- */
/* Deliberately gentle early on, steeper later: L2 at 120xp, L10 ≈ 2.4k, L30 ≈ 12k */
function xpFor(level){ return Math.floor(120 * Math.pow(level, 1.32)); }
function levelInfo(){
  const need = xpFor(P.plvl);
  return { level:P.plvl, xp:P.xp, need, pct: U.clamp(P.xp/need, 0, 1) };
}

const api = NS.profile = {
  data: P,
  KEY,
  xpFor,
  levelInfo,

  save(){ NS.store.save(KEY, P); },

  /* --------------------------- currency & xp --------------------------- */
  addCoins(n, reason){
    n = Math.floor(n||0);
    if(n <= 0) return 0;
    P.coins += n;
    P.stats.coinsEarned += n;
    api.save();
    NS.emit('coins', {amount:n, total:P.coins, reason:reason||''});
    return n;
  },
  spend(n){
    n = Math.floor(n||0);
    if(P.coins < n) return false;
    P.coins -= n;
    api.save();
    NS.emit('coins', {amount:-n, total:P.coins, reason:'spend'});
    return true;
  },
  canAfford(n){ return P.coins >= Math.floor(n||0); },

  addXP(n){
    n = Math.floor(n||0);
    if(n <= 0) return {levels:0};
    P.xp += n;
    let levels = 0;
    while(P.xp >= xpFor(P.plvl) && P.plvl < 99){
      P.xp -= xpFor(P.plvl);
      P.plvl++;
      levels++;
    }
    api.save();
    if(levels) NS.emit('plevel', {level:P.plvl, gained:levels});
    NS.emit('xp', {amount:n, level:P.plvl});
    return {levels, level:P.plvl};
  },

  /* --------------------------- inventory ------------------------------- */
  owns(cat, id){
    const list = P.owned[cat];
    return !!list && list.indexOf(id) >= 0;
  },
  grant(cat, id){
    if(!P.owned[cat]) P.owned[cat] = [];
    if(P.owned[cat].indexOf(id) < 0){
      P.owned[cat].push(id);
      api.save();
      NS.emit('unlocked', {cat, id});
      return true;
    }
    return false;
  },
  equip(cat, id){
    if(!api.owns(cat, id)) return false;
    P.equipped[cat] = id;
    api.save();
    NS.emit('equipped', {cat, id});
    return true;
  },
  equipped(cat){ return P.equipped[cat]; },

  /* ----------------------------- statistics ---------------------------- */
  bump(key, by){
    P.stats[key] = (P.stats[key]||0) + (by===undefined ? 1 : by);
  },
  max(key, v){
    if(v > (P.stats[key]||0)) P.stats[key] = v;
  },
  count(bucket, id, by){
    const b = P.stats[bucket];
    if(!b) return;
    b[id] = (b[id]||0) + (by===undefined ? 1 : by);
  },
  distinct(bucket){ return Object.keys(P.stats[bucket]||{}).length; },

  reset(){
    const fresh = Object.assign({}, DEFAULTS);
    fresh.stats = Object.assign({}, DEFAULTS.stats);
    fresh.owned = JSON.parse(JSON.stringify(DEFAULTS.owned));
    fresh.equipped = Object.assign({}, DEFAULTS.equipped);
    fresh.ach = {};
    fresh.created = Date.now();
    for(const k in P) delete P[k];
    Object.assign(P, fresh);
    api.save();
    NS.emit('profilereset');
  }
};

/* ========================================================================== */
/*  Live tracking — driven entirely by the core's emitted events              */
/* ========================================================================== */
let sess = null;

NS.on('start', d => {
  sess = {golden:0, eats:0, t:0};
  api.count('diffs', d && d.diff || 'normal');
  api.count('themes', d && d.theme || 'cyber');
  api.count('skins', api.equipped('skin'));
  api.save();
});

NS.on('tick', dt => {
  const G = C.G;
  if(!G || G.demo || G.state !== 'play') return;
  P.stats.playTime += dt;
  P.stats.distance += (G.cps || 0) * dt;      // in cells
  if(sess) sess.t += dt;
});

NS.on('eat', e => {
  api.bump('eats');
  const f = e.food || {};
  if(f.kind === 'orb'){
    api.bump(f.size === 'L' ? 'orbsL' : f.size === 'M' ? 'orbsM' : 'orbsS');
  } else if(f.kind === 'special'){
    api.bump('fruit');
    api.count('fruits', f.id || 'straw');
    if(f.id === 'gem') api.bump('gems');
  } else if(f.kind === 'golden'){
    api.bump('golden');
    if(sess) sess.golden++;
  }
  if(e.mult >= 5) api.bump('combo5');
  else if(e.mult >= 3) api.bump('combo3');
  else if(e.mult >= 2) api.bump('combo2');
  api.max('bestCombo', e.mult || 1);
});

NS.on('power', p => {
  api.bump('powers');
  api.count('powersById', p && p.id || 'unknown');
});

NS.on('levelup', lv => {
  api.bump('levelUps');
  api.max('maxLevel', lv);
});

NS.on('gameover', r => {
  api.bump('games');
  api.bump('score', r.score);
  api.max('best', r.score);
  api.max('bestCombo', r.combo);
  api.max('bestLen', r.len);
  api.max('maxLevel', r.level);
  if(r.time >= 60)  api.bump('runs60');
  if(r.time >= 120) api.bump('runs120');
  if(r.time >= 300) api.bump('runs300');

  /* rewards — tuned so a decent run buys a mid-tier skin in a few games */
  const coins = Math.floor(r.score/8) + r.golden*30 + Math.max(0, r.level-1)*6 + r.eats;
  const xp    = Math.floor(r.score/3) + r.eats*2 + r.golden*15 + Math.max(0, r.level-1)*10;
  const before = P.plvl;
  api.addCoins(coins, 'run');
  const res = api.addXP(xp);
  api.save();

  NS.emit('rewards', {
    coins, xp, score:r.score,
    levelUp: res.level > before, plevel: res.level
  });
  sess = null;
});

NS.on('profilereset', ()=>{ sess = null; });
})();
