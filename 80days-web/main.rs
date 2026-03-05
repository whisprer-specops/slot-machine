// ╔══════════════════════════════════════════════════════════════════════╗
// ║   AROUND THE WORLD IN 80 DAYS — Axum Web Server                    ║
// ║                                                                      ║
// ║   Single binary serves both the API and the static frontend.        ║
// ║   All engine logic runs server-side in Rust.                        ║
// ║   The browser is purely a display layer.                            ║
// ║                                                                      ║
// ║   Deploy: cargo build --release && ./target/release/atwi80d         ║
// ║   Serves on http://0.0.0.0:3000                                     ║
// ╚══════════════════════════════════════════════════════════════════════╝

use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const REELS: usize = 4;
const ROWS: usize = 5;
const NLINES: usize = 8;
const TARGET_RTP: f64 = 0.965;
const SIGMOID_K: f64 = 15.0;
const BASE_BONUS_RADIUS: f64 = 150.0;

// ═══════════════════════════════════════════════════════════════
// SYMBOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════
#[derive(Debug, Clone, Serialize)]
struct Symbol {
    id: &'static str,
    emoji: &'static str,
    name: &'static str,
    tier: u8,
    lat: f64,
    lon: f64,
}

const SYMBOLS: &[Symbol] = &[
    Symbol { id: "desert",  emoji: "🏜️", name: "Sahara",        tier: 1, lat: 23.42,  lon: 25.66 },
    Symbol { id: "ocean",   emoji: "🌊", name: "Pacific",        tier: 1, lat: 0.0,    lon: -160.0 },
    Symbol { id: "tundra",  emoji: "❄️", name: "Siberia",        tier: 1, lat: 72.0,   lon: 100.0 },
    Symbol { id: "beach",   emoji: "🏖️", name: "Copacabana",     tier: 2, lat: -22.97, lon: -43.18 },
    Symbol { id: "castle",  emoji: "🏰", name: "Neuschwanstein", tier: 2, lat: 47.56,  lon: 10.75 },
    Symbol { id: "forest",  emoji: "🌳", name: "Amazon",         tier: 2, lat: -3.47,  lon: -62.22 },
    Symbol { id: "liberty", emoji: "🗽", name: "Liberty",        tier: 3, lat: 40.69,  lon: -74.04 },
    Symbol { id: "torii",   emoji: "⛩️", name: "Fushimi",        tier: 3, lat: 34.97,  lon: 135.77 },
    Symbol { id: "taj",     emoji: "🕌", name: "Taj Mahal",      tier: 4, lat: 27.18,  lon: 78.04 },
    Symbol { id: "pyramid", emoji: "🔺", name: "Giza",           tier: 4, lat: 29.98,  lon: 31.13 },
    Symbol { id: "eiffel",  emoji: "🗼", name: "Eiffel",         tier: 5, lat: 48.86,  lon: 2.29 },
    Symbol { id: "kremlin", emoji: "🏛️", name: "Kremlin",        tier: 5, lat: 55.75,  lon: 37.62 },
    Symbol { id: "globe",   emoji: "🌍", name: "WILD",           tier: 6, lat: 0.0,    lon: 0.0 },
    Symbol { id: "plane",   emoji: "✈️", name: "FLIGHT",         tier: 0, lat: 0.0,    lon: 0.0 },
];

fn sym_by_id(id: &str) -> Symbol {
    SYMBOLS.iter().find(|s| s.id == id).cloned().unwrap_or_else(|| SYMBOLS[0].clone())
}

// ═══════════════════════════════════════════════════════════════
// PAYTABLE & PAYLINES
// ═══════════════════════════════════════════════════════════════
fn get_multiplier(id: &str, count: usize) -> f64 {
    match (id, count) {
        ("desert", 3) => 4.0,  ("desert", 4) => 10.0,
        ("ocean", 3) => 4.0,   ("ocean", 4) => 10.0,
        ("tundra", 3) => 4.0,  ("tundra", 4) => 10.0,
        ("beach", 3) => 6.0,   ("beach", 4) => 20.0,
        ("castle", 3) => 6.0,  ("castle", 4) => 20.0,
        ("forest", 3) => 6.0,  ("forest", 4) => 20.0,
        ("liberty", 3) => 12.0, ("liberty", 4) => 50.0,
        ("torii", 3) => 12.0,  ("torii", 4) => 50.0,
        ("taj", 3) => 25.0,    ("taj", 4) => 100.0,
        ("pyramid", 3) => 25.0, ("pyramid", 4) => 100.0,
        ("eiffel", 3) => 60.0, ("eiffel", 4) => 250.0,
        ("kremlin", 3) => 60.0, ("kremlin", 4) => 250.0,
        ("globe", 3) => 60.0,  ("globe", 4) => 250.0,
        _ => 0.0,
    }
}

