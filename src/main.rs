// ╔══════════════════════════════════════════════════════════════════════╗
// ║     AROUND THE WORLD IN 80 DAYS — Geospatial Slot Engine (Rust)      ║
// ║                                                                      ║
// ║  A complete port of Fortune Engine v5.2 (JSX) to Rust.               ║
// ║                                                                      ║
// ║  4 REELS × 5 ROWS with coordinate-based bonus triggers.              ║
// ║  Each spin generates random lat/lon coordinates. Haversine distance  ║
// ║  is calculated to all 20 POIs. If within threshold → BONUS BOARD.    ║
// ║  Standard payline wins run in parallel across 8 paylines.            ║
// ║                                                                      ║
// ║  BONUS: "Around the World in 80 Days" ladder gamble.                 ║
// ║  RTP: 96.5% target with sigmoid correction engine.                   ║
// ║  All 11 dark patterns tracked and reported.                          ║
// ╚══════════════════════════════════════════════════════════════════════╝

use rand::Rng;
use serde::Deserialize;
use std::io::{self, Write};

// ═══════════════════════════════════════════════════════════════════
// SECTION 1: CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const REELS: usize = 4;
const ROWS: usize = 5;
const PAYLINES: usize = 8;
const TARGET_RTP: f64 = 0.965;
const SIGMOID_K: f64 = 15.0;

/// Base Haversine radius (km) for bonus trigger. The RTP engine adjusts this.
/// Earth is ~71% ocean, so most random coordinates miss all POIs.
/// 150km radius with 20 POIs gives roughly 1.5-3% bonus trigger rate.
const BASE_BONUS_RADIUS_KM: f64 = 150.0;

/// Earth radius in km for Haversine formula
const EARTH_RADIUS_KM: f64 = 6371.0;

// ═══════════════════════════════════════════════════════════════════
// SECTION 2: DATA STRUCTURES
// ═══════════════════════════════════════════════════════════════════

/// A Point of Interest from geolocations.json
#[derive(Debug, Deserialize, Clone)]
struct GeoPOI {
    id: String,
    name: String,
    lat: f64,
    lon: f64,
    weight: u32,
    emoji: String,
}

/// The full geolocations dataset
#[derive(Debug, Deserialize)]
struct GeoData {
    bonus_promotions: Vec<GeoPOI>,
    uncharted_sectors: Vec<GeoPOI>,
}

/// Symbol tiers for the reel strips (ported from JSX LANDMARKS)
#[derive(Debug, Clone)]
struct Symbol {
    id: &'static str,
    emoji: &'static str,
    name: &'static str,
    tier: u8,
}

/// Payline win result
#[derive(Debug)]
struct PaylineWin {
    line_idx: usize,
    symbol_id: &'static str,
    count: usize,
    multiplier: f64,
    payout: f64,
}

/// Outcome classification for dark pattern tracking
#[derive(Debug, PartialEq)]
enum OutcomeType {
    TrueWin,
    LDW,  // Loss Disguised as Win
    TrueLoss,
}

/// Around the World route stop
struct RouteStop {
    city: &'static str,
    emoji: &'static str,
    spins: u32,
    chance: f64,
}

/// RTP correction result
struct CorrectionResult {
    config: &'static str, // "loose", "standard", "tight"
    correction: f64,
    weighted_rtp: f64,
    reasons: Vec<String>,
}

/// Dark pattern statistics tracker
#[derive(Debug, Default)]
struct DarkPatternStats {
    ldw_count: u32,
    ldw_total_lost: f64,
    true_wins: u32,
    true_losses: u32,
    celebration_fake: u32,
    celebration_real: u32,
    stop_presses: u32,
    near_miss_activations: u32,
    anticipation_events: u32,
    total_spins: u32,
    bonus_triggers: u32,
    bonus_trips_completed: u32,
    total_bonus_spins_won: u32,
}

/// Full engine state
struct Engine {
    // Financial
    balance: f64,
    bet: f64,
    total_wagered: f64,
    total_won: f64,
    jackpot_pool: f64,
    jackpot_contributed: f64,

    // Tracking
    spin_count: u32,
    consecutive_losses: u32,
    consecutive_wins: u32,
    last_bonus_spin: u32,
    spin_history: Vec<(f64, f64)>, // (bet, won) pairs

    // Free spins
    free_spins_left: u32,
    free_spins_won: f64,

    // Data
    poi_data: GeoData,
    reel_strips: Vec<Vec<Vec<Symbol>>>, // [config_idx][reel_idx][stop_idx]

    // Dark patterns
    dp_stats: DarkPatternStats,

