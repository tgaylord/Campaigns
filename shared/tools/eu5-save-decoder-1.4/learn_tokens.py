#!/usr/bin/env python3
"""Learn token id -> field name by aligning a decoded binary save with a text save.

usage:
  learn_tokens.py TEXT_DIR BIN_DIR OUT_TOKENS [--seed TOKENS]

  TEXT_DIR    a text (debug-mode) save split by decode.py
  BIN_DIR     a compressed save of the same moment (or a few days apart),
              decoded by decode.py with an EMPTY token table
              (--tokens /dev/null), so every field shows as T_xxxx and
              every token gets votes
  OUT_TOKENS  where to write the learned table ("hexid name" per line);
              OUT_TOKENS.votes.json gets the top candidates for every token
  --seed      an existing table; known tokens help the aligner match lists
              whose lengths differ, so later passes resolve more. Seed
              entries are kept in the output unless the votes say otherwise

How it works: both saves are parsed into trees. Sections are paired by
position (both saves list the same top-level sections in the same order).
Small sections are aligned whole; for large database sections, up to 2,500
entries with the same numeric id in both saves are aligned one by one. Within
a block, children are matched by sequence alignment on (key, kind) signatures,
and every unresolved T_xxxx key or value that lines up with a name in the text
save gets a vote. A token is written out when one name has at least 60% of
its votes.

Run it a few times, feeding each output back in as --seed, and check the
result by decoding again and comparing with the text save.
"""
import argparse, collections, difflib, json, os, random, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from jomini import parse

TOK = re.compile(r'^T_[0-9a-f]{4}$')
def istok(x): return isinstance(x, str) and TOK.match(x) is not None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('text_dir'); ap.add_argument('bin_dir'); ap.add_argument('out')
    ap.add_argument('--seed', help='existing token table to start from')
    ap.add_argument('--entries', type=int, default=2500, help='entries sampled per large section')
    a = ap.parse_args()

    known = {}
    if a.seed:
        for line in open(a.seed):
            p = line.split()
            if len(p) == 2: known['T_' + p[0]] = p[1]

    TI = json.load(open(os.path.join(a.text_dir, 'index.json')))
    BI = json.load(open(os.path.join(a.bin_dir, 'index.json')))
    if len(TI) != len(BI):
        print(f'warning: {len(TI)} text sections vs {len(BI)} binary sections; pairing by position', file=sys.stderr)
    votes = collections.defaultdict(collections.Counter)

    def kind(v):
        if isinstance(v, list): return 'B'
        if isinstance(v, tuple): return 'C'
        return 'S'

    def sig(item, side):
        k, v = item
        if k is None: kk = '_'
        elif side == 'b' and istok(k): kk = known.get(k, '?')
        elif re.match(r'^-?\d+$', k): kk = '#'
        else: kk = k
        return (kk, kind(v))

    def vote(bv, tv, w=1):
        if istok(bv) and tv and not istok(tv) and not re.match(r'^-?[\d.]+$', tv):
            votes[bv][tv] += w

    def align(T, B, depth=0):
        if depth > 40: return
        if len(T) == len(B):
            pairs = list(zip(T, B))
        else:
            st = [sig(x, 't') for x in T]; sb = [sig(x, 'b') for x in B]
            if not known:
                coarse = lambda s: (('#' if s[0] == '#' else '_' if s[0] == '_' else 'k'), s[1])
                st = [coarse(s) for s in st]; sb = [coarse(s) for s in sb]
            sm = difflib.SequenceMatcher(None, st, sb, autojunk=False)
            pairs = []
            for op, i1, i2, j1, j2 in sm.get_opcodes():
                if op == 'equal' or (op == 'replace' and i2 - i1 == j2 - j1):
                    pairs += list(zip(T[i1:i2], B[j1:j2]))
        for (tk, tv), (bk, bv) in pairs:
            if tk is not None and bk is not None:
                if istok(bk): vote(bk, tk)
                elif bk != tk and not (re.match(r'^-?\d+$', tk) and re.match(r'^-?\d+$', bk)):
                    continue
            if isinstance(tv, list) and isinstance(bv, list):
                align(tv, bv, depth + 1)
            elif isinstance(tv, str) and isinstance(bv, str):
                vote(bv, tv)

    def section_text(d, key):
        safe = re.sub(r'[^A-Za-z0-9_.-]', '_', key)
        return open(os.path.join(d, safe + '.txt'), encoding='utf8', errors='replace').read()

    def entries(text):
        res = {}
        for m in re.finditer(r'(?:\n\t*|\})(\d+)=\{', text):
            res.setdefault(int(m.group(1)), m.start(1))
        return res

    def block_at(text, s):
        j = text.find('{', s); d = 0
        for m in re.finditer(r'"(?:[^"\\]|\\.)*"|[{}]', text[j:j + 3_000_000]):
            if m.group(0) == '{': d += 1
            elif m.group(0) == '}':
                d -= 1
                if d == 0: return text[s:j + m.end()]
        return None

    random.seed(1)
    for i, (tk, to, te) in enumerate(TI):
        if i >= len(BI): break
        bk = BI[i][0]
        vote(bk, tk, 100)  # the section name itself
        if te - to < 4_000_000:
            align(parse(section_text(a.text_dir, tk)), parse(section_text(a.bin_dir, bk)))
        else:
            T = section_text(a.text_dir, tk); B = section_text(a.bin_dir, bk)
            et = entries(T); eb = entries(B)
            common = list(set(et) & set(eb)); random.shuffle(common)
            n = 0
            for cid in common[:a.entries]:
                x = block_at(T, et[cid]); y = block_at(B, eb[cid])
                if x and y:
                    try: align(parse(x), parse(y)); n += 1
                    except Exception: pass
            print(f'  {tk}: {len(common)} common entries, aligned {n}', file=sys.stderr)
        print(f'{tk} done, tokens voted so far {len(votes)}', file=sys.stderr)

    nconf = 0
    with open(a.out, 'w') as f:
        merged = dict((k[2:], v) for k, v in known.items())
        for bt, c in sorted(votes.items()):
            name, cnt = c.most_common(1)[0]
            if cnt / sum(c.values()) >= 0.6:
                merged[bt[2:]] = name; nconf += 1
        for k in sorted(merged):
            f.write(f'{k} {merged[k]}\n')
    print(f'tokens with votes {len(votes)}, confident {nconf}, table size {len(merged)}', file=sys.stderr)
    json.dump({bt: c.most_common(5) for bt, c in votes.items()}, open(a.out + '.votes.json', 'w'))


if __name__ == '__main__':
    main()