const PAYLINE_DEFS: [[usize; 4]; 8] = [
    [0,0,0,0],[1,1,1,1],[2,2,2,2],[3,3,3,3],[4,4,4,4],
    [0,1,2,3],[4,3,2,1],[1,2,3,2],
];

// ═══════════════════════════════════════════════════════════════
// BONUS POIs (Haversine targets)
// ═══════════════════════════════════════════════════════════════
#[derive(Debug, Clone, Serialize)]
struct BonusPOI {
    name: &'static str,
    lat: f64,
    lon: f64,
    emoji: &'static str,
}

const BONUS_POIS: &[BonusPOI] = &[
    BonusPOI { name: "Eiffel Tower", lat: 48.858, lon: 2.295, emoji: "🗼" },
    BonusPOI { name: "Great Pyramid", lat: 29.979, lon: 31.134, emoji: "🔺" },
    BonusPOI { name: "Statue of Liberty", lat: 40.689, lon: -74.045, emoji: "🗽" },
    BonusPOI { name: "Taj Mahal", lat: 27.175, lon: 78.042, emoji: "🕌" },
    BonusPOI { name: "Colosseum", lat: 41.890, lon: 12.492, emoji: "🏟️" },
    BonusPOI { name: "Machu Picchu", lat: -13.163, lon: -72.545, emoji: "⛰️" },
    BonusPOI { name: "Great Wall", lat: 40.432, lon: 116.570, emoji: "🧱" },
    BonusPOI { name: "Petra", lat: 30.329, lon: 35.444, emoji: "🏺" },
    BonusPOI { name: "Stonehenge", lat: 51.179, lon: -1.826, emoji: "🪨" },
    BonusPOI { name: "Mount Fuji", lat: 35.361, lon: 138.727, emoji: "🗻" },
    BonusPOI { name: "Grand Canyon", lat: 36.107, lon: -112.113, emoji: "🏜️" },
    BonusPOI { name: "Victoria Falls", lat: -17.924, lon: 25.857, emoji: "🌊" },
    BonusPOI { name: "Burj Khalifa", lat: 25.197, lon: 55.274, emoji: "🏙️" },
    BonusPOI { name: "Golden Gate", lat: 37.820, lon: -122.478, emoji: "🌉" },
    BonusPOI { name: "Angkor Wat", lat: 13.413, lon: 103.867, emoji: "🛕" },
    BonusPOI { name: "Sydney Opera", lat: -33.857, lon: 151.215, emoji: "🎭" },
    BonusPOI { name: "Christ Redeemer", lat: -22.952, lon: -43.211, emoji: "⛪" },
    BonusPOI { name: "Acropolis", lat: 37.972, lon: 23.726, emoji: "🏛️" },
    BonusPOI { name: "Everest", lat: 27.988, lon: 86.925, emoji: "🏔️" },
    BonusPOI { name: "Chichén Itzá", lat: 20.684, lon: -88.568, emoji: "🛕" },
];

// ═══════════════════════════════════════════════════════════════
// AROUND THE WORLD ROUTE
// ═══════════════════════════════════════════════════════════════
#[derive(Debug, Clone, Serialize)]
struct RouteStop {
    city: &'static str,
    emoji: &'static str,
    spins: u32,
    chance: f64,
}

fn get_route() -> Vec<RouteStop> {
    vec![
        RouteStop { city: "London", emoji: "🇬🇧", spins: 3, chance: 1.0 },
        RouteStop { city: "Paris", emoji: "🇫🇷", spins: 4, chance: 0.72 },
        RouteStop { city: "Istanbul", emoji: "🇹🇷", spins: 5, chance: 0.62 },
        RouteStop { city: "Mumbai", emoji: "🇮🇳", spins: 6, chance: 0.52 },
        RouteStop { city: "Hong Kong", emoji: "🇭🇰", spins: 8, chance: 0.44 },
        RouteStop { city: "Tokyo", emoji: "🇯🇵", spins: 10, chance: 0.38 },
        RouteStop { city: "San Francisco", emoji: "🇺🇸", spins: 12, chance: 0.32 },
        RouteStop { city: "New York", emoji: "🗽", spins: 15, chance: 0.28 },
        RouteStop { city: "London Return", emoji: "🏆", spins: 20, chance: 1.0 },
    ]
}

