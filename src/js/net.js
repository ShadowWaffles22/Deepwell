// ---------- multiplayer networking ----------
// Two transports, same interface (a "link" is {send(string), close(), onmessage, onclose}):
//   peer  - WebRTC through PeerJS. A short room code is all a friend needs. Needs internet.
//   local - BroadcastChannel. Two tabs or windows on the same device, no network at all.
// The host is the only authority. Guests only ever talk to the host (a star), so no one else needs to be reachable.
const NET = { role: null, kind: 'peer', code: null, tp: null, link: null, lobby: null, started: false, name: 'Player', kit: 'wanderer', me: 0, chat: [], ui: {}, board: {} };
const NETCODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const netCode = () => Array.from({ length: 5 }, () => NETCODE[Math.floor(Math.random() * NETCODE.length)]).join('');
const peerLib = () => (typeof window !== 'undefined') && ((window.peerjs && window.peerjs.Peer) || window.Peer);
const peerOpts = () => (typeof window !== 'undefined' && window.DW_PEER) || {};
const peerId = code => 'dwell-' + String(code).toLowerCase();

function tpHost(kind, code, cb) {
  if (kind === 'local') {
    const bc = new BroadcastChannel('dwell-' + code), links = {};
    bc.onmessage = ev => {
      const m = ev.data; if (!m || m.to !== 'h') return;
      if (m.join) {
        const l = { send: s => { try { bc.postMessage({ to: m.from, d: s }); } catch (e) { } }, close: () => { try { bc.postMessage({ to: m.from, bye: 1 }); } catch (e) { } } };
        links[m.from] = l; bc.postMessage({ to: m.from, ok: 1 }); cb.link(l);
      } else if (m.bye) { const l = links[m.from]; if (l) { delete links[m.from]; l.onclose && l.onclose(); } }
      else if (m.d !== undefined) { const l = links[m.from]; l && l.onmessage && l.onmessage(m.d); }
    };
    setTimeout(cb.ready, 0);
    return { close() { try { bc.postMessage({ to: '*', bye: 1 }); bc.close(); } catch (e) { } } };
  }
  const PeerC = peerLib();
  if (!PeerC) { setTimeout(() => cb.error('The networking library did not load.'), 0); return { close() { } }; }
  const peer = new PeerC(peerId(code), peerOpts());
  let ok = false;
  peer.on('open', () => { ok = true; cb.ready(); });
  peer.on('error', e => { if (!ok) cb.error(e.type === 'unavailable-id' ? 'taken' : 'Could not reach the matchmaking server (' + e.type + ').'); });
  peer.on('connection', c => {
    const l = { send: s => { if (c.open) c.send(s); }, close: () => { try { c.close(); } catch (e) { } } };
    c.on('open', () => cb.link(l));
    c.on('data', d => { if (typeof d === 'string' && l.onmessage) l.onmessage(d); });
    c.on('close', () => l.onclose && l.onclose());
    c.on('error', () => l.onclose && l.onclose());
  });
  return { close() { try { peer.destroy(); } catch (e) { } } };
}
function tpJoin(kind, code, cb) {
  if (kind === 'local') {
    const id = Math.random().toString(36).slice(2), bc = new BroadcastChannel('dwell-' + code);
    const l = { send: s => bc.postMessage({ to: 'h', from: id, d: s }), close: () => { try { bc.postMessage({ to: 'h', from: id, bye: 1 }); bc.close(); } catch (e) { } } };
    let ok = false;
    bc.onmessage = ev => {
      const m = ev.data; if (!m || (m.to !== id && m.to !== '*')) return;
      if (m.ok && !ok) { ok = true; cb.link(l); }
      else if (m.bye) l.onclose && l.onclose();
      else if (m.d !== undefined) l.onmessage && l.onmessage(m.d);
    };
    bc.postMessage({ to: 'h', from: id, join: 1 });
    setTimeout(() => { if (!ok) { cb.error('No room with that code is open on this device.'); try { bc.close(); } catch (e) { } } }, 1500);
    return { close() { l.close(); } };
  }
  const PeerC = peerLib();
  if (!PeerC) { setTimeout(() => cb.error('The networking library did not load.'), 0); return { close() { } }; }
  const peer = new PeerC(undefined, peerOpts());
  let done = false;
  const fail = m => { if (!done) { done = true; cb.error(m); try { peer.destroy(); } catch (e) { } } };
  const timer = setTimeout(() => fail('Could not connect. The room may be closed, or a network is blocking direct connections.'), 20000);
  peer.on('error', e => fail(e.type === 'peer-unavailable' ? 'No room with that code.' : 'Connection problem (' + e.type + ').'));
  peer.on('open', () => {
    const c = peer.connect(peerId(code), { reliable: true, serialization: 'raw' });
    const l = { send: s => { if (c.open) c.send(s); }, close: () => { try { c.close(); peer.destroy(); } catch (e) { } } };
    c.on('open', () => { if (done) return; done = true; clearTimeout(timer); cb.link(l); });
    c.on('data', d => { if (typeof d === 'string' && l.onmessage) l.onmessage(d); });
    c.on('close', () => l.onclose && l.onclose());
    c.on('error', () => fail('Connection lost.'));
  });
  return { close() { clearTimeout(timer); try { peer.destroy(); } catch (e) { } } };
}

