// Optional browser test: two tabs host and join over the same-device transport.
// Needs playwright and a running server:  npm start  (then)  node tests/e2e-multiplayer.js
const {chromium}=require('playwright');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({viewport:{width:1100,height:900}});
const mk=async(n)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(n+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|fonts|504|Failed to load/.test(m.text()))errs.push(n+': '+m.text())});await p.goto(process.env.URL||'http://localhost:8080/');await sleep(300);return p};
const A=await mk('A'),B=await mk('B');
await A.click('#mpbtn');await A.fill('#lname','Ada');await A.click('#lkind button[data-v=local]');await A.click('#lhost');
await A.waitForSelector('#lstep2:not([hidden])');const code=await A.textContent('#lroomcode');
await B.click('#mpbtn');await B.fill('#lname','Bo');await B.click('#lkind button[data-v=local]');await B.fill('#lcode',code);await B.click('#ljoin');
await B.waitForSelector('#lstep2:not([hidden])');await B.click('#lready');await sleep(300);
await A.click('#lstart');await A.waitForSelector('#game:not([hidden])');await B.waitForSelector('#game:not([hidden])');await sleep(500);
// ping from guest via right-click on a tile
const box=await B.locator('#map').boundingBox();await B.mouse.click(box.x+box.width*0.4,box.y+box.height*0.5,{button:'right'});await sleep(250);
console.log('A has ping fx',await A.evaluate(()=>FX.some(f=>f.k==='e'&&f.ch==='!')));
// down Bo beside Ada
await A.evaluate(()=>{const a=MP.players[0].p,q=MP.players[1].p;q.x=a.x+1;q.y=a.y;mpAs(1,()=>mpDown('a test'));mpBroadcast()});await sleep(400);
console.log('A banner:',await A.textContent('#partybanner'),'| Revive btn hidden?',await A.evaluate(()=>$('bint').hidden),await A.textContent('#bint'));
console.log('B banner:',await B.textContent('#partybanner'));
await A.screenshot({path:'downA.png'});
await A.keyboard.press('e');await sleep(500);
console.log('after revive B down?',await B.evaluate(()=>G.p.down),'banner hidden',await B.evaluate(()=>$('partybanner').hidden));
// host leaves
await A.click('#menu');await A.click('#menu');await sleep(500);
console.log('B view',await B.evaluate(()=>view),'toast:',await B.textContent('#toast'),'| B MP.on',await B.evaluate(()=>MP.on));
console.log('errors',errs);await b.close();
})();
