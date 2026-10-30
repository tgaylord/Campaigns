#!/usr/bin/env python3
"""Write the Atlas's lenses for one checkpoint: people, faith, tongue, prosperity,
control, occupation and looting for every land location in the map frame.

usage:
  map_layers.py SECTIONS_DIR CHECKPOINT_ID [--out-dir data/map/layers]

SECTIONS_DIR is a save decoded by shared/tools/eu5-save-decoder-1.4/decode.py.
Writes <out-dir>/<checkpoint>.json:
  {"date": ..., "cols": [...], "rows": {location: [values in cols order]}}
Shares are percentages of the location's people; prosperity and control are 0-100.
"""
import argparse, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument('sections'); ap.add_argument('checkpoint')
ap.add_argument('--out-dir', default=os.path.join(HERE, '..', 'data', 'map', 'layers'))
a = ap.parse_args()
D = a.sections
rd = lambda n: open(os.path.join(D, n + '.txt'), encoding='utf8', errors='replace').read()

frame = json.load(open(os.path.join(HERE, '..', 'data', 'map', 'strait-region.json'), encoding='utf8'))['locations']
LAND = {k for k, v in frame.items() if v['kind'] == 'land'}

meta = rd('metadata')
date = re.search(r'\n\tdate=([\d.]+)', meta).group(1)
LOCN = [x.strip('"') for x in re.search(r'\n\t\tlocations=\{([^}]*)\}', meta).group(1).split()]
ct = rd('countries'); ti = ct.find('\n\ttags={'); tj = ct.find('\n\t}', ti)
TAG = {k: v for k, v in re.findall(r'\n\t\t(\d+)=([A-Za-z0-9_]+)(?=\n)', ct[ti:tj])}


def names(section):
    out = {}
    for m in re.finditer(r'\n(\d+)=\{\n\tname=(\w+)\n(.*?)\n\}', rd(section), re.S):
        g = re.search(r'\n\tgroup=(\w+)', '\n' + m.group(3))
        out[m.group(1)] = (m.group(2), g.group(1) if g else None)
    return out


REL, CUL = names('religion_manager'), names('culture_manager')
POP = {}
for m in re.finditer(r'\n(\d+)=\{\n(.*?)\n\}', rd('population'), re.S):
    b = '\n' + m.group(2)
    s = re.search(r'\n\tsize=([\d.]+)', b); c = re.search(r'\n\tculture=(\d+)', b); r = re.search(r'\n\treligion=(\d+)', b)
    POP[int(m.group(1))] = (float(s.group(1)) if s else 0.0, c.group(1) if c else None, r.group(1) if r else None)

lt = rd('locations'); starts = [(int(m.group(1)), m.start()) for m in re.finditer(r'\n\t\t(\d+)=\{', lt)]
rows = {}
for k, (lid, s) in enumerate(starts):
    name = LOCN[lid - 1] if 0 < lid <= len(LOCN) else None
    if name not in LAND: continue
    b = lt[s:starts[k + 1][1] if k + 1 < len(starts) else len(lt)]
    g = lambda key: (re.search(r'\n\t\t\t' + key + r'=([^\n]+)', b) or [0, None])[1]
    pm = re.search(r'\n\t\t\t\tpops=\{([^}]*)\}', b)
    tot, grp, cul, rel = 0.0, {}, {}, {}
    for x in (pm.group(1).split() if pm else []):
        sz, c, r = POP.get(int(x), (0, None, None))
        tot += sz
        rn, rg = REL.get(r, (None, None)); cn = CUL.get(c, (None, None))[0]
        grp[rg] = grp.get(rg, 0) + sz; rel[rn] = rel.get(rn, 0) + sz; cul[cn] = cul.get(cn, 0) + sz
    pct = lambda d, key: round(100 * d.get(key, 0) / tot) if tot else 0
    owner, ctrl = TAG.get(g('owner')), TAG.get(g('controller'))
    rows[name] = [round(tot * 1000), pct(grp, 'muslim'), pct(grp, 'christian'), pct(grp, 'israelite_group'),
                  pct(cul, 'andalusi'), pct(cul, 'castilian'),
                  round(100 * float(g('prosperity') or 0)), round(100 * float(g('control') or 0)),
                  ctrl if ctrl and ctrl != owner else 0,
                  '-'.join(f'{int(p):02d}' if i else p for i, p in enumerate(g('looted').split('.'))) if g('looted') else 0,
                  CUL.get(g('culture'), (None,))[0], REL.get(g('religion'), (None,))[0]]
cols = ['pop', 'muslim', 'christian', 'jewish', 'andalusi', 'castilian', 'prosperity', 'control', 'occupiedBy', 'looted', 'culture', 'religion']
os.makedirs(a.out_dir, exist_ok=True)
dst = os.path.join(a.out_dir, f'{a.checkpoint}.json')
json.dump({'date': date, 'cols': cols, 'rows': rows}, open(dst, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print(f'{dst}: {len(rows)} locations, {os.path.getsize(dst) // 1024} KB')
