/* ============================================================================
   NEON SERPENT v2.0 — 100 achievements across 8 categories.
   Every entry has a live progress value and a coin reward. The 12 achievements
   from v1 keep their original ids, so existing unlocks carry straight over.
   ========================================================================== */
(function(){
"use strict";
const NS = window.NS, C = window.NSCore || {}, U = NS.util;
const P  = NS.profile;

const CATS = [
  {id:'gameplay',   name:'Gameplay',   ic:'🎮'},
  {id:'combo',      name:'Combo',      ic:'🔥'},
  {id:'collection', name:'Collection', ic:'💎'},
  {id:'explore',    name:'Exploration',ic:'🧭'},
  {id:'challenge',  name:'Challenge',  ic:'🏔️'},
  {id:'mastery',    name:'Mastery',    ic:'⚡'},
  {id:'theme',      name:'Themes',     ic:'🎨'},
  {id:'stats',      name:'Statistics', ic:'📊'}
];

/* ids owned by the core game's own unlock() call — we mirror, never duplicate */
const CORE_IDS = ['first','combo','golden','lv10','s1000','s5000','long','surv','power','fruit','gem','vet'];

/* live score/level of the run in progress (0 when not playing) */
function live(field){
  const G = C.G;
  if(!G || G.demo || (G.state !== 'play' && G.state !== 'over')) return 0;
  return G[field] || 0;
}
const st = () => P.data.stats;

/* a(id, cat, icon, name, desc, coins, goal, value) */
function a(id, cat, ic, name, desc, coins, goal, val){
  return {id, cat, ic, name, desc, coins, goal, val};
}

const LIST = [
/* ------------------------------- GAMEPLAY -------------------------------- */
a('first','gameplay','🥚','First Bite','Eat your first piece of food',25,1,()=>st().eats),
a('eat100','gameplay','🍽️','Hungry','Eat 100 pieces of food',60,100,()=>st().eats),
a('eat500','gameplay','🍴','Ravenous','Eat 500 pieces of food',150,500,()=>st().eats),
a('eat2000','gameplay','🦷','Insatiable','Eat 2,000 pieces of food',400,2000,()=>st().eats),
a('games10','gameplay','🎯','Regular','Play 10 games',50,10,()=>st().games),
a('vet','gameplay','🎖️','Veteran','Play 20 games',80,20,()=>st().games),
a('games50','gameplay','🏅','Devoted','Play 50 games',180,50,()=>st().games),
a('games200','gameplay','🏆','Obsessed','Play 200 games',600,200,()=>st().games),
a('lv10','gameplay','🚀','Level 10','Reach level 10 in a single run',100,10,()=>Math.max(st().maxLevel, live('level'))),
a('lv20','gameplay','🛸','Level 20','Reach level 20 in a single run',250,20,()=>Math.max(st().maxLevel, live('level'))),
a('lv30','gameplay','🌠','Level 30','Reach level 30 in a single run',500,30,()=>Math.max(st().maxLevel, live('level'))),
a('long','gameplay','🐍','Longest Snake','Grow to 40 segments',120,40,()=>st().bestLen),
a('len60','gameplay','🐲','Colossus','Grow to 60 segments',260,60,()=>st().bestLen),
a('len80','gameplay','🦕','Leviathan','Grow to 80 segments',500,80,()=>st().bestLen),

/* --------------------------------- COMBO --------------------------------- */
a('combo','combo','👑','Combo King','Reach a ×5 combo',100,5,()=>st().bestCombo),
a('comboRun3','combo','⚔️','Triple Threat','Reach a ×3 combo',40,3,()=>st().bestCombo),
a('c2x50','combo','🔗','Chain Starter','Land 50 ×2 combos',60,50,()=>st().combo2),
a('c3x50','combo','⛓️','Chain Master','Land 50 ×3 combos',120,50,()=>st().combo3),
a('c5x10','combo','💥','Combo Fiend','Land 10 ×5 combos',150,10,()=>st().combo5),
a('c5x50','combo','🌋','Combo Legend','Land 50 ×5 combos',350,50,()=>st().combo5),
a('c5x200','combo','☄️','Combo God','Land 200 ×5 combos',800,200,()=>st().combo5),
a('combo25','combo','✨','Streak','Land 25 combos of any size',50,25,()=>st().combo2+st().combo3+st().combo5),
a('combo100','combo','🌟','Streaker','Land 100 combos',140,100,()=>st().combo2+st().combo3+st().combo5),
a('combo500','combo','💫','Unbroken','Land 500 combos',420,500,()=>st().combo2+st().combo3+st().combo5),
a('combo1500','combo','🔮','Chain Reaction','Land 1,500 combos',900,1500,()=>st().combo2+st().combo3+st().combo5),
a('comboScore','combo','📈','Multiplied','Score 3,000 in one run',300,3000,()=>Math.max(st().best, live('score'))),

/* ------------------------------ COLLECTION ------------------------------- */
a('golden','collection','✨','Golden Hunter','Eat 3 golden foods in one run',120,3,()=>Math.max(st().bestGolden||0, live('golden'))),
a('gold10','collection','🪙','Prospector','Eat 10 golden foods',100,10,()=>st().golden),
a('gold50','collection','💰','Midas','Eat 50 golden foods',300,50,()=>st().golden),
a('gold100','collection','🏦','Gold Rush','Eat 100 golden foods',700,100,()=>st().golden),
a('gem','collection','💎','Diamond Hands','Eat 3 diamonds in one run',120,3,()=>Math.max(st().bestGems||0, 0)),
a('gem25','collection','💍','Jeweller','Eat 25 diamonds',260,25,()=>st().gems),
a('gem100','collection','👑','Crown Jewels','Eat 100 diamonds',650,100,()=>st().gems),
a('fruit','collection','🍉','Fruit Master','Eat all 7 special fruits in one run',150,7,()=>Math.max(P.distinct('fruits'), 0)),
a('fruit100','collection','🍇','Orchard','Eat 100 special fruits',200,100,()=>st().fruit),
a('orbL50','collection','🔵','Big Eater','Eat 50 large orbs',120,50,()=>st().orbsL),
a('orbL200','collection','🌐','Whale','Eat 200 large orbs',400,200,()=>st().orbsL),
a('orbS500','collection','⚪','Nibbler','Eat 500 small orbs',220,500,()=>st().orbsS),
a('coins1k','collection','🪙','Saver','Earn 1,000 coins',80,1000,()=>st().coinsEarned),
a('coins10k','collection','💸','Rich','Earn 10,000 coins',300,10000,()=>st().coinsEarned),
a('coins50k','collection','🤑','Tycoon','Earn 50,000 coins',900,50000,()=>st().coinsEarned),

/* ------------------------------ EXPLORATION ------------------------------ */
a('skin2','explore','👕','Dressed Up','Own 2 snake skins',50,2,()=>P.data.owned.skin.length),
a('skin5','explore','🎽','Collector','Own 5 snake skins',150,5,()=>P.data.owned.skin.length),
a('skin10','explore','🧥','Curator','Own 10 snake skins',350,10,()=>P.data.owned.skin.length),
a('skin20','explore','🐉','Completionist','Own all 20 snake skins',1500,20,()=>P.data.owned.skin.length),
a('skinUse3','explore','🎭','Shapeshifter','Play with 3 different skins',80,3,()=>P.distinct('skins')),
a('skinUse8','explore','🎪','Quick Change','Play with 8 different skins',280,8,()=>P.distinct('skins')),
a('theme3','explore','🗺️','Sightseer','Play in 3 different themes',70,3,()=>P.distinct('themes')),
a('theme6','explore','🌍','World Tour','Play in all 6 themes',200,6,()=>P.distinct('themes')),
a('diff2','explore','🎚️','Explorer','Play 2 difficulties',60,2,()=>P.distinct('diffs')),
a('diff4','explore','🎛️','All Comers','Play all 4 difficulties',220,4,()=>P.distinct('diffs')),
a('trail3','explore','☄️','Trailblazer','Own 3 trail effects',150,3,()=>P.data.owned.trail.length),
a('border3','explore','🖼️','Framed','Own 3 board borders',150,3,()=>P.data.owned.border.length),
a('title5','explore','📛','Many Names','Own 5 titles',180,5,()=>P.data.owned.title.length),

/* ------------------------------- CHALLENGE ------------------------------- */
a('s1000','challenge','🔥','1000 Score','Score 1,000 in a single run',80,1000,()=>Math.max(st().best, live('score'))),
a('s2500','challenge','💥','2500 Score','Score 2,500 in a single run',160,2500,()=>Math.max(st().best, live('score'))),
a('s5000','challenge','💫','5000 Score','Score 5,000 in a single run',300,5000,()=>Math.max(st().best, live('score'))),
a('s10000','challenge','🌟','Five Digits','Score 10,000 in a single run',600,10000,()=>Math.max(st().best, live('score'))),
a('s25000','challenge','👽','Unreal','Score 25,000 in a single run',1500,25000,()=>Math.max(st().best, live('score'))),
a('surv','challenge','⏱️','2 Min Survivor','Survive 2 minutes in one run',120,120,()=>Math.max(st().bestTime||0, 0)),
a('surv5','challenge','⏳','Five Alive','Survive 5 minutes in one run',350,300,()=>Math.max(st().bestTime||0, 0)),
a('surv10','challenge','🕰️','Iron Will','Survive 10 minutes in one run',800,600,()=>Math.max(st().bestTime||0, 0)),
a('hard1000','challenge','🪓','Hard Mode','Score 1,000 on Hard',200,1000,()=>st().best_hard||0),
a('insane1000','challenge','☠️','Insanity','Score 1,000 on Insane',400,1000,()=>st().best_insane||0),
a('run60x25','challenge','🏃','Persistent','Finish 25 runs over 1 minute',200,25,()=>st().runs60),
a('run120x10','challenge','🥾','Marathoner','Finish 10 runs over 2 minutes',260,10,()=>st().runs120),
a('lvl15run','challenge','🧗','Ascended','Reach level 15 in a single run',220,15,()=>Math.max(st().maxLevel, live('level'))),

/* -------------------------------- MASTERY -------------------------------- */
a('power','mastery','⚡','Power User','Collect 5 power-ups in one run',100,5,()=>Math.max(st().bestPowers||0, 0)),
a('pow50','mastery','🔌','Charged','Collect 50 power-ups',150,50,()=>st().powers),
a('pow200','mastery','🔋','Overcharged','Collect 200 power-ups',450,200,()=>st().powers),
a('powAll','mastery','🧰','Full Arsenal','Collect all 7 power-up types',300,7,()=>P.distinct('powersById')),
a('shield10','mastery','🛡️','Untouchable','Collect 10 shields',120,10,()=>st().powersById.shield||0),
a('ghost10','mastery','👻','Phantom','Collect 10 ghost modes',120,10,()=>st().powersById.ghost||0),
a('magnet10','mastery','🧲','Attractive','Collect 10 magnets',120,10,()=>st().powersById.magnet||0),
a('slow10','mastery','⏳','Time Bender','Collect 10 slow-motions',120,10,()=>st().powersById.slow||0),
a('dist1000','mastery','🚶','Wanderer','Travel 1,000 cells',80,1000,()=>st().distance),
a('dist10000','mastery','🧭','Voyager','Travel 10,000 cells',260,10000,()=>st().distance),
a('dist50000','mastery','🗺️','Odyssey','Travel 50,000 cells',700,50000,()=>st().distance),
a('time1h','mastery','🕐','Hour One','Play for 1 hour',200,3600,()=>st().playTime),
a('time5h','mastery','🕔','Dedicated','Play for 5 hours',600,18000,()=>st().playTime),

/* --------------------------------- THEME --------------------------------- */
a('thCyber','theme','🌆','Cyber Native','Play 10 games in Cyber Neon',90,10,()=>st().themes.cyber||0),
a('thForest','theme','🌲','Forest Dweller','Play 10 games in Forest',90,10,()=>st().themes.forest||0),
a('thOcean','theme','🐟','Deep Diver','Play 10 games in Ocean',90,10,()=>st().themes.ocean||0),
a('thGalaxy','theme','🪐','Star Sailor','Play 10 games in Galaxy',90,10,()=>st().themes.galaxy||0),
a('thLava','theme','🌋','Fire Walker','Play 10 games in Lava',90,10,()=>st().themes.lava||0),
a('thIce','theme','🧊','Frostbitten','Play 10 games in Ice',90,10,()=>st().themes.ice||0),
a('thAll','theme','🎨','Well Travelled','Play 5 games in every theme',400,5,()=>{
  const t = st().themes;
  return Math.min(t.cyber||0,t.forest||0,t.ocean||0,t.galaxy||0,t.lava||0,t.ice||0);
}),
a('skGold','theme','👑','Golden Touch','Own the Gold Snake',150,1,()=>P.owns('skin','gold')?1:0),
a('skDragon','theme','🐉','Dragon Rider','Own the Dragon Snake',200,1,()=>P.owns('skin','dragon')?1:0),
a('skPhoenix','theme','🔥','Reborn','Own the Phoenix Snake',400,1,()=>P.owns('skin','phoenix')?1:0),
a('skGhost','theme','👻','Not There','Own the Ghost Snake',200,1,()=>P.owns('skin','ghost')?1:0),
a('skRainbow','theme','🌈','Full Spectrum','Own the Rainbow Snake',300,1,()=>P.owns('skin','rainbow')?1:0),

/* ------------------------------- STATISTICS ------------------------------ */
a('total10k','stats','📈','Getting Somewhere','Score 10,000 lifetime points',80,10000,()=>st().score),
a('total100k','stats','📊','Six Figures','Score 100,000 lifetime points',300,100000,()=>st().score),
a('total1m','stats','🏛️','Millionaire','Score 1,000,000 lifetime points',2000,1000000,()=>st().score),
a('plvl5','stats','⭐','Rising','Reach player level 5',80,5,()=>P.data.plvl),
a('plvl10','stats','🌟','Seasoned','Reach player level 10',200,10,()=>P.data.plvl),
a('plvl25','stats','💠','Elite','Reach player level 25',600,25,()=>P.data.plvl),
a('plvl50','stats','🔱','Prestige','Reach player level 50',1800,50,()=>P.data.plvl),
a('best2000','stats','🥇','Personal Best','Set a personal best of 2,000',140,2000,()=>st().best),
a('best10000','stats','🏆','Record Holder','Set a personal best of 10,000',700,10000,()=>st().best),
a('lenBest100','stats','🐍','Endless','Reach 100 segments',900,100,()=>st().bestLen),
a('ach25','stats','🎖️','Achiever','Unlock 25 achievements',200,25,()=>api.count()),
a('ach50','stats','🎗️','Overachiever','Unlock 50 achievements',500,50,()=>api.count()),
a('ach75','stats','🏵️','Perfectionist','Unlock 75 achievements',1000,75,()=>api.count()),
a('ach99','stats','💯','Completionist','Unlock 99 achievements',3000,99,()=>api.count())
];

const byId = {};
LIST.forEach(x => byId[x.id] = x);

/* ============================== public api ================================ */
const api = NS.ach = {
  CATS, LIST, byId,
  total: LIST.length,
  has(id){ return !!P.data.ach[id]; },
  count(){ return Object.keys(P.data.ach).length; },
  progress(x){
    let v = 0;
    try{ v = x.val() || 0; }catch(e){ v = 0; }
    return {value:v, goal:x.goal, pct: U.clamp(v/x.goal, 0, 1), done: v >= x.goal};
  },
  byCat(cat){ return LIST.filter(x => x.cat === cat); },
  catProgress(cat){
    const list = api.byCat(cat);
    return {done: list.filter(x => api.has(x.id)).length, total: list.length};
  },

  /* grants an achievement, pays the reward and shows the popup */
  award(id, silent){
    if(P.data.ach[id] || !byId[id]) return false;
    P.data.ach[id] = Date.now();
    P.save();
    const x = byId[id];
    /* keep the core's own list in step so it never re-announces the same one */
    if(CORE_IDS.indexOf(id) >= 0 && C.S && C.S.ach && C.S.ach.indexOf(id) < 0){
      C.S.ach.push(id);
      if(C.save) C.save();
    }
    P.addCoins(x.coins, 'achievement');
    if(!silent){
      NS.emit('achievement', x);
      NS.toast(x.ic, 'ACHIEVEMENT · +' + x.coins + ' 🪙', x.name);
      if(C.Audio_) C.Audio_.big();
      if(C.vib) C.vib([16,40,16]);
    }
    return true;
  },

  /* evaluates every predicate; cheap enough to run on any game event */
  check(){
    let n = 0;
    for(let i=0;i<LIST.length;i++){
      const x = LIST[i];
      if(P.data.ach[x.id]) continue;
      if(api.progress(x).done && api.award(x.id)) n++;
    }
    if(n) render();
    return n;
  },

  /* mirrors the core's own 12 unlocks into the expanded system */
  sync(){
    const S = C.S;
    if(!S || !S.ach) return;
    let n = 0;
    for(const id of S.ach){
      if(byId[id] && !P.data.ach[id]){
        P.data.ach[id] = Date.now();
        P.addCoins(byId[id].coins, 'achievement');
        n++;
      }
    }
    if(n) P.save();
    return n;
  }
};

/* ============================== screen UI ================================= */
NS.css('ns-ach-css', `
#badges.ns-ach{display:block}
.ns-achhead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
.ns-achhead .ns-bar{flex:1}
.ns-ach-list{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(228px,1fr))}
@media (max-width:560px){.ns-ach-list{grid-template-columns:1fr}}
.ns-a{display:flex;gap:10px;padding:10px 12px;border-radius:15px;text-align:left;
  border:1px solid var(--stroke);background:rgba(255,255,255,.04);
  transition:transform .28s var(--ease),border-color .28s,box-shadow .28s,background .28s}
.ns-a:hover{transform:translateY(-2px);background:rgba(255,255,255,.07)}
.ns-a.got{border-color:color-mix(in srgb,var(--a2) 55%,transparent);
  background:linear-gradient(160deg,color-mix(in srgb,var(--a1) 22%,transparent),rgba(255,255,255,.05));
  box-shadow:0 0 26px -14px color-mix(in srgb,var(--a2) 90%,transparent)}
.ns-a .ai{font-size:22px;line-height:1.15;filter:grayscale(1) opacity(.5);flex:0 0 auto;
  transition:filter .4s var(--ease)}
.ns-a.got .ai{filter:none}
.ns-a .an{font-size:12.5px;font-weight:900;letter-spacing:.04em}
.ns-a .ad{font-size:10.5px;color:var(--txt-dim);margin:2px 0 6px;line-height:1.5}
.ns-a .af{display:flex;align-items:center;gap:8px;font-size:9.5px;font-weight:800;
  color:var(--txt-dim);letter-spacing:.06em}
.ns-a .af .ns-bar{flex:1;height:4px}
.ns-a .rw{color:#fde68a}
.ns-a .body{min-width:0;flex:1}
`);

let curCat = 'all';

function card(x){
  const got = api.has(x.id);
  const pr  = api.progress(x);
  const val = Math.min(pr.value, x.goal);
  const show = x.goal > 1 && !got;
  return '<div class="ns-a'+(got?' got':'')+'">'+
    '<div class="ai">'+x.ic+'</div>'+
    '<div class="body">'+
      '<div class="an">'+U.esc(x.name)+'</div>'+
      '<div class="ad">'+U.esc(x.desc)+'</div>'+
      '<div class="af">'+
        (show ? '<div class="ns-bar"><i style="width:'+(pr.pct*100).toFixed(1)+'%"></i></div>'+
                '<span>'+U.num(val)+' / '+U.num(x.goal)+'</span>'
              : '<span>'+(got?'UNLOCKED':'LOCKED')+'</span>')+
        '<span class="rw">+'+x.coins+' 🪙</span>'+
      '</div>'+
    '</div></div>';
}

function render(){
  const box = document.getElementById('badges');
  if(!box) return;
  box.className = 'ns-ach';
  const done = api.count(), total = api.total;
  const list = curCat === 'all' ? LIST : api.byCat(curCat);

  box.innerHTML =
    '<div class="ns-achhead">'+
      '<span class="ns-pill xp">'+done+' / '+total+'</span>'+
      '<div class="ns-bar gold"><i style="width:'+((done/total)*100).toFixed(1)+'%"></i></div>'+
      '<span class="ns-pill coin"><span class="i">🪙</span>'+U.num(P.data.coins)+'</span>'+
    '</div>'+
    '<div class="ns-tabs">'+
      '<button data-c="all"'+(curCat==='all'?' class="on"':'')+'>ALL</button>'+
      CATS.map(c=>{
        const p = api.catProgress(c.id);
        return '<button data-c="'+c.id+'"'+(curCat===c.id?' class="on"':'')+'>'+
               c.ic+' '+c.name.toUpperCase()+' '+p.done+'/'+p.total+'</button>';
      }).join('')+
    '</div>'+
    '<div class="ns-scroll"><div class="ns-ach-list">'+
      list.map(card).join('')+
    '</div></div>';

  box.querySelectorAll('.ns-tabs button').forEach(b=>{
    b.addEventListener('click', ()=>{
      curCat = b.dataset.c;
      if(C.Audio_) C.Audio_.click();
      render();
    });
  });

  const sub = document.getElementById('achSub');
  if(sub) sub.textContent = done + ' OF ' + total + ' UNLOCKED';
  const start = document.getElementById('abStart');
  if(start) start.textContent = done + '/' + total;
}
api.render = render;

/* take over the core's badge renderer (same call sites, richer output) */
window.renderBadges = render;

/* ------------------------- extra run-scoped maxima ------------------------ */
NS.on('gameover', r => {
  P.max('bestTime', r.time);
  P.max('bestGolden', r.golden);
  P.max('bestPowers', r.powers);
  P.max('bestGems', r.gems || 0);
  const d = r.diff || 'normal';
  if(r.score > (P.data.stats['best_'+d]||0)) P.data.stats['best_'+d] = r.score;
  P.save();
  api.sync();
  api.check();
});
NS.on('eat',      ()=>api.check());
NS.on('levelup',  ()=>api.check());
NS.on('power',    ()=>api.check());
NS.on('unlocked', ()=>{ api.check(); });
NS.on('equipped', ()=>{ api.check(); });
NS.on('plevel',   ()=>api.check());

NS.ready(()=>{ api.sync(); api.check(); render(); });
})();
