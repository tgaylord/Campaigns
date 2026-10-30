#!/usr/bin/env python3
"""Estimate each estate's share of power from a decoded save.

The save doesn't store estate power, so this rebuilds it from the game's own
rules (see tools/README.md, 'Estate power'), using data/estate-power-model.json
for pop weights, building bonuses, the country modifiers read off Trent's
tooltips, and a fitted promotion term.

usage:
  estate_power.py SECTIONS_DIR [--model FILE] [--tag GRA] [--reading DATE] [--calibrate DATE] [--out FILE]

  --reading DATE     use the country modifiers and corrections of this reading
                     (default: the latest reading in the model file)
  --calibrate DATE   this save is the moment of that reading: compare the model
                     with the screen, store per-estate corrections in the model
                     file, and print the comparison
  --out FILE         write the result as JSON

Model, per estate e (pops of that estate in owned locations):
  power_e = sum(size x weight x (1 + country_e + local_e + promotion_e)) x (1 + tolerance)
  burghers also count primary-culture, primary-religion burghers abroad, at (1 + country_e)
Crown, over every pop in every owned location:
  power_crown = sum(size x weight x max(0, 1 + country_crown - (1 - control) + local_crown))
                x (1 + 0.5 x (mean control - 0.5))
Each estate's figure is then multiplied by its correction from the reading
(screen / model at that moment), and shares are taken of the total.
Dated 'adjustments' in the model file (such as the crown-power penalty for debt
to the estates) are added to the country modifiers for saves after their date.
"""
import argparse, collections, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument('sections')
ap.add_argument('--model', default=os.path.join(HERE, '..', 'data', 'estate-power-model.json'))
ap.add_argument('--tag', default='GRA')
ap.add_argument('--reading')
ap.add_argument('--calibrate')
ap.add_argument('--out')
a = ap.parse_args()
D = a.sections
M = json.load(open(a.model, encoding='utf8'))
W, LOCAL = M['powerPerPop'], M['localBonus']
P_SHARE, P_EFF = M['promotionShare'], M['promotionEffect']
key = a.calibrate or a.reading or sorted(M['readings'])[-1]
R = M['readings'][key]
CM, TOL = dict(R['countryModifiers']), R.get('tolerance', 0.0)
ADJ = []  # dated changes to the country modifiers since the reading (e.g. debt to the estates)
ESTATES = ['crown', 'nobles', 'clergy', 'burghers', 'peasants', 'dhimmi']


def rd(name):
    return open(os.path.join(D, name + '.txt'), encoding='utf8', errors='replace').read()


meta = rd('metadata')
date = re.search(r'\n\tdate=([\d.]+)', meta).group(1)
iso = '-'.join(f'{int(x):02d}' if k else x for k, x in enumerate(date.split('.')))
for adj in M.get('adjustments', []):
    if key < adj['from'] <= iso:
        CM[adj['estate']] = CM.get(adj['estate'], 0) + adj['delta']; ADJ.append(adj)
ct = rd('countries')
i = ct.find('\n\ttags={'); j = ct.find('\n\t}', i)
TAGS = {int(k): v for k, v in re.findall(r'\n\t\t(\d+)=([A-Za-z0-9_]+)(?=\n)', ct[i:j])}
CID = {v: k for k, v in TAGS.items()}[a.tag]
mine = re.search(r'\n%d=\{\n(.*?)\n\}' % CID, ct[ct.find('\tdatabase={'):], re.S).group(1)
PRIMARY_CULTURE = re.search(r'\n\tprimary_culture=(\d+)', mine).group(1)
PRIMARY_RELIGION = re.search(r'\n\tprimary_religion=(\d+)', mine).group(1)
del ct

# Locations: owner, control and pops
lt = rd('locations')
starts = [(int(m.group(1)), m.start()) for m in re.finditer(r'\n\t\t(\d+)=\{', lt)]
loc_of, owned, control = {}, set(), {}
for k, (lid, s) in enumerate(starts):
    b = lt[s:starts[k + 1][1] if k + 1 < len(starts) else len(lt)]
    pm = re.search(r'\n\t\t\t\tpops=\{([^}]*)\}', b)
    if pm:
        for p in pm.group(1).split(): loc_of[int(p)] = lid
    o = re.search(r'\n\t\t\towner=(\d+)', b)
    if o and int(o.group(1)) == CID:
        owned.add(lid); cm_ = re.search(r'\n\t\t\tcontrol=([\d.]+)', b); control[lid] = float(cm_.group(1)) if cm_ else 0.0
del lt

