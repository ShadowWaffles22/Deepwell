// Multiplayer tests: each player is a separate sandbox (own G, L, SAVE, MP, NET) talking over the
// real net.js "local" transport (BroadcastChannel), so host/guest code paths are exercised for real.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const src = f => fs.readFileSync(path.join(__dirname, '..', 'src', 'js', f + '.js'), 'utf8');
const FILES = ['data', 'data-extra', 'world', 'rules-core', 'rules-actions', 'rules-extra', 'effects', 'mp', 'net'];
const CODE = FILES.map(src).join('\n');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];

function player(label) {
  const store = {};
  const sandbox = {
    console: { log() { }, warn() { }, error: (...a) => errors.push(label + ': ' + a.map(String).join(' ')) },
    setTimeout, clearTimeout, setInterval, clearInterval, BroadcastChannel, Date, Math, JSON,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } }
  };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(CODE + `
  var __ui = []; NET.ui = new Proxy({}, { get: (t, k) => (...a) => { __ui.push([k, ...a]); } });
  loadSave();`, ctx, { filename: label });
  const run = c => vm.runInContext(c, ctx);
  return { run, ev: () => run('__ui'), ctx, label };
}
const wait = async (cond, ms = 4000, what = 'condition') => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (cond()) return; await sleep(20); }
  throw new Error('timed out waiting for ' + what);
};
const tests = [];
const test = (n, f) => tests.push([n, f]);

async function room(mode, kits) {
  const H = player('host');
  H.run(`netHostRoom({ kind: 'local', name: 'Ada', kit: ${JSON.stringify(kits[0])}, mode: '${mode}', goal: 2 })`);
  await wait(() => H.run('NET.code'), 2000, 'room code');
  const code = H.run('NET.code');
  const guests = [];
  for (let i = 1; i < kits.length; i++) {
    const g = player('guest' + i);
    g.run(`netJoinRoom({ kind: 'local', code: ${JSON.stringify(code)}, name: 'Guest${i}', kit: ${JSON.stringify(kits[i])} })`);
    await wait(() => g.run('NET.lobby && NET.lobby.players.length') >= 1, 2000, 'guest ' + i + ' welcome');
    g.run('netReady(true)');
    guests.push(g);
  }
  await wait(() => H.run('NET.lobby.players.length') === kits.length && H.run('NET.lobby.players.every(p => p.ready)'), 2000, 'lobby ready');
  return { H, guests, code };
}
const rnd = a => a[Math.floor(Math.random() * a.length)];
const stairsAction = p => p.run(`(() => {
  if (G.dead) return;
  if (G.pending) { choosePerk(G.pending.opts[0]); return; }
  if (G.p.down) return;
  if (G.p.x === L.down.x && G.p.y === L.down.y) { descendHere(); return; }
  if (!stairsStep() && !exploreStep()) { const d = DIRS[Math.floor(Math.random() * DIRS.length)]; tryMove(d[0], d[1]); }
})()`);
const randomAction = p => p.run(`(() => {
  if (G.dead) return;
  if (G.pending) { choosePerk(G.pending.opts[0]); return; }
  const r = Math.random(), P = G.p, d = DIRS[Math.floor(Math.random() * DIRS.length)];
  if (r < 0.05 && G.inv.length) useItem(Math.floor(Math.random() * G.inv.length));
  else if (r < 0.08) interact();
  else if (r < 0.1) descendHere();
  else if (r < 0.14) waitTurn();
  else if (r < 0.18) { const i = G.inv.findIndex(x => x.t === 'pot'); if (i >= 0) throwItem(i, P.x + 2, P.y); }
  else if (r < 0.5) { if (!exploreStep()) tryMove(d[0], d[1]); }
  else tryMove(d[0], d[1]);
})()`);

test('lobby: host and guests see the same room and roster', async () => {
  const { H, guests } = await room('coop', ['wanderer', 'brawler', 'pyre']);
  for (const g of guests) assert.strictEqual(g.run('NET.lobby.players.length'), 3);
  assert.strictEqual(H.run('NET.lobby.players.map(p => p.name).join()'), 'Ada,Guest1,Guest2');
  // a 4th and a 5th guest: the 5th is turned away (co-op max 4)
  const g3 = player('g3'); g3.run(`netJoinRoom({ kind: 'local', code: NET.code = ${JSON.stringify(H.run('NET.code'))}, name: 'Cy', kit: 'lancer' })`);
  await wait(() => g3.run('NET.lobby'), 2000, 'g3');
  const g4 = player('g4'); g4.run(`netJoinRoom({ kind: 'local', code: ${JSON.stringify(H.run('NET.code'))}, name: 'Di', kit: 'lancer' })`);
  await wait(() => g4.ev().some(e => e[0] === 'error'), 2000, 'full-room rejection');
  assert(/full/i.test(g4.ev().find(e => e[0] === 'error')[1]));
  for (const p of [H, ...guests, g3, g4]) p.run('netLeave()');
});

