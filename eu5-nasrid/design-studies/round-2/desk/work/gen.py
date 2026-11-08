import json, re, sys, html, collections
sys.path.insert(0, './work')
from parse import entries
from threads import THREADS, VERSE_REFS, SURA_NAMES

B = '../brief2'
E = entries(B)
EBY = {e['file']: e for e in E}
ORDER = {e['file']: i for i, e in enumerate(sorted(E, key=lambda e: (e['date'], e['file'])))}
people = {p['id']: p for p in json.load(open(B + '/data/people.json'))}
events = json.load(open(B + '/data/events.json'))
books = {b['id']: b for b in json.load(open(B + '/data/books.json'))}
cps = {c['date']: c for c in json.load(open(B + '/data/checkpoints.json'))}
rr = {r['checkpoint']: r for r in json.load(open(B + '/data/realm-readings.json'))}
rnames = json.load(open(B + '/data/realm-names.json'))

HM = ["Muḥarram", "Ṣafar", "Rabīʿ al-Awwal", "Rabīʿ al-Thānī", "Jumādā al-Ūlā", "Jumādā al-Ākhira", "Rajab", "Shaʿbān",
      "Ramaḍān", "Shawwāl", "Dhū al-Qaʿda", "Dhū al-Ḥijja"]
WM = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
def hijri(f): y, m, d = f[:10].split('-'); return f"{int(d)} {HM[int(m)-1]} {int(y)}"
def west(d): y, m, dd = d.split('-'); return f"{int(dd)} {WM[int(m)-1]} {int(y)}"

def plain(s): return re.sub(r'\*([^*]+)\*', r'\1', re.sub(r'\[([^\]]+)\]\((?:person|place|war):[^)]+\)', r'\1', s))
def mdhtml(s):
    s = html.escape(s, quote=False)
    s = re.sub(r'\[([^\]]+)\]\((person|place|war):([^)]+)\)', r'\1', s)
    return re.sub(r'\*([^*]+)\*', r'<em>\1</em>', s)

FRONTIER = max(e['date'] for e in E)
FRONTIER_FILE = max(E, key=lambda e: e['date'])['file']
LAST_CP = max(cps)
S_FROM = '1438-01-16'          # previous save: the session boundary is reconstructed (no session log in the folder)

def age(b, at=FRONTIER):
    if not b: return None
    y = int(at[:4]) - int(b[:4])
    return y - 1 if at[5:] < b[5:] else y

def einfo(e):
    return {"file": e['file'], "title": e['title'], "date": e['date'], "west": west(e['date']), "hijri": hijri(e['file']),
            "book": books[e['era']]['title'], "words": e['words']}

# ---------- threads ----------
problems = []
threads = []
for t in THREADS:
    ks = []
    for f, role, q in t['knots']:
        e = EBY[f]
        paras = [p for p in e['body'].split('\n\n') if p.strip()]
        hit = None
        for p in paras:
            if q in plain(p):
                pp = html.escape(plain(p), quote=False); qq = html.escape(q, quote=False)
                hit = pp.replace(qq, f'<mark>{qq}</mark>', 1); break
        if hit is None: problems.append((t['id'], f, q[:60]))
        ks.append({**einfo(e), "role": role, "quote": q, "para": hit})
    last = ks[-1]
    threads.append({k: v for k, v in t.items() if k != 'knots'} | {
        "knots": ks, "opened": ks[0]['date'], "lastTouched": last['date'],
        "entriesSince": sum(1 for e in E if e['date'] > last['date']),
        "yearsSince": int(FRONTIER[:4]) - int(last['date'][:4]),
        "span": int(last['date'][:4]) - int(ks[0]['date'][:4])})
if problems: print('QUOTE PROBLEMS', problems); sys.exit(1)

# knot index per entry (for the margin)
knots_by_entry = collections.defaultdict(list)
for t in threads:
    for i, k in enumerate(t['knots']):
        knots_by_entry[k['file']].append({"thread": t['id'], "i": i, "role": k['role'], "quote": k['quote']})

# ---------- mentions ----------
first, last, count = {}, {}, collections.Counter()
for e in sorted(E, key=lambda e: (e['date'], e['file'])):
    for i in set(e.get('people', [])) | set(e['linked']):
        count[i] += 1; first.setdefault(i, e); last[i] = e

