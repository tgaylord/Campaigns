"""Builds the inline data for mockup.html from brief/data plus the hand-drafted links below.

Node titles, dates and sources are copied verbatim from events.json; Hijri dates are computed
(the chronicle reads the Western date as Julian and uses the tabular Islamic calendar, which this
reproduces for every date checked). Links are the designer's draft, not confirmed by Trent.

usage: python3 -I build_mockup_data.py <brief dir> <template.html> <out.html>
"""
import json, sys, re

B, TPL, OUT = sys.argv[1:4]
ev = {e['id']: e for e in json.load(open(f'{B}/data/events.json'))}
wars = {w['id']: w for w in json.load(open(f'{B}/data/wars.json'))}
cps = json.load(open(f'{B}/data/checkpoints.json'))
rr = json.load(open(f'{B}/data/realm-readings.json'))

MONTHS = ['Muḥarram', 'Ṣafar', 'Rabīʿ al-Awwal', 'Rabīʿ al-Thānī', 'Jumādā al-Ūlā', 'Jumādā al-Ākhira',
          'Rajab', 'Shaʿbān', 'Ramaḍān', 'Shawwāl', 'Dhū al-Qaʿda', 'Dhū al-Ḥijja']

def jdn_julian(y, m, d):
    a = (14 - m) // 12; y2 = y + 4800 - a; m2 = m + 12 * a - 3
    return d + (153 * m2 + 2) // 5 + 365 * y2 + y2 // 4 - 32083

