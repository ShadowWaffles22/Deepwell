// ---------- multiplayer core (no DOM, so the rules tests can load it) ----------
// CO-OP: one host runs the real game. Every player has their own pack, perks, hunger and statuses
//   (a "context" that is swapped into G while that player acts). Anyone can act at any time, and
//   every action ticks the whole world. Guests send commands and receive snapshots.
// RACE: everybody runs their own game on the same seed and shares a scoreboard.
// The transport (WebRTC room codes, same-device tabs) lives in net.js and only has to provide
// MP.sendTo(i,string) / MP.sendHost(obj) / MP.sendProg(obj).
const CTXF = ['p', 'inv', 'perks', 'kills', 'stats', 'sense', 'windUsed', 'pending', 'kit', 'fortune', 'dt'];
const MAXCO = 4, MAXRACE = 8;

// ----- player contexts -----
function mpSwapOut(pl) { for (const f of CTXF) pl[f] = G[f]; }
function mpSwapIn(pl) { for (const f of CTXF) G[f] = pl[f]; }
function mpAs(i, fn) {
  if (!MP.co || MP.cur === i) return fn();
  const out = MP.cur, a = MP.players[out], b = MP.players[i];
  mpSwapOut(a); mpSwapIn(b); MP.cur = i;
  try { return fn(); } finally { mpSwapOut(b); mpSwapIn(a); MP.cur = out; }
}
function mpFlush() { if (MP.co && MP.players[MP.cur]) mpSwapOut(MP.players[MP.cur]); }
function mpPlayerAt(x, y) {
  const P = G.p;
  for (const pl of MP.players) { const q = pl.p; if (q && q !== P && !pl.gone && !q.down && q.x === x && q.y === y) return q; }
  return null;
}
function mpMonTurn(m) {
  if (!MP.co || m.ally) { monTurn(m); return; }
  let best = -1, bd = 1e9;
  for (const pl of MP.players) {
    const p = pl.p; if (!p || p.down || pl.gone) continue;
    const d = Math.max(Math.abs(p.x - m.x), Math.abs(p.y - m.y));
    if (d < bd) { bd = d; best = pl.i; }
  }
  if (best < 0) return;
  mpAs(best, () => monTurn(m));
}
function mpAlive() { return MP.players.filter(pl => !pl.gone && pl.p && !pl.p.down); }

