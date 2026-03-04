import { useState, useEffect } from "react";
import { supabase } from "./src/supabase.js";

// ═══════════════════════════════════════════════════════════
//  DATA LAYER — 2025-26 SEASON (InterMat Week 17 / Feb 2026)
// ═══════════════════════════════════════════════════════════
const WC = [125,133,141,149,157,165,174,184,197,285];
const SOURCES = ["InterMat","FloWrestling","Coaches Poll","WrestleStat","TrackWrestling"];
const TEAM_SOURCES = ["NWCA Coaches","InterMat","FloWrestling","WrestleStat","USA Today"];

const TIERS = [
  { id:"new", label:"New User", min:0, minAcc:0, color:"#5a6478", icon:"👤", desc:"Welcome to the mat" },
  { id:"active", label:"Active Predictor", min:10, minAcc:0, color:"#3b82f6", icon:"📊", desc:"10+ predictions" },
  { id:"rising", label:"Rising Ranker", min:30, minAcc:55, color:"#8b5cf6", icon:"📈", desc:"30+ picks, 55%+" },
  { id:"certified", label:"Certified Ranker", min:30, minAcc:65, color:"#f59e0b", icon:"✅", desc:"Ballots count in The Consensus" },
  { id:"elite", label:"Elite Ranker", min:100, minAcc:75, color:"#ef4444", icon:"👑", desc:"Gold tier. Legend status." },
];
const getTier=(t,a)=>{let r=TIERS[0];for(const x of TIERS)if(t>=x.min&&a>=x.minAcc)r=x;return r};

// Real 2025-26 rankings data (InterMat Week 17, Feb 24 2026)
const W = {
  125:[
    {n:"Vincent Robinson",t:"NC State",r:"16-1"},
    {n:"Luke Lilledahl",t:"Penn State",r:"18-0"},
    {n:"Nic Bouzakis",t:"Ohio State",r:"19-0"},
    {n:"Eddie Ventresca",t:"Virginia Tech",r:"15-2"},
    {n:"Sheldon Seymour",t:"Lehigh",r:"17-0"},
    {n:"Dean Peterson",t:"Iowa",r:"14-3"},
    {n:"Troy Spratley",t:"Oklahoma State",r:"13-4"},
    {n:"Jett Strickenberger",t:"West Virginia",r:"12-3"},
    {n:"Jore Volk",t:"Minnesota",r:"11-5"},
    {n:"Maximo Renteria",t:"Oregon State",r:"13-4"},
  ],
  133:[
    {n:"Lucas Byrd",t:"Illinois",r:"17-1"},
    {n:"Ben Davino",t:"Ohio State",r:"16-2"},
    {n:"Evan Frost",t:"Iowa State",r:"14-2"},
    {n:"Drake Ayala",t:"Iowa",r:"15-3"},
    {n:"Marcus Blaze",t:"Penn State",r:"13-3"},
    {n:"Kyler Larkin",t:"Arizona State",r:"12-3"},
    {n:"Tyler Knox",t:"Stanford",r:"11-2"},
    {n:"Jacob Van Dee",t:"Nebraska",r:"12-4"},
    {n:"Dominick Serrano",t:"Northern Colorado",r:"14-3"},
    {n:"Evan Mougalian",t:"Penn",r:"13-2"},
  ],
  141:[
    {n:"Jesse Mendez",t:"Ohio State",r:"19-0"},
    {n:"Sergio Vega",t:"Oklahoma State",r:"16-2"},
    {n:"Brock Hardy",t:"Nebraska",r:"15-3"},
    {n:"Anthony Echemendia",t:"Iowa State",r:"14-2"},
    {n:"Joey Olivieri",t:"Rutgers",r:"14-0"},
    {n:"Vince Cornella",t:"Cornell",r:"12-0"},
    {n:"CJ Composto",t:"Penn",r:"11-3"},
    {n:"Ryan Jack",t:"NC State",r:"13-4"},
    {n:"Aaron Nagao",t:"Penn State",r:"12-5"},
    {n:"Cory Land",t:"Northern Iowa",r:"10-4"},
  ],
  149:[
    {n:"Shayne Van Ness",t:"Penn State",r:"17-0"},
    {n:"Meyer Shapiro",t:"Cornell",r:"9-0"},
    {n:"Kaleb Larkin",t:"Arizona State",r:"13-3"},
    {n:"Ethan Stiles",t:"Ohio State",r:"12-3"},
    {n:"Koy Buesgens",t:"NC State",r:"14-3"},
    {n:"Antrell Taylor",t:"Nebraska",r:"13-4"},
    {n:"Jacob Frost",t:"Iowa State",r:"11-3"},
    {n:"Ryder Block",t:"Iowa",r:"12-5"},
    {n:"Jaxon Joy",t:"Cornell",r:"10-4"},
    {n:"Cale Riddle",t:"Illinois",r:"11-5"},
  ],
  157:[
    {n:"Ty Watters",t:"West Virginia",r:"17-1"},
    {n:"Vince Zerban",t:"Iowa State",r:"16-2"},
    {n:"PJ Duke",t:"Penn State",r:"15-1"},
    {n:"Landon Robideau",t:"Oklahoma State",r:"14-3"},
    {n:"Antrell Taylor",t:"Nebraska",r:"13-4"},
    {n:"Brandon Cannon",t:"Ohio State",r:"11-0"},
    {n:"Meyer Shapiro",t:"Cornell",r:"9-0"},
    {n:"Kannon Webster",t:"Illinois",r:"12-4"},
    {n:"Daniel Cardenas",t:"Stanford",r:"11-3"},
    {n:"Logan Rozynski",t:"Lehigh",r:"10-4"},
  ],
  165:[
    {n:"Mitchell Mesenbrink",t:"Penn State",r:"20-0"},
    {n:"Mikey Caliendo",t:"Iowa",r:"16-2"},
    {n:"Joey Blaze",t:"Purdue",r:"18-0"},
    {n:"Ladarion Lockett",t:"Oklahoma State",r:"15-2"},
    {n:"Matt Bianchi",t:"Arkansas-Little Rock",r:"17-0"},
    {n:"Ryder Downey",t:"Northern Iowa",r:"13-3"},
    {n:"LJ Araujo",t:"Nebraska",r:"12-4"},
    {n:"Braeden Scoles",t:"Illinois",r:"11-5"},
    {n:"Max Brignola",t:"Lehigh",r:"10-4"},
    {n:"Will Denny",t:"NC State",r:"15-4"},
  ],
  174:[
    {n:"Levi Haines",t:"Penn State",r:"19-0"},
    {n:"Simon Ruiz",t:"Cornell",r:"16-0"},
    {n:"Patrick Kennedy",t:"Iowa",r:"15-2"},
    {n:"Christopher Minto",t:"Nebraska",r:"14-3"},
    {n:"Carson Kharchla",t:"Ohio State",r:"13-3"},
    {n:"Matthew Singleton",t:"NC State",r:"14-4"},
    {n:"Alex Facundo",t:"Oklahoma State",r:"12-4"},
    {n:"Carter Schubert",t:"Oklahoma",r:"11-4"},
    {n:"Cam Steed",t:"Missouri",r:"9-5"},
    {n:"Beau Mantanona",t:"Michigan",r:"12-5"},
  ],
  184:[
    {n:"Rocco Welsh",t:"Penn State",r:"18-0"},
    {n:"Angelo Ferrari",t:"Iowa",r:"14-2"},
    {n:"Aeoden Sinclair",t:"Missouri",r:"15-2"},
    {n:"Max McEnelly",t:"Minnesota",r:"14-2"},
    {n:"Jaxon Smith",t:"Maryland",r:"16-0"},
    {n:"Dylan Fishback",t:"Ohio State",r:"13-4"},
    {n:"James Conway",t:"Franklin & Marshall",r:"29-1"},
    {n:"Brock Mantanona",t:"Michigan",r:"12-5"},
    {n:"Silas Allred",t:"Nebraska",r:"13-4"},
    {n:"Zack Ryder",t:"Oklahoma State",r:"11-5"},
  ],
  197:[
    {n:"Josh Barr",t:"Penn State",r:"17-0"},
    {n:"Rocky Elam",t:"Iowa State",r:"16-0"},
    {n:"Joey Novak",t:"Wyoming",r:"14-2"},
    {n:"Stephen Little",t:"Arkansas-Little Rock",r:"13-3"},
    {n:"Justin Rademacher",t:"Oregon State",r:"12-4"},
    {n:"Bennett Berge",t:"South Dakota State",r:"14-3"},
    {n:"Cody Merrill",t:"Oklahoma State",r:"11-4"},
    {n:"Angelo Posada",t:"Stanford",r:"14-4"},
    {n:"Mac Stout",t:"Pittsburgh",r:"12-5"},
    {n:"Camden McDanel",t:"Nebraska",r:"10-4"},
  ],
  285:[
    {n:"Yonger Bastida",t:"Iowa State",r:"18-0"},
    {n:"Isaac Trumble",t:"NC State",r:"14-0"},
    {n:"Nick Felman",t:"Ohio State",r:"15-2"},
    {n:"AJ Ferrari",t:"Nebraska",r:"12-3"},
    {n:"Taye Ghadiali",t:"Michigan",r:"13-3"},
    {n:"Nathan Taylor",t:"Lehigh",r:"12-4"},
    {n:"Konner Doucet",t:"Oklahoma State",r:"11-4"},
    {n:"Ben Kueter",t:"Iowa",r:"10-3"},
    {n:"Braxton Amos",t:"Wisconsin",r:"11-5"},
    {n:"Koy Hopke",t:"Minnesota",r:"17-7"},
  ],
};

