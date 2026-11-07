// ---------- expansion data ----------
COLORS.push(['sea green','#2a9d8f'],['dusk orange','#e07b39'],['ivory','#f2ecd8'],['wine','#7a2e48'],['moss','#6b8e3a'],['steel','#8d9db0'],['magenta','#d03fa8'],['sky','#6fc3f0']);
POT.push(
{n:'Lodestone',d:'Every creature in sight is dragged next to you. Brave.',t:'Drags creatures in a wide radius toward the target.',w:4},
{n:'Siphon',d:'Drains 20% of every visible creature\'s health and gives it to you.',t:'Drains creatures in the area. Nobody gains it.',w:5},
{n:'Corrode',d:'Eats your armor by 1 point.',t:'Corrodes creatures in the area: armor -4 for a long while.',w:5},
{n:'Gale',d:'A blast of wind throws everything adjacent away from you.',t:'Throws creatures outward from the target and blows out fires.',w:5},
{n:'Thrall',d:'A spectral guardian fights beside you for 40 turns.',t:'Creatures in the area serve you for a short while. Bosses resist.',w:0,rare:1},
{n:'Fortune',d:'The next floor holds twice the loot. Also reveals one unknown potion in your pack.',t:'Every item lying in the area changes into something else.',w:0,rare:1}
);
SCR.push(
{n:'Identify',d:'Reveals one unidentified item in your pack, wands and rings first.',w:7},
{n:'Anathema',d:'Lifts curses from worn rings.',w:5},
{n:'Pyre',d:'A ring of flame erupts around you. It burns you too unless you resist.',w:5},
{n:'Sanctum',d:'A holy circle around you that creatures cannot enter for 20 turns.',w:4},
{n:'Legion',d:'Two spectral allies serve you for 40 turns.',w:4},
{n:'Tithe',d:'You give up a quarter of your health. A gift is offered in return.',w:4},
{n:'Recharge',d:'Refills your wands.',w:4}
);
const WOODS=['ash','yew','ebony','birch','rowan','teak','cedar','alder','maple','willow','hickory','bamboo'];
const GEMS=['garnet','opal','jet','amber','onyx','topaz','peridot','agate','jade','moonstone','bloodstone','citrine'];
const WAND=[
{n:'Firebolt',d:'Hurls fire. Ignites what it hits.'},
{n:'Frostbolt',d:'Freezes the target.'},
{n:'Arc',d:'Lightning that jumps between up to three creatures, or through water.'},
{n:'Languor',d:'Slows the target for a long while.'},
{n:'Blink',d:'You teleport to the end of the bolt.'},
{n:'Polymorph',d:'Turns the target into something else entirely. Gamble.'},
{n:'Binding',d:'The target fights for you for 40 turns. Bosses resist.'},
{n:'Excavation',d:'Digs through up to six tiles of rock.'},
{n:'Exchange',d:'You and the target swap places.'},
{n:'Doom',d:'The target takes triple damage for 12 turns.'}
];
const RING=[
{n:'Regeneration',d:'Heals you over time. Negative: drains you.'},
{n:'Leech',d:'Hits heal you. Negative: hits cost you.'},
{n:'Tempo',d:'You act faster. Negative: slower.'},
{n:'Barbs',d:'Melee attackers take extra damage. Negative: none, but you hit softer.'},
{n:'Greed',d:'Floors hold more items. Negative: fewer.'},
{n:'Warding',d:'Reduces fire damage. Negative: increases it.'},
{n:'Clarity',d:'Sight radius +1 per point. Negative: shrinks it.'},
{n:'Fortune',d:'10% per point to strike for double. Negative: to fumble.'},
{n:'Hollow',d:'Hunger slows 12% per point. Negative: speeds up.'},
{n:'Hush',d:'Monsters wake from farther less often. Negative: they hear you from afar.'}
];
Object.assign(MON,{
thief:{g:'t',n:'Pilferer',hp:12,d:[1,3],spd:120,col:'#d6a8a0',min:4,w:5,steal:1,def:0,note:'Steals an item and runs. Kill it to get the item back.'},
troll:{g:'T',n:'Cave troll',hp:52,d:[5,9],spd:90,col:'#7aa56a',min:7,w:5,regen:3,def:2,note:'Regenerates quickly. Fire and acid stop it for a while.'},
spore:{g:'p',n:'Sporeling',hp:10,d:[0,0],spd:100,col:'#c4e070',min:6,w:6,ai:'spore',still:1,def:0,note:'Does not move. Poisons everything near it.'},
necro:{g:'n',n:'Grave-caller',hp:22,d:[3,6],spd:100,col:'#9aa0c8',min:9,w:5,ai:'necro',def:1,note:'Raises bone-thralls every few turns. Hunt it first.'},
thrall:{g:'k',n:'Bone-thrall',hp:7,d:[2,4],spd:100,col:'#cfcfc0',min:99,w:0,def:0,note:'Raised by a Grave-caller.'},
drake:{g:'D',n:'Ember drake',hp:46,d:[5,9],spd:100,col:'#ff6a3d',min:11,w:4,ai:'breath',imm:['fire'],def:2,note:'Breathes fire down a line. Immune to flame.'},
gazer:{g:'e',n:'Gazer',hp:18,d:[2,4],spd:100,col:'#f0e070',min:8,w:5,ai:'gaze',def:0,note:'Its stare confuses you from a distance.'},
wolf:{g:'d',n:'Dusk wolf',hp:12,d:[3,6],spd:140,col:'#8a90a8',min:6,w:6,pack:[3,5],def:0,note:'Very fast. Hunts in packs.'},
lurker:{g:'u',n:'Lurker',hp:24,d:[6,10],spd:100,col:'#707a99',min:8,w:5,lurk:1,def:1,note:'Unseen until it is next to you. Its first strike hurts.'},
warlock:{g:'Y',n:'Warlock',hp:26,d:[4,7],spd:100,col:'#e07ac8',min:13,w:4,ai:'warlock',def:1,note:'Hurls fire and calls minions.'},
jugg:{g:'J',n:'Juggernaut',hp:120,d:[9,15],spd:55,col:'#b0a090',min:15,w:3,def:5,note:'Slow, gigantic, and very hard to stop.'},
pyrelord:{g:'Ψ',n:'Pyre Lord',hp:170,d:[7,12],spd:100,col:'#ff8a3d',min:99,w:0,boss:1,ai:'breath',imm:['fire'],def:4,note:'Burns everything it sees. Immune to flame.'},
wyrm:{g:'Ξ',n:'Frost Wyrm',hp:200,d:[8,13],spd:100,col:'#8fe0f0',min:99,w:0,boss:1,imm:['ice'],hitfreeze:1,def:4,note:'Its bite freezes. Immune to cold.'}
});
const ELEM=['fire','ice','shock','poison','sonic'];
const ELEMN={fire:'flame',ice:'cold',shock:'lightning',poison:'poison',sonic:'sound'};
const BIOMES=[
{n:'Moss Warrens',col:'#1f3a26',g:14,wt:1,oil:0,ice:0,fog:0,bias:['rat','slime','mimic','spore','thief']},
{n:'Drowned Vaults',col:'#16324c',g:0,wt:12,oil:0,ice:0,fog:0,bias:['leech','wraith','mite','troll','lurker']},
{n:'Cinder Foundry',col:'#3a2418',g:2,wt:0,oil:8,ice:0,fog:0,bias:['wisp','bomber','golem','drake','warlock']},
{n:'Frost Galleries',col:'#1d3a46',g:0,wt:1,oil:0,ice:1,fog:0,bias:['mite','wolf','golem','jugg','archer']},
{n:'Spore Deep',col:'#2f3a18',g:8,wt:2,oil:0,ice:0,fog:6,bias:['spore','slime','gazer','necro','leech']},
{n:'Hollow Spire',col:'#241c34',g:0,wt:0,oil:0,ice:0,fog:0,dark:1,bias:['wraith','lurker','gazer','necro','shaman']}
];
const GODS=['Ilu','Vesh','Marrow'];
const SIGILS=['▲','◆','●'];
const FOUNT=['Mending','Venom','Insight','Summoning','Tempering','Rushing'];
const ITYPES=['pot','scr','wand','ring','food','wpn','arm'];
const ITYPEN={pot:'potions',scr:'scrolls',wand:'wands',ring:'rings',food:'food',wpn:'weapons',arm:'armor'};
PERKS.push(
{id:'ringer',n:'Ringbearer',max:2,d:'+1 ring slot per rank.'},
{id:'wright',n:'Wandwright',max:3,d:'Wands gain +1 charge per rank when found, and recharge 1 on each new floor at rank 3.'},
{id:'duel',n:'Duelist',max:3,d:'The first strike on a sleeping or fleeing enemy deals +50% per rank.'},
{id:'ward',n:'Sigil Sense',max:1,d:'Altars show their favored and hated offerings. Fountains show their effect.'},
{id:'keeper',n:'Beastkeeper',max:3,d:'Allies last 50% longer per rank and hit 25% harder.'},
{id:'sage',n:'Sage',max:1,d:'Weaknesses and resistances of monsters you see are revealed.'}
);
KITS.push(
{id:'artificer',n:'Artificer',cost:-1,deed:'wands',d:'A random wand and Wandwright I.',wpn:['dagger',0],arm:[0,0],perks:{wright:1},wand:1},
{id:'oracle',n:'Oracle',cost:-1,deed:'identify',d:'Sage and Sigil Sense. Frail.',wpn:['dagger',0],arm:[0,0],perks:{sage:1,ward:1},mhp:-6},
{id:'warden2',n:'Warden-sworn',cost:-1,deed:'wardens',d:'Plate armor, mace, Thorns II. Slow to start.',wpn:['mace',0],arm:[3,0],perks:{thorn:2},mhp:5},
{id:'beast',n:'Beast Caller',cost:-1,deed:'allies',d:'Beastkeeper I and a scroll of Legion.',wpn:['spear',0],arm:[1,0],perks:{keeper:1},legion:1}
);

