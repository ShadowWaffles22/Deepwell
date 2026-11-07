'use strict';
const W=44,H=30,MAXPACK=22;
const DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hash(){let h=2166136261;for(let i=0;i<arguments.length;i++){h^=arguments[i]|0;h=Math.imul(h,16777619);h^=h>>>13}return h>>>0}
let rng=mulberry(1);
const rnd=()=>rng();
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
const pick=a=>a[Math.floor(rnd()*a.length)];
const chance=p=>rnd()<p;
function wpick(items,wf){let t=0;for(const i of items)t+=wf(i);let r=rnd()*t;for(const i of items){r-=wf(i);if(r<=0)return i}return items[items.length-1]}

const COLORS=[['murky teal','#3f8f8a'],['rust red','#b5522e'],['ochre','#c79a2e'],['violet','#8a5fd0'],['pale green','#9fd48b'],['scarlet','#d4313f'],['ash grey','#a7acb0'],['indigo','#5560d8'],['amber','#e0a030'],['rose','#e58aa6'],['lime','#b5d936'],['slate blue','#6a86a8'],['cobalt','#2f6fe0'],['saffron','#f0c040'],['bone white','#e8e0cc'],['jade','#2fb584'],['plum','#a04a8a'],['umber','#8a6040'],['coal black','#5a5a66'],['coral','#f07a5a']];

