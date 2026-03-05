/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║          FORTUNE ENGINE v5 — COMPLETE PSYCHOLOGICAL TOOLKIT         ║
 * ║                                                                      ║
 * ║  NEW IN v5:                                                          ║
 * ║                                                                      ║
 * ║  8. PROGRESSIVE JACKPOT DISPLAY                                     ║
 * ║     A counter that grows with every spin, funded by a tiny %         ║
 * ║     of each bet (typically 1-2%). Creates FOMO — "it's so high,     ║
 * ║     someone has to win soon!" In reality, the jackpot is just       ║
 * ║     a savings account of skimmed bets with a random trigger.        ║
 * ║     The counter NEVER resets to zero — it "reseeds" at a high       ║
 * ║     base so it always looks temptingly large.                        ║
 * ║                                                                      ║
 * ║  9. GAMBLER'S FALLACY EXPLOITATION                                  ║
 * ║     Fake "HOT STREAK" / "COLD" indicators, "BONUS DUE" alerts,     ║
 * ║     and streak counters. Every spin is mathematically independent.  ║
 * ║     These displays are meaningless noise — but humans can't help    ║
 * ║     seeing patterns. Casinos exploit this with "hot machine" lights ║
 * ║     and bonus probability meters.                                    ║
 * ║                                                                      ║
 * ║  10. AUTOPLAY SPEED ACCELERATION                                    ║
 * ║      Autoplay runs ~40% faster than manual play. Same RTP, but     ║
 * ║      more spins per minute = faster money transfer to house.        ║
 * ║      Tracked with spins/minute comparison.                          ║
 * ║                                                                      ║
 * ║  11. ASYMMETRIC SOUND DESIGN (via Tone.js)                         ║
 * ║      Rising pitch approaching wins, celebratory tones on hits,     ║
 * ║      escalating frequencies with win size, and SILENCE on losses.  ║
 * ║      The audio channel bypasses conscious processing and directly  ║
 * ║      triggers emotional responses.                                   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { useState, useRef, useCallback, useEffect } from "react";
import * as Tone from "tone";

/* ═══════════════════════════════════════════════════════════════════
 * CORE CONFIG
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
const SCAT_PAY = { 3: 5, 4: 20, 5: 50 }, FS_AWARD = { 3: 10, 4: 15, 5: 25 };

const PROFILES = {
  low: { name: "Low", label: "STEADY", color: "#00cc66", pt: { cherry:{3:3,4:8,5:20},lemon:{3:3,4:8,5:20},orange:{3:5,4:15,5:40},grape:{3:5,4:15,5:40},bell:{3:12,4:35,5:80},diamond:{3:20,4:60,5:150},seven:{3:30,4:90,5:200},wild:{3:30,4:90,5:200}}, rc:{loose:{cherry:9,lemon:9,orange:10,grape:10,bell:9,diamond:6,seven:4,wild:4,scatter:2,bonus:1},standard:{cherry:10,lemon:10,orange:11,grape:11,bell:8,diamond:5,seven:3,wild:3,scatter:1,bonus:1},tight:{cherry:12,lemon:12,orange:11,grape:11,bell:7,diamond:4,seven:2,wild:2,scatter:1,bonus:0}}, cm:[1,1.5,2,3,4,5], mc:0.05, ms:[{mult:2,weight:50},{mult:3,weight:30},{mult:4,weight:15},{mult:5,weight:5}] },
  medium: { name: "Med", label: "BALANCED", color: "#ffa500", pt: { cherry:{3:5,4:15,5:40},lemon:{3:5,4:15,5:40},orange:{3:10,4:30,5:75},grape:{3:10,4:30,5:75},bell:{3:25,4:75,5:200},diamond:{3:50,4:150,5:500},seven:{3:100,4:300,5:1000},wild:{3:100,4:300,5:1000}}, rc:{loose:{cherry:12,lemon:11,orange:9,grape:9,bell:7,diamond:5,seven:4,wild:4,scatter:2,bonus:1},standard:{cherry:14,lemon:13,orange:10,grape:10,bell:6,diamond:4,seven:3,wild:2,scatter:1,bonus:1},tight:{cherry:16,lemon:15,orange:11,grape:10,bell:5,diamond:3,seven:2,wild:1,scatter:1,bonus:0}}, cm:[1,2,3,5,8,12], mc:0.03, ms:[{mult:2,weight:35},{mult:3,weight:25},{mult:5,weight:15},{mult:7,weight:10},{mult:10,weight:5}] },
  high: { name: "High", label: "JACKPOT", color: "#ff4444", pt: { cherry:{3:8,4:25,5:60},lemon:{3:8,4:25,5:60},orange:{3:15,4:50,5:120},grape:{3:15,4:50,5:120},bell:{3:40,4:125,5:400},diamond:{3:80,4:300,5:1000},seven:{3:200,4:750,5:2500},wild:{3:200,4:750,5:2500}}, rc:{loose:{cherry:15,lemon:14,orange:8,grape:8,bell:6,diamond:4,seven:3,wild:3,scatter:2,bonus:1},standard:{cherry:18,lemon:17,orange:9,grape:9,bell:4,diamond:3,seven:2,wild:1,scatter:1,bonus:1},tight:{cherry:20,lemon:19,orange:10,grape:9,bell:3,diamond:2,seven:1,wild:0,scatter:1,bonus:0}}, cm:[1,2,4,8,15,25], mc:0.02, ms:[{mult:2,weight:25},{mult:3,weight:20},{mult:5,weight:20},{mult:10,weight:15},{mult:15,weight:10},{mult:25,weight:5}] },
};

/* ═══════════════════════════════════════════════════════════════════
 * CORE MECHANICS (condensed)
 * ═══════════════════════════════════════════════════════════════════ */
