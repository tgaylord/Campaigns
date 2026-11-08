"""Glossed Folio: build the folio data for the mockup from brief2/.

Usage: python3 -I build.py <brief2 dir> <out json> [entry files...]
Prints an anchor report (the "check" step) to stdout.
"""
import json, os, re, sys, unicodedata, math
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hijri import islamic_to_jd, jd_to_julian, julian_to_jd, jd_to_islamic

B = sys.argv[1]; OUT = sys.argv[2]; WANT = sys.argv[3:]
J = lambda f: json.load(open(os.path.join(B, 'data', f)))
events = {e['id']: e for e in J('events.json')}
people = {p['id']: p for p in J('people.json')}
places = {p['id']: p for p in J('places.json')}
wars = {w['id']: w for w in J('wars.json')}
books = {b['id']: b for b in J('books.json')}
countries = J('countries.json')
checkpoints = sorted(J('checkpoints.json'), key=lambda c: c['date'])

MONTHS = ['Muḥarram', 'Ṣafar', 'Rabīʿ al-Awwal', 'Rabīʿ al-Thānī', 'Jumādā al-Ūlā', 'Jumādā al-Ākhira',
          'Rajab', 'Shaʿbān', 'Ramaḍān', 'Shawwāl', 'Dhū al-Qaʿda', 'Dhū al-Ḥijja']
WMONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
           'October', 'November', 'December']
ORD = {}
_u = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth']
for i, w in enumerate(_u): ORD[w] = i + 1
for i, w in enumerate(['tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth',
                       'seventeenth', 'eighteenth', 'nineteenth']): ORD[w] = 10 + i
ORD['twentieth'] = 20; ORD['thirtieth'] = 30
for i, w in enumerate(_u): ORD['twenty-' + w] = 21 + i

def hijri_str(y, m, d): return f"{d} {MONTHS[m-1]} {y}"
def west_to_hijri(iso):
    y, m, d = map(int, iso.split('-'))
    return jd_to_islamic(julian_to_jd(y, m, d))
def hijri_to_west(y, m, d):
    yy, mm, dd = jd_to_julian(islamic_to_jd(y, m, d)); return f"{yy:04d}-{mm:02d}-{dd:02d}"
def fmt_w(iso):
    y, m, d = map(int, iso.split('-')); return f"{d} {WMONTHS[m-1][:3]} {y}"
def days_between(a, b):
    return (date(*map(int, b.split('-'))) - date(*map(int, a.split('-')))).days

def fold(s):
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return s.replace('ʿ', '').replace('ʾ', '').replace('’', "'").lower()

STOP = set("""that this with from were which their there they them then than have into upon over under after before
about would could shall while where when what whose some more most such only also been being because those these
other others again against between every each made make gave given took taken came come went said says city town towns
year years first last great king emperor army armies host fleet ships ship battle war peace men man ours theirs""".split())
def stem(w):
    w = w.split("'")[0]
    for suf in ('ing', 'ed', 'es', 's'):
        if len(w) > len(suf) + 3 and w.endswith(suf): return w[:-len(suf)]
    return w