// ═══════════════════════════════════════════════════════════════
// HAVERSINE
// ═══════════════════════════════════════════════════════════════
fn haversine(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    let d_lat = (lat2 - lat1).to_radians();
    let d_lon = (lon2 - lon1).to_radians();
    let a = (d_lat / 2.0).sin().powi(2)
        + lat1.to_radians().cos() * lat2.to_radians().cos()
        * (d_lon / 2.0).sin().powi(2);
    6371.0 * 2.0 * a.sqrt().atan2((1.0 - a).sqrt())
}

// ═══════════════════════════════════════════════════════════════
// REEL STRIP BUILDING
// ═══════════════════════════════════════════════════════════════
fn strip_weights(config: &str) -> Vec<(&'static str, u32)> {
    match config {
        "loose" => vec![("desert",6),("ocean",6),("tundra",5),("beach",5),("castle",5),("forest",5),("liberty",4),("torii",4),("taj",3),("pyramid",3),("eiffel",2),("kremlin",2),("globe",3),("plane",2)],
        "tight" => vec![("desert",10),("ocean",10),("tundra",9),("beach",6),("castle",6),("forest",6),("liberty",3),("torii",3),("taj",2),("pyramid",2),("eiffel",1),("kremlin",1),("globe",1),("plane",1)],
        _ => vec![("desert",8),("ocean",8),("tundra",7),("beach",6),("castle",6),("forest",5),("liberty",4),("torii",3),("taj",2),("pyramid",2),("eiffel",2),("kremlin",1),("globe",2),("plane",1)],
    }
}

fn build_strip(config: &str) -> Vec<Symbol> {
    let mut strip = Vec::new();
    for (id, count) in strip_weights(config) {
        for _ in 0..count { strip.push(sym_by_id(id)); }
    }
    let mut rng = rand::thread_rng();
    let len = strip.len();
    for i in (1..len).rev() { let j = rng.gen_range(0..=i); strip.swap(i, j); }
    strip
}

fn build_all_strips() -> HashMap<String, Vec<Vec<Symbol>>> {
    let mut map = HashMap::new();
    for config in &["loose", "standard", "tight"] {
        let strips: Vec<Vec<Symbol>> = (0..REELS).map(|_| build_strip(config)).collect();
        map.insert(config.to_string(), strips);
    }
    map
}

// ═══════════════════════════════════════════════════════════════
// ENGINE STATE (per session)
// ═══════════════════════════════════════════════════════════════
#[derive(Debug, Clone)]
struct Engine {
    balance: f64,
    bet: f64,
    total_wagered: f64,
    total_won: f64,
    spin_count: u32,
    consecutive_losses: u32,
    consecutive_wins: u32,
    last_bonus_spin: u32,
    spin_history: Vec<(f64, f64)>,
    free_spins_left: u32,
    free_spins_won: f64,
    jackpot_pool: f64,
    jackpot_contributed: f64,
    strips: HashMap<String, Vec<Vec<Symbol>>>,
    // Bonus state
    bonus_active: bool,
    bonus_stop: usize,
    bonus_spins: u32,
    bonus_trips: u32,
    bonus_spins_total: u32,
    // Dark pattern stats
    ldw_count: u32,
    ldw_lost: f64,
    true_wins: u32,
    true_losses: u32,
    celeb_fake: u32,
    celeb_real: u32,
    stop_presses: u32,
    anticip_events: u32,
    near_miss_events: u32,
    manual_spins: u32,
    auto_spins: u32,
}

impl Engine {
    fn new() -> Self {
        Engine {
            balance: 1000.0, bet: 1.0,
            total_wagered: 0.0, total_won: 0.0,
            spin_count: 0, consecutive_losses: 0, consecutive_wins: 0,
            last_bonus_spin: 0, spin_history: Vec::new(),
            free_spins_left: 0, free_spins_won: 0.0,
            jackpot_pool: 500.0, jackpot_contributed: 0.0,
            strips: build_all_strips(),
            bonus_active: false, bonus_stop: 0, bonus_spins: 0,
            bonus_trips: 0, bonus_spins_total: 0,
            ldw_count: 0, ldw_lost: 0.0, true_wins: 0, true_losses: 0,
            celeb_fake: 0, celeb_real: 0, stop_presses: 0,
            anticip_events: 0, near_miss_events: 0,
            manual_spins: 0, auto_spins: 0,
        }
    }