// Generate source rankings with slight variance from InterMat baseline
const RK = {};
WC.forEach(wc => {
  RK[wc] = {};
  SOURCES.forEach(src => {
    const a = W[wc].map((w, i) => ({ ...w, rank: i + 1 }));
    // Each source has slight variation from baseline order
    for (let i = a.length - 1; i > 0; i--) {
      const v = Math.random() > 0.6 ? Math.floor(Math.random() * 3) : 0;
      if (v > 0 && i - v >= 0) {
        const j = i - v;
        [a[i].rank, a[j].rank] = [a[j].rank, a[i].rank];
      }
    }
    RK[wc][src] = a.sort((x, y) => x.rank - y.rank);
  });
});

// Team data — 2025-26 season
const TEAM_DATA = [
  {team:"Penn State",pts:152.5},{team:"Ohio State",pts:122},{team:"Iowa State",pts:108},{team:"Oklahoma State",pts:102},{team:"Iowa",pts:96},
  {team:"Cornell",pts:88},{team:"NC State",pts:84},{team:"Nebraska",pts:78},{team:"Michigan",pts:72},{team:"Penn State",pts:0},
  {team:"Minnesota",pts:64},{team:"Purdue",pts:58},{team:"Missouri",pts:54},{team:"West Virginia",pts:50},{team:"Virginia Tech",pts:46},
  {team:"Lehigh",pts:42},{team:"Illinois",pts:40},{team:"Arizona State",pts:38},{team:"Stanford",pts:35},{team:"Northern Iowa",pts:32},
].filter(t => t.pts > 0);

const TEAM_RK = {};
TEAM_SOURCES.forEach(src => {
  const a = [...TEAM_DATA].map((t, i) => ({ ...t, rank: i + 1 }));
  for (let i = a.length - 1; i > 0; i--) {
    const v = Math.random() > 0.5 ? Math.floor(Math.random() * 4) : 0;
    if (v > 0 && i - v >= 0) { const j = i - v; [a[i].rank, a[j].rank] = [a[j].rank, a[i].rank]; }
  }
  TEAM_RK[src] = a.sort((x, y) => x.rank - y.rank);
});

const TEAM_CONSENSUS = TEAM_DATA.map(t => {
  const avg = TEAM_SOURCES.reduce((acc, src) => {
    const r = TEAM_RK[src].find(x => x.team === t.team);
    return acc + (r ? r.rank : 20);
  }, 0) / TEAM_SOURCES.length;
  return { ...t, consensusScore: avg };
}).sort((a, b) => a.consensusScore - b.consensusScore).map((t, i) => ({ ...t, consensusRank: i + 1 }));

// Matches — real 2025-26 matchups
const MATCHES = [
  // Completed results
  {id:"r1",wt:165,date:"Feb 21",ev:"Penn State vs Ohio State",w1:{n:"Mitchell Mesenbrink",t:"Penn State",rk:1},w2:{n:"Dylan Fishback",t:"Ohio State",rk:6},done:true,result:{winner:"Mitchell Mesenbrink",method:"Dec, 8-7",upset:false}},
  {id:"r2",wt:184,date:"Feb 21",ev:"Penn State vs Ohio State",w1:{n:"Rocco Welsh",t:"Penn State",rk:1},w2:{n:"Dylan Fishback",t:"Ohio State",rk:6},done:true,result:{winner:"Rocco Welsh",method:"Dec, 8-7",upset:false}},
  {id:"r3",wt:165,date:"Feb 14",ev:"Iowa vs Oklahoma State",w1:{n:"Mikey Caliendo",t:"Iowa",rk:3},w2:{n:"Ladarion Lockett",t:"Oklahoma State",rk:2},done:true,result:{winner:"Mikey Caliendo",method:"Dec, 5-3",upset:true}},
  {id:"r4",wt:197,date:"Feb 14",ev:"Iowa State vs Oklahoma State",w1:{n:"Rocky Elam",t:"Iowa State",rk:2},w2:{n:"Cody Merrill",t:"Oklahoma State",rk:7},done:true,result:{winner:"Rocky Elam",method:"Major Dec, 14-3",upset:false}},
  {id:"r5",wt:141,date:"Feb 7",ev:"Ohio State vs Penn State",w1:{n:"Jesse Mendez",t:"Ohio State",rk:1},w2:{n:"Aaron Nagao",t:"Penn State",rk:9},done:true,result:{winner:"Jesse Mendez",method:"Tech Fall, 18-2",upset:false}},
  // Conference tournaments
  {id:"m1",wt:125,date:"Mar 8",ev:"Big Ten Championships — Final",w1:{n:"Luke Lilledahl",t:"Penn State",rk:2},w2:{n:"Nic Bouzakis",t:"Ohio State",rk:3},done:false},
  {id:"m2",wt:133,date:"Mar 8",ev:"Big Ten Championships — SF",w1:{n:"Lucas Byrd",t:"Illinois",rk:1},w2:{n:"Drake Ayala",t:"Iowa",rk:4},done:false},
  {id:"m3",wt:141,date:"Mar 8",ev:"Big Ten Championships — Final",w1:{n:"Jesse Mendez",t:"Ohio State",rk:1},w2:{n:"Brock Hardy",t:"Nebraska",rk:3},done:false},
  {id:"m4",wt:165,date:"Mar 8",ev:"Big Ten Championships — Final",w1:{n:"Mitchell Mesenbrink",t:"Penn State",rk:1},w2:{n:"Mikey Caliendo",t:"Iowa",rk:2},done:false},
  {id:"m5",wt:174,date:"Mar 8",ev:"Big Ten Championships — SF",w1:{n:"Levi Haines",t:"Penn State",rk:1},w2:{n:"Patrick Kennedy",t:"Iowa",rk:3},done:false},
  {id:"m6",wt:285,date:"Mar 8",ev:"Big 12 Championships — Final",w1:{n:"Yonger Bastida",t:"Iowa State",rk:1},w2:{n:"Konner Doucet",t:"Oklahoma State",rk:7},done:false},
  // NCAA Championship matchups (Mar 19-21, Cleveland)
  {id:"n1",wt:125,date:"Mar 20",ev:"NCAA QF",w1:{n:"Vincent Robinson",t:"NC State",rk:1},w2:{n:"Dean Peterson",t:"Iowa",rk:6},done:false,addedAt:new Date("2026-03-04").getTime()},
  {id:"n2",wt:125,date:"Mar 21",ev:"NCAA SF",w1:{n:"Vincent Robinson",t:"NC State",rk:1},w2:{n:"Nic Bouzakis",t:"Ohio State",rk:3},done:false,addedAt:new Date("2026-03-04").getTime()},
  {id:"n3",wt:141,date:"Mar 20",ev:"NCAA QF",w1:{n:"Jesse Mendez",t:"Ohio State",rk:1},w2:{n:"Joey Olivieri",t:"Rutgers",rk:5},done:false,addedAt:new Date("2026-03-04").getTime()},
  {id:"n4",wt:165,date:"Mar 21",ev:"NCAA Final",w1:{n:"Mitchell Mesenbrink",t:"Penn State",rk:1},w2:{n:"Joey Blaze",t:"Purdue",rk:3},done:false,addedAt:new Date("2026-03-04").getTime()},
  {id:"n5",wt:174,date:"Mar 21",ev:"NCAA SF",w1:{n:"Levi Haines",t:"Penn State",rk:1},w2:{n:"Simon Ruiz",t:"Cornell",rk:2},done:false,addedAt:new Date("2026-03-04").getTime()},
  {id:"n6",wt:184,date:"Mar 21",ev:"NCAA Final",w1:{n:"Rocco Welsh",t:"Penn State",rk:1},w2:{n:"Angelo Ferrari",t:"Iowa",rk:2},done:false,addedAt:new Date("2026-03-04").getTime()},
  {id:"n7",wt:197,date:"Mar 21",ev:"NCAA Final",w1:{n:"Josh Barr",t:"Penn State",rk:1},w2:{n:"Rocky Elam",t:"Iowa State",rk:2},done:false,addedAt:new Date("2026-03-04").getTime()},
  {id:"n8",wt:285,date:"Mar 21",ev:"NCAA SF",w1:{n:"Yonger Bastida",t:"Iowa State",rk:1},w2:{n:"Nick Felman",t:"Ohio State",rk:3},done:false,addedAt:new Date("2026-03-04").getTime()},
  {id:"n9",wt:133,date:"Mar 20",ev:"NCAA QF",w1:{n:"Lucas Byrd",t:"Illinois",rk:1},w2:{n:"Kyler Larkin",t:"Arizona State",rk:6},done:false,addedAt:new Date("2026-03-04").getTime()},
  {id:"n10",wt:149,date:"Mar 21",ev:"NCAA SF",w1:{n:"Shayne Van Ness",t:"Penn State",rk:1},w2:{n:"Meyer Shapiro",t:"Cornell",rk:2},done:false,addedAt:new Date("2026-03-04").getTime()},
];

// Lock times: predictions freeze at 10am ET on match day
const LOCK_DATES = {"Mar 8":new Date(2026,2,8,10,0,0),"Mar 20":new Date(2026,2,20,10,0,0),"Mar 21":new Date(2026,2,21,10,0,0)};
const isMatchLocked = m => !!(m.done || (LOCK_DATES[m.date] && new Date() >= LOCK_DATES[m.date]));

