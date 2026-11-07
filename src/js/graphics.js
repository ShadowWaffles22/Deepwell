// ---------- 8-bit graphics: 8x8 sprites + procedural tile textures ----------
// Legend: . clear  a main  b shade  c light  w white  k ink  r red  y gold  o orange
const SPR={
player:['..cccc..','.caaaac.','.awkkwa.','..aaaa..','.caaaac.','caaaaaac','.ab..ba.','.bb..bb.'],
p_brawler:['.rrrrrr.','.caaaac.','.awkkwa.','..aaaa..','caaaaaac','caaccaac','.ab..ba.','bbb..bbb'],
p_lancer:['...yy...','.caaaac.','.awkkwa.','..aaaa..','.caccac.','caaaaaac','.ab..ba.','.bb..bb.'],
p_pyre:['...oo...','..oooo..','.oooooo.','.awkkwa.','..aaaa..','.caooac.','caaaaaac','.bb..bb.'],
p_alchemist:['..cccc..','.caaaac.','.ywkkwy.','..aaaa..','.caaaac.','caaaaa.r','.ab..bbr','.bb..bb.'],
p_scholar:['.bbbbbb.','bbbbbbbb','.awkkwa.','..aaaa..','.cwwwwc.','caaaaaac','.ab..ba.','.bb..bb.'],
p_ghost:['..bbbb..','.baaaab.','.bwaawb.','.baaaab.','baaaaaab','baaaaaab','baaaaaab','ba.ba.ba'],
p_artificer:['.y.cc.y.','.caaaac.','.awkkwa.','..aaaa..','.caaaac.','caaaaa.y','.ab..bby','.bb..bb.'],
p_oracle:['..bbbb..','.bbyybb.','.bwkkwb.','..aaaa..','.baaaab.','baaccaab','baaaaaab','.bb..bb.'],
p_warden2:['c.c..c.c','cccccccc','.baaaab.','.bkaakb.','baaccaab','baaaaaab','baaaaaab','.bb..bb.'],
p_beast:['c......c','cb.cc.bc','.caaaac.','.awkkwa.','..aaaa..','caaaaaac','cbaaaabc','.bb..bb.'],
rat:['........','.aa..aa.','aaaaaaa.','akaaaaaa','aaaaaaa.','.b.b..b.','......b.','........'],
bat:['........','a......a','aa.aa.aa','aaaaaaaa','.aakkaa.','..aaaa..','...bb...','........'],
viper:['........','...aaa..','..akaaa.','..aaaaa.','...aaa..','.aaaaa..','aabbbaa.','.bbbbb..'],
hound:['........','a.....a.','aa...aa.','aaaaaaaa','akaaaaaa','aaaaaaab','.ab..ab.','.bb..bb.'],
brute:['..aaaa..','.aaaaaa.','.akaaka.','aaaaaaaa','aabbbbaa','aabbbbaa','.ab..ba.','bbb..bbb'],
rimesprite:['..a..a..','...aa...','..awwa..','.aakkaa.','..aaaa..','.a.aa.a.','...aa...','..a..a..'],
ghoul:['..aaaa..','.aaaaaa.','.akaaka.','.aaaaaa.','a.aaaa.a','a.aaaa.a','..a..a..','.bb..bb.'],
sentinel:['...aa...','..aaaa..','.awkkwa.','.aaaaaa.','awaaawaa','.aaaaaa.','..abba..','.bb..bb.'],
p_duelist:['.....r..','.caaaac.','.awkkwa.','..aaaa..','.caaaacw','caaaaa.w','.ab..ba.','.bb..bb.'],
p_mender:['..cccc..','.caaaac.','.awkkwa.','..aaaa..','.carrac.','caaraaac','.ab..ba.','.bb..bb.'],
p_stormer:['y.y..y.y','.yyyyyy.','.awkkwa.','..aaaa..','.caayac.','caaayaac','.ab..ba.','.bb..bb.'],
p_reaper:['..bbbb..','.baaaab.','.bwaawb.','.baaaab.','baaaaaay','baaaaaay','.baaaab.','.bb..bb.'],
slime:['........','........','..cccc..','.caaaac.','.akaaka.','aaaaaaaa','abbbbbba','.bbbbbb.'],
archer:['..cccc..','.cwkkwc.','..cccc..','.c.cc.b.','c..cc..b','...cc..b','..c..c.b','.cc..cc.'],
leech:['........','........','.aaaa...','aaaaaa..','akaaaaa.','.bbaaaaa','..bbbbaa','....bbb.'],
wisp:['...c....','..cac...','..aaa...','.caaac..','.aakaa..','.aaaaa..','..aaa...','...b....'],
bomber:['...y....','...b....','.aaaaaa.','aaaaaaaa','akaaaaka','aaaaaaaa','.aabbaa.','..bbbb..'],
mite:['a..aa..a','.a.aa.a.','..aaaa..','aaakkaaa','..aaaa..','.a.aa.a.','a..aa..a','........'],
shaman:['..bbbb..','.baaaab.','.bkaakb.','.baaaab.','baaaaaab','baaaaaab','.aaaaaa.','.aa..aa.'],
mimic:['........','.bbbbbb.','baaaaaab','bwkwkwkb','baaaaaab','baaaaaab','bbbbbbbb','........'],
golem:['.bbbbbb.','.baaaab.','.bkaakb.','bbaaaabb','baaaaaab','baaaaaab','.bb..bb.','.bb..bb.'],
wraith:['..bbbb..','.baaaab.','.akaaka.','.aaaaaa.','.aaaaaa.','.aaaaaa.','.a.aa.a.','..a..a..'],
warden:['c.c..c.c','cccccccc','.baaaab.','.bkaakb.','baaaaaab','baaccaab','baaaaaab','.bb..bb.'],
thief:['..bbbb..','.baaaab.','.bkaakb.','..aaaa..','.baaaab.','.baaaay.','..a..a..','.bb..bb.'],
troll:['.bbbbbb.','.baaaab.','.bkaakb.','.baaaab.','bbawwabb','baaaaaab','.bbaabb.','.bb..bb.'],
spore:['..aaaa..','.aaccaa.','aaaaaaaa','.bbbbbb.','...ww...','...ww...','..wwww..','........'],
necro:['..bbbb..','.bwkkwb.','..bbbb..','.bbaabbc','.baaaabc','.baaaab.','.baaaab.','bbbbbbbb'],
thrall:['..cccc..','.cwkkwc.','..cccc..','..cc.c..','.cccccc.','..cc.c..','..c..c..','.cc..cc.'],
drake:['a.....a.','aa...aa.','.aaaaaa.','.akaaaaa','.aaaaaaa','..aaaaa.','.a.aa.a.','.b.bb.b.'],
gazer:['..bbbb..','.baaaab.','baawwaab','baawkaab','baawwaab','.baaaab.','..bbbb..','.a.aa.a.'],
wolf:['a.a.....','aaaa....','akaaaaaa','aaaaaaaa','.aaaaaaa','.aa..aa.','.b.b.b.b','........'],
lurker:['..bbbb..','.baaaab.','.bwaawb.','.baaaab.','.b.aa.b.','b..bb..b','.b.bb.b.','........'],
warlock:['...aa...','..aaaa..','.aaaaaa.','..kwwk..','..aaaa..','.aaccaa.','.aaaaaa.','.aa..aa.'],
jugg:['.bbbbbb.','bbaaaabb','bakaakab','baaaaaab','bbaaaabb','baaaaaab','bbaaaabb','.bb..bb.'],
pyrelord:['c.c.c.c.','cacacaca','.aaaaaa.','.akaaka.','.aaaaaa.','aaabbaaa','baaaaaab','.bb..bb.'],
wyrm:['..aaaa..','.akaaka.','.aaaaaa.','..aaaa..','.aaaaaaa','aaaaaaa.','.aaaaa..','..aaa...'],
pot:['...bb...','...cc...','...bb...','..baab..','.baaaab.','.baccab.','.baaaab.','..bbbb..'],
scr:['.bbbbbb.','bwwwwwwb','.wkkwkw.','.wwwwww.','.wkwkkw.','.wwwwww.','bwwwwwwb','.bbbbbb.'],
food:['........','..bbbb..','.baaaab.','baaccaab','baaaaaab','.baaaab.','..bbbb..','........'],
wpn:['......cc','.....cc.','....cc..','.c.cc...','..cc....','.cbc....','b.b.....','bb......'],
arm:['.cc..cc.','cccccccc','caaaaaac','.aaccaa.','.aaaaaa.','.aaaaaa.','.abaaba.','..bbbb..'],
wand:['......yy','.....yy.','....a...','...a....','..a.....','.a......','a.......','........'],
ring:['........','..cccc..','.c....c.','c..yy..c','c..yy..c','.c....c.','..cccc..','........'],
down:['........','.yyyyyy.','..yyyy..','...yy...','........','.yyyyyy.','..yyyy..','...yy...'],
up:['...yy...','..yyyy..','.yyyyyy.','........','...yy...','..yyyy..','.yyyyyy.','........'],
fire0:['...o....','..oyo...','..oyo.o.','.ooyyoo.','.oyyyyo.','ooyyyyoo','.oyyyyo.','..oooo..'],
fire1:['....o...','...oyo..','.o.oyo..','.ooyyoo.','.oyyyyo.','ooyyyyoo','.oyyyyo.','..oooo..'],
altar:['........','........','........','bbbbbbbb','baaaaaab','.baaaab.','.baaaab.','bbbbbbbb'],
fount:['...cc...','..c..c..','...cc...','.bbbbbb.','baaaaaab','bbccccbb','.baaaab.','..bbbb..']
};
const SIG=[['...yy...','..yyyy..','.yyyyyy.'],['...yy...','..yyyy..','...yy...'],['..yyyy..','.yyyyyy.','..yyyy..']];
function hx(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
function rgb(a){return'#'+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('')}
function shade(h,f,add){const c=hx(h);return rgb(c.map(v=>v*f+(add||0)))}
const IMG=new Map();
function mk(){const c=document.createElement('canvas');c.width=c.height=8;return c}
function sprite(name,main,rows){
 const key=name+'|'+main+(rows?'|r':'');let c=IMG.get(key);if(c)return c;
 c=mk();const g=c.getContext('2d');
 const pal={a:main,b:shade(main,0.55),c:shade(main,1.3,28),w:'#f4f4f8',k:'#0b0d12',r:'#e0505a',y:'#ffd36b',o:'#ff8a3d'};
 const R=rows||SPR[name];
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){const ch=R[y][x];if(ch==='.')continue;g.fillStyle=pal[ch]||'#f0f';g.fillRect(x,y,1,1)}
 IMG.set(key,c);return c;
}
function tex(kind,variant,frame,base){
 const key='t'+kind+variant+'.'+frame+base;let c=IMG.get(key);if(c)return c;
 c=mk();const g=c.getContext('2d');const r=mulberry(variant*7919+kind.length*31+(kind.charCodeAt(0)||0));
 const px=(x,y,col)=>{g.fillStyle=col;g.fillRect(x,y,1,1)},fill=col=>{g.fillStyle=col;g.fillRect(0,0,8,8)};
 const R=()=>Math.floor(r()*8);
 if(kind==='floor'){
  fill(base);const lt=shade(base,1.35,6),dk=shade(base,0.72);
  for(let i=0;i<4;i++)px(R(),R(),lt);for(let i=0;i<3;i++)px(R(),R(),dk);
  for(let i=0;i<8;i++){px(i,7,dk);px(7,i,dk)}
  if(variant%5===0){const x=R()%6+1,y=R()%6+1;px(x,y,dk);px(x+1,y+1,dk)}
 }else if(kind==='wall'){
  fill('#12141c');const b='#363b4d',l='#4b5169',d='#292d3c';
  for(let band=0;band<2;band++){const y0=band*4,off=band?3:0;
   for(let y=y0;y<y0+3;y++)for(let x=0;x<8;x++){if((x+off)%6===5)continue;px(x,y,y===y0?l:(x%3===0?d:b))}}
  if(variant%3===0)px(R(),R()%3,'#5a6180');
 }else if(kind==='grass'){
  fill(base);const g1='#3f8f52',g2='#2d6b3c',g3='#79d08a';
  for(let i=0;i<5;i++){const x=R(),y=1+R()%7;px(x,y,i%2?g1:g2);px(x,y-1,i%3?g2:g3)}
  px(R(),R(),shade(base,0.7));
 }else if(kind==='water'){
  fill('#143a5c');
  for(let y=1;y<8;y+=3){for(let x=0;x<8;x++){if((x+y+frame*2)%4<2)px(x,y,'#2f6ea8')}}
  px((variant+frame*3)%8,(variant*3)%8,'#8fd0f0');
  for(let i=0;i<8;i++)px(i,7,'#0f2d48');
 }else if(kind==='ice'){
  fill('#27506a');
  for(let i=0;i<8;i++)px(i,7-i,'#7fc8e0');
  px(R(),R(),'#e8f8ff');px(R(),R(),'#b8e8f8');px(R(),R(),'#1d3e52');
 }else if(kind==='oil'){
  fill('#1f160c');
  for(let i=0;i<4;i++)px(R(),R(),'#3a2a12');
  px(R(),R(),'#6a5528');px(R(),R(),'#5a3a6a');px(R(),R(),'#3a6a5a');
  for(let i=0;i<8;i++)px(i,7,'#150e07');
 }
 IMG.set(key,c);return c;
}
function altarSpr(god,on){
 const rows=SPR.altar.slice();const sg=SIG[god%3];rows[0]=sg[0];rows[1]=sg[1];rows[2]=sg[2];
 return sprite('altar'+god+(on?'1':'0'),on?'#cfc6a8':'#6a6a72',rows);
}
function fountSpr(col,used){
 const rows=SPR.fount;
 const key='fount|'+col+used;let c=IMG.get(key);if(c)return c;
 c=mk();const g=c.getContext('2d');const stone=used?'#4a4a52':'#8d93a6',wat=used?'#444':col;
 const pal={b:shade(stone,0.55),a:stone,c:wat};
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){const ch=rows[y][x];if(ch!=='.'){g.fillStyle=pal[ch];g.fillRect(x,y,1,1)}}
 IMG.set(key,c);return c;
}
// ---------- renderer ----------
function draw(){
 if(!G||!L||view==='title')return;
 const P=G.p,tn=now();
 camX=VW>=W?0:Math.max(0,Math.min(W-VW,P.x-(VW>>1)));camY=VH>=H?0:Math.max(0,Math.min(H-VH,P.y-(VH>>1)));
 cx.save();cx.imageSmoothingEnabled=false;cx.translate(-camX*TS,-camY*TS);
 cx.fillStyle='#07080c';cx.fillRect(0,0,W*TS,H*TS);
 cx.textAlign='center';cx.textBaseline='middle';
 const gl=(ch,x,y,col,sz)=>{cx.font=(sz||TS*0.82)+'px "Press Start 2P","JetBrains Mono",ui-monospace,monospace';cx.fillStyle=col;cx.fillText(ch,x*TS+TS/2,y*TS+TS/2+1)};
 const put=(img,x,y)=>cx.drawImage(img,0,0,8,8,x*TS,y*TS,TS,TS);
 const sense=G.sense>G.tick,fr=(tn/450|0)&1,ff=(tn/170|0)&1;
 const x0=Math.max(0,camX-1),x1=Math.min(W,camX+VW+1),y0=Math.max(0,camY-1),y1=Math.min(H,camY+VH+1);
 const base=L.biome?shade(L.biome.col,1.15,6):'#1a1e2b',gbase=L.biome&&L.biome.g>=8?shade(L.biome.col,1.0):'#17301f';
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
  const t=L.t[x+y*W];if(!t.seen)continue;
  const v=t.vis,vr=hash(x,y,5)&7;
  if(t.w){
   let edge=false;for(const[dx,dy]of DIRS){const n=tileAt(x+dx,y+dy);if(n&&!n.w){edge=true;break}}
   if(edge){put(tex('wall',vr,0,''),x,y);if(!v){cx.fillStyle='rgba(6,7,11,0.55)';cx.fillRect(x*TS,y*TS,TS,TS)}}
   continue}
  let im;
  if(t.wt)im=tex('water',vr,(fr+x+y)&1,'');
  else if(t.ice)im=tex('ice',vr,0,'');
  else if(t.oil)im=tex('oil',vr,0,'');
  else if(t.g)im=tex('grass',vr,0,gbase);
  else im=tex('floor',vr,0,base);
  put(im,x,y);
  if(t.fog>0&&v){cx.fillStyle='rgba(160,160,180,'+Math.min(0.7,t.fog/10)+')';cx.fillRect(x*TS,y*TS,TS,TS)}
  if(t.sanct>0&&v){cx.fillStyle='rgba(255,240,170,'+(0.12+0.1*Math.sin(tn/200+x))+')';cx.fillRect(x*TS,y*TS,TS,TS)}
  if(t.fire>0){cx.globalAlpha=v?1:0.5;put(sprite(ff?'fire1':'fire0','#ff8a3d'),x,y);cx.globalAlpha=1}
  if(tn-t.zap<350){cx.fillStyle='rgba(245,236,122,'+(1-(tn-t.zap)/350)*0.8+')';cx.fillRect(x*TS,y*TS,TS,TS)}
  if(x===L.down.x&&y===L.down.y)put(sprite('down','#ffd36b'),x,y);
  if(x===L.up.x&&y===L.up.y)put(sprite('up','#7fa0c8'),x,y);
  if(!v){cx.fillStyle='rgba(6,7,11,0.55)';cx.fillRect(x*TS,y*TS,TS,TS)}
 }
 if(L.feat)for(const f of L.feat){const t=tileAt(f.x,f.y);if(!t.seen)continue;
  cx.globalAlpha=t.vis?1:0.55;
  if(f.k==='altar')put(altarSpr(f.god,f.uses>0),f.x,f.y);else put(fountSpr(COLORS[WORLD.fc[f.kind]][1],f.used),f.x,f.y);
  cx.globalAlpha=1}
 const showAll=pkN('scav')>0;
 for(const f of L.items){const t=tileAt(f.x,f.y);if(!t.seen&&!showAll)continue;
  const it=f.it,nm=it.t==='pot'?'pot':it.t,col=it.t==='pot'?potCol(it.k)[1]:it.t==='scr'?'#e8dcb0':it.t==='food'?'#c98a4a':it.t==='wand'?'#b88850':it.t==='ring'?'#e8c060':it.t==='wpn'?'#c8d0dc':'#98a4b8';
  cx.globalAlpha=t.vis?1:0.55;put(sprite(nm,col),f.x,f.y);cx.globalAlpha=1}
 for(const m of L.mons){
  if(m.dead)continue;const t=tileAt(m.x,m.y);if(!(t.vis||sense))continue;
  if(m.disg){if(m.invis)continue;put(sprite('pot','#d49a5a'),m.x,m.y);continue}
  const d=MON[m.k];
  cx.fillStyle='rgba(0,0,0,0.35)';cx.fillRect(m.x*TS+TS*0.15,m.y*TS+TS*0.88,TS*0.7,TS*0.1);
  const col=m.ally?'#9fc0ff':m.awake?d.col:shade(d.col,0.6);
  const bob=m.awake&&!m.ally&&((tn/300|0)+m.id)%2?-Math.max(1,TS/16)|0:0;
  const ao=animOff(m,tn);
  cx.save();cx.translate(ao[0],bob+ao[1]);put(sprite(SPR[m.k]?m.k:'slime',col),m.x,m.y);if(ao[2]>0){cx.globalAlpha=ao[2];cx.fillStyle='#fff';cx.fillRect(m.x*TS,m.y*TS,TS,TS);cx.globalAlpha=1}cx.restore();
  if(m.st.frozen>0){cx.fillStyle='rgba(143,224,240,0.4)';cx.fillRect(m.x*TS,m.y*TS,TS,TS)}
  if(m.st.burn>0){cx.fillStyle='rgba(255,130,40,0.4)';cx.fillRect(m.x*TS,m.y*TS,TS,TS)}
  if(m.aff.length){cx.strokeStyle='#e8c060';cx.lineWidth=Math.max(1,TS/12);cx.strokeRect(m.x*TS+1,m.y*TS+1,TS-2,TS-2)}
  if(d.boss){cx.strokeStyle='#ff6a6a';cx.lineWidth=Math.max(1,TS/12);cx.strokeRect(m.x*TS+0.5,m.y*TS+0.5,TS-1,TS-1)}
  if(m.ally){cx.strokeStyle='#7fb0ff';cx.lineWidth=Math.max(1,TS/12);cx.strokeRect(m.x*TS+2,m.y*TS+2,TS-4,TS-4)}
  if(m.hp<m.mhp){const bh=Math.max(2,TS/8|0);cx.fillStyle='#401018';cx.fillRect(m.x*TS,m.y*TS+TS-bh,TS,bh);cx.fillStyle='#e0505a';cx.fillRect(m.x*TS,m.y*TS+TS-bh,TS*m.hp/m.mhp,bh)}
  if(!m.awake&&!m.ally)gl('z',m.x+0.72,m.y+0.2,'#aab3d0',TS*0.45);
 }
 {
  const bob=((tn/400|0)&1)?-Math.max(1,TS/16)|0:0;
  const heroes=MP.co&&MP.players.length?MP.players.filter(q=>q.p&&!q.gone).map(q=>({p:q.p,kit:q.kit,me:q.i===MP.me,name:q.name})):(G.dead?[]:[{p:P,kit:G.kit,me:true}]);
  for(const h of heroes){
   const p=h.p;
   if(p.down){cx.globalAlpha=0.85;gl('†',p.x,p.y,ROLECOL[h.kit]||'#aab',TS*0.8);cx.globalAlpha=1;
    if(!h.me){cx.font=Math.max(7,TS*0.36)+'px "Press Start 2P",ui-monospace,monospace';cx.fillStyle='rgba(200,210,230,0.75)';cx.fillText(h.name.slice(0,8),p.x*TS+TS/2,p.y*TS-TS*0.08)}
    continue}
   cx.fillStyle='rgba(0,0,0,0.35)';cx.fillRect(p.x*TS+TS*0.15,p.y*TS+TS*0.88,TS*0.7,TS*0.1);
   const ao=animOff(p,tn);
   cx.save();cx.translate(ao[0],bob+ao[1]);
   cx.globalAlpha=p.st.hidden>0?0.5:1;
   put(sprite(SPR['p_'+h.kit]?'p_'+h.kit:'player',p.st.burn>0?'#ffb070':p.st.stone>0?'#9aa0a8':ROLECOL[h.kit]||'#d9dce6'),p.x,p.y);
   if(ao[2]>0){cx.globalAlpha=ao[2];cx.fillStyle='#fff';cx.fillRect(p.x*TS,p.y*TS,TS,TS);cx.globalAlpha=1}
   cx.restore();cx.globalAlpha=1;
   if(p.st.frozen>0){cx.fillStyle='rgba(143,224,240,0.4)';cx.fillRect(p.x*TS,p.y*TS,TS,TS)}
   if(MP.co&&!h.me){
    const w=TS*0.8;cx.fillStyle='rgba(0,0,0,0.6)';cx.fillRect(p.x*TS+TS*0.1,p.y*TS-2,w,3);cx.fillStyle=ROLECOL[h.kit]||'#8fd';cx.fillRect(p.x*TS+TS*0.1,p.y*TS-2,w*Math.max(0,p.hp/p.mhp),3);
    cx.font=Math.max(7,TS*0.36)+'px "Press Start 2P",ui-monospace,monospace';cx.textAlign='center';cx.fillStyle='#0b0d12';cx.fillText(h.name.slice(0,8),p.x*TS+TS/2+1,p.y*TS-TS*0.2+1);cx.fillStyle=ROLECOL[h.kit]||'#fff';cx.fillText(h.name.slice(0,8),p.x*TS+TS/2,p.y*TS-TS*0.2)}
  }
 }
 for(let i=FX.length-1;i>=0;i--){
  const f=FX[i],a=tn-f.t;
  if(a>(f.dur||700)){FX.splice(i,1);continue}
  if(a<0||f.k==='hr')continue;
  if(f.k==='sl'||f.k==='pb'){drawAtk(f,a);continue}
  if(f.k==='e'||f.k==='i'||f.k==='pr'||f.k==='s'){drawFx2(f,a);continue}
  if(f.k==='f'){cx.globalAlpha=Math.max(0,0.7-a/500);cx.fillStyle=f.col;cx.fillRect(f.x*TS,f.y*TS,TS,TS);cx.globalAlpha=1}
  else if(f.k==='l'){cx.globalAlpha=Math.max(0,1-a/350);cx.strokeStyle=f.col;cx.lineWidth=Math.max(2,TS/8);cx.beginPath();cx.moveTo(f.x*TS+TS/2,f.y*TS+TS/2);cx.lineTo(f.x1*TS+TS/2,f.y1*TS+TS/2);cx.stroke();cx.globalAlpha=1}
  else{cx.globalAlpha=Math.max(0,1-a/700);gl(f.txt,f.x,f.y-a/500,'#0b0d12',TS*0.5);gl(f.txt,f.x+0.04,f.y-a/500-0.04,f.col,TS*0.5);cx.globalAlpha=1}
 }
 if(hover&&inb(hover[0],hover[1])){cx.strokeStyle=mode==='throw'||mode==='zap'?'#ffd36b':'rgba(255,255,255,0.55)';cx.lineWidth=Math.max(1,TS/12);cx.strokeRect(hover[0]*TS+1,hover[1]*TS+1,TS-2,TS-2)}
 if(L.laws.includes('dark')||L.dark){
  const g=cx.createRadialGradient(P.x*TS+TS/2,P.y*TS+TS/2,TS*2.5,P.x*TS+TS/2,P.y*TS+TS/2,TS*7);
  g.addColorStop(0,'rgba(7,8,12,0)');g.addColorStop(1,'rgba(7,8,12,0.92)');cx.fillStyle=g;cx.fillRect(0,0,W*TS,H*TS)}
 cx.restore();
}

