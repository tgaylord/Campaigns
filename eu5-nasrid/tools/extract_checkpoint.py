#!/usr/bin/env python3
"""Extract the facts the Nasrid campaign tracks from one EU5 save.

The save must already be split into sections by
shared/tools/eu5-save-decoder/decode.py (text saves are only split; compressed
1.4 saves need the 1.4 patch to b2t, see tools/README.md).

usage:
  extract_checkpoint.py SECTIONS_DIR OUT.json [--tag GRA] [--no-computed]

  --no-computed   leave out values the game only settles after a few monthly
                  ticks (economy, estates, levies, cabinet actions). Use it for
                  a save made on the start date.

Output is plain facts keyed by the game's own ids and keys. The curated layer
(data/snapshots, people.json, gazetteer.json) is written from it by hand, so
that names and story ids stay under the chronicle's control.
"""
import argparse, collections, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'shared', 'tools', 'eu5-save-decoder'))
from jomini import DB, get, parse, vals  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument('sections')
ap.add_argument('out')
ap.add_argument('--tag', default='GRA')
ap.add_argument('--no-computed', action='store_true')
a = ap.parse_args()
D = a.sections


def rd(name):
    return open(os.path.join(D, name + '.txt'), encoding='utf8', errors='replace').read()


meta = rd('metadata')
date = re.search(r'\n\tdate=([\d.]+)', meta).group(1)
version = re.search(r'\n\tversion="([^"]+)"', meta).group(1)
LOCN = [x.strip('"') for x in re.search(r'\n\t\tlocations=\{([^}]*)\}', meta).group(1).split()]


def locname(i):
    i = int(i)
    return LOCN[i - 1] if 0 < i <= len(LOCN) else str(i)


ctext = rd('countries')
i = ctext.find('\n\ttags={'); j = ctext.find('\n\t}', i)
TAGS = {int(k): v for k, v in re.findall(r'\n\t\t(\d+)=([A-Za-z0-9_]+)(?=\n)', ctext[i:j])}
BYTAG = {v: k for k, v in TAGS.items()}
del ctext
CDB, CHR, DYN = DB(os.path.join(D, 'countries.txt')), DB(os.path.join(D, 'character_db.txt')), DB(os.path.join(D, 'dynasty_manager.txt'))
CUL, REL = DB(os.path.join(D, 'culture_manager.txt')), DB(os.path.join(D, 'religion_manager.txt'))
_c = {}


def keyof(db, i, fields=('name', 'key')):
    if i is None: return None
    k = (id(db), int(i))
    if k not in _c:
        e = db.get(int(i)); _c[k] = next((get(e, f) for f in fields if e and get(e, f)), str(i))
    return _c[k]


CID = BYTAG[a.tag]
me = CDB.get(CID)
gov = get(me, 'government') or []


def person(cid):
    c = CHR.get(int(cid))
    if c is None: return None
    dd = get(c, 'death_data') or []
    sp = get(c, 'spouse')
    return {
        'id': int(cid), 'script': get(c, 'script'), 'first_name': get(c, 'first_name'), 'nickname': get(c, 'nickname'),
        'female': get(c, 'female') == 'yes', 'born': get(c, 'birth_date'),
        'died': get(dd, 'death_date') if dd else None, 'death_reason': get(dd, 'reason') if dd else None,
        'father': get(c, 'father'), 'mother': get(c, 'mother'),
        'spouses': vals(sp) if isinstance(sp, list) else ([sp] if sp else []),
        'children': vals(get(c, 'children') or []),
        'dynasty': keyof(DYN, get(c, 'dynasty'), ('key', 'name')),
        'country': TAGS.get(int(get(c, 'country') or 0)), 'estate': get(c, 'estate'),
        'adm_dip_mil': [get(c, 'adm'), get(c, 'dip'), get(c, 'mil')],
        'traits': vals(get(c, 'traits') or []),
        'culture': keyof(CUL, get(c, 'culture')), 'religion': keyof(REL, get(c, 'religion'), ('key', 'name')),
    }