// Live/freshness helpers
const DATA_UPDATED = new Date("2026-03-04T14:00:00");
const _MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const _now = new Date();
const _todayStr = `${_MONTHS[_now.getMonth()]} ${_now.getDate()}`;
const isEventToday = dateStr => dateStr === _todayStr || (dateStr.includes(_todayStr));

// Events database
const EVENTS = [
  { id:"ev1",name:"Penn State vs Ohio State",date:"Feb 21",location:"Bryce Jordan Center, University Park, PA",status:"completed",
    results:[
      {wt:125,place:[{p:1,n:"Nic Bouzakis",t:"Ohio State"},{p:2,n:"Luke Lilledahl",t:"Penn State"}]},
      {wt:141,place:[{p:1,n:"Jesse Mendez",t:"Ohio State"},{p:2,n:"Aaron Nagao",t:"Penn State"}]},
      {wt:165,place:[{p:1,n:"Mitchell Mesenbrink",t:"Penn State"},{p:2,n:"Dylan Fishback",t:"Ohio State"}]},
      {wt:174,place:[{p:1,n:"Levi Haines",t:"Penn State"},{p:2,n:"Carson Kharchla",t:"Ohio State"}]},
      {wt:184,place:[{p:1,n:"Rocco Welsh",t:"Penn State"},{p:2,n:"Dylan Fishback",t:"Ohio State"}]},
    ],teamScores:[{t:"Penn State",pts:22},{t:"Ohio State",pts:15}]
  },
  { id:"ev2",name:"Iowa vs Oklahoma State",date:"Feb 14",location:"Carver-Hawkeye Arena, Iowa City, IA",status:"completed",
    results:[
      {wt:165,place:[{p:1,n:"Mikey Caliendo",t:"Iowa"},{p:2,n:"Ladarion Lockett",t:"Oklahoma State"}]},
      {wt:174,place:[{p:1,n:"Patrick Kennedy",t:"Iowa"},{p:2,n:"Alex Facundo",t:"Oklahoma State"}]},
    ],teamScores:[{t:"Iowa",pts:21},{t:"Oklahoma State",pts:13}]
  },
  { id:"ev3",name:"Big Ten Championships",date:"Mar 7-8",location:"Minneapolis, MN",status:"upcoming",results:[],teamScores:[]},
  { id:"ev4",name:"Big 12 Championships",date:"Mar 7-8",location:"Tulsa, OK",status:"upcoming",results:[],teamScores:[]},
  { id:"ev5",name:"ACC Championships",date:"Mar 7-8",location:"Pittsburgh, PA",status:"upcoming",results:[],teamScores:[]},
  { id:"ev6",name:"EIWA Championships",date:"Mar 7-8",location:"Ithaca, NY",status:"upcoming",results:[],teamScores:[]},
  { id:"ev7",name:"NCAA Championships",date:"Mar 19-21",location:"Rocket Arena, Cleveland, OH",status:"upcoming",results:[],teamScores:[]},
];

// Demo certified rankers
const RANKERS = [
  {u:"hawkeye_fanatic",acc:78,tot:142,tier:"elite"},{u:"psuwrestling22",acc:73,tot:98,tier:"elite"},
  {u:"cowboy_mat",acc:71,tot:86,tier:"certified"},{u:"big10_insider",acc:69,tot:74,tier:"certified"},
  {u:"wrestlenerds",acc:67,tot:55,tier:"certified"},{u:"ncaa_oracle",acc:66,tot:43,tier:"certified"},
  {u:"matrat_mike",acc:65,tot:38,tier:"certified"},
];
RANKERS.forEach(r => {
  r.ballots = {};
  WC.forEach(wc => {
    const s = [...W[wc]];
    const v = Math.max(1, Math.floor((100 - r.acc) / 15));
    for (let i = s.length - 1; i > 0; i--) {
      const sw = Math.random() > 0.5 ? Math.floor(Math.random() * v) : 0;
      if (sw > 0 && i - sw >= 0) [s[i], s[i - sw]] = [s[i - sw], s[i]];
    }
    r.ballots[wc] = s.map((w, i) => ({ name: w.n, rank: i + 1 }));
  });
});

function consensus(wc) {
  const sc = {};
  W[wc].forEach(w => { sc[w.n] = { tw: 0, twt: 0 }; });
  RANKERS.forEach(r => {
    if (!r.ballots[wc]) return;
    const wt = r.acc / 100;
    r.ballots[wc].forEach(b => {
      if (sc[b.name]) { sc[b.name].tw += b.rank * wt; sc[b.name].twt += wt; }
    });
  });
  return Object.entries(sc).map(([n, d]) => ({ name: n, score: d.twt > 0 ? d.tw / d.twt : 99 }))
    .sort((a, b) => a.score - b.score).map((x, i) => ({ ...x, rank: i + 1 }));
}

const SK = {u:"ms5-u",c:"ms5-c",p:"ms5-p",mv:"ms5-mv",sg:"ms5-sg"};
const gid = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
function share(p, t) {
  const u = "https://matside.com", e = encodeURIComponent(t), eu = encodeURIComponent(u);
  const m = { twitter: `https://twitter.com/intent/tweet?text=${e}&url=${eu}`, reddit: `https://www.reddit.com/submit?url=${eu}&title=${e}`, facebook: `https://www.facebook.com/sharer/sharer.php?u=${eu}&quote=${e}` };
  if (p === "copy") { navigator.clipboard?.writeText(`${t} ${u}`); return true; }
  window.open(m[p], "_blank", "width=600,height=400"); return false;
}

// ═══════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════
const C = {bg:"#07080c",bg2:"#0c0e15",srf:"#111520",card:"#151926",cardH:"#1a1f30",bdr:"#1c2233",red:"#e8192c",redG:"#ff2d42",redD:"#6b101c",blue:"#1a6bff",blueG:"#3d85ff",blueD:"#0d3880",gold:"#fca311",goldD:"#b8780d",grn:"#10b981",w:"#eef2f7",g1:"#c4cdd9",g2:"#8892a4",g3:"#5a6478",g4:"#3a4155",accent:"#7c5cfc"};
const F = {d:"'Oswald', sans-serif",b:"'Source Sans 3', sans-serif"};
const CSS_STR = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:wght@0,400;0,500;0,600;0,700&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{background:${C.bg}}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.g4};border-radius:3px}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes glow{0%,100%{box-shadow:0 0 6px ${C.red}30}50%{box-shadow:0 0 18px ${C.red}50}}@keyframes cpulse{0%,100%{text-shadow:0 0 8px ${C.gold}40}50%{text-shadow:0 0 16px ${C.gold}60}}.fu{animation:fadeUp .4s ease both}.uglow{animation:glow 2s ease-in-out infinite}.cpulse{animation:cpulse 3s ease-in-out infinite}.hl{transition:transform .2s,box-shadow .2s}.hl:hover{transform:translateY(-2px);box-shadow:0 8px 24px #00000060}.hb{transition:all .15s}.hb:hover{filter:brightness(1.15)}.sr{display:flex;gap:4px;opacity:0;transition:all .2s;pointer-events:none}.mc:hover .sr{opacity:1;pointer-events:auto}select,input,textarea{font-family:${F.b}}`;

// ═══════════════════════════════════════════════════════════
//  MICRO COMPONENTS
// ═══════════════════════════════════════════════════════════
function ShareBtns({ text }) {
  const [cp, setCp] = useState(false);
  const bs = {border:"none",borderRadius:3,cursor:"pointer",padding:"3px 6px",background:`${C.g4}50`,display:"flex",alignItems:"center"};
  const I = ({ d, c = C.g1 }) => <svg width={12} height={12} viewBox="0 0 24 24" fill={c}><path d={d} /></svg>;
  return (
    <div className="sr">
      <button style={bs} onClick={e => { e.stopPropagation(); share("twitter", text); }}><I d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></button>
      <button style={bs} onClick={e => { e.stopPropagation(); share("reddit", text); }}><I d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z" /></button>
      <button style={bs} onClick={e => { e.stopPropagation(); if (share("copy", text)) { setCp(true); setTimeout(() => setCp(false), 2000); } }}><I d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" c={cp ? C.grn : C.g1} /></button>
    </div>
  );
}

function TierBadge({ tier, sm }) {
  const t = TIERS.find(x => x.id === tier) || TIERS[0];
  return <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:sm?"1px 5px":"2px 8px",borderRadius:3,background:`${t.color}18`,color:t.color,fontFamily:F.d,fontSize:sm?8:10,letterSpacing:1.5}}>{t.icon} {t.label.toUpperCase()}</span>;
}

function WcTabs({ active, onChange, color = C.red }) {
  return (
    <div style={{display:"flex",gap:3,overflowX:"auto",paddingBottom:4}}>
      {WC.map(w => <button key={w} onClick={() => onChange(w)} style={{border:"none",borderRadius:4,padding:"7px 0",width:50,minWidth:50,background:active === w ? color : "transparent",color:active === w ? (color === C.gold ? "#000" : "#fff") : C.g3,fontFamily:F.d,fontSize:13,letterSpacing:1,cursor:"pointer",boxShadow:active === w ? `0 2px 10px ${color}40` : "none"}}>{w}</button>)}
    </div>
  );
}

