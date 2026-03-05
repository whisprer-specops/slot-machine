/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║          GLOBE SPINNER — Geospatial Slot Machine Simulator           ║
 * ║                                                                      ║
 * ║  A 5×2 dual-row slot machine themed around world landmarks.          ║
 * ║  Real GPS coordinates. Real locations. Fake gambling.                ║
 * ║                                                                      ║
 * ║  DUAL-ROW FORMAT: 5 reels × 2 visible rows = 10 positions.           ║
 * ║  With only 6 paylines (vs 20 in a 5×3 machine), the math changes:    ║
 * ║  • Each line win is ~3× larger (bet/6 vs bet/20 per line)            ║
 * ║  • Hits are rarer per spin (fewer lines to catch partial matches)    ║
 * ║  • LDW rate drops significantly (key educational difference)         ║
 * ║  • Bonus features carry more RTP weight to compensate                ║
 * ║                                                                      ║
 * ║  BONUS: "AROUND THE WORLD IN 80 DAYS"                                ║
 * ║  3+ ✈️ symbols trigger a map-based ladder gamble:                    ║
 * ║  London → Paris → Istanbul → Mumbai → Hong Kong → Tokyo →            ║
 * ║  San Francisco → New York → London                                   ║
 * ║  Each city awards free spins. At each stop: COLLECT or GAMBLE.       ║
 * ║  Gamble odds decrease as you progress. Failure = lose ALL spins.     ║
 * ║  This is a classic risk/reward mechanic with calculable EV.          ║
 * ║                                                                      ║
 * ║  All 11 dark patterns from Fortune Engine v5 are present.            ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { useState, useRef, useCallback, useEffect } from "react";
import * as Tone from "tone";

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 1: LANDMARK SYMBOL SYSTEM
 *
 * Each symbol is a real-world location with actual GPS coordinates.
 * Tiers determine rarity and payout — just like fruit symbols,
 * but the theme creates the illusion of "exploring the world."
 *
 * Tier 1 (Common): Natural features — appear frequently
 * Tier 2 (Notable): Recognizable landmarks — moderate frequency
 * Tier 3 (Famous): Iconic locations — uncommon
 * Tier 4 (Wonder): World-renowned — rare
 * Tier 5 (Legendary): The big prizes — very rare
 * Tier 0 (Special): Wild (Globe) and Bonus Trigger (Plane)
 * ═══════════════════════════════════════════════════════════════════ */

const LANDMARKS = [
  { id: "desert",   emoji: "🏜️", name: "Sahara",          lat: 23.42,  lon: 25.66,   tier: 1 },
  { id: "ocean",    emoji: "🌊", name: "Pacific",          lat: 0.00,   lon: -160.00, tier: 1 },
  { id: "mountain", emoji: "🏔️", name: "Alps",             lat: 46.82,  lon: 8.23,    tier: 1 },
  { id: "beach",    emoji: "🏖️", name: "Copacabana",       lat: -22.97, lon: -43.18,  tier: 2 },
  { id: "castle",   emoji: "🏰", name: "Neuschwanstein",   lat: 47.56,  lon: 10.75,   tier: 2 },
  { id: "liberty",  emoji: "🗽", name: "Lady Liberty",     lat: 40.69,  lon: -74.04,  tier: 3 },
  { id: "torii",    emoji: "⛩️", name: "Fushimi Inari",    lat: 34.97,  lon: 135.77,  tier: 3 },
  { id: "taj",      emoji: "🕌", name: "Taj Mahal",        lat: 27.18,  lon: 78.04,   tier: 4 },
  { id: "pyramid",  emoji: "🔺", name: "Great Pyramid",    lat: 29.98,  lon: 31.13,   tier: 4 },
  { id: "eiffel",   emoji: "🗼", name: "Eiffel Tower",     lat: 48.86,  lon: 2.29,    tier: 5 },
  { id: "kremlin",  emoji: "🏛️", name: "Kremlin",          lat: 55.75,  lon: 37.62,   tier: 5 },
  // Special symbols
  { id: "globe",    emoji: "🌍", name: "Wild Globe",       lat: 0, lon: 0, tier: 6 },
  { id: "plane",    emoji: "✈️",  name: "Bonus Flight",     lat: 0, lon: 0, tier: 0 },
];

const SYM = Object.fromEntries(LANDMARKS.map(s => [s.id, s]));

