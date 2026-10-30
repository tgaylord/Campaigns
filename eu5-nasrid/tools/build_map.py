#!/usr/bin/env python3
"""Build the campaign map from the game's own map files.

Traces every location inside a frame around the regions we care about into an
SVG path, using the game's locations.png (one colour per location), and writes
a compact JSON the site draws from.

usage:
  build_map.py MAP_DATA_DIR OUT.json [--regions iberia_region,maghreb_region] [--pad 60]
  build_map.py MAP_DATA_DIR OUT.json --frame 7120,2290,8220,3130

MAP_DATA_DIR is the game's game/in_game/map_data folder (or a copy of the files
it needs: locations.png, named_locations/00_default.txt, definitions.txt,
location_templates.txt). Coordinates in the output are game-map pixels,
relative to the frame's top-left corner; y grows downward.

Needs numpy, Pillow and OpenCV (cv2).
"""
import argparse, json, os, re
import numpy as np
from PIL import Image
import cv2

Image.MAX_IMAGE_PIXELS = None
ap = argparse.ArgumentParser()
ap.add_argument('map_data')
ap.add_argument('out')
ap.add_argument('--regions', default='iberia_region,maghreb_region')
ap.add_argument('--pad', type=int, default=60, help='pixels of margin around the regions')
ap.add_argument('--frame', help='x0,y0,x1,y1 in game pixels; overrides --regions')
ap.add_argument('--eps', type=float, default=0.7, help='polygon simplification, in pixels')
ap.add_argument('--owners', nargs='*', default=[], help='extracted checkpoint files (tools/extract_checkpoint.py); '
                'for each, the outline of every realm is written to --realms-dir')
ap.add_argument('--realms-dir', help='where to write realms-<checkpoint>.json')
a = ap.parse_args()
M = a.map_data

# location -> colour
col = {}
for line in open(os.path.join(M, 'named_locations', '00_default.txt'), encoding='utf-8-sig'):
    m = re.match(r'\s*(\w+)\s*=\s*([0-9a-fA-F]{6})', line)
    if m: col[m.group(1)] = int(m.group(2), 16)
bycol = {v: k for k, v in col.items()}

# location -> [continent, subcontinent, region, area, province]
t = re.sub(r'#[^\n]*', '', open(os.path.join(M, 'definitions.txt'), encoding='utf-8-sig').read())
toks = re.findall(r'[\w.]+|\{|\}|=', t)
hier, stack, i = {}, [], 0
while i < len(toks):
    tk = toks[i]
    if i + 2 < len(toks) and toks[i + 1] == '=' and toks[i + 2] == '{': stack.append(tk); i += 3; continue
    if i + 2 < len(toks) and toks[i + 1] == '=': i += 3; continue
    if tk == '}': stack.pop(); i += 1; continue
    hier[tk] = list(stack); i += 1

# location -> topography
topo = {}
for line in open(os.path.join(M, 'location_templates.txt'), encoding='utf-8-sig'):
    m = re.match(r'(\w+)\s*=\s*\{.*?topography\s*=\s*(\w+)', line)
    if m: topo[m.group(1)] = m.group(2)
SEA = {'coastal_ocean', 'ocean', 'inland_sea', 'deep_ocean', 'narrows', 'ocean_wasteland'}
LAKE = {'lakes', 'high_lakes', 'salt_pans'}


def kind(k):
    tp = topo.get(k, '')
    if tp in SEA: return 'sea'
    if tp in LAKE: return 'lake'
    if tp.endswith('wasteland'): return 'waste'
    return 'land'


img = np.asarray(Image.open(os.path.join(M, 'locations.png')).convert('RGB'))
key = (img[:, :, 0].astype(np.uint32) << 16) | (img[:, :, 1].astype(np.uint32) << 8) | img[:, :, 2]

if a.frame:
    x0, y0, x1, y1 = (int(v) for v in a.frame.split(','))
else:
    # frame = bounding box of the chosen regions, plus padding
    want = set(a.regions.split(','))
    cols = np.array([col[k] for k, h in hier.items() if len(h) > 2 and h[2] in want and k in col], dtype=np.uint32)
    ys, xs = np.nonzero(np.isin(key, cols))
    x0, x1 = max(xs.min() - a.pad, 0), min(xs.max() + a.pad, key.shape[1] - 1)
    y0, y1 = max(ys.min() - a.pad, 0), min(ys.max() + a.pad, key.shape[0] - 1)
