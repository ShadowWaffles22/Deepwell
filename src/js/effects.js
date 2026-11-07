// ---------- item-use effects (visual only; no DOM, so the rules tests can load this) ----------
// Effects are pushed onto the shared FX list and drawn by graphics.js.
//   'e' particle emitter   'i' floating item icon   'pr' thrown flask   's' screen tint
// Particle positions are computed from time and a seed, so nothing is stored per particle.
const FXFLIGHT = 260; // how long a thrown flask is in the air (ms)

function fxEmit(o) {
  const e = Object.assign({ k: 'e', pat: 'rise', cols: ['#fff'], n: 14, life: 650, R: 1.4, stag: 0.45, size: 1, d: 0 }, o);
  e.t = now() + fxDelay + e.d;
  e.seed = (Math.random() * 1e9) | 0;
  e.dur = e.life * (1 + e.stag) + 80;
  fxPush(e);
}
function fxScreen(col, a, dur, d) { fxPush({ k: 's', col, a, t: now() + fxDelay + (d || 0), dur: dur || 450 }); }
function fxIcon(name, col, x, y, dur, d) { fxPush({ k: 'i', name, col, x, y, t: now() + fxDelay + (d || 0), dur: dur || 520 }); }

// ----- potions: one entry per potion index. pat = rise | burst | converge | ring | rain | swirl | pillar | streak -----
const PFX = [
  { pat: 'rise', cols: ['#7fe0a0', '#c8ffd8'], ch: '+', n: 12 },                                   // Mend
  { pat: 'streak', cols: ['#ffe28a', '#ffffff'], n: 12, life: 520 },                              // Haste
  { pat: 'burst', cols: ['#ff8a3d', '#ffd36b', '#ff5a2a'], n: 26, R: 1.8, ring: ['#ff8a3d', 1.6], screen: ['#ff8a3d', 0.18] }, // Embers
  { pat: 'burst', cols: ['#8fe0f0', '#e8f8ff'], n: 22, R: 1.7, screen: ['#8fe0f0', 0.2] },        // Rime
  { pat: 'rain', cols: ['#3a2a12', '#6a5528', '#241a0e'], n: 16, R: 1.2 },                        // Slick
  { pat: 'burst', cols: ['#f5ec7a', '#ffffff'], n: 22, R: 1.5, life: 380, screen: ['#fff7b0', 0.35] }, // Static
  { pat: 'swirl', cols: ['#4a4f66', '#2a2e40', '#6a7090'], n: 20, R: 1.5, size: 1.8, life: 800 },   // Murk
  { pat: 'rise', cols: ['#ff6a5a', '#ffb08a'], ch: '^', n: 12 },                                   // Might
  { pat: 'ring', cols: ['#ffffff', '#cfe8ff'], n: 32, R: 6.5, life: 950 },                          // Farsight
  { pat: 'rise', cols: ['#a0e070', '#6a9a3a'], n: 14 },                                             // Bane
  { pat: 'swirl', cols: ['#b394e8', '#e0d0ff'], n: 22, R: 1.5 },                                    // Levity
  { pat: 'rain', cols: ['#8a93a8', '#5a6070', '#b0b8c8'], n: 16, R: 1.1, size: 1.6 },               // Basalt
  { pat: 'burst', cols: ['#ff8a3d', '#ffd36b', '#ffffff'], n: 46, R: 3.2, life: 800, ring: ['#ffd36b', 3], screen: ['#ff9a4a', 0.4] }, // Phoenix
  { pat: 'converge', cols: ['#6a4a9a', '#1a1030', '#b394e8'], n: 28, R: 3, ring: ['#6a4a9a', 2.4], screen: ['#1a1030', 0.35] },      // Void
  { pat: 'ring', cols: ['#9fd0ff', '#ffffff'], n: 24, R: 2.2, echo: true },                         // Echo
  { pat: 'ring', cols: ['#e8e0cc', '#f0c040'], n: 28, R: 2.6, life: 900 },                          // Chrono
  { pat: 'rain', cols: ['#6fc3f0', '#2f6ea8', '#cfeaff'], n: 28, R: 2.2 },                          // Tide
  { pat: 'burst', cols: ['#a0e070', '#ff8a3d'], n: 22, R: 1.6 },                                    // Caustic
  { pat: 'converge', cols: ['#8a93a8', '#d9dce6'], n: 22, R: 4 },                                   // Lodestone
  { pat: 'converge', cols: ['#e0505a', '#b394e8'], n: 22, R: 4, from: true },                        // Siphon
  { pat: 'rain', cols: ['#8a6040', '#c08a4a'], n: 16, R: 1.1 },                                     // Corrode
  { pat: 'burst', cols: ['#f2f6ff', '#aab8d0'], n: 26, R: 3, life: 520 },                           // Gale
  { pat: 'rise', cols: ['#9fc0ff', '#e0ecff'], n: 18, ring: ['#9fc0ff', 1.6] },                     // Thrall
  { pat: 'rise', cols: ['#ffd36b', '#fff0a0'], ch: '*', n: 16 }                                     // Fortune
];
function fxPotionAt(k, x, y, big) {
  const col = potCol(k)[1], s = PFX[k] || { pat: 'rise', cols: [col, '#fff'] };
  const e = Object.assign({}, s, { x, y, cols: s.cols });
  if (big) { e.R = (s.R || 1.4) * 1.15; e.n = Math.round((s.n || 14) * 1.3); }
  if (s.from) { e.from = visMons().map(m => [m.x, m.y]); if (!e.from.length) delete e.from; }
  delete e.ring; delete e.screen; delete e.echo;
  fxEmit(Object.assign(e, { d: 160 }));
  if (s.ring) fxEmit({ x, y, pat: 'ring', cols: [s.ring[0], '#fff'], n: 26, R: s.ring[1], life: 600, d: 160 });
  if (s.echo) for (let i = 1; i <= 2; i++) fxEmit({ x, y, pat: 'ring', cols: s.cols, n: 24, R: 2.2 + i * 0.8, life: 600, d: 160 + i * 220 });
  if (s.screen) fxScreen(s.screen[0], s.screen[1], 500, 160);
}
function fxDrink(k, p) {
  const P = G.p, col = potCol(k)[1];
  fxIcon('pot', col, P.x, P.y, 520);
  fxPotionAt(k, P.x, P.y, p >= 3);
}
function fxThrow(x0, y0, x1, y1, k) {
  fxPush({ k: 'pr', x: x0, y: y0, x1, y1, name: 'pot', col: potCol(k)[1], t: now(), dur: FXFLIGHT });
}
function fxSplashFx(k, p, x, y) {
  const col = potCol(k)[1];
  fxPotionAt(k, x, y, true);
  fxEmit({ x, y, pat: 'burst', cols: [col, '#fff'], n: 14, R: 1.2, life: 420 });
}
function fxMix(a, b, r) {
  const P = G.p, ca = potCol(a)[1], cb = potCol(b)[1], cr = potCol(r)[1];
  fxEmit({ x: P.x, y: P.y, pat: 'converge', cols: [ca], n: 10, R: 1.7, life: 480, stag: 0.3 });
  fxEmit({ x: P.x, y: P.y, pat: 'converge', cols: [cb], n: 10, R: 1.7, life: 480, stag: 0.3 });
  fxEmit({ x: P.x, y: P.y, pat: 'burst', cols: [cr, '#fff'], n: 22, R: 1.5, life: 600, d: 480 });
  fxEmit({ x: P.x, y: P.y, pat: 'rise', cols: [cr, '#fff'], n: 10, d: 480 });
  fxIcon('pot', cr, P.x, P.y, 560, 480);
}
// ----- scrolls: one entry per scroll index -----
const SFX = [
  { pat: 'swirl', cols: ['#b394e8', '#e0d0ff'], n: 22, R: 1.5, arrive: true },                        // Warp
  { pat: 'ring', cols: ['#7fe0a0', '#c8ffd8'], n: 32, R: 7, life: 950 },                              // Chart
  { pat: 'burst', cols: ['#6a1020', '#e0505a'], n: 28, R: 3, screen: ['#6a1020', 0.3] },             // Dread
  { pat: 'rise', cols: ['#ffb060', '#ffffff'], ch: '^', n: 14 },                                      // Temper
  { pat: 'rise', cols: ['#7fb0ff', '#ffffff'], ch: '^', n: 14 },                                      // Bulwark
  { pat: 'burst', cols: ['#2a1040', '#8a5fd0'], n: 22, R: 2.2 },                                      // Summons
  { pat: 'rain', cols: ['#ffd36b', '#fff0a0'], n: 18, R: 1.2, arrive: true },                         // Plumb
  { pat: 'burst', cols: ['#f5ec7a', '#ffffff'], n: 34, R: 4.2, life: 400, screen: ['#fff7b0', 0.55] }, // Thunderclap
  { pat: 'rise', cols: ['#ffd36b', '#ffffff'], ch: '*', n: 14 },                                      // Identify
  { pat: 'rise', cols: ['#ffffff', '#cfe8ff'], n: 16 },                                              // Anathema
  { pat: 'burst', cols: ['#ff8a3d', '#ffd36b', '#ff4a1a'], n: 30, R: 2.4, ring: ['#ff8a3d', 2.2] },  // Pyre
  { pat: 'ring', cols: ['#ffe8a0', '#ffffff'], n: 30, R: 2.6, life: 900 },                            // Sanctum
  { pat: 'rise', cols: ['#9fc0ff', '#e0ecff'], n: 18, ring: ['#9fc0ff', 1.8] },                       // Legion
  { pat: 'converge', cols: ['#e0505a', '#7a1020'], n: 20, R: 1.9, screen: ['#7a1020', 0.2] },        // Tithe
  { pat: 'rise', cols: ['#6fe0f0', '#c8faff'], ch: '+', n: 16 }                                       // Recharge
];
function fxRead(k, ox, oy) {
  const P = G.p, s = SFX[k] || { pat: 'rise', cols: ['#e8dcb0', '#fff'] };
  fxIcon('scr', '#e8dcb0', ox, oy, 520);
  fxEmit({ x: ox, y: oy, pat: 'rise', cols: ['#e8dcb0', '#fff'], n: 8, R: 1, life: 450 });
  const moved = s.arrive && (P.x !== ox || P.y !== oy);
  const at = moved ? [ox, oy] : [P.x, P.y];
  fxEmit({ x: at[0], y: at[1], pat: s.pat, cols: s.cols, ch: s.ch, n: s.n, R: s.R, life: s.life, d: 180 });
  if (s.ring) fxEmit({ x: at[0], y: at[1], pat: 'ring', cols: [s.ring[0], '#fff'], n: 26, R: s.ring[1], life: 600, d: 180 });
  if (s.screen) fxScreen(s.screen[0], s.screen[1], 500, 180);
  if (moved) fxEmit({ x: P.x, y: P.y, pat: 'burst', cols: s.cols, n: 18, R: 1.4, life: 500, d: 420 });
}
// ----- everything else you can use -----
function fxFood() {
  const P = G.p;
  fxIcon('food', '#c98a4a', P.x, P.y, 520);
  fxEmit({ x: P.x, y: P.y, pat: 'burst', cols: ['#c98a4a', '#e8c080', '#8a5a2a'], n: 12, R: 0.9, life: 420, d: 200 });
  fxEmit({ x: P.x, y: P.y, pat: 'rise', cols: ['#ffb08a', '#ffffff'], ch: '+', n: 5, d: 260 });
}
function fxEquip(kind) {
  const P = G.p;
  const spec = { wpn: ['wpn', '#c8d0dc', 'burst', ['#ffffff', '#c8d0dc'], 0.9], arm: ['arm', '#98a4b8', 'ring', ['#98a4b8', '#ffffff'], 1.1], ring: ['ring', '#e8c060', 'ring', ['#ffd36b', '#fff0a0'], 1.2] }[kind];
  fxIcon(spec[0], spec[1], P.x, P.y, 500);
  fxEmit({ x: P.x, y: P.y, pat: spec[2], cols: spec[3], n: 14, R: spec[4], life: 420, d: 200 });
}
function fxBolt(x0, y0, x1, y1, col, kind) {
  fxEmit({ x: x0, y: y0, pat: 'burst', cols: [col, '#fff'], n: 8, R: 0.7, life: 300 });
  const cols = kind === 5 ? ['#e07ac8', '#7fe0a0', '#ffd36b', '#7fb0ff'] : [col, '#fff'];
  if (kind === 7) fxEmit({ x: x1, y: y1, pat: 'rain', cols: ['#8a6040', '#c0a070'], n: 14, R: 1.2, d: 120 });
  else if (kind === 4 || kind === 8) { fxEmit({ x: x1, y: y1, pat: 'swirl', cols, n: 16, R: 1.2, d: 120 }); fxEmit({ x: x0, y: y0, pat: 'swirl', cols, n: 14, R: 1.1, d: 120 }); }
  else if (kind === 6) fxEmit({ x: x1, y: y1, pat: 'rise', cols: ['#b394e8', '#fff'], ch: '+', n: 10, d: 120 });
  else fxEmit({ x: x1, y: y1, pat: 'burst', cols, n: 18, R: 1.2, life: 480, d: 120 });
}
function fxOffer(x, y, mood) {
  if (mood > 0) { fxEmit({ x, y, pat: 'pillar', cols: ['#ffd36b', '#fff0a0', '#ffffff'], n: 34, R: 3.4, life: 950 }); fxScreen('#ffe8a0', 0.25, 600); }
  else if (mood < 0) { fxEmit({ x, y, pat: 'burst', cols: ['#e0505a', '#3a1020', '#000000'], n: 26, R: 1.9, life: 600 }); fxScreen('#7a1020', 0.3, 600); }
  else fxEmit({ x, y, pat: 'rise', cols: ['#aab3d0', '#ffffff'], n: 10 });
}
function fxFountainFx(x, y, col) {
  fxEmit({ x, y, pat: 'burst', cols: [col, '#ffffff'], n: 20, R: 1.3, life: 520 });
  fxEmit({ x, y, pat: 'rain', cols: [col, '#ffffff'], n: 14, R: 1.4, d: 150 });
}

