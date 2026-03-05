import { useState, useRef, useCallback, useEffect } from "react";
import * as Tone from "tone";

// ═══════════════════════════════════════════════════════════════
// LANDMARKS & SYMBOLS
// ═══════════════════════════════════════════════════════════════
const LANDMARKS = [
  { id:"desert",   emoji:"🏜️", name:"Sahara",        lat:23.42,  lon:25.66,   tier:1 },
  { id:"ocean",    emoji:"🌊", name:"Pacific",        lat:0,      lon:-160,    tier:1 },
  { id:"tundra",   emoji:"❄️", name:"Siberia",        lat:72,     lon:100,     tier:1 },
  { id:"beach",    emoji:"🏖️", name:"Copacabana",     lat:-22.97, lon:-43.18,  tier:2 },
  { id:"castle",   emoji:"🏰", name:"Neuschwanstein", lat:47.56,  lon:10.75,   tier:2 },
  { id:"forest",   emoji:"🌳", name:"Amazon",         lat:-3.47,  lon:-62.22,  tier:2 },
  { id:"liberty",  emoji:"🗽", name:"Liberty",        lat:40.69,  lon:-74.04,  tier:3 },
  { id:"torii",    emoji:"⛩️", name:"Fushimi",        lat:34.97,  lon:135.77,  tier:3 },
  { id:"taj",      emoji:"🕌", name:"Taj Mahal",      lat:27.18,  lon:78.04,   tier:4 },
  { id:"pyramid",  emoji:"🔺", name:"Giza",           lat:29.98,  lon:31.13,   tier:4 },
  { id:"eiffel",   emoji:"🗼", name:"Eiffel",         lat:48.86,  lon:2.29,    tier:5 },
  { id:"kremlin",  emoji:"🏛️", name:"Kremlin",        lat:55.75,  lon:37.62,   tier:5 },
  { id:"globe",    emoji:"🌍", name:"WILD",           lat:0,      lon:0,       tier:6 },
  { id:"plane",    emoji:"✈️", name:"FLIGHT",         lat:0,      lon:0,       tier:0 },
];
const SYM = Object.fromEntries(LANDMARKS.map(s=>[s.id,s]));
const REELS=4, ROWS=5, NLINES=8, TGT=0.965;
const PAYLINES=[[0,0,0,0],[1,1,1,1],[2,2,2,2],[3,3,3,3],[4,4,4,4],[0,1,2,3],[4,3,2,1],[1,2,3,2]];
const PT={desert:{3:4,4:10},ocean:{3:4,4:10},tundra:{3:4,4:10},beach:{3:6,4:20},castle:{3:6,4:20},forest:{3:6,4:20},liberty:{3:12,4:50},torii:{3:12,4:50},taj:{3:25,4:100},pyramid:{3:25,4:100},eiffel:{3:60,4:250},kremlin:{3:60,4:250},globe:{3:60,4:250}};
const SCAT_PAY={3:3,4:10};

// POIs for Haversine bonus
const BONUS_POIS=[
  {name:"Eiffel Tower",lat:48.858,lon:2.295,emoji:"🗼"},{name:"Great Pyramid",lat:29.979,lon:31.134,emoji:"🔺"},
  {name:"Statue of Liberty",lat:40.689,lon:-74.045,emoji:"🗽"},{name:"Taj Mahal",lat:27.175,lon:78.042,emoji:"🕌"},
  {name:"Colosseum",lat:41.890,lon:12.492,emoji:"🏟️"},{name:"Machu Picchu",lat:-13.163,lon:-72.545,emoji:"⛰️"},
  {name:"Great Wall",lat:40.432,lon:116.570,emoji:"🧱"},{name:"Petra",lat:30.329,lon:35.444,emoji:"🏺"},
  {name:"Stonehenge",lat:51.179,lon:-1.826,emoji:"🪨"},{name:"Mount Fuji",lat:35.361,lon:138.727,emoji:"🗻"},
  {name:"Grand Canyon",lat:36.107,lon:-112.113,emoji:"🏜️"},{name:"Victoria Falls",lat:-17.924,lon:25.857,emoji:"🌊"},
  {name:"Burj Khalifa",lat:25.197,lon:55.274,emoji:"🏙️"},{name:"Golden Gate",lat:37.820,lon:-122.478,emoji:"🌉"},
  {name:"Angkor Wat",lat:13.413,lon:103.867,emoji:"🛕"},{name:"Sydney Opera",lat:-33.857,lon:151.215,emoji:"🎭"},
  {name:"Christ Redeemer",lat:-22.952,lon:-43.211,emoji:"⛪"},{name:"Chichén Itzá",lat:20.684,lon:-88.568,emoji:"🛕"},
  {name:"Acropolis",lat:37.972,lon:23.726,emoji:"🏛️"},{name:"Everest",lat:27.988,lon:86.925,emoji:"🏔️"},
];

const ROUTE=[
  {city:"London",emoji:"🇬🇧",spins:3,chance:1.0},{city:"Paris",emoji:"🇫🇷",spins:4,chance:0.72},
  {city:"Istanbul",emoji:"🇹🇷",spins:5,chance:0.62},{city:"Mumbai",emoji:"🇮🇳",spins:6,chance:0.52},
  {city:"Hong Kong",emoji:"🇭🇰",spins:8,chance:0.44},{city:"Tokyo",emoji:"🇯🇵",spins:10,chance:0.38},
  {city:"San Francisco",emoji:"🇺🇸",spins:12,chance:0.32},{city:"New York",emoji:"🗽",spins:15,chance:0.28},
  {city:"London Return",emoji:"🏆",spins:20,chance:1.0},
];

// ═══════════════════════════════════════════════════════════════
// CORE MECHANICS
// ═══════════════════════════════════════════════════════════════
const STRIP_CFG={
  loose:{desert:6,ocean:6,tundra:5,beach:5,castle:5,forest:5,liberty:4,torii:4,taj:3,pyramid:3,eiffel:2,kremlin:2,globe:3,plane:2},
  standard:{desert:8,ocean:8,tundra:7,beach:6,castle:6,forest:5,liberty:4,torii:3,taj:2,pyramid:2,eiffel:2,kremlin:1,globe:2,plane:1},
  tight:{desert:10,ocean:10,tundra:9,beach:6,castle:6,forest:6,liberty:3,torii:3,taj:2,pyramid:2,eiffel:1,kremlin:1,globe:1,plane:1},
};
function bStrip(w){const s=[];for(const[id,c]of Object.entries(w))for(let i=0;i<c;i++)s.push(SYM[id]);for(let i=s.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[s[i],s[j]]=[s[j],s[i]];}return s;}
function bAll(){const s={};for(const[c,w]of Object.entries(STRIP_CFG)){s[c]=[];for(let r=0;r<REELS;r++)s[c].push(bStrip(w));}return s;}
function spinReels(strips){const g=[];for(let r=0;r<REELS;r++){const s=strips[r],p=Math.floor(Math.random()*s.length),c=[];for(let row=0;row<ROWS;row++)c.push(s[(p+row)%s.length]);g.push(c);}return g;}
function evalPL(grid,bpl){const w=[];for(let li=0;li<NLINES;li++){const line=PAYLINES[li],ls=line.map((r,i)=>grid[i][r]);let ms=null;for(const s of ls)if(s.id!=="globe"&&s.id!=="plane"){ms=s;break;}if(!ms){if(ls.every(s=>s.id==="globe"))ms=SYM.globe;else continue;}let c=0;for(const s of ls)if(s.id===ms.id||s.id==="globe")c++;else break;if(c>=3&&PT[ms.id]?.[c])w.push({li,sym:ms,c,pay:PT[ms.id][c]*bpl,pos:line.slice(0,c).map((r,i)=>({r:i,row:r}))});}return w;}

