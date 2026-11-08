"""Build the Hourglass mockup: read brief2/, derive dates, inline into the HTML template.
Usage: python3 -I build.py <brief2 dir> <template.html> <out.html>
"""
import json, glob, re, sys, os, datetime as dt

B, TPL, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
J = lambda n: json.load(open(os.path.join(B, 'data', n)))

books = J('books.json')
events = J('events.json')
EV = {e['id']: e for e in events}
people = J('people.json')
places = J('places.json')
cps = J('checkpoints.json')
ranks = J('world-rankings.json')
countries = J('countries.json')

COL = {
    'book-of-mending': '#5d7f8c', 'book-of-balance': '#8c7a2b', 'book-of-pestilence': '#7a5f86',
    'book-of-the-call': '#3e7f58', 'book-of-the-marches': '#a8443a', 'book-of-the-encircling-sea': '#2f6c9c',
    'book-of-the-franks': '#8a6446', 'book-of-the-golden-century': '#d29a1c'}

# ---------- provenance of an event, from its source string ----------
def prov(src):
    s = src.lower()
    if 'screenshot' in s or 'screen' in s:
        return 'screen' if 'save' not in s else 'save+'
    if "trent" in s and 'save' not in s and 'checkpoint' not in s:
        return 'account'
    if "trent" in s:
        return 'save+'
    if 'people.json' in s:
        return 'record'
    return 'save'

# ---------- entries ----------
entries = []
for f in sorted(glob.glob(os.path.join(B, 'chronicle', '*.md'))):
    t = open(f, encoding='utf-8').read()
    fm, body = t.split('---', 2)[1], t.split('---', 2)[2].strip()
    g = lambda k: (re.search(r'^%s: (.*)$' % k, fm, re.M) or [None, ''])[1].strip()
    lst = lambda k: [x.strip() for x in g(k).strip('[]').split(',') if x.strip()]
    fn = os.path.basename(f)[:-3]
    entries.append(dict(id=fn, hijri=fn[:10], title=g('title'), date=g('date'), era=g('era'),
                        people=lst('people'), places=lst('places'), sources=lst('sources'), text=body))
entries.sort(key=lambda e: (e['date'], e['id']))

# told vs callback: a source is "told" by the first entry (strictly earlier date) to cite it
first_cite = {}
for e in entries:
    for s in e['sources']:
        if s not in first_cite:
            first_cite[s] = e
for e in entries:
    told, cb = [], []
    for s in e['sources']:
        fc = first_cite[s]
        if fc['date'] < e['date'] and fc is not e:
            cb.append(fc['id'])
        else:
            told.append(s)
    tdates = sorted(EV[s]['date'] for s in told if s in EV)
    alld = sorted(EV[s]['date'] for s in e['sources'] if s in EV)
    e['reach'] = min(tdates[0], e['date']) if tdates else e['date']
    e['asOf'] = max(alld[-1], e['date']) if alld else e['date']
    e['callbacks'] = sorted(set(cb))
    e['words'] = len(re.findall(r'\S+', e['text']))
    del e['sources']

# first mentioned / last mentioned per person and place (derived)
mention = {}
for e in entries:
    for p in e['people'] + ['@' + x for x in e['places']]:
        mention.setdefault(p, []).append(e['id'])

# ---------- dated sentences from notes (heuristic) ----------
MON = {m: i + 1 for i, m in enumerate(['January', 'February', 'March', 'April', 'May', 'June', 'July',
                                        'August', 'September', 'October', 'November', 'December'])}
RX = re.compile(r'(?:(\d{1,2}) )?(January|February|March|April|May|June|July|August|September|October|November|December) (1[2-4]\d\d)|\b(1[2-4]\d\d)\b')

def last_day(y, m):
    return (dt.date(y + (m == 12), m % 12 + 1, 1) - dt.timedelta(days=1)).day

def sent_date(s):
    best = None
    for d, mon, y, bare in RX.findall(s):
        if bare:
            v = '%s-12-31' % bare
        elif d:
            v = '%s-%02d-%02d' % (y, MON[mon], int(d))
        else:
            v = '%s-%02d-%02d' % (y, MON[mon], last_day(int(y), MON[mon]))
        best = v if best is None or v > best else best
    return best

def slice_note(note):
    if not note:
        return []
    parts = re.split(r'(?<=[.!?])\s+(?=[A-ZĀĪŪḤṢṬẒʿʾ“"(])', note)
    out, prev = [], None
    for s in parts:
        d = sent_date(s) or prev
        out.append([d, s])
        prev = d
    return out

