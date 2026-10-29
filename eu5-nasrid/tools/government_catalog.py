#!/usr/bin/env python3
"""Build data/government-catalog.json: what each privilege, law, reform, societal
value and parliament agenda the campaign has touched actually does.

The save names these by key only. Their effects come from the game's own
definition files (base game plus the Across the Pillars DLC), with English names
from its localization, so the Council can say "Primacy of the Nobility: nobles
power +100%" instead of a bare key.

usage:
  government_catalog.py GAME_DIR [--out FILE]

  GAME_DIR is the game's `game` folder (or a copy of the files listed below):
    in_game/common/{estate_privileges,laws,government_reforms,societal_values,
                    parliament_agendas,parliament_types}/*.txt
    dlc/*/in_game/common/<same folders>/*.txt
    main_menu/common/modifier_type_definitions/00_modifier_types.txt
    main_menu/common/script_values/default_values.txt
    main_menu/localization/english/*.yml, dlc/*/main_menu/localization/english/*.yml

Only entries that appear in at least one checkpoint (data/extracted/*.json) are
written, but every option of a law the campaign holds is kept, so the site can
show what the alternatives would do.
"""
import argparse, glob, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'shared', 'tools', 'eu5-save-decoder-1.4'))
from jomini import parse  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument('game')
ap.add_argument('--out', default=os.path.join(HERE, '..', 'data', 'government-catalog.json'))
a = ap.parse_args()
G = a.game


def files(sub):
    return sorted(glob.glob(os.path.join(G, sub, '*.txt'))) + sorted(glob.glob(os.path.join(G, 'dlc', '*', sub, '*.txt')))


def read(path):
    t = open(path, encoding='utf-8-sig', errors='replace').read()
    return re.sub(r'#[^\n]*', '', t)


def load(sub):
    """Top-level blocks of every file in a definitions folder. INJECT: adds to an
    existing block, REPLACE: swaps it; plain keys later in load order win."""
    out = {}
    for f in files(sub):
        for k, v in parse(read(f)):
            if not k or not isinstance(v, list): continue
            if k.startswith('INJECT:'):
                out.setdefault(k[7:], []).extend(v)
            elif k.startswith(('REPLACE:', 'REPLACE_OR_CREATE:', 'TRY_REPLACE:', 'INJECT_OR_CREATE:')):
                out[k.split(':', 1)[1]] = v
            else:
                out[k] = v
    return out


# Localization: `key: "text"` (optionally `key:0 "text"`), base then DLC.
LOC = {}
for f in sorted(glob.glob(os.path.join(G, 'main_menu', 'localization', 'english', '**', '*.yml'), recursive=True)) + \
        sorted(glob.glob(os.path.join(G, 'dlc', '*', 'main_menu', 'localization', 'english', '**', '*.yml'), recursive=True)):
    for m in re.finditer(r'^\s+([\w.\-]+):\d*\s+"(.*)"\s*$', open(f, encoding='utf-8-sig', errors='replace').read(), re.M):
        LOC[m.group(1)] = m.group(2)


def loc(key, depth=0):
    s = LOC.get(key)
    if s is None: return None
    if depth < 3:
        s = re.sub(r'\$([\w.]+)\$', lambda m: loc(m.group(1), depth + 1) or m.group(1), s)
        s = re.sub(r"\[Show(?:EstateType|Culture|Region|Religion|BuildingType)Name(?:WithNoTooltip)?\('(\w+)'\)\]", lambda m: loc(m.group(1), depth + 1) or m.group(1).replace('_', ' '), s)
    s = re.sub(r'\[[^\]]*\|[a-zA-Z]+\]', lambda m: m.group(0)[1:].split('|')[0], s)   # [concept|e] -> concept
    s = re.sub(r'\[[^\]]*\]', '', s)
    s = re.sub(r'#\w+ ?|#!', '', s)
    return re.sub(r'\s+', ' ', s).strip()


# Script values (named numbers) and modifier types (percent or flat).
SV = {}
for f in [os.path.join(G, 'main_menu', 'common', 'script_values', 'default_values.txt')] + files('in_game/common/script_values'):
    if not os.path.exists(f): continue
    for m in re.finditer(r'^\s*(\w+)\s*=\s*(-?[\d.]+)\s*$', read(f), re.M):
        SV.setdefault(m.group(1), float(m.group(2)))
