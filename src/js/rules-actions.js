// ---------- rules: player, items, flow ----------
function recalc(){
 const P=G.p,kit=KITS.find(k=>k.id===G.kit)||KITS[0];
 let m=30+(kit.mhp||0)+10*pkN('vigor');if(pkN('glass'))m=Math.round(m*0.7);
 if(m>P.mhp)P.hp+=m-P.mhp;P.mhp=m;P.hp=Math.min(P.hp,P.mhp);
}
function newRun(kitId,seed){
 G={seed:seed||(Math.random()*2147483647)|0,depth:0,tick:0,mv:0,dmv:-1,log:[],dead:false};
 rng=mulberry(G.seed);
 initPlayerCtx(kitId);
 SAVE.runs++;persist();
 descend();
}
// everything that belongs to one player: also what multiplayer swaps in and out of G
function initPlayerCtx(kitId){
 const kit=KITS.find(k=>k.id===kitId)||KITS[0];
 G.kit=kit.id;G.kills=0;G.stats=null;G.sense=0;G.windUsed=false;G.pending=null;G.inv=[];G.perks=Object.assign({},kit.perks||{});
 G.p={x:0,y:0,hp:30,mhp:30,sat:1500,energy:100,st:{},wpn:{w:kit.wpn[0],e:kit.wpn[1]},arm:{lv:kit.arm[0],e:kit.arm[1]}};
 recalc();G.p.hp=G.p.mhp;
 addItem({t:'food'});
 if(kit.pots===2){const k=wpick(POT.map((p,i)=>i).filter(i=>!POT[i].rare),i=>POT[i].w);addItem({t:'pot',k,p:1,n:2})}
 if(kit.pots===4)for(let i=0;i<4;i++)addItem({t:'pot',k:wpick(POT.map((p,i)=>i).filter(i=>!POT[i].rare),i=>POT[i].w),p:1});
 if(kit.wand){const k=ri(0,WAND.length-1),c=ri(3,5)+pkN('wright');addItem({t:'wand',k,c,mc:c})}
 if(kit.legion)addItem({t:'scr',k:12});
 if(kit.scrs)for(let i=0;i<kit.scrs;i++)addItem({t:'scr',k:wpick(SCR.map((s,i)=>i),i=>SCR[i].w)});
}
function placeLevel(){genLevel(G.depth);G.mv++;computeFov()}
function descend(){
 G.depth++;placeLevel();
 if(G.depth>SAVE.best&&!MP.noPersist)SAVE.best=G.depth;
 G.windUsed=false;
 msg('Depth '+G.depth+'.','depth');
 if(L.laws.length)msg('Floor law: '+L.laws.map(l=>LAWS[l].n).join(', ')+'.','law');
 if(MP.co){mpArriveParty();return}
 if(G.depth>1)G.pending={type:'draft',opts:rollDraft()};
 else arrive();
 if(MP.on&&MP.mode==='race')mpRaceProgress();
}
function arrive(){extArrive();
 const c=pkN('cart');
 if(c>=2)for(const t of L.t)t.seen=1;
 else if(c===1){const d=bfs(G.p.x,G.p.y);for(let i=0;i<W*H;i++)if(d[i]>=0&&d[i]<=14)L.t[i].seen=1}
 saveRun();
}
function saveRun(){
 if(MP.on)return;
 const P=G.p;
 SAVE.run={seed:G.seed,kit:G.kit,depth:G.depth,tick:G.tick,kills:G.kills,stats:G.stats,perks:G.perks,inv:G.inv,p:{hp:P.hp,mhp:P.mhp,sat:P.sat,wpn:P.wpn,arm:P.arm,st:{reborn:P.st.reborn||0,echo:P.st.echo||0}}};
 persist();
}
function resumeRun(){
 const r=SAVE.run;if(!r)return false;
 G={seed:r.seed,kit:r.kit,depth:r.depth,tick:r.tick,kills:r.kills,stats:r.stats,mv:0,dmv:-1,log:[],inv:r.inv,perks:r.perks,pending:null,dead:false,windUsed:false,sense:0,
  p:{x:0,y:0,hp:r.p.hp,mhp:r.p.mhp,sat:r.p.sat,energy:100,st:{},wpn:r.p.wpn,arm:r.p.arm}};
 for(const k of['reborn','echo'])if(r.p.st[k])G.p.st[k]=r.p.st[k];
 placeLevel();msg('You pick up where you left off, at the top of depth '+G.depth+'.','depth');
 if(L.laws.length)msg('Floor law: '+L.laws.map(l=>LAWS[l].n).join(', ')+'.','law');
 arrive();return true;
}
function rollDraft(){
 const pool=PERKS.filter(p=>pkN(p.id)<p.max);const out=[];
 while(out.length<3&&pool.length){out.push(pool.splice(Math.floor(rnd()*pool.length),1)[0].id)}
 return out;
}
function choosePerk(id){if(MPG)return mpCmd('choosePerk',[id]);
 if(!G.pending||G.pending.type!=='draft')return;
 G.perks[id]=pkN(id)+1;recalc();
 if(id==='vigor')G.p.hp=Math.min(G.p.mhp,G.p.hp+10);
 const bonus=G.pending.bonus;G.pending=null;
 msg('You take '+PERKS.find(p=>p.id===id).n+'.','good');
 if(!bonus)arrive();
}
function playerDie(cause){
 const P=G.p;
 if(P.st.reborn>0){P.st.reborn=0;inc('reborn');P.hp=Math.ceil(P.mhp/2);P.st.burn=0;P.st.poison=0;P.st.frozen=0;msg('Phoenix fire pulls you back from the edge.','good');
  for(const[dx,dy]of DIRS){explode(P.x,P.y,2,Math.round(8*ds()),'fire',P);break}
  return}

 if(MP.co){mpDown(cause);return}
 P.hp=0;G.dead=true;G.cause=cause;
 const ech=Math.floor(G.depth*G.depth*1.5+G.kills*0.5);
 G.echoes=ech;SAVE.echoes+=ech;SAVE.kills+=G.kills;SAVE.run=null;persist();
 msg('You die. '+cause+'.','bad');
}
// ---------- player actions ----------
function playerAct(cost){
 const P=G.p;if(G.dead||G.pending||P.down)return;
 P.energy-=cost;
 let guard=0;
 while((P.energy<100||P.st.frozen>0)&&!G.dead&&!P.down&&guard++<400){tickWorld();if(P.st.frozen>0&&P.energy>=100)P.energy=99}
 L.mons=L.mons.filter(m=>!m.dead);
 if(!G.dead){computeFov();if(pkN('sage'))for(const mm of visMons())if(WORLD.aff[mm.k]){SAVE.affKnown=SAVE.affKnown||{};SAVE.affKnown[mm.k]={weak:1,res:1}}checkDeeds()}
 if(G.sense>0&&G.sense<G.tick)G.sense=0;
 if(MP.on)mpAfterAct();
}
function visMons(){return L.mons.filter(m=>!m.dead&&!m.disg&&!m.ally&&tileAt(m.x,m.y).vis)}
function weaponHit(m,dmg,P){
 if(pkN('duel')&&(!m.awake||m.st.flee>0))dmg*=1+0.5*pkN('duel');
 const wasAlive=!m.dead;
 const a=hurt(m,dmg,'phys','you');
 const rl=ringP(1);if(rl>0&&a>0)P.hp=Math.min(P.mhp,P.hp+Math.max(1,Math.round(a*0.1*rl)));else if(rl<0&&a>0)hurt(P,1,'true','a leeching ring');
 if(m.dead||!wasAlive)return a;
 if(pkN('exec')&&m.hp<m.mhp*0.12*pkN('exec')&&!MON[m.k].boss){hurt(m,9999,'true','you');fxText(m.x,m.y,'EXECUTE','#ff9060');return a}
 if(pkN('ember')&&chance(0.25*pkN('ember')))addSt(m,'burn',3);
 if(pkN('frost')&&chance(0.15*pkN('frost')))addSt(m,'frozen',2);
 if(P.wpn.w==='mace'&&chance(0.3))addSt(m,'stun',2);
 if(P.st.charge>0){P.st.charge--;shockAt(m.x,m.y,Math.round(5*ds()),'your charge')}
 const st=pkN('storm');
 if(st){for(const[dx,dy]of DIRS){const o=monAt(m.x+dx,m.y+dy);if(o&&o!==m){const w=tileAt(o.x,o.y).wt||tileAt(m.x,m.y).wt;hurt(o,dmg*0.4*st*(w?2:1),'shock','storm');fxLine(m.x,m.y,o.x,o.y,'#f5ec7a');break}}}
 return a;
}
function playerAttack(targets,cost){
 const P=G.p;
 for(const m of targets){fxMeleeP(m);if(m.disg){m.disg=false;msg(m.invis?'You strike something hidden!':'The loot was a Mimic!','bad');m.invis=false}weaponHit(m,wpnDmg(),P);P.st.hidden=0}
 let c=cost||100;
 if(P.wpn.w==='dagger'&&chance(0.4))c=0;
 if(P.wpn.w==='mace')c=140;
 playerAct(c);
}
function tryMove(dx,dy){if(MPG)return mpCmd('tryMove',[dx,dy]);
 const P=G.p;if(G.dead||G.pending)return false;
 if(P.st.confused>0&&chance(0.45)){const rd=pick(DIRS);dx=rd[0];dy=rd[1]}
 const nx=P.x+dx,ny=P.y+dy;
 if(!inb(nx,ny))return false;
 if(P.st.frozen>0){playerAct(100);return true}
 const wp=P.wpn.w;
 {const al=monAt(nx,ny);if(al&&al.ally&&diagOK(P.x,P.y,dx,dy)){al.x=P.x;al.y=P.y;P.x=nx;P.y=ny;G.mv++;pickup();playerAct(100);return true}}
 if(wp==='spear'){
  const a=monAt(nx,ny),b=open(nx,ny)&&diagOK(P.x,P.y,dx,dy)?monAt(nx+dx,ny+dy):null;
  if(a||b){playerAttack([a,b].filter(Boolean));return true}
 }
 const m=monAt(nx,ny);
 if(m&&diagOK(P.x,P.y,dx,dy)){
  if(wp==='axe'){const ts=L.mons.filter(o=>!o.dead&&!o.ally&&Math.max(Math.abs(o.x-P.x),Math.abs(o.y-P.y))<=1&&diagOK(P.x,P.y,o.x-P.x,o.y-P.y));playerAttack(ts)}
  else playerAttack([m]);
  return true;
 }

 if(MP.co&&diagOK(P.x,P.y,dx,dy)){const o=mpPlayerAt(nx,ny);if(o){o.x=P.x;o.y=P.y;P.x=nx;P.y=ny;G.mv++;pickup();msg('You trade places with '+o.name+'.');playerAct(100);return true}}
 if(!open(nx,ny)||!diagOK(P.x,P.y,dx,dy))return false;
 P.x=nx;P.y=ny;G.mv++;
 // slide on ice
 let n=0;
 while(tileAt(P.x,P.y).ice&&n++<6){const sx=P.x+dx,sy=P.y+dy;if(!open(sx,sy)||!diagOK(P.x,P.y,dx,dy)||monAt(sx,sy))break;P.x=sx;P.y=sy}
 if(n>1)fxText(P.x,P.y,'~','#a0e8ff');
 const t=tileAt(P.x,P.y);
 if(t.wt)P.st.burn=0,P.st.oiled=0;
 pickup();
 playerAct(pkN('step')&&chance(0.2*pkN('step'))?0:100);
 return true;
}
function pickup(){
 const P=G.p;
 for(let i=L.items.length-1;i>=0;i--){const f=L.items[i];if(f.x!==P.x||f.y!==P.y)continue;
  const it=JSON.parse(JSON.stringify(f.it));
  if(addItem(it)){L.items.splice(i,1);msg('You take '+iname(it)+'.','item');
   if(it.t==='pot'&&!SAVE.known[it.k]&&pkN('nose')&&chance(0.25*pkN('nose')))learnPot(it.k)}
  else msg('Your pack is full. '+iname(it)+' stays here.','bad')}
}
function learnPot(k){if(!SAVE.known[k]){SAVE.known[k]=1;msg('This is a Potion of '+POT[k].n+'. Noted in your journal.','learn');persist()}}
function learnScr(k){if(!SAVE.scrKnown[k]){SAVE.scrKnown[k]=1;msg('This is a Scroll of '+SCR[k].n+'. Noted in your journal.','learn');persist()}}
function consume(i){const it=G.inv[i];it.n=(it.n||1)-1;if(it.n<=0)G.inv.splice(i,1)}
function waitTurn(){if(MPG)return mpCmd('waitTurn',[]);if(G.dead||G.pending)return;playerAct(100)}
function useItem(i){if(MPG)return mpCmd('useItem',[i]);
 const it=G.inv[i],P=G.p;if(!it||G.dead||G.pending)return;
 if(it.t==='food'){fxFood();consume(i);P.sat=Math.min(1800,P.sat+900);msg('You eat. The hunger eases.','good');playerAct(100);return}
 if(it.t==='wpn'){fxEquip('wpn');const old=P.wpn;P.wpn={w:it.w,e:it.e};G.inv.splice(i,1);addItem({t:'wpn',w:old.w,e:old.e});msg('You wield '+iname(it)+'.');playerAct(100);return}
 if(it.t==='ring'){toggleRing(i);return}
 if(it.t==='wand'){msg('Pick a target tile on the map.');return}
 if(it.t==='arm'){fxEquip('arm');const old=P.arm;P.arm={lv:it.lv,e:it.e};G.inv.splice(i,1);addItem({t:'arm',lv:old.lv,e:old.e});msg('You don '+iname(it)+'.');playerAct(100);return}
 if(it.t==='pot'){
  const k=it.k,p=it.p;consume(i);
  const twice=P.st.echo>0&&k!==14;if(twice)P.st.echo=0;
  learnPot(k);fxDrink(k,p);drink(k,p);if(twice&&!G.dead){msg('The echo repeats it.','good');fxDrink(k,p);drink(k,p)}
  playerAct(100);return;
 }
 if(it.t==='scr'){
  const k=it.k;consume(i);
  const twice=P.st.echo>0;if(twice)P.st.echo=0;
  learnScr(k);{const ox=P.x,oy=P.y;readScroll(k);fxRead(k,ox,oy)}if(twice&&!G.dead){msg('The echo repeats it.','good');const ox=P.x,oy=P.y;readScroll(k);fxRead(k,ox,oy)}
  playerAct(100);return;
 }
}
function dropItem(i){if(MPG)return mpCmd('dropItem',[i]);const it=G.inv[i];if(!it)return;if(it.worn){msg('Take it off first.');return}consume(i);const c=JSON.parse(JSON.stringify(it));c.n=1;L.items.push({x:G.p.x,y:G.p.y,it:c});msg('You drop '+iname(c)+'.')}
function throwItem(i,x,y){if(MPG)return mpCmd('throwItem',[i,x,y]);
 const it=G.inv[i],P=G.p;if(!it||it.t!=='pot'||G.dead||G.pending)return false;
 // find landing tile along the line
 let lx=P.x,ly=P.y;
 const dx=Math.abs(x-P.x),dy=Math.abs(y-P.y),sx=P.x<x?1:-1,sy=P.y<y?1:-1;let err=dx-dy,cx=P.x,cy=P.y,n=0;
 while(!(cx===x&&cy===y)&&n++<12){const e2=2*err;if(e2>-dy){err-=dy;cx+=sx}if(e2<dx){err+=dx;cy+=sy}
  if(!open(cx,cy))break;lx=cx;ly=cy;if(monAt(cx,cy))break}
 const k=it.k,p=it.p;consume(i);
 fxThrow(P.x,P.y,lx,ly,k);
 const twice=P.st.echo>0&&k!==14;if(twice)P.st.echo=0;
 learnPot(k);fxDelay=FXFLIGHT;fxSplashFx(k,p,lx,ly);splash(k,p,lx,ly);if(twice&&!G.dead){msg('The echo repeats it.','good');splash(k,p,lx,ly)}fxDelay=0;
 P.st.hidden=0;playerAct(100);return true;
}
function mixPotions(i,j){if(MPG)return mpCmd('mixPotions',[i,j]);
 const P=G.p;if(G.dead||G.pending)return false;
 const a=G.inv[i],b=G.inv[j];if(!a||!b||a.t!=='pot'||b.t!=='pot')return false;
 if(i===j&&(a.n||1)<2)return false;
 const A={k:a.k,p:a.p},B={k:b.k,p:b.p};
 const r=mixRes(A,B);
 const hi=Math.max(i,j),lo=Math.min(i,j);
 if(i===j)consume(i);else{consume(hi);consume(lo)}
 let n=1;if(pkN('alch')&&chance(0.3*pkN('alch')))n=2;
 const res={t:'pot',k:r.k,p:r.p,n};
 if(!addItem(res))L.items.push({x:P.x,y:P.y,it:res});
 const key=Math.min(A.k,B.k)+':'+Math.max(A.k,B.k);
 SAVE.recipes[key]=r.k;persist();inc('mix');
 msg('The vials fizz into a '+iname(res)+(n>1?' (two!)':'')+'.','mix');
 fxFlash(P.x,P.y,potCol(r.k)[1]);fxMix(A.k,B.k,r.k);
 playerAct(100);return true;
}
// ---------- effects ----------
function teleportActor(a,far){
 for(let n=0;n<80;n++){const c=pick(L.floors),x=c%W,y=(c/W)|0;
  if(occAt(x,y)||(far&&Math.abs(x-a.x)+Math.abs(y-a.y)<10))continue;
  a.x=x;a.y=y;if(a===G.p)G.mv++;return true}
 return false;
}
function carve(x,y,r){
 for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
  const tx=x+dx,ty=y+dy;if(dx*dx+dy*dy>r*r+0.5||tx<1||ty<1||tx>=W-1||ty>=H-1)continue;
  const t=tileAt(tx,ty);if(t.w){t.w=0;fxFlash(tx,ty,'#9a8fb0')}}
 G.mv++;
}
function drink(k,p){
 const P=G.p;if(pkN('bottler')>=3)p=Math.min(3,p+0);
 fxFlash(P.x,P.y,potCol(k)[1]);
 switch(k){
  case 0:{const h=Math.round(P.mhp*0.25*p+6);P.hp=Math.min(P.mhp,P.hp+h);P.st.burn=0;P.st.poison=0;msg('Warmth spreads. +'+h+' health.','good');fxText(P.x,P.y,'+'+h,'#7fe0a0');break}
  case 1:P.st.haste=8+6*p;msg('The world slows around you.','good');break;
  case 2:P.st.fireproof=8+4*p;for(const[x,y]of area(P.x,P.y,1))ignite(x,y,4);msg('Flames roar up around you.','good');break;
  case 3:P.st.slow=4;for(const[dx,dy]of DIRS){const m=monAt(P.x+dx,P.y+dy);if(m)addSt(m,'frozen',3*p)}msg('A killing chill spreads outward.','good');break;
  case 4:P.st.oiled=20;msg('Oil coats your skin. Stay away from flame.','bad');break;
  case 5:P.st.charge=2+2*p;msg('Your skin crackles. Your next '+P.st.charge+' hits arc.','good');break;
  case 6:P.st.hidden=10+5*p;for(const[x,y]of area(P.x,P.y,1))tileAt(x,y).fog=6;msg('Shadow gathers around you.','good');break;
  case 7:P.st.might=12+6*p;msg('Your muscles surge.','good');break;
  case 8:for(const t of L.t)t.seen=1;G.sense=G.tick+20;msg('The whole floor opens before you.','good');break;
  case 9:P.st.poison=4+3*p;msg('Poison burns in your veins.','bad');break;
  case 10:teleportActor(P,true);msg('You blink across the floor.','good');break;
  case 11:P.st.stone=14+6*p;msg('Your skin hardens to stone.','good');break;
  case 12:P.st.reborn=1;msg('A small flame settles in your chest.','good');break;
  case 13:carve(P.x,P.y,2+p);msg('The walls tear open.','good');break;
  case 14:P.st.echo=1;msg('The air hums. Your next potion or scroll will repeat.','good');break;
  case 15:P.st.chrono=6+4*p;msg('Everything outside you crawls.','good');break;
  case 16:for(const[x,y]of area(P.x,P.y,2+p)){const t=tileAt(x,y);t.wt=1;t.fire=0;t.oil=0;t.ice=0}P.st.burn=0;msg('Water floods in.','good');break;
  case 17:P.st.poison=6+3*p;hurt(P,3*p,'fire','caustic brew');P.st.burn=0;msg('It tears through you.','bad');break;
  default:extDrink(k,p);
 }
}
function splash(k,p,x,y){
 const r=1+(p>=3?1:0)+pkN('bottler'),cells=area(x,y,r),col=potCol(k)[1];
 const occ=c=>occAt(c[0],c[1]);
 fxFlash(x,y,col);
 for(const c of cells)if(c[0]!==x||c[1]!==y)fxFlash(c[0],c[1],col);
 switch(k){
  case 0:for(const c of cells){const o=occ(c);if(o){const h=Math.round(6*p*(o===G.p?1:hs()));o.hp=Math.min(o.mhp,o.hp+h);fxText(c[0],c[1],'+'+h,'#7fe0a0')}}break;
  case 1:for(const c of cells){const o=occ(c);if(o)addSt(o,'haste',8+4*p)}break;
  case 2:for(const c of cells){ignite(c[0],c[1],4+p)}break;
  case 3:for(const c of cells){const t=tileAt(c[0],c[1]);if(t.wt){t.wt=0;t.ice=1}t.fire=0;const o=occ(c);if(o){addSt(o,'frozen',3*p);hurt(o,2*p*ds(),'ice','frost')}}break;
  case 4:for(const c of cells){const t=tileAt(c[0],c[1]);if(!t.wt)t.oil=1;const o=occ(c);if(o)addSt(o,'oiled',20)}break;
  case 5:shockAt(x,y,Math.round(6*p*ds()),'lightning');break;
  case 6:for(const c of cells)tileAt(c[0],c[1]).fog=10+4*p;break;
  case 7:for(const c of cells){const o=occ(c);if(o)addSt(o,'might',15)}break;
  case 8:for(const c of area(x,y,r*3))tileAt(c[0],c[1]).seen=1;break;
  case 9:for(const c of cells){const o=occ(c);if(o)addSt(o,'poison',5+3*p)}break;
  case 10:for(const c of cells){const o=occ(c);if(o&&o!==G.p)teleportActor(o,true)}break;
  case 11:for(const c of cells){const o=occ(c);if(o){addSt(o,'stone',6+3*p);addSt(o,'stun',3+p)}}break;
  case 12:explode(x,y,r+2,Math.round(10*p*ds()),'fire',null);break;
  case 13:carve(x,y,2+p);break;
  case 14:for(const c of area(x,y,r+1)){const o=occ(c);if(o){hurt(o,5*p*ds(),'sonic','a shockwave');if(o!==G.p)addSt(o,'stun',2)}}break;
  case 15:for(const c of cells){const o=occ(c);if(o&&o!==G.p)addSt(o,'stun',5*p)}break;
  case 16:for(const c of area(x,y,r+2)){const t=tileAt(c[0],c[1]);t.wt=1;t.fire=0;t.oil=0;t.ice=0;const o=occ(c);if(o)o.st.burn=0}break;
  case 17:for(const c of cells){const o=occ(c);if(o){addSt(o,'poison',8*p);hurt(o,4*p*ds(),'fire','acid')}}break;
  default:extSplash(k,p,x,y,cells,occ);
 }
 for(const m of L.mons)if(!m.dead&&cells.some(c=>c[0]===m.x&&c[1]===m.y))m.awake=true;
}
function readScroll(k){
 const P=G.p;
 switch(k){
  case 0:teleportActor(P,true);msg('The world lurches. You are elsewhere.','good');break;
  case 1:for(const t of L.t)t.seen=1;msg('The floor etches itself into your mind.','good');break;
  case 2:for(const m of visMons())m.st.flee=15;msg('Terror rolls out from you.','good');break;
  case 3:P.wpn.e++;msg('Your weapon hums. Now '+iname({t:'wpn',w:P.wpn.w,e:P.wpn.e})+'.','good');break;
  case 4:P.arm.e++;msg('Your armor tightens. Now '+iname({t:'arm',lv:P.arm.lv,e:P.arm.e})+'.','good');break;
  case 5:{let c=0;for(const[dx,dy]of DIRS){if(c>=3)break;const nx=P.x+dx,ny=P.y+dy;if(open(nx,ny)&&!occAt(nx,ny)){const kk=pick(Object.keys(MON).filter(q=>MON[q].min<=G.depth&&!MON[q].boss&&!MON[q].mimic));spawnMon(kk,nx,ny,true);c++}}msg('Shapes tear in from nowhere.','bad');break}
  case 6:{for(const[dx,dy]of DIRS){const nx=L.down.x+dx,ny=L.down.y+dy;if(open(nx,ny)&&!occAt(nx,ny)){P.x=nx;P.y=ny;G.mv++;break}}msg('You land beside the stairs down.','good');break}
  case 7:for(const m of visMons()){hurt(m,(8+G.depth)*1.2,'sonic','thunder');addSt(m,'stun',3)}msg('Thunder rolls out from the page.','good');break;
  default:extScroll(k);
 }
}
function descendHere(){if(MPG)return mpCmd('descendHere',[]);
 const P=G.p;
 if(G.dead||G.pending)return false;
 if(P.x!==L.down.x||P.y!==L.down.y){msg('You need to stand on the stairs down.');return false}
 descend();return true;
}
// ---------- travel + explore ----------
function pathStep(goal,avoidMons){
 const P=G.p,prev=new Int32Array(W*H).fill(-1),q=[P.x+P.y*W];prev[q[0]]=q[0];
 for(let h=0;h<q.length;h++){
  const c=q[h],cx=c%W,cy=(c/W)|0;
  if((cx!==P.x||cy!==P.y)&&goal(cx,cy)){let k=c;while(prev[k]!==P.x+P.y*W)k=prev[k];return[(k%W)-P.x,((k/W)|0)-P.y]}
  for(const[dx,dy]of DIRS){const nx=cx+dx,ny=cy+dy;if(!open(nx,ny)||!diagOK(cx,cy,dx,dy))continue;
   const t=tileAt(nx,ny),k=nx+ny*W;if(prev[k]>=0||!t.seen)continue;
   if(t.fire>0)continue;
   if(avoidMons&&monAt(nx,ny)&&!goal(nx,ny))continue;
   prev[k]=c;q.push(k)}
 }
 return null;
}
function frontier(x,y){
 const t=tileAt(x,y);if(t.w)return false;
 const it=L.items.some(i=>i.x===x&&i.y===y);
 if(it&&G.inv.length<MAXPACK)return true;
 for(const[dx,dy]of DIRS){const n=tileAt(x+dx,y+dy);if(n&&!n.seen)return true}
 return false;
}
function exploreStep(){
 const d=pathStep(frontier,true);if(!d)return false;
 return tryMove(d[0],d[1]);
}
function stairsStep(){
 const P=G.p;if(P.x===L.down.x&&P.y===L.down.y)return false;
 const d=pathStep((x,y)=>x===L.down.x&&y===L.down.y,true);if(!d)return false;
 return tryMove(d[0],d[1]);
}
function goStep(tx,ty){
 const P=G.p;if(P.x===tx&&P.y===ty)return false;
 const d=pathStep((x,y)=>x===tx&&y===ty,true);if(!d)return false;
 return tryMove(d[0],d[1]);
}