// ---------- item-use effects (drawn inside the camera transform) ----------
function fxRnd(seed,i,j){const v=Math.sin(seed*12.9898+i*78.233+j*37.719)*43758.5453;return v-Math.floor(v)}
function drawFx2(f,a){
 const u0=a/f.dur;
 if(f.k==='s'){cx.globalAlpha=Math.max(0,f.a*(1-u0));cx.fillStyle=f.col;cx.fillRect(-9999,-9999,19999,19999);cx.globalAlpha=1;return}
 if(f.k==='i'){
  const al=u0<0.65?1:Math.max(0,(1-u0)/0.35),sc=0.8+u0*0.5,y=f.y-0.1-u0*1.3;
  cx.globalAlpha=al;cx.save();cx.translate((f.x+0.5)*TS,(y+0.5)*TS);cx.scale(sc,sc);
  cx.drawImage(sprite(f.name,f.col),0,0,8,8,-TS/2,-TS/2,TS,TS);cx.restore();cx.globalAlpha=1;return}
 if(f.k==='pr'){
  const x=f.x+(f.x1-f.x)*u0,y=f.y+(f.y1-f.y)*u0-Math.sin(Math.PI*u0)*1.1;
  cx.save();cx.translate((x+0.5)*TS,(y+0.5)*TS);cx.rotate(u0*12);
  cx.drawImage(sprite(f.name,f.col),0,0,8,8,-TS*0.35,-TS*0.35,TS*0.7,TS*0.7);cx.restore();return}
 // particle emitter
 const px=Math.max(2,Math.round(TS/8*(f.size||1))),cxx=f.x+0.5,cyy=f.y+0.5;
 for(let i=0;i<f.n;i++){
  const r1=fxRnd(f.seed,i,1),r2=fxRnd(f.seed,i,2),r3=fxRnd(f.seed,i,3),r4=fxRnd(f.seed,i,4);
  const u=(a-r1*f.stag*f.life)/f.life;if(u<0||u>1)continue;
  const ang=r2*6.2832,col=f.cols[(r4*f.cols.length)|0],R=f.R;let x=cxx,y=cyy,dx=0,dy=0;
  switch(f.pat){
   case 'rise':x=cxx+(r2-0.5)*0.9;y=cyy+0.3-u*(0.8+R*0.5);break;
   case 'burst':{const d=R*(1-(1-u)*(1-u))*(0.4+0.6*r3);x=cxx+Math.cos(ang)*d;y=cyy+Math.sin(ang)*d+u*u*0.4;break}
   case 'converge':{let sx=cxx+Math.cos(ang)*R*(0.6+0.4*r3),sy=cyy+Math.sin(ang)*R*(0.6+0.4*r3);
    if(f.from&&f.from.length){const m=f.from[i%f.from.length];sx=m[0]+0.5;sy=m[1]+0.5}
    x=sx+(cxx-sx)*u*u;y=sy+(cyy-sy)*u*u;break}
   case 'ring':{const an=i/f.n*6.2832;x=cxx+Math.cos(an)*R*u;y=cyy+Math.sin(an)*R*u;break}
   case 'rain':x=cxx+(r2-0.5)*2*R;y=cyy-1.8+u*2.1;break;
   case 'swirl':{const an=ang+u*5,d=R*(0.3+0.7*r3)*(1-u*0.5);x=cxx+Math.cos(an)*d;y=cyy+Math.sin(an)*d*0.8-u*0.5;break}
   case 'pillar':x=cxx+(r2-0.5)*1.0;y=cyy+0.5-u*R;break;
   case 'streak':{const d=u*R*2.2;dx=Math.cos(ang);dy=Math.sin(ang);x=cxx+dx*d;y=cyy+dy*d;break}
  }
  cx.globalAlpha=Math.max(0,1-u*u);
  if(f.pat==='streak'){cx.strokeStyle=col;cx.lineWidth=px;cx.beginPath();cx.moveTo(x*TS,y*TS);cx.lineTo((x-dx*0.35)*TS,(y-dy*0.35)*TS);cx.stroke()}
  else if(f.ch&&i%2===0){cx.font=(TS*0.5)+'px "Press Start 2P",ui-monospace,monospace';cx.fillStyle=col;cx.textAlign='center';cx.textBaseline='middle';cx.fillText(f.ch,x*TS,y*TS)}
  else{cx.fillStyle=col;cx.fillRect(Math.round(x*TS-px/2),Math.round(y*TS-px/2),px,px)}
 }
 cx.globalAlpha=1;
}

