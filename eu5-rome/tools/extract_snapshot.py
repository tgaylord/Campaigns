"""Snapshot of one country from an EU5 save already split into sections by
shared/tools/eu5-save-decoder/decode.py.

Usage: python3 extract_snapshot.py <sections_dir> <country_id> <out.json>
(Rome is country id 203.)
"""
import sys, re, json, collections
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shared', 'tools', 'eu5-save-decoder'))
from jomini import parse, get, getall, vals, DB

D, CID, OUT = sys.argv[1], int(sys.argv[2]), sys.argv[3]
def rd(name): return open(f'{D}/{name}.txt', encoding='utf8', errors='replace').read()
R = {}

# ---------- basics ----------
meta = rd('metadata')
R['date'] = re.search(r'\n\tdate=([\d.]+)', meta).group(1)
R['save_label'] = (re.search(r'save_label="([^"]*)"', meta) or [None, None])[1]
LOCN = [x.strip('"') for x in re.search(r'locations=\{([^}]*)\}', meta).group(1).split()]
def locname(i): i = int(i); return LOCN[i-1] if 0 < i <= len(LOCN) else str(i)

countries_txt = rd('countries')
def _tags(txt):
    i = txt.find('\n\ttags={'); j = txt.find('\n\t}', i)
    return {int(a): b for a, b in re.findall(r"\n\t\t(\d+)=([A-Za-z0-9_]+)(?=\n)", txt[i:j])}
TAGS = _tags(countries_txt[:3_000_000])
CDB = DB(f'{D}/countries.txt')
CHR = DB(f'{D}/character_db.txt')
DYN = DB(f'{D}/dynasty_manager.txt')
CUL = DB(f'{D}/culture_manager.txt')
REL = DB(f'{D}/religion_manager.txt')
EST = DB(f'{D}/estate_manager.txt')
_cache = {}
def cname(i):
    if i is None: return None
    k = ('c', i)
    if k not in _cache:
        c = CUL.get(int(i)); _cache[k] = get(c, 'name') if c else str(i)
    return _cache[k]
def rname(i):
    if i is None: return None
    k = ('r', i)
    if k not in _cache:
        c = REL.get(int(i)); _cache[k] = (get(c, 'key') or get(c, 'name')) if c else str(i)
    return _cache[k]
def dname(i):
    if i is None: return None
    c = DYN.get(int(i)); return get(c, 'name') if c else str(i)
_cc={}
def country(i):
    if int(i) in _cc: return _cc[int(i)]
    r = CDB.raw(int(i))
    _cc[int(i)] = parse(r)[0][1] if r else None
    return _cc[int(i)]
    r = CDB.raw(int(i))
    return parse(r)[0][1] if r else None
def country_label(cid):
    c = country(cid)
    if not c: return {'id': cid, 'tag': TAGS.get(int(cid))}
    cn = get(c, 'country_name')
    name = cn if isinstance(cn, str) else get(cn, 'name')
    raw = CDB.raw(int(cid))[:3000]
    cm = re.search(r'Custom_Name="?([^"\n]*)"?\n', raw[:raw.find('\n\tflag=') if '\n\tflag=' in raw else 3000])
    return {'id': int(cid), 'tag': TAGS.get(int(cid)), 'name': cm.group(1) if cm else name}

def charinfo(cid, depth=0):
    c = CHR.get(int(cid)) if cid else None
    if c is None: return {'id': cid, 'missing': True}
    dd = get(c, 'death_data') or []
    out = {
        'id': int(cid), 'name': get(c, 'first_name'), 'nickname': get(c, 'nickname'),
        'dynasty': dname(get(c, 'dynasty')), 'female': get(c, 'female') == 'yes',
        'born': get(c, 'birth_date'), 'died': get(dd, 'death_date'), 'death_reason': get(dd, 'reason'),
        'stats': [get(c, 'adm'), get(c, 'dip'), get(c, 'mil')],
        'traits': vals(get(c, 'traits') or []), 'general_trait': get(c, 'general_trait'),
        'culture': cname(get(c, 'culture')), 'religion': rname(get(c, 'religion')),
        'country': TAGS.get(int(get(c, 'country') or 0)),
        'father': get(c, 'father'), 'mother': get(c, 'mother'),
        'spouses': vals(get(c, 'spouse') or []), 'children': vals(get(c, 'children') or []),
        'roles': [(get(r, 'type'), get(r, 'start'), get(r, 'end')) for r in vals(get(c, 'roles') or [])],
    }
    return out