    fn calc_correction(&self) -> (String, f64, f64, HashMap<String, f64>, Vec<String>) {
        if self.spin_history.is_empty() {
            let mut rw = HashMap::new();
            for k in &["s","m","l","a"] { rw.insert(k.to_string(), TARGET_RTP); }
            return ("standard".to_string(), 0.0, TARGET_RTP, rw, vec!["Initial".to_string()]);
        }
        let calc = |slice: &[(f64,f64)]| -> f64 {
            if slice.is_empty() { return TARGET_RTP; }
            let w: f64 = slice.iter().map(|(b,_)| b).sum();
            let won: f64 = slice.iter().map(|(_,w)| w).sum();
            if w > 0.0 { won / w } else { TARGET_RTP }
        };
        let len = self.spin_history.len();
        let s = calc(&self.spin_history[len.saturating_sub(20)..]);
        let m = calc(&self.spin_history[len.saturating_sub(100)..]);
        let l = calc(&self.spin_history[len.saturating_sub(500)..]);
        let a = calc(&self.spin_history);
        let wr = s * 0.1 + m * 0.25 + l * 0.35 + a * 0.3;
        let dev = wr - TARGET_RTP;
        let sig = (1.0 / (1.0 + (-SIGMOID_K * dev).exp()) - 0.5) * 2.0;
        let mut sm = 0.0;
        let mut reasons = Vec::new();
        if self.consecutive_losses > 12 { sm -= 0.15; reasons.push(format!("Drought({})", self.consecutive_losses)); }
        else if self.consecutive_losses > 6 { sm -= 0.08; reasons.push(format!("Losing({})", self.consecutive_losses)); }
        if self.consecutive_wins > 4 { sm += 0.12; reasons.push(format!("Hot({})", self.consecutive_wins)); }
        let ssb = self.spin_count.saturating_sub(self.last_bonus_spin);
        if ssb > 120 { sm -= 0.06; reasons.push(format!("BonusDue({})", ssb)); }
        if reasons.is_empty() { reasons.push("Standard".to_string()); }
        let f = (sig + sm).clamp(-1.0, 1.0);
        let cfg = if f < -0.3 { "loose" } else if f > 0.3 { "tight" } else { "standard" };
        let mut rw = HashMap::new();
        rw.insert("s".to_string(), s); rw.insert("m".to_string(), m);
        rw.insert("l".to_string(), l); rw.insert("a".to_string(), a);
        (cfg.to_string(), f, wr, rw, reasons)
    }

    fn spin_grid(&self, config: &str) -> Vec<Vec<Symbol>> {
        let mut rng = rand::thread_rng();
        let strips = self.strips.get(config).unwrap();
        (0..REELS).map(|r| {
            let strip = &strips[r];
            let stop = rng.gen_range(0..strip.len());
            (0..ROWS).map(|row| strip[(stop + row) % strip.len()].clone()).collect()
        }).collect()
    }

    fn eval_paylines(&self, grid: &[Vec<Symbol>], bpl: f64) -> Vec<PaylineWinResult> {
        let mut wins = Vec::new();
        for (li, payline) in PAYLINE_DEFS.iter().enumerate() {
            let ids: Vec<&str> = payline.iter().enumerate()
                .map(|(reel, &row)| grid[reel][row].id).collect();
            let match_id = match ids.iter().find(|&&id| id != "globe" && id != "plane") {
                Some(&id) => id,
                None => if ids.iter().all(|&id| id == "globe") { "globe" } else { continue },
            };
            let mut count = 0;
            for &id in &ids { if id == match_id || id == "globe" { count += 1; } else { break; } }
            if count >= 3 {
                let mult = get_multiplier(match_id, count);
                if mult > 0.0 {
                    let positions: Vec<[usize; 2]> = payline.iter().take(count)
                        .enumerate().map(|(reel, &row)| [reel, row]).collect();
                    wins.push(PaylineWinResult {
                        line: li, symbol: match_id.to_string(), count, multiplier: mult,
                        payout: mult * bpl, positions,
                    });
                }
            }
        }
        wins
    }