test('co-op: guests receive the world, move, and stay in sync with the host', async () => {
  const { H, guests } = await room('coop', ['wanderer', 'brawler', 'scholar']);
  H.run('hostStart()');
  await wait(() => guests.every(g => g.run('L && G.depth') === 1), 4000, 'first snapshots');
  const sync = () => {
    for (const [i, g] of guests.entries()) {
      const slot = i + 1;
      const hp = H.run(`MP.players[${slot}].p.hp`), hx = H.run(`MP.players[${slot}].p.x`), hy = H.run(`MP.players[${slot}].p.y`);
      if (g.run('G.p.x') !== hx || g.run('G.p.y') !== hy || g.run('G.p.hp') !== hp) return false;
      if (g.run('G.depth') !== H.run('G.depth')) return false;
      if (g.run('L.mons.length') !== H.run('L.mons.filter(m => !m.dead).length')) return false;
    }
    return true;
  };
  for (let n = 0; n < 60; n++) {
    for (const g of guests) randomAction(g);
    if (n % 3 === 0) randomAction(H);
    await sleep(40);
  }
  await wait(() => sync() || H.run('G.dead'), 4000, 'guest state to match host');
  assert(H.run('MP.players.length') === 3);
  // each player has their own pack and kit
  assert.strictEqual(guests[0].run('G.kit'), 'brawler');
  assert.strictEqual(guests[1].run('G.kit'), 'scholar');
  assert.strictEqual(H.run('MP.players[1].inv !== MP.players[2].inv && MP.players[1].p !== MP.players[2].p'), true);
  for (const p of [H, ...guests]) p.run('netLeave()');
});

test('co-op: long random session with 4 players never throws, falls and revives work', async () => {
  const { H, guests } = await room('coop', ['wanderer', 'brawler', 'lancer', 'alchemist']);
  H.run('hostStart()');
  await wait(() => guests.every(g => g.run('L && G.depth') >= 1), 4000, 'snapshots');
  // make everyone sturdy so the session goes deep and exercises floors, then hurt one player to test down/revive
  H.run('(() => { const r = recalc; recalc = function () { r.apply(this, arguments); G.p.mhp += 600; }; })()');
  H.run('for (const pl of MP.players) { pl.p.mhp += 600; pl.p.hp = pl.p.mhp; }');
  let maxDepth = 1;
  for (let n = 0; n < 900 && !H.run('G.dead') && maxDepth < 3; n++) {
    for (const g of guests) (n % 3 ? stairsAction : randomAction)(g);
    stairsAction(H);
    if (n % 5 === 0) await sleep(15);
    maxDepth = Math.max(maxDepth, H.run('G.depth'));
  }
  assert(maxDepth >= 2, 'party should have descended at least once (depth ' + maxDepth + ')');
  // down a guest next to the host, then revive them
  H.run('G.dead = false; G.pending = null; for (const pl of MP.players) { pl.p.down = false; pl.p.hp = pl.p.mhp; pl.pending = null; }');
  H.run(`(() => { mpAs(0, () => { const q = MP.players[1].p, P = G.p; q.x = P.x; q.y = P.y; }); })()`);
  H.run('mpAs(1, () => { mpDown("test") })');
  assert.strictEqual(H.run('MP.players[1].p.down'), true);
  H.run('mpAs(0, () => { G.p.down = false; G.pending = null; })');
  const revived = H.run('mpAs(0, () => mpRevive())');
  assert.strictEqual(revived, true, 'host should be able to revive an adjacent downed player');
  assert.strictEqual(H.run('MP.players[1].p.down'), false);
  assert.strictEqual(errors.length, 0, errors.join('\n'));
  for (const p of [H, ...guests]) p.run('netLeave()');
});