function MatchCard({ match: m, user, mvotes, onVote, myMatchPick, aiInsight }) {
  const locked = isMatchLocked(m);
  const v = mvotes[m.id] || {};
  const v1 = v[m.w1.n] || 0, v2 = v[m.w2.n] || 0, tot = v1 + v2 || 1;
  const p1 = (v1 / tot * 100).toFixed(0), p2 = (v2 / tot * 100).toFixed(0);
  const up = m.done && m.result?.upset;
  const isNew = m.addedAt && (Date.now() - m.addedAt < 72 * 3600000);
  const st = m.done ? `⚡ ${m.result.winner} wins by ${m.result.method}!` : `#${m.w1.rk} ${m.w1.n} vs #${m.w2.rk} ${m.w2.n} — vote on MatSide`;
  const ai1 = aiInsight?.find(a => a.wrestler_name === m.w1.n);
  const ai2 = aiInsight?.find(a => a.wrestler_name === m.w2.n);
  const aiTop = ai1 && ai2 ? (ai1.confidence_score >= ai2.confidence_score ? ai1 : ai2) : (ai1 || ai2);
  return (
    <div className={`mc hl ${up ? 'uglow' : ''}`} style={{background:`linear-gradient(135deg,${C.card},${C.srf})`,border:`1px solid ${up ? C.red + '50' : C.bdr}`,borderRadius:8,overflow:"hidden",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 12px",background:`${C.srf}80`}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontFamily:F.d,fontSize:9,letterSpacing:2,color:C.gold}}>{m.wt} LBS</span>
          {isNew && <span style={{fontFamily:F.d,fontSize:7,letterSpacing:1,padding:"1px 5px",borderRadius:2,background:C.red,color:"#fff"}}>NEW</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {!m.done && locked && <span style={{fontFamily:F.d,fontSize:7,letterSpacing:1,color:C.g3}}>🔒 LOCKED</span>}
          <span style={{fontFamily:F.b,fontSize:10,color:C.g3}}>{m.date} • {m.ev}</span>
          <ShareBtns text={st} />
        </div>
      </div>
      <div style={{padding:"10px 12px"}}>
        {m.done ? (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><span style={{fontFamily:F.d,fontSize:16,color:m.result.winner === m.w1.n ? C.w : C.g3,letterSpacing:1}}>#{m.w1.rk} {m.w1.n.toUpperCase()}</span><span style={{fontFamily:F.b,fontSize:10,color:C.g3,marginLeft:6}}>{m.w1.t}</span></div>
              {m.result.winner === m.w1.n && <span style={{fontFamily:F.d,fontSize:9,color:C.grn,letterSpacing:1}}>W</span>}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
              <div><span style={{fontFamily:F.d,fontSize:16,color:m.result.winner === m.w2.n ? C.w : C.g3,letterSpacing:1}}>#{m.w2.rk} {m.w2.n.toUpperCase()}</span><span style={{fontFamily:F.b,fontSize:10,color:C.g3,marginLeft:6}}>{m.w2.t}</span></div>
              {m.result.winner === m.w2.n && <span style={{fontFamily:F.d,fontSize:9,color:C.grn,letterSpacing:1}}>W</span>}
            </div>
            <div style={{marginTop:6,padding:"4px 8px",background:`${up ? C.red : C.grn}10`,borderRadius:4,display:"inline-block"}}>
              <span style={{fontFamily:F.d,fontSize:10,color:up ? C.redG : C.grn,letterSpacing:1}}>{up ? "🚨 UPSET • " : "✅ "}{m.result.method}</span>
            </div>
          </div>
        ) : (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:F.d,fontSize:16,color:C.blueG,letterSpacing:1}}>#{m.w1.rk} {m.w1.n.toUpperCase()}<span style={{fontFamily:F.b,fontSize:10,color:C.g3,marginLeft:6}}>{m.w1.t}</span></div>
                <div style={{fontFamily:F.d,fontSize:16,color:C.redG,letterSpacing:1,marginTop:4}}>#{m.w2.rk} {m.w2.n.toUpperCase()}<span style={{fontFamily:F.b,fontSize:10,color:C.g3,marginLeft:6}}>{m.w2.t}</span></div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"stretch",minWidth:100}}>
                <button onClick={() => !locked && user && onVote(m.id, m.w1.n)} className="hb" style={{border:`1px solid ${myMatchPick === m.w1.n ? C.gold : C.blue + '40'}`,borderRadius:4,padding:"4px 10px",background:myMatchPick === m.w1.n ? `${C.gold}20` : `${C.blue}15`,color:myMatchPick === m.w1.n ? C.gold : C.blueG,fontFamily:F.d,fontSize:10,cursor:user && !locked?"pointer":"default",letterSpacing:1,opacity:locked?0.6:1}}>{myMatchPick === m.w1.n ? "✓ " : ""}{p1}%</button>
                <button onClick={() => !locked && user && onVote(m.id, m.w2.n)} className="hb" style={{border:`1px solid ${myMatchPick === m.w2.n ? C.gold : C.red + '40'}`,borderRadius:4,padding:"4px 10px",background:myMatchPick === m.w2.n ? `${C.gold}20` : `${C.red}15`,color:myMatchPick === m.w2.n ? C.gold : C.redG,fontFamily:F.d,fontSize:10,cursor:user && !locked?"pointer":"default",letterSpacing:1,opacity:locked?0.6:1}}>{myMatchPick === m.w2.n ? "✓ " : ""}{p2}%</button>
              </div>
            </div>
            <div style={{marginTop:6,height:4,borderRadius:2,background:C.g4,overflow:"hidden",display:"flex"}}>
              <div style={{width:`${p1}%`,background:myMatchPick === m.w1.n ? C.gold : C.blue,transition:"width .3s"}} />
              <div style={{width:`${p2}%`,background:myMatchPick === m.w2.n ? C.gold : C.red,transition:"width .3s"}} />
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
              <span style={{fontFamily:F.b,fontSize:9,color:C.g3}}>{v1 + v2} votes</span>
              {!user && <span style={{fontFamily:F.b,fontSize:9,color:C.gold}}>Sign in to vote</span>}
              {user && myMatchPick && <span style={{fontFamily:F.b,fontSize:9,color:C.gold}}>✓ Your pick — tap to change</span>}
            </div>
          </div>
        )}
        {aiTop && (
          <div style={{marginTop:8,padding:"6px 8px",background:`${C.accent}10`,border:`1px solid ${C.accent}25`,borderRadius:4}}>
            {aiTop.injury_alert && <div style={{fontFamily:F.d,fontSize:9,color:C.redG,letterSpacing:1,marginBottom:3}}>🚨 INJURY ALERT — {aiTop.injury_note}</div>}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1,height:3,borderRadius:2,background:C.g4,overflow:"hidden"}}>
                <div style={{width:`${aiTop.confidence_score}%`,height:"100%",background:`linear-gradient(90deg,${C.accent},#9d7dfe)`,transition:"width .3s"}} />
              </div>
              <span style={{fontFamily:F.b,fontSize:9,color:C.accent,whiteSpace:"nowrap"}}>Claude gives {aiTop.wrestler_name.split(" ").pop()} {aiTop.confidence_score}% · upset risk: {aiTop.upset_risk}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthModal({ onClose, onAuth }) {
  const [mode, setMode] = useState("login");
  const [un, setUn] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const go = () => {
    if (!un || !pw) return setErr("Fill in all fields");
    if (mode === "signup") {
      const u = { username: un, total: 0, correct: 0 };
      try {
        const ex = localStorage.getItem(SK.u);
        const all = ex ? JSON.parse(ex) : [];
        if (all.find(x => x.username === un)) return setErr("Username taken");
        all.push(u);
        localStorage.setItem(SK.u, JSON.stringify(all));
        localStorage.setItem(SK.c, JSON.stringify(u));
      } catch {}
      onAuth(u);
    } else {
      try {
        const ex = localStorage.getItem(SK.u);
        const all = ex ? JSON.parse(ex) : [];
        const found = all.find(x => x.username === un);
        if (!found) return setErr("User not found");
        localStorage.setItem(SK.c, JSON.stringify(found));
        onAuth(found);
      } catch { setErr("Error"); }
    }
  };
  const is = {width:"100%",padding:"10px 12px",border:`1px solid ${C.bdr}`,borderRadius:5,background:C.srf,color:C.w,fontFamily:F.b,fontSize:13,marginBottom:8,outline:"none"};
  return (
    <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:C.card,border:`1px solid ${C.bdr}`,borderRadius:10,padding:28,maxWidth:360,width:"100%"}} onClick={e => e.stopPropagation()}>
        <h2 style={{fontFamily:F.d,fontSize:24,letterSpacing:3,textAlign:"center",marginBottom:16}}>MAT<span style={{color:C.red}}>SIDE</span></h2>
        <div style={{display:"flex",gap:4,marginBottom:14}}>
          {["login","signup"].map(m => <button key={m} onClick={() => setMode(m)} style={{flex:1,border:`1px solid ${mode === m ? C.red : C.bdr}`,borderRadius:4,padding:"6px",background:mode === m ? `${C.red}15` : "transparent",color:mode === m ? C.redG : C.g3,fontFamily:F.d,fontSize:11,letterSpacing:1,cursor:"pointer"}}>{m.toUpperCase()}</button>)}
        </div>
        <input placeholder="Username" value={un} onChange={e => setUn(e.target.value)} style={is} />
        <input placeholder="Password" type="password" value={pw} onChange={e => setPw(e.target.value)} style={is} />
        {err && <p style={{fontFamily:F.b,fontSize:11,color:C.redG,marginBottom:6}}>{err}</p>}
        <button onClick={go} className="hb" style={{width:"100%",border:"none",borderRadius:5,padding:"10px",background:`linear-gradient(135deg,${C.red},${C.redG})`,color:"#fff",fontFamily:F.d,fontSize:13,letterSpacing:2,cursor:"pointer",marginTop:4}}>{mode === "login" ? "LOG IN" : "CREATE ACCOUNT"}</button>
      </div>
    </div>
  );
}

function SuggestModal({ user, onClose, onSubmit }) {
  const [wt, setWt] = useState(141);
  const [ev, setEv] = useState("");
  const [w1, setW1] = useState("");
  const [w2, setW2] = useState("");
  const [reason, setReason] = useState("");
  const is = {width:"100%",padding:"8px 10px",border:`1px solid ${C.bdr}`,borderRadius:4,background:C.srf,color:C.w,fontSize:12,outline:"none"};
  return (
    <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:C.card,border:`1px solid ${C.bdr}`,borderRadius:10,padding:24,maxWidth:400,width:"100%"}} onClick={e => e.stopPropagation()}>
        <h3 style={{fontFamily:F.d,fontSize:18,letterSpacing:2,marginBottom:14}}>SUGGEST A MATCHUP</h3>
        <div style={{display:"grid",gap:8}}>
          <select value={wt} onChange={e => setWt(+e.target.value)} style={is}>{WC.map(w => <option key={w} value={w}>{w} lbs</option>)}</select>
          <input placeholder="Event" value={ev} onChange={e => setEv(e.target.value)} style={is} />
          <input placeholder="Blue corner wrestler" value={w1} onChange={e => setW1(e.target.value)} style={is} />
          <input placeholder="Red corner wrestler" value={w2} onChange={e => setW2(e.target.value)} style={is} />
          <textarea placeholder="Why is this must-see?" value={reason} onChange={e => setReason(e.target.value)} style={{...is,height:50,resize:"none"}} />
        </div>
        <button onClick={() => { if (w1 && w2) { onSubmit({wt,ev:ev || "TBD",w1,w2,reason,user:user.username,upvotes:1,status:"pending",id:gid()}); onClose(); }}} className="hb" style={{marginTop:10,width:"100%",border:"none",borderRadius:5,padding:"10px",background:`linear-gradient(135deg,${C.red},${C.redG})`,color:"#fff",fontFamily:F.d,fontSize:13,letterSpacing:2,cursor:"pointer"}}>SUBMIT</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("consensus");
  const [wc, setWc] = useState(141);
  const [rv, setRv] = useState("individual");
  const [showAuth, setShowAuth] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [showBallots, setShowBallots] = useState(false);
  const [evFilter, setEvFilter] = useState("all");
  const [matchFilter, setMatchFilter] = useState("all");
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [preds, setPreds] = useState({});
  const [mvotes, setMvotes] = useState({});
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myPicks, setMyPicks] = useState({});       // { [wc]: wrestlerName } — per logged-in user
  const [myMatchPicks, setMyMatchPicks] = useState({}); // { [matchId]: wrestlerName } — per logged-in user
  const [aiInsights, setAiInsights] = useState([]);

  const loadUserPicks = username => {
    try {
      const mp = localStorage.getItem(`ms5-mp-${username}`);
      if (mp) setMyPicks(JSON.parse(mp));
      const mmp = localStorage.getItem(`ms5-mmp-${username}`);
      if (mmp) setMyMatchPicks(JSON.parse(mmp));
    } catch {}
  };

  useEffect(() => {
    try {
      const cu = localStorage.getItem(SK.c);
      if (cu) { const parsed = JSON.parse(cu); setUser(parsed); loadUserPicks(parsed.username); }
      const au = localStorage.getItem(SK.u); if (au) setAllUsers(JSON.parse(au));
      const p = localStorage.getItem(SK.p); if (p) setPreds(JSON.parse(p));
      const m = localStorage.getItem(SK.mv); if (m) setMvotes(JSON.parse(m));
      const s = localStorage.getItem(SK.sg); if (s) setSuggested(JSON.parse(s));
    } catch {}
    setLoading(false);
    // Load AI insights from Supabase (non-blocking)
    supabase.from("ai_insights").select("*").order("generated_at", { ascending: false })
      .then(({ data }) => { if (data && data.length > 0) setAiInsights(data); });
  }, []);

  const auth = u => {
    setUser(u); setShowAuth(false);
    try { const a = localStorage.getItem(SK.u); if (a) setAllUsers(JSON.parse(a)); } catch {}
    loadUserPicks(u.username);
  };
  const logout = () => { try { localStorage.removeItem(SK.c); } catch {} setUser(null); setMyPicks({}); setMyMatchPicks({}); };
  const votePred = (w, n) => {
    if (!user) return;
    const matchForWc = MATCHES.find(m => m.wt === w && !m.done);
    if (matchForWc && isMatchLocked(matchForWc)) return;
    const newPreds = { ...preds }; if (!newPreds[w]) newPreds[w] = {};
    const newPicks = { ...myPicks };
    const current = newPicks[w];
    if (current === n) {
      newPreds[w][n] = Math.max(0, (newPreds[w][n] || 1) - 1);
      delete newPicks[w];
    } else if (current) {
      newPreds[w][current] = Math.max(0, (newPreds[w][current] || 1) - 1);
      newPreds[w][n] = (newPreds[w][n] || 0) + 1;
      newPicks[w] = n;
    } else {
      newPreds[w][n] = (newPreds[w][n] || 0) + 1;
      newPicks[w] = n;
    }
    setPreds(newPreds); setMyPicks(newPicks);
    try { localStorage.setItem(SK.p, JSON.stringify(newPreds)); } catch {}
    try { localStorage.setItem(`ms5-mp-${user.username}`, JSON.stringify(newPicks)); } catch {}
  };
  const voteMatch = (id, n) => {
    if (!user) return;
    const match = MATCHES.find(m => m.id === id);
    if (!match || isMatchLocked(match)) return;
    const newMvotes = { ...mvotes }; if (!newMvotes[id]) newMvotes[id] = {};
    const newMatchPicks = { ...myMatchPicks };
    const current = newMatchPicks[id];
    if (current === n) {
      newMvotes[id][n] = Math.max(0, (newMvotes[id][n] || 1) - 1);
      delete newMatchPicks[id];
    } else if (current) {
      newMvotes[id][current] = Math.max(0, (newMvotes[id][current] || 1) - 1);
      newMvotes[id][n] = (newMvotes[id][n] || 0) + 1;
      newMatchPicks[id] = n;
    } else {
      newMvotes[id][n] = (newMvotes[id][n] || 0) + 1;
      newMatchPicks[id] = n;
    }
    setMvotes(newMvotes); setMyMatchPicks(newMatchPicks);
    try { localStorage.setItem(SK.mv, JSON.stringify(newMvotes)); } catch {}
    try { localStorage.setItem(`ms5-mmp-${user.username}`, JSON.stringify(newMatchPicks)); } catch {}
  };
  const submitSg = sg => { const u = [sg, ...suggested]; setSuggested(u); try { localStorage.setItem(SK.sg, JSON.stringify(u)); } catch {} };

  const userTier = user ? getTier(user.total || 0, user.total > 0 ? (user.correct / user.total) * 100 : 0) : TIERS[0];
  const cons = consensus(wc);
  const nav = [
    {id:"consensus",l:"The Consensus",i:"⚡"},
    {id:"predictions",l:"Predictions",i:"🎯"},
    {id:"matches",l:"Match Center",i:"🔥"},
    {id:"events",l:"Events & Results",i:"🏟️"},
    {id:"leaderboard",l:"Leaderboard",i:"🏆"},
  ];

  const completedMatches = MATCHES.filter(m => m.done);
  const upcomingMatches = MATCHES.filter(m => !m.done);
  const filteredUpcoming = matchFilter === "all" ? upcomingMatches : upcomingMatches.filter(m => m.wt === +matchFilter);

  if (loading) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontFamily:F.d,fontSize:36,color:C.w,letterSpacing:6}}>MAT<span style={{color:C.red}}>SIDE</span></div></div>;

  const th = {padding:"8px 6px",fontFamily:F.d,fontSize:8,letterSpacing:1.5,borderBottom:`1px solid ${C.bdr}`,whiteSpace:"nowrap"};

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:F.b,color:C.w}}>
      <style>{CSS_STR}</style>
      <header style={{background:`${C.srf}e0`,borderBottom:`1px solid ${C.bdr}`,position:"sticky",top:0,zIndex:100,backdropFilter:"blur(14px)"}}>
        <div style={{maxWidth:1280,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",height:52,padding:"0 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={() => setTab("consensus")}>
            <div style={{display:"flex",alignItems:"baseline",gap:8}}>
              <span style={{fontFamily:F.d,fontSize:24,letterSpacing:3}}>MAT<span style={{color:C.red}}>SIDE</span></span>
              <span style={{fontFamily:F.d,fontSize:7,letterSpacing:3,color:C.g4}}>WRESTLING INTELLIGENCE</span>
            </div>
            {EVENTS.some(ev => isEventToday(ev.date) && ev.status !== "completed") &&
              <span className="uglow" style={{fontFamily:F.d,fontSize:7,letterSpacing:2,padding:"2px 6px",borderRadius:2,background:C.red,color:"#fff"}}>🔴 LIVE</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {user ? <>
              <div style={{textAlign:"right",marginRight:2}}><div style={{fontFamily:F.b,fontSize:11,fontWeight:600}}>{user.username}</div><TierBadge tier={userTier.id} sm /></div>
              <button onClick={logout} style={{border:`1px solid ${C.bdr}`,borderRadius:4,padding:"4px 10px",background:"transparent",color:C.g3,fontFamily:F.b,fontSize:10,cursor:"pointer"}}>Logout</button>
            </> : <button onClick={() => setShowAuth(true)} className="hb" style={{border:"none",borderRadius:4,padding:"6px 16px",background:`linear-gradient(135deg,${C.red},${C.redG})`,color:"#fff",fontFamily:F.d,fontSize:11,letterSpacing:2,cursor:"pointer"}}>JOIN</button>}
          </div>
        </div>
      </header>

      <nav style={{borderBottom:`1px solid ${C.bdr}`,background:`${C.srf}90`,backdropFilter:"blur(10px)",position:"sticky",top:52,zIndex:99}}>
        <div style={{maxWidth:1280,margin:"0 auto",display:"flex",gap:0,padding:"0 16px",overflowX:"auto"}}>
          {nav.map(n => <button key={n.id} onClick={() => setTab(n.id)} style={{border:"none",padding:"9px 14px",background:"transparent",cursor:"pointer",fontFamily:F.d,fontSize:11,letterSpacing:2,color:tab === n.id ? C.w : C.g3,borderBottom:tab === n.id ? (n.id === "consensus" ? `2px solid ${C.gold}` : `2px solid ${C.red}`) : "2px solid transparent",whiteSpace:"nowrap"}}>{n.i} {n.l.toUpperCase()}</button>)}
        </div>
      </nav>

      <main style={{maxWidth:1280,margin:"0 auto",padding:"18px 16px 80px"}}>

        {/* ═══ THE CONSENSUS (merged rankings) ═══ */}
        {tab === "consensus" && <div className="fu">
          <div style={{textAlign:"center",padding:"28px 0 22px",position:"relative"}}>
            <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at center,${C.gold}08 0%,transparent 70%)`,pointerEvents:"none"}} />
            <span style={{background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:"#000",padding:"3px 12px",borderRadius:3,fontFamily:F.d,fontSize:10,letterSpacing:2}}>POWERED BY {RANKERS.length} CERTIFIED RANKERS</span>
            <h1 className="cpulse" style={{fontFamily:F.d,fontSize:48,letterSpacing:6,color:C.gold,lineHeight:1,marginTop:8}}>THE CONSENSUS</h1>
            <p style={{fontFamily:F.b,fontSize:13,color:C.g2,marginTop:6,maxWidth:560,margin:"6px auto 0"}}>Real-time, accuracy-weighted rankings + every major expert source side by side. Updated after every match.</p>
            <p style={{fontFamily:F.b,fontSize:10,color:C.g3,marginTop:4}}>Updated {Math.round((Date.now() - DATA_UPDATED) / 3600000)}h ago</p>
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:4}}>
              {["individual","team"].map(v => <button key={v} onClick={() => setRv(v)} style={{border:`1px solid ${rv === v ? C.gold : C.bdr}`,borderRadius:4,padding:"5px 14px",background:rv === v ? `${C.gold}15` : "transparent",color:rv === v ? C.gold : C.g3,fontFamily:F.d,fontSize:10,letterSpacing:1,cursor:"pointer"}}>{v.toUpperCase()}</button>)}
            </div>
            {rv === "individual" && <button onClick={() => setShowBallots(!showBallots)} style={{border:`1px solid ${C.bdr}`,borderRadius:4,padding:"4px 12px",background:"transparent",color:C.g2,fontFamily:F.d,fontSize:9,letterSpacing:1,cursor:"pointer"}}>{showBallots ? "HIDE" : "VIEW"} BALLOTS</button>}
          </div>

          {rv === "individual" && <>
            <WcTabs active={wc} onChange={setWc} color={C.gold} />
            <div style={{background:C.card,border:`1px solid ${C.gold}20`,borderRadius:8,overflow:"hidden",marginTop:12,boxShadow:`0 0 24px ${C.gold}06`}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:800}}>
                  <thead><tr style={{background:C.srf}}>
                    <th style={{...th,textAlign:"center",color:C.gold,width:50,background:`${C.gold}08`}}>CONS.</th>
                    <th style={{...th,textAlign:"left",color:C.g3,paddingLeft:14}}>WRESTLER</th>
                    <th style={{...th,textAlign:"left",color:C.g3}}>TEAM</th>
                    <th style={{...th,textAlign:"center",color:C.g3}}>REC</th>
                    {SOURCES.map(s => <th key={s} style={{...th,textAlign:"center",color:C.g4}}>{s.split(" ")[0].toUpperCase().slice(0, 8)}</th>)}
                    <th style={{...th,textAlign:"center",color:C.g3}}>DIFF</th>
                  </tr></thead>
                  <tbody>
                    {cons.map((c, i) => {
                      const wr = W[wc].find(w => w.n === c.name);
                      const avg = SOURCES.reduce((a, s) => { const r = RK[wc][s].find(w => w.n === c.name); return a + (r ? r.rank : 10); }, 0) / SOURCES.length;
                      const diff = avg - c.rank;
                      return (
                        <tr key={c.name} style={{borderBottom:`1px solid ${C.bdr}12`}} onMouseEnter={e => e.currentTarget.style.background = C.cardH} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{padding:"9px 6px",textAlign:"center",background:`${C.gold}04`}}><span style={{fontFamily:F.d,fontSize:i < 3 ? 20 : 15,color:i < 3 ? C.gold : C.w,letterSpacing:1}}>{c.rank}</span></td>
                          <td style={{padding:"9px 14px",fontFamily:F.d,fontSize:14,letterSpacing:0.5}}>{c.name.toUpperCase()}</td>
                          <td style={{padding:"9px 6px",fontFamily:F.b,fontSize:11,color:C.g2}}>{wr?.t}</td>
                          <td style={{padding:"9px 6px",textAlign:"center",fontFamily:"monospace",fontSize:11,color:C.g2}}>{wr?.r}</td>
                          {SOURCES.map(src => { const rk = RK[wc][src].find(w => w.n === c.name)?.rank || "—"; const d2 = rk - c.rank; return <td key={src} style={{padding:"9px 4px",textAlign:"center"}}><span style={{fontFamily:F.d,fontSize:13,color:d2 < -1 ? C.grn : d2 > 1 ? C.redG : C.g2}}>{rk}</span></td>; })}
                          <td style={{padding:"9px 6px",textAlign:"center"}}>{Math.abs(diff) > 0.5 && <span style={{fontFamily:F.d,fontSize:10,padding:"1px 6px",borderRadius:3,background:diff > 1 ? `${C.grn}15` : diff < -1 ? `${C.red}15` : "transparent",color:diff > 1 ? C.grn : diff < -1 ? C.redG : C.g3}}>{diff > 0 ? "↑" : "↓"}{Math.abs(diff).toFixed(1)}</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {showBallots && <div className="fu" style={{marginTop:12,background:C.card,border:`1px solid ${C.bdr}`,borderRadius:8,padding:14,overflowX:"auto"}}>
              <h4 style={{fontFamily:F.d,fontSize:13,letterSpacing:2,color:C.w,marginBottom:10}}>INDIVIDUAL BALLOTS — {wc} LBS</h4>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:580}}>
                <thead><tr>
                  <th style={{...th,textAlign:"left",color:C.g3}}>RANKER</th>
                  <th style={{...th,textAlign:"center",color:C.g3}}>ACC</th>
                  {Array.from({length: 10}, (_, i) => <th key={i} style={{...th,textAlign:"center",color:C.gold}}>#{i + 1}</th>)}
                </tr></thead>
                <tbody>{RANKERS.map(r => <tr key={r.u} style={{borderBottom:`1px solid ${C.bdr}12`}}>
                  <td style={{padding:"6px 8px",fontFamily:F.b,fontSize:11,fontWeight:600}}>{r.u} <TierBadge tier={r.tier} sm /></td>
                  <td style={{padding:"6px 4px",textAlign:"center",fontFamily:F.d,fontSize:11,color:C.grn}}>{r.acc}%</td>
                  {r.ballots[wc]?.map((b, i) => <td key={i} style={{padding:"6px 3px",textAlign:"center",fontFamily:F.b,fontSize:10,color:C.g2}}>{b.name.split(" ").pop()}</td>)}
                </tr>)}</tbody>
              </table>
            </div>}
          </>}

          {rv === "team" && <div style={{background:C.card,border:`1px solid ${C.gold}20`,borderRadius:8,overflow:"hidden",marginTop:8,boxShadow:`0 0 24px ${C.gold}06`}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:640}}>
                <thead><tr style={{background:C.srf}}>
                  <th style={{...th,textAlign:"center",color:C.gold,width:50,background:`${C.gold}08`}}>CONS.</th>
                  <th style={{...th,textAlign:"left",color:C.g3,paddingLeft:14}}>TEAM</th>
                  {TEAM_SOURCES.map(s => <th key={s} style={{...th,textAlign:"center",color:C.g4}}>{s.toUpperCase().slice(0, 10)}</th>)}
                </tr></thead>
                <tbody>{TEAM_CONSENSUS.map((t, i) =>
                  <tr key={t.team} style={{borderBottom:`1px solid ${C.bdr}12`}} onMouseEnter={e => e.currentTarget.style.background = C.cardH} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{padding:"10px 6px",textAlign:"center",background:`${C.gold}04`}}><span style={{fontFamily:F.d,fontSize:i < 3 ? 20 : 15,color:i < 3 ? C.gold : C.w}}>{t.consensusRank}</span></td>
                    <td style={{padding:"10px 14px",fontFamily:F.b,fontWeight:600,fontSize:14}}>{t.team}</td>
                    {TEAM_SOURCES.map(src => { const rk = TEAM_RK[src].find(x => x.team === t.team)?.rank || "—"; const d = rk - t.consensusRank; return <td key={src} style={{padding:"10px 6px",textAlign:"center"}}><span style={{fontFamily:F.d,fontSize:14,color:d < -1 ? C.grn : d > 1 ? C.redG : C.g2}}>{rk}</span></td>; })}
                  </tr>
                )}</tbody>
              </table>
            </div>
          </div>}

          {!user && <div style={{marginTop:16,background:`linear-gradient(135deg,${C.card},${C.srf})`,border:`1px dashed ${C.gold}30`,borderRadius:8,padding:24,textAlign:"center"}}>
            <h3 style={{fontFamily:F.d,fontSize:18,color:C.gold,letterSpacing:2,marginBottom:6}}>WANT YOUR RANKINGS TO COUNT?</h3>
            <p style={{fontFamily:F.b,fontSize:12,color:C.g2,maxWidth:460,margin:"0 auto 12px"}}>Build prediction accuracy → earn Certified Ranker → your ballots feed The Consensus.</p>
            <button onClick={() => setShowAuth(true)} className="hb" style={{border:"none",borderRadius:5,padding:"9px 24px",background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:"#000",fontFamily:F.d,fontSize:13,letterSpacing:2,cursor:"pointer"}}>JOIN MATSIDE</button>
          </div>}
        </div>}

        {/* ═══ PREDICTIONS ═══ */}
        {tab === "predictions" && <div className="fu">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <div><h1 style={{fontFamily:F.d,fontSize:34,letterSpacing:4,lineHeight:1}}>PREDICTIONS</h1><p style={{fontFamily:F.b,fontSize:12,color:C.g2,marginTop:3}}>Pick your weight class champions and predict upcoming matches</p></div>
          </div>
          <h3 style={{fontFamily:F.d,fontSize:14,letterSpacing:2,color:C.gold,marginBottom:10}}>🏆 NCAA FINALIST PREDICTIONS</h3>
          <WcTabs active={wc} onChange={setWc} />
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8,marginTop:10,marginBottom:24}}>
            {W[wc].slice(0, 8).map(w => {
              const votes = preds[wc]?.[w.n] || 0;
              const total = Object.values(preds[wc] || {}).reduce((a, b) => a + b, 0) || 1;
              const pct = (votes / total * 100).toFixed(0);
              const isPicked = myPicks[wc] === w.n;
              const matchForWc = MATCHES.find(m => m.wt === wc && !m.done);
              const locked = matchForWc ? isMatchLocked(matchForWc) : false;
              return (
                <div key={w.n} onClick={() => !locked && votePred(wc, w.n)} className="hl" style={{background:isPicked ? `${C.gold}08` : C.card,border:`1px solid ${isPicked ? C.gold : C.bdr}`,borderRadius:6,padding:"10px 12px",cursor:user && !locked ? "pointer" : "default",boxShadow:isPicked ? `0 0 14px ${C.gold}18` : "none"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontFamily:F.d,fontSize:13,letterSpacing:0.5}}>{w.n.toUpperCase()}</div>
                      <div style={{fontFamily:F.b,fontSize:10,color:C.g3}}>{w.t} • {w.r}</div>
                      {isPicked && <div style={{fontFamily:F.b,fontSize:9,color:C.gold,marginTop:2}}>✓ YOUR PICK — tap to change</div>}
                      {locked && <div style={{fontFamily:F.b,fontSize:9,color:C.g3,marginTop:2}}>🔒 Locked</div>}
                    </div>
                    <div style={{fontFamily:F.d,fontSize:18,color:isPicked ? C.gold : C.w}}>{pct}%</div>
                  </div>
                  <div style={{marginTop:6,height:3,borderRadius:2,background:C.g4,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:isPicked ? `linear-gradient(90deg,${C.gold},${C.goldD})` : `linear-gradient(90deg,${C.red},${C.redG})`,transition:"width .3s"}} /></div>
                  <div style={{fontFamily:F.b,fontSize:9,color:C.g3,marginTop:2}}>{votes} votes</div>
                </div>
              );
            })}
          </div>
          {aiInsights.length > 0 && (() => {
            const wcInsights = aiInsights.filter(a => a.weight_class === wc);
            const topPick = [...wcInsights].sort((a, b) => b.confidence_score - a.confidence_score)[0];
            const injuryAlerts = wcInsights.filter(a => a.injury_alert);
            return (
              <div className="fu" style={{background:`linear-gradient(135deg,${C.card},${C.srf})`,border:`1px solid ${C.accent}25`,borderRadius:8,padding:"12px 16px",marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{fontFamily:F.d,fontSize:11,letterSpacing:2,color:C.accent}}>🤖 AI INTEL</span>
                  <span style={{fontFamily:F.b,fontSize:9,color:C.g3}}>Powered by Claude • {wc} lbs</span>
                </div>
                {topPick && (
                  <div style={{marginBottom:injuryAlerts.length > 0 ? 8 : 0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <div style={{flex:1,height:5,borderRadius:3,background:C.g4,overflow:"hidden"}}>
                        <div style={{width:`${topPick.confidence_score}%`,height:"100%",background:`linear-gradient(90deg,${C.accent},#b89ffe)`,transition:"width .3s"}} />
                      </div>
                      <span style={{fontFamily:F.d,fontSize:11,color:C.accent,minWidth:30}}>{topPick.confidence_score}%</span>
                    </div>
                    <p style={{fontFamily:F.b,fontSize:11,color:C.g2}}>
                      Claude gives <strong style={{color:C.w}}>{topPick.wrestler_name}</strong> the highest win probability at {wc} lbs · upset risk: <span style={{color:topPick.upset_risk==="HIGH"?C.redG:topPick.upset_risk==="MEDIUM"?C.gold:C.grn}}>{topPick.upset_risk}</span>
                    </p>
                    {topPick.insight_text && <p style={{fontFamily:F.b,fontSize:10,color:C.g3,fontStyle:"italic",marginTop:2}}>{topPick.insight_text}</p>}
                  </div>
                )}
                {injuryAlerts.map(a => (
                  <div key={a.id} style={{background:`${C.red}10`,border:`1px solid ${C.red}30`,borderRadius:4,padding:"4px 8px"}}>
                    <span style={{fontFamily:F.d,fontSize:9,color:C.redG,letterSpacing:1}}>🚨 INJURY ALERT — {a.wrestler_name}: {a.injury_note}</span>
                  </div>
                ))}
              </div>
            );
          })()}
          <h3 style={{fontFamily:F.d,fontSize:14,letterSpacing:2,color:C.w,marginBottom:10}}>📊 MATCH PREDICTIONS</h3>
          {upcomingMatches.slice(0, 6).map(m => <MatchCard key={m.id} match={m} user={user} mvotes={mvotes} onVote={voteMatch} myMatchPick={myMatchPicks[m.id]} aiInsight={aiInsights.filter(a => a.weight_class === m.wt)} />)}
        </div>}

        {/* ═══ MATCH CENTER ═══ */}
        {tab === "matches" && <div className="fu">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <div><h1 style={{fontFamily:F.d,fontSize:34,letterSpacing:4,lineHeight:1}}>MATCH CENTER</h1><p style={{fontFamily:F.b,fontSize:12,color:C.g2,marginTop:3}}>AI-detected ranked matchups, results & community suggestions</p><p style={{fontFamily:F.b,fontSize:10,color:C.g3,marginTop:2}}>Updated {Math.round((Date.now() - DATA_UPDATED) / 3600000)}h ago</p></div>
            {user && <button onClick={() => setShowSuggest(true)} className="hb" style={{border:"none",borderRadius:5,padding:"7px 16px",background:`linear-gradient(135deg,${C.red},${C.redG})`,color:"#fff",fontFamily:F.d,fontSize:11,letterSpacing:2,cursor:"pointer"}}>+ SUGGEST</button>}
          </div>

          <h3 style={{fontFamily:F.d,fontSize:13,letterSpacing:2,color:C.grn,marginBottom:8}}>✅ RECENT RESULTS</h3>
          {completedMatches.map(m => <MatchCard key={m.id} match={m} user={user} mvotes={mvotes} onVote={voteMatch} myMatchPick={myMatchPicks[m.id]} aiInsight={aiInsights.filter(a => a.weight_class === m.wt)} />)}

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:20,marginBottom:10}}>
            <h3 style={{fontFamily:F.d,fontSize:13,letterSpacing:2,color:C.blueG}}>🔮 UPCOMING</h3>
            <select value={matchFilter} onChange={e => setMatchFilter(e.target.value)} style={{border:`1px solid ${C.bdr}`,borderRadius:4,padding:"4px 8px",background:C.srf,color:C.g2,fontFamily:F.d,fontSize:10}}>
              <option value="all">ALL WEIGHTS</option>
              {WC.map(w => <option key={w} value={w}>{w} LBS</option>)}
            </select>
          </div>
          {filteredUpcoming.map(m => <MatchCard key={m.id} match={m} user={user} mvotes={mvotes} onVote={voteMatch} myMatchPick={myMatchPicks[m.id]} aiInsight={aiInsights.filter(a => a.weight_class === m.wt)} />)}

          {suggested.length > 0 && <>
            <h3 style={{fontFamily:F.d,fontSize:13,letterSpacing:2,color:C.accent,marginTop:20,marginBottom:8}}>💡 COMMUNITY SUGGESTED</h3>
            {suggested.map(sg => <div key={sg.id} className="hl" style={{background:C.card,border:`1px solid ${C.bdr}`,borderRadius:6,padding:12,marginBottom:6}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <span style={{fontFamily:F.d,fontSize:10,color:C.gold,letterSpacing:1}}>{sg.wt} LBS</span>
                  <span style={{fontFamily:F.b,fontSize:10,color:C.g3,marginLeft:8}}>{sg.ev}</span>
                  <div style={{fontFamily:F.d,fontSize:14,color:C.w,letterSpacing:1,marginTop:2}}>{sg.w1.toUpperCase()} vs {sg.w2.toUpperCase()}</div>
                  {sg.reason && <p style={{fontFamily:F.b,fontSize:10,color:C.g2,fontStyle:"italic",marginTop:2}}>"{sg.reason}"</p>}
                </div>
                <button onClick={() => user && (() => { const u = suggested.map(s => s.id === sg.id ? { ...s, upvotes: s.upvotes + 1 } : s); setSuggested(u); try { localStorage.setItem(SK.sg, JSON.stringify(u)); } catch {} })()} style={{border:`1px solid ${C.bdr}`,borderRadius:4,padding:"5px 8px",background:C.srf,cursor:"pointer",textAlign:"center"}}>
                  <span style={{fontSize:11}}>🔥</span>
                  <div style={{fontFamily:F.d,fontSize:12,color:C.gold}}>{sg.upvotes}</div>
                </button>
              </div>
            </div>)}
          </>}
        </div>}

        {/* ═══ EVENTS & RESULTS ═══ */}
        {tab === "events" && <div className="fu">
          <h1 style={{fontFamily:F.d,fontSize:34,letterSpacing:4,lineHeight:1,marginBottom:4}}>EVENTS & RESULTS</h1>
          <p style={{fontFamily:F.b,fontSize:12,color:C.g2,marginBottom:14}}>Full event results database. The verification layer behind every prediction.</p>
          <div style={{display:"flex",gap:4,marginBottom:14}}>
            {["all","completed","upcoming"].map(f => <button key={f} onClick={() => setEvFilter(f)} style={{border:`1px solid ${evFilter === f ? C.red : C.bdr}`,borderRadius:4,padding:"5px 14px",background:evFilter === f ? `${C.red}15` : "transparent",color:evFilter === f ? C.redG : C.g3,fontFamily:F.d,fontSize:10,letterSpacing:1,cursor:"pointer"}}>{f.toUpperCase()}</button>)}
          </div>
          {EVENTS.filter(e => evFilter === "all" || e.status === evFilter).map(ev => (
            <details key={ev.id} style={{background:C.card,border:`1px solid ${C.bdr}`,borderRadius:8,marginBottom:10,overflow:"hidden"}}>
              <summary style={{padding:"14px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",listStyle:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontFamily:F.d,fontSize:17,color:C.w,letterSpacing:1}}>{ev.name.toUpperCase()}</span>
                  <span style={{fontFamily:F.d,fontSize:9,letterSpacing:1.5,padding:"2px 8px",borderRadius:3,background:ev.status === "completed" ? `${C.grn}15` : `${C.blue}15`,color:ev.status === "completed" ? C.grn : C.blueG}}>{ev.status.toUpperCase()}</span>
                  {isEventToday(ev.date) && ev.status !== "completed" && <span className="uglow" style={{fontFamily:F.d,fontSize:8,letterSpacing:1,padding:"2px 6px",borderRadius:2,background:C.red,color:"#fff"}}>🔴 LIVE</span>}
                </div>
                <div style={{fontFamily:F.b,fontSize:11,color:C.g3}}>{ev.date} • {ev.location}</div>
              </summary>
              <div style={{padding:"0 16px 16px",borderTop:`1px solid ${C.bdr}`}}>
                {ev.teamScores.length > 0 && <div style={{marginTop:14,marginBottom:14}}>
                  <h4 style={{fontFamily:F.d,fontSize:12,letterSpacing:2,color:C.gold,marginBottom:8}}>TEAM SCORES</h4>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {ev.teamScores.map((ts, i) => <div key={ts.t} style={{background:C.srf,border:`1px solid ${i === 0 ? C.gold + '30' : C.bdr}`,borderRadius:6,padding:"8px 14px",minWidth:120}}>
                      <div style={{fontFamily:F.d,fontSize:i === 0 ? 14 : 12,color:i === 0 ? C.gold : C.w,letterSpacing:1}}>{i === 0 ? "🏆 " : ""}{ts.t.toUpperCase()}</div>
                      <div style={{fontFamily:F.d,fontSize:18,color:i === 0 ? C.gold : C.g1,marginTop:2}}>{ts.pts}</div>
                    </div>)}
                  </div>
                </div>}
                {ev.results.length > 0 ? ev.results.map(wr => (
                  <div key={wr.wt} style={{marginTop:10}}>
                    <h4 style={{fontFamily:F.d,fontSize:11,letterSpacing:2,color:C.blueG,marginBottom:6}}>{wr.wt} LBS</h4>
                    <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(wr.place.length, 4)},1fr)`,gap:4}}>
                      {wr.place.map(p => <div key={p.n} style={{background:C.srf,borderRadius:4,padding:"6px 10px",border:`1px solid ${p.p === 1 ? C.gold + '25' : C.bdr}`}}>
                        <span style={{fontFamily:F.d,fontSize:10,color:p.p === 1 ? C.gold : C.g3,letterSpacing:1}}>{p.p === 1 ? "W" : "L"}</span>
                        <div style={{fontFamily:F.b,fontSize:12,fontWeight:600,color:C.w,marginTop:1}}>{p.n}</div>
                        <div style={{fontFamily:F.b,fontSize:10,color:C.g3}}>{p.t}</div>
                      </div>)}
                    </div>
                  </div>
                )) : <div style={{padding:"20px 0",textAlign:"center"}}><span style={{fontFamily:F.b,fontSize:13,color:C.g3}}>Results will be posted as the event progresses.</span></div>}
              </div>
            </details>
          ))}
        </div>}

        {/* ═══ LEADERBOARD ═══ */}
        {tab === "leaderboard" && <div className="fu">
          <h1 style={{fontFamily:F.d,fontSize:34,letterSpacing:4,lineHeight:1,marginBottom:4}}>LEADERBOARD</h1>
          <p style={{fontFamily:F.b,fontSize:12,color:C.g2,marginBottom:14}}>Accuracy = authority. Top rankers shape The Consensus.</p>
          <div style={{background:C.card,border:`1px solid ${C.gold}25`,borderRadius:8,padding:16,marginBottom:12}}>
            <h3 style={{fontFamily:F.d,fontSize:14,letterSpacing:2,color:C.gold,marginBottom:10}}>✅ CERTIFIED & ELITE RANKERS</h3>
            {RANKERS.map((r, i) => <div key={r.u} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",borderRadius:4,marginBottom:2,background:i < 2 ? `${C.gold}06` : "transparent"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontFamily:F.d,fontSize:14,color:C.gold,width:20,textAlign:"center"}}>{i + 1}</span>
                <div><span style={{fontFamily:F.b,fontSize:13,fontWeight:600}}>{r.u}</span><div style={{marginTop:1}}><TierBadge tier={r.tier} sm /></div></div>
              </div>
              <div style={{textAlign:"right"}}><div style={{fontFamily:F.d,fontSize:14,color:C.grn}}>{r.acc}%</div><div style={{fontFamily:F.b,fontSize:10,color:C.g3}}>{r.tot} picks</div></div>
            </div>)}
          </div>
          <div style={{background:C.card,border:`1px solid ${C.bdr}`,borderRadius:8,padding:16}}>
            <h3 style={{fontFamily:F.d,fontSize:12,letterSpacing:2,color:C.w,marginBottom:10}}>CERTIFICATION LADDER</h3>
            {TIERS.map(t => <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.bdr}12`}}>
              <span style={{fontSize:18,width:28,textAlign:"center"}}>{t.icon}</span>
              <div style={{flex:1}}><span style={{fontFamily:F.d,fontSize:12,color:t.color,letterSpacing:1}}>{t.label.toUpperCase()}</span><div style={{fontFamily:F.b,fontSize:10,color:C.g3}}>{t.desc}</div></div>
              <div style={{fontFamily:F.b,fontSize:10,color:C.g2,textAlign:"right"}}>{t.min > 0 && <div>{t.min}+ picks</div>}{t.minAcc > 0 && <div>{t.minAcc}%+</div>}</div>
            </div>)}
          </div>
        </div>}
      </main>

      <footer style={{borderTop:`1px solid ${C.bdr}`,padding:"16px",textAlign:"center",background:C.srf}}>
        <span style={{fontFamily:F.d,fontSize:14,letterSpacing:3,color:C.g4}}>MAT<span style={{color:C.red}}>SIDE</span></span>
        <span style={{fontFamily:F.b,fontSize:9,color:C.g4,marginLeft:10}}>The Consensus • Predictions • Match Center • Results</span>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={auth} />}
      {showSuggest && user && <SuggestModal user={user} onClose={() => setShowSuggest(false)} onSubmit={submitSg} />}
    </div>
  );
}
