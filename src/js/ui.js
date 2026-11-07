// ---------- interface ----------
const $=id=>document.getElementById(id);
const cv=$('map'),cx=cv.getContext('2d');
let PH=false,VW=W,VH=H,camX=0,camY=0;
let autoTarget=null;
let TS=20,mode=null,hover=null,mixFirst=null,throwIdx=null,view='title',tab='pack',kitSel='wanderer',autoRun=null;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function setView(v){
 view=v;
 $('title').hidden=v!=='title';
 $('game').hidden=v==='title';
 $('draft').hidden=v!=='draft';
 $('dead').hidden=v!=='dead';
 $('journal').hidden=v!=='journal';
 if(v==='game'||v==='draft'||v==='dead')requestAnimationFrame(()=>{fit();draw()});
}
function fit(){
 const box=$('mapbox'),w=box.clientWidth||360;
 TS=PH?16:(w>=720?24:16);
 VW=Math.min(W,Math.floor(w/TS));VH=Math.min(H,Math.max(9,Math.floor((PH?innerHeight*0.4:Math.max(420,innerHeight-170))/TS)));
 const dpr=window.devicePixelRatio||1;
 cv.style.width=VW*TS+'px';cv.style.height=VH*TS+'px';
 cv.width=VW*TS*dpr;cv.height=VH*TS*dpr;cx.setTransform(dpr,0,0,dpr,0,0);
}
// ----- title -----
function renderTitle(){
 const kits=KITS.map(k=>{
  const un=SAVE.unlocked[k.id];
  return`<button class="kit ${kitSel===k.id?'sel':''} ${un?'':'locked'}" data-kit="${k.id}"><b>${k.n}</b><span>${k.d}</span><em>${un?'Unlocked':k.cost<0?'Deed: '+DEEDS.find(d=>d.id===k.deed).h:k.cost+' echoes'}</em></button>`}).join('');
 $('kits').innerHTML=kits;
 $('echoes').textContent=SAVE.echoes;
 $('stat').textContent='Deepest '+(SAVE.best||'-')+'  ·  Runs '+SAVE.runs+'  ·  Kills '+SAVE.kills+'  ·  Deeds '+Object.keys(SAVE.deeds||{}).length+'/'+DEEDS.length;
 $('cont').hidden=!SAVE.run;
 if(SAVE.run)$('cont').textContent='Continue (depth '+SAVE.run.depth+')';
 const k=KITS.find(x=>x.id===kitSel);
 $('begin').textContent=SAVE.unlocked[k.id]?'Descend as '+k.n:k.cost<0?'Locked. Earn a deed.':'Unlock '+k.n+' for '+k.cost+' echoes';
 $('begin').disabled=!SAVE.unlocked[k.id]&&(k.cost<0||SAVE.echoes<k.cost);
}
$('kits').addEventListener('click',e=>{const b=e.target.closest('[data-kit]');if(!b)return;kitSel=b.dataset.kit;renderTitle()});
$('begin').onclick=()=>{
 const k=KITS.find(x=>x.id===kitSel);
 if(!SAVE.unlocked[k.id]){if(k.cost<0||SAVE.echoes<k.cost)return;SAVE.echoes-=k.cost;SAVE.unlocked[k.id]=1;persist();renderTitle();return}
 if(SAVE.run&&!confirm2('begin')){return}
 startNew(k.id);
};
let armed=null;
function confirm2(key){if(armed===key){armed=null;return true}armed=key;const b=key==='begin'?$('begin'):$('reset');b.dataset.old=b.textContent;b.textContent='Tap again to confirm';setTimeout(()=>{if(armed===key){armed=null;renderTitle();$('reset').textContent='Forget everything'}},2500);return false}
function startNew(id){newRun(id);enterGame()}
$('cont').onclick=()=>{if(resumeRun())enterGame()};
$('reset').onclick=()=>{if(confirm2('reset')){resetWorld();renderTitle();$('reset').textContent='Forget everything'}};
function enterGame(){mode=null;mixFirst=null;throwIdx=null;setView('game');sync()}
// ----- sync -----
function sync(){
 if(G.pending&&G.pending.type==='draft'&&view!=='draft')showDraft();
 if(G.dead&&view!=='dead')showDead();
 hud();pack();logs();draw();inspect();
 if(MP.on)renderParty();
}
function showDraft(){
 view='draft';$('draft').hidden=false;
 $('draftopts').innerHTML=G.pending.opts.map(id=>{const p=PERKS.find(q=>q.id===id);const r=pkN(id);
  return`<button class="perk" data-perk="${id}"><b>${p.n}</b><i>${r?'rank '+r+' → '+(r+1):'new'}</i><span>${p.d}</span></button>`}).join('');
 $('drafttitle').textContent=G.pending.bonus?'The Warden yields a gift':'Depth '+G.depth+': take one gift';
}
$('draftopts').addEventListener('click',e=>{const b=e.target.closest('[data-perk]');if(!b)return;
 const bonus=G.pending.bonus;choosePerk(b.dataset.perk);
 if(G.pending&&G.pending.type==='draft'){showDraft();return}
 setView('game');sync();if(!bonus)saveRun();
});
function showDead(){
 setView('dead');
 $('deadmsg').textContent='Killed by '+G.cause+' on depth '+G.depth+'.';
 $('deadstat').textContent=G.kills+' kills  ·  '+G.tick+' turns  ·  +'+G.echoes+' echoes';
 if(MP.on)mpShowDead();
}
$('again').onclick=()=>{if(MP.on||NET.role)mpToTitle();else{renderTitle();setView('title')}};
// ----- hud -----
const STN={haste:'Hasted',fireproof:'Fireproof',slow:'Slowed',oiled:'Oiled',charge:'Charged',hidden:'Hidden',might:'Mighty',poison:'Poisoned',burn:'Burning',frozen:'Frozen',stone:'Stone',reborn:'Phoenix',echo:'Echo',chrono:'Chrono',confused:'Confused',slowed:'Slowed',doomed:'Doomed',corroded:'Corroded'};
function hud(){
 const P=G.p;
 $('hpbar').style.width=Math.max(0,P.hp/P.mhp*100)+'%';$('hptxt').textContent=P.hp+' / '+P.mhp;
 $('satbar').style.width=Math.min(100,P.sat/18)+'%';
 $('satbar').className=P.sat<150?'low':'';
 $('satlab').textContent=P.sat<=0?'Starving':P.sat<150?'Weak with hunger':P.sat<500?'Hungry':'Fed';
 $('depth').textContent=G.depth;
 $('wpn').textContent=iname({t:'wpn',w:P.wpn.w,e:P.wpn.e})+' · '+(WPN[P.wpn.w].lo+P.wpn.e+pkN('keen')*2)+'-'+(WPN[P.wpn.w].hi+P.wpn.e+pkN('keen')*2);
 $('arm').textContent=iname({t:'arm',lv:P.arm.lv,e:P.arm.e})+' · '+armorVal();
 {const fh=featHere(),nd=mpNearDown();$('bint').hidden=!(fh||nd);$('pint').hidden=!(fh||nd);if(fh||nd)$('bint').textContent=nd?'Revive':fh.k==='altar'?'Altar':'Drink'}
 $('status').innerHTML=Object.keys(P.st).filter(k=>P.st[k]>0&&STN[k]).map(k=>`<span class="chip">${STN[k]}${P.st[k]>1&&k!=='reborn'?' '+P.st[k]:''}</span>`).join('');
 $('laws').innerHTML=(L.biome?'<span class="law" style="border-color:#4a6a8a;color:#9fc0e0">'+L.biome.n+'</span>':'')+L.laws.map(l=>`<span class="law" title="${LAWS[l].d}">${LAWS[l].n}</span>`).join('');
}
function logs(){
 const el=$('log');
 const rows=MP.co?G.log.slice(-60).map(mpLogLine).filter(Boolean).slice(-40):G.log.slice(-40);
 el.innerHTML=rows.map(l=>`<div class="l ${l.cls}">${esc(l.text)}</div>`).join('');
 el.scrollTop=el.scrollHeight;
}
onMsg=function(){};
// ----- pack -----
function pack(){
 if(tab==='perks'){$('packlist').innerHTML=Object.keys(G.perks).filter(k=>G.perks[k]).map(k=>{const p=PERKS.find(q=>q.id===k);return`<div class="row"><div class="nm"><b>${p.n}${p.max>1?' '+G.perks[k]+'/'+p.max:''}</b><small>${esc(p.d)}</small></div></div>`}).join('')||'<div class="empty">No gifts yet. One is offered on every new floor.</div>';return}
 const rows=G.inv.map((it,i)=>{
  const pot=it.t==='pot',cnt=it.n>1?' ×'+it.n:'';
  let sw='';if(pot){const c=potCol(it.k)[1];sw=`<i class="sw" style="background:${c}"></i>`}
  else if(it.t==='scr')sw='<i class="sw scr"></i>';
  else sw='<i class="sw eq"></i>';
  const acts=[];
  const lbl={pot:'Drink',scr:'Read',food:'Eat',wpn:'Wield',arm:'Wear',ring:(it.worn?'Remove':'Put on')}[it.t];
  if(it.t==='wand')acts.push(`<button data-a="zap" data-i="${i}" class="${mode==='zap'&&throwIdx===i?'on':''}">Zap</button>`);else acts.push(`<button data-a="use" data-i="${i}">${lbl}</button>`);
  if(pot){acts.push(`<button data-a="throw" data-i="${i}" class="${mode==='throw'&&throwIdx===i?'on':''}">Throw</button>`);acts.push(`<button data-a="mix" data-i="${i}" class="${mode==='mix'&&mixFirst===i?'on':''}">Mix</button>`)}
  {const fh=featHere();if(fh&&fh.k==='altar'&&!it.worn)acts.push(`<button data-a="offer" data-i="${i}">Offer</button>`)}
  acts.push(`<button data-a="drop" data-i="${i}" class="ghost">Drop</button>`);
  let sub='';
  if(pot&&SAVE.known[it.k])sub=POT[it.k].d;
  else if(pot)sub='Unidentified. Drinking and throwing both do something.';
  else if(it.t==='scr'&&SAVE.scrKnown[it.k])sub=SCR[it.k].d;
  else if(it.t==='wpn')sub=WPN[it.w].d;
  else if(it.t==='wand'&&SAVE.wandKnown&&SAVE.wandKnown[it.k])sub=WAND[it.k].d;
  else if(it.t==='wand')sub='Unidentified. Zapping it reveals what it does.';
  else if(it.t==='ring'&&SAVE.ringKnown&&SAVE.ringKnown[it.k])sub=RING[it.k].d+(it.p<0&&it.worn&&!it.unc?' It is cursed.':'');
  else if(it.t==='ring')sub='Unidentified. Wear it a while to learn it. It may be cursed.';
  const ring=mode==='mix'&&pot&&mixFirst!==null&&i!==mixFirst?'pick':'';
  return`<div class="row ${ring}" data-row="${i}">${sw}<div class="nm"><b>${esc(iname(it))}${cnt}</b><small>${esc(sub)}</small></div><div class="acts">${acts.join('')}</div></div>`}).join('');
 $('packlist').innerHTML=rows||'<div class="empty">Your pack is empty.</div>';
 $('packcount').textContent=G.inv.length+'/'+MAXPACK;
}
$('packlist').addEventListener('click',e=>{
 if(G.dead||G.pending)return;
 const b=e.target.closest('button[data-a]'),row=e.target.closest('[data-row]');
 if(mode==='mix'&&row&&!b){const j=+row.dataset.row;if(G.inv[j]&&G.inv[j].t==='pot'){doMix(mixFirst,j)}return}
 if(!b)return;
 const i=+b.dataset.i,a=b.dataset.a;
 if(a==='use'){mode=null;hint('');const t0=G.inv[i]&&G.inv[i].t;useItem(i);if(t0!=='wand')document.body.classList.remove('packopen');sync()}
 else if(a==='drop'){dropItem(i);sync()}
 else if(a==='offer'){offerItem(i);document.body.classList.remove('packopen');sync()}
 else if(a==='zap'){if(G.inv[i].c<=0){msg('The wand is empty.');sync()}else if(mode==='zap'&&throwIdx===i){mode=null;hint('');pack()}else{document.body.classList.remove('packopen');mode='zap';throwIdx=i;hint('Choose a direction. Tap a tile on the map.');pack()}}
 else if(a==='throw'){if(mode==='throw'&&throwIdx===i){mode=null}else{document.body.classList.remove('packopen');mode='throw';throwIdx=i;hint('Choose where to throw it. Tap a tile on the map.')}pack()}
 else if(a==='mix'){
  if(mode==='mix'&&mixFirst===i){if((G.inv[i].n||1)>=2)doMix(i,i);else{mode=null;mixFirst=null;pack();hint('')}}
  else if(mode==='mix'){doMix(mixFirst,i)}
  else{mode='mix';mixFirst=i;hint('Pick a second potion to combine. Pick the same one again to combine two of a stack.');pack()}
 }
});
function doMix(a,b){mode=null;mixFirst=null;hint('');mixPotions(a,b);document.body.classList.remove('packopen');sync()}
function hint(t){$('hint').textContent=t;$('hint').hidden=!t;$('phint').textContent=t;$('phint').hidden=!t}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('on',x===b));pack()});
// ----- input -----
function act(f){if(G.dead||G.pending||view!=='game')return;autoRun=null;f();mode=null;hint('');sync()}
const KEYS={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],a:[-1,0],d:[1,0],w:[0,-1],s:[0,1],h:[-1,0],l:[1,0],k:[0,-1],j:[0,1],y:[-1,-1],u:[1,-1],b:[-1,1],n:[1,1],'4':[-1,0],'6':[1,0],'8':[0,-1],'2':[0,1],'7':[-1,-1],'9':[1,-1],'1':[-1,1],'3':[1,1]};
document.addEventListener('keydown',e=>{
 if(e.target&&/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return;
 if(view==='journal'&&(e.key==='Escape'||e.key==='j')){closeJournal();return}
 if(view!=='game'||e.ctrlKey||e.metaKey||e.altKey)return;
 const k=e.key;
 if(k==='Escape'){mode=null;mixFirst=null;hint('');pack();return}
 if(KEYS[k]&&!(k==='j'&&false)){e.preventDefault();act(()=>tryMove(KEYS[k][0],KEYS[k][1]));return}
 if(k==='.'||k===' '||k==='5'){e.preventDefault();act(waitTurn);return}
 if(k==='>'||k==='Enter'){act(descendHere);return}
 if(k==='x'){e.preventDefault();startAuto('explore');return}
 if(k==='g'){e.preventDefault();startAuto('stairs');return}
 if(k==='i'||k==='J'){openJournal();return}
 if(k==='e'){act(interact);return}
});
function startAuto(kind){
 if(G.dead||G.pending)return;autoRun=kind;mode=null;hint('');stepAuto();
}
function stepAuto(){
 if(!autoRun||G.dead||G.pending||view!=='game'){autoRun=null;return}
 const P=G.p,hpBefore=P.hp;
 if(autoRun!=='goto'&&visMons().length){autoRun=null;msg('Something is in view. You stop.');sync();return}
 let ok=autoRun==='explore'?exploreStep():autoRun==='goto'?goStep(autoTarget[0],autoTarget[1]):stairsStep();
 if(!ok){
  if(autoRun==='goto'){if(P.x!==autoTarget[0]||P.y!==autoTarget[1])msg('You cannot find a way there.')}else if(autoRun==='explore'){msg('Nothing more to explore here.');}else if(P.x===L.down.x&&P.y===L.down.y)msg('You are on the stairs. Press > to descend.');else msg('No known path to the stairs yet. Explore first.');
  autoRun=null;sync();return}
 if(P.hp<hpBefore){autoRun=null}
 sync();
 if(autoRun&&!MPG)setTimeout(stepAuto,35);
}
function tileFromEvent(e){const r=cv.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)/r.width*VW)+camX,y=Math.floor((e.clientY-r.top)/r.height*VH)+camY;return[x,y]}
cv.addEventListener('mousemove',e=>{hover=tileFromEvent(e);inspect();draw()});
cv.addEventListener('contextmenu',e=>{if(!MP.co||view!=='game')return;e.preventDefault();const[x,y]=tileFromEvent(e);if(inb(x,y))netPing(x,y)});
cv.addEventListener('mouseleave',()=>{hover=null;inspect();draw()});
cv.addEventListener('click',e=>{
 if(view!=='game'||G.dead||G.pending)return;
 const[x,y]=tileFromEvent(e);if(!inb(x,y))return;hover=[x,y];inspect();
 if(mode==='ping'){mode=null;hint('');netPing(x,y);pack();return}
 if(mode==='zap'){const i=throwIdx;mode=null;hint('');autoRun=null;zapWand(i,x,y);sync();return}
 if(mode==='throw'){
  const t=tileAt(x,y);if(!t||!t.seen){hint('You can only throw at tiles you have seen.');return}
  const i=throwIdx;mode=null;hint('');autoRun=null;throwItem(i,x,y);sync();return}
 const P=G.p;
 if(x===P.x&&y===P.y){if(P.x===L.down.x&&P.y===L.down.y)act(descendHere);else act(waitTurn);return}
 const t=tileAt(x,y);if(!t||!t.seen||t.w){inspect();draw();return}
 const dx=x-P.x,dy=y-P.y;
 if(Math.max(Math.abs(dx),Math.abs(dy))===1){act(()=>tryMove(dx,dy));return}
 autoTarget=[x,y];startAuto('goto');
});
function affTxt(m){const a=WORLD.aff[m.k];if(!a||MON[m.k].boss)return'';const kn=(SAVE.affKnown||{})[m.k]||{};return'<br><small>'+(kn.weak?'Weak to '+ELEMN[a.weak]+'. ':'')+(kn.res?'Resists '+ELEMN[a.res]+'.':'')+(!kn.weak&&!kn.res?'Weaknesses unknown.':'')+'</small>'}
function featText(f){
 if(f.k==='altar'){const g=WORLD.gods[f.god],gk=(SAVE.godKnown||{})[f.god]||{};let s='Altar of '+g.n+' '+g.sig+(f.uses>0?'':' (cold)');if(pkN('ward'))s+='<br><small>Favors '+ITYPEN[g.love]+'. Hates '+ITYPEN[g.hate]+'.</small>';else s+='<br><small>'+(gk.love?'Favors '+ITYPEN[gk.love]+'. ':'')+(gk.hate?'Hates '+ITYPEN[gk.hate]+'.':'')+(!gk.love&&!gk.hate?'You do not know what it wants.':'')+'</small>';return s}
 const c=COLORS[WORLD.fc[f.kind]][0],kn=(SAVE.fountKnown||{})[f.kind];let s=c+' fountain'+(f.used?' (dry)':'');
 if(pkN('ward'))s+='<br><small>'+FOUNT[WORLD.fo[f.kind]]+'.</small>';else s+='<br><small>'+(kn!==undefined?FOUNT[kn]+'.':'Untested.')+'</small>';return s}