test('co-op: a guest who drops can rejoin by name and gets the full state', async () => {
  const { H, guests, code } = await room('coop', ['wanderer', 'brawler']);
  H.run('hostStart()');
  await wait(() => guests[0].run('L && G.depth') === 1, 4000, 'snapshot');
  for (let n = 0; n < 15; n++) { randomAction(guests[0]); await sleep(30); }
  guests[0].run('netLeave()');
  await wait(() => H.run('MP.players[1].gone'), 2000, 'host to notice the drop');
  const g = player('rejoin');
  g.run(`netJoinRoom({ kind: 'local', code: ${JSON.stringify(code)}, name: 'Guest1', kit: 'brawler' })`);
  await wait(() => g.run('L && G.depth') === 1 && g.run('MP.players.length') === 2, 4000, 'rejoin snapshot');
  assert.strictEqual(H.run('MP.players[1].gone'), false);
  assert.strictEqual(g.run('G.kit'), 'brawler');
  for (const p of [H, g]) p.run('netLeave()');
});

test('co-op: guests cannot cheat (bad commands are ignored, not run)', async () => {
  const { H, guests } = await room('coop', ['wanderer', 'brawler']);
  H.run('hostStart()');
  await wait(() => guests[0].run('L && G.depth') === 1, 4000, 'snapshot');
  const before = H.run('JSON.stringify(MP.players[1].p)');
  guests[0].run(`MP.sendHost({ t: 'cmd', n: 1, a: 'constructor', g: [] })`);
  guests[0].run(`MP.sendHost({ t: 'cmd', n: 2, a: 'tryMove', g: ['x', {}] })`);
  guests[0].run(`MP.sendHost({ t: 'cmd', n: 3, a: 'useItem', g: [1e9] })`);
  guests[0].run(`MP.sendHost({ t: 'cmd', n: 4, a: 'choosePerk', g: ['nonsense'] })`);
  await sleep(200);
  assert.strictEqual(H.run('JSON.stringify(MP.players[1].p)'), before);
  assert.strictEqual(errors.length, 0, errors.join('\n'));
  for (const p of [H, ...guests]) p.run('netLeave()');
});

test('race: same seed and world, live scoreboard, and a winner at the goal depth', async () => {
  const { H, guests } = await room('race', ['wanderer', 'brawler', 'lancer']);
  H.run('hostStart()');
  await wait(() => guests.every(g => g.run('G && G.depth') === 1), 3000, 'race start');
  const all = [H, ...guests];
  // everybody shares the dungeon seed and the hidden world
  assert.strictEqual(new Set(all.map(p => p.run('G.seed'))).size, 1);
  assert.strictEqual(new Set(all.map(p => p.run('JSON.stringify(WORLD.pot)'))).size, 1);
  // same floor 1 layout
  assert.strictEqual(new Set(all.map(p => p.run('L.down.x + "," + L.down.y'))).size, 1);
  // a guest's real journal is untouched by the race
  const real = guests[0].run('MP.realSave.echoes');
  assert.strictEqual(typeof real, 'number');
  for (const p of all) { p.run('G.p.mhp = 500; G.p.hp = 500;'); }
  for (let n = 0; n < 8000 && !H.run('MP.race.over'); n++) {
    for (const p of all) p.run(`if (!G.dead && !MP.race.over && L.down) { if (G.pending) choosePerk(G.pending.opts[0]); else if (G.p.x === L.down.x && G.p.y === L.down.y) descendHere(); else if (!stairsStep() && !exploreStep()) { const d = DIRS[Math.floor(Math.random() * 8)]; tryMove(d[0], d[1]); } }`);
    if (n % 4 === 0) await sleep(10);
  }
  await wait(() => H.run('MP.race.over') && guests.every(g => g.run('MP.race.over')), 4000, 'race to finish');
  const res = H.run('NET.result');
  assert(res && res.rank.length === 3, 'result has a ranking of all players');
  assert(res.rank[0].depth >= 2 || res.reason === 'everyone fell', 'someone reached the goal depth');
  assert.strictEqual(guests[0].run('NET.result.winner'), res.winner);
  for (const p of all) p.run('netLeave()');
  // leaving restores the real journal and banks the earnings
  assert.strictEqual(guests[0].run('MP.realSave === null && SAVE.echoes >= ' + real), true);
  assert.strictEqual(errors.length, 0, errors.join('\n'));
});

(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try { await fn(); console.log('  ok   ' + name); }
    catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + (e && e.stack || e).toString().split('\n').slice(0, 4).join('\n       ')); }
    errors.length = 0;
  }
  console.log(failed ? `\n${failed} multiplayer test(s) failed` : '\nAll multiplayer tests passed');
  process.exit(failed ? 1 : 0);
})();
