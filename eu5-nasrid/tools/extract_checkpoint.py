#!/usr/bin/env python3
"""Extract the facts the Nasrid campaign tracks from one EU5 save.

The save must already be split into sections by
shared/tools/eu5-save-decoder-1.4/decode.py (text saves are only split).

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
sys.path.insert(0, os.path.join(HERE, '..', '..', 'shared', 'tools', 'eu5-save-decoder-1.4'))
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
        'parliament': (lambda pm: pm and {
            'type': get(pm, 'parliament_type'), 'last_called': get(pm, 'last_parliament_called'),
            'agenda': [{'estate': get(x, 'estate'), 'type': get(x, 'type')} for x in vals(get(pm, 'parliament_agenda') or [])],
            'possible_debates': vals(get(pm, 'possible_debates') or []),
        })(get(gov, 'parliament')),
        'ruler_terms': terms,
    },
    'court': court,
}

def fx(v):
    """A script value stored as a 64-bit fixed-point integer (5 decimal places); missing means 0."""
    if v is None: return 0.0
    v = int(v)
    if v >= 2 ** 63: v -= 2 ** 64
    return v / 100000


if not a.no_computed:
    cd = dict(get(me, 'currency_data') or [])
    eco = get(me, 'economy') or []
    # Estates: satisfaction (0..1) and gold. The save holds no share of power; that comes from the estates screen.
    EST = DB(os.path.join(D, 'estate_manager.txt'))
    estates = {}
    for k, v in (get(gov, 'estates') or []):
        e = EST.get(int(v))
        if e and get(e, 'existence') == 'yes':
            estates[k] = {'satisfaction': get(e, 'satisfaction'), 'gold': get(e, 'gold'), 'tax_rate': get(get(eco, 'tax_rates') or [], k)}
    # Cabinet: who holds each seat and the action it is set to
    CAB = DB(os.path.join(D, 'cabinet_manager.txt'))
    cabinet = []
    for cid in vals(get(gov, 'cabinet_entries') or []):
        c = CAB.get(int(cid))
        if c:
            act = get(c, 'implemented_government_action') or []
            cabinet.append({'character': get(c, 'character'), 'action': get(act, 'object'), 'since': get(act, 'date')})
    # Forces: every regiment and ship the country owns
    raw = CDB.raw(CID)
    m = re.search(r'\n\towned_subunits=\{([^}]*)\}', raw)
    SUB = DB(os.path.join(D, 'subunit_manager.txt'))
    units = []
    for sid in (m.group(1).split() if m else []):
        u = SUB.get(int(sid))
        if u: units.append({'type': get(u, 'type'), 'unit': get(u, 'unit'), 'strength': get(u, 'strength'), 'morale': get(u, 'morale')})
    R['computed'] = {
        'currency': cd,
        'max_manpower': get(me, 'max_manpower'), 'max_sailors': get(me, 'max_sailors'),
        'economy': {'income': get(eco, 'income'), 'expense': get(eco, 'expense'), 'loan_capacity': get(eco, 'loan_capacity'),
                    'last_months_tax_income': get(me, 'last_months_tax_income'), 'monthly_trade_balance': get(me, 'monthly_trade_balance')},
        'estates': estates,
        'cabinet': cabinet,
        'subunits': units,
        'regiments': sum(1 for u in units if (u['type'] or '').startswith('a_')),
        'ships': sum(1 for u in units if (u['type'] or '').startswith('n_')),
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
# The Battle for the Strait: influence runs from -100 (Castile) to +100 (Morocco)
i = sit.find('\tbattle_for_the_strait={')
if i >= 0:
    j = sit.find('\n\t}', i); blk = sit[i:j]
    var = lambda f: (re.search(r'flag=' + f + r'\n\t*data=\{\n\t*type=value(?:\n\t*identity=(\d+))?', blk) or [None, None])[1]
    st = re.search(r'status=(\w+)', blk); sd = re.search(r'start=([\d.]+)', blk)
    R['strait'] = None if not st else {'status': st.group(1) if st else None, 'start': sd.group(1) if sd else None,
                   'influence_over_granada': round(fx(var('influence_over_granada')), 3),
                   'granadan_sovereignty': round(fx(var('granadan_sovereignty')), 3),
                   'years_subject_under_CAS': round(fx(var('GRA_years_subject_under_CAS_variable')), 3),
                   'years_as_subject': round(fx(var('GRA_years_as_subject_variable')), 3)}
del sit

# ---------- wars that involve us, as a party or as an ally who can be called ----------
W = rd('war_manager'); W = W[W.find('\tdatabase={'):]
starts = [(int(mm.group(1)), mm.start()) for mm in re.finditer(r'\n(\d+)=\{', W)]
wars = []
for k, (wid, s0) in enumerate(starts):
    b = W[s0:starts[k + 1][1] if k + 1 < len(starts) else len(W)]
    parts = []
    for blockname in ('all', 'potential_for_diplomacy'):
        bi = b.find('\n\t' + blockname + '={')
        if bi < 0: continue
        bj = b.find('\n\t}', bi)
        for c, body in re.findall(r'\n\t\t\tcountry=(\d+)\n(.*?)\n\t\t\tstatus=\w+', b[bi:bj], re.S):
            sd = re.search(r'side=(\w+)', body); jd = re.search(r'joined=\{.*?\n\t+date=([\d.]+)', body, re.S)
            ld = re.search(r'left=\{.*?\n\t+date=([\d.]+)', body, re.S)
            stt = re.search(r'\n\t\t\tstatus=(\w+)', b[bi:bj][b[bi:bj].find('country=' + c):])
            parts.append({'tag': TAGS.get(int(c)), 'side': sd.group(1) if sd else None, 'status': stt.group(1) if stt else None,
                          'joined': jd.group(1) if jd else None, 'left': ld.group(1) if ld else None})
    if not any(p['tag'] == a.tag for p in parts): continue
    nm = re.search(r'war_name=\{\n\t\tname=(\w+)', b); cb = re.search(r'casus_belli=(\w+)', b)
    g = lambda key: (re.search(r'\n\t' + key + r'=([^\n]+)', b) or [None, None])[1]
    wars.append({'id': wid, 'name': nm.group(1) if nm else None, 'casus_belli': cb.group(1) if cb else None,
                 'start': g('start_date'), 'end': g('end_date'), 'ended': g('previous') == 'yes', 'participants': parts,
                 'battles': re.findall(r'\n\tbattle=\{\n\t\tlocation=(\d+)\n\t\tdate=([\d.]+)\n\t\tresult=(\w+)', b)})
R['wars'] = wars
del W

json.dump(R, open(a.out, 'w'), indent=1, ensure_ascii=False, default=str)
print('ok', date, version, a.tag, len(mine), 'locations', R['realm']['population_k'], 'k people,', len(court), 'characters')
