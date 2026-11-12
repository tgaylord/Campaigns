#!/usr/bin/env python3
"""The session log: what each sitting added to the record.

A sitting is the work of one day (in Trent's time zone, America/New_York) in this campaign's git
history. For each one the log compares the record at the end of that sitting with the record at the
end of the one before, and lists what is new: chronicle entries (and the player's notes), checkpoints,
people, events, wars, places. It also gives the span of campaign years the sitting reached, and the
Claude sessions (from the commits' Claude-Session trailers) that did the work.

The last sitting is read from the working tree, so that running this just before a commit puts the
work being committed into the log: if the tree has changes, they belong to today's sitting.

    python3 tools/sessions.py            # writes data/sessions.json

Run it from the campaign folder or anywhere; it finds the repository itself.
"""
import json
import os
import re
import subprocess
from collections import OrderedDict
from datetime import datetime
from zoneinfo import ZoneInfo

HERE = os.path.dirname(os.path.abspath(__file__))
CAMPAIGN = os.path.dirname(HERE)
FOLDER = os.path.basename(CAMPAIGN)
REPO = subprocess.run(['git', 'rev-parse', '--show-toplevel'], cwd=CAMPAIGN, capture_output=True, text=True, check=True).stdout.strip()
TZ = ZoneInfo('America/New_York')
OUT = os.path.join(CAMPAIGN, 'data', 'sessions.json')


def git(*args):
    return subprocess.run(['git', *args], cwd=REPO, capture_output=True, text=True, check=True).stdout


# ---------------------------------------------------------------- reading the record at a commit

def files_at(rev, sub):
    """Names of the files under <campaign>/<sub> at a commit (rev=None: the working tree)."""
    if rev is None:
        d = os.path.join(CAMPAIGN, sub)
        return sorted(os.listdir(d)) if os.path.isdir(d) else []
    out = git('ls-tree', '--name-only', f'{rev}:{FOLDER}/{sub}') if has_path(rev, sub) else ''
    return sorted(x for x in out.splitlines() if x)


def has_path(rev, sub):
    return subprocess.run(['git', 'cat-file', '-e', f'{rev}:{FOLDER}/{sub}'], cwd=REPO, capture_output=True).returncode == 0


def read_at(rev, sub):
    if rev is None:
        p = os.path.join(CAMPAIGN, sub)
        return open(p, encoding='utf8').read() if os.path.exists(p) else None
    if not has_path(rev, sub):
        return None
    return git('show', f'{rev}:{FOLDER}/{sub}')


def ids_in(rev, sub):
    t = read_at(rev, sub)
    if not t:
        return {}
    try:
        return {x['id']: x for x in json.loads(t) if isinstance(x, dict) and 'id' in x}
    except json.JSONDecodeError:
        return {}


def record_at(rev):
    """Everything the log compares, at one point in history."""
    story = [f[:-3] for f in files_at(rev, 'story') if f.endswith('.md')]
    snaps = [f[:-5] for f in files_at(rev, 'data/snapshots') if f.endswith('.json')]
    events = {}
    for f in files_at(rev, 'data/events'):
        if f.endswith('.json'):
            events.update(ids_in(rev, f'data/events/{f}'))
    return {
        'story': set(story), 'snapshots': set(snaps), 'events': events,
        'people': ids_in(rev, 'data/people.json'), 'wars': ids_in(rev, 'data/wars.json'),
        'places': ids_in(rev, 'data/gazetteer.json'),
    }


# ---------------------------------------------------------------- the story's own dates

def story_front(rev, sid):
    t = read_at(rev, f'story/{sid}.md') or ''
    m = re.match(r'---\n(.*?)\n---', t, re.S)
    fm = m.group(1) if m else ''
    get = lambda k: (re.search(rf'^{k}:\s*(.+)$', fm, re.M) or [None, None])[1]
    return {'id': sid, 'title': (get('title') or sid).strip().strip('"'), 'date': (get('date') or '').strip(),
            'kind': (get('kind') or 'chronicle').strip()}


