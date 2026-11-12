#!/usr/bin/env python3
"""Date the stations of the people the chronicle follows, for the Hourglass and the margins.

Writes `stations` on each record in data/people.json: a list of
    {"role": "dīwān" | "general" | "admiral" | "explorer" | "heir" | "regent" | "rebel",
     "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" | null, "source": "save" | "checkpoints", "approx": bool}

Two sources, the save first:
- the decoded save's character records keep each character's roles with their start and end
  (generals, admirals, the cabinet, explorers), ended ones included, for the living and the dead
  the save still holds. An end before its start is the game's placeholder for a role still held.
- the checkpoints (data/snapshots) give the heir and regent at every save, and the cabinet where the
  save has no record of it. Those spans run from the first checkpoint that shows the seat to the
  first that no longer does, so they are marked approx: the change fell somewhere in between.

usage:  character_roles.py SECTIONS     (a decoded save, the latest one: it remembers the most)
Re-run it after each new checkpoint; it rebuilds `stations` and leaves everything else alone. Because a
save keeps only each character's latest role of a kind, stations dated from an earlier save are kept
when the new save no longer remembers them.
"""
import json, os, re, sys, glob

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'data')
sections = sys.argv[1]

ROLE = {'CABINET': 'dīwān', 'GENERAL': 'general', 'ADMIRAL': 'admiral', 'EXPLORER': 'explorer', 'REBEL': 'rebel'}
iso = lambda d: '-'.join(f'{int(x):02d}' if i else x for i, x in enumerate(d.split('.')))

text = open(os.path.join(sections, 'character_db.txt'), encoding='utf8', errors='replace').read()
recs = {m.group(1): m.group(2) for m in re.finditer(r'\n(\d+)=\{\n(.*?)\n\}', text, re.S)}

def save_roles(gid):
    r = recs.get(str(gid))
    if not r:
        return []
    blk = re.search(r'\n\troles=\{(.*?)\n\t\}', '\n' + r, re.S)
    out = []
    for m in re.finditer(r'type=(\w+)\s*\n\s*start=([\d.]+)(?:\s*\n\s*end=([\d.]+))?', blk.group(1) if blk else ''):
        t, a, b = m.groups()
        if t not in ROLE:
            continue
        a = iso(a); b = iso(b) if b else None
        if b and b < a:
            b = None  # the game's placeholder for a role still held
        out.append({'role': ROLE[t], 'from': a, 'to': b, 'source': 'save', 'approx': False})
    return out

# the checkpoints, in order
snaps = sorted((json.load(open(f)) for f in glob.glob(os.path.join(DATA, 'snapshots', '*.json'))), key=lambda s: s['date'])

def spans(pid, seat_of):
    """Runs of consecutive checkpoints in which pid holds the seat: (first seen, first not seen)."""
    out, start = [], None
    for i, s in enumerate(snaps):
        here = pid in seat_of(s)
        if here and start is None:
            start = s['date']
        if not here and start is not None:
            out.append((start, s['date'])); start = None
    if start is not None:
        out.append((start, None))
    return out

people = json.load(open(os.path.join(DATA, 'people.json')))
n_save = n_cp = 0
for p in people:
    gids = [g for g in [p.get('gameId')] + (p.get('gameIds') or []) if g]
    st = [x for g in gids for x in save_roles(g)]
    # the save keeps only the latest role of each kind, so a station an earlier save dated is kept when
    # this one has replaced it; one it left open closes when the newer one of its kind begins (approx)
    for old in (p.get('stations') or []):
        if old['source'] != 'save' or any(x['role'] == old['role'] and x['from'] == old['from'] for x in st):
            continue
        old = dict(old)
        later = sorted(x['from'] for x in st if x['role'] == old['role'] and x['from'] > old['from'])
        if old['to'] is None and later:
            old['to'], old['approx'] = later[0], True
        st.append(old)
    have_cabinet = any(x['role'] == 'dīwān' for x in st)
    cps = []
    for role, seat in (('heir', lambda s: {s.get('heir')}), ('regent', lambda s: {s.get('regent')})) + ((() if have_cabinet else (('dīwān', lambda s: {c['person'] for c in s.get('cabinet', [])}),))):
        for a, b in spans(p['id'], seat):
            cps.append({'role': role, 'from': a, 'to': b, 'source': 'checkpoints', 'approx': True})
    # a death closes whatever is still open
    allst = sorted(st + cps, key=lambda x: (x['from'], x['role']))
    for x in allst:
        if x['to'] is None and p.get('died'):
            x['to'] = p['died']
    if allst:
        p['stations'] = allst
    else:
        p.pop('stations', None)
    n_save += bool(st); n_cp += bool(cps)

open(os.path.join(DATA, 'people.json'), 'w').write(json.dumps(people, ensure_ascii=False, indent=1))
print(f'stations: {n_save} people dated from the save, {n_cp} from the checkpoints -> data/people.json')
