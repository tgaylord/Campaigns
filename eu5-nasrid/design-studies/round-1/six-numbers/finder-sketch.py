"""Story finder, sketch. Scans a campaign's checkpoint series and proposes numbers worth a chapter.

Run:  python3 -I finder-sketch.py <path-to-brief/data>
Not production code: it exists to show that the detectors find real stories in real data.
Every detector is campaign-agnostic; only SERIES (which fields to read) is per campaign.
"""
import json, sys, os

DATA = sys.argv[1]
load = lambda f: json.load(open(os.path.join(DATA, f)))
cps = load("checkpoints.json")
rr = {r["checkpoint"]: r for r in load("realm-readings.json")}
ranks = load("world-rankings.json")
TAG = {"GRA", "ADU"}  # the player's tags over time (per campaign)

def share(cp, group, key):
    p = cp["population"]; t = p.get("total") or 0
    return (p.get(group, {}) or {}).get(key, 0) / t * 100 if t else None

def rank(cp):
    for row in ranks.get(cp["date"], []):
        if row[0] in TAG: return row[1]
    return None

def rv(cp, key):
    r = rr.get(cp["date"]);  return r["societalValues"].get(key) if r else None

# --- per-campaign configuration: which series, their units, their provenance -------------
SERIES = {
  "people":          dict(get=lambda c: c["population"]["total"], unit="souls", prov="read", scope="realm"),
  "towns":           dict(get=lambda c: c["locations"], unit="locations", prov="read", scope="realm"),
  "sunni_share":     dict(get=lambda c: share(c, "religions", "Sunni"), unit="% Sunni", prov="read", scope="share"),
  "andalusi_share":  dict(get=lambda c: share(c, "cultures", "Andalusi"), unit="% Andalusī", prov="read", scope="share"),
  "sovereignty":     dict(get=lambda c: (c["strait"] or {}).get("sovereignty"), unit="sovereignty", prov="read", scope="level"),
  "ships":           dict(get=lambda c: (c["military"] or {}).get("ships"), unit="ships", prov="read", scope="level"),
  "world_rank":      dict(get=rank, unit="world rank", prov="read", scope="rank"),
  "stability":       dict(get=lambda c: c.get("stability"), unit="stability", prov="read", scope="level"),
  "land_vs_naval":   dict(get=lambda c: rv(c, "land_vs_naval"), unit="land(-)/sea(+)", prov="read", scope="level"),
  "burgher_power":   dict(get=lambda c: next((e["power"] for e in c["estates"] or [] if e["id"] == "burghers"), None),
                          unit="% of power", prov="estimated", scope="level"),
}

def series(name):
    out = []
    for c in cps:
        try: v = SERIES[name]["get"](c)
        except Exception: v = None
        if v is not None: out.append((c["date"], v, c["locations"]))
    return out

def drop_transients(s):
    """A checkpoint that jumps away and snaps straight back (a revolt, a save taken mid-war) is
    reported separately, not used as a peak or trough."""
    keep = []
    for i, p in enumerate(s):
        if 0 < i < len(s) - 1:
            a, b, n = s[i - 1][1], p[1], s[i + 1][1]
            if a and abs(b - a) / (abs(a) + 1e-9) > 0.25 and abs(n - a) / (abs(a) + 1e-9) < 0.08:
                continue
        keep.append(p)
    return keep

proposals = []
def propose(kind, name, score, headline, evidence, graphic):
    proposals.append(dict(kind=kind, series=name, score=round(score, 1), headline=headline,
                          evidence=evidence, graphic=graphic, provenance=SERIES[name]["prov"]))

for name, cfg in SERIES.items():
    s = series(name) if cfg["scope"] == "realm" else drop_transients(series(name))
    if len(s) < 4: continue
    vals = [v for _, v, _ in s]

    # 1. DROP: steepest peak-to-trough fall. Guard: only between checkpoints with the same
    #    number of towns when the series is a realm total (otherwise conquest hides the loss).
    if cfg["scope"] in ("realm", "level"):
        best = None
        for i in range(len(s)):
            for j in range(i + 1, len(s)):
                if cfg["scope"] == "realm" and s[i][2] != s[j][2]: continue
                if cfg["scope"] == "realm":
                    if s[i][1] <= 0: continue
                    f = (s[i][1] - s[j][1]) / s[i][1]          # relative fall
                else:
                    f = (s[i][1] - s[j][1]) / ((max(vals) - min(vals)) or 1)  # share of the series' range
                if best is None or f > best[0]: best = (f, i, j)
        if best and best[0] > 0.2:
            f, i, j = best
            what = f"-{f*100:.0f}% {cfg['unit']} (same towns)" if cfg["scope"] == "realm" else f"fell {s[i][1]-s[j][1]:,.1f} {cfg['unit']}"
            propose("drop", name, f * 100, what,
                    f"{s[i][0]} {s[i][1]:,.1f} -> {s[j][0]} {s[j][1]:,.1f}", "dots fading / falling line")

    # 2. RECORD: all-time extreme reached away from the start
    lo, hi = min(vals), max(vals)
    for v, word in ((lo, "best" if cfg["scope"] == "rank" else "lowest"), (hi, "worst" if cfg["scope"] == "rank" else "highest")):
        k = vals.index(v)
        if 0 < k < len(vals) - 1:
            span = (hi - lo) or 1
            propose("record", name, 40 * span / (abs(vals[0]) + span), f"{word} {cfg['unit']}: {v:,.2f}",
                    f"on {s[k][0]}", "annotated line, one dot ringed")

    # 3. PLATEAU BROKEN: value frozen for a long stretch, then moving
    run_start = 0
    for k in range(1, len(s)):
        if abs(s[k][1] - s[k - 1][1]) > 0.5 or k == len(s) - 1:
            y0, y1 = int(s[run_start][0][:4]), int(s[k - 1][0][:4])
            if y1 - y0 >= 20 and k < len(s) - 1:
                move = s[-1][1] - s[k - 1][1]
                propose("plateau broken", name, (y1 - y0) + abs(move), f"frozen {y1-y0} years, then {move:+.1f}",
                        f"{s[run_start][0]}..{s[k-1][0]} at {s[k-1][1]:.2f}; {s[-1][0]} {s[-1][1]:.2f}", "flat line, then a needle")
            run_start = k

    # 4. REVERSAL: long trend one way, then the other (net move each side, simple)
    k = vals.index(lo) if (vals[0] - lo) > (hi - vals[0]) else vals.index(hi)
    if 0 < k < len(vals) - 1:
        before, after = vals[k] - vals[0], vals[-1] - vals[k]
        if before * after < 0 and min(abs(before), abs(after)) > 0.15 * ((hi - lo) or 1):
            propose("reversal", name, abs(before) + abs(after),
                    f"{vals[0]:,.0f} -> {vals[k]:,.0f} -> {vals[-1]:,.0f} {cfg['unit']}",
                    f"turn at {s[k][0]}", "line with the turn marked")

