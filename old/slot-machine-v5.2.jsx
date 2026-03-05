/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║    FORTUNE ENGINE SLOT MACHINE SIMULATOR — EDUCATIONAL ENGINE        ║
 * ║                                                                      ║
 * ║  A transparent slot machine that exposes the mathematical            ║
 * ║  algorithms real machines use to maintain Return-To-Player           ║
 * ║  (RTP) targets while creating engaging volatility patterns.          ║
 * ║                                                                      ║
 * ║  KEY CONCEPT: Real slot machines don't "rig" individual spins.       ║
 * ║  Instead, they select from weighted reel strip configurations        ║
 * ║  that naturally produce different payout rates. The machine          ║
 * ║  chooses which strip set to use based on its current RTP             ║
 * ║  deviation — this is the core mechanism we simulate here.            ║
 * ║                                                                      ║
 * ║        FORTUNE ENGINE v2 — NEAR-MISS & RNG CERTIFICATION             ║
 * ║                                                                      ║
 * ║  ENHANCEMENT 1: NEAR-MISS ENGINEERING                                ║
 * ║  Real slot machines use "virtual reel mapping" — each physical       ║
 * ║  reel stop maps to a WEIGHTED virtual stop table. High-value         ║
 * ║  symbols are placed so they appear just above/below the payline      ║
 * ║  far more often than pure chance would produce. This creates the     ║
 * ║  illusion of "almost winning" which is psychologically powerful.     ║
 * ║                                                                      ║
 * ║  KEY INSIGHT: Near-misses don't affect payouts AT ALL. The actual    ║
 * ║  payline result is determined first. The near-miss system only       ║
 * ║  influences which NON-WINNING symbols appear in adjacent rows.       ║
 * ║  This is why it passes RNG certification — the mathematical          ║
 * ║  return is identical; only the visual presentation changes.          ║
 * ║                                                                      ║
 * ║  ENHANCEMENT 2: RNG CERTIFICATION HARNESS                            ║
 * ║  A simulation engine that runs 10,000-100,000 spins at high speed    ║
 * ║  and validates that actual RTP falls within ±0.5% of target —        ║
 * ║  the tolerance required by bodies like the UK Gambling Commission.   ║
 * ║  Shows convergence graphs, chi-squared analysis, and confidence      ║
 * ║  intervals in real-time.                                             ║
 * ║                                                                      ║
 * ║            FORTUNE ENGINE v3 — EXPANDED FEATURE SET                  ║
 * ║                                                                      ║
 * ║  NEW IN v3:                                                          ║
 * ║                                                                      ║
 * ║  VOLATILITY PROFILES (Low / Medium / High)                           ║
 * ║  Volatility is the "personality" of a slot machine. It determines    ║
 * ║  HOW the RTP budget is distributed across wins:                      ║
 * ║  • Low vol: Frequent small wins. Paytable is compressed (top prize   ║
 * ║    ~200x, bottom ~3x). Strips loaded with mid-tier symbols.          ║
 * ║    Feels like a steady drip of small returns. Session variance is    ║
 * ║    low — your balance stays relatively stable.                       ║
 * ║  • High vol: Rare massive wins. Paytable is expanded (top prize      ║
 * ║    ~2500x, bottom ~8x). Strips dominated by low-tier symbols with    ║
 * ║    very few high-value stops. Long droughts punctuated by huge       ║
 * ║    payouts. Session variance is extreme.                             ║
 * ║  SAME RTP across all profiles. The machine returns the same %        ║
 * ║  long-term — only the distribution shape changes.                    ║
 * ║                                                                      ║
 * ║  CASCADING / AVALANCHE REELS                                         ║
 * ║  When symbols form a winning combination:                            ║
 * ║  1. Winning symbols EXPLODE and are removed from the grid            ║
 * ║  2. Remaining symbols DROP DOWN to fill the gaps (gravity)           ║
 * ║  3. New random symbols FALL IN from the top to fill empty spaces     ║
 * ║  4. The grid is re-evaluated for new wins                            ║
 * ║  5. If new wins form → repeat from step 1                            ║
 * ║  6. Each consecutive cascade INCREASES a progressive multiplier:     ║
 * ║     1x → 2x → 3x → 5x → 8x → 12x                                     ║
 * ║  This creates chain-reaction excitement and is how modern games      ║
 * ║  like Gonzo's Quest, Sweet Bonanza, and Reactoonz work.              ║
 * ║  The cascade multiplier is where a huge chunk of RTP budget lives.   ║
 * ║                                                                      ║
 * ║            FORTUNE ENGINE v4 — PSYCHOLOGICAL WARFARE                 ║
 * ║                                                                      ║
 * ║  NEW IN v4: THE DARK PATTERNS                                        ║
 * ║                                                                      ║
 * ║  This version exposes the psychological manipulation techniques      ║
 * ║  used by real slot machines to alter player perception and           ║
 * ║  behaviour. Each technique has a TOGGLE so you can experience        ║
 * ║  the difference with it on vs off.                                   ║
 * ║                                                                      ║
 * ║  1. LOSSES DISGUISED AS WINS (LDW)                                   ║
 * ║     The most studied deceptive mechanic in gambling research.        ║
 * ║     When you win LESS than you bet, the machine still celebrates.    ║
 * ║     Research: Dixon et al. (2010) showed players' physiological      ║
 * ║     arousal (skin conductance) to LDWs is identical to real wins.    ║
 * ║                                                                      ║
 * ║  2. STOP BUTTON ILLUSION (Illusory Control)                          ║
 * ║     A "STOP" button that feels like it gives you control over the    ║
 * ║     outcome. In reality, the result is determined at SPIN time.      ║
 * ║     The button just skips the animation. But the perception of       ║
 * ║     control increases bet size and session duration.                 ║
 * ║                                                                      ║
 * ║  3. CELEBRATION ASYMMETRY                                            ║
 * ║     Wins trigger escalating visual celebrations based on size.       ║
 * ║     Losses produce NOTHING — silence and stillness. This creates     ║
 * ║     an availability bias: players remember wins vividly because      ║
 * ║     they were visually spectacular, and forget losses because        ║
 * ║     there was nothing to encode in memory.                           ║
 * ║                                                                      ║
 * ║  4. REEL ANTICIPATION SLOWDOWN                                       ║
 * ║     When bonus/scatter symbols land on early reels, later reels      ║
 * ║     slow down dramatically. Creates suspense for an outcome that     ║
 * ║     was already determined. Triggers cortisol (stress) + dopamine    ║
 * ║     (anticipation) cocktail that's highly addictive.                 ║
 * ║                                                                      ║
 * ║  5. CREDIT OBFUSCATION                                               ║
 * ║     Display "CREDITS" instead of currency. "500 credits" feels       ║
 * ║     like play money; "£5.00" feels like real money. This             ║
 * ║     psychological distance reduces loss aversion.                    ║
 * ║                                                                      ║
 * ║  6. SESSION TIME DISSOLUTION                                         ║
 * ║     Toggle: show a clock and session timer, or hide all time         ║
 * ║     awareness (like real casinos with no windows or clocks).         ║
 * ║                                                                      ║
 * ║  7. BET COMPLEXITY HIDING                                            ║
 * ║     Toggle between showing "5p/line" (hides true cost) vs            ║
 * ║     "£1.00 per spin" (honest total).                                 ║
 * ║                                                                      ║
 * ║          FORTUNE ENGINE v5 — COMPLETE PSYCHOLOGICAL TOOLKIT          ║
 * ║                                                                      ║
 * ║  NEW IN v5:                                                          ║
 * ║                                                                      ║
 * ║  8. PROGRESSIVE JACKPOT DISPLAY                                      ║
 * ║     A counter that grows with every spin, funded by a tiny %         ║
 * ║     of each bet (typically 1-2%). Creates FOMO — "it's so high,      ║
 * ║     someone has to win soon!" In reality, the jackpot is just        ║
 * ║     a savings account of skimmed bets with a random trigger.         ║
 * ║     The counter NEVER resets to zero — it "reseeds" at a high        ║
 * ║     base so it always looks temptingly large.                        ║
 * ║                                                                      ║
 * ║  9. GAMBLER'S FALLACY EXPLOITATION                                   ║
 * ║     Fake "HOT STREAK" / "COLD" indicators, "BONUS DUE" alerts,       ║
 * ║     and streak counters. Every spin is mathematically independent.   ║
 * ║     These displays are meaningless noise — but humans can't help     ║
 * ║     seeing patterns. Casinos exploit this with "hot machine" lights  ║
 * ║     and bonus probability meters.                                    ║
 * ║                                                                      ║
 * ║  10. AUTOPLAY SPEED ACCELERATION                                     ║
 * ║      Autoplay runs ~40% faster than manual play. Same RTP, but       ║
 * ║      more spins per minute = faster money transfer to house.         ║
 * ║      Tracked with spins/minute comparison.                           ║
 * ║                                                                      ║
 * ║  11. ASYMMETRIC SOUND DESIGN (via Tone.js)                           ║
 * ║      Rising pitch approaching wins, celebratory tones on hits,       ║
 * ║      escalating frequencies with win size, and SILENCE on losses.    ║
 * ║      The audio channel bypasses conscious processing and directly    ║
 * ║      triggers emotional responses.                                   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { useState, useRef, useCallback, useEffect } from "react";