# ---------- session (reconstructed) ----------
sess_entries = sorted([e for e in E if e['date'] > S_FROM], key=lambda e: (e['date'], e['file']))
sess_files = {e['file'] for e in sess_entries}
new_people = [i for i, e in first.items() if e['file'] in sess_files]
gone = [i for i, p in people.items() if p.get('died') and S_FROM < p['died'] <= FRONTIER]
a, b = cps[S_FROM], cps[LAST_CP]
est = lambda c: {x['id']: x for x in c['estates']}
ea, eb = est(a), est(b)
estates = [{"name": eb[k]['name'], "from": ea[k]['satisfaction'], "to": eb[k]['satisfaction']} for k in ['nobles', 'clergy', 'burghers', 'peasants', 'dhimmi']]
ra, rb = rr[S_FROM], rr[LAST_CP]
vital = [
    {"label": "Towns of the crown", "from": a['locations'], "to": b['locations']},
    {"label": "Subjects of the crown", "from": a['population']['total'], "to": b['population']['total']},
    {"label": "Stability", "from": a['stability'], "to": b['stability']},
    {"label": "Legitimacy", "from": ra['legitimacy'], "to": rb['legitimacy']},
    {"label": "Prestige", "from": a['prestige'], "to": b['prestige']},
    {"label": "Treasury (dīnārs)", "from": a['economy']['treasury'], "to": b['economy']['treasury']},
    {"label": "Income a month", "from": a['economy']['income'], "to": b['economy']['income']},
    {"label": "Land ↔ sea (+ is sea)", "from": ra['societalValues']['land_vs_naval'], "to": rb['societalValues']['land_vs_naval']},
]
priv_add = [rnames.get(x, x) for x in rb['privileges'] if x not in ra['privileges']]
priv_del = [rnames.get(x, x) for x in ra['privileges'] if x not in rb['privileges']]
sess_events = [ev for ev in events if S_FROM < ev['date'] <= FRONTIER]
prov = collections.Counter('save' if 'save' in ev['source'].lower() else 'account' for ev in sess_events)
sess_threads = {"opened": [], "advanced": [], "tied": []}
for t in threads:
    for k in t['knots']:
        if k['file'] in sess_files:
            key = {"open": "opened", "knot": "advanced", "tie": "tied", "echo": "advanced"}[k['role']]
            if t['id'] not in sess_threads[key]: sess_threads[key].append(t['id'])
sess_threads["advanced"] = [x for x in sess_threads["advanced"] if x not in sess_threads["opened"]]
session = {
    "label": "The session of 1438–1443", "number": None,
    "fromWest": west(S_FROM), "fromHijri": hijri("0841-07-19"), "toWest": west(FRONTIER), "toHijri": hijri(FRONTIER_FILE),
    "entries": [einfo(e) | {"people": len(set(e.get('people', [])))} for e in sess_entries],
    "words": sum(e['words'] for e in sess_entries),
    "checkpoints": [{"date": LAST_CP, "west": west(LAST_CP), "name": b['checkpoint'], "save": b['source']['save']}],
    "prevCheckpoint": {"date": S_FROM, "west": west(S_FROM), "name": a['checkpoint']},
    "newPeople": [{"id": i, "name": people[i]['name'] if i in people else i, "role": (people.get(i, {}).get('roles') or [''])[0],
                   "age": age(people.get(i, {}).get('born')), "entry": first[i]['title']} for i in new_people],
    "gone": [{"id": i, "name": people[i]['name'], "died": people[i]['died']} for i in gone],
    "lastLoss": {"name": "Bernarda of Mursiyya", "died": west("1437-11-06"), "where": "told in the previous session (Of the Admiral Prince)"},
    "vital": vital, "estates": estates, "privAdd": priv_add, "privDel": priv_del,
    "provenance": {"events": len(sess_events), "save": prov['save'], "account": prov['account']},
    "threads": sess_threads,
    "recap": ("In the years after the admiral prince put to sea, the Emperor Muḥammad gave Majrīṭ its charter and took the umarāʾ's "
              "land rights as its price. At fifty-three he became a scholar, and he raised the Radiant City again above Qurṭuba. He fought "
              "Genoa and the English with ledgers. Then, without a word to his sons, he seated the burghers in the Jamāʿa beside the "
              "lords, and the princes mended what they could. He proclaimed the Golden Century and an empire of the sea, and the new "
              "Jamāʿa, lords and merchants together, asked for Fernando Po."),
}