# Buildings in owned locations: local bonus per estate
local = collections.defaultdict(float)
for m in re.finditer(r'\n\d+=\{\n(.*?)\n\}', rd('building_manager'), re.S):
    b = '\n' + m.group(1)
    lo = re.search(r'\n\tlocation=(\d+)', b); ty = re.search(r'\n\ttype=(\w+)', b)
    if lo and ty and int(lo.group(1)) in owned and ty.group(1) in LOCAL:
        for e, v in LOCAL[ty.group(1)].items(): local[(e, int(lo.group(1)))] += v

# Pops
est = collections.Counter()      # model power per estate, before tolerance
crown_raw = collections.Counter()  # raw pop power per owned location
counts = collections.Counter()
for m in re.finditer(r'\n(\d+)=\{\n(.*?)\n\}', rd('population'), re.S):
    b = '\n' + m.group(2)
    f = lambda k: (re.search(r'\n\t' + k + r'=([^\s]+)', b) or [None, None])[1]
    t, e = f('type'), (f('estate') or '').replace('_estate', '')
    sz = float(f('size') or 0); w = W.get(t, 0)
    lid = loc_of.get(int(m.group(1)))
    if lid in owned:
        crown_raw[lid] += sz * w
        if e in CM:
            est[e] += sz * w * (1 + CM[e] + local[(e, lid)] + P_EFF.get(e, 0) * P_SHARE)
            counts[(e, t)] += sz
    elif e == 'burghers' and t == 'burghers' and f('culture') == PRIMARY_CULTURE and f('religion') == PRIMARY_RELIGION:
        est['burghers'] += sz * w * (1 + CM['burghers'])   # merchants abroad: no local bonuses
        counts[('burghers', 'abroad')] += sz

model = {e: est[e] * (1 + TOL) for e in ESTATES if e != 'crown'}
mean_c = sum(control.values()) / len(control)
model['crown'] = sum(v * max(0.0, 1 + CM['crown'] - (1 - control[l]) + local[('crown', l)]) for l, v in crown_raw.items()) * (1 + 0.5 * (mean_c - 0.5))

if a.calibrate and 'screenTotal' in R:
    # Partial reading: one or more estates' absolute power plus the total. The
    # estates read get screen / model; the rest keep the relative corrections of
    # the base reading, scaled together so the total matches the screen.
    base = M['readings'][R['baseReading']]['corrections']
    read = {e: R['screen'][e] / model[e] for e in R['screen']}
    rest = [e for e in ESTATES if e not in read]
    k = (R['screenTotal'] - sum(R['screen'].values())) / sum(model[e] * base[e] for e in rest)
    corr = {**read, **{e: base[e] * k for e in rest}}
    R['corrections'] = {e: round(corr[e], 4) for e in ESTATES}
    R['calibratedOn'] = date
    json.dump(M, open(a.model, 'w', encoding='utf8'), indent=1, ensure_ascii=False)
    print(f'partial calibration on {date} (reading {key}): read {sorted(read)}, the rest scaled by {k:.3f} from {R["baseReading"]}')
    for e in ESTATES:
        s = R['screen'].get(e)
        print(f"  {e:9s} model {model[e]:7.2f}  correction {corr[e]:.4f}" + (f"  screen {s:7.2f}" if s is not None else ''))
elif a.calibrate:
    corr = {e: R['screen'][e] / model[e] for e in ESTATES}
    R['corrections'] = {e: round(v, 4) for e, v in corr.items()}
    R['calibratedOn'] = date
    json.dump(M, open(a.model, 'w', encoding='utf8'), indent=1, ensure_ascii=False)
    tot_m, tot_s = sum(model.values()), sum(R['screen'].values())
    print(f'calibration on {date} (reading {key})')
    for e in ESTATES:
        print(f"  {e:9s} model {model[e]:7.2f}  screen {R['screen'][e]:7.2f}  correction {corr[e]:.3f}   share model {100*model[e]/tot_m:5.2f}%  screen {100*R['screen'][e]/tot_s:5.2f}%")
corr = R.get('corrections', {e: 1.0 for e in ESTATES})
power = {e: model[e] * corr[e] for e in ESTATES}
tot = sum(power.values())
out = {'date': date, 'reading': key, 'adjustments': ADJ, 'mean_control': round(mean_c, 4),
       'model': {e: round(v, 2) for e, v in model.items()},
       'power': {e: round(v, 2) for e, v in power.items()},
       'shares': {e: round(100 * v / tot, 2) for e, v in power.items()},
       'burghers_abroad': round(counts[('burghers', 'abroad')] * 1000)}
if a.out: json.dump(out, open(a.out, 'w'), indent=1)
print(json.dumps(out['shares']), f"(model total {sum(model.values()):.1f})")
