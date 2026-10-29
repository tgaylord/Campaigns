"""World overview from an EU5 save split into sections: every landed country ranked by population.
Usage: python3 world_summary.py <sections_dir> <out.json>
"""
import sys, re, json, collections
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shared', 'tools', 'eu5-save-decoder'))
from jomini import parse, get, vals, DB

D = sys.argv[1]; OUT = sys.argv[2]
def rd(n): return open(f'{D}/{n}.txt', encoding='utf8', errors='replace').read()
meta = rd('metadata')
LOCN = [x.strip('"') for x in re.search(r'locations=\{([^}]*)\}', meta).group(1).split()]
def _tags(txt):
    i = txt.find('\n\ttags={'); j = txt.find('\n\t}', i)
    return {int(a): b for a, b in re.findall(r"\n\t\t(\d+)=([A-Za-z0-9_]+)(?=\n)", txt[i:j])}
TAGS = _tags(rd('countries')[:3_000_000])
CDB = DB(f'{D}/countries.txt'); CHR = DB(f'{D}/character_db.txt'); CUL = DB(f'{D}/culture_manager.txt')
REL = DB(f'{D}/religion_manager.txt'); DYN = DB(f'{D}/dynasty_manager.txt')
def cname(i):
    c = CUL.get(int(i)) if i else None; return get(c, 'name') if c else None
def rname(i):
    c = REL.get(int(i)) if i else None; return (get(c, 'key') or get(c, 'name')) if c else None

# pops
POP = {}
for m in re.finditer(r'\n(\d+)=\{\n(.*?)\n\}', rd('population'), re.S):
    b = m.group(2); s = re.search(r'\n\tsize=([\d.]+)', '\n' + b)
    POP[int(m.group(1))] = float(s.group(1)) if s else 0.0
# locations
own = collections.defaultdict(lambda: [0, 0.0])
loc_txt = rd('locations')
starts = [(int(m.group(1)), m.start()) for m in re.finditer(r'\n\t\t(\d+)=\{', loc_txt)]
for i, (lid, s) in enumerate(starts):
    e = starts[i + 1][1] if i + 1 < len(starts) else len(loc_txt)
    b = loc_txt[s:e]
    o = re.search(r'\n\t\t\towner=(\d+)', b)
    if not o: continue
    pm = re.search(r'\n\t\t\t\tpops=\{([^}]*)\}', b)
    p = sum(POP.get(int(x), 0) for x in pm.group(1).split()) if pm else 0
    own[int(o.group(1))][0] += 1; own[int(o.group(1))][1] += p
del loc_txt, POP

# diplomacy
dip = rd('diplomacy_manager')
deps = [(int(a), int(b), re.findall(r'object=(\w+)', r)) for a, b, r in re.findall(r'\n\tdependency=\{\n\t\tfirst=(\d+)\n\t\tsecond=(\d+)(.*?)\n\t\}', dip, re.S)]
allies = collections.defaultdict(list)
for a, b, r in re.findall(r'\n\tscripted_mutual=\{\n\t\tfirst=(\d+)\n\t\tsecond=(\d+)(.*?)\n\t\}', dip, re.S):
    if 'alliance' in r: allies[int(a)].append(int(b)); allies[int(b)].append(int(a))
overlord = {b: (a, t[0] if t else None) for a, b, t in deps}
subjects = collections.defaultdict(list)
for a, b, t in deps: subjects[a].append(b)
rivals = {}
for m in re.finditer(r'(?:^|\}|\n)\t?(\d+)=\{\n\t\tdiplomats=[^\n]*\n(?:\t\t[^\n]*\n)*?\t\trivals_2=\{(.*?)\n\t\t\}', dip, re.M | re.S):
    rivals[int(m.group(1))] = [int(x) for x in re.findall(r'country=(\d+)', m.group(2))]
del dip

# wars
war = rd('war_manager'); wtxt = war[war.find('\n\tdatabase={'):]
wars = []
for mm in re.finditer(r'\n(\d+)=\{\n\tall=\{(.*?)\n\}(?=\n\d+=|\n\t\})', wtxt, re.S):
    body = mm.group(0)
    parts = [int(x) for x in re.findall(r'\n\t+country=(\d+)', body)]
    oa = re.search(r'original_attacker=(\d+)', body); od = re.search(r'original_defenders=\{([^}]*)\}', body)
    cb = re.search(r'casus_belli=(\w+)', body)
    wars.append({'attacker': int(oa.group(1)) if oa else None, 'defenders': [int(x) for x in od.group(1).split()] if od else [],
                 'n': len(set(parts)), 'cb': cb.group(1) if cb else None})