# ---------- the country ----------
me = country(CID)
R['country'] = country_label(CID)
for k in ['original_tag', 'level', 'formed_from', 'great_power_rank', 'starting_technology_level', 'last_months_population']:
    R[k] = get(me, k)
R['previous_tags'] = vals(get(me, 'previous_tags') or [])
R['capital'] = locname(get(me, 'capital')) if get(me, 'capital') else None
R['primary_culture'] = cname(get(me, 'primary_culture'))
R['accepted_cultures'] = [cname(x) for x in vals(get(me, 'accepted_cultures') or [])]
R['tolerated_cultures'] = [cname(x) for x in vals(get(me, 'tolerated_cultures') or [])]
R['primary_religion'] = rname(get(me, 'primary_religion'))
R['court_language'] = get(me, 'court_language'); R['liturgical_language'] = get(me, 'liturgical_language')
R['currency'] = dict(get(me, 'currency_data') or [])
eco = get(me, 'economy') or []
R['economy'] = {k: get(eco, k) for k in ['income', 'expense', 'creditworthiness', 'loan_capacity']}
R['economy']['tax_rates'] = dict(get(eco, 'tax_rates') or [])
R['historical_population'] = [float(x) for x in vals(get(me, 'historical_population') or [])]
R['historical_tax_base'] = [float(x) for x in vals(get(me, 'historical_tax_base') or [])]
R['historical_economical_base'] = [float(x) for x in vals(get(me, 'historical_economical_base') or [])]
R['manpower'] = {k: get(me, k) for k in ['max_manpower', 'max_sailors', 'monthly_manpower']}

gov = get(me, 'government') or []
R['government'] = {'type': get(gov, 'type'), 'heir_selection': get(gov, 'heir_selection')}
def objlist(block):
    out = []
    for k, v in (block or []):
        if isinstance(v, list):
            out.append({'slot': k, 'object': get(v, 'object'), 'date': get(v, 'date')})
    return out
R['laws'] = objlist(get(gov, 'implemented_laws') or get(gov, 'laws'))
R['privileges'] = [{'object': get(v, 'object'), 'date': get(v, 'date')} for v in vals(get(gov, 'implemented_privileges') or [])]
R['reforms'] = [{'object': get(v, 'object'), 'date': get(v, 'date')} for v in vals(get(gov, 'implemented_reforms') or [])]
R['societal_values'] = dict(get(gov, 'societal_values') or [])
R['gov_keys'] = [k for k, v in gov if k]

# rulers
RT = DB(f'{D}/rulerterm_manager.txt')
terms = []
for tid in vals(get(gov, 'ruler_terms') or []):
    t = RT.get(int(tid))
    if not t: continue
    chars = vals(get(get(t, 'ruler') or [], 'characters') or [])
    for ch in chars:
        terms.append({'char': get(ch, 'character'), 'regnal_number': get(ch, 'regnal_number'),
                      'regnal_name': get(ch, 'regnal_name'), 'title': get(ch, 'title'),
                      'start': get(t, 'start_date'), 'end': get(t, 'end_date')})
terms = [t for t in terms if t['start'] and int(t['start'].split('.')[0]) >= 1300]
for t in terms: t['info'] = charinfo(t['char'])
R['ruler_terms'] = terms

fam = {}
for role in ['ruler', 'consort', 'heir']:
    cid = get(gov, role)
    if cid: fam[role] = charinfo(cid)
if 'ruler' in fam:
    fam['ruler_children'] = [charinfo(c) for c in fam['ruler']['children']]
    fam['ruler_spouses'] = [charinfo(c) for c in fam['ruler']['spouses']]
if 'heir' in fam:
    fam['heir_children'] = [charinfo(c) for c in fam['heir']['children']]
R['family'] = fam

# estates
R['estates'] = {}
for k, v in (get(gov, 'estates') or []):
    e = EST.get(int(v))
    if e and get(e, 'existence') != 'no':
        R['estates'][k] = {'satisfaction': get(e, 'satisfaction'), 'power': get(e, 'power'),
                           'gold': get(e, 'gold'), 'raw_keys': None}

# ---------- populations ----------
pop_txt = rd('population')
POP = {}
for m in re.finditer(r'\n(\d+)=\{\n(.*?)\n\}', pop_txt, re.S):
    b = m.group(2)
    def f(k):
        mm = re.search(r'\n\t' + k + r'=([^\s]+)', '\n' + b)
        return mm.group(1) if mm else None
    POP[int(m.group(1))] = (f('type'), f('culture'), f('religion'), float(f('size') or 0))