// ----- co-op: start, floors, falling and reviving -----
function mpStartCoop(roster) {
  G = { seed: (Math.random() * 2147483647) | 0, depth: 0, tick: 0, mv: 0, dmv: -1, log: [], dead: false };
  rng = mulberry(G.seed);
  MP.on = true; MP.host = true; MP.guest = false; MP.co = true; MP.mode = 'coop'; MP.cur = 0; MP.me = 0; MP.players = [];
  roster.forEach((r, i) => {
    initPlayerCtx(r.kit);
    G.p.pidx = i; G.p.name = r.name;
    const pl = { i, name: r.name, kit: G.kit, link: r.link || null, ack: 0, gone: false };
    mpSwapOut(pl); MP.players.push(pl);
  });
  mpSwapIn(MP.players[0]);
  MP.seq = 0; MP.fxSent = FXN; MP.logSent = 0; MP.lastTiles = []; MP.lastUid = 0; MP.uidN = 0;
  SAVE.runs++; persist();
  descend();
}
function mpArriveParty() {
  const cur = MP.cur, up = L.up, d = bfs(up.x, up.y), spots = [];
  for (let i = 0; i < W * H; i++) if (d[i] > 0 && d[i] <= 7 && !monAt(i % W, (i / W) | 0)) spots.push([d[i] + Math.random() * 0.5, i]);
  spots.sort((a, b) => a[0] - b[0]);
  let k = 0;
  for (const pl of MP.players) {
    if (pl.i === cur || pl.gone) continue;
    mpAs(pl.i, () => {
      const P = G.p, s = spots[k++] || spots[0];
      if (s) { P.x = s[1] % W; P.y = (s[1] / W) | 0; } else { P.x = up.x; P.y = up.y; }
      P._dv = -1;
      if (P.down) { P.down = false; P.hp = Math.max(1, Math.ceil(P.mhp * 0.3)); P.st = {}; msg(P.name + ' wakes at the foot of the stairs.', 'good'); }
      G.windUsed = false;
    });
  }
  G.mv++; computeFov();
  for (const pl of MP.players) {
    if (pl.gone) continue;
    mpAs(pl.i, () => { if (G.depth > 1) G.pending = { type: 'draft', opts: rollDraft() }; else arrive(); });
  }
}
function mpDown(cause) {
  const P = G.p;
  P.hp = 0; P.down = true; P.st = {};
  msg(P.name + ' is down. Stand next to them and press E to revive, or reach the stairs.', 'bad');
  fxFlash(P.x, P.y, '#e0505a'); fxText(P.x, P.y, 'DOWN', '#ff7a6a');
  if (MP.players.every(pl => pl.gone || !pl.p || pl.p.down)) mpGameOver(cause);
}
function mpGameOver(cause) {
  mpFlush();
  G.dead = true; G.cause = cause; G.over = true;
  for (const pl of MP.players) pl.echoes = Math.floor(G.depth * G.depth * 1.5 + (pl.kills || 0) * 0.5);
  const me = MP.players[0];
  G.echoes = me.echoes; SAVE.echoes += me.echoes; SAVE.kills += me.kills || 0; persist();
  msg('The party is lost. ' + cause + '.', 'bad');
}
function mpRevive() {
  const P = G.p;
  if (G.dead || G.pending || P.down) return false;
  for (const pl of MP.players) {
    const q = pl.p; if (!q || q === P || !q.down || pl.gone) continue;
    if (Math.max(Math.abs(q.x - P.x), Math.abs(q.y - P.y)) > 1) continue;
    q.down = false; q.hp = Math.max(1, Math.ceil(q.mhp * 0.4)); q.st = {}; q.sat = Math.max(q.sat, 300);
    msg('You pull ' + q.name + ' back to their feet.', 'good');
    fxFlash(q.x, q.y, '#ffe8a0'); fxText(q.x, q.y, '+' + q.hp, '#7fe0a0');
    fxEmit({ x: q.x, y: q.y, pat: 'pillar', cols: ['#ffd36b', '#fff0a0', '#ffffff'], n: 22, R: 2.4, life: 800 });
    playerAct(100); return true;
  }
  return false;
}
// a teammate standing next to you who could be revived
function mpNearDown() {
  if (!MP.co || !G || !G.p || G.p.down) return null;
  const P = G.p;
  for (const pl of MP.players) { const q = pl.p; if (q && q !== P && q.down && !pl.gone && Math.max(Math.abs(q.x - P.x), Math.abs(q.y - P.y)) <= 1) return q; }
  return null;
}
function mpAfterAct() {
  if (MP.co && MP.host) mpBroadcast();
  else if (MP.mode === 'race') mpRaceProgress();
}

// ----- guest -> host commands -----
const MPCMD = { tryMove: 2, waitTurn: 0, descendHere: 0, interact: 0, useItem: 1, dropItem: 1, offerItem: 1, throwItem: 3, mixPotions: 2, choosePerk: 1, zapWand: 3 };
function mpCmd(name, args) {
  if (name === 'choosePerk') G.pending = null;
  MP.sent = (MP.sent || 0) + 1;
  if (MP.sendHost) MP.sendHost({ t: 'cmd', n: MP.sent, a: name, g: args });
  return true;
}
function mpExec(i, c) {
  const pl = MP.players[i];
  if (!MP.co || !pl || pl.gone || !c) return;
  pl.ack = (pl.ack || 0) + 1;
  const need = MPCMD[c.a];
  if (need === undefined || !Array.isArray(c.g) || G.dead) { mpBroadcast(); return; }
  const fns = { tryMove, waitTurn, descendHere, interact, useItem, dropItem, offerItem, throwItem, mixPotions, choosePerk, zapWand };
  mpAs(i, () => {
    const P = G.p;
    if (P.down) return;
    const a = c.g.slice(0, need);
    if (c.a === 'choosePerk') { if (!(G.pending && G.pending.type === 'draft' && G.pending.opts.includes(a[0]))) return; }
    else if (!a.every(v => v === undefined || v === null || (Number.isInteger(v) && Math.abs(v) < 5000))) return;
    MP.actor = i;
    try { fns[c.a](...a); } catch (e) { console.error('command failed', c.a, e); }
  });
  mpBroadcast();
}
function mpLeft(i) {
  const pl = MP.players[i]; if (!pl || pl.gone) return;
  pl.gone = true; pl.link = null;
  mpAs(i, () => msg(pl.name + ' left the party.', 'bad'));
  if (!G.dead && MP.players.every(q => q.gone || !q.p || q.p.down)) mpGameOver('The party is gone');
  mpBroadcast();
}

