// ---------- expansion rules ----------
function shuf(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));const t=a[i];a[i]=a[j];a[j]=t}return a}
function extWorld(r){
 WORLD.wood=shuf(WOODS,r).slice(0,WAND.length);
 WORLD.gem=shuf(GEMS,r).slice(0,RING.length);
 WORLD.bio=shuf([0,1,2,3,4,5],r);
 const it=shuf(ITYPES,r);
 WORLD.gods=GODS.map((n,i)=>({n,sig:SIGILS[i],love:it[i],hate:it[(i+3)%7]}));
 const fc=shuf([...Array(COLORS.length).keys()],r).slice(0,6);
 WORLD.fc=fc;WORLD.fo=shuf([0,1,2,3,4,5],r);
 WORLD.aff={};
 for(const k of Object.keys(MON)){if(MON[k].boss)continue;const w=ELEM[Math.floor(r()*5)];let e;do{e=ELEM[Math.floor(r()*5)]}while(e===w);WORLD.aff[k]={weak:w,res:e}}
}
function biomeOf(d){if(d<4)return null;return BIOMES[WORLD.bio[Math.floor((d-4)/3)%6]]}
function S(){if(!G.stats)G.stats={boss:0,fire:0,shock:0,shatter:0,wetshock:0,mix:0,reborn:0,allyMax:0,altarOK:0,altarBad:0,fount:0,fastDive:0,recover:0,cursed:0};return G.stats}
function inc(k,n){S()[k]=(S()[k]||0)+(n||1)}
function ringP(k){let s=0;if(!G||!G.inv)return 0;for(const it of G.inv)if(it.t==='ring'&&it.worn&&it.k===k)s+=it.p;return s}
function learnAff(k,kind){
 SAVE.affKnown=SAVE.affKnown||{};const a=SAVE.affKnown[k]=SAVE.affKnown[k]||{};
 if(a[kind])return;a[kind]=1;
 const w=WORLD.aff[k];
 msg(MON[k].n+(kind==='weak'?' is weak to '+ELEMN[w.weak]+'.':' resists '+ELEMN[w.res]+'.'),'learn');persist();
}
// ---------- deeds ----------
function checkDeeds(){
 if(!G||(MP.co&&MP.cur!==0))return;SAVE.deeds=SAVE.deeds||{};
 for(const d of DEEDS){
  if(SAVE.deeds[d.id])continue;let ok=false;try{ok=d.f(S())}catch(e){}
  if(!ok)continue;
  SAVE.deeds[d.id]=1;SAVE.echoes+=d.r;
  msg('Deed: '+d.n+'. +'+d.r+' echoes.','deed');
  for(const k of KITS)if(k.deed===d.id&&!SAVE.unlocked[k.id]){SAVE.unlocked[k.id]=1;msg('Kit unlocked: '+k.n+'.','deed')}
  persist();
 }
}
// ---------- allies ----------
function spawnAlly(x,y,life){
 let spot=null;
 for(const[dx,dy]of DIRS.slice().sort(()=>rnd()-0.5)){const nx=x+dx,ny=y+dy;if(open(nx,ny)&&!occAt(nx,ny)){spot=[nx,ny];break}}
 if(!spot)return null;
 const m=spawnMon('thrall',spot[0],spot[1],true);
 m.ally=true;m.life=Math.round(life*(1+0.5*pkN('keeper')));m.hp=m.mhp=Math.round(m.mhp*1.8);m.name='Spectral guardian';m.aff=[];
 const n=L.mons.filter(a=>a.ally&&!a.dead).length;if(n>S().allyMax)S().allyMax=n;
 return m;
}
function makeAlly(m,life){
 if(MON[m.k].boss){msg('The '+mname(m)+' shrugs it off.');return false}
 m.ally=true;m.life=Math.round(life*(1+0.5*pkN('keeper')));m.awake=true;m.st={};m.disg=false;m.invis=false;
 const n=L.mons.filter(a=>a.ally&&!a.dead).length;if(n>S().allyMax)S().allyMax=n;
 return true;
}
function allyTurn(m){
 const P=G.p,d=MON[m.k];
 m.life--;if(m.life<=0){m.dead=true;fxFlash(m.x,m.y,'#8aa0ff');return}
 let tgt=null,best=99;
 for(const o of L.mons){if(o.dead||o.ally||o.disg)continue;const c=cheb(m,o);if(c<best&&c<=8&&(c<=1||los(m.x,m.y,o.x,o.y))){best=c;tgt=o}}
 if(tgt){
  if(best<=1&&diagOK(m.x,m.y,tgt.x-m.x,tgt.y-m.y)){
   hurt(tgt,ri(d.d[0],d.d[1])*ds()*(1+0.25*pkN('keeper')),'phys','ally');tgt.awake=true;return}
  const dm=bfs(m.x,m.y);let bx=null,bv=1e9;
  for(const dir of DIRS){const nx=m.x+dir[0],ny=m.y+dir[1];if(!open(nx,ny)||!diagOK(m.x,m.y,dir[0],dir[1])||occAt(nx,ny))continue;
   const v=Math.abs(nx-tgt.x)+Math.abs(ny-tgt.y);if(v<bv){bv=v;bx=[nx,ny]}}
  if(bx){m.x=bx[0];m.y=bx[1]}return}
 if(cheb(m,P)>2){
  const dm=dmap();let bx=null,bv=dm[m.x+m.y*W];
  for(const dir of DIRS){const nx=m.x+dir[0],ny=m.y+dir[1];if(!open(nx,ny)||!diagOK(m.x,m.y,dir[0],dir[1])||occAt(nx,ny))continue;const v=dm[nx+ny*W];if(v>=0&&v<bv){bv=v;bx=[nx,ny]}}
  if(bx){m.x=bx[0];m.y=bx[1]}
 }
}
// ---------- monster extras ----------
function extMonTick(m){
 const d=MON[m.k];
 if(d.regen&&!(m.st.burn>0)&&!(m.st.poison>0)&&m.hp<m.mhp)m.hp=Math.min(m.mhp,m.hp+d.regen);
}
function lineTiles(x0,y0,x1,y1,maxn){
 const out=[],dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let err=dx-dy,x=x0,y=y0,n=0;
 while(!(x===x1&&y===y1)&&n++<maxn){const e2=2*err;if(e2>-dy){err-=dy;x+=sx}if(e2<dx){err+=dx;y+=sy}out.push([x,y])}
 return out;
}
function summonAround(m,k,cnt){let c=0;for(const dd of DIRS){if(c>=cnt)break;const nx=m.x+dd[0],ny=m.y+dd[1];if(open(nx,ny)&&!occAt(nx,ny)){const s=spawnMon(k,nx,ny,true);if(s){s.hp=s.mhp=Math.max(3,Math.round(s.mhp*0.8));c++}}}return c}
function extMonAI(m,d,dist,adj,sees){
 const P=G.p;
 if(d.steal){
  if(m.loot)return false;
  if(adj){const c=G.inv.filter(it=>!it.worn);if(c.length){const it=pick(c);G.inv.splice(G.inv.indexOf(it),1);m.loot=it;m.st.flee=9999;msg('The Pilferer steals '+iname(it)+'!','bad');return true}}
  return false;
 }
 if(d.ai==='spore'){if(dist<=2){addSt(P,'poison',3);if(!m.said){m.said=1;msg('Spores sting your lungs.','bad')}}return true}
 if(d.ai==='necro'){
  m.t++;
  if(m.t%6===0&&sees&&L.mons.filter(o=>!o.dead&&o.k==='thrall'&&!o.ally).length<6){if(summonAround(m,'thrall',1))msg('Bones knit together.','bad');return true}
  if(dist<=3&&stepToward(m,true))return true;
  if(adj){monAttack(m);return true}
  if(dist>6)stepToward(m);
  return true;
 }
 if(d.ai==='breath'){
  m.t++;
  const dx=P.x-m.x,dy=P.y-m.y;
  if(sees&&dist<=6&&(dx===0||dy===0||Math.abs(dx)===Math.abs(dy))&&m.t%4===0){
   const tiles=lineTiles(m.x,m.y,m.x+Math.sign(dx)*8,m.y+Math.sign(dy)*8,7);
   for(const[x,y]of tiles){if(!open(x,y))break;ignite(x,y,4);fxFlash(x,y,'#ff8a3d');const o=occAt(x,y);if(o&&!o.ally&&o!==m)continue;if(o)hurt(o,ri(d.d[0],d.d[1])*ds()*0.9,'fire',mname(m))}
   msg('The '+d.n+' breathes fire!','bad');return true}
  return false;
 }
 if(d.ai==='gaze'){
  if(sees&&dist<=7&&chance(0.4)){addSt(P,'confused',5);fxLine(m.x,m.y,P.x,P.y,'#f0e070');fxShoot(m,P.x,P.y,'#f0e070');msg('The Gazer stares. The world tilts.','bad');return true}
  if(dist>3&&!adj){stepToward(m);return true}
  return false;
 }
 if(d.ai==='warlock'){
  if(sees&&dist<=7){
   if(chance(0.4)){hurt(P,ri(d.d[0],d.d[1])*ds(),'fire',mname(m));ignite(P.x,P.y,3);fxLine(m.x,m.y,P.x,P.y,'#e07ac8');fxShoot(m,P.x,P.y,'#e07ac8');return true}
   if(chance(0.2)&&L.mons.filter(o=>!o.dead&&o.k==='thrall'&&!o.ally).length<6){summonAround(m,'thrall',2);msg('The Warlock calls the dead.','bad');return true}
   if(dist<=2&&stepToward(m,true))return true;
  }
  return false;
 }
 return false;
}
// ---------- wands ----------
function wandBolt(tx,ty){
 const P=G.p;let dx=tx-P.x,dy=ty-P.y;if(!dx&&!dy)return[];
 const sc=10/Math.max(Math.abs(dx),Math.abs(dy));
 const path=lineTiles(P.x,P.y,P.x+Math.round(dx*sc),P.y+Math.round(dy*sc),10),out=[];
 for(const[x,y]of path){if(!open(x,y))break;out.push([x,y]);const o=monAt(x,y);if(o&&!o.ally&&!o.disg)break}
 return out;
}
function zapWand(i,tx,ty){if(MPG)return mpCmd('zapWand',[i,tx,ty]);
 const it=G.inv[i],P=G.p;if(!it||it.t!=='wand'||G.dead||G.pending)return false;
 if(it.c<=0){msg('The wand is empty. It only clicks.');return false}
 const path=wandBolt(tx,ty);if(!path.length){msg('Pick a direction with open space.');return false}
 const col=['#ff8a3d','#8fe0f0','#f5ec7a','#9a8fb0','#7fb0ff','#e07ac8','#b394e8','#c0a070','#80e0c0','#ff6a6a'][it.k];
 const end=path[path.length-1];fxLine(P.x,P.y,end[0],end[1],col);fxBolt(P.x,P.y,end[0],end[1],col,it.k);
 it.c--;SAVE.wandKnown=SAVE.wandKnown||{};if(!SAVE.wandKnown[it.k]){SAVE.wandKnown[it.k]=1;msg('It is a Wand of '+WAND[it.k].n+'.','learn')}persist();
 let m=monAt(end[0],end[1]);if(m&&(m.ally||m.disg)&&it.k!==4)m=m.disg?m:null;
 if(m&&m.disg){m.disg=false;m.invis=false}
 const k=it.k,dm=Math.round(9*ds());
 switch(k){
  case 0:for(const[x,y]of path)if(chance(0.5)||(x===end[0]&&y===end[1]))ignite(x,y,3);if(m){hurt(m,dm,'fire','your wand');addSt(m,'burn',4)}break;
  case 1:if(m){hurt(m,Math.round(dm*0.4),'ice','your wand');addSt(m,'frozen',4)}{const t=tileAt(end[0],end[1]);if(t.wt){t.wt=0;t.ice=1}}break;
  case 2:if(m){shockAt(m.x,m.y,dm,'your wand');let n=0;for(const o of L.mons){if(n>=2)break;if(o!==m&&!o.dead&&!o.ally&&cheb(o,m)<=4){hurt(o,Math.round(dm*0.7),'shock','your wand');fxLine(m.x,m.y,o.x,o.y,'#f5ec7a');n++}}}else shockAt(end[0],end[1],dm,'your wand');break;
  case 3:if(m)addSt(m,'slowed',40);break;
  case 4:{let t=null;for(const[x,y]of path)if(!occAt(x,y))t=[x,y];if(t){P.x=t[0];P.y=t[1];G.mv++;pickup()}break}
  case 5:if(m&&!MON[m.k].boss){const keys=Object.keys(MON).filter(q=>!MON[q].boss&&q!=='thrall'),nk=pick(keys),fr=m.hp/m.mhp,od=MON[m.k],nd=MON[nk];
   m.k=nk;m.mhp=Math.round(nd.hp*hs());m.hp=Math.max(1,Math.round(m.mhp*fr));m.spd=nd.spd;m.def=nd.def+Math.floor(G.depth/6);m.st={};m.disg=false;m.invis=false;m.awake=true;m.aff=[];
   if(nd.lurk){m.invis=false}msg('The '+od.n+' becomes a '+nd.n+'.','good')}break;
  case 6:if(m)if(makeAlly(m,40))msg('The '+MON[m.k].n+' is yours for a time.','good');break;
  case 7:{let x=P.x,y=P.y;const dx=Math.sign(tx-P.x),dy=Math.sign(ty-P.y);for(let n=0;n<6;n++){x+=dx;y+=dy;if(x<1||y<1||x>=W-1||y>=H-1)break;const t=tileAt(x,y);if(t.w){t.w=0;fxFlash(x,y,'#c0a070')}}G.mv++;break}
  case 8:if(m){const ox=m.x,oy=m.y;m.x=P.x;m.y=P.y;P.x=ox;P.y=oy;G.mv++;msg('You trade places.','good')}break;
  case 9:if(m)addSt(m,'doomed',12);break;
 }
 if(m&&k!==6&&k!==8)m.awake=true;
 P.st.hidden=0;playerAct(100);return true;
}
// ---------- rings ----------
function wornCount(){return G.inv.filter(it=>it.t==='ring'&&it.worn).length}
function toggleRing(i){
 const it=G.inv[i],P=G.p;
 if(it.worn){if(it.p<0&&!it.unc){msg('The ring will not come off. It is cursed.','bad');return}it.worn=0;msg('You remove '+iname(it)+'.');playerAct(100);return}
 if(wornCount()>=2+pkN('ringer')){msg('You have no free finger.');return}
 it.worn=1;it.wt=0;
 if(it.p<0){msg('The ring tightens. It will not come off.','bad');inc('cursed')}else msg('You put on the ring. You feel little at first.');
 fxEquip('ring');
 playerAct(100);
}
function ringTick(){
 for(const it of G.inv){
  if(it.t!=='ring'||!it.worn)continue;
  it.wt=(it.wt||0)+1;
  if(!it.id&&it.wt>=120){it.id=true;SAVE.ringKnown=SAVE.ringKnown||{};SAVE.ringKnown[it.k]=1;msg('You come to know this ring: '+iname(it)+'.','learn');persist()}
 }
 const rg=ringP(0);
 if(rg>0&&G.tick%Math.max(2,10-3*rg)===0&&G.p.hp<G.p.mhp)G.p.hp++;
 else if(rg<0&&G.tick%12===0)hurt(G.p,1,'true','a draining ring');
}
function identifyRandom(){
 const c=G.inv.filter(it=>(it.t==='wand'&&!(SAVE.wandKnown||{})[it.k])||(it.t==='ring'&&!it.id)||(it.t==='pot'&&!SAVE.known[it.k])||(it.t==='scr'&&!SAVE.scrKnown[it.k]));
 if(!c.length){msg('Nothing in your pack needs identifying.');return false}
 const pr=c.filter(it=>it.t==='wand'||it.t==='ring'),it=pick(pr.length?pr:c);
 if(it.t==='wand'){SAVE.wandKnown=SAVE.wandKnown||{};SAVE.wandKnown[it.k]=1}
 else if(it.t==='ring'){it.id=true;SAVE.ringKnown=SAVE.ringKnown||{};SAVE.ringKnown[it.k]=1}
 else if(it.t==='pot')SAVE.known[it.k]=1;else SAVE.scrKnown[it.k]=1;
 msg('You now understand: '+iname(it)+'.','learn');persist();return true;
}
// ---------- altars + fountains ----------
function placeFeatures(floors,dist){
 L.feat=[];if(G.depth<2)return;
 const n=ri(0,2)+(chance(0.25)?1:0);
 for(let i=0;i<n;i++){
  for(let t=0;t<60;t++){
   const c=pick(floors),x=c%W,y=(c/W)|0;
   if(dist[c]<3||(x===L.down.x&&y===L.down.y)||L.feat.some(f=>f.x===x&&f.y===y)||L.items.some(q=>q.x===x&&q.y===y)||monAt(x,y))continue;
   L.feat.push(chance(0.55)?{x,y,k:'altar',god:ri(0,2),uses:3}:{x,y,k:'fount',kind:ri(0,5),used:false});break}
 }
}
function featHere(){if(!L.feat)return null;return L.feat.find(f=>f.x===G.p.x&&f.y===G.p.y)||null}
function interact(){if(MPG)return mpCmd('interact',[]);
 if(MP.co&&mpRevive())return true;
 const f=featHere(),P=G.p;if(!f||G.dead||G.pending)return false;
 if(f.k==='altar'){msg('An altar of '+WORLD.gods[f.god].n+' '+WORLD.gods[f.god].sig+'. Use Offer on an item in your pack.');return false}
 if(f.used){msg('The fountain is dry.');return false}
 f.used=true;inc('fount');
 const o=WORLD.fo[f.kind];fxFlash(P.x,P.y,COLORS[WORLD.fc[f.kind]][1]);fxFountainFx(P.x,P.y,COLORS[WORLD.fc[f.kind]][1]);
 SAVE.fountKnown=SAVE.fountKnown||{};
 switch(o){
  case 0:P.hp=P.mhp;P.st.poison=0;P.st.burn=0;msg('Clean, cold water. You are restored.','good');break;
  case 1:P.st.poison=10;msg('The water is foul. Poison creeps in.','bad');break;
  case 2:if(!identifyRandom())msg('The water tastes of nothing you can use.');break;
  case 3:{let c=0;for(const dd of DIRS){if(c>=3)break;const nx=P.x+dd[0],ny=P.y+dd[1];if(open(nx,ny)&&!occAt(nx,ny)){spawnMon(pick(Object.keys(MON).filter(q=>MON[q].min<=G.depth&&!MON[q].boss&&!MON[q].mimic&&!MON[q].lurk)),nx,ny,true);c++}}msg('The water boils. Things climb out.','bad');break}
  case 4:P.wpn.e++;P.sat=Math.max(0,P.sat-300);msg('Your weapon drinks and sharpens. You feel hungrier.','good');break;
  case 5:teleportActor(P,true);P.st.haste=12;msg('The current sweeps you away.','good');break;
 }
 if(!SAVE.fountKnown[f.kind]){SAVE.fountKnown[f.kind]=o;persist()}
 playerAct(100);return true;
}
function offerItem(i){if(MPG)return mpCmd('offerItem',[i]);
 const f=featHere(),P=G.p;if(!f||f.k!=='altar'||G.dead||G.pending)return false;
 if(f.uses<=0){msg('The altar is cold.');return false}
 const it=G.inv[i];if(!it||it.worn)return false;
 const god=WORLD.gods[f.god];f.uses--;
 SAVE.godKnown=SAVE.godKnown||{};const gk=SAVE.godKnown[f.god]=SAVE.godKnown[f.god]||{};
 const nm=iname(it);consume(i);fxFlash(P.x,P.y,'#ffe8a0');fxOffer(P.x,P.y,it.t===god.love?1:it.t===god.hate?-1:0);
 if(it.t===god.love){
  gk.love=it.t;inc('altarOK');msg(god.n+' is pleased with '+nm+'.','good');
  const r=ri(0,2);
  if(r===0)G.pending={type:'draft',opts:rollDraft(),bonus:1};
  else if(r===1){P.hp=P.mhp;P.st.poison=0;msg('You are made whole.','good')}
  else{P.wpn.e++;P.arm.e++;msg('Weapon and armor both gain +1.','good')}
 }else if(it.t===god.hate){
  gk.hate=it.t;inc('altarBad');msg(god.n+' recoils from '+nm+'.','bad');
  const r=ri(0,3);
  if(r===0){for(const dd of DIRS.slice(0,5)){const nx=P.x+dd[0],ny=P.y+dd[1];if(open(nx,ny)&&!occAt(nx,ny))spawnMon(pick(Object.keys(MON).filter(q=>MON[q].min<=G.depth&&!MON[q].boss&&!MON[q].mimic&&!MON[q].lurk)),nx,ny,true)}}
  else if(r===1)P.st.poison=14;
  else if(r===2)P.hp=Math.max(1,P.hp-Math.ceil(P.mhp*0.3));
  else P.wpn.e--;
 }else msg(god.n+' accepts '+nm+' without comment.');
 persist();playerAct(100);return true;
}
// ---------- new potions / scrolls ----------
function pushAway(m,fx,fy,n){
 for(let s=0;s<n;s++){const dx=Math.sign(m.x-fx),dy=Math.sign(m.y-fy);if(!dx&&!dy)return;const nx=m.x+dx,ny=m.y+dy;if(!open(nx,ny)||occAt(nx,ny)||!diagOK(m.x,m.y,dx,dy))return;m.x=nx;m.y=ny}
}
function pullTo(m,tx,ty,n){
 for(let s=0;s<n;s++){const dx=Math.sign(tx-m.x),dy=Math.sign(ty-m.y);if(!dx&&!dy)return;const nx=m.x+dx,ny=m.y+dy;if(!open(nx,ny)||occAt(nx,ny)||!diagOK(m.x,m.y,dx,dy))return;m.x=nx;m.y=ny}
}
function extDrink(k,p){
 const P=G.p;
 switch(k){
  case 18:for(const m of visMons()){if(MON[m.k].boss)continue;for(const dd of DIRS){const nx=P.x+dd[0],ny=P.y+dd[1];if(open(nx,ny)&&!occAt(nx,ny)){m.x=nx;m.y=ny;m.awake=true;break}}}msg('Everything is dragged to you.','bad');break;
  case 19:{let t=0;for(const m of visMons()){const d=Math.ceil(m.hp*0.2*(p>=2?1.5:1));if(hurt(m,d,'drain','siphon'))t+=d}P.hp=Math.min(P.mhp,P.hp+t);msg('You drain '+t+' health.','good');break}
  case 20:P.arm.e--;msg('Your armor pits and thins.','bad');break;
  case 21:for(const[dx,dy]of DIRS){const m=monAt(P.x+dx,P.y+dy);if(m&&!MON[m.k].boss)pushAway(m,P.x,P.y,3+p);const t=tileAt(P.x+dx,P.y+dy);if(t)t.fire=0}msg('A gust throws everything back.','good');break;
  case 22:if(spawnAlly(P.x,P.y,40))msg('A guardian takes shape beside you.','good');break;
  case 23:G.fortune=true;{const c=G.inv.filter(it=>it.t==='pot'&&!SAVE.known[it.k]);if(c.length)learnPot(pick(c).k)}msg('Luck gathers around the next floor.','good');break;
 }
}
function extSplash(k,p,x,y,cells,occ){
 switch(k){
  case 18:for(const m of L.mons)if(!m.dead&&!m.ally&&!MON[m.k].boss&&Math.abs(m.x-x)<=4&&Math.abs(m.y-y)<=4)pullTo(m,x,y,3);break;
  case 19:for(const c of cells){const o=occ(c);if(o&&o!==G.p&&!o.ally)hurt(o,Math.ceil(o.hp*0.25*p),'drain','siphon')}break;
  case 20:for(const c of cells){const o=occ(c);if(o&&o!==G.p){o.st.corroded=40;hurt(o,2*p*ds(),'poison','acid')}}break;
  case 21:for(const m of L.mons)if(!m.dead&&!MON[m.k].boss&&Math.abs(m.x-x)<=2&&Math.abs(m.y-y)<=2)pushAway(m,x,y,3);for(const c of area(x,y,3))tileAt(c[0],c[1]).fire=0;break;
  case 22:for(const c of cells){const o=occ(c);if(o&&o!==G.p)makeAlly(o,25+10*p)}break;
  case 23:for(const f of L.items)if(Math.abs(f.x-x)<=2&&Math.abs(f.y-y)<=2)f.it=rollItem(G.depth+1);break;
 }
}
function extScroll(k){
 const P=G.p;
 switch(k){
  case 8:identifyRandom();break;
  case 9:{let n=0;for(const it of G.inv)if(it.t==='ring'&&it.worn&&it.p<0&&!it.unc){it.unc=true;n++}msg(n?'The curse lifts. The ring can come off.':'You feel clean.','good');break}
  case 10:for(const c of area(P.x,P.y,2))ignite(c[0],c[1],4);msg('Fire blooms around you.','bad');break;
  case 11:for(const c of area(P.x,P.y,2))tileAt(c[0],c[1]).sanct=20;msg('A pale circle forms around you.','good');break;
  case 12:{let n=0;for(let i=0;i<2;i++)if(spawnAlly(P.x,P.y,40))n++;msg(n?'Two guardians answer the page.':'No room for guardians.','good');break}
  case 13:P.hp=Math.max(1,P.hp-Math.floor(P.mhp*0.25));G.pending={type:'draft',opts:rollDraft(),bonus:1};msg('You pay in blood.','bad');break;
  case 14:for(const it of G.inv)if(it.t==='wand')it.c=it.mc;msg('Your wands hum, full again.','good');break;
 }
}
function extArrive(){
 SAVE.biomeSeen=SAVE.biomeSeen||{};
 const B=L.biome;
 if(B){const idx=BIOMES.indexOf(B);if(!SAVE.biomeSeen[idx]){SAVE.biomeSeen[idx]=G.depth;}msg('You enter the '+B.n+'.','law')}
 if(pkN('wright')>=3)for(const it of G.inv)if(it.t==='wand'&&it.c<it.mc)it.c++;
 G.dt=G.dt||[];G.dt.push(G.tick);
 if(G.dt.length>=4&&G.dt[G.dt.length-1]-G.dt[G.dt.length-4]<200)S().fastDive=3;
 checkDeeds();
}