del pop_txt

# ---------- locations ----------
loc_txt = rd('locations')
PROV = {}
for m in re.finditer(r'\n(\d+)=\{\n\tcapital=\d+\n\tprovince_definition="?([^"\n]+)"?\n', rd('provinces')):
    PROV[m.group(1)] = m.group(2)
locs = {}
starts = [(int(m.group(1)), m.start()) for m in re.finditer(r'\n\t\t(\d+)=\{', loc_txt)]
for i, (lid, s) in enumerate(starts):
    e = starts[i+1][1] if i+1 < len(starts) else len(loc_txt)
    b = loc_txt[s:e]
    def f(k):
        mm = re.search(r'\n\t\t\t' + k + r'=([^\s]+)', b)
        return mm.group(1) if mm else None
    owner = f('owner')
    if owner is None: continue
    pm = re.search(r'\n\t\t\t\tpops=\{([^}]*)\}', b)
    pops = [int(x) for x in pm.group(1).split()] if pm else []
    nm = re.search(r'\n\t\t\tname="?([^"\n]*)"?\n', b)
    locs[lid] = dict(owner=int(owner), controller=f('controller'), culture=f('culture'), religion=f('religion'),
                     rank=f('rank'), dev=float(f('development') or 0), tax=float(f('possible_tax') or 0),
                     province=PROV.get(f('province') or '', f('province')), pops=pops,
                     name=nm.group(1) if nm else locname(lid), last_owner_change=f('last_owner_change'),
                     control=float(f('control') or 0))
del loc_txt

def agg(owner_ids):
    tot = 0; cul = collections.Counter(); rel = collections.Counter(); typ = collections.Counter()
    n = 0; provs = collections.Counter(); ranks = collections.Counter(); tax = 0
    for lid, L in locs.items():
        if L['owner'] not in owner_ids: continue
        n += 1; provs[L['province']] += 1; ranks[L['rank']] += 1; tax += L['tax']
        for p in L['pops']:
            if p in POP:
                t, c, r, s = POP[p]; tot += s; cul[c] += s; rel[r] += s; typ[t] += s
    return dict(locations=n, population_k=round(tot, 1),
                cultures=[(cname(c), round(v, 1), round(100*v/tot, 2)) for c, v in cul.most_common(15)] if tot else [],
                religions=[(rname(r), round(v, 1), round(100*v/tot, 2)) for r, v in rel.most_common(10)] if tot else [],
                pop_types={k: round(v, 1) for k, v in typ.items()}, ranks=dict(ranks), provinces=dict(provs), tax=round(tax, 1))

R['realm'] = agg({CID})
R['owned_locations'] = sorted([(lid, L['name'], L['province'], L['rank'], L['last_owner_change']) for lid, L in locs.items() if L['owner'] == CID])
R['renamed_locations'] = [(lid, L['name'], locname(lid), TAGS.get(L['owner'])) for lid, L in locs.items() if L['name'] != locname(lid)]
R['cities'] = sorted([(L['name'], L['rank'], round(sum(POP[p][3] for p in L['pops'] if p in POP), 1), cname(L['culture']), rname(L['religion']))
                      for lid, L in locs.items() if L['owner'] == CID and L['rank'] in ('city', 'megalopolis', 'metropolis')], key=lambda x: -x[2])[:40]
R['occupied_by_others'] = [(L['name'], TAGS.get(int(L['controller']))) for lid, L in locs.items() if L['owner'] == CID and L['controller'] and int(L['controller']) != CID]

# ---------- diplomacy ----------
dip = rd('diplomacy_manager')
m = re.search(r'(?:^|\}|\n\t?)' + str(CID) + r'=\{', dip)
st = dip.find(str(CID) + '={', m.start())
j = dip.find('{', st); d = 0
for mm in re.finditer(r'"(?:[^"\\]|\\.)*"|[{}]', dip[j:j + 20_000_000]):
    if mm.group(0) == '{': d += 1
    elif mm.group(0) == '}':
        d -= 1
        if d == 0: break
mine_txt = dip[st:j + mm.end()]
md = parse(mine_txt)[0][1]
R['rivals'] = [(country_label(get(x, 'country')), get(x, 'date')) for x in vals(get(get(md, 'rivals_2') or [], 'list') or [])]
R['enemies'] = [country_label(x) for x in vals(get(md, 'enemies') or [])]
R['last_war'] = get(md, 'last_war'); R['last_peace'] = get(md, 'last_peace')
wars = []
for k, v in (get(md, 'relations') or []):
    if isinstance(v, list) and get(v, 'last_war'):
        wars.append({'other': country_label(k), 'last_war': get(v, 'last_war'), 'war_score': get(v, 'war_score'), 'trust': get(v, 'trust')})