function inspect(){
 const el=$('inspect');if(!hover||!G||!inb(hover[0],hover[1])){el.innerHTML='Hover or tap a tile to inspect it.';return}
 const[x,y]=hover,t=tileAt(x,y);if(!t||!t.seen){el.innerHTML='Unexplored.';return}
 const bits=[];
 const m=t.vis||G.sense>G.tick?monAt(x,y):null;
 if(m&&!m.disg){const d=MON[m.k];bits.push(`<b style="color:${d.col}">${esc(mname(m))}</b> ${m.hp}/${m.mhp} health${m.awake?'':' (asleep)'}<br><small>${esc(d.note)}</small>`+affTxt(m)+(Object.keys(m.st).filter(k=>m.st[k]>0&&STN[k]).length?'<br><small>'+Object.keys(m.st).filter(k=>m.st[k]>0&&STN[k]).map(k=>STN[k]).join(', ')+'</small>':''))}
 const it=L.items.find(i=>i.x===x&&i.y===y);if(it)bits.push(esc(iname(it.it))+' on the floor');
 const fe=L.feat&&L.feat.find(f=>f.x===x&&f.y===y);if(fe)bits.push(featText(fe));
 const tl=[];if(t.wt)tl.push('water');if(t.oil)tl.push('oil');if(t.g)tl.push('grass');if(t.ice)tl.push('ice');if(t.fire>0)tl.push('fire');if(t.fog>0)tl.push('fog');
 if(x===L.down.x&&y===L.down.y)tl.push('stairs down');if(x===L.up.x&&y===L.up.y)tl.push('stairs up');
 bits.push(t.w?'Stone wall':tl.length?tl.join(', '):'Bare floor');
 el.innerHTML=bits.join('<br>');
}
// ----- drawing -----
// draw() lives in graphics.js
setInterval(()=>{if(view==='game'||view==='draft'||view==='dead')draw()},120);
(function frame(){if(FX.length&&(view==='game'||view==='draft'||view==='dead'))draw();requestAnimationFrame(frame)})();
window.addEventListener('resize',()=>{if(G&&view!=='title'){fit();draw()}});
// ----- journal -----
function openJournal(){setView('journal');renderJournal();}
function closeJournal(){setView(G&&!G.dead?'game':'title');if(G&&!G.dead)sync();else renderTitle()}
$('jclose').onclick=closeJournal;$('jopen').onclick=openJournal;$('jopen2').onclick=openJournal;
function renderJournal(){
 const pots=POT.map((p,k)=>{
  const c=potCol(k),kn=SAVE.known[k];
  return`<div class="jrow">${ji('pot',c[1])}<div><b>${c[0]} potion</b> ${kn?'· '+p.n:'· <span class="dim">unknown</span>'}<small>${kn?'Drink: '+esc(p.d)+'<br>Throw: '+esc(p.t):(p.rare?'Rare. Only turns up deeper or through mixing.':'Not yet identified.')}</small></div></div>`}).join('');
 const scr=SCR.map((s,k)=>`<div class="jrow">${ji('scr','#e8dcb0')}<div><b>"${WORLD.titles[k]}"</b> ${SAVE.scrKnown[k]?'· '+s.n:'· <span class="dim">unknown</span>'}<small>${SAVE.scrKnown[k]?esc(s.d):'Not yet read.'}</small></div></div>`).join('');
 const rec=Object.keys(SAVE.recipes).map(key=>{const[a,b]=key.split(':').map(Number),r=SAVE.recipes[key];
  const nm=k=>SAVE.known[k]?POT[k].n:potCol(k)[0];
  return`<div class="jrow">${ji('pot',potCol(a)[1])}${ji('pot',potCol(b)[1])}<div><b>${nm(a)} + ${nm(b)}</b> → ${SAVE.known[r]?POT[r].n:potCol(r)[0]}<small>${a===b?'Two of a kind raise the potency.':''}</small></div></div>`}).join('')||'<div class="empty">No mixes recorded. Combine two potions from your pack to learn what they make.</div>';
 const mons=Object.keys(MON).map(k=>{const d=MON[k],n=SAVE.seen[k]||0;return`<div class="jrow">${ji(SPR[k]?k:'slime',n?d.col:'#20242f',!n)}<div><b>${n?d.n:'Unknown'}</b> ${n?'· '+n+' slain':''}<small>${n?esc(d.note):'Kill one to learn what it is.'}${n&&WORLD.aff[k]?(()=>{const a=WORLD.aff[k],kn=(SAVE.affKnown||{})[k]||{};return'<br>'+(kn.weak?'Weak to '+ELEMN[a.weak]+'. ':'Weakness unknown. ')+(kn.res?'Resists '+ELEMN[a.res]+'.':'Resistance unknown.')})():''}</small></div></div>`}).join('');
 const wnd=WAND.map((w,k)=>{const kn=SAVE.wandKnown&&SAVE.wandKnown[k];return`<div class="jrow">${ji('wand','#b88850')}<div><b>${WORLD.wood[k]} wand</b> ${kn?'· '+w.n:'· <span class="dim">unknown</span>'}<small>${kn?esc(w.d):'Zap it to learn it.'}</small></div></div>`}).join('');
 const rng=RING.map((w,k)=>{const kn=SAVE.ringKnown&&SAVE.ringKnown[k];return`<div class="jrow">${ji('ring','#e8c060')}<div><b>${WORLD.gem[k]} ring</b> ${kn?'· '+w.n:'· <span class="dim">unknown</span>'}<small>${kn?esc(w.d):'Wear one for a while to learn it.'}</small></div></div>`}).join('');
 const gods=WORLD.gods.map((g,i)=>{const gk=(SAVE.godKnown||{})[i]||{};return`<div class="jrow">${ji(altarSpr(i,true))}<div><b>${g.n}</b><small>${gk.love?'Favors '+ITYPEN[gk.love]+'. ':''}${gk.hate?'Hates '+ITYPEN[gk.hate]+'.':''}${!gk.love&&!gk.hate?'Nothing learned yet. Offer items at its altars.':''}</small></div></div>`}).join('');
 const fts=WORLD.fc.map((c,k)=>{const kn=(SAVE.fountKnown||{})[k];return`<div class="jrow">${ji(fountSpr(COLORS[c][1],false))}<div><b>${COLORS[c][0]} fountain</b> ${kn!==undefined?'· '+FOUNT[kn]:'· <span class="dim">untested</span>'}</div></div>`}).join('');
 const bio=BIOMES.map((b,idx)=>{const sn=(SAVE.biomeSeen||{})[idx],pos=WORLD.bio.indexOf(idx);return`<div class="jrow">${ji(tex('floor',idx+2,0,sn?shade(b.col,1.15,6):'#1a1e2b'),0,!sn)}<div><b>${sn?b.n:'Unknown depths'}</b>${sn?' · depths '+(4+3*pos)+'-'+(6+3*pos)+' and every 18 below that':''}<small>${sn?'First met on depth '+sn+'.':'Not yet found.'}</small></div></div>`}).join('');
 const dds=DEEDS.map(d=>{const dn=(SAVE.deeds||{})[d.id];return`<div class="jrow"><span class="gly" style="color:${dn?'#ffd36b':'#444'}">${dn?'★':'☆'}</span><div><b>${dn?d.n:'???'}</b> <span class="dim">+${d.r} echoes</span><small>${esc(d.h)}</small></div></div>`}).join('');
 $('jbody').innerHTML=`<h3>Potions</h3>${pots}<h3>Scrolls</h3>${scr}<h3>Wands</h3>${wnd}<h3>Rings</h3>${rng}<h3>Mixes you have tried</h3>${rec}<h3>Gods and altars</h3>${gods}<h3>Fountains</h3>${fts}<h3>Biomes</h3>${bio}<h3>Bestiary</h3>${mons}<h3>Deeds</h3>${dds}<p class="dim">Your journal survives death. Colors, titles, sigils and the order of the deep stay fixed until you choose to forget everything.</p>`;
}
// ----- buttons -----
$('bwait').onclick=()=>act(waitTurn);
$('bexp').onclick=()=>startAuto('explore');
$('bstairs').onclick=()=>startAuto('stairs');
$('bdown').onclick=()=>act(descendHere);
$('bint').onclick=()=>act(interact);
$('menu').onclick=()=>{if(MP.on||NET.role){mpMenu();return}if(G&&!G.dead)saveRun();renderTitle();setView('title')};
// ----- phone -----
function detectPhone(){try{const s=localStorage.getItem('deepwell.phone');if(s==='1')return true;if(s==='0')return false}catch(e){}return innerWidth<560||(window.matchMedia&&matchMedia('(pointer:coarse)').matches&&innerWidth<820)}
function setPhone(on){PH=on;document.body.classList.toggle('phone',on);if(!on)document.body.classList.remove('packopen');try{localStorage.setItem('deepwell.phone',on?'1':'0')}catch(e){}$('phonebtn').textContent='Phone layout: '+(on?'on':'off');if(G&&view!=='title'){fit();draw()}}
$('phonebtn').onclick=()=>setPhone(!PH);
document.querySelectorAll('[data-dx]').forEach(b=>b.onclick=()=>act(()=>tryMove(+b.dataset.dx,+b.dataset.dy)));
document.querySelectorAll('[data-pad]').forEach(b=>b.onclick=()=>{const a=b.dataset.pad;
 if(a==='wait')act(waitTurn);else if(a==='explore')startAuto('explore');else if(a==='stairs')startAuto('stairs');
 else if(a==='down')act(descendHere);else if(a==='int')act(interact);else if(a==='pack'){document.body.classList.add('packopen');pack()}
 else if(a==='journal')openJournal();else if(a==='menu')$('menu').click()});
$('packclose').onclick=()=>document.body.classList.remove('packopen');
// (boot runs in 7boot.js)