    fn check_bonus(&self, lat: f64, lon: f64, radius: f64) -> Option<BonusHitResult> {
        let mut best: Option<(usize, f64)> = None;
        for (i, poi) in BONUS_POIS.iter().enumerate() {
            let d = haversine(lat, lon, poi.lat, poi.lon);
            if d <= radius {
                if best.is_none() || d < best.unwrap().1 { best = Some((i, d)); }
            }
        }
        best.map(|(i, dist)| {
            let poi = &BONUS_POIS[i];
            BonusHitResult { name: poi.name.to_string(), emoji: poi.emoji.to_string(), dist }
        })
    }

    fn nearest_poi(&self, lat: f64, lon: f64) -> NearMissResult {
        let (poi, dist) = BONUS_POIS.iter()
            .map(|p| (p, haversine(lat, lon, p.lat, p.lon)))
            .min_by(|a, b| a.1.partial_cmp(&b.1).unwrap()).unwrap();
        NearMissResult { name: poi.name.to_string(), emoji: poi.emoji.to_string(), dist }
    }

    fn do_spin(&mut self, is_auto: bool) -> SpinResponse {
        let mut rng = rand::thread_rng();
        let is_free = self.free_spins_left > 0;

        if !is_free && self.balance < self.bet {
            return SpinResponse::error("Insufficient fuel!");
        }
        if !is_free { self.balance -= self.bet; }
        self.total_wagered += self.bet;
        self.spin_count += 1;
        if is_free { self.free_spins_left -= 1; }
        if is_auto { self.auto_spins += 1; } else { self.manual_spins += 1; }

        let (cfg, corr, wr, rw, reasons) = self.calc_correction();
        let mut eff_cfg = cfg.clone();
        let ssb = self.spin_count.saturating_sub(self.last_bonus_spin);
        if ssb > 100 && eff_cfg == "tight" { eff_cfg = "standard".to_string(); }
        if ssb > 160 { eff_cfg = "loose".to_string(); }

        let grid = self.spin_grid(&eff_cfg);
        let bpl = self.bet / NLINES as f64;
        let payline_wins = self.eval_paylines(&grid, bpl);
        let payline_total: f64 = payline_wins.iter().map(|w| w.payout).sum();

        let multiplier = if payline_total > 0.0 && rng.gen_bool(0.03) {
            [2.0, 3.0, 5.0][rng.gen_range(0..3)]
        } else { 1.0 };
        let mut total_win = payline_total * multiplier;

        // Haversine bonus
        let spin_lat: f64 = rng.gen_range(-90.0..=90.0);
        let spin_lon: f64 = rng.gen_range(-180.0..=180.0);
        let radius = (BASE_BONUS_RADIUS * (1.0 - corr * 0.6)).clamp(45.0, 300.0);
        let bonus_hit = self.check_bonus(spin_lat, spin_lon, radius);
        let near_miss = if bonus_hit.is_none() { Some(self.nearest_poi(spin_lat, spin_lon)) } else { None };
        let near_miss_close = near_miss.as_ref().map_or(false, |nm| nm.dist < 500.0);
        if near_miss_close { self.near_miss_events += 1; }

        // Scatter pay on bonus trigger
        if bonus_hit.is_some() { total_win += 3.0 * self.bet; }

        // Jackpot
        let jp = self.bet * 0.015;
        self.jackpot_pool += jp;
        self.jackpot_contributed += jp;

        // Update state
        self.total_won += total_win;
        self.spin_history.push((self.bet, total_win));
        self.balance += total_win;

        if total_win > 0.0 { self.consecutive_wins += 1; self.consecutive_losses = 0; }
        else { self.consecutive_losses += 1; self.consecutive_wins = 0; }

        // Classify for dark patterns
        let outcome = if total_win <= 0.0 { "LOSS" }
            else if total_win < self.bet { "LDW" }
            else { "WIN" };

        match outcome {
            "LDW" => { self.ldw_count += 1; self.ldw_lost += self.bet - total_win; }
            "WIN" => { self.true_wins += 1; }
            _ => { self.true_losses += 1; }
        }
        if total_win > 0.0 {
            if total_win < self.bet { self.celeb_fake += 1; } else { self.celeb_real += 1; }
        }

        // Celebration level
        let celeb = if total_win <= 0.0 { 0 }
            else { let r = total_win / self.bet; if r >= 20.0 { 5 } else if r >= 8.0 { 4 } else if r >= 2.0 { 3 } else if r >= 1.0 { 2 } else { 1 } };

        // Bonus trigger
        let mut bonus_triggered = false;
        if bonus_hit.is_some() && self.free_spins_left == 0 && !self.bonus_active {
            bonus_triggered = true;
            self.last_bonus_spin = self.spin_count;
            self.bonus_active = true;
            self.bonus_stop = 0;
            self.bonus_spins = get_route()[0].spins;
            self.bonus_trips += 1;
        }

        // Free spins tracking
        if is_free { self.free_spins_won += total_win; }

        let rtp = if self.total_wagered > 0.0 { self.total_won / self.total_wagered * 100.0 } else { 0.0 };

        // Serialize grid for response
        let grid_data: Vec<Vec<SymbolData>> = grid.iter().map(|col| {
            col.iter().map(|s| SymbolData {
                id: s.id.to_string(), emoji: s.emoji.to_string(), name: s.name.to_string(), tier: s.tier,
            }).collect()
        }).collect();

        SpinResponse {
            ok: true, error: None,
            grid: grid_data,
            wins: payline_wins,
            total_win, multiplier,
            spin_lat, spin_lon, bonus_radius: radius,
            bonus_hit, near_miss: if near_miss_close { near_miss } else { None },
            bonus_triggered,
            outcome: outcome.to_string(),
            celeb_level: celeb,
            state: self.get_state(),
            correction: CorrectionInfo { config: eff_cfg, correction: corr, weighted_rtp: wr, windows: rw, reasons },
        }
    }

