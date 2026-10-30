#!/usr/bin/env python3
"""The world beyond the realm at one checkpoint: the great and regional powers, the
powers the chronicle follows, and the ties between them.

usage:
  world_powers.py SECTIONS_DIR CHECKPOINT_ID --game GAME_DIR [--out-dir data/world]

SECTIONS_DIR is a save decoded by shared/tools/eu5-save-decoder-1.4/decode.py.
GAME_DIR is the game's `game` folder (for English names and the map's
location-to-province definitions).

Writes <out-dir>/<checkpoint>.json:
  ladder   the world ranking down to 30th: [tag, rank, points, regional power?]
  powers   every power on the ladder plus the ones data/powers.json follows:
           size (locations, people in thousands, with subjects), income, gold,
           men under arms (regulars + raised levies, as tools in SYSTEMS.md §4),
           ships, ruler and heir, overlord, subjects, allies, rivals
  unions   personal unions touching the followed powers
  wars     wars the followed powers are fighting, by side
  orders   the Emperor, the Pope, and the Guelph and Ghibelline leagues
and updates <out-dir>/tags.json, the English name and map colour of every
country that owns land, for the wide chart.

A subject has no place on the ladder: the game ranks only sovereign countries.
"""
import argparse, collections, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'shared', 'tools', 'eu5-save-decoder-1.4'))
from jomini import DB, get, vals  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument('sections'); ap.add_argument('checkpoint')
ap.add_argument('--out-dir', default=os.path.join(HERE, '..', 'data', 'world'))
ap.add_argument('--game', required=True, help="the game's `game` folder, for English names and map definitions")
ap.add_argument('--ladder', type=int, default=30)
a = ap.parse_args()
D = a.sections
rd = lambda n: open(os.path.join(D, n + '.txt'), encoding='utf8', errors='replace').read()
iso = lambda d: '-'.join(f'{int(p):02d}' if i else p for i, p in enumerate(d.split('.'))) if d else None

# ---------- English names ----------
LOCDIR = os.path.join(a.game, 'main_menu', 'localization', 'english')
CNAME, PNAME = {}, {}
for fn, dst in (('country_names_l_english.yml', CNAME), ('character_names_dynamic_l_english.yml', PNAME)):
    for line in open(os.path.join(LOCDIR, fn), encoding='utf-8-sig', errors='replace'):
        m = re.match(r'\s*([A-Za-z0-9_.\-]+):\d*\s*"(.*?)"', line)
        if m: dst.setdefault(m.group(1), m.group(2))
# dialect -> its language, so a name falls back from the dialect's form to the language's
PARENT = {}
for fn in os.listdir(os.path.join(a.game, 'in_game', 'common', 'languages')):
    lang = None
    for line in open(os.path.join(a.game, 'in_game', 'common', 'languages', fn), encoding='utf-8-sig', errors='replace'):
        m = re.match(r'(\w+)\s*=\s*\{', line)
        if m: lang = m.group(1); continue
        m = re.match(r'\t\t(\w+)\s*=\s*\{', line)
        if m and lang: PARENT[m.group(1)] = lang


def given(key, language):
    """name_john + castilian_dialect -> Juan; compound keys (name_abu.name_john) are joined."""
    if not key: return None
    if not key.startswith('name_'): return key.replace('_', ' ')
    out = []
    for part in [p for p in key.split('.') if p.startswith('name_')]:
        tries = [f'{part}.{language}', f'{part}.{PARENT.get(language, "")}', part] if language else [part]
        out.append(next((PNAME[t] for t in tries if t in PNAME), part[5:].replace('_', ' ').title()))
    return ' '.join(out).strip("'")


# location -> province, from the game's map definitions (for placing capitals on the wide chart)
PROV = {}
_t = re.sub(r'#[^\n]*', '', open(os.path.join(a.game, 'in_game', 'map_data', 'definitions.txt'), encoding='utf-8-sig').read())
_toks, _stack, _i = re.findall(r'[\w.]+|\{|\}|=', _t), [], 0
while _i < len(_toks):
    tk = _toks[_i]
    if _i + 2 < len(_toks) and _toks[_i + 1] == '=' and _toks[_i + 2] == '{': _stack.append(tk); _i += 3; continue
    if _i + 2 < len(_toks) and _toks[_i + 1] == '=': _i += 3; continue
    if tk == '}': _stack.pop(); _i += 1; continue
    if len(_stack) > 4: PROV[tk] = _stack[4]
    _i += 1