/** Format latitude/longitude for display */
function fmtCoord(lat, lon) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(1)}°${ns} ${Math.abs(lon).toFixed(1)}°${ew}`;
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 2: DUAL-ROW CONFIGURATION
 *
 * 5 reels × 2 rows = 10 visible positions per spin.
 * 6 paylines (vs 20 in a 5×3 machine).
 *
 * With fewer paylines:
 * - Bet per line = total_bet / 6 (each hit pays more)
 * - Fewer partial matches = fewer LDWs (educational win)
 * - Bonus features must carry more RTP weight
 *
 * TARGET RTP: 96.5% (same as the fruit machine)
 * RTP BUDGET:
 *   Base game paylines:     60% of total RTP
 *   Around the World bonus: 28% of total RTP
 *   Random multiplier:       5% of total RTP
 *   Scatter pays:            7% of total RTP
 * ═══════════════════════════════════════════════════════════════════ */

const NR = 5;       // Reels
const NROW = 2;     // Visible rows (dual-row)
const NLINES = 6;   // Paylines
const TGT = 0.965;  // Target RTP

/** PAYLINES for a 5×2 grid. Each array = row index per reel. */
const PAYLINES = [
  [0, 0, 0, 0, 0], // Line 1: Top straight
  [1, 1, 1, 1, 1], // Line 2: Bottom straight
  [0, 1, 0, 1, 0], // Line 3: Zigzag (starts top)
  [1, 0, 1, 0, 1], // Line 4: Zigzag (starts bottom)
  [0, 0, 1, 1, 1], // Line 5: Top-to-bottom sweep
  [1, 1, 0, 0, 0], // Line 6: Bottom-to-top sweep
];

/**
 * PAYTABLE — Multipliers per matching count.
 * Calibrated for 6-line play. Higher per-line payouts than the
 * 20-line machine because bet_per_line is ~3.3× larger.
 *
 * The spread (tier 1 vs tier 5) determines volatility.
 * We use a medium volatility profile for the geo theme.
 */
const PAYTABLE = {
  desert:   { 3: 4,   4: 12,  5: 30 },
  ocean:    { 3: 4,   4: 12,  5: 30 },
  mountain: { 3: 4,   4: 12,  5: 30 },
  beach:    { 3: 8,   4: 25,  5: 60 },
  castle:   { 3: 8,   4: 25,  5: 60 },
  liberty:  { 3: 15,  4: 50,  5: 150 },
  torii:    { 3: 15,  4: 50,  5: 150 },
  taj:      { 3: 30,  4: 100, 5: 350 },
  pyramid:  { 3: 30,  4: 100, 5: 350 },
  eiffel:   { 3: 75,  4: 250, 5: 800 },
  kremlin:  { 3: 75,  4: 250, 5: 800 },
  globe:    { 3: 75,  4: 250, 5: 800 },
};

/** Scatter (plane) pays — based on total bet, triggers Around the World bonus */
const SCAT_PAY = { 3: 3, 4: 10, 5: 30 };

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 3: AROUND THE WORLD IN 80 DAYS — Route & Ladder Gamble
 *
 * The bonus is triggered by 3+ ✈️ plane symbols anywhere on the grid.
 * The player embarks on a journey around the world.
 *
 * At each city:
 * 1. Awarded free spins for that leg of the journey
 * 2. Choose: COLLECT all accumulated spins, or GAMBLE to continue
 * 3. Gamble has decreasing success probability as you progress
 * 4. FAILURE = lose ALL accumulated bonus spins (back to zero)
 * 5. Final destination (London return) = auto-collect (guaranteed)
 *
 * EXPECTED VALUE ANALYSIS:
 * The gamble is +EV at early stops (high success rate, big upside)
 * and -EV at later stops (low success rate, diminishing returns).
 * The optimal strategy shifts — which is the educational insight.
 * Real ladder gambles in UK fruit machines work exactly this way.
 * ═══════════════════════════════════════════════════════════════════ */

const WORLD_ROUTE = [
  { city: "London",        emoji: "🇬🇧", lat: 51.51, lon: -0.13,   spins: 3,  chance: 1.00, desc: "Departure — The Reform Club" },
  { city: "Paris",         emoji: "🇫🇷", lat: 48.86, lon: 2.35,    spins: 4,  chance: 0.72, desc: "Across the Channel" },
  { city: "Istanbul",      emoji: "🇹🇷", lat: 41.01, lon: 28.98,   spins: 5,  chance: 0.62, desc: "The Orient Express" },
  { city: "Mumbai",        emoji: "🇮🇳", lat: 19.08, lon: 72.88,   spins: 6,  chance: 0.52, desc: "Passage to India" },
  { city: "Hong Kong",     emoji: "🇭🇰", lat: 22.32, lon: 114.17,  spins: 8,  chance: 0.44, desc: "The China Sea" },
  { city: "Tokyo",         emoji: "🇯🇵", lat: 35.68, lon: 139.65,  spins: 10, chance: 0.38, desc: "Land of the Rising Sun" },
  { city: "San Francisco", emoji: "🇺🇸", lat: 37.77, lon: -122.42, spins: 12, chance: 0.32, desc: "Pacific Crossing" },
  { city: "New York",      emoji: "🗽", lat: 40.71, lon: -74.01,  spins: 15, chance: 0.28, desc: "Transcontinental Rail" },
  { city: "London Return", emoji: "🏆", lat: 51.51, lon: -0.13,   spins: 20, chance: 1.00, desc: "80 Days Complete!" },
];

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 4: REEL STRIP CONFIGS (3 sets for RTP correction)
 * Balanced for 5×2 dual-row with landmark theme.
 * ═══════════════════════════════════════════════════════════════════ */

const REEL_CONFIGS = {
  loose: {
    desert: 8, ocean: 8, mountain: 7, beach: 7, castle: 7,
    liberty: 5, torii: 5, taj: 4, pyramid: 4, eiffel: 3, kremlin: 3,
    globe: 3, plane: 2,
  },
  standard: {
    desert: 10, ocean: 10, mountain: 9, beach: 8, castle: 8,
    liberty: 5, torii: 5, taj: 3, pyramid: 3, eiffel: 2, kremlin: 2,
    globe: 2, plane: 1,
  },
  tight: {
    desert: 13, ocean: 13, mountain: 10, beach: 8, castle: 8,
    liberty: 4, torii: 4, taj: 2, pyramid: 2, eiffel: 1, kremlin: 1,
    globe: 1, plane: 1,
  },
};

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 5: CORE MECHANICS
 * ═══════════════════════════════════════════════════════════════════ */

function buildStrip(w) {
  const s = [];
  for (const [id, c] of Object.entries(w)) for (let i = 0; i < c; i++) s.push(SYM[id]);
  for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
  return s;
}

function buildAllStrips(rc) {
  const s = {};
  for (const [c, w] of Object.entries(rc)) { s[c] = []; for (let r = 0; r < NR; r++) s[c].push(buildStrip(w)); }
  return s;
}

function spinReels(strips) {
  const g = [];
  for (let r = 0; r < NR; r++) {
    const s = strips[r], p = Math.floor(Math.random() * s.length), c = [];
    for (let row = 0; row < NROW; row++) c.push(s[(p + row) % s.length]);
    g.push(c);
  }
  return g;
}

function evalPaylines(grid, bpl) {
  const wins = [];
  for (let li = 0; li < NLINES; li++) {
    const line = PAYLINES[li], ls = line.map((r, i) => grid[i][r]);
    let ms = null;
    for (const s of ls) if (s.id !== "globe" && s.id !== "plane") { ms = s; break; }
    if (!ms) { if (ls.every(s => s.id === "globe")) ms = SYM.globe; else continue; }
    let c = 0;
    for (const s of ls) if (s.id === ms.id || s.id === "globe") c++; else break;
    if (c >= 3 && PAYTABLE[ms.id]?.[c]) {
      wins.push({ li, sym: ms, c, mult: PAYTABLE[ms.id][c], pay: PAYTABLE[ms.id][c] * bpl, pos: line.slice(0, c).map((r, i) => ({ r: i, row: r })) });
    }
  }
  return wins;
}

/** Count plane (bonus trigger) symbols anywhere on grid */
function evalBonusTrigger(grid) {
  let c = 0; const pos = [];
  for (let r = 0; r < NR; r++) for (let row = 0; row < NROW; row++)
    if (grid[r][row].id === "plane") { c++; pos.push({ r, row }); }
  return { triggered: c >= 3, count: c, pos, payout: c >= 3 ? (SCAT_PAY[c] || 0) : 0 };
}

/** Near-miss: replace non-payline-row cells with high-tier landmarks */
function applyNearMiss(grid, isWin, streak) {
  if (isWin && Math.random() > 0.15) return grid;
  if (Math.random() > 0.60) return grid;
  const mg = grid.map(c => [...c]);
  const nw = { desert: 1, ocean: 1, mountain: 1, beach: 2, castle: 2, liberty: 4, torii: 4, taj: 8, pyramid: 8, eiffel: 14, kremlin: 14, globe: 10, plane: 3 };
  const ent = Object.entries(nw), tot = ent.reduce((s, [, v]) => s + v, 0);
  // Only modify row 1 (bottom) when primary payline is row 0, or vice versa
  const targetRow = Math.random() < 0.5 ? 0 : 1;
  for (let r = 0; r < NR; r++) {
    if (Math.random() > 0.40) continue;
    let roll = Math.random() * tot, nm = SYM.desert;
    for (const [id, v] of ent) { roll -= v; if (roll <= 0) { nm = SYM[id]; break; } }
    if (nm.tier > mg[r][targetRow].tier) mg[r][targetRow] = nm;
  }
  return mg;
}

/** RTP correction engine — same sigmoid approach as Fortune Engine */
function calcCorrection(st) {
  const { totalWagered, totalWon, spinHistory, consecutiveLosses, consecutiveWins, lastBonusSpin, spinCount } = st;
  const windows = { s: spinHistory.slice(-20), m: spinHistory.slice(-100), l: spinHistory.slice(-500), a: spinHistory };
  const rw = {};
  for (const [n, w] of Object.entries(windows)) {
    if (!w.length) { rw[n] = TGT; continue; }
    const wg = w.reduce((s, h) => s + h.b, 0);
    rw[n] = wg > 0 ? w.reduce((s, h) => s + h.w, 0) / wg : TGT;
  }
  const wr = rw.s * 0.1 + rw.m * 0.25 + rw.l * 0.35 + rw.a * 0.3;
  const dev = wr - TGT, cb = (1 / (1 + Math.exp(-15 * dev)) - 0.5) * 2;
  let sm = 0; const reasons = [];
  if (consecutiveLosses > 12) { sm -= 0.15; reasons.push(`Drought(${consecutiveLosses})`); }
  else if (consecutiveLosses > 6) { sm -= 0.08; reasons.push(`Losing(${consecutiveLosses})`); }
  if (consecutiveWins > 4) { sm += 0.12; reasons.push(`Hot(${consecutiveWins})`); }
  const ssb = spinCount - lastBonusSpin;
  if (ssb > 120) { sm -= 0.06; reasons.push(`BonusDue(${ssb})`); }
  if (!reasons.length) reasons.push("Standard");
  const f = Math.max(-1, Math.min(1, cb + sm));
  return { config: f < -0.3 ? "loose" : f > 0.3 ? "tight" : "standard", corr: f, dev, wr, rw, reasons };
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 6: SOUND ENGINE
 * ═══════════════════════════════════════════════════════════════════ */
let synthsInit = false, synth, bellSynth, noiseSynth;
function initAudio() {
  if (synthsInit) return;
  try {
    synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.3 }, volume: -18 }).toDestination();
    bellSynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sine" }, envelope: { attack: 0.005, decay: 0.4, sustain: 0, release: 0.5 }, volume: -20 }).toDestination();
    noiseSynth = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 }, volume: -30 }).toDestination();
    synthsInit = true;
  } catch(e) {}
}
function playWin(ratio) { if (!synthsInit || ratio <= 0) return; try { const n = Tone.now(); if (ratio >= 10) { synth.triggerAttackRelease("C4","8n",n,0.5); synth.triggerAttackRelease("E4","8n",n+0.1,0.5); synth.triggerAttackRelease("G4","8n",n+0.2,0.5); bellSynth.triggerAttackRelease("C5","4n",n+0.3,0.4); } else if (ratio >= 1) { synth.triggerAttackRelease("E4","16n",n,0.3); synth.triggerAttackRelease("G4","16n",n+0.08,0.3); } else { synth.triggerAttackRelease("C4","16n",n,0.15); } } catch(e) {} }
function playBonusFanfare() { if (!synthsInit) return; try { const n = Tone.now(); bellSynth.triggerAttackRelease("G5","8n",n,0.4); bellSynth.triggerAttackRelease("B5","8n",n+0.15,0.4); bellSynth.triggerAttackRelease("D6","4n",n+0.3,0.5); } catch(e) {} }
function playGambleWin() { if (!synthsInit) return; try { const n = Tone.now(); synth.triggerAttackRelease("C5","8n",n,0.4); synth.triggerAttackRelease("E5","8n",n+0.1,0.4); synth.triggerAttackRelease("G5","4n",n+0.2,0.5); } catch(e) {} }
function playGambleLoss() { if (!synthsInit) return; try { synth.triggerAttackRelease("C3","4n",Tone.now(),0.5); } catch(e) {} }
function playReelStop(i) { if (!synthsInit) return; try { const notes = ["C3","D3","E3","F3","G3"]; bellSynth.triggerAttackRelease(notes[i],"16n",Tone.now(),0.3); noiseSynth.triggerAttackRelease("32n"); } catch(e) {} }

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 7: PROGRESSIVE JACKPOT
 * ═══════════════════════════════════════════════════════════════════ */
const JP_CONFIG = { contribution: 0.015, seed: 500, triggerProb: 0.00002, phantom: 0.005 };

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 8: GAMBLER'S FALLACY
 * ═══════════════════════════════════════════════════════════════════ */
function genFallacy(st) {
  const { consecutiveLosses: cl, consecutiveWins: cw, spinCount: sc, lastBonusSpin: lb } = st;
  const ssb = sc - lb;
  let heat;
  if (cw > 3) heat = { level: "🔥 HOT ZONE", color: "#ff4444", value: 0.8 + Math.random() * 0.2 };
  else if (cl > 6) heat = { level: "❄️ COLD FRONT", color: "#4488ff", value: 0.1 + Math.random() * 0.1 };
  else heat = { level: "⚡ TEMPERATE", color: "#ffa500", value: 0.4 + Math.random() * 0.2 };
  const bonusMeter = Math.min(0.95, ssb / 150 + Math.random() * 0.1);
  const streakMsg = cw > 2 ? `${cw} wins! Lucky coordinates!` : cl > 4 ? `Flight overdue! ${cl} misses` : "Scanning airspace...";
  return { heat, bonusMeter, streakMsg };
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 9: MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════ */
export default function GlobeSpinner() {
  // ── Player State ──
  const [bal, setBal] = useState(1000);
  const [bet, setBet] = useState(1.00);
  const [tWag, setTWag] = useState(0);
  const [tWon, setTWon] = useState(0);

  // ── Grid State ──
  const initG = () => { const g=[],a=LANDMARKS.filter(s=>s.tier>0); for(let r=0;r<NR;r++){const c=[];for(let row=0;row<NROW;row++)c.push(a[Math.floor(Math.random()*a.length)]);g.push(c);}return g; };
  const [grid, setGrid] = useState(initG);
  const [spinning, setSpinning] = useState(false);
  const [dispGrid, setDispGrid] = useState(null);
  const [lastWin, setLastWin] = useState(0);
  const [winLines, setWinLines] = useState([]);
  const [msg, setMsg] = useState("Spin the globe, find your fortune!");

  // ── Engine State ──
  const [hist, setHist] = useState([]);
  const [spins, setSpins] = useState(0);
  const [cLoss, setCLoss] = useState(0);
  const [cWin, setCWin] = useState(0);
  const [lastBon, setLastBon] = useState(0);
  const [lastCorr, setLastCorr] = useState(null);
  const [dLog, setDLog] = useState([]);

  // ── Free Spins ──
  const [fsLeft, setFsLeft] = useState(0);
  const [fsWins, setFsWins] = useState(0);

  // ── Around the World Bonus ──
  const [bonusActive, setBonusActive] = useState(false);
  const [bonusStop, setBonusStop] = useState(0);    // Current stop index
  const [bonusSpins, setBonusSpins] = useState(0);   // Accumulated bonus spins
  const [bonusHistory, setBonusHistory] = useState([]); // Journey log
  const [bonusGambling, setBonusGambling] = useState(false);
  const [bonusResult, setBonusResult] = useState(null); // "win"|"lose"|null
  const [totalBonusTrips, setTotalBonusTrips] = useState(0);
  const [totalBonusSpinsWon, setTotalBonusSpinsWon] = useState(0);

  // ── Near-miss ──
  const [nmOn, setNmOn] = useState(true);

  // ── Dark Pattern Toggles ──
  const [ldwOn, setLdwOn] = useState(true);
  const [stopBtnOn, setStopBtnOn] = useState(true);
  const [celebOn, setCelebOn] = useState(true);
  const [anticipOn, setAnticipOn] = useState(true);
  const [creditMode, setCreditMode] = useState(false);
  const [hideTime, setHideTime] = useState(false);
  const [hideCost, setHideCost] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [jpOn, setJpOn] = useState(true);
  const [fallacyOn, setFallacyOn] = useState(true);
  const [autoSpeedOn, setAutoSpeedOn] = useState(true);

  // ── Jackpot ──
  const [jpPool, setJpPool] = useState(JP_CONFIG.seed);
  const [jpContrib, setJpContrib] = useState(0);

  // ── Fallacy ──
  const [fallacy, setFallacy] = useState({ heat: { level: "⚡ TEMPERATE", color: "#ffa500", value: 0.5 }, bonusMeter: 0, streakMsg: "Scanning..." });

  // ── Tracking ──
  const [dpStats, setDpStats] = useState({ ldwCount: 0, ldwLost: 0, trueWins: 0, trueLosses: 0, celebFake: 0, celebReal: 0, stopPresses: 0, anticipEvents: 0, sessionStart: Date.now(), manualSpins: 0, autoSpins: 0, manualTime: 0, autoTime: 0 });
  const [showCeleb, setShowCeleb] = useState(false);
  const [celebMsg, setCelebMsg] = useState("");

  // ── UI ──
  const [activeTab, setActiveTab] = useState("game");
  const [autoPlay, setAutoPlay] = useState(false);

  // ── Refs ──
  const stripsRef = useRef(buildAllStrips(REEL_CONFIGS));
  const autoRef = useRef(false);
  const tmRef = useRef(null);
  const spinStartRef = useRef(0);
  const stopRef = useRef(false);

  useEffect(() => { autoRef.current = autoPlay; }, [autoPlay]);
  useEffect(() => () => { if (tmRef.current) clearTimeout(tmRef.current); }, []);

  // Jackpot phantom ticking
  useEffect(() => {
    if (!jpOn) return;
    const t = setInterval(() => setJpPool(p => p + JP_CONFIG.phantom * (0.5 + Math.random())), 900 + Math.random() * 500);
    return () => clearInterval(t);
  }, [jpOn]);

  // Session timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { const t = setInterval(() => setElapsed(Date.now() - dpStats.sessionStart), 1000); return () => clearInterval(t); }, [dpStats.sessionStart]);

  // Helpers
  const fmtTime = (ms) => { const s=Math.floor(ms/1000),m=Math.floor(s/60),h=Math.floor(m/60); return `${h}:${String(m%60).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; };
  const CR = 100;
  const fv = (amt, cr) => cr ? `${Math.round(amt * CR).toLocaleString()} CR` : `£${amt.toFixed(2)}`;
  const classify = (b, w) => { if (w <= 0) return { type: "LOSS", net: -b }; if (w < b) return { type: "LDW", net: w - b }; return { type: "WIN", net: w - b }; };
  const getCeleb = (w, b) => { if (w <= 0) return 0; if (!ldwOn && w < b) return 0; const r = w / b; if (r >= 20) return 5; if (r >= 8) return 4; if (r >= 2) return 3; if (r >= 1) return 2; return 1; };

  function calcDelays(g) {
    if (!anticipOn) return [0,0,0,0,0];
    let sc = 0; const d = [0,0,0,0,0];
    for (let r = 0; r < NR; r++) {
      for (let row = 0; row < NROW; row++) if (g[r][row].id === "plane") sc++;
      if (sc >= 1 && r >= 1) d[r] = sc * 3;
      if (sc >= 2 && r >= 2) d[r] += 4;
    }
    return d;
  }

  /* ═══════════════════════════════════════════════════════════════
   * AROUND THE WORLD BONUS — Ladder Gamble Handlers
   * ═══════════════════════════════════════════════════════════════ */

  function startBonus() {
    setBonusActive(true);
    setBonusStop(0);
    setBonusSpins(WORLD_ROUTE[0].spins); // London = guaranteed starting spins
    setBonusHistory([{ stop: 0, action: "arrive", result: "ok" }]);
    setBonusGambling(false);
    setBonusResult(null);
    setTotalBonusTrips(p => p + 1);
    if (soundOn) playBonusFanfare();
  }

  function bonusCollect() {
    // Player takes accumulated spins and returns to base game
    setFsLeft(bonusSpins);
    setFsWins(0);
    setTotalBonusSpinsWon(p => p + bonusSpins);
    setBonusHistory(p => [...p, { stop: bonusStop, action: "collect", result: `${bonusSpins} spins` }]);
    setBonusActive(false);
    setMsg(`✈️ Collected ${bonusSpins} free spins! Enjoy the journey!`);
  }

  function bonusGamble() {
    const nextStop = bonusStop + 1;
    if (nextStop >= WORLD_ROUTE.length) { bonusCollect(); return; }

    setBonusGambling(true);
    const chance = WORLD_ROUTE[nextStop].chance;
    const success = Math.random() < chance;

    // Dramatic delay
    setTimeout(() => {
      if (success) {
        const newSpins = bonusSpins + WORLD_ROUTE[nextStop].spins;
        setBonusStop(nextStop);
        setBonusSpins(newSpins);
        setBonusHistory(p => [...p, { stop: nextStop, action: "gamble", result: "success" }]);
        setBonusResult("win");
        setMsg(`✈️ Made it to ${WORLD_ROUTE[nextStop].city}! ${newSpins} spins accumulated!`);
        if (soundOn) playGambleWin();
      } else {
        setBonusHistory(p => [...p, { stop: nextStop, action: "gamble", result: "crash" }]);
        setBonusResult("lose");
        setBonusSpins(0);
        setMsg(`💥 Flight failed! Lost ALL ${bonusSpins} spins!`);
        if (soundOn) playGambleLoss();
        setTimeout(() => setBonusActive(false), 2500);
      }
      setBonusGambling(false);

      // Auto-collect at final destination
      if (success && nextStop >= WORLD_ROUTE.length - 1) {
        setTimeout(() => bonusCollect(), 1500);
      }
    }, 1200);
  }

  /* ═══════════════════════════════════════════════════════════════
   * MAIN SPIN
   * ═══════════════════════════════════════════════════════════════ */

  function finishSpin(finalGrid, totalWin, meta) {
    const { sBet, ec, dec, bonus, isAuto } = meta;
    const ns = spins + 1; setSpins(ns);
    const ntw = tWon + totalWin; setTWon(ntw);
    setHist(p => [...p, { b: sBet, w: totalWin }]);
    if (totalWin > 0) { setCWin(p => p + 1); setCLoss(0); } else { setCLoss(p => p + 1); setCWin(0); }
    setBal(b => b + totalWin);

    // Jackpot
    const jc = sBet * JP_CONFIG.contribution;
    setJpPool(p => p + jc); setJpContrib(p => p + jc);
    if (jpOn && Math.random() < JP_CONFIG.triggerProb) {
      setBal(b => b + jpPool); setTWon(p => p + jpPool); setJpPool(JP_CONFIG.seed);
    }

    // Classify & track
    const oc = classify(sBet, totalWin);
    const spinTime = Date.now() - spinStartRef.current;
    setDpStats(p => { const u = { ...p }; if (oc.type === "LDW") { u.ldwCount++; u.ldwLost += Math.abs(oc.net); } else if (oc.type === "WIN") u.trueWins++; else u.trueLosses++; if (isAuto) { u.autoSpins++; u.autoTime += spinTime; } else { u.manualSpins++; u.manualTime += spinTime; } return u; });
    setFallacy(genFallacy({ consecutiveLosses: totalWin > 0 ? 0 : cLoss + 1, consecutiveWins: totalWin > 0 ? cWin + 1 : 0, spinCount: ns, lastBonusSpin: bonus.triggered ? ns : lastBon }));

    // Celebration
    const cl = getCeleb(totalWin, sBet);
    if (cl > 0 && celebOn) {
      setShowCeleb(true);
      const isLDW = totalWin > 0 && totalWin < sBet;
      setDpStats(p => ({ ...p, [isLDW ? "celebFake" : "celebReal"]: p[isLDW ? "celebFake" : "celebReal"] + 1 }));
      setCelebMsg(cl >= 5 ? "🌍★ WORLD RECORD WIN ★🌍" : cl >= 4 ? "★ LANDMARK WIN ★" : cl >= 3 ? "Great Discovery!" : `+${fv(totalWin, creditMode)}`);
      setTimeout(() => setShowCeleb(false), cl >= 4 ? 2500 : 1000);
    } else setShowCeleb(false);

    if (soundOn && totalWin > 0) playWin(totalWin / sBet);

    // Bonus trigger
    if (bonus.triggered && fsLeft === 0) {
      setLastBon(ns);
      startBonus();
    } else if (fsLeft > 0) {
      const r = fsLeft - 1; setFsLeft(r); setFsWins(p => p + totalWin);
      if (r === 0) setMsg(`Free spins done! Won ${fv(fsWins + totalWin, creditMode)}`);
      else setMsg(`Free spin — ${r} left`);
    } else if (totalWin > 0) {
      if (!ldwOn && totalWin < sBet) setMsg(`${fv(totalWin, creditMode)} (NET: -${fv(sBet - totalWin, false)})`);
      else setMsg(`WIN ${fv(totalWin, creditMode)}`);
    } else {
      if (celebOn) setMsg(""); else setMsg(`Lost ${fv(sBet, creditMode)}`);
    }

    setLastWin(totalWin);
    setDLog(p => [{ spin: ns, cfg: ec, rtp: (tWag + sBet) > 0 ? ((ntw / (tWag + sBet)) * 100).toFixed(2) + "%" : "—", won: totalWin, type: oc.type }, ...p].slice(0, 30));
    setSpinning(false);

    // Autoplay
    const delay = autoSpeedOn && isAuto ? 360 : 900;
    if (autoRef.current && fsLeft > 1 && !bonus.triggered) tmRef.current = setTimeout(() => { if (autoRef.current) mainSpin(true); }, delay);
    else if (autoRef.current && !bonus.triggered && bal + totalWin >= sBet) tmRef.current = setTimeout(() => { if (autoRef.current) mainSpin(true); }, delay);
    else if (autoRef.current) setAutoPlay(false);
  }

  const mainSpin = useCallback((isAuto = false) => {
    if (spinning || bonusActive) return;
    const cBet = fsLeft > 0 ? 0 : bet;
    const bpl = bet / NLINES;
    if (fsLeft === 0 && bal < bet) { setMsg("Insufficient fuel!"); return; }
    if (soundOn && !synthsInit) Tone.start().then(() => initAudio());

    spinStartRef.current = Date.now();
    setSpinning(true); setWinLines([]); setLastWin(0); setShowCeleb(false); stopRef.current = false;
    if (fsLeft === 0) setBal(b => b - bet);
    const nw = tWag + bet; setTWag(nw);

    const est = { totalWagered: nw, totalWon: tWon, spinHistory: hist, consecutiveLosses: cLoss, consecutiveWins: cWin, lastBonusSpin: lastBon, spinCount: spins };
    const dec = calcCorrection(est); setLastCorr(dec);
    let ec = dec.config;
    const ssb = spins - lastBon;
    if (ssb > 100 && ec === "tight") ec = "standard";
    if (ssb > 160) ec = "loose";

    const rawGrid = spinReels(stripsRef.current[ec]);
    const bonus = evalBonusTrigger(rawGrid);
    const w0 = evalPaylines(rawGrid, bpl);
    const isWin = w0.length > 0;

    let initG = rawGrid;
    if (nmOn && !isWin) initG = applyNearMiss(rawGrid, isWin, { cl: cLoss });

    let totalWin = w0.reduce((s, x) => s + x.pay, 0) + (bonus.triggered ? bonus.payout * bet : 0);

    // Random multiplier (3% chance on wins)
    if (totalWin > 0 && Math.random() < 0.03) {
      const mults = [2, 3, 5]; const m = mults[Math.floor(Math.random() * mults.length)];
      totalWin *= m;
    }

    // Anticipation delays
    const delays = calcDelays(rawGrid);
    if (delays.some(d => d > 0)) setDpStats(p => ({ ...p, anticipEvents: p.anticipEvents + 1 }));

    // Animation
    const allS = LANDMARKS.filter(s => s.tier > 0 || s.id === "plane");
    let cycles = 0;
    const speedMult = autoSpeedOn && isAuto ? 0.6 : 1;
    const baseMax = Math.floor((8 + Math.floor(Math.random() * 3)) * speedMult);
    const reelStop = Array.from({ length: NR }, (_, r) => Math.floor((baseMax - (NR - 1 - r) * 2 + delays[r]) * speedMult));
    const maxCyc = Math.max(...reelStop) + 2;
    const interval = autoSpeedOn && isAuto ? 50 : 75;

    const animT = setInterval(() => {
      cycles++;
      if (stopRef.current) { clearInterval(animT); setDispGrid(null); setGrid(initG); setWinLines(w0); finishSpin(initG, totalWin, { sBet: bet, ec, dec, bonus, isAuto }); return; }
      for (let r = 0; r < NR; r++) if (cycles === reelStop[r] && soundOn) playReelStop(r);
      const ag = Array.from({ length: NR }, (_, r) => {
        if (cycles >= reelStop[r]) return initG[r];
        return Array.from({ length: NROW }, () => allS[Math.floor(Math.random() * allS.length)]);
      });
      setDispGrid(ag);
      if (cycles >= maxCyc) { clearInterval(animT); setDispGrid(null); setGrid(initG); setWinLines(w0); finishSpin(initG, totalWin, { sBet: bet, ec, dec, bonus, isAuto }); }
    }, interval);
  }, [spinning, bonusActive, bet, bal, tWag, tWon, hist, cLoss, cWin, lastBon, spins, fsLeft, fsWins, nmOn, ldwOn, celebOn, anticipOn, creditMode, soundOn, autoSpeedOn, jpOn, jpPool]);

  // ── Computed ──
  const dg = dispGrid || grid;
  const hl = new Set(); winLines.forEach(w => w.pos.forEach(p => hl.add(`${p.r}-${p.row}`)));
  const artRTP = tWag > 0 ? (tWon / tWag * 100).toFixed(2) : "—";
  const dpCount = [ldwOn,stopBtnOn,celebOn,anticipOn,creditMode,hideTime,hideCost,soundOn,jpOn,fallacyOn,autoSpeedOn].filter(Boolean).length;
  const tabS = (t) => ({ flex:1, padding:"6px 2px", fontSize:"0.5rem", fontWeight:activeTab===t?"bold":"normal", background:activeTab===t?"rgba(0,180,255,0.12)":"rgba(255,255,255,0.02)", border:activeTab===t?"1px solid rgba(0,180,255,0.35)":"1px solid rgba(255,255,255,0.06)", borderBottom:activeTab===t?"none":undefined, color:activeTab===t?"#00b4ff":"#555", cursor:"pointer", fontFamily:"inherit", borderRadius:"4px 4px 0 0" });
  const manualSPM = dpStats.manualTime > 10000 ? (dpStats.manualSpins / (dpStats.manualTime / 60000)).toFixed(1) : "—";
  const autoSPM = dpStats.autoTime > 10000 ? (dpStats.autoSpins / (dpStats.autoTime / 60000)).toFixed(1) : "—";

  /* ═══════════════════════════════════════════════════════════════
   * RENDER
   * ═══════════════════════════════════════════════════════════════ */

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #060d1a 0%, #0a1628 50%, #0d1117 100%)", color: "#d0d8e0", fontFamily: "'Courier New', monospace", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px", gap: "5px" }}>

      {/* HEADER */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, letterSpacing: "2px", background: "linear-gradient(90deg, #00b4ff, #00ff88, #00b4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🌍 GLOBE SPINNER 🌍</h1>
        <div style={{ fontSize: "0.45rem", color: "#446688", letterSpacing: "1px" }}>{dpCount}/11 dark patterns │ {NLINES} paylines │ RTP {(TGT*100).toFixed(1)}%</div>
      </div>

      {/* PROGRESSIVE JACKPOT */}
      {jpOn && (
        <div style={{ width: "100%", maxWidth: 560, background: "linear-gradient(90deg, rgba(0,100,200,0.1), rgba(0,180,255,0.15), rgba(0,100,200,0.1))", border: "1px solid rgba(0,180,255,0.25)", borderRadius: 6, padding: "3px 10px", textAlign: "center" }}>
          <div style={{ fontSize: "0.45rem", color: "#0088cc", letterSpacing: "1px" }}>★ CIRCUMNAVIGATION JACKPOT ★</div>
          <div style={{ fontSize: "1rem", fontWeight: "bold", color: "#00b4ff", fontVariantNumeric: "tabular-nums" }}>{fv(jpPool, creditMode)}</div>
        </div>
      )}

      {/* GAMBLER'S FALLACY */}
      {fallacyOn && (
        <div style={{ display: "flex", gap: 4, width: "100%", maxWidth: 560 }}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.3)", borderRadius: 4, padding: "3px 6px", fontSize: "0.48rem", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ color: fallacy.heat.color, fontWeight: "bold" }}>{fallacy.heat.level}</div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginTop: 2 }}><div style={{ width: `${fallacy.heat.value * 100}%`, height: "100%", background: fallacy.heat.color, borderRadius: 2 }} /></div>
          </div>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.3)", borderRadius: 4, padding: "3px 6px", fontSize: "0.48rem", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ color: fallacy.bonusMeter > 0.7 ? "#ff4444" : "#888" }}>FLIGHT: {fallacy.bonusMeter > 0.7 ? "⚠ BOARDING!" : Math.round(fallacy.bonusMeter * 100) + "%"}</div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginTop: 2 }}><div style={{ width: `${fallacy.bonusMeter * 100}%`, height: "100%", background: fallacy.bonusMeter > 0.7 ? "#ff4444" : "#0088cc", borderRadius: 2 }} /></div>
          </div>
          <div style={{ flex: 1.2, background: "rgba(0,0,0,0.3)", borderRadius: 4, padding: "3px 6px", fontSize: "0.45rem", color: "#8899aa", display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.05)" }}>{fallacy.streakMsg}</div>
        </div>
      )}

      {!hideTime && <div style={{ fontSize: "0.48rem", color: "#446666", background: "rgba(0,100,100,0.06)", padding: "1px 8px", borderRadius: 3 }}>⏱ {fmtTime(elapsed)} │ {spins} spins │ Net: <span style={{ color: tWon-tWag>=0?"#00ff88":"#ff4444" }}>{fv(tWon-tWag,false)}</span></div>}

      {/* BALANCE */}
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 560, background: "rgba(0,100,200,0.06)", border: "1px solid rgba(0,180,255,0.12)", borderRadius: 6, padding: "4px 12px", fontSize: "0.7rem" }}>
        <div><span style={{ color: "#446688", fontSize: "0.45rem" }}>BAL</span><br/><span style={{ color: "#00b4ff", fontWeight: "bold" }}>{fv(bal, creditMode)}</span></div>
        <div style={{ textAlign: "center" }}><span style={{ color: "#446688", fontSize: "0.45rem" }}>{hideCost ? "LINE" : "TOTAL"}</span><br/><span style={{ color: "#ff8844", fontWeight: "bold" }}>{hideCost ? fv(bet / NLINES, creditMode) : fv(bet, creditMode)}</span></div>
        <div style={{ textAlign: "center" }}><span style={{ color: "#446688", fontSize: "0.45rem" }}>RTP</span><br/><span style={{ fontWeight: "bold", color: tWag>0&&Math.abs(tWon/tWag-TGT)<0.02?"#00ff88":"#ffa500" }}>{artRTP}%</span></div>
        <div style={{ textAlign: "right" }}><span style={{ color: "#446688", fontSize: "0.45rem" }}>WIN</span><br/><span style={{ color: lastWin>0?"#00ff88":"#446666", fontWeight: "bold" }}>{fv(lastWin, creditMode)}</span></div>
      </div>

      {fsLeft > 0 && <div style={{ background: "linear-gradient(90deg, #003366, #006699, #003366)", color: "#fff", padding: "3px 12px", borderRadius: 6, fontSize: "0.7rem", fontWeight: "bold", textAlign: "center", width: "100%", maxWidth: 560, boxSizing: "border-box" }}>✈️ FREE SPINS: {fsLeft} │ Won: {fv(fsWins, creditMode)}</div>}

      {/* ══════════ AROUND THE WORLD BONUS ══════════ */}
      {bonusActive && (
        <div style={{ width: "100%", maxWidth: 560, background: "linear-gradient(180deg, #001a33, #002244)", border: "2px solid #00b4ff", borderRadius: 10, padding: 12, boxSizing: "border-box" }}>
          <div style={{ textAlign: "center", fontWeight: "bold", color: "#00b4ff", fontSize: "0.8rem", marginBottom: 8 }}>✈️ AROUND THE WORLD IN 80 DAYS ✈️</div>

          {/* Route map */}
          <div style={{ display: "flex", gap: 2, marginBottom: 8, overflowX: "auto" }}>
            {WORLD_ROUTE.map((stop, i) => (
              <div key={i} style={{
                flex: "0 0 auto", width: 52, textAlign: "center", padding: "3px 2px", borderRadius: 5,
                background: i < bonusStop ? "rgba(0,255,136,0.12)" : i === bonusStop ? "rgba(0,180,255,0.2)" : "rgba(255,255,255,0.03)",
                border: i === bonusStop ? "2px solid #00b4ff" : i < bonusStop ? "1px solid rgba(0,255,136,0.3)" : "1px solid rgba(255,255,255,0.06)",
                opacity: i > bonusStop + 1 ? 0.4 : 1,
              }}>
                <div style={{ fontSize: "1rem" }}>{stop.emoji}</div>
                <div style={{ fontSize: "0.4rem", color: i === bonusStop ? "#00b4ff" : "#668899" }}>{stop.city}</div>
                <div style={{ fontSize: "0.45rem", color: "#00ff88", fontWeight: "bold" }}>+{stop.spins}</div>
                {i > 0 && i < WORLD_ROUTE.length - 1 && <div style={{ fontSize: "0.35rem", color: i <= bonusStop ? "#666" : "#ff8844" }}>{Math.round(stop.chance * 100)}%</div>}
              </div>
            ))}
          </div>

          {/* Status */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div style={{ fontSize: "0.6rem", color: "#668899" }}>📍 {WORLD_ROUTE[bonusStop].city} — {WORLD_ROUTE[bonusStop].desc}</div>
            <div style={{ fontSize: "0.55rem", color: "#446688" }}>{fmtCoord(WORLD_ROUTE[bonusStop].lat, WORLD_ROUTE[bonusStop].lon)}</div>
            <div style={{ fontSize: "1rem", fontWeight: "bold", color: "#00ff88", marginTop: 4 }}>{bonusSpins} FREE SPINS ACCUMULATED</div>
          </div>

          {/* Gamble result flash */}
          {bonusResult === "win" && <div style={{ textAlign: "center", color: "#00ff88", fontWeight: "bold", fontSize: "0.75rem", marginBottom: 6 }}>✅ SAFE LANDING!</div>}
          {bonusResult === "lose" && <div style={{ textAlign: "center", color: "#ff4444", fontWeight: "bold", fontSize: "0.75rem", marginBottom: 6 }}>💥 CRASHED! ALL SPINS LOST!</div>}

          {/* Buttons */}
          {!bonusGambling && bonusResult !== "lose" && bonusStop < WORLD_ROUTE.length - 1 && (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={bonusCollect} style={{ flex: 1, padding: "10px", borderRadius: 6, border: "2px solid #00ff88", background: "rgba(0,255,136,0.1)", color: "#00ff88", fontWeight: "bold", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}>
                COLLECT {bonusSpins} SPINS
              </button>
              <button onClick={bonusGamble} style={{ flex: 1, padding: "10px", borderRadius: 6, border: "2px solid #ff8844", background: "rgba(255,136,68,0.1)", color: "#ff8844", fontWeight: "bold", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}>
                GAMBLE → {WORLD_ROUTE[bonusStop + 1]?.city} ({Math.round((WORLD_ROUTE[bonusStop + 1]?.chance || 0) * 100)}%)
              </button>
            </div>
          )}
          {bonusGambling && <div style={{ textAlign: "center", color: "#ffcc00", fontWeight: "bold", fontSize: "0.8rem", padding: 10 }}>✈️ Flying to {WORLD_ROUTE[bonusStop + 1]?.city}... 🎲</div>}

          {/* EV calculator hint */}
          {!bonusGambling && bonusStop < WORLD_ROUTE.length - 1 && bonusStop > 0 && (
            <div style={{ textAlign: "center", marginTop: 6, fontSize: "0.42rem", color: "#445566" }}>
              EV of gamble: {Math.round((WORLD_ROUTE[bonusStop + 1]?.chance || 0) * (bonusSpins + (WORLD_ROUTE[bonusStop + 1]?.spins || 0)))} vs collect: {bonusSpins} spins
              {" "}({(WORLD_ROUTE[bonusStop + 1]?.chance || 0) * (bonusSpins + (WORLD_ROUTE[bonusStop + 1]?.spins || 0)) > bonusSpins ? "+EV GAMBLE" : "-EV GAMBLE"})
            </div>
          )}
        </div>
      )}

      {/* CELEBRATION */}
      {showCeleb && getCeleb(lastWin, bet) >= 3 && <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 100, pointerEvents: "none" }}><div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#00b4ff", textShadow: "0 0 25px #00b4ff" }}>{celebMsg}</div>{!ldwOn && lastWin > 0 && lastWin < bet && <div style={{ color: "#ff8844", fontSize: "0.5rem", marginTop: 4, background: "rgba(255,136,68,0.12)", padding: "2px 8px", borderRadius: 4 }}>⚠ LDW: net -{fv(bet - lastWin, false)}</div>}</div>}

      {/* ══════════ REEL GRID (5×2) ══════════ */}
      <div style={{ background: "linear-gradient(180deg, #0d1a2a, #060d18)", border: "2px solid rgba(0,180,255,0.25)", borderRadius: 10, padding: "6px", width: "100%", maxWidth: 560, boxSizing: "border-box" }}>
        {showCeleb && getCeleb(lastWin, bet) > 0 && getCeleb(lastWin, bet) < 3 && <div style={{ textAlign: "center", color: "#00b4ff", fontWeight: "bold", fontSize: "0.7rem", marginBottom: 2 }}>{celebMsg}</div>}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${NR}, 1fr)`, gap: 3 }}>
          {Array.from({ length: NROW }).map((_, row) =>
            Array.from({ length: NR }).map((_, reel) => {
              const sym = dg[reel]?.[row] || SYM.desert;
              const isW = hl.has(`${reel}-${row}`);
              return (
                <div key={`${reel}-${row}`} style={{
                  background: isW ? "radial-gradient(circle, rgba(0,255,136,0.15), rgba(0,255,136,0.03))" : "rgba(0,10,30,0.6)",
                  border: isW ? "2px solid #00ff88" : "1px solid rgba(0,180,255,0.1)",
                  borderRadius: 7, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  height: 62, padding: "2px", transition: "all 0.2s",
                  boxShadow: isW ? "0 0 12px rgba(0,255,136,0.3)" : "none",
                }}>
                  <div style={{ fontSize: "1.4rem", lineHeight: 1 }}>{sym.emoji}</div>
                  <div style={{ fontSize: "0.4rem", color: "#446688", marginTop: 1, lineHeight: 1 }}>{sym.name}</div>
                  {sym.tier > 0 && <div style={{ fontSize: "0.35rem", color: "#334455", lineHeight: 1 }}>{fmtCoord(sym.lat, sym.lon)}</div>}
                </div>
              );
            })
          ).flat()}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2, fontSize: "0.4rem", color: "#223344", padding: "0 4px" }}>
          {["REEL 1","REEL 2","REEL 3","REEL 4","REEL 5"].map(r => <span key={r}>{r}</span>)}
        </div>
      </div>

      {/* MESSAGE */}
      <div style={{ fontSize: "0.7rem", fontWeight: "bold", textAlign: "center", minHeight: 16, color: lastWin>0?"#00ff88":msg.includes("FREE")||msg.includes("BONUS")?"#00b4ff":"#668899" }}>{msg}</div>

      {/* CONTROLS */}
      <div style={{ display: "flex", gap: 3, width: "100%", maxWidth: 560 }}>
        {[0.20,0.50,1,2,5,10].map(b => <button key={b} onClick={() => setBet(b)} disabled={spinning||bonusActive} style={{ flex:1, background:bet===b?"rgba(255,136,68,0.15)":"rgba(255,255,255,0.02)", border:bet===b?"1px solid #ff8844":"1px solid rgba(255,255,255,0.06)", color:bet===b?"#ff8844":"#556677", borderRadius:4, padding:"3px 2px", fontSize:"0.55rem", cursor:"pointer", fontFamily:"inherit" }}>{hideCost?fv(b/NLINES,creditMode):fv(b,creditMode)}</button>)}
      </div>
      <div style={{ display: "flex", gap: 4, width: "100%", maxWidth: 560 }}>
        <button onClick={() => mainSpin(false)} disabled={spinning||bonusActive||(fsLeft===0&&bal<bet)} style={{ flex:2, background:spinning?"rgba(50,50,70,0.3)":fsLeft>0?"linear-gradient(180deg, #003366, #001a33)":"linear-gradient(180deg, #00b4ff, #0066aa)", border:"none", borderRadius:6, padding:"10px", fontSize:"0.9rem", fontWeight:"bold", color:spinning?"#334":"#000", cursor:spinning?"not-allowed":"pointer", fontFamily:"inherit", letterSpacing:"2px" }}>{spinning?"...":fsLeft>0?`✈️ FREE(${fsLeft})`:"🌍 SPIN"}</button>
        {stopBtnOn && <button onClick={() => { if(spinning){stopRef.current=true;setDpStats(p=>({...p,stopPresses:p.stopPresses+1}));} }} disabled={!spinning} style={{ flex:0.5, background:spinning?"rgba(255,50,50,0.12)":"rgba(255,255,255,0.02)", border:spinning?"1px solid #ff4444":"1px solid rgba(255,255,255,0.04)", borderRadius:6, padding:"10px 3px", fontSize:"0.6rem", fontWeight:"bold", color:spinning?"#ff4444":"#333", cursor:spinning?"pointer":"default", fontFamily:"inherit" }}>STOP</button>}
        <button onClick={() => { setAutoPlay(!autoPlay); if(autoPlay) autoRef.current=false; }} disabled={bonusActive} style={{ flex:0.5, background:autoPlay?"rgba(255,50,50,0.1)":"rgba(255,255,255,0.02)", border:autoPlay?"1px solid #ff4444":"1px solid rgba(255,255,255,0.05)", borderRadius:6, padding:"10px 2px", fontSize:"0.5rem", color:autoPlay?"#ff4444":"#556", cursor:"pointer", fontFamily:"inherit" }}>{autoPlay?"■":"▶"}</button>
      </div>

      {/* UTILITY ROW */}
      <div style={{ display: "flex", gap: 3, width: "100%", maxWidth: 560, fontSize: "0.5rem" }}>
        <button onClick={() => setNmOn(!nmOn)} style={{ flex:1, padding:"3px", borderRadius:3, fontFamily:"inherit", cursor:"pointer", background:nmOn?"rgba(255,136,68,0.08)":"rgba(255,255,255,0.02)", border:nmOn?"1px solid rgba(255,136,68,0.2)":"1px solid rgba(255,255,255,0.04)", color:nmOn?"#ff8844":"#444" }}>👁{nmOn?"ON":"OFF"}</button>
        <button onClick={() => { setBal(1000);setTWag(0);setTWon(0);setHist([]);setSpins(0);setCLoss(0);setCWin(0);setLastBon(0);setLastCorr(null);setDLog([]);setFsLeft(0);setFsWins(0);setAutoPlay(false);setBonusActive(false);setJpPool(JP_CONFIG.seed);setJpContrib(0);setDpStats({ldwCount:0,ldwLost:0,trueWins:0,trueLosses:0,celebFake:0,celebReal:0,stopPresses:0,anticipEvents:0,sessionStart:Date.now(),manualSpins:0,autoSpins:0,manualTime:0,autoTime:0});setMsg("Reset!");stripsRef.current=buildAllStrips(REEL_CONFIGS); }} style={{ padding:"3px 8px", borderRadius:3, fontFamily:"inherit", cursor:"pointer", background:"rgba(255,50,50,0.06)", border:"1px solid rgba(255,50,50,0.12)", color:"#ff4444" }}>↺ RESET</button>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", width: "100%", maxWidth: 560, gap: 1 }}>
        {[["game","🌍 GAME"],["bonus","✈️ BONUS"],["darkpat","🧠 DARK"],["engine","⚙️ ENGINE"]].map(([t,l]) => <button key={t} onClick={() => setActiveTab(t)} style={tabS(t)}>{l}</button>)}
      </div>

      {/* TAB CONTENT */}
      <div style={{ width: "100%", maxWidth: 560, boxSizing: "border-box", background: "rgba(0,10,30,0.5)", border: "1px solid rgba(0,180,255,0.08)", borderTop: "none", borderRadius: "0 0 6px 6px", padding: 10, fontSize: "0.58rem", lineHeight: 1.5, minHeight: 120 }}>

        {activeTab === "game" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 12px" }}>
              <span style={{ color: "#556" }}>Wagered:</span><span>{fv(tWag,creditMode)}</span>
              <span style={{ color: "#556" }}>Returned:</span><span>{fv(tWon,creditMode)}</span>
              <span style={{ color: "#556" }}>Net:</span><span style={{ color:tWon-tWag>=0?"#00ff88":"#ff4444" }}>{fv(tWon-tWag,false)}</span>
              <span style={{ color: "#556" }}>Spins:</span><span>{spins}</span>
              <span style={{ color: "#556" }}>LDW rate:</span><span style={{ color: "#ff8844" }}>{spins>0?((dpStats.ldwCount/spins)*100).toFixed(1):0}%</span>
              <span style={{ color: "#556" }}>True win rate:</span><span style={{ color: "#00ff88" }}>{spins>0?((dpStats.trueWins/spins)*100).toFixed(1):0}%</span>
              <span style={{ color: "#556" }}>Bonus trips:</span><span>{totalBonusTrips}</span>
              <span style={{ color: "#556" }}>Bonus spins won:</span><span>{totalBonusSpinsWon}</span>
              <span style={{ color: "#556" }}>Manual/Auto SPM:</span><span>{manualSPM}/{autoSPM}</span>
            </div>
            <div style={{ marginTop: 4, maxHeight: 70, overflowY: "auto", fontSize: "0.48rem" }}>
              {dLog.slice(0,10).map((e,i) => <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"1px 0", borderBottom:"1px solid rgba(255,255,255,0.02)" }}>
                <span style={{ color:"#334" }}>#{e.spin}</span>
                <span style={{ color:e.cfg==="loose"?"#00ff88":e.cfg==="tight"?"#ff4444":"#0088cc" }}>{e.cfg}</span>
                <span style={{ color:e.type==="LDW"?"#ff8844":e.type==="WIN"?"#00ff88":"#ff4444" }}>{e.type}</span>
                <span style={{ color:e.won>0?"#00ff88":"#334" }}>{fv(e.won,creditMode)}</span>
              </div>)}
            </div>
          </div>
        )}

        {activeTab === "bonus" && (
          <div>
            <div style={{ color: "#00b4ff", fontWeight: "bold", marginBottom: 4 }}>✈️ AROUND THE WORLD IN 80 DAYS</div>
            <div style={{ background: "rgba(0,100,200,0.06)", borderRadius: 4, padding: 6, marginBottom: 6, fontSize: "0.5rem", color: "#668899", lineHeight: 1.4 }}>
              <b>How it works:</b> 3+ ✈️ planes trigger the bonus. Travel the world — each city awards free spins. At each stop: COLLECT (safe) or GAMBLE (risk all spins for more). Gamble odds decrease as you progress. The EV hint shows whether gambling is mathematically optimal — early stops are usually +EV, later stops become -EV as the risk of losing accumulates.
            </div>
            <div style={{ color: "#00b4ff", fontWeight: "bold", fontSize: "0.52rem", marginBottom: 3 }}>ROUTE & ODDS</div>
            {WORLD_ROUTE.map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: "0.5rem" }}>
                <span>{s.emoji} {s.city}</span>
                <span style={{ color: "#00ff88" }}>+{s.spins}</span>
                <span style={{ color: s.chance < 0.4 ? "#ff4444" : s.chance < 0.6 ? "#ffa500" : "#00ff88" }}>{i === 0 || i === WORLD_ROUTE.length - 1 ? "AUTO" : `${Math.round(s.chance * 100)}%`}</span>
              </div>
            ))}
            <div style={{ marginTop: 6, fontSize: "0.48rem", color: "#556" }}>
              Total trips: {totalBonusTrips} │ Total bonus spins: {totalBonusSpinsWon}
            </div>
          </div>
        )}

        {activeTab === "darkpat" && (
          <div>
            <div style={{ color: "#ff0066", fontWeight: "bold", marginBottom: 4 }}>🧠 DARK PATTERNS ({dpCount}/11)</div>
            <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
              <button onClick={() => { setLdwOn(true);setStopBtnOn(true);setCelebOn(true);setAnticipOn(true);setCreditMode(true);setHideTime(true);setHideCost(true);setSoundOn(true);setJpOn(true);setFallacyOn(true);setAutoSpeedOn(true);Tone.start().then(()=>initAudio()); }} style={{ flex:1, padding:"4px", borderRadius:4, background:"rgba(255,0,100,0.08)", border:"1px solid rgba(255,0,100,0.2)", color:"#ff0066", cursor:"pointer", fontFamily:"inherit", fontSize:"0.48rem", fontWeight:"bold" }}>🎰 CASINO</button>
              <button onClick={() => { setLdwOn(false);setStopBtnOn(false);setCelebOn(false);setAnticipOn(false);setCreditMode(false);setHideTime(false);setHideCost(false);setSoundOn(false);setJpOn(false);setFallacyOn(false);setAutoSpeedOn(false); }} style={{ flex:1, padding:"4px", borderRadius:4, background:"rgba(0,255,136,0.06)", border:"1px solid rgba(0,255,136,0.12)", color:"#00ff88", cursor:"pointer", fontFamily:"inherit", fontSize:"0.48rem", fontWeight:"bold" }}>✅ HONEST</button>
            </div>
            <div style={{ display: "grid", gap: 3, maxHeight: 250, overflowY: "auto" }}>
              {[
                { on:ldwOn, set:setLdwOn, label:"Loss Disguised as Win", color:"#ff8844", stat:`${dpStats.ldwCount} LDWs, lost ${fv(dpStats.ldwLost,false)}` },
                { on:stopBtnOn, set:setStopBtnOn, label:"Stop Button Illusion", color:"#ff4444", stat:`${dpStats.stopPresses} presses, 0 effect` },
                { on:celebOn, set:setCelebOn, label:"Celebration Asymmetry", color:"#ffd700", stat:`${dpStats.celebFake} fake / ${dpStats.celebReal} real` },
                { on:anticipOn, set:setAnticipOn, label:"Reel Anticipation", color:"#ff00ff", stat:`${dpStats.anticipEvents} slowdowns` },
                { on:creditMode, set:setCreditMode, label:"Credit Obfuscation", color:"#0096ff", stat:creditMode?"Credits":"Currency" },
                { on:hideTime, set:setHideTime, label:"Time Dissolution", color:"#cc00cc", stat:fmtTime(elapsed) },
                { on:hideCost, set:setHideCost, label:"Bet Hiding", color:"#00cc99", stat:`True: ${fv(bet,false)}/spin` },
                { on:soundOn, set:(v)=>{setSoundOn(v);if(v)Tone.start().then(()=>initAudio());}, label:"Asymmetric Sound", color:"#ff6633", stat:"Win=music, Loss=silence" },
                { on:jpOn, set:setJpOn, label:"Progressive Jackpot", color:"#ff3399", stat:`Pool: ${fv(jpPool,false)}` },
                { on:fallacyOn, set:setFallacyOn, label:"Gambler's Fallacy", color:"#9933ff", stat:"Fake hot/cold indicators" },
                { on:autoSpeedOn, set:setAutoSpeedOn, label:"Autoplay Acceleration", color:"#ff9933", stat:`${manualSPM}/${autoSPM} spm` },
              ].map((dp,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"3px 6px", borderRadius:4, background:dp.on?`${dp.color}0a`:"transparent", border:`1px solid ${dp.on?dp.color+"25":"rgba(255,255,255,0.04)"}` }}>
                  <button onClick={()=>dp.set(!dp.on)} style={{ width:30, height:15, borderRadius:8, border:"none", cursor:"pointer", background:dp.on?dp.color:"rgba(255,255,255,0.08)", position:"relative", flexShrink:0 }}><div style={{ width:11, height:11, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:dp.on?17:2, transition:"left 0.2s" }}/></button>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:"bold", color:dp.on?dp.color:"#445", fontSize:"0.5rem" }}>{dp.label}</div>
                    <div style={{ fontSize:"0.42rem", color:"#445" }}>{dp.stat}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "engine" && lastCorr && (
          <div>
            <div style={{ color: "#00b4ff", fontWeight: "bold", marginBottom: 4 }}>⚙️ RTP ENGINE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 12px" }}>
              <span style={{ color: "#556" }}>Strip:</span><span style={{ color: lastCorr.config==="loose"?"#00ff88":lastCorr.config==="tight"?"#ff4444":"#0088cc", fontWeight: "bold" }}>{lastCorr.config.toUpperCase()}</span>
              <span style={{ color: "#556" }}>Correction:</span><span>{lastCorr.corr.toFixed(4)}</span>
              <span style={{ color: "#556" }}>Deviation:</span><span>{(lastCorr.dev * 100).toFixed(3)}%</span>
            </div>
            {Object.entries(lastCorr.rw).map(([n, r]) => (
              <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                <span style={{ color: "#556", width: 30, fontSize: "0.5rem" }}>{n}</span>
                <div style={{ width: 60, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 1, position: "relative" }}>
                  <div style={{ position: "absolute", left: "50%", width: 1, height: "100%", background: "rgba(255,255,255,0.08)" }} />
                  <div style={{ position: "absolute", left: `${Math.max(2, Math.min(98, 50 + (r - TGT) * 500))}%`, width: 3, height: "100%", background: Math.abs(r - TGT) < 0.03 ? "#00ff88" : "#ffa500", borderRadius: 1 }} />
                </div>
                <span style={{ color: "#889", width: 40, textAlign: "right", fontSize: "0.5rem" }}>{(r * 100).toFixed(1)}%</span>
              </div>
            ))}
            {lastCorr.reasons.map((r, i) => <div key={i} style={{ color: "#4488aa", paddingLeft: 6, fontSize: "0.48rem" }}>▸ {r}</div>)}
          </div>
        )}
      </div>

      <style>{`button:hover:not(:disabled){filter:brightness(1.15)}button:active:not(:disabled){transform:scale(0.97)}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(0,180,255,0.15);border-radius:2px}`}</style>
    </div>
  );
}