# ---------- court ----------
cab = {c['person']: c['role'] for c in b['cabinet']}
ABROAD = {'yahya-marinid', 'ahmad-ottoman', 'pope-fabrizio-ricci', 'tiramakhan-mali', 'edward-v-of-england', 'philippe-vii-of-france',
          'fernando-son-of-pedro', 'juan-son-of-fernando', 'diego-villamarin', 'alfonso-gaston', 'jose-fernando-tunon', 'fatiu-ghana',
          'eduardo-de-avellaneda'}
court = []
for i, p in people.items():
    if p.get('died'): continue
    ag = age(p.get('born')); le = last.get(i)
    office = []
    if i in cab: office.append(f"in the dīwān: {cab[i].lower()}")
    office += [r for r in p.get('roles', []) if not re.search(r'\((?:\d{4})[–-]\d{4}\)', r)]
    unburied = (ag is not None and ag >= 85) or (ag is None and (not le or le['date'] < '1400'))
    grp = 'unburied' if unburied else 'house' if p.get('dynasty') == 'Naṣrid' else 'abroad' if i in ABROAD else 'court'
    court.append({"id": i, "name": p['name'], "arabic": p.get('nameArabic'), "age": ag, "born": p.get('born'), "female": p.get('female', False),
                  "group": grp, "office": office[:3], "mentions": count[i],
                  "last": einfo(le) if le else None, "yearsSince": int(FRONTIER[:4]) - int(le['date'][:4]) if le else None,
                  "entriesSince": sum(1 for e in E if le and e['date'] > le['date']) if le else None,
                  "note": (p.get('note') or '')[:260]})
unrolled = [{"name": re.search(r'(?:daughter|son), ([^,]+), is born', ev['title']).group(1), "title": ev['title'], "born": ev['date'],
             "age": age(ev['date'])} for ev in events if ev['type'] == 'birth' and ev['date'] >= '1430' ]
dead_in_cabinet = [{"id": i, "name": people[i]['name'], "died": people[i]['died'], "role": r} for i, r in cab.items()
                   if people.get(i, {}).get('died') and people[i]['died'] < LAST_CP]

# ---------- verses ----------
THEMES = [("the sea", r"\bship|\bsea|winds|two seas"), ("death", r"death|perish|\bdie\b|return\b|soul"),
          ("war and victory", r"victory|fight|conquest|defeated|overc|company|Badr|steeds|kill|threw|stand firm|row|expelled"),
          ("sovereignty", r"sovereignty|dominion|successors|inherited|leaders|predominant|condition of a people"),
          ("knowledge", r"knowledge|pen\b|Read\b|wisdom|who know"), ("kin and marriage", r"mates|children|offspring|descendants|wives"),
          ("trial and patience", r"hardship|test|patience|despair|weak|dislike|hate a thing|register|alternate|wound"),
          ("justice and trade", r"measure|wealth|usury|trusts|judge|consult|give less|security"),
          ("peace and brotherhood", r"peace|settlement|brothers|compulsion|allies|factions|believed")]
def theme(t):
    for name, rx in THEMES:
        if re.search(rx, t, re.I): return name
    return "signs and providence"
def refkey(f):
    best = max((k for k in VERSE_REFS if f.startswith(k)), key=len, default=None)
    return VERSE_REFS.get(best)
def ayat(ref):
    s, a = ref.split(':'); a0, a1 = (a.split('-') + [a])[:2]
    return int(s), set(range(int(a0), int(a1) + 1))
verses = []
noverse = []
for e in sorted(E, key=lambda e: (e['date'], e['file'])):
    v, pos = e['verse'], 'closes'
    if v and len(v.split()) < 4: v = None
    if not v and e['file'].startswith('0747-07-01-the-summons'):
        v = re.search(r'^\*([^*]+)\*', e['body']).group(1); pos = 'opens'
    if not v: noverse.append(einfo(e)); continue
    ref = refkey(e['file'])
    s, ay = ayat(ref)
    verses.append({**einfo(e), "text": v, "ref": ref, "sura": s, "suraName": SURA_NAMES.get(s, ''), "ayat": sorted(ay),
                   "pos": pos, "theme": theme(v)})