    fn bonus_collect(&mut self) -> BonusActionResponse {
        if !self.bonus_active {
            return BonusActionResponse { ok: false, action: "collect".into(), success: false,
                spins_awarded: 0, message: "No active bonus".into(), state: self.get_state(), route: get_route() };
        }
        let spins = self.bonus_spins;
        self.free_spins_left = spins;
        self.free_spins_won = 0.0;
        self.bonus_spins_total += spins;
        self.bonus_active = false;
        BonusActionResponse {
            ok: true, action: "collect".into(), success: true, spins_awarded: spins,
            message: format!("Collected {} free spins!", spins), state: self.get_state(), route: get_route(),
        }
    }

    fn bonus_gamble(&mut self) -> BonusActionResponse {
        if !self.bonus_active {
            return BonusActionResponse { ok: false, action: "gamble".into(), success: false,
                spins_awarded: 0, message: "No active bonus".into(), state: self.get_state(), route: get_route() };
        }
        let route = get_route();
        let next = self.bonus_stop + 1;
        if next >= route.len() {
            return self.bonus_collect();
        }
        let mut rng = rand::thread_rng();
        let success = rng.gen_bool(route[next].chance);
        if success {
            self.bonus_spins += route[next].spins;
            self.bonus_stop = next;
            let msg = format!("Safe landing in {}! {} spins!", route[next].city, self.bonus_spins);
            // Auto-collect at final destination
            if next >= route.len() - 1 {
                let mut resp = self.bonus_collect();
                resp.message = format!("🏆 Circumnavigation complete! {}", resp.message);
                return resp;
            }
            BonusActionResponse {
                ok: true, action: "gamble".into(), success: true, spins_awarded: 0,
                message: msg, state: self.get_state(), route,
            }
        } else {
            let lost = self.bonus_spins;
            self.bonus_spins = 0;
            self.bonus_active = false;
            BonusActionResponse {
                ok: true, action: "gamble".into(), success: false, spins_awarded: 0,
                message: format!("Crashed! Lost all {} spins!", lost), state: self.get_state(), route,
            }
        }
    }

    fn get_state(&self) -> GameState {
        let route = get_route();
        GameState {
            balance: self.balance, bet: self.bet,
            total_wagered: self.total_wagered, total_won: self.total_won,
            rtp: if self.total_wagered > 0.0 { self.total_won / self.total_wagered * 100.0 } else { 0.0 },
            spin_count: self.spin_count,
            free_spins_left: self.free_spins_left, free_spins_won: self.free_spins_won,
            jackpot_pool: self.jackpot_pool, jackpot_contributed: self.jackpot_contributed,
            bonus_active: self.bonus_active, bonus_stop: self.bonus_stop, bonus_spins: self.bonus_spins,
            bonus_trips: self.bonus_trips, bonus_spins_total: self.bonus_spins_total,
            consecutive_wins: self.consecutive_wins, consecutive_losses: self.consecutive_losses,
            dp: DPStats {
                ldw_count: self.ldw_count, ldw_lost: self.ldw_lost,
                true_wins: self.true_wins, true_losses: self.true_losses,
                celeb_fake: self.celeb_fake, celeb_real: self.celeb_real,
                stop_presses: self.stop_presses, anticip_events: self.anticip_events,
                near_miss_events: self.near_miss_events,
                manual_spins: self.manual_spins, auto_spins: self.auto_spins,
            },
            route,
        }
    }