function bStrip(w){const s=[];for(const[id,c]of Object.entries(w))for(let i=0;i<c;i++)s.push(SYM[id]);for(let i=s.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[s[i],s[j]]=[s[j],s[i]];}return s;}
function bAll(rc){const s={};for(const[c,w]of Object.entries(rc)){s[c]=[];for(let r=0;r<NR;r++)s[c].push(bStrip(w));}return s;}
function doSpin(strips){const g=[];for(let r=0;r<NR;r++){const s=strips[r],p=Math.floor(Math.random()*s.length),c=[];for(let row=0;row<NROW;row++)c.push(s[(p+row)%s.length]);g.push(c);}return g;}
function evalPL(grid,bpl,pt){const w=[];for(let li=0;li<NP;li++){const line=PL[li],ls=line.map((r,i)=>grid[i][r]);let ms=null;for(const s of ls)if(s.id!=="wild"&&s.id!=="scatter"&&s.id!=="bonus"){ms=s;break;}if(!ms){if(ls.every(s=>s.id==="wild"))ms=SYM.wild;else continue;}let c=0;for(const s of ls)if(s.id===ms.id||s.id==="wild")c++;else break;if(c>=3&&pt[ms.id]?.[c])w.push({li,sym:ms,c,mult:pt[ms.id][c],pay:pt[ms.id][c]*bpl,pos:line.slice(0,c).map((r,i)=>({r:i,row:r}))});}return w;}
function evalScat(g,tb){let c=0;const p=[];for(let r=0;r<NR;r++)for(let row=0;row<NROW;row++)if(g[r][row].id==="scatter"){c++;p.push({r,row});}return{c,p,pay:c>=3?(SCAT_PAY[c]||0)*tb:0,fs:c>=3?FS_AWARD[c]||0:0};}
function evalBonus(g){let c=0;const p=[];for(const r of[0,2,4])for(let row=0;row<NROW;row++)if(g[r][row].id==="bonus"){c++;p.push({r,row});}return{t:c>=3,c,p};}
function cascGrid(grid,wp,rc,sc){const ng=[];const ws=rc[sc],we=Object.entries(ws),tw=we.reduce((s,[,w])=>s+w,0);function rs(){let r=Math.random()*tw;for(const[id,w]of we){r-=w;if(r<=0)return SYM[id];}return SYM.cherry;}for(let r=0;r<NR;r++){const col=grid[r],sv=[];for(let row=0;row<NROW;row++)if(!wp.has(`${r}-${row}`))sv.push(col[row]);const nc=new Array(NROW),nn=NROW-sv.length;for(let i=0;i<nn;i++)nc[i]=rs();for(let i=0;i<sv.length;i++)nc[nn+i]=sv[i];ng.push(nc);}return ng;}
function resCasc(ig,bpl,tb,prof,sc){const cms=prof.cm,ch=[];let cg=ig,cl=0;while(cl<20){const w=evalPL(cg,bpl,prof.pt);if(!w.length)break;const cm=cms[Math.min(cl,cms.length-1)];const cw=w.reduce((s,x)=>s+x.pay,0)*cm;const wp=new Set();w.forEach(x=>x.pos.forEach(p=>wp.add(`${p.r}-${p.row}`)));ch.push({l:cl,grid:cg.map(c=>[...c]),wins:w,wp:[...wp],mult:cm,cw,acc:ch.reduce((s,x)=>s+x.cw,0)+cw});cg=cascGrid(cg,wp,prof.rc,sc);cl++;}return{ch,fg:cg,tw:ch.reduce((s,x)=>s+x.cw,0),tc:ch.length};}
function calcCorr(st){const{totalWagered:tw,totalWon:twn,spinHistory:sh,consecutiveLosses:cl,consecutiveWins:cw,lastBonusSpin:lb,spinCount:sc,recentBets:rb,bankedTotal:bt}=st;const wins={s:sh.slice(-20),m:sh.slice(-100),l:sh.slice(-500),a:sh};const rw={};for(const[n,w]of Object.entries(wins)){if(!w.length){rw[n]=TGT;continue;}const wg=w.reduce((s,h)=>s+h.b,0);rw[n]=wg>0?w.reduce((s,h)=>s+h.w,0)/wg:TGT;}const wr=rw.s*0.1+rw.m*0.25+rw.l*0.35+rw.a*0.3,dev=wr-TGT,cb=(1/(1+Math.exp(-15*dev))-0.5)*2;let sm=0;const reasons=[];if(cl>15){sm-=0.15;reasons.push(`Drought(${cl})`);}else if(cl>8){sm-=0.08;reasons.push(`Losing(${cl})`);}if(cw>5){sm+=0.12;reasons.push(`Hot(${cw})`);}const ssb=sc-lb;if(ssb>150){sm-=0.05;reasons.push(`BonusDue(${ssb})`);}if(!reasons.length)reasons.push("Std");const f=Math.max(-1,Math.min(1,cb+sm));return{sc:f<-0.3?"loose":f>0.3?"tight":"standard",corr:f,dev,wr,rw,reasons,sig:cb,sm};}
function nmApply(grid,isWin,streak,stats){if(isWin&&Math.random()>0.15){stats.on=false;return grid;}if(Math.random()>0.65){stats.on=false;return grid;}stats.on=true;const mg=grid.map(c=>[...c]);let cells=0;const max=Math.floor(NR*2*0.45);const nw={cherry:2,lemon:2,orange:3,grape:3,bell:5,diamond:10,seven:16,wild:12,scatter:4,bonus:3};for(let r=0;r<NR;r++)for(const row of[0,2]){if(cells>=max)break;if(Math.random()>0.45)continue;const ent=Object.entries(nw),tot=ent.reduce((s,[,v])=>s+v,0);let roll=Math.random()*tot;let nm=SYM.cherry;for(const[id,v]of ent){roll-=v;if(roll<=0){nm=SYM[id];break;}}if(nm.tier>mg[r][row].tier){mg[r][row]=nm;cells++;}}stats.cells=cells;return mg;}
function spinMW(segs){const t=segs.reduce((s,x)=>s+x.weight,0);let r=Math.random()*t;for(const x of segs){r-=x.weight;if(r<=0)return x.mult;}return 2;}
function genBonus(tb,corr){const pool=tb*25*(corr<-0.2?1.4:corr>0.2?0.7:1);const ws=[.02,.03,.05,.06,.07,.08,.10,.11,.12,.13,.11,.12];const p=ws.map(w=>Math.round(pool*w*(0.5+Math.random())));for(let i=p.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[p[i],p[j]]=[p[j],p[i]];}return p;}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION: SOUND DESIGN ENGINE (via Tone.js)
 *
 * Asymmetric audio is one of the most powerful subconscious
 * manipulators in slot design. Sounds bypass conscious processing
 * and directly trigger emotional responses.
 *
 * KEY PRINCIPLES:
 * - Wins: Major key, rising pitch, sustained tones, harmonics
 * - Losses: SILENCE. Nothing. Zero audio feedback.
 * - Near-wins: Tension tones (minor seconds, unresolved chords)
 * - Reel stops: Satisfying "thunk" per reel (tactile feedback)
 * - Anticipation: Rising frequency as bonus symbols appear
 * - Big wins: Extended musical phrases, layered harmonics
 *
 * The silence on losses is crucial. Without audio encoding,
 * losses are processed as "nothing happened" by memory systems.
 * Wins create vivid audio-visual memories that persist.
 * ═══════════════════════════════════════════════════════════════════ */

let synthsInitialized = false;
let synth, bellSynth, noiseSynth;

function initAudio() {
  if (synthsInitialized) return;
  try {
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.3 },
      volume: -18,
    }).toDestination();

    bellSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.005, decay: 0.4, sustain: 0, release: 0.5 },
      volume: -20,
    }).toDestination();

    noiseSynth = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 },
      volume: -30,
    }).toDestination();

    synthsInitialized = true;
  } catch (e) { /* Audio not available */ }
}

/**
 * SOUND EVENTS
 *
 * Each event maps to a specific player experience moment.
 * The frequency choices are deliberate:
 * - C major arpeggio for wins (happy, resolved)
 * - Rising chromatic for anticipation (tension)
 * - Perfect fifth intervals for big wins (triumphant)
 */
function playReelStop(reelIndex) {
  if (!synthsInitialized) return;
  try {
    // Each reel gets a slightly higher pitched "thunk"
    // This creates an ascending sequence: anticipation builds
    const notes = ["C3", "D3", "E3", "F3", "G3"];
    bellSynth.triggerAttackRelease(notes[reelIndex], "16n", Tone.now(), 0.3);
    noiseSynth.triggerAttackRelease("32n");
  } catch(e) {}
}

function playWinSound(ratio) {
  // ratio = winAmount / betAmount
  if (!synthsInitialized || ratio <= 0) return;
  try {
    const now = Tone.now();
    if (ratio >= 25) {
      // MEGA WIN — full arpeggio + octave jump
      synth.triggerAttackRelease("C4", "8n", now, 0.5);
      synth.triggerAttackRelease("E4", "8n", now + 0.1, 0.5);
      synth.triggerAttackRelease("G4", "8n", now + 0.2, 0.5);
      synth.triggerAttackRelease("C5", "4n", now + 0.3, 0.6);
      bellSynth.triggerAttackRelease("C6", "2n", now + 0.4, 0.3);
    } else if (ratio >= 5) {
      // BIG WIN — major chord + fifth
      synth.triggerAttackRelease("C4", "8n", now, 0.4);
      synth.triggerAttackRelease("E4", "8n", now + 0.08, 0.4);
      synth.triggerAttackRelease("G4", "8n", now + 0.16, 0.4);
      bellSynth.triggerAttackRelease("C5", "4n", now + 0.24, 0.3);
    } else if (ratio >= 1) {
      // True win — ascending dyad
      synth.triggerAttackRelease("E4", "16n", now, 0.3);
      synth.triggerAttackRelease("G4", "16n", now + 0.08, 0.3);
    } else {
      // LDW — single muted note (still "sounds like a win")
      synth.triggerAttackRelease("C4", "16n", now, 0.15);
    }
  } catch(e) {}
}

function playAnticipationTone(level) {
  // Rising tension — minor second intervals
  if (!synthsInitialized) return;
  try {
    const tones = ["E3", "F3", "F#3", "G3", "G#3"];
    bellSynth.triggerAttackRelease(
      tones[Math.min(level, tones.length - 1)],
      "8n", Tone.now(), 0.2
    );
  } catch(e) {}
}

function playCascadeSound(level) {
  if (!synthsInitialized) return;
  try {
    // Each cascade level gets a higher pitched celebration
    const base = 261.63 * Math.pow(1.1, level); // Rising pitch per cascade
    synth.triggerAttackRelease(
      Tone.Frequency(base, "hz").toNote(),
      "8n", Tone.now(), 0.3 + level * 0.05
    );
  } catch(e) {}
}

function playBonusTrigger() {
  if (!synthsInitialized) return;
  try {
    const now = Tone.now();
    bellSynth.triggerAttackRelease("G5", "8n", now, 0.4);
    bellSynth.triggerAttackRelease("B5", "8n", now + 0.15, 0.4);
    bellSynth.triggerAttackRelease("D6", "4n", now + 0.3, 0.5);
  } catch(e) {}
}

// Losses: SILENCE. This is the sound design. Nothing to hear.

