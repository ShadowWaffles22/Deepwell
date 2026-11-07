// ---------- multiplayer interface: lobby, party panel, chat, results ----------
const MPPREF = 'deepwell.mp';
const mpPref = () => { try { return JSON.parse(localStorage.getItem(MPPREF)) || {}; } catch (e) { return {}; } };
const mpSetPref = o => { try { localStorage.setItem(MPPREF, JSON.stringify(Object.assign(mpPref(), o))); } catch (e) { } };
const LK = { kind: 'peer', mode: 'coop', busy: false };
const MODEDESC = {
  coop: 'Up to 4 heroes share one dungeon. Everyone acts when they like and every action moves the world on. Descending takes the whole party along. Stand next to a fallen friend and press E to revive them; the fallen also wake at the foot of the next stairs.',
  race: 'Up to 8 players run the very same dungeon at once: same floors, same loot, same secret potion colors. A live scoreboard tracks everyone. First to the goal depth wins.'
};
const heroIcon = (kit, dim) => ji(SPR['p_' + kit] ? 'p_' + kit : 'player', ROLECOL[kit] || '#d9dce6', dim);
let toastT = 0;
function toast(t, ms) {
  const el = $('toast'); el.textContent = t; el.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, ms || 3200);
}

// ----- the peer library is only fetched when someone really goes online -----
const PEER_URLS = ['https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js', 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'];
function ensurePeer(cb, fail) {
  if (LK.kind === 'local' || peerLib()) { cb(); return; }
  let i = 0;
  const next = () => {
    if (i >= PEER_URLS.length) { fail('The online networking library could not be loaded. Check your connection, or use "This device (other tab)".'); return; }
    const sc = document.createElement('script');
    sc.src = PEER_URLS[i++]; sc.onload = () => (peerLib() ? cb() : next()); sc.onerror = next;
    document.head.appendChild(sc);
  };
  next();
}

// ----- lobby -----
function fillKits(sel, val) {
  sel.innerHTML = KITS.map(k => `<option value="${k.id}">${esc(k.n)}</option>`).join('');
  sel.value = KITS.find(k => k.id === val) ? val : 'wanderer';
}
function lobbyErr(m) { const e = $('lerr'); e.textContent = m || ''; e.hidden = !m; }
function openLobby() {
  const pr = mpPref();
  $('lname').value = pr.name || '';
  fillKits($('lkit'), pr.kit || kitSel);
  LK.kind = pr.kind || 'peer'; LK.mode = pr.mode || 'coop';
  $('lgoal').value = pr.goal || 10;
  setSeg('lkind', LK.kind); setSeg('lmode', LK.mode); lobbyModeUI();
  lobbyErr('');
  $('lobby').hidden = false;
  renderLobby();
}
function setSeg(id, v) { document.querySelectorAll('#' + id + ' button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); }
function lobbyModeUI() {
  $('lmodedesc').textContent = MODEDESC[LK.mode];
  $('lgoalf').hidden = LK.mode !== 'race';
  $('lnote').textContent = LK.kind === 'peer'
    ? 'Online play connects players directly (WebRTC) using a free public matchmaking service. Both players need internet. Strict corporate or school networks can block it; if so, try another network.'
    : 'Open this page in a second tab or window on this device, host in one and join with the code in the other.';
}
$('lkind').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; LK.kind = b.dataset.v; setSeg('lkind', LK.kind); lobbyModeUI(); });
$('lmode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; LK.mode = b.dataset.v; setSeg('lmode', LK.mode); lobbyModeUI(); });
$('mpbtn').onclick = openLobby;
$('lclose').onclick = () => { if (NET.role) { return; } $('lobby').hidden = true; };
function lobbyArgs() {
  const name = ($('lname').value || '').trim().slice(0, 12) || 'Player', kit = $('lkit').value;
  mpSetPref({ name, kit, kind: LK.kind, mode: LK.mode, goal: +$('lgoal').value || 10 });
  return { name, kit };
}
$('lhost').onclick = () => {
  if (LK.busy) return;
  const a = lobbyArgs(), goal = Math.max(3, Math.min(40, +$('lgoal').value || 10));
  lobbyErr(''); LK.busy = true; $('lhost').textContent = 'Opening room…';
  ensurePeer(() => netHostRoom({ kind: LK.kind, name: a.name, kit: a.kit, mode: LK.mode, goal }), m => { LK.busy = false; $('lhost').textContent = 'Create room'; lobbyErr(m); });
};
$('ljoin').onclick = () => {
  if (LK.busy) return;
  const code = ($('lcode').value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 5) { lobbyErr('Room codes are 5 letters and numbers.'); return; }
  const a = lobbyArgs();
  lobbyErr(''); LK.busy = true; $('ljoin').textContent = 'Joining…';
  ensurePeer(() => netJoinRoom({ kind: LK.kind, name: a.name, kit: a.kit, code }), m => { LK.busy = false; $('ljoin').textContent = 'Join'; lobbyErr(m); });
};
$('lcode').addEventListener('keydown', e => { if (e.key === 'Enter') $('ljoin').click(); });
function roomLink() {
  const base = location.href.split(/[?#]/)[0];
  return base + '?join=' + NET.code + (NET.kind === 'local' ? '&kind=local' : '');
}
$('lcopy').onclick = () => {
  const link = roomLink();
  const done = () => toast('Invite link copied. Or just tell them the code: ' + NET.code, 3500);
  try { navigator.clipboard.writeText(link).then(done, () => toast(link, 8000)); } catch (e) { toast(link, 8000); }
};
$('lready').onclick = () => { const me = NET.lobby && NET.lobby.players.find(p => p.id === NET.me); netReady(!(me && me.ready)); };
$('lstart').onclick = () => hostStart();
$('lleave').onclick = () => { netLeave(); LK.busy = false; $('lhost').textContent = 'Create room'; $('ljoin').textContent = 'Join'; renderLobby(); };
$('lkit2').onchange = () => { netSetKit($('lkit2').value); mpSetPref({ kit: $('lkit2').value }); };
function renderLobby() {
  const inRoom = !!(NET.role && NET.lobby && (NET.role === 'host' ? NET.code : true));
  $('lstep1').hidden = inRoom; $('lstep2').hidden = !inRoom;
  $('lclose').hidden = inRoom;
  if (!inRoom) return;
  const lob = NET.lobby, host = NET.role === 'host';
  $('lroomcode').textContent = NET.code || '…';
  $('lcopy').hidden = !NET.code;
  const isRace = lob.mode === 'race';
  $('lroominfo').textContent = (isRace ? 'Race to depth ' + lob.goal + '. Up to ' + lob.max + ' players. ' : 'Co-op, up to ' + lob.max + ' heroes. ') + (host ? 'You are the host.' : 'Waiting for the host to start.');
  const me = lob.players.find(p => p.id === NET.me);
  $('lplayers').innerHTML = lob.players.map(p => `<div class="lplayer">${heroIcon(p.kit)}<span class="nm">${esc(p.name)}${p.id === NET.me ? ' <span class="dim">(you)</span>' : ''}${p.id === 0 ? ' <span class="dim">· host</span>' : ''}</span><span class="dim">${esc((KITS.find(k => k.id === p.kit) || {}).n || '')}</span><span class="tag ${p.ready ? 'ok' : ''}">${p.ready ? 'Ready' : 'Not ready'}</span></div>`).join('');
  const sel = $('lkit2'); if (!sel.options.length) fillKits(sel, NET.kit);
  if (me && sel.value !== me.kit && document.activeElement !== sel) sel.value = me.kit;
  $('lready').hidden = host; $('lready').textContent = me && me.ready ? 'Not ready' : 'Ready';
  $('lstart').hidden = !host;
  const all = lob.players.every(p => p.ready), n = lob.players.length;
  $('lstart').disabled = !(all && n >= 2);
  $('lstart').textContent = 'Start (' + n + ' player' + (n > 1 ? 's' : '') + ')';
  $('lwait').textContent = host ? (n < 2 ? 'Share the code and wait for at least one friend.' : all ? 'Everyone is ready.' : 'Waiting for everyone to press Ready.') : (me && me.ready ? 'You are ready. Waiting for the host.' : 'Press Ready when you are set.');
  renderChat();
}
function renderChat() {
  const html = NET.chat.slice(-30).map(c => c.name ? `<div><b>${esc(c.name)}</b> ${esc(c.text)}</div>` : `<div class="sys">${esc(c.text)}</div>`).join('');
  for (const id of ['lchat', 'chatlog']) { const el = $(id); if (!el) continue; el.innerHTML = html; el.scrollTop = el.scrollHeight; }
}
function sendChat(inp) { const t = inp.value.trim(); inp.value = ''; if (t) netChat(t); }
$('lchatsend').onclick = () => sendChat($('lchatin'));
$('lchatin').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat($('lchatin')); });
$('chatsend').onclick = () => sendChat($('chatin'));
$('chatin').addEventListener('keydown', e => { if (e.key === 'Enter') { sendChat($('chatin')); e.target.blur(); } else if (e.key === 'Escape') e.target.blur(); });
$('quick').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'pingbtn') { if (!MP.co) return; mode = mode === 'ping' ? null : 'ping'; hint(mode ? 'Tap a tile to ping it for your party. (On a computer: right-click.)' : ''); return; }
  if (b.dataset.q) netChat(b.dataset.q);
});

