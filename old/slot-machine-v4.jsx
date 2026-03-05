/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║            FORTUNE ENGINE v4 — PSYCHOLOGICAL WARFARE                ║
 * ║                                                                      ║
 * ║  NEW IN v4: THE DARK PATTERNS                                       ║
 * ║                                                                      ║
 * ║  This version exposes the psychological manipulation techniques      ║
 * ║  used by real slot machines to alter player perception and           ║
 * ║  behaviour. Each technique has a TOGGLE so you can experience       ║
 * ║  the difference with it on vs off.                                  ║
 * ║                                                                      ║
 * ║  1. LOSSES DISGUISED AS WINS (LDW)                                  ║
 * ║     The most studied deceptive mechanic in gambling research.        ║
 * ║     When you win LESS than you bet, the machine still celebrates.   ║
 * ║     Research: Dixon et al. (2010) showed players' physiological     ║
 * ║     arousal (skin conductance) to LDWs is identical to real wins.   ║
 * ║                                                                      ║
 * ║  2. STOP BUTTON ILLUSION (Illusory Control)                         ║
 * ║     A "STOP" button that feels like it gives you control over the   ║
 * ║     outcome. In reality, the result is determined at SPIN time.     ║
 * ║     The button just skips the animation. But the perception of      ║
 * ║     control increases bet size and session duration.                 ║
 * ║                                                                      ║
 * ║  3. CELEBRATION ASYMMETRY                                           ║
 * ║     Wins trigger escalating visual celebrations based on size.      ║
 * ║     Losses produce NOTHING — silence and stillness. This creates    ║
 * ║     an availability bias: players remember wins vividly because     ║
 * ║     they were visually spectacular, and forget losses because       ║
 * ║     there was nothing to encode in memory.                          ║
 * ║                                                                      ║
 * ║  4. REEL ANTICIPATION SLOWDOWN                                      ║
 * ║     When bonus/scatter symbols land on early reels, later reels     ║
 * ║     slow down dramatically. Creates suspense for an outcome that    ║
 * ║     was already determined. Triggers cortisol (stress) + dopamine   ║
 * ║     (anticipation) cocktail that's highly addictive.                ║
 * ║                                                                      ║
 * ║  5. CREDIT OBFUSCATION                                              ║
 * ║     Display "CREDITS" instead of currency. "500 credits" feels     ║
 * ║     like play money; "£5.00" feels like real money. This            ║
 * ║     psychological distance reduces loss aversion.                    ║
 * ║                                                                      ║
 * ║  6. SESSION TIME DISSOLUTION                                        ║
 * ║     Toggle: show a clock and session timer, or hide all time        ║
 * ║     awareness (like real casinos with no windows or clocks).        ║
 * ║                                                                      ║
 * ║  7. BET COMPLEXITY HIDING                                           ║
 * ║     Toggle between showing "5p/line" (hides true cost) vs          ║
 * ║     "£1.00 per spin" (honest total).                                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { useState, useRef, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════════
 * CORE CONFIG (carried from v3)
 * ═══════════════════════════════════════════════════════════════════ */
const SYMBOLS = [
  { id: "cherry", emoji: "🍒", tier: 1, name: "Cherry" },
  { id: "lemon", emoji: "🍋", tier: 1, name: "Lemon" },
  { id: "orange", emoji: "🍊", tier: 2, name: "Orange" },
  { id: "grape", emoji: "🍇", tier: 2, name: "Grape" },
  { id: "bell", emoji: "🔔", tier: 3, name: "Bell" },
  { id: "diamond", emoji: "💎", tier: 4, name: "Diamond" },
  { id: "seven", emoji: "7️⃣", tier: 5, name: "Seven" },
  { id: "wild", emoji: "⭐", tier: 6, name: "Wild" },
  { id: "scatter", emoji: "🌀", tier: 0, name: "Scatter" },
  { id: "bonus", emoji: "🎰", tier: 0, name: "Bonus" },
];
const SYM = Object.fromEntries(SYMBOLS.map(s => [s.id, s]));
const NP = 20, NR = 5, NROW = 3, TGT = 0.965;
const PL = [[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,0,0],[2,2,1,2,2],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0],[2,1,1,1,2],[1,0,1,0,1],[1,2,1,2,1],[0,1,0,1,0],[2,1,2,1,2],[1,1,0,1,1],[1,1,2,1,1],[0,0,1,2,2],[2,2,1,0,0],[0,2,0,2,0]];
const SCAT_PAY = { 3: 5, 4: 20, 5: 50 };
const FS_AWARD = { 3: 10, 4: 15, 5: 25 };

const PROFILES = {
  low: {
    name: "Low", label: "STEADY", color: "#00cc66",
    pt: { cherry:{3:3,4:8,5:20}, lemon:{3:3,4:8,5:20}, orange:{3:5,4:15,5:40}, grape:{3:5,4:15,5:40}, bell:{3:12,4:35,5:80}, diamond:{3:20,4:60,5:150}, seven:{3:30,4:90,5:200}, wild:{3:30,4:90,5:200} },
    rc: { loose:{cherry:9,lemon:9,orange:10,grape:10,bell:9,diamond:6,seven:4,wild:4,scatter:2,bonus:1}, standard:{cherry:10,lemon:10,orange:11,grape:11,bell:8,diamond:5,seven:3,wild:3,scatter:1,bonus:1}, tight:{cherry:12,lemon:12,orange:11,grape:11,bell:7,diamond:4,seven:2,wild:2,scatter:1,bonus:0} },
    cm: [1,1.5,2,3,4,5], mc: 0.05,
    ms: [{mult:2,weight:50},{mult:3,weight:30},{mult:4,weight:15},{mult:5,weight:5}],
  },
  medium: {
    name: "Med", label: "BALANCED", color: "#ffa500",
    pt: { cherry:{3:5,4:15,5:40}, lemon:{3:5,4:15,5:40}, orange:{3:10,4:30,5:75}, grape:{3:10,4:30,5:75}, bell:{3:25,4:75,5:200}, diamond:{3:50,4:150,5:500}, seven:{3:100,4:300,5:1000}, wild:{3:100,4:300,5:1000} },
    rc: { loose:{cherry:12,lemon:11,orange:9,grape:9,bell:7,diamond:5,seven:4,wild:4,scatter:2,bonus:1}, standard:{cherry:14,lemon:13,orange:10,grape:10,bell:6,diamond:4,seven:3,wild:2,scatter:1,bonus:1}, tight:{cherry:16,lemon:15,orange:11,grape:10,bell:5,diamond:3,seven:2,wild:1,scatter:1,bonus:0} },
    cm: [1,2,3,5,8,12], mc: 0.03,
    ms: [{mult:2,weight:35},{mult:3,weight:25},{mult:5,weight:15},{mult:7,weight:10},{mult:10,weight:5}],
  },
  high: {
    name: "High", label: "JACKPOT", color: "#ff4444",
    pt: { cherry:{3:8,4:25,5:60}, lemon:{3:8,4:25,5:60}, orange:{3:15,4:50,5:120}, grape:{3:15,4:50,5:120}, bell:{3:40,4:125,5:400}, diamond:{3:80,4:300,5:1000}, seven:{3:200,4:750,5:2500}, wild:{3:200,4:750,5:2500} },
    rc: { loose:{cherry:15,lemon:14,orange:8,grape:8,bell:6,diamond:4,seven:3,wild:3,scatter:2,bonus:1}, standard:{cherry:18,lemon:17,orange:9,grape:9,bell:4,diamond:3,seven:2,wild:1,scatter:1,bonus:1}, tight:{cherry:20,lemon:19,orange:10,grape:9,bell:3,diamond:2,seven:1,wild:0,scatter:1,bonus:0} },
    cm: [1,2,4,8,15,25], mc: 0.02,
    ms: [{mult:2,weight:25},{mult:3,weight:20},{mult:5,weight:20},{mult:10,weight:15},{mult:15,weight:10},{mult:25,weight:5}],
  },
};

/* ═══════════════════════════════════════════════════════════════════
 * CORE MECHANICS (condensed from v3)
 * ═══════════════════════════════════════════════════════════════════ */
