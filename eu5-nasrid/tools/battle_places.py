#!/usr/bin/env python3
"""Where each recorded battle was fought, as a location key and a point on the game map.

Battle events (data/events/*.json, type "battle") name their field in the chronicle's
words: "Qurṭuba", "the gulf of Cagliari", "Sharīsh (Jerez)". The World hall plots them,
so this matches each name to a game location through the gazetteer and the game's own
English place names (every culture's spelling), and writes data/map/battle-places.json:

  {"places": {event id: [location key, x, y]}, "unplaced": {event id: the name}}

Names it can't match are listed under "unplaced" (and printed) so they can be added to
ALIAS below rather than guessed.

usage: battle_places.py GAME_DIR
"""
import glob, json, os, re, sys, unicodedata

GAME = sys.argv[1]
ROOT = os.path.join(os.path.dirname(__file__), '..')
# chronicle names the gazetteer and the game don't share: name (normalised) → location key
ALIAS = {
    'strait': 'strait_of_gibraltar',
    'st georges bay': 'george_bay',            # Malta's bay, not the Newfoundland ones
    'aeolian islands': 'eolie_islands',
    'mouth of duero': 'mouth_douro',
    'mouth of douro': 'mouth_douro',
    'jerez': 'jerez_de_la_frontera',
    'cape santa maria di leuca': 'maria_leuca_cape',           # the chronicle's Jerez is Sharīsh, not Jerez de los Caballeros
}


def norm(s):
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = s.lower().replace('ʿ', '').replace('ʾ', '').replace("'", '').replace('’', '')
    s = re.sub(r'^((the|near|off|at|before)\s+)+', '', s.strip())
    s = re.sub(r'\b(al|el)-', '', s)
    return re.sub(r'[^a-z0-9 ]+', ' ', s).strip()


cent = json.load(open(os.path.join(ROOT, 'data/map/centroids.json')))
index = {}


def add(name, key):
    if key in cent: index.setdefault(norm(name), key)


for g in json.load(open(os.path.join(ROOT, 'data/gazetteer.json'))):
    if g.get('kind') != 'location' or not g.get('key'): continue
    for n in (g.get('name'), g.get('nameGame'), g['key'].replace('_', ' ')):
        if n: add(n, g['key'])
for f in glob.glob(os.path.join(GAME, 'main_menu', 'localization', 'english', 'location_names', '*.yml')):
    for line in open(f, encoding='utf-8-sig', errors='replace'):
        m = re.match(r'\s*([a-z0-9_]+)(?:\.\w+)?:\d*\s*"(.*)"', line)
        if m: add(m.group(2), m.group(1))
for k in cent: add(k.replace('_', ' '), k)


def find(name):
    base = re.sub(r'\s*\(.*\)', '', name)
    tries = [name] + re.findall(r'\(([^)]+)\)', name) + [base, base.split(',')[0], base.split(',')[0].split(' and ')[0]]
    for t in tries:
        n = norm(t)
        n = re.sub(r'\b(of|on) the\b', r'\1', n)
        if n in ALIAS: return ALIAS[n]
        if n in index: return index[n]
        k = n.replace(' of ', ' ').replace(' ', '_')
        for cand in (k, re.sub(r'^cape_(.+)', r'\1_cape', k), k + 's'):
            if cand in cent: return cand
        # "the gulf of X" / "the bay of X" are sea zones named gulf_x / bay_x
        m = re.match(r'(gulf|bay|cape|strait|straits) of (.+)', n)
        if m:
            for k in (f'{m.group(1)}_{m.group(2).replace(" ", "_")}', m.group(2).replace(' ', '_') + '_sea'):
                if k in cent: return k
            if m.group(2) in index: return index[m.group(2)]
    return None


places, unplaced = {}, {}
for f in sorted(glob.glob(os.path.join(ROOT, 'data/events/*.json'))):
    for e in json.load(open(f)):
        if e['type'] != 'battle': continue
        name = (e.get('data') or {}).get('location')
        if not name: continue
        k = find(name)
        if k: places[e['id']] = [k, cent[k][0], cent[k][1]]
        else: unplaced[e['id']] = name

out = os.path.join(ROOT, 'data/map/battle-places.json')
json.dump({'places': places, 'unplaced': unplaced}, open(out, 'w'), ensure_ascii=False, indent=1, sort_keys=True)
open(out, 'a').write('\n')
print(f'{len(places)} battles placed, {len(unplaced)} not -> {out}')
for i, n in sorted(set((n, i) for i, n in unplaced.items())):
    print('  unplaced:', i, '|', n)
