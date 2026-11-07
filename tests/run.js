// Headless tests: run the game rules in Node with no browser.
// Loads the rule files (not ui/graphics/boot) into one scope, then stress-tests them.
const fs = require('fs'), path = require('path'), assert = require('assert');
const src = f => fs.readFileSync(path.join(__dirname, '..', 'src', 'js', f + '.js'), 'utf8');
const RULES = ['data', 'data-extra', 'world', 'rules-core', 'rules-actions', 'rules-extra', 'effects', 'mp'];

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

// ---- static data checks (no game state needed) ----
test('every monster, item and feature has a well-formed 8x8 sprite', () => {
  const gfx = src('graphics');
  const m = gfx.match(/const SPR=\{[\s\S]*?\n\};/);
  assert(m, 'SPR table not found in graphics.js');
  const SPR = new Function(m[0] + ';return SPR')();
  const ctx = new Function(RULES.map(src).join('\n') + ';return {MON,POT,SCR,WAND,RING,BIOMES,KITS,DEEDS,PERKS,COLORS}')();
  for (const k of Object.keys(ctx.MON)) assert(SPR[k], `monster "${k}" has no sprite`);
  for (const k of ['player', 'pot', 'scr', 'food', 'wpn', 'arm', 'wand', 'ring', 'down', 'up', 'fire0', 'fire1', 'altar', 'fount'])
    assert(SPR[k], `sprite "${k}" missing`);
  for (const [k, rows] of Object.entries(SPR)) {
    assert.strictEqual(rows.length, 8, `${k}: needs 8 rows`);
    rows.forEach((r, i) => assert.strictEqual(r.length, 8, `${k} row ${i}: needs 8 columns`));
  }
  for (const k of ctx.KITS) if (k.id !== 'wanderer') assert(SPR['p_' + k.id], `role ${k.id} needs its own sprite p_${k.id}`);
  assert(ctx.COLORS.length >= ctx.POT.length, 'not enough potion colors');
  assert.strictEqual(new Set(ctx.KITS.map(k => k.id)).size, ctx.KITS.length, 'duplicate kit ids');
  assert.strictEqual(new Set(ctx.DEEDS.map(d => d.id)).size, ctx.DEEDS.length, 'duplicate deed ids');
  assert.strictEqual(new Set(ctx.PERKS.map(p => p.id)).size, ctx.PERKS.length, 'duplicate perk ids');
  for (const k of ctx.KITS) if (k.cost < 0) assert(ctx.DEEDS.find(d => d.id === k.deed), `kit ${k.id} needs a real deed`);
});

