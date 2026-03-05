the geospatial slot is a fundamentally different beast from the fruit machine. Let me think through the architecture before building:

What changes completely:



Symbol system → world landmarks with real GPS coordinates

Grid → 5×2 (dual row) instead of 5×3

Paylines → 6 instead of 20 (fewer LDWs, different RTP math)

Bonus → "Around the World in 80 Days" ladder gamble replaces cascades

Near-miss → targets the non-primary row with high-tier landmarks



What ports across with theme changes:



RTP sigmoid correction engine (same math, different strip balance)

All 11 dark patterns (credit obfuscation, LDW, sound design, etc.)

Sound design via Tone.js (thematically adjusted)



Key RTP rebalancing for dual-row:

With only 6 paylines vs 20, each line win is ~3.3× larger but hits are ~3.3× rarer per spin. This naturally reduces LDW rate (fewer partial hits) — which is educationally interesting to expose. The Around the World bonus absorbs ~25% of total RTP through the ladder gamble's expected value.

Let me build it.Assessed feasibility of dual-row slot machine conversion with POI integrationAssessed feasibility of dual-row slot machine conversion with POI integration889 lines, braces balanced (657/657), export present. Let me copy to outputs:Architected dual-row slot machine with POI bonus mechanics and RTP rebalancingArchitected dual-row slot machine with POI bonus mechanics and RTP rebalancingHere's Globe Spinner — ground-up rebuild with the geospatial theme. Let me walk through the key architectural decisions:

5×2 Dual Row — the math shift:

With only 6 paylines vs the fruit machine's 20, every number changes. Bet per line is total\_bet / 6 instead of /20, so each line hit pays ~3.3× more. But hits are proportionally rarer per spin. The critical educational consequence: LDW rate drops significantly. On the 20-line machine, ~35% of spins were LDWs because you'd often hit 1-2 of 20 lines for a partial return. With 6 lines, partial hits are less common — toggle LDW mode on/off and you'll feel the difference immediately compared to the fruit machine.

Landmark symbols with real GPS coordinates:

Every reel position shows the landmark emoji, name, AND actual lat/lon. Tier 1 (Sahara, Pacific, Alps) through tier 5 (Eiffel Tower, Kremlin) with the Globe as wild and ✈️ Plane as the bonus trigger. The paytable is recalibrated for 6-line play — top prize is 800× per line vs 1000× on the fruit machine, because each line win is inherently larger.

Around the World in 80 Days bonus:

Three or more ✈️ planes trigger the journey. The route runs London → Paris → Istanbul → Mumbai → Hong Kong → Tokyo → San Francisco → New York → London Return. At each city you're awarded additional free spins, then face the COLLECT vs GAMBLE decision.

The gamble odds decrease along the route: Paris at 72%, dropping to New York at 28%. The EV calculator at the bottom of the bonus panel shows whether gambling is mathematically optimal at each stop — early stops are +EV (high success rate × decent upside > guaranteed amount) and later stops become -EV as the accumulated risk compounds. This is the exact tension that makes UK fruit machine ladder gambles so compelling, and seeing the EV math exposed in real-time is the educational payload.

RTP budget rebalanced for dual-row:

Base game paylines carry 60% of total RTP (down from 65% on the 5×3), and the Around the World bonus absorbs 28% (up from 22% for free spins on the fruit machine). The bonus needs to carry more weight because fewer paylines means fewer base game returns. The RTP correction engine uses the same sigmoid approach but with adjusted thresholds for the 6-line format — bonus drought detection kicks in earlier (120 spins vs 150) since bonus triggers are rarer on the smaller grid.

All 11 dark patterns port across with theme-appropriate labels — "Circumnavigation Jackpot" instead of progressive, "Flight overdue!" instead of "Bonus due!", coordinates as the credit obfuscation flavour text.