/* ═══════════════════════════════════════════════════════════════════
 * SECTION: PROGRESSIVE JACKPOT ENGINE
 *
 * A progressive jackpot is a shared prize pool that grows with
 * every bet placed. Typically 1-2% of each bet is diverted to
 * the jackpot pool. The jackpot triggers randomly (usually with
 * a probability inversely proportional to its current size).
 *
 * KEY DECEPTION: The jackpot display creates urgency — "it's so
 * high, it must pay soon!" But the trigger probability is usually
 * independent of the amount. A jackpot at £50,000 has the same
 * chance of hitting as one at £10,000.
 *
 * RESEED: When hit, the jackpot doesn't go to zero. It "reseeds"
 * at a high base value (e.g., £10,000) so it always looks big.
 * A jackpot showing "£152.34" would make players feel it's not
 * worth chasing. Starting at "£10,152.34" feels substantial.
 *
 * HOUSE FUNDING: The jackpot comes from player bets. It's not
 * the house's money — it's redistributed player money with
 * a presentation that makes it feel like a gift.
 * ═══════════════════════════════════════════════════════════════════ */

const JACKPOT_CONFIG = {
  /** Percentage of each bet diverted to jackpot pool */
  contribution: 0.015, // 1.5% of every bet

  /** Base "reseed" value when jackpot is won */
  seedAmount: 250,

  /**
   * Trigger probability per spin.
   * At 1 in 50,000 spins, with an average bet of £1,
   * the expected jackpot at trigger is about £750.
   * This is deliberately set high for demo purposes;
   * real progressives are often 1 in 1,000,000+.
   */
  triggerProbability: 0.00002,

  /** Fake "other players contributing" tick rate */
  phantomContribution: 0.003, // Simulated other players adding to pot
};

/* ═══════════════════════════════════════════════════════════════════
 * SECTION: GAMBLER'S FALLACY INDICATORS
 *
 * These are deliberately misleading displays that suggest
 * patterns exist in random outcomes. They exploit the human
 * cognitive bias toward pattern recognition.
 *
 * CRITICAL: None of these indicators have ANY predictive value.
 * Each spin is independent. The "BONUS DUE" meter is pure fiction.
 * The "hot streak" indicator is meaningless. But displaying them
 * makes players believe they can time their bets strategically.
 *
 * Research (Sundali & Croson, 2006): Players who see streak
 * information bet 12-18% more after perceived "cold" streaks,
 * believing a win is "due" — the textbook gambler's fallacy.
 * ═══════════════════════════════════════════════════════════════════ */

