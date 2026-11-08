import json, sys
B = sys.argv[1]
cp = json.load(open(B + '/data/checkpoints.json'))
people = {p['id']: p for p in json.load(open(B + '/data/people.json'))}
wars = {w['id']: w for w in json.load(open(B + '/data/wars.json'))}
def pname(i):
    p = people.get(i)
    return p['name'] if p else i
rulers = {}
for c in cp:
    r = c['ruler']
    if r not in rulers:
        p = people[r]
        rulers[r] = {'name': p['name'], 'ar': p['nameArabic'], 'reign': p['reigns'][-1]}
out = []
for c in cp:
    e = c.get('economy') or {}
    pop = c.get('population') or {}
    rel = pop.get('religions') or {}
    m = c.get('military') or {}
    st = c.get('strait') or {}
    out.append({
        'd': c['date'], 't': c['checkpoint'], 'r': c['ruler'], 'cap': c['capital'], 'rank': c['rank'],
        'loc': c['locations'], 'tr': e.get('treasury'), 'inc': e.get('income'), 'exp': e.get('expenses'), 'debt': e.get('debt'),
        'pop': pop.get('total'), 'mus': rel.get('Sunni'),
        'wars': [wars[w]['name'] if w in wars else w for w in (c.get('wars') or [])],
        'stab': c.get('stability'), 'pres': c.get('prestige'), 'crown': c.get('crownPower'),
        'over': (c.get('overlord') or {}).get('country'), 'overT': (c.get('overlord') or {}).get('type'),
        'subj': [s['country'] for s in (c.get('subjects') or [])],
        'allies': c.get('allies') or [], 'rivals': c.get('rivals') or [],
        'heir': pname(c['heir']) if c.get('heir') else None,
        'cab': [[pname(x['person']), x['role']] for x in (c.get('cabinet') or [])],
        'est': [[x['id'], x['power'], x.get('satisfaction'), bool(x.get('estimated'))] for x in (c.get('estates') or [])],
        'men': m.get('manpower'), 'ships': m.get('ships'), 'regs': m.get('regiments'),
        'sov': st.get('sovereignty'), 'save': (c.get('source') or {}).get('save'), 'note': c.get('note'),
    })
json.dump({'rulers': rulers, 'coins': out}, open(sys.argv[2], 'w'), ensure_ascii=False, separators=(',', ':'))