const nsend = (l, o) => { try { l.send(JSON.stringify(o)); } catch (e) { } };
const nui = (k, ...a) => { try { NET.ui[k] && NET.ui[k](...a); } catch (e) { console.error(e); } };
function netReset() {
  if (NET.tp) { try { NET.tp.close(); } catch (e) { } }
  Object.assign(NET, { role: null, code: null, tp: null, link: null, lobby: null, started: false, me: 0, chat: [], board: {} });
}

// ---------- host ----------
function netHostRoom(o) {
  netReset();
  Object.assign(NET, { role: 'host', kind: o.kind, name: o.name, kit: o.kit });
  NET.lobby = { mode: o.mode, goal: o.goal || 10, max: o.mode === 'race' ? MAXRACE : MAXCO, players: [{ id: 0, name: o.name, kit: o.kit, ready: true, link: null }] };
  const attempt = n => {
    const code = netCode();
    NET.tp = tpHost(o.kind, code, {
      ready() { NET.code = code; hostLobbyChanged(); },
      error(m) { if (m === 'taken' && n < 6) { try { NET.tp.close(); } catch (e) { } attempt(n + 1); } else { nui('error', m === 'taken' ? 'Could not claim a room code. Try again.' : m); } },
      link: hostLink
    });
  };
  attempt(0);
}
function hostLink(l) {
  l.onmessage = s => { let m; try { m = JSON.parse(s); } catch (e) { return; } hostMsg(l, m); };
  l.onclose = () => hostGone(l);
}
function hostPlayers() { return NET.lobby.players.map(p => ({ id: p.id, name: p.name, kit: p.kit, ready: p.ready })); }
function hostLobbyChanged() {
  const msg = { t: 'lobby', code: NET.code, mode: NET.lobby.mode, goal: NET.lobby.goal, max: NET.lobby.max, players: hostPlayers() };
  for (const p of NET.lobby.players) if (p.link) nsend(p.link, msg);
  nui('lobby');
}
function hostBroadcast(o, except) { for (const p of NET.lobby.players) if (p.link && p.link !== except) nsend(p.link, o); }
function cleanName(n, taken) {
  let s = String(n || 'Player').replace(/[<>&"]/g, '').trim().slice(0, 12) || 'Player', b = s, k = 1;
  while (taken.includes(s)) s = b + ' ' + (++k);
  return s;
}
function hostMsg(l, m) {
  if (!m || typeof m.t !== 'string') return;
  const lob = NET.lobby;
  if (m.t === 'hello') {
    if (NET.started) {
      if (lob.mode === 'coop') {
        const pl = MP.players.find(q => q.gone && q.name === m.name);
        if (pl) {
          pl.gone = false; pl.link = l; l.slot = pl.i;
          nsend(l, { t: 'welcome', id: pl.i, mode: 'coop', goal: 0, max: lob.max, code: NET.code });
          nsend(l, { t: 'start', mode: 'coop', me: pl.i, kit: pl.kit, ws: SAVE.ws, players: MP.players.map(q => q.name) });
          mpAs(pl.i, () => msg(pl.name + ' rejoined.', 'good'));
          mpSendFull(pl.i); mpBroadcast(); hostChat('', pl.name + ' rejoined.');
          return;
        }
      }
      nsend(l, { t: 'rej', reason: 'That game has already started.' }); setTimeout(() => l.close(), 200); return;
    }
    if (lob.players.length >= lob.max) { nsend(l, { t: 'rej', reason: 'The room is full.' }); setTimeout(() => l.close(), 200); return; }
    const id = Math.max(...lob.players.map(p => p.id)) + 1;
    const kit = KITS.find(k => k.id === m.kit) ? m.kit : 'wanderer';
    const pl = { id, name: cleanName(m.name, lob.players.map(p => p.name)), kit, ready: false, link: l };
    lob.players.push(pl); l.pid = id;
    nsend(l, { t: 'welcome', id, name: pl.name, mode: lob.mode, goal: lob.goal, max: lob.max, code: NET.code });
    hostLobbyChanged(); hostChat('', pl.name + ' joined.');
    return;
  }
  if (m.t === 'leave') { hostGone(l); return; }
  if (!NET.started) {
    const pl = lob.players.find(p => p.link === l); if (!pl) return;
    if (m.t === 'kit' && KITS.find(k => k.id === m.kit)) { pl.kit = m.kit; hostLobbyChanged(); }
    else if (m.t === 'ready') { pl.ready = !!m.v; hostLobbyChanged(); }
    else if (m.t === 'chat') hostChat(pl.name, String(m.text || '').slice(0, 140));
    return;
  }
  if (lob.mode === 'coop') {
    const slot = l.slot;
    if (slot === undefined) return;
    if (m.t === 'cmd') mpExec(slot, m);
    else if (m.t === 'chat') hostChat(MP.players[slot].name, String(m.text || '').slice(0, 140));
    else if (m.t === 'ping') hostPing(slot, m.x, m.y);
  } else {
    const pl = lob.players.find(p => p.link === l); if (!pl) return;
    if (m.t === 'prog') raceProg(pl.id, m);
    else if (m.t === 'chat') hostChat(pl.name, String(m.text || '').slice(0, 140));
  }
}
function hostChat(name, text) {
  const o = { t: 'chat', name, text };
  hostBroadcast(o); netChatIn(name, text);
}
function hostPing(slot, x, y) {
  if (!MP.co || !Number.isInteger(x) || !Number.isInteger(y) || !inb(x, y)) return;
  const pl = MP.players[slot];
  fxEmit({ x, y, pat: 'ring', cols: [ROLECOL[pl.kit] || '#fff', '#fff'], n: 20, R: 1.6, life: 800 });
  fxEmit({ x, y, pat: 'rise', cols: ['#fff'], ch: '!', n: 4, life: 900 });
  mpBroadcast();
}
function hostGone(l) {
  const lob = NET.lobby; if (!lob || l.gone) return; l.gone = true;
  if (!NET.started) {
    const i = lob.players.findIndex(p => p.link === l); if (i < 0) return;
    const nm = lob.players[i].name; lob.players.splice(i, 1); hostLobbyChanged(); hostChat('', nm + ' left.');
    return;
  }
  if (lob.mode === 'coop') { if (l.slot !== undefined) { const nm = MP.players[l.slot].name; mpLeft(l.slot); hostChat('', nm + ' disconnected. They can rejoin with the same name.'); } }
  else {
    const pl = lob.players.find(p => p.link === l); if (!pl) return;
    const b = NET.board[pl.id] = Object.assign({ name: pl.name, kit: pl.kit, depth: 0, kills: 0 }, NET.board[pl.id], { dead: true, left: true });
    hostChat('', pl.name + ' left the race.'); raceBoardOut(); raceCheckEnd();
  }
}
function hostStart() {
  const lob = NET.lobby; if (!lob || NET.started || NET.role !== 'host') return;
  if (lob.players.some(p => !p.ready)) return;
  const roster = lob.players.slice().sort((a, b) => a.id - b.id);
  NET.started = true;
  if (lob.mode === 'coop') {
    mpStartCoop(roster.map(p => ({ name: p.name, kit: p.kit, link: p.link })));
    roster.forEach((p, i) => { if (p.link) p.link.slot = i; });
    const names = MP.players.map(q => q.name);
    roster.forEach((p, i) => { if (p.link) nsend(p.link, { t: 'start', mode: 'coop', me: i, kit: p.kit, ws: SAVE.ws, players: names }); });
    MP.fxSent = FXN; MP.logSent = G.log.length ? G.log[G.log.length - 1].n : 0;
    roster.forEach((p, i) => { if (p.link) mpSendFull(i); });
    nui('start');
  } else {
    const seed = (Math.random() * 2147483647) | 0, ws = SAVE.ws, names = roster.map(p => ({ name: p.name, kit: p.kit }));
    roster.forEach((p, i) => { p.idx = i; if (p.link) nsend(p.link, { t: 'start', mode: 'race', me: i, kit: p.kit, seed, ws, goal: lob.goal, players: names }); });
    NET.board = {}; roster.forEach((p, i) => { NET.board[i] = { name: p.name, kit: p.kit, depth: 1, kills: 0, hp: 30, mhp: 30, dead: false, ms: 0 }; });
    MP.sendProg = st => raceProg(0, st);
    mpStartRace({ seed, ws, goal: lob.goal, kit: roster[0].kit, host: true, me: 0, players: names });
    nui('start');
  }
}
let raceBoardTimer = 0;
function raceProg(id, st) {
  if (!NET.lobby || NET.lobby.mode !== 'race' || !MP.race || MP.race.over) return;
  const pl = NET.lobby.players.find(p => p.id === id); if (!pl) return;
  const idx = NET.lobby.players.slice().sort((a, b) => a.id - b.id).findIndex(p => p.id === id);
  const num = v => Number.isFinite(+v) ? +v : 0;
  NET.board[idx] = { name: pl.name, kit: pl.kit, depth: num(st.depth), kills: num(st.kills), hp: num(st.hp), mhp: num(st.mhp), dead: !!st.dead, ms: num(st.ms) };
  if (!raceBoardTimer) raceBoardTimer = setTimeout(() => { raceBoardTimer = 0; raceBoardOut(); }, 120);
  raceCheckEnd();
}
function raceBoardOut() { hostBroadcast({ t: 'board', board: NET.board }); nui('board'); }
function raceCheckEnd() {
  const r = MP.race; if (!r || r.over) return;
  const rank = mpRank(NET.board);
  const win = rank.find(b => b.depth >= NET.lobby.goal);
  if (win) { raceEnd('reached depth ' + NET.lobby.goal, win.i); return; }
  if (rank.length && rank.every(b => b.dead)) raceEnd('everyone fell', null);
}
function raceEnd(reason, winner) {
  const r = MP.race; if (!r || r.over) return;
  r.over = true;
  const rank = mpRank(NET.board);
  const o = { t: 'end', reason, winner: winner === null ? (rank[0] ? rank[0].i : null) : winner, reached: winner !== null, rank, ms: Date.now() - r.t0 };
  hostBroadcast(o); NET.result = o; nui('end', o);
}
function netEndRace() { if (NET.role === 'host' && MP.race && !MP.race.over) raceEnd('ended by the host', null); }

// ---------- guest ----------
function netJoinRoom(o) {
  netReset();
  Object.assign(NET, { role: 'guest', kind: o.kind, name: o.name, kit: o.kit, code: String(o.code).toUpperCase().trim() });
  NET.tp = tpJoin(o.kind, NET.code, {
    link(l) {
      NET.link = l;
      l.onmessage = s => { let m; try { m = JSON.parse(s); } catch (e) { return; } guestMsg(m); };
      l.onclose = () => { if (NET.role === 'guest') nui('closed', 'The host left the room.'); };
      nsend(l, { t: 'hello', name: o.name, kit: o.kit, v: 1 });
    },
    error: m => nui('error', m)
  });
}
function guestMsg(m) {
  if (!m || typeof m.t !== 'string') return;
  if (m.t === 'welcome') { NET.me = m.id; if (m.name) NET.name = m.name; NET.lobby = { mode: m.mode, goal: m.goal, max: m.max, players: [] }; nui('lobby'); }
  else if (m.t === 'lobby') { NET.code = m.code; NET.lobby = { mode: m.mode, goal: m.goal, max: m.max, players: m.players }; nui('lobby'); }
  else if (m.t === 'rej') { nui('error', m.reason); }
  else if (m.t === 'start') {
    NET.started = true; NET.board = {};
    if (m.mode === 'coop') {
      mpShadowOn(m.ws); mpGuestInit({ me: m.me, kit: m.kit });
      MP.sendHost = o => nsend(NET.link, o); NET.waitSnap = true;
      nui('waiting');
    } else {
      NET.lobby.mode = 'race'; NET.lobby.goal = m.goal;
      MP.sendProg = st => nsend(NET.link, Object.assign({ t: 'prog' }, st));
      mpStartRace({ seed: m.seed, ws: m.ws, goal: m.goal, kit: m.kit, host: false, me: m.me, players: m.players });
      nui('start');
    }
  }
  else if (m.t === 'snap') {
    mpApplySnapshot(m);
    if (NET.waitSnap) { NET.waitSnap = false; nui('start'); } else nui('snap');
  }
  else if (m.t === 'chat') netChatIn(m.name, m.text);
  else if (m.t === 'board') { NET.board = m.board; nui('board'); }
  else if (m.t === 'end') { if (MP.race) MP.race.over = true; NET.result = m; nui('end', m); }
  else if (m.t === 'bye') nui('closed', m.reason || 'The host closed the room.');
}
function netChatIn(name, text) {
  NET.chat.push({ name, text }); if (NET.chat.length > 40) NET.chat.shift();
  nui('chat');
}

// ---------- shared ----------
function netSend(o) { if (NET.role === 'guest' && NET.link) nsend(NET.link, o); }
function netChat(text) {
  text = String(text || '').trim().slice(0, 140); if (!text) return;
  if (NET.role === 'host') hostChat(NET.name, text); else netSend({ t: 'chat', text });
}
function netPing(x, y) {
  if (!MP.co) return;
  if (NET.role === 'host') hostPing(0, x, y); else netSend({ t: 'ping', x, y });
}
function netSetKit(kit) {
  NET.kit = kit;
  if (NET.role === 'host') { NET.lobby.players[0].kit = kit; hostLobbyChanged(); } else netSend({ t: 'kit', kit });
}
function netReady(v) { if (NET.role === 'guest') netSend({ t: 'ready', v: !!v }); }
function netLeave() {
  if (NET.role === 'host' && NET.lobby) hostBroadcast({ t: 'bye', reason: 'The host closed the room.' });
  else if (NET.role === 'guest' && NET.link) nsend(NET.link, { t: 'leave' });
  const wasMP = MP.on;
  setTimeout(() => { }, 0);
  netReset(); NET.ui = NET.ui; // keep ui callbacks
  if (wasMP || MP.realSave) { mpShadowOff(); }
  mpReset();
}
