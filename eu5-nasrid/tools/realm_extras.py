#!/usr/bin/env python3
"""What extract_checkpoint.py leaves out: the realm's reach and temper at a checkpoint.

From a decoded save (shared/tools/eu5-save-decoder-1.4/decode.py), writes
data/realm/<checkpoint>.json with:

  societalValues   every societal value of the realm (−100 … +100; the left word is negative)
  laws             law slot → the policy in force
  privileges       the estate privileges in force
  reforms          the government reforms in force
  institutions     the institutions embraced
  advances         how many advances are researched, and the newest ones by name
  legitimacy       the crown's legitimacy (government power)
  fleet / army     subunits owned, counted by type
  abroad           buildings the crown owns in other countries' lands (trade offices,
                   overseas trading posts, embassies …), and those it is building there
  expeditions      expeditions completed, with type, place and dates
  dominance        any dominance value the save carries (the Golden Century, from 1442)

usage: realm_extras.py DECODED_SAVE_DIR CHECKPOINT_ID [--out data/realm]
The centre of each location comes from data/map/centroids.json (tools/location_centroids.py).
"""
import argparse, json, os, re

ap = argparse.ArgumentParser()
ap.add_argument('save'); ap.add_argument('checkpoint')
ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', 'data', 'realm'))
ap.add_argument('--country', default='1256', help='the player country id in the save (al-Andalus is 1256)')
a = ap.parse_args()
D, CID = a.save, a.country
read = lambda f: open(os.path.join(D, f), encoding='utf-8', errors='replace').read()


def block(text, start):
    """The balanced {...} that opens at or after `start`; returns (body, end)."""
    i = text.index('{', start); depth = 0
    for k in range(i, len(text)):
        c = text[k]
        if c == '{': depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0: return text[i + 1:k], k + 1
    return text[i + 1:], len(text)


def keyed(text, key):
    m = re.search(r'(?m)^\t*' + re.escape(key) + r'=\{', text)
    return block(text, m.start())[0] if m else ''


meta = read('metadata.txt')
LOC = [x.strip('"') for x in re.search(r'\n\t\tlocations=\{([^}]*)\}', meta).group(1).split()]
date = re.search(r'date=([\d.]+)', meta).group(1)

countries = read('countries.txt')
m = re.search(r'(?m)^' + CID + r'=\{', countries)
me = block(countries, m.start())[0]
# country id → tag (flag), for every country in the save
TAG = {}
for mm in re.finditer(r'(?m)^(\d+)=\{\n\tcountry_name=', countries):
    f = re.search(r'\n\tflag=(\w+)', countries[mm.end():mm.end() + 3000])
    if f: TAG[mm.group(1)] = f.group(1)
TAG[CID] = 'ADU'

out = {'checkpoint': a.checkpoint, 'date': date}
sv = keyed(me, 'societal_values')
out['societalValues'] = {k: round(float(v), 2) for k, v in re.findall(r'(\w+)=([-\d.]+)', sv) if float(v) > -999}
laws = keyed(me, 'implemented_laws')
out['laws'] = {k: o for k, o in re.findall(r'(?s)\n\t*(\w+)=\{[^{}]*?object=(\w+)', laws)}
out['privileges'] = sorted(set(re.findall(r'object=(\w+)', keyed(me, 'implemented_privileges'))))
out['reforms'] = sorted(set(re.findall(r'object=(\w+)', keyed(me, 'implemented_reforms'))))
out['institutions'] = sorted(k for k, v in re.findall(r'(\w+)=(yes)', keyed(me, 'institutions')))
adv = re.findall(r'(\w+)=yes', keyed(me, 'researched_advances'))
out['advances'] = {'count': len(adv), 'names': adv}
cd = keyed(me, 'currency_data')
g = re.search(r'government_power=([-\d.]+)', cd)
out['legitimacy'] = round(float(g.group(1)), 1) if g else None
dom = {k: round(float(v), 2) for k, v in re.findall(r'(\w*dominance\w*)=([-\d.]+)', me)}
out['dominance'] = dom or None

