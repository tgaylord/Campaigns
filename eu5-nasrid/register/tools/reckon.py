#!/usr/bin/env python3
"""One save in, one reckoning out.

usage:
  reckon.py SAVE.eu5 --game GAME            decode, extract, draw the maps, write the reckoning, report
  reckon.py SECTIONS_DIR --game GAME        the same, from a save already split by the decoder
  reckon.py data/extracted/DATE.json        only write the reckoning and the report (no decoding, no maps)

  --game GAME     the game's `game` folder (or set EU5_GAME). Needed for the maps and the world's powers.
  --out DIR       write the reckoning somewhere other than campaign/reckonings (for checking)
  --no-maps       skip the three map files
  --start         a save made on the start date: leave out values the game hasn't settled yet

What it writes, for a save dated DATE:
  ../data/extracted/DATE.json               every fact pulled from the save, kept as the raw record
  ../data/map/world/realms-DATE.json        the outline of every realm        } the three files
  ../data/world/DATE.json                   the powers and who answers to whom } the Register's
  ../data/map/layers/DATE.json              people, faith and tongue by town   } maps are drawn from
  campaign/reckonings/DATE.save.yaml        the numbers half of the reckoning. Never edit it by hand:
                                            run this again, or override a value in DATE.yaml beside it.
  campaign/reports/DATE.md                  what changed since the reckoning before: the draft list of beats

The judgement half (title, summary, beats, tellings, questions) is written by hand in
campaign/reckonings/DATE.yaml. This tool never touches that file.
"""
import argparse, glob, json, os, shutil, subprocess, sys, tempfile
import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
REG = os.path.join(HERE, '..')
CAMP = os.path.join(REG, 'campaign')
SRC = os.path.join(REG, '..')                       # the campaign folder: its extractors and raw data
TOOLS = os.path.join(SRC, 'tools')
DATA = os.path.join(SRC, 'data')
DECODER = os.path.join(SRC, '..', 'shared', 'tools', 'eu5-save-decoder-1.4')

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('save'); ap.add_argument('--game', default=os.environ.get('EU5_GAME'))
ap.add_argument('--out'); ap.add_argument('--no-maps', action='store_true'); ap.add_argument('--start', action='store_true')
a = ap.parse_args()


def run(*cmd):
    print('  ' + next((os.path.basename(c) for c in cmd if c.endswith('.py')), cmd[0]), flush=True)
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)


def iso(d):
    """the save's 1451.12.21 -> 1451-12-21"""
    if not d: return None
    y, m, dd = str(d).split('.')
    return f'{int(y):04d}-{int(m):02d}-{int(dd):02d}'


def Y(p):
    return yaml.safe_load(open(os.path.join(CAMP, p), encoding='utf8'))


# ---------------------------------------------------------------- 1. the facts
tmp = None
if a.save.endswith('.json'):
    extracted, sections = a.save, None
else:
    sections = a.save
    if not os.path.isdir(sections):
        tmp = tempfile.mkdtemp(prefix='reckon-')
        sections = os.path.join(tmp, 'sections')
        if not os.path.exists(os.path.join(DECODER, 'b2t')): subprocess.run(['make', '-C', DECODER], check=True, stdout=subprocess.DEVNULL)
        print('decoding the save'); run(sys.executable, os.path.join(DECODER, 'decode.py'), a.save, sections)
    print('pulling the facts')
    first = os.path.join(tmp or tempfile.mkdtemp(prefix='reckon-'), 'facts.json')
    run(sys.executable, os.path.join(TOOLS, 'extract_checkpoint.py'), sections, first, *(['--no-computed'] if a.start else []))
    date = iso(json.load(open(first))['source']['date'])
    extracted = os.path.join(DATA, 'extracted', f'{date}.json')
    shutil.move(first, extracted)

E = json.load(open(extracted))
date = iso(E['source']['date'])
print(f'the save is dated {date}')