function bStrip(w){const s=[];for(const[id,c]of Object.entries(w))for(let i=0;i<c;i++)s.push(SYM[id]);for(let i=s.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[s[i],s[j]]=[s[j],s[i]];}return s;}
function bAll(rc){const s={};for(const[c,w]of Object.entries(rc)){s[c]=[];for(let r=0;r<NR;r++)s[c].push(bStrip(w));}return s;}
function spin(strips){const g=[];for(let r=0;r<NR;r++){const s=strips[r],p=Math.floor(Math.random()*s.length),c=[];for(let row=0;row<NROW;row++)c.push(s[(p+row)%s.length]);g.push(c);}return g;}
function evalPL(grid,bpl,pt){const w=[];for(let li=0;li<NP;li++){const line=PL[li],ls=line.map((r,i)=>grid[i][r]);let ms=null;for(const s of ls)if(s.id!=="wild"&&s.id!=="scatter"&&s.id!=="bonus"){ms=s;break;}if(!ms){if(ls.every(s=>s.id==="wild"))ms=SYM.wild;else continue;}let c=0;for(const s of ls)if(s.id===ms.id||s.id==="wild")c++;else break;if(c>=3&&pt[ms.id]?.[c])w.push({li,sym:ms,c,mult:pt[ms.id][c],pay:pt[ms.id][c]*bpl,pos:line.slice(0,c).map((r,i)=>({r:i,row:r}))});}return w;}
function evalScat(g,tb){let c=0;const p=[];for(let r=0;r<NR;r++)for(let row=0;row<NROW;row++)if(g[r][row].id==="scatter"){c++;p.push({r,row});}return{c,p,pay:c>=3?(SCAT_PAY[c]||0)*tb:0,fs:c>=3?FS_AWARD[c]||0:0};}
function evalBonus(g){let c=0;const p=[];for(const r of[0,2,4])for(let row=0;row<NROW;row++)if(g[r][row].id==="bonus"){c++;p.push({r,row});}return{t:c>=3,c,p};}

function cascadeGrid(grid,wp,rc,sc){const ng=[];const ws=rc[sc],we=Object.entries(ws),tw=we.reduce((s,[,w])=>s+w,0);function rs(){let r=Math.random()*tw;for(const[id,w]of we){r-=w;if(r<=0)return SYM[id];}return SYM.cherry;}
for(let r=0;r<NR;r++){const col=grid[r],surv=[];for(let row=0;row<NROW;row++)if(!wp.has(`${r}-${row}`))surv.push(col[row]);const nc=new Array(NROW),nn=NROW-surv.length;for(let i=0;i<nn;i++)nc[i]=rs();for(let i=0;i<surv.length;i++)nc[nn+i]=surv[i];ng.push(nc);}return ng;}

function resolveCascade(ig,bpl,tb,prof,sc){const cms=prof.cm,chain=[];let cg=ig,cl=0;
while(cl<20){const w=evalPL(cg,bpl,prof.pt);if(!w.length)break;const cm=cms[Math.min(cl,cms.length-1)];const cw=w.reduce((s,x)=>s+x.pay,0)*cm;const wp=new Set();w.forEach(x=>x.pos.forEach(p=>wp.add(`${p.r}-${p.row}`)));chain.push({l:cl,grid:cg.map(c=>[...c]),wins:w,wp:[...wp],mult:cm,cw,acc:chain.reduce((s,x)=>s+x.cw,0)+cw});cg=cascadeGrid(cg,wp,prof.rc,sc);cl++;}
return{chain,fg:cg,tw:chain.reduce((s,x)=>s+x.cw,0),tc:chain.length};}

function calcCorr(st){const{totalWagered:tw,totalWon:twn,spinHistory:sh,consecutiveLosses:cl,consecutiveWins:cw,lastBonusSpin:lb,spinCount:sc,recentBets:rb,bankedTotal:bt}=st;
const wins={s:sh.slice(-20),m:sh.slice(-100),l:sh.slice(-500),a:sh};const rw={};
for(const[n,w]of Object.entries(wins)){if(!w.length){rw[n]=TGT;continue;}const wg=w.reduce((s,h)=>s+h.b,0);rw[n]=wg>0?w.reduce((s,h)=>s+h.w,0)/wg:TGT;}
const wr=rw.s*0.1+rw.m*0.25+rw.l*0.35+rw.a*0.3,dev=wr-TGT,cb=(1/(1+Math.exp(-15*dev))-0.5)*2;
let sm=0;const reasons=[];if(cl>15){sm-=0.15;reasons.push(`Drought(${cl})`);}else if(cl>8){sm-=0.08;reasons.push(`Losing(${cl})`);}
if(cw>5){sm+=0.12;reasons.push(`Hot(${cw})`);}const ssb=sc-lb;if(ssb>150){sm-=0.05;reasons.push(`BonusDue(${ssb})`);}
if(!reasons.length)reasons.push("Std");const f=Math.max(-1,Math.min(1,cb+sm));
return{sc:f<-0.3?"loose":f>0.3?"tight":"standard",corr:f,dev,wr,rw,reasons,sig:cb,sm};}

function nmApply(grid,isWin,streak,stats){
if(isWin&&Math.random()>0.15){stats.on=false;return grid;}if(Math.random()>0.65){stats.on=false;return grid;}
stats.on=true;const pp=grid.map(c=>c[1]);let ms=null,mc=0,br=-1;
for(let i=0;i<pp.length;i++){const s=pp[i];if(i===0){if(s.id!=="scatter"&&s.id!=="bonus"){ms=s.id==="wild"?null:s;mc=1;}continue;}
const m=s.id==="wild"||(ms&&s.id===ms.id)||(!ms&&s.id!=="scatter"&&s.id!=="bonus");if(m){if(!ms&&s.id!=="wild")ms=s;mc++;}else{br=i;break;}}
const mg=grid.map(c=>[...c]);let cells=0;const max=Math.floor(NR*2*0.45);
const nw={cherry:2,lemon:2,orange:3,grape:3,bell:5,diamond:10,seven:16,wild:12,scatter:4,bonus:3};
for(let r=0;r<NR;r++)for(const row of[0,2]){if(cells>=max)break;const isBR=r===br;if(!(isBR?Math.random()<0.85:Math.random()<0.35))continue;
const w={...nw};if(isBR&&ms?.tier>=4)w[ms.id]=(w[ms.id]||1)*4;if(streak.cl>5){const m=Math.min(2,1+(streak.cl-5)*0.1);w.seven*=m;w.diamond*=m;w.wild*=m;}
const ent=Object.entries(w),tot=ent.reduce((s,[,v])=>s+v,0);let roll=Math.random()*tot;let nm=SYM.cherry;for(const[id,v]of ent){roll-=v;if(roll<=0){nm=SYM[id];break;}}
if(nm.tier>mg[r][row].tier||isBR){mg[r][row]=nm;cells++;}}stats.cells=cells;return mg;}

function spinMW(segs){const t=segs.reduce((s,x)=>s+x.weight,0);let r=Math.random()*t;for(const x of segs){r-=x.weight;if(r<=0)return x.mult;}return 2;}
function genBonus(tb,st){const pool=tb*25*(st.lastCorr?.corr<-0.2?1.4:st.lastCorr?.corr>0.2?0.7:1);const ws=[.02,.03,.05,.06,.07,.08,.10,.11,.12,.13,.11,.12];const p=ws.map(w=>Math.round(pool*w*(0.5+Math.random())));for(let i=p.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[p[i],p[j]]=[p[j],p[i]];}return p;}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION: PSYCHOLOGICAL MANIPULATION SYSTEMS
 *
 * Each system is independently toggleable and tracked by the
 * "DARK PATTERNS" analysis tab. This is the educational payload.
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * LOSS DISGUISED AS WIN (LDW) CLASSIFIER
 *
 * Classifies every spin outcome into one of four categories:
 *
 * 1. TRUE WIN: Won more than you bet. Net positive. Genuine win.
 * 2. LDW (Loss Disguised as Win): Won SOMETHING, but less than bet.
 *    Net negative. Machine celebrates anyway.
 *    Example: Bet £1.00, won £0.30. Machine shows "WIN! £0.30!"
 *    but you actually lost £0.70.
 * 3. TRUE LOSS: Won nothing. Machine shows nothing.
 * 4. BREAK EVEN: Won exactly what you bet. Extremely rare.
 *
 * LDWs are the most common "win" type on multiline machines.
 * On a 20-line machine, roughly 30-40% of all spins produce an LDW.
 * Only about 8-12% produce a TRUE WIN.
 *
 * Dixon et al. (2010): "Players' skin conductance responses to LDWs
 * were indistinguishable from responses to small wins."
 *
 * Templeton et al. (2015): "LDWs were consistently overestimated
 * as wins by players, who recalled winning more often than they did."
 */