// ---------- attack animations ----------
// Per-actor animation state lives in a WeakMap so it never ends up in a save file.
const ANIM = new WeakMap();
function anim(a) { let s = ANIM.get(a); if (!s) { s = {}; ANIM.set(a, s); } return s; }
function animHurt(t) { if (!t) return; anim(t).hurt = now() + fxDelay; if (MP.co && MP.host) fxPush({ k: 'hr', x: t.x, y: t.y, t: now() + fxDelay, dur: 60 }); }
const ATKDUR = 260;
const WSTYLE = { dagger: 'stab', sword: 'slash', axe: 'sweep', spear: 'thrust', mace: 'smash' };
const WCOL = { dagger: '#e8f0ff', sword: '#ffffff', axe: '#ffd0a0', spear: '#e8f0ff', mace: '#ffe8a0' };
const MSTYLE = {
  rat: 'bite', slime: 'smash', leech: 'bite', wisp: 'zap', bomber: 'smash', mite: 'bite', mimic: 'bite', golem: 'smash',
  wraith: 'claw', warden: 'smash', thief: 'stab', troll: 'smash', spore: 'zap', necro: 'claw', thrall: 'slash', drake: 'bite',
  gazer: 'zap', wolf: 'claw', lurker: 'bite', warlock: 'zap', jugg: 'smash', pyrelord: 'fire', bat: 'bite', viper: 'bite', hound: 'bite', brute: 'smash', rimesprite: 'zap', ghoul: 'claw', sentinel: 'zap'
};
const MSCOL = { wisp: '#cfe8ff', spore: '#c8f0a0', gazer: '#f0e070', warlock: '#e07ac8', pyrelord: '#ff8a3d', drake: '#ffd0a0', wraith: '#c8b0ff', necro: '#b394e8' };
// from: attacker, to: target actor (or a tile {x,y}); style picks the swing drawn on the target
function fxAttack(from, to, style, col, amp) {
  const dx = Math.sign(to.x - from.x), dy = Math.sign(to.y - from.y);
  const s = anim(from); s.atk = { t: now() + fxDelay, dx, dy, amp: amp == null ? 0.42 : amp };
  fxPush({ k: 'sl', x: to.x, y: to.y, ox: from.x, oy: from.y, dx, dy, amp: s.atk.amp, style, col: col || '#fff', t: now() + fxDelay + 70, dur: ATKDUR + 40 });
  const burst = style === 'smash' || style === 'fire' ? 9 : 5;
  fxEmit({ x: to.x, y: to.y, pat: 'burst', cols: [col || '#fff', '#fff'], n: burst, R: style === 'smash' ? 1.0 : 0.6, life: 300, stag: 0.1, d: 90 });
}
function fxMeleeP(m) { const w = G.p.wpn.w; fxAttack(G.p, m, WSTYLE[w] || 'slash', WCOL[w] || '#fff'); }
function fxMeleeM(m) { const k = m.k; fxAttack(m, G.p, MSTYLE[k] || 'slash', MSCOL[k] || '#ffffff'); }
// ranged / spell attacks: small recoil plus a bolt that travels
function fxShoot(m, tx, ty, col) {
  const s = anim(m); s.atk = { t: now() + fxDelay, dx: -Math.sign(tx - m.x), dy: -Math.sign(ty - m.y), amp: 0.18 };
  fxPush({ k: 'pb', x: m.x, y: m.y, x1: tx, y1: ty, col, t: now() + fxDelay, dur: 200 });
  fxEmit({ x: tx, y: ty, pat: 'burst', cols: [col, '#fff'], n: 7, R: 0.7, life: 300, stag: 0.1, d: 190 });
}

// one color per role (sprites live in graphics.js)
const ROLECOL={wanderer:'#d9dce6',brawler:'#e0a47a',lancer:'#a8c0d8',pyre:'#ff9a5a',alchemist:'#8fd8a0',scholar:'#b8a0e8',ghost:'#b8c4d8',artificer:'#e8c060',oracle:'#9fd0f0',warden2:'#8a98b8',duelist:'#e8e0d0',mender:'#a8f0c0',stormer:'#f5ec7a',reaper:'#8a8aa8',beast:'#c89a6a'};