# ---------------------------------------------------------------- 2. the maps
if sections and not a.no_maps:
    if not a.game: sys.exit('the maps need the game folder: pass --game GAME or set EU5_GAME (or pass --no-maps)')
    print('drawing the maps')
    camp = Y('campaign.yaml')
    x0, y0 = camp['map'].get('origin', [5900, 1100])
    run(sys.executable, os.path.join(TOOLS, 'map_layers.py'), sections, date)
    run(sys.executable, os.path.join(TOOLS, 'world_powers.py'), sections, date, '--game', a.game)
    scratch = os.path.join(tempfile.mkdtemp(prefix='reckon-'), 'world.json')
    run(sys.executable, os.path.join(TOOLS, 'build_map.py'), os.path.join(a.game, 'in_game', 'map_data'), scratch,
        '--frame', f'{x0},{y0},10500,5000', '--eps', '2.5', '--realm-eps', '4', '--lite', '--owners', extracted,
        '--realms-dir', os.path.join(DATA, 'map', 'world'))
if tmp: shutil.rmtree(tmp, ignore_errors=True)

# ---------------------------------------------------------------- 3. the reckoning
camp = Y('campaign.yaml')
S = camp.get('save') or {}
TAG = S.get('tag', E['source']['tag'])
cast = {os.path.basename(f)[:-5]: yaml.safe_load(open(f, encoding='utf8')) for f in glob.glob(os.path.join(CAMP, 'cast', '*.yaml'))}
by_game = {str(p['game']['id']): k for k, p in cast.items() if isinstance(p.get('game'), dict) and p['game'].get('id') is not None}
places = {p.get('game'): p['id'] for p in Y('places.yaml') if p.get('game')}
threads = Y('threads.yaml')
tagfile = os.path.join(REG, camp['map']['names']) if camp.get('map', {}).get('names') else None
tagnames = json.load(open(tagfile)) if tagfile and os.path.exists(tagfile) else {}
alias_of = {}
for name, t in (camp.get('map', {}).get('aliases') or {}).items(): alias_of.setdefault(t, name)
todo = []   # things only a person can settle; they go at the top of the report


def tagname(t):
    n = (S.get('names') or {}).get(t) or alias_of.get(t) or (tagnames.get(t) or {}).get('name') or t
    if n == t and t not in (S.get('names') or {}): todo.append(f'The tag `{t}` has no name. Add it under `save.names` in campaign.yaml.')
    return n


def who(gid, role):
    if gid in (None, '', 'none'): return None
    k = by_game.get(str(gid))
    if not k:
        c = next((c for c in E['court'] if str(c['id']) == str(gid)), None)
        todo.append(f'The {role} is character {gid}' + (f' ({c["first_name"]}, born {iso(c["born"])}, {c.get("dynasty")})' if c else '') + ', who is not in the cast. Add a cast file with `game: { id: ' + str(gid) + ' }`.')
    return k


C = E.get('computed') or {}
cur, eco = C.get('currency') or {}, C.get('economy') or {}
num = lambda v, nd=1: None if v in (None, '') else (round(float(v)) if nd == 0 else round(float(v), nd))
prune = lambda d: {k: v for k, v in d.items() if v not in (None, [], {}, '')}
word = lambda k: (S.get('words') or {}).get(k) or k[:1].upper() + k[1:]
top = lambda d, n: {word(k): round(v * 1000) for k, v in sorted((d or {}).items(), key=lambda kv: -kv[1])[:n]}

country, realm = E['country'], E['realm']
allies = sorted({t['second'] if t['first'] == TAG else t['first'] for t in E.get('treaties', []) if 'alliance' in (t.get('objects') or []) and TAG in (t['first'], t['second'])},
                key=lambda t: tagname(t))
