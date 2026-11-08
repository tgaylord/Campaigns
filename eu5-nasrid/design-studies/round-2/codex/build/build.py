"""Build the Codex mockup: read brief2/chronicle + brief2/data, compute leaf addresses,
codex order, canons, rows and quires, inline everything into template.html -> ../mockup.html.

Run:  python3 -I build.py <brief2-dir>
This is the same pass a real static build would do after each session (see pitch.md).
"""
import json, math, os, re, sys, glob

BRIEF = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))

HMONTHS = ["Muḥarram", "Ṣafar", "Rabīʿ al-Awwal", "Rabīʿ al-Thānī", "Jumādā al-Ūlā",
           "Jumādā al-Ākhira", "Rajab", "Shaʿbān", "Ramaḍān", "Shawwāl",
           "Dhū al-Qaʿda", "Dhū al-Ḥijja"]
WMONTHS = ["January", "February", "March", "April", "May", "June", "July", "August",
           "September", "October", "November", "December"]

# ---- calendars (tabular Hijri on the Julian calendar, as the brief specifies) ----
def h2jd(y, m, d):
    return d + math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + (3 + 11 * y) // 30 + 1948439.5 - 1

def jul2jd(y, m, d):
    a = (14 - m) // 12; y2 = y + 4800 - a; m2 = m + 12 * a - 3
    return d + (153 * m2 + 2) // 5 + 365 * y2 + y2 // 4 - 32083 - 0.5

def jd2jul(jd):
    jd = jd + 0.5; Z = int(jd); c = Z + 32082; d = (4 * c + 3) // 1461
    e = c - (1461 * d) // 4; m = (5 * e + 2) // 153
    return d - 4800 + m // 10, m + 3 - 12 * (m // 10), e - (153 * m + 2) // 5 + 1