// ----- NET callbacks -----
function mpToTitle(msg) {
  try { netLeave(); } catch (e) { }
  LK.busy = false; $('lhost').textContent = 'Create room'; $('ljoin').textContent = 'Join';
  $('lobby').hidden = true; $('mpend').hidden = true; $('partycard').hidden = true;
  autoRun = null; mode = null; hint('');
  document.body.classList.remove('packopen');
  renderTitle(); setView('title');
  if (msg) toast(msg, 4500);
}
let tickT = 0;
function mpEnterGame() {
  LK.busy = false; $('lhost').textContent = 'Create room'; $('ljoin').textContent = 'Join';
  $('lobby').hidden = true; $('mpend').hidden = true;
  $('partycard').hidden = false;
  $('pingbtn').hidden = !MP.co;
  document.body.classList.remove('packopen');
  enterGame();
  clearInterval(tickT); tickT = setInterval(() => { if (MP.on && MP.mode === 'race') renderParty(); }, 1000);
  toast(MP.co ? 'Co-op: you are ' + (MP.players[MP.me] ? MP.players[MP.me].name : 'a hero') + '. Descending takes the whole party.' : 'Race! First to depth ' + NET.lobby.goal + ' wins.', 4200);
}
Object.assign(NET.ui, {
  lobby() { LK.busy = false; $('lhost').textContent = 'Create room'; $('ljoin').textContent = 'Join'; if ($('lobby').hidden) $('lobby').hidden = false; renderLobby(); },
  error(m) {
    LK.busy = false; $('lhost').textContent = 'Create room'; $('ljoin').textContent = 'Join';
    if (view === 'game' || view === 'dead') { toast(m, 4500); return; }
    try { netLeave(); } catch (e) { }
    $('lobby').hidden = false; renderLobby(); lobbyErr(m);
  },
  closed(m) { mpToTitle(m || 'The host left the room.'); },
  waiting() { $('lwait').textContent = 'The host started. Loading the dungeon…'; },
  start() { mpEnterGame(); },
  snap() { mpRefresh(); if (autoRun && MPG) stepAuto(); },
  hsnap() { mpRefresh(); },
  chat() {
    renderChat();
    const c = NET.chat[NET.chat.length - 1];
    if (c && c.name && c.name !== NET.name && (view === 'game' || view === 'dead')) toast(c.name + ': ' + c.text, 2600);
  },
  board() {
    const prev = mpPrevDepth, cur = NET.board || {};
    for (const k in cur) {
      if (prev[k] !== undefined && cur[k].depth > prev[k] && +k !== NET.me) { NET.chat.push({ name: '', text: cur[k].name + ' reached depth ' + cur[k].depth + '.' }); renderChat(); toast(cur[k].name + ' reached depth ' + cur[k].depth, 2200); }
      if (prev[k] !== undefined && cur[k].dead && !(prev.dead || {})[k] && +k !== NET.me) { NET.chat.push({ name: '', text: cur[k].name + (cur[k].left ? ' left the race.' : ' has fallen on depth ' + cur[k].depth + '.') }); renderChat(); }
    }
    mpPrevDepth = {}; mpPrevDepth.dead = {};
    for (const k in cur) { mpPrevDepth[k] = cur[k].depth; mpPrevDepth.dead[k] = cur[k].dead; }
    if (view === 'game' || view === 'dead') { renderParty(); if (view === 'dead') mpShowDead(); }
  },
  end(o) { showMpEnd(o); }
});
let mpPrevDepth = {}, rfSig = '';
// redraw after other players acted. The pack list is only rebuilt when it changed, so taps are never swallowed.
function mpRefresh() {
  if (view !== 'game' && view !== 'draft' && view !== 'dead') return;
  if (G.pending && G.pending.type === 'draft' && view !== 'draft') showDraft();
  if (G.dead && view !== 'dead') showDead();
  hud(); logs(); draw(); inspect(); renderParty();
  const sig = JSON.stringify(G.inv) + '|' + (featHere() ? 1 : 0) + '|' + mode + '|' + mixFirst;
  if (sig !== rfSig) { rfSig = sig; pack(); }
}