wars = []
for w in E.get('wars', []):
    if w.get('ended'): continue
    th = next((t for t in threads if t.get('kind') == 'war' and t.get('from') == iso(w['start'])), None)
    if th: wars.append(th['id'])
    else: todo.append(f'A war begun on {iso(w["start"])} ({w.get("casus_belli")}) has no thread. Add one to threads.yaml with `kind: war` and `from: {iso(w["start"])}`, then run this again.')
council = []
for c in C.get('cabinet') or []:
    k = who(c.get('character'), 'council member')
    seat = (S.get('seats') or {}).get(c.get('action') or '', None) if c.get('action') else 'Idle'
    if seat is None: seat = c['action'].replace('_', ' ').capitalize(); todo.append(f'The council action `{c["action"]}` has no wording. Add it under `save.seats` in campaign.yaml.')
    if k: council.append({'who': k, 'seat': seat})
capital = places.get(country.get('capital'))
if country.get('capital') and not capital: todo.append(f'The capital `{country["capital"]}` is not in places.yaml (match it with `game: {country["capital"]}`).')
estates = [prune({'name': n, 'mood': None if (C.get('estates') or {}).get(k, {}).get('satisfaction') is None or k == 'crown_estate' else round(float(C['estates'][k]['satisfaction']) * 100)})
           for k, n in (S.get('estates') or {}).items() if k in (C.get('estates') or {})]

R = prune({
    'date': date,
    'source': prune({'save': f'SP_{E["source"].get("game_tag") or TAG}_{date.replace("-", "_")}', 'game': E['source'].get('game_version')}),
    'realm': prune({
        'towns': len(realm['locations']), 'souls': round(realm['population_k'] * 1000),
        'treasury': num(cur.get('gold'), 0), 'income': num(eco.get('income')), 'expenses': num(eco.get('expense')),
        'debt': num(C.get('debt'), 0) or None, 'stability': num(cur.get('stability')), 'prestige': num(cur.get('prestige'), 0),
        'regiments': C.get('regiments'), 'ships': C.get('ships'), 'manpower': None if cur.get('manpower') is None else round(float(cur['manpower']) * 1000)}),
    'court': prune({'ruler': who(country.get('ruler'), 'ruler'), 'heir': who(country.get('heir'), 'heir'), 'regent': who(country.get('regent'), 'regent'),
                    'capital': capital, 'council': council}),
    'standing': prune({'wars': wars, 'allies': [tagname(t) for t in allies],
                       'subjects': [f'{tagname(t)} ({v["type"].replace("_", " ")})' for t, v in (E.get('subjects') or {}).items()], 'estates': estates}),
    'peoples': prune({'cultures': top(realm.get('cultures_k'), 6), 'faiths': top(realm.get('religions_k'), 5)}),
    'map': prune({'ours': [TAG], 'subjects': list((E.get('subjects') or {}).keys()), 'allies': allies}),
})
out_dir = a.out or os.path.join(CAMP, 'reckonings')
os.makedirs(out_dir, exist_ok=True)
dst = os.path.join(out_dir, f'{date}.save.yaml')
with open(dst, 'w', encoding='utf8') as f:
    f.write(f'# Written by tools/reckon.py from the save of {date}. Do not edit: run the tool again,\n# or override a value in {date}.yaml beside this file.\n')
    yaml.safe_dump(R, f, allow_unicode=True, sort_keys=False, width=110)
print(f'wrote {dst if a.out else os.path.relpath(dst, REG)}')

# ---------------------------------------------------------------- 4. what changed
prior = sorted(os.path.basename(f)[:-5] for f in glob.glob(os.path.join(DATA, 'extracted', '*.json')) if os.path.basename(f)[:-5] < date)
L = [f'# What the save of {date} shows', '']
if not prior:
    L += ['There is no earlier save to compare with.']
