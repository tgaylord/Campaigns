#!/usr/bin/env python3
"""Write data/map/names.json: the game's English names for every location,
province and area in the map frame (data/map/strait-region.json).

The chronicle's own names (Arabic and its transliteration) live in
data/gazetteer.json and win wherever a place has an entry; these are the
fallback, so the lands table and the map can name every location.

usage:
  place_names.py LOCALIZATION_DIR [--out FILE]

  LOCALIZATION_DIR is the game's main_menu/localization/english folder, with
  location_names/location_names_l_english.yml, province_names_l_english.yml
  and area_l_english.yml in it.
"""
import argparse, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument('loc')
ap.add_argument('--out', default=os.path.join(HERE, '..', 'data', 'map', 'names.json'))
a = ap.parse_args()

LOC = {}
for f in ['location_names/location_names_l_english.yml', 'province_names_l_english.yml', 'area_l_english.yml', 'region_names_l_english.yml']:
    p = os.path.join(a.loc, f)
    if not os.path.exists(p): continue
    for m in re.finditer(r'^\s*([\w.\-]+):\d*\s+"(.*)"\s*$', open(p, encoding='utf-8-sig').read(), re.M):
        LOC.setdefault(m.group(1), m.group(2))


def name(key, depth=0):
    s = LOC.get(key)
    if s is None: return None
    if depth < 3: s = re.sub(r'\$([\w.]+)\$', lambda m: name(m.group(1), depth + 1) or m.group(1), s)
    return s


frame = json.load(open(os.path.join(HERE, '..', 'data', 'map', 'strait-region.json'), encoding='utf8'))['locations']
out = {'about': "The game's English names for the map frame (tools/place_names.py). The gazetteer's names win where a place has an entry.",
       'locations': {}, 'provinces': {}, 'areas': {}, 'regions': {}}
miss = []
for k, l in frame.items():
    if l.get('kind') == 'sea': continue
    out['locations'][k] = name(k) or miss.append(k) or k.replace('_', ' ').title()
    for kind, field in (('provinces', 'province'), ('areas', 'area'), ('regions', 'region')):
        v = l.get(field)
        if v and v not in out[kind]: out[kind][v] = name(v) or v.replace('_', ' ').title()
json.dump(out, open(a.out, 'w', encoding='utf8'), indent=1, ensure_ascii=False, sort_keys=True)
print(f"names: {len(out['locations'])} locations, {len(out['provinces'])} provinces, {len(out['areas'])} areas; {len(miss)} without a game name")
