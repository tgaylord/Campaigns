#!/usr/bin/env python3
"""English names for the keys in data/realm/*.json (tools/realm_extras.py).

Laws, policies, privileges, reforms, institutions, buildings, ships and regiments are
stored in the realm files by their game keys. This reads the game's English localisation
once and writes data/realm/names.json: {key: name}, for every key those files use, so
the site never shows a raw key. Keys the localisation doesn't name get a tidy fallback
("nd_crown_coffers_policy" → "Crown coffers").

usage: realm_names.py GAME_DIR [--realm data/realm]
"""
import argparse, glob, json, os, re

ap = argparse.ArgumentParser()
ap.add_argument('game')
ap.add_argument('--realm', default=os.path.join(os.path.dirname(__file__), '..', 'data', 'realm'))
a = ap.parse_args()

loc = {}
files = glob.glob(os.path.join(a.game, 'main_menu', 'localization', 'english', '**', '*.yml'), recursive=True)
files += glob.glob(os.path.join(a.game, 'dlc', '*', 'main_menu', 'localization', 'english', '**', '*.yml'), recursive=True)
files += glob.glob(os.path.join(a.game, 'in_game', 'localization', 'english', '**', '*.yml'), recursive=True)
for f in files:
    for line in open(f, encoding='utf-8-sig', errors='replace'):
        m = re.match(r'\s*([A-Za-z0-9_.\-]+):\d*\s*"(.*)"\s*(#.*)?$', line)
        if m and m.group(1) not in loc:
            loc[m.group(1)] = m.group(2)


def resolve(s, depth=0):
    if depth > 4: return s
    s = re.sub(r'\$([A-Za-z0-9_.]+)\$', lambda m: resolve(loc.get(m.group(1), m.group(1).replace('_', ' ')), depth + 1), s)
    s = re.sub(r'\[[^\]]*\]', '', s)          # scripted text the site can't evaluate
    s = re.sub(r'#\w+\s?|#!', '', s)          # formatting codes
    return re.sub(r'\s+', ' ', s).strip()


def tidy(k):
    k = re.sub(r'^(nd_|gra_|adu_|n_nd_adu_|n_|a_)', '', k)
    k = re.sub(r'_(policy|privilege|reform|law|expedition)$', '', k)
    return k.replace('_', ' ').capitalize()


keys = set()
places = set()
for f in glob.glob(os.path.join(a.realm, '1*.json')):
    r = json.load(open(f))
    keys |= set(r.get('societalValues', {}))
    for slot, pol in r.get('laws', {}).items(): keys |= {slot, pol}
    keys |= set(r.get('privileges', [])) | set(r.get('reforms', [])) | set(r.get('institutions', []))
    keys |= set(r.get('fleet', {})) | set(r.get('army', {}))
    keys |= {b['type'] for b in r.get('abroad', [])} | {e['type'] for e in r.get('expeditions', []) if e.get('type')}
    places |= {b['location'] for b in r.get('abroad', [])} | {e['location'] for e in r.get('expeditions', []) if e.get('location')}

names = {}
for k in sorted(keys):
    if '_vs_' in k:
        left, right = k.split('_vs_')
        names[k] = resolve(loc[k]) if k in loc else f'{left.capitalize()} vs {right.capitalize()}'
        names[k + ':left'] = resolve(loc.get(left, left.replace('_', ' '))).capitalize()
        names[k + ':right'] = resolve(loc.get(right, right.replace('_', ' '))).capitalize()
        continue
    n = resolve(loc[k]) if k in loc and loc[k].strip() else ''
    names[k] = n or tidy(k)

# the game's English names of the places abroad, as loc:<key> (the gazetteer's own names win on the site)
for f in glob.glob(os.path.join(a.game, 'main_menu', 'localization', 'english', 'location_names', 'location_names_l_english.yml')):
    for line in open(f, encoding='utf-8-sig', errors='replace'):
        m = re.match(r'\s*([a-z0-9_]+):\d*\s*"(.*)"', line)
        if m and m.group(1) in places: names['loc:' + m.group(1)] = m.group(2)
for k in places: names.setdefault('loc:' + k, k.replace('_', ' ').title())

# which estate each privilege belongs to (in_game/common/estate_privileges/*.txt)
estate = {}
for f in glob.glob(os.path.join(a.game, '**', 'common', 'estate_privileges', '*.txt'), recursive=True):
    t = open(f, encoding='utf-8-sig', errors='replace').read()
    for m in re.finditer(r'(?m)^([A-Za-z0-9_]+)\s*=\s*\{\s*\n\s*estate\s*=\s*(\w+)', t):
        if m.group(1) in keys: estate[m.group(1)] = m.group(2).replace('_estate', '')
for k, e in estate.items(): names[k + ':estate'] = e

path = os.path.join(a.realm, 'names.json')
json.dump(names, open(path, 'w'), ensure_ascii=False, indent=1, sort_keys=True)
open(path, 'a').write('\n')
missing = [k for k in keys if k not in loc and '_vs_' not in k]
print(f'{len(estate)} privileges by estate; {len(names)} names ({len(missing)} by fallback: {", ".join(sorted(missing)[:12])}{"…" if len(missing) > 12 else ""}) -> {path}')