// ---- game logic stress tests in a shared scope ----
function scope() {
  const store = {};
  global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
  return new Function('assert', RULES.map(src).join('\n') + `
  const rpick = a => a[Math.floor(Math.random() * a.length)];
  function act() {
    const P = G.p;
    if (G.pending) { choosePerk(G.pending.opts[Math.floor(Math.random() * G.pending.opts.length)]); return; }
    const r = Math.random(), inv = G.inv;
    if (r < 0.04 && inv.length) useItem(Math.floor(Math.random() * inv.length));
    else if (r < 0.06 && inv.length > 1) mixPotions(Math.floor(Math.random() * inv.length), Math.floor(Math.random() * inv.length));
    else if (r < 0.08) { const i = inv.findIndex(x => x.t === 'pot'); if (i >= 0) throwItem(i, P.x + Math.floor(Math.random() * 9) - 4, P.y + Math.floor(Math.random() * 9) - 4); }
    else if (r < 0.11) { const i = inv.findIndex(x => x.t === 'wand'); if (i >= 0) zapWand(i, P.x + Math.floor(Math.random() * 13) - 6, P.y + Math.floor(Math.random() * 13) - 6); }
    else if (r < 0.12) interact();
    else if (r < 0.14) offerItem(Math.floor(Math.random() * inv.length));
    else if (r < 0.16) descendHere();
    else if (r < 0.6) { if (!exploreStep() && !stairsStep()) { const d = rpick(DIRS); tryMove(d[0], d[1]); } }
    else { const d = rpick(DIRS); tryMove(d[0], d[1]); }
    if (P.sat < 300) { const i = inv.findIndex(x => x.t === 'food'); if (i >= 0) useItem(i); }
  }
  return {
    fuzz(runs, steps) {
      let maxd = 0;
      for (let run = 0; run < runs; run++) {
        loadSave(); newRun(rpick(KITS).id);
        const tough = run % 2 === 0;
        if (tough) { G.p.mhp = 400; G.p.hp = 400; }
        for (let s = 0; s < steps && !G.dead; s++) {
          act();
          if (tough && !G.dead) { G.p.hp = Math.max(G.p.hp, 200); if (G.p.sat < 600) G.p.sat = 1500; if (s % 60 === 59 && !G.pending) { G.p.x = L.down.x; G.p.y = L.down.y; descendHere(); } }
          maxd = Math.max(maxd, G.depth);
        }
      }
      return maxd;
    },
    allMonsters() {
      loadSave(); newRun('wanderer'); G.p.mhp = 9999; G.p.hp = 9999;
      for (const dep of [4, 8, 12, 16, 20, 25, 35, 45]) {
        G.depth = dep - 1; descend(); while (G.pending) choosePerk(G.pending.opts[0]);
        for (const k of Object.keys(MON)) { const m = spawnMon(k, G.p.x + 1, G.p.y, true); if (m) m.awake = true; }
        for (let t = 0; t < 40 && !G.dead; t++) { waitTurn(); G.p.hp = 9999; }
      }
      return G.depth;
    },
    allItems() {
      loadSave(); newRun('wanderer'); G.p.mhp = 9999; G.p.hp = 9999; G.depth = 7; descend(); while (G.pending) choosePerk(G.pending.opts[0]);
      const P = G.p, fresh = () => { L.mons = []; for (let i = 0; i < 4; i++) { const o = DIRS[i * 2 % 8]; spawnMon('rat', P.x + o[0] * (2 + i), P.y + o[1] * (2 + i), true); } };
      let n = 0;
      for (let k = 0; k < WAND.length; k++) { G.inv = [{ t: 'wand', k, c: 5, mc: 5 }]; for (let t = 0; t < 5; t++) { fresh(); for (const d of DIRS) { zapWand(0, P.x + d[0] * 5, P.y + d[1] * 5); n++; } } }
      for (let k = 0; k < RING.length; k++) for (const p of [-2, 3]) { G.inv = [{ t: 'ring', k, p, id: false }]; toggleRing(0); for (let t = 0; t < 130; t++) waitTurn(); toggleRing(0); }
      for (let k = 0; k < POT.length; k++) for (let p = 1; p <= 3; p++) { G.inv = [{ t: 'pot', k, p, n: 3 }]; fresh(); useItem(0); G.inv = [{ t: 'pot', k, p, n: 3 }]; fresh(); throwItem(0, P.x + 2, P.y); }
      for (let k = 0; k < SCR.length; k++) { G.inv = [{ t: 'scr', k, n: 2 }]; fresh(); useItem(0); while (G.pending) choosePerk(G.pending.opts[0]); G.p.hp = 9999; }
      return n;
    },
    mixing() {
      loadSave();
      const seen = new Set();
      for (let a = 0; a < POT.length; a++) for (let b = a; b < POT.length; b++) {
        const r = mixRes({ k: a, p: 1 }, { k: b, p: 1 });
        assert(r.k >= 0 && r.k < POT.length, 'mix result out of range');
        assert.deepStrictEqual(r, mixRes({ k: b, p: 1 }, { k: a, p: 1 }), 'mixing must be symmetric');
        seen.add(r.k);
      }
      return seen.size;
    },
    saveRoundTrip() {
      loadSave(); newRun('wanderer'); descend(); while (G.pending) choosePerk(G.pending.opts[0]);
      saveRun(); const d = G.depth, inv = JSON.stringify(G.inv);
      G = null; assert(resumeRun(), 'resume failed'); assert.strictEqual(G.depth, d); assert.strictEqual(JSON.stringify(G.inv), inv);
    }
  };`)(assert);
}
test('random play never throws (24 runs)', () => { const s = scope(); const d = s.fuzz(24, 2500); assert(d >= 1); console.log('    deepest floor reached:', d); });
test('every monster type acts on floors 4-45', () => { assert(scope().allMonsters() >= 40); });
test('every wand, ring, potion and scroll works', () => { assert(scope().allItems() > 0); });
test('potion mixing is symmetric and in range', () => { assert(scope().mixing() > 3); });
test('a saved run resumes exactly', () => { scope().saveRoundTrip(); });

// ---- run ----
let failed = 0;
for (const [name, fn] of tests) {
  try { fn(); console.log('  ok   ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + (e && e.stack || e)); }
}
console.log(failed ? `\n${failed} test(s) failed` : `\nAll ${tests.length} tests passed`);
process.exit(failed ? 1 : 0);