function generateFallacyIndicators(state) {
  const { spinCount, consecutiveLosses, consecutiveWins, lastBonusSpin } = state;
  const spinsSinceBonus = spinCount - lastBonusSpin;

  // "Heat" meter — completely fake, based on recent win/loss
  // but presented as if it predicts future outcomes
  let heat;
  if (consecutiveWins > 3) heat = { level: "🔥 HOT", color: "#ff4444", value: 0.8 + Math.random() * 0.2 };
  else if (consecutiveLosses > 8) heat = { level: "❄️ COLD", color: "#4444ff", value: 0.1 + Math.random() * 0.1 };
  else heat = { level: "⚡ WARM", color: "#ffa500", value: 0.4 + Math.random() * 0.2 };

  // "Bonus probability meter" — fake progress bar
  // Rises over time to suggest bonus is "due"
  // In reality, each spin has the same independent chance
  const bonusMeter = Math.min(0.95, spinsSinceBonus / 200 + Math.random() * 0.1);

  // "Lucky streak" indicator — meaningless pattern display
  const streakMsg = consecutiveWins > 2
    ? `${consecutiveWins} WIN STREAK! Keep going!`
    : consecutiveLosses > 5
      ? `Due for a win! ${consecutiveLosses} cold spins`
      : "Warming up...";

  // "Recent trend" — shows last 10 results as if they predict future
  return { heat, bonusMeter, streakMsg };
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

  const initSyms = () => { const g=[],a=SYMBOLS.filter(s=>s.tier>0); for(let r=0;r<NR;r++){const c=[];for(let row=0;row<NROW;row++)c.push(a[Math.floor(Math.random()*a.length)]);g.push(c);}return g;};
  const [grid, setGrid] = useState(initSyms);
  const [spinning, setSpinning] = useState(false);
  const [dispGrid, setDispGrid] = useState(null);
  const [lastWin, setLastWin] = useState(0);
  const [winLines, setWinLines] = useState([]);
  const [msg, setMsg] = useState("Choose your weapons and spin!");

  const [cascOn, setCascOn] = useState(true);
  const [cascPlaying, setCascPlaying] = useState(false);
  const [cascLevel, setCascLevel] = useState(0);
  const [cascTW, setCascTW] = useState(0);
  const [exploding, setExploding] = useState(new Set());

  const [hist, setHist] = useState([]);
  const [spins, setSpins] = useState(0);
  const [cLoss, setCLoss] = useState(0);
  const [cWin, setCWin] = useState(0);
  const [lastBon, setLastBon] = useState(0);
  const [rBets, setRBets] = useState([]);
  const [lastCorr, setLastCorr] = useState(null);
  const [dLog, setDLog] = useState([]);

  const [nmOn, setNmOn] = useState(true);
  const [fsLeft, setFsLeft] = useState(0);
  const [fsMult, setFsMult] = useState(1);
  const [fsWins, setFsWins] = useState(0);
  const [bonusOn, setBonusOn] = useState(false);
  const [bPrizes, setBPrizes] = useState([]);
  const [bPicked, setBPicked] = useState([]);
  const [bLeft, setBLeft] = useState(0);
  const [bTotal, setBTotal] = useState(0);
  const [multAct, setMultAct] = useState(null);

  // ── DARK PATTERN TOGGLES (11 total) ──
  const [ldwOn, setLdwOn] = useState(true);
  const [stopBtnOn, setStopBtnOn] = useState(true);
  const [celebOn, setCelebOn] = useState(true);
  const [anticipOn, setAnticipOn] = useState(true);
  const [creditMode, setCreditMode] = useState(false);
  const [hideTime, setHideTime] = useState(false);
  const [hideTrueCost, setHideTrueCost] = useState(true);
  // v5 new:
  const [soundOn, setSoundOn] = useState(false); // Off by default (requires user gesture)
  const [jackpotOn, setJackpotOn] = useState(true);
  const [fallacyOn, setFallacyOn] = useState(true);
  const [autoSpeedOn, setAutoSpeedOn] = useState(true);

  // Progressive jackpot
  const [jackpotPool, setJackpotPool] = useState(JACKPOT_CONFIG.seedAmount);
  const [jackpotWon, setJackpotWon] = useState(false);
  const [jackpotWonAmount, setJackpotWonAmount] = useState(0);
  const [jackpotTotalContributed, setJackpotTotalContributed] = useState(0);

  // Gambler's fallacy indicators
  const [fallacyData, setFallacyData] = useState({ heat: { level: "⚡ WARM", color: "#ffa500", value: 0.5 }, bonusMeter: 0, streakMsg: "Warming up..." });

  // Tracking
  const [dpStats, setDpStats] = useState({
    ldwCount: 0, ldwLost: 0, trueWins: 0, trueLosses: 0,
    celebFake: 0, celebReal: 0, stopPresses: 0, anticipEvents: 0,
    sessionStart: Date.now(), totalSpinTime: 0,
    manualSpins: 0, autoSpins: 0, manualTime: 0, autoTime: 0,
  });
  const [celebLevel, setCelebLevel] = useState(0);
  const [showCeleb, setShowCeleb] = useState(false);
  const [celebMsg, setCelebMsg] = useState("");

  const [activeTab, setActiveTab] = useState("game");
  const [autoPlay, setAutoPlay] = useState(false);

  const stripsRef = useRef(bAll(prof.rc));
  const autoRef = useRef(false);
  const tmRef = useRef(null);
  const spinStartRef = useRef(0);
  const stopRef = useRef(false);

  useEffect(() => { autoRef.current = autoPlay; }, [autoPlay]);
  useEffect(() => () => { if (tmRef.current) clearTimeout(tmRef.current); }, []);
  useEffect(() => { stripsRef.current = bAll(PROFILES[vol].rc); }, [vol]);

  // Phantom jackpot ticking (simulates other players contributing)
  useEffect(() => {
    if (!jackpotOn) return;
    const t = setInterval(() => {
      setJackpotPool(p => p + JACKPOT_CONFIG.phantomContribution * (0.5 + Math.random()));
    }, 800 + Math.random() * 400);
    return () => clearInterval(t);
  }, [jackpotOn]);

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { const t = setInterval(() => setElapsed(Date.now() - dpStats.sessionStart), 1000); return () => clearInterval(t); }, [dpStats.sessionStart]);

  function fmtTime(ms) { const s=Math.floor(ms/1000),m=Math.floor(s/60),h=Math.floor(m/60); return `${h}:${String(m%60).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }
  const CR = 100;
  function fv(amt, cr) { return cr ? `${Math.round(amt * CR).toLocaleString()} CR` : `£${amt.toFixed(2)}`; }

  function classifyOutcome(b, w) {
    if (w <= 0) return { type: "LOSS", net: -b, color: "#ff4444" };
    if (w < b) return { type: "LDW", net: w - b, color: "#ff8800" };
    if (Math.abs(w - b) < 0.01) return { type: "EVEN", net: 0, color: "#888" };
    return { type: "WIN", net: w - b, color: "#00ff88" };
  }

  function getCeleb(w, b) {
    if (w <= 0) return 0;
    if (!ldwOn && w < b) return 0;
    const r = w / b;
    if (r >= 25) return 5; if (r >= 10) return 4; if (r >= 3) return 3; if (r >= 1) return 2; return 1;
  }

  function calcDelays(g) {
    if (!anticipOn) return [0,0,0,0,0];
    let sc = 0; const d = [0,0,0,0,0];
    for (let r = 0; r < NR; r++) {
      for (let row = 0; row < NROW; row++) if (g[r][row].id === "scatter" || g[r][row].id === "bonus") sc++;
      if (sc >= 1 && r >= 1) d[r] = sc * 3;
      if (sc >= 2 && r >= 2) d[r] += 5;
    }
    return d;
  }

  function handleStop() {
    if (!spinning || !stopBtnOn) return;
    stopRef.current = true;
    setDpStats(p => ({ ...p, stopPresses: p.stopPresses + 1 }));
  }

  function finishSpin(finalGrid, totalWin, numCasc, meta) {
    const { sBet, ec, dec, scat, bonus, appliedMult, isAuto } = meta;
    const ns = spins + 1; setSpins(ns);
    const ntw = tWon + totalWin; setTWon(ntw);
    setHist(p => [...p, { spin: ns, b: sBet, w: totalWin, cfg: ec, corr: dec.corr }]);
    if (totalWin > 0) { setCWin(p => p + 1); setCLoss(0); } else { setCLoss(p => p + 1); setCWin(0); }
    setBal(b => b + totalWin);
    if (bal + totalWin > peak) setPeak(bal + totalWin);

    // Progressive jackpot contribution
    const jpContrib = sBet * JACKPOT_CONFIG.contribution;
    setJackpotPool(p => p + jpContrib);
    setJackpotTotalContributed(p => p + jpContrib);

    // Jackpot trigger check
    if (jackpotOn && Math.random() < JACKPOT_CONFIG.triggerProbability) {
      const jpWin = jackpotPool;
      setJackpotWon(true); setJackpotWonAmount(jpWin);
      setBal(b => b + jpWin); setTWon(p => p + jpWin);
      setJackpotPool(JACKPOT_CONFIG.seedAmount);
      totalWin += jpWin;
      if (soundOn) playBonusTrigger();
      setTimeout(() => setJackpotWon(false), 4000);
    }

    // Outcome classification
    const outcome = classifyOutcome(sBet, totalWin);
    const spinTime = Date.now() - spinStartRef.current;
    setDpStats(p => {
      const u = { ...p };
      if (outcome.type === "LDW") { u.ldwCount++; u.ldwLost += Math.abs(outcome.net); }
      else if (outcome.type === "WIN") u.trueWins++;
      else if (outcome.type === "LOSS") u.trueLosses++;
      u.totalSpinTime += spinTime;
      if (isAuto) { u.autoSpins++; u.autoTime += spinTime; }
      else { u.manualSpins++; u.manualTime += spinTime; }
      return u;
    });

    // Update fallacy indicators
    setFallacyData(generateFallacyIndicators({
      spinCount: ns,
      consecutiveLosses: totalWin > 0 ? 0 : cLoss + 1,
      consecutiveWins: totalWin > 0 ? cWin + 1 : 0,
      lastBonusSpin: scat.fs > 0 || bonus.t ? ns : lastBon,
    }));

    // Celebration
    const cLevel = getCeleb(totalWin, sBet);
    setCelebLevel(cLevel);
    if (cLevel > 0 && celebOn) {
      setShowCeleb(true);
      const isLDW = totalWin > 0 && totalWin < sBet;
      setDpStats(p => ({ ...p, [isLDW ? "celebFake" : "celebReal"]: p[isLDW ? "celebFake" : "celebReal"] + 1 }));
      setCelebMsg(cLevel >= 5 ? "★★★ MEGA WIN ★★★" : cLevel >= 4 ? "★★ BIG WIN ★★" : cLevel >= 3 ? "★ GREAT WIN ★" : `+${fv(totalWin, creditMode)}`);
      setTimeout(() => setShowCeleb(false), cLevel >= 4 ? 2500 : 1000);
    } else setShowCeleb(false);

    // Sound
    if (soundOn && totalWin > 0) playWinSound(totalWin / sBet);

    // Bonus handling
    if (scat.fs > 0 && fsLeft === 0) { setFsLeft(scat.fs); setFsMult(scat.c >= 4 ? 3 : 2); setFsWins(0); setLastBon(ns); setMsg(`🌀 FREE! ${scat.fs} at ${scat.c >= 4 ? 3 : 2}x!`); if (soundOn) playBonusTrigger(); }
    else if (fsLeft > 0) { const r = fsLeft - 1; setFsLeft(r); setFsWins(p => p + totalWin); if (r === 0) { setMsg(`Free done! ${fv(fsWins + totalWin, creditMode)}`); setFsMult(1); } else setMsg(`Free spin — ${r} left`); }
    else if (bonus.t) { setBonusOn(true); setBPrizes(genBonus(sBet, dec.corr)); setBPicked([]); setBLeft(4); setBTotal(0); setLastBon(ns); setMsg("🎰 BONUS!"); if (soundOn) playBonusTrigger(); }
    else if (totalWin > 0) {
      const cm = numCasc > 0 ? ` ⛓${numCasc}` : ""; const mm = appliedMult ? ` ×${appliedMult}` : "";
      if (!ldwOn && totalWin < sBet) setMsg(`${fv(totalWin, creditMode)} (NET: -${fv(sBet - totalWin, false)})`);
      else setMsg(`WIN ${fv(totalWin, creditMode)}${cm}${mm}`);
    } else {
      if (celebOn) setMsg(""); else setMsg(`Lost ${fv(sBet, creditMode)}`);
    }

    setLastWin(totalWin);
    setDLog(p => [{ spin: ns, cfg: ec, corr: dec.corr.toFixed(3), rtp: (tWag+sBet)>0?((ntw/(tWag+sBet))*100).toFixed(2)+"%":"—", won: totalWin, casc: numCasc, type: outcome.type }, ...p].slice(0, 40));
    setSpinning(false); setCascLevel(0);

    // Autoplay — FASTER when autoSpeedOn (40% less delay)
    const baseDelay = fsLeft > 1 ? 600 : 1000;
    const delay = autoSpeedOn ? Math.floor(baseDelay * 0.6) : baseDelay;
    if (autoRef.current && fsLeft > 1) tmRef.current = setTimeout(() => { if (autoRef.current) mainSpin(true); }, delay);
    else if (autoRef.current && !bonus.t && bal + totalWin >= sBet) tmRef.current = setTimeout(() => { if (autoRef.current) mainSpin(true); }, delay);
    else if (autoRef.current) setAutoPlay(false);
  }

  const playCasc = useCallback((chain, fg, tw, meta) => {
    if (!chain.length) { finishSpin(fg, tw, 0, meta); return; }
    setCascPlaying(true); setCascTW(0);
    let si = 0;
    function step() {
      if (si >= chain.length) { setCascPlaying(false); setExploding(new Set()); finishSpin(fg, tw, chain.length, meta); return; }
      const s = chain[si]; setCascLevel(s.l); setCascTW(s.acc); setGrid(s.grid); setWinLines(s.wins);
      setMsg(`CASCADE ${s.l+1} — ${s.mult}x! +${fv(s.cw, creditMode)}`);
      if (soundOn) playCascadeSound(s.l);
      setTimeout(() => { setExploding(new Set(s.wp)); setTimeout(() => { setExploding(new Set()); setWinLines([]); si++;
        if (si < chain.length) { setGrid(chain[si].grid); setTimeout(step, 180); } else { setGrid(fg); setTimeout(step, 120); }
      }, 280); }, 380);
    }
    setTimeout(step, 200);
  }, [creditMode, soundOn]);

  const mainSpin = useCallback((isAuto = false) => {
    if (spinning || bonusOn || cascPlaying) return;
    const cBet = fsLeft > 0 ? 0 : bet; const bpl = bet / NP;
    if (fsLeft === 0 && bal < bet) { setMsg("Insufficient balance!"); return; }

    // Initialize audio on first user interaction
    if (soundOn && !synthsInitialized) { Tone.start().then(() => initAudio()); }

    spinStartRef.current = Date.now();
    setSpinning(true); setWinLines([]); setLastWin(0); setShowCeleb(false);
    setMultAct(null); setExploding(new Set()); stopRef.current = false;

    if (fsLeft === 0) setBal(b => b - bet);
    const nw = tWag + bet; setTWag(nw);
    setRBets(p => [...p.slice(-20), bet]);

    const est = { totalWagered: nw, totalWon: tWon, spinHistory: hist, consecutiveLosses: cLoss, consecutiveWins: cWin, lastBonusSpin: lastBon, spinCount: spins, recentBets: [...rBets, bet], bankedTotal: banked, sessionPeakBalance: peak };
    const dec = calcCorr(est); setLastCorr(dec);
    let ec = dec.sc; const ssb = spins - lastBon;
    if (ssb > 120 && ec === "tight") ec = "standard";
    if (ssb > 200) ec = "loose";

    const rawGrid = doSpin(stripsRef.current[ec]);
    const scat = evalScat(rawGrid, bet); const bonus = evalBonus(rawGrid);
    const w0 = evalPL(rawGrid, bpl, prof.pt);
    const isWin = w0.length > 0 || scat.pay > 0;

    const nmS = { on: false, cells: 0 };
    let initG = rawGrid;
    if (nmOn && !isWin) initG = nmApply(rawGrid, isWin, { cl: cLoss, cw: cWin }, nmS);

    let cascR;
    if (cascOn) cascR = resCasc(rawGrid, bpl, bet, prof, ec);
    else { const bw = w0.reduce((s,x)=>s+x.pay,0)+scat.pay; cascR = { ch:[], fg:rawGrid, tw:bw, tc:0 }; }

    let totalWin = cascR.tw;
    if (!cascOn) totalWin = w0.reduce((s,x)=>s+x.pay,0) + scat.pay;
    if (fsLeft > 0) totalWin *= fsMult;

    let appliedMult = null;
    if (totalWin > 0 && Math.random() < prof.mc && fsLeft === 0) { appliedMult = spinMW(prof.ms); totalWin *= appliedMult; setMultAct(appliedMult); }

    const delays = calcDelays(rawGrid);
    if (delays.some(d => d > 0)) setDpStats(p => ({ ...p, anticipEvents: p.anticipEvents + 1 }));

    const allS = SYMBOLS.filter(s => s.tier > 0 || s.id === "scatter" || s.id === "bonus");
    let cycles = 0;
    // AUTOPLAY SPEED: faster animation when autoSpeedOn + isAuto
    const speedMult = (autoSpeedOn && isAuto) ? 0.6 : 1;
    const baseMax = Math.floor((10 + Math.floor(Math.random() * 4)) * speedMult);
    const reelStop = Array.from({ length: NR }, (_, r) => Math.floor((baseMax - (NR - 1 - r) * 2 + delays[r]) * speedMult));
    const maxCyc = Math.max(...reelStop) + 2;
    const animInterval = (autoSpeedOn && isAuto) ? 45 : 70;

    const animT = setInterval(() => {
      cycles++;
      if (stopRef.current) {
        clearInterval(animT); setDispGrid(null);
        const meta = { sBet: bet, ec, dec, scat, bonus, appliedMult, isAuto };
        if (cascOn && cascR.ch.length > 0) { setGrid(rawGrid); setWinLines(w0); playCasc(cascR.ch, cascR.fg, totalWin, meta); }
        else { setGrid(cascOn ? rawGrid : initG); setWinLines(w0); finishSpin(cascOn ? rawGrid : initG, totalWin, 0, meta); }
        return;
      }

      // Sound: reel stop sounds
      for (let r = 0; r < NR; r++) {
        if (cycles === reelStop[r] && soundOn) playReelStop(r);
        // Anticipation tone when scatter is about to be revealed
        if (cycles === reelStop[r] - 2 && delays[r] > 0 && soundOn) playAnticipationTone(r);
      }

      const ag = Array.from({ length: NR }, (_, r) => {
        if (cycles >= reelStop[r]) return cascOn ? rawGrid[r] : initG[r];
        return Array.from({ length: NROW }, () => allS[Math.floor(Math.random() * allS.length)]);
      });
      setDispGrid(ag);

      if (cycles >= maxCyc) {
        clearInterval(animT); setDispGrid(null);
        const meta = { sBet: bet, ec, dec, scat, bonus, appliedMult, isAuto };
        if (cascOn && cascR.ch.length > 0) { setGrid(rawGrid); setWinLines(w0); playCasc(cascR.ch, cascR.fg, totalWin, meta); }
        else { setGrid(cascOn ? rawGrid : initG); setWinLines(w0); finishSpin(cascOn ? rawGrid : initG, totalWin, 0, meta); }
      }
    }, animInterval);
  }, [spinning, bonusOn, cascPlaying, bet, bal, tWag, tWon, hist, cLoss, cWin, lastBon, spins, rBets, banked, peak, lastCorr, fsLeft, fsMult, fsWins, nmOn, cascOn, prof, vol, playCasc, ldwOn, celebOn, anticipOn, creditMode, stopBtnOn, soundOn, autoSpeedOn, jackpotOn, jackpotPool]);

  const pickBonus = (i) => {
    if (!bonusOn || bPicked.includes(i) || bLeft <= 0) return;
    const prize = bPrizes[i]; const np = [...bPicked, i]; const nt = bTotal + prize; const r = bLeft - 1;
    setBPicked(np); setBTotal(nt); setBLeft(r);
    if (soundOn) playWinSound(prize / bet);
    if (r === 0) { setBal(b => b + nt); setTWon(p => p + nt); setMsg(`🎰 ${fv(nt, creditMode)}!`); setTimeout(() => setBonusOn(false), 1500); }
    else setMsg(`${fv(prize, creditMode)}! ${r} left`);
  };

  const dg = dispGrid || grid;
  const hl = new Set(); winLines.forEach(w => w.pos.forEach(p => hl.add(`${p.r}-${p.row}`)));
  const artRTP = tWag > 0 ? (tWon / tWag * 100).toFixed(2) : "—";
  const dpCount = [ldwOn,stopBtnOn,celebOn,anticipOn,creditMode,hideTime,hideTrueCost,soundOn,jackpotOn,fallacyOn,autoSpeedOn].filter(Boolean).length;

  const tabS = (t) => ({ flex: 1, padding: "5px 1px", fontSize: "0.48rem", fontWeight: activeTab === t ? "bold" : "normal", background: activeTab === t ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.02)", border: activeTab === t ? "1px solid rgba(255,215,0,0.25)" : "1px solid rgba(255,255,255,0.05)", borderBottom: activeTab === t ? "none" : undefined, color: activeTab === t ? "#ffd700" : "#444", cursor: "pointer", fontFamily: "inherit", borderRadius: "4px 4px 0 0" });

  const manualSPM = dpStats.manualTime > 10000 ? (dpStats.manualSpins / (dpStats.manualTime / 60000)).toFixed(1) : "—";
  const autoSPM = dpStats.autoTime > 10000 ? (dpStats.autoSpins / (dpStats.autoTime / 60000)).toFixed(1) : "—";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0a0a1a, #1a0a2a, #0a1a2a)", color: "#e0e0e0", fontFamily: "'Courier New', monospace", display: "flex", flexDirection: "column", alignItems: "center", padding: "6px", gap: "4px" }}>

      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0, letterSpacing: "1px", background: "linear-gradient(90deg, #ffd700, #ff6b35, #ffd700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>★ FORTUNE ENGINE v5 ★</h1>
        <div style={{ fontSize: "0.45rem", color: "#555" }}>COMPLETE PSYCH TOOLKIT │ {dpCount}/11 dark patterns │ RTP {(TGT*100).toFixed(1)}%</div>
      </div>

      {/* PROGRESSIVE JACKPOT DISPLAY */}
      {jackpotOn && (
        <div style={{ width: "100%", maxWidth: 540, background: "linear-gradient(90deg, rgba(255,0,100,0.12), rgba(255,215,0,0.12), rgba(255,0,100,0.12))", border: "1px solid rgba(255,215,0,0.3)", borderRadius: 6, padding: "4px 10px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ fontSize: "0.5rem", color: "#ff6699", letterSpacing: "2px" }}>★ PROGRESSIVE JACKPOT ★</div>
          <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#ffd700", textShadow: "0 0 10px rgba(255,215,0,0.4)", fontVariantNumeric: "tabular-nums" }}>
            {creditMode ? `${Math.round(jackpotPool * CR).toLocaleString()} CR` : `£${jackpotPool.toFixed(2)}`}
          </div>
          <div style={{ fontSize: "0.4rem", color: "#888" }}>Funded by 1.5% of every bet │ Total contributed: {fv(jackpotTotalContributed, false)}</div>
          {jackpotWon && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,215,0,0.15)", fontSize: "1rem", fontWeight: "bold", color: "#ffd700", textShadow: "0 0 20px #ffd700" }}>🏆 JACKPOT WON: {fv(jackpotWonAmount, creditMode)} 🏆</div>}
        </div>
      )}

      {/* GAMBLER'S FALLACY BAR */}
      {fallacyOn && (
        <div style={{ display: "flex", gap: 4, width: "100%", maxWidth: 540 }}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.3)", borderRadius: 4, padding: "3px 6px", fontSize: "0.5rem", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ color: fallacyData.heat.color, fontWeight: "bold" }}>{fallacyData.heat.level}</div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 2 }}>
              <div style={{ width: `${fallacyData.heat.value * 100}%`, height: "100%", background: fallacyData.heat.color, borderRadius: 2, transition: "width 0.5s" }} />
            </div>
          </div>
          <div style={{ flex: 1.2, background: "rgba(0,0,0,0.3)", borderRadius: 4, padding: "3px 6px", fontSize: "0.5rem", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ color: fallacyData.bonusMeter > 0.7 ? "#ff4444" : "#888" }}>BONUS: {fallacyData.bonusMeter > 0.7 ? "⚠ DUE!" : Math.round(fallacyData.bonusMeter * 100) + "%"}</div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 2 }}>
              <div style={{ width: `${fallacyData.bonusMeter * 100}%`, height: "100%", background: fallacyData.bonusMeter > 0.7 ? "#ff4444" : "#ffa500", borderRadius: 2, transition: "width 0.5s" }} />
            </div>
          </div>
          <div style={{ flex: 1.2, background: "rgba(0,0,0,0.3)", borderRadius: 4, padding: "3px 6px", fontSize: "0.48rem", color: "#aaa", display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
            {fallacyData.streakMsg}
          </div>
        </div>
      )}

      {!hideTime && <div style={{ fontSize: "0.5rem", color: "#993333", background: "rgba(255,0,0,0.04)", padding: "1px 8px", borderRadius: 3 }}>⏱ {fmtTime(elapsed)} │ {spins} spins │ Net: <span style={{ color: tWon-tWag>=0?"#00ff88":"#ff4444" }}>{fv(tWon-tWag,false)}</span> │ ~{fv(tWag>0?tWag*(1-TGT):0,false)} house edge</div>}

      {/* VOL */}
      <div style={{ display: "flex", gap: 2, width: "100%", maxWidth: 540 }}>
        {Object.entries(PROFILES).map(([k, p]) => <button key={k} onClick={() => { if (!spinning&&!cascPlaying) setVol(k); }} disabled={spinning||cascPlaying} style={{ flex:1, padding:"3px", borderRadius:4, fontFamily:"inherit", cursor:"pointer", background:vol===k?`${p.color}18`:"rgba(255,255,255,0.02)", border:vol===k?`2px solid ${p.color}`:"1px solid rgba(255,255,255,0.06)", color:vol===k?p.color:"#444", fontSize:"0.55rem", fontWeight:vol===k?"bold":"normal" }}>{p.name}</button>)}
      </div>

      {/* BAL */}
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 540, background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.1)", borderRadius: 5, padding: "3px 10px", fontSize: "0.65rem" }}>
        <div><span style={{ color: "#555", fontSize: "0.45rem" }}>BAL</span><br/><span style={{ color: "#ffd700", fontWeight: "bold" }}>{fv(bal, creditMode)}</span></div>
        <div style={{ textAlign: "center" }}><span style={{ color: "#555", fontSize: "0.45rem" }}>{hideTrueCost?"LINE":"TOTAL"}</span><br/><span style={{ color: "#ff6b35", fontWeight: "bold" }}>{hideTrueCost ? fv(bet/NP, creditMode) : fv(bet, creditMode)}</span></div>
        <div style={{ textAlign: "center" }}><span style={{ color: "#555", fontSize: "0.45rem" }}>RTP</span><br/><span style={{ fontWeight: "bold", color: tWag>0&&Math.abs(tWon/tWag-TGT)<0.02?"#00ff88":"#ffa500" }}>{artRTP}%</span></div>
        <div style={{ textAlign: "right" }}><span style={{ color: "#555", fontSize: "0.45rem" }}>WIN</span><br/><span style={{ color: lastWin>0?"#00ff88":"#444", fontWeight: "bold" }}>{fv(lastWin, creditMode)}</span></div>
      </div>

      {fsLeft > 0 && <div style={{ background: "linear-gradient(90deg, #4a0080, #8000ff, #4a0080)", color: "#fff", padding: "2px 10px", borderRadius: 5, fontSize: "0.65rem", fontWeight: "bold", textAlign: "center", width: "100%", maxWidth: 540, boxSizing: "border-box" }}>🌀 {fsLeft} free │ {fsMult}x │ {fv(fsWins, creditMode)}</div>}
      {cascOn && cascPlaying && <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>{prof.cm.map((m,i) => <div key={i} style={{ padding: "2px 5px", borderRadius: 3, fontSize: "0.55rem", fontWeight: "bold", background: i<=cascLevel?`rgba(255,215,0,${0.08+i*0.05})`:"rgba(255,255,255,0.02)", border: i===cascLevel?"1px solid #ffd700":"1px solid rgba(255,255,255,0.04)", color: i<=cascLevel?"#ffd700":"#333" }}>{m}x</div>)}</div>}

      {/* CELEBRATION OVERLAY */}
      {showCeleb && celebLevel >= 3 && <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 100, pointerEvents: "none", background: celebLevel >= 5 ? "rgba(255,215,0,0.06)" : "transparent" }}><div style={{ fontSize: celebLevel >= 5 ? "1.8rem" : "1.2rem", fontWeight: "bold", color: "#ffd700", textShadow: "0 0 25px #ffd700" }}>{celebMsg}</div>{!ldwOn && lastWin > 0 && lastWin < bet && <div style={{ color: "#ff8800", fontSize: "0.55rem", marginTop: 4, background: "rgba(255,136,0,0.12)", padding: "2px 8px", borderRadius: 4 }}>⚠ LDW: net -{fv(bet - lastWin, false)}</div>}</div>}

      {/* GRID */}
      <div style={{ background: "linear-gradient(180deg, #1a1a3a, #0d0d2a)", border: `2px solid ${prof.color}33`, borderRadius: 8, padding: "4px", width: "100%", maxWidth: 540, boxSizing: "border-box" }}>
        {multAct && <div style={{ textAlign: "center", color: "#ff00ff", fontWeight: "bold", fontSize: "0.75rem" }}>✨{multAct}x✨</div>}
        {showCeleb && celebLevel > 0 && celebLevel < 3 && <div style={{ textAlign: "center", color: "#ffd700", fontWeight: "bold", fontSize: "0.7rem" }}>{celebMsg}</div>}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${NR}, 1fr)`, gap: 2 }}>
          {Array.from({ length: NROW }).map((_,row) => Array.from({ length: NR }).map((_,reel) => {
            const sym = dg[reel]?.[row] || SYM.cherry;
            const isW = hl.has(`${reel}-${row}`); const isX = exploding.has(`${reel}-${row}`);
            return <div key={`${reel}-${row}`} style={{ background: isX?"radial-gradient(circle, rgba(255,107,53,0.3), rgba(255,50,0,0.06))":isW?"radial-gradient(circle, rgba(0,255,136,0.12), rgba(0,255,136,0.02))":row===1?"rgba(255,215,0,0.02)":"rgba(0,0,0,0.3)", border: isX?"2px solid #ff6b35":isW?"2px solid #00ff88":"1px solid rgba(255,255,255,0.05)", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", height: 46, fontSize: "1.4rem", transition: "all 0.2s", opacity: isX?0.3:1, transform: isX?"scale(0.6)":"scale(1)" }}>{sym.emoji}</div>;
          })).flat()}
        </div>
      </div>

      <div style={{ fontSize: "0.7rem", fontWeight: "bold", textAlign: "center", minHeight: 16, color: lastWin>0?"#00ff88":msg.includes("CASCADE")?"#ffd700":msg.includes("FREE")||msg.includes("BONUS")?"#ff00ff":"#777" }}>{msg}</div>

      {bonusOn && <div style={{ background: "linear-gradient(180deg, #2a0040, #1a0030)", border: "2px solid #ff00ff", borderRadius: 8, padding: 8, width: "100%", maxWidth: 540, boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", fontWeight: "bold", color: "#ff00ff", fontSize: "0.7rem", marginBottom: 3 }}>🎰 PICK ({bLeft}) │ {fv(bTotal, creditMode)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>{bPrizes.map((p,i) => { const pk=bPicked.includes(i); return <button key={i} onClick={() => pickBonus(i)} disabled={pk||bLeft<=0} style={{ background: pk?"rgba(0,255,136,0.12)":"rgba(255,0,255,0.08)", border: pk?"2px solid #00ff88":"1px solid rgba(255,0,255,0.15)", borderRadius: 5, padding: "7px 2px", color: pk?"#00ff88":"#fff", fontWeight: "bold", fontSize: "0.6rem", cursor: pk?"default":"pointer", fontFamily: "inherit" }}>{pk?fv(p,creditMode):"🎁"}</button>; })}</div>
      </div>}

      {/* CONTROLS */}
      <div style={{ display: "flex", gap: 2, width: "100%", maxWidth: 540 }}>
        {[0.20,0.50,1,2,5,10].map(b => <button key={b} onClick={() => setBet(b)} disabled={spinning||cascPlaying} style={{ flex:1, background: bet===b?"rgba(255,107,53,0.18)":"rgba(255,255,255,0.02)", border: bet===b?"1px solid #ff6b35":"1px solid rgba(255,255,255,0.06)", color: bet===b?"#ff6b35":"#666", borderRadius: 3, padding: "3px 2px", fontSize: "0.55rem", cursor: "pointer", fontFamily: "inherit" }}>{hideTrueCost?fv(b/NP,creditMode):fv(b,creditMode)}</button>)}
      </div>
      <div style={{ display: "flex", gap: 3, width: "100%", maxWidth: 540 }}>
        <button onClick={() => mainSpin(false)} disabled={spinning||bonusOn||cascPlaying||(fsLeft===0&&bal<bet)} style={{ flex:2, background: spinning||cascPlaying?"rgba(80,80,80,0.2)":fsLeft>0?"linear-gradient(180deg, #8000ff, #4a0080)":`linear-gradient(180deg, ${prof.color}, ${prof.color}88)`, border: "none", borderRadius: 5, padding: "9px", fontSize: "0.85rem", fontWeight: "bold", color: spinning||cascPlaying?"#444":"#000", cursor: spinning||cascPlaying?"not-allowed":"pointer", fontFamily: "inherit", letterSpacing: "2px" }}>{spinning||cascPlaying?"...":fsLeft>0?`🌀(${fsLeft})`:"SPIN"}</button>
        {stopBtnOn && <button onClick={handleStop} disabled={!spinning} style={{ flex:0.5, background: spinning?"rgba(255,0,0,0.15)":"rgba(255,255,255,0.02)", border: spinning?"1px solid #ff4444":"1px solid rgba(255,255,255,0.04)", borderRadius: 5, padding: "9px 3px", fontSize: "0.6rem", fontWeight: "bold", color: spinning?"#ff4444":"#333", cursor: spinning?"pointer":"default", fontFamily: "inherit" }}>STOP</button>}
        <button onClick={() => { setAutoPlay(!autoPlay); if(autoPlay) autoRef.current=false; }} disabled={bonusOn||cascPlaying} style={{ flex:0.5, background: autoPlay?"rgba(255,0,0,0.12)":"rgba(255,255,255,0.02)", border: autoPlay?"1px solid #ff4444":"1px solid rgba(255,255,255,0.06)", borderRadius: 5, padding: "9px 2px", fontSize: "0.5rem", color: autoPlay?"#ff4444":"#666", cursor: "pointer", fontFamily: "inherit" }}>{autoPlay?"■":"▶"}{autoSpeedOn&&autoPlay?<span style={{color:"#ff8800",fontSize:"0.4rem"}}> FAST</span>:""}</button>
      </div>

      {/* UTILITY ROW */}
      <div style={{ display: "flex", gap: 2, width: "100%", maxWidth: 540 }}>
        <button onClick={() => setCascOn(!cascOn)} disabled={spinning} style={{ flex:1, padding:"3px", borderRadius:3, fontFamily:"inherit", fontSize:"0.5rem", cursor:"pointer", background:cascOn?"rgba(255,215,0,0.08)":"rgba(255,255,255,0.02)", border:cascOn?"1px solid rgba(255,215,0,0.2)":"1px solid rgba(255,255,255,0.04)", color:cascOn?"#ffd700":"#444" }}>⛓{cascOn?"ON":"OFF"}</button>
        <button onClick={() => setNmOn(!nmOn)} style={{ flex:1, padding:"3px", borderRadius:3, fontFamily:"inherit", fontSize:"0.5rem", cursor:"pointer", background:nmOn?"rgba(255,107,53,0.08)":"rgba(255,255,255,0.02)", border:nmOn?"1px solid rgba(255,107,53,0.2)":"1px solid rgba(255,255,255,0.04)", color:nmOn?"#ff6b35":"#444" }}>👁{nmOn?"ON":"OFF"}</button>
        <button onClick={() => { setBal(b=>b-Math.floor(bal/2)); setBanked(p=>p+Math.floor(bal/2)); }} disabled={bal<2||spinning} style={{ flex:0.7, padding:"3px", borderRadius:3, fontFamily:"inherit", fontSize:"0.5rem", cursor:"pointer", background:"rgba(0,200,100,0.05)", border:"1px solid rgba(0,200,100,0.12)", color:"#00c864" }}>BANK½</button>
        <div style={{ flex:0.5, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.45rem", color:"#444" }}>🏦{fv(banked,creditMode)}</div>
        <button onClick={() => { setBal(b=>b+banked); setBanked(0); }} disabled={banked<=0||spinning} style={{ flex:0.5, padding:"3px", borderRadius:3, fontFamily:"inherit", fontSize:"0.5rem", cursor:"pointer", background:"rgba(255,165,0,0.05)", border:"1px solid rgba(255,165,0,0.12)", color:"#ffa500" }}>OUT</button>
        <button onClick={() => { setBal(1000);setTWag(0);setTWon(0);setHist([]);setSpins(0);setCLoss(0);setCWin(0);setLastBon(0);setRBets([]);setLastCorr(null);setDLog([]);setBanked(0);setPeak(1000);setFsLeft(0);setFsMult(1);setBonusOn(false);setAutoPlay(false);setJackpotPool(JACKPOT_CONFIG.seedAmount);setJackpotTotalContributed(0);setDpStats({ldwCount:0,ldwLost:0,trueWins:0,trueLosses:0,celebFake:0,celebReal:0,stopPresses:0,anticipEvents:0,sessionStart:Date.now(),totalSpinTime:0,manualSpins:0,autoSpins:0,manualTime:0,autoTime:0});setMsg("Reset!");stripsRef.current=bAll(prof.rc);}} style={{ padding:"3px 5px", borderRadius:3, fontFamily:"inherit", fontSize:"0.5rem", cursor:"pointer", background:"rgba(255,0,0,0.05)", border:"1px solid rgba(255,0,0,0.12)", color:"#ff4444" }}>↺</button>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", width: "100%", maxWidth: 540, gap: 1 }}>
        {[["game","🎰 GAME"],["darkpat","🧠 DARK PATTERNS"],["algorithm","⚙️ ENGINE"]].map(([t,l]) => <button key={t} onClick={() => setActiveTab(t)} style={tabS(t)}>{l}</button>)}
      </div>

      <div style={{ width: "100%", maxWidth: 540, boxSizing: "border-box", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,215,0,0.08)", borderTop: "none", borderRadius: "0 0 5px 5px", padding: 8, fontSize: "0.58rem", lineHeight: 1.5, minHeight: 120 }}>

        {activeTab === "game" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 10px" }}>
              <span style={{ color: "#666" }}>Wagered:</span><span>{fv(tWag,creditMode)}</span>
              <span style={{ color: "#666" }}>Returned:</span><span>{fv(tWon,creditMode)}</span>
              <span style={{ color: "#666" }}>Net:</span><span style={{ color: tWon-tWag>=0?"#00ff88":"#ff4444" }}>{fv(tWon-tWag,false)}</span>
              <span style={{ color: "#666" }}>Spins:</span><span>{spins}</span>
              <span style={{ color: "#666" }}>LDW rate:</span><span style={{ color: "#ff8800" }}>{spins>0?((dpStats.ldwCount/spins)*100).toFixed(1):0}%</span>
              <span style={{ color: "#666" }}>True win rate:</span><span style={{ color: "#00ff88" }}>{spins>0?((dpStats.trueWins/spins)*100).toFixed(1):0}%</span>
              <span style={{ color: "#666" }}>Jackpot contributed:</span><span>{fv(jackpotTotalContributed,false)} ({(JACKPOT_CONFIG.contribution*100).toFixed(1)}%)</span>
              <span style={{ color: "#666" }}>Manual/Auto SPM:</span><span>{manualSPM} / {autoSPM} {autoSPM !== "—" && manualSPM !== "—" && Number(autoSPM) > Number(manualSPM) ? <span style={{ color: "#ff4444" }}>({((Number(autoSPM)/Number(manualSPM)-1)*100).toFixed(0)}% faster!)</span> : ""}</span>
            </div>
            <div style={{ marginTop: 4, maxHeight: 70, overflowY: "auto", fontSize: "0.48rem" }}>
              {dLog.slice(0,10).map((e,i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "1px 0", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                <span style={{ color: "#444" }}>#{e.spin}</span>
                <span style={{ color: e.cfg==="loose"?"#00ff88":e.cfg==="tight"?"#ff4444":"#ffa500" }}>{e.cfg}</span>
                <span style={{ color: e.type==="LDW"?"#ff8800":e.type==="WIN"?"#00ff88":"#ff4444", fontWeight: e.type==="LDW"?"bold":"normal" }}>{e.type}</span>
                <span style={{ color: e.won>0?"#00ff88":"#333" }}>{fv(e.won,creditMode)}</span>
              </div>)}
            </div>
          </div>
        )}

        {activeTab === "darkpat" && (
          <div>
            <div style={{ color: "#ff0066", fontWeight: "bold", marginBottom: 4, fontSize: "0.6rem" }}>🧠 ALL MANIPULATION SYSTEMS ({dpCount}/11)</div>
            <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
              <button onClick={() => { setLdwOn(true);setStopBtnOn(true);setCelebOn(true);setAnticipOn(true);setCreditMode(true);setHideTime(true);setHideTrueCost(true);setSoundOn(true);setJackpotOn(true);setFallacyOn(true);setAutoSpeedOn(true);Tone.start().then(()=>initAudio()); }} style={{ flex:1, padding:"4px", borderRadius:4, background:"rgba(255,0,102,0.1)", border:"1px solid rgba(255,0,102,0.25)", color:"#ff0066", cursor:"pointer", fontFamily:"inherit", fontSize:"0.5rem", fontWeight:"bold" }}>🎰 CASINO (All ON)</button>
              <button onClick={() => { setLdwOn(false);setStopBtnOn(false);setCelebOn(false);setAnticipOn(false);setCreditMode(false);setHideTime(false);setHideTrueCost(false);setSoundOn(false);setJackpotOn(false);setFallacyOn(false);setAutoSpeedOn(false); }} style={{ flex:1, padding:"4px", borderRadius:4, background:"rgba(0,255,136,0.06)", border:"1px solid rgba(0,255,136,0.15)", color:"#00ff88", cursor:"pointer", fontFamily:"inherit", fontSize:"0.5rem", fontWeight:"bold" }}>✅ HONEST (All OFF)</button>
            </div>

            <div style={{ display: "grid", gap: 3, maxHeight: 300, overflowY: "auto" }}>
              {[
                { on: ldwOn, set: setLdwOn, label: "Loss Disguised as Win", color: "#ff8800", stat: `${dpStats.ldwCount} LDWs lost ${fv(dpStats.ldwLost,false)}` },
                { on: stopBtnOn, set: setStopBtnOn, label: "Stop Button Illusion", color: "#ff4444", stat: `${dpStats.stopPresses} presses, 0 effect` },
                { on: celebOn, set: setCelebOn, label: "Celebration Asymmetry", color: "#ffd700", stat: `${dpStats.celebFake} fake / ${dpStats.celebReal} real` },
                { on: anticipOn, set: setAnticipOn, label: "Reel Anticipation", color: "#ff00ff", stat: `${dpStats.anticipEvents} slowdowns` },
                { on: creditMode, set: setCreditMode, label: "Credit Obfuscation", color: "#0096ff", stat: `${creditMode?"Credits":"Currency"} mode` },
                { on: hideTime, set: setHideTime, label: "Time Dissolution", color: "#cc00cc", stat: `Session: ${fmtTime(elapsed)}` },
                { on: hideTrueCost, set: setHideTrueCost, label: "Bet Hiding", color: "#00cc99", stat: `True: ${fv(bet,false)}/spin` },
                { on: soundOn, set: (v) => { setSoundOn(v); if(v) Tone.start().then(()=>initAudio()); }, label: "Asymmetric Sound", color: "#ff6633", stat: "Wins=music, Losses=silence" },
                { on: jackpotOn, set: setJackpotOn, label: "Progressive Jackpot", color: "#ff3399", stat: `Pool: ${fv(jackpotPool,false)}, paid ${fv(jackpotTotalContributed,false)}` },
                { on: fallacyOn, set: setFallacyOn, label: "Gambler's Fallacy", color: "#9933ff", stat: "Fake hot/cold/due indicators" },
                { on: autoSpeedOn, set: setAutoSpeedOn, label: "Autoplay Acceleration", color: "#ff9933", stat: `Manual: ${manualSPM} vs Auto: ${autoSPM} spm` },
              ].map((dp, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 6px", borderRadius: 4, background: dp.on ? `${dp.color}0a` : "transparent", border: `1px solid ${dp.on ? dp.color + "30" : "rgba(255,255,255,0.04)"}` }}>
                  <button onClick={() => dp.set(!dp.on)} style={{ width: 32, height: 16, borderRadius: 8, border: "none", cursor: "pointer", background: dp.on ? dp.color : "rgba(255,255,255,0.08)", position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: dp.on ? 18 : 2, transition: "left 0.2s" }} />
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "bold", color: dp.on ? dp.color : "#555", fontSize: "0.52rem" }}>{dp.label}</div>
                    <div style={{ fontSize: "0.45rem", color: "#555" }}>{dp.stat}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 6, background: "rgba(255,0,102,0.04)", borderRadius: 4, padding: 5, fontSize: "0.48rem", color: "#996677", lineHeight: 1.4 }}>
              <b>SESSION IMPACT:</b> {dpStats.ldwCount} fake wins lost you {fv(dpStats.ldwLost,false)}. {dpStats.celebFake>0?`${((dpStats.celebFake/Math.max(1,dpStats.celebFake+dpStats.celebReal))*100).toFixed(0)}% of celebrations were losses.`:""} You pressed STOP {dpStats.stopPresses}× with zero effect. {jackpotTotalContributed>0?`${fv(jackpotTotalContributed,false)} silently diverted to jackpot pool.`:""} {autoSPM!=="—"&&manualSPM!=="—"?`Autoplay runs ${((Number(autoSPM)/Math.max(1,Number(manualSPM))-1)*100).toFixed(0)}% faster — draining balance quicker.`:""} Toggle HONEST MODE and feel the difference.
            </div>
          </div>
        )}

        {activeTab === "algorithm" && lastCorr && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 10px" }}>
              <span style={{ color: "#666" }}>Strip:</span><span style={{ color: lastCorr.sc==="loose"?"#00ff88":lastCorr.sc==="tight"?"#ff4444":"#ffa500", fontWeight: "bold" }}>{lastCorr.sc.toUpperCase()}</span>
              <span style={{ color: "#666" }}>Correction:</span><span>{lastCorr.corr.toFixed(4)}</span>
            </div>
            {Object.entries(lastCorr.rw).map(([n,r]) => <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 1 }}>
              <span style={{ color: "#666", width: 30, fontSize: "0.5rem" }}>{n}</span>
              <div style={{ width: 55, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 1, position: "relative" }}>
                <div style={{ position: "absolute", left: "50%", width: 1, height: "100%", background: "rgba(255,255,255,0.1)" }} />
                <div style={{ position: "absolute", left: `${Math.max(2,Math.min(98,50+(r-TGT)*500))}%`, width: 3, height: "100%", background: Math.abs(r-TGT)<0.03?"#00ff88":"#ffa500", borderRadius: 1 }} />
              </div>
              <span style={{ color: "#888", width: 35, textAlign: "right", fontSize: "0.5rem" }}>{(r*100).toFixed(1)}%</span>
            </div>)}
            {lastCorr.reasons.map((r,i) => <div key={i} style={{ color: "#77aaff", paddingLeft: 4, fontSize: "0.48rem" }}>▸ {r}</div>)}
          </div>
        )}
      </div>

      <style>{`button:hover:not(:disabled){filter:brightness(1.15)}button:active:not(:disabled){transform:scale(0.97)}@keyframes celebPulse{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}`}</style>
    </div>
  );
}