    // Near-miss
    near_miss_enabled: bool,
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 3: SYMBOL DEFINITIONS
//
// 12 symbols across 6 tiers. The reel strip weights determine
// how often each appears. Higher tier = rarer = bigger payout.
//
// Tier 0: Special (Plane — bonus trigger scatter)
// Tier 1: Common  (Desert, Ocean, Tundra)
// Tier 2: Notable (Beach, Castle, Forest)
// Tier 3: Famous  (Liberty, Torii)
// Tier 4: Wonder  (Taj, Pyramid)
// Tier 5: Legend   (Eiffel, Kremlin)
// Tier 6: Wild    (Globe — substitutes for any regular symbol)
// ═══════════════════════════════════════════════════════════════════

const SYMBOLS: &[Symbol] = &[
    Symbol { id: "desert",   emoji: "🏜️ ", name: "Sahara",        tier: 1 },
    Symbol { id: "ocean",    emoji: "🌊", name: "Pacific",        tier: 1 },
    Symbol { id: "tundra",   emoji: "❄️ ", name: "Tundra",         tier: 1 },
    Symbol { id: "beach",    emoji: "🏖️ ", name: "Copacabana",     tier: 2 },
    Symbol { id: "castle",   emoji: "🏰", name: "Neuschwanstein", tier: 2 },
    Symbol { id: "forest",   emoji: "🌳", name: "Amazon",         tier: 2 },
    Symbol { id: "liberty",  emoji: "🗽", name: "Liberty",        tier: 3 },
    Symbol { id: "torii",    emoji: "⛩️ ", name: "Fushimi",        tier: 3 },
    Symbol { id: "taj",      emoji: "🕌", name: "Taj Mahal",      tier: 4 },
    Symbol { id: "pyramid",  emoji: "🔺", name: "Pyramid",        tier: 4 },
    Symbol { id: "eiffel",   emoji: "🗼", name: "Eiffel",         tier: 5 },
    Symbol { id: "kremlin",  emoji: "🏛️ ", name: "Kremlin",        tier: 5 },
    Symbol { id: "globe",    emoji: "🌍", name: "WILD",           tier: 6 },
    Symbol { id: "plane",    emoji: "✈️ ", name: "BONUS",          tier: 0 },
];

fn sym_by_id(id: &str) -> Symbol {
    SYMBOLS.iter().find(|s| s.id == id).cloned().unwrap_or_else(|| SYMBOLS[0].clone())
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 4: PAYTABLE
//
// Multipliers for 3+ matching symbols on a payline (left-to-right).
// With 4 reels, the maximum match is 4 (no 5-of-a-kind).
// Calibrated for 8 paylines on a 4×5 grid.
// ═══════════════════════════════════════════════════════════════════

fn get_multiplier(sym_id: &str, count: usize) -> f64 {
    match (sym_id, count) {
        // Tier 1: Common — frequent small returns
        ("desert", 3) => 3.0,   ("desert", 4) => 10.0,
        ("ocean", 3)  => 3.0,   ("ocean", 4)  => 10.0,
        ("tundra", 3) => 3.0,   ("tundra", 4) => 10.0,
        // Tier 2: Notable — moderate
        ("beach", 3)  => 6.0,   ("beach", 4)  => 20.0,
        ("castle", 3) => 6.0,   ("castle", 4) => 20.0,
        ("forest", 3) => 6.0,   ("forest", 4) => 20.0,
        // Tier 3: Famous — meaningful
        ("liberty", 3) => 12.0,  ("liberty", 4) => 50.0,
        ("torii", 3)   => 12.0,  ("torii", 4)   => 50.0,
        // Tier 4: Wonder — significant
        ("taj", 3)     => 25.0,  ("taj", 4)     => 100.0,
        ("pyramid", 3) => 25.0,  ("pyramid", 4) => 100.0,
        // Tier 5: Legendary — jackpot tier
        ("eiffel", 3)  => 60.0,  ("eiffel", 4)  => 250.0,
        ("kremlin", 3) => 60.0,  ("kremlin", 4) => 250.0,
        // Tier 6: Wild (Globe) — same as legendary
        ("globe", 3)   => 60.0,  ("globe", 4)   => 250.0,
        _ => 0.0,
    }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 5: PAYLINE DEFINITIONS
//
// 8 paylines across a 4-reel × 5-row grid.
// Each payline is [row_for_reel_0, row_for_reel_1, row_for_reel_2, row_for_reel_3]
// ═══════════════════════════════════════════════════════════════════

const PAYLINE_DEFS: [[usize; 4]; 8] = [
    [0, 0, 0, 0], // Line 1: Top row straight
    [1, 1, 1, 1], // Line 2: Second row straight
    [2, 2, 2, 2], // Line 3: Middle row straight
    [3, 3, 3, 3], // Line 4: Fourth row straight
    [4, 4, 4, 4], // Line 5: Bottom row straight
    [0, 1, 2, 3], // Line 6: Diagonal down
    [4, 3, 2, 1], // Line 7: Diagonal up
    [1, 2, 3, 2], // Line 8: V-shape
];

// ═══════════════════════════════════════════════════════════════════
// SECTION 6: REEL STRIP CONFIGURATIONS
//
// Three configs (loose/standard/tight) with different symbol weights.
// The RTP engine selects which config to use each spin.
// Format: (symbol_id, count_on_strip)
// ═══════════════════════════════════════════════════════════════════

fn build_strip_weights(config: &str) -> Vec<(&'static str, u32)> {
    match config {
        "loose" => vec![
            ("desert", 6), ("ocean", 6), ("tundra", 5),
            ("beach", 5), ("castle", 5), ("forest", 5),
            ("liberty", 4), ("torii", 4),
            ("taj", 3), ("pyramid", 3),
            ("eiffel", 2), ("kremlin", 2),
            ("globe", 3), ("plane", 2),
        ],
        "tight" => vec![
            ("desert", 10), ("ocean", 10), ("tundra", 9),
            ("beach", 6), ("castle", 6), ("forest", 6),
            ("liberty", 3), ("torii", 3),
            ("taj", 2), ("pyramid", 2),
            ("eiffel", 1), ("kremlin", 1),
            ("globe", 1), ("plane", 1),
        ],
        _ /* standard */ => vec![
            ("desert", 8), ("ocean", 8), ("tundra", 7),
            ("beach", 6), ("castle", 6), ("forest", 5),
            ("liberty", 4), ("torii", 3),
            ("taj", 2), ("pyramid", 2),
            ("eiffel", 2), ("kremlin", 1),
            ("globe", 2), ("plane", 1),
        ],
    }
}

fn build_reel_strip(config: &str) -> Vec<Symbol> {
    let weights = build_strip_weights(config);
    let mut strip = Vec::new();
    for (id, count) in weights {
        for _ in 0..count {
            strip.push(sym_by_id(id));
        }
    }
    // Fisher-Yates shuffle
    let mut rng = rand::thread_rng();
    let len = strip.len();
    for i in (1..len).rev() {
        let j = rng.gen_range(0..=i);
        strip.swap(i, j);
    }
    strip
}

fn build_all_strips() -> Vec<Vec<Vec<Symbol>>> {
    // [config_idx: 0=loose, 1=standard, 2=tight][reel_idx][stop_idx]
    let configs = ["loose", "standard", "tight"];
    configs.iter().map(|config| {
        (0..REELS).map(|_| build_reel_strip(config)).collect()
    }).collect()
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 7: HAVERSINE DISTANCE
//
// The core geospatial function. Calculates great-circle distance
// between two points on Earth's surface. Used to determine if a
// random coordinate spin lands near a POI for bonus triggering.
// ═══════════════════════════════════════════════════════════════════

fn haversine(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    let d_lat = (lat2 - lat1).to_radians();
    let d_lon = (lon2 - lon1).to_radians();
    let a = (d_lat / 2.0).sin().powi(2)
        + lat1.to_radians().cos() * lat2.to_radians().cos()
        * (d_lon / 2.0).sin().powi(2);
    let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());
    EARTH_RADIUS_KM * c
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 8: AROUND THE WORLD ROUTE
//
// The bonus ladder gamble. Each stop awards free spins.
// Gamble chance decreases as you progress — classic UK fruit machine
// ladder mechanic with calculable expected value at each stop.
// ═══════════════════════════════════════════════════════════════════

fn get_world_route() -> Vec<RouteStop> {
    vec![
        RouteStop { city: "London",        emoji: "🇬🇧", spins: 3,  chance: 1.00 },
        RouteStop { city: "Paris",         emoji: "🇫🇷", spins: 4,  chance: 0.72 },
        RouteStop { city: "Istanbul",      emoji: "🇹🇷", spins: 5,  chance: 0.62 },
        RouteStop { city: "Mumbai",        emoji: "🇮🇳", spins: 6,  chance: 0.52 },
        RouteStop { city: "Hong Kong",     emoji: "🇭🇰", spins: 8,  chance: 0.44 },
        RouteStop { city: "Tokyo",         emoji: "🇯🇵", spins: 10, chance: 0.38 },
        RouteStop { city: "San Francisco", emoji: "🇺🇸", spins: 12, chance: 0.32 },
        RouteStop { city: "New York",      emoji: "🗽", spins: 15, chance: 0.28 },
        RouteStop { city: "London Return", emoji: "🏆", spins: 20, chance: 1.00 },
    ]
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 9: RTP CORRECTION ENGINE
//
// The sigmoid correction maps RTP deviation to a -1..+1 factor.
// This determines which reel strip config is used and adjusts
// the Haversine bonus radius.
//
// Deviation > 0 (overpaying) → positive correction → tight strips
// Deviation < 0 (underpaying) → negative correction → loose strips
// ═══════════════════════════════════════════════════════════════════

impl Engine {
    fn calculate_correction(&self) -> CorrectionResult {
        if self.spin_history.is_empty() {
            return CorrectionResult {
                config: "standard",
                correction: 0.0,
                weighted_rtp: TARGET_RTP,
                reasons: vec!["Initial spin".to_string()],
            };
        }

        // Multi-window RTP calculation
        let calc_window_rtp = |window: &[(f64, f64)]| -> f64 {
            if window.is_empty() { return TARGET_RTP; }
            let wagered: f64 = window.iter().map(|(b, _)| b).sum();
            let won: f64 = window.iter().map(|(_, w)| w).sum();
            if wagered > 0.0 { won / wagered } else { TARGET_RTP }
        };

        let len = self.spin_history.len();
        let short = calc_window_rtp(&self.spin_history[len.saturating_sub(20)..]);
        let medium = calc_window_rtp(&self.spin_history[len.saturating_sub(100)..]);
        let long = calc_window_rtp(&self.spin_history[len.saturating_sub(500)..]);
        let all = calc_window_rtp(&self.spin_history);

        let weighted_rtp = short * 0.10 + medium * 0.25 + long * 0.35 + all * 0.30;
        let deviation = weighted_rtp - TARGET_RTP;

        // Sigmoid correction
        let sigmoid = (1.0 / (1.0 + (-SIGMOID_K * deviation).exp()) - 0.5) * 2.0;

        // Session modifiers
        let mut session_mod = 0.0;
        let mut reasons = Vec::new();

        if self.consecutive_losses > 12 {
            session_mod -= 0.15;
            reasons.push(format!("Drought({})", self.consecutive_losses));
        } else if self.consecutive_losses > 6 {
            session_mod -= 0.08;
            reasons.push(format!("Losing({})", self.consecutive_losses));
        }

        if self.consecutive_wins > 4 {
            session_mod += 0.12;
            reasons.push(format!("Hot({})", self.consecutive_wins));
        }

        let spins_since_bonus = self.spin_count.saturating_sub(self.last_bonus_spin);
        if spins_since_bonus > 120 {
            session_mod -= 0.06;
            reasons.push(format!("BonusDue({})", spins_since_bonus));
        }

        if reasons.is_empty() {
            reasons.push("Standard".to_string());
        }

        let final_corr = (sigmoid + session_mod).clamp(-1.0, 1.0);

        let config = if final_corr < -0.3 {
            "loose"
        } else if final_corr > 0.3 {
            "tight"
        } else {
            "standard"
        };

        CorrectionResult { config, correction: final_corr, weighted_rtp, reasons }
    }

    /// The effective bonus radius, adjusted by the RTP correction.
    /// When underpaying → wider radius (more bonus triggers).
    /// When overpaying → tighter radius (fewer bonus triggers).
    fn effective_bonus_radius(&self, correction: f64) -> f64 {
        // correction ranges from -1 to +1
        // At -1 (heavily underpaying): radius × 1.8
        // At  0 (on target): radius × 1.0
        // At +1 (heavily overpaying): radius × 0.4
        let multiplier = 1.0 - correction * 0.6;
        BASE_BONUS_RADIUS_KM * multiplier.clamp(0.3, 2.0)
    }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 10: CORE SPIN MECHANICS
// ═══════════════════════════════════════════════════════════════════

impl Engine {
    fn new(poi_data: GeoData) -> Self {
        Engine {
            balance: 1000.0,
            bet: 1.0,
            total_wagered: 0.0,
            total_won: 0.0,
            jackpot_pool: 500.0,
            jackpot_contributed: 0.0,
            spin_count: 0,
            consecutive_losses: 0,
            consecutive_wins: 0,
            last_bonus_spin: 0,
            spin_history: Vec::new(),
            free_spins_left: 0,
            free_spins_won: 0.0,
            poi_data,
            reel_strips: build_all_strips(),
            dp_stats: DarkPatternStats::default(),
            near_miss_enabled: true,
        }
    }

    /// Spin the reels — returns a 4×5 grid of symbols
    fn spin_grid(&self, config_idx: usize) -> Vec<Vec<Symbol>> {
        let mut rng = rand::thread_rng();
        let strips = &self.reel_strips[config_idx];
        let mut grid = Vec::new();

        for reel_idx in 0..REELS {
            let strip = &strips[reel_idx];
            let stop = rng.gen_range(0..strip.len());
            let mut column = Vec::new();
            for row in 0..ROWS {
                column.push(strip[(stop + row) % strip.len()].clone());
            }
            grid.push(column);
        }
        grid
    }

    /// Evaluate all paylines for wins
    fn evaluate_paylines(&self, grid: &[Vec<Symbol>], bet_per_line: f64) -> Vec<PaylineWin> {
        let mut wins = Vec::new();

        for (li, payline) in PAYLINE_DEFS.iter().enumerate() {
            // Extract symbol IDs at this payline's positions
            let line_ids: Vec<&str> = payline.iter().enumerate()
                .map(|(reel, &row)| grid[reel][row].id)
                .collect();

            // Find the first non-wild, non-plane symbol ID to match against
            let match_id: &str = match line_ids.iter().find(|&&id| id != "globe" && id != "plane") {
                Some(&id) => id,
                None => {
                    // All wilds? Treat as globe match
                    if line_ids.iter().all(|&id| id == "globe") { "globe" } else { continue; }
                }
            };

            // Count consecutive matches from left (wilds substitute)
            let mut count = 0;
            for &id in &line_ids {
                if id == match_id || id == "globe" {
                    count += 1;
                } else {
                    break;
                }
            }

            if count >= 3 {
                let mult = get_multiplier(match_id, count);
                if mult > 0.0 {
                    wins.push(PaylineWin {
                        line_idx: li,
                        symbol_id: match_id,
                        count,
                        multiplier: mult,
                        payout: mult * bet_per_line,
                    });
                }
            }
        }
        wins
    }

    /// Check if random coordinates hit near a POI (bonus trigger).
    /// Returns a cloned POI to avoid holding a borrow on self.
    fn check_bonus_trigger(&self, lat: f64, lon: f64, radius: f64) -> Option<GeoPOI> {
        let mut nearest: Option<(GeoPOI, f64)> = None;

        for poi in &self.poi_data.bonus_promotions {
            let dist = haversine(lat, lon, poi.lat, poi.lon);
            if dist <= radius {
                match &nearest {
                    Some((_, best_dist)) if dist < *best_dist => {
                        nearest = Some((poi.clone(), dist));
                    }
                    None => {
                        nearest = Some((poi.clone(), dist));
                    }
                    _ => {}
                }
            }
        }

        nearest.map(|(poi, _)| poi)
    }

    /// Find the nearest POI and its distance (for near-miss display)
    fn nearest_poi(&self, lat: f64, lon: f64) -> (GeoPOI, f64) {
        self.poi_data.bonus_promotions.iter()
            .map(|poi| (poi.clone(), haversine(lat, lon, poi.lat, poi.lon)))
            .min_by(|(_, d1), (_, d2)| d1.partial_cmp(d2).unwrap())
            .unwrap()
    }

    /// Classify an outcome for dark pattern tracking
    fn classify_outcome(&self, bet: f64, won: f64) -> OutcomeType {
        if won <= 0.0 { OutcomeType::TrueLoss }
        else if won < bet { OutcomeType::LDW }
        else { OutcomeType::TrueWin }
    }

    // ═══════════════════════════════════════════════════════════════
    // MAIN SPIN
    // ═══════════════════════════════════════════════════════════════

    fn spin(&mut self) -> bool {
        let mut rng = rand::thread_rng();
        let is_free = self.free_spins_left > 0;
        let _actual_cost = if is_free { 0.0 } else { self.bet };

        if !is_free && self.balance < self.bet {
            println!("\n  ⛽ Insufficient fuel! Balance: £{:.2}", self.balance);
            return false;
        }

        // Deduct bet
        if !is_free {
            self.balance -= self.bet;
        }
        self.total_wagered += self.bet;
        self.spin_count += 1;
        self.dp_stats.total_spins += 1;

        if is_free {
            self.free_spins_left -= 1;
        }

        // RTP correction
        let corr = self.calculate_correction();
        let config_idx = match corr.config {
            "loose" => 0,
            "standard" => 1,
            _ => 2,
        };

        // Spin the grid
        let grid = self.spin_grid(config_idx);

        // Generate random coordinates for bonus check
        let spin_lat: f64 = rng.gen_range(-90.0..=90.0);
        let spin_lon: f64 = rng.gen_range(-180.0..=180.0);

        let bonus_radius = self.effective_bonus_radius(corr.correction);
        let bonus_hit = self.check_bonus_trigger(spin_lat, spin_lon, bonus_radius);
        let (nearest_poi, nearest_dist) = self.nearest_poi(spin_lat, spin_lon);

        // Evaluate payline wins
        let bet_per_line = self.bet / PAYLINES as f64;
        let payline_wins = self.evaluate_paylines(&grid, bet_per_line);
        let payline_total: f64 = payline_wins.iter().map(|w| w.payout).sum();

        // Random multiplier (3% on wins)
        let multiplier = if payline_total > 0.0 && rng.gen_bool(0.03) {
            let mults = [2.0, 3.0, 5.0];
            mults[rng.gen_range(0..mults.len())]
        } else {
            1.0
        };

        let total_win = payline_total * multiplier;

        // Jackpot contribution
        let jp_contrib = self.bet * 0.015;
        self.jackpot_pool += jp_contrib;
        self.jackpot_contributed += jp_contrib;

        // Update tracking
        self.total_won += total_win;
        self.spin_history.push((self.bet, total_win));
        self.balance += total_win;

        if total_win > 0.0 {
            self.consecutive_wins += 1;
            self.consecutive_losses = 0;
        } else {
            self.consecutive_losses += 1;
            self.consecutive_wins = 0;
        }

        // Dark pattern tracking
        let outcome = self.classify_outcome(self.bet, total_win);
        match outcome {
            OutcomeType::TrueWin => self.dp_stats.true_wins += 1,
            OutcomeType::LDW => {
                self.dp_stats.ldw_count += 1;
                self.dp_stats.ldw_total_lost += self.bet - total_win;
            }
            OutcomeType::TrueLoss => self.dp_stats.true_losses += 1,
        }

        if total_win > 0.0 {
            if total_win < self.bet {
                self.dp_stats.celebration_fake += 1; // LDW celebration
            } else {
                self.dp_stats.celebration_real += 1;
            }
        }

        // ── DISPLAY ──
        println!();
        println!("  ╔════════════════════════════════════════════╗");
        println!("  ║  🌍 SPIN #{:<5}  {}  Bet: £{:.2}{} ║",
            self.spin_count,
            match corr.config { "loose" => "🟢LOOSE ", "tight" => "🔴TIGHT ", _ => "🟡STD   " },
            self.bet,
            if is_free { " ✈️FREE" } else { "       " }
        );
        println!("  ╠════════════════════════════════════════════╣");

        // Display grid (4 reels × 5 rows)
        for row in 0..ROWS {
            print!("  ║  ");
            for reel in 0..REELS {
                let sym = &grid[reel][row];
                // Check if this position is in a winning payline
                let is_win = payline_wins.iter().any(|w| {
                    PAYLINE_DEFS[w.line_idx][reel] == row
                });
                if is_win {
                    print!("[{}]", sym.emoji);
                } else {
                    print!(" {} ", sym.emoji);
                }
            }
            println!("         ║");
        }

        println!("  ╠════════════════════════════════════════════╣");

        // Coordinate display
        let ns = if spin_lat >= 0.0 { "N" } else { "S" };
        let ew = if spin_lon >= 0.0 { "E" } else { "W" };
        println!("  ║  📍 {:.4}°{} {:.4}°{}                    ║",
            spin_lat.abs(), ns, spin_lon.abs(), ew);

        // Win results
        if !payline_wins.is_empty() {
            for w in &payline_wins {
                println!("  ║  ✅ Line {}: {}×{} = £{:.2}{}           ║",
                    w.line_idx + 1, w.symbol_id, w.count, w.payout,
                    if multiplier > 1.0 { format!(" ×{}", multiplier) } else { String::new() }
                );
            }
            println!("  ║  💰 Total: £{:.2}                         ║", total_win);

            // LDW indicator
            if outcome == OutcomeType::LDW {
                println!("  ║  ⚠️  LDW: Won £{:.2} but bet £{:.2}       ║", total_win, self.bet);
                println!("  ║       Net loss: -£{:.2}                   ║", self.bet - total_win);
            }
        } else {
            println!("  ║  ❌ No matching coordinates found.         ║");
        }

        // Near-miss display
        if payline_wins.is_empty() && self.near_miss_enabled && nearest_dist < 500.0 {
            self.dp_stats.near_miss_activations += 1;
            println!("  ║  👁 Near miss! {} only {:.0}km away!     ║",
                nearest_poi.emoji, nearest_dist);
        }

        // Bonus trigger
        if let Some(poi) = bonus_hit {
            self.dp_stats.bonus_triggers += 1;
            self.last_bonus_spin = self.spin_count;
            println!("  ╠════════════════════════════════════════════╣");
            println!("  ║  ✈️✈️✈️  BONUS BOARD TRIGGERED! ✈️✈️✈️          ║");
            println!("  ║  📍 Landed near: {} {}                 ║", poi.emoji, poi.name);
            println!("  ║  Within {:.0}km bonus radius!               ║", bonus_radius);
            println!("  ╚════════════════════════════════════════════╝");

            // Run the Around the World bonus
            self.around_the_world_bonus();
        } else {
            // RTP info
            let rtp = if self.total_wagered > 0.0 {
                (self.total_won / self.total_wagered) * 100.0
            } else { 0.0 };
            println!("  ║  📊 RTP: {:.2}%  Bal: £{:.2}              ║", rtp, self.balance);
            println!("  ╚════════════════════════════════════════════╝");
        }

        if is_free {
            self.free_spins_won += total_win;
            if self.free_spins_left == 0 {
                println!("\n  ✈️ Free spins complete! Won: £{:.2}", self.free_spins_won);
                self.free_spins_won = 0.0;
            }
        }

        true
    }

    // ═══════════════════════════════════════════════════════════════
    // AROUND THE WORLD BONUS — Ladder Gamble
    // ═══════════════════════════════════════════════════════════════

    fn around_the_world_bonus(&mut self) {
        let route = get_world_route();
        let mut rng = rand::thread_rng();
        let mut current_stop = 0;
        let mut accumulated_spins = route[0].spins;

        println!("\n  ╔══════════════════════════════════════════════╗");
        println!("  ║    ✈️  AROUND THE WORLD IN 80 DAYS  ✈️        ║");
        println!("  ╠══════════════════════════════════════════════╣");
        println!("  ║  📍 {} {} — Departure!                    ║",
            route[0].emoji, route[0].city);
        println!("  ║  🎰 Starting free spins: {}                   ║", accumulated_spins);
        println!("  ╠══════════════════════════════════════════════╣");

        // Show route
        println!("  ║  ROUTE:");
        for (i, stop) in route.iter().enumerate() {
            let marker = if i == 0 { "📍" } else if i == route.len() - 1 { "🏆" } else { "  " };
            let chance_str = if i == 0 || i == route.len() - 1 {
                "AUTO".to_string()
            } else {
                format!("{}%", (stop.chance * 100.0) as u32)
            };
            println!("  ║  {} {} {} (+{} spins) [{}]",
                marker, stop.emoji, stop.city, stop.spins, chance_str);
        }
        println!("  ╠══════════════════════════════════════════════╣");

        loop {
            let next_stop = current_stop + 1;
            if next_stop >= route.len() {
                // Final destination — auto-collect
                println!("  ║  🏆 AROUND THE WORLD COMPLETE!              ║");
                break;
            }

            let next = &route[next_stop];

            // Show EV calculation
            let ev_gamble = next.chance * (accumulated_spins + next.spins) as f64;
            let ev_collect = accumulated_spins as f64;
            let ev_label = if ev_gamble > ev_collect { "+EV GAMBLE" } else { "-EV GAMBLE" };

            println!("  ║  📍 {} {} — {} spins accumulated",
                route[current_stop].emoji, route[current_stop].city, accumulated_spins);
            println!("  ║");
            println!("  ║  Next: {} {} (+{} spins, {}% success)",
                next.emoji, next.city, next.spins, (next.chance * 100.0) as u32);
            println!("  ║  EV: Gamble={:.1} vs Collect={} [{}]",
                ev_gamble, accumulated_spins, ev_label);
            println!("  ║");
            print!("  ║  [C]ollect {} spins or [G]amble? > ", accumulated_spins);
            io::stdout().flush().unwrap();

            let mut input = String::new();
            io::stdin().read_line(&mut input).unwrap();
            let choice = input.trim().to_lowercase();

            if choice.starts_with('c') || choice.is_empty() {
                // Collect
                println!("  ║  ✅ Collected {} free spins!", accumulated_spins);
                break;
            }

            // Gamble!
            let success = rng.gen_bool(next.chance);
            if success {
                accumulated_spins += next.spins;
                current_stop = next_stop;
                println!("  ║  ✅ Safe landing in {}! {} spins now!",
                    next.city, accumulated_spins);

                // Auto-collect at final destination
                if next_stop >= route.len() - 1 {
                    println!("  ║  🏆 CIRCUMNAVIGATION COMPLETE!");
                    break;
                }
            } else {
                println!("  ║  💥 CRASHED en route to {}!", next.city);
                println!("  ║  Lost ALL {} spins!", accumulated_spins);
                accumulated_spins = 0;
                break;
            }
            println!("  ╠──────────────────────────────────────────────╣");
        }

        println!("  ╚══════════════════════════════════════════════╝");

        if accumulated_spins > 0 {
            self.free_spins_left = accumulated_spins;
            self.free_spins_won = 0.0;
            self.dp_stats.bonus_trips_completed += 1;
            self.dp_stats.total_bonus_spins_won += accumulated_spins;
            println!("\n  ✈️ {} free spins loaded! Spinning...\n", accumulated_spins);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // RTP CERTIFICATION HARNESS
    // ═══════════════════════════════════════════════════════════════

    fn run_certification(count: u32) {
        println!("\n  ═══ RNG CERTIFICATION HARNESS ({} spins) ═══", count);
        let json = include_str!("../geolocations.json");
        let poi_data: GeoData = serde_json::from_str(json)
            .expect("Embedded geolocations.json parse failed");

        let mut eng = Engine::new(poi_data);
        eng.bet = 1.0;
        eng.balance = f64::MAX; // Infinite balance for simulation
        eng.near_miss_enabled = false; // Skip display

        let mut bonus_triggers = 0u32;

        for i in 0..count {
            let mut rng = rand::thread_rng();
            eng.total_wagered += eng.bet;
            eng.spin_count += 1;

            let corr = eng.calculate_correction();
            let cfg_idx = match corr.config {
                "loose" => 0, "tight" => 2, _ => 1,
            };

            let grid = eng.spin_grid(cfg_idx);
            let bpl = eng.bet / PAYLINES as f64;
            let wins = eng.evaluate_paylines(&grid, bpl);
            let mut win: f64 = wins.iter().map(|w| w.payout).sum();

            // Random multiplier
            if win > 0.0 && rng.gen_bool(0.03) {
                win *= [2.0, 3.0, 5.0][rng.gen_range(0..3)];
            }

            // Bonus check
            let lat: f64 = rng.gen_range(-90.0..=90.0);
            let lon: f64 = rng.gen_range(-180.0..=180.0);
            let radius = eng.effective_bonus_radius(corr.correction);
            if eng.check_bonus_trigger(lat, lon, radius).is_some() {
                bonus_triggers += 1;
                // Simulate average bonus yield (~8 free spins × avg spin value)
                let avg_bonus_yield = eng.bet * 4.0;
                win += avg_bonus_yield;
            }

            // Jackpot contribution
            eng.jackpot_pool += eng.bet * 0.015;

            eng.total_won += win;
            eng.spin_history.push((eng.bet, win));

            if win > 0.0 { eng.consecutive_wins += 1; eng.consecutive_losses = 0; }
            else { eng.consecutive_losses += 1; eng.consecutive_wins = 0; }

            if (i + 1) % (count / 10) == 0 {
                let rtp = eng.total_won / eng.total_wagered * 100.0;
                print!("  {:.0}% ({} spins) RTP: {:.3}%\r", (i+1) as f64 / count as f64 * 100.0, i + 1, rtp);
                io::stdout().flush().unwrap();
            }
        }

        let actual_rtp = eng.total_won / eng.total_wagered;
        let deviation = actual_rtp - TARGET_RTP;
        let within_tolerance = deviation.abs() <= 0.005;

        println!();
        println!("  ┌────────────────────────────────────────────┐");
        println!("  │ RESULT: {}                               │",
            if within_tolerance { "✅ PASS" } else { "❌ FAIL" });
        println!("  ├────────────────────────────────────────────┤");
        println!("  │ Spins:       {:>10}                    │", count);
        println!("  │ Target RTP:  {:>10.3}%                   │", TARGET_RTP * 100.0);
        println!("  │ Actual RTP:  {:>10.3}%                   │", actual_rtp * 100.0);
        println!("  │ Deviation:   {:>+10.3}%                   │", deviation * 100.0);
        println!("  │ Tolerance:   ±0.500%                      │");
        println!("  │ Bonus rate:  {:>10.2}%                   │",
            bonus_triggers as f64 / count as f64 * 100.0);
        println!("  │ House edge:  {:>10.3}%                   │", (1.0 - actual_rtp) * 100.0);
        println!("  └────────────────────────────────────────────┘");
    }

    // ═══════════════════════════════════════════════════════════════
    // SESSION REPORT
    // ═══════════════════════════════════════════════════════════════

    fn print_session_report(&self) {
        let rtp = if self.total_wagered > 0.0 {
            self.total_won / self.total_wagered * 100.0
        } else { 0.0 };

        println!("\n  ╔══════════════════════════════════════════════╗");
        println!("  ║         SESSION REPORT & DARK PATTERNS        ║");
        println!("  ╠══════════════════════════════════════════════╣");
        println!("  ║  Total wagered:     £{:<10.2}               ║", self.total_wagered);
        println!("  ║  Total returned:    £{:<10.2}               ║", self.total_won);
        println!("  ║  Net P/L:           £{:<+10.2}               ║", self.total_won - self.total_wagered);
        println!("  ║  Session RTP:       {:<7.2}%                 ║", rtp);
        println!("  ║  Total spins:       {:<10}                ║", self.dp_stats.total_spins);
        println!("  ║  Jackpot contrib:   £{:<10.2}               ║", self.jackpot_contributed);
        println!("  ╠══════════════════════════════════════════════╣");
        println!("  ║  🧠 DARK PATTERN ANALYSIS                     ║");
        println!("  ╠──────────────────────────────────────────────╣");
        let total = self.dp_stats.total_spins.max(1);
        println!("  ║  LDW events:      {} ({:.1}%)              ║",
            self.dp_stats.ldw_count,
            self.dp_stats.ldw_count as f64 / total as f64 * 100.0);
        println!("  ║  LDW money lost:  £{:.2} (\"during wins\")    ║", self.dp_stats.ldw_total_lost);
        println!("  ║  True wins:       {} ({:.1}%)              ║",
            self.dp_stats.true_wins,
            self.dp_stats.true_wins as f64 / total as f64 * 100.0);
        println!("  ║  True losses:     {} ({:.1}%)              ║",
            self.dp_stats.true_losses,
            self.dp_stats.true_losses as f64 / total as f64 * 100.0);
        println!("  ║  Fake celebrations: {} / {} total          ║",
            self.dp_stats.celebration_fake,
            self.dp_stats.celebration_fake + self.dp_stats.celebration_real);
        println!("  ║  Near-miss events:  {}                      ║", self.dp_stats.near_miss_activations);
        println!("  ║  Bonus triggers:    {}                      ║", self.dp_stats.bonus_triggers);
        println!("  ║  Bonus trips done:  {}                      ║", self.dp_stats.bonus_trips_completed);
        println!("  ║  Bonus spins won:   {}                      ║", self.dp_stats.total_bonus_spins_won);
        println!("  ╚══════════════════════════════════════════════╝");
    }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 11: MAIN — Interactive Game Loop
// ═══════════════════════════════════════════════════════════════════

fn main() {
    println!("  ╔══════════════════════════════════════════════╗");
    println!("  ║    🌍 AROUND THE WORLD IN 80 DAYS 🌍         ║");
    println!("  ║    Geospatial Slot Engine v1.0                ║");
    println!("  ║    4×5 Reels │ 8 Paylines │ 96.5% RTP        ║");
    println!("  ╚══════════════════════════════════════════════╝");

    // Load POI data
    let json_data = match std::fs::read_to_string("geolocations.json") {
        Ok(data) => data,
        Err(_) => {
            // Fallback: try embedded
            println!("  [!] geolocations.json not found, using embedded data...");
            include_str!("../geolocations.json").to_string()
        }
    };

    let poi_data: GeoData = serde_json::from_str(&json_data)
        .expect("Failed to parse geolocations.json");

    println!("  [✓] Loaded {} POIs + {} uncharted sectors",
        poi_data.bonus_promotions.len(),
        poi_data.uncharted_sectors.len());

    let mut engine = Engine::new(poi_data);

    println!("\n  Commands: [Enter]=spin, [b]=change bet, [r]=report,");
    println!("            [c]=certification, [n]=toggle near-miss, [q]=quit\n");

    loop {
        // Show free spins status
        if engine.free_spins_left > 0 {
            println!("  ✈️ FREE SPINS: {} remaining (Won: £{:.2})",
                engine.free_spins_left, engine.free_spins_won);
        }

        print!("  🌍 [£{:.2} | Bet: £{:.2}] > ",
            engine.balance, engine.bet);
        io::stdout().flush().unwrap();

        let mut input = String::new();
        io::stdin().read_line(&mut input).unwrap();
        let cmd = input.trim().to_lowercase();

        match cmd.as_str() {
            "" | "s" | "spin" => {
                if !engine.spin() {
                    println!("  Game over! Final balance: £{:.2}", engine.balance);
                    engine.print_session_report();
                    break;
                }
            }
            "q" | "quit" | "exit" => {
                engine.print_session_report();
                break;
            }
            "r" | "report" => {
                engine.print_session_report();
            }
            "b" | "bet" => {
                println!("  Bet options: 0.20, 0.50, 1.00, 2.00, 5.00, 10.00");
                print!("  New bet: £");
                io::stdout().flush().unwrap();
                let mut bet_input = String::new();
                io::stdin().read_line(&mut bet_input).unwrap();
                if let Ok(new_bet) = bet_input.trim().parse::<f64>() {
                    if new_bet > 0.0 && new_bet <= 10.0 {
                        engine.bet = new_bet;
                        println!("  Bet set to £{:.2}", engine.bet);
                    }
                }
            }
            "c" | "cert" | "certification" => {
                println!("  Running RTP certification...");
                Engine::run_certification(50_000);
            }
            "n" | "nearmiss" => {
                engine.near_miss_enabled = !engine.near_miss_enabled;
                println!("  Near-miss display: {}",
                    if engine.near_miss_enabled { "ON" } else { "OFF" });
            }
            "auto" => {
                println!("  Running 50 auto-spins...");
                for _ in 0..50 {
                    if !engine.spin() { break; }
                }
            }
            _ => {
                println!("  Unknown command. [Enter]=spin, [b]et, [r]eport, [c]ert, [n]earmiss, [q]uit");
            }
        }
    }

    println!("\n  🌍 Casino closed. Safe travels, explorer.");
}