def jd2h(jd):
    y = int((30 * (jd - 1948439.5) + 10646) // 10631)
    while h2jd(y + 1, 1, 1) <= jd: y += 1
    while h2jd(y, 1, 1) > jd: y -= 1
    m = 1
    while m < 12 and h2jd(y, m + 1, 1) <= jd: m += 1
    return y, m, int(jd - h2jd(y, m, 1)) + 1

def jul_str(s):
    y, m, d = map(int, s.split("-"))
    return f"{d} {WMONTHS[m-1]} {y}"

# ---- read the material ----
books = json.load(open(os.path.join(BRIEF, "data/books.json")))
people = json.load(open(os.path.join(BRIEF, "data/people.json")))
checkpoints = json.load(open(os.path.join(BRIEF, "data/checkpoints.json")))
bookidx = {b["id"]: i for i, b in enumerate(books)}

def front(text):
    _, fm, body = text.split("---", 2)
    meta = {}
    for line in fm.strip().splitlines():
        k, _, v = line.partition(":")
        v = v.strip()
        if v.startswith("[") and v.endswith("]"):
            v = [x.strip() for x in v[1:-1].split(",") if x.strip()]
        meta[k.strip()] = v
    return meta, body.strip()

leaves = []
for f in sorted(glob.glob(os.path.join(BRIEF, "chronicle/*.md"))):
    meta, body = front(open(f, encoding="utf-8").read())
    base = os.path.basename(f)[:-3]
    hy, hm, hd = map(int, base[:10].split("-"))
    leaves.append(dict(slug=base, hy=hy, hm=hm, hd=hd, title=meta["title"], date=meta["date"],
                       book=meta["era"], people=meta.get("people", []), places=meta.get("places", []),
                       sources=meta.get("sources", []), body=body,
                       words=len(re.sub(r"\]\([^)]*\)", "]", body).split())))

# codex order: Hijri date, then slug (a real build would read an explicit `seq` for same-day leaves)
leaves.sort(key=lambda L: (L["hy"], L["hm"], L["hd"], L["slug"]))

# addresses: hy-mm-dd, with a/b/c suffix only where a day holds more than one leaf
from collections import defaultdict, Counter
byday = defaultdict(list)
for L in leaves: byday[(L["hy"], L["hm"], L["hd"])].append(L)
for day, ls in byday.items():
    for i, L in enumerate(ls):
        L["addr"] = f"{day[0]}-{day[1]:02d}-{day[2]:02d}" + ("abcdefgh"[i] if len(ls) > 1 else "")
for i, L in enumerate(leaves): L["n"] = i + 1

# first words for catchwords
def plain(s):
    s = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", s)
    return s.replace("*", "")
for L in leaves:
    paras = [p.strip() for p in L["body"].split("\n\n") if p.strip()]
    first = next(p for p in paras if not re.match(r"^Here (begins|ends) the Book", p))
    words = plain(first).split()
    L["catch"] = " ".join(words[:11])

# per-book numbering
counter = Counter()
for L in leaves:
    counter[L["book"]] += 1; L["bn"] = counter[L["book"]]
for b in books:
    bl = [L for L in leaves if L["book"] == b["id"]]
    b["leaves"] = len(bl); b["words"] = sum(L["words"] for L in bl)
    b["first"] = bl[0]["addr"]; b["last"] = bl[-1]["addr"]
    b["closed"] = b["end"] is not None
    sh = jd2h(jul2jd(*map(int, b["start"].split("-"))))
    b["hstart"] = sh[0]
    b["hend"] = jd2h(jul2jd(*map(int, b["end"].split("-"))))[0] if b["end"] else None
    b["startStr"] = jul_str(b["start"]); b["endStr"] = jul_str(b["end"]) if b["end"] else None

# canons: a canon closes when a book closes (on that book's last leaf); columns = books with leaves in it,
# ordered by when the book opens.
canons, cur = [], []
for L in leaves:
    cur.append(L)
    b = books[bookidx[L["book"]]]
    if b["closed"] and L["addr"] == b["last"]:
        canons.append(cur); cur = []
if cur: canons.append(cur)
CANON = []
for ci, ls in enumerate(canons):
    cols = sorted({L["book"] for L in ls}, key=lambda bid: (books[bookidx[bid]]["start"], bookidx[bid]))
    for L in ls: L["canon"] = ci
    CANON.append(dict(cols=cols, first=ls[0]["addr"], last=ls[-1]["addr"],
                      hy0=ls[0]["hy"], hy1=ls[-1]["hy"]))

# Hijri year -> Western years it spans
def hyear_west(y):
    a = jd2jul(h2jd(y, 1, 1))[0]; b = jd2jul(h2jd(y + 1, 1, 1) - 1)[0]
    return [a, b]
HY = {y: hyear_west(y) for y in range(leaves[0]["hy"] - 1, leaves[-1]["hy"] + 2)}

# reigns (Naṣrid rulers who reign inside the chronicle)
REIGNS = []
for p in people:
    for r in p.get("reigns", []):
        if (r["to"] or "9999") >= "1337-04-01":
            h = jd2h(jul2jd(*map(int, r["from"].split("-"))))
            REIGNS.append(dict(id=p["id"], name=p["name"], start=r["from"], end=r["to"],
                               hy=h[0], hm=h[1], hd=h[2], startStr=jul_str(r["from"])))
REIGNS.sort(key=lambda r: r["start"])

# saves (checkpoints) by Hijri year, for the density strip and for quires
SAVES = []
for c in checkpoints:
    y, m, d = map(int, c["date"].split("-"))
    h = jd2h(jul2jd(y, m, d))
    SAVES.append(dict(date=c["date"], hy=h[0]))
# quires: leaves grouped by the first save on or after the leaf's date (the save it was read from).
# A stand-in for the session log, which needs session dates the folder does not have.
saves_sorted = sorted(c["date"] for c in checkpoints)
for L in leaves:
    # first save on or after the leaf's date, allowing a week's slack for leaves dated just after a save
    import datetime as _dt
    slack = (_dt.date.fromisoformat(L["date"]) - _dt.timedelta(days=7)).isoformat()
    q = next((s for s in saves_sorted if s >= slack), None)
    L["quire"] = q
QUIRES = []
for L in leaves:
    if not QUIRES or QUIRES[-1]["save"] != L["quire"]:
        QUIRES.append(dict(save=L["quire"], saveStr=jul_str(L["quire"]) if L["quire"] else None, leaves=[]))
    QUIRES[-1]["leaves"].append(L["addr"])

for L in leaves:
    L["dateStr"] = jul_str(L["date"])
    L["hdateStr"] = f"{L['hd']} {HMONTHS[L['hm']-1]} {L['hy']}"
    L["w"] = int(L["date"][:4])

DATA = dict(
    hmonths=HMONTHS, books=books, canons=CANON, hy=HY, reigns=REIGNS, saves=SAVES, quires=QUIRES,
    leaves=[{k: L[k] for k in ("addr", "slug", "n", "bn", "hy", "hm", "hd", "w", "title", "date",
                                "dateStr", "hdateStr", "book", "people", "places", "sources",
                                "words", "catch", "canon", "body")} for L in leaves],
)
tpl = open(os.path.join(HERE, "template.html"), encoding="utf-8").read()
out = tpl.replace("/*__DATA__*/null", json.dumps(DATA, ensure_ascii=False).replace("</", "<\\/"))
open(os.path.join(HERE, "..", "mockup.html"), "w", encoding="utf-8").write(out)
print("leaves", len(leaves), "canons", [(c["first"], c["last"], c["cols"]) for c in CANON])
print("reigns", [(r["name"], r["hy"]) for r in REIGNS])
print("bytes", len(out))