# Everyone attached to the country or its dynasty, living or dead.
dyn_id = None
ruler = get(gov, 'ruler')
rc = CHR.get(int(ruler)) if ruler else None
if rc: dyn_id = get(rc, 'dynasty')
court = []
for chid in CHR.idx:
    raw = CHR.raw(chid)
    if not raw: continue
    if re.search(r'\n\tcountry=%d\n' % CID, raw) or (dyn_id and re.search(r'\n\tdynasty=%s\n' % dyn_id, raw)):
        p = person(chid)
        if p: court.append(p)
court.sort(key=lambda p: p['born'] or '')

# Ruler terms
RT = DB(os.path.join(D, 'rulerterm_manager.txt'))
terms = []
for tid in vals(get(gov, 'ruler_terms') or []):
    t = RT.get(int(tid))
    if not t: continue
    for ch in vals(get(get(t, 'ruler') or [], 'characters') or []):
        terms.append({'character': get(ch, 'character'), 'regnal_number': get(ch, 'regnal_number'),
                      'start': get(t, 'start_date'), 'end': get(t, 'end_date')})


def objlist(block, keyed):
    out = []
    for k, v in (block or []):
        if isinstance(v, list):
            out.append({**({'slot': k} if keyed else {}), 'object': get(v, 'object'), 'date': get(v, 'date')})
    return out


R = {
    'source': {'date': date, 'game_version': version, 'tag': a.tag, 'country_id': CID,
               'computed_values': not a.no_computed},
    'country': {
        'capital': locname(get(me, 'capital')) if get(me, 'capital') else None,
        'rank': (re.findall(r'country_rank=(\w+)', CDB.raw(CID)) or [None])[-1],
        'primary_culture': keyof(CUL, get(me, 'primary_culture')),
        'accepted_cultures': [keyof(CUL, x) for x in vals(get(me, 'accepted_cultures') or [])],
        'tolerated_cultures': [keyof(CUL, x) for x in vals(get(me, 'tolerated_cultures') or [])],
        'primary_religion': keyof(REL, get(me, 'primary_religion'), ('key', 'name')),
        'court_language': get(me, 'court_language'),
        'government': get(gov, 'type'), 'heir_selection': get(gov, 'heir_selection'),
        'ruler': ruler, 'heir': get(gov, 'heir'), 'consort': get(gov, 'consort'), 'regent': get(gov, 'regent'),
        'laws': objlist(get(gov, 'implemented_laws'), True),
        'privileges': [{'object': get(v, 'object'), 'date': get(v, 'date')} for v in vals(get(gov, 'implemented_privileges') or [])],
        'reforms': [{'object': get(v, 'object'), 'date': get(v, 'date')} for v in vals(get(gov, 'implemented_reforms') or [])],
        'societal_values': dict(get(gov, 'societal_values') or []),
        'ruler_terms': terms,
    },
    'court': court,
}

if not a.no_computed:
    cd = dict(get(me, 'currency_data') or [])
    R['computed'] = {
        'currency': cd,
        'max_manpower': get(me, 'max_manpower'), 'max_sailors': get(me, 'max_sailors'),
        'cabinet_entries': vals(get(gov, 'cabinet_entries') or []),
        # estates, economy and levies: add here once a ticked save is in hand and the fields are checked
    }

# ---------- populations ----------
POP = {}
for m in re.finditer(r'\n(\d+)=\{\n(.*?)\n\}', rd('population'), re.S):
    b = '\n' + m.group(2)
    f = lambda k: (re.search(r'\n\t' + k + r'=([^\s]+)', b) or [None, None])[1]
    POP[int(m.group(1))] = (f('type'), f('culture'), f('religion'), float(f('size') or 0))