MT = {}
mtf = os.path.join(G, 'main_menu', 'common', 'modifier_type_definitions', '00_modifier_types.txt')
for k, v in parse(read(mtf)):
    if k and isinstance(v, list):
        d = dict((kk, vv) for kk, vv in v if kk and not isinstance(vv, list))
        MT[k] = {'percent': d.get('percent') == 'yes', 'good': d.get('color', 'good') != 'bad', 'boolean': d.get('boolean') == 'yes',
                 'decimals': int(d['decimals']) if d.get('decimals', '').isdigit() else None}


def num(v):
    if isinstance(v, str):
        if re.fullmatch(r'-?[\d.]+', v): return float(v)
        if v in SV: return SV[v]
    return None


SAT = re.compile(r'(tiny|small|medium|large|huge)_(privilege|permanent)_target_satisfaction(_penalty)?')


def modifiers(block):
    """[{key, label, value, text, percent, good}] for a country_modifier/location_modifier block."""
    out = []
    for k, v in block or []:
        if not k or isinstance(v, list) or k in ('potential_trigger', 'custom_tooltip', 'pure_tooltip_entry'): continue
        t = MT.get(k, {})
        n = num(v)
        label = re.sub(r'\s*%$', '', loc(f'MODIFIER_TYPE_NAME_{k}') or k.replace('_', ' '))
        if v == 'yes': text = label
        elif n is None: text = f'{label}: {v}'
        else:
            if t.get('percent'):
                p = n * 100
                # whole numbers plain, small values with enough places to stay non-zero
                s = f'{p:.0f}' if abs(p - round(p)) < 0.05 and abs(p) >= 1 else (f'{p:.1f}' if abs(p) >= 1 else f'{p:.3g}')
                text = f"{label} {'+' if p > 0 else ''}{s}%"
            else:
                text = f"{label} {'+' if n > 0 else ''}{n:g}"
        m = SAT.fullmatch(v) if isinstance(v, str) else None
        out.append({'key': k, 'label': label, 'value': n if n is not None else v, 'text': text,
                    'percent': t.get('percent', False), 'good': t.get('good', True),
                    **({'size': m.group(1)} if m else {})})
    return out


def g(items, key):
    for k, v in items or []:
        if k == key: return v
    return None


def power_of(mods):
    """Estate power changes: {estate: +x} from global_<estate>_estate_power / global_crown_estate_power."""
    out = {}
    for m in mods:
        mm = re.fullmatch(r'global_(\w+?)_estate_power', m['key'])
        if mm and isinstance(m['value'], float): out[mm.group(1)] = out.get(mm.group(1), 0) + m['value']
    return out


def satisfaction_of(mods):
    out = {}
    for m in mods:
        if not isinstance(m['value'], float): continue
        if m['key'] == 'global_estate_target_satisfaction': out['all'] = out.get('all', 0) + m['value']; continue
        mm = re.fullmatch(r'(\w+?)_estate_target_satisfaction', m['key'])
        if mm: out[mm.group(1)] = out.get(mm.group(1), 0) + m['value']
    return out


# The game has no English name for a few keys; these are the chronicle's own.
OWN_NAMES = {'jamaa_parliament': 'Jamāʿa', 'gra_hajib_reform': 'The Ḥājib'}


def entry(key, block, kind):
    mods = modifiers(g(block, 'country_modifier')) + modifiers(g(block, 'location_modifier'))
    e = {'name': loc(key) or OWN_NAMES.get(key) or key.replace('_', ' '), **({'nameIsOurs': True} if not loc(key) and key in OWN_NAMES else {}), 'desc': loc(f'{key}_desc'), 'modifiers': mods,
         'power': power_of(mods), 'satisfaction': satisfaction_of(mods)}
    if kind == 'privilege':
        e['estate'] = (g(block, 'estate') or '').replace('_estate', '')
        cr = g(block, 'can_revoke')
        e['revoke'] = 'conditions' if cr else ('free' if cr == [] or cr is None else None)
    if g(block, 'years'): e['years'] = num(g(block, 'years'))
    prefs = g(block, 'estate_preferences')
    if prefs: e['favouredBy'] = [v.replace('_estate', '') for k, v in prefs if k is None]
    return e


