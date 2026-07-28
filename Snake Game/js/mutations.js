/* ============================================================================
   MUTATIONS (§2) — the build system.
   42 mutations across four families, 12 named synergies, 6 Devil's Bargains.
   Everything routes through the core's mod() pull-hooks and the event bus, so
   the base game is unchanged when no mutation is held (Classic mode).
   ========================================================================== */
(function(){
"use strict";
const NS = window.NS, C = window.NSCore || {}, U = NS.util;

/* ---------------------------------------------------------------- helpers */
const G = () => C.G;
function score(n, x, y, col){
  const g = G(); if(!g) return;
  g.score += Math.round(n);
  if(x !== undefined && C.float) C.float(x, y, '+' + Math.round(n), col || '#a3e635', 1.05);
}
function len(){ const g = G(); return g ? Math.round(g.snake.target / g.cell) : 0; }
function foodsNear(x, y, cells){
  const g = G(); if(!g) return [];
  const r = g.cell*cells, out = [];
  for(const f of g.foods) if(Math.hypot(f.x-x, f.y-y) < r) out.push(f);
  return out;
}
function eatFoods(list, mulScore){
  const g = G(); if(!g) return 0;
  let total = 0;
  for(const f of list){
    const i = g.foods.indexOf(f);
    if(i < 0) continue;
    g.foods.splice(i, 1);
    total += Math.round(f.pts * (mulScore || .5));
    if(C.burst) C.burst(f.x, f.y, 10, f.col || '#22d3ee', .8);
    if(C.spawnFood) C.spawnFood();
  }
  if(total) score(total);
  return total;
}
function shockwave(x, y, cells, col){
  const g = G(); if(!g) return;
  if(C.burst) C.burst(x, y, 34, col || '#fde047', 1.5, true);
  if(NS.juice) NS.juice.trauma(.7);
  if(C.flash) C.flash(.3);
  if(C.Audio_) C.Audio_.big();
  eatFoods(foodsNear(x, y, cells), .75);
}

/* ============================== the catalogue ============================= */
/* m(id, family, icon, name, desc, rarity, mods, on, opts) */
function m(id, family, ic, name, desc, rarity, mods, on, opts){
  return Object.assign({id, family, ic, name, desc, rarity,
    mods: mods || {}, on: on || {}, max: 3, curse: false, weight: 1}, opts || {});
}

const MUTATIONS = [
/* ------------------------------- BODY (11) ------------------------------- */
m('dense','body','🧬','Dense Coils','Food adds 30% less length, but scores 15% more.','common',
  {grow:.70, score:1.15}),
m('elastic','body','🎈','Elastic Body','Grow 35% more per food and hold combos 0.6s longer.','common',
  {grow:1.35, comboAdd:.6}),
m('phase','body','🌀','Phase Flesh','After eating you pass through yourself for 1 second.','rare',
  {}, {eat(){ const g=G(); if(g) g.invT = Math.max(g.invT, 1.0 + .4*(this.stacks-1)); }}),
m('shed','body','🍂','Shed Skin','Every 12th food: drop 6 segments and bank 250 points.','rare',
  {}, {eat(e){
    this.n = (this.n||0)+1;
    if(this.n % 12) return;
    const g = G(); if(!g) return;
    g.snake.target = Math.max(g.cell*3.2, g.snake.target - g.cell*6);
    score(250*this.stacks, e.x, e.y, '#fbbf24');
    if(C.burst) C.burst(g.snake.x, g.snake.y, 22, '#a3e635', 1.1, true);
  }}),
m('armor','body','🛡️','Chitin Plate','Start each level with a shield that eats one death.','rare',
  {}, {start(){ if(C.addEff) C.addEff('shield', 9999); },
       levelup(){ if(C.addEff) C.addEff('shield', 9999); }}, {max:1}),
m('hollow','body','🕊️','Hollow Bones','12% faster, 15% less growth.','common',
  {speed:1.12, grow:.85}),
m('regen','body','💚','Regenerator','Slows the hunger clock considerably.','common',
  {hunger:-0.35}),
m('gut','body','🍽️','Iron Gut','Fruit effects last 60% longer.','common',
  {}, {fruit(d){ d.dur *= 1 + .6*this.stacks; }}),
m('serpent','body','🐍','Serpentine','5% faster and turns settle quicker.','common',
  {speed:1.05}),
m('giant','body','🦕','Gigantism','Huge growth and 35% more score, slightly slower.','rare',
  {grow:1.6, score:1.35, speed:.94}),
m('minimal','body','📏','Minimalism','Your body cannot exceed 18 segments. Score ×1.6.','epic',
  {score:1.6}, {tick(){ const g=G(); if(g && g.snake.target > g.cell*18) g.snake.target = g.cell*18; }}, {max:1}),

/* ------------------------------- HUNT (11) ------------------------------- */
m('magnet','hunt','🧲','Magnetism','Food is pulled toward you from 4 tiles away.','common',
  {magnet:4}),
m('bounty','hunt','🍓','Bounty','One more food on the board at all times.','common',
  {foodAdd:1}),
m('split','hunt','🍒','Split Fruit','25% chance that eating spawns an extra food.','common',
  {}, {eat(){ if(NS.rng.stream('mut').chance(.25*this.stacks) && C.spawnFood) C.spawnFood(); }}),
m('goldnose','hunt','👃','Golden Nose','Golden food appears roughly twice as often.','rare',
  {}, {eat(){ const g=G(); if(g) g.nextGolden = Math.min(g.nextGolden, g.t + 12); },
       start(){ const g=G(); if(g) g.nextGolden = g.t + 8; }}, {max:1}),
m('gourmand','hunt','🍇','Gourmand','20% chance each bite conjures a special fruit.','rare',
  {}, {eat(){ if(NS.rng.stream('mut').chance(.2*this.stacks) && C.spawnFood) C.spawnFood('special'); }}),
m('harvest','hunt','🌾','Harvest','Every bite pays 2 extra points per body segment.','rare',
  {}, {eat(e){ score(2*len()*this.stacks, e.x, e.y, '#a3e635'); }}),
m('patience','hunt','⏱️','Long Fuse','Combos survive 0.9s longer.','common',
  {comboAdd:.9}),
m('sense','hunt','📡','Orb Sense','At combo ×3 or higher, food drifts toward you.','rare',
  {}, {}, {dynamic(M){ const g=G(); if(g && g.mult>=3) M.magnet = Math.max(M.magnet, 6); }}),
m('feast','hunt','🎉','Feast','Every 10th food is worth five times as much.','epic',
  {}, {eat(e){
    this.n = (this.n||0)+1;
    const every = this.feastEvery || 10;
    if(this.n % every) return;
    score(e.gain*4, e.x, e.y, '#fbbf24');
    if(C.burst) C.burst(e.x, e.y, 24, '#fbbf24', 1.2, true);
    if(C.Audio_) C.Audio_.golden();
  }}),
m('scavenge','hunt','🪙','Scavenger','Runs pay 50% more coins.','common',
  {coin:1.5}, {}, {max:2}),
m('sugar','hunt','🍬','Blood Sugar','A short speed burst after every bite.','common',
  {}, {eat(){ if(C.addEff) C.addEff('boost', this.sugarDur || 1.2); }}),

/* ----------------------------- VIOLENCE (10) ----------------------------- */
m('shock','violence','💥','Shockwave','Every 10th bite detonates a shockwave.','rare',
  {}, {eat(e){
    this.n = (this.n||0)+1;
    if(this.n % 10) return;
    shockwave(e.x, e.y, this.shockR || 4, '#fde047');
  }}),
m('overcharge','violence','⚡','Overcharge','Longer speed bursts and 10% more score.','common',
  {score:1.1}, {eat(){ if(C.addEff) C.addEff('boost', this.overDur || 1.8); }}),
m('ram','violence','🐏','Ram Head','Survive one wall impact per level.','epic',
  {}, {start(){ if(C.addEff) C.addEff('shield', 9999); },
       levelup(){ if(C.addEff) C.addEff('shield', 9999); }}, {max:1}),
m('blast','violence','🎆','Blast Radius','Eating also consumes food within 2.5 tiles.','rare',
  {}, {eat(e){ eatFoods(foodsNear(e.x, e.y, this.blastR || 2.5), .6); }}),
m('detonate','violence','☄️','Detonator','Golden food clears the board into points.','epic',
  {}, {eat(e){
    if(e.kind !== 'golden') return;
    const g = G(); if(!g) return;
    shockwave(e.x, e.y, 99, '#fbbf24');
  }}, {max:1}),
m('exec','violence','⚔️','Executioner','At combo ×5, every bite adds a flat bonus.','rare',
  {}, {eat(e){ const g=G(); if(g && g.mult>=5) score((this.execBonus||100)*this.stacks, e.x, e.y, '#f43f5e'); }}),
m('momentum','violence','🏃','Momentum','The faster you are, the more everything scores.','epic',
  {}, {}, {dynamic(M){ const g=G(); if(!g) return; const sp = M.speed; M.score *= 1 + (sp-1)*2; }}),
m('kinetic','violence','🔨','Kinetic Impact','Heavier hits, 15% more score.','common',
  {score:1.15}, {eat(){ if(NS.juice) NS.juice.trauma(.25); }}),
m('hunter','violence','🎯','Hunter','Power-ups appear 60% more often.','common',
  {}, {eat(){ const g=G(); if(g) g.nextPower = Math.min(g.nextPower, g.t + 9); }}, {max:1}),
m('berserk','violence','🩸','Berserk','35% faster, 50% more score — and much hungrier.','epic',
  {speed:1.35, score:1.5, hunger:.55}, {}, {curse:true}),

/* ------------------------------- CHAOS (10) ------------------------------ */
m('wrapv','chaos','↕️','Vertical Rift','The arena wraps top to bottom only.','rare',
  {wrapV:1}, {}, {max:1}),
m('wraph','chaos','↔️','Horizontal Rift','The arena wraps left to right only.','rare',
  {wrapH:1}, {}, {max:1}),
m('dilate','chaos','🕰️','Time Dilation','Time slows to a crawl near your own body.','epic',
  {}, {tick(){
    const g = G(); if(!g) return;
    const pts = g.snake.pts, w = g.cell*1.6;
    let near = false, acc = 0;
    for(let i=6;i<pts.length-1 && i<120;i+=3){
      acc += g.cell;
      if(acc < g.cell*3) continue;
      if(Math.hypot(pts[i].x-g.snake.x, pts[i].y-g.snake.y) < w){ near = true; break; }
    }
    this.near = near;
  }}, {dynamic(M){ if(this.near) M.speed *= .55; }, max:1}),
m('adrenaline','chaos','💉','Adrenaline','The shorter you are, the more you score.','rare',
  {}, {}, {dynamic(M){ const l = len(); if(l < 20) M.score *= 1 + (20-l)/20*.8; }}),
m('rush','chaos','🚀','Rush','2% faster for every level you reach.','common',
  {}, {}, {dynamic(M){ const g=G(); if(g) M.speed *= 1 + (g.level-1)*.02*this.stacks; }}),
m('gambler','chaos','🎲','Gambler','15% chance to triple a bite. 10% chance it pays nothing.','rare',
  {}, {eat(e){
    const r = NS.rng.stream('mut').float();
    if(r < .15){ score(e.gain*2, e.x, e.y, '#22d3ee'); if(C.Audio_) C.Audio_.big(); }
    else if(r < .25){ const g=G(); if(g) g.score = Math.max(0, g.score - e.gain); }
  }}, {curse:true}),
m('metronome','chaos','🎵','Metronome','Bites within 1.2s of each other pay a flat bonus.','common',
  {}, {eat(e){ const g=G(); if(g && e.chain>1) score(50*this.stacks, e.x, e.y, '#c084fc'); }}),
m('entropy','chaos','🌪️','Entropy','A power-up materialises every 20 seconds.','rare',
  {}, {tick(dt){
    this.t = (this.t||0) + dt;
    if(this.t < 20) return;
    this.t = 0;
    const g = G();
    if(g && g.powers.length < 2 && C.spawnPower) C.spawnPower();
  }}, {max:1}),
m('glass','chaos','🔮','Glass Cannon','Score more than doubles. Hunger nearly triples.','epic',
  {score:2.2, hunger:.9}, {}, {curse:true}),
m('pandemonium','chaos','🌋','Pandemonium','Every other mutation you hold works 15% harder.','legendary',
  {}, {}, {max:1, amplify:true}),

/* --------------------- DEVIL'S BARGAINS (curses, 5) ---------------------- */
m('pact','curse','😈',"Blood Pact",'Double score. The hunger clock becomes brutal.','epic',
  {score:2.0, hunger:1.2}, {}, {curse:true, max:1}),
m('famine','curse','🥀','Hollow Hunger','80% more score, but one less food on the board.','epic',
  {score:1.8, foodAdd:-1}, {}, {curse:true, max:1}),
m('frenzy','curse','🌀','Frenzy','50% faster. Combos die almost instantly.','epic',
  {speed:1.5, comboAdd:-0.8}, {}, {curse:true, max:1}),
m('greed','curse','💰','Greed','Coins ×2.5 — and your body balloons with every bite.','rare',
  {coin:2.5, grow:1.8}, {}, {curse:true, max:1}),
m('bargain','curse','⚖️','Devil\'s Cut','×3 score. You permanently lose a segment every 2s.','legendary',
  {score:3.0, hunger:1.6}, {}, {curse:true, max:1})
];

const BY_ID = {};
MUTATIONS.forEach(x => BY_ID[x.id] = x);

/* =============================== SYNERGIES =============================== */
const SYNERGIES = [
  {id:'corrosion', name:'CORROSION',     need:['shock','blast'],
   desc:'Shockwaves clear the whole arena into points.',
   apply(){ const s = held('shock'); if(s) s.shockR = 99; }},
  {id:'horizon',   name:'EVENT HORIZON', need:['magnet','sense'],
   desc:'Magnet radius doubled.', apply(M){ M.magnet *= 2; }},
  {id:'gluttony',  name:'GLUTTONY',      need:['giant','feast'],
   desc:'Feast triggers every 5th food instead of 10th.',
   apply(){ const f = held('feast'); if(f) f.feastEvery = 5; }},
  {id:'phaseshift',name:'PHASE SHIFT',   need:['phase','wrapv'],
   desc:'Intangibility lasts almost twice as long.',
   apply(){ const p = held('phase'); if(p) p.stacks = Math.max(p.stacks, 2); }},
  {id:'perpetual', name:'PERPETUAL',     need:['momentum','sugar'],
   desc:'Speed bursts feed straight back into score.',
   apply(M){ M.score *= 1.25; }},
  {id:'singular',  name:'SINGULARITY',   need:['wrapv','wraph'],
   desc:'The arena has no edges at all. Score ×1.2.',
   apply(M){ M.score *= 1.2; }},
  {id:'alchemy',   name:'ALCHEMY',       need:['harvest','minimal'],
   desc:'Harvest pays double on a short body.',
   apply(){ const h = held('harvest'); if(h) h.stacks = h.baseStacks*2; }},
  {id:'overkill',  name:'OVERKILL',      need:['exec','berserk'],
   desc:'Executioner bonus doubled.',
   apply(){ const e = held('exec'); if(e) e.execBonus = 200; }},
  {id:'ironhide',  name:'IRON HIDE',     need:['armor','ram'],
   desc:'Shields also recharge on every golden food.',
   apply(){ /* handled in the eat hook below */ }},
  {id:'chain',     name:'CHAIN REACTION',need:['split','bounty'],
   desc:'Two extra foods on the board instead of one.',
   apply(M){ M.foodAdd += 1; }},
  {id:'sugarrush', name:'SUGAR RUSH',    need:['sugar','overcharge'],
   desc:'Speed bursts last twice as long.',
   apply(){ const s = held('sugar'); if(s) s.sugarDur = 2.4;
            const o = held('overcharge'); if(o) o.overDur = 3.0; }},
  {id:'doomsday',  name:'DOOMSDAY',      need:['glass','pact'],
   desc:'Score ×1.4 more, and the hunger eases slightly.',
   apply(M){ M.score *= 1.4; M.hunger -= .5; }}
];

/* ============================== live state =============================== */
let heldList = [];                 // [{def, stacks, ...instance state}]
let activeSyn = [];
let M = null;                      // resolved modifier cache

function held(id){ return heldList.filter(h => h.id === id)[0] || null; }

function resolve(){
  const base = {speed:1, grow:1, score:1, coin:1, xp:1,
                foodAdd:0, magnet:0, hunger:0, comboAdd:0, wrapV:0, wrapH:0};
  const amp = heldList.some(h => h.def.amplify) ? 1.15 : 1;

  for(const h of heldList){
    const mods = h.def.mods, s = h.stacks;
    for(const k in mods){
      const v = mods[k];
      if(k === 'speed' || k === 'grow' || k === 'score' || k === 'coin' || k === 'xp'){
        /* multiplicative: (v ** stacks), amplified */
        const eff = 1 + (v - 1) * s * amp;
        base[k] *= eff;
      } else {
        base[k] += v * s * (k === 'hunger' ? 1 : amp);
      }
    }
  }
  /* synergies */
  activeSyn = SYNERGIES.filter(sy => sy.need.every(id => !!held(id)));
  for(const sy of activeSyn){ try{ sy.apply(base); }catch(e){} }
  /* per-frame dynamic contributions */
  for(const h of heldList){
    if(h.def.dynamic){ try{ h.def.dynamic.call(h, base); }catch(e){} }
  }
  base.hunger = Math.max(0, base.hunger + api.baseHunger);
  M = base;
  return base;
}

/* ================================ public ================================= */
const api = NS.mut = {
  ALL: MUTATIONS,
  SYNERGIES,
  BY_ID,
  baseHunger: 0,                    // set by the mode config

  get held(){ return heldList; },
  get synergies(){ return activeSyn; },
  count(){ return heldList.reduce((n,h)=>n+h.stacks, 0); },
  has(id){ return !!held(id); },
  mods(){ return M || resolve(); },

  /* mutations available to draft right now */
  pool(includeCurses){
    return MUTATIONS.filter(x => {
      if(x.curse && !includeCurses) return false;
      if(!x.curse && includeCurses === 'only') return false;
      const h = held(x.id);
      return !h || h.stacks < x.max;
    });
  },

  take(id){
    const def = BY_ID[id];
    if(!def) return false;
    let h = held(id);
    if(h){ h.stacks++; h.baseStacks = h.stacks; }
    else {
      h = {id, def, stacks:1, baseStacks:1};
      heldList.push(h);
      if(def.on && def.on.start){ try{ def.on.start.call(h); }catch(e){} }
    }
    const before = activeSyn.map(s => s.id);
    resolve();
    const gained = activeSyn.filter(s => before.indexOf(s.id) < 0);
    NS.emit('mutation', {id, stacks:h.stacks, def});
    for(const sy of gained) NS.emit('synergy', sy);
    return true;
  },

  clear(){
    heldList = []; activeSyn = []; resolve();
    NS.emit('mutation', null);
  },

  /* summary for the run card / share string */
  summary(){
    return heldList.map(h => h.def.ic).join('');
  },
  names(){ return heldList.map(h => h.def.name + (h.stacks>1 ? ' ×'+h.stacks : '')); }
};

/* ---------------------- feed the core's mod() hooks ---------------------- */
NS.modProviders.push((key, base) => {
  const m = M || resolve();
  /* hunger is a mode rule, not a mutation, so it applies with an empty build */
  if(key === 'hunger') return base + m.hunger;
  if(!heldList.length) return base;                 // Classic / no build: untouched
  switch(key){
    case 'speed':       return base * m.speed;
    case 'grow':        return base * m.grow;
    case 'score':       return base * m.score;
    case 'foodCount':   return base + m.foodAdd;
    case 'magnet':      return Math.max(base, m.magnet);
    case 'hunger':      return base + m.hunger;
    case 'comboWindow': return Math.max(.6, base + m.comboAdd);
    case 'wrapV':       return base + (m.wrapV > 0 ? 1 : 0);
    case 'wrapH':       return base + (m.wrapH > 0 ? 1 : 0);
    default:            return base;
  }
});

/* ------------------------------ event wiring ----------------------------- */
NS.on('start', () => {
  api.clear();
  api.baseHunger = NS.settings.mode === 'rogue' ? 0.20 : 0;   // cells per second
  resolve();
});

NS.on('eat', e => {
  for(const h of heldList){
    if(h.def.on.eat){ try{ h.def.on.eat.call(h, e); }catch(err){} }
  }
  /* IRON HIDE synergy */
  if(e.kind === 'golden' && activeSyn.some(s => s.id === 'ironhide') && C.addEff){
    C.addEff('shield', 9999);
  }
  resolve();
});

NS.on('tick', dt => {
  if(!dt || !heldList.length) return;
  for(const h of heldList){
    if(h.def.on.tick){ try{ h.def.on.tick.call(h, dt); }catch(err){} }
  }
  resolve();
});

NS.on('levelup', lv => {
  for(const h of heldList){
    if(h.def.on.levelup){ try{ h.def.on.levelup.call(h, lv); }catch(err){} }
  }
  resolve();
});

/* coin / xp multipliers from the build feed the profile rewards */
NS.on('gameover', r => {
  const m = M || resolve();
  if(m.coin > 1 && NS.profile){
    const bonus = Math.round((Math.floor(r.score/8) + r.eats) * (m.coin - 1));
    if(bonus > 0){
      NS.profile.addCoins(bonus, 'build');
      NS.toast('🪙','BUILD BONUS','+' + U.num(bonus) + ' coins from your mutations');
    }
  }
});

resolve();
})();