else:
    pd = prior[-1]
    P = json.load(open(os.path.join(DATA, 'extracted', f'{pd}.json')))
    PC = P.get('computed') or {}
    pcur, peco = PC.get('currency') or {}, PC.get('economy') or {}
    y0, m0, d0 = map(int, pd.split('-')); y1, m1, d1 = map(int, date.split('-'))
    months = max(1, (y1 - y0) * 12 + (m1 - m0))
    L += [f'Compared with the save of {pd}, {months} month{"s" if months != 1 else ""} earlier. Every line is a candidate beat: keep it, merge it or drop it.', '']
    since = lambda d: d is not None and pd < iso(d) <= date
    flags, sec = [], {}
    add = lambda head, line: sec.setdefault(head, []).append(line)
    fnum = lambda v: f'{v:,.0f}' if abs(v) >= 100 else f'{v:,.1f}'.rstrip('0').rstrip('.')
    name_of = lambda gid: (cast.get(by_game.get(str(gid)), {}) or {}).get('name')
    court_of = lambda X: {str(c['id']): c for c in X.get('court', [])}
    cn, cp = court_of(E), court_of(P)
    who_txt = lambda gid: name_of(gid) or ((lambda c: f'{c["first_name"].replace("name_", "").capitalize()} (character {gid}, born {iso(c["born"])}, not in the cast)')(cn.get(str(gid)) or cp.get(str(gid))) if (cn.get(str(gid)) or cp.get(str(gid))) else f'character {gid}')
    place_txt = lambda k: next((p['name'] for p in Y('places.yaml') if p.get('game') == k), k.replace('_', ' ').title())

    # numbers
    f = lambda X, k: None if X.get(k) in (None, '') else float(X[k])
    rows = [('Towns', len(P['realm']['locations']), len(realm['locations'])), ('Souls', P['realm']['population_k'] * 1000, realm['population_k'] * 1000),
            ('Treasury', f(pcur, 'gold'), f(cur, 'gold')), ('Income a month', f(peco, 'income'), f(eco, 'income')), ('Expenses a month', f(peco, 'expense'), f(eco, 'expense')),
            ('Debt', f(PC, 'debt'), f(C, 'debt')), ('Stability', f(pcur, 'stability'), f(cur, 'stability')), ('Prestige', f(pcur, 'prestige'), f(cur, 'prestige')),
            ('Regiments', PC.get('regiments'), C.get('regiments')), ('Ships', PC.get('ships'), C.get('ships')),
            ('Manpower', None if f(pcur, 'manpower') is None else f(pcur, 'manpower') * 1000, None if f(cur, 'manpower') is None else f(cur, 'manpower') * 1000)]
    for n, x, y in rows:
        if x is None or y is None or abs(y - x) < 0.05: continue
        add('The numbers', f'- {n}: {fnum(x)} to {fnum(y)} ({"+" if y > x else "−"}{fnum(abs(y - x))})')
    g0, g1 = f(pcur, 'gold'), f(cur, 'gold')
    if g0 is not None and g1 is not None and f(peco, 'income') is not None and f(eco, 'income') is not None:
        net = ((f(peco, 'income') - (f(peco, 'expense') or 0)) + (f(eco, 'income') - (f(eco, 'expense') or 0))) / 2
        gap = (g1 - g0) - net * months
        if abs(gap) > max(500, 4 * abs(net)):
            flags.append(f'**The treasury moved by {fnum(g1 - g0)} in {months} month{'s' if months != 1 else ''}, but income less expenses would account for about {fnum(net * months)}.** About {fnum(abs(gap))} was {"gained" if gap > 0 else "spent"} some other way. Ask Trent.')
    s0, s1 = f(pcur, 'stability'), f(cur, 'stability')
    if s0 is not None and s1 is not None and abs(s1 - s0) >= 5: flags.append(f'**Stability {"rose" if s1 > s0 else "fell"} from {fnum(s0)} to {fnum(s1)}.** The save does not say why. Ask Trent.')

    # land
    ln, lp = set(realm['locations']), set(P['realm']['locations'])
    for label, ks in (('Gained', ln - lp), ('Lost', lp - ln)):
        if ks:
            by = {}
            for k in sorted(ks): by.setdefault((realm['locations'].get(k) or P['realm']['locations'].get(k) or {}).get('province', '?').replace('_province', '').replace('_', ' ').title(), []).append(place_txt(k))
            add('Land', f'- {label} {len(ks)} town{"s" if len(ks) != 1 else ""}: ' + '; '.join(f'{prov} ({", ".join(v[:6])}{", …" if len(v) > 6 else ""})' for prov, v in by.items()))
    if country.get('capital') != P['country'].get('capital'): add('Land', f'- The capital moved from {place_txt(P["country"].get("capital") or "?")} to {place_txt(country["capital"])}.')
    sn, sp = E.get('subjects') or {}, P.get('subjects') or {}
    for t in sn.keys() - sp.keys(): add('Land', f'- New subject: {tagname(t)} ({sn[t]["type"].replace("_", " ")}, since {iso(sn[t].get("since"))}).')
    for t in sp.keys() - sn.keys(): add('Land', f'- No longer a subject: {tagname(t)}.')
    for t in sn.keys() & sp.keys():
        if sn[t].get('type') != sp[t].get('type'): add('Land', f'- {tagname(t)} changed from {sp[t]["type"]} to {sn[t]["type"]}.')

    # buildings the crown's towns hold
    kept = ln & lp
    def built_in(X, ks):
        n = {}
        for k in ks:
            for b in X['realm']['locations'][k].get('buildings') or []: n[b['type']] = n.get(b['type'], 0) + (b.get('level') or 1)
        return n
    kn, kp = built_in(E, kept), built_in(P, kept)
    ups = sorted(((kn.get(k, 0) - kp.get(k, 0), k) for k in kn.keys() | kp.keys() if kn.get(k, 0) != kp.get(k, 0)), reverse=True)
    nice = lambda k: k.replace('nd_adu_', '').replace('_', ' ')
    if [u for u in ups if u[0] > 0]: add('Building', '- Built or enlarged in towns already held: ' + ', '.join([f'{nice(k)} +{d}' for d, k in ups if d > 0][:18]) + '.')
    gone = [(d, k) for d, k in ups if d < 0]
    if gone:
        add('Building', '- Fewer than before in towns already held: ' + ', '.join(f'{nice(k)} {d}' for d, k in gone) + '.')
        flags.append('**Buildings have gone from towns the crown already held** (' + ', '.join(f'{nice(k)} {d}' for d, k in gone[:6]) + '). Destroyed, replaced or upgraded into something else? Ask Trent if it matters.')

    # the court
    for k, label in (('ruler', 'ruler'), ('heir', 'heir'), ('regent', 'regent'), ('consort', 'consort')):
        if str(country.get(k)) != str(P['country'].get(k)):
            add('The court', f'- The {label} changed: {who_txt(P["country"][k]) if P["country"].get(k) else "none"} to {who_txt(country[k]) if country.get(k) else "none"}.')
    cabn = {str(c['character']): c for c in C.get('cabinet') or []}; cabp = {str(c['character']): c for c in PC.get('cabinet') or []}
    seat = lambda c: (S.get('seats') or {}).get(c.get('action') or '', c.get('action') or 'idle')
    for g in cabn.keys() - cabp.keys(): add('The court', f'- Joined the council: {who_txt(g)}, {seat(cabn[g]).lower()} (since {iso(cabn[g].get("since"))}).')
    for g in cabp.keys() - cabn.keys(): add('The court', f'- Left the council: {who_txt(g)}.')
    for g in cabn.keys() & cabp.keys():
        if cabn[g].get('action') != cabp[g].get('action'): add('The court', f'- {who_txt(g)} moved from {seat(cabp[g]).lower()} to {seat(cabn[g]).lower()} (since {iso(cabn[g].get("since"))}).')
    kin = lambda c: str(c['id']) in by_game or str(c.get('father')) in by_game or str(c.get('mother')) in by_game
    for g, c in cn.items():
        if since(c.get('born')) and kin(c):
            par = ' and '.join(x for x in (name_of(c.get('father')), name_of(c.get('mother'))) if x)
            add('Births and deaths', f'- Born {iso(c["born"])}: {name_of(g) or c["first_name"].replace("name_", "").capitalize()}, a {"daughter" if c.get("female") else "son"} of {par or "parents outside the cast"}' + ('' if name_of(g) else f' (character {g}, not in the cast)') + '.')
        if since(c.get('died')) and (str(g) in by_game):
            add('Births and deaths', f'- Died {iso(c["died"])}: {name_of(g)}' + (f', of {str(c["death_reason"]).replace("_", " ")}' if c.get('death_reason') else '') + '.')
    for g, c in cn.items():
        if str(g) in by_game:
            p = cast[by_game[str(g)]]
            if c.get('died') and not p.get('died'): todo.append(f'cast/{by_game[str(g)]}.yaml has no death, but the save has {p.get("name")} dead on {iso(c["died"])}.')
            new_traits = [t for t in c.get('traits') or [] if t not in (cp.get(g, {}).get('traits') or [])]
            if g in cp and new_traits: add('Births and deaths', f'- {p.get("name")} gained the trait{"s" if len(new_traits) > 1 else ""} {", ".join(t.replace("_", " ") for t in new_traits)}.')

    # war and peace
    wn = {w['id']: w for w in E.get('wars', [])}; wp = {w['id']: w for w in P.get('wars', [])}
    side = lambda w, s: ', '.join(tagname(x['tag']) for x in w['participants'] if x['side'] == s)[:300]
    thread_of = lambda w: next((t.get('title') or t['id'] for t in threads if t.get('kind') == 'war' and t.get('from') == iso(w['start'])), None)
    for i, w in wn.items():
        label = thread_of(w) or f'the war begun {iso(w["start"])}'
        if i not in wp: add('War and peace', f'- A new war, begun {iso(w["start"])} ({w.get("casus_belli")}): {side(w, "Attacker")} against {side(w, "Defender")}.')
        if w.get('ended') and not (wp.get(i) or {}).get('ended'): add('War and peace', f'- Ended {iso(w.get("end"))}: {label}.')
        nb = [b for b in w.get('battles') or [] if since(b[1])]
        if nb: add('War and peace', f'- {len(nb)} battle{"s" if len(nb) != 1 else ""} in {label}: ' + ', '.join(f'{iso(b[1])}' for b in sorted(nb, key=lambda b: iso(b[1]))[:14]) + (', …' if len(nb) > 14 else '') + '. Their sides and losses are in the extracted file.')
        for x in w['participants']:
            if since(x.get('left')): add('War and peace', f'- {tagname(x["tag"])} left {label} on {iso(x["left"])}.')
            elif since(x.get('joined')) and i in wp: add('War and peace', f'- {tagname(x["tag"])} joined {label} on {iso(x["joined"])}.')
    for i, w in wp.items():
        if i not in wn and not w.get('ended'): add('War and peace', f'- Gone from the save, so ended: {thread_of(w) or "the war begun " + iso(w["start"])}. The terms have to be read from the map and the treaties.')
    tkey = lambda t: (t.get('type'), t.get('first'), t.get('second'), tuple(t.get('objects') or []))
    tn, tp = {tkey(t): t for t in E.get('treaties', [])}, {tkey(t) for t in P.get('treaties', [])}
    tnk = set(tn)
    other = lambda k: k[2] if k[1] == TAG else k[1]
    words = lambda k: ', '.join(k[3]).replace('_', ' ') or k[0].replace('_', ' ')
    for k in sorted(tnk - tp, key=str):
        if TAG in (k[1], k[2]) and k[0] not in ('opinion_improvement', 'building_spy_network', 'curry_favors'): add('Abroad', f'- New with {tagname(other(k))}: {words(k)}' + (f' (from {iso(tn[k].get("start"))})' if tn[k].get('start') else '') + '.')
    for k in sorted(tp - tnk, key=str):
        if TAG in (k[1], k[2]) and k[0] not in ('opinion_improvement', 'building_spy_network', 'curry_favors'): add('Abroad', f'- Ended with {tagname(other(k))}: {words(k)}.')

    # law
    for key, label in (('laws', 'Law'), ('privileges', 'Privilege'), ('reforms', 'Reform')):
        objs = lambda X: {(x.get('slot'), x['object']) if key == 'laws' else x['object']: x for x in X['country'].get(key) or []}
        on, op = objs(E), objs(P)
        for k in on.keys() - op.keys():
            add('Law and government', f'- {label} adopted: {(k[1] + " (" + k[0] + ")") if key == "laws" else k}'.replace('_', ' ') + (f', {iso(on[k].get("date"))}' if on[k].get('date') else '') + '.')
        for k in op.keys() - on.keys():
            if key == 'laws' and any(s == k[0] for s, _ in on.keys()): continue
            add('Law and government', f'- {label} gone: {k[1] if key == "laws" else k}'.replace('_', ' ') + '.')
    svn, svp = country.get('societal_values') or {}, P['country'].get('societal_values') or {}
    for k in svn:
        try: x, y = float(svp[k]), float(svn[k])
        except Exception: continue
        if abs(y) < 900 and abs(x) < 900 and abs(y - x) >= 5:
            lo, hi = k.split('_vs_'); add('Law and government', f'- Society moved toward {(hi if y > x else lo).replace("_", " ")}: {fnum(x)} to {fnum(y)} on {lo.replace("_", " ")} against {hi.replace("_", " ")}.')

    # peoples
    for label, key in (('culture', 'cultures_k'), ('faith', 'religions_k')):
        tot0, tot1 = P['realm']['population_k'], realm['population_k']
        mv = sorted(((realm[key].get(k, 0) / tot1 * 100 - P['realm'][key].get(k, 0) / tot0 * 100, k) for k in realm[key].keys() | P['realm'][key].keys()), key=lambda t: -abs(t[0]))
        mv = [m for m in mv if abs(m[0]) >= 0.5][:5]
        if mv: add('Peoples', f'- Shares by {label}: ' + ', '.join(f'{k.replace("_", " ").capitalize()} {"+" if d > 0 else "−"}{abs(d):.1f} points' for d, k in mv) + '.')

    if flags: L += ['## Ask before writing', ''] + [f'- {x}' for x in flags] + ['']
    for head in ('The numbers', 'Land', 'War and peace', 'The court', 'Births and deaths', 'Law and government', 'Abroad', 'Building', 'Peoples'):
        if sec.get(head): L += [f'## {head}', ''] + sec[head] + ['']
    if not sec: L += ['Nothing the tool tracks has changed.', '']
todo = list(dict.fromkeys(todo))
if todo: L[2:2] = ['## To settle by hand', ''] + [f'- {x}' for x in todo] + ['']
hand = os.path.join(CAMP, 'reckonings', f'{date}.yaml')
if not os.path.exists(hand) and not a.out:
    L += ['## Next', '', f'Write `campaign/reckonings/{date}.yaml` with `date`, `title`, `summary`, `beats`, `tellings` and `questions`, then `npm run build`.', '']
rep_dir = os.path.join(a.out, 'reports') if a.out else os.path.join(CAMP, 'reports')
os.makedirs(rep_dir, exist_ok=True)
rep = os.path.join(rep_dir, f'{date}.md')
open(rep, 'w', encoding='utf8').write('\n'.join(L).rstrip() + '\n')
print(f'wrote {rep if a.out else os.path.relpath(rep, REG)}' + (f', with {len(todo)} thing{"s" if len(todo) != 1 else ""} to settle by hand' if todo else ''))