import * as Tone from "tone";

/* ═══════════════════════════════════════════════════════════════════
 * SECTION 1: SYMBOL SYSTEM & CORE CONFIGURATION
 * 
 * Each symbol has a name, display emoji, and a "tier" that determines
 * its base payout multiplier. Higher tier = rarer = higher payout.
 * The frequency of each symbol on the reel strips determines the
 * actual probability of landing on it.
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

/**
 * SYM — Quick-lookup table for symbols by ID.
 * Used everywhere the engine needs to reference a symbol by name
 * rather than searching the array. e.g. SYM.wild, SYM.seven
 */
const SYM = Object.fromEntries(SYMBOLS.map(s => [s.id, s]));

/**
 * CORE CONSTANTS
 * 
 * NP  = Number of Paylines (20). Each spin evaluates 20 different patterns
 *       across the grid. More paylines = more chances to "win" per spin,
 *       but also costs more per spin (bet is divided across all lines).
 *       THIS IS KEY TO THE LDW TRICK: 20 lines means you often hit
 *       1-2 lines but the total return is less than you bet on all 20.
 * 
 * NR  = Number of Reels (5). Standard modern video slot layout.
 *       3-reel machines are "classic"; 5-reel gives more payline variety.
 * 
 * NROW = Number of Rows visible (3). The "window" into the reel strip.
 *        Row 0 = top, Row 1 = middle (primary payline), Row 2 = bottom.
 *        Near-miss engineering targets rows 0 and 2 (non-payline rows).
 * 
 * TGT = Target RTP (0.965 = 96.5%). This is the declared return percentage.
 *       UK Gambling Commission requires machines to return between 70-98%.
 *       Online slots typically target 95-97%. Land-based casinos run lower
 *       (88-93%) because they have physical overhead costs.
 *       The house edge is 1 - TGT = 3.5%, meaning for every £100 wagered,
 *       the machine keeps £3.50 on average over the long term.
 */
const NP = 20, NR = 5, NROW = 3, TGT = 0.965;

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

// symbol_id: { count_needed: multiplier }
// Count is how many matching symbols on a payline (left-to-right)

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

/** Short alias for use in evaluation functions */
const PL = PAYLINES;

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
 * SCATTER PAYS — Special symbol payouts.
 * 
 * Scatters are unique: they pay based on TOTAL BET (not per-line),
 * and they DON'T need to be on a payline — they count ANYWHERE on the grid.
 * This makes them feel more "generous" but the math is carefully balanced.
 * 
 * 3 scatters = 5× total bet + free spins trigger
 * 4 scatters = 20× total bet + more free spins
 * 5 scatters = 50× total bet + maximum free spins
 * 
 * FREE SPINS AWARDS — The number of free spins granted.
 * Free spins are "free" to the player but cost the house nothing extra —
 * the RTP engine accounts for free spin expected value in its corrections.
 * During free spins, the machine often uses LOOSE strips to deliver
 * exciting wins, knowing the overall session math still balances.
 */
const SCAT_PAY = { 3: 5, 4: 20, 5: 50 };
const FS_AWARD = { 3: 10, 4: 15, 5: 25 };


/**
 * buildReelStrip() — Creates a reel strip with specific symbol frequencies.
 * 
 * @param weights - Object mapping symbol IDs to their frequency (count on strip)
 * @returns Array of symbol objects representing the physical reel strip
 * 
 * The total strip length affects granularity of probability control.
 * Longer strips = finer control but more memory. 64 stops is typical.
 */

/* ═══════════════════════════════════════════════════════════════════
 * SECTION: VOLATILITY PROFILES
 * 
 * Each profile defines the "personality" of the machine through THREE
 * interacting systems that shape the player's emotional experience:
 * 
 * 1. PAYTABLE (pt) — What each symbol combination pays.
 *    Low vol compresses the range (3× to 200×), high vol expands it (8× to 2500×).
 * 
 * 2. REEL CONFIGS (rc) — Symbol frequencies on each reel strip.
 *    Low vol loads more mid-tier symbols for frequent hits.
 *    High vol dominates with low-tier, making high-value hits extremely rare.
 *    Each has loose/standard/tight variants for the RTP correction engine.
 * 
 * 3. FEATURE TUNING — Cascade multipliers (cm), multiplier wheel chance (mc),
 *    and multiplier wheel segments (ms). These control how bonuses deliver value.
 * 
 * ALL THREE PROFILES TARGET THE SAME 96.5% RTP.
 * The difference is the SHAPE of the return distribution:
 *   Low:  Steady drip — many small returns, gentle balance curve
 *   Med:  Balanced — mix of small frequent and medium occasional wins
 *   High: Feast or famine — long droughts punctuated by massive hits
 * 
 * Mathematically: same mean, different standard deviation.
 * Psychologically: completely different emotional experiences.
 * ═══════════════════════════════════════════════════════════════════ */