# ---------- people ----------
P = []
for p in people:
    roles = []
    for r in p.get('roles', []):
        m = re.search(r'\((?:from )?(1[2-4]\d\d)(?:[–-](1[2-4]\d\d))?\)', r)
        if m:
            roles.append([m.group(1) + '-01-01', (m.group(2) + '-12-31') if m.group(2) else None, r])
        else:
            roles.append([None, None, r])
    ms = mention.get(p['id'], [])
    P.append(dict(id=p['id'], name=p['name'], ar=p.get('nameArabic'), game=p.get('nameGame'),
                  born=p.get('born'), died=p.get('died'), female=p.get('female', False),
                  dynasty=p.get('dynasty'), father=p.get('father'), mother=p.get('mother'),
                  roles=roles, traits=p.get('traits', []), reigns=p.get('reigns'),
                  note=slice_note(p.get('note')), mentions=ms))

PL = []
for p in places:
    PL.append(dict(id=p['id'], name=p['name'], ar=p.get('nameArabic'), plain=p['key'].replace('_', ' ').title(),
                   game=p.get('nameGame'), held=p.get('held'), major=p.get('major', False),
                   note=slice_note(p.get('note')), mentions=mention.get('@' + p['id'], [])))

# ---------- events (trimmed) ----------
E = []
for e in events:
    E.append(dict(id=e['id'], d=e['date'], t=e['type'], ti=e['title'][:240], p=e.get('people', []),
                  pl=e.get('places', []), pv=prov(e['source']), s=e['source'][:140]))

# ---------- checkpoints (trimmed) ----------
C = []
for c in cps:
    est_note = ''
    if c.get('note'):
        m = [s for s in re.split(r'(?<=\.)\s+', c['note']) if 'estimat' in s.lower()]
        est_note = ' '.join(m)
    pop = c.get('population') or {}
    rel = pop.get('religions') or {}
    rk = [r for r in ranks.get(c['date'], []) if r[0] in ('GRA', 'ADU')]
    C.append(dict(d=c['date'], name=c.get('checkpoint'), note=c.get('note'), ruler=c.get('ruler'),
                  heir=c.get('heir'), regent=c.get('regent'), capital=c.get('capital'), rank=c.get('rank'),
                  towns=c.get('locations'), pop=pop.get('total'),
                  sunni=rel.get('Sunni'), catholic=rel.get('Catholic'), jewish=rel.get('Jewish'),
                  econ=c.get('economy'), stab=c.get('stability'), prest=c.get('prestige'),
                  crown=c.get('crownPower'), sov=(c.get('strait') or {}).get('sovereignty'),
                  estates=[dict(n=x['name'], p=x.get('power'), s=x.get('satisfaction'), est=x.get('estimated'))
                           for x in (c.get('estates') or [])],
                  subjects=len(c.get('subjects') or []), allies=c.get('allies') or [], rivals=c.get('rivals') or [],
                  overlord=c.get('overlord'), cabinet=c.get('cabinet') or [],
                  mil=c.get('military'), save=(c.get('source') or {}).get('save'),
                  world=rk[0][1] if rk else None, estNote=est_note))

# ---------- reigns and regencies ----------
R = []
for p in people:
    if p.get('reigns') and p['id'] in ('yusuf-i', 'saad-ibn-yusuf', 'ismail-ibn-saad', 'muhammad-ibn-ismail-ibn-saad'):
        for r in p['reigns']:
            R.append(dict(who=p['id'], name=p['name'], frm=r['from'], to=r['to']))
REG = [dict(who='faraj-ibn-ismail', frm='1351-08-09', to='1352-04-07', why="Yūsuf I on the Ḥajj"),
       dict(who='nasr-al-istijji', frm='1363-08-01', to='1364-01-18', why='Saʿd a minor')]

BK = [dict(id=b['id'], t=b['title'], ar=b['titleArabic'], s=b['start'], e=b['end'], c=COL[b['id']]) for b in books]

data = dict(books=BK, entries=entries, people=P, places=PL, events=E, cps=C, reigns=R, regencies=REG,
            countries=[dict(tag=c['tag'], name=c['name'], renamed=c.get('renamed')) for c in countries if c['tag'] == 'GRA'])
blob = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
html = open(TPL, encoding='utf-8').read().replace('/*__DATA__*/null', blob)
open(OUT, 'w', encoding='utf-8').write(html)
print('ok', len(html) // 1024, 'KB', len(entries), 'entries', sum(1 for e in entries if e['callbacks']), 'with callbacks')
# a few derived stats for the pitch
print('forward tellers', sum(1 for e in entries if e['asOf'] > e['date']))
print('retro (>2y)', [(e['date'], e['reach']) for e in entries if e['reach'] < str(int(e['date'][:4]) - 2)])
print('people never mentioned', sum(1 for p in P if not p['mentions']))