del _t, _toks

# ---------- the save ----------
meta = rd('metadata')
date = re.search(r'\n\tdate=([\d.]+)', meta).group(1)
LOCN = [x.strip('"') for x in re.search(r'\n\t\tlocations=\{([^}]*)\}', meta).group(1).split()]
ct = rd('countries'); ti = ct.find('\n\ttags={'); tj = ct.find('\n\t}', ti)
TAG = {k: v for k, v in re.findall(r'\n\t\t(\d+)=([A-Za-z0-9_]+)(?=\n)', ct[ti:tj])}

CUL, REL = {}, {}
for sec, dst in (('culture_manager', CUL), ('religion_manager', REL)):
    for m in re.finditer(r'\n(\d+)=\{\n\tname=(\w+)(.*?)\n\}', rd(sec), re.S):
        lang = re.search(r'\n\tlanguage=(\w+)', m.group(3))
        dst[m.group(1)] = (m.group(2), lang.group(1) if lang else None)

C = {}
starts = [(m.group(1), m.start()) for m in re.finditer(r'\n(\d+)=\{\n\tcountry_name=', ct)]
for k, (cid, s) in enumerate(starts):
    b = ct[s:starts[k + 1][1] if k + 1 < len(starts) else len(ct)]
    g = lambda key: (re.search(r'\n\t' + key + r'=([^\n]+)', b) or [0, None])[1]
    if g('country_type') != 'Real': continue
    tag = TAG.get(cid)
    num = lambda key, nest=r'\n\t': float((re.search(nest + key + r'=([-\d.]+)', b) or [0, 0])[1])
    rgb = re.search(r'\n\tcolor=rgb \{\n(\d+)\n(\d+)\n(\d+)', b)
    cap = g('capital')
    C[tag] = dict(id=cid, name=CNAME.get(tag, tag), level=int(g('level') or 0),
                  rank=int(g('great_power_rank') or 0) if g('great_power_points') else None,
                  points=num('great_power_points') if g('great_power_points') else None,
                  regional=g('regional_power') == 'yes',
                  pop=num('last_months_population'), tax=num('last_months_tax_income'), trade=num('monthly_trade_value'),
                  gold=num('gold', r'\n\t\t'), stability=num('stability', r'\n\t\t'), prestige=num('prestige', r'\n\t\t'),
                  capital=LOCN[int(cap) - 1] if cap and cap.isdigit() and 0 < int(cap) <= len(LOCN) else None,
                  culture=CUL.get(g('primary_culture'), (None,))[0], religion=REL.get(g('primary_religion'), (None,))[0],
                  color='#%02x%02x%02x' % tuple(int(x) for x in rgb.groups()) if rgb else None)
del ct
ID = {v['id']: t for t, v in C.items()}

locs = collections.Counter(ID.get(m.group(1)) for m in re.finditer(r'\n\t\t\d+=\{\n\t\t\towner=(\d+)', rd('locations')))

# diplomacy: subjects, alliances, guarantees, rivals
dip = rd('diplomacy_manager')
subjects, overlord = collections.defaultdict(list), {}
allies, guarantees = collections.defaultdict(set), collections.defaultdict(set)
for m in re.finditer(r'\n\t(\w+)=\{\n\t\tfirst=(\d+)\n\t\tsecond=(\d+)(.*?)\n\t\}', dip, re.S):
    kind, x, y, body = m.groups(); x, y = ID.get(x), ID.get(y)
    if not x or not y: continue
    if kind == 'dependency':
        st = re.search(r'object=(\w+)', body); st = st.group(1) if st else None
        subjects[x].append([y, st]); overlord[y] = [x, st]
    elif kind == 'scripted_mutual' and 'object=alliance' in body: allies[x].add(y); allies[y].add(x)
    elif kind == 'scripted_oneway' and 'object=guarantee' in body: guarantees[x].add(y)
rivals = {}
for m in re.finditer(r'\n\t(\d+)=\{\n(.*?)\n\t\}(?=\n\t\d+=\{|\n\})', dip, re.S):
    r = re.search(r'rivals_2=\{\n\t\t\tlist=\{(.*?)\n\t\t\t\}', m.group(2), re.S)
    if r and ID.get(m.group(1)): rivals[ID[m.group(1)]] = [ID.get(x) for x in re.findall(r'country=(\d+)', r.group(1)) if ID.get(x)]