// ---------- more creatures ----------
Object.assign(MON,{
bat:{g:'v',n:'Cave bat',hp:6,d:[1,3],spd:140,col:'#8a7aa8',min:2,w:6,drain:1,def:0,note:'Very fast. Drinks blood.'},
viper:{g:'S',n:'Pit viper',hp:9,d:[2,3],spd:110,col:'#7fbf4a',min:3,w:6,hitpoison:1,imm:['poison'],def:0,note:'Its bite poisons. Immune to poison.'},
hound:{g:'c',n:'Cinder hound',hp:14,d:[3,5],spd:120,col:'#ff6a3a',min:5,w:5,pack:[2,3],imm:['fire'],hitburn:1,def:0,note:'Hunts in pairs. Its bite sets you alight.'},
brute:{g:'B',n:'Stone brute',hp:30,d:[4,7],spd:80,col:'#9a8a78',min:5,w:5,weak:{sonic:1.5},def:2,note:'Slow, heavy, armored. Sound cracks its hide.'},
rimesprite:{g:'f',n:'Rime sprite',hp:10,d:[2,4],spd:110,col:'#cfeaff',min:6,w:5,ai:'range',rng:5,imm:['ice'],def:0,note:'Flings shards of ice from afar.'},
ghoul:{g:'g',n:'Grave ghoul',hp:24,d:[3,6],spd:100,col:'#9fb08a',min:7,w:5,regen:2,imm:['poison'],def:0,note:'Regenerates unless burning or poisoned.'},
sentinel:{g:'Y',n:'Glass sentinel',hp:18,d:[2,5],spd:100,col:'#bfe8ee',min:8,w:4,ai:'range',rng:7,def:2,weak:{sonic:2},note:'A patient sniper. Shatters to sound.'}
});
for(const [i,k] of [[0,['bat','viper']],[2,['hound']],[3,['rimesprite']],[4,['ghoul']],[5,['sentinel','ghoul']],[1,['viper']]])BIOMES[i].bias.push(...k);