# ---------- locations: owner and population of every owned location ----------
PROV = {m.group(1): m.group(2) for m in re.finditer(r'\n(\d+)=\{\n\tcapital=\d+\n\tprovince_definition="?([^"\n]+)"?\n', rd('provinces'))}
ltxt = rd('locations')
starts = [(int(m.group(1)), m.start()) for m in re.finditer(r'\n\t\t(\d+)=\{', ltxt)]
owners, mine = {}, {}
cul_tot, rel_tot, typ_tot = collections.Counter(), collections.Counter(), collections.Counter()
for k, (lid, s) in enumerate(starts):
    e = starts[k + 1][1] if k + 1 < len(starts) else len(ltxt)
    b = ltxt[s:e]
    f = lambda key: (re.search(r'\n\t\t\t' + key + r'=([^\s]+)', b) or [None, None])[1]
    own = f('owner')
    if own is None: continue
    key = locname(lid)
    owners[key] = TAGS.get(int(own))
    if int(own) != CID: continue
    pm = re.search(r'\n\t\t\t\tpops=\{([^}]*)\}', b)
    pops = [int(x) for x in pm.group(1).split()] if pm else []
    lc, lr, size = collections.Counter(), collections.Counter(), 0.0
    for p in pops:
        if p in POP:
            t, c, r, sz = POP[p]; size += sz
            lc[keyof(CUL, c)] += sz; lr[keyof(REL, r, ('key', 'name'))] += sz; typ_tot[t] += sz
    cul_tot.update(lc); rel_tot.update(lr)
    nm = re.search(r'\n\t\t\tname="?([^"\n]*)"?\n', b)
    mine[key] = {'id': lid, 'province': PROV.get(f('province') or '', f('province')), 'rank': f('rank'),
                 'controller': TAGS.get(int(f('controller'))) if f('controller') else None,
                 'culture': keyof(CUL, f('culture')), 'religion': keyof(REL, f('religion'), ('key', 'name')),
                 'custom_name': nm.group(1) if nm else None,
                 'population_k': round(size, 3),
                 'cultures_k': {c: round(v, 3) for c, v in lc.most_common()},
                 'religions_k': {r: round(v, 3) for r, v in lr.most_common()}}
del ltxt
R['realm'] = {
    'locations': mine,
    'population_k': round(sum(cul_tot.values()), 3),
    'cultures_k': {c: round(v, 3) for c, v in cul_tot.most_common()},
    'religions_k': {r: round(v, 3) for r, v in rel_tot.most_common()},
    'pop_types_k': {t: round(v, 3) for t, v in typ_tot.most_common()},
}
R['world_owners'] = owners  # location key -> owner tag, for the map

# ---------- diplomacy: dependencies touching us ----------
dip = rd('diplomacy_manager')
deps = []
for mm in re.finditer(r'\n\t(\w+)=\{\n\t\tfirst=(\d+)\n\t\tsecond=(\d+)(.*?)\n\t\}', dip, re.S):
    typ, x, y, rest = mm.group(1), int(mm.group(2)), int(mm.group(3)), mm.group(4)
    if CID in (x, y):
        sd = re.search(r'start_date=([\d.]+)', rest)
        deps.append({'type': typ, 'first': TAGS.get(x), 'second': TAGS.get(y), 'objects': re.findall(r'object=(\w+)', rest),
                     'start': sd.group(1) if sd else None})
R['treaties'] = deps
del dip

# ---------- situations ----------
sit = rd('situation_manager')
R['situations'] = {k: (body.strip() != '') for k, body in re.findall(r'\b(\w+)=\{(.*?)\n?\t?\}', sit, re.S) if k != 'situation_manager'}

json.dump(R, open(a.out, 'w'), indent=1, ensure_ascii=False, default=str)
print('ok', date, version, a.tag, len(mine), 'locations', R['realm']['population_k'], 'k people,', len(court), 'characters')