crop = key[y0:y1 + 1, x0:x1 + 1]
H, W = crop.shape

def trace(mask, min_area=2):
    """SVG path of a 0/1 mask. Traced on a 2x grid so shared edges between neighbours line up."""
    big = cv2.resize(mask, (W * 2, H * 2), interpolation=cv2.INTER_NEAREST)
    cs, _ = cv2.findContours(big, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    parts = []
    for cn in cs:
        if cv2.contourArea(cn) < min_area: continue
        pts = cv2.approxPolyDP(cn, a.eps * 2, True).reshape(-1, 2) / 2.0
        parts.append('M' + 'L'.join(f'{x:g},{y:g}' for x, y in pts) + 'Z')
    return ''.join(parts)


out = {'frame': {'x': int(x0), 'y': int(y0), 'width': int(W), 'height': int(H)}, 'locations': {}}
landmask = np.zeros((H, W), np.uint8)
for c in np.unique(crop):
    k = bycol.get(int(c))
    if k is None: continue
    mask = (crop == c).astype(np.uint8)
    if kind(k) in ('land', 'waste'): landmask |= mask
    d = trace(mask)
    if not d: continue
    yy, xx = np.nonzero(mask)
    h = hier.get(k, [])
    out['locations'][k] = {
        'kind': kind(k),
        'province': h[4] if len(h) > 4 else None, 'area': h[3] if len(h) > 3 else None,
        'region': h[2] if len(h) > 2 else None,
        'c': [round(float(xx.mean()), 1), round(float(yy.mean()), 1)], 'px': int(mask.sum()),
        'd': d,
    }
# the coast: outline of all land, wastelands included
out['coast'] = trace(landmask, min_area=8)

# provinces and areas: the outline of each, from its land locations, so the Atlas can draw
# the country a province at a time and split a province into its locations on demand
def divisions(level):
    groups = {}
    for c in np.unique(crop):
        k = bycol.get(int(c))
        h = hier.get(k or '', [])
        if not k or kind(k) != 'land' or len(h) <= level: continue
        groups.setdefault(h[level], []).append((int(c), k))
    res = {}
    for name, members in groups.items():
        m = np.isin(crop, np.array([c for c, _ in members], dtype=np.uint32)).astype(np.uint8)
        yy, xx = np.nonzero(m)
        h = hier[members[0][1]]
        res[name] = {'d': trace(m, min_area=4), 'c': [round(float(xx.mean()), 1), round(float(yy.mean()), 1)],
                     'px': int(m.sum()), 'area': h[3] if len(h) > 3 else None, 'region': h[2] if len(h) > 2 else None,
                     'locations': sorted(k for _, k in members)}
        if level == 3: res[name].pop('area')
    return res
out['provinces'] = divisions(4)
out['areas'] = {k: {kk: v[kk] for kk in ('d', 'c', 'region', 'locations')} for k, v in divisions(3).items()}

json.dump(out, open(a.out, 'w'), separators=(',', ':'))
n = len(out['locations'])
print(f'frame x{x0}-{x1} y{y0}-{y1} ({W}x{H}), {n} locations, {os.path.getsize(a.out) // 1024} KB')

# ---------- realm outlines, one file per checkpoint ----------
if a.owners:
    os.makedirs(a.realms_dir, exist_ok=True)
    loc_of = np.vectorize(lambda c: bycol.get(int(c), ''), otypes=[object])(np.unique(crop))
    uniq = np.unique(crop)
    for f in a.owners:
        owners = json.load(open(f))['world_owners']
        realms = {}
        lab = {}  # colour -> owner tag (land only)
        for c, k in zip(uniq, loc_of):
            if k and kind(k) == 'land' and owners.get(k): lab[int(c)] = owners[k]
        for tag in sorted(set(lab.values())):
            cs = np.array([c for c, t in lab.items() if t == tag], dtype=np.uint32)
            m = np.isin(crop, cs).astype(np.uint8)
            yy, xx = np.nonzero(m)
            realms[tag] = {'d': trace(m, min_area=4), 'px': int(m.sum()),
                           'c': [round(float(xx.mean()), 1), round(float(yy.mean()), 1)]}
        name = os.path.splitext(os.path.basename(f))[0]
        dst = os.path.join(a.realms_dir, f'realms-{name}.json')
        json.dump(realms, open(dst, 'w'), separators=(',', ':'))
        print(f'{dst}: {len(realms)} realms, {os.path.getsize(dst) // 1024} KB')