del dip

# men under arms: regulars + raised levies (a missing strength is full; 1.0 = 1,000 men); ships
force = collections.defaultdict(lambda: [0.0, 0.0, 0])
for m in re.finditer(r'\n\d+=\{\n(.*?)\n\}', rd('subunit_manager'), re.S):
    b = '\n' + m.group(1); o = re.search(r'\n\towner=(\d+)', b)
    if not o: continue
    o = ID.get(o.group(1)); t = re.search(r'\n\ttype=(\w+)', b); st = re.search(r'\n\tstrength=([\d.]+)', b)
    if not o or not t: continue
    if t.group(1).startswith('n_'): force[o][2] += 1
    elif t.group(1).startswith('a_'): force[o][1 if re.search(r'\n\tlevies=', b) else 0] += float(st.group(1)) if st else 1.0

# who to describe
FOCUS = set()
pf = os.path.join(HERE, '..', 'data', 'powers.json')
if os.path.exists(pf):
    for circle in json.load(open(pf, encoding='utf8'))['circles']: FOCUS |= set(circle['tags'])
ladder = sorted([(t, v['rank'], v['points'], v['regional']) for t, v in C.items() if v['rank'] and v['rank'] <= a.ladder],
                key=lambda r: (r[1], -r[2]))
WANT = (FOCUS | {r[0] for r in ladder} | {'GRA'}) & set(C)
NEAR = (FOCUS | {'GRA'}) & set(C)  # unions and wars are kept only for these

CDB, CHR = DB(os.path.join(D, 'countries.txt')), DB(os.path.join(D, 'character_db.txt'))
RT = DB(os.path.join(D, 'rulerterm_manager.txt'))
Y = int(date.split('.')[0])


def person(cid):
    c = CHR.get(int(cid)) if cid else None
    if c is None: return None
    lang = CUL.get(get(c, 'culture') or '', (None, None))[1]
    st = [round(float(get(c, k) or 0)) for k in ('adm', 'dip', 'mil')]
    return {'gameId': int(cid), 'name': given(get(c, 'first_name'), lang), 'born': iso(get(c, 'birth_date')),
            'female': get(c, 'female') == 'yes', 'stats': st}


def reign(gov):
    """The ruler, with the start of his current term and his regnal number."""
    p = person(get(gov, 'ruler'))
    if not p: return None
    for tid in reversed(vals(get(gov, 'ruler_terms') or [])):
        t = RT.get(int(tid))
        chs = vals(get(get(t, 'ruler') or [], 'characters') or []) if t else []
        ch = next((c for c in chs if str(get(c, 'character')) == str(p['gameId'])), None)
        if ch:
            p['since'] = iso(get(t, 'start_date')); p['regnal'] = int(get(ch, 'regnal_number') or 0) or None
            break
    return p


powers = {}
for t in sorted(WANT):
    v = C[t]; gov = get(CDB.get(int(v['id'])), 'government') or []
    subs = subjects.get(t, [])
    f = force[t]
    powers[t] = {
        'name': v['name'], 'rank': v['rank'], 'points': v['points'], 'regional': v['regional'], 'level': v['level'],
        'locations': locs[t], 'people': round(v['pop']), 'subjectLocations': sum(locs[s] for s, _ in subs),
        'subjectPeople': round(sum(C[s]['pop'] for s, _ in subs if s in C)),
        'tax': round(v['tax'], 1), 'trade': round(v['trade'], 1), 'gold': round(v['gold']),
        'stability': round(v['stability']), 'prestige': round(v['prestige']),
        'men': round((f[0] + f[1]) * 1000), 'regulars': round(f[0] * 1000), 'levies': round(f[1] * 1000), 'ships': f[2],
        'capital': v['capital'], 'capitalProvince': PROV.get(v['capital']), 'culture': v['culture'], 'religion': v['religion'],
        'ruler': reign(gov), 'heir': person(get(gov, 'heir')),
        'overlord': overlord.get(t), 'subjects': subs,
        'allies': sorted(allies[t]), 'rivals': rivals.get(t, []), 'guarantees': sorted(guarantees[t]),
    }