const POT=[
{n:'Mend',d:'Restores health.',t:'Heals everything it splashes, foes included.',w:12},
{n:'Haste',d:'You act twice as fast for a while.',t:'Hastens whatever it splashes.',w:5},
{n:'Embers',d:'Flames burst around you. You are fireproof for a short time.',t:'Sets the area ablaze.',w:8},
{n:'Rime',d:'A freezing aura locks adjacent foes in ice. You are slowed.',t:'Freezes creatures and water in the area.',w:7},
{n:'Slick',d:'Coats you in oil. Very flammable.',t:'Spreads oil that burns hot and makes creatures flammable.',w:6},
{n:'Static',d:'Charges you. Your next melee hits arc lightning.',t:'A lightning strike that runs along connected water.',w:6},
{n:'Murk',d:'You vanish into shadow. Foes lose track of you.',t:'Raises a cloud that blocks sight.',w:5},
{n:'Might',d:'Your blows hit much harder for a while.',t:'Empowers whatever it splashes.',w:5},
{n:'Farsight',d:'Reveals the whole floor and every creature on it.',t:'Reveals the surrounding area.',w:4},
{n:'Bane',d:'Poisons you.',t:'Poisons creatures in the area.',w:7},
{n:'Levity',d:'Blinks you to a distant spot.',t:'Teleports creatures in the area away.',w:5},
{n:'Basalt',d:'Skin turns to stone: armor up, speed down.',t:'Petrifies creatures in the area for a while.',w:5},
{n:'Phoenix',d:'Grants one revival when you would die.',t:'A huge fiery detonation.',w:0,rare:1},
{n:'Void',d:'Tears the walls open around you.',t:'Tears the walls open at the target.',w:0,rare:1},
{n:'Echo',d:'Your next potion or scroll triggers twice.',t:'A shockwave that damages and stuns.',w:0,rare:1},
{n:'Chrono',d:'Time runs fast around you for a short burst.',t:'Stops creatures in the area in their tracks.',w:0,rare:1},
{n:'Tide',d:'Water floods the area around you.',t:'Floods the area and washes oil away.',w:0,rare:1},
{n:'Caustic',d:'Burns and poisons you.',t:'Burns and poisons creatures in the area.',w:0,rare:1}
];
const SCR=[
{n:'Warp',d:'Teleports you to a random place.',w:8},
{n:'Chart',d:'Maps the floor.',w:9},
{n:'Dread',d:'Creatures in sight flee in terror.',w:6},
{n:'Temper',d:'Your weapon gains +1.',w:5},
{n:'Bulwark',d:'Your armor gains +1.',w:5},
{n:'Summons',d:'Calls creatures to you. Dangerous.',w:5},
{n:'Plumb',d:'Drops you beside the way down.',w:5},
{n:'Thunderclap',d:'Damages and stuns every creature in sight.',w:6}
];
const WPN={
dagger:{n:'Dagger',lo:2,hi:4,d:'Quick: 40% of attacks take no time.'},
sword:{n:'Sword',lo:4,hi:7,d:'Balanced.'},
axe:{n:'Axe',lo:4,hi:7,d:'Strikes every adjacent enemy.'},
spear:{n:'Spear',lo:3,hi:6,d:'Reaches two tiles in a straight line.'},
mace:{n:'Mace',lo:6,hi:10,d:'Slow swing. 30% to stun.'}
};
const ARMN=['Rags','Leather','Chain','Plate'];
const PERKS=[
{id:'vigor',n:'Vigor',max:5,d:'+10 max health and heal 10.'},
{id:'keen',n:'Keen Edge',max:5,d:'+2 weapon damage.'},
{id:'plating',n:'Plating',max:4,d:'+1 armor.'},
{id:'ember',n:'Ember Heart',max:3,d:'Immune to fire. Your fire hurts 50% more. Hits ignite foes (25% per rank).'},
{id:'frost',n:'Frostbite',max:3,d:'Hits freeze foes for 2 turns (15% per rank).'},
{id:'storm',n:'Stormcaller',max:3,d:'Hits arc to a neighbor for 40% damage per rank. Doubled through water.'},
{id:'alch',n:'Alchemist',max:3,d:'Mixing yields a bonus potion (30% per rank).'},
{id:'bottler',n:'Bottler',max:3,d:'Splash radius +1 per rank.'},
{id:'scav',n:'Scavenger',max:3,d:'More loot each floor. Loot shows on the map.'},
{id:'cart',n:'Cartographer',max:2,d:'Rank 1 shows nearby rooms on arrival. Rank 2 maps the floor.'},
{id:'drink',n:'Lifedrinker',max:4,d:'Heal 1 per rank on each kill.'},
{id:'wind',n:'Second Wind',max:3,d:'Once per floor under 30% health, heal 30% (+10% per extra rank).'},
{id:'step',n:'Light Feet',max:3,d:'20% per rank that a step takes no time.'},
{id:'glass',n:'Glass Cannon',max:1,d:'+50% damage dealt, -30% max health.'},
{id:'thorn',n:'Thorns',max:4,d:'Melee attackers take 2 damage per rank.'},
{id:'nose',n:'Nose for Brews',max:3,d:'Picking up a potion identifies it for good (25% per rank).'},
{id:'camel',n:'Lean Belly',max:3,d:'Hunger 25% slower per rank.'},
{id:'exec',n:'Executioner',max:3,d:'Foes under 12% health (per rank) die to any hit.'}
];
const MON={
rat:{g:'r',n:'Gnaw-rat',hp:5,d:[1,2],spd:120,col:'#c4a47c',min:1,w:12,pack:[2,3],def:0,note:'Fast and always in groups.'},
slime:{g:'s',n:'Seep',hp:12,d:[1,3],spd:80,col:'#6fcf8f',min:1,w:9,split:1,def:0,note:'Splits when wounded. Fire clears it.'},
archer:{g:'a',n:'Bone archer',hp:9,d:[1,4],spd:100,col:'#ddd6bc',min:3,w:7,ai:'range',rng:6,def:0,note:'Shoots from range. Keeps its distance.'},
leech:{g:'l',n:'Blood leech',hp:10,d:[2,3],spd:100,col:'#c0505a',min:2,w:6,drain:1,def:0,note:'Heals itself by biting.'},
wisp:{g:'w',n:'Cinder wisp',hp:8,d:[2,4],spd:120,col:'#ff8a3d',min:3,w:7,imm:['fire'],trail:1,hitburn:1,def:0,note:'Immune to fire. Lights grass as it drifts.'},
bomber:{g:'b',n:'Bladder',hp:7,d:[0,0],spd:90,col:'#e6c84a',min:3,w:7,ai:'bomb',def:0,note:'Bursts in flame when it reaches you or dies.'},
mite:{g:'m',n:'Frost mite',hp:8,d:[2,4],spd:120,col:'#8fe0f0',min:4,w:6,imm:['ice'],hitfreeze:1,def:0,note:'Its bite can freeze you solid.'},
shaman:{g:'h',n:'Murk shaman',hp:11,d:[3,5],spd:100,col:'#b394e8',min:4,w:6,ai:'caster',def:0,note:'Heals and shields allies. Kill it first.'},
mimic:{g:'M',n:'Mimic',hp:20,d:[4,8],spd:100,col:'#d0a050',min:4,w:4,mimic:1,def:1,note:'Poses as loot until you are close.'},
golem:{g:'G',n:'Slag golem',hp:40,d:[5,9],spd:60,col:'#a3adb4',min:5,w:6,weak:{shock:1.5},def:3,note:'Slow and tough. Weak to lightning.'},
wraith:{g:'W',n:'Wall wraith',hp:16,d:[4,7],spd:110,col:'#86bdf0',min:6,w:6,phase:1,def:0,note:'Drifts through solid stone.'},
warden:{g:'Ω',n:'Warden',hp:110,d:[6,10],spd:100,col:'#f0d070',min:99,w:0,boss:1,def:3,note:'Guards the way down. Calls reinforcements.'}
};
const AFX={volatile:'Volatile',swift:'Swift',armored:'Armored',vampiric:'Vampiric',chilling:'Chilling',blazing:'Blazing',regen:'Mending'};
const LAWS={
flood:{n:'Flooded',d:'Water pools everywhere. Lightning runs through it.'},
tinder:{n:'Tinderdry',d:'Grass covers the floor. Fire spreads fast.'},
dark:{n:'Blackout',d:'You can only see a few steps.'},
restless:{n:'Restless',d:'Everything is awake, and more keeps arriving.'},
slick:{n:'Glazed',d:'Ice covers the floor. You slide.'},
oil:{n:'Oilworks',d:'Oil pools lie everywhere.'},
bounty:{n:'Bounty',d:'Extra loot and extra monsters.'}
};
const KITS=[
{id:'wanderer',n:'Wanderer',cost:0,d:'Sword, leather armor.',wpn:['sword',0],arm:[1,0]},
{id:'brawler',n:'Brawler',cost:40,d:'Axe and 10 extra health.',wpn:['axe',0],arm:[0,0],mhp:10},
{id:'lancer',n:'Lancer',cost:60,d:'Spear and chain armor.',wpn:['spear',0],arm:[2,0]},
{id:'pyre',n:'Pyromancer',cost:90,d:'Fireproof. Two potions of one unknown kind.',wpn:['dagger',0],arm:[0,0],perks:{ember:1},pots:2},
{id:'alchemist',n:'Alchemist',cost:120,d:'Alchemist perk and four unknown potions.',wpn:['dagger',0],arm:[0,0],perks:{alch:1},pots:4},
{id:'scholar',n:'Scholar',cost:120,d:'Nose for Brews and three unknown scrolls.',wpn:['dagger',0],arm:[0,0],perks:{nose:1},scrs:3},
{id:'ghost',n:'Ghost',cost:200,d:'Frail. Light Feet II and Cartographer.',wpn:['dagger',0],arm:[0,0],perks:{step:2,cart:1},mhp:-8}
];