function haversine(lat1,lon1,lat2,lon2){const dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}

function checkBonus(lat,lon,radius){let best=null;for(const p of BONUS_POIS){const d=haversine(lat,lon,p.lat,p.lon);if(d<=radius&&(!best||d<best.dist))best={poi:p,dist:d};}return best;}
function nearestPOI(lat,lon){let best={poi:BONUS_POIS[0],dist:Infinity};for(const p of BONUS_POIS){const d=haversine(lat,lon,p.lat,p.lon);if(d<best.dist)best={poi:p,dist:d};}return best;}

function calcCorr(st){const{tW,tWn,hist,cL,cW,lB,sc}=st;const wins={s:hist.slice(-20),m:hist.slice(-100),l:hist.slice(-500),a:hist};const rw={};for(const[n,w]of Object.entries(wins)){if(!w.length){rw[n]=TGT;continue;}const wg=w.reduce((s,h)=>s+h[0],0);rw[n]=wg>0?w.reduce((s,h)=>s+h[1],0)/wg:TGT;}const wr=rw.s*0.1+rw.m*0.25+rw.l*0.35+rw.a*0.3,dev=wr-TGT,cb=(1/(1+Math.exp(-15*dev))-0.5)*2;let sm=0;const reasons=[];if(cL>12){sm-=0.15;reasons.push(`Drought(${cL})`);}else if(cL>6){sm-=0.08;reasons.push(`Losing(${cL})`);}if(cW>4){sm+=0.12;reasons.push(`Hot(${cW})`);}const ssb=sc-lB;if(ssb>120){sm-=0.06;reasons.push(`BonusDue(${ssb})`);}if(!reasons.length)reasons.push("Standard");const f=Math.max(-1,Math.min(1,cb+sm));return{cfg:f<-0.3?"loose":f>0.3?"tight":"standard",corr:f,dev,wr,rw,reasons};}

// Sound
let sInit=false,synth,bell,noise;
function initA(){if(sInit)return;try{synth=new Tone.PolySynth(Tone.Synth,{oscillator:{type:"triangle"},envelope:{attack:0.01,decay:0.2,sustain:0.1,release:0.3},volume:-18}).toDestination();bell=new Tone.PolySynth(Tone.Synth,{oscillator:{type:"sine"},envelope:{attack:0.005,decay:0.4,sustain:0,release:0.5},volume:-20}).toDestination();noise=new Tone.NoiseSynth({noise:{type:"pink"},envelope:{attack:0.001,decay:0.05,sustain:0,release:0.02},volume:-30}).toDestination();sInit=true;}catch(e){}}
function playWin(r){if(!sInit||r<=0)return;try{const n=Tone.now();if(r>=10){synth.triggerAttackRelease("C4","8n",n,.5);synth.triggerAttackRelease("E4","8n",n+.1,.5);synth.triggerAttackRelease("G4","8n",n+.2,.5);bell.triggerAttackRelease("C5","4n",n+.3,.4);}else if(r>=1){synth.triggerAttackRelease("E4","16n",n,.3);synth.triggerAttackRelease("G4","16n",n+.08,.3);}else{synth.triggerAttackRelease("C4","16n",n,.15);}}catch(e){}}
function playStop(i){if(!sInit)return;try{bell.triggerAttackRelease(["C3","D3","E3","F3"][i],"16n",Tone.now(),.3);noise.triggerAttackRelease("32n");}catch(e){}}
function playFanfare(){if(!sInit)return;try{const n=Tone.now();bell.triggerAttackRelease("G5","8n",n,.4);bell.triggerAttackRelease("B5","8n",n+.15,.4);bell.triggerAttackRelease("D6","4n",n+.3,.5);}catch(e){}}
function playGambleWin(){if(!sInit)return;try{synth.triggerAttackRelease("C5","8n",Tone.now(),.4);synth.triggerAttackRelease("G5","4n",Tone.now()+.15,.5);}catch(e){}}
function playGambleFail(){if(!sInit)return;try{synth.triggerAttackRelease("C3","4n",Tone.now(),.5);}catch(e){}}

