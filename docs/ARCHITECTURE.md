# Architecture

Deepwell is plain JavaScript with no framework and no runtime dependencies. `scripts/build.js` concatenates the files in `src/js/` (in the order below) into one `<script>` inside `src/body.html`, adds a standard `<head>`, and writes `dist/index.html` along with the PWA files from `public/`.

Because everything is concatenated into one scope, later files can use names declared in earlier ones. The order is set by the `JS` array in `scripts/build.js`.

| File | Responsibility |
| --- | --- |
| `data.js` | Core tables: monsters, potions, scrolls, weapons, perks, kits, floor laws, map size. Seeded random helpers. |
| `data-extra.js` | Later content that extends the core tables: more potions and scrolls, wands, rings, monsters, biomes, gods, deeds. |
| `world.js` | The save object and the per-save world: the hidden shuffles that make each save different. Floor generation and item rolling. Field of view and pathing. |
| `rules-core.js` | Combat and damage, status effects, fire/water/oil/ice/lightning, the per-turn tick, monster AI. |
| `rules-actions.js` | Everything the player does: moving, attacking, items, mixing, throwing, scrolls, descending, travel and explore. Starting and resuming runs. |
| `rules-extra.js` | Wands, rings, allies, altars, fountains, extra monster behaviors, new potion and scroll effects, deeds. |
| `ui.js` | DOM: title screen, HUD, pack, journal, input (keyboard, mouse, touch), phone layout. |
| `graphics.js` | The canvas renderer: 8x8 sprites, procedural tile textures, effects, camera. |
| `boot.js` | Starts the app and registers the service worker. |

## Key ideas

**Two kinds of randomness.** The per-save world (`WORLD`, built from `SAVE.ws`) holds the shuffles that must stay fixed between runs, so knowledge in the journal stays valid. Each run has its own seed (`G.seed`), and each floor is generated from the run seed plus its depth, so a floor is the same if you reload mid-run. After generation, gameplay randomness switches to a time-based seed.

**Time.** Everything advances in `playerAct(cost)`. Every actor has an energy meter and acts when it reaches 100, which is how fast and slow creatures work. `tickWorld()` runs the environment, hunger, status effects and every monster.

**Rules and UI are separate.** Files up to `rules-extra.js` never touch the DOM, which is why `tests/run.js` can load them in Node. They call `msg()` for log text and push effects onto the `FX` list; `graphics.js` and `ui.js` decide how to show them.

**Saving.** `saveRun()` stores the run (inventory, perks, stats) at the top of each floor. `SAVE` itself (journal knowledge, echoes, deeds, unlocks) is written to `localStorage` whenever it changes. Saved runs always resume at the top of the floor you were on.

## Multiplayer

`src/js/mp.js` (rules, no DOM) and `src/js/net.js` (transport and rooms) are loaded between the rules and the UI; `ui-mp.js` is the lobby and party interface.

- **Topology**: a star. The host is the only authority; guests only ever talk to the host. A *link* is `{send(string), close(), onmessage, onclose}`, with two transports behind it: PeerJS/WebRTC (room code) and BroadcastChannel (tabs on one device).
- **Co-op**: the host runs the one real game. Each hero's own state (pack, perks, kills, `G.p`...) is a *context* listed in `CTXF`; `mpAs(i, fn)` swaps it into `G` while player `i` acts, so none of the single-player rules know there is more than one hero. Monsters act as the nearest living hero. Guests send commands (`MPCMD` whitelist, integer arguments only, validated) and receive snapshots: tile deltas, monsters, items, effects, log lines, plus a private part (pack, perks). Guest-side action functions begin with `if(MPG)return mpCmd(...)`.
- **Race**: every player runs the normal game on a shared seed and a shared hidden world (`mpShadowOn` swaps in a throw-away save so the real journal is untouched, `mpShadowOff` banks the echoes). Only progress numbers cross the wire; the host keeps the scoreboard and decides the winner.
- **Tests**: `tests/mp.test.js` starts a separate sandbox per player (own `G`, `L`, `SAVE`, `NET`) wired through the real local transport.

## Adding content

- **A monster:** add an entry to `MON` in `data-extra.js`, add an 8x8 sprite with the same key to `SPR` in `graphics.js`, and add any new AI to `extMonAI` in `rules-extra.js`. `npm test` fails if a monster has no sprite.
- **A potion or scroll:** append to `POT` or `SCR`, then add its effect to `extDrink`/`extSplash` or `extScroll` in `rules-extra.js`. Add a color to `COLORS` if `POT` outgrows it (the test checks this).
- **A deed:** add to `DEEDS`. Counters live in `G.stats`; use `inc('name')` where the event happens.
- **A biome:** add to `BIOMES`. The order of biomes by depth is shuffled per save in `extWorld`.

## Sprites

Sprites are 8x8 grids in `SPR`. Each character is a palette slot: `a` is the main color, `b` a darker shade, `c` a lighter one, and `w k r y o` are fixed white, ink, red, gold and orange. `.` is transparent. The main color comes from the game data (for monsters, their `col`), so one shape can be recolored. Tile textures are generated in `tex()` from a hash of the tile position.

## Offline support

`public/sw.js` caches the app shell on first visit. The build stamps a content hash into the cache name, so a new deploy replaces the old cache the next time the app is opened.