# Expeditions completed
exps = []
for body in re.findall(r'(?s)\{\s*expedition_type=.*?\}', keyed(me, 'completed_expeditions')):
    t = re.search(r'expedition_type=(\w+)', body); l = re.search(r'location=(\d+)', body)
    s = re.search(r'start=([\d.]+)', body); e = re.search(r'end_date=([\d.]+)', body)
    exps.append({'type': t.group(1) if t else None, 'location': LOC[int(l.group(1)) - 1] if l else None,
                 'start': s.group(1) if s else None, 'end': e.group(1) if e else None, 'failed': 'expedition_failed=yes' in body})
out['expeditions'] = exps

# Subunits by type (the fleet and the army)
sub = read('subunit_manager.txt')
owned = set(re.findall(r'\d+', keyed(me, 'owned_subunits')))
fleet, army = {}, {}
for mm in re.finditer(r'(?m)^(\d+)=\{\n', sub):
    if mm.group(1) not in owned: continue
    body = sub[mm.end():mm.end() + 600]
    t = re.search(r'\ttype=(\w+)', body)
    if not t: continue
    (fleet if t.group(1).startswith('n_') else army)[t.group(1)] = (fleet if t.group(1).startswith('n_') else army).get(t.group(1), 0) + 1
out['fleet'], out['army'] = fleet, army

# Whose is each location
locs = read('locations.txt')
owner = {int(k): v for k, v in re.findall(r'\n\t\t(\d+)=\{\n\t\t\towner=(\d+)', locs)}
cent = {}
cpath = os.path.join(os.path.dirname(__file__), '..', 'data', 'map', 'centroids.json')
if os.path.exists(cpath): cent = json.load(open(cpath))

bm = read('building_manager.txt')
bld = {}
for mm in re.finditer(r'(?m)^(\d+)=\{\n\ttype=(\w+)\n', bm):
    body = bm[mm.end():mm.end() + 500]
    lo = re.search(r'\tlocation=(\d+)', body); ow = re.search(r'\towner=(\d+)', body); lv = re.search(r'\tlevel=(\d+)', body)
    bld[mm.group(1)] = (mm.group(2), int(lo.group(1)) if lo else None, ow.group(1) if ow else None, int(lv.group(1)) if lv else 0)
cons = read('construction_manager.txt')
building = {}
for b in re.split(r'\n(?=\d+=\{)', cons):
    if '\tcountry=' + CID + '\n' not in b and 'country=' + CID not in b[:200]: continue
    bid = re.search(r'building=(\d+)', b)
    if bid: building[bid.group(1)] = building.get(bid.group(1), 0) + 1


def place(loc_idx):
    k = LOC[loc_idx - 1]
    c = cent.get(k)
    return {'location': k, 'holder': TAG.get(owner.get(loc_idx), owner.get(loc_idx)), 'xy': c[:2] if c else None}


abroad = []
for bid, (typ, lo, ow, lv) in bld.items():
    if ow != CID or lo is None or owner.get(lo) == CID: continue
    abroad.append({'type': typ, 'level': lv, 'building': building.get(bid, 0), **place(lo)})
abroad.sort(key=lambda x: (x['type'], x['location']))
out['abroad'] = abroad

os.makedirs(a.out, exist_ok=True)
path = os.path.join(a.out, f'{a.checkpoint}.json')
json.dump(out, open(path, 'w'), ensure_ascii=False, indent=1)
open(path, 'a').write('\n')
print(f"{a.checkpoint}: {len(out['societalValues'])} values, {len(out['privileges'])} privileges, {len(out['reforms'])} reforms, "
      f"fleet {sum(fleet.values())}, army {sum(army.values())}, {len(abroad)} buildings abroad, {len(exps)} expeditions -> {path}")