del war
# HRE and other organisations
io = rd('international_organization_manager')
orgs = []
for m in re.finditer(r'\n(\d+)=\{\n\ttype=(\w+)(.*?)\n\}(?=\n\d+=|\n\t\})', io, re.S):
    b = m.group(3); ld = re.search(r'\n\tleader=(\d+)', b); mem = re.search(r'all_members=\{([^}]*)\}', b)
    orgs.append({'type': m.group(2), 'leader': int(ld.group(1)) if ld else None, 'members': [int(x) for x in mem.group(1).split()] if mem else []})

def label(cid):
    r = CDB.raw(int(cid)) or ''
    head = r[:3000]
    cm = re.search(r'Custom_Name="?([^"\n]*)"?\n', head[:head.find('\n\tflag=') if '\n\tflag=' in head else 3000])
    cn = re.search(r'\tcountry_name=(?:"([^"]*)"|\{\s*name="?([^"\s]*)"?)', head)
    nm = cm.group(1) if cm else (cn.group(1) or cn.group(2)) if cn else None
    return {'id': int(cid), 'tag': TAGS.get(int(cid)), 'name': nm}
def info(cid):
    r = CDB.raw(int(cid)) or ''
    def f(k):
        m = re.search(r'\n\t' + k + r'=([^\s{]+)', r); return m.group(1) if m else None
    gov = re.search(r'\n\tgovernment=\{(.*?)\n\t\}', r, re.S)
    g = gov.group(1) if gov else ''
    gt = re.search(r'\n\t\ttype=(\w+)', g); ru = re.search(r'\n\t\truler=(\d+)', g)
    ruler = None
    if ru:
        c = CHR.get(int(ru.group(1)))
        if c:
            dy = get(c, 'dynasty'); dn = get(DYN.get(int(dy)), 'name') if dy and DYN.get(int(dy)) else None
            ruler = {'name': get(c, 'first_name'), 'dynasty': dn, 'born': get(c, 'birth_date'), 'stats': [get(c, 'adm'), get(c, 'dip'), get(c, 'mil')]}
    cap = f('capital')
    return {**label(cid), 'capital': LOCN[int(cap) - 1] if cap and cap.isdigit() else None, 'culture': cname(f('primary_culture')),
            'religion': rname(f('primary_religion')), 'gov': gt.group(1) if gt else None, 'ruler': ruler,
            'gp_rank': f('great_power_rank'), 'level': f('level'), 'locations': own[int(cid)][0], 'pop_k': round(own[int(cid)][1], 1),
            'overlord': (lambda o: {**label(o[0]), 'type': o[1]} if o else None)(overlord.get(int(cid))),
            'subjects': len(subjects.get(int(cid), [])),
            'subject_pop_k': round(sum(own[s][1] for s in subjects.get(int(cid), [])), 1),
            'subject_locations': sum(own[s][0] for s in subjects.get(int(cid), [])),
            'allies': [label(a) for a in allies.get(int(cid), [])], 'rivals': [label(a) for a in rivals.get(int(cid), [])],
            'previous_tags': re.findall(r'"(\w+)"', (re.search(r'\n\tprevious_tags=\{([^}]*)\}', r) or [None, ''])[1])}

ranked = sorted(own.items(), key=lambda kv: -kv[1][1])
top = [info(cid) for cid, _ in ranked[:70]]
gp = re.findall(r'country=(\d+)\s+date=([\d.]+)', rd('great_power_manager'))
out = {'date': re.search(r'\n\tdate=([\d.]+)', meta).group(1), 'top': top,
       'great_powers': [info(c) for c, d in gp],
       'wars': [{'attacker': label(w['attacker']) if w['attacker'] else None, 'defenders': [label(d) for d in w['defenders']], 'participants': w['n'], 'cb': w['cb']} for w in wars],
       'orgs': [{'type': o['type'], 'leader': label(o['leader']) if o['leader'] else None, 'n_members': len(o['members'])} for o in orgs]}
json.dump(out, open(OUT, 'w'), indent=1, default=str)
print('ok', len(top))