# international organisations: unions, the Empire, the Church, the Italian leagues
io = rd('international_organization_manager')
unions, orders = [], {}
for m in re.finditer(r'\n(\d+)=\{\n\ttype=(\w+)(.*?)\n\}', io, re.S):
    typ, b = m.group(2), m.group(3)
    lead = re.search(r'\n\tleader=(\d+)', b); lead = ID.get(lead.group(1)) if lead else None
    mem = re.search(r'\n\tall_members=\{([^}]*)\}', b)
    mems = [ID[x] for x in (mem.group(1).split() if mem else []) if x in ID]
    if typ in ('union', 'marriage_union') and set(mems) & NEAR:
        jd = re.findall(r'\n\t\t(\d+)=([\d.]+)', (re.search(r'\n\tjoined_dates=\{(.*?)\n\t\}', b, re.S) or [0, ''])[1])
        unions.append({'members': mems, 'leader': lead, 'kind': typ,
                       'since': iso(max((d for _, d in jd), key=lambda d: [int(p) for p in d.split('.')])) if jd else None})
    elif typ == 'hre': orders['emperor'] = lead; orders['empireMembers'] = len(mems)
    elif typ == 'catholic_church': orders['pope'] = lead
    elif typ in ('guelphs_io', 'ghibellines_io'):
        orders[typ.split('_')[0]] = {'leader': lead, 'members': sorted(x for x in mems if x in WANT), 'count': len(mems)}
del io

# wars in progress that touch the powers described
wt = rd('war_manager'); wt = wt[wt.find('\n\tdatabase={'):]
wars = []
for m in re.finditer(r'\n(\d+)=\{\n(.*?)\n\}', wt, re.S):
    b = m.group(2)
    if re.search(r'\n\tend_date=', b): continue
    sides = collections.defaultdict(list)
    for p in re.split(r'\n\{\n\t\t\tcountry=', b)[1:]:
        c = ID.get(p.split('\n', 1)[0].strip()); s = re.search(r'side=(\w+)', p); st = re.search(r'\n\t\t\tstatus=(\w+)', p)
        if c and s and (not st or st.group(1) == 'Active'): sides[s.group(1)].append(c)
    if not (set(sides['Attacker']) | set(sides['Defender'])) & NEAR: continue
    sc = re.search(r'\n\tattacker_score=([-\d.]+)', b); sd = re.search(r'\n\tstart_date=([\d.]+)', b)
    oa = re.search(r'\n\toriginal_attacker=(\d+)', b); od = re.search(r'\n\toriginal_attacker_target=(\d+)', b)
    cb = re.search(r'casus_belli=(\w+)', b)
    wars.append({'started': iso(sd.group(1)) if sd else None, 'attacker': ID.get(oa.group(1)) if oa else None,
                 'defender': ID.get(od.group(1)) if od else None, 'cb': cb.group(1) if cb else None,
                 'revolt': bool(re.search(r'\n\trevolt=yes', b)),
                 'attackers': sorted(set(sides['Attacker'])), 'defenders': sorted(set(sides['Defender'])),
                 'score': float(sc.group(1)) if sc else None})

os.makedirs(a.out_dir, exist_ok=True)
dst = os.path.join(a.out_dir, f'{a.checkpoint}.json')
json.dump({'date': iso(date), 'ladder': [list(r) for r in ladder], 'powers': powers, 'unions': unions, 'orders': orders, 'wars': wars},
          open(dst, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print(f'{dst}: {len(ladder)} ranked, {len(powers)} powers, {len(unions)} unions, {len(wars)} wars, {os.path.getsize(dst) // 1024} KB')

# names and colours of every landed country, for the wide chart (the latest checkpoint wins)
import fcntl
tf = os.path.join(a.out_dir, 'tags.json')
import tempfile
with open(os.path.join(tempfile.gettempdir(), 'world_powers.tags.lock'), 'w') as lock:
    fcntl.flock(lock, fcntl.LOCK_EX)  # several checkpoints may be run at once
    tags = json.load(open(tf, encoding='utf8')) if os.path.exists(tf) else {}
    for t, v in C.items():
        if t and locs[t] and (t not in tags or tags[t].get('asOf', '') <= iso(date)):
            tags[t] = {'name': v['name'], 'color': v['color'], 'asOf': iso(date)}
    json.dump(dict(sorted(tags.items())), open(tf, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
