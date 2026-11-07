// ---------- rules: combat, environment, monsters ----------
const FX=[];
const now=()=>Date.now();
let fxDelay=0,FXN=0;
function fxPush(o){o.n=++FXN;FX.push(o);if(FX.length>240)FX.shift()}
function fxText(x,y,txt,col){fxPush({k:'t',x,y,txt,col,t:now()+fxDelay})}
function fxFlash(x,y,col){fxPush({k:'f',x,y,col,t:now()+fxDelay})}
function fxLine(x0,y0,x1,y1,col){fxPush({k:'l',x:x0,y:y0,x1,y1,col,t:now()+fxDelay})}
let onMsg=null;
function msg(text,cls){G.log.push({text,cls:cls||'',tick:G.tick,n:G.logN=(G.logN||0)+1,pid:MP.on&&MP.mode==='coop'?MP.cur:undefined});if(G.log.length>120)G.log.shift();if(onMsg)onMsg(text,cls)}
function pkN(id){return G&&G.perks?(G.perks[id]||0):0}
const NOTICK={reborn:1,echo:1,charge:1,shield:1};
function mname(m){return(m.name||MON[m.k].n)+(m.aff&&m.aff.length?' ('+m.aff.map(a=>AFX[a]).join(', ')+')':'')}
function armorVal(){const P=G.p;return P.arm.lv+P.arm.e+pkN('plating')+(P.st.stone>0?3:0)}
function wpnDmg(){
 const P=G.p,w=WPN[P.wpn.w];let d=ri(w.lo,w.hi)+P.wpn.e+pkN('keen')*2;
 if(P.st.might>0)d*=1.5;if(pkN('glass'))d*=1.5;if(P.sat<150)d*=0.7;
 const rf=ringP(7);if(rf&&chance(0.1*Math.abs(rf)))d*=rf>0?2:0.5;if(ringP(3)<0)d*=1+0.1*ringP(3);
 return Math.max(1,d);
}
function addSt(t,k,v){
 if(t===G.p){if(k==='burn'&&(pkN('ember')||t.st.fireproof>0))return;}
 else{const d=MON[t.k];if(k==='burn'&&d.imm&&d.imm.includes('fire'))return;if(k==='frozen'&&((d.imm&&d.imm.includes('ice'))||d.boss))v=Math.min(v,1)}
 if(t.st[k]===undefined||t.st[k]<v)t.st[k]=v;
}
function hurt(t,amt,type,src){
 if(!(amt>0))return 0;
 if(MP.co&&t.pidx!==undefined&&t!==G.p)return mpAs(t.pidx,()=>hurt(t,amt,type,src));
 const P=G.p;animHurt(t);
 if(t===P){
  if(G.dead||P.down)return 0;
  if(type==='fire'&&(pkN('ember')||P.st.fireproof>0))return 0;
  if(type==='fire')amt*=Math.max(0.1,1-0.2*ringP(5));
  if(type==='phys')amt=amt*12/(12+armorVal()*2.2);
  amt=Math.max(1,Math.round(amt));
  P.hp-=amt;fxText(P.x,P.y,'-'+amt,'#ff7a6a');G.lastHit=src||type;
  if(P.hp<=0)playerDie(src||type);
  else if(P.hp<P.mhp*0.3&&pkN('wind')&&!G.windUsed){G.windUsed=true;const h=Math.round(P.mhp*(0.3+0.1*(pkN('wind')-1)));P.hp=Math.min(P.mhp,P.hp+h);msg('Second Wind steadies you. +'+h,'good');fxText(P.x,P.y,'+'+h,'#7fe0a0')}
  return amt;
 }
 if(t.dead)return 0;
 const d=MON[t.k];
 if(d.imm&&d.imm.includes(type))return 0;
 if(d.weak&&d.weak[type])amt*=d.weak[type];
 const af=WORLD.aff&&WORLD.aff[t.k];if(af&&!d.boss&&ELEM.includes(type)){if(af.weak===type){amt*=1.5;learnAff(t.k,'weak')}else if(af.res===type){amt*=0.5;learnAff(t.k,'res')}}
 if(type==='fire'&&pkN('ember'))amt*=1.5;
 if(type==='phys'){amt-=Math.max(0,t.def-(t.st.corroded>0?4:0));if(t.st.frozen>0){amt*=1.5;t.st.frozen=0;t.shat=1}}
 if(t.st.doomed>0)amt*=3;
 if(type==='fire'&&t.st.oiled>0)amt*=1.5;
 if(t.st.shield>0){const a=Math.min(t.st.shield,amt);t.st.shield-=a;amt-=a}
 amt=Math.round(amt);if(type==='phys')amt=Math.max(1,amt);
 if(amt<=0)return 0;
 t.hp-=amt;t.awake=true;t.lt=type;fxText(t.x,t.y,String(amt),type==='fire'?'#ffb070':type==='shock'?'#f5ec7a':type==='ice'?'#a0e8ff':type==='poison'?'#a0e070':'#fff');
 if(t.hp<=0){killMon(t,src)}
 else if(d.split&&t.gen<3&&t.hp>=4&&type!=='fire'&&L.mons.length<60){
  for(const[dx,dy]of DIRS.slice().sort(()=>rnd()-0.5)){const nx=t.x+dx,ny=t.y+dy;
   if(open(nx,ny)&&!occAt(nx,ny)&&diagOK(t.x,t.y,dx,dy)){const h=Math.floor(t.hp/2);t.hp-=h;const c=spawnMon('slime',nx,ny,true);c.hp=h;c.mhp=t.mhp;c.gen=t.gen+1;c.st={};break}}
 }
 return amt;
}
function killMon(m,src){
 if(m.dead)return;m.dead=true;if(m.ally)return;G.kills++;const P=G.p;
 const d=MON[m.k];
 if(d.boss)inc('boss');if(m.lt==='fire')inc('fire');if(m.lt==='shock'){inc('shock');if(tileAt(m.x,m.y).wt)inc('wetshock')}if(m.shat)inc('shatter');if(m.loot){L.items.push({x:m.x,y:m.y,it:m.loot});inc('recover');msg('The Pilferer drops your '+iname(m.loot)+'.','good')}
 if(pkN('drink')&&P.hp>0){const h=pkN('drink');P.hp=Math.min(P.mhp,P.hp+h)}
 if(d.ai==='bomb'||m.aff.includes('volatile')){explode(m.x,m.y,1,Math.round(6*ds()),'fire',m)}
 if(d.boss){msg(mname(m)+' falls. The deep shudders.','good');for(let i=0;i<3;i++){const o=pick(DIRS);let x=m.x+o[0],y=m.y+o[1];if(!open(x,y)){x=m.x;y=m.y}L.items.push({x,y,it:rollItem(G.depth+3)})}
  if(!G.pending)G.pending={type:'draft',opts:rollDraft(),bonus:1}}
 else if(chance(d.mimic?1:0.1)){L.items.push({x:m.x,y:m.y,it:rollItem(G.depth+(d.mimic?2:0))})}
 SAVE.seen[m.k]=(SAVE.seen[m.k]||0)+1;
}
function explode(x,y,r,dmg,type,src){
 fxFlash(x,y,'#ffb040');
 for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
  const tx=x+dx,ty=y+dy;if(!open(tx,ty))continue;fxFlash(tx,ty,'#ff8a3d');
  if(type==='fire')ignite(tx,ty,3);
  const o=occAt(tx,ty);if(o&&o!==src)hurt(o,dmg,type,src?mname(src):'an explosion');
  if(o&&type==='fire')addSt(o,'burn',3);
 }
}
function ignite(x,y,dur){
 const t=tileAt(x,y);if(!t||t.w)return;
 if(t.wt)return;
 if(t.ice){t.ice=0;t.wt=1;return}
 t.fire=Math.max(t.fire,(dur||4)+(t.oil?2:0));
}
function shockAt(x,y,dmg,srcName){
 const t0=tileAt(x,y);if(!t0)return;
 const seen=new Set([y*W+x]),q=[[x,y]];let n=0;
 const zap=(xx,yy)=>{const t=tileAt(xx,yy);t.zap=now();const o=occAt(xx,yy);if(o)hurt(o,dmg,'shock',srcName||'lightning')};
 zap(x,y);
 if(!t0.wt)return;
 while(q.length&&n<90){const c=q.shift();n++;for(const[dx,dy]of DIRS.slice(0,4)){const nx=c[0]+dx,ny=c[1]+dy,k=ny*W+nx;if(seen.has(k))continue;const t=tileAt(nx,ny);if(t&&t.wt&&!t.w){seen.add(k);zap(nx,ny);q.push([nx,ny])}}}
}
function area(x,y,r){const out=[];for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(dx*dx+dy*dy<=r*r+0.5&&open(x+dx,y+dy))out.push([x+dx,y+dy])}return out}
// ---------- per-tick processing ----------
function tickActor(a,isP){
 const st=a.st;
 if(st.burn>0){
  const t=tileAt(a.x,a.y);
  if(t.wt){st.burn=0}else{
   hurt(a,(2+G.depth/4)*(st.oiled>0?1.6:1),'fire','burning');st.burn--;
   if(t.g||t.oil)ignite(a.x,a.y,3);
  }
 }
 if(!isP&&a.dead)return;
 if(st.poison>0){hurt(a,1+Math.floor(G.depth/5),'poison','poison');st.poison--}
 if(!isP&&a.dead)return;
 const t=tileAt(a.x,a.y);
 if(t&&t.wt){st.oiled=0}
 if(t&&t.fire>0){hurt(a,(3+G.depth/3)*(t.oil?1.4:1),'fire','flames');addSt(a,'burn',3)}
 if(!isP&&a.dead)return;
 for(const k in st){if(NOTICK[k])continue;if(st[k]>0)st[k]--;if(st[k]<=0)delete st[k]}
 if(!isP&&a.aff.includes('regen')&&G.tick%3===0&&a.hp<a.mhp)a.hp++;
}
function envTick(){
 const add=[];
 for(let i=0;i<L.t.length;i++){
  const t=L.t[i];
  if(t.fog>0)t.fog--;
  if(t.sanct>0)t.sanct--;
  if(t.fire>0){
   const x=i%W,y=(i/W)|0;
   if(t.wt){t.fire=0;continue}
   for(const[dx,dy]of DIRS.slice(0,4)){const n=tileAt(x+dx,y+dy);if(!n||n.w||n.fire>0||n.wt)continue;
    const p=n.oil?0.7:n.g?0.45:0;if(p&&chance(p))add.push([x+dx,y+dy])}
   t.fire--;
   if(t.fire<=0){t.g=0;t.oil=0}
  }
 }
 for(const[x,y]of add)ignite(x,y,4);
}
function playerTick(acting){
 const P=G.p;
 tickActor(P,true);
 if(G.dead||P.down)return;
 ringTick();if(G.dead||P.down)return;
 P.sat-=Math.pow(0.75,pkN('camel'))*Math.max(0.2,1-0.12*ringP(8));
 if(P.sat<=0){P.sat=0;if(G.tick%3===0)hurt(P,2+Math.floor(G.depth/6),'hunger','starvation')}
 if(G.dead||P.down)return;
 if(G.tick%10===0&&P.sat>0&&P.hp<P.mhp)P.hp=Math.min(P.mhp,P.hp+1+Math.floor(P.mhp/70));
 P.energy+=pspd();
 if(!acting&&P.energy>100)P.energy=100;
}
function tickWorld(){
 G.tick++;
 envTick();
 if(MP.co){
  const act=MP.cur;
  for(const pl of MP.players){if(!pl.p||pl.p.down||pl.gone)continue;mpAs(pl.i,()=>playerTick(pl.i===act));if(G.dead)return}
 }else{playerTick(true);if(G.dead)return}
 for(const m of L.mons){
  if(m.dead)continue;
  tickActor(m,false);if(m.dead)continue;extMonTick(m);
  if(m.st.frozen>0||m.st.stun>0)continue;
  const sp=m.spd*(m.st.haste>0?2:1)*(m.st.stone>0?0.3:1)*(m.st.slowed>0?0.5:1)*(m.boss&&m.hp<m.mhp/2?1.3:1);
  m.energy+=sp;
  let guard=0;
  while(m.energy>=100&&!m.dead&&!G.dead&&guard++<3){m.energy-=100;mpMonTurn(m)}
  if(G.dead)break;
 }
 L.mons=L.mons.filter(m=>!m.dead);
 L.spawnT++;
 const per=Math.max(40,150-G.depth*4)*(L.laws.includes('restless')?0.5:1);
 if(L.spawnT>=per){L.spawnT=0;spawnWanderer()}
}
function pspd(){const s=G.p.st;let v=100;if(s.chrono>0)v=300;else if(s.haste>0)v=200;if(s.stone>0)v*=0.55;if(s.slow>0)v*=0.6;v+=12*ringP(2);return Math.max(40,v)}
function spawnWanderer(){
 const P=G.p;
 for(let n=0;n<40;n++){const c=pick(L.floors),x=c%W,y=(c/W)|0;
  if(Math.abs(x-P.x)+Math.abs(y-P.y)<12||tileAt(x,y).vis||monAt(x,y))continue;
  const pool=Object.keys(MON).filter(k=>MON[k].min<=G.depth&&!MON[k].boss&&!MON[k].mimic);
  spawnMon(wpick(pool,k=>MON[k].w),x,y,true);return}
}
// ---------- monster AI ----------
function dmap(){const P=G.p;if(P._dv!==G.mv){P._dm=bfs(P.x,P.y);P._dv=G.mv}return P._dm}
function cheb(a,b){return Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y))}
function mstep(m,dirs){
 for(const[dx,dy]of dirs){const nx=m.x+dx,ny=m.y+dy;
  if(!open(nx,ny)||!diagOK(m.x,m.y,dx,dy)||occAt(nx,ny)||tileAt(nx,ny).sanct>0)continue;
  m.x=nx;m.y=ny;
  const t=tileAt(nx,ny);
  if(MON[m.k].trail&&(t.g||t.oil)&&chance(0.5))ignite(nx,ny,3);
  if(m.aff.includes('blazing')&&chance(0.5))ignite(nx,ny,3);
  return true}
 return false;
}
function stepToward(m,away){
 const d=MON[m.k],P=G.p;
 if(d.phase){
  const sx=Math.sign(P.x-m.x)*(away?-1:1),sy=Math.sign(P.y-m.y)*(away?-1:1);
  const nx=m.x+sx,ny=m.y+sy;
  if(inb(nx,ny)&&nx>0&&ny>0&&nx<W-1&&ny<H-1&&!occAt(nx,ny)){m.x=nx;m.y=ny;return true}
  return false;
 }
 const dm=dmap(),cur=dm[m.x+m.y*W];
 if(cur<0)return false;
 const cand=[];
 for(const dir of DIRS){const nx=m.x+dir[0],ny=m.y+dir[1];if(!open(nx,ny))continue;const v=dm[nx+ny*W];if(v<0)continue;cand.push([v,rnd(),dir])}
 cand.sort((a,b)=>away?(b[0]-a[0]||a[1]-b[1]):(a[0]-b[0]||a[1]-b[1]));
 const dirs=cand.filter(c=>away?c[0]>=cur:c[0]<cur||(c[0]===cur&&chance(0.15))).map(c=>c[2]);
 return mstep(m,dirs);
}
function monAttack(m,mult){
 const d=MON[m.k],P=G.p;fxMeleeM(m);
 let dmg=ri(d.d[0],d.d[1])*ds()*(mult||1);
 if(m.st.might>0)dmg*=1.5;
 const a=hurt(P,dmg,'phys',mname(m));
 if(a>0){
  if(d.hitburn)addSt(P,'burn',3);
  if(d.hitpoison&&chance(0.5)){addSt(P,'poison',4);msg('The bite is venomous!','bad')}
  if(d.hitfreeze&&chance(0.4)){addSt(P,'frozen',2);msg('The bite freezes you!','bad')}
  if(m.aff.includes('chilling')&&chance(0.3)){addSt(P,'frozen',2);msg('Cold seizes you!','bad')}
  if(d.drain||m.aff.includes('vampiric'))m.hp=Math.min(m.mhp,m.hp+Math.ceil(a/2));
  const th=pkN('thorn')+Math.max(0,ringP(3));if(th&&!m.dead)hurt(m,th*2,'phys','thorns');
 }
}
function monTurn(m){
 const P=G.p,d=MON[m.k];
 if(m.ally){allyTurn(m);return}
 if(G.dead)return;
 const dist=cheb(m,P);
 if(m.disg){if(dist<=1){m.disg=false;msg(m.invis?'Something lunges from the dark!':'The loot was a Mimic!','bad');m.invis=false;monAttack(m,1.5)}return}
 if(!m.awake){
  const rad=P.st.hidden>0?2:Math.max(2,7-ringP(9));
  if(dist<=rad&&(dist<=2||los(m.x,m.y,P.x,P.y))&&chance(0.55)){m.awake=true}
  else return;
 }
 if(m.st.flee>0){stepToward(m,true);return}
 if(d.boss){m.t++;if(m.t%8===0&&dist<=9){const k=pick(Object.keys(MON).filter(k=>MON[k].min<=Math.max(1,G.depth-2)&&!MON[k].boss&&!MON[k].mimic&&MON[k].ai!=='bomb'));let c=0;for(const dd of DIRS){if(c>=2)break;const nx=m.x+dd[0],ny=m.y+dd[1];if(open(nx,ny)&&!occAt(nx,ny)){spawnMon(k,nx,ny,true);c++}}if(c)msg('The Warden calls for aid!','bad')}}
 if(P.st.hidden>0&&dist>2){if(chance(0.6))mstep(m,[pick(DIRS)]);return}
 const adj=dist<=1&&diagOK(m.x,m.y,P.x-m.x,P.y-m.y);
 const sees=dist<=10&&los(m.x,m.y,P.x,P.y);
 if(!adj){const al=L.mons.find(a=>a.ally&&!a.dead&&cheb(a,m)<=1);if(al&&chance(0.5)){hurt(al,ri(d.d[0],d.d[1])*ds(),'phys',mname(m));return}}
 if(extMonAI(m,d,dist,adj,sees))return;
 if(d.ai==='bomb'){
  if(m.fuse>0){m.fuse--;fxFlash(m.x,m.y,'#ffe060');if(m.fuse===0){m.dead=true;explode(m.x,m.y,1,Math.round(7*ds()),'fire',m)}return}
  if(adj){m.fuse=2;msg('The Bladder swells!','bad');return}
  stepToward(m);return;
 }
 if(d.ai==='range'){
  if(sees&&dist<=d.rng&&dist>=2){const a=hurt(P,ri(d.d[0],d.d[1])*ds(),'phys',mname(m));fxLine(m.x,m.y,P.x,P.y,'#ddd6bc');fxShoot(m,P.x,P.y,'#ddd6bc');return}
  if(sees&&dist<=2&&stepToward(m,true))return;
  if(adj){monAttack(m);return}
  stepToward(m);return;
 }
 if(d.ai==='caster'){
  if(sees||dist<=8){
   const ally=L.mons.find(a=>!a.dead&&a!==m&&a.hp<a.mhp&&cheb(a,m)<=6&&los(m.x,m.y,a.x,a.y));
   if(ally&&chance(0.7)){ally.hp=Math.min(ally.mhp,ally.hp+Math.round(5*hs()));fxFlash(ally.x,ally.y,'#b394e8');fxText(ally.x,ally.y,'+','#b394e8');return}
   const a2=L.mons.find(a=>!a.dead&&a!==m&&!a.st.shield&&cheb(a,m)<=6&&los(m.x,m.y,a.x,a.y)&&a.awake);
   if(a2&&chance(0.5)){a2.st.shield=Math.round(6*hs());fxFlash(a2.x,a2.y,'#8070ff');return}
   if(sees&&dist<=5&&dist>=2){hurt(P,ri(d.d[0],d.d[1])*ds(),'phys',mname(m));fxLine(m.x,m.y,P.x,P.y,'#b394e8');fxShoot(m,P.x,P.y,'#b394e8');return}
   if(dist<=2&&stepToward(m,true))return;
  }
  if(adj){monAttack(m);return}
  stepToward(m);return;
 }
 if(adj)monAttack(m);else stepToward(m);
}