    fn reset(&mut self) {
        *self = Engine::new();
    }
}

// ═══════════════════════════════════════════════════════════════
// API DATA TYPES
// ═══════════════════════════════════════════════════════════════
#[derive(Serialize)]
struct SymbolData { id: String, emoji: String, name: String, tier: u8 }

#[derive(Serialize)]
struct PaylineWinResult {
    line: usize, symbol: String, count: usize,
    multiplier: f64, payout: f64, positions: Vec<[usize; 2]>,
}

#[derive(Serialize, Clone)]
struct BonusHitResult { name: String, emoji: String, dist: f64 }

#[derive(Serialize, Clone)]
struct NearMissResult { name: String, emoji: String, dist: f64 }

#[derive(Serialize)]
struct CorrectionInfo {
    config: String, correction: f64, weighted_rtp: f64,
    windows: HashMap<String, f64>, reasons: Vec<String>,
}

#[derive(Serialize)]
struct DPStats {
    ldw_count: u32, ldw_lost: f64, true_wins: u32, true_losses: u32,
    celeb_fake: u32, celeb_real: u32, stop_presses: u32,
    anticip_events: u32, near_miss_events: u32,
    manual_spins: u32, auto_spins: u32,
}

#[derive(Serialize)]
struct GameState {
    balance: f64, bet: f64, total_wagered: f64, total_won: f64, rtp: f64,
    spin_count: u32, free_spins_left: u32, free_spins_won: f64,
    jackpot_pool: f64, jackpot_contributed: f64,
    bonus_active: bool, bonus_stop: usize, bonus_spins: u32,
    bonus_trips: u32, bonus_spins_total: u32,
    consecutive_wins: u32, consecutive_losses: u32,
    dp: DPStats, route: Vec<RouteStop>,
}

#[derive(Serialize)]
struct SpinResponse {
    ok: bool,
    error: Option<String>,
    grid: Vec<Vec<SymbolData>>,
    wins: Vec<PaylineWinResult>,
    total_win: f64,
    multiplier: f64,
    spin_lat: f64,
    spin_lon: f64,
    bonus_radius: f64,
    bonus_hit: Option<BonusHitResult>,
    near_miss: Option<NearMissResult>,
    bonus_triggered: bool,
    outcome: String,
    celeb_level: u32,
    state: GameState,
    correction: CorrectionInfo,
}

impl SpinResponse {
    fn error(msg: &str) -> Self {
        SpinResponse {
            ok: false, error: Some(msg.to_string()),
            grid: vec![], wins: vec![], total_win: 0.0, multiplier: 1.0,
            spin_lat: 0.0, spin_lon: 0.0, bonus_radius: 0.0,
            bonus_hit: None, near_miss: None, bonus_triggered: false,
            outcome: "ERROR".to_string(), celeb_level: 0,
            state: GameState {
                balance: 0.0, bet: 0.0, total_wagered: 0.0, total_won: 0.0, rtp: 0.0,
                spin_count: 0, free_spins_left: 0, free_spins_won: 0.0,
                jackpot_pool: 0.0, jackpot_contributed: 0.0,
                bonus_active: false, bonus_stop: 0, bonus_spins: 0,
                bonus_trips: 0, bonus_spins_total: 0,
                consecutive_wins: 0, consecutive_losses: 0,
                dp: DPStats { ldw_count:0,ldw_lost:0.0,true_wins:0,true_losses:0,celeb_fake:0,celeb_real:0,stop_presses:0,anticip_events:0,near_miss_events:0,manual_spins:0,auto_spins:0 },
                route: vec![],
            },
            correction: CorrectionInfo { config: String::new(), correction: 0.0, weighted_rtp: 0.0, windows: HashMap::new(), reasons: vec![] },
        }
    }
}

#[derive(Serialize)]
struct BonusActionResponse {
    ok: bool,
    action: String,
    success: bool,
    spins_awarded: u32,
    message: String,
    state: GameState,
    route: Vec<RouteStop>,
}

#[derive(Deserialize)]
struct BetRequest { bet: f64 }

#[derive(Deserialize)]
struct SpinRequest {
    #[serde(default)]
    is_auto: bool,
}

#[derive(Serialize)]
struct SessionResponse { session_id: String, state: GameState }

