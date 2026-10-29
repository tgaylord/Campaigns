#!/usr/bin/env python3
"""Decode an EU5 save (.eu5) into Jomini-style text, split into top-level sections.

usage:
  decode.py SAVE.eu5 OUT_DIR [--tokens FILE] [--b2t PATH] [--whole]

Compressed (binary) saves: the .eu5 file is a short header followed by a zip
holding two members, `gamestate` (binary tokens) and `string_lookup` (a string
table). The gamestate is converted to text with `b2t` and the token table.

Text (debug-mode) saves: the .eu5 file is already text and is only split.

Output, in OUT_DIR:
  index.json        [[section, start, end], ...] byte offsets into the text
  <section>.txt     one file per top-level section (countries.txt, war_manager.txt, ...)
  gamestate.txt     the whole text, only with --whole

Nothing is written outside OUT_DIR except a temporary directory that is removed.
"""
import argparse, io, json, mmap, os, re, shutil, subprocess, sys, tempfile, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))


def find_zip(path):
    """Return the offset of the embedded zip, or None for a text save."""
    with open(path, 'rb') as f:
        head = f.read(8 * 1024 * 1024)
    i = head.find(b'PK\x03\x04')
    return i if i >= 0 else None


def is_binary(path):
    with open(path, 'rb') as f:
        start = f.read(64)
    # Text gamestates start with a key such as "metadata="; binary ones with a 2-byte token.
    return not re.match(rb'\s*[A-Za-z_]', start)


def split_sections(text_path, out_dir):
    """Split a Jomini text file into its depth-0 sections, respecting quoted strings."""
    os.makedirs(out_dir, exist_ok=True)
    with open(text_path, 'rb') as fh:
        m = mmap.mmap(fh.fileno(), 0, access=mmap.ACCESS_READ)
        tok = re.compile(rb'"(?:[^"\\]|\\.)*"|\{|\}|\n(?=[A-Za-z_0-9])')
        depth = 0
        starts = [0] if re.match(rb'[A-Za-z_0-9]', m[:1]) else []
        for t in tok.finditer(m):
            s = t.group(0)
            if s == b'{': depth += 1
            elif s == b'}': depth -= 1
            elif s == b'\n' and depth == 0: starts.append(t.start() + 1)
        idx = []
        for i, o in enumerate(starts):
            e = starts[i + 1] if i + 1 < len(starts) else len(m)
            key = m[o:o + 80].split(b'=')[0].split(b'\n')[0].decode('utf8', 'replace').strip()
            if not key: continue
            idx.append((key, o, e))
        for k, o, e in idx:
            safe = re.sub(r'[^A-Za-z0-9_.-]', '_', k)
            with open(os.path.join(out_dir, safe + '.txt'), 'wb') as w:
                w.write(m[o:e])
        m.close()
    with open(os.path.join(out_dir, 'index.json'), 'w') as f:
        json.dump(idx, f)
    return idx


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('save', help='path to the .eu5 save')
    ap.add_argument('out_dir', help='directory to write the sections into')
    ap.add_argument('--tokens', default=os.path.join(HERE, 'tokens-1.3.11.txt'),
                    help='token table (default: tokens-1.3.11.txt next to this script)')
    ap.add_argument('--b2t', default=os.path.join(HERE, 'b2t'),
                    help='path to the compiled b2t converter (default: ./b2t next to this script; run make)')
    ap.add_argument('--whole', action='store_true', help='also keep the whole decoded text as gamestate.txt')
    a = ap.parse_args()

    os.makedirs(a.out_dir, exist_ok=True)
    zoff = find_zip(a.save)
    tmp = tempfile.mkdtemp(prefix='eu5dec_')
    try:
        if zoff is None:
            text = a.save
            print('text save: splitting only', file=sys.stderr)
        else:
            with open(a.save, 'rb') as f:
                f.seek(zoff)
                zipfile.ZipFile(io.BytesIO(f.read())).extractall(tmp)
            gs = os.path.join(tmp, 'gamestate')
            if is_binary(gs):
                if not os.path.exists(a.b2t):
                    sys.exit(f'b2t not found at {a.b2t}; build it with make, or pass --b2t')
                text = os.path.join(tmp, 'gamestate.txt')
                subprocess.run([a.b2t, gs, os.path.join(tmp, 'string_lookup'), a.tokens, text], check=True)
                os.remove(gs)
            else:
                text = gs
        idx = split_sections(text, a.out_dir)
        if a.whole:
            shutil.copyfile(text, os.path.join(a.out_dir, 'gamestate.txt'))
        meta = os.path.join(a.out_dir, 'metadata.txt')
        ver = None
        if os.path.exists(meta):
            mv = re.search(r'version="([^"]*)"', open(meta, encoding='utf8', errors='replace').read(4000))
            ver = mv and mv.group(1)
        print(f'{len(idx)} sections written to {a.out_dir}' + (f' (game version {ver})' if ver else ''), file=sys.stderr)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    main()