# 5. BREATH (pattern, campaign-agnostic): towns jump up, then fall back within ~1 year -> conquest, then release
t = series("towns"); breaths = []
for i in range(1, len(t) - 1):
    if t[i][1] > t[i - 1][1] * 1.15:
        for j in range(i + 1, min(i + 4, len(t))):
            if t[j][1] < t[i][1] * 0.92 and int(t[j][0][:4]) - int(t[i][0][:4]) <= 1:
                breaths.append(f"{t[i-1][1]}->{t[i][1]}->{t[j][1]} ({t[i][0][:4]})"); break
if breaths:
    proposals.append(dict(kind="pattern: breath", series="towns", score=10 * len(breaths), provenance="read",
                          headline=f"took and gave back, {len(breaths)} times", evidence="; ".join(breaths),
                          graphic="map breathing in and out"))

# 6. LEAD/LAG: one series moves decades before a related one (pairs are configured per campaign)
def first_move(name, frac=0.5):
    s = series(name); a, b = s[0][1], s[-1][1]
    for d, v, _ in s:
        if (v - a) * (b - a) > 0 and abs(v - a) >= frac * abs(b - a): return d
lag_pairs = [("ships", "land_vs_naval")]
for a, b in lag_pairs:
    da, db = first_move(a), first_move(b)
    if da and db and int(db[:4]) - int(da[:4]) >= 10:
        proposals.append(dict(kind="lead/lag", series=f"{a} vs {b}", score=int(db[:4]) - int(da[:4]),
                              provenance="read", headline=f"{a} moved {int(db[:4]) - int(da[:4])} years before {b}",
                              evidence=f"half of {a}'s change by {da}; half of {b}'s by {db}",
                              graphic="two lines, shared time axis"))

# 7. DEPARTURE FROM A HELD LEVEL. Some series sit flat because the player holds them there
#    (Trent sets each estate's taxes to keep its satisfaction at a chosen level: most at 50,
#    the nobles nearer 40). A flat line is policy, not news; a move off the held level is the
#    signal. The held level is learned as the series' most common value; nothing is hard-coded.
from collections import Counter, defaultdict
HELD = ["nobles", "clergy", "burghers", "peasants", "dhimmi"]   # per campaign: which series are held
by_date = defaultdict(list)
for est in HELD:
    s = [(c["date"], e["satisfaction"]) for c in cps for e in (c["estates"] or [])
         if e["id"] == est and e["satisfaction"] is not None]
    if len(s) < 10: continue
    held, n = Counter(round(v) for _, v in s).most_common(1)[0]
    if n / len(s) < 0.3: continue            # no clear held level: leave it to the other detectors
    for d, v in s:
        if abs(v - held) >= 8: by_date[d].append((est, held, round(v)))
    worst = max(s, key=lambda p: abs(p[1] - held))
    if abs(worst[1] - held) >= 15:
        proposals.append(dict(kind="off held level", series=f"{est} satisfaction", score=abs(worst[1] - held),
                              provenance="read", headline=f"held at {held}, fell/rose to {worst[1]:.0f}",
                              evidence=f"on {worst[0]}; held level is {held} in {n} of {len(s)} saves",
                              graphic="flat band with the break marked"))
# several estates leaving their held levels at the same save is bigger news than any one alone
for d, moves in by_date.items():
    if len(moves) >= 3:
        proposals.append(dict(kind="estates break ranks", series=f"satisfaction @ {d}", provenance="read",
                              score=sum(abs(v - h) for _, h, v in moves),
                              headline=f"{len(moves)} estates off their held levels at once",
                              evidence=", ".join(f"{e} {h}->{v}" for e, h, v in moves),
                              graphic="row of gauges, held level marked"))

proposals.sort(key=lambda p: -p["score"])
seen = set()
for p in [p for p in proposals if p["score"] >= 20]:
    key = (p["kind"], p["series"])
    if key in seen: continue
    seen.add(key)
    flag = "  [ESTIMATED]" if p["provenance"] == "estimated" else ""
    print(f"{p['score']:>6}  {p['kind']:<15} {p['series']:<20} {p['headline']}{flag}\n        {p['evidence']}  -> {p['graphic']}")