// ---------- deeds ----------
const DEEDS=[
{id:'d5',n:'Five Fathoms',h:'Reach depth 5.',f:s=>G.depth>=5,r:20},
{id:'d10',n:'Ten Fathoms',h:'Reach depth 10.',f:s=>G.depth>=10,r:60},
{id:'d15',n:'Fifteen Fathoms',h:'Reach depth 15.',f:s=>G.depth>=15,r:150},
{id:'d20',n:'Twenty Fathoms',h:'Reach depth 20.',f:s=>G.depth>=20,r:300},
{id:'d30',n:'Thirty Fathoms',h:'Reach depth 30.',f:s=>G.depth>=30,r:800},
{id:'wardens',n:'Warden-slayer',h:'Kill a floor boss.',f:s=>s.boss>=1,r:80},
{id:'wardens3',n:'Three Crowns',h:'Kill three floor bosses in one run.',f:s=>s.boss>=3,r:250},
{id:'burn',n:'Pyromaniac',h:'Kill 6 creatures with fire in one run.',f:s=>s.fire>=6,r:50},
{id:'shock',n:'Conductor',h:'Kill 4 creatures with lightning in one run.',f:s=>s.shock>=4,r:50},
{id:'frozen',n:'Shatterer',h:'Kill 5 frozen creatures in one run.',f:s=>s.shatter>=5,r:50},
{id:'drown',n:'Wet Work',h:'Kill 3 creatures standing in water with lightning.',f:s=>s.wetshock>=3,r:80},
{id:'mix5',n:'Apprentice Brewer',h:'Mix potions 5 times in one run.',f:s=>s.mix>=5,r:40},
{id:'mixall',n:'Hundred Vials',h:'Learn 25 recipes in total.',f:s=>Object.keys(SAVE.recipes).length>=25,r:200},
{id:'phoenix',n:'Reborn',h:'Be saved by a phoenix.',f:s=>s.reborn>=1,r:70},
{id:'identify',n:'Naturalist',h:'Identify 12 potions in total.',f:s=>Object.keys(SAVE.known).length>=12,r:90},
{id:'scrolls',n:'Linguist',h:'Identify 10 scrolls in total.',f:s=>Object.keys(SAVE.scrKnown).length>=10,r:90},
{id:'wands',n:'Wandmaker',h:'Identify 6 kinds of wand in total.',f:s=>Object.keys(SAVE.wandKnown||{}).length>=6,r:100},
{id:'rings',n:'Jeweler',h:'Identify 6 kinds of ring in total.',f:s=>Object.keys(SAVE.ringKnown||{}).length>=6,r:100},
{id:'allies',n:'Pied Piper',h:'Have 3 allies at once.',f:s=>s.allyMax>=3,r:60},
{id:'altar',n:'Devout',h:'Please an altar.',f:s=>s.altarOK>=1,r:60},
{id:'altar2',n:'Blasphemer',h:'Anger an altar.',f:s=>s.altarBad>=1,r:30},
{id:'fount',n:'Deep Drinker',h:'Drink from 5 fountains in one run.',f:s=>s.fount>=5,r:40},
{id:'fast',n:'Plummet',h:'Descend 3 floors in under 200 turns.',f:s=>s.fastDive>=3,r:80},
{id:'pacifist',n:'Quiet Feet',h:'Reach depth 4 without killing anything.',f:s=>G.depth>=4&&G.kills===0,r:120},
{id:'naked',n:'Unarmored',h:'Reach depth 6 wearing the starting rags.',f:s=>G.depth>=6&&G.p.arm.lv===0&&G.kit!=='brawler'&&G.kit!=='pyre'&&G.kit!=='alchemist'&&G.kit!=='scholar'&&G.kit!=='ghost',r:100},
{id:'thief',n:'Stolen Back',h:'Recover a stolen item.',f:s=>s.recover>=1,r:50},
{id:'curse',n:'Cursed',h:'Wear a cursed ring.',f:s=>s.cursed>=1,r:30},
{id:'weak',n:'Student of Flaws',h:'Discover 6 monster weaknesses in total.',f:s=>Object.keys(SAVE.affKnown||{}).filter(k=>SAVE.affKnown[k].weak).length>=6,r:120},
{id:'biomes',n:'Cartographer of Depths',h:'Visit all six biomes in one save.',f:s=>Object.keys(SAVE.biomeSeen||{}).length>=6,r:200},
{id:'fullpack',n:'Hoarder',h:'Carry 20 items at once.',f:s=>G.inv.length>=20,r:30}
];
DEEDS.push(
{id:'k50',n:'Hunter',h:'Kill 50 creatures in one run.',f:s=>G.kills>=50,r:60},
{id:'k150',n:'Reaper',h:'Kill 150 creatures in one run.',f:s=>G.kills>=150,r:150},
{id:'d25',n:'Twenty-five Fathoms',h:'Reach depth 25.',f:s=>G.depth>=25,r:500},
{id:'dash',n:'Dash',h:'Reach depth 8 in under 1500 turns.',f:s=>G.depth>=8&&G.tick<1500,r:150},
{id:'patient',n:'Patient Delver',h:'Reach depth 8 after more than 3000 turns.',f:s=>G.depth>=8&&G.tick>3000,r:60},
{id:'notes10',n:"Alchemist's Notebook",h:'Learn 10 recipes in total.',f:s=>Object.keys(SAVE.recipes).length>=10,r:80},
{id:'runs10',n:'Veteran',h:'Begin 10 runs.',f:s=>SAVE.runs>=10,r:50},
{id:'runs50',n:'Lifer',h:'Begin 50 runs.',f:s=>SAVE.runs>=50,r:200},
{id:'allpot',n:'Master Taster',h:'Identify every kind of potion.',f:s=>Object.keys(SAVE.known).length>=POT.length,r:300},
{id:'allscr',n:'Polyglot',h:'Identify every kind of scroll.',f:s=>Object.keys(SAVE.scrKnown).length>=SCR.length,r:300},
{id:'bestiary',n:'Naturalist of Teeth',h:'Meet 15 kinds of creature in total.',f:s=>Object.keys(SAVE.seen||{}).length>=15,r:100},
{id:'tough',n:'Ironhide',h:'Reach depth 6 with 60 or more health.',f:s=>G.depth>=6&&G.p.mhp>=60,r:70}
);
KITS.push(
{id:'duelist',n:'Duelist',cost:150,d:'Dagger. Duelist II and Light Feet.',wpn:['dagger',0],arm:[1,0],perks:{duel:2,step:1},mhp:-4},
{id:'mender',n:'Mender',cost:160,d:'Mace. Lifedrinker and Second Wind.',wpn:['mace',0],arm:[1,0],perks:{drink:1,wind:1},mhp:5},
{id:'stormer',n:'Stormcaller',cost:140,d:'Sword. Hits arc to a neighbor.',wpn:['sword',0],arm:[0,0],perks:{storm:1}},
{id:'reaper',n:'Reaper',cost:-1,deed:'k150',d:'Axe, Executioner and Lifedrinker. Frail.',wpn:['axe',0],arm:[0,0],perks:{exec:1,drink:1},mhp:-6}
);