# ---------------------------------------------------------------- sittings

def commits():
    """The campaign's commits, oldest first: (hash, local date, subject, session ids)."""
    fmt = '%H%x1f%aI%x1f%s%x1f%(trailers:key=Claude-Session,valueonly,separator=%x1e)%x1d'
    out = git('log', '--reverse', f'--format={fmt}', '--', FOLDER)
    res = []
    for rec in out.split('\x1d'):
        rec = rec.strip('\n')
        if not rec:
            continue
        h, when, subj, sess = rec.split('\x1f')
        day = datetime.fromisoformat(when).astimezone(TZ).date().isoformat()
        ids = [s.strip().rsplit('/', 1)[-1] for s in sess.split('\x1e') if s.strip()]
        res.append((h, day, subj, ids))
    return res


def dirty():
    return bool(git('status', '--porcelain', '--', FOLDER).strip())


def main():
    cs = commits()
    days = OrderedDict()
    for h, day, subj, ids in cs:
        d = days.setdefault(day, {'commits': [], 'sessions': []})
        d['commits'].append((h, subj))
        for i in ids:
            if i not in d['sessions']:
                d['sessions'].append(i)
    today = datetime.now(TZ).date().isoformat()
    if dirty():
        days.setdefault(today, {'commits': [], 'sessions': []})['working'] = True

    log = []
    before = {'story': set(), 'snapshots': set(), 'events': {}, 'people': {}, 'wars': {}, 'places': {}}
    for n, (day, d) in enumerate(days.items()):
        last = n == len(days) - 1
        rev = None if (last and d.get('working')) else d['commits'][-1][0]
        now = record_at(rev)
        new_story = sorted(now['story'] - before['story'])
        entries = [story_front(rev, s) for s in new_story]
        new_snaps = sorted(now['snapshots'] - before['snapshots'])
        new_events = sorted(set(now['events']) - set(before['events']))
        new_people = sorted(set(now['people']) - set(before['people']))
        new_wars = sorted(set(now['wars']) - set(before['wars']))
        new_places = sorted(set(now['places']) - set(before['places']))
        dates = [e['date'] for e in entries if e['date']] + new_snaps + [now['events'][i].get('date', '') for i in new_events]
        dates = sorted(x for x in dates if re.match(r'^\d{4}-\d{2}-\d{2}$', x))
        log.append({
            'id': day,
            'date': day,
            'commits': len(d['commits']),
            'firstCommit': d['commits'][0][0][:7] if d['commits'] else None,
            'lastCommit': d['commits'][-1][0][:7] if d['commits'] else None,
            'uncommitted': bool(rev is None),
            'claudeSessions': d['sessions'],
            'headlines': [s for _, s in d['commits']][-12:],
            'reached': {'from': dates[0], 'to': dates[-1]} if dates else None,
            'entries': [e['id'] for e in entries if e['kind'] != 'ooc'],
            'notes': [e['id'] for e in entries if e['kind'] == 'ooc'],
            'checkpoints': new_snaps,
            'people': new_people,
            'wars': new_wars,
            'places': new_places,
            'events': len(new_events),
            'removed': {
                'entries': sorted(before['story'] - now['story']),
                'checkpoints': sorted(before['snapshots'] - now['snapshots']),
                'people': sorted(set(before['people']) - set(now['people'])),
            },
        })
        before = now

    text = json.dumps(log, ensure_ascii=False, indent=1) + '\n'
    open(OUT, 'w', encoding='utf8').write(text)
    tot = lambda k: sum(len(s[k]) for s in log)
    print(f'{len(log)} sittings: {tot("entries")} entries, {tot("notes")} notes, {tot("checkpoints")} checkpoints, '
          f'{tot("people")} people, {sum(s["events"] for s in log)} events -> {os.path.relpath(OUT, CAMPAIGN)}')


if __name__ == '__main__':
    main()