R['relations_last_war'] = sorted(wars, key=lambda w: [int(p) for p in w['last_war'].split('.')])

# treaties: top-level typed items in the tail of diplomacy_manager
treaties = collections.defaultdict(list)
for mm in re.finditer(r'\n\t(\w+)=\{\n\t\tfirst=(\d+)\n\t\tsecond=(\d+)(.*?)\n\t\}', dip, re.S):
    typ, a, b, rest = mm.group(1), int(mm.group(2)), int(mm.group(3)), mm.group(4)
    if CID in (a, b):
        objs = re.findall(r'object=(\w+)', rest)
        sd = re.search(r'start_date=([\d.]+)', rest)
        treaties[typ].append({'first': country_label(a), 'second': country_label(b), 'objects': objs, 'start': sd.group(1) if sd else None})
R['treaties'] = treaties
del dip

# subjects
subs = []
for t in treaties.get('dependency', []):
    if t['first']['id'] != CID: continue
    sid = t['second']['id']; c = country(sid)
    lab = country_label(sid)
    g = get(c, 'government') or []
    ruler = get(g, 'ruler')
    subs.append({**lab, 'type': t['objects'][0] if t['objects'] else None, 'since': t['start'],
                 'capital': locname(get(c, 'capital')) if get(c, 'capital') else None,
                 'culture': cname(get(c, 'primary_culture')), 'religion': rname(get(c, 'primary_religion')),
                 'gov': get(g, 'type'), 'ruler': (lambda ci: f"{ci.get('name')} [{ci.get('dynasty')}]")(charinfo(ruler)) if ruler else None,
                 **{k: v for k, v in agg({sid}).items() if k in ('locations', 'population_k', 'cultures', 'religions')}})
R['subjects'] = subs
R['overlord'] = [t['first'] for t in treaties.get('dependency', []) if t['second']['id'] == CID]

# ---------- wars ----------
war = rd('war_manager')
i = war.find('\n\tdatabase={')
wtxt = war[i:]
active = []
for mm in re.finditer(r'\n(\d+)=\{\n\tall=\{(.*?)\n\}(?=\n\d+=|\n\t\})', wtxt, re.S):
    body = mm.group(0)
    parts = [int(x) for x in re.findall(r'\n\t+country=(\d+)', body)]
    if CID not in parts: continue
    nm = re.search(r'war_name=\{\s*name="?([^"\s]+)"?', body)
    bases = re.findall(r'(First|Second)=\{\s*name="?([^"\s]+)"?', body)
    oa = re.search(r'original_attacker=(\d+)', body); od = re.search(r'original_defenders=\{([^}]*)\}', body)
    sd = re.findall(r'start_date=([\d.]+)', body)
    cb = re.search(r'casus_belli=(\w+)', body)
    active.append({'name': nm.group(1) if nm else None, 'bases': bases,
                   'attacker': country_label(oa.group(1)) if oa else None,
                   'defenders': [country_label(x) for x in od.group(1).split()] if od else [],
                   'participants': [country_label(p) for p in parts], 'casus_belli': cb.group(1) if cb else None,
                   'start_dates': sorted(set(sd))[:3],
                   'attacker_score': (re.search(r'attacker_score=([-\d.]+)', body) or [0, None])[1],
                   'defender_score': (re.search(r'defender_score=([-\d.]+)', body) or [0, None])[1]})
R['active_wars'] = active
# global register of war names used (all wars ever named)
R['war_name_register_size'] = len(re.findall(r'\}=yes', war[:i]))
del war

# ---------- great powers ----------
gp = rd('great_power_manager')
R['great_powers'] = [(country_label(a), b) for a, b in re.findall(r'country=(\d+)\s+date=([\d.]+)', gp)]
R['hegemons'] = [(a, country_label(b), c) for a, b, c in re.findall(r'(\w+_hegemon)=\{\s*country=(\d+)\s+start_date=([\d.]+)', gp)]

# situations (names only)
R['situations'] = sorted(set(re.findall(r'\n\t\t\t?type=(\w+)', rd('situation_manager'))))[:80]

json.dump(R, open(OUT, 'w'), indent=1, default=str)
print('ok', R['date'], R['country'], R['realm']['locations'], R['realm']['population_k'], len(subs), 'subjects', len(active), 'wars')