repeats = []
for i, x in enumerate(verses):
    for y in verses[i+1:]:
        if x['sura'] == y['sura'] and set(x['ayat']) & set(y['ayat']):
            same = x['text'].strip('. ').lower() == y['text'].strip('. ').lower()
            repeats.append({"ref": x['ref'] if x['ref'] == y['ref'] else f"{x['ref']} / {y['ref']}", "a": x['file'], "b": y['file'],
                            "aTitle": x['title'], "bTitle": y['title'], "aText": x['text'], "bText": y['text'],
                            "aDate": x['date'], "bDate": y['date'], "kind": "word for word" if same else "same āya, different words"})
inbody = [{"file": "0738-01-02-the-marinid-war-upon-castile", "text": "Every soul shall taste death", "ref": "3:185 (also 21:35, 29:57)",
           "note": "Quoted in the body of the first entry. 3:185 later closes Of the Death of al-Ḥājj Yūsuf (1363)."},
          {"file": "0772-08-07-the-moneylenders-of-ishbiliya", "text": "Allāh has permitted trade and forbidden usury.", "ref": "2:275",
           "note": "Recited by the qāḍī in the body of the entry."}]

# ---------- awaiting the save / flags ----------
awaiting = [{"what": ev['title'], "date": ev['date'], "west": west(ev['date']), "source": ev['source'], "check": c}
            for ev, c in [(next(x for x in events if x['id'] == '1442-08-07-the-golden-century'), "The Golden Century situation is active."),
                          (next(x for x in events if x['id'] == '1442-08-07-establish-a-thalassocracy'), "The Thalassocracy reform is present, with 20 years left on its ship-cost bonus."),
                          (next(x for x in events if x['id'] == '1443-06-26-the-jamaa-of-847'), "The Jamāʿa of 847's result is recorded, with Fernando Po as a target.")]]
older = [{"what": "Short of supply, the Volunteers of the Faith fall back from Uryūla", "date": "1339-11-08",
          "flag": "Marked “exact date to come from the next save” in 1339. Never settled: the oldest open fact in the record."},
         {"what": "Zineb bint Faraj, born in Ghana", "date": None,
          "flag": "Her person record says “the birth date isn't recorded yet”. She has never appeared in the chronicle."}]

data = {"frontier": {"date": FRONTIER, "west": west(FRONTIER), "hijri": hijri(FRONTIER_FILE), "lastSave": west(LAST_CP), "lastSaveDate": LAST_CP,
                     "entries": len(E), "words": sum(e['words'] for e in E)},
        "session": session, "threads": threads, "knotsByEntry": knots_by_entry,
        "court": court, "unrolled": unrolled, "deadInCabinet": dead_in_cabinet,
        "verses": verses, "repeats": repeats, "noVerse": noverse, "inBody": inbody,
        "awaiting": awaiting, "older": older}

# demo entry for the margin
DEMO = '0833-10-23-of-the-war-of-shant-yaqub-and-the-shrine-of-the-apostle'
de = EBY[DEMO]
paras = []
for p in [p for p in de['body'].split('\n\n') if p.strip()]:
    h = mdhtml(p); ks = []
    for k in knots_by_entry[DEMO]:
        qq = html.escape(k['quote'], quote=False)
        if qq in h:
            h = h.replace(qq, f'<span class="kq" data-t="{k["thread"]}">{qq}</span>', 1); ks.append(k)
        elif k['quote'] in plain(p):
            ks.append(k)
    paras.append({"html": h, "knots": ks})
data["demo"] = einfo(de) | {"paras": paras}
data["entriesIndex"] = {e['file']: einfo(e) for e in E}
data["cabinet"] = list(cab)
data["cabinetDate"] = west(LAST_CP)

del data['entriesIndex']
json.dump(data, open('./work/data.json', 'w'), ensure_ascii=False)
print('threads', len(threads), 'open', sum(t['status'] == 'open' for t in threads), 'verses', len(verses), 'repeats', len(repeats),
      'noverse', len(noverse), 'court', collections.Counter(c['group'] for c in court), 'unrolled', len(unrolled),
      'deadInCabinet', dead_in_cabinet, 'new', [p['name'] for p in session['newPeople']], 'gone', session['gone'], 'prov', session['provenance'],
      'sessthreads', sess_threads, 'privs', priv_add, priv_del)
for r in repeats: print(r['ref'], r['kind'], r['aTitle'][:40], '|', r['bTitle'][:40])
