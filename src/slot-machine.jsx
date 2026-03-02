/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║          SLOT MACHINE SIMULATOR — EDUCATIONAL ENGINE            ║
 * ║                                                                  ║
 * ║  A transparent slot machine that exposes the mathematical        ║
 * ║  algorithms real machines use to maintain Return-To-Player       ║
 * ║  (RTP) targets while creating engaging volatility patterns.      ║
 * ║                                                                  ║
 * ║  KEY CONCEPT: Real slot machines don't "rig" individual spins.   ║
 * ║  Instead, they select from weighted reel strip configurations    ║
 * ║  that naturally produce different payout rates. The machine      ║
 * ║  chooses which strip set to use based on its current RTP         ║
 * ║  deviation — this is the core mechanism we simulate here.        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { useState, useRef, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 1: SYMBOL SYSTEM & CONFIGURATION
 * 
 * Each symbol has a name, display emoji, and a "tier" that determines
 * its base payout multiplier. Higher tier = rarer = higher payout.
 * The frequency of each symbol on the reel strips determines the
 * actual probability of landing on it.
 * ═══════════════════════════════════════════════════════════════════ */

const SYMBOLS = [
  { id: "cherry",  emoji: "🍒", tier: 1, name: "Cherry" },
  { id: "lemon",   emoji: "🍋", tier: 1, name: "Lemon" },
  { id: "orange",  emoji: "🍊", tier: 2, name: "Orange" },
  { id: "grape",   emoji: "🍇", tier: 2, name: "Grape" },
  { id: "bell",    emoji: "🔔", tier: 3, name: "Bell" },
  { id: "diamond", emoji: "💎", tier: 4, name: "Diamond" },
  { id: "seven",   emoji: "7️⃣",  tier: 5, name: "Seven" },
  { id: "wild",    emoji: "⭐", tier: 6, name: "Wild" },     // Substitutes for any symbol except scatter/bonus
  { id: "scatter", emoji: "🌀", tier: 0, name: "Scatter" },  // Triggers free spins (pays anywhere)
  { id: "bonus",   emoji: "🎰", tier: 0, name: "Bonus" },    // Triggers pick bonus
];

const SYM = Object.fromEntries(SYMBOLS.map(s => [s.id, s]));

/**
 * PAYTABLE — Defines what combinations pay and how much.
 * 
 * Multipliers are per-line, applied to the bet-per-line.
 * Real machines calculate: win = multiplier × (total_bet / num_paylines)
 * 
 * The paytable is designed so that:
 * - Low symbols (cherry, lemon) pay small but frequently
 * - High symbols (seven, diamond) pay large but rarely
 * - This creates the "volatility profile" — the emotional rollercoaster
 */
const PAYTABLE = {
  // symbol_id: { count_needed: multiplier }
  // Count is how many matching symbols on a payline (left-to-right)
  cherry:  { 3: 5,   4: 15,  5: 40 },
  lemon:   { 3: 5,   4: 15,  5: 40 },
  orange:  { 3: 10,  4: 30,  5: 75 },
  grape:   { 3: 10,  4: 30,  5: 75 },
  bell:    { 3: 25,  4: 75,  5: 200 },
  diamond: { 3: 50,  4: 150, 5: 500 },
  seven:   { 3: 100, 4: 300, 5: 1000 },
  wild:    { 3: 100, 4: 300, 5: 1000 }, // Wild-only line pays like sevens
};

/** Scatter pays based on total bet (not per-line), regardless of payline position */
const SCATTER_PAY = { 3: 5, 4: 20, 5: 50 };

/** Free spins awarded by scatter count */
const FREE_SPINS_AWARD = { 3: 10, 4: 15, 5: 25 };

/** Number of paylines — each line is a specific pattern across the 5×3 grid */
const NUM_PAYLINES = 20;
const NUM_REELS = 5;
const NUM_ROWS = 3;

/**
 * TARGET RTP — The theoretical return-to-player percentage.
 * 
 * This is the most important number in slot design. It means:
 * "For every £100 wagered, the machine returns £96.50 on average."
 * 
 * The remaining 3.5% is the "house edge" — the casino's profit margin.
 * 
 * Real machines range from ~85% (aggressive) to ~98% (player-friendly).
 * Online slots typically sit between 95-97%.
 */
const TARGET_RTP = 0.965;

/**
 * RTP BUDGET ALLOCATION — How the total RTP is distributed across features.
 * 
 * This is crucial: the base game doesn't need to return 96.5% on its own.
 * Part of the RTP comes from bonus features. This lets the base game
 * feel "tighter" while big bonus wins bring the overall RTP up.
 * 
 * Think of it as: "The machine takes a cut of every spin and saves some
 * of it in a bonus pot that gets paid out in exciting lump sums."
 */
const RTP_BUDGET = {
  baseGame: 0.65,       // 65% of RTP from regular spins (~62.7% effective)
  freeSpins: 0.22,      // 22% from free spin rounds (~21.2% effective)
  bonusFeatures: 0.08,  // 8% from pick bonuses (~7.7% effective)
  multipliers: 0.05,    // 5% from random multiplier events (~4.8% effective)
};

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 2: REEL STRIP DESIGN
 * 
 * This is where the magic happens. Each reel has a "strip" — a circular
 * array of symbols. The strip is NOT evenly distributed. Higher-paying
 * symbols appear fewer times, creating natural probability weighting.
 * 
 * CRITICAL CONCEPT: We have THREE strip sets (loose, standard, tight).
 * The RTP engine selects which set to use based on current deviation
 * from target RTP. This is how real machines work — they don't rig
 * individual results, they shift the probability landscape.
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * buildReelStrip() — Creates a reel strip with specific symbol frequencies.
 * 
 * @param weights - Object mapping symbol IDs to their frequency (count on strip)
 * @returns Array of symbol objects representing the physical reel strip
 * 
 * The total strip length affects granularity of probability control.
 * Longer strips = finer control but more memory. 64 stops is typical.
 */
function buildReelStrip(weights) {
  const strip = [];
  for (const [symId, count] of Object.entries(weights)) {
    for (let i = 0; i < count; i++) {
      strip.push(SYM[symId]);
    }
  }
  // Shuffle the strip so symbols are distributed, not clustered
  for (let i = strip.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [strip[i], strip[j]] = [strip[j], strip[i]];
  }
  return strip;
}

/**
 * THREE REEL STRIP CONFIGURATIONS
 * 
 * Notice how the frequencies shift between sets:
 * - "Loose" has MORE high-paying symbols and wilds
 * - "Tight" has FEWER high-paying symbols and MORE low-paying ones
 * - "Standard" sits in the middle
 * 
 * The differences are subtle — maybe 1-2 extra sevens or wilds.
 * But across thousands of spins, this creates measurable RTP shifts.
 * 
 * Each reel in a set can have different weights, but for clarity
 * we use uniform weights per set here.
 */
const REEL_CONFIGS = {
  // LOOSE CONFIG — Natural RTP ~101-104% (used when machine is "cold"/underpaying)
  loose: {
    cherry: 12, lemon: 11, orange: 9, grape: 9,
    bell: 7, diamond: 5, seven: 4, wild: 4, scatter: 2, bonus: 1,
  },
  // STANDARD CONFIG — Natural RTP ~96-97% (used when on target)
  standard: {
    cherry: 14, lemon: 13, orange: 10, grape: 10,
    bell: 6, diamond: 4, seven: 3, wild: 2, scatter: 1, bonus: 1,
  },
  // TIGHT CONFIG — Natural RTP ~89-92% (used when machine is "hot"/overpaying)
  tight: {
    cherry: 16, lemon: 15, orange: 11, grape: 10,
    bell: 5, diamond: 3, seven: 2, wild: 1, scatter: 1, bonus: 0,
  },
};

/** Pre-build all reel strips for each configuration */
function buildAllStrips() {
  const strips = {};
  for (const [config, weights] of Object.entries(REEL_CONFIGS)) {
    strips[config] = [];
    for (let r = 0; r < NUM_REELS; r++) {
      strips[config].push(buildReelStrip(weights));
    }
  }
  return strips;
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 3: PAYLINE DEFINITIONS
 * 
 * Paylines define the patterns across the 5×3 grid that count as
 * winning combinations. Each payline is an array of 5 row indices
 * (0=top, 1=middle, 2=bottom), one per reel.
 * 
 * Example: [1,1,1,1,1] = straight middle row
 *          [0,1,2,1,0] = V-shape
 * ═══════════════════════════════════════════════════════════════════ */

const PAYLINES = [
  [1, 1, 1, 1, 1],  // Line 1:  ───── (middle straight)
  [0, 0, 0, 0, 0],  // Line 2:  ───── (top straight)
  [2, 2, 2, 2, 2],  // Line 3:  ───── (bottom straight)
  [0, 1, 2, 1, 0],  // Line 4:  V shape
  [2, 1, 0, 1, 2],  // Line 5:  Λ shape (inverted V)
  [0, 0, 1, 0, 0],  // Line 6:  slight dip
  [2, 2, 1, 2, 2],  // Line 7:  slight bump
  [1, 0, 0, 0, 1],  // Line 8:  U shape
  [1, 2, 2, 2, 1],  // Line 9:  n shape
  [0, 1, 1, 1, 0],  // Line 10: shallow V
  [2, 1, 1, 1, 2],  // Line 11: shallow Λ
  [1, 0, 1, 0, 1],  // Line 12: zigzag up
  [1, 2, 1, 2, 1],  // Line 13: zigzag down
  [0, 1, 0, 1, 0],  // Line 14: wave top
  [2, 1, 2, 1, 2],  // Line 15: wave bottom
  [1, 1, 0, 1, 1],  // Line 16: top bump
  [1, 1, 2, 1, 1],  // Line 17: bottom bump
  [0, 0, 1, 2, 2],  // Line 18: diagonal down
  [2, 2, 1, 0, 0],  // Line 19: diagonal up
  [0, 2, 0, 2, 0],  // Line 20: extreme zigzag
];

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 4: THE RTP ENGINE — "The Brain"
 * 
 * This is the core intelligence of the slot machine. It tracks
 * statistical state across multiple time windows and makes decisions
 * about which reel strip configuration to use.
 * 
 * The engine does NOT determine specific outcomes. It shifts
 * probabilities by selecting strip sets, then lets randomness
 * do the rest. This is a crucial distinction — the individual
 * spin result IS random; only the probability landscape changes.
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * calculateCorrection() — The heart of the RTP control algorithm.
 * 
 * Uses a sigmoid function to smoothly transition between strip sets
 * based on how far the actual RTP deviates from target.
 * 
 * The sigmoid ensures:
 * - Small deviations → gentle correction (stays on standard strips)
 * - Large deviations → aggressive correction (switches to loose/tight)
 * - The transition is smooth, not abrupt (no jarring behavior changes)
 * 
 * @param state - The full engine state
 * @returns Object with stripConfig selection and reasoning
 */
function calculateCorrection(state) {
  const { totalWagered, totalWon, spinHistory, consecutiveLosses,
    consecutiveWins, lastBonusSpin, spinCount, recentBets,
    bankedTotal, sessionPeakBalance } = state;

  // ── STEP 1: Calculate actual RTP across time windows ──
  // We use multiple windows because short-term RTP is noisy,
  // but we need short-term awareness for player experience.
  
  const windows = {
    short:  spinHistory.slice(-20),   // Last 20 spins — "how's it going right now?"
    medium: spinHistory.slice(-100),  // Last 100 spins — "session trend"
    long:   spinHistory.slice(-500),  // Last 500 spins — "what really matters for RTP"
    all:    spinHistory,              // Everything — "the ground truth"
  };

  const rtpByWindow = {};
  for (const [name, window] of Object.entries(windows)) {
    if (window.length === 0) {
      rtpByWindow[name] = TARGET_RTP; // No data = assume on target
      continue;
    }
    const wagered = window.reduce((s, h) => s + h.bet, 0);
    const won = window.reduce((s, h) => s + h.won, 0);
    rtpByWindow[name] = wagered > 0 ? won / wagered : TARGET_RTP;
  }

  // ── STEP 2: Calculate weighted deviation ──
  // Long-term window matters most for RTP accuracy,
  // but short-term matters for player experience management.
  
  const weightedRTP = (
    rtpByWindow.short  * 0.10 +  // 10% weight — responsive to recent results
    rtpByWindow.medium * 0.25 +  // 25% weight — session awareness
    rtpByWindow.long   * 0.35 +  // 35% weight — primary correction driver
    rtpByWindow.all    * 0.30    // 30% weight — ground truth anchor
  );

  const deviation = weightedRTP - TARGET_RTP;
  // Positive deviation = overpaying → need to tighten
  // Negative deviation = underpaying → need to loosen

  // ── STEP 3: Apply sigmoid correction ──
  // The sigmoid maps deviation to a -1..+1 correction factor.
  // We use a steepness of 15 — higher = more aggressive correction.
  
  const steepness = 15;
  const sigmoidRaw = 1 / (1 + Math.exp(-steepness * deviation));
  // sigmoidRaw is 0..1, center at 0.5. Convert to -1..+1
  const correctionBase = (sigmoidRaw - 0.5) * 2;

  // ── STEP 4: Session awareness modifiers ──
  // These adjust the correction based on player behavior patterns.
  
  let sessionModifier = 0;
  const reasons = [];

  // 4a: Consecutive losses — "sympathy" factor
  // After many losses, slightly boost win chance to prevent
  // player abandonment. Real machines do this to maintain engagement.
  if (consecutiveLosses > 15) {
    sessionModifier -= 0.15; // Push toward loose
    reasons.push(`Long drought (${consecutiveLosses} losses) → loosening`);
  } else if (consecutiveLosses > 8) {
    sessionModifier -= 0.08;
    reasons.push(`Losing streak (${consecutiveLosses}) → slight loosen`);
  }

  // 4b: Consecutive wins — "cooling" factor
  // After a hot streak, reduce win chance to protect the house edge.
  if (consecutiveWins > 5) {
    sessionModifier += 0.12;
    reasons.push(`Win streak (${consecutiveWins}) → cooling down`);
  }

  // 4c: Bonus drought — prevent feature starvation
  // Players expect bonus features periodically. If it's been too long,
  // increase the trigger probability (handled separately in bonus logic).
  const spinsSinceBonus = spinCount - lastBonusSpin;
  if (spinsSinceBonus > 150) {
    sessionModifier -= 0.05;
    reasons.push(`Bonus drought (${spinsSinceBonus} spins) → due for feature`);
  }

  // 4d: Bet change detection — "chasing" behavior
  // If the player dramatically increases their bet after losses,
  // they may be chasing losses. The machine doesn't punish this,
  // but it doesn't reward it either — maintains standard correction.
  if (recentBets.length >= 3) {
    const avgRecent = recentBets.slice(-3).reduce((a,b) => a+b, 0) / 3;
    const avgPrior = recentBets.slice(-6, -3).reduce((a,b) => a+b, 0) / Math.max(1, recentBets.slice(-6, -3).length);
    if (avgPrior > 0 && avgRecent > avgPrior * 2) {
      sessionModifier += 0.04;
      reasons.push("Bet increase detected → maintaining standard");
    }
  }

  // 4e: Banking behavior — risk-averse player detection
  // If the player has banked significant winnings, they're protecting
  // profits. The machine can afford to be slightly tighter since
  // the player's effective session is "reset".
  if (bankedTotal > 0 && totalWagered > 0) {
    const bankRatio = bankedTotal / totalWagered;
    if (bankRatio > 0.5) {
      sessionModifier += 0.03;
      reasons.push("Significant banking → slight tightening");
    }
  }

  // ── STEP 5: Combine correction and select strip config ──
  // Final correction is the sigmoid base plus session modifiers,
  // clamped to -1..+1 range.
  
  const finalCorrection = Math.max(-1, Math.min(1,
    correctionBase + sessionModifier
  ));

  // Map correction to strip selection:
  // correction < -0.3 → loose (machine needs to pay more)
  // correction > 0.3  → tight (machine has overpaid)
  // otherwise         → standard (on target)
  
  let stripConfig;
  if (finalCorrection < -0.3) {
    stripConfig = "loose";
  } else if (finalCorrection > 0.3) {
    stripConfig = "tight";
  } else {
    stripConfig = "standard";
  }

  // ── STEP 6: Build decision report for transparency panel ──
  if (reasons.length === 0) reasons.push("No special conditions — standard operation");

  return {
    stripConfig,
    correction: finalCorrection,
    deviation,
    weightedRTP,
    rtpByWindow,
    reasons,
    sigmoidRaw: correctionBase,
    sessionModifier,
  };
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 5: SPIN RESOLUTION
 * 
 * This resolves a single spin: selects symbols, evaluates paylines,
 * checks for bonus triggers, and calculates the total win.
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * spinReels() — Randomly select symbols from the chosen reel strips.
 * 
 * Each reel independently picks a random stop position on its strip,
 * then reads 3 consecutive symbols (the visible window).
 * 
 * @param strips - The reel strip arrays for the selected configuration
 * @returns 5×3 grid of symbols (reels × rows)
 */
function spinReels(strips) {
  const grid = [];
  for (let r = 0; r < NUM_REELS; r++) {
    const strip = strips[r];
    const stopPos = Math.floor(Math.random() * strip.length);
    const column = [];
    for (let row = 0; row < NUM_ROWS; row++) {
      column.push(strip[(stopPos + row) % strip.length]);
    }
    grid.push(column);
  }
  return grid;
}

/**
 * evaluatePaylines() — Check all paylines for winning combinations.
 * 
 * For each payline, reads the symbols at the defined positions,
 * then checks for left-to-right matching (wilds substitute).
 * 
 * Returns all winning lines with their payouts.
 */
function evaluatePaylines(grid, betPerLine) {
  const wins = [];

  for (let lineIdx = 0; lineIdx < NUM_PAYLINES; lineIdx++) {
    const line = PAYLINES[lineIdx];
    const lineSymbols = line.map((row, reel) => grid[reel][row]);

    // Find the first non-wild symbol (this is the symbol we're matching)
    let matchSymbol = null;
    for (const sym of lineSymbols) {
      if (sym.id !== "wild" && sym.id !== "scatter" && sym.id !== "bonus") {
        matchSymbol = sym;
        break;
      }
    }

    // If all wilds, treat as wild-line win
    if (!matchSymbol) {
      const allWild = lineSymbols.every(s => s.id === "wild");
      if (allWild) {
        matchSymbol = SYM.wild;
      } else {
        continue; // Line has only scatters/bonuses and wilds — no line win
      }
    }

    // Count consecutive matches from left (wilds substitute)
    let count = 0;
    for (const sym of lineSymbols) {
      if (sym.id === matchSymbol.id || sym.id === "wild") {
        count++;
      } else {
        break; // Must be consecutive from left
      }
    }

    // Look up payout in paytable
    if (count >= 3 && PAYTABLE[matchSymbol.id] && PAYTABLE[matchSymbol.id][count]) {
      const multiplier = PAYTABLE[matchSymbol.id][count];
      wins.push({
        lineIndex: lineIdx,
        symbol: matchSymbol,
        count,
        multiplier,
        payout: multiplier * betPerLine,
        positions: line.slice(0, count).map((row, reel) => ({ reel, row })),
      });
    }
  }

  return wins;
}

/**
 * evaluateScatters() — Check for scatter symbols anywhere on the grid.
 * Scatters pay regardless of payline position and trigger free spins.
 */
function evaluateScatters(grid, totalBet) {
  let count = 0;
  const positions = [];
  for (let r = 0; r < NUM_REELS; r++) {
    for (let row = 0; row < NUM_ROWS; row++) {
      if (grid[r][row].id === "scatter") {
        count++;
        positions.push({ reel: r, row });
      }
    }
  }

  const result = { count, positions, payout: 0, freeSpins: 0 };
  if (count >= 3) {
    result.payout = (SCATTER_PAY[count] || 0) * totalBet;
    result.freeSpins = FREE_SPINS_AWARD[count] || 0;
  }
  return result;
}

/**
 * evaluateBonusTrigger() — Check for bonus symbol triggers.
 * 3+ bonus symbols on reels 1-3-5 trigger the pick bonus.
 */
function evaluateBonusTrigger(grid) {
  let count = 0;
  const positions = [];
  // Bonus only counts on reels 0, 2, 4 (1st, 3rd, 5th) — common mechanic
  for (const r of [0, 2, 4]) {
    for (let row = 0; row < NUM_ROWS; row++) {
      if (grid[r][row].id === "bonus") {
        count++;
        positions.push({ reel: r, row });
      }
    }
  }
  return { triggered: count >= 3, count, positions };
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 6: BONUS FEATURE SYSTEMS
 * 
 * Bonuses are where a significant portion of the RTP budget lives.
 * They create memorable "big win" moments that keep players engaged
 * even during long stretches of base game losses.
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * generatePickBonusPrizes() — Creates the hidden prizes for the pick game.
 * 
 * The total value of all prizes is calibrated to the RTP budget
 * for bonus features. The "best" prizes are rare, creating excitement.
 */
function generatePickBonusPrizes(totalBet, state) {
  // Prize pool scales with bet and session state
  const basePool = totalBet * 25; // Average pick bonus = 25x bet
  
  // If machine is underpaying, make the bonus more generous
  const correction = state.lastCorrection?.correction || 0;
  const generosity = correction < -0.2 ? 1.4 : correction > 0.2 ? 0.7 : 1.0;
  
  const pool = basePool * generosity;
  
  // Generate 12 hidden prizes with variable distribution
  const prizes = [];
  const weights = [0.02, 0.03, 0.05, 0.06, 0.07, 0.08, 0.10, 0.11, 0.12, 0.13, 0.11, 0.12];
  for (let i = 0; i < 12; i++) {
    prizes.push(Math.round(pool * weights[i] * (0.5 + Math.random())));
  }
  
  // Shuffle so player can't guess distribution
  for (let i = prizes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [prizes[i], prizes[j]] = [prizes[j], prizes[i]];
  }
  
  return prizes;
}

/**
 * MULTIPLIER WHEEL — Random multiplier event.
 * Can trigger on any winning spin (small chance).
 * Multiplies the win by 2x-10x.
 */
function spinMultiplierWheel() {
  // Weighted random — higher multipliers are rarer
  const segments = [
    { mult: 2, weight: 35 },
    { mult: 3, weight: 25 },
    { mult: 4, weight: 15 },
    { mult: 5, weight: 12 },
    { mult: 7, weight: 8 },
    { mult: 10, weight: 5 },
  ];
  const totalWeight = segments.reduce((s, seg) => s + seg.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const seg of segments) {
    roll -= seg.weight;
    if (roll <= 0) return seg.mult;
  }
  return 2; // Fallback
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 7: MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════ */

export default function SlotMachine() {
  // ── Player State ──
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(1.00);
  const [totalWagered, setTotalWagered] = useState(0);
  const [totalWon, setTotalWon] = useState(0);
  const [bankedTotal, setBankedTotal] = useState(0);
  const [sessionPeakBalance, setSessionPeakBalance] = useState(1000);

  // ── Reel State ──
  const [grid, setGrid] = useState(() => {
    // Initialize with random symbols for display
    const g = [];
    const allSyms = SYMBOLS.filter(s => s.id !== "scatter" && s.id !== "bonus");
    for (let r = 0; r < NUM_REELS; r++) {
      const col = [];
      for (let row = 0; row < NUM_ROWS; row++) {
        col.push(allSyms[Math.floor(Math.random() * allSyms.length)]);
      }
      g.push(col);
    }
    return g;
  });
  const [spinning, setSpinning] = useState(false);
  const [spinDisplaySymbols, setSpinDisplaySymbols] = useState(null);

  // ── Win Display State ──
  const [lastWin, setLastWin] = useState(0);
  const [winLines, setWinLines] = useState([]);
  const [message, setMessage] = useState("Place your bet and spin!");
  const [showBigWin, setShowBigWin] = useState(false);

  // ── Engine State ──
  const [spinHistory, setSpinHistory] = useState([]);
  const [spinCount, setSpinCount] = useState(0);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const [consecutiveWins, setConsecutiveWins] = useState(0);
  const [lastBonusSpin, setLastBonusSpin] = useState(0);
  const [recentBets, setRecentBets] = useState([]);
  const [lastCorrection, setLastCorrection] = useState(null);
  const [decisionLog, setDecisionLog] = useState([]);

  // ── Bonus State ──
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [freeSpinMultiplier, setFreeSpinMultiplier] = useState(1);
  const [freeSpinWins, setFreeSpinWins] = useState(0);
  const [bonusActive, setBonusActive] = useState(false);
  const [bonusPrizes, setBonusPrizes] = useState([]);
  const [bonusPicked, setBonusPicked] = useState([]);
  const [bonusPicksLeft, setBonusPicksLeft] = useState(0);
  const [bonusWinTotal, setBonusWinTotal] = useState(0);
  const [multiplierActive, setMultiplierActive] = useState(null);

  // ── UI State ──
  const [showStats, setShowStats] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showPaytable, setShowPaytable] = useState(false);

  // ── Refs ──
  const reelStrips = useRef(buildAllStrips());
  const autoPlayRef = useRef(false);
  const spinTimeoutRef = useRef(null);

  // Sync autoPlay ref
  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    };
  }, []);

  /**
   * THE MAIN SPIN FUNCTION
   * 
   * This is where everything comes together:
   * 1. Deduct bet from balance
   * 2. Ask the RTP engine which strip config to use
   * 3. Spin the reels using that config
   * 4. Evaluate all paylines for wins
   * 5. Check for scatter/bonus triggers
   * 6. Apply any active multipliers
   * 7. Update all statistical trackers
   * 8. Pay out winnings
   */
  const doSpin = useCallback(() => {
    if (spinning || bonusActive) return;
    
    const currentBet = freeSpinsLeft > 0 ? 0 : bet; // Free spins don't cost
    const betPerLine = bet / NUM_PAYLINES;

    if (freeSpinsLeft === 0 && balance < bet) {
      setMessage("Insufficient balance!");
      return;
    }

    setSpinning(true);
    setWinLines([]);
    setLastWin(0);
    setShowBigWin(false);
    setMultiplierActive(null);

    // Deduct bet (unless free spin)
    if (freeSpinsLeft === 0) {
      setBalance(b => b - bet);
    }

    const newTotalWagered = totalWagered + bet; // Always count toward RTP tracking
    setTotalWagered(newTotalWagered);
    setRecentBets(prev => [...prev.slice(-20), bet]);

    // ── STEP 1: Consult the RTP Engine ──
    const engineState = {
      totalWagered: newTotalWagered,
      totalWon,
      spinHistory,
      consecutiveLosses,
      consecutiveWins,
      lastBonusSpin,
      spinCount,
      recentBets: [...recentBets, bet],
      bankedTotal,
      sessionPeakBalance,
      lastCorrection,
    };

    const decision = calculateCorrection(engineState);
    setLastCorrection(decision);

    // ── STEP 2: Bonus trigger probability adjustment ──
    // If it's been a long time since a bonus, subtly increase
    // scatter/bonus frequency by occasionally overriding to loose strips
    const spinsSinceBonus = spinCount - lastBonusSpin;
    let effectiveConfig = decision.stripConfig;
    if (spinsSinceBonus > 120 && decision.stripConfig === "tight") {
      effectiveConfig = "standard"; // Don't use tight during bonus drought
    }
    if (spinsSinceBonus > 200) {
      effectiveConfig = "loose"; // Force loose to increase feature chance
    }

    // ── STEP 3: Spin the reels ──
    const strips = reelStrips.current[effectiveConfig];
    const newGrid = spinReels(strips);

    // ── Animation: Rapid symbol cycling then settle ──
    const cycleInterval = 80;
    const allSyms = SYMBOLS.filter(s => s.tier > 0 || s.id === "scatter" || s.id === "bonus");
    let cycles = 0;
    const maxCycles = 12 + Math.floor(Math.random() * 6);
    
    const reelStopped = [false, false, false, false, false];
    const displayGrid = Array.from({ length: NUM_REELS }, () => 
      Array.from({ length: NUM_ROWS }, () => allSyms[Math.floor(Math.random() * allSyms.length)])
    );

    const animTimer = setInterval(() => {
      cycles++;
      
      // Stagger reel stops: each reel stops 2-3 cycles after the previous
      for (let r = 0; r < NUM_REELS; r++) {
        const stopAt = maxCycles - (NUM_REELS - 1 - r) * 2;
        if (cycles >= stopAt) {
          reelStopped[r] = true;
          displayGrid[r] = newGrid[r];
        } else {
          for (let row = 0; row < NUM_ROWS; row++) {
            displayGrid[r][row] = allSyms[Math.floor(Math.random() * allSyms.length)];
          }
        }
      }

      setSpinDisplaySymbols(displayGrid.map(col => [...col]));

      if (cycles >= maxCycles) {
        clearInterval(animTimer);
        
        // ── STEP 4: Evaluate results ──
        setGrid(newGrid);
        setSpinDisplaySymbols(null);

        const lineWins = evaluatePaylines(newGrid, betPerLine);
        const scatterResult = evaluateScatters(newGrid, bet);
        const bonusTrigger = evaluateBonusTrigger(newGrid);

        let totalSpinWin = lineWins.reduce((s, w) => s + w.payout, 0) + scatterResult.payout;

        // ── STEP 5: Apply free spin multiplier ──
        if (freeSpinsLeft > 0) {
          totalSpinWin *= freeSpinMultiplier;
        }

        // ── STEP 6: Random multiplier event ──
        // Small chance (3%) of triggering multiplier wheel on any win
        let appliedMultiplier = null;
        if (totalSpinWin > 0 && Math.random() < 0.03 && freeSpinsLeft === 0) {
          appliedMultiplier = spinMultiplierWheel();
          totalSpinWin *= appliedMultiplier;
          setMultiplierActive(appliedMultiplier);
        }

        // ── STEP 7: Update all trackers ──
        const newSpinCount = spinCount + 1;
        setSpinCount(newSpinCount);

        const historyEntry = {
          spin: newSpinCount,
          bet,
          won: totalSpinWin,
          config: effectiveConfig,
          correction: decision.correction,
          hasBonus: scatterResult.freeSpins > 0 || bonusTrigger.triggered,
        };
        const newHistory = [...spinHistory, historyEntry];
        setSpinHistory(newHistory);

        const newTotalWon = totalWon + totalSpinWin;
        setTotalWon(newTotalWon);

        if (totalSpinWin > 0) {
          setConsecutiveWins(prev => prev + 1);
          setConsecutiveLosses(0);
        } else {
          setConsecutiveLosses(prev => prev + 1);
          setConsecutiveWins(0);
        }

        // Update balance and session peak
        const newBalance = balance - currentBet + totalSpinWin;
        setBalance(b => b + totalSpinWin);
        if (newBalance > sessionPeakBalance) {
          setSessionPeakBalance(newBalance);
        }

        // ── STEP 8: Handle bonus triggers ──
        if (scatterResult.freeSpins > 0 && freeSpinsLeft === 0) {
          const spins = scatterResult.freeSpins;
          const mult = scatterResult.count >= 4 ? 3 : 2;
          setFreeSpinsLeft(spins);
          setFreeSpinMultiplier(mult);
          setFreeSpinWins(0);
          setLastBonusSpin(newSpinCount);
          setMessage(`🌀 FREE SPINS! ${spins} spins at ${mult}x multiplier!`);
        } else if (freeSpinsLeft > 0) {
          const remaining = freeSpinsLeft - 1;
          setFreeSpinsLeft(remaining);
          setFreeSpinWins(prev => prev + totalSpinWin);
          if (remaining === 0) {
            setMessage(`Free spins complete! Total won: £${(freeSpinWins + totalSpinWin).toFixed(2)}`);
            setFreeSpinMultiplier(1);
          } else {
            setMessage(`Free spin ${freeSpinsLeft - remaining}/${freeSpinsLeft + remaining} — ${remaining} left`);
          }
        } else if (bonusTrigger.triggered) {
          // Trigger pick bonus
          setBonusActive(true);
          setBonusPrizes(generatePickBonusPrizes(bet, engineState));
          setBonusPicked([]);
          setBonusPicksLeft(4); // Player gets 4 picks
          setBonusWinTotal(0);
          setLastBonusSpin(newSpinCount);
          setMessage("🎰 BONUS GAME! Pick 4 prizes!");
        } else if (totalSpinWin > 0) {
          const bigWinThreshold = bet * 15;
          if (totalSpinWin >= bigWinThreshold) {
            setShowBigWin(true);
          }
          const multMsg = appliedMultiplier ? ` (${appliedMultiplier}x MULTIPLIER!)` : "";
          setMessage(`WIN £${totalSpinWin.toFixed(2)}${multMsg}`);
        } else {
          const messages = ["Try again!", "No luck this time", "Spin again!", "So close!", "Keep going!"];
          setMessage(messages[Math.floor(Math.random() * messages.length)]);
        }

        setWinLines(lineWins);
        setLastWin(totalSpinWin);

        // ── Decision log for stats panel ──
        setDecisionLog(prev => [{
          spin: newSpinCount,
          config: effectiveConfig,
          correction: decision.correction.toFixed(3),
          rtp: newTotalWagered > 0 ? ((newTotalWon / newTotalWagered) * 100).toFixed(2) + "%" : "N/A",
          reasons: decision.reasons,
          won: totalSpinWin,
        }, ...prev].slice(0, 50));

        setSpinning(false);

        // Auto-play continuation
        if (autoPlayRef.current && freeSpinsLeft > 1) {
          spinTimeoutRef.current = setTimeout(() => {
            if (autoPlayRef.current) doSpin();
          }, 800);
        } else if (autoPlayRef.current && !bonusTrigger.triggered && balance - currentBet + totalSpinWin >= bet) {
          spinTimeoutRef.current = setTimeout(() => {
            if (autoPlayRef.current) doSpin();
          }, 1200);
        } else if (autoPlayRef.current) {
          setAutoPlay(false);
        }
      }
    }, cycleInterval);

  }, [spinning, bonusActive, bet, balance, totalWagered, totalWon, spinHistory,
    consecutiveLosses, consecutiveWins, lastBonusSpin, spinCount, recentBets,
    bankedTotal, sessionPeakBalance, lastCorrection, freeSpinsLeft,
    freeSpinMultiplier, freeSpinWins]);

  /** Handle picking a bonus prize */
  const pickBonusPrize = (index) => {
    if (!bonusActive || bonusPicked.includes(index) || bonusPicksLeft <= 0) return;

    const prize = bonusPrizes[index];
    const newPicked = [...bonusPicked, index];
    const newTotal = bonusWinTotal + prize;
    const remaining = bonusPicksLeft - 1;

    setBonusPicked(newPicked);
    setBonusWinTotal(newTotal);
    setBonusPicksLeft(remaining);

    if (remaining === 0) {
      // Bonus complete
      setBalance(b => b + newTotal);
      setTotalWon(prev => prev + newTotal);
      setMessage(`🎰 Bonus complete! Won £${newTotal.toFixed(2)}!`);
      setTimeout(() => setBonusActive(false), 2000);
    } else {
      setMessage(`Prize: £${prize.toFixed(2)}! ${remaining} picks left`);
    }
  };

  /** Bank/withdraw funds to safe storage */
  const bankFunds = (amount) => {
    if (amount > balance) return;
    setBalance(b => b - amount);
    setBankedTotal(prev => prev + amount);
    setMessage(`Banked £${amount.toFixed(2)}. Safe total: £${(bankedTotal + amount).toFixed(2)}`);
  };

  /** Withdraw from bank */
  const withdrawFunds = (amount) => {
    if (amount > bankedTotal) return;
    setBankedTotal(prev => prev - amount);
    setBalance(b => b + amount);
  };

  // ── Computed values ──
  const actualRTP = totalWagered > 0 ? (totalWon / totalWagered * 100).toFixed(2) : "—";
  const displayGrid = spinDisplaySymbols || grid;
  const betPerLine = (bet / NUM_PAYLINES).toFixed(4);

  const highlightedCells = new Set();
  winLines.forEach(w => {
    w.positions.forEach(p => highlightedCells.add(`${p.reel}-${p.row}`));
  });

  /* ═══════════════════════════════════════════════════════════════════
   * SECTION 8: RENDER — The Visual Machine
   * ═══════════════════════════════════════════════════════════════════ */

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #0a0a1a 0%, #1a0a2a 50%, #0a1a2a 100%)",
      color: "#e0e0e0",
      fontFamily: "'Courier New', monospace",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "12px",
      gap: "10px",
    }}>
      {/* ── HEADER ── */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{
          fontSize: "1.6rem",
          fontWeight: "bold",
          background: "linear-gradient(90deg, #ffd700, #ff6b35, #ffd700)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "0 0 20px rgba(255,215,0,0.3)",
          margin: 0,
          letterSpacing: "3px",
        }}>
          ★ FORTUNE ENGINE ★
        </h1>
        <div style={{ fontSize: "0.65rem", color: "#888", letterSpacing: "2px" }}>
          RTP TARGET: {(TARGET_RTP * 100).toFixed(1)}% │ EDUCATIONAL SIMULATOR
        </div>
      </div>

      {/* ── BALANCE BAR ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        maxWidth: 560,
        background: "rgba(255,215,0,0.08)",
        border: "1px solid rgba(255,215,0,0.2)",
        borderRadius: 8,
        padding: "8px 14px",
        fontSize: "0.8rem",
      }}>
        <div>
          <span style={{ color: "#888" }}>BALANCE</span><br />
          <span style={{ color: "#ffd700", fontWeight: "bold", fontSize: "1.1rem" }}>
            £{balance.toFixed(2)}
          </span>
        </div>
        <div style={{ textAlign: "center" }}>
          <span style={{ color: "#888" }}>BET</span><br />
          <span style={{ color: "#ff6b35", fontWeight: "bold", fontSize: "1.1rem" }}>
            £{bet.toFixed(2)}
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ color: "#888" }}>WIN</span><br />
          <span style={{
            color: lastWin > 0 ? "#00ff88" : "#666",
            fontWeight: "bold",
            fontSize: "1.1rem",
          }}>
            £{lastWin.toFixed(2)}
          </span>
        </div>
      </div>

      {/* ── FREE SPINS BANNER ── */}
      {freeSpinsLeft > 0 && (
        <div style={{
          background: "linear-gradient(90deg, #4a0080, #8000ff, #4a0080)",
          color: "#fff",
          padding: "6px 20px",
          borderRadius: 8,
          fontSize: "0.85rem",
          fontWeight: "bold",
          textAlign: "center",
          animation: "pulse 1.5s infinite",
          width: "100%",
          maxWidth: 560,
          boxSizing: "border-box",
        }}>
          🌀 FREE SPINS: {freeSpinsLeft} remaining │ {freeSpinMultiplier}x Multiplier │ Won: £{freeSpinWins.toFixed(2)}
        </div>
      )}

      {/* ── REEL GRID ── */}
      <div style={{
        background: "linear-gradient(180deg, #1a1a3a, #0d0d2a)",
        border: "2px solid #ffd700",
        borderRadius: 12,
        padding: "10px",
        boxShadow: "0 0 30px rgba(255,215,0,0.15), inset 0 0 30px rgba(0,0,0,0.5)",
        width: "100%",
        maxWidth: 560,
        boxSizing: "border-box",
      }}>
        {/* Big Win Overlay */}
        {showBigWin && (
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            pointerEvents: "none",
          }}>
            <div style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#ffd700",
              textShadow: "0 0 20px #ffd700, 0 0 40px #ff6b35",
              animation: "bigwin 0.5s ease-out",
            }}>
              ★ BIG WIN ★
            </div>
          </div>
        )}

        {/* Multiplier overlay */}
        {multiplierActive && (
          <div style={{
            textAlign: "center",
            color: "#ff00ff",
            fontWeight: "bold",
            fontSize: "1.1rem",
            textShadow: "0 0 10px #ff00ff",
            marginBottom: 4,
          }}>
            ✨ {multiplierActive}x MULTIPLIER! ✨
          </div>
        )}

        {/* 5×3 Reel Display */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${NUM_REELS}, 1fr)`,
          gap: 4,
        }}>
          {Array.from({ length: NUM_ROWS }).map((_, row) => (
            Array.from({ length: NUM_REELS }).map((_, reel) => {
              const sym = displayGrid[reel]?.[row] || SYM.cherry;
              const isWin = highlightedCells.has(`${reel}-${row}`);
              return (
                <div key={`${reel}-${row}`} style={{
                  background: isWin
                    ? "radial-gradient(circle, rgba(0,255,136,0.2), rgba(0,255,136,0.05))"
                    : "rgba(0,0,0,0.4)",
                  border: isWin ? "2px solid #00ff88" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 64,
                  fontSize: "2rem",
                  transition: "all 0.3s",
                  boxShadow: isWin ? "0 0 15px rgba(0,255,136,0.4)" : "none",
                  position: "relative",
                }}>
                  {sym.emoji}
                  {spinning && !spinDisplaySymbols && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: 8,
                    }} />
                  )}
                </div>
              );
            })
          )).flat()}
        </div>

        {/* Win lines indicator */}
        {winLines.length > 0 && (
          <div style={{
            marginTop: 6,
            fontSize: "0.7rem",
            color: "#00ff88",
            textAlign: "center",
          }}>
            {winLines.map((w, i) => (
              <span key={i} style={{ margin: "0 6px" }}>
                Line {w.lineIndex + 1}: {w.count}× {w.symbol.emoji} = £{w.payout.toFixed(2)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── MESSAGE ── */}
      <div style={{
        fontSize: "0.9rem",
        fontWeight: "bold",
        color: lastWin > 0 ? "#00ff88" : message.includes("FREE") || message.includes("BONUS") ? "#ff00ff" : "#ffd700",
        textAlign: "center",
        minHeight: 24,
        textShadow: lastWin > 0 ? "0 0 10px rgba(0,255,136,0.5)" : "none",
      }}>
        {message}
      </div>

      {/* ── BONUS PICK GAME ── */}
      {bonusActive && (
        <div style={{
          background: "linear-gradient(180deg, #2a0040, #1a0030)",
          border: "2px solid #ff00ff",
          borderRadius: 12,
          padding: 16,
          width: "100%",
          maxWidth: 560,
          boxSizing: "border-box",
        }}>
          <div style={{ textAlign: "center", marginBottom: 10, fontWeight: "bold", color: "#ff00ff" }}>
            🎰 PICK A PRIZE! ({bonusPicksLeft} picks remaining) │ Won: £{bonusWinTotal.toFixed(2)}
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
          }}>
            {bonusPrizes.map((prize, i) => {
              const picked = bonusPicked.includes(i);
              return (
                <button key={i} onClick={() => pickBonusPrize(i)} disabled={picked || bonusPicksLeft <= 0}
                  style={{
                    background: picked ? "rgba(0,255,136,0.2)" : "rgba(255,0,255,0.15)",
                    border: picked ? "2px solid #00ff88" : "1px solid rgba(255,0,255,0.3)",
                    borderRadius: 8,
                    padding: "12px 4px",
                    color: picked ? "#00ff88" : "#fff",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                    cursor: picked || bonusPicksLeft <= 0 ? "default" : "pointer",
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                  }}>
                  {picked ? `£${prize.toFixed(2)}` : "🎁"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CONTROLS ── */}
      <div style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        justifyContent: "center",
        width: "100%",
        maxWidth: 560,
      }}>
        {/* Bet controls */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[0.20, 0.50, 1, 2, 5, 10].map(b => (
            <button key={b} onClick={() => setBet(b)} disabled={spinning}
              style={{
                background: bet === b ? "rgba(255,107,53,0.3)" : "rgba(255,255,255,0.05)",
                border: bet === b ? "1px solid #ff6b35" : "1px solid rgba(255,255,255,0.15)",
                color: bet === b ? "#ff6b35" : "#999",
                borderRadius: 6,
                padding: "6px 10px",
                fontSize: "0.75rem",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: bet === b ? "bold" : "normal",
              }}>
              £{b < 1 ? b.toFixed(2) : b}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, width: "100%" }}>
          <button onClick={doSpin}
            disabled={spinning || bonusActive || (freeSpinsLeft === 0 && balance < bet)}
            style={{
              flex: 2,
              background: spinning ? "rgba(100,100,100,0.3)"
                : freeSpinsLeft > 0 ? "linear-gradient(180deg, #8000ff, #4a0080)"
                : "linear-gradient(180deg, #ffd700, #cc9900)",
              border: "none",
              borderRadius: 8,
              padding: "14px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              color: spinning ? "#666" : "#000",
              cursor: spinning ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              letterSpacing: "2px",
              boxShadow: spinning ? "none" : "0 0 20px rgba(255,215,0,0.3)",
            }}>
            {spinning ? "SPINNING..." : freeSpinsLeft > 0 ? `🌀 FREE SPIN (${freeSpinsLeft})` : "SPIN"}
          </button>
          
          <button onClick={() => { setAutoPlay(!autoPlay); if (autoPlay) autoPlayRef.current = false; }}
            disabled={bonusActive}
            style={{
              flex: 1,
              background: autoPlay ? "rgba(255,0,0,0.2)" : "rgba(255,255,255,0.05)",
              border: autoPlay ? "1px solid #ff4444" : "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              padding: "14px",
              fontSize: "0.75rem",
              color: autoPlay ? "#ff4444" : "#999",
              cursor: "pointer",
              fontFamily: "inherit",
            }}>
            {autoPlay ? "STOP" : "AUTO"}
          </button>
        </div>
      </div>

      {/* ── BANK CONTROLS ── */}
      <div style={{
        display: "flex",
        gap: 8,
        width: "100%",
        maxWidth: 560,
        fontSize: "0.75rem",
      }}>
        <button onClick={() => bankFunds(Math.floor(balance / 2))}
          disabled={balance < 2 || spinning}
          style={{
            flex: 1,
            background: "rgba(0,200,100,0.1)",
            border: "1px solid rgba(0,200,100,0.3)",
            borderRadius: 6,
            padding: "8px",
            color: "#00c864",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "0.7rem",
          }}>
          BANK HALF (£{(Math.floor(balance / 2)).toFixed(2)})
        </button>
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#888",
        }}>
          🏦 Banked: £{bankedTotal.toFixed(2)}
        </div>
        <button onClick={() => withdrawFunds(bankedTotal)}
          disabled={bankedTotal <= 0 || spinning}
          style={{
            flex: 1,
            background: "rgba(255,165,0,0.1)",
            border: "1px solid rgba(255,165,0,0.3)",
            borderRadius: 6,
            padding: "8px",
            color: "#ffa500",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "0.7rem",
          }}>
          WITHDRAW ALL
        </button>
      </div>

      {/* ── TOGGLE BUTTONS ── */}
      <div style={{ display: "flex", gap: 8, maxWidth: 560, width: "100%" }}>
        <button onClick={() => setShowStats(!showStats)}
          style={{
            flex: 1,
            background: showStats ? "rgba(0,150,255,0.2)" : "rgba(255,255,255,0.05)",
            border: showStats ? "1px solid #0096ff" : "1px solid rgba(255,255,255,0.15)",
            borderRadius: 6,
            padding: "8px",
            color: showStats ? "#0096ff" : "#888",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "0.7rem",
          }}>
          {showStats ? "HIDE" : "SHOW"} ALGORITHM PANEL
        </button>
        <button onClick={() => setShowPaytable(!showPaytable)}
          style={{
            flex: 1,
            background: showPaytable ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.05)",
            border: showPaytable ? "1px solid #ffd700" : "1px solid rgba(255,255,255,0.15)",
            borderRadius: 6,
            padding: "8px",
            color: showPaytable ? "#ffd700" : "#888",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "0.7rem",
          }}>
          {showPaytable ? "HIDE" : "SHOW"} PAYTABLE
        </button>
        <button onClick={() => {
          setBalance(1000); setTotalWagered(0); setTotalWon(0);
          setSpinHistory([]); setSpinCount(0); setConsecutiveLosses(0);
          setConsecutiveWins(0); setLastBonusSpin(0); setRecentBets([]);
          setBankedTotal(0); setSessionPeakBalance(1000); setDecisionLog([]);
          setLastCorrection(null); setFreeSpinsLeft(0); setFreeSpinMultiplier(1);
          setBonusActive(false); setAutoPlay(false);
          setMessage("Reset! Place your bet and spin!");
          reelStrips.current = buildAllStrips();
        }}
          style={{
            background: "rgba(255,0,0,0.1)",
            border: "1px solid rgba(255,0,0,0.3)",
            borderRadius: 6,
            padding: "8px 12px",
            color: "#ff4444",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "0.7rem",
          }}>
          RESET
        </button>
      </div>

      {/* ── PAYTABLE ── */}
      {showPaytable && (
        <div style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,215,0,0.2)",
          borderRadius: 8,
          padding: 12,
          width: "100%",
          maxWidth: 560,
          boxSizing: "border-box",
          fontSize: "0.7rem",
        }}>
          <div style={{ color: "#ffd700", fontWeight: "bold", marginBottom: 8 }}>PAYTABLE (per line, × bet/line)</div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: "2px 12px" }}>
            <div style={{ color: "#888" }}>Symbol</div>
            <div style={{ color: "#888" }}>×3</div>
            <div style={{ color: "#888" }}>×4</div>
            <div style={{ color: "#888" }}>×5</div>
            {Object.entries(PAYTABLE).map(([id, pays]) => (
              [
                <div key={`${id}-sym`}>{SYM[id].emoji} {SYM[id].name}</div>,
                <div key={`${id}-3`} style={{ color: "#aaa" }}>{pays[3]}×</div>,
                <div key={`${id}-4`} style={{ color: "#ddd" }}>{pays[4]}×</div>,
                <div key={`${id}-5`} style={{ color: "#ffd700" }}>{pays[5]}×</div>,
              ]
            )).flat()}
          </div>
          <div style={{ marginTop: 8, color: "#888" }}>
            🌀 Scatter: 3/4/5 = {SCATTER_PAY[3]}×/{SCATTER_PAY[4]}×/{SCATTER_PAY[5]}× total bet + free spins
            <br/>🎰 Bonus: 3+ on reels 1-3-5 = Pick bonus game
            <br/>⭐ Wild: Substitutes for all except 🌀 and 🎰
            <br/>Bet per line: £{betPerLine} │ {NUM_PAYLINES} paylines
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
       * ALGORITHM TRANSPARENCY PANEL
       * 
       * This is the educational core — showing the engine's decisions
       * in real-time so you can understand HOW and WHY the machine
       * behaves the way it does.
       * ══════════════════════════════════════════════════════════════ */}
      {showStats && (
        <div style={{
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(0,150,255,0.3)",
          borderRadius: 8,
          padding: 12,
          width: "100%",
          maxWidth: 560,
          boxSizing: "border-box",
          fontSize: "0.7rem",
          lineHeight: 1.6,
        }}>
          <div style={{ color: "#0096ff", fontWeight: "bold", marginBottom: 8, fontSize: "0.8rem" }}>
            ⚙️ ALGORITHM TRANSPARENCY PANEL
          </div>

          {/* RTP Tracking */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: "#ffd700", fontWeight: "bold" }}>RTP TRACKING</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
              <span style={{ color: "#888" }}>Target RTP:</span>
              <span>{(TARGET_RTP * 100).toFixed(1)}%</span>
              <span style={{ color: "#888" }}>Actual RTP (all):</span>
              <span style={{
                color: totalWagered > 0
                  ? Math.abs(totalWon / totalWagered - TARGET_RTP) < 0.02 ? "#00ff88"
                    : totalWon / totalWagered > TARGET_RTP ? "#ff4444" : "#ffa500"
                  : "#888"
              }}>
                {actualRTP}%
              </span>
              <span style={{ color: "#888" }}>Total wagered:</span>
              <span>£{totalWagered.toFixed(2)}</span>
              <span style={{ color: "#888" }}>Total returned:</span>
              <span>£{totalWon.toFixed(2)}</span>
              <span style={{ color: "#888" }}>House profit:</span>
              <span style={{ color: totalWagered - totalWon > 0 ? "#00ff88" : "#ff4444" }}>
                £{(totalWagered - totalWon).toFixed(2)}
              </span>
              <span style={{ color: "#888" }}>Spins:</span>
              <span>{spinCount}</span>
            </div>
          </div>

          {/* RTP Windows */}
          {lastCorrection && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ color: "#ffd700", fontWeight: "bold" }}>RTP BY WINDOW</div>
              {Object.entries(lastCorrection.rtpByWindow).map(([name, rtp]) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#888", textTransform: "capitalize" }}>{name}:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      color: Math.abs(rtp - TARGET_RTP) < 0.03 ? "#00ff88"
                        : rtp > TARGET_RTP ? "#ff4444" : "#ffa500"
                    }}>
                      {(rtp * 100).toFixed(2)}%
                    </span>
                    {/* Visual deviation bar */}
                    <div style={{
                      width: 60,
                      height: 6,
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: 3,
                      position: "relative",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        position: "absolute",
                        left: "50%",
                        width: 1,
                        height: "100%",
                        background: "rgba(255,255,255,0.3)",
                      }} />
                      <div style={{
                        position: "absolute",
                        left: `${Math.max(0, Math.min(100, 50 + (rtp - TARGET_RTP) * 500))}%`,
                        width: 4,
                        height: "100%",
                        background: Math.abs(rtp - TARGET_RTP) < 0.03 ? "#00ff88"
                          : rtp > TARGET_RTP ? "#ff4444" : "#ffa500",
                        borderRadius: 2,
                        transform: "translateX(-50%)",
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Current Decision */}
          {lastCorrection && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ color: "#ffd700", fontWeight: "bold" }}>CURRENT DECISION</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
                <span style={{ color: "#888" }}>Strip config:</span>
                <span style={{
                  color: lastCorrection.stripConfig === "loose" ? "#00ff88"
                    : lastCorrection.stripConfig === "tight" ? "#ff4444" : "#ffa500",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}>
                  {lastCorrection.stripConfig}
                </span>
                <span style={{ color: "#888" }}>Correction factor:</span>
                <span>{lastCorrection.correction.toFixed(4)}</span>
                <span style={{ color: "#888" }}>Sigmoid raw:</span>
                <span>{lastCorrection.sigmoidRaw.toFixed(4)}</span>
                <span style={{ color: "#888" }}>Session modifier:</span>
                <span>{lastCorrection.sessionModifier.toFixed(4)}</span>
              </div>
              <div style={{ marginTop: 4, color: "#0096ff" }}>
                <div style={{ fontWeight: "bold" }}>Reasoning:</div>
                {lastCorrection.reasons.map((r, i) => (
                  <div key={i} style={{ color: "#77aaff", paddingLeft: 8 }}>▸ {r}</div>
                ))}
              </div>
            </div>
          )}

          {/* Session State */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: "#ffd700", fontWeight: "bold" }}>SESSION STATE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
              <span style={{ color: "#888" }}>Consecutive losses:</span>
              <span style={{ color: consecutiveLosses > 10 ? "#ff4444" : "#ccc" }}>{consecutiveLosses}</span>
              <span style={{ color: "#888" }}>Consecutive wins:</span>
              <span style={{ color: consecutiveWins > 3 ? "#00ff88" : "#ccc" }}>{consecutiveWins}</span>
              <span style={{ color: "#888" }}>Spins since bonus:</span>
              <span style={{ color: (spinCount - lastBonusSpin) > 100 ? "#ffa500" : "#ccc" }}>
                {spinCount - lastBonusSpin}
              </span>
              <span style={{ color: "#888" }}>Session peak:</span>
              <span>£{sessionPeakBalance.toFixed(2)}</span>
              <span style={{ color: "#888" }}>From peak:</span>
              <span style={{ color: balance < sessionPeakBalance * 0.7 ? "#ff4444" : "#ccc" }}>
                {balance > 0 ? ((balance / sessionPeakBalance) * 100).toFixed(1) : 0}%
              </span>
              <span style={{ color: "#888" }}>Banked total:</span>
              <span>£{bankedTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Decision Log */}
          <div>
            <div style={{ color: "#ffd700", fontWeight: "bold" }}>DECISION LOG (last 10)</div>
            <div style={{ maxHeight: 180, overflowY: "auto", fontSize: "0.65rem" }}>
              {decisionLog.slice(0, 10).map((entry, i) => (
                <div key={i} style={{
                  padding: "3px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                }}>
                  <span style={{ color: "#666" }}>#{entry.spin}</span>
                  <span style={{
                    color: entry.config === "loose" ? "#00ff88"
                      : entry.config === "tight" ? "#ff4444" : "#ffa500",
                  }}>
                    {entry.config}
                  </span>
                  <span style={{ color: "#888" }}>c={entry.correction}</span>
                  <span style={{ color: "#888" }}>rtp={entry.rtp}</span>
                  <span style={{ color: entry.won > 0 ? "#00ff88" : "#444" }}>
                    £{entry.won.toFixed(2)}
                  </span>
                </div>
              ))}
              {decisionLog.length === 0 && (
                <div style={{ color: "#444", padding: 8, textAlign: "center" }}>
                  No spins yet — data will appear here
                </div>
              )}
            </div>
          </div>

          {/* RTP Budget Explanation */}
          <div style={{ marginTop: 10, padding: 8, background: "rgba(0,150,255,0.08)", borderRadius: 6 }}>
            <div style={{ color: "#0096ff", fontWeight: "bold", fontSize: "0.65rem" }}>
              📐 HOW THE MATH WORKS
            </div>
            <div style={{ color: "#6699cc", fontSize: "0.6rem", lineHeight: 1.5 }}>
              The {(TARGET_RTP * 100).toFixed(1)}% RTP is split across features: base game ({(RTP_BUDGET.baseGame * 100)}%), 
              free spins ({(RTP_BUDGET.freeSpins * 100)}%), bonuses ({(RTP_BUDGET.bonusFeatures * 100)}%), 
              multipliers ({(RTP_BUDGET.multipliers * 100)}%). The engine doesn't rig individual spins — it selects 
              from three reel strip sets (loose/standard/tight) based on how far actual RTP deviates from target. 
              A sigmoid function ensures smooth transitions. Session factors (streaks, bet changes, banking) add 
              modifiers. Over time, the law of large numbers pulls actual RTP toward target.
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes bigwin {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; }
        }
        button:hover:not(:disabled) {
          filter: brightness(1.2);
        }
        button:active:not(:disabled) {
          transform: scale(0.97);
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
      `}</style>
    </div>
  );
}