def hijri(iso, month_only=False):
    y, m, d = [int(x) for x in iso.split('-')]
    l = jdn_julian(y, m, d) - 1948440 + 10632; n = (l - 1) // 10631; l = l - 10631 * n + 354
    j = ((10985 - l) // 5316) * ((50 * l) // 17719) + (l // 5670) * ((43 * l) // 15238)
    l = l - ((30 - j) // 15) * ((17719 * j) // 50) - (j // 16) * ((15238 * j) // 43) + 29
    hm = (24 * l) // 709; hd = l - (709 * hm) // 24; hy = 30 * n + j - 30
    return f'{MONTHS[hm-1]} {hy}' if month_only else f'{hd} {MONTHS[hm-1]} {hy}'

def month_only(eid):
    # ids like 1402-08-the-umara or 1432-05-the-dar-al-sinaa carry no day
    return not re.match(r'^\d{4}-\d{2}-\d{2}-', eid)

def rec(eid):
    e = ev[eid]
    mo = month_only(eid)
    return {'id': eid, 'date': e['date'], 'monthOnly': mo, 'hijri': hijri(e['date'], mo),
            'type': e['type'], 'title': e['title'], 'source': e['source']}

# ---------------------------------------------------------------- nodes
NODES = {
 # chain A
 'A0': dict(kind='reading', date='1442-06-11', label='Every estate but the burghers pushed off its line',
            members=['1442-06-11-the-princes-mend-the-damage'],
            reading={'source': 'save of 11 June 1442 (checkpoint 1442-06-11)'}),
 'J846': dict(label='The Jamāʿa of 846 seats the burghers as equals',
              members=['1442-06-01-national-assemblies', '1442-06-01-privileges-for-the-burghers']),
 'LR1438': dict(label='The umarāʾ give up their Land Rights for Majrīṭ’s charter',
                members=['1438-04-08-land-rights-unravelled', '1438-04-08-the-charter-of-majrit']),
 'P1428': dict(label='The Primacy of Nobility revoked',
               members=['1428-05-25-jamaa-against-primacy', '1428-05-25-primacy-revoked']),
 'J1414': dict(label='The Jamāʿa of the mercenaries; the umarāʾ curtailed',
               members=['1414-10-24-jamaa-of-the-mercenaries', '1414-10-24-the-umara-mutinous']),
 'POL1402': dict(label='The court resolves to break the umarāʾ', members=['1402-08-the-umara']),
 'BP1402': dict(label='The burghers given the coinage and the city grants', members=['1402-08-burghers-privileges']),
 'CP1410': dict(label='The Catalan privileges return, for good', members=['1410-09-01-catalan-privileges-return']),
 'T1375': dict(label='Catalonia and Aragon made ṭāʾifas',
               members=['1375-03-16-two-new-taifas', '1375-03-15-the-new-taifas']),
 'WUM': dict(kind='war', war='war-of-the-upper-march', label='The War of the Upper March, 1373–1375',
             members=['1375-03-15-peace-aragon']),
 'S1370': dict(label='The Battle for the Strait ends: Granada stands free', members=['1370-09-14-strait-ends']),
 # chain B
 'GC': dict(label='The Golden Century proclaimed, and a Thalassocracy',
            members=['1442-08-07-the-golden-century', '1442-08-07-establish-a-thalassocracy']),
 'SEA1438': dict(label='The realm’s temper leans to the sea', members=['1438-01-16-the-realm-turns-to-the-sea']),
 'DAR1432': dict(label='Seven arsenals, the dār al-ṣināʿa, laid down', members=['1432-05-the-dar-al-sinaa']),
 'CR1431': dict(label='The second crusade proclaimed', members=['1431-10-01-the-second-crusade']),
 'SAN1430': dict(label='Santiago falls; its cathedral destroyed', members=['1430-07-15-santiago-falls']),
 'PR1430': dict(label='The princes turn the war on Galicia',
                members=['1430-05-18-the-princes-counsel', '1430-05-18-take-the-capital']),
 'REST1375': dict(label='Granada becomes al-Andalus', members=['1375-03-16-restoration-of-al-andalus']),
 'AOD1437': dict(label='The Age of Discovery opens', members=['1437-01-01-the-age-of-discovery']),
 'PEACE1432': dict(label='Peace with the Pope ends the last war', members=['1432-07-27-peace-with-the-pope']),
 'IB1430': dict(label='Iberia conquered', members=['1430-11-03-iberia-is-conquered']),
 'CAT1436': dict(label='Catalonia annexed to the crown', members=['1436-06-01-catalonia-annexed']),
 'CAP1379': dict(label='The court moves to Ishbīliya',
                 members=['1379-04-jamaa-of-the-capital', '1379-11-capital-at-ishbiliya']),
 # reverse-view extras
 'SHIP1376': dict(label='Catalan shipwrights sent to the Mamlūk ports', members=['1376-12-catalan-shipwrights']),
 'MUR1370': dict(label='Mursiyya absorbed into the crown',
                 members=['1370-09-20-murcia-annexation', '1375-03-16-murcia-into-the-crown']),
}

for k, n in NODES.items():
    n['id'] = k
    n.setdefault('kind', 'event' if len(n['members']) == 1 else 'knot')
    n['records'] = [rec(m) for m in n['members']]
    first = n['records'][0]
    n.setdefault('date', min(r['date'] for r in n['records']))
    n['monthOnly'] = all(r['monthOnly'] for r in n['records'] if r['date'] == n['date'])
    n['hijri'] = hijri(n['date'], n['monthOnly'])
    if n['kind'] == 'war':
        w = wars[n['war']]
        battles = [e for e in ev.values() if n['war'] in (e.get('wars') or []) and e['type'] == 'battle']
        n['war'] = {'id': w['id'], 'name': w['name'], 'start': w['start'], 'end': w['end'],
                    'goal': w['goal'], 'outcome': w['outcome'], 'battles': len(battles),
                    'records': len([e for e in ev.values() if n['war'] in (e.get('wars') or [])])}
        n['date'] = w['start']; n['hijri'] = hijri(w['start'])

# the 1442 reading: each estate against the line the crown holds it at (owner: 50, umarāʾ 40)
c1442 = next(c for c in cps if c['date'] == '1442-06-11')
NAMES = {'nobles': 'umarāʾ', 'clergy': 'ʿulamāʾ', 'burghers': 'burghers', 'peasants': 'commoners', 'dhimmi': 'dhimmī'}
NODES['A0']['reading']['estates'] = [
    {'id': s['id'], 'name': NAMES[s['id']], 'sat': s['satisfaction'], 'line': 40 if s['id'] == 'nobles' else 50}
    for s in c1442['estates'] if s['id'] in NAMES]

# ---------------------------------------------------------------- series
umara = [[c['date'], next(s['satisfaction'] for s in c['estates'] if s['id'] == 'nobles')]
         for c in cps if c.get('estates')]
naval = [[r['checkpoint'], round(r['societalValues']['land_vs_naval'], 2)] for r in rr]
SERIES = {
 'umara': {'label': 'umarāʾ satisfaction, every save (the crown holds it near 40)', 'line': 40,
           'points': umara, 'min': 0, 'max': 70},
 'naval': {'label': 'the realm’s temper, land (−) against sea (+), every reading', 'line': 0,
           'points': naval, 'min': -50, 'max': 50},
}

# ---------------------------------------------------------------- links (designer's draft)
def L(i, frm, to, kind, basis, claim, evidence, primary=False, note=None, gap=None, series=None,
      window=None, flag=None, suggestedBy=None, group=None):
    return {k: v for k, v in dict(id=i, cause=frm, effect=to, kind=kind, basis=basis, claim=claim,
            evidence=evidence, primary=primary, note=note, gap=gap, series=series, window=window,
            flag=flag, suggestedBy=suggestedBy, group=group, status='draft').items() if v is not None}

LINKS = [
 # ---- chain A: why was every estate but the burghers angry in June 1442?
 L('a1', 'J846', 'A0', 'provoked', 'rule',
   'Seating the burghers and granting them two privileges cost every other estate satisfaction, by the game’s own previews.',
   [{'q': 'on granting, burghers +15% (to 59%), umarāʾ −2.6%, ʿulamāʾ −2.2%, dhimmī −2.0%', 'src': 'Shipwright Contracts tooltip; Trent’s screenshots, 1 June 1442'},
    {'q': 'on granting, burghers +15%, umarāʾ −3.9%, ʿulamāʾ −3.4%, dhimmī −3.0%', 'src': 'Urban Development Grants tooltip; Trent’s screenshots, 1 June 1442'},
    {'q': 'burghers 74, ʿulamāʾ 44, dhimmī 45, commoners 34, umarāʾ 32', 'src': 'save of 11 June 1442'}],
   primary=True, suggestedBy=['same-window estate departure'],
   note='The previews explain about six or seven points of each fall. The commoners’ drop of 16 has no tooltip behind it in the record; the chronicle says they “felt passed over” (the court’s reading).'),
 L('a1b', 'LR1438', 'A0', 'provoked', 'rule',
   'The umarāʾ’s anger was compounded: Land Rights, worth +5% satisfaction to them, is gone in the save of June 1442.',
   [{'q': 'Land Rights (nobles): +5% satisfaction and +75% power for the nobility', 'src': 'the game’s tooltip; Trent’s screenshot, 8 April 1438'},
    {'q': 'the save of 11 June 1442 shows … the nobles’ Land Rights gone', 'src': 'save of 11 June 1442'},
    {'q': 'The umarāʾ had lost their land rights four years before, and now their place above the merchants.', 'src': 'chronicle, “Of the Princes’ Mending” (the court’s reading)'}],
   suggestedBy=['readings diff: nobles_land_rights removed', 'co-cited']),
 L('a2', 'P1428', 'J846', 'enabled', 'court',
   'With the Primacy gone, the great houses no longer had to be consulted before important decisions, which left the Emperor free to remake the assembly over their heads.',
   [{'q': 'they have become so crucial to the government that we must consult with them before making important decisions', 'src': 'the Primacy of Nobility, the game’s text; Trent’s screenshot, 25 May 1428'},
    {'q': 'The great houses no longer count themselves the Emperor’s equals or must be consulted on his decisions.', 'src': 'save of 25 May 1428'}],
   primary=True, series='umara', window=['1424-01-01', '1443-01-01'],
   note='The chronicle’s reading. Nothing in the save says the 1442 reform needed the Primacy gone.'),
 L('a2b', 'BP1402', 'J846', 'enabled', 'court',
   'Forty years of favour had made the burghers an estate worth seating.',
   [{'q': 'With the mines found, the burghers are given two privileges: control over the coinage … and urban development grants', 'src': 'Trent’s account and screens, 1402'}],
   flag='weak',
   note='The saves show the burghers’ share of power doubling between 1411 and 1414 (estimated figures), not in 1402. The record doesn’t say why.'),
 L('a3', 'J1414', 'P1428', 'continued', 'owner',
   'Revoking the Primacy was the next step in the campaign against the umarāʾ that the Jamāʿa of 1414 had opened.',
   [{'q': 'another chance to take a privilege from the umarāʾ', 'src': 'Trent’s account and screenshot, 25 May 1428'},
    {'q': 'the crown and the umarāʾ: from 1402 the crown’s aim is to break the power of the nobles', 'src': 'thread note on the 1414 record (Trent)'}],
   primary=True, series='umara', window=['1408-01-01', '1432-01-01'],
   note='The umarāʾ’s line, held near 40, plunges at each step: 11 in 1414, 16 in 1428. Both times the crown brings it back by the next save or two.'),
 L('a4', 'CP1410', 'J1414', 'shifted', 'rule',
   'Back in force from 1410, the Catalan privileges cut the nobles’ power by a fifth, weakening them before the Jamāʿa of 1414.',
   [{'q': 'nobles power −20%, burghers power −10% (crown power +30% scaled by Farfanes in the army)', 'src': 'the reform’s effects; saves of 29 June 1410 and 1 November 1411'},
    {'q': 'He had an old ally in it. … they had always weakened the great lords in favour of the crown.', 'src': 'chronicle, “Of the Jamāʿa of 817” (the court’s reading)'}],
   primary=True, suggestedBy=['co-cited in “Of the Jamāʿa of 817”', 'effects text names the nobles']),
 L('a4b', 'POL1402', 'J1414', 'prompted', 'owner',
   'The Jamāʿa of 1414 carried out the policy the court had settled on in 1402.',
   [{'q': 'now that the state is built, breaking the power of the umarāʾ is the easiest road to a stronger crown', 'src': 'Trent’s account, 1402'}],
   suggestedBy=['thread field on the 1414 record', 'co-cited']),
 L('a5', 'T1375', 'CP1410', 'enabled', 'rule',
   'The privileges hold only while there is peace with Aragon. Once Catalonia and Aragon were the Emperor’s own ṭāʾifas, that war could not happen again.',
   [{'q': 'needs peace with Aragon', 'src': 'the reform’s effects (eu5db.com, 1.4.5), on the 1339 record'},
    {'q': 'the privileges need peace with Aragon; now that Catalonia and Aragon are subjects, war with them is impossible (Trent)', 'src': 'saves of 29 June 1410 and 1 November 1411; Trent’s account'}],
   primary=True, gap='35 years pass between the ṭāʾifas (1375) and the privileges’ return (1410). The record doesn’t say why they waited so long.',
   suggestedBy=['rhythm: a conditional reform aligned with wars on Aragon']),
 L('a6', 'WUM', 'T1375', 'enabled', 'save',
   'The peace of 15 March 1375 left Aragon landless; the ṭāʾifas were carved from its lands the next day.',
   [{'q': 'Aragon gave up every town it still held, 34 of them and half a million people, and ceased to hold land', 'src': 'wars.json, the War of the Upper March'},
    {'q': 'ARA is the old Kingdom of Aragon’s own tag, landless since the peace of 15 March, now a ṭāʾifa of the sultan', 'src': 'save of 16 March 1375'}],
   primary=True, suggestedBy=['structural: war → peace → territory (auto-confirmed)']),
 L('a6b', 'T1375', 'T1375', 'prompted', 'owner', '', [], ),  # placeholder removed below
 L('a7', 'S1370', 'WUM', 'enabled', 'rule',
   'Winning the Strait made the Reconquest of Iberia cheap to claim, and that claim was the War of the Upper March’s goal.',
   [{'q': 'the Reconquest of Iberia can be fabricated at reduced cost', 'src': 'the Strait’s ending, Trent’s screenshots of the event (14 September 1370)'},
    {'q': 'The Reconquest of Iberia: Aragon’s lands, at reduced cost (won with the Battle for the Strait)', 'src': 'wars.json, the war’s goal'}],
   primary=True),
 # ---- chain B: why did the Golden Century come with a fleet?
 L('b1', 'SEA1438', 'GC', 'prompted', 'court',
   'The Thalassocracy, signed on the day of the Golden Century, crowned a temper that had already swung to the sea.',
   [{'q': 'Establishing a Thalassocracy for 20 years, heavy and light ship build cost −20%, monthly progress to naval +0.50', 'src': 'Trent’s screenshot of 7 August 1442'},
    {'q': '“Why should I grant such favour so far from the sea? Won’t the city merely wither and die?”', 'src': 'the Emperor on Majrīṭ, Trent’s account, 8 April 1438'},
    {'q': 'it was not hard to tell which the Emperor loved more', 'src': 'chronicle, “Of the Princes’ Mending” (the court’s reading)'}],
   primary=True, series='naval', window=['1420-01-01', '1443-01-01']),
 L('r1', 'S1370', 'GC', 'enabled', 'rule',
   'The Strait’s ending is what unlocked the decision at all.',
   [{'q': 'enables the decision Usher in the Golden Century, which starts the Golden Century situation', 'src': 'Trent’s screenshots of the event (14 September 1370)'}],
   group='conditions'),
 L('r2', 'REST1375', 'GC', 'required', 'rule', 'One of the decision’s conditions: al-Andalus restored.',
   [{'q': 'requires the Age of Discovery, independence, peace, solvency, al-Andalus restored, and Granada, Andalusia and Murcia owned by al-Andalus or its subjects', 'src': 'the decision, Trent’s screenshots, 7 August 1442'}],
   group='conditions'),
 L('r3', 'AOD1437', 'GC', 'required', 'rule', 'One of the decision’s conditions: the Age of Discovery.',
   [{'q': 'requires the Age of Discovery …', 'src': 'the decision, Trent’s screenshots, 7 August 1442'}], group='conditions'),
 L('r4', 'PEACE1432', 'GC', 'required', 'rule', 'One of the decision’s conditions: peace. The crusade was the last war before 1442.',
   [{'q': 'requires … peace', 'src': 'the decision, Trent’s screenshots, 7 August 1442'},
    {'q': 'no war in the saves of 10 October 1435, 16 January 1438 or 11 June 1442', 'src': 'checkpoints.json'}], group='conditions'),
 L('r5', 'IB1430', 'GC', 'prompted', 'court',
   'The proclamation speaks of an Iberia gathered under one banner, but that was not one of the game’s conditions: Granada, Andalusia and Murcia were enough.',
   [{'q': 'for the first time in centuries the call to prayer rises over an Iberia gathered under one banner', 'src': 'the game’s event text, 7 August 1442'}],
   group='conditions', flag='not-a-condition'),
 L('b2', 'DAR1432', 'SEA1438', 'shifted', 'save',
   'The temper’s swing to the sea quickened after the arsenals were laid down.',
   [{'q': 'under construction in the save of 1 May 1432, none begun in that of 1 October 1431', 'src': 'saves of 1 October 1431 and 1 May 1432'},
    {'q': 'land against sea: −27.3 (May 1432), −10.2 (1435), +1.1 (1438)', 'src': 'realm readings'}],
   primary=True, series='naval', window=['1426-01-01', '1440-01-01'],
   gap='The temper had already begun to turn in 1429–30 (−36.9 to −32.3), before the arsenals. The record doesn’t say what started it.',
   note='The saves show timing only. The arsenals’ listed effects do not include the drift toward the sea.'),
 L('b2b', 'CAT1436', 'SEA1438', 'shifted', 'save',
   'Harbours were going up in the newly annexed Catalan ports.',
   [{'q': 'protected harbours are being built in the newly annexed Catalan ports: Barcelona, Girona, Tarragona, Tortosa and Perpignan', 'src': 'saves of 10 October 1435 and 16 January 1438'}]),
 L('b2c', 'CAP1379', 'SEA1438', 'shifted', 'owner',
   'The move to the river and the sea began the turn outward.',
   [{'q': 'invest in the sea, set the Catalan shipwrights, now the Emperor’s subjects, to building a trading fleet, and move the capital to Ishbīliya', 'src': 'Trent’s account, 1379'}],
   flag='contested', series='naval', window=['1370-01-01', '1440-01-01'],
   note='The numbers disagree: the temper sat at −37.0 in 1379 and −36.9 in 1428. Whatever the move did, it did not show in the realm’s temper for fifty years.'),
 L('b3', 'CR1431', 'DAR1432', 'prompted', 'owner',
   'The arsenals were ordered in the middle of the crusade, to match the Genoese fleet.',
   [{'q': 'to build a navy that can match the Genoese fleet', 'src': 'Trent’s account and screenshot; save of 1 May 1432'}],
   primary=True),
 L('b4', 'SAN1430', 'CR1431', 'provoked', 'owner',
   'Destroying the shrine of Santiago brought the second crusade.',
   [{'q': 'Sparked by the destruction of Santiago, the Pope proclaims the second crusade against al-Andalus', 'src': 'Trent’s account and screenshot; save of 1 October 1431'}],
   primary=True),
 L('b5', 'PR1430', 'SAN1430', 'prompted', 'owner',
   'The princes talked the Emperor into Galicia instead of Castile, and the war plan was to take its capital.',
   [{'q': 'Galicia would be the nobler and harder conquest', 'src': 'Trent’s account, May 1430'},
    {'q': 'The war plan is as plain as the Emperor’s demand: take the capital. The armies march north on Santiago', 'src': 'Trent’s account and screenshots, June 1430'}],
   primary=True),
 # ---- reverse-view extras
 L('x1', 'T1375', 'SHIP1376', 'enabled', 'owner', 'The crown could send Catalan shipwrights abroad because Catalonia was now its own.',
   [{'q': 'the crown sends Catalan shipwrights to five Mamlūk ports', 'src': 'Trent’s account, December 1376'}]),
 L('x2', 'T1375', 'CAP1379', 'enabled', 'owner', 'The Catalan shipwrights, now the Emperor’s subjects, made a sea capital thinkable.',
   [{'q': 'set the Catalan shipwrights, now the Emperor’s subjects, to building a trading fleet', 'src': 'Trent’s account, 1379'}]),
 L('x3', 'S1370', 'MUR1370', 'enabled', 'rule', 'The Strait’s ending sped up the absorption of the ṭāʾifas.',
   [{'q': 'every ṭāʾifa being annexed gains 25% annexation progress', 'src': 'Trent’s screenshots of the event (14 September 1370)'}]),
 L('x4', 'T1375', 'CAT1436', 'continued', 'save', 'The ṭāʾifa of 1375 was taken into the crown sixty-one years later.',
   [{'q': 'Catalonia, a ṭāʾifa since 16 March 1375', 'src': 'Trent’s account, December 1428'}]),
]
LINKS = [l for l in LINKS if l['id'] != 'a6b']

CHAINS = [
 {'id': 'A', 'outcome': 'A0', 'question': 'Why was every estate but the burghers angry in June 1442?',
  'plainQuestion': 'Why was every estate but the burghers angry in June 1442?',
  'blurb': 'The umarāʾ’s long fall, from the assembly of 1442 back through three Jamāʿas to the Catalan privileges and the Strait.'},
 {'id': 'B', 'outcome': 'GC', 'question': 'Why did the Golden Century come with a fleet?',
  'blurb': 'The game’s own conditions for the Golden Century, and the sea strand behind the Thalassocracy, back to the fall of Santiago.'},
]

# the Catalan privileges and the wars on Aragon: the rhythm the suggester finds
RHYTHM = {
 'title': 'The Catalan privileges and Aragon',
 'rule': 'the reform “needs peace with Aragon” (eu5db.com, 1.4.5)',
 'spans': [['1337-04-01', '1339-05-24', 'on'], ['1339-05-24', '1342-08-14', 'off'], ['1342-08-14', '1346-11-08', 'on'],
           ['1346-11-08', '1410-09-01', 'off'], ['1410-09-01', '1443-06-26', 'on']],
 'marks': [
   {'date': '1339-05-24', 'what': 'war on Aragon declared; privileges lost the same day', 'ids': ['1339-05-24-war-on-aragon', '1339-05-24-catalan-privileges-lost'], 'basis': 'rule'},
   {'date': '1340-08-11', 'what': 'peace with Aragon; re-enacted 14 Aug 1340, in force 1342 after two years', 'ids': ['1340-08-11-peace-aragon', '1342-08-14-catalan-privileges-restored'], 'basis': 'rule'},
   {'date': '1346-10-18', 'what': 'Granada joins the war on the three crowns; privileges gone by the reading of 8 Nov 1346. No event records the loss: the suggester derives it from the readings.', 'ids': ['1346-10-18-granada-joins'], 'basis': 'derived'},
   {'date': '1375-03-16', 'what': 'Catalonia and Aragon become ṭāʾifas: war with them is no longer possible', 'ids': ['1375-03-16-two-new-taifas'], 'basis': 'rule'},
   {'date': '1410-09-01', 'what': 'privileges back, and for good', 'ids': ['1410-09-01-catalan-privileges-return'], 'basis': 'save'},
 ]}

# owner's workshop: real suggestions the heuristics raise on this data
SUGGEST = [
 {'id': 's1', 'heuristic': 'readings diff + rhythm', 'score': 0.92,
  'proposal': 'New derived event: “The Catalan Merchant Privileges lapse” (gone between the readings of 18 Oct and 8 Nov 1346).',
  'cause': rec('1346-10-18-granada-joins'), 'effect': {'id': '(derived) 1346-11-08 catalan_merchant_privileges removed', 'date': '1346-11-08', 'hijri': hijri('1346-11-08'), 'title': 'Catalan Merchant Privileges no longer among the reforms (reading of 8 November 1346)', 'source': 'realm-readings 1346-10-18 → 1346-11-08'},
  'kind': 'ended', 'basis': 'rule', 'why': 'The reform’s effects say it “needs peace with Aragon”; Aragon is on the other side of this war.'},
 {'id': 's2', 'heuristic': 'cause field', 'score': 0.88,
  'cause': rec('1385-10-28-al-qahira'), 'effect': rec('1386-01-06-the-season-passed'),
  'kind': 'ended', 'basis': 'owner', 'why': 'The effect’s record says: cause “the 30-day pause in al-Qāhira (28 October 1385)”.'},
 {'id': 's3', 'heuristic': 'estate reaction (same day) + cue word “after”', 'score': 0.81,
  'cause': rec('1402-08-burghers-privileges'), 'effect': rec('1402-08-the-umara'),
  'kind': 'provoked', 'basis': 'rule', 'why': 'The grant’s preview: “umara (nobles) −6.5% (to 33.6%)”; the effect’s title: “after the burghers’ privileges”.'},
 {'id': 's4', 'heuristic': 'departure from a held line, no cause yet', 'score': 0.7,
  'question': 'The umarāʾ sat at 45 to 48 from October 1431 to July 1432, above the 40 you hold them at. Why?',
  'cause': None, 'effect': {'id': '(departure) umarāʾ 1431-10 → 1432-07', 'date': '1431-10-01', 'hijri': hijri('1431-10-01'), 'title': 'umarāʾ satisfaction 45–48 against a held line of 40 (saves of 1 Oct 1431 to 27 Jul 1432)', 'source': 'checkpoints.json'},
  'candidates': [rec('1431-10-01-the-second-crusade'), rec('1430-11-03-iberia-is-conquered')],
  'kind': None, 'basis': None, 'why': 'Nothing in the record explains it. Pick a candidate, or write the reason (for example a tax rate lowered for the war).'},
 {'id': 's5', 'heuristic': 'co-cited in “Of the Princes’ Mending”', 'score': 0.44,
  'cause': rec('1440-10-01-the-palace-city-of-qurtuba'), 'effect': rec('1442-08-07-the-golden-century'),
  'kind': 'enabled', 'basis': 'court', 'why': 'Cited together in one chronicle entry: “the new age had been given both its symbols at once”. That is a reading, not a cause.'},
 {'id': 's6', 'heuristic': 'co-cited in “Of the Spring of the Year 737”', 'score': 0.12,
  'cause': rec('1337-04-03-death-fatima'), 'effect': rec('1337-04-22-joins-tlemcen-war'),
  'kind': 'enabled', 'basis': 'court', 'why': 'Cited together in one chronicle entry, nineteen days apart. Probably just neighbours.'},
]

DATA = {'nodes': NODES, 'links': LINKS, 'chains': CHAINS, 'series': SERIES, 'rhythm': RHYTHM,
        'suggest': SUGGEST, 'reverseRoot': 'S1370'}
# sanity: every link endpoint exists, causes precede effects
for l in LINKS:
    assert l['cause'] in NODES and l['effect'] in NODES, l['id']
    assert NODES[l['cause']]['date'] <= NODES[l['effect']]['date'], (l['id'], NODES[l['cause']]['date'], NODES[l['effect']]['date'])
blob = json.dumps(DATA, ensure_ascii=False, separators=(',', ':'))
html = open(TPL).read().replace('/*__DATA__*/null', blob)
open(OUT, 'w').write(html)
print('nodes', len(NODES), 'links', len(LINKS), 'bytes', len(blob))
