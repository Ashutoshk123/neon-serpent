/* ============================================================================
   NEON SERPENT v2.0 — Premium Snake Collection
   20 skins, each with its own animated body gradient, glow, eyes, head
   decoration, tail profile, movement trail and eating burst.

   A skin is a plain object; every field is optional and the core falls back to
   the original rainbow look when a field is missing:
     body(i, t, n, G)  -> stroke colour for body chunk i (t = 0 head .. 1 tail)
     aura(G)           -> colour of the wide glow pass
     glow {col, mul}   -> shadow colour + blur multiplier
     headFill(ctx,hr,G)-> fill style for the head circle
     head(ctx, hr, G)  -> decoration drawn in head space (+x = forward)
     eyes {...}        -> colour / pupil / slit / glow / size, or draw()
     tail {taper}      -> 0 = no taper, 1 = needle tail
     overlay(ctx,pts,w,G) -> extra pass over the whole body
     trail(G, spark)   -> movement trail particles (called ~30x/sec)
     eat(x, y, G, spark, burst) -> custom eating animation
   ========================================================================== */
(function(){
"use strict";
const NS = window.NS, C = window.NSCore || {}, U = NS.util;
const hsl = U.hsl, pong = U.pong;

/* --------------------------- particle plumbing ---------------------------- */
/* Pushes straight into the core particle array so the existing renderer,
   pooling cap and update loop are reused untouched.                          */
function spark(o){
  const G = C.G;
  if(!G || !G.parts || G.parts.length > 360) return;
  const life = o.life || 0.5;
  G.parts.push({
    x:o.x, y:o.y, vx:o.vx||0, vy:o.vy||0,
    life:life, max:life, r:o.r || G.cell*0.11,
    col:o.col || '#fff', g:1
  });
}
function ring(x, y, col, life){
  const G = C.G;
  if(!G || !G.parts || G.parts.length > 380) return;
  G.parts.push({ring:true, x, y, r:G.cell*0.35, life:life||0.5, max:life||0.5, col});
}
/* a point a little behind the head, where trails should be emitted */
function tailPoint(G){
  const sn = G.snake, p = sn.pts[Math.min(3, sn.pts.length-1)] || sn.pts[0];
  return p;
}

/* ================================= SKINS ================================== */
const SKINS = [
{
  id:'neon', name:'Neon Snake', rarity:'common', price:0, icon:'🌈',
  desc:'The original. A full spectrum that flows from head to tail.',
  unlock:{type:'free'}
  /* no overrides — this is the stock look, preserved exactly */
},
{
  id:'cyber', name:'Cyber Snake', rarity:'common', price:300, icon:'🤖',
  desc:'Circuit-board plating with a data pulse running down the spine.',
  unlock:{type:'coins'},
  glow:{col:'#22d3ee', mul:1.15},
  aura:G=>`hsla(188 100% 60% / .34)`,
  body(i,t,n,G){
    const pulse = Math.max(0, Math.sin(i*0.28 - G.t*5));
    const seg = (i % 8 < 2) ? 16 : 0;
    return hsl(186 + 14*Math.sin(i*0.12), 95, 40 + seg + 26*pulse*pulse - 10*t);
  },
  headFill(ctx,hr){
    const g = ctx.createRadialGradient(-hr*.2,-hr*.3,hr*.1,0,0,hr);
    g.addColorStop(0,'#d9fbff'); g.addColorStop(.5,'#22d3ee'); g.addColorStop(1,'#0e7490');
    return g;
  },
  head(ctx,hr,G){
    ctx.strokeStyle = 'rgba(8,30,40,.55)'; ctx.lineWidth = Math.max(1, hr*.11);
    ctx.beginPath();
    ctx.moveTo(-hr*.55, -hr*.4); ctx.lineTo(hr*.1,-hr*.4); ctx.lineTo(hr*.35,-hr*.15);
    ctx.moveTo(-hr*.55,  hr*.4); ctx.lineTo(hr*.1, hr*.4); ctx.lineTo(hr*.35, hr*.15);
    ctx.stroke();
  },
  eyes:{col:'#eafcff', pupil:'#062733', glow:true},
  tail:{taper:.46},
  trail(G){
    if(Math.random() > .35) return;
    const p = tailPoint(G);
    spark({x:p.x, y:p.y, vx:U.rand(-8,8), vy:U.rand(-8,8), life:.35,
           r:G.cell*.07, col:'#67e8f9'});
  }
},
{
  id:'galaxy', name:'Galaxy Snake', rarity:'epic', price:2000, icon:'🌌',
  desc:'A ribbon of deep space with stars burning inside it.',
  unlock:{type:'coins'},
  glow:{col:'#a855f7', mul:1.3},
  aura:()=>'hsla(272 90% 62% / .32)',
  body(i,t,n,G){
    const star = Math.pow(Math.max(0, Math.sin(i*1.7 + G.t*2.2)), 12);
    return hsl(258 + 34*Math.sin(i*0.1 + G.t*.5), 88, 26 + 46*star + 14*(1-t));
  },
  headFill(ctx,hr){
    const g = ctx.createRadialGradient(-hr*.25,-hr*.3,hr*.08,0,0,hr);
    g.addColorStop(0,'#f5e6ff'); g.addColorStop(.45,'#a855f7'); g.addColorStop(1,'#2e1065');
    return g;
  },
  eyes:{col:'#ffffff', pupil:'#1e0a3c', glow:true, size:.92},
  tail:{taper:.5},
  trail(G){
    if(Math.random() > .3) return;
    const p = tailPoint(G);
    spark({x:p.x+U.rand(-4,4), y:p.y+U.rand(-4,4), vx:U.rand(-5,5), vy:U.rand(-14,-4),
           life:.8, r:G.cell*.06, col: Math.random()<.4 ? '#ffffff' : '#c084fc'});
  },
  eat(x,y,G,sp,burst){ burst(x,y,22,'#c084fc',1.1,true); }
},
{
  id:'dragon', name:'Dragon Snake', rarity:'legendary', price:2500, icon:'🐉',
  desc:'Overlapping scales, horned crown and a smouldering tail.',
  unlock:{type:'level', v:12},
  glow:{col:'#ef4444', mul:1.25},
  aura:()=>'hsla(12 96% 55% / .34)',
  body(i,t,n,G){
    const scale = (i % 3 === 0) ? 14 : 0;              // hard scale edges
    return hsl(6 + 22*Math.sin(i*0.18 + G.t*.7), 92, 34 + scale + 16*(1-t));
  },
  headFill(ctx,hr){
    const g = ctx.createRadialGradient(-hr*.2,-hr*.3,hr*.1,0,0,hr);
    g.addColorStop(0,'#ffd9c2'); g.addColorStop(.5,'#ef4444'); g.addColorStop(1,'#7f1d1d');
    return g;
  },
  head(ctx,hr,G){
    ctx.fillStyle = '#fbbf24';
    for(const s of [-1,1]){                            // horns
      ctx.beginPath();
      ctx.moveTo(-hr*.15, s*hr*.62);
      ctx.quadraticCurveTo(-hr*.95, s*hr*1.25, -hr*1.35, s*hr*.72);
      ctx.quadraticCurveTo(-hr*.75, s*hr*.85, -hr*.15, s*hr*.3);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(120,20,10,.45)';             // snout ridge
    ctx.beginPath(); ctx.ellipse(hr*.42,0,hr*.34,hr*.2,0,0,6.2832); ctx.fill();
  },
  eyes:{col:'#fde047', pupil:'#3b0a02', slit:true, glow:true},
  tail:{taper:.55},
  trail(G){
    if(Math.random() > .45) return;
    const p = tailPoint(G);
    spark({x:p.x, y:p.y, vx:U.rand(-10,10), vy:U.rand(-24,-8), life:.6,
           r:G.cell*.1, col: Math.random()<.5 ? '#f97316' : '#7f1d1d'});
  },
  eat(x,y,G,sp,burst){ burst(x,y,26,'#f97316',1.25,true); ring(x,y,'#fbbf24',.5); }
},
{
  id:'fire', name:'Fire Snake', rarity:'rare', price:700, icon:'🔥',
  desc:'Burning from the inside out, shedding embers as it moves.',
  unlock:{type:'coins'},
  glow:{col:'#f97316', mul:1.35},
  aura:G=>`hsla(${26+8*Math.sin(G.t*6)} 100% 58% / .38)`,
  body(i,t,n,G){
    const flick = pong(G.t*3 + i*0.14);
    return hsl(14 + 34*flick, 100, 42 + 20*flick - 16*t);
  },
  headFill(ctx,hr){
    const g = ctx.createRadialGradient(-hr*.15,-hr*.25,hr*.08,0,0,hr);
    g.addColorStop(0,'#fff7d6'); g.addColorStop(.4,'#fbbf24'); g.addColorStop(1,'#dc2626');
    return g;
  },
  eyes:{col:'#fff7d6', pupil:'#7c2d12', glow:true},
  tail:{taper:.6},
  trail(G){
    const p = tailPoint(G);
    spark({x:p.x+U.rand(-3,3), y:p.y+U.rand(-3,3), vx:U.rand(-12,12), vy:U.rand(-38,-14),
           life:U.rand(.3,.7), r:G.cell*U.rand(.05,.12),
           col: Math.random()<.35 ? '#fde047' : '#f97316'});
  },
  eat(x,y,G,sp,burst){ burst(x,y,24,'#fbbf24',1.2); ring(x,y,'#f97316',.45); }
},
{
  id:'ice', name:'Ice Snake', rarity:'rare', price:700, icon:'❄️',
  desc:'Carved from glacier glass. Leaves a drifting frost wake.',
  unlock:{type:'coins'},
  glow:{col:'#7dd3fc', mul:1.2},
  aura:()=>'hsla(196 100% 76% / .3)',
  body(i,t,n,G){
    const shard = (i % 5 < 2) ? 16 : 0;
    return hsl(190 + 14*Math.sin(i*.2), 92, 62 + shard - 18*t + 8*Math.sin(G.t*2 - i*.2));
  },
  headFill(ctx,hr){
    const g = ctx.createRadialGradient(-hr*.2,-hr*.3,hr*.1,0,0,hr);
    g.addColorStop(0,'#ffffff'); g.addColorStop(.5,'#a5f3fc'); g.addColorStop(1,'#0284c7');
    return g;
  },
  head(ctx,hr){
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    for(let k=-1;k<=1;k++){                             // crown of shards
      ctx.beginPath();
      ctx.moveTo(-hr*.1, k*hr*.5);
      ctx.lineTo(-hr*1.05, k*hr*.62);
      ctx.lineTo(-hr*.2, k*hr*.16);
      ctx.fill();
    }
  },
  eyes:{col:'#e0f7ff', pupil:'#075985', glow:true},
  tail:{taper:.48},
  trail(G){
    if(Math.random() > .4) return;
    const p = tailPoint(G);
    spark({x:p.x+U.rand(-6,6), y:p.y+U.rand(-6,6), vx:U.rand(-6,6), vy:U.rand(-4,10),
           life:.9, r:G.cell*.06, col:'#e0f7ff'});
  },
  eat(x,y,G,sp,burst){ burst(x,y,20,'#a5f3fc',1); ring(x,y,'#e0f7ff',.5); }
},
{
  id:'crystal', name:'Crystal Snake', rarity:'epic', price:1200, icon:'💠',
  desc:'Faceted gemstone that refracts a different colour every segment.',
  unlock:{type:'coins'},
  glow:{col:'#e879f9', mul:1.25},
  aura:()=>'hsla(292 95% 70% / .32)',
  body(i,t,n,G){
    const facet = i % 4;
    const l = [72, 48, 62, 38][facet];
    return hsl(285 + facet*16 + 20*Math.sin(G.t*.8 + i*.05), 92, l - 10*t);
  },
  headFill(ctx,hr){
    const g = ctx.createLinearGradient(-hr,-hr,hr,hr);
    g.addColorStop(0,'#ffffff'); g.addColorStop(.4,'#f0abfc'); g.addColorStop(1,'#7e22ce');
    return g;
  },
  head(ctx,hr){
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = Math.max(1,hr*.09);
    ctx.beginPath();
    ctx.moveTo(-hr*.7,0); ctx.lineTo(0,-hr*.7); ctx.lineTo(hr*.7,0); ctx.lineTo(0,hr*.7); ctx.closePath();
    ctx.stroke();
  },
  eyes:{col:'#ffffff', pupil:'#581c87', glow:true, size:.9},
  tail:{taper:.44},
  trail(G){
    if(Math.random() > .25) return;
    const p = tailPoint(G);
    spark({x:p.x, y:p.y, vx:U.rand(-14,14), vy:U.rand(-14,14), life:.5,
           r:G.cell*.07, col: U.pick(['#f0abfc','#c4b5fd','#ffffff'])});
  }
},
{
  id:'lightning', name:'Lightning Snake', rarity:'epic', price:1800, icon:'⚡',
  desc:'Barely contained voltage — arcs crackle along the body.',
  unlock:{type:'coins'},
  glow:{col:'#fde047', mul:1.4},
  aura:G=>`hsla(52 100% ${60+18*Math.random()}% / .36)`,
  body(i,t,n,G){
    const strobe = Math.pow(Math.max(0, Math.sin(i*.6 - G.t*14)), 6);
    return hsl(50 + 8*strobe, 100, 46 + 46*strobe - 14*t);
  },
  headFill(ctx,hr){
    const g = ctx.createRadialGradient(-hr*.2,-hr*.25,hr*.08,0,0,hr);
    g.addColorStop(0,'#ffffff'); g.addColorStop(.45,'#fde047'); g.addColorStop(1,'#a16207');
    return g;
  },
  overlay(ctx, pts, w, G){
    if(pts.length < 8 || Math.random() > .5) return;
    const i = 2 + ((Math.random()*(pts.length-6))|0);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.lineWidth = Math.max(1, w*.16);
    ctx.shadowColor = '#fde047'; ctx.shadowBlur = G.cell;
    ctx.beginPath();
    ctx.moveTo(pts[i].x, pts[i].y);
    for(let k=1;k<4 && i+k<pts.length;k++){
      ctx.lineTo(pts[i+k].x + U.rand(-w*.5,w*.5), pts[i+k].y + U.rand(-w*.5,w*.5));
    }
    ctx.stroke();
    ctx.restore();
  },
  eyes:{col:'#fffbeb', pupil:'#422006', glow:true},
  tail:{taper:.5},
  trail(G){
    if(Math.random() > .2) return;
    const p = tailPoint(G);
    spark({x:p.x, y:p.y, vx:U.rand(-30,30), vy:U.rand(-30,30), life:.25,
           r:G.cell*.06, col:'#fef9c3'});
  },
  eat(x,y,G,sp,burst){ burst(x,y,26,'#fde047',1.2,true); }
},
{
  id:'emerald', name:'Emerald Snake', rarity:'rare', price:600, icon:'💚',
  desc:'Deep jade with a golden sheen sliding along its length.',
  unlock:{type:'coins'},
  glow:{col:'#34d399', mul:1.1},
  aura:()=>'hsla(158 90% 50% / .3)',
  body(i,t,n,G){
    const sheen = Math.pow(Math.max(0, Math.sin(i*.12 - G.t*1.6)), 8);
    return sheen > .25
      ? hsl(48, 92, 58 + 14*sheen)
      : hsl(156 + 10*Math.sin(i*.1), 82, 34 + 14*(1-t));
  },
  headFill(ctx,hr){
    const g = ctx.createRadialGradient(-hr*.2,-hr*.3,hr*.1,0,0,hr);
    g.addColorStop(0,'#d1fae5'); g.addColorStop(.5,'#10b981'); g.addColorStop(1,'#064e3b');
    return g;
  },
  eyes:{col:'#fef3c7', pupil:'#064e3b', slit:true},
  tail:{taper:.42}
},
{
  id:'obsidian', name:'Obsidian Snake', rarity:'legendary', price:2800, icon:'🌑',
  desc:'Cooled volcanic glass with magma still glowing in the cracks.',
  unlock:{type:'coins'},
  glow:{col:'#f43f5e', mul:.9},
  aura:()=>'hsla(348 90% 50% / .22)',
  body(i,t,n,G){
    const crack = Math.pow(Math.max(0, Math.sin(i*.45 - G.t*2.4)), 6);
    return crack > .1 ? hsl(12, 100, 30 + 40*crack) : hsl(260, 18, 9 + 6*(1-t));
  },
  headFill(ctx,hr){
    const g = ctx.createRadialGradient(-hr*.2,-hr*.3,hr*.1,0,0,hr);
    g.addColorStop(0,'#4b5563'); g.addColorStop(.6,'#18181b'); g.addColorStop(1,'#0a0a0a');
    return g;
  },
  head(ctx,hr,G){
    ctx.strokeStyle = `rgba(244,63,94,${.5+.4*Math.sin(G.t*4)})`;
    ctx.lineWidth = Math.max(1,hr*.1);
    ctx.beginPath();
    ctx.moveTo(-hr*.6,-hr*.3); ctx.lineTo(-hr*.1,0); ctx.lineTo(-hr*.5,hr*.35);
    ctx.stroke();
  },
  eyes:{col:'#fb7185', pupil:'#450a0a', glow:true, size:.85},
  tail:{taper:.4},
  trail(G){
    if(Math.random() > .18) return;
    const p = tailPoint(G);
    spark({x:p.x, y:p.y, vx:U.rand(-6,6), vy:U.rand(-16,-4), life:.5,
           r:G.cell*.05, col:'#f43f5e'});
  }
},
{
  id:'rainbow', name:'Rainbow Snake', rarity:'mythic', price:4000, icon:'🎨',
  desc:'The whole spectrum at speed. Loud, proud, impossible to miss.',
  unlock:{type:'level', v:20},
  glow:{col:'#f472b6', mul:1.3},
  aura:G=>hsl((G.t*180)%360, 100, 62, .34),
  body(i,t,n,G){ return hsl((i*9 + G.t*200) % 360, 100, 60 - 12*t); },
  headFill(ctx,hr,G){
    const g = ctx.createLinearGradient(-hr,-hr,hr,hr);
    g.addColorStop(0, hsl((G.t*200)%360,100,72));
    g.addColorStop(.5, hsl((G.t*200+90)%360,100,58));
    g.addColorStop(1, hsl((G.t*200+180)%360,100,46));
    return g;
  },
  eyes:{col:'#ffffff', pupil:'#111827'},
  tail:{taper:.45},
  trail(G){
    if(Math.random() > .4) return;
    const p = tailPoint(G);
    spark({x:p.x, y:p.y, vx:U.rand(-12,12), vy:U.rand(-12,12), life:.6,
           r:G.cell*.08, col: hsl((G.t*260)%360,100,62)});
  },
  eat(x,y,G,sp,burst){
    for(let k=0;k<5;k++) burst(x,y,6, hsl((G.t*200+k*72)%360,100,62), 1);
  }
},
{
  id:'shadow', name:'Shadow Snake', rarity:'legendary', price:3000, icon:'🕳️',
  desc:'More absence than snake. Trails smoke and swallows light.',
  unlock:{type:'coins'},
  glow:{col:'#6d28d9', mul:.85},
  aura:()=>'hsla(268 80% 40% / .3)',
  body(i,t,n,G){
    return `hsla(${266 + 14*Math.sin(i*.1+G.t)} 60% ${26 - 12*t}% / ${.92 - .45*t})`;
  },
  headFill(ctx,hr){
    const g = ctx.createRadialGradient(-hr*.2,-hr*.3,hr*.1,0,0,hr);
    g.addColorStop(0,'#a78bfa'); g.addColorStop(.5,'#4c1d95'); g.addColorStop(1,'#0b0616');
    return g;
  },
  eyes:{col:'#c4b5fd', pupil:'#1e1b4b', slit:true, glow:true},
  tail:{taper:.72},
  trail(G){
    if(Math.random() > .5) return;
    const p = tailPoint(G);
    spark({x:p.x+U.rand(-5,5), y:p.y+U.rand(-5,5), vx:U.rand(-4,4), vy:U.rand(-10,-2),
           life:1.0, r:G.cell*.14, col:'rgba(109,40,217,.55)'});
  }
},
{
  id:'gold', name:'Gold Snake', rarity:'epic', price:1500, icon:'👑',
  desc:'Solid bullion with a specular highlight that rolls as you turn.',
  unlock:{type:'level', v:8},
  glow:{col:'#fbbf24', mul:1.25},
  aura:()=>'hsla(45 100% 58% / .34)',
  body(i,t,n,G){
    const spec = Math.pow(Math.max(0, Math.sin(i*.16 - G.t*1.1)), 5);
    return hsl(44 + 6*spec, 92, 40 + 44*spec - 12*t);
  },
  headFill(ctx,hr){
    const g = ctx.createLinearGradient(-hr,-hr,hr,hr);
    g.addColorStop(0,'#fffbeb'); g.addColorStop(.45,'#fbbf24'); g.addColorStop(1,'#92400e');
    return g;
  },
  head(ctx,hr){
    ctx.fillStyle = '#fff7d6';                       // small crown
    ctx.beginPath();
    ctx.moveTo(-hr*.2,-hr*.55); ctx.lineTo(-hr*.75,-hr*.95); ctx.lineTo(-hr*.7,-hr*.2);
    ctx.lineTo(-hr*.75,hr*.95); ctx.lineTo(-hr*.2,hr*.55); ctx.closePath();
    ctx.fill();
  },
  eyes:{col:'#fffbeb', pupil:'#78350f'},
  tail:{taper:.4},
  trail(G){
    if(Math.random() > .22) return;
    const p = tailPoint(G);
    spark({x:p.x, y:p.y, vx:U.rand(-8,8), vy:U.rand(-8,8), life:.55,
           r:G.cell*.06, col:'#fde68a'});
  },
  eat(x,y,G,sp,burst){ burst(x,y,20,'#fbbf24',1.15,true); }
},
{
  id:'ocean', name:'Ocean Snake', rarity:'common', price:400, icon:'🌊',
  desc:'A rolling swell of blue-green with a stream of rising bubbles.',
  unlock:{type:'coins'},
  glow:{col:'#0ea5e9', mul:1.15},
  aura:()=>'hsla(196 95% 55% / .32)',
  body(i,t,n,G){
    const wave = Math.sin(i*.16 - G.t*2.6);
    return hsl(192 + 22*wave, 92, 46 + 14*wave - 12*t);
  },
  headFill(ctx,hr){
    const g = ctx.createRadialGradient(-hr*.2,-hr*.3,hr*.1,0,0,hr);
    g.addColorStop(0,'#cffafe'); g.addColorStop(.5,'#0ea5e9'); g.addColorStop(1,'#0c4a6e');
    return g;
  },
  eyes:{col:'#ecfeff', pupil:'#082f49'},
  tail:{taper:.5},
  trail(G){
    if(Math.random() > .3) return;
    const p = tailPoint(G);
    spark({x:p.x+U.rand(-5,5), y:p.y, vx:U.rand(-3,3), vy:U.rand(-26,-12),
           life:.8, r:G.cell*U.rand(.04,.09), col:'rgba(207,250,254,.85)'});
  }
},
{
  id:'forest', name:'Forest Snake', rarity:'common', price:400, icon:'🌿',
  desc:'Moss and bark, shedding leaves as it winds through the grid.',
  unlock:{type:'coins'},
  glow:{col:'#65a30d', mul:1},
  aura:()=>'hsla(88 70% 45% / .3)',
  body(i,t,n,G){
    const bark = (i % 6 < 2);
    return bark ? hsl(28, 42, 30 - 8*t) : hsl(96 + 16*Math.sin(i*.14+G.t*.6), 68, 40 - 10*t);
  },
  headFill(ctx,hr){
    const g = ctx.createRadialGradient(-hr*.2,-hr*.3,hr*.1,0,0,hr);
    g.addColorStop(0,'#ecfccb'); g.addColorStop(.5,'#65a30d'); g.addColorStop(1,'#1a2e05');
    return g;
  },
  head(ctx,hr){
    ctx.fillStyle = '#4d7c0f';                        // little leaf
    ctx.beginPath();
    ctx.ellipse(-hr*.75, -hr*.55, hr*.42, hr*.2, -0.7, 0, 6.2832);
    ctx.fill();
  },
  eyes:{col:'#fef9c3', pupil:'#1a2e05', slit:true},
  tail:{taper:.44},
  trail(G){
    if(Math.random() > .12) return;
    const p = tailPoint(G);
    spark({x:p.x, y:p.y, vx:U.rand(-10,10), vy:U.rand(-6,6), life:1.1,
           r:G.cell*.09, col: U.pick(['#a3e635','#65a30d','#ca8a04'])});
  }
},
{
  id:'samurai', name:'Samurai Snake', rarity:'epic', price:1500, icon:'⚔️',
  desc:'Lacquered white armour banded in crimson, crowned with a war crest.',
  unlock:{type:'coins'},
  glow:{col:'#f43f5e', mul:1.05},
  aura:()=>'hsla(350 90% 60% / .28)',
  body(i,t,n,G){
    const band = (i % 7 < 2);
    return band ? hsl(350, 88, 46) : hsl(220, 12, 88 - 22*t);
  },
  headFill(ctx,hr){
    const g = ctx.createRadialGradient(-hr*.2,-hr*.3,hr*.1,0,0,hr);
    g.addColorStop(0,'#ffffff'); g.addColorStop(.6,'#e5e7eb'); g.addColorStop(1,'#6b7280');
    return g;
  },
  head(ctx,hr){
    ctx.fillStyle = '#e11d48';                        // maedate crest
    ctx.beginPath();
    ctx.moveTo(-hr*.1,-hr*.15);
    ctx.quadraticCurveTo(-hr*1.5,-hr*1.1,-hr*.35,-hr*1.15);
    ctx.quadraticCurveTo(-hr*.55,-hr*.55,-hr*.05,hr*.05);
    ctx.fill();
    ctx.fillStyle = 'rgba(17,24,39,.6)';
    ctx.fillRect(hr*.25,-hr*.5,hr*.16,hr*1.0);
  },
  eyes:{col:'#fff1f2', pupil:'#881337', slit:true},
  tail:{taper:.46}
},
{
  id:'mech', name:'Mechanical Snake', rarity:'rare', price:900, icon:'⚙️',
  desc:'Industrial segments bolted together over a glowing hydraulic spine.',
  unlock:{type:'coins'},
  glow:{col:'#fb923c', mul:1},
  aura:()=>'hsla(28 90% 55% / .26)',
  body(i,t,n,G){
    const seam = (i % 3 === 0);
    return seam ? hsl(28, 95, 52) : hsl(215, 10, 44 - 12*t);
  },
  headFill(ctx,hr){
    const g = ctx.createLinearGradient(-hr,-hr,hr,hr);
    g.addColorStop(0,'#e5e7eb'); g.addColorStop(.5,'#9ca3af'); g.addColorStop(1,'#374151');
    return g;
  },
  head(ctx,hr){
    ctx.fillStyle = 'rgba(31,41,55,.75)';
    ctx.fillRect(-hr*.15,-hr*.75,hr*.3,hr*1.5);       // spine plate
    ctx.fillStyle = '#fb923c';
    ctx.beginPath(); ctx.arc(-hr*.5,0,hr*.16,0,6.2832); ctx.fill();
  },
  eyes:{col:'#fdba74', pupil:'#1f2937', glow:true, size:.86},
  tail:{taper:.34},
  trail(G){
    if(Math.random() > .12) return;
    const p = tailPoint(G);
    spark({x:p.x, y:p.y, vx:U.rand(-18,18), vy:U.rand(-10,10), life:.3,
           r:G.cell*.05, col:'#fb923c'});
  }
},
{
  id:'robot', name:'Robot Snake', rarity:'rare', price:900, icon:'🦾',
  desc:'Polished chassis, single scanning visor, antenna blinking on top.',
  unlock:{type:'coins'},
  glow:{col:'#60a5fa', mul:1.1},
  aura:()=>'hsla(214 95% 65% / .3)',
  body(i,t,n,G){
    const scan = Math.pow(Math.max(0,Math.sin(i*.2 - G.t*3.2)), 8);
    return hsl(212, 26 + 40*scan, 52 + 30*scan - 14*t);
  },
  headFill(ctx,hr){
    const g = ctx.createLinearGradient(0,-hr,0,hr);
    g.addColorStop(0,'#f8fafc'); g.addColorStop(.55,'#94a3b8'); g.addColorStop(1,'#334155');
    return g;
  },
  head(ctx,hr,G){
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = Math.max(1,hr*.1);
    ctx.beginPath(); ctx.moveTo(-hr*.35,0); ctx.lineTo(-hr*1.15,-hr*.15); ctx.stroke();
    ctx.fillStyle = `rgba(96,165,250,${.5+.5*Math.abs(Math.sin(G.t*4))})`;
    ctx.beginPath(); ctx.arc(-hr*1.2,-hr*.18,hr*.17,0,6.2832); ctx.fill();
  },
  eyes:{
    draw(ctx,hr,bl,G){
      const h = Math.max(hr*.06, hr*.4*(1-bl));
      ctx.save();
      ctx.shadowColor = '#60a5fa'; ctx.shadowBlur = hr*1.1;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(hr*.05,-hr*.62, hr*.42, hr*1.24);
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(hr*.14,-h*.5*1.6, hr*.24, h*1.6);
      ctx.restore();
    }
  },
  tail:{taper:.3}
},
{
  id:'ghost', name:'Ghost Snake', rarity:'legendary', price:3200, icon:'👻',
  desc:'Half here, half elsewhere. The tail dissolves into nothing.',
  unlock:{type:'coins'},
  glow:{col:'#cbd5e1', mul:1.2},
  aura:()=>'hsla(210 40% 92% / .22)',
  body(i,t,n,G){
    const a = (0.85 - 0.8*t) * (0.75 + 0.25*Math.sin(G.t*2 - i*.1));
    return `hsla(205 60% ${86 - 10*t}% / ${Math.max(0.04, a)})`;
  },
  headFill(ctx,hr){
    const g = ctx.createRadialGradient(-hr*.2,-hr*.3,hr*.1,0,0,hr);
    g.addColorStop(0,'rgba(255,255,255,.95)');
    g.addColorStop(.6,'rgba(203,213,225,.7)');
    g.addColorStop(1,'rgba(100,116,139,.35)');
    return g;
  },
  eyes:{col:'#0f172a', pupil:'#0f172a', size:.8},
  tail:{taper:.85},
  trail(G){
    if(Math.random() > .3) return;
    const p = tailPoint(G);
    spark({x:p.x+U.rand(-6,6), y:p.y+U.rand(-6,6), vx:U.rand(-4,4), vy:U.rand(-14,-4),
           life:1.1, r:G.cell*.12, col:'rgba(226,232,240,.4)'});
  }
},
{
  id:'phoenix', name:'Phoenix Snake', rarity:'mythic', price:5000, icon:'🔥',
  desc:'Reborn in flame. A crest of fire and a wake of burning feathers.',
  unlock:{type:'level', v:25},
  glow:{col:'#fb923c', mul:1.45},
  aura:G=>`hsla(${30+10*Math.sin(G.t*4)} 100% 62% / .4)`,
  body(i,t,n,G){
    const f = pong(G.t*2.2 + i*.1);
    return hsl(20 + 34*f - 10*t, 100, 48 + 26*f - 18*t);
  },
  headFill(ctx,hr){
    const g = ctx.createRadialGradient(-hr*.15,-hr*.25,hr*.06,0,0,hr);
    g.addColorStop(0,'#ffffff'); g.addColorStop(.35,'#fde047');
    g.addColorStop(.7,'#f97316'); g.addColorStop(1,'#b91c1c');
    return g;
  },
  head(ctx,hr,G){
    const f = pong(G.t*3);
    ctx.fillStyle = `rgba(253,224,71,${.65+.3*f})`;
    ctx.beginPath();                                   // fire crest
    ctx.moveTo(-hr*.1,-hr*.2);
    ctx.quadraticCurveTo(-hr*1.1,-hr*(1.0+.35*f),-hr*.35,-hr*1.25);
    ctx.quadraticCurveTo(-hr*.5,-hr*.6,-hr*.05,hr*.02);
    ctx.fill();
    ctx.fillStyle = `rgba(249,115,22,${.5+.3*f})`;
    ctx.beginPath();
    ctx.moveTo(-hr*.1,hr*.2);
    ctx.quadraticCurveTo(-hr*1.0,hr*(.9+.3*f),-hr*.3,hr*1.15);
    ctx.quadraticCurveTo(-hr*.45,hr*.55,-hr*.05,-hr*.02);
    ctx.fill();
  },
  eyes:{col:'#fffbeb', pupil:'#7c2d12', glow:true},
  tail:{taper:.66},
  trail(G){
    const p = tailPoint(G);
    spark({x:p.x+U.rand(-4,4), y:p.y+U.rand(-4,4), vx:U.rand(-14,14), vy:U.rand(-44,-18),
           life:U.rand(.4,.9), r:G.cell*U.rand(.05,.13),
           col: U.pick(['#fde047','#f97316','#fbbf24'])});
  },
  eat(x,y,G,sp,burst){
    burst(x,y,30,'#fbbf24',1.35,true);
    ring(x,y,'#fde047',.6);
  }
}
];

/* ================================ registry ================================ */
const byId = {};
SKINS.forEach(s => byId[s.id] = s);

const RARITY = {
  common:   {label:'COMMON',    col:'#94a3b8'},
  rare:     {label:'RARE',      col:'#38bdf8'},
  epic:     {label:'EPIC',      col:'#c084fc'},
  legendary:{label:'LEGENDARY', col:'#fbbf24'},
  mythic:   {label:'MYTHIC',    col:'#fb7185'}
};

const api = NS.skins = {
  list: SKINS,
  RARITY,
  get(id){ return byId[id] || byId.neon; },
  /* the core calls this every frame — keep it a cheap lookup */
  active(){
    const P = NS.profile;
    if(!P) return null;
    const s = byId[P.equipped('skin')];
    return (!s || s.id === 'neon') ? null : s;
  },
  activeId(){ return NS.profile ? NS.profile.equipped('skin') : 'neon'; },

  /* requirement text + whether the player currently meets it */
  requirement(skin){
    const u = skin.unlock || {type:'coins'};
    if(u.type === 'free')  return {met:true,  text:'Owned by default'};
    if(u.type === 'level') return {met:(NS.profile.data.plvl >= u.v), text:'Player level '+u.v};
    if(u.type === 'score') return {met:(NS.profile.data.stats.best >= u.v), text:U.num(u.v)+' best score'};
    return {met:true, text:''};
  },
  owned(id){ return NS.profile.owns('skin', id); },

  /* ---------------- shop / profile preview (S-curve of the skin) --------- */
  drawPreview(ctx, skin, w, h, time){
    const t = time===undefined ? (performance.now()/1000) : time;
    const fakeG = {t, cell: h*0.30, hueShift:0, snake:{pts:[]}};
    const pts = [];
    const n = 26;
    for(let k=0;k<n;k++){
      const u = k/(n-1);
      pts.push({
        x: w*0.86 - u*w*0.72,
        y: h*0.5 + Math.sin(u*5.0 + t*1.6)*h*0.20
      });
    }
    const bw = h*0.20;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    /* glow */
    ctx.shadowColor = skin.glow ? skin.glow.col : '#22d3ee';
    ctx.shadowBlur = h*0.16*(skin.glow ? (skin.glow.mul||1) : 1);
    ctx.strokeStyle = skin.aura ? skin.aura(fakeG) : 'hsla(190 96% 62% / .3)';
    ctx.lineWidth = bw*1.2;
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for(let k=1;k<n;k++) ctx.lineTo(pts[k].x, pts[k].y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    /* body */
    const taper = skin.tail ? skin.tail.taper : .42;
    for(let k=0;k<n-1;k++){
      const u = k/(n-1);
      ctx.beginPath();
      ctx.moveTo(pts[k].x, pts[k].y); ctx.lineTo(pts[k+1].x, pts[k+1].y);
      ctx.strokeStyle = skin.body ? skin.body(k*2, u, n*2, fakeG)
                                  : hsl(300 - ((t*24 + k*3.4)%300), 94, 62-16*u);
      ctx.lineWidth = bw*(1 - taper*Math.pow(u,1.5));
      ctx.stroke();
    }
    /* head */
    const hr = bw*0.63;
    ctx.save();
    ctx.translate(pts[0].x, pts[0].y);
    ctx.rotate(Math.atan2(pts[0].y-pts[1].y, pts[0].x-pts[1].x));
    ctx.shadowColor = skin.glow ? skin.glow.col : '#22d3ee';
    ctx.shadowBlur = h*0.14;
    ctx.fillStyle = skin.headFill ? skin.headFill(ctx, hr, fakeG)
                                  : hsl(300 - ((t*24)%300), 96, 62);
    ctx.beginPath(); ctx.arc(0,0,hr,0,6.2832); ctx.fill();
    ctx.shadowBlur = 0;
    if(skin.head) skin.head(ctx, hr, fakeG);
    const E = skin.eyes;
    if(E && E.draw) E.draw(ctx, hr, 0, fakeG);
    else {
      const er = hr*.28*((E && E.size) || 1);
      for(const s of [-1,1]){
        ctx.save(); ctx.translate(hr*.3, hr*.44*s);
        ctx.fillStyle = (E && E.col) || '#fff';
        ctx.beginPath(); ctx.arc(0,0,er,0,6.2832); ctx.fill();
        ctx.fillStyle = (E && E.pupil) || '#0a0a14';
        if(E && E.slit) ctx.fillRect(-er*.16,-er*.9,er*.32,er*1.8);
        else { ctx.beginPath(); ctx.arc(er*.3,0,er*.52,0,6.2832); ctx.fill(); }
        ctx.restore();
      }
    }
    ctx.restore();
    ctx.restore();
  }
};

/* ============================ live integration ============================= */
/* movement trail — throttled so long snakes never flood the particle pool */
let trailAcc = 0;
NS.on('tick', dt => {
  const G = C.G;
  if(!G || G.state !== 'play') return;
  const sk = api.active();
  if(!sk || !sk.trail) return;
  trailAcc += dt;
  if(trailAcc < 0.032) return;                 // ~30 emissions/sec max
  trailAcc = 0;
  sk.trail(G);
});

/* custom eating animation */
NS.on('eat', e => {
  const sk = api.active();
  if(!sk || !sk.eat || !C.burst) return;
  sk.eat(e.x, e.y, C.G, spark, C.burst);
});
})();
