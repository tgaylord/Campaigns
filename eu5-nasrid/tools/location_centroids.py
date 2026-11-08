#!/usr/bin/env python3
"""The centre of every named location on the game map, in game-map pixels.

The World hall (site/src/views/World.tsx) places trading posts, colonies, battles and
capitals anywhere in the world, so it needs a position for any location, not only those
inside the Atlas's frame. This reads locations.png once and writes
data/map/centroids.json: {location key: [x, y, pixels]}.

usage: location_centroids.py MAP_DATA_DIR OUT.json

Needs numpy and Pillow.
"""
import json, os, re, sys
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
M, out = sys.argv[1], sys.argv[2]
colour = {}
for line in open(os.path.join(M, 'named_locations', '00_default.txt'), encoding='utf-8-sig'):
    m = re.match(r'\s*([A-Za-z0-9_\-]+)\s*=\s*([0-9a-fA-F]{6})', line)
    if m:
        colour[int(m.group(2), 16)] = m.group(1)

im = np.asarray(Image.open(os.path.join(M, 'locations.png')).convert('RGB'))
H, W, _ = im.shape
acc = {}
# One band of rows at a time keeps memory modest on the 16384 x 8192 map.
BAND = 512
for y0 in range(0, H, BAND):
    band = im[y0:y0 + BAND].astype(np.uint32)
    key = (band[..., 0] << 16) | (band[..., 1] << 8) | band[..., 2]
    flat = key.ravel()
    ys, xs = np.divmod(np.arange(flat.size, dtype=np.int64), W)
    order = np.argsort(flat, kind='stable')
    k_sorted = flat[order]
    cuts = np.flatnonzero(np.diff(k_sorted)) + 1
    starts = np.concatenate(([0], cuts)); ends = np.concatenate((cuts, [flat.size]))
    for s, e in zip(starts, ends):
        k = int(k_sorted[s])
        name = colour.get(k)
        if not name:
            continue
        idx = order[s:e]
        sx = float(xs[idx].sum()); sy = float((ys[idx] + y0).sum()); n = int(e - s)
        a = acc.setdefault(name, [0.0, 0.0, 0])
        a[0] += sx; a[1] += sy; a[2] += n

res = {k: [round(v[0] / v[2], 1), round(v[1] / v[2], 1), v[2]] for k, v in acc.items() if v[2]}
json.dump(res, open(out, 'w'), separators=(',', ':'))
print(f'{len(res)} locations, map {W}x{H} -> {out}')