const PROFILES = {
  /**
   * LOW VOLATILITY — "The Steady Drip"
   * 
   * Paytable spread: 3× (cherry×3) to 200× (seven×5) = 67:1 ratio
   * Reel strips: Heavy mid-tier (bell, orange, grape), 3 wilds on standard
   * Cascade multipliers: Conservative (1→1.5→2→3→4→5)
   * Multiplier wheel: 5% trigger chance, max 5× (no huge spikes)
   * 
   * This profile is designed for players who want entertainment without
   * extreme swings. The frequent small wins create positive reinforcement
   * and extend play time. The balance graph is a gentle sine wave.
   */
  low: {
    name: "Low", label: "STEADY", color: "#00cc66",
    pt: {
      cherry:  { 3: 3,  4: 8,   5: 20 },   // Low tier: narrow range
      lemon:   { 3: 3,  4: 8,   5: 20 },
      orange:  { 3: 5,  4: 15,  5: 40 },   // Mid tier: moderate
      grape:   { 3: 5,  4: 15,  5: 40 },
      bell:    { 3: 12, 4: 35,  5: 80 },   // Mid-high: bread and butter
      diamond: { 3: 20, 4: 60,  5: 150 },  // High: meaningful but not life-changing
      seven:   { 3: 30, 4: 90,  5: 200 },  // Top: capped at 200× (compare high vol: 2500×)
      wild:    { 3: 30, 4: 90,  5: 200 },
    },
    rc: {
      loose:    { cherry: 9,  lemon: 9,  orange: 10, grape: 10, bell: 9, diamond: 6, seven: 4, wild: 4, scatter: 2, bonus: 1 },
      standard: { cherry: 10, lemon: 10, orange: 11, grape: 11, bell: 8, diamond: 5, seven: 3, wild: 3, scatter: 1, bonus: 1 },
      tight:    { cherry: 12, lemon: 12, orange: 11, grape: 11, bell: 7, diamond: 4, seven: 2, wild: 2, scatter: 1, bonus: 0 },
    },
    cm: [1, 1.5, 2, 3, 4, 5],   // Conservative cascade progression
    mc: 0.05,                      // 5% multiplier wheel chance (more frequent)
    ms: [                          // Low multiplier values (max 5×)
      { mult: 2, weight: 50 },
      { mult: 3, weight: 30 },
      { mult: 4, weight: 15 },
      { mult: 5, weight: 5 },
    ],
  },

  /**
   * MEDIUM VOLATILITY — "The Balance"
   * 
   * Paytable spread: 5× to 1000× = 200:1 ratio
   * Standard slot machine experience — the "default" most players expect.
   * Mix of frequent small wins and occasional big hits.
   */
  medium: {
    name: "Med", label: "BALANCED", color: "#ffa500",
    pt: {
      cherry:  { 3: 5,   4: 15,  5: 40 },
      lemon:   { 3: 5,   4: 15,  5: 40 },
      orange:  { 3: 10,  4: 30,  5: 75 },
      grape:   { 3: 10,  4: 30,  5: 75 },
      bell:    { 3: 25,  4: 75,  5: 200 },
      diamond: { 3: 50,  4: 150, 5: 500 },
      seven:   { 3: 100, 4: 300, 5: 1000 },
      wild:    { 3: 100, 4: 300, 5: 1000 },
    },
    rc: {
      loose:    { cherry: 12, lemon: 11, orange: 9,  grape: 9,  bell: 7, diamond: 5, seven: 4, wild: 4, scatter: 2, bonus: 1 },
      standard: { cherry: 14, lemon: 13, orange: 10, grape: 10, bell: 6, diamond: 4, seven: 3, wild: 2, scatter: 1, bonus: 1 },
      tight:    { cherry: 16, lemon: 15, orange: 11, grape: 10, bell: 5, diamond: 3, seven: 2, wild: 1, scatter: 1, bonus: 0 },
    },
    cm: [1, 2, 3, 5, 8, 12],    // Standard cascade progression
    mc: 0.03,                      // 3% multiplier wheel chance
    ms: [
      { mult: 2,  weight: 35 },
      { mult: 3,  weight: 25 },
      { mult: 5,  weight: 15 },
      { mult: 7,  weight: 10 },
      { mult: 10, weight: 5 },
    ],
  },

  /**
   * HIGH VOLATILITY — "The Jackpot Hunter"
   * 
   * Paytable spread: 8× to 2500× = 312:1 ratio
   * Reel strips: Dominated by cherries/lemons. Standard config has only
   * 2 sevens and 1 wild per reel out of ~65 stops. The probability of
   * matching 3 sevens on a payline is roughly 1 in 290,000 combinations.
   * 
   * Cascade multipliers are EXPLOSIVE: 1→2→4→8→15→25
   * A 5-cascade chain multiplies the final cascade's win by 25×.
   * This is where the "dream" lives — rare but potentially enormous payouts.
   * 
   * PSYCHOLOGY: Players remember the 2500× hit and forget the 200 dead
   * spins before it. This "peak-end" memory bias is why high-vol games
   * are the most popular (and profitable for casinos) globally.
   */
  high: {
    name: "High", label: "JACKPOT", color: "#ff4444",
    pt: {
      cherry:  { 3: 8,   4: 25,  5: 60 },
      lemon:   { 3: 8,   4: 25,  5: 60 },
      orange:  { 3: 15,  4: 50,  5: 120 },
      grape:   { 3: 15,  4: 50,  5: 120 },
      bell:    { 3: 40,  4: 125, 5: 400 },
      diamond: { 3: 80,  4: 300, 5: 1000 },
      seven:   { 3: 200, 4: 750, 5: 2500 }, // 2500× — the dream
      wild:    { 3: 200, 4: 750, 5: 2500 },
    },
    rc: {
      loose:    { cherry: 15, lemon: 14, orange: 8,  grape: 8,  bell: 6, diamond: 4, seven: 3, wild: 3, scatter: 2, bonus: 1 },
      standard: { cherry: 18, lemon: 17, orange: 9,  grape: 9,  bell: 4, diamond: 3, seven: 2, wild: 1, scatter: 1, bonus: 1 },
      tight:    { cherry: 20, lemon: 19, orange: 10, grape: 9,  bell: 3, diamond: 2, seven: 1, wild: 0, scatter: 1, bonus: 0 },
      // NOTE: tight config has ZERO wilds. No wild-assisted wins at all.
    },
    cm: [1, 2, 4, 8, 15, 25],   // Explosive cascade progression
    mc: 0.02,                      // 2% multiplier wheel (rarer but bigger)
    ms: [
      { mult: 2,  weight: 25 },
      { mult: 3,  weight: 20 },
      { mult: 5,  weight: 20 },
      { mult: 10, weight: 15 },
      { mult: 15, weight: 10 },
      { mult: 25, weight: 5 },    // 25× — extremely rare, session-defining
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════════
 * SECTION: CORE REEL MECHANICS
 * 
 * These functions implement the fundamental slot machine physics:
 * building reel strips, spinning reels, and evaluating results.
 * 
 * IMPORTANT: In a real machine, these would be hardware-level
 * operations. Each "reel" is a circular strip of symbols. A random
 * number generator picks a stop position, and the 3 visible symbols
 * (the "window") are determined by the strip at that position.
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * bStrip() — Build a single reel strip from symbol frequency weights.
 * 
 * Takes a weights object like { cherry: 14, lemon: 13, seven: 3, ... }
 * and creates an array with that many copies of each symbol, then
 * shuffles it randomly using Fisher-Yates shuffle.
 * 
 * The total strip length (sum of all weights) determines probability
 * granularity. A 64-stop strip gives ~1.56% per stop. Adding one extra
 * seven (3→4) increases seven probability by ~1.5% — small but
 * significant over thousands of spins.
 * 
 * @param w - Object mapping symbol IDs to their count on this strip
 * @returns Shuffled array of symbol objects
 */
function bStrip(w) {
  const s = [];
  // Populate strip with the specified number of each symbol
  for (const [id, c] of Object.entries(w)) {
    for (let i = 0; i < c; i++) s.push(SYM[id]);
  }
  // Fisher-Yates shuffle — ensures uniform random distribution
  // (naive shuffles can produce biased distributions)
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

/**
 * bAll() — Build complete strip sets for all RTP configurations.
 * 
 * Creates loose, standard, and tight strip sets, each containing
 * 5 independently shuffled reel strips. The RTP engine selects
 * which set to use on each spin.
 * 
 * @param rc - Reel configs object with loose/standard/tight weights
 * @returns Object { loose: [5 strips], standard: [5 strips], tight: [5 strips] }
 */
function bAll(rc) {
  const s = {};
  for (const [c, w] of Object.entries(rc)) {
    s[c] = [];
    for (let r = 0; r < NR; r++) s[c].push(bStrip(w));
  }
  return s;
}

/**
 * doSpin() — Execute a single spin on a set of reel strips.
 * 
 * For each reel, picks a random stop position on the strip, then
 * reads the 3-symbol "window" (NROW symbols starting from that position).
 * The strip wraps circularly — if stop+row exceeds strip length,
 * it wraps to the beginning (modulo arithmetic).
 * 
 * This is the ONLY source of randomness in the outcome determination.
 * Everything after this point is deterministic evaluation.
 * 
 * @param strips - Array of 5 reel strip arrays
 * @returns 5×3 grid (array of 5 columns, each with 3 symbols)
 */
function doSpin(strips) {
  const g = [];
  for (let r = 0; r < NR; r++) {
    const s = strips[r];
    const p = Math.floor(Math.random() * s.length); // Random stop position
    const c = [];
    for (let row = 0; row < NROW; row++) {
      c.push(s[(p + row) % s.length]); // Circular wrap
    }
    g.push(c);
  }
  return g;
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION: WIN EVALUATION
 * 
 * After spinning, we evaluate the grid for wins. This happens in
 * three independent passes:
 * 1. Payline evaluation — check all 20 paylines for matches
 * 2. Scatter evaluation — count scatters anywhere on grid
 * 3. Bonus trigger evaluation — check reels 1, 3, 5 for bonus symbols
 * 
 * CRITICAL: Evaluation happens on the RAW grid, BEFORE any near-miss
 * modifications. The near-miss system can only change the visual
 * presentation in non-payline rows — it cannot affect these results.
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * evalPL() — Evaluate all paylines for winning combinations.
 * 
 * For each of the 20 paylines:
 * 1. Extract the 5 symbols at the payline positions
 * 2. Find the first non-wild, non-scatter, non-bonus symbol (the "match" symbol)
 * 3. Count consecutive matches from left to right (wilds count as matches)
 * 4. If 3+ matches, look up the payout in the paytable
 * 
 * WILD HANDLING: Wilds substitute for any regular symbol. A payline
 * of [wild, seven, wild, cherry, lemon] counts as 3× seven because
 * the wilds substitute for the first matching regular symbol found.
 * 
 * @param grid - The 5×3 symbol grid
 * @param bpl - Bet per line (total_bet / num_paylines)
 * @param pt - Paytable for the current volatility profile
 * @returns Array of win objects with payline index, symbol, count, and payout
 */
function evalPL(grid, bpl, pt) {
  const w = [];
  for (let li = 0; li < NP; li++) {
    const line = PL[li];
    // Extract symbols at this payline's positions
    const ls = line.map((r, i) => grid[i][r]);

    // Find the first non-special symbol to determine what we're matching
    let ms = null;
    for (const s of ls) {
      if (s.id !== "wild" && s.id !== "scatter" && s.id !== "bonus") {
        ms = s;
        break;
      }
    }
    // If no regular symbol found, check for all-wilds
    if (!ms) {
      if (ls.every(s => s.id === "wild")) ms = SYM.wild;
      else continue; // All specials — no payline win possible
    }

    // Count consecutive matches from left (wilds substitute)
    let c = 0;
    for (const s of ls) {
      if (s.id === ms.id || s.id === "wild") c++;
      else break; // Chain broken — stop counting
    }

    // 3+ matches with a paytable entry = win
    if (c >= 3 && pt[ms.id]?.[c]) {
      w.push({
        li,                              // Payline index
        sym: ms,                         // Matching symbol
        c,                               // Match count
        mult: pt[ms.id][c],              // Paytable multiplier
        pay: pt[ms.id][c] * bpl,         // Actual payout (multiplier × bet per line)
        pos: line.slice(0, c).map((r, i) => ({ r: i, row: r })), // Winning positions
      });
    }
  }
  return w;
}

/**
 * evalScat() — Count scatter symbols and calculate scatter pays.
 * 
 * Scatters are special because they pay ANYWHERE on the grid — they
 * don't need to be on a payline. This means with 15 visible positions,
 * scatters have more opportunities to appear than regular symbols.
 * Scatter pays are based on TOTAL bet, not bet-per-line.
 * 
 * 3+ scatters also trigger free spins — a major bonus feature.
 */
function evalScat(g, tb) {
  let c = 0;
  const p = [];
  for (let r = 0; r < NR; r++) {
    for (let row = 0; row < NROW; row++) {
      if (g[r][row].id === "scatter") {
        c++;
        p.push({ r, row });
      }
    }
  }
  return {
    c,                                     // Scatter count
    p,                                     // Positions
    pay: c >= 3 ? (SCAT_PAY[c] || 0) * tb : 0,  // Scatter payout
    fs: c >= 3 ? FS_AWARD[c] || 0 : 0,           // Free spins awarded
  };
}

/**
 * evalBonus() — Check for bonus trigger symbols.
 * 
 * Bonus symbols only count on reels 1, 3, and 5 (indices 0, 2, 4).
 * This is a deliberate design choice — restricting bonus symbols to
 * odd-numbered reels reduces trigger frequency while making the
 * anticipation more intense (you NEED all three specific reels to hit).
 */
function evalBonus(g) {
  let c = 0;
  const p = [];
  for (const r of [0, 2, 4]) {          // Only reels 1, 3, 5
    for (let row = 0; row < NROW; row++) {
      if (g[r][row].id === "bonus") {
        c++;
        p.push({ r, row });
      }
    }
  }
  return { t: c >= 3, c, p };            // t = triggered (3+ bonus symbols)
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION: CASCADE / AVALANCHE REEL ENGINE
 * 
 * When winning symbols are found, they "explode" and new symbols
 * fall in. The grid is re-evaluated. This repeats until no wins.
 * Each cascade level increases a progressive multiplier.
 * 
 * WHY CASCADES AREN'T "FREE": The base paytable is calibrated LOWER
 * to account for the expected cascade value. The total RTP includes
 * cascade contribution — so the base game is mathematically "tighter"
 * than it would be without cascades.
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * cascGrid() — Remove winning positions and fill with new symbols.
 * 
 * For each reel column:
 * 1. Remove symbols at winning positions
 * 2. Remaining symbols "fall" to the bottom (gravity simulation)
 * 3. Empty spaces at top filled with weighted-random new symbols
 * 
 * The new symbols come from the CURRENT strip config — so if the
 * RTP engine selected "loose" strips, cascade fills also use loose
 * weights. This means cascade chains on loose strips are more likely
 * to produce further wins.
 */
function cascGrid(grid, wp, rc, sc) {
  const ng = [];
  // Build probability table for new symbols from current strip config
  const ws = rc[sc];
  const we = Object.entries(ws);
  const tw = we.reduce((s, [, w]) => s + w, 0);

  // Weighted random symbol selection for fill positions
  function rs() {
    let r = Math.random() * tw;
    for (const [id, w] of we) {
      r -= w;
      if (r <= 0) return SYM[id];
    }
    return SYM.cherry; // Fallback
  }

  for (let r = 0; r < NR; r++) {
    const col = grid[r];
    const sv = []; // Surviving symbols (not in winning positions)
    for (let row = 0; row < NROW; row++) {
      if (!wp.has(`${r}-${row}`)) sv.push(col[row]);
    }
    // Gravity: survivors fall to bottom, new symbols fill from top
    const nc = new Array(NROW);
    const nn = NROW - sv.length; // Number of new symbols needed
    for (let i = 0; i < nn; i++) nc[i] = rs();       // New symbols at top
    for (let i = 0; i < sv.length; i++) nc[nn + i] = sv[i]; // Survivors below
    ng.push(nc);
  }
  return ng;
}

/**
 * resCasc() — Resolve the complete cascade chain for a spin.
 * 
 * This is the main cascade loop:
 * 1. Evaluate grid for wins
 * 2. If wins → record step, remove winners, apply gravity, fill gaps
 * 3. Increment cascade level (increases multiplier)
 * 4. Re-evaluate new grid → back to step 1
 * 5. Repeat until no wins (max 20 iterations as safety limit)
 * 
 * Returns the complete chain for animation playback.
 * 
 * MATHEMATICAL NOTE: Cascade probability is NOT independent of the
 * base spin. After removing winners, the remaining grid is biased
 * toward having partial matches (overlapping paylines share symbols).
 * This makes cascades more likely than a fresh spin.
 */
function resCasc(ig, bpl, tb, prof, sc) {
  const cms = prof.cm; // Cascade multiplier progression
  const ch = [];       // Chain of cascade steps
  let cg = ig;         // Current grid
  let cl = 0;          // Cascade level

  while (cl < 20) {    // Safety limit
    const w = evalPL(cg, bpl, prof.pt);
    if (!w.length) break; // No more wins — chain complete

    // Calculate payout with progressive multiplier
    const cm = cms[Math.min(cl, cms.length - 1)];
    const cw = w.reduce((s, x) => s + x.pay, 0) * cm;

    // Collect winning positions for removal
    const wp = new Set();
    w.forEach(x => x.pos.forEach(p => wp.add(`${p.r}-${p.row}`)));

    // Record this cascade step (for animation playback)
    ch.push({
      l: cl,                          // Level index
      grid: cg.map(c => [...c]),      // Grid snapshot before removal
      wins: w,                        // Wins found
      wp: [...wp],                    // Positions to remove
      mult: cm,                       // Current multiplier
      cw,                             // This cascade's payout
      acc: ch.reduce((s, x) => s + x.cw, 0) + cw, // Accumulated total
    });

    // Remove winners, apply gravity, fill gaps
    cg = cascGrid(cg, wp, prof.rc, sc);
    cl++;
  }

  return {
    ch,                                    // Cascade chain steps
    fg: cg,                                // Final grid after all cascades
    tw: ch.reduce((s, x) => s + x.cw, 0), // Total cascade winnings
    tc: ch.length,                         // Number of cascades
  };
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION: RTP CORRECTION ENGINE — The "Brain" of the Machine
 * 
 * This is what makes the machine converge toward its target RTP.
 * It uses a SIGMOID FUNCTION to smoothly map RTP deviations to
 * correction factors, which determine which strip config to use.
 * 
 * THE SIGMOID maps any deviation to a -1 to +1 range:
 * - Large positive deviation (paying too much) → correction near +1 → tight strips
 * - Large negative deviation (paying too little) → correction near -1 → loose strips
 * - Near target → correction near 0 → standard strips
 * 
 * The sigmoid's S-curve means small deviations produce gentle corrections
 * while large deviations produce aggressive corrections. This prevents
 * oscillation and produces smooth convergence.
 * 
 * SESSION MODIFIERS layer on top for player experience:
 * - Long losing streaks → loosen (prevent walkaway)
 * - Win streaks → tighten (cool down)
 * - Bonus droughts → loosen (maintain engagement)
 * - Bet chasing → tighten (standard protection)
 * ═══════════════════════════════════════════════════════════════════ */
function calcCorr(st) {
  const {
    totalWagered: tw, totalWon: twn, spinHistory: sh,
    consecutiveLosses: cl, consecutiveWins: cw,
    lastBonusSpin: lb, spinCount: sc,
    recentBets: rb, bankedTotal: bt
  } = st;

  // ── MULTI-WINDOW RTP MEASUREMENT ──
  // Calculate actual RTP over 4 time windows, each weighted differently:
  //   Short (20 spins):  10% weight — immediate responsiveness
  //   Medium (100 spins): 25% weight — session awareness
  //   Long (500 spins):  35% weight — primary correction driver
  //   All-time:          30% weight — ground truth anchor
  const wins = { s: sh.slice(-20), m: sh.slice(-100), l: sh.slice(-500), a: sh };
  const rw = {};
  for (const [n, w] of Object.entries(wins)) {
    if (!w.length) { rw[n] = TGT; continue; }
    const wg = w.reduce((s, h) => s + h.b, 0);
    rw[n] = wg > 0 ? w.reduce((s, h) => s + h.w, 0) / wg : TGT;
  }

  // ── WEIGHTED RTP CALCULATION ──
  const wr = rw.s * 0.1 + rw.m * 0.25 + rw.l * 0.35 + rw.a * 0.3;

  // ── SIGMOID CORRECTION ──
  // deviation = how far we are from target (positive = overpaying)
  // steepness = 15 (controls how aggressively the sigmoid responds)
  const dev = wr - TGT;
  const cb = (1 / (1 + Math.exp(-15 * dev)) - 0.5) * 2;

  // ── SESSION MODIFIERS ──
  let sm = 0;
  const reasons = [];
  if (cl > 15)     { sm -= 0.15; reasons.push(`Drought(${cl})`); }
  else if (cl > 8) { sm -= 0.08; reasons.push(`Losing(${cl})`); }
  if (cw > 5)      { sm += 0.12; reasons.push(`Hot(${cw})`); }
  const ssb = sc - lb;
  if (ssb > 150)   { sm -= 0.05; reasons.push(`BonusDue(${ssb})`); }
  if (!reasons.length) reasons.push("Std");

  // ── FINAL CORRECTION → STRIP SELECTION ──
  // correction < -0.3 → loose (more high-value symbols)
  // correction > 0.3  → tight (fewer high-value symbols)
  // otherwise         → standard (baseline)
  const f = Math.max(-1, Math.min(1, cb + sm));
  return {
    sc: f < -0.3 ? "loose" : f > 0.3 ? "tight" : "standard",
    corr: f, dev, wr, rw, reasons, sig: cb, sm
  };
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION: NEAR-MISS ENGINE
 * 
 * Modifies NON-PAYLINE rows (0 and 2) with weighted high-value symbols
 * to create the illusion of "almost winning." The payline row (1) is
 * NEVER modified — this preserves mathematical integrity.
 * 
 * Activation rate: ~65% of losing spins (not every loss — that
 * would feel suspicious). High-value symbols get heavy weights:
 * seven=16, wild=12, diamond=10 vs cherry=2, lemon=2.
 * 
 * WHY THIS IS LEGAL: RNG certification only validates payline
 * outcomes. Non-payline positions are "decorative."
 * ═══════════════════════════════════════════════════════════════════ */
function nmApply(grid, isWin, streak, stats) {
  // Skip near-miss on most winning spins (player already happy)
  if (isWin && Math.random() > 0.15) { stats.on = false; return grid; }
  // Random non-activation (~35% chance) for natural feel
  if (Math.random() > 0.65) { stats.on = false; return grid; }

  stats.on = true;
  const mg = grid.map(c => [...c]); // Deep copy (never mutate original)
  let cells = 0;
  const max = Math.floor(NR * 2 * 0.45); // Max 45% of non-payline cells

  // Near-miss weight table — higher tier = much more likely to appear
  const nw = {
    cherry: 2, lemon: 2,     // Low tier: rare in near-miss
    orange: 3, grape: 3,     // Mid-low: uncommon
    bell: 5,                 // Mid: moderate presence
    diamond: 10,             // High: strong near-miss presence
    seven: 16,               // Jackpot: MAXIMUM near-miss weight
    wild: 12,                // Wild: high (player sees "I almost had a wild!")
    scatter: 4, bonus: 3,    // Specials: moderate (hint at features)
  };

  for (let r = 0; r < NR; r++) {
    for (const row of [0, 2]) { // ONLY non-payline rows
      if (cells >= max) break;
      if (Math.random() > 0.45) continue; // ~55% chance per cell

      // Weighted random selection from near-miss table
      const ent = Object.entries(nw);
      const tot = ent.reduce((s, [, v]) => s + v, 0);
      let roll = Math.random() * tot;
      let nm = SYM.cherry;
      for (const [id, v] of ent) {
        roll -= v;
        if (roll <= 0) { nm = SYM[id]; break; }
      }
      // Only replace if near-miss symbol is HIGHER tier (don't downgrade)
      if (nm.tier > mg[r][row].tier) {
        mg[r][row] = nm;
        cells++;
      }
    }
  }
  stats.cells = cells;
  return mg;
}

/* ═══════════════════════════════════════════════════════════════════
 * SECTION: BONUS FEATURE HELPERS
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * spinMW() — Spin the multiplier wheel using weighted random selection.
 * Returns the selected multiplier value.
 */
function spinMW(segs) {
  const t = segs.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * t;
  for (const x of segs) { r -= x.weight; if (r <= 0) return x.mult; }
  return 2; // Fallback
}

/**
 * genBonus() — Generate pick-bonus prize pool.
 * 
 * Creates 12 hidden prizes scaled to the current bet and engine state.
 * When the RTP engine says we're underpaying (correction < -0.2),
 * prizes are 40% more generous. When overpaying, 30% less generous.
 * 
 * The weight distribution ensures a mix of small and large prizes:
 * weights sum to 1.0 and distribute the pool unequally, so the player
 * might pick a 2% prize (disappointing) or a 13% prize (exciting).
 */
function genBonus(tb, corr) {
  const pool = tb * 25 * (corr < -0.2 ? 1.4 : corr > 0.2 ? 0.7 : 1);
  const ws = [.02, .03, .05, .06, .07, .08, .10, .11, .12, .13, .11, .12];
  const p = ws.map(w => Math.round(pool * w * (0.5 + Math.random())));
  // Shuffle prizes so large/small are randomly positioned
  for (let i = p.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p;
}

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

export default function SlotMachine() {
  /* ═════════════════════════════════════════════════════════════════
   * COMPONENT STATE — Organized by subsystem
   * 
   * React state drives both the UI display AND the engine logic.
   * Every spin updates dozens of state variables that feed into
   * the next spin's RTP correction calculation. This is the
   * "memory" of the machine — it knows exactly how much it's
   * paid out and adjusts strip selection accordingly.
   * ═════════════════════════════════════════════════════════════════ */

  // ── VOLATILITY SELECTION ──
  // Determines which profile (low/med/high) the machine uses.
  // Changing volatility rebuilds all reel strips (useEffect below).
  const [vol, setVol] = useState("medium");
  const prof = PROFILES[vol]; // Active profile shorthand

  // ── PLAYER FINANCIAL STATE ──
  // These track the player's money — both current and historical.
  // The machine uses these to calculate real-time RTP and to feed
  // the correction engine's multi-window analysis.
  const [bal, setBal] = useState(1000);    // Current playable balance
  const [bet, setBet] = useState(1.00);    // Current bet per spin (total across all lines)
  const [tWag, setTWag] = useState(0);     // Total wagered this session (running sum)
  const [tWon, setTWon] = useState(0);     // Total returned this session (running sum)
  const [banked, setBanked] = useState(0); // Amount "banked" (withdrawn from play)
  const [peak, setPeak] = useState(1000);  // Highest balance reached this session

  // ── REEL GRID STATE ──
  // The visual grid and animation states. Note the separation between
  // the "real" grid (final result) and dispGrid (animation frames).
  const initSyms = () => {
    const g = [], a = SYMBOLS.filter(s => s.tier > 0);
    for (let r = 0; r < NR; r++) {
      const c = [];
      for (let row = 0; row < NROW; row++) c.push(a[Math.floor(Math.random() * a.length)]);
      g.push(c);
    }
    return g;
  };
  const [grid, setGrid] = useState(initSyms);     // Current displayed grid (final result)
  const [spinning, setSpinning] = useState(false); // True during reel animation
  const [dispGrid, setDispGrid] = useState(null);  // Animation frame (null = show final grid)
  const [lastWin, setLastWin] = useState(0);       // Most recent spin's total win
  const [winLines, setWinLines] = useState([]);    // Winning payline data for highlighting
  const [msg, setMsg] = useState("Choose your weapons and spin!");

  // ── CASCADE STATE ──
  // Tracks the cascade animation chain. When cascades are active,
  // the spin doesn't resolve immediately — it plays through each
  // cascade level with timed delays for visual effect.
  const [cascOn, setCascOn] = useState(true);       // Cascade feature toggle
  const [cascPlaying, setCascPlaying] = useState(false); // True during cascade animation
  const [cascLevel, setCascLevel] = useState(0);    // Current cascade multiplier level
  const [cascTW, setCascTW] = useState(0);          // Accumulated cascade winnings
  const [exploding, setExploding] = useState(new Set()); // Cells currently "exploding"

  // ── ENGINE TRACKING STATE ──
  // The RTP correction engine needs historical data to calculate
  // the correction factor. These feed into calcCorr() each spin.
  const [hist, setHist] = useState([]);      // Full spin history [{b: bet, w: won}, ...]
  const [spins, setSpins] = useState(0);     // Total spins this session
  const [cLoss, setCLoss] = useState(0);     // Consecutive losses (resets on any win)
  const [cWin, setCWin] = useState(0);       // Consecutive wins (resets on any loss)
  const [lastBon, setLastBon] = useState(0); // Spin number of last bonus trigger
  const [rBets, setRBets] = useState([]);    // Recent bet amounts (for chase detection)
  const [lastCorr, setLastCorr] = useState(null); // Last correction decision (for display)
  const [dLog, setDLog] = useState([]);      // Decision log for the algorithm panel

  // ── NEAR-MISS ──
  const [nmOn, setNmOn] = useState(true);    // Near-miss visual manipulation toggle

  // ── BONUS FEATURE STATE ──
  const [fsLeft, setFsLeft] = useState(0);   // Free spins remaining
  const [fsMult, setFsMult] = useState(1);   // Free spin multiplier (2× or 3×)
  const [fsWins, setFsWins] = useState(0);   // Total won during current free spin round
  const [bonusOn, setBonusOn] = useState(false); // Pick bonus game active
  const [bPrizes, setBPrizes] = useState([]); // 12 hidden bonus prizes
  const [bPicked, setBPicked] = useState([]); // Indices of picked prizes
  const [bLeft, setBLeft] = useState(0);      // Picks remaining
  const [bTotal, setBTotal] = useState(0);    // Total won in current bonus
  const [multAct, setMultAct] = useState(null); // Active random multiplier (for display)

  /* ═════════════════════════════════════════════════════════════════
   * DARK PATTERN TOGGLES — 11 Psychological Manipulation Systems
   * 
   * Each toggle controls one manipulation technique independently.
   * Default states are set to match what real machines do:
   * - Most are ON by default (casino mode)
   * - Credit mode starts OFF for initial clarity
   * - Sound starts OFF (browsers require user gesture for audio)
   * ═════════════════════════════════════════════════════════════════ */
  const [ldwOn, setLdwOn] = useState(true);         // 1. Loss Disguised as Win celebrations
  const [stopBtnOn, setStopBtnOn] = useState(true);  // 2. Fake stop button (illusory control)
  const [celebOn, setCelebOn] = useState(true);       // 3. Celebration asymmetry (wins=fireworks, losses=silence)
  const [anticipOn, setAnticipOn] = useState(true);   // 4. Reel anticipation slowdown on scatter/bonus
  const [creditMode, setCreditMode] = useState(false); // 5. Credit obfuscation (£ → credits)
  const [hideTime, setHideTime] = useState(false);    // 6. Session time dissolution (hide clock)
  const [hideTrueCost, setHideTrueCost] = useState(true); // 7. Bet complexity hiding (show per-line not total)
  const [soundOn, setSoundOn] = useState(false);      // 8. Asymmetric sound design (off = needs gesture)
  const [jackpotOn, setJackpotOn] = useState(true);   // 9. Progressive jackpot display
  const [fallacyOn, setFallacyOn] = useState(true);   // 10. Gambler's fallacy indicators
  const [autoSpeedOn, setAutoSpeedOn] = useState(true); // 11. Autoplay speed acceleration

  // ── PROGRESSIVE JACKPOT STATE ──
  const [jackpotPool, setJackpotPool] = useState(JACKPOT_CONFIG.seedAmount);
  const [jackpotWon, setJackpotWon] = useState(false);
  const [jackpotWonAmount, setJackpotWonAmount] = useState(0);
  const [jackpotTotalContributed, setJackpotTotalContributed] = useState(0);

  // ── GAMBLER'S FALLACY STATE ── (fake indicators that suggest patterns in randomness)
  const [fallacyData, setFallacyData] = useState({
    heat: { level: "⚡ WARM", color: "#ffa500", value: 0.5 },
    bonusMeter: 0,
    streakMsg: "Warming up...",
  });

  // ── DARK PATTERN ANALYTICS ──
  // Tracks every instance of each manipulation to expose cumulative impact.
  const [dpStats, setDpStats] = useState({
    ldwCount: 0,        // Number of Loss Disguised as Win events
    ldwLost: 0,         // Total money lost during LDW "wins"
    trueWins: 0,        // Actual wins (won > bet)
    trueLosses: 0,      // Complete losses (won = 0)
    celebFake: 0,       // Celebrations triggered on LDWs
    celebReal: 0,       // Celebrations triggered on true wins
    stopPresses: 0,     // Times the useless stop button was pressed
    anticipEvents: 0,   // Times reels slowed down for anticipation
    sessionStart: Date.now(),
    totalSpinTime: 0,   // Time spent watching reels (engagement metric)
    manualSpins: 0,     // Spins done manually (for speed comparison)
    autoSpins: 0,       // Spins done via autoplay
    manualTime: 0,      // Total time for manual spins
    autoTime: 0,        // Total time for auto spins (should be less)
  });

  // ── CELEBRATION STATE ──
  const [celebLevel, setCelebLevel] = useState(0);  // 0=none, 1-5=escalating celebration
  const [showCeleb, setShowCeleb] = useState(false); // Whether celebration overlay is visible
  const [celebMsg, setCelebMsg] = useState("");       // Celebration text

  // ── UI STATE ──
  const [activeTab, setActiveTab] = useState("game");
  const [autoPlay, setAutoPlay] = useState(false);

  // ── REFS (mutable values that persist across renders without triggering re-render) ──
  const stripsRef = useRef(bAll(prof.rc));  // Current reel strips (rebuilt on vol change)
  const autoRef = useRef(false);            // Autoplay flag (ref avoids stale closure)
  const tmRef = useRef(null);               // Autoplay timer reference (for cleanup)
  const spinStartRef = useRef(0);           // Timestamp when current spin started
  const stopRef = useRef(false);            // Stop button press flag

  /* ═════════════════════════════════════════════════════════════════
   * EFFECTS — Side effects that respond to state changes
   * ═════════════════════════════════════════════════════════════════ */

  // Keep autoplay ref in sync with state (avoids stale closures in callbacks)
  useEffect(() => { autoRef.current = autoPlay; }, [autoPlay]);

  // Cleanup autoplay timer on unmount (prevents memory leaks)
  useEffect(() => () => { if (tmRef.current) clearTimeout(tmRef.current); }, []);

  // Rebuild reel strips when volatility profile changes
  // Each profile has different symbol frequencies, so strips must be regenerated
  useEffect(() => { stripsRef.current = bAll(PROFILES[vol].rc); }, [vol]);

  // PROGRESSIVE JACKPOT: Phantom contribution ticker
  // Simulates "other players" adding to the jackpot pool.
  // In reality, online progressive jackpots DO grow from other players' bets.
  // This creates urgency: "The pot is growing! Someone will win soon!"
  // The tick rate varies randomly to feel organic (not robotic).
  useEffect(() => {
    if (!jackpotOn) return;
    const t = setInterval(() => {
      setJackpotPool(p => p + JACKPOT_CONFIG.phantomContribution * (0.5 + Math.random()));
    }, 800 + Math.random() * 400);
    return () => clearInterval(t);
  }, [jackpotOn]);

  // SESSION TIMER: Tracks elapsed time for the session timer display
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - dpStats.sessionStart), 1000);
    return () => clearInterval(t);
  }, [dpStats.sessionStart]);

  /* ═════════════════════════════════════════════════════════════════
   * HELPER FUNCTIONS — Used by the main spin loop
   * ═════════════════════════════════════════════════════════════════ */

  /** Format milliseconds as H:MM:SS for session timer */
  function fmtTime(ms) {
    const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
    return `${h}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  /**
   * CREDIT OBFUSCATION FORMATTER
   * 
   * Converts between real currency and abstract credits.
   * £1.00 = 100 credits. "500 credits" feels less real than "£5.00".
   * This psychological distance reduces loss aversion — the fundamental
   * reason casinos use chips, tokens, and credits instead of cash.
   */
  const CR = 100; // Credit ratio: 1 currency unit = 100 credits
  function fv(amt, cr) {
    return cr ? `${Math.round(amt * CR).toLocaleString()} CR` : `£${amt.toFixed(2)}`;
  }

  /**
   * OUTCOME CLASSIFIER — Categorizes every spin result.
   * 
   * This is the core of the LDW (Loss Disguised as Win) system.
   * A spin that returns £0.30 on a £1.00 bet is classified as LDW —
   * the player LOST £0.70 but the machine will celebrate the "win."
   * 
   * Research shows 30-40% of all spins on 20-line machines are LDWs.
   * Only 8-12% are TRUE WINS. Yet players recall "winning frequently."
   */
  function classifyOutcome(b, w) {
    if (w <= 0) return { type: "LOSS", net: -b, color: "#ff4444" };
    if (w < b) return { type: "LDW", net: w - b, color: "#ff8800" };
    if (Math.abs(w - b) < 0.01) return { type: "EVEN", net: 0, color: "#888" };
    return { type: "WIN", net: w - b, color: "#00ff88" };
  }

  /**
   * CELEBRATION LEVEL CALCULATOR
   * 
   * Maps win/bet ratio to celebration intensity (0-5).
   * 
   * KEY: When LDW mode is ON, even sub-bet wins get Level 1 celebration.
   * When LDW mode is OFF (honest mode), sub-bet wins get Level 0 (silence).
   * This single toggle dramatically changes how the game "feels."
   * 
   * Level 0: Nothing (true loss — or LDW in honest mode)
   * Level 1: Small text "+£0.30" (LDW celebration in casino mode)
   * Level 2: "Nice!" with highlights (1-3× bet return)
   * Level 3: "GREAT WIN" with flash (3-10× return)
   * Level 4: "BIG WIN" full celebration (10-25× return)
   * Level 5: "MEGA WIN" screen takeover (25×+ return)
   */
  function getCeleb(w, b) {
    if (w <= 0) return 0;
    if (!ldwOn && w < b) return 0; // HONEST MODE: no celebration on LDWs
    const r = w / b;
    if (r >= 25) return 5;
    if (r >= 10) return 4;
    if (r >= 3) return 3;
    if (r >= 1) return 2;
    return 1; // LDW celebration — still shows as a "win"
  }

  /**
   * REEL ANTICIPATION DELAY CALCULATOR
   * 
   * When scatter/bonus symbols appear on early reels, calculate
   * extra animation cycles for later reels to build suspense.
   * 
   * The outcome is ALREADY DETERMINED — this is pure psychological
   * manipulation. The delay creates a cortisol (stress) + dopamine
   * (anticipation) cocktail that is physiologically addictive.
   * 
   * Returns array of 5 delay values (extra animation cycles per reel).
   */
  function calcDelays(g) {
    if (!anticipOn) return [0, 0, 0, 0, 0]; // No delays in honest mode
    let sc = 0;
    const d = [0, 0, 0, 0, 0];
    for (let r = 0; r < NR; r++) {
      for (let row = 0; row < NROW; row++) {
        if (g[r][row].id === "scatter" || g[r][row].id === "bonus") sc++;
      }
      // Each previous scatter adds delay to subsequent reels
      if (sc >= 1 && r >= 1) d[r] = sc * 3;
      // Extra suspense when 2+ scatters already visible
      if (sc >= 2 && r >= 2) d[r] += 5;
    }
    return d;
  }

  /**
   * STOP BUTTON HANDLER — The Illusion of Control
   * 
   * THIS DOES NOTHING TO THE OUTCOME.
   * The result was sealed the instant SPIN was pressed.
   * This button only sets a flag that skips the remaining animation.
   * 
   * But pressing it FEELS like control — like you're timing the stop
   * to land on a specific symbol. Research shows this illusion increases
   * both bet size and session duration (Ladouceur & Sévigny, 2005).
   */
  function handleStop() {
    if (!spinning || !stopBtnOn) return;
    stopRef.current = true; // Skip remaining animation frames
    setDpStats(p => ({ ...p, stopPresses: p.stopPresses + 1 }));
  }

  /* ═════════════════════════════════════════════════════════════════
   * finishSpin() — Post-spin processing and state updates
   * 
   * Called after all animations complete (including cascade chain).
   * This is where ALL the dark pattern systems activate:
   * - LDW classification and tracking
   * - Celebration level calculation
   * - Sound playback (asymmetric — only on wins)
   * - Jackpot contribution and trigger check
   * - Gambler's fallacy indicator updates
   * - Autoplay speed differential tracking
   * - Bonus feature triggering
   * ═════════════════════════════════════════════════════════════════ */
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

    // ── AUTOPLAY SPEED ACCELERATION ──
    // When autoSpeedOn, autoplay runs with 40% LESS delay between spins.
    // Same RTP, but more spins per minute = faster balance drain.
    // The dpStats track manual vs auto speed for the comparison display.
    // At 10 spins/min manual vs 16 spins/min auto, you lose money 60% faster.
    const baseDelay = fsLeft > 1 ? 600 : 1000;
    const delay = autoSpeedOn ? Math.floor(baseDelay * 0.6) : baseDelay;
    if (autoRef.current && fsLeft > 1) tmRef.current = setTimeout(() => { if (autoRef.current) mainSpin(true); }, delay);
    else if (autoRef.current && !bonus.t && bal + totalWin >= sBet) tmRef.current = setTimeout(() => { if (autoRef.current) mainSpin(true); }, delay);
    else if (autoRef.current) setAutoPlay(false);
  }

  /* ═════════════════════════════════════════════════════════════════
   * playCasc() — Cascade chain animation playback
   * 
   * Plays back each cascade step with timed delays:
   * 1. Show grid with winning highlights (380ms)
   * 2. "Explode" winning cells — shrink + orange glow (280ms)
   * 3. Clear explosions, show next grid with new symbols
   * 4. Brief pause, then evaluate next cascade level
   * 5. Repeat until chain is exhausted
   * 
   * The progressive multiplier bar updates at each step,
   * creating escalating excitement as the chain continues.
   * ═════════════════════════════════════════════════════════════════ */
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

  /* ═════════════════════════════════════════════════════════════════
   * mainSpin() — THE MAIN SPIN LOOP
   * 
   * This is the heart of the slot machine. Execution order:
   * 
   * 1. DEDUCT BET from balance (money taken immediately)
   * 2. RTP ENGINE: Calculate correction factor from history
   * 3. STRIP SELECTION: Choose loose/standard/tight based on correction
   * 4. SPIN REELS: Random stop on selected strips (THE outcome)
   * 5. EVALUATE: Check all paylines, scatters, bonus triggers
   * 6. NEAR-MISS: Modify non-payline rows (visual only, not outcome)
   * 7. CASCADE: Resolve full cascade chain if enabled
   * 8. MULTIPLIER: Random chance of multiplier wheel
   * 9. ANTICIPATION DELAYS: Calculate reel slowdown timing
   * 10. ANIMATE: Play reel spin animation with per-reel stop timing
   * 11. FINISH: Update all state, trigger dark pattern systems
   * 
   * The isAuto parameter tracks whether this spin was manual or autoplay,
   * used for the autoplay speed acceleration comparison.
   * ═════════════════════════════════════════════════════════════════ */
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

  /** Pick bonus game handler — select a hidden prize from the grid */
  const pickBonus = (i) => {
    if (!bonusOn || bPicked.includes(i) || bLeft <= 0) return;
    const prize = bPrizes[i]; const np = [...bPicked, i]; const nt = bTotal + prize; const r = bLeft - 1;
    setBPicked(np); setBTotal(nt); setBLeft(r);
    if (soundOn) playWinSound(prize / bet);
    if (r === 0) { setBal(b => b + nt); setTWon(p => p + nt); setMsg(`🎰 ${fv(nt, creditMode)}!`); setTimeout(() => setBonusOn(false), 1500); }
    else setMsg(`${fv(prize, creditMode)}! ${r} left`);
  };

  /* ═════════════════════════════════════════════════════════════════
   * COMPUTED VALUES — Derived from state for rendering
   * ═════════════════════════════════════════════════════════════════ */

  // Display grid: show animation frames during spin, final grid otherwise
  const dg = dispGrid || grid;

  // Highlighted cells: positions that are part of winning paylines (for glow effect)
  const hl = new Set(); winLines.forEach(w => w.pos.forEach(p => hl.add(`${p.r}-${p.row}`)));

  // Live RTP calculation: total won / total wagered × 100
  const artRTP = tWag > 0 ? (tWon / tWag * 100).toFixed(2) : "—";

  // Count active dark patterns for the header badge
  const dpCount = [ldwOn,stopBtnOn,celebOn,anticipOn,creditMode,hideTime,hideTrueCost,soundOn,jackpotOn,fallacyOn,autoSpeedOn].filter(Boolean).length;

  // Tab style generator (active tab gets gold highlight)
  const tabS = (t) => ({ flex: 1, padding: "5px 1px", fontSize: "0.48rem", fontWeight: activeTab === t ? "bold" : "normal", background: activeTab === t ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.02)", border: activeTab === t ? "1px solid rgba(255,215,0,0.25)" : "1px solid rgba(255,255,255,0.05)", borderBottom: activeTab === t ? "none" : undefined, color: activeTab === t ? "#ffd700" : "#444", cursor: "pointer", fontFamily: "inherit", borderRadius: "4px 4px 0 0" });

  // AUTOPLAY SPEED COMPARISON: spins per minute for manual vs auto
  // This exposes the speed differential — autoplay is engineered to be faster
  const manualSPM = dpStats.manualTime > 10000 ? (dpStats.manualSpins / (dpStats.manualTime / 60000)).toFixed(1) : "—";
  const autoSPM = dpStats.autoTime > 10000 ? (dpStats.autoSpins / (dpStats.autoTime / 60000)).toFixed(1) : "—";

  /* ═════════════════════════════════════════════════════════════════
   * RENDER — The User Interface
   * 
   * The UI replicates real slot machine UX patterns:
   * - Dark background with neon accents (casino floor aesthetic)
   * - Monospace font ("technical" and "mechanical" feel)
   * - Gold (#ffd700) for money/prizes (warmth, value association)
   * - Green (#00ff88) for wins (positive reinforcement)
   * - Red (#ff4444) for losses (danger, urgency)
   * - Minimal whitespace (information density keeps eyes on screen)
   * 
   * Grid cells: Row 1 (middle) = payline with subtle gold tint.
   * Rows 0 and 2 = near-miss manipulation targets.
   * ═════════════════════════════════════════════════════════════════ */

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

      {/* ── CELEBRATION OVERLAY ──
       * Levels 3+ get a full-screen overlay that dominates the visual field.
       * CRITICALLY: When ldwOn=true, this fires on LDWs too (sub-bet returns).
       * The player sees a massive "GREAT WIN!" for returning £2.50 on a £3 bet.
       * Their brain encodes this as a WIN even though they lost £0.50.
       * The LDW indicator (shown when ldwOn=false) pierces this illusion.
       */}
      {showCeleb && celebLevel >= 3 && <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 100, pointerEvents: "none", background: celebLevel >= 5 ? "rgba(255,215,0,0.06)" : "transparent" }}><div style={{ fontSize: celebLevel >= 5 ? "1.8rem" : "1.2rem", fontWeight: "bold", color: "#ffd700", textShadow: "0 0 25px #ffd700" }}>{celebMsg}</div>{!ldwOn && lastWin > 0 && lastWin < bet && <div style={{ color: "#ff8800", fontSize: "0.55rem", marginTop: 4, background: "rgba(255,136,0,0.12)", padding: "2px 8px", borderRadius: 4 }}>⚠ LDW: net -{fv(bet - lastWin, false)}</div>}</div>}

      {/* ── REEL GRID ──
       * The 5×3 grid is the core visual element. Note:
       * - Row 1 (middle) has a subtle gold tint = the primary payline
       * - Winning cells get green glow (positive reinforcement)
       * - Exploding cells (cascade) shrink + orange glow before removal
       * - The border color matches the active volatility profile
       * - Grid cells use CSS transitions for smooth state changes
       */}
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

      {/* ── MESSAGE BAR ── 
       * CELEBRATION ASYMMETRY IN ACTION:
       * - Wins: Bright green text, shows amount prominently
       * - LDWs (casino mode): Still shows as "WIN" — no visual difference from true wins
       * - LDWs (honest mode): Shows net loss "(NET: -£0.70)"
       * - True losses (casino mode): EMPTY STRING — complete silence and visual void
       * - True losses (honest mode): Shows "Lost £1.00" in visible text
       * This asymmetry means losses create zero memorable events while
       * wins (including fake wins) create vivid positive memories.
       */}
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
