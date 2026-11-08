"""Rough probe: how many cause-link candidates would each suggester heuristic raise on today's data?"""
import json, re, sys, glob, os
from datetime import date
B = sys.argv[1]
ev = json.load(open(f'{B}/data/events.json'))
byid = {e['id']: e for e in ev}
def d(s):
    y, m, dd = (s.split('-') + ['01', '01'])[:3]
    try: return date(int(y), int(m), int(dd[:2]) if dd[:2].isdigit() else 1)
    except Exception: return date(int(y), 1, 1)
out = {}
# 1 co-citation in chronicle sources
pairs = set()
for f in glob.glob(f'{B}/chronicle-samples/*.md'):
    txt = open(f).read()
    m = re.search(r'^sources: \[(.*)\]', txt, re.M)
    ids = [s.strip() for s in m.group(1).split(',')] if m else []
    ids = [i for i in ids if i in byid]
    for a in ids:
        for b in ids:
            if a < b and d(byid[a]['date']) != d(byid[b]['date']): pairs.add((a, b))
out['co-cited pairs (4 sample entries)'] = len(pairs)
# 2 explicit fields
fields = ('cause', 'why', 'reason', 'thread', 'history', 'price')
expl = [e['id'] for e in ev if isinstance(e.get('data'), dict) and any(k in e['data'] for k in fields)]
out['events with cause/why/reason/thread/history fields'] = len(expl)
titlecue = [e['id'] for e in ev if re.search(r'\b(price of|because|in exchange|sparked by|in return|after the|with the .* gone)\b', e['title'], re.I)]
out['titles with causal cue words'] = len(titlecue)
# 3 readings diffs not matched by an event
rr = json.load(open(f'{B}/data/realm-readings.json'))
unmatched, changes = [], 0
prev = None
for r in rr:
    cur = set(r['privileges']) | set(r['reforms']) | {f'{k}={v}' for k, v in r['laws'].items()}
    if prev is not None:
        for item in (cur ^ prev):
            changes += 1
            key = item.split('=')[-1]
            words = key.replace('_', ' ').replace('policy', '').strip().split()[:2]
            hit = any(abs((d(e['date']) - d(r['checkpoint'])).days) < 900 and
                      (key in json.dumps(e.get('data', {})) or all(w.lower() in e['title'].lower() for w in words))
                      for e in ev)
            if not hit: unmatched.append((r['checkpoint'], ('+' if item in cur else '-') + item))
    prev = cur
out['law/privilege/reform changes between readings'] = changes
out['...of which no event mentions (derived events to propose)'] = len(unmatched)
# 4 conditional reforms (rhythm)
cond = [e['id'] for e in ev if 'needs peace' in json.dumps(e.get('data', {}))]
out['reforms whose effects name a condition (rhythm detector seeds)'] = len(cond)
# 5 structural same-war
wars = {}
for e in ev:
    for w in e.get('wars') or []: wars.setdefault(w, []).append(e['id'])
out['war bundles (structural, auto-confirmed)'] = len(wars)
out['events folded into war bundles'] = sum(len(v) for v in wars.values())
# 6 estate reactions within 60 days of a law/reform/privilege event
trig = [e for e in ev if e['type'] in ('law_change', 'reform') or (e['type'] == 'estate_change' and 'privilege' in e['title'].lower())]
reac = [e for e in ev if e['type'] == 'estate_change']
n = sum(1 for t in trig for r in reac if r is not t and 0 <= (d(r['date']) - d(t['date'])).days <= 60)
out['estate reaction pairs (<=60 days after a law/reform/privilege)'] = n
# 7 requirements / enables in effect text
req = [e['id'] for e in ev if re.search(r'requires|enables the decision|needs ', json.dumps(e.get('data', {})))]
out['events whose data states a requirement or an unlock'] = len(req)
for k, v in out.items(): print(f'{v:5}  {k}')
print('\nunmatched diffs:'); [print('  ', c, i) for c, i in unmatched]
print('\nrequirement events:', req)
print('\nco-cited:', sorted(pairs)[:12])