// ----- party panel -----
const mmss = ms => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function hpBar(p, col) { const f = Math.max(0, Math.min(1, p.hp / Math.max(1, p.mhp))); return `<div class="pbar"><i style="width:${f * 100}%;background:${col}"></i></div>`; }
function renderParty() {
  if (!MP.on) return;
  const list = $('partylist'), ban = $('partybanner');
  if (MP.co) {
    $('partytitle').textContent = 'Party';
    $('partysub').textContent = 'Depth ' + G.depth;
    list.innerHTML = MP.players.map(pl => {
      const p = pl.p || { hp: 0, mhp: 1 }, me = pl.i === MP.me;
      const st = pl.gone ? 'away' : p.down ? 'DOWN' : p.hp + '/' + p.mhp;
      return `<div class="pm ${me ? 'me' : ''} ${p.down ? 'down' : ''} ${pl.gone ? 'gone' : ''}">${heroIcon(pl.kit, p.down || pl.gone)}<div class="who"><b>${esc(pl.name)}${me ? ' (you)' : ''}</b>${hpBar(p, p.down ? '#6a2f38' : ROLECOL[pl.kit] || '#7fe0a0')}</div><span class="st">${st}</span></div>`;
    }).join('');
    const mine = G.p && G.p.down, near = mpNearDown();
    ban.hidden = !(mine || near);
    ban.textContent = mine ? 'You are down. A friend can revive you, or you will wake when the party takes the stairs.' : near ? near.name + ' is down beside you. Press E (Revive) to pull them up.' : '';
    ban.style.borderColor = near && !mine ? '#2f6a48' : ''; ban.style.background = near && !mine ? '#13261b' : ''; ban.style.color = near && !mine ? '#a8f0c0' : '';
  } else {
    const r = MP.race, board = NET.board || {}, rank = mpRank(board), goal = NET.lobby ? NET.lobby.goal : 0;
    $('partytitle').textContent = 'Race to depth ' + goal;
    $('partysub').textContent = r ? (r.over ? 'finished' : mmss(Date.now() - r.t0)) : '';
    ban.hidden = true;
    list.innerHTML = rank.map((b, n) => `<div class="pm ${b.i === NET.me ? 'me' : ''} ${b.dead ? 'down' : ''}">${heroIcon(b.kit, b.dead)}<div class="who"><b>${n + 1}. ${esc(b.name)}${b.i === NET.me ? ' (you)' : ''}</b>${hpBar({ hp: b.hp, mhp: b.mhp }, b.dead ? '#6a2f38' : ROLECOL[b.kit] || '#7fe0a0')}</div><span class="st">${b.left ? 'left' : b.dead ? 'fell · ' : ''}D${b.depth} · ${b.kills || 0}k</span></div>`).join('') || '<div class="dim">Waiting for the first scores…</div>';
  }
}