function classifyOutcome(bet, winAmount) {
  if (winAmount <= 0) return { type: "TRUE_LOSS", net: -bet, color: "#ff4444" };
  if (winAmount < bet) return { type: "LDW", net: winAmount - bet, color: "#ff8800" };
  if (winAmount === bet) return { type: "BREAK_EVEN", net: 0, color: "#888888" };
  return { type: "TRUE_WIN", net: winAmount - bet, color: "#00ff88" };
}

/**
 * CELEBRATION INTENSITY CALCULATOR
 *
 * Maps win amount to celebration level (0-5).
 * Critically: Level 1+ celebrations trigger for LDWs too (when enabled),
 * creating the false perception of winning.
 *
 * Level 0: Nothing (true loss — silence)
 * Level 1: Subtle highlight + small text (LDW territory)
 * Level 2: Win line animation + sound indicator
 * Level 3: Screen flash + "GREAT WIN!"
 * Level 4: Full celebration + "BIG WIN!"
 * Level 5: Screen takeover + "MEGA WIN!" + extended celebration
 */
function getCelebrationLevel(winAmount, bet, ldwEnabled) {
  if (winAmount <= 0) return 0;

  // If LDW mode is OFF (honest mode), only celebrate true wins
  if (!ldwEnabled && winAmount < bet) return 0;

  // With LDW enabled, celebrate everything that returns anything
  const ratio = winAmount / bet;
  if (ratio >= 25) return 5;    // MEGA WIN
  if (ratio >= 10) return 4;    // BIG WIN
  if (ratio >= 3) return 3;     // GREAT WIN
  if (ratio >= 1) return 2;     // Nice win
  return 1;                      // LDW celebration (small but present)
}

/**
 * REEL ANTICIPATION DELAY CALCULATOR
 *
 * When scatter/bonus symbols land on early reels, calculate
 * how much to slow down later reels to build suspense.
 *
 * This is pure psychological manipulation — the outcome is already
 * determined. The delay just makes you FEEL the anticipation.
 *
 * Real machines use this aggressively: reels 4-5 can take 2-3x
 * longer to stop when reels 1-3 show bonus symbols.
 */
function calcReelDelays(grid, anticipationEnabled) {
  if (!anticipationEnabled) return [0, 0, 0, 0, 0]; // Equal timing

  // Count scatter/bonus symbols on each reel
  let scatterCount = 0;
  const delays = [0, 0, 0, 0, 0]; // Extra cycles per reel

  for (let r = 0; r < NR; r++) {
    let hasSpecial = false;
    for (let row = 0; row < NROW; row++) {
      if (grid[r][row].id === "scatter" || grid[r][row].id === "bonus") {
        hasSpecial = true;
        scatterCount++;
      }
    }

    // If previous reels had scatters, delay THIS reel
    if (scatterCount >= 1 && r >= 1) {
      // Each previous scatter adds more delay to subsequent reels
      delays[r] = scatterCount * 3; // 3 extra animation cycles per scatter
    }
    if (scatterCount >= 2 && r >= 2) {
      delays[r] += 5; // Extra suspense when 2+ scatters already visible
    }
  }

  return delays;
}

/**
 * CREDIT DISPLAY FORMATTER
 *
 * Converts between real currency and abstract credits.
 * Credits feel less "real" — reducing loss aversion.
 *
 * £1.00 = 100 credits (common ratio in real machines)
 * This makes a £0.30 win display as "30 CREDITS" which
 * psychologically feels bigger than "£0.30"
 */
const CREDIT_RATIO = 100; // 1 currency unit = 100 credits

function formatValue(amount, useCredits) {
  if (useCredits) {
    return `${Math.round(amount * CREDIT_RATIO).toLocaleString()} CR`;
  }
  return `£${amount.toFixed(2)}`;
}

/* ═══════════════════════════════════════════════════════════════════
 * MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════ */