# What the campaign has held, at any checkpoint.
seen = {'privileges': set(), 'reforms': set(), 'law_slots': set(), 'agendas': set(), 'parliaments': set(), 'values': set()}
for f in sorted(glob.glob(os.path.join(HERE, '..', 'data', 'extracted', '*.json'))):
    c = json.load(open(f, encoding='utf8'))['country']
    seen['privileges'] |= {p['object'] for p in c.get('privileges', [])}
    seen['reforms'] |= {p['object'] for p in c.get('reforms', [])}
    seen['law_slots'] |= {l['slot'] if isinstance(l, dict) else l for l in (c.get('laws') or {})}
    pm = c.get('parliament') or {}
    seen['agendas'] |= {x['type'] for x in pm.get('agenda', [])}
    if pm.get('type'): seen['parliaments'].add(pm['type'])
    seen['values'] |= {k for k, v in (c.get('societal_values') or {}).items() if float(v) > -999}

PRIV = load('in_game/common/estate_privileges')
LAWS = load('in_game/common/laws')
REF = load('in_game/common/government_reforms')
VALS = load('in_game/common/societal_values')
AGEN = load('in_game/common/parliament_agendas')
PART = load('in_game/common/parliament_types')

LAW_FIELDS = {'law_category', 'law_gov_group', 'potential', 'allow', 'requires_vote', 'type', 'unique', 'law_country_group',
              'locked', 'ai_weight', 'on_activate', 'on_deactivate', 'custom_tooltip', 'law_religion_group'}
missing = []
out = {'about': "Effects of the privileges, laws, reforms, societal values and parliament agendas the campaign has held, from the game's "
                 "definition files and English localization (tools/government_catalog.py). Generated: edit the tool, not this file.",
       'gameVersion': '1.4.5', 'privileges': {}, 'reforms': {}, 'laws': {}, 'societalValues': {}, 'agendas': {}, 'parliaments': {}}
for k in sorted(seen['privileges']):
    if k in PRIV: out['privileges'][k] = entry(k, PRIV[k], 'privilege')
    else: missing.append(f'privilege {k}')
for k in sorted(seen['reforms']):
    if k in REF: out['reforms'][k] = entry(k, REF[k], 'reform')
    else: missing.append(f'reform {k}')
for slot in sorted(seen['law_slots']):
    b = LAWS.get(slot)
    if b is None: missing.append(f'law {slot}'); continue
    opts = {k: entry(k, v, 'law') for k, v in b if k and isinstance(v, list) and k not in LAW_FIELDS}
    out['laws'][slot] = {'name': loc(slot) or slot, 'category': g(b, 'law_category'), 'options': opts}
for k in sorted(seen['values']):
    b = VALS.get(k)
    if b is None: missing.append(f'societal value {k}'); continue
    left, right = k.split('_vs_')
    out['societalValues'][k] = {
        'name': loc(k) or k, 'left': loc(f'{left}_focus') or left.replace('_', ' ').title(), 'right': loc(f'{right}_focus') or right.replace('_', ' ').title(),
        'leftModifiers': modifiers(g(b, 'left_modifier')), 'rightModifiers': modifiers(g(b, 'right_modifier'))}
for k in sorted(seen['agendas']):
    b = AGEN.get(k)
    if b is None: missing.append(f'agenda {k}'); continue
    acc = g(b, 'on_accept') or []
    moves = [{'value': g(v, 'type'), 'direction': 'left' if 'left' in (g(v, 'value') or '') else 'right'}
             for kk, v in acc if kk == 'change_societal_value']
    out['agendas'][k] = {'name': loc(k) or k, 'desc': loc(f'{k}_desc'), 'estate': (g(b, 'estate') or '').replace('_estate', ''), 'moves': moves}
for k in sorted(seen['parliaments']):
    out['parliaments'][k] = {'name': loc(k) or OWN_NAMES.get(k, k), 'desc': loc(f'{k}_desc'), **({'nameIsOurs': True} if not loc(k) and k in OWN_NAMES else {})}

json.dump(out, open(a.out, 'w', encoding='utf8'), indent=1, ensure_ascii=False)
print(f"catalog: {len(out['privileges'])} privileges, {len(out['reforms'])} reforms, {len(out['laws'])} laws "
      f"({sum(len(l['options']) for l in out['laws'].values())} options), {len(out['societalValues'])} societal values, "
      f"{len(out['agendas'])} agendas, {len(out['parliaments'])} parliament types")
if missing: print('not found in the game files:', ', '.join(missing))