// ---------- attack animation drawing ----------
function animOff(a,tn){
 const s=ANIM.get(a);if(!s)return[0,0,0];let ox=0,oy=0,fl=0;
 if(s.atk){const u=(tn-s.atk.t)/ATKDUR;if(u>=0&&u<1){const k=Math.sin(Math.PI*Math.min(1,u*1.15))*s.atk.amp*TS;ox=s.atk.dx*k;oy=s.atk.dy*k}}
 if(s.hurt){const u=(tn-s.hurt)/280;if(u>=0&&u<1){fl=(1-u)*0.55;ox+=Math.sin(u*28)*(1-u)*TS*0.09}}
 return[ox,oy,fl];
}
function drawAtk(f,a){
 const u=Math.min(1,a/f.dur),T=TS,X=f.x*T,Y=f.y*T;
 cx.save();cx.lineCap='round';cx.strokeStyle=f.col;cx.fillStyle=f.col;cx.globalAlpha=Math.max(0,1-u*u);
 const lw=Math.max(2,T/7);cx.lineWidth=lw;
 if(f.k==='pb'){
  const k=Math.min(1,a/f.dur),x=(f.x+(f.x1-f.x)*k+0.5)*T,y=(f.y+(f.y1-f.y)*k+0.5)*T,r=Math.max(2,T/6);
  cx.globalAlpha=1;cx.fillStyle='#fff';cx.fillRect(x-r,y-r,r*2,r*2);cx.fillStyle=f.col;cx.fillRect(x-r*0.6,y-r*0.6,r*1.2,r*1.2);cx.restore();return}
 const fl=f.dx<0?-1:1;
 switch(f.style){
  case 'slash':{ // diagonal swoosh that sweeps across
   const e=Math.min(1,u*2.2);cx.beginPath();cx.moveTo(X+T*(fl>0?0.1:0.9),Y+T*0.05);cx.lineTo(X+T*(fl>0?0.1:0.9)+fl*T*0.8*e,Y+T*0.05+T*0.9*e);cx.stroke();
   cx.globalAlpha*=0.5;cx.beginPath();cx.moveTo(X+T*(fl>0?0.28:0.72),Y);cx.lineTo(X+T*(fl>0?0.28:0.72)+fl*T*0.7*e,Y+T*0.8*e);cx.stroke();break}
  case 'claw':{
   const e=Math.min(1,u*2.2);for(let i=0;i<3;i++){const ox=T*(0.2+i*0.25);cx.beginPath();cx.moveTo(X+ox,Y+T*0.08);cx.lineTo(X+ox-T*0.22*e,Y+T*(0.08+0.84*e));cx.stroke()}break}
  case 'stab':case 'thrust':{
   const len=f.style==='thrust'?1.5:1.0,e=Math.min(1,u*2.5),sx=(f.ox+0.5)*T,sy=(f.oy+0.5)*T;
   const ex=(f.x+0.5)*T+f.dx*T*(len-1)*0.5,ey=(f.y+0.5)*T+f.dy*T*(len-1)*0.5;
   cx.beginPath();cx.moveTo(sx+(ex-sx)*0.35,sy+(ey-sy)*0.35);cx.lineTo(sx+(ex-sx)*(0.35+0.65*e),sy+(ey-sy)*(0.35+0.65*e));cx.stroke();break}
  case 'sweep':{ // axe: circle swept around the attacker
   const cxp=(f.ox+0.5)*T,cyp=(f.oy+0.5)*T,e=Math.min(1,u*1.8);cx.beginPath();cx.arc(cxp,cyp,T*0.95,-1.6+u*2,-1.6+u*2+e*4.6);cx.lineWidth=lw*1.3;cx.stroke();break}
  case 'smash':{
   const e=Math.min(1,u*2),r=T*(0.2+0.5*e);cx.lineWidth=lw;cx.strokeRect(X+T/2-r,Y+T/2-r,r*2,r*2);
   for(let i=0;i<4;i++){const an=i*1.5708+0.78;cx.beginPath();cx.moveTo(X+T/2+Math.cos(an)*r,Y+T/2+Math.sin(an)*r);cx.lineTo(X+T/2+Math.cos(an)*(r+T*0.25),Y+T/2+Math.sin(an)*(r+T*0.25));cx.stroke()}break}
  case 'bite':{
   const e=Math.min(1,u*2.4),g=T*0.42*(1-e);cx.fillStyle='#fff';
   for(const s of[-1,1]){const yy=Y+T/2+s*(T*0.08+g);cx.beginPath();cx.moveTo(X+T*0.2,yy+s*T*0.34);cx.lineTo(X+T*0.35,yy);cx.lineTo(X+T*0.5,yy+s*T*0.34);cx.lineTo(X+T*0.65,yy);cx.lineTo(X+T*0.8,yy+s*T*0.34);cx.lineTo(X+T*0.8,yy+s*T*0.38);cx.lineTo(X+T*0.2,yy+s*T*0.38);cx.closePath();cx.fill()}break}
  case 'zap':{
   cx.beginPath();let x=(f.ox+0.5)*T,y=(f.oy+0.5)*T;const tx=(f.x+0.5)*T,ty=(f.y+0.5)*T;cx.moveTo(x,y);
   for(let i=1;i<=4;i++){const k=i/4,j=(fxRnd(Math.floor(f.t/50),i,9)-0.5)*T*0.5;cx.lineTo(x+(tx-x)*k+(i<4?j:0),y+(ty-y)*k+(i<4?-j:0))}cx.stroke();break}
  case 'fire':{
   for(let i=0;i<5;i++){const r=T*(0.15+0.5*u)*(0.5+fxRnd(7,i,1)),an=i*1.26;cx.fillStyle=i%2?'#ffd36b':'#ff8a3d';cx.fillRect(X+T/2+Math.cos(an)*r-lw/2,Y+T/2+Math.sin(an)*r-lw-u*T*0.4,lw,lw*1.5)}
   cx.globalAlpha*=0.4;cx.fillStyle='#ff8a3d';cx.fillRect(X,Y,T,T);break}
 }
 cx.restore();
}

// ---------- one look per role ----------
function roleSpr(){return SPR['p_'+G.kit]?'p_'+G.kit:'player'}

// ---------- small pixel icons for HTML (journal, role cards) ----------
const ICONS=new Map();
function ji(src,col,dim){
 let key,cv;
 if(typeof src==='string'){key=src+'|'+col;cv=null}else{cv=src;key=null}
 let url=key&&ICONS.get(key);
 if(!url){const c=cv||sprite(src,col);url=c.toDataURL();if(key)ICONS.set(key,url)}
 return'<img class="ji'+(dim?' dim':'')+'" alt="" src="'+url+'">';
}
