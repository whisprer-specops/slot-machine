/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║              FORTUNE ENGINE v3 — FULL FEATURE SET                   ║
 * ║                                                                      ║
 * ║  NEW IN v3:                                                          ║
 * ║                                                                      ║
 * ║  VOLATILITY PROFILES (Low / Medium / High)                          ║
 * ║  Volatility is the "personality" of a slot machine. It determines    ║
 * ║  HOW the RTP budget is distributed across wins:                     ║
 * ║  • Low vol: Frequent small wins. Paytable is compressed (top prize  ║
 * ║    ~200x, bottom ~3x). Strips loaded with mid-tier symbols.         ║
 * ║    Feels like a steady drip of small returns. Session variance is    ║
 * ║    low — your balance stays relatively stable.                       ║
 * ║  • High vol: Rare massive wins. Paytable is expanded (top prize     ║
 * ║    ~2500x, bottom ~8x). Strips dominated by low-tier symbols with   ║
 * ║    very few high-value stops. Long droughts punctuated by huge       ║
 * ║    payouts. Session variance is extreme.                             ║
 * ║  SAME RTP across all profiles. The machine returns the same %       ║
 * ║  long-term — only the distribution shape changes.                    ║
 * ║                                                                      ║
 * ║  CASCADING / AVALANCHE REELS                                        ║
 * ║  When symbols form a winning combination:                            ║
 * ║  1. Winning symbols EXPLODE and are removed from the grid           ║
 * ║  2. Remaining symbols DROP DOWN to fill the gaps (gravity)          ║
 * ║  3. New random symbols FALL IN from the top to fill empty spaces    ║
 * ║  4. The grid is re-evaluated for new wins                           ║
 * ║  5. If new wins form → repeat from step 1                           ║
 * ║  6. Each consecutive cascade INCREASES a progressive multiplier:    ║
 * ║     1x → 2x → 3x → 5x → 8x → 12x                                 ║
 * ║  This creates chain-reaction excitement and is how modern games     ║
 * ║  like Gonzo's Quest, Sweet Bonanza, and Reactoonz work.             ║
 * ║  The cascade multiplier is where a huge chunk of RTP budget lives.  ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { useState, useRef, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 1: SYMBOL SYSTEM
 * ═══════════════════════════════════════════════════════════════════ */

const SYMBOLS = [
  { id: "cherry",  emoji: "🍒", tier: 1, name: "Cherry" },
  { id: "lemon",   emoji: "🍋", tier: 1, name: "Lemon" },
  { id: "orange",  emoji: "🍊", tier: 2, name: "Orange" },
  { id: "grape",   emoji: "🍇", tier: 2, name: "Grape" },
  { id: "bell",    emoji: "🔔", tier: 3, name: "Bell" },
  { id: "diamond", emoji: "💎", tier: 4, name: "Diamond" },
  { id: "seven",   emoji: "7️⃣",  tier: 5, name: "Seven" },
  { id: "wild",    emoji: "⭐", tier: 6, name: "Wild" },
  { id: "scatter", emoji: "🌀", tier: 0, name: "Scatter" },
  { id: "bonus",   emoji: "🎰", tier: 0, name: "Bonus" },
];
const SYM = Object.fromEntries(SYMBOLS.map(s => [s.id, s]));

const NUM_PAYLINES = 20;
const NUM_REELS = 5;
const NUM_ROWS = 3;
const TARGET_RTP = 0.965;

const PAYLINES = [
  [1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],
  [0,0,1,0,0],[2,2,1,2,2],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0],
  [2,1,1,1,2],[1,0,1,0,1],[1,2,1,2,1],[0,1,0,1,0],[2,1,2,1,2],
  [1,1,0,1,1],[1,1,2,1,1],[0,0,1,2,2],[2,2,1,0,0],[0,2,0,2,0],
];

const SCATTER_PAY = { 3: 5, 4: 20, 5: 50 };
const FREE_SPINS_AWARD = { 3: 10, 4: 15, 5: 25 };

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 2: VOLATILITY PROFILES
 *
 * Each profile defines THREE things that work together:
 *
 * 1. PAYTABLE — The multiplier for each symbol/count combination.
 *    Low vol compresses these (small range), high vol expands them.
 *
 * 2. REEL STRIPS — Symbol frequency on each reel.
 *    Low vol = more mid-tier symbols (frequent matches).
 *    High vol = dominated by low-tier, very few high-tier (rare hits).
 *
 * 3. FEATURES — How bonuses, multipliers, and cascades behave.
 *    Low vol = smaller but more frequent bonuses.
 *    High vol = rare but explosive bonus rounds.
 *
 * THE SAME RTP TARGET is maintained across all profiles. What changes
 * is the SHAPE of the payout distribution:
 *
 *   Low vol:   ████████████████░░░░ (many small bars)
 *   Med vol:   ██████░░░░░░█████░░░ (mix of small and medium)
 *   High vol:  ██░░░░░░░░░░░░██████████████ (few enormous bars)
 *
 * Mathematically, this is controlled by the coefficient of variation
 * (standard deviation / mean) of the per-spin return distribution.
 * ═══════════════════════════════════════════════════════════════════ */

