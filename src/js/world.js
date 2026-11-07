// ---------- save + world ----------
const SKEY='deepwell.v1';
let SAVE=null,WORLD=null,G=null,L=null;
// multiplayer state (see mp.js). co = co-op host running the shared world. MPG = this client is a co-op guest.
const MP={on:false,host:false,guest:false,co:false,mode:'coop',me:0,cur:0,actor:0,players:[],noPersist:false,realSave:null};
let MPG=false;
function defaultSave(){return{ws:(Math.random()*2147483647)|0,known:{},scrKnown:{},recipes:{},echoes:0,best:0,runs:0,kills:0,unlocked:{wanderer:1},seen:{},run:null}}
function loadSave(){try{const s=localStorage.getItem(SKEY);if(s)SAVE=Object.assign(defaultSave(),JSON.parse(s))}catch(e){}if(!SAVE)SAVE=defaultSave();buildWorld()}
function persist(){if(MP.noPersist)return;try{localStorage.setItem(SKEY,JSON.stringify(SAVE))}catch(e){}}
function buildWorld(){
 const r=mulberry(SAVE.ws),idx=[...Array(COLORS.length).keys()];
 for(let i=idx.length-1;i>0;i--){const j=Math.floor(r()*(i+1));const t=idx[i];idx[i]=idx[j];idx[j]=t}
 const syl=['za','ko','mur','vex','il','tha','bru','sol','ny','qua','dor','ish','pel','gra','oth','xi'],titles=[];
 for(let i=0;i<SCR.length;i++){let t;do{t=[0,0].map(()=>{let s='';const n=2+Math.floor(r()*2);for(let k=0;k<n;k++)s+=syl[Math.floor(r()*syl.length)];return s}).join(' ').toUpperCase()}while(titles.includes(t));titles.push(t)}
 WORLD={pc:idx.slice(0,POT.length),titles};extWorld(r);
}
function resetWorld(){const keep={echoes:SAVE.echoes,unlocked:SAVE.unlocked,best:SAVE.best,runs:SAVE.runs,kills:SAVE.kills,deeds:SAVE.deeds};SAVE=Object.assign(defaultSave(),keep);buildWorld();persist()}
const potCol=k=>COLORS[WORLD.pc[k]];
function mixRes(a,b){
 if(a.k===b.k)return{k:a.k,p:Math.min(3,Math.max(a.p,b.p)+1)};
 const lo=Math.min(a.k,b.k),hi=Math.max(a.k,b.k),h=hash(SAVE.ws,lo,hi,7)%100,pot=Math.min(3,Math.max(a.p,b.p));
 if(h<22)return{k:lo,p:Math.min(3,pot+1)};
 if(h<44)return{k:hi,p:Math.min(3,pot+1)};
 if(h<72)return{k:hash(SAVE.ws,lo,hi,11)%12,p:pot};
 if(h<90)return{k:12+hash(SAVE.ws,lo,hi,13)%12,p:pot};
 return{k:17,p:pot};
}
function iname(it){
 switch(it.t){
  case'pot':return SAVE.known[it.k]?'Potion of '+POT[it.k].n+' '+'★'.repeat(it.p):potCol(it.k)[0]+' potion '+'★'.repeat(it.p);
  case'scr':return SAVE.scrKnown[it.k]?'Scroll of '+SCR[it.k].n:'Scroll "'+WORLD.titles[it.k]+'"';
  case'wand':return(SAVE.wandKnown&&SAVE.wandKnown[it.k]?'Wand of '+WAND[it.k].n:WORLD.wood[it.k]+' wand')+' ['+it.c+']';
  case'ring':{const kn=SAVE.ringKnown&&SAVE.ringKnown[it.k];return(kn?'Ring of '+RING[it.k].n+(it.id?' '+(it.p>0?'+':'')+it.p:''):WORLD.gem[it.k]+' ring')+(it.worn?' (worn)':'')}
  case'food':return'Ration';
  case'wpn':return WPN[it.w].n+' '+(it.e>=0?'+':'')+it.e;
  case'arm':return ARMN[it.lv]+' armor '+(it.e>=0?'+':'')+it.e;
 }
 return'?';
}
const stackKey=it=>it.t==='pot'?'p'+it.k+'.'+it.p:it.t==='scr'?'s'+it.k:it.t==='food'?'f':null;
function addItem(it){
 const sk=stackKey(it);
 if(sk){const f=G.inv.find(o=>stackKey(o)===sk);if(f){f.n=(f.n||1)+(it.n||1);return true}}
 if(G.inv.length>=MAXPACK)return false;
 if(sk)it.n=it.n||1;
 G.inv.push(it);return true;
}
// ---------- level helpers ----------
const inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
const tileAt=(x,y)=>inb(x,y)?L.t[y*W+x]:null;
function open(x,y){const t=tileAt(x,y);return!!t&&!t.w}
function diagOK(x,y,dx,dy){return dx===0||dy===0||(open(x+dx,y)&&open(x,y+dy))}
function monAt(x,y){for(const m of L.mons)if(!m.dead&&m.x===x&&m.y===y)return m;return null}
function occAt(x,y){const P=G.p;if(P.x===x&&P.y===y)return P;if(MP.co){const q=mpPlayerAt(x,y);if(q)return q}return monAt(x,y)}
function bfs(sx,sy){
 const d=new Int16Array(W*H).fill(-1),q=[sx+sy*W];d[q[0]]=0;
 for(let h=0;h<q.length;h++){const c=q[h],cx=c%W,cy=(c/W)|0;
  for(const[dx,dy]of DIRS){const nx=cx+dx,ny=cy+dy;if(!open(nx,ny)||!diagOK(cx,cy,dx,dy))continue;const k=nx+ny*W;if(d[k]>=0)continue;d[k]=d[c]+1;q.push(k)}}
 return d;
}
function los(x0,y0,x1,y1){
 const dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let err=dx-dy,x=x0,y=y0;
 while(!(x===x1&&y===y1)){const e2=2*err;if(e2>-dy){err-=dy;x+=sx}if(e2<dx){err+=dx;y+=sy}
  if(x===x1&&y===y1)return true;const t=tileAt(x,y);if(!t||t.w||t.fog>0)return false}
 return true;
}
function sightR(){return Math.max(2,(L.laws.includes('dark')?4:L.dark?5:9)+ringP(6))}
function computeFov(){
 for(const t of L.t)t.vis=0;
 if(MP.co){for(const pl of MP.players)if(pl.p&&!pl.p.down&&!pl.gone)mpAs(pl.i,fovMark)}else fovMark();
}
function fovMark(){
 const P=G.p,R=sightR();
 for(let y=P.y-R;y<=P.y+R;y++)for(let x=P.x-R;x<=P.x+R;x++){
  if(!inb(x,y))continue;const dx=x-P.x,dy=y-P.y;if(dx*dx+dy*dy>R*R+R)continue;
  if(los(P.x,P.y,x,y)){const t=tileAt(x,y);t.vis=1;t.seen=1}}
}
// ---------- level generation ----------
function genLevel(depth){
 rng=mulberry(hash(G.seed,depth,99));
 const t=[];for(let i=0;i<W*H;i++)t.push({w:1,g:0,wt:0,oil:0,fire:0,fog:0,ice:0,seen:0,vis:0,zap:0});
 L={t,mons:[],items:[],laws:[],depth,up:null,down:null,nid:1,spawnT:0};
 const keys=Object.keys(LAWS);
 if(depth>=3&&chance(0.55)){L.laws.push(pick(keys));if(depth>=9&&chance(0.4)){let k;do{k=pick(keys)}while(L.laws.includes(k));L.laws.push(k)}}
 const has=k=>L.laws.includes(k);
 const B=biomeOf(depth);L.biome=B;L.dark=!!(B&&B.dark);
 const carve=(x,y)=>{if(x>0&&y>0&&x<W-1&&y<H-1)L.t[y*W+x].w=0};
 let start;
 if(depth>1&&chance(0.3)){
  // cavern
  let a=[];for(let i=0;i<W*H;i++){const x=i%W,y=(i/W)|0;a.push(x===0||y===0||x===W-1||y===H-1?1:(chance(0.45)?1:0))}
  for(let s=0;s<4;s++){const b=a.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){let n=0;for(const[dx,dy]of DIRS)n+=a[(y+dy)*W+x+dx];b[y*W+x]=n>=5?1:0}a=b}
  for(let i=0;i<W*H;i++)L.t[i].w=a[i];
  let best=null;const seen=new Int16Array(W*H);
  for(let i=0;i<W*H;i++){if(L.t[i].w||seen[i])continue;const q=[i];seen[i]=1;for(let h=0;h<q.length;h++){const c=q[h];for(const[dx,dy]of DIRS.slice(0,4)){const n=c+dx+dy*W;if(!L.t[n].w&&!seen[n]){seen[n]=1;q.push(n)}}}if(!best||q.length>best.length)best=q}
  for(const tt of L.t)tt.w=1;for(const c of best)L.t[c].w=0;
  start=best[Math.floor(rnd()*best.length)];start=[start%W,(start/W)|0];
 }else{
  const rooms=[];
  for(let n=0;n<80&&rooms.length<11;n++){
   const w=ri(4,10),h=ri(4,7),x=ri(1,W-w-2),y=ri(1,H-h-2);
   if(rooms.some(r=>x<r.x+r.w+2&&x+w+2>r.x&&y<r.y+r.h+2&&y+h+2>r.y))continue;
   rooms.push({x,y,w,h,cx:x+(w>>1),cy:y+(h>>1)});
   for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)carve(xx,yy);
  }
  const link=(a,b)=>{let x=a.cx,y=a.cy;const hf=chance(0.5);
   const hz=()=>{while(x!==b.cx){carve(x,y);x+=x<b.cx?1:-1}},vt=()=>{while(y!==b.cy){carve(x,y);y+=y<b.cy?1:-1}};
   if(hf){hz();vt()}else{vt();hz()}carve(x,y)};
  rooms.sort((a,b)=>a.cx-b.cx);
  for(let i=0;i<rooms.length-1;i++)link(rooms[i],rooms[i+1]);
  for(let i=0;i<3;i++)link(pick(rooms),pick(rooms));
  const r0=pick(rooms);start=[r0.cx,r0.cy];
 }
 const dist=bfs(start[0],start[1]);
 const floors=[];let far=0,fi=-1;
 for(let i=0;i<W*H;i++)if(!L.t[i].w){if(dist[i]<0){L.t[i].w=1;continue}floors.push(i);if(dist[i]>far){far=dist[i];fi=i}}
 L.up={x:start[0],y:start[1]};L.down={x:fi%W,y:(fi/W)|0};
 G.p.x=L.up.x;G.p.y=L.up.y;
 const blob=(n,r,fn)=>{for(let k=0;k<n;k++){const c=pick(floors),cx=c%W,cy=(c/W)|0,rr=ri(2,r);for(let y=cy-rr;y<=cy+rr;y++)for(let x=cx-rr;x<=cx+rr;x++){const tt=tileAt(x,y);if(!tt||tt.w)continue;if((x-cx)**2+(y-cy)**2<=rr*rr&&chance(0.8))fn(tt,x,y)}}};
 const away=(x,y)=>Math.abs(x-start[0])+Math.abs(y-start[1])>3;
 blob(has('tinder')?16:ri(3,6)+(B?B.g:0),4,tt=>{tt.g=1});
 blob(has('flood')?9:(chance(0.5)?ri(1,3):0)+(B?B.wt:0),4,tt=>{tt.wt=1;tt.g=0});
 blob(has('oil')?7:(chance(0.25)?1:0)+(B?B.oil:0),3,(tt,x,y)=>{if(!tt.wt&&away(x,y))tt.oil=1});
 if(has('slick')||(B&&B.ice))for(const tt of L.t)if(!tt.w&&!tt.wt&&chance(has('slick')?0.7:0.35))tt.ice=1;
 if(B&&B.fog)blob(B.fog,3,tt=>{tt.fog=400});
 L.t[L.up.x+L.up.y*W].wt=0;L.t[L.up.x+L.up.y*W].ice=0;
 L.floors=floors;
 // items
 const free=(minD)=>{for(let n=0;n<200;n++){const c=pick(floors),x=c%W,y=(c/W)|0;if(dist[c]>=minD&&!L.items.some(i=>i.x===x&&i.y===y)&&!monAt(x,y)&&!(x===L.down.x&&y===L.down.y))return{x,y}}return null};
 let ni=4+ri(0,2)+pkN('scav')*2+(has('bounty')?4:0)+Math.max(-2,ringP(4));
 if(G.fortune){ni*=2;G.fortune=false}
 const put=(it,minD)=>{const f=free(minD||2);if(f)L.items.push({x:f.x,y:f.y,it})};
 put({t:'food'},4);
 for(let i=0;i<ni;i++)put(rollItem(depth));
 placeFeatures(floors,dist);
 // monsters
 const nm=Math.min(26,(depth===1?3:4)+Math.floor(depth*0.8)+(has('bounty')?3:0));
 const awakeAll=has('restless');
 for(let i=0;i<nm;i++){
  const pool=Object.keys(MON).filter(k=>MON[k].min<=depth&&!MON[k].boss);
  const k=wpick(pool,k=>MON[k].w*(1+Math.min(8,depth-MON[k].min)*0.06)*(B&&B.bias.includes(k)?3:1));
  const f=free(8);if(!f)continue;
  const cnt=MON[k].pack?ri(MON[k].pack[0],MON[k].pack[1]):1;
  for(let j=0;j<cnt;j++){
   let x=f.x,y=f.y;
   if(j>0){const o=pick(DIRS);x+=o[0];y+=o[1];if(!open(x,y)||monAt(x,y))continue}
   spawnMon(k,x,y,awakeAll||chance(0.25));
  }
 }
 if(depth%5===0){
  let bx=L.down.x,by=L.down.y;
  for(const[dx,dy]of DIRS){if(open(bx+dx,by+dy)&&!monAt(bx+dx,by+dy)){bx+=dx;by+=dy;break}}
  const bk=['warden','pyrelord','wyrm'][(depth/5-1)%3];const b=spawnMon(bk,bx,by,false);if(b)b.name=MON[bk].n+' of Depth '+depth;
 }
 rng=mulberry(hash(G.seed,depth,Date.now()&0xffff));
 G.dmv=-1;
}
function rollItem(depth){
 const r=rnd()*100;
 if(r<42){
  const ks=[];for(let k=0;k<POT.length;k++){const w=POT[k].rare?(depth>=5?0.7:0):POT[k].w;if(w>0)ks.push([k,w])}
  const k=wpick(ks,a=>a[1])[0];
  let p=1;if(depth>=3&&chance(0.2))p=2;if(depth>=8&&chance(0.08))p=3;
  return{t:'pot',k,p};
 }
 if(r<60){const k=wpick(SCR.map((s,i)=>i),i=>SCR[i].w);return{t:'scr',k}}
 if(r<68)return{t:'food'};
 if(r<76){const w=pick(Object.keys(WPN));return{t:'wpn',w,e:ri(-1,1+Math.floor(depth/4))}}
 if(r<84)return{t:'arm',lv:Math.min(3,ri(0,1+Math.floor(depth/3))),e:ri(-1,1+Math.floor(depth/5))};
 if(r<92){const k=ri(0,WAND.length-1),c=ri(2,5)+pkN('wright');return{t:'wand',k,c,mc:c}}
 return{t:'ring',k:ri(0,RING.length-1),p:chance(0.28)?-ri(1,3):ri(1,Math.min(3,1+Math.floor(depth/6))),id:false};
}
const hs=()=>1+G.depth*0.16+G.depth*G.depth*0.004;
const ds=()=>1+G.depth*0.11;
function spawnMon(k,x,y,awake){
 const d=MON[k],dep=G.depth;
 const m={id:L.nid++,k,x,y,hp:Math.round(d.hp*hs()*(d.boss?1+dep*0.04:1)),def:d.def+Math.floor(dep/6),spd:d.spd,energy:ri(0,99),st:{},awake:!!awake,aff:[],gen:0,dead:false,t:0};
 if(dep>=3&&!d.boss&&chance(Math.min(0.6,0.12+dep*0.025))){
  const keys=Object.keys(AFX);const n=dep>=10&&chance(0.4)?2:1;
  while(m.aff.length<n){const a=pick(keys);if(!m.aff.includes(a))m.aff.push(a)}
  if(m.aff.includes('swift'))m.spd=Math.round(m.spd*1.4);
  if(m.aff.includes('armored')){m.def+=2;m.hp=Math.round(m.hp*1.2)}
 }
 m.mhp=m.hp;
 if(d.mimic)m.disg=true;if(d.lurk){m.disg=true;m.invis=true}
 L.mons.push(m);return m;
}