const fCoord=(v,ns)=>`${Math.abs(v).toFixed(2)}°${v>=0?ns[0]:ns[1]}`;

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ATWI80D(){
  const [bal,setBal]=useState(1000);
  const [bet,setBet]=useState(1);
  const [tWag,setTWag]=useState(0);
  const [tWon,setTWon]=useState(0);
  const [grid,setGrid]=useState(()=>{const g=[],a=LANDMARKS.filter(s=>s.tier>0);for(let r=0;r<REELS;r++){const c=[];for(let row=0;row<ROWS;row++)c.push(a[Math.floor(Math.random()*a.length)]);g.push(c);}return g;});
  const [spinning,setSpinning]=useState(false);
  const [dispG,setDispG]=useState(null);
  const [lastWin,setLastWin]=useState(0);
  const [winLines,setWinLines]=useState([]);
  const [msg,setMsg]=useState("Chart your course, spin the globe");
  const [spinLat,setSpinLat]=useState(null);
  const [spinLon,setSpinLon]=useState(null);
  const [bonusHit,setBonusHit]=useState(null);
  const [nearMiss,setNearMiss]=useState(null);

  const [hist,setHist]=useState([]);
  const [spins,setSpins]=useState(0);
  const [cL,setCL]=useState(0);
  const [cW,setCW]=useState(0);
  const [lB,setLB]=useState(0);
  const [lastCorr,setLastCorr]=useState(null);
  const [dLog,setDLog]=useState([]);

  // Free spins
  const [fsLeft,setFsLeft]=useState(0);
  const [fsWins,setFsWins]=useState(0);

  // Bonus
  const [bonusActive,setBonusActive]=useState(false);
  const [bonusStop,setBonusStop]=useState(0);
  const [bonusSpins,setBonusSpins]=useState(0);
  const [bonusGambling,setBonusGambling]=useState(false);
  const [bonusResult,setBonusResult]=useState(null);
  const [bonusTrips,setBonusTrips]=useState(0);
  const [bonusSpinsTotal,setBonusSpinsTotal]=useState(0);

  // Dark patterns
  const [ldwOn,setLdwOn]=useState(true);
  const [stopOn,setStopOn]=useState(true);
  const [celebOn,setCelebOn]=useState(true);
  const [anticipOn,setAnticipOn]=useState(true);
  const [creditOn,setCreditOn]=useState(false);
  const [hideTime,setHideTime]=useState(false);
  const [hideCost,setHideCost]=useState(true);
  const [soundOn,setSoundOn]=useState(false);
  const [jpOn,setJpOn]=useState(true);
  const [fallacyOn,setFallacyOn]=useState(true);
  const [autoSpeedOn,setAutoSpeedOn]=useState(true);
  const [nmOn,setNmOn]=useState(true);

  const [jpPool,setJpPool]=useState(500);
  const [jpContrib,setJpContrib]=useState(0);
  const [fallacy,setFallacy]=useState({heat:{level:"⚡ TEMPERATE",color:"#c49a6c",value:0.5},bonusMeter:0,streakMsg:"Plotting course..."});
  const [dpStats,setDpStats]=useState({ldw:0,ldwLost:0,trueW:0,trueL:0,cFake:0,cReal:0,stops:0,anticip:0,start:Date.now(),mSpins:0,aSpins:0,mTime:0,aTime:0});
  const [showCeleb,setShowCeleb]=useState(false);
  const [celebMsg,setCelebMsg]=useState("");

  const [activeTab,setActiveTab]=useState("game");
  const [autoPlay,setAutoPlay]=useState(false);
  const stripsRef=useRef(bAll());
  const autoRef=useRef(false);
  const tmRef=useRef(null);
  const spinStart=useRef(0);
  const stopRef=useRef(false);

  useEffect(()=>{autoRef.current=autoPlay;},[autoPlay]);
  useEffect(()=>()=>{if(tmRef.current)clearTimeout(tmRef.current);},[]);
  useEffect(()=>{if(!jpOn)return;const t=setInterval(()=>setJpPool(p=>p+0.005*(0.5+Math.random())),900+Math.random()*500);return()=>clearInterval(t);},[jpOn]);

  const [elapsed,setElapsed]=useState(0);
  useEffect(()=>{const t=setInterval(()=>setElapsed(Date.now()-dpStats.start),1000);return()=>clearInterval(t);},[dpStats.start]);

  const fmtT=ms=>{const s=Math.floor(ms/1000),m=Math.floor(s/60),h=Math.floor(m/60);return`${h}:${String(m%60).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;};
  const fv=(a,c)=>c?`${Math.round(a*100).toLocaleString()} CR`:`£${a.toFixed(2)}`;
  const classify=(b,w)=>w<=0?"LOSS":w<b?"LDW":"WIN";
  const getCeleb=(w,b)=>{if(w<=0)return 0;if(!ldwOn&&w<b)return 0;const r=w/b;if(r>=20)return 5;if(r>=8)return 4;if(r>=2)return 3;if(r>=1)return 2;return 1;};

  // Bonus handlers
  function startBonus(poi){setBonusActive(true);setBonusStop(0);setBonusSpins(ROUTE[0].spins);setBonusGambling(false);setBonusResult(null);setBonusTrips(p=>p+1);if(soundOn)playFanfare();}
  function bonusCollect(){setFsLeft(bonusSpins);setFsWins(0);setBonusSpinsTotal(p=>p+bonusSpins);setBonusActive(false);setMsg(`✈️ Collected ${bonusSpins} free spins!`);}
  function bonusGamble(){
    const next=bonusStop+1;if(next>=ROUTE.length){bonusCollect();return;}
    setBonusGambling(true);
    setTimeout(()=>{
      const ok=Math.random()<ROUTE[next].chance;
      if(ok){const ns=bonusSpins+ROUTE[next].spins;setBonusStop(next);setBonusSpins(ns);setBonusResult("win");setMsg(`✈️ ${ROUTE[next].city}! ${ns} spins!`);if(soundOn)playGambleWin();if(next>=ROUTE.length-1)setTimeout(bonusCollect,1500);}
      else{setBonusResult("lose");setBonusSpins(0);setMsg(`💥 Crashed! Lost all spins!`);if(soundOn)playGambleFail();setTimeout(()=>setBonusActive(false),2500);}
      setBonusGambling(false);
    },1200);
  }

  // Main spin
  function finishSpin(finalGrid,totalWin,meta){
    const{sBet,ec,dec,bonus,isAuto,lat,lon,bHit,nm}=meta;
    const ns=spins+1;setSpins(ns);const ntw=tWon+totalWin;setTWon(ntw);
    setHist(p=>[...p,[sBet,totalWin]]);
    if(totalWin>0){setCW(p=>p+1);setCL(0);}else{setCL(p=>p+1);setCW(0);}
    setBal(b=>b+totalWin);
    setJpPool(p=>p+sBet*0.015);setJpContrib(p=>p+sBet*0.015);
    setSpinLat(lat);setSpinLon(lon);setBonusHit(bHit);setNearMiss(nm);

    const oc=classify(sBet,totalWin);const spinTime=Date.now()-spinStart.current;
    setDpStats(p=>{const u={...p};if(oc==="LDW"){u.ldw++;u.ldwLost+=sBet-totalWin;}else if(oc==="WIN")u.trueW++;else u.trueL++;if(isAuto){u.aSpins++;u.aTime+=spinTime;}else{u.mSpins++;u.mTime+=spinTime;}return u;});
    setFallacy({heat:cW>2?{level:"🔥 HOT ZONE",color:"#d4443c",value:0.8+Math.random()*0.2}:cL>5?{level:"❄️ DOLDRUMS",color:"#4488cc",value:0.1+Math.random()*0.1}:{level:"⚡ FAIR WINDS",color:"#c49a6c",value:0.4+Math.random()*0.2},bonusMeter:Math.min(0.95,(ns-lB)/150+Math.random()*0.1),streakMsg:cW>2?`${cW} discoveries! Lucky coordinates!`:cL>4?`${cL} empty seas... land ahead?`:"Scanning horizon..."});

    const cl=getCeleb(totalWin,sBet);
    if(cl>0&&celebOn){setShowCeleb(true);setDpStats(p=>({...p,[totalWin<sBet?"cFake":"cReal"]:p[totalWin<sBet?"cFake":"cReal"]+1}));setCelebMsg(cl>=5?"🌍 WORLD WONDER! 🌍":cl>=4?"⭐ LANDMARK! ⭐":cl>=3?"Great Discovery!":cl>=2?`+${fv(totalWin,creditOn)}`:`+${fv(totalWin,creditOn)}`);setTimeout(()=>setShowCeleb(false),cl>=4?2500:1000);}else setShowCeleb(false);
    if(soundOn&&totalWin>0)playWin(totalWin/sBet);

    if(bHit&&fsLeft===0){setLB(ns);startBonus(bHit.poi);}
    else if(fsLeft>0){const r=fsLeft-1;setFsLeft(r);setFsWins(p=>p+totalWin);if(r===0)setMsg(`Journey complete! Won ${fv(fsWins+totalWin,creditOn)}`);else setMsg(`Free voyage — ${r} left`);}
    else if(totalWin>0){if(!ldwOn&&totalWin<sBet)setMsg(`${fv(totalWin,creditOn)} (NET: -${fv(sBet-totalWin,false)})`);else setMsg(`WIN ${fv(totalWin,creditOn)}`);}
    else{if(celebOn)setMsg("");else setMsg(`Lost ${fv(sBet,creditOn)}`);}

    setLastWin(totalWin);setDLog(p=>[{spin:ns,cfg:ec,rtp:(tWag+sBet)>0?((ntw/(tWag+sBet))*100).toFixed(2)+"%":"—",won:totalWin,type:oc},...p].slice(0,30));
    setSpinning(false);

    const delay=autoSpeedOn&&isAuto?350:900;
    if(autoRef.current&&fsLeft>1&&!bHit)tmRef.current=setTimeout(()=>{if(autoRef.current)mainSpin(true);},delay);
    else if(autoRef.current&&!bHit&&bal+totalWin>=sBet)tmRef.current=setTimeout(()=>{if(autoRef.current)mainSpin(true);},delay);
    else if(autoRef.current)setAutoPlay(false);
  }

  const mainSpin=useCallback((isAuto=false)=>{
    if(spinning||bonusActive)return;
    const cBet=fsLeft>0?0:bet,bpl=bet/NLINES;
    if(fsLeft===0&&bal<bet){setMsg("⛽ Insufficient fuel!");return;}
    if(soundOn&&!sInit)Tone.start().then(()=>initA());
    spinStart.current=Date.now();setSpinning(true);setWinLines([]);setLastWin(0);setShowCeleb(false);stopRef.current=false;setBonusHit(null);setNearMiss(null);
    if(fsLeft===0)setBal(b=>b-bet);
    const nw=tWag+bet;setTWag(nw);
    const est={tW:nw,tWn:tWon,hist,cL,cW,lB,sc:spins};
    const dec=calcCorr(est);setLastCorr(dec);
    let ec=dec.cfg;const ssb=spins-lB;if(ssb>100&&ec==="tight")ec="standard";if(ssb>160)ec="loose";
    const rawGrid=spinReels(stripsRef.current[ec]);
    const w0=evalPL(rawGrid,bpl);const isWin=w0.length>0;

    // Haversine bonus
    const lat=Math.random()*180-90,lon=Math.random()*360-180;
    const radius=150*(1-dec.corr*0.6);
    const bHit=checkBonus(lat,lon,Math.max(45,Math.min(300,radius)));
    const nm=!bHit&&nmOn?nearestPOI(lat,lon):null;

    let totalWin=w0.reduce((s,x)=>s+x.pay,0)+(bHit?SCAT_PAY[3]*bet:0);
    if(totalWin>0&&Math.random()<0.03){const m=[2,3,5][Math.floor(Math.random()*3)];totalWin*=m;}

    // Anticipation delays
    let delays=[0,0,0,0];
    if(anticipOn){let sc=0;for(let r=0;r<REELS;r++){for(let row=0;row<ROWS;row++)if(rawGrid[r][row].id==="plane")sc++;if(sc>=1&&r>=1)delays[r]=sc*3;}}
    if(delays.some(d=>d>0))setDpStats(p=>({...p,anticip:p.anticip+1}));

    const allS=LANDMARKS.filter(s=>s.tier>0||s.id==="plane");
    let cycles=0;const speedM=autoSpeedOn&&isAuto?0.6:1;
    const baseMax=Math.floor((7+Math.floor(Math.random()*3))*speedM);
    const reelStop=Array.from({length:REELS},(_,r)=>Math.floor((baseMax-(REELS-1-r)*2+delays[r])*speedM));
    const maxCyc=Math.max(...reelStop)+2;
    const intv=autoSpeedOn&&isAuto?50:70;

    const animT=setInterval(()=>{
      cycles++;
      if(stopRef.current){clearInterval(animT);setDispG(null);setGrid(rawGrid);setWinLines(w0);finishSpin(rawGrid,totalWin,{sBet:bet,ec,dec,bonus:{triggered:!!bHit},isAuto,lat,lon,bHit,nm});return;}
      for(let r=0;r<REELS;r++)if(cycles===reelStop[r]&&soundOn)playStop(r);
      const ag=Array.from({length:REELS},(_,r)=>{if(cycles>=reelStop[r])return rawGrid[r];return Array.from({length:ROWS},()=>allS[Math.floor(Math.random()*allS.length)]);});
      setDispG(ag);
      if(cycles>=maxCyc){clearInterval(animT);setDispG(null);setGrid(rawGrid);setWinLines(w0);finishSpin(rawGrid,totalWin,{sBet:bet,ec,dec,bonus:{triggered:!!bHit},isAuto,lat,lon,bHit,nm});}
    },intv);
  },[spinning,bonusActive,bet,bal,tWag,tWon,hist,cL,cW,lB,spins,fsLeft,fsWins,nmOn,ldwOn,celebOn,anticipOn,creditOn,soundOn,autoSpeedOn,jpOn,jpPool]);

  const dg=dispG||grid;
  const hl=new Set();winLines.forEach(w=>w.pos.forEach(p=>hl.add(`${p.r}-${p.row}`)));
  const artRTP=tWag>0?(tWon/tWag*100).toFixed(2):"—";
  const dpCount=[ldwOn,stopOn,celebOn,anticipOn,creditOn,hideTime,hideCost,soundOn,jpOn,fallacyOn,autoSpeedOn].filter(Boolean).length;
  const mSPM=dpStats.mTime>10000?(dpStats.mSpins/(dpStats.mTime/60000)).toFixed(1):"—";
  const aSPM=dpStats.aTime>10000?(dpStats.aSpins/(dpStats.aTime/60000)).toFixed(1):"—";

  // ── Colour palette: vintage cartographic ──
  const C={bg:"#0a1520",card:"#0d1e2d",brass:"#c49a6c",gold:"#d4a574",cream:"#f5e6c8",sea:"#1a3a52",win:"#4ecdc4",lose:"#e74c3c",line:"rgba(196,154,108,0.12)",lineActive:"rgba(196,154,108,0.35)"};

  const tabS=t=>({flex:1,padding:"6px 2px",fontSize:"0.5rem",fontWeight:activeTab===t?"bold":"normal",background:activeTab===t?C.line:"transparent",border:activeTab===t?`1px solid ${C.brass}44`:`1px solid ${C.brass}15`,borderBottom:activeTab===t?"none":undefined,color:activeTab===t?C.brass:"#445566",cursor:"pointer",fontFamily:"inherit",borderRadius:"4px 4px 0 0"});

  return(
    <div style={{minHeight:"100vh",background:`linear-gradient(170deg, ${C.bg} 0%, #0f2233 40%, ${C.bg} 100%)`,color:C.cream,fontFamily:"Georgia, 'Times New Roman', serif",display:"flex",flexDirection:"column",alignItems:"center",padding:"8px",gap:"5px"}}>

      {/* ── HEADER ── */}
      <div style={{textAlign:"center",position:"relative"}}>
        <div style={{fontSize:"0.5rem",letterSpacing:"6px",color:C.brass,opacity:0.5}}>⸻ PHILEAS FOGG'S ⸻</div>
        <h1 style={{fontSize:"1.3rem",fontWeight:"normal",margin:"2px 0",letterSpacing:"3px",color:C.cream,fontStyle:"italic",textShadow:`0 0 30px ${C.brass}33`}}>Around the World in 80 Days</h1>
        <div style={{fontSize:"0.42rem",color:"#556677",letterSpacing:"2px",fontFamily:"'Courier New',monospace"}}>{dpCount}/11 MECHANISMS │ {NLINES} PAYLINES │ {REELS}×{ROWS} GRID │ {(TGT*100).toFixed(1)}% RTP</div>
      </div>

      {/* ── JACKPOT ── */}
      {jpOn&&<div style={{width:"100%",maxWidth:580,background:`linear-gradient(90deg, ${C.sea}44, ${C.brass}15, ${C.sea}44)`,border:`1px solid ${C.brass}33`,borderRadius:6,padding:"3px 10px",textAlign:"center"}}>
        <div style={{fontSize:"0.4rem",color:C.brass,letterSpacing:"3px",opacity:0.6}}>★ CIRCUMNAVIGATION PRIZE ★</div>
        <div style={{fontSize:"1rem",fontWeight:"bold",color:C.gold,fontVariantNumeric:"tabular-nums"}}>{fv(jpPool,creditOn)}</div>
      </div>}

      {/* ── FALLACY INDICATORS ── */}
      {fallacyOn&&<div style={{display:"flex",gap:4,width:"100%",maxWidth:580}}>
        <div style={{flex:1,background:C.card,borderRadius:4,padding:"3px 6px",fontSize:"0.45rem",border:`1px solid ${C.brass}15`}}>
          <div style={{color:fallacy.heat.color,fontWeight:"bold"}}>{fallacy.heat.level}</div>
          <div style={{height:3,background:`${C.brass}15`,borderRadius:2,marginTop:2}}><div style={{width:`${fallacy.heat.value*100}%`,height:"100%",background:fallacy.heat.color,borderRadius:2,transition:"width 0.5s"}}/></div>
        </div>
        <div style={{flex:1,background:C.card,borderRadius:4,padding:"3px 6px",fontSize:"0.45rem",border:`1px solid ${C.brass}15`}}>
          <div style={{color:fallacy.bonusMeter>0.7?C.lose:"#778"}}>FLIGHT: {fallacy.bonusMeter>0.7?"⚠ BOARDING!":Math.round(fallacy.bonusMeter*100)+"%"}</div>
          <div style={{height:3,background:`${C.brass}15`,borderRadius:2,marginTop:2}}><div style={{width:`${fallacy.bonusMeter*100}%`,height:"100%",background:fallacy.bonusMeter>0.7?C.lose:C.brass,borderRadius:2,transition:"width 0.5s"}}/></div>
        </div>
        <div style={{flex:1.3,background:C.card,borderRadius:4,padding:"3px 6px",fontSize:"0.42rem",color:"#778899",display:"flex",alignItems:"center",border:`1px solid ${C.brass}15`}}>{fallacy.streakMsg}</div>
      </div>}

      {!hideTime&&<div style={{fontSize:"0.45rem",color:"#556",fontFamily:"'Courier New',monospace"}}>⏱ {fmtT(elapsed)} │ {spins} voyages │ Net: <span style={{color:tWon-tWag>=0?C.win:C.lose}}>{fv(tWon-tWag,false)}</span></div>}

      {/* ── BALANCE BAR ── */}
      <div style={{display:"flex",justifyContent:"space-between",width:"100%",maxWidth:580,background:C.card,border:`1px solid ${C.brass}20`,borderRadius:6,padding:"5px 14px",fontSize:"0.7rem"}}>
        <div><span style={{color:"#556",fontSize:"0.42rem",fontFamily:"'Courier New',monospace"}}>TREASURY</span><br/><span style={{color:C.gold,fontWeight:"bold"}}>{fv(bal,creditOn)}</span></div>
        <div style={{textAlign:"center"}}><span style={{color:"#556",fontSize:"0.42rem",fontFamily:"'Courier New',monospace"}}>{hideCost?"PER LINE":"WAGER"}</span><br/><span style={{color:"#e8a87c",fontWeight:"bold"}}>{hideCost?fv(bet/NLINES,creditOn):fv(bet,creditOn)}</span></div>
        <div style={{textAlign:"center"}}><span style={{color:"#556",fontSize:"0.42rem",fontFamily:"'Courier New',monospace"}}>RETURN</span><br/><span style={{fontWeight:"bold",color:tWag>0&&Math.abs(tWon/tWag-TGT)<0.02?C.win:"#e8a87c"}}>{artRTP}%</span></div>
        <div style={{textAlign:"right"}}><span style={{color:"#556",fontSize:"0.42rem",fontFamily:"'Courier New',monospace"}}>PRIZE</span><br/><span style={{color:lastWin>0?C.win:"#445",fontWeight:"bold"}}>{fv(lastWin,creditOn)}</span></div>
      </div>

      {fsLeft>0&&<div style={{background:`linear-gradient(90deg, #1a3355, #224466, #1a3355)`,color:"#fff",padding:"3px 12px",borderRadius:6,fontSize:"0.65rem",fontWeight:"bold",textAlign:"center",width:"100%",maxWidth:580,boxSizing:"border-box"}}>✈️ FREE VOYAGE: {fsLeft} remaining │ Won: {fv(fsWins,creditOn)}</div>}

      {/* ── CELEBRATION ── */}
      {showCeleb&&getCeleb(lastWin,bet)>=3&&<div style={{position:"fixed",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:100,pointerEvents:"none",background:getCeleb(lastWin,bet)>=5?`${C.brass}0a`:"transparent"}}><div style={{fontSize:getCeleb(lastWin,bet)>=5?"1.6rem":"1.1rem",fontWeight:"bold",color:C.gold,textShadow:`0 0 30px ${C.brass}`,fontStyle:"italic"}}>{celebMsg}</div>{!ldwOn&&lastWin>0&&lastWin<bet&&<div style={{color:"#e8a87c",fontSize:"0.5rem",marginTop:4,background:"rgba(232,168,124,0.1)",padding:"2px 8px",borderRadius:4}}>⚠ LDW: net -{fv(bet-lastWin,false)}</div>}</div>}

      {/* ══════════ AROUND THE WORLD BONUS ══════════ */}
      {bonusActive&&<div style={{width:"100%",maxWidth:580,background:`linear-gradient(180deg, #0d2233, ${C.card})`,border:`2px solid ${C.brass}55`,borderRadius:10,padding:14,boxSizing:"border-box"}}>
        <div style={{textAlign:"center",fontWeight:"bold",color:C.gold,fontSize:"0.8rem",marginBottom:10,fontStyle:"italic",letterSpacing:"1px"}}>✈️ Around the World in 80 Days ✈️</div>
        <div style={{display:"flex",gap:3,marginBottom:10,overflowX:"auto",paddingBottom:4}}>
          {ROUTE.map((s,i)=><div key={i} style={{flex:"0 0 auto",width:54,textAlign:"center",padding:"4px 2px",borderRadius:6,background:i<bonusStop?`${C.win}15`:i===bonusStop?`${C.brass}20`:`${C.brass}08`,border:i===bonusStop?`2px solid ${C.brass}`:i<bonusStop?`1px solid ${C.win}44`:`1px solid ${C.brass}15`,opacity:i>bonusStop+1?0.35:1,transition:"all 0.3s"}}>
            <div style={{fontSize:"1.1rem"}}>{s.emoji}</div>
            <div style={{fontSize:"0.38rem",color:i===bonusStop?C.gold:"#668"}}>{s.city}</div>
            <div style={{fontSize:"0.45rem",color:C.win,fontWeight:"bold"}}>+{s.spins}</div>
            {i>0&&i<ROUTE.length-1&&<div style={{fontSize:"0.35rem",color:i<=bonusStop?"#556":"#e8a87c"}}>{Math.round(s.chance*100)}%</div>}
          </div>)}
        </div>
        <div style={{textAlign:"center",marginBottom:8}}>
          <div style={{fontSize:"1.1rem",fontWeight:"bold",color:C.win}}>{bonusSpins} FREE SPINS</div>
          <div style={{fontSize:"0.48rem",color:"#778"}}>📍 {ROUTE[bonusStop].city}</div>
        </div>
        {bonusResult==="win"&&<div style={{textAlign:"center",color:C.win,fontWeight:"bold",fontSize:"0.7rem",marginBottom:6}}>✅ SAFE LANDING!</div>}
        {bonusResult==="lose"&&<div style={{textAlign:"center",color:C.lose,fontWeight:"bold",fontSize:"0.7rem",marginBottom:6}}>💥 SHIPWRECKED!</div>}
        {!bonusGambling&&bonusResult!=="lose"&&bonusStop<ROUTE.length-1&&<div style={{display:"flex",gap:8}}>
          <button onClick={bonusCollect} style={{flex:1,padding:"10px",borderRadius:6,border:`2px solid ${C.win}`,background:`${C.win}12`,color:C.win,fontWeight:"bold",fontSize:"0.7rem",cursor:"pointer",fontFamily:"inherit"}}>COLLECT {bonusSpins} SPINS</button>
          <button onClick={bonusGamble} style={{flex:1,padding:"10px",borderRadius:6,border:"2px solid #e8a87c",background:"rgba(232,168,124,0.08)",color:"#e8a87c",fontWeight:"bold",fontSize:"0.7rem",cursor:"pointer",fontFamily:"inherit"}}>GAMBLE → {ROUTE[bonusStop+1]?.city} ({Math.round((ROUTE[bonusStop+1]?.chance||0)*100)}%)</button>
        </div>}
        {bonusGambling&&<div style={{textAlign:"center",color:C.gold,fontWeight:"bold",fontSize:"0.75rem",padding:10,fontStyle:"italic"}}>✈️ Sailing to {ROUTE[bonusStop+1]?.city}... 🎲</div>}
        {!bonusGambling&&bonusStop>0&&bonusStop<ROUTE.length-1&&<div style={{textAlign:"center",marginTop:6,fontSize:"0.4rem",color:"#556",fontFamily:"'Courier New',monospace"}}>EV: gamble={Math.round((ROUTE[bonusStop+1]?.chance||0)*(bonusSpins+(ROUTE[bonusStop+1]?.spins||0)))} vs collect={bonusSpins} {(ROUTE[bonusStop+1]?.chance||0)*(bonusSpins+(ROUTE[bonusStop+1]?.spins||0))>bonusSpins?"[+EV]":"[-EV]"}</div>}
      </div>}

      {/* ══════════ REEL GRID (4×5) ══════════ */}
      <div style={{background:`linear-gradient(180deg, ${C.sea}88, ${C.card})`,border:`2px solid ${C.brass}33`,borderRadius:10,padding:"8px",width:"100%",maxWidth:580,boxSizing:"border-box",position:"relative",boxShadow:`inset 0 0 40px rgba(0,0,0,0.4), 0 0 20px ${C.brass}08`}}>
        {showCeleb&&getCeleb(lastWin,bet)>0&&getCeleb(lastWin,bet)<3&&<div style={{textAlign:"center",color:C.gold,fontWeight:"bold",fontSize:"0.65rem",marginBottom:3,fontStyle:"italic"}}>{celebMsg}</div>}
        <div style={{display:"grid",gridTemplateColumns:`repeat(${REELS}, 1fr)`,gap:3}}>
          {Array.from({length:ROWS}).map((_,row)=>Array.from({length:REELS}).map((_,reel)=>{
            const sym=dg[reel]?.[row]||SYM.desert;const isW=hl.has(`${reel}-${row}`);
            return(<div key={`${reel}-${row}`} style={{background:isW?`radial-gradient(circle, ${C.win}18, ${C.win}04)`:`linear-gradient(180deg, rgba(13,30,45,0.8), rgba(10,21,32,0.9))`,border:isW?`2px solid ${C.win}`:`1px solid ${C.brass}18`,borderRadius:6,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:52,transition:"all 0.25s",boxShadow:isW?`0 0 12px ${C.win}33`:"none"}}>
              <div style={{fontSize:"1.3rem",lineHeight:1}}>{sym.emoji}</div>
              <div style={{fontSize:"0.35rem",color:`${C.brass}88`,marginTop:1,fontFamily:"'Courier New',monospace"}}>{sym.name}</div>
            </div>);
          })).flat()}
        </div>

        {/* Coordinate readout */}
        {spinLat!==null&&<div style={{display:"flex",justifyContent:"center",gap:12,marginTop:6,padding:"4px 8px",background:`${C.brass}08`,borderRadius:4,border:`1px solid ${C.brass}15`}}>
          <div style={{fontSize:"0.5rem",fontFamily:"'Courier New',monospace",color:C.brass}}>📍 {fCoord(spinLat,"NS")} {fCoord(spinLon,"EW")}</div>
          {bonusHit&&<div style={{fontSize:"0.5rem",color:C.win,fontWeight:"bold"}}>✈️ {bonusHit.poi.name}! ({bonusHit.dist.toFixed(0)}km)</div>}
          {!bonusHit&&nearMiss&&nmOn&&nearMiss.dist<500&&<div style={{fontSize:"0.45rem",color:"#e8a87c"}}>👁 {nearMiss.poi.emoji} {nearMiss.poi.name} only {nearMiss.dist.toFixed(0)}km away!</div>}
        </div>}
      </div>

      {/* MESSAGE */}
      <div style={{fontSize:"0.7rem",fontWeight:"bold",textAlign:"center",minHeight:18,color:lastWin>0?C.win:msg.includes("FREE")||msg.includes("✈️")?C.gold:"#667788",fontStyle:"italic"}}>{msg}</div>

      {/* ── CONTROLS ── */}
      <div style={{display:"flex",gap:3,width:"100%",maxWidth:580}}>
        {[0.20,0.50,1,2,5,10].map(b=><button key={b} onClick={()=>setBet(b)} disabled={spinning||bonusActive} style={{flex:1,background:bet===b?`${C.brass}20`:"transparent",border:bet===b?`1px solid ${C.brass}55`:`1px solid ${C.brass}15`,color:bet===b?C.gold:"#556",borderRadius:4,padding:"3px 2px",fontSize:"0.52rem",cursor:"pointer",fontFamily:"inherit"}}>{hideCost?fv(b/NLINES,creditOn):fv(b,creditOn)}</button>)}
      </div>
      <div style={{display:"flex",gap:4,width:"100%",maxWidth:580}}>
        <button onClick={()=>mainSpin(false)} disabled={spinning||bonusActive||(fsLeft===0&&bal<bet)} style={{flex:2,background:spinning?"rgba(50,50,60,0.3)":fsLeft>0?`linear-gradient(180deg, ${C.sea}, #0d1e2d)`:`linear-gradient(180deg, ${C.brass}, #8b6914)`,border:"none",borderRadius:6,padding:"11px",fontSize:"0.9rem",fontWeight:"bold",color:spinning?"#445":"#0a1520",cursor:spinning?"not-allowed":"pointer",fontFamily:"Georgia, serif",letterSpacing:"2px",fontStyle:"italic"}}>{spinning?"...":fsLeft>0?`✈️ FREE (${fsLeft})`:"🌍 Spin the Globe"}</button>
        {stopOn&&<button onClick={()=>{if(spinning){stopRef.current=true;setDpStats(p=>({...p,stops:p.stops+1}));}}} disabled={!spinning} style={{flex:0.5,background:spinning?`${C.lose}15`:"transparent",border:spinning?`1px solid ${C.lose}`:`1px solid ${C.brass}15`,borderRadius:6,padding:"11px 3px",fontSize:"0.55rem",fontWeight:"bold",color:spinning?C.lose:"#334",cursor:spinning?"pointer":"default",fontFamily:"inherit"}}>HALT</button>}
        <button onClick={()=>{setAutoPlay(!autoPlay);if(autoPlay)autoRef.current=false;}} disabled={bonusActive} style={{flex:0.5,background:autoPlay?`${C.lose}12`:"transparent",border:autoPlay?`1px solid ${C.lose}`:`1px solid ${C.brass}15`,borderRadius:6,padding:"11px 2px",fontSize:"0.45rem",color:autoPlay?C.lose:"#556",cursor:"pointer",fontFamily:"inherit"}}>{autoPlay?"■":"▶"}</button>
      </div>

      {/* UTILITY */}
      <div style={{display:"flex",gap:3,width:"100%",maxWidth:580,fontSize:"0.48rem"}}>
        <button onClick={()=>setNmOn(!nmOn)} style={{flex:1,padding:"3px",borderRadius:3,fontFamily:"inherit",cursor:"pointer",background:nmOn?`${C.brass}10`:"transparent",border:`1px solid ${C.brass}${nmOn?"25":"10"}`,color:nmOn?C.brass:"#445"}}>👁{nmOn?" ON":" OFF"}</button>
        <button onClick={()=>{setBal(1000);setTWag(0);setTWon(0);setHist([]);setSpins(0);setCL(0);setCW(0);setLB(0);setLastCorr(null);setDLog([]);setFsLeft(0);setFsWins(0);setAutoPlay(false);setBonusActive(false);setJpPool(500);setJpContrib(0);setSpinLat(null);setBonusHit(null);setNearMiss(null);setDpStats({ldw:0,ldwLost:0,trueW:0,trueL:0,cFake:0,cReal:0,stops:0,anticip:0,start:Date.now(),mSpins:0,aSpins:0,mTime:0,aTime:0});setMsg("Chart your course, spin the globe");stripsRef.current=bAll();}} style={{padding:"3px 8px",borderRadius:3,fontFamily:"inherit",cursor:"pointer",background:`${C.lose}08`,border:`1px solid ${C.lose}20`,color:C.lose}}>↺ RESET</button>
      </div>

      {/* ── TABS ── */}
      <div style={{display:"flex",width:"100%",maxWidth:580,gap:1}}>
        {[["game","🌍 LOG"],["bonus","✈️ ROUTE"],["darkpat","🧠 DARK"],["engine","⚙️ ENGINE"]].map(([t,l])=><button key={t} onClick={()=>setActiveTab(t)} style={tabS(t)}>{l}</button>)}
      </div>
      <div style={{width:"100%",maxWidth:580,boxSizing:"border-box",background:C.card,border:`1px solid ${C.brass}10`,borderTop:"none",borderRadius:"0 0 6px 6px",padding:10,fontSize:"0.55rem",lineHeight:1.5,minHeight:120,fontFamily:"'Courier New',monospace"}}>

        {activeTab==="game"&&<div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1px 12px"}}>
            <span style={{color:"#556"}}>Wagered:</span><span>{fv(tWag,creditOn)}</span>
            <span style={{color:"#556"}}>Returned:</span><span>{fv(tWon,creditOn)}</span>
            <span style={{color:"#556"}}>Net:</span><span style={{color:tWon-tWag>=0?C.win:C.lose}}>{fv(tWon-tWag,false)}</span>
            <span style={{color:"#556"}}>Voyages:</span><span>{spins}</span>
            <span style={{color:"#556"}}>LDW rate:</span><span style={{color:"#e8a87c"}}>{spins>0?((dpStats.ldw/spins)*100).toFixed(1):0}%</span>
            <span style={{color:"#556"}}>True win rate:</span><span style={{color:C.win}}>{spins>0?((dpStats.trueW/spins)*100).toFixed(1):0}%</span>
            <span style={{color:"#556"}}>Expeditions:</span><span>{bonusTrips}</span>
            <span style={{color:"#556"}}>Bonus spins:</span><span>{bonusSpinsTotal}</span>
            <span style={{color:"#556"}}>Manual/Auto:</span><span>{mSPM}/{aSPM} spm</span>
          </div>
          <div style={{marginTop:4,maxHeight:70,overflowY:"auto",fontSize:"0.45rem"}}>
            {dLog.slice(0,10).map((e,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"1px 0",borderBottom:`1px solid ${C.brass}08`}}>
              <span style={{color:"#334"}}>#{e.spin}</span>
              <span style={{color:e.cfg==="loose"?C.win:e.cfg==="tight"?C.lose:C.brass}}>{e.cfg}</span>
              <span style={{color:e.type==="LDW"?"#e8a87c":e.type==="WIN"?C.win:C.lose}}>{e.type}</span>
              <span style={{color:e.won>0?C.win:"#334"}}>{fv(e.won,creditOn)}</span>
            </div>)}
          </div>
        </div>}

        {activeTab==="bonus"&&<div>
          <div style={{color:C.gold,fontWeight:"bold",marginBottom:4,fontFamily:"Georgia,serif",fontStyle:"italic"}}>✈️ The Route of Phileas Fogg</div>
          <div style={{background:`${C.brass}06`,borderRadius:4,padding:6,marginBottom:6,fontSize:"0.47rem",color:"#778",lineHeight:1.4}}>3+ ✈️ planes on the grid → bonus trigger. Then travel the world: each city awards free spins. COLLECT safely or GAMBLE to continue. Odds decrease as you go. Lose the gamble = lose ALL accumulated spins.</div>
          {ROUTE.map((s,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"2px 0",borderBottom:`1px solid ${C.brass}08`,fontSize:"0.48rem"}}>
            <span>{s.emoji} {s.city}</span><span style={{color:C.win}}>+{s.spins}</span><span style={{color:s.chance<0.4?C.lose:s.chance<0.6?"#e8a87c":C.win}}>{i===0||i===ROUTE.length-1?"AUTO":`${Math.round(s.chance*100)}%`}</span>
          </div>)}
          <div style={{marginTop:6,fontSize:"0.45rem",color:"#556"}}>Expeditions: {bonusTrips} │ Bonus spins won: {bonusSpinsTotal}</div>
        </div>}

        {activeTab==="darkpat"&&<div>
          <div style={{color:C.lose,fontWeight:"bold",marginBottom:4,fontFamily:"Georgia,serif"}}>🧠 Mechanisms ({dpCount}/11)</div>
          <div style={{display:"flex",gap:3,marginBottom:6}}>
            <button onClick={()=>{setLdwOn(true);setStopOn(true);setCelebOn(true);setAnticipOn(true);setCreditOn(true);setHideTime(true);setHideCost(true);setSoundOn(true);setJpOn(true);setFallacyOn(true);setAutoSpeedOn(true);Tone.start().then(()=>initA());}} style={{flex:1,padding:"4px",borderRadius:4,background:`${C.lose}08`,border:`1px solid ${C.lose}25`,color:C.lose,cursor:"pointer",fontFamily:"inherit",fontSize:"0.45rem",fontWeight:"bold"}}>🎰 CASINO</button>
            <button onClick={()=>{setLdwOn(false);setStopOn(false);setCelebOn(false);setAnticipOn(false);setCreditOn(false);setHideTime(false);setHideCost(false);setSoundOn(false);setJpOn(false);setFallacyOn(false);setAutoSpeedOn(false);}} style={{flex:1,padding:"4px",borderRadius:4,background:`${C.win}08`,border:`1px solid ${C.win}20`,color:C.win,cursor:"pointer",fontFamily:"inherit",fontSize:"0.45rem",fontWeight:"bold"}}>✅ HONEST</button>
          </div>
          <div style={{display:"grid",gap:3,maxHeight:220,overflowY:"auto"}}>
            {[
              {on:ldwOn,set:setLdwOn,label:"Loss Disguised as Win",color:"#e8a87c",stat:`${dpStats.ldw} LDWs, -${fv(dpStats.ldwLost,false)}`},
              {on:stopOn,set:setStopOn,label:"Halt Button Illusion",color:C.lose,stat:`${dpStats.stops} presses, 0 effect`},
              {on:celebOn,set:setCelebOn,label:"Celebration Asymmetry",color:C.gold,stat:`${dpStats.cFake} fake / ${dpStats.cReal} real`},
              {on:anticipOn,set:setAnticipOn,label:"Reel Anticipation",color:"#cc44cc",stat:`${dpStats.anticip} slowdowns`},
              {on:creditOn,set:setCreditOn,label:"Credit Obfuscation",color:"#4488cc",stat:creditOn?"Credits":"Currency"},
              {on:hideTime,set:setHideTime,label:"Time Dissolution",color:"#cc44cc",stat:fmtT(elapsed)},
              {on:hideCost,set:setHideCost,label:"Wager Hiding",color:C.win,stat:`True: ${fv(bet,false)}/spin`},
              {on:soundOn,set:v=>{setSoundOn(v);if(v)Tone.start().then(()=>initA());},label:"Asymmetric Sound",color:"#cc6633",stat:"Win=music, Loss=silence"},
              {on:jpOn,set:setJpOn,label:"Progressive Jackpot",color:"#cc3366",stat:`Pool: ${fv(jpPool,false)}`},
              {on:fallacyOn,set:setFallacyOn,label:"Gambler's Fallacy",color:"#6633cc",stat:"Fake indicators"},
              {on:autoSpeedOn,set:setAutoSpeedOn,label:"Autoplay Acceleration",color:"#cc9933",stat:`${mSPM}/${aSPM} spm`},
            ].map((dp,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 6px",borderRadius:4,background:dp.on?`${dp.color}08`:"transparent",border:`1px solid ${dp.on?dp.color+"22":C.brass+"08"}`}}>
              <button onClick={()=>dp.set(!dp.on)} style={{width:28,height:14,borderRadius:7,border:"none",cursor:"pointer",background:dp.on?dp.color:`${C.brass}20`,position:"relative",flexShrink:0}}><div style={{width:10,height:10,borderRadius:"50%",background:C.cream,position:"absolute",top:2,left:dp.on?16:2,transition:"left 0.2s"}}/></button>
              <div style={{flex:1}}><div style={{fontWeight:"bold",color:dp.on?dp.color:"#445",fontSize:"0.48rem"}}>{dp.label}</div><div style={{fontSize:"0.4rem",color:"#445"}}>{dp.stat}</div></div>
            </div>)}
          </div>
        </div>}

        {activeTab==="engine"&&lastCorr&&<div>
          <div style={{color:C.brass,fontWeight:"bold",marginBottom:4,fontFamily:"Georgia,serif"}}>⚙️ RTP Correction Engine</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1px 12px"}}>
            <span style={{color:"#556"}}>Config:</span><span style={{color:lastCorr.cfg==="loose"?C.win:lastCorr.cfg==="tight"?C.lose:C.brass,fontWeight:"bold"}}>{lastCorr.cfg.toUpperCase()}</span>
            <span style={{color:"#556"}}>Correction:</span><span>{lastCorr.corr.toFixed(4)}</span>
            <span style={{color:"#556"}}>Deviation:</span><span>{(lastCorr.dev*100).toFixed(3)}%</span>
          </div>
          {Object.entries(lastCorr.rw).map(([n,r])=><div key={n} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:2}}>
            <span style={{color:"#556",width:25,fontSize:"0.48rem"}}>{n}</span>
            <div style={{width:60,height:3,background:`${C.brass}12`,borderRadius:1,position:"relative"}}><div style={{position:"absolute",left:"50%",width:1,height:"100%",background:`${C.brass}20`}}/><div style={{position:"absolute",left:`${Math.max(2,Math.min(98,50+(r-TGT)*500))}%`,width:3,height:"100%",background:Math.abs(r-TGT)<0.03?C.win:"#e8a87c",borderRadius:1}}/></div>
            <span style={{color:"#889",width:40,textAlign:"right",fontSize:"0.48rem"}}>{(r*100).toFixed(1)}%</span>
          </div>)}
          {lastCorr.reasons.map((r,i)=><div key={i} style={{color:"#6699aa",paddingLeft:6,fontSize:"0.45rem"}}>▸ {r}</div>)}
        </div>}
      </div>

      <style>{`button:hover:not(:disabled){filter:brightness(1.12)}button:active:not(:disabled){transform:scale(0.97)}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.brass}25;border-radius:2px}`}</style>
    </div>
  );
}
