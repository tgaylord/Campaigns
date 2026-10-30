#!/usr/bin/env python3
"""Write a devastation reading: how a run of wars left the land, location by location.

Compares the people, prosperity and looting of every location in a game region
between a save before the fighting and a save at the peace (and, optionally, one
some months after). The result is data/devastation/<war-id>.json, which the
site draws on that war's page.

usage:
  devastation.py BEFORE_DIR PEACE_DIR [--after DIR] --war ID --title TEXT
                 [--region iberia_region] [--note TEXT] [--out FILE]

  Each DIR is a save decoded by shared/tools/eu5-save-decoder-1.4/decode.py.
  Looting counts when the location's last looting falls between the two saves.
"""
import argparse, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument('before'); ap.add_argument('peace')
ap.add_argument('--after')
ap.add_argument('--war', required=True)
ap.add_argument('--title', required=True)
ap.add_argument('--note', default='')
ap.add_argument('--region', default='iberia_region')
ap.add_argument('--out')
a = ap.parse_args()

frame = json.load(open(os.path.join(HERE, '..', 'data', 'map', 'strait-region.json'), encoding='utf8'))['locations']
KEYS = {k: v for k, v in frame.items() if v.get('region') == a.region and v.get('kind') == 'land'}


def iso(d):
    if not d: return None
    y, m, dd = d.split('.'); return f"{int(y):04d}-{int(m):02d}-{int(dd):02d}"


def load(D):
    rd = lambda n: open(os.path.join(D, n + '.txt'), encoding='utf8', errors='replace').read()
    meta = rd('metadata')
    date = iso(re.search(r'\n\tdate=([\d.]+)', meta).group(1))
    LOCN = [x.strip('"') for x in re.search(r'\n\t\tlocations=\{([^}]*)\}', meta).group(1).split()]
    POP = {}
    for m in re.finditer(r'\n(\d+)=\{\n(.*?)\n\}', rd('population'), re.S):
        s = re.search(r'\n\tsize=([\d.]+)', '\n' + m.group(2)); POP[int(m.group(1))] = float(s.group(1)) if s else 0.0
    ct = rd('countries'); ti = ct.find('\n\ttags={'); tj = ct.find('\n\t}', ti)
    tag = {k: v for k, v in re.findall(r'\n\t\t(\d+)=([A-Za-z0-9_]+)(?=\n)', ct[ti:tj])}
    lt = rd('locations'); starts = [(int(m.group(1)), m.start()) for m in re.finditer(r'\n\t\t(\d+)=\{', lt)]
    out = {}
    for k, (lid, s) in enumerate(starts):
        name = LOCN[lid - 1] if 0 < lid <= len(LOCN) else None
        if name not in KEYS: continue
        b = lt[s:starts[k + 1][1] if k + 1 < len(starts) else len(lt)]
        g = lambda key: (re.search(r'\n\t\t\t' + key + r'=([^\n]+)', b) or [0, None])[1]
        pm = re.search(r'\n\t\t\t\tpops=\{([^}]*)\}', b)
        pop = sum(POP.get(int(x), 0) for x in pm.group(1).split()) if pm else 0.0
        out[name] = {'pop': round(pop * 1000), 'prosperity': round(float(g('prosperity') or 0), 3),
                     'owner': tag.get(g('owner')), 'controller': tag.get(g('controller')), 'looted': iso(g('looted'))}
    return date, out


d0, A = load(a.before)
d1, B = load(a.peace)
d2, C = load(a.after) if a.after else (None, {})
locs = {}
for k in sorted(KEYS):
    if k not in A or k not in B: continue
    x, y, z = A[k], B[k], C.get(k)
    looted = y['looted'] if y['looted'] and d0 < y['looted'] <= d1 else None
    locs[k] = {'area': KEYS[k].get('area'), 'pop0': x['pop'], 'pop1': y['pop'], 'pop2': z['pop'] if z else None,
               'prosperity0': x['prosperity'], 'prosperity1': y['prosperity'],
               'owner0': x['owner'], 'owner1': y['owner'], 'controller1': y['controller'], 'looted': looted}
areas = {}
for k, v in locs.items():
    s = areas.setdefault(v['area'], {'pop0': 0, 'pop1': 0, 'pop2': 0, 'locations': 0, 'looted': 0})
    s['pop0'] += v['pop0']; s['pop1'] += v['pop1']; s['pop2'] += v['pop2'] or 0
    s['locations'] += 1; s['looted'] += 1 if v['looted'] else 0
out = {'war': a.war, 'title': a.title, 'note': a.note, 'region': a.region,
       'dates': {'before': d0, 'peace': d1, 'after': d2}, 'areas': areas, 'locations': locs}
path = a.out or os.path.join(HERE, '..', 'data', 'devastation', f'{a.war}.json')
os.makedirs(os.path.dirname(path), exist_ok=True)
json.dump(out, open(path, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
open(path, 'a').write('\n')
lost = sum(v['pop0'] - v['pop1'] for v in locs.values())
print(f"{path}: {len(locs)} locations, {sum(1 for v in locs.values() if v['looted'])} looted, net change {-lost:+,} people")