// ----- snapshots (host -> guests) -----
const TILE0 = () => ({ w: 0, g: 0, wt: 0, oil: 0, fire: 0, fog: 0, ice: 0, seen: 0, vis: 0, zap: 0 });
const tileCode = t => JSON.stringify(t, (k, v) => k === 'zap' ? (v && now() - v < 600 ? 1 : undefined) : (v === 0 || v === false ? undefined : v));
function mpTileDelta(last) {
  const n = L.t.length, runs = [], pal = [], pm = new Map();
  let run = null;
  for (let i = 0; i < n; i++) {
    const c = tileCode(L.t[i]);
    if (last[i] === c) { run = null; continue; }
    last[i] = c;
    let pi = pm.get(c); if (pi === undefined) { pi = pal.length; pal.push(c); pm.set(c, pi); }
    if (run && run[2] === pi && run[0] + run[1] === i) run[1]++; else { run = [i, 1, pi]; runs.push(run); }
  }
  return { pal, runs };
}
const KNOW = ['known', 'scrKnown', 'recipes', 'wandKnown', 'ringKnown', 'godKnown', 'fountKnown', 'affKnown', 'seen', 'biomeSeen'];
function mpBroadcast() {
  if (MP.bc || !MP.co || !MP.host) return;
  MP.bc = true;
  setTimeout(() => { MP.bc = false; try { mpSendSnapshots(); } catch (e) { console.error('snapshot failed', e); } nui('hsnap'); }, 25);
}
function mpBase(full) {
  mpFlush();
  if (!L.uid) L.uid = ++MP.uidN;
  // a full snapshot (late or re-joining guest) uses its own tile cache and leaves the shared cursors alone
  let last = full ? [] : MP.lastTiles;
  if (!full && MP.lastUid !== L.uid) { MP.lastTiles = last = []; }
  if (!full) MP.lastUid = L.uid;
  const tiles = mpTileDelta(last);
  let fx = [], log;
  if (full) log = G.log.slice(-40);
  else {
    fx = FX.filter(f => f.n > MP.fxSent).map(f => { const o = Object.assign({}, f); o.age = now() - f.t; delete o.t; return o; });
    if (FX.length) MP.fxSent = Math.max(MP.fxSent, FX[FX.length - 1].n);
    log = G.log.filter(e => e.n > MP.logSent);
    if (G.log.length) MP.logSent = G.log[G.log.length - 1].n;
  }
  const know = {}; for (const k of KNOW) if (SAVE[k] !== undefined) know[k] = SAVE[k];
  return {
    t: 'snap', q: ++MP.seq, full: !!full, lvl: L.uid, depth: G.depth, tick: G.tick, mv: G.mv, dead: !!G.dead, cause: G.cause,
    L: { laws: L.laws, dark: !!L.dark, biome: BIOMES.indexOf(L.biome), up: L.up, down: L.down, feat: L.feat || [], items: L.items, mons: L.mons.filter(m => !m.dead) },
    tiles, fx, log, know,
    players: MP.players.map(pl => ({ i: pl.i, name: pl.name, kit: pl.kit, gone: !!pl.gone, kills: pl.kills || 0, p: pl.p })),
    over: G.dead ? MP.players.map(pl => ({ name: pl.name, kills: pl.kills || 0, echoes: pl.echoes || 0 })) : null
  };
}
const mpJson = o => JSON.stringify(o, (k, v) => k[0] === '_' ? undefined : v);
function mpPrivOf(pl) { return { ack: pl.ack || 0, inv: pl.inv, perks: pl.perks, pending: pl.pending, kills: pl.kills || 0, kit: pl.kit, sense: pl.sense || 0, echoes: pl.echoes || 0 }; }
function mpSendSnapshots() {
  if (!MP.co || !MP.host || !G) return;
  const base = mpBase(false);
  for (const pl of MP.players) {
    if (pl.i === 0 || pl.gone || !pl.link) continue;
    try { pl.link.send(mpJson(Object.assign({}, base, { priv: mpPrivOf(pl) }))); } catch (e) { }
  }
}
function mpSendFull(i) {
  const pl = MP.players[i]; if (!pl || !pl.link) return;
  const base = mpBase(true);
  pl.link.send(mpJson(Object.assign({}, base, { priv: mpPrivOf(pl) })));
}
// guest side
function mpGuestInit(info) {
  MPG = true; MP.on = true; MP.guest = true; MP.host = false; MP.co = true; MP.mode = 'coop'; MP.me = info.me; MP.cur = info.me;
  MP.sent = 0; MP.ack = 0; MP.glvl = 0; MP.logN = 0; MP.players = [];
  G = { seed: 0, depth: 0, tick: 0, mv: 0, dmv: -1, log: [], dead: false, kit: info.kit, kills: 0, stats: null, sense: 0, windUsed: false, pending: null, inv: [], perks: {},
    p: { x: 0, y: 0, hp: 1, mhp: 1, sat: 1500, energy: 100, st: {}, wpn: { w: 'sword', e: 0 }, arm: { lv: 0, e: 0 } } };
  L = null;
}
function mpApplySnapshot(s) {
  if (!MPG) return;
  if (!L || MP.glvl !== s.lvl) {
    L = { t: Array.from({ length: W * H }, TILE0), mons: [], items: [], laws: [], feat: [], depth: s.depth, up: s.L.up, down: s.L.down, nid: 1, spawnT: 0 };
    MP.glvl = s.lvl;
  }
  const pal = s.tiles.pal.map(c => JSON.parse(c));
  for (const [i, n, pi] of s.tiles.runs) for (let k = 0; k < n; k++) {
    const t = Object.assign(TILE0(), pal[pi]); if (t.zap) t.zap = now(); L.t[i + k] = t;
  }
  Object.assign(L, { laws: s.L.laws, dark: s.L.dark, biome: s.L.biome >= 0 ? BIOMES[s.L.biome] : null, up: s.L.up, down: s.L.down, feat: s.L.feat, items: s.L.items, mons: s.L.mons, depth: s.depth });
  G.depth = s.depth; G.tick = s.tick; G.mv = s.mv; G.dead = s.dead; G.cause = s.cause;
  MP.players = s.players.map(q => ({ i: q.i, name: q.name, kit: q.kit, gone: q.gone, kills: q.kills, p: q.p }));
  const me = MP.players[MP.me];
  if (me) G.p = me.p;
  const pv = s.priv;
  if (pv) { G.inv = pv.inv; G.perks = pv.perks; G.pending = pv.pending; G.kills = pv.kills; G.kit = pv.kit; G.sense = pv.sense; MP.ack = pv.ack; if (s.dead) G.echoes = pv.echoes; }
  for (const k in s.know) SAVE[k] = s.know[k];
  for (const e of s.log) if (e.n > MP.logN) { G.log.push(e); MP.logN = e.n; if (G.log.length > 120) G.log.shift(); }
  const t0 = now();
  for (const f of s.fx) { f.t = t0 - f.age; delete f.age; fxApplyRemote(f); }
  if (s.over) MP.over = s.over;
  G.mv = s.mv;
}
// effects from the host: also drive the lunge/flash animations of whoever is standing there
function actorAtXY(x, y) {
  if (MP.players) for (const pl of MP.players) if (pl.p && !pl.gone && pl.p.x === x && pl.p.y === y) return pl.p;
  return L ? monAt(x, y) : null;
}
function fxApplyRemote(f) {
  if (f.k === 'hr') { const a = actorAtXY(f.x, f.y); if (a) anim(a).hurt = f.t; return; }
  if (f.k === 'sl') { const a = actorAtXY(f.ox, f.oy); if (a) anim(a).atk = { t: f.t, dx: f.dx, dy: f.dy, amp: f.amp == null ? 0.42 : f.amp }; }
  FX.push(f);
  if (FX.length > 240) FX.shift();
}
// display text for log lines written by other players
function mpLogLine(e) {
  if (!MP.co || e.pid === undefined || e.pid === MP.me || e.cls === 'chat') return e;
  if (e.cls !== 'good' && e.cls !== 'bad') return null;
  const pl = MP.players[e.pid], nm = pl ? pl.name : 'Someone';
  const text = e.text.replace(/^You /, nm + ' ').replace(/\bYou\b/g, nm).replace(/\byour\b/g, 'their').replace(/\byou\b/g, 'them');
  return { text, cls: e.cls, tick: e.tick };
}