// ----- game over screens -----
function mpShowDead() {
  if (MP.co) {
    const o = MP.over || MP.players.map(pl => ({ name: pl.name, kills: pl.kills || 0, echoes: pl.echoes || 0 }));
    $('deadmsg').textContent = 'The party is lost on depth ' + G.depth + (G.cause ? '. ' + G.cause : '') + '.';
    $('deadstat').innerHTML = o.map(x => esc(x.name) + ': ' + x.kills + ' kills' + (x.echoes ? ' · +' + x.echoes + ' echoes' : '')).join('<br>');
    $('again').textContent = 'Return to the surface';
  } else {
    const rank = mpRank(NET.board || {});
    $('deadmsg').textContent = 'You fell on depth ' + G.depth + (G.cause ? ' to ' + G.cause : '') + '. The race goes on.';
    $('deadstat').innerHTML = rank.map((b, n) => (n + 1) + '. ' + esc(b.name) + (b.i === NET.me ? ' (you)' : '') + ': depth ' + b.depth + (b.dead ? ' (fallen)' : '')).join('<br>');
    $('again').textContent = 'Leave the race';
  }
}
function showMpEnd(o) {
  if (view === 'title') return;
  $('mpend').hidden = false;
  const winner = o.rank.find(b => b.i === o.winner);
  const iWon = o.winner === NET.me && o.reached;
  $('mpendt').textContent = o.reached ? (iWon ? 'You win the race!' : (winner ? winner.name : 'Someone') + ' wins the race') : 'Race over';
  $('mpendr').textContent = (o.reached ? 'First to depth ' + NET.lobby.goal + ' in ' + mmss(o.ms) + '.' : 'The race ended: ' + o.reason + '.') + (o.reached ? '' : ' Highest depth takes the title.');
  $('mpendtab').innerHTML = '<tr><th>#</th><th>Player</th><th>Depth</th><th>Kills</th><th>Status</th></tr>' + o.rank.map((b, n) => `<tr class="${b.i === NET.me ? 'me' : ''} ${b.i === o.winner ? 'win' : ''}"><td>${b.i === o.winner ? '★' : n + 1}</td><td>${esc(b.name)}</td><td>${b.depth}</td><td>${b.kills || 0}</td><td>${b.left ? 'left' : b.dead ? 'fallen' : 'alive'}</td></tr>`).join('');
  $('mpendbtn').textContent = 'Back to menu';
}
$('mpendbtn').onclick = () => mpToTitle();

// ----- leaving mid-game -----
let leaveArm = 0;
function mpMenu() {
  if (!leaveArm) {
    leaveArm = setTimeout(() => { leaveArm = 0; $('menu').textContent = 'Menu'; }, 2500);
    $('menu').textContent = NET.role === 'host' ? 'Close the room? Tap again' : 'Leave? Tap again';
    return;
  }
  clearTimeout(leaveArm); leaveArm = 0; $('menu').textContent = 'Menu';
  mpToTitle();
}
// invite links: ?join=CODE opens the lobby with the code filled in
(function () {
  try {
    const q = new URLSearchParams(location.search), c = (q.get('join') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (c.length === 5) { setTimeout(() => { openLobby(); $('lcode').value = c; if (q.get('kind') === 'local') { LK.kind = 'local'; setSeg('lkind', 'local'); lobbyModeUI(); } $('lname').focus(); }, 0); }
  } catch (e) { }
})();