def toks(s):
    ws = re.findall(r"[a-z][a-z'\-]{3,}", fold(re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', s)))
    return set(stem(w) for w in ws if w not in STOP and stem(w) not in STOP)

# ---------- entries ----------
def parse_entry(path):
    t = open(path, encoding='utf-8').read()
    _, fm, body = t.split('---', 2)
    meta = {}
    for line in fm.strip().splitlines():
        k, _, v = line.partition(':'); v = v.strip()
        meta[k.strip()] = [x.strip() for x in v[1:-1].split(',') if x.strip()] if v.startswith('[') else v
    paras = [p.strip() for p in body.strip().split('\n\n') if p.strip()]
    return meta, paras

ALL = {}
for f in sorted(os.listdir(os.path.join(B, 'chronicle'))):
    m, p = parse_entry(os.path.join(B, 'chronicle', f)); ALL[f] = (m, p)
order = sorted(ALL, key=lambda f: (ALL[f][0]['date'], f))
first_seen = {}
for f in order:
    for pid in ALL[f][0].get('people', []): first_seen.setdefault(('p', pid), f)
    for pid in ALL[f][0].get('places', []): first_seen.setdefault(('l', pid), f)

# ---------- date mentions ----------
MON_RE = '|'.join(re.escape(m) for m in MONTHS)
ORD_RE = '|'.join(sorted(ORD, key=len, reverse=True))
DATE_RE = re.compile(
    rf"(?:(?P<pre>Peace of (?:the )?)?)(?:(?:the )?(?P<day>\d{{1,2}}|{ORD_RE})(?: day)? (?:of )?)?(?P<mon>{MON_RE})"
    rf"(?:,? (?:in )?(?:of )?(?:the year )?(?P<yr>\d{{3}})(?!\d))?", re.I)
WEST_RE = re.compile(r"(?P<d>\d{1,2}) (?P<m>" + '|'.join(WMONTHS) + r") (?P<y>\d{4})")
SAME_RE = re.compile(r"\b(that|the) same day\b", re.I)

def sentences(p):
    # split on sentence end, keeping markdown links intact
    out, cur, depth = [], '', 0
    i = 0
    parts = re.split(r'(?<=[.!?])(\*?)\s+(?=[A-Z\[*ʿ"‘])', p)
    # re.split with group returns separators; rejoin
    buf = []
    for k, part in enumerate(parts):
        if k % 2 == 1: buf[-1] += part; continue
        buf.append(part)
    return [s for s in buf if s.strip()]

def find_dates(paras, entry_iso):
    """Return list of mentions: (pi, si, kind, (y,m,d)|None, text) with years inferred."""
    raw = []
    for pi, p in enumerate(paras):
        for si, s in enumerate(sentences(p)):
            for mt in DATE_RE.finditer(s):
                if mt.group('pre'): continue  # 'Peace of Ramaḍān' is a name, not a date
                mon = next(i for i, m in enumerate(MONTHS) if m.lower() == mt.group('mon').lower()) + 1
                day = mt.group('day'); day = int(day) if day and day.isdigit() else ORD.get((day or '').lower())
                yr = int(mt.group('yr')) if mt.group('yr') else None
                raw.append(dict(pi=pi, si=si, m=mon, d=day, y=yr, text=mt.group(0), cal='h'))
            for mt in WEST_RE.finditer(s):
                raw.append(dict(pi=pi, si=si, iso=f"{int(mt.group('y')):04d}-{WMONTHS.index(mt.group('m'))+1:02d}-{int(mt.group('d')):02d}",
                                text=mt.group(0), cal='w'))
            if SAME_RE.search(s):
                raw.append(dict(pi=pi, si=si, same=True, text=SAME_RE.search(s).group(0), cal='same'))
    ey, em, ed = west_to_hijri(entry_iso)
    # year inference: carry explicit years forward; months that run backwards roll the year on
    hs = [r for r in raw if r['cal'] == 'h']
    ctx = None
    for i, r in enumerate(hs):
        if r['y']:
            ctx = (r['y'], r['m']); r['how'] = 'year written'; continue
        if ctx:
            r['y'] = ctx[0] if r['m'] >= ctx[1] else ctx[0] + 1; r['how'] = 'year carried from earlier in the entry'
        else:
            nxt = next((h for h in hs[i+1:] if h['y'] and h.get('how') == 'year written'), None)
            if nxt: r['y'] = nxt['y'] if r['m'] <= nxt['m'] else nxt['y'] - 1; r['how'] = 'year taken from the next written year'
            else: r['y'] = ey if r['m'] <= em else ey - 1; r['how'] = "year taken from the entry's own date"
        ctx = (r['y'], r['m'])
    out, last = [], None
    for r in raw:
        if r['cal'] == 'h':
            if r['d']:
                iso = hijri_to_west(r['y'], r['m'], r['d']); r.update(lo=iso, hi=iso, level='day')
            else:
                lo = hijri_to_west(r['y'], r['m'], 1)
                hi_jd = islamic_to_jd(r['y'] + (r['m'] == 12), r['m'] % 12 + 1, 1) - 1
                yy, mm, dd = jd_to_julian(hi_jd); r.update(lo=lo, hi=f"{yy:04d}-{mm:02d}-{dd:02d}", level='month')
            r['label'] = (hijri_str(r['y'], r['m'], r['d']) if r['d'] else f"{MONTHS[r['m']-1]} {r['y']}")
            last = r
        elif r['cal'] == 'w':
            r.update(lo=r['iso'], hi=r['iso'], level='day', label=fmt_w(r['iso']), how='Western date written')
            last = r
        else:
            if not last or last['level'] != 'day': continue
            r.update(lo=last['lo'], hi=last['hi'], level='day', label=last['label'], how='"same day" after ' + last['label'])
        out.append(r)
    return out

# ---------- anchoring ----------
def entities_in(s):
    return set(re.findall(r'\((?:person|place|war):([a-z0-9\-]+)\)', s))

def anchor(meta, paras):
    srcs = [events[s] for s in meta.get('sources', []) if s in events]
    sents = [(pi, si, s) for pi, p in enumerate(paras) for si, s in enumerate(sentences(p))]
    verse_pi = len(paras) - 1 if is_verse(paras[-1]) else None
    sents = [x for x in sents if x[0] != verse_pi]
    stoks = {(pi, si): toks(s) for pi, si, s in sents}
    stext = {(pi, si): s for pi, si, s in sents}
    dates = [d for d in find_dates(paras, meta['date']) if d['pi'] != verse_pi]
    result, report = {}, []
    for e in srcs:
        et = toks(e['title'])
        ents = set(e.get('people', []) or []) | set(e.get('places', []) or []) | set(e.get('wars', []) or [])
        def score(k): return len(et & stoks[k])
        # tier 1: written date
        cands = []
        for d in dates:
            if not (d['lo'] <= e['date'] <= d['hi']): continue
            k = (d['pi'], d['si'])
            para_ents = entities_in(paras[d['pi']])
            corro = []
            shared = ents & (entities_in(stext[k]) | para_ents)
            if shared: corro.append('names ' + ', '.join(sorted(shared)))
            if score(k) >= 2: corro.append(f"{score(k)} words of the record in the sentence")
            need = 1 if d['level'] == 'day' else 2
            if len(corro) >= need or (d['level'] == 'month' and score(k) >= 3):
                cands.append((d, k, corro))
        if cands:
            # month-level: must be the only source event fitting that mention with the same strength
            best = max(cands, key=lambda c: (c[0]['level'] == 'day', score(c[1])))
            d, k, corro = best
            if d['level'] == 'month':
                rivals = [o for o in srcs if o is not e and d['lo'] <= o['date'] <= d['hi'] and len(toks(o['title']) & stoks[k]) >= score(k)]
                if rivals:
                    report.append((e['id'], 'DRAWN ON', f"month {d['label']} also fits {rivals[0]['id']}")); continue
            basis = f"date: “{d['text']}” read as {d['label']} AH = {fmt_w(d['lo'])}" if d['level'] == 'day' and d['cal'] != 'w' else \
                    (f"date: “{d['text']}” = {d['label']}" if d['cal'] == 'w' else f"month: “{d['text']}” read as {d['label']} AH ({fmt_w(d['lo'])} – {fmt_w(d['hi'])})")
            if d['cal'] == 'same': basis = f"date: “{d['text']}”, after {d['label']}, = {fmt_w(d['lo'])}"
            result[e['id']] = dict(p=k[0], s=k[1], tier='date', basis=basis + '; checked by ' + ' and '.join(corro),
                                   how=d.get('how', ''))
            report.append((e['id'], f"¶{k[0]+1}.{k[1]+1} by date", result[e['id']]['basis'])); continue
        # tier 2: unambiguous wording
        ranked = sorted(((score(k), k) for k in stoks), reverse=True)
        if ranked and ranked[0][0] >= 4 and (len(ranked) < 2 or ranked[1][0] <= ranked[0][0] // 2):
            sc, k = ranked[0]
            shared = sorted(et & stoks[k])
            result[e['id']] = dict(p=k[0], s=k[1], tier='wording',
                                   basis=f"wording: {sc} words shared with the record ({', '.join(shared[:6])}), "
                                         f"next best sentence {ranked[1][0] if len(ranked)>1 else 0}")
            report.append((e['id'], f"¶{k[0]+1}.{k[1]+1} by wording", result[e['id']]['basis'])); continue
        why = 'no written date fits and no sentence clearly matches' if not ranked or ranked[0][0] < 4 else \
              f"best sentence shares {ranked[0][0]} words but the runner-up shares {ranked[1][0]}"
        report.append((e['id'], 'DRAWN ON', why))
    return result, report

def is_verse(p): return p.startswith('*') and p.endswith('*') and p.count('*') == 2

# ---------- glosses ----------
def plain_place(p):
    return ' '.join(w if w in ('de', 'la', 'del') else w.capitalize() for w in p['key'].split('_'))

def checkpoint_at(iso):
    prev = [c for c in checkpoints if c['date'] <= iso]; nxt = [c for c in checkpoints if c['date'] > iso]
    return (prev[-1] if prev else None), (nxt[0] if nxt else None)

def age(born, iso):
    if not born: return None
    b = date(*map(int, born.split('-'))); d = date(*map(int, iso.split('-')))
    return d.year - b.year - ((d.month, d.day) < (b.month, b.day))

def entry_title(f): return ALL[f][0]['title']

def person_gloss(pid, iso, f, cutoff=None):
    cutoff = cutoff or iso
    p = people.get(pid)
    if not p: return None
    g = dict(id=pid, name=p['name'], ar=p.get('nameArabic'), dyn=p.get('dynasty'), lines=[])
    a = age(p.get('born'), iso)
    if p.get('died') and p['died'] <= iso:
        g['lines'].append(f"died {fmt_w(p['died'])}")
    elif a is not None and a >= 0:
        g['age'] = a
    kin = []
    for rel in ('father', 'mother'):
        if p.get(rel) and p[rel] in people: kin.append(f"{'son' if not p.get('female') else 'daughter'} of {people[p[rel]]['name']}" if rel == 'father' else f"mother {people[p[rel]]['name']}")
    if kin: g['kin'] = '; '.join(kin)
    cp, _ = checkpoint_at(cutoff)
    if cp:
        st = []
        if cp.get('ruler') == pid: st.append('the ruler')
        if cp.get('heir') == pid: st.append('the heir')
        if cp.get('regent') == pid: st.append('the regent')
        for c in cp.get('cabinet') or []:
            if c.get('person') == pid: st.append(f"in the dīwān: {c['role'].lower()}")
        if st: g['standing'] = f"{', '.join(st)} (reckoning of {fmt_w(cp['date'])})"
    # dated record before this page (spoiler-safe)
    before = [e for e in events.values() if pid in (e.get('people') or []) and e['date'] < cutoff
              and e['type'] in ('appointment', 'marriage', 'ruler_change', 'birth', 'battle', 'reform', 'death')]
    before.sort(key=lambda e: e['date'])
    g['before'] = [dict(d=fmt_w(e['date']), t=short(e['title'])) for e in before[-2:]]
    fs = first_seen.get(('p', pid))
    if fs and order.index(fs) > order.index(f): fs = f
    g['first'] = 'first appears here' if fs == f else (f"first met in “{entry_title(fs)}” ({ALL[fs][0]['date'][:4]})" if fs else None)
    return g

def short(t, n=110):
    t = re.sub(r'\s+', ' ', t)
    return t if len(t) <= n else t[:n].rsplit(' ', 1)[0] + '…'

def place_gloss(lid, iso, f):
    p = places.get(lid)
    if not p: return None
    held = None
    for h in p.get('held', []):
        if h['from'] <= iso and (h['to'] is None or h['to'] > iso): held = h['from']
    fs = first_seen.get(('l', lid))
    if fs and order.index(fs) > order.index(f): fs = f
    return dict(id=lid, name=p['name'], plain=plain_place(p), ar=p.get('nameArabic'),
                held=(f"in the realm since {fmt_w(held)}" if held else 'not held by the crown on this date'),
                first='first appears here' if fs == f else (f"first met in “{entry_title(fs)}” ({ALL[fs][0]['date'][:4]})" if fs else None))

# Proposed campaign glossary (NOT in brief2 data; written for the mockup, marked as such in the page)
GLOSSARY = {
    'umarāʾ': 'the nobility', 'ʿulamāʾ': 'the religious scholars (the clergy estate)', 'dīwān': 'the royal council',
    'Jamāʿa': 'the assembly of the estates', 'ṭāʾifas': 'vassal kingdoms under the crown', 'ṭāʾifa': 'a vassal kingdom under the crown',
    'Istirdād': 'the reconquest (lit. recovery) of al-Andalus', 'mutaṭawwiʿa': 'volunteer fighters for the faith',
}

PROV = [
    (lambda s: 'screen' in s.lower() and not s.lower().startswith(('save', 'autosave', 'checkpoint')), 'screen', 'seen on Trent\'s screen (a screenshot), not read from a save'),
    (lambda s: s.lower().startswith(('save', 'autosave', 'checkpoint')), 'save', 'read from a save'),
    (lambda s: 'estimat' in s.lower(), 'est', 'estimated'),
    (lambda s: "trent's account" in s.lower(), 'told', 'Trent\'s account of play, not yet confirmed by a save'),
]
def prov(src):
    for test, k, label in PROV:
        if test(src): return k, label
    return 'save', 'read from a save'

def figures(e):
    d = e.get('data') or {}
    out = []
    if e['type'] == 'battle':
        ours = d.get('oursTotal', d.get('ours')); theirs = d.get('theirsTotal', d.get('theirs'))
        ol = d.get('oursLost', d.get('ourLosses')); tl = d.get('theirsLost', d.get('theirLosses'))
        if isinstance(ours, (int, float)) and isinstance(theirs, (int, float)):
            out.append(['ours / theirs', f"{int(ours):,} / {int(theirs):,}"])
        if isinstance(ol, (int, float)) and isinstance(tl, (int, float)):
            out.append(['lost', f"{int(ol):,} / {int(tl):,}"])
        if d.get('result'): out.append(['result', d['result']])
        if d.get('naval'): out.append(['', 'at sea'])
    else:
        for k in ('result', 'outcome', 'choice', 'effect', 'trait'):
            if isinstance(d.get(k), str): out.append([k, short(d[k], 70)])
    return out[:4]

def record_gloss(e, a):
    k, label = prov(e.get('source', ''))
    hy, hm, hd = west_to_hijri(e['date'])
    return dict(id=e['id'], date=fmt_w(e['date']), hdate=hijri_str(hy, hm, hd), type=e['type'].replace('_', ' '),
                title=e['title'], fig=figures(e), prov=k, provLabel=label, source=e.get('source', ''),
                p=a['p'] if a else None, s=a['s'] if a else None, tier=a['tier'] if a else None,
                basis=a['basis'] if a else None)

def figs_of(cp):
    eco = cp.get('economy') or {}
    return dict(reckoned=fmt_w(cp['date']), ruler=people.get(cp['ruler'], {}).get('name'), towns=cp.get('locations'),
                souls=(cp.get('population') or {}).get('total'), treasury=eco.get('treasury'), income=eco.get('income'),
                expenses=eco.get('expenses'), stability=cp.get('stability'), wars=len(cp.get('wars') or []),
                subjects=len(cp.get('subjects') or []))

def running_head(iso, open_iso=None):
    open_iso = open_iso or iso
    cp, nx = checkpoint_at(open_iso)
    hy, hm, hd = west_to_hijri(iso)
    rh = dict(hdate=hijri_str(hy, hm, hd), wdate=fmt_w(iso))
    if not cp: return rh
    ruler = people.get(cp['ruler'], {})
    rstart = next((r['from'] for r in ruler.get('reigns', []) if r['from'] <= iso and (r['to'] is None or r['to'] >= iso)), None)
    pop = (cp.get('population') or {}).get('total')
    eco = cp.get('economy') or {}
    rh.update(ruler=ruler.get('name'), regnal=(age(rstart, iso) + 1 if rstart else None), rank=cp.get('rank'),
              capital=places.get(cp.get('capital'), {}).get('name'), towns=cp.get('locations'), souls=pop,
              treasury=eco.get('treasury'), income=eco.get('income'), expenses=eco.get('expenses'), debt=eco.get('debt'),
              stability=cp.get('stability'), wars=len(cp.get('wars') or []),
              reckoned=fmt_w(cp['date']), reckonedISO=cp['date'], ago=days_between(cp['date'], open_iso), opens=fmt_w(open_iso),
              next=fmt_w(nx['date']) if nx else None, nextISO=nx['date'] if nx else None,
              gap=days_between(cp['date'], nx['date']) if nx else None)
    cpc, _ = checkpoint_at(iso)
    if cpc and cpc['date'] != cp['date']:
        rh['open'] = figs_of(cp); rh['close'] = figs_of(cpc)
    rh['ticks'] = [c['date'] for c in checkpoints if abs(int(c['date'][:4]) - int(iso[:4])) <= 12]
    return rh

# ---------- render paragraph text into spans ----------
def render(paras, meta, f, anchors, rec_by_sentence):
    iso = meta['date']
    cutoff = min([events[x]['date'] for x in meta.get('sources', []) if x in events] + [iso])
    seen_p, seen_l, seen_c, seen_g = set(), set(), set(), set()
    out = []
    names = {}
    cnames = [(c['nameChronicle'], c['name']) for c in countries if c.get('nameChronicle') and not c['nameChronicle'].startswith('the ')
              and c['nameChronicle'] != c['name'] and c['tag'] != 'GRA']
    plnames = [(p['name'], p) for p in places.values()]
    verse_pi = len(paras) - 1 if is_verse(paras[-1]) else None
    for pi, p in enumerate(paras):
        if pi == verse_pi: continue
        sents = sentences(p); html_s = []
        for si, s in enumerate(sents):
            h = s
            h = re.sub(r'&', '&amp;', h)
            def link(mt):
                txt, kind, id_ = mt.group(1), mt.group(2), mt.group(3)
                if kind == 'person':
                    first = id_ not in seen_p; seen_p.add(id_)
                    if first and id_ in people: names[f'p:{id_}'] = dict(kind='person', p=pi, **person_gloss(id_, iso, f, cutoff))
                    return f'<span class="nm{" first" if first else ""}" data-g="p:{id_}">{txt}</span>'
                if kind == 'place':
                    first = id_ not in seen_l; seen_l.add(id_)
                    pg = place_gloss(id_, iso, f)
                    if first and pg: names[f'l:{id_}'] = dict(kind='place', p=pi, **pg)
                    plain = pg['plain'] if pg else txt
                    return f'<span class="nm pl{" first" if first else ""}" data-g="l:{id_}" data-court="{txt}" data-plain="{plain}">{txt}</span>'
                if kind == 'war':
                    w = wars.get(id_, {})
                    return f'<span class="war" title="{w.get("name", "")}">{txt}</span>'
                return txt
            # protect links, then gloss unlinked court names at first mention
            links = []
            def stash(mt): links.append(link(mt)); return f'\x00{len(links)-1}\x00'
            h = re.sub(r'\[([^\]]+)\]\((person|place|war):([a-z0-9\-]+)\)', stash, h)
            for court, plain in cnames:
                def crep(mt, court=court, plain=plain):
                    first = court not in seen_c; seen_c.add(court)
                    if first: names[f'c:{court}'] = dict(kind='country', p=pi, name=court, plain=plain)
                    return f'<span class="nm pl cn{" first" if first else ""}" data-g="c:{court}" data-court="{court}" data-plain="{plain}">{court}</span>'
                h = re.sub(r'(?<![\w])' + re.escape(court) + r'(?![\w])', crep, h)
            for pname, pl in plnames:
                if f'l:{pl["id"]}' in names or pl['id'] in seen_l: continue
                def prep(mt, pl=pl):
                    first = pl['id'] not in seen_l; seen_l.add(pl['id'])
                    pg = place_gloss(pl['id'], iso, f)
                    if first: names[f'l:{pl["id"]}'] = dict(kind='place', p=pi, unlinked=True, **pg)
                    return f'<span class="nm pl{" first" if first else ""}" data-g="l:{pl["id"]}" data-court="{pl["name"]}" data-plain="{pg["plain"]}">{pl["name"]}</span>'
                h = re.sub(r'(?<![\w\x00])' + re.escape(pname) + r'(?![\w])', prep, h, count=1)
            for term, gl in sorted(GLOSSARY.items(), key=lambda x: -len(x[0])):
                if term in seen_g: continue
                def grep_(mt, term=term, gl=gl):
                    seen_g.add(term); names[f'g:{term}'] = dict(kind='term', p=pi, name=term, plain=gl, proposed=True)
                    return f'<span class="nm tm first" data-g="g:{term}">{mt.group(0)}</span>'
                h = re.sub(r'(?<![\w\*])\*?' + re.escape(term) + r'\*?(?![\w])', grep_, h, count=1)
            h = re.sub(r'\x00(\d+)\x00', lambda mt: links[int(mt.group(1))], h)
            h = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', h)
            h = re.sub(r'\*([^*]+)\*', r'<i>\1</i>', h)
            recs = rec_by_sentence.get((pi, si), [])
            mark = ''.join(f'<sup class="rm" data-r="{r}">{n}</sup>' for r, n in recs)
            cls = ' anchored' if recs else ''
            html_s.append(f'<span class="s{cls}" data-s="{pi}.{si}">{h}</span>{mark}')
        out.append(' '.join(html_s))
    verse = paras[verse_pi].strip('*') if verse_pi is not None else None
    return out, names, verse

folios = []
REPORT = []
for f in WANT:
    meta, paras = ALL[f]
    anchors, report = anchor(meta, paras)
    REPORT.append((f, report))
    srcs = [events[s] for s in meta.get('sources', []) if s in events]
    whys = {r[0]: r[2] for r in report if r[1] == 'DRAWN ON'}
    recs = [record_gloss(e, anchors.get(e['id'])) for e in srcs]
    for r in recs:
        if r['id'] in whys: r['why'] = whys[r['id']]
    anchored = sorted([r for r in recs if r['p'] is not None], key=lambda r: (r['p'], r['s'], r['id']))
    for i, r in enumerate(anchored): r['n'] = i + 1
    rbs = {}
    for r in anchored: rbs.setdefault((r['p'], r['s']), []).append((r['id'], r['n']))
    html, names, verse = render(paras, meta, f, anchors, rbs)
    book = books.get(meta['era'], {})
    folios.append(dict(file=f, title=meta['title'], date=meta['date'], book=dict(id=book.get('id'), title=book.get('title'), ar=book.get('titleArabic')),
                       paras=html, names=names, records=anchored, drawn=[r for r in recs if r['p'] is None],
                       verse=verse, head=running_head(meta['date'], min([e['date'] for e in srcs] + [meta['date']])), cutoff=fmt_w(min([e['date'] for e in srcs] + [meta['date']])),
                       counts=dict(people=len(meta.get('people', [])), places=len(meta.get('places', [])), sources=len(srcs))))
json.dump(folios, open(OUT, 'w'), ensure_ascii=False)
for f, rep in REPORT:
    print('==', f)
    for r in rep: print('  ', r[1].ljust(22), r[0], '|', r[2])