// ----- race -----
function mpShadowOn(ws) {
  if (!MP.realSave) MP.realSave = SAVE;
  SAVE = Object.assign(defaultSave(), { ws, echoes: 0, runs: 0, kills: 0, best: 0 });
  for (const k of KITS) SAVE.unlocked[k.id] = 1;
  buildWorld(); MP.noPersist = true;
}
// leave multiplayer: restore the real journal and bank what this run earned
function mpShadowOff() {
  if (MP.realSave) {
    const sh = SAVE, real = MP.realSave;
    if (MP.mode === 'race' && G && !G.dead && G.depth) {
      const ech = Math.floor(G.depth * G.depth * 1.5 + (G.kills || 0) * 0.5);
      sh.echoes += ech; sh.kills += G.kills || 0; sh.runs++; sh.best = Math.max(sh.best || 0, G.depth);
    }
    if (MP.mode === 'coop' && MP.guest && G && G.dead && G.echoes) { sh.echoes += G.echoes; sh.kills += G.kills || 0; sh.runs++; }
    real.echoes += sh.echoes || 0; real.kills += sh.kills || 0; real.runs += sh.runs || 0; real.best = Math.max(real.best || 0, sh.best || 0);
    SAVE = real; MP.realSave = null; buildWorld();
  }
  MP.noPersist = false; persist();
}
function mpReset() {
  MPG = false; MP.on = false; MP.host = false; MP.guest = false; MP.co = false; MP.players = []; MP.cur = 0; MP.me = 0; MP.race = null; MP.over = null;
  MP.sendHost = MP.sendProg = null;
}
function mpStartRace(o) {
  mpShadowOn(o.ws);
  MP.on = true; MP.host = !!o.host; MP.guest = !o.host; MP.co = false; MP.mode = 'race'; MP.me = o.me; MP.players = o.players || [];
  MP.race = { goal: o.goal, t0: Date.now(), board: {}, over: false, last: '', maxDepth: 0, depthAt: 0 };
  newRun(o.kit, o.seed);
}
function mpRaceProgress(force) {
  const r = MP.race; if (!r || r.over || !G) return;
  const st = { depth: G.depth, kills: G.kills || 0, hp: Math.max(0, G.p.hp), mhp: G.p.mhp, dead: !!G.dead };
  const key = st.depth + '|' + st.kills + '|' + st.hp + '|' + st.dead;
  if (!force && key === r.last) return;
  r.last = key;
  if (st.depth > r.maxDepth) { r.maxDepth = st.depth; r.depthAt = Date.now() - r.t0; }
  st.ms = r.depthAt;
  if (MP.sendProg) MP.sendProg(st);
}
function mpRank(board) {
  return Object.keys(board).map(k => Object.assign({ i: +k }, board[k]))
    .sort((a, b) => (b.depth - a.depth) || ((a.ms || 0) - (b.ms || 0)) || ((b.kills || 0) - (a.kills || 0)));
}