#[derive(Deserialize)]
struct SessionRequest { session_id: String }

// ═══════════════════════════════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════════════════════════════
type Sessions = Arc<Mutex<HashMap<String, Engine>>>;

// ═══════════════════════════════════════════════════════════════
// ROUTE HANDLERS
// ═══════════════════════════════════════════════════════════════
async fn create_session(State(sessions): State<Sessions>) -> Json<SessionResponse> {
    let id = uuid::Uuid::new_v4().to_string();
    let engine = Engine::new();
    let state = engine.get_state();
    sessions.lock().unwrap().insert(id.clone(), engine);
    Json(SessionResponse { session_id: id, state })
}

async fn api_spin(
    State(sessions): State<Sessions>,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<SpinResponse>, StatusCode> {
    let sid = req.get("session_id").and_then(|v| v.as_str()).ok_or(StatusCode::BAD_REQUEST)?;
    let is_auto = req.get("is_auto").and_then(|v| v.as_bool()).unwrap_or(false);
    let mut sessions = sessions.lock().unwrap();
    let engine = sessions.get_mut(sid).ok_or(StatusCode::NOT_FOUND)?;
    Ok(Json(engine.do_spin(is_auto)))
}

async fn api_bet(
    State(sessions): State<Sessions>,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<GameState>, StatusCode> {
    let sid = req.get("session_id").and_then(|v| v.as_str()).ok_or(StatusCode::BAD_REQUEST)?;
    let bet = req.get("bet").and_then(|v| v.as_f64()).ok_or(StatusCode::BAD_REQUEST)?;
    if bet <= 0.0 || bet > 10.0 { return Err(StatusCode::BAD_REQUEST); }
    let mut sessions = sessions.lock().unwrap();
    let engine = sessions.get_mut(sid).ok_or(StatusCode::NOT_FOUND)?;
    engine.bet = bet;
    Ok(Json(engine.get_state()))
}

async fn api_bonus_collect(
    State(sessions): State<Sessions>,
    Json(req): Json<SessionRequest>,
) -> Result<Json<BonusActionResponse>, StatusCode> {
    let mut sessions = sessions.lock().unwrap();
    let engine = sessions.get_mut(&req.session_id).ok_or(StatusCode::NOT_FOUND)?;
    Ok(Json(engine.bonus_collect()))
}

async fn api_bonus_gamble(
    State(sessions): State<Sessions>,
    Json(req): Json<SessionRequest>,
) -> Result<Json<BonusActionResponse>, StatusCode> {
    let mut sessions = sessions.lock().unwrap();
    let engine = sessions.get_mut(&req.session_id).ok_or(StatusCode::NOT_FOUND)?;
    Ok(Json(engine.bonus_gamble()))
}

async fn api_reset(
    State(sessions): State<Sessions>,
    Json(req): Json<SessionRequest>,
) -> Result<Json<GameState>, StatusCode> {
    let mut sessions = sessions.lock().unwrap();
    let engine = sessions.get_mut(&req.session_id).ok_or(StatusCode::NOT_FOUND)?;
    engine.reset();
    Ok(Json(engine.get_state()))
}

async fn api_state(
    State(sessions): State<Sessions>,
    Json(req): Json<SessionRequest>,
) -> Result<Json<GameState>, StatusCode> {
    let sessions = sessions.lock().unwrap();
    let engine = sessions.get(&req.session_id).ok_or(StatusCode::NOT_FOUND)?;
    Ok(Json(engine.get_state()))
}

// ═══════════════════════════════════════════════════════════════
// MAIN — Axum Server
// ═══════════════════════════════════════════════════════════════
#[tokio::main]
async fn main() {
    let sessions: Sessions = Arc::new(Mutex::new(HashMap::new()));

    let api = Router::new()
        .route("/api/session", post(create_session))
        .route("/api/spin", post(api_spin))
        .route("/api/bet", post(api_bet))
        .route("/api/bonus/collect", post(api_bonus_collect))
        .route("/api/bonus/gamble", post(api_bonus_gamble))
        .route("/api/reset", post(api_reset))
        .route("/api/state", post(api_state));

    let app = Router::new()
        .merge(api)
        .fallback_service(ServeDir::new("static"))
        .layer(CorsLayer::permissive())
        .with_state(sessions);

    let addr = "0.0.0.0:3000";
    println!("🌍 AROUND THE WORLD IN 80 DAYS");
    println!("   Server running on http://{}", addr);
    println!("   Static files from ./static/");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