export default function SlotMachine() {
  const [vol, setVol] = useState("medium");
  const prof = PROFILES[vol];

  const [bal, setBal] = useState(1000);
  const [bet, setBet] = useState(1.00);
  const [tWag, setTWag] = useState(0);
  const [tWon, setTWon] = useState(0);
  const [banked, setBanked] = useState(0);
  const [peak, setPeak] = useState(1000);

  const [grid, setGrid] = useState(() => {
    const g = []; const a = SYMBOLS.filter(s => s.tier > 0);
    for (let r = 0; r < NR; r++) { const c = []; for (let row = 0; row < NROW; row++) c.push(a[Math.floor(Math.random() * a.length)]); g.push(c); }
    return g;
  });
  const [spinning, setSpinning] = useState(false);
  const [dispGrid, setDispGrid] = useState(null);

  const [lastWin, setLastWin] = useState(0);
  const [winLines, setWinLines] = useState([]);
  const [msg, setMsg] = useState("Choose your weapons and spin!");

  // Cascade
  const [cascOn, setCascOn] = useState(true);
  const [cascPlaying, setCascPlaying] = useState(false);
  const [cascLevel, setCascLevel] = useState(0);
  const [cascTW, setCascTW] = useState(0);
  const [exploding, setExploding] = useState(new Set());
  const [cascStats, setCascStats] = useState({ chains: 0, steps: 0, longest: 0, wins: 0 });

  // Engine
  const [hist, setHist] = useState([]);
  const [spins, setSpins] = useState(0);
  const [cLoss, setCLoss] = useState(0);
  const [cWin, setCWin] = useState(0);
  const [lastBonus, setLastBonus] = useState(0);
  const [rBets, setRBets] = useState([]);
  const [lastCorr, setLastCorr] = useState(null);
  const [dLog, setDLog] = useState([]);

  // Near-miss
  const [nmOn, setNmOn] = useState(true);

  // Bonus
  const [fsLeft, setFsLeft] = useState(0);
  const [fsMult, setFsMult] = useState(1);
  const [fsWins, setFsWins] = useState(0);
  const [bonusOn, setBonusOn] = useState(false);
  const [bPrizes, setBPrizes] = useState([]);
  const [bPicked, setBPicked] = useState([]);
  const [bLeft, setBLeft] = useState(0);
  const [bTotal, setBTotal] = useState(0);
  const [multActive, setMultActive] = useState(null);

  /* ══════════════════════════════════════════════════
   * DARK PATTERN TOGGLES
   * Each controls one psychological manipulation system.
   * Default: ALL ON (casino mode). Toggle off to see reality.
   * ══════════════════════════════════════════════════ */
  const [ldwOn, setLdwOn] = useState(true);               // Loss Disguised as Win celebrations
  const [stopBtnOn, setStopBtnOn] = useState(true);        // Fake stop button
  const [celebOn, setCelebOn] = useState(true);             // Celebration asymmetry (scaled celebration)
  const [anticipOn, setAnticipOn] = useState(true);         // Reel anticipation slowdown
  const [creditMode, setCreditMode] = useState(false);      // Credit display (starts off for clarity)
  const [hideTime, setHideTime] = useState(false);          // Hide session timer
  const [hideTrueCost, setHideTrueCost] = useState(true);   // Hide total bet cost

  // Dark pattern tracking
  const [dpStats, setDpStats] = useState({
    ldwCount: 0,          // Number of LDW events
    ldwTotalLost: 0,      // Total money lost during LDW "wins"
    trueWins: 0,          // Actual wins (won > bet)
    trueLosses: 0,        // Complete losses (won = 0)
    celebFake: 0,         // Celebrations that were LDWs
    celebReal: 0,         // Celebrations that were true wins
    stopPresses: 0,       // Times stop button was pressed
    anticipEvents: 0,     // Times anticipation slowdown triggered
    sessionStart: Date.now(),
    totalSpinTime: 0,     // Time spent watching reels
  });

  // Celebration state
  const [celebLevel, setCelebLevel] = useState(0);
  const [celebMsg, setCelebMsg] = useState("");
  const [showCeleb, setShowCeleb] = useState(false);

  // UI
  const [activeTab, setActiveTab] = useState("game");
  const [autoPlay, setAutoPlay] = useState(false);

  const strips = useRef(bAll(prof.rc));
  const autoRef = useRef(false);
  const tmRef = useRef(null);
  const spinStartTime = useRef(0);

  useEffect(() => { autoRef.current = autoPlay; }, [autoPlay]);
  useEffect(() => () => { if (tmRef.current) clearTimeout(tmRef.current); }, []);
  useEffect(() => { strips.current = bAll(PROFILES[vol].rc); }, [vol]);

  // Session timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - dpStats.sessionStart), 1000);
    return () => clearInterval(t);
  }, [dpStats.sessionStart]);

  function fmtTime(ms) {
    const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
    return `${h}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  function finishSpin(finalGrid, totalWin, numCasc, meta) {
    const { sBet, ec, dec, scat, bonus, appliedMult } = meta;
    const ns = spins + 1; setSpins(ns);
    const ntw = tWon + totalWin; setTWon(ntw);
    setHist(p => [...p, { spin: ns, b: sBet, w: totalWin, cfg: ec, corr: dec.corr }]);
    if (totalWin > 0) { setCWin(p => p + 1); setCLoss(0); } else { setCLoss(p => p + 1); setCWin(0); }
    setBal(b => b + totalWin);
    if (bal + totalWin > peak) setPeak(bal + totalWin);

    if (numCasc > 0) setCascStats(p => ({ chains: p.chains + 1, steps: p.steps + numCasc, longest: Math.max(p.longest, numCasc), wins: p.wins + totalWin }));

    // ── DARK PATTERN: Classify outcome ──
    const outcome = classifyOutcome(sBet, totalWin);
    setDpStats(p => {
      const u = { ...p };
      if (outcome.type === "LDW") { u.ldwCount++; u.ldwTotalLost += Math.abs(outcome.net); }
      else if (outcome.type === "TRUE_WIN") u.trueWins++;
      else if (outcome.type === "TRUE_LOSS") u.trueLosses++;
      u.totalSpinTime += Date.now() - spinStartTime.current;
      return u;
    });

    // ── DARK PATTERN: Celebration system ──
    const cLevel = getCelebrationLevel(totalWin, sBet, ldwOn);
    setCelebLevel(cLevel);
    if (cLevel > 0 && celebOn) {
      setShowCeleb(true);
      const isLDW = totalWin > 0 && totalWin < sBet;
      if (isLDW) setDpStats(p => ({ ...p, celebFake: p.celebFake + 1 }));
      else setDpStats(p => ({ ...p, celebReal: p.celebReal + 1 }));

      const msgs = {
        1: [`+${formatValue(totalWin, creditMode)}`, "Small win!"],
        2: [`WIN ${formatValue(totalWin, creditMode)}!`, "Nice!"],
        3: ["★ GREAT WIN! ★", `${formatValue(totalWin, creditMode)}`],
        4: ["★★ BIG WIN! ★★", `${formatValue(totalWin, creditMode)}`],
        5: ["★★★ MEGA WIN! ★★★", `${formatValue(totalWin, creditMode)}`],
      };
      setCelebMsg(msgs[cLevel]?.[0] || "");
      setTimeout(() => setShowCeleb(false), cLevel >= 4 ? 3000 : cLevel >= 3 ? 2000 : 1000);
    } else {
      setShowCeleb(false);
    }

    // Handle bonuses
    if (scat.fs > 0 && fsLeft === 0) { setFsLeft(scat.fs); setFsMult(scat.c >= 4 ? 3 : 2); setFsWins(0); setLastBonus(ns); setMsg(`🌀 FREE SPINS! ${scat.fs} at ${scat.c >= 4 ? 3 : 2}x!`); }
    else if (fsLeft > 0) { const r = fsLeft - 1; setFsLeft(r); setFsWins(p => p + totalWin); if (r === 0) { setMsg(`Free spins done! ${formatValue(fsWins + totalWin, creditMode)}`); setFsMult(1); } else setMsg(`Free spin — ${r} left`); }
    else if (bonus.t) { setBonusOn(true); setBPrizes(genBonus(sBet, { lastCorr: lastCorr })); setBPicked([]); setBLeft(4); setBTotal(0); setLastBonus(ns); setMsg("🎰 BONUS!"); }
    else if (totalWin > 0) {
      const cm = numCasc > 0 ? ` ⛓${numCasc}` : "";
      const mm = appliedMult ? ` ×${appliedMult}` : "";
      // With LDW awareness, show net result too
      if (!ldwOn && totalWin < sBet) setMsg(`Won ${formatValue(totalWin, creditMode)} (NET: -${formatValue(sBet - totalWin, creditMode)})`);
      else setMsg(`WIN ${formatValue(totalWin, creditMode)}${cm}${mm}`);
    } else {
      if (celebOn) setMsg(""); // Silence on loss (celebration asymmetry)
      else setMsg(`Lost ${formatValue(sBet, creditMode)}`); // Honest mode shows the loss
    }

    setLastWin(totalWin);
    setDLog(p => [{ spin: ns, cfg: ec, corr: dec.corr.toFixed(3), rtp: (tWag + sBet) > 0 ? ((ntw / (tWag + sBet)) * 100).toFixed(2) + "%" : "—", won: totalWin, casc: numCasc, type: outcome.type }, ...p].slice(0, 40));
    setSpinning(false); setCascLevel(0);

    if (autoRef.current && fsLeft > 1) tmRef.current = setTimeout(() => { if (autoRef.current) doSpin(); }, 600);
    else if (autoRef.current && !bonus.t && bal + totalWin >= sBet) tmRef.current = setTimeout(() => { if (autoRef.current) doSpin(); }, 1000);
    else if (autoRef.current) setAutoPlay(false);
  }

  const playCascade = useCallback((chain, fg, tw, meta) => {
    if (!chain.length) { finishSpin(fg, tw, 0, meta); return; }
    setCascPlaying(true); setCascTW(0);
    let si = 0;
    function step() {
      if (si >= chain.length) { setCascPlaying(false); setExploding(new Set()); finishSpin(fg, tw, chain.length, meta); return; }
      const s = chain[si]; setCascLevel(s.l); setCascTW(s.acc); setGrid(s.grid); setWinLines(s.wins);
      setMsg(`CASCADE ${s.l + 1} — ${s.mult}x! +${formatValue(s.cw, creditMode)}`);
      setTimeout(() => { setExploding(new Set(s.wp)); setTimeout(() => { setExploding(new Set()); setWinLines([]); si++;
        if (si < chain.length) { setGrid(chain[si].grid); setTimeout(step, 200); } else { setGrid(fg); setTimeout(step, 150); }
      }, 300); }, 400);
    }
    setTimeout(step, 250);
  }, [creditMode]);

  /** ── STOP BUTTON HANDLER ──
   * THIS DOES NOTHING TO THE OUTCOME.
   * It only speeds up the animation. But it FEELS like control.
   */
  const stopBtnRef = useRef(false);
  function handleStop() {
    if (!spinning || !stopBtnOn) return;
    stopBtnRef.current = true;
    setDpStats(p => ({ ...p, stopPresses: p.stopPresses + 1 }));
  }

  const doSpin = useCallback(() => {
    if (spinning || bonusOn || cascPlaying) return;
    const cBet = fsLeft > 0 ? 0 : bet;
    const bpl = bet / NP;
    if (fsLeft === 0 && bal < bet) { setMsg("Insufficient balance!"); return; }

    spinStartTime.current = Date.now();
    setSpinning(true); setWinLines([]); setLastWin(0); setShowCeleb(false);
    setMultActive(null); setExploding(new Set()); stopBtnRef.current = false;

    if (fsLeft === 0) setBal(b => b - bet);
    const nw = tWag + bet; setTWag(nw);
    setRBets(p => [...p.slice(-20), bet]);

    const est = { totalWagered: nw, totalWon: tWon, spinHistory: hist, consecutiveLosses: cLoss, consecutiveWins: cWin, lastBonusSpin: lastBonus, spinCount: spins, recentBets: [...rBets, bet], bankedTotal: banked, sessionPeakBalance: peak };
    const dec = calcCorr(est); setLastCorr(dec);
    let ec = dec.sc; const ssb = spins - lastBonus;
    if (ssb > 120 && ec === "tight") ec = "standard";
    if (ssb > 200) ec = "loose";

    const rawGrid = spin(strips.current[ec]);
    const scat = evalScat(rawGrid, bet);
    const bonus = evalBonus(rawGrid);
    const w0 = evalPL(rawGrid, bpl, prof.pt);
    const isWin = w0.length > 0 || scat.pay > 0;

    // Near-miss
    const nmS = { on: false, cells: 0 };
    let initGrid = rawGrid;
    if (nmOn && (!cascOn || !isWin)) initGrid = nmApply(rawGrid, isWin, { cl: cLoss, cw: cWin }, nmS);

    // Cascade
    let cascR;
    if (cascOn) cascR = resolveCascade(rawGrid, bpl, bet, prof, ec);
    else { const bw = w0.reduce((s, x) => s + x.pay, 0) + scat.pay; cascR = { chain: [], fg: rawGrid, tw: bw, tc: 0 }; }

    let totalWin = cascR.tw;
    if (!cascOn) totalWin = w0.reduce((s, x) => s + x.pay, 0) + scat.pay;
    if (fsLeft > 0) totalWin *= fsMult;

    let appliedMult = null;
    if (totalWin > 0 && Math.random() < prof.mc && fsLeft === 0) { appliedMult = spinMW(prof.ms); totalWin *= appliedMult; setMultActive(appliedMult); }

    // ── DARK PATTERN: Anticipation delays ──
    const delays = calcReelDelays(rawGrid, anticipOn);
    const hasAnticip = delays.some(d => d > 0);
    if (hasAnticip) setDpStats(p => ({ ...p, anticipEvents: p.anticipEvents + 1 }));

    // ── ANIMATION with anticipation delays ──
    const allS = SYMBOLS.filter(s => s.tier > 0 || s.id === "scatter" || s.id === "bonus");
    let cycles = 0;
    const baseMax = 10 + Math.floor(Math.random() * 4);
    // Each reel has its own stop time = base + delay
    const reelStopAt = Array.from({ length: NR }, (_, r) => baseMax - (NR - 1 - r) * 2 + delays[r]);
    const maxCycles = Math.max(...reelStopAt) + 2;

    const animTimer = setInterval(() => {
      cycles++;

      // Stop button check: if pressed, skip to end
      if (stopBtnRef.current) {
        clearInterval(animTimer);
        setDispGrid(null);
        const meta = { sBet: bet, ec, dec, scat, bonus, appliedMult };
        if (cascOn && cascR.chain.length > 0) {
          setGrid(rawGrid); setWinLines(w0);
          playCascade(cascR.chain, cascR.fg, totalWin, meta);
        } else {
          setGrid(cascOn ? rawGrid : initGrid); setWinLines(w0);
          finishSpin(cascOn ? rawGrid : initGrid, totalWin, 0, meta);
        }
        return;
      }

      const ag = Array.from({ length: NR }, (_, r) => {
        if (cycles >= reelStopAt[r]) return cascOn ? rawGrid[r] : initGrid[r];
        return Array.from({ length: NROW }, () => allS[Math.floor(Math.random() * allS.length)]);
      });
      setDispGrid(ag);

      if (cycles >= maxCycles) {
        clearInterval(animTimer);
        setDispGrid(null);
        const meta = { sBet: bet, ec, dec, scat, bonus, appliedMult };
        if (cascOn && cascR.chain.length > 0) {
          setGrid(rawGrid); setWinLines(w0);
          playCascade(cascR.chain, cascR.fg, totalWin, meta);
        } else {
          setGrid(cascOn ? rawGrid : initGrid); setWinLines(w0);
          finishSpin(cascOn ? rawGrid : initGrid, totalWin, 0, meta);
        }
      }
    }, 70);
  }, [spinning, bonusOn, cascPlaying, bet, bal, tWag, tWon, hist, cLoss, cWin, lastBonus, spins, rBets, banked, peak, lastCorr, fsLeft, fsMult, fsWins, nmOn, cascOn, prof, vol, playCascade, ldwOn, celebOn, anticipOn, creditMode, stopBtnOn]);

  const pickBonus = (i) => {
    if (!bonusOn || bPicked.includes(i) || bLeft <= 0) return;
    const prize = bPrizes[i]; const np = [...bPicked, i]; const nt = bTotal + prize; const r = bLeft - 1;
    setBPicked(np); setBTotal(nt); setBLeft(r);
    if (r === 0) { setBal(b => b + nt); setTWon(p => p + nt); setMsg(`🎰 Bonus: ${formatValue(nt, creditMode)}!`); setTimeout(() => setBonusOn(false), 1500); }
    else setMsg(`${formatValue(prize, creditMode)}! ${r} left`);
  };

  const dg = dispGrid || grid;
  const hl = new Set(); winLines.forEach(w => w.pos.forEach(p => hl.add(`${p.r}-${p.row}`)));
  const artRTP = tWag > 0 ? (tWon / tWag * 100).toFixed(2) : "—";
  const tabS = (t) => ({ flex: 1, padding: "6px 1px", fontSize: "0.5rem", fontWeight: activeTab === t ? "bold" : "normal", background: activeTab === t ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.02)", border: activeTab === t ? "1px solid rgba(255,215,0,0.25)" : "1px solid rgba(255,255,255,0.06)", borderBottom: activeTab === t ? "none" : undefined, color: activeTab === t ? "#ffd700" : "#444", cursor: "pointer", fontFamily: "inherit", borderRadius: "4px 4px 0 0" });

  // Dark pattern count for badge
  const dpCount = [ldwOn, stopBtnOn, celebOn, anticipOn, creditMode, hideTime, hideTrueCost].filter(Boolean).length;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0a0a1a, #1a0a2a, #0a1a2a)", color: "#e0e0e0", fontFamily: "'Courier New', monospace", display: "flex", flexDirection: "column", alignItems: "center", padding: "6px", gap: "5px" }}>

      {/* HEADER */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, letterSpacing: "1px", background: "linear-gradient(90deg, #ffd700, #ff6b35, #ffd700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>★ FORTUNE ENGINE v4 ★</h1>
        <div style={{ fontSize: "0.5rem", color: "#666", letterSpacing: "1px" }}>PSYCHOLOGICAL WARFARE EDITION │ {dpCount}/7 dark patterns active</div>
      </div>

      {/* SESSION TIMER — hidden when hideTime is on */}
      {!hideTime && (
        <div style={{ fontSize: "0.55rem", color: "#ff4444", background: "rgba(255,0,0,0.06)", padding: "2px 10px", borderRadius: 4, border: "1px solid rgba(255,0,0,0.15)" }}>
          ⏱ Session: {fmtTime(elapsed)} │ {spins} spins │ {formatValue(tWag, false)} wagered │ Net: <span style={{ color: tWon - tWag >= 0 ? "#00ff88" : "#ff4444" }}>{formatValue(tWon - tWag, false)}</span>
        </div>
      )}

      {/* VOL SELECTOR */}
      <div style={{ display: "flex", gap: 3, width: "100%", maxWidth: 540 }}>
        {Object.entries(PROFILES).map(([k, p]) => (
          <button key={k} onClick={() => { if (!spinning && !cascPlaying) setVol(k); }} disabled={spinning || cascPlaying} style={{ flex: 1, padding: "4px", borderRadius: 5, fontFamily: "inherit", cursor: "pointer", background: vol === k ? `${p.color}20` : "rgba(255,255,255,0.02)", border: vol === k ? `2px solid ${p.color}` : "1px solid rgba(255,255,255,0.08)", color: vol === k ? p.color : "#555", fontSize: "0.6rem", textAlign: "center" }}>
            <div style={{ fontWeight: "bold" }}>{p.name}</div>
          </button>
        ))}
      </div>

      {/* BALANCE BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 540, background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.12)", borderRadius: 6, padding: "4px 10px", fontSize: "0.7rem" }}>
        <div><span style={{ color: "#666", fontSize: "0.5rem" }}>BAL</span><br/><span style={{ color: "#ffd700", fontWeight: "bold" }}>{formatValue(bal, creditMode)}</span></div>
        <div style={{ textAlign: "center" }}>
          <span style={{ color: "#666", fontSize: "0.5rem" }}>{hideTrueCost ? "LINE BET" : "TOTAL BET"}</span><br/>
          <span style={{ color: "#ff6b35", fontWeight: "bold" }}>{hideTrueCost ? formatValue(bet / NP, creditMode) : formatValue(bet, creditMode)}</span>
          {hideTrueCost && <div style={{ fontSize: "0.4rem", color: "#444" }}>×{NP} lines</div>}
        </div>
        <div style={{ textAlign: "center" }}><span style={{ color: "#666", fontSize: "0.5rem" }}>RTP</span><br/><span style={{ color: tWag > 0 && Math.abs(tWon / tWag - TGT) < 0.02 ? "#00ff88" : "#ffa500", fontWeight: "bold" }}>{artRTP}%</span></div>
        <div style={{ textAlign: "right" }}><span style={{ color: "#666", fontSize: "0.5rem" }}>WIN</span><br/><span style={{ color: lastWin > 0 ? "#00ff88" : "#444", fontWeight: "bold" }}>{formatValue(lastWin, creditMode)}</span></div>
      </div>

      {/* Free spins / cascade bar */}
      {fsLeft > 0 && <div style={{ background: "linear-gradient(90deg, #4a0080, #8000ff, #4a0080)", color: "#fff", padding: "3px 12px", borderRadius: 6, fontSize: "0.7rem", fontWeight: "bold", textAlign: "center", width: "100%", maxWidth: 540, boxSizing: "border-box" }}>🌀 FREE: {fsLeft} │ {fsMult}x │ {formatValue(fsWins, creditMode)}</div>}
      {cascOn && (cascPlaying || cascLevel > 0) && <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>{prof.cm.map((m, i) => <div key={i} style={{ padding: "2px 6px", borderRadius: 3, fontSize: "0.6rem", fontWeight: "bold", background: i <= cascLevel && cascPlaying ? `rgba(255,215,0,${0.1 + i * 0.06})` : "rgba(255,255,255,0.02)", border: i === cascLevel && cascPlaying ? "1px solid #ffd700" : "1px solid rgba(255,255,255,0.06)", color: i <= cascLevel && cascPlaying ? "#ffd700" : "#333", transform: i === cascLevel && cascPlaying ? "scale(1.1)" : "scale(1)", transition: "all 0.2s" }}>{m}x</div>)}</div>}

      {/* ════ CELEBRATION OVERLAY ════ */}
      {showCeleb && celebLevel >= 3 && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 100, pointerEvents: "none", background: celebLevel >= 5 ? "rgba(255,215,0,0.08)" : "transparent" }}>
          <div style={{ fontSize: celebLevel >= 5 ? "2rem" : celebLevel >= 4 ? "1.5rem" : "1.2rem", fontWeight: "bold", color: "#ffd700", textShadow: "0 0 30px #ffd700, 0 0 60px #ff6b35", animation: "celebPulse 0.5s ease-out" }}>{celebMsg}</div>
          <div style={{ fontSize: "0.8rem", color: "#fff", marginTop: 4 }}>{formatValue(lastWin, creditMode)}</div>
          {/* LDW indicator (only visible when LDW tracking is exposed) */}
          {!ldwOn && lastWin > 0 && lastWin < bet && <div style={{ fontSize: "0.6rem", color: "#ff8800", marginTop: 4, background: "rgba(255,136,0,0.15)", padding: "2px 8px", borderRadius: 4 }}>⚠ LDW: Actually lost {formatValue(bet - lastWin, false)} net</div>}
        </div>
      )}

      {/* REEL GRID */}
      <div style={{ background: "linear-gradient(180deg, #1a1a3a, #0d0d2a)", border: `2px solid ${prof.color}44`, borderRadius: 9, padding: "5px", boxShadow: `0 0 20px ${prof.color}10`, width: "100%", maxWidth: 540, boxSizing: "border-box", position: "relative" }}>
        {multActive && <div style={{ textAlign: "center", color: "#ff00ff", fontWeight: "bold", fontSize: "0.8rem", textShadow: "0 0 8px #ff00ff" }}>✨{multActive}x✨</div>}
        {/* Small celebration for level 1-2 */}
        {showCeleb && celebLevel > 0 && celebLevel < 3 && <div style={{ textAlign: "center", color: celebLevel >= 2 ? "#00ff88" : "#ffd700", fontWeight: "bold", fontSize: "0.75rem", marginBottom: 2 }}>{celebMsg}</div>}

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${NR}, 1fr)`, gap: 2 }}>
          {Array.from({ length: NROW }).map((_, row) =>
            Array.from({ length: NR }).map((_, reel) => {
              const sym = dg[reel]?.[row] || SYM.cherry;
              const isW = hl.has(`${reel}-${row}`);
              const isX = exploding.has(`${reel}-${row}`);
              return (
                <div key={`${reel}-${row}`} style={{
                  background: isX ? "radial-gradient(circle, rgba(255,107,53,0.35), rgba(255,50,0,0.08))" : isW ? "radial-gradient(circle, rgba(0,255,136,0.15), rgba(0,255,136,0.03))" : row === 1 ? "rgba(255,215,0,0.02)" : "rgba(0,0,0,0.3)",
                  border: isX ? "2px solid #ff6b35" : isW ? "2px solid #00ff88" : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                  height: 50, fontSize: "1.5rem", transition: "all 0.2s",
                  opacity: isX ? 0.3 : 1, transform: isX ? "scale(0.6)" : "scale(1)",
                }}>{sym.emoji}</div>
              );
            })
          ).flat()}
        </div>
      </div>

      {/* MESSAGE — notice: empty on losses when celebOn (asymmetry) */}
      <div style={{ fontSize: "0.75rem", fontWeight: "bold", textAlign: "center", minHeight: 18, color: lastWin > 0 ? "#00ff88" : msg.includes("FREE") || msg.includes("BONUS") ? "#ff00ff" : msg.includes("CASCADE") ? "#ffd700" : "#888" }}>
        {msg}
        {/* Honest mode: show LDW indicator inline */}
        {!ldwOn && lastWin > 0 && lastWin < bet && <span style={{ color: "#ff8800", fontSize: "0.6rem", marginLeft: 6 }}>(LDW: net -{formatValue(bet - lastWin, false)})</span>}
      </div>

      {/* BONUS */}
      {bonusOn && <div style={{ background: "linear-gradient(180deg, #2a0040, #1a0030)", border: "2px solid #ff00ff", borderRadius: 9, padding: 10, width: "100%", maxWidth: 540, boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", fontWeight: "bold", color: "#ff00ff", fontSize: "0.75rem", marginBottom: 4 }}>🎰 PICK ({bLeft} left) │ {formatValue(bTotal, creditMode)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
          {bPrizes.map((p, i) => { const pk = bPicked.includes(i); return <button key={i} onClick={() => pickBonus(i)} disabled={pk || bLeft <= 0} style={{ background: pk ? "rgba(0,255,136,0.15)" : "rgba(255,0,255,0.1)", border: pk ? "2px solid #00ff88" : "1px solid rgba(255,0,255,0.2)", borderRadius: 6, padding: "8px 2px", color: pk ? "#00ff88" : "#fff", fontWeight: "bold", fontSize: "0.65rem", cursor: pk ? "default" : "pointer", fontFamily: "inherit" }}>{pk ? formatValue(p, creditMode) : "🎁"}</button>; })}
        </div>
      </div>}

      {/* CONTROLS */}
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 540 }}>
        <div style={{ display: "flex", gap: 2 }}>
          {[0.20, 0.50, 1, 2, 5, 10].map(b => (
            <button key={b} onClick={() => setBet(b)} disabled={spinning || cascPlaying} style={{ background: bet === b ? "rgba(255,107,53,0.2)" : "rgba(255,255,255,0.03)", border: bet === b ? "1px solid #ff6b35" : "1px solid rgba(255,255,255,0.08)", color: bet === b ? "#ff6b35" : "#777", borderRadius: 4, padding: "3px 6px", fontSize: "0.6rem", cursor: "pointer", fontFamily: "inherit", fontWeight: bet === b ? "bold" : "normal" }}>
              {hideTrueCost ? formatValue(b / NP, creditMode) : formatValue(b, creditMode)}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, width: "100%" }}>
          <button onClick={doSpin} disabled={spinning || bonusOn || cascPlaying || (fsLeft === 0 && bal < bet)} style={{
            flex: 2, background: spinning || cascPlaying ? "rgba(80,80,80,0.3)" : fsLeft > 0 ? "linear-gradient(180deg, #8000ff, #4a0080)" : `linear-gradient(180deg, ${prof.color}, ${prof.color}88)`,
            border: "none", borderRadius: 6, padding: "10px", fontSize: "0.9rem", fontWeight: "bold",
            color: spinning || cascPlaying ? "#444" : "#000", cursor: spinning || cascPlaying ? "not-allowed" : "pointer", fontFamily: "inherit", letterSpacing: "2px",
          }}>{spinning || cascPlaying ? "..." : fsLeft > 0 ? `🌀 (${fsLeft})` : "SPIN"}</button>

          {/* ── THE STOP BUTTON — Does nothing real, creates illusion of control ── */}
          {stopBtnOn && (
            <button onClick={handleStop} disabled={!spinning} style={{
              flex: 0.6, background: spinning ? "rgba(255,0,0,0.2)" : "rgba(255,255,255,0.02)",
              border: spinning ? "1px solid #ff4444" : "1px solid rgba(255,255,255,0.06)",
              borderRadius: 6, padding: "10px 4px", fontSize: "0.65rem", fontWeight: "bold",
              color: spinning ? "#ff4444" : "#333", cursor: spinning ? "pointer" : "default", fontFamily: "inherit",
            }}>STOP</button>
          )}

          <button onClick={() => { setAutoPlay(!autoPlay); if (autoPlay) autoRef.current = false; }} disabled={bonusOn || cascPlaying} style={{ flex: 0.4, background: autoPlay ? "rgba(255,0,0,0.15)" : "rgba(255,255,255,0.03)", border: autoPlay ? "1px solid #ff4444" : "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "10px 3px", fontSize: "0.55rem", color: autoPlay ? "#ff4444" : "#777", cursor: "pointer", fontFamily: "inherit" }}>{autoPlay ? "■" : "▶"}</button>
        </div>
      </div>

      {/* FEATURE/BANK ROW */}
      <div style={{ display: "flex", gap: 3, width: "100%", maxWidth: 540 }}>
        <button onClick={() => setCascOn(!cascOn)} disabled={spinning} style={{ flex: 1, padding: "4px", borderRadius: 4, fontFamily: "inherit", fontSize: "0.55rem", cursor: "pointer", background: cascOn ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.02)", border: cascOn ? "1px solid rgba(255,215,0,0.3)" : "1px solid rgba(255,255,255,0.06)", color: cascOn ? "#ffd700" : "#444" }}>⛓{cascOn ? "ON" : "OFF"}</button>
        <button onClick={() => setNmOn(!nmOn)} style={{ flex: 1, padding: "4px", borderRadius: 4, fontFamily: "inherit", fontSize: "0.55rem", cursor: "pointer", background: nmOn ? "rgba(255,107,53,0.1)" : "rgba(255,255,255,0.02)", border: nmOn ? "1px solid rgba(255,107,53,0.3)" : "1px solid rgba(255,255,255,0.06)", color: nmOn ? "#ff6b35" : "#444" }}>👁{nmOn ? "ON" : "OFF"}</button>
        <button onClick={() => { setBal(b => b - Math.floor(bal / 2)); setBanked(p => p + Math.floor(bal / 2)); }} disabled={bal < 2 || spinning} style={{ flex: 0.8, padding: "4px", borderRadius: 4, fontFamily: "inherit", fontSize: "0.55rem", cursor: "pointer", background: "rgba(0,200,100,0.06)", border: "1px solid rgba(0,200,100,0.15)", color: "#00c864" }}>BANK½</button>
        <div style={{ flex: 0.5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem", color: "#555" }}>🏦{formatValue(banked, creditMode)}</div>
        <button onClick={() => { setBal(b => b + banked); setBanked(0); }} disabled={banked <= 0 || spinning} style={{ flex: 0.5, padding: "4px", borderRadius: 4, fontFamily: "inherit", fontSize: "0.55rem", cursor: "pointer", background: "rgba(255,165,0,0.06)", border: "1px solid rgba(255,165,0,0.15)", color: "#ffa500" }}>OUT</button>
        <button onClick={() => {
          setBal(1000);setTWag(0);setTWon(0);setHist([]);setSpins(0);setCLoss(0);setCWin(0);setLastBonus(0);setRBets([]);setLastCorr(null);setDLog([]);setBanked(0);setPeak(1000);setFsLeft(0);setFsMult(1);setBonusOn(false);setAutoPlay(false);setCascStats({chains:0,steps:0,longest:0,wins:0});
          setDpStats({ldwCount:0,ldwTotalLost:0,trueWins:0,trueLosses:0,celebFake:0,celebReal:0,stopPresses:0,anticipEvents:0,sessionStart:Date.now(),totalSpinTime:0});
          setMsg("Reset!"); strips.current = bAll(prof.rc);
        }} style={{ padding: "4px 6px", borderRadius: 4, fontFamily: "inherit", fontSize: "0.55rem", cursor: "pointer", background: "rgba(255,0,0,0.06)", border: "1px solid rgba(255,0,0,0.15)", color: "#ff4444" }}>↺</button>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", width: "100%", maxWidth: 540, gap: 1 }}>
        {[["game","🎰"],["darkpat","🧠 DARK"],["algorithm","⚙️"],["cascade","⛓"],["volatility","📊"]].map(([t, l]) => (
          <button key={t} onClick={() => setActiveTab(t)} style={tabS(t)}>{l}</button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div style={{ width: "100%", maxWidth: 540, boxSizing: "border-box", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,215,0,0.08)", borderTop: "none", borderRadius: "0 0 6px 6px", padding: 8, fontSize: "0.6rem", lineHeight: 1.5, minHeight: 140 }}>

        {/* GAME */}
        {activeTab === "game" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 12px" }}>
              <span style={{ color: "#666" }}>Wagered:</span><span>{formatValue(tWag, creditMode)}</span>
              <span style={{ color: "#666" }}>Returned:</span><span>{formatValue(tWon, creditMode)}</span>
              <span style={{ color: "#666" }}>Net P/L:</span><span style={{ color: tWon - tWag >= 0 ? "#00ff88" : "#ff4444" }}>{formatValue(tWon - tWag, false)}</span>
              <span style={{ color: "#666" }}>True cost/spin:</span><span style={{ color: "#ff6b35" }}>{formatValue(bet, false)} ({NP} lines × {formatValue(bet/NP, false)})</span>
              <span style={{ color: "#666" }}>Spins:</span><span>{spins}</span>
              <span style={{ color: "#666" }}>LDW rate:</span><span style={{ color: "#ff8800" }}>{spins > 0 ? ((dpStats.ldwCount / spins) * 100).toFixed(1) : 0}% ({dpStats.ldwCount} events)</span>
              <span style={{ color: "#666" }}>True win rate:</span><span style={{ color: "#00ff88" }}>{spins > 0 ? ((dpStats.trueWins / spins) * 100).toFixed(1) : 0}%</span>
              <span style={{ color: "#666" }}>Cost/hour (est):</span><span style={{ color: "#ff4444" }}>{elapsed > 10000 ? formatValue(tWag / (elapsed / 3600000) * (1 - TGT), false) : "—"}/hr</span>
            </div>
            <div style={{ marginTop: 6, color: "#ffd700", fontWeight: "bold", fontSize: "0.55rem" }}>DECISION LOG</div>
            <div style={{ maxHeight: 80, overflowY: "auto", fontSize: "0.5rem" }}>
              {dLog.slice(0, 12).map((e, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "1px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <span style={{ color: "#444" }}>#{e.spin}</span>
                  <span style={{ color: e.cfg === "loose" ? "#00ff88" : e.cfg === "tight" ? "#ff4444" : "#ffa500" }}>{e.cfg}</span>
                  <span style={{ color: "#555" }}>{e.rtp}</span>
                  <span style={{ color: e.type === "LDW" ? "#ff8800" : e.type === "TRUE_WIN" ? "#00ff88" : e.type === "BREAK_EVEN" ? "#888" : "#ff4444", fontWeight: e.type === "LDW" ? "bold" : "normal" }}>{e.type.replace("_", " ")}</span>
                  <span style={{ color: e.won > 0 ? "#00ff88" : "#333" }}>{formatValue(e.won, creditMode)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
         * DARK PATTERNS TAB — The Educational Core of v4
         *
         * This tab exposes ALL psychological manipulation systems
         * with toggles, statistics, and explanations.
         * ═══════════════════════════════════════════════════════ */}
        {activeTab === "darkpat" && (
          <div>
            <div style={{ color: "#ff0066", fontWeight: "bold", marginBottom: 6, fontSize: "0.65rem" }}>🧠 PSYCHOLOGICAL MANIPULATION SYSTEMS</div>

            {/* TOGGLE GRID */}
            <div style={{ display: "grid", gap: 4, marginBottom: 8 }}>
              {[
                { key: "ldw", on: ldwOn, set: setLdwOn, label: "Losses Disguised as Wins", desc: "Celebrate when you win less than you bet. Your brain can't tell the difference.", color: "#ff8800", stat: `${dpStats.ldwCount} LDWs, lost ${formatValue(dpStats.ldwTotalLost, false)} during \"wins\"` },
                { key: "stop", on: stopBtnOn, set: setStopBtnOn, label: "Stop Button (Illusory Control)", desc: "The STOP button skips animation only. Outcome was decided at SPIN. Creates false sense of skill.", color: "#ff4444", stat: `Pressed ${dpStats.stopPresses} times (no effect on outcomes)` },
                { key: "celeb", on: celebOn, set: setCelebOn, label: "Celebration Asymmetry", desc: "Wins get fireworks. Losses get silence. You remember wins vividly, forget losses.", color: "#ffd700", stat: `${dpStats.celebFake} fake celebrations (LDW), ${dpStats.celebReal} real` },
                { key: "antic", on: anticipOn, set: setAnticipOn, label: "Reel Anticipation Slowdown", desc: "Reels slow when bonus symbols appear early. Builds suspense for a decided outcome.", color: "#ff00ff", stat: `${dpStats.anticipEvents} slowdown events` },
                { key: "credit", on: creditMode, set: setCreditMode, label: "Credit Obfuscation", desc: "Show 'CREDITS' not '£'. 500 credits feels like play money. £5 feels like real money.", color: "#0096ff", stat: creditMode ? `Displaying as credits (${CREDIT_RATIO}:1)` : "Showing real currency" },
                { key: "time", on: hideTime, set: setHideTime, label: "Session Time Dissolution", desc: "Hide the clock. Real casinos have no windows, no clocks. You lose track of time.", color: "#cc00cc", stat: `Session: ${fmtTime(elapsed)}, ~${elapsed > 10000 ? (spins / (elapsed / 60000)).toFixed(1) : "—"} spins/min` },
                { key: "cost", on: hideTrueCost, set: setHideTrueCost, label: "Bet Complexity Hiding", desc: `Show \"${formatValue(bet/NP, false)}/line\" not \"${formatValue(bet, false)}/spin\". Hides true cost behind line count.`, color: "#00cc99", stat: `True cost: ${formatValue(bet, false)}/spin (${NP} × ${formatValue(bet/NP, false)})` },
              ].map(dp => (
                <div key={dp.key} style={{ background: dp.on ? `${dp.color}0a` : "rgba(255,255,255,0.01)", border: `1px solid ${dp.on ? dp.color + "40" : "rgba(255,255,255,0.06)"}`, borderRadius: 5, padding: "5px 8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontWeight: "bold", color: dp.on ? dp.color : "#555", fontSize: "0.58rem" }}>{dp.label}</span>
                      <div style={{ fontSize: "0.5rem", color: "#666", marginTop: 1 }}>{dp.desc}</div>
                    </div>
                    <button onClick={() => dp.set(!dp.on)} style={{
                      width: 38, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
                      background: dp.on ? dp.color : "rgba(255,255,255,0.1)",
                      position: "relative", flexShrink: 0,
                    }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%", background: "#fff",
                        position: "absolute", top: 2, left: dp.on ? 20 : 2,
                        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      }} />
                    </button>
                  </div>
                  <div style={{ fontSize: "0.48rem", color: "#555", marginTop: 2 }}>{dp.stat}</div>
                </div>
              ))}
            </div>

            {/* QUICK PRESETS */}
            <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
              <button onClick={() => { setLdwOn(true); setStopBtnOn(true); setCelebOn(true); setAnticipOn(true); setCreditMode(true); setHideTime(true); setHideTrueCost(true); }} style={{ flex: 1, padding: "5px", borderRadius: 4, background: "rgba(255,0,102,0.12)", border: "1px solid rgba(255,0,102,0.3)", color: "#ff0066", cursor: "pointer", fontFamily: "inherit", fontSize: "0.55rem", fontWeight: "bold" }}>🎰 CASINO MODE (All ON)</button>
              <button onClick={() => { setLdwOn(false); setStopBtnOn(false); setCelebOn(false); setAnticipOn(false); setCreditMode(false); setHideTime(false); setHideTrueCost(false); }} style={{ flex: 1, padding: "5px", borderRadius: 4, background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88", cursor: "pointer", fontFamily: "inherit", fontSize: "0.55rem", fontWeight: "bold" }}>✅ HONEST MODE (All OFF)</button>
            </div>

            {/* IMPACT SUMMARY */}
            <div style={{ background: "rgba(255,0,102,0.06)", borderRadius: 5, padding: 6, fontSize: "0.52rem", color: "#cc6688", lineHeight: 1.5 }}>
              <b>CUMULATIVE IMPACT:</b> In this session, {dpStats.ldwCount} spins were celebrated as "wins" that actually lost you a combined {formatValue(dpStats.ldwTotalLost, false)}. You pressed the stop button {dpStats.stopPresses} times with zero effect on outcomes. {dpStats.celebFake > 0 ? `${((dpStats.celebFake / Math.max(1, dpStats.celebFake + dpStats.celebReal)) * 100).toFixed(0)}% of all celebrations were for losses.` : ""} Toggle to HONEST MODE and feel the difference — the game feels much less "generous" when you see the reality.
            </div>
          </div>
        )}

        {/* ALGORITHM */}
        {activeTab === "algorithm" && lastCorr && (
          <div>
            <div style={{ color: "#0096ff", fontWeight: "bold", marginBottom: 4 }}>⚙️ RTP ENGINE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 12px" }}>
              <span style={{ color: "#666" }}>Strip:</span><span style={{ color: lastCorr.sc === "loose" ? "#00ff88" : lastCorr.sc === "tight" ? "#ff4444" : "#ffa500", fontWeight: "bold" }}>{lastCorr.sc.toUpperCase()}</span>
              <span style={{ color: "#666" }}>Correction:</span><span>{lastCorr.corr.toFixed(4)}</span>
              <span style={{ color: "#666" }}>Deviation:</span><span>{(lastCorr.dev * 100).toFixed(3)}%</span>
            </div>
            {Object.entries(lastCorr.rw).map(([n, r]) => (
              <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                <span style={{ color: "#666", width: 35 }}>{n}</span>
                <div style={{ width: 60, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, position: "relative" }}>
                  <div style={{ position: "absolute", left: "50%", width: 1, height: "100%", background: "rgba(255,255,255,0.1)" }} />
                  <div style={{ position: "absolute", left: `${Math.max(2, Math.min(98, 50 + (r - TGT) * 500))}%`, width: 3, height: "100%", background: Math.abs(r - TGT) < 0.03 ? "#00ff88" : "#ffa500", borderRadius: 1 }} />
                </div>
                <span style={{ color: "#888", width: 40, textAlign: "right", fontSize: "0.55rem" }}>{(r * 100).toFixed(1)}%</span>
              </div>
            ))}
            {lastCorr.reasons.map((r, i) => <div key={i} style={{ color: "#77aaff", paddingLeft: 6, fontSize: "0.52rem" }}>▸ {r}</div>)}
          </div>
        )}

        {/* CASCADE */}
        {activeTab === "cascade" && (
          <div>
            <div style={{ color: "#ffd700", fontWeight: "bold", marginBottom: 4 }}>⛓ CASCADE ENGINE ({prof.name} vol)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 12px" }}>
              <span style={{ color: "#666" }}>System:</span><span style={{ color: cascOn ? "#00ff88" : "#ff4444" }}>{cascOn ? "ACTIVE" : "OFF"}</span>
              <span style={{ color: "#666" }}>Total chains:</span><span>{cascStats.chains}</span>
              <span style={{ color: "#666" }}>Longest:</span><span>{cascStats.longest}</span>
              <span style={{ color: "#666" }}>Cascade wins:</span><span>{formatValue(cascStats.wins, creditMode)}</span>
            </div>
            <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
              {prof.cm.map((m, i) => <div key={i} style={{ padding: "3px 6px", borderRadius: "50%", border: "1px solid rgba(255,215,0,0.2)", fontSize: "0.6rem", color: "#ffd700", textAlign: "center" }}>{m}×</div>)}
            </div>
          </div>
        )}

        {/* VOLATILITY */}
        {activeTab === "volatility" && (
          <div>
            <div style={{ color: "#ffd700", fontWeight: "bold", marginBottom: 4 }}>📊 VOLATILITY</div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: "1px 6px", fontSize: "0.55rem" }}>
              <div style={{ color: "#555" }}>Metric</div>
              {Object.values(PROFILES).map((p, i) => <div key={i} style={{ color: p.color, fontWeight: "bold", textAlign: "center" }}>{p.name}</div>)}
              <div style={{ color: "#666" }}>Top pay</div>
              {Object.values(PROFILES).map((p, i) => <div key={i} style={{ textAlign: "center" }}>{p.pt.seven[5]}×</div>)}
              <div style={{ color: "#666" }}>Bottom pay</div>
              {Object.values(PROFILES).map((p, i) => <div key={i} style={{ textAlign: "center" }}>{p.pt.cherry[3]}×</div>)}
              <div style={{ color: "#666" }}>Spread</div>
              {Object.values(PROFILES).map((p, i) => <div key={i} style={{ textAlign: "center" }}>{(p.pt.seven[5] / p.pt.cherry[3]).toFixed(0)}:1</div>)}
              <div style={{ color: "#666" }}>Max cascade</div>
              {Object.values(PROFILES).map((p, i) => <div key={i} style={{ textAlign: "center", fontWeight: "bold", color: p.color }}>{p.cm[p.cm.length - 1]}×</div>)}
            </div>
          </div>
        )}
      </div>

      <style>{`
        button:hover:not(:disabled) { filter: brightness(1.15); }
        button:active:not(:disabled) { transform: scale(0.97); }
        @keyframes celebPulse { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}