const VOLATILITY_PROFILES = {
  low: {
    name: "Low",
    label: "STEADY DRIP",
    color: "#00cc66",
    description: "Frequent small wins, stable balance, compressed paytable",

    /**
     * LOW VOLATILITY PAYTABLE
     * Notice: The spread between lowest (3x) and highest (200x) is narrow.
     * Top prize is only 40× the bottom prize. This means even "big" wins
     * feel moderate, but they happen much more often.
     */
    paytable: {
      cherry:  { 3: 3,   4: 8,   5: 20 },
      lemon:   { 3: 3,   4: 8,   5: 20 },
      orange:  { 3: 5,   4: 15,  5: 40 },
      grape:   { 3: 5,   4: 15,  5: 40 },
      bell:    { 3: 12,  4: 35,  5: 80 },
      diamond: { 3: 20,  4: 60,  5: 150 },
      seven:   { 3: 30,  4: 90,  5: 200 },
      wild:    { 3: 30,  4: 90,  5: 200 },
    },

    /**
     * LOW VOL REEL STRIPS
     * More mid-tier symbols (bell, grape, orange) on the strips means
     * matching combinations form more frequently. Wilds are also more
     * common, creating more "assisted" wins.
     *
     * The loose/standard/tight configs still exist for RTP correction,
     * but the baseline frequencies are shifted toward mid-range.
     */
    reelConfigs: {
      loose:    { cherry: 9, lemon: 9, orange: 10, grape: 10, bell: 9, diamond: 6, seven: 4, wild: 4, scatter: 2, bonus: 1 },
      standard: { cherry: 10, lemon: 10, orange: 11, grape: 11, bell: 8, diamond: 5, seven: 3, wild: 3, scatter: 1, bonus: 1 },
      tight:    { cherry: 12, lemon: 12, orange: 11, grape: 11, bell: 7, diamond: 4, seven: 2, wild: 2, scatter: 1, bonus: 0 },
    },

    /** Cascade multiplier progression — conservative for low vol */
    cascadeMultipliers: [1, 1.5, 2, 3, 4, 5],
    /** Multiplier wheel chance on win — higher for low vol (more frequent small boosts) */
    multiplierChance: 0.05,
    /** Random multiplier segments — lower multipliers for low vol */
    multiplierSegments: [
      { mult: 2, weight: 50 }, { mult: 3, weight: 30 },
      { mult: 4, weight: 15 }, { mult: 5, weight: 5 },
    ],
  },

  medium: {
    name: "Medium",
    label: "BALANCED",
    color: "#ffa500",
    description: "Balanced wins, moderate swings, standard paytable",

    paytable: {
      cherry:  { 3: 5,   4: 15,  5: 40 },
      lemon:   { 3: 5,   4: 15,  5: 40 },
      orange:  { 3: 10,  4: 30,  5: 75 },
      grape:   { 3: 10,  4: 30,  5: 75 },
      bell:    { 3: 25,  4: 75,  5: 200 },
      diamond: { 3: 50,  4: 150, 5: 500 },
      seven:   { 3: 100, 4: 300, 5: 1000 },
      wild:    { 3: 100, 4: 300, 5: 1000 },
    },

    reelConfigs: {
      loose:    { cherry: 12, lemon: 11, orange: 9, grape: 9, bell: 7, diamond: 5, seven: 4, wild: 4, scatter: 2, bonus: 1 },
      standard: { cherry: 14, lemon: 13, orange: 10, grape: 10, bell: 6, diamond: 4, seven: 3, wild: 2, scatter: 1, bonus: 1 },
      tight:    { cherry: 16, lemon: 15, orange: 11, grape: 10, bell: 5, diamond: 3, seven: 2, wild: 1, scatter: 1, bonus: 0 },
    },

    cascadeMultipliers: [1, 2, 3, 5, 8, 12],
    multiplierChance: 0.03,
    multiplierSegments: [
      { mult: 2, weight: 35 }, { mult: 3, weight: 25 },
      { mult: 5, weight: 15 }, { mult: 7, weight: 10 },
      { mult: 10, weight: 5 },
    ],
  },

  high: {
    name: "High",
    label: "JACKPOT HUNTER",
    color: "#ff4444",
    description: "Rare massive wins, deep droughts, expanded paytable",

    /**
     * HIGH VOLATILITY PAYTABLE
     * The spread is enormous: bottom prize 8x, top prize 2500x.
     * Top is 312× the bottom prize. This creates the "lottery ticket"
     * feeling — most spins return nothing, but one hit changes everything.
     *
     * The psychology: players remember the 2500x hit and forget the
     * 200 dead spins before it. This "peak-end" memory bias is
     * why high-vol games are the most popular in casinos.
     */
    paytable: {
      cherry:  { 3: 8,   4: 25,  5: 60 },
      lemon:   { 3: 8,   4: 25,  5: 60 },
      orange:  { 3: 15,  4: 50,  5: 120 },
      grape:   { 3: 15,  4: 50,  5: 120 },
      bell:    { 3: 40,  4: 125, 5: 400 },
      diamond: { 3: 80,  4: 300, 5: 1000 },
      seven:   { 3: 200, 4: 750, 5: 2500 },
      wild:    { 3: 200, 4: 750, 5: 2500 },
    },

    /**
     * HIGH VOL REEL STRIPS
     * Dominated by low-tier symbols. High-value symbols are EXTREMELY rare.
     * Standard config: only 2 sevens and 1 wild per reel out of ~66 stops.
     * That's ~1.5% chance of seeing a seven on any position, and matching
     * 3 across a payline is roughly 1 in ~290,000 combinations.
     */
    reelConfigs: {
      loose:    { cherry: 15, lemon: 14, orange: 8, grape: 8, bell: 6, diamond: 4, seven: 3, wild: 3, scatter: 2, bonus: 1 },
      standard: { cherry: 18, lemon: 17, orange: 9, grape: 9, bell: 4, diamond: 3, seven: 2, wild: 1, scatter: 1, bonus: 1 },
      tight:    { cherry: 20, lemon: 19, orange: 10, grape: 9, bell: 3, diamond: 2, seven: 1, wild: 0, scatter: 1, bonus: 0 },
    },

    /** Aggressive cascade multipliers — the dream of high vol */
    cascadeMultipliers: [1, 2, 4, 8, 15, 25],
    multiplierChance: 0.02,
    multiplierSegments: [
      { mult: 2, weight: 25 }, { mult: 3, weight: 20 },
      { mult: 5, weight: 20 }, { mult: 10, weight: 15 },
      { mult: 15, weight: 10 }, { mult: 25, weight: 5 },
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 3: REEL STRIP BUILDER
 * ═══════════════════════════════════════════════════════════════════ */

function buildReelStrip(weights) {
  const strip = [];
  for (const [symId, count] of Object.entries(weights)) {
    for (let i = 0; i < count; i++) strip.push(SYM[symId]);
  }
  for (let i = strip.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [strip[i], strip[j]] = [strip[j], strip[i]];
  }
  return strip;
}

function buildAllStrips(reelConfigs) {
  const strips = {};
  for (const [config, weights] of Object.entries(reelConfigs)) {
    strips[config] = [];
    for (let r = 0; r < NUM_REELS; r++) strips[config].push(buildReelStrip(weights));
  }
  return strips;
}

function spinReels(strips) {
  const grid = [];
  for (let r = 0; r < NUM_REELS; r++) {
    const strip = strips[r];
    const stopPos = Math.floor(Math.random() * strip.length);
    const column = [];
    for (let row = 0; row < NUM_ROWS; row++) column.push(strip[(stopPos + row) % strip.length]);
    grid.push(column);
  }
  return grid;
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 4: WIN EVALUATION
 * ═══════════════════════════════════════════════════════════════════ */

function evaluatePaylines(grid, betPerLine, paytable) {
  const wins = [];
  for (let lineIdx = 0; lineIdx < NUM_PAYLINES; lineIdx++) {
    const line = PAYLINES[lineIdx];
    const lineSymbols = line.map((row, reel) => grid[reel][row]);
    let matchSymbol = null;
    for (const sym of lineSymbols) {
      if (sym.id !== "wild" && sym.id !== "scatter" && sym.id !== "bonus") { matchSymbol = sym; break; }
    }
    if (!matchSymbol) {
      if (lineSymbols.every(s => s.id === "wild")) matchSymbol = SYM.wild;
      else continue;
    }
    let count = 0;
    for (const sym of lineSymbols) {
      if (sym.id === matchSymbol.id || sym.id === "wild") count++; else break;
    }
    if (count >= 3 && paytable[matchSymbol.id]?.[count]) {
      const multiplier = paytable[matchSymbol.id][count];
      wins.push({
        lineIndex: lineIdx, symbol: matchSymbol, count, multiplier,
        payout: multiplier * betPerLine,
        positions: line.slice(0, count).map((row, reel) => ({ reel, row })),
      });
    }
  }
  return wins;
}

function evaluateScatters(grid, totalBet) {
  let count = 0; const positions = [];
  for (let r = 0; r < NUM_REELS; r++)
    for (let row = 0; row < NUM_ROWS; row++)
      if (grid[r][row].id === "scatter") { count++; positions.push({ reel: r, row }); }
  return { count, positions, payout: count >= 3 ? (SCATTER_PAY[count] || 0) * totalBet : 0, freeSpins: count >= 3 ? FREE_SPINS_AWARD[count] || 0 : 0 };
}

function evaluateBonusTrigger(grid) {
  let count = 0; const positions = [];
  for (const r of [0, 2, 4])
    for (let row = 0; row < NUM_ROWS; row++)
      if (grid[r][row].id === "bonus") { count++; positions.push({ reel: r, row }); }
  return { triggered: count >= 3, count, positions };
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 5: CASCADING / AVALANCHE REEL ENGINE
 *
 * This is the most complex mechanical feature in modern slots.
 *
 * CONCEPT: Instead of "spin and done", winning symbols are REMOVED
 * from the grid, remaining symbols fall downward under gravity,
 * and new random symbols fill the empty spaces at the top. The grid
 * is then re-evaluated for new wins, repeating until no more wins
 * form. Each successive cascade in the chain increases a multiplier.
 *
 * WHY THIS EXISTS (from a design perspective):
 * The cascade mechanic serves two purposes:
 * 1. EXCITEMENT: Each cascade is a "free" evaluation that could win.
 *    The player watches the chain reaction unfold, each step building
 *    tension and the multiplier climbing higher.
 * 2. RTP DISTRIBUTION: A significant portion of the RTP budget is
 *    delivered through cascade chains. The base spin might return
 *    less, but cascades make up the difference. This lets designers
 *    create long "dry" base game stretches (building anticipation)
 *    while cascade chains deliver concentrated bursts of value.
 *
 * MATHEMATICAL NOTE: Cascade probability is NOT independent.
 * After removing winning symbols, the remaining grid is biased —
 * it was ALREADY close to having more wins (since overlapping
 * paylines share symbols). This means cascades are more likely
 * than a fresh spin, which is why the multiplier progression works
 * as an RTP delivery mechanism.
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * findWinningPositions() — Identify all grid cells that are part of
 * any winning payline combination.
 *
 * Returns a Set of "reel-row" keys for cells to remove.
 */
function findWinningPositions(wins) {
  const positions = new Set();
  for (const win of wins) {
    for (const pos of win.positions) {
      positions.add(`${pos.reel}-${pos.row}`);
    }
  }
  return positions;
}

/**
 * cascadeGrid() — Remove winning symbols, apply gravity, fill gaps.
 *
 * @param grid - Current 5×3 grid (array of columns)
 * @param winPositions - Set of "reel-row" keys to remove
 * @param profile - Current volatility profile (for reel strip weights)
 * @param stripConfig - Current strip config (loose/standard/tight)
 * @returns Object with new grid, removed cells, and fill details
 *
 * ALGORITHM:
 * For each reel (column):
 * 1. Remove symbols at winning positions
 * 2. Remaining symbols "fall" to the bottom (gravity)
 * 3. Empty spaces at top filled with random symbols from current strips
 */
function cascadeGrid(grid, winPositions, reelConfigs, stripConfig) {
  const newGrid = [];
  const fillDetails = []; // Track what was removed and added (for animation/logging)

  // Build a flat probability table from current strip config for new symbols
  const weights = reelConfigs[stripConfig];
  const weightEntries = Object.entries(weights);
  const totalWeight = weightEntries.reduce((s, [, w]) => s + w, 0);

  function randomSymbol() {
    let roll = Math.random() * totalWeight;
    for (const [symId, weight] of weightEntries) {
      roll -= weight;
      if (roll <= 0) return SYM[symId];
    }
    return SYM.cherry;
  }

  for (let reel = 0; reel < NUM_REELS; reel++) {
    const column = grid[reel];
    const surviving = [];
    const removed = [];

    // Step 1: Separate surviving and removed symbols
    for (let row = 0; row < NUM_ROWS; row++) {
      if (winPositions.has(`${reel}-${row}`)) {
        removed.push({ row, symbol: column[row] });
      } else {
        surviving.push(column[row]);
      }
    }

    // Step 2: Gravity — surviving symbols fall to bottom
    const newColumn = new Array(NUM_ROWS);
    const numNew = NUM_ROWS - surviving.length;

    // Fill top with new random symbols
    for (let i = 0; i < numNew; i++) {
      const newSym = randomSymbol();
      newColumn[i] = newSym;
      fillDetails.push({ reel, row: i, symbol: newSym, type: "fill" });
    }

    // Place surviving symbols below new ones
    for (let i = 0; i < surviving.length; i++) {
      newColumn[numNew + i] = surviving[i];
    }

    // Track removals
    for (const r of removed) {
      fillDetails.push({ reel, row: r.row, symbol: r.symbol, type: "remove" });
    }

    newGrid.push(newColumn);
  }

  return { grid: newGrid, fillDetails, removedCount: winPositions.size };
}

/**
 * resolveCascadeChain() — Execute the full cascade chain for a spin.
 *
 * This is the main cascade loop that:
 * 1. Evaluates the grid for wins
 * 2. If wins found → remove, drop, fill, increment multiplier
 * 3. Re-evaluate new grid
 * 4. Repeat until no wins
 *
 * Returns the complete chain with all intermediate states for
 * animation replay and the accumulated total win.
 *
 * @param initialGrid - The starting grid from the spin
 * @param betPerLine - Bet per payline
 * @param totalBet - Total bet (for scatter evaluation)
 * @param profile - Volatility profile
 * @param stripConfig - Current strip config
 * @returns Chain of cascade steps with total accumulated win
 */
function resolveCascadeChain(initialGrid, betPerLine, totalBet, profile, stripConfig) {
  const cascadeMultipliers = profile.cascadeMultipliers;
  const chain = [];
  let currentGrid = initialGrid;
  let cascadeLevel = 0; // Index into cascadeMultipliers
  let accumulatedWin = 0;

  // Maximum cascades to prevent infinite loops (shouldn't happen, but safety)
  const MAX_CASCADES = 20;

  while (cascadeLevel < MAX_CASCADES) {
    // Evaluate current grid
    const wins = evaluatePaylines(currentGrid, betPerLine, profile.paytable);

    if (wins.length === 0) break; // No more wins — chain ends

    // Calculate this cascade's payout with progressive multiplier
    const currentMultiplier = cascadeMultipliers[Math.min(cascadeLevel, cascadeMultipliers.length - 1)];
    const cascadeWin = wins.reduce((s, w) => s + w.payout, 0) * currentMultiplier;
    accumulatedWin += cascadeWin;

    // Find positions to remove
    const winPositions = findWinningPositions(wins);

    // Record this cascade step
    chain.push({
      level: cascadeLevel,
      grid: currentGrid.map(col => [...col]), // Snapshot
      wins,
      winPositions: [...winPositions],
      multiplier: currentMultiplier,
      cascadeWin,
      accumulatedWin,
    });

    // Cascade: remove winners, drop, fill
    const cascadeResult = cascadeGrid(
      currentGrid, winPositions, profile.reelConfigs, stripConfig
    );
    currentGrid = cascadeResult.grid;
    cascadeLevel++;
  }

  return {
    chain,
    finalGrid: currentGrid,
    totalCascadeWin: accumulatedWin,
    totalCascades: chain.length,
    maxMultiplierReached: chain.length > 0
      ? cascadeMultipliers[Math.min(chain.length - 1, cascadeMultipliers.length - 1)]
      : 1,
  };
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 6: NEAR-MISS ENGINE (from v2)
 * ═══════════════════════════════════════════════════════════════════ */

const NEAR_MISS_CONFIG = {
  adjacentWeights: { cherry: 2, lemon: 2, orange: 3, grape: 3, bell: 5, diamond: 10, seven: 16, wild: 12, scatter: 4, bonus: 3 },
  contextBoosts: { twoOfKindHighValue: 3.0, oneAway: 4.0, losingStreakMultiplier: 1.5, postWinDampener: 0.4 },
  maxDensity: 0.45,
  activationRate: 0.65,
};

function selectNearMissSymbol(matchSymbol, isBreakingReel, streakState, wasRecentBigWin) {
  const weights = { ...NEAR_MISS_CONFIG.adjacentWeights };
  if (isBreakingReel && matchSymbol?.tier >= 4) weights[matchSymbol.id] = (weights[matchSymbol.id] || 1) * 4.0;
  if (streakState.consecutiveLosses > 5) {
    const m = Math.min(2.0, 1 + (streakState.consecutiveLosses - 5) * 0.1);
    weights.seven *= m; weights.diamond *= m; weights.wild *= m;
  }
  if (wasRecentBigWin) for (const k of Object.keys(weights)) if (SYM[k]?.tier >= 4) weights[k] *= 0.4;
  const entries = Object.entries(weights);
  const tot = entries.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * tot;
  for (const [symId, weight] of entries) { roll -= weight; if (roll <= 0) return SYM[symId]; }
  return SYM.cherry;
}

function applyNearMissPresentation(grid, isWinningSpin, streakState, stats) {
  if (isWinningSpin && Math.random() > 0.15) { stats.activated = false; stats.reason = "Win — suppressed"; return grid; }
  if (Math.random() > NEAR_MISS_CONFIG.activationRate) { stats.activated = false; stats.reason = "Non-activation"; return grid; }
  stats.activated = true;

  const primaryPayline = grid.map(col => col[1]);
  let matchSym = null, matchCount = 0, breakReel = -1;
  for (let i = 0; i < primaryPayline.length; i++) {
    const s = primaryPayline[i];
    if (i === 0) { if (s.id !== "scatter" && s.id !== "bonus") { matchSym = s.id === "wild" ? null : s; matchCount = 1; } continue; }
    const m = s.id === "wild" || (matchSym && s.id === matchSym.id) || (!matchSym && s.id !== "scatter" && s.id !== "bonus");
    if (m) { if (!matchSym && s.id !== "wild") matchSym = s; matchCount++; } else { breakReel = i; break; }
  }

  stats.modifications = [];
  const modGrid = grid.map(col => [...col]);
  let cells = 0;
  const max = Math.floor(NUM_REELS * 2 * NEAR_MISS_CONFIG.maxDensity);
  for (let reel = 0; reel < NUM_REELS; reel++) {
    for (const row of [0, 2]) {
      if (cells >= max) break;
      const isBR = reel === breakReel;
      if (!(isBR ? Math.random() < 0.85 : Math.random() < 0.35)) continue;
      const nm = selectNearMissSymbol(matchSym ? SYM[matchSym.id] || matchSym : null, isBR, streakState, streakState.consecutiveWins > 2);
      if (nm.tier > modGrid[reel][row].tier || isBR) {
        const from = modGrid[reel][row].id;
        modGrid[reel][row] = nm;
        cells++;
        stats.modifications.push({ reel, row, from, to: nm.id });
      }
    }
  }
  stats.cellsModified = cells;
  stats.reason = `${cells} cells modified${breakReel >= 0 ? `, breaking reel ${breakReel + 1}` : ""}`;
  return modGrid;
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 7: RTP ENGINE (sigmoid correction)
 * ═══════════════════════════════════════════════════════════════════ */

function calculateCorrection(state) {
  const { totalWagered, totalWon, spinHistory, consecutiveLosses, consecutiveWins,
    lastBonusSpin, spinCount, recentBets, bankedTotal } = state;
  const windows = {
    short: spinHistory.slice(-20), medium: spinHistory.slice(-100),
    long: spinHistory.slice(-500), all: spinHistory,
  };
  const rtpByWindow = {};
  for (const [name, w] of Object.entries(windows)) {
    if (w.length === 0) { rtpByWindow[name] = TARGET_RTP; continue; }
    const wag = w.reduce((s, h) => s + h.bet, 0);
    const won = w.reduce((s, h) => s + h.won, 0);
    rtpByWindow[name] = wag > 0 ? won / wag : TARGET_RTP;
  }
  const weightedRTP = rtpByWindow.short * 0.10 + rtpByWindow.medium * 0.25 + rtpByWindow.long * 0.35 + rtpByWindow.all * 0.30;
  const deviation = weightedRTP - TARGET_RTP;
  const corrBase = (1 / (1 + Math.exp(-15 * deviation)) - 0.5) * 2;
  let sessMod = 0; const reasons = [];
  if (consecutiveLosses > 15) { sessMod -= 0.15; reasons.push(`Drought (${consecutiveLosses})`); }
  else if (consecutiveLosses > 8) { sessMod -= 0.08; reasons.push(`Losing (${consecutiveLosses})`); }
  if (consecutiveWins > 5) { sessMod += 0.12; reasons.push(`Hot (${consecutiveWins})`); }
  const ssb = spinCount - lastBonusSpin;
  if (ssb > 150) { sessMod -= 0.05; reasons.push(`Bonus drought (${ssb})`); }
  if (recentBets.length >= 6) {
    const r = recentBets.slice(-3).reduce((a,b) => a+b, 0) / 3;
    const p = recentBets.slice(-6, -3).reduce((a,b) => a+b, 0) / 3;
    if (p > 0 && r > p * 2) { sessMod += 0.04; reasons.push("Chase detected"); }
  }
  if (bankedTotal > 0 && totalWagered > 0 && bankedTotal / totalWagered > 0.5) { sessMod += 0.03; reasons.push("Banking"); }
  if (!reasons.length) reasons.push("Standard");
  const final = Math.max(-1, Math.min(1, corrBase + sessMod));
  return { stripConfig: final < -0.3 ? "loose" : final > 0.3 ? "tight" : "standard", correction: final, deviation, weightedRTP, rtpByWindow, reasons, sigmoidRaw: corrBase, sessionModifier: sessMod };
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 8: BONUS HELPERS
 * ═══════════════════════════════════════════════════════════════════ */

function generatePickBonusPrizes(totalBet, state) {
  const pool = totalBet * 25 * (state.lastCorrection?.correction < -0.2 ? 1.4 : state.lastCorrection?.correction > 0.2 ? 0.7 : 1.0);
  const ws = [0.02, 0.03, 0.05, 0.06, 0.07, 0.08, 0.10, 0.11, 0.12, 0.13, 0.11, 0.12];
  const prizes = ws.map(w => Math.round(pool * w * (0.5 + Math.random())));
  for (let i = prizes.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [prizes[i], prizes[j]] = [prizes[j], prizes[i]]; }
  return prizes;
}

function spinMultiplierWheel(segments) {
  const tot = segments.reduce((s, seg) => s + seg.weight, 0);
  let roll = Math.random() * tot;
  for (const seg of segments) { roll -= seg.weight; if (roll <= 0) return seg.mult; }
  return 2;
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 9: CERTIFICATION HARNESS
 * ═══════════════════════════════════════════════════════════════════ */

function runCertificationBatch(count, strips, profile) {
  let totalWagered = 0, totalWon = 0;
  const bet = 1.00, betPerLine = bet / NUM_PAYLINES;
  const hitCounts = { 0: 0 }, symbolHits = {}, rtpSamples = [], configUsage = { loose: 0, standard: 0, tight: 0 };
  const spinHist = [];
  let consLoss = 0, consWin = 0, lastBonus = 0;
  let totalCascades = 0, maxCascadeChain = 0;

  for (let i = 0; i < count; i++) {
    totalWagered += bet;
    const state = { totalWagered, totalWon, spinHistory: spinHist.slice(-500), consecutiveLosses: consLoss, consecutiveWins: consWin, lastBonusSpin: lastBonus, spinCount: i, recentBets: [bet], bankedTotal: 0, sessionPeakBalance: 1000 };
    const decision = calculateCorrection(state);
    let ec = decision.stripConfig;
    const ssb = i - lastBonus;
    if (ssb > 120 && ec === "tight") ec = "standard";
    if (ssb > 200) ec = "loose";
    configUsage[ec]++;
    const grid = spinReels(strips[ec]);

    // Resolve cascade chain
    const cascade = resolveCascadeChain(grid, betPerLine, bet, profile, ec);
    let spinWin = cascade.totalCascadeWin;
    totalCascades += cascade.totalCascades;
    if (cascade.totalCascades > maxCascadeChain) maxCascadeChain = cascade.totalCascades;

    // Scatters (evaluated on initial grid only)
    const scat = evaluateScatters(grid, bet);
    if (scat.freeSpins > 0) { spinWin += scat.payout + bet * 0.8 * scat.freeSpins; lastBonus = i; }
    if (spinWin > 0 && Math.random() < profile.multiplierChance) spinWin *= spinMultiplierWheel(profile.multiplierSegments);

    totalWon += spinWin;
    if (spinWin > 0) { consWin++; consLoss = 0; } else { consLoss++; consWin = 0; }
    const mult = spinWin > 0 ? Math.round(spinWin / betPerLine) : 0;
    hitCounts[mult] = (hitCounts[mult] || 0) + 1;
    for (let r = 0; r < NUM_REELS; r++) { const s = grid[r][1]; symbolHits[s.id] = (symbolHits[s.id] || 0) + 1; }
    spinHist.push({ bet, won: spinWin });
    if ((i + 1) % Math.max(1, Math.floor(count / 200)) === 0)
      rtpSamples.push({ spin: i + 1, rtp: totalWagered > 0 ? totalWon / totalWagered : 0 });
  }

  const actualRTP = totalWon / totalWagered;
  const rtpDev = actualRTP - TARGET_RTP;
  const within = Math.abs(rtpDev) <= 0.005;
  const totalHits = count - (hitCounts[0] || 0);
  const stdWeights = profile.reelConfigs.standard;
  const totW = Object.values(stdWeights).reduce((a, b) => a + b, 0);
  let chi2 = 0; const chiDet = []; const totObs = count * NUM_REELS;
  for (const [sym, w] of Object.entries(stdWeights)) {
    const exp = (w / totW) * totObs, obs = symbolHits[sym] || 0;
    const c = Math.pow(obs - exp, 2) / exp;
    chi2 += c; chiDet.push({ symbol: sym, expected: exp, observed: obs, chi: c });
  }
  const df = Object.keys(stdWeights).length - 1;
  const crit = 21.67;
  const variance = spinHist.reduce((s, h) => s + Math.pow(h.won / bet - actualRTP, 2), 0) / (count - 1);
  const se = Math.sqrt(variance / count);

  return {
    totalSpins: count, totalWagered, totalWon, actualRTP, targetRTP: TARGET_RTP, rtpDeviation: rtpDev,
    withinTolerance: within, hitFrequency: totalHits / count, hitCounts, symbolHits, rtpSamples,
    configUsage, chiSquared: chi2, chiDetails: chiDet, criticalValue: crit, chiPasses: chi2 < crit,
    df, ci95: [actualRTP - 1.96 * se, actualRTP + 1.96 * se], ci99: [actualRTP - 2.576 * se, actualRTP + 2.576 * se],
    standardError: se, houseEdge: 1 - actualRTP,
    verdict: within && chi2 < crit ? "PASS" : "FAIL",
    totalCascades, maxCascadeChain, avgCascadesPerSpin: totalCascades / count,
    volatility: profile.name,
  };
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 10: MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════ */

export default function SlotMachine() {
  const [volatility, setVolatility] = useState("medium");
  const profile = VOLATILITY_PROFILES[volatility];

  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(1.00);
  const [totalWagered, setTotalWagered] = useState(0);
  const [totalWon, setTotalWon] = useState(0);
  const [bankedTotal, setBankedTotal] = useState(0);
  const [sessionPeakBalance, setSessionPeakBalance] = useState(1000);

  const [grid, setGrid] = useState(() => {
    const g = []; const allS = SYMBOLS.filter(s => s.tier > 0);
    for (let r = 0; r < NUM_REELS; r++) {
      const c = []; for (let row = 0; row < NUM_ROWS; row++) c.push(allS[Math.floor(Math.random() * allS.length)]); g.push(c);
    } return g;
  });
  const [spinning, setSpinning] = useState(false);
  const [spinDisplaySymbols, setSpinDisplaySymbols] = useState(null);

  const [lastWin, setLastWin] = useState(0);
  const [winLines, setWinLines] = useState([]);
  const [message, setMessage] = useState("Choose volatility and spin!");
  const [showBigWin, setShowBigWin] = useState(false);

  // ── Cascade State ──
  const [cascadeEnabled, setCascadeEnabled] = useState(true);
  const [cascadeChain, setCascadeChain] = useState([]); // Current cascade chain steps
  const [cascadeLevel, setCascadeLevel] = useState(0);
  const [cascadeTotalWin, setCascadeTotalWin] = useState(0);
  const [cascadePlaying, setCascadePlaying] = useState(false);
  const [explodingCells, setExplodingCells] = useState(new Set());
  const [cascadeStats, setCascadeStats] = useState({ totalChains: 0, totalCascadeSteps: 0, longestChain: 0, totalCascadeWins: 0 });

  const [spinHistory, setSpinHistory] = useState([]);
  const [spinCount, setSpinCount] = useState(0);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const [consecutiveWins, setConsecutiveWins] = useState(0);
  const [lastBonusSpin, setLastBonusSpin] = useState(0);
  const [recentBets, setRecentBets] = useState([]);
  const [lastCorrection, setLastCorrection] = useState(null);
  const [decisionLog, setDecisionLog] = useState([]);

  const [nearMissEnabled, setNearMissEnabled] = useState(true);
  const [nearMissLog, setNearMissLog] = useState([]);
  const [nearMissStats, setNearMissStats] = useState({ activations: 0, cells: 0 });

  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [freeSpinMultiplier, setFreeSpinMultiplier] = useState(1);
  const [freeSpinWins, setFreeSpinWins] = useState(0);
  const [bonusActive, setBonusActive] = useState(false);
  const [bonusPrizes, setBonusPrizes] = useState([]);
  const [bonusPicked, setBonusPicked] = useState([]);
  const [bonusPicksLeft, setBonusPicksLeft] = useState(0);
  const [bonusWinTotal, setBonusWinTotal] = useState(0);
  const [multiplierActive, setMultiplierActive] = useState(null);

  const [activeTab, setActiveTab] = useState("game");
  const [autoPlay, setAutoPlay] = useState(false);
  const [certRunning, setCertRunning] = useState(false);
  const [certResults, setCertResults] = useState(null);
  const [certSpinCount, setCertSpinCount] = useState(10000);
  const [certProgress, setCertProgress] = useState(0);

  const reelStrips = useRef(buildAllStrips(profile.reelConfigs));
  const autoPlayRef = useRef(false);
  const spinTimeoutRef = useRef(null);

  useEffect(() => { autoPlayRef.current = autoPlay; }, [autoPlay]);
  useEffect(() => { return () => { if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current); }; }, []);

  // Rebuild strips when volatility changes
  useEffect(() => {
    reelStrips.current = buildAllStrips(VOLATILITY_PROFILES[volatility].reelConfigs);
  }, [volatility]);

  /**
   * CASCADE ANIMATION PLAYBACK
   *
   * When cascades are enabled, we don't immediately show the final result.
   * Instead, we play back each cascade step with timing:
   * 1. Show win highlights (400ms)
   * 2. "Explode" winning cells (300ms)
   * 3. Drop new symbols in (400ms)
   * 4. Brief pause, then re-evaluate (200ms)
   * 5. Repeat for next cascade level
   */
  const playCascadeChain = useCallback((chain, finalGrid, totalWin, spinMeta) => {
    if (chain.length === 0) {
      // No cascades — just show result
      finishSpin(finalGrid, totalWin, 0, spinMeta);
      return;
    }

    setCascadePlaying(true);
    setCascadeTotalWin(0);
    let stepIndex = 0;

    function playStep() {
      if (stepIndex >= chain.length) {
        // Chain complete
        setCascadePlaying(false);
        setExplodingCells(new Set());
        finishSpin(finalGrid, totalWin, chain.length, spinMeta);
        return;
      }

      const step = chain[stepIndex];
      setCascadeLevel(step.level);
      setCascadeTotalWin(step.accumulatedWin);

      // Show the grid with winning highlights
      setGrid(step.grid);
      setWinLines(step.wins);
      setMessage(`CASCADE ${step.level + 1} — ${step.multiplier}x multiplier! +£${step.cascadeWin.toFixed(2)}`);

      // After brief display, show explosion
      setTimeout(() => {
        setExplodingCells(new Set(step.winPositions));

        // After explosion, show new grid
        setTimeout(() => {
          setExplodingCells(new Set());
          setWinLines([]);
          stepIndex++;

          if (stepIndex < chain.length) {
            // More cascades coming — show next grid briefly
            setGrid(chain[stepIndex].grid);
            setTimeout(playStep, 250);
          } else {
            // Done — show final grid
            setGrid(finalGrid);
            setTimeout(playStep, 200);
          }
        }, 350);
      }, 500);
    }

    // Start first step after initial display
    setTimeout(playStep, 300);
  }, []);

  function finishSpin(finalGrid, totalSpinWin, numCascades, meta) {
    const { bet: spinBet, effectiveConfig, decision, scatterResult, bonusTrigger, appliedMultiplier, engineState } = meta;

    const newSpinCount = spinCount + 1;
    setSpinCount(newSpinCount);
    const newTotalWon = totalWon + totalSpinWin;
    setTotalWon(newTotalWon);
    setSpinHistory(prev => [...prev, { spin: newSpinCount, bet: spinBet, won: totalSpinWin, config: effectiveConfig, correction: decision.correction }]);

    if (totalSpinWin > 0) { setConsecutiveWins(prev => prev + 1); setConsecutiveLosses(0); }
    else { setConsecutiveLosses(prev => prev + 1); setConsecutiveWins(0); }

    const nb = balance + totalSpinWin;
    setBalance(b => b + totalSpinWin);
    if (nb > sessionPeakBalance) setSessionPeakBalance(nb);

    // Update cascade stats
    if (numCascades > 0) {
      setCascadeStats(prev => ({
        totalChains: prev.totalChains + 1,
        totalCascadeSteps: prev.totalCascadeSteps + numCascades,
        longestChain: Math.max(prev.longestChain, numCascades),
        totalCascadeWins: prev.totalCascadeWins + totalSpinWin,
      }));
    }

    // Handle bonuses
    if (scatterResult.freeSpins > 0 && freeSpinsLeft === 0) {
      const spins = scatterResult.freeSpins;
      const mult = scatterResult.count >= 4 ? 3 : 2;
      setFreeSpinsLeft(spins); setFreeSpinMultiplier(mult); setFreeSpinWins(0); setLastBonusSpin(newSpinCount);
      setMessage(`🌀 FREE SPINS! ${spins} at ${mult}x!`);
    } else if (freeSpinsLeft > 0) {
      const rem = freeSpinsLeft - 1;
      setFreeSpinsLeft(rem); setFreeSpinWins(prev => prev + totalSpinWin);
      if (rem === 0) { setMessage(`Free spins done! Won: £${(freeSpinWins + totalSpinWin).toFixed(2)}`); setFreeSpinMultiplier(1); }
      else setMessage(`Free spin — ${rem} left`);
    } else if (bonusTrigger.triggered) {
      setBonusActive(true); setBonusPrizes(generatePickBonusPrizes(spinBet, engineState));
      setBonusPicked([]); setBonusPicksLeft(4); setBonusWinTotal(0); setLastBonusSpin(newSpinCount);
      setMessage("🎰 BONUS! Pick 4!");
    } else if (totalSpinWin > 0) {
      if (totalSpinWin >= spinBet * 15) setShowBigWin(true);
      const cm = numCascades > 0 ? ` (${numCascades} cascades!)` : "";
      const mm = appliedMultiplier ? ` ${appliedMultiplier}x!` : "";
      setMessage(`WIN £${totalSpinWin.toFixed(2)}${cm}${mm}`);
    } else {
      setMessage(["Try again!", "No luck", "Spin again!", "So close!"][Math.floor(Math.random() * 4)]);
    }

    setLastWin(totalSpinWin);
    setDecisionLog(prev => [{
      spin: newSpinCount, config: effectiveConfig, correction: decision.correction.toFixed(3),
      rtp: (totalWagered + spinBet) > 0 ? ((newTotalWon / (totalWagered + spinBet)) * 100).toFixed(2) + "%" : "N/A",
      reasons: decision.reasons, won: totalSpinWin, cascades: numCascades,
    }, ...prev].slice(0, 50));

    setSpinning(false);
    setCascadeLevel(0);

    // Autoplay
    if (autoPlayRef.current && freeSpinsLeft > 1) spinTimeoutRef.current = setTimeout(() => { if (autoPlayRef.current) doSpin(); }, 800);
    else if (autoPlayRef.current && !bonusTrigger.triggered && balance + totalSpinWin >= spinBet) spinTimeoutRef.current = setTimeout(() => { if (autoPlayRef.current) doSpin(); }, 1200);
    else if (autoPlayRef.current) setAutoPlay(false);
  }

  /** MAIN SPIN */
  const doSpin = useCallback(() => {
    if (spinning || bonusActive || cascadePlaying) return;
    const currentBet = freeSpinsLeft > 0 ? 0 : bet;
    const betPerLine = bet / NUM_PAYLINES;
    if (freeSpinsLeft === 0 && balance < bet) { setMessage("Insufficient balance!"); return; }

    setSpinning(true); setWinLines([]); setLastWin(0); setShowBigWin(false);
    setMultiplierActive(null); setExplodingCells(new Set()); setCascadeChain([]);

    if (freeSpinsLeft === 0) setBalance(b => b - bet);
    const newTotalWag = totalWagered + bet;
    setTotalWagered(newTotalWag);
    setRecentBets(prev => [...prev.slice(-20), bet]);

    const engineState = {
      totalWagered: newTotalWag, totalWon, spinHistory, consecutiveLosses, consecutiveWins,
      lastBonusSpin, spinCount, recentBets: [...recentBets, bet], bankedTotal, sessionPeakBalance, lastCorrection,
    };
    const decision = calculateCorrection(engineState);
    setLastCorrection(decision);

    let ec = decision.stripConfig;
    const ssb = spinCount - lastBonusSpin;
    if (ssb > 120 && ec === "tight") ec = "standard";
    if (ssb > 200) ec = "loose";

    const strips = reelStrips.current[ec];
    const rawGrid = spinReels(strips);
    const scatterResult = evaluateScatters(rawGrid, bet);
    const bonusTrigger = evaluateBonusTrigger(rawGrid);

    // Near-miss on the initial spin grid
    const nmStats = { activated: false, reason: "", modifications: [], cellsModified: 0 };
    const wins0 = evaluatePaylines(rawGrid, betPerLine, profile.paytable);
    const isWin0 = wins0.length > 0 || scatterResult.payout > 0;

    let displayInitialGrid;
    if (nearMissEnabled && !cascadeEnabled) {
      displayInitialGrid = applyNearMissPresentation(rawGrid, isWin0, { consecutiveLosses, consecutiveWins }, nmStats);
    } else if (nearMissEnabled && !isWin0) {
      displayInitialGrid = applyNearMissPresentation(rawGrid, isWin0, { consecutiveLosses, consecutiveWins }, nmStats);
    } else {
      displayInitialGrid = rawGrid;
    }
    if (nmStats.activated) setNearMissStats(prev => ({ activations: prev.activations + 1, cells: prev.cells + nmStats.cellsModified }));
    setNearMissLog(prev => [{ spin: spinCount + 1, ...nmStats, isWin: isWin0 }, ...prev].slice(0, 20));

    // ── RESOLVE CASCADES (on raw grid, not near-miss grid) ──
    let cascadeResult;
    if (cascadeEnabled) {
      cascadeResult = resolveCascadeChain(rawGrid, betPerLine, bet, profile, ec);
    } else {
      // No cascade — just normal evaluation
      const baseWin = wins0.reduce((s, w) => s + w.payout, 0) + scatterResult.payout;
      cascadeResult = { chain: [], finalGrid: rawGrid, totalCascadeWin: baseWin, totalCascades: 0, maxMultiplierReached: 1 };
    }

    let totalSpinWin = cascadeResult.totalCascadeWin;
    if (!cascadeEnabled) totalSpinWin += scatterResult.payout;
    if (freeSpinsLeft > 0) totalSpinWin *= freeSpinMultiplier;

    let appliedMultiplier = null;
    if (totalSpinWin > 0 && Math.random() < profile.multiplierChance && freeSpinsLeft === 0) {
      appliedMultiplier = spinMultiplierWheel(profile.multiplierSegments);
      totalSpinWin *= appliedMultiplier;
      setMultiplierActive(appliedMultiplier);
    }

    // ── ANIMATION ──
    const allSyms = SYMBOLS.filter(s => s.tier > 0 || s.id === "scatter" || s.id === "bonus");
    let cycles = 0; const maxCycles = 12 + Math.floor(Math.random() * 4);

    const animTimer = setInterval(() => {
      cycles++;
      const ag = Array.from({ length: NUM_REELS }, (_, r) => {
        const stop = maxCycles - (NUM_REELS - 1 - r) * 2;
        if (cycles >= stop) return cascadeEnabled ? rawGrid[r] : displayInitialGrid[r];
        return Array.from({ length: NUM_ROWS }, () => allSyms[Math.floor(Math.random() * allSyms.length)]);
      });
      setSpinDisplaySymbols(ag);

      if (cycles >= maxCycles) {
        clearInterval(animTimer);
        setSpinDisplaySymbols(null);

        const spinMeta = { bet, effectiveConfig: ec, decision, scatterResult, bonusTrigger, appliedMultiplier, engineState };

        if (cascadeEnabled && cascadeResult.chain.length > 0) {
          // Play cascade animation chain
          setGrid(rawGrid);
          setWinLines(wins0);
          setCascadeChain(cascadeResult.chain);
          playCascadeChain(cascadeResult.chain, cascadeResult.finalGrid, totalSpinWin, spinMeta);
        } else {
          // No cascades — show result immediately
          setGrid(cascadeEnabled ? rawGrid : displayInitialGrid);
          setWinLines(wins0);
          finishSpin(cascadeEnabled ? rawGrid : displayInitialGrid, totalSpinWin, 0, spinMeta);
        }
      }
    }, 75);
  }, [spinning, bonusActive, cascadePlaying, bet, balance, totalWagered, totalWon, spinHistory,
    consecutiveLosses, consecutiveWins, lastBonusSpin, spinCount, recentBets,
    bankedTotal, sessionPeakBalance, lastCorrection, freeSpinsLeft,
    freeSpinMultiplier, freeSpinWins, nearMissEnabled, cascadeEnabled, profile, volatility, playCascadeChain]);

  const pickBonusPrize = (i) => {
    if (!bonusActive || bonusPicked.includes(i) || bonusPicksLeft <= 0) return;
    const prize = bonusPrizes[i];
    const np = [...bonusPicked, i]; const nt = bonusWinTotal + prize; const rem = bonusPicksLeft - 1;
    setBonusPicked(np); setBonusWinTotal(nt); setBonusPicksLeft(rem);
    if (rem === 0) { setBalance(b => b + nt); setTotalWon(p => p + nt); setMessage(`🎰 Bonus: £${nt.toFixed(2)}!`); setTimeout(() => setBonusActive(false), 1500); }
    else setMessage(`£${prize.toFixed(2)}! ${rem} left`);
  };

  const runCertification = useCallback(() => {
    setCertRunning(true); setCertResults(null); setCertProgress(0);
    const strips = buildAllStrips(profile.reelConfigs);
    setTimeout(() => {
      setCertResults(runCertificationBatch(certSpinCount, strips, profile));
      setCertProgress(100); setCertRunning(false);
    }, 100);
    const pt = setInterval(() => setCertProgress(p => { if (p >= 90) { clearInterval(pt); return p; } return p + Math.random() * 15; }), 200);
  }, [certSpinCount, profile]);

  // ── Computed ──
  const actualRTP = totalWagered > 0 ? (totalWon / totalWagered * 100).toFixed(2) : "—";
  const dg = spinDisplaySymbols || grid;
  const hl = new Set();
  winLines.forEach(w => w.positions.forEach(p => hl.add(`${p.reel}-${p.row}`)));

  const tabS = (t) => ({
    flex: 1, padding: "7px 2px", fontSize: "0.55rem", fontWeight: activeTab === t ? "bold" : "normal",
    background: activeTab === t ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.03)",
    border: activeTab === t ? "1px solid rgba(255,215,0,0.3)" : "1px solid rgba(255,255,255,0.08)",
    borderBottom: activeTab === t ? "none" : "1px solid rgba(255,255,255,0.08)",
    color: activeTab === t ? "#ffd700" : "#555", cursor: "pointer", fontFamily: "inherit", borderRadius: "5px 5px 0 0",
  });

  /* ═══════════════════════════════════════════════════════════════
   * RENDER
   * ═══════════════════════════════════════════════════════════════ */

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #0a0a1a 0%, #1a0a2a 50%, #0a1a2a 100%)",
      color: "#e0e0e0", fontFamily: "'Courier New', monospace",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "8px", gap: "6px",
    }}>
      {/* HEADER */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: "bold", margin: 0, letterSpacing: "2px", background: "linear-gradient(90deg, #ffd700, #ff6b35, #ffd700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>★ FORTUNE ENGINE v3 ★</h1>
        <div style={{ fontSize: "0.55rem", color: "#888", letterSpacing: "1px" }}>CASCADES + VOLATILITY + NEAR-MISS + RNG CERT │ RTP {(TARGET_RTP*100).toFixed(1)}%</div>
      </div>

      {/* VOLATILITY SELECTOR */}
      <div style={{ display: "flex", gap: 4, width: "100%", maxWidth: 560 }}>
        {Object.entries(VOLATILITY_PROFILES).map(([key, p]) => (
          <button key={key} onClick={() => { if (!spinning && !cascadePlaying) setVolatility(key); }}
            disabled={spinning || cascadePlaying}
            style={{
              flex: 1, padding: "6px 4px", borderRadius: 6, fontFamily: "inherit", cursor: "pointer",
              background: volatility === key ? `${p.color}22` : "rgba(255,255,255,0.03)",
              border: volatility === key ? `2px solid ${p.color}` : "1px solid rgba(255,255,255,0.1)",
              color: volatility === key ? p.color : "#666", fontSize: "0.6rem", textAlign: "center",
            }}>
            <div style={{ fontWeight: "bold", fontSize: "0.65rem" }}>{p.name.toUpperCase()}</div>
            <div style={{ fontSize: "0.5rem", opacity: 0.7 }}>{p.label}</div>
          </button>
        ))}
      </div>

      {/* BALANCE BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 560, background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.15)", borderRadius: 7, padding: "5px 12px", fontSize: "0.75rem" }}>
        <div><span style={{ color: "#777", fontSize: "0.55rem" }}>BAL</span><br/><span style={{ color: "#ffd700", fontWeight: "bold" }}>£{balance.toFixed(2)}</span></div>
        <div style={{ textAlign: "center" }}><span style={{ color: "#777", fontSize: "0.55rem" }}>BET</span><br/><span style={{ color: "#ff6b35", fontWeight: "bold" }}>£{bet.toFixed(2)}</span></div>
        <div style={{ textAlign: "center" }}><span style={{ color: "#777", fontSize: "0.55rem" }}>RTP</span><br/><span style={{ color: totalWagered > 0 && Math.abs(totalWon/totalWagered - TARGET_RTP) < 0.02 ? "#00ff88" : "#ffa500", fontWeight: "bold" }}>{actualRTP}%</span></div>
        <div style={{ textAlign: "right" }}><span style={{ color: "#777", fontSize: "0.55rem" }}>WIN</span><br/><span style={{ color: lastWin > 0 ? "#00ff88" : "#555", fontWeight: "bold" }}>£{lastWin.toFixed(2)}</span></div>
      </div>

      {/* FREE SPINS */}
      {freeSpinsLeft > 0 && <div style={{ background: "linear-gradient(90deg, #4a0080, #8000ff, #4a0080)", color: "#fff", padding: "4px 14px", borderRadius: 7, fontSize: "0.75rem", fontWeight: "bold", textAlign: "center", width: "100%", maxWidth: 560, boxSizing: "border-box" }}>🌀 FREE: {freeSpinsLeft} left │ {freeSpinMultiplier}x │ £{freeSpinWins.toFixed(2)}</div>}

      {/* CASCADE MULTIPLIER BAR */}
      {cascadeEnabled && (cascadePlaying || cascadeLevel > 0) && (
        <div style={{ display: "flex", gap: 3, width: "100%", maxWidth: 560, justifyContent: "center" }}>
          {profile.cascadeMultipliers.map((m, i) => (
            <div key={i} style={{
              padding: "3px 8px", borderRadius: 4, fontSize: "0.65rem", fontWeight: "bold",
              background: i <= cascadeLevel && cascadePlaying ? `rgba(255,215,0,${0.1 + i * 0.08})` : "rgba(255,255,255,0.03)",
              border: i === cascadeLevel && cascadePlaying ? "1px solid #ffd700" : "1px solid rgba(255,255,255,0.08)",
              color: i <= cascadeLevel && cascadePlaying ? "#ffd700" : "#444",
              transform: i === cascadeLevel && cascadePlaying ? "scale(1.15)" : "scale(1)",
              transition: "all 0.3s",
            }}>{m}x</div>
          ))}
          {cascadePlaying && <div style={{ color: "#00ff88", fontSize: "0.65rem", fontWeight: "bold", display: "flex", alignItems: "center", marginLeft: 8 }}>+£{cascadeTotalWin.toFixed(2)}</div>}
        </div>
      )}

      {/* REEL GRID */}
      <div style={{
        background: "linear-gradient(180deg, #1a1a3a, #0d0d2a)",
        border: `2px solid ${profile.color}55`, borderRadius: 10, padding: "6px",
        boxShadow: `0 0 25px ${profile.color}15, inset 0 0 25px rgba(0,0,0,0.5)`,
        width: "100%", maxWidth: 560, boxSizing: "border-box", position: "relative",
      }}>
        {showBigWin && <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}><div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#ffd700", textShadow: "0 0 20px #ffd700, 0 0 40px #ff6b35" }}>★ BIG WIN ★</div></div>}
        {multiplierActive && <div style={{ textAlign: "center", color: "#ff00ff", fontWeight: "bold", fontSize: "0.85rem", textShadow: "0 0 8px #ff00ff", marginBottom: 1 }}>✨ {multiplierActive}x ✨</div>}

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${NUM_REELS}, 1fr)`, gap: 3 }}>
          {Array.from({ length: NUM_ROWS }).map((_, row) =>
            Array.from({ length: NUM_REELS }).map((_, reel) => {
              const sym = dg[reel]?.[row] || SYM.cherry;
              const isWin = hl.has(`${reel}-${row}`);
              const isExploding = explodingCells.has(`${reel}-${row}`);
              return (
                <div key={`${reel}-${row}`} style={{
                  background: isExploding ? "radial-gradient(circle, rgba(255,107,53,0.4), rgba(255,50,0,0.1))"
                    : isWin ? "radial-gradient(circle, rgba(0,255,136,0.2), rgba(0,255,136,0.05))"
                    : row === 1 ? "rgba(255,215,0,0.03)" : "rgba(0,0,0,0.35)",
                  border: isExploding ? "2px solid #ff6b35" : isWin ? "2px solid #00ff88" : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
                  height: 55, fontSize: "1.7rem", transition: "all 0.25s",
                  boxShadow: isExploding ? "0 0 20px rgba(255,107,53,0.6)" : isWin ? "0 0 12px rgba(0,255,136,0.4)" : "none",
                  opacity: isExploding ? 0.3 : 1,
                  transform: isExploding ? "scale(0.7)" : "scale(1)",
                }}>
                  {sym.emoji}
                </div>
              );
            })
          ).flat()}
        </div>
      </div>

      {/* MESSAGE */}
      <div style={{ fontSize: "0.8rem", fontWeight: "bold", textAlign: "center", minHeight: 20, color: lastWin > 0 ? "#00ff88" : message.includes("CASCADE") ? "#ffd700" : message.includes("FREE") || message.includes("BONUS") ? "#ff00ff" : "#ccc" }}>{message}</div>

      {/* BONUS */}
      {bonusActive && (
        <div style={{ background: "linear-gradient(180deg, #2a0040, #1a0030)", border: "2px solid #ff00ff", borderRadius: 10, padding: 12, width: "100%", maxWidth: 560, boxSizing: "border-box" }}>
          <div style={{ textAlign: "center", marginBottom: 6, fontWeight: "bold", color: "#ff00ff", fontSize: "0.8rem" }}>🎰 PICK! ({bonusPicksLeft} left) │ £{bonusWinTotal.toFixed(2)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5 }}>
            {bonusPrizes.map((prize, i) => {
              const picked = bonusPicked.includes(i);
              return <button key={i} onClick={() => pickBonusPrize(i)} disabled={picked || bonusPicksLeft <= 0} style={{ background: picked ? "rgba(0,255,136,0.2)" : "rgba(255,0,255,0.12)", border: picked ? "2px solid #00ff88" : "1px solid rgba(255,0,255,0.25)", borderRadius: 7, padding: "9px 3px", color: picked ? "#00ff88" : "#fff", fontWeight: "bold", fontSize: "0.7rem", cursor: picked ? "default" : "pointer", fontFamily: "inherit" }}>{picked ? `£${prize.toFixed(2)}` : "🎁"}</button>;
            })}
          </div>
        </div>
      )}

      {/* CONTROLS */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 560 }}>
        <div style={{ display: "flex", gap: 3 }}>
          {[0.20, 0.50, 1, 2, 5, 10].map(b => (
            <button key={b} onClick={() => setBet(b)} disabled={spinning || cascadePlaying} style={{
              background: bet === b ? "rgba(255,107,53,0.25)" : "rgba(255,255,255,0.04)",
              border: bet === b ? "1px solid #ff6b35" : "1px solid rgba(255,255,255,0.1)",
              color: bet === b ? "#ff6b35" : "#888", borderRadius: 5, padding: "4px 7px",
              fontSize: "0.65rem", cursor: "pointer", fontFamily: "inherit", fontWeight: bet === b ? "bold" : "normal",
            }}>£{b < 1 ? b.toFixed(2) : b}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 5, width: "100%" }}>
          <button onClick={doSpin} disabled={spinning || bonusActive || cascadePlaying || (freeSpinsLeft === 0 && balance < bet)} style={{
            flex: 2, background: spinning || cascadePlaying ? "rgba(80,80,80,0.3)" : freeSpinsLeft > 0 ? "linear-gradient(180deg, #8000ff, #4a0080)" : `linear-gradient(180deg, ${profile.color}, ${profile.color}88)`,
            border: "none", borderRadius: 7, padding: "11px", fontSize: "0.95rem", fontWeight: "bold",
            color: spinning || cascadePlaying ? "#555" : "#000", cursor: spinning || cascadePlaying ? "not-allowed" : "pointer", fontFamily: "inherit", letterSpacing: "2px",
          }}>{spinning || cascadePlaying ? "..." : freeSpinsLeft > 0 ? `🌀 FREE (${freeSpinsLeft})` : "SPIN"}</button>
          <button onClick={() => { setAutoPlay(!autoPlay); if (autoPlay) autoPlayRef.current = false; }} disabled={bonusActive || cascadePlaying} style={{ flex: 0.5, background: autoPlay ? "rgba(255,0,0,0.2)" : "rgba(255,255,255,0.04)", border: autoPlay ? "1px solid #ff4444" : "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "11px 4px", fontSize: "0.6rem", color: autoPlay ? "#ff4444" : "#888", cursor: "pointer", fontFamily: "inherit" }}>{autoPlay ? "■" : "▶"}</button>
        </div>
      </div>

      {/* FEATURE TOGGLES */}
      <div style={{ display: "flex", gap: 4, width: "100%", maxWidth: 560 }}>
        <button onClick={() => setCascadeEnabled(!cascadeEnabled)} disabled={spinning || cascadePlaying} style={{
          flex: 1, padding: "5px", borderRadius: 5, fontFamily: "inherit", fontSize: "0.6rem", cursor: "pointer",
          background: cascadeEnabled ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.03)",
          border: cascadeEnabled ? "1px solid rgba(255,215,0,0.4)" : "1px solid rgba(255,255,255,0.1)",
          color: cascadeEnabled ? "#ffd700" : "#555",
        }}>CASCADE {cascadeEnabled ? "ON" : "OFF"}</button>
        <button onClick={() => setNearMissEnabled(!nearMissEnabled)} style={{
          flex: 1, padding: "5px", borderRadius: 5, fontFamily: "inherit", fontSize: "0.6rem", cursor: "pointer",
          background: nearMissEnabled ? "rgba(255,107,53,0.15)" : "rgba(255,255,255,0.03)",
          border: nearMissEnabled ? "1px solid rgba(255,107,53,0.4)" : "1px solid rgba(255,255,255,0.1)",
          color: nearMissEnabled ? "#ff6b35" : "#555",
        }}>NEAR-MISS {nearMissEnabled ? "ON" : "OFF"}</button>
        <button onClick={() => { setBalance(b => b - Math.floor(balance / 2)); setBankedTotal(p => p + Math.floor(balance / 2)); }} disabled={balance < 2 || spinning} style={{ flex: 0.8, padding: "5px", borderRadius: 5, fontFamily: "inherit", fontSize: "0.6rem", cursor: "pointer", background: "rgba(0,200,100,0.08)", border: "1px solid rgba(0,200,100,0.2)", color: "#00c864" }}>BANK ½</button>
        <div style={{ flex: 0.6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", color: "#666" }}>🏦£{bankedTotal.toFixed(0)}</div>
        <button onClick={() => { setBalance(b => b + bankedTotal); setBankedTotal(0); }} disabled={bankedTotal <= 0 || spinning} style={{ flex: 0.6, padding: "5px", borderRadius: 5, fontFamily: "inherit", fontSize: "0.6rem", cursor: "pointer", background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.2)", color: "#ffa500" }}>OUT</button>
        <button onClick={() => {
          setBalance(1000); setTotalWagered(0); setTotalWon(0); setSpinHistory([]); setSpinCount(0);
          setConsecutiveLosses(0); setConsecutiveWins(0); setLastBonusSpin(0); setRecentBets([]);
          setBankedTotal(0); setSessionPeakBalance(1000); setDecisionLog([]); setNearMissLog([]);
          setLastCorrection(null); setFreeSpinsLeft(0); setFreeSpinMultiplier(1); setBonusActive(false);
          setAutoPlay(false); setNearMissStats({ activations: 0, cells: 0 });
          setCascadeStats({ totalChains: 0, totalCascadeSteps: 0, longestChain: 0, totalCascadeWins: 0 });
          setMessage("Reset!"); reelStrips.current = buildAllStrips(profile.reelConfigs);
        }} style={{ padding: "5px 8px", borderRadius: 5, fontFamily: "inherit", fontSize: "0.6rem", cursor: "pointer", background: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.2)", color: "#ff4444" }}>↺</button>
      </div>

      {/* TAB BAR */}
      <div style={{ display: "flex", width: "100%", maxWidth: 560, gap: 1 }}>
        {[["game","🎰 GAME"],["volatility","📊 VOL"],["cascade","⛓ CASCADE"],["algorithm","⚙️ ENGINE"],["nearmiss","👁 NM"],["certification","✅ CERT"]].map(([t, l]) => (
          <button key={t} onClick={() => setActiveTab(t)} style={tabS(t)}>{l}</button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div style={{ width: "100%", maxWidth: 560, boxSizing: "border-box", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,215,0,0.1)", borderTop: "none", borderRadius: "0 0 7px 7px", padding: 10, fontSize: "0.65rem", lineHeight: 1.5, minHeight: 160 }}>

        {/* GAME TAB */}
        {activeTab === "game" && (
          <div>
            <div style={{ color: "#ffd700", fontWeight: "bold", marginBottom: 4 }}>SESSION</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 14px" }}>
              <span style={{ color: "#777" }}>Wagered:</span><span>£{totalWagered.toFixed(2)}</span>
              <span style={{ color: "#777" }}>Returned:</span><span>£{totalWon.toFixed(2)}</span>
              <span style={{ color: "#777" }}>Profit/loss:</span><span style={{ color: totalWon - totalWagered >= 0 ? "#00ff88" : "#ff4444" }}>£{(totalWon - totalWagered).toFixed(2)}</span>
              <span style={{ color: "#777" }}>Spins:</span><span>{spinCount}</span>
              <span style={{ color: "#777" }}>Volatility:</span><span style={{ color: profile.color }}>{profile.name} — {profile.label}</span>
            </div>
            <div style={{ marginTop: 8, color: "#ffd700", fontWeight: "bold", marginBottom: 3 }}>PAYTABLE ({profile.name} vol)</div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: "1px 8px", fontSize: "0.6rem" }}>
              <div style={{ color: "#555" }}>Sym</div><div style={{ color: "#555" }}>×3</div><div style={{ color: "#555" }}>×4</div><div style={{ color: "#555" }}>×5</div>
              {Object.entries(profile.paytable).map(([id, pays]) => [
                <div key={`${id}-s`}>{SYM[id].emoji} {SYM[id].name}</div>,
                <div key={`${id}-3`} style={{ color: "#aaa" }}>{pays[3]}×</div>,
                <div key={`${id}-4`} style={{ color: "#ddd" }}>{pays[4]}×</div>,
                <div key={`${id}-5`} style={{ color: "#ffd700" }}>{pays[5]}×</div>,
              ]).flat()}
            </div>
          </div>
        )}

        {/* ═══ VOLATILITY TAB ═══ */}
        {activeTab === "volatility" && (
          <div>
            <div style={{ color: "#ffd700", fontWeight: "bold", marginBottom: 6 }}>📊 VOLATILITY COMPARISON</div>
            <div style={{ background: "rgba(255,215,0,0.06)", borderRadius: 5, padding: 8, marginBottom: 8, fontSize: "0.58rem", lineHeight: 1.5, color: "#aa9966" }}>
              <b>What is volatility?</b> All three profiles target the SAME {(TARGET_RTP*100).toFixed(1)}% RTP. The difference is HOW that return is distributed. Low vol returns many small amounts frequently. High vol returns fewer, larger amounts rarely. Think of it as: same total rainfall, but low vol is steady drizzle, high vol is rare thunderstorms.
            </div>

            {/* Comparison table */}
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: "2px 6px", fontSize: "0.58rem" }}>
              <div style={{ color: "#666" }}>Metric</div>
              {Object.entries(VOLATILITY_PROFILES).map(([k, p]) => <div key={k} style={{ color: p.color, fontWeight: "bold", textAlign: "center" }}>{p.name}</div>)}

              <div style={{ color: "#888" }}>Top pay (5×Seven)</div>
              {Object.values(VOLATILITY_PROFILES).map((p, i) => <div key={i} style={{ textAlign: "center" }}>{p.paytable.seven[5]}×</div>)}

              <div style={{ color: "#888" }}>Bottom pay (3×Cherry)</div>
              {Object.values(VOLATILITY_PROFILES).map((p, i) => <div key={i} style={{ textAlign: "center" }}>{p.paytable.cherry[3]}×</div>)}

              <div style={{ color: "#888" }}>Pay spread ratio</div>
              {Object.values(VOLATILITY_PROFILES).map((p, i) => <div key={i} style={{ textAlign: "center" }}>{(p.paytable.seven[5] / p.paytable.cherry[3]).toFixed(0)}:1</div>)}

              <div style={{ color: "#888" }}>Wilds on std strip</div>
              {Object.values(VOLATILITY_PROFILES).map((p, i) => <div key={i} style={{ textAlign: "center" }}>{p.reelConfigs.standard.wild}</div>)}

              <div style={{ color: "#888" }}>Sevens on std strip</div>
              {Object.values(VOLATILITY_PROFILES).map((p, i) => <div key={i} style={{ textAlign: "center" }}>{p.reelConfigs.standard.seven}</div>)}

              <div style={{ color: "#888" }}>Cascade multipliers</div>
              {Object.values(VOLATILITY_PROFILES).map((p, i) => <div key={i} style={{ textAlign: "center", fontSize: "0.5rem" }}>{p.cascadeMultipliers.join("→")}</div>)}

              <div style={{ color: "#888" }}>Max cascade mult</div>
              {Object.values(VOLATILITY_PROFILES).map((p, i) => <div key={i} style={{ textAlign: "center", fontWeight: "bold", color: p.color }}>{p.cascadeMultipliers[p.cascadeMultipliers.length-1]}×</div>)}
            </div>

            {/* Visual distribution */}
            <div style={{ marginTop: 10, color: "#ffd700", fontWeight: "bold", fontSize: "0.6rem", marginBottom: 4 }}>PAYOUT DISTRIBUTION SHAPE</div>
            {Object.entries(VOLATILITY_PROFILES).map(([k, p]) => (
              <div key={k} style={{ marginBottom: 6 }}>
                <div style={{ color: p.color, fontWeight: "bold", fontSize: "0.55rem", marginBottom: 2 }}>{p.name}: {p.label}</div>
                <div style={{ display: "flex", gap: 1, height: 16, alignItems: "flex-end" }}>
                  {/* Visual bars showing approximate win distribution shape */}
                  {(k === "low" ? [8,7,6,5,4,4,3,3,2,2,2,1,1,1,0,0,0,0,0,0] :
                    k === "medium" ? [5,4,3,3,2,2,1,1,1,1,1,0,0,0,0,1,1,2,3,4] :
                    [2,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,5,9]).map((h, i) => (
                    <div key={i} style={{ flex: 1, height: h * 1.6, background: p.color, borderRadius: "1px 1px 0 0", opacity: 0.6 + h * 0.04 }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.45rem", color: "#555" }}>
                  <span>Frequent small</span><span>Rare large</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ CASCADE TAB ═══ */}
        {activeTab === "cascade" && (
          <div>
            <div style={{ color: "#ffd700", fontWeight: "bold", marginBottom: 6 }}>⛓ CASCADE / AVALANCHE ENGINE</div>

            <div style={{ background: "rgba(255,215,0,0.06)", borderRadius: 5, padding: 8, marginBottom: 8, fontSize: "0.58rem", lineHeight: 1.5, color: "#aa9966" }}>
              <b>How cascades work:</b> When symbols form a win, they EXPLODE and vanish. Remaining symbols fall down under gravity. New random symbols fill the gaps from the top. The grid is re-evaluated. If new wins form — another cascade! Each level increases a progressive multiplier. This creates chain reactions where a single spin can cascade 5+ times with escalating multipliers.<br/><br/>
              <b>Why cascades aren't "free":</b> The base paytable is calibrated LOWER to account for cascade potential. A "5× cherry" might pay 5× per line, but if it cascades 3 times at 1×→2×→3× multipliers, the effective return from that initial win is much higher. The RTP engine accounts for expected cascade value in its correction calculations.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 14px", marginBottom: 8 }}>
              <span style={{ color: "#777" }}>System:</span><span style={{ color: cascadeEnabled ? "#00ff88" : "#ff4444" }}>{cascadeEnabled ? "ACTIVE" : "DISABLED"}</span>
              <span style={{ color: "#777" }}>Total chains:</span><span>{cascadeStats.totalChains}</span>
              <span style={{ color: "#777" }}>Total cascade steps:</span><span>{cascadeStats.totalCascadeSteps}</span>
              <span style={{ color: "#777" }}>Longest chain:</span><span style={{ color: cascadeStats.longestChain > 3 ? "#ffd700" : "#ccc" }}>{cascadeStats.longestChain} steps</span>
              <span style={{ color: "#777" }}>Avg per chain:</span><span>{cascadeStats.totalChains > 0 ? (cascadeStats.totalCascadeSteps / cascadeStats.totalChains).toFixed(1) : "—"}</span>
              <span style={{ color: "#777" }}>Cascade winnings:</span><span>£{cascadeStats.totalCascadeWins.toFixed(2)}</span>
            </div>

            {/* Multiplier progression display */}
            <div style={{ color: "#ffd700", fontWeight: "bold", fontSize: "0.6rem", marginBottom: 4 }}>MULTIPLIER PROGRESSION ({profile.name} vol)</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
              {profile.cascadeMultipliers.map((m, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: `rgba(255,215,0,${0.05 + i * 0.06})`, border: `1px solid rgba(255,215,0,${0.2 + i * 0.1})`,
                    fontSize: "0.7rem", fontWeight: "bold", color: "#ffd700",
                  }}>{m}×</div>
                  <div style={{ fontSize: "0.45rem", color: "#666" }}>Lvl {i + 1}</div>
                  {i < profile.cascadeMultipliers.length - 1 && <div style={{ fontSize: "0.5rem", color: "#444" }}>→</div>}
                </div>
              ))}
            </div>

            <div style={{ fontSize: "0.55rem", color: "#665544", lineHeight: 1.5 }}>
              <b>Design insight:</b> The cascade multiplier progression is different per volatility. Low vol uses conservative steps (1→1.5→2→3→4→5) keeping wins predictable. High vol uses explosive steps (1→2→4→8→15→25) — a 5-chain cascade at high vol pays 25× the base win. This is where the "dream" lives in high vol games: most spins return nothing, but a deep cascade chain with the 25× multiplier can return thousands of times the bet in a single spin sequence.
            </div>
          </div>
        )}

        {/* ALGORITHM TAB */}
        {activeTab === "algorithm" && (
          <div>
            <div style={{ color: "#0096ff", fontWeight: "bold", marginBottom: 4 }}>⚙️ RTP ENGINE</div>
            {lastCorrection ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 14px", marginBottom: 6 }}>
                  <span style={{ color: "#777" }}>Strip:</span><span style={{ color: lastCorrection.stripConfig === "loose" ? "#00ff88" : lastCorrection.stripConfig === "tight" ? "#ff4444" : "#ffa500", fontWeight: "bold" }}>{lastCorrection.stripConfig.toUpperCase()}</span>
                  <span style={{ color: "#777" }}>Correction:</span><span>{lastCorrection.correction.toFixed(4)}</span>
                  <span style={{ color: "#777" }}>Sigmoid:</span><span>{lastCorrection.sigmoidRaw.toFixed(4)}</span>
                  <span style={{ color: "#777" }}>Sess mod:</span><span>{lastCorrection.sessionModifier.toFixed(4)}</span>
                </div>
                <div style={{ marginBottom: 6 }}>
                  {Object.entries(lastCorrection.rtpByWindow).map(([n, r]) => (
                    <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#777", width: 45 }}>{n}</span>
                      <div style={{ width: 70, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, position: "relative" }}>
                        <div style={{ position: "absolute", left: "50%", width: 1, height: "100%", background: "rgba(255,255,255,0.15)" }} />
                        <div style={{ position: "absolute", left: `${Math.max(2, Math.min(98, 50 + (r - TARGET_RTP) * 500))}%`, width: 3, height: "100%", background: Math.abs(r - TARGET_RTP) < 0.03 ? "#00ff88" : r > TARGET_RTP ? "#ff4444" : "#ffa500", borderRadius: 1, transform: "translateX(-50%)" }} />
                      </div>
                      <span style={{ color: Math.abs(r - TARGET_RTP) < 0.03 ? "#00ff88" : "#ffa500", width: 45, textAlign: "right" }}>{(r*100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
                {lastCorrection.reasons.map((r, i) => <div key={i} style={{ color: "#77aaff", paddingLeft: 6, fontSize: "0.58rem" }}>▸ {r}</div>)}
              </>
            ) : <div style={{ color: "#444" }}>Spin to see</div>}
            <div style={{ marginTop: 6, maxHeight: 120, overflowY: "auto", fontSize: "0.55rem" }}>
              {decisionLog.slice(0, 12).map((e, i) => (
                <div key={i} style={{ padding: "1px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#444" }}>#{e.spin}</span>
                  <span style={{ color: e.config === "loose" ? "#00ff88" : e.config === "tight" ? "#ff4444" : "#ffa500" }}>{e.config}</span>
                  <span style={{ color: "#555" }}>{e.rtp}</span>
                  <span style={{ color: "#555" }}>{e.cascades > 0 ? `⛓${e.cascades}` : ""}</span>
                  <span style={{ color: e.won > 0 ? "#00ff88" : "#333" }}>£{e.won.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEAR-MISS TAB */}
        {activeTab === "nearmiss" && (
          <div>
            <div style={{ color: "#ff6b35", fontWeight: "bold", marginBottom: 4 }}>👁 NEAR-MISS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 14px", marginBottom: 6 }}>
              <span style={{ color: "#777" }}>System:</span><span style={{ color: nearMissEnabled ? "#00ff88" : "#ff4444" }}>{nearMissEnabled ? "ON" : "OFF"}</span>
              <span style={{ color: "#777" }}>Activations:</span><span>{nearMissStats.activations}/{spinCount} ({spinCount > 0 ? ((nearMissStats.activations/spinCount)*100).toFixed(0) : 0}%)</span>
              <span style={{ color: "#777" }}>Cells changed:</span><span>{nearMissStats.cells}</span>
            </div>
            <div style={{ background: "rgba(255,107,53,0.06)", borderRadius: 5, padding: 6, fontSize: "0.55rem", color: "#996644", lineHeight: 1.4, marginBottom: 6 }}>
              Near-miss modifies ONLY non-payline rows (0 &amp; 2). Payline outcomes are determined by pure RNG before near-miss applies. With cascades enabled, near-miss only applies to the initial spin display (not cascade grids), maintaining mathematical integrity.
            </div>
            <div style={{ maxHeight: 100, overflowY: "auto", fontSize: "0.55rem" }}>
              {nearMissLog.slice(0, 10).map((e, i) => (
                <div key={i} style={{ padding: "2px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#444" }}>#{e.spin}</span>
                  <span style={{ color: e.activated ? "#ff6b35" : "#333" }}>{e.activated ? "ON" : "—"}</span>
                  <span style={{ color: "#555" }}>{e.cellsModified || 0}c</span>
                  <span style={{ color: e.isWin ? "#00ff88" : "#333" }}>{e.isWin ? "W" : "L"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CERTIFICATION TAB */}
        {activeTab === "certification" && (
          <div>
            <div style={{ color: "#00cc66", fontWeight: "bold", marginBottom: 4 }}>✅ RNG CERTIFICATION ({profile.name} vol)</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
              {[10000, 25000, 50000, 100000].map(n => (
                <button key={n} onClick={() => setCertSpinCount(n)} disabled={certRunning} style={{
                  background: certSpinCount === n ? "rgba(0,204,102,0.15)" : "rgba(255,255,255,0.03)",
                  border: certSpinCount === n ? "1px solid #00cc66" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 4, padding: "3px 7px", fontSize: "0.6rem",
                  color: certSpinCount === n ? "#00cc66" : "#777", cursor: "pointer", fontFamily: "inherit",
                }}>{(n/1000)}K</button>
              ))}
              <button onClick={runCertification} disabled={certRunning} style={{
                background: certRunning ? "rgba(80,80,80,0.2)" : "linear-gradient(180deg, #00cc66, #008844)",
                border: "none", borderRadius: 5, padding: "5px 14px", fontSize: "0.65rem", fontWeight: "bold",
                color: certRunning ? "#555" : "#000", cursor: certRunning ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}>{certRunning ? `${certProgress.toFixed(0)}%...` : "RUN"}</button>
            </div>
            {certRunning && <div style={{ width: "100%", height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginBottom: 8 }}><div style={{ width: `${certProgress}%`, height: "100%", background: "#00cc66", borderRadius: 2, transition: "width 0.3s" }} /></div>}

            {certResults && (
              <div>
                <div style={{
                  textAlign: "center", padding: "8px", marginBottom: 8, borderRadius: 6,
                  background: certResults.verdict === "PASS" ? "rgba(0,255,136,0.08)" : "rgba(255,0,0,0.08)",
                  border: `2px solid ${certResults.verdict === "PASS" ? "#00ff88" : "#ff4444"}`,
                }}>
                  <div style={{ fontSize: "1rem", fontWeight: "bold", color: certResults.verdict === "PASS" ? "#00ff88" : "#ff4444" }}>
                    {certResults.verdict === "PASS" ? "✅ PASSED" : "❌ FAILED"} — {certResults.volatility} volatility
                  </div>
                  <div style={{ fontSize: "0.55rem", color: "#777", marginTop: 2 }}>
                    {certResults.totalSpins.toLocaleString()} spins │ {(certResults.actualRTP*100).toFixed(3)}% (dev: {(certResults.rtpDeviation*100).toFixed(3)}%) │ χ²={certResults.chiSquared.toFixed(1)} ({certResults.chiPasses ? "PASS" : "FAIL"})
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 14px", marginBottom: 6 }}>
                  <span style={{ color: "#777" }}>RTP:</span><span style={{ color: certResults.withinTolerance ? "#00ff88" : "#ff4444" }}>{(certResults.actualRTP*100).toFixed(3)}% (±0.5% = {certResults.withinTolerance ? "OK" : "FAIL"})</span>
                  <span style={{ color: "#777" }}>Hit freq:</span><span>{(certResults.hitFrequency*100).toFixed(1)}%</span>
                  <span style={{ color: "#777" }}>House edge:</span><span>{(certResults.houseEdge*100).toFixed(3)}%</span>
                  <span style={{ color: "#777" }}>95% CI:</span><span style={{ fontSize: "0.55rem" }}>[{(certResults.ci95[0]*100).toFixed(2)}%, {(certResults.ci95[1]*100).toFixed(2)}%]</span>
                  <span style={{ color: "#777" }}>Avg cascades/spin:</span><span>{certResults.avgCascadesPerSpin.toFixed(3)}</span>
                  <span style={{ color: "#777" }}>Max chain:</span><span>{certResults.maxCascadeChain}</span>
                </div>

                {/* Convergence graph */}
                <div style={{ position: "relative", height: 60, background: "rgba(0,0,0,0.25)", borderRadius: 3, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(255,215,0,0.3)" }} />
                  <div style={{ position: "absolute", top: "40%", left: 0, right: 0, height: "20%", background: "rgba(0,255,136,0.04)" }} />
                  <svg width="100%" height="100%" viewBox={`0 0 ${certResults.rtpSamples.length} 100`} preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0 }}>
                    <polyline fill="none" stroke={profile.color} strokeWidth="0.8"
                      points={certResults.rtpSamples.map((s, i) => `${i},${Math.max(2, Math.min(98, 50 - (s.rtp - TARGET_RTP) * 1000))}`).join(" ")} />
                  </svg>
                  <div style={{ position: "absolute", top: 1, right: 3, fontSize: "0.4rem", color: "#555" }}>{(TARGET_RTP*100).toFixed(1)}%</div>
                </div>
                <div style={{ fontSize: "0.5rem", color: "#555", textAlign: "center" }}>Convergence: {profile.color === "#ff4444" ? "wider oscillations expected (high vol)" : profile.color === "#00cc66" ? "tight convergence (low vol)" : "moderate convergence"}</div>

                {/* Strip usage */}
                <div style={{ marginTop: 6 }}>
                  {Object.entries(certResults.configUsage).map(([c, n]) => (
                    <div key={c} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ color: c === "loose" ? "#00ff88" : c === "tight" ? "#ff4444" : "#ffa500", width: 50, fontSize: "0.55rem", fontWeight: "bold" }}>{c}</span>
                      <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${(n/certResults.totalSpins)*100}%`, height: "100%", background: c === "loose" ? "#00ff88" : c === "tight" ? "#ff4444" : "#ffa500", borderRadius: 3 }} />
                      </div>
                      <span style={{ color: "#666", fontSize: "0.55rem", width: 55, textAlign: "right" }}>{((n/certResults.totalSpins)*100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!certResults && !certRunning && <div style={{ color: "#444", textAlign: "center", padding: 16 }}>Select spin count and RUN to certify</div>}
          </div>
        )}
      </div>

      <style>{`
        button:hover:not(:disabled) { filter: brightness(1.15); }
        button:active:not(:disabled) { transform: scale(0.97); }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }
      `}</style>
    </div>
  );
}
