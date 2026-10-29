// b2t: convert an EU5 binary gamestate into Jomini-style text.
//
// usage: b2t <gamestate> <string_lookup> <tokens.txt> <out.txt>
//
//   gamestate      the binary "gamestate" member of the .eu5 zip
//   string_lookup  the "string_lookup" member of the same zip
//   tokens.txt     token table, one "hexid name" per line (e.g. tokens-1.3.11.txt)
//   out.txt        text output
//
// Unknown field tokens are written as T_xxxx (hex id), unresolved string
// lookups as LOOKUP_n. On success it prints the number of lookups and the
// final brace depth (0 means the file was balanced) to stderr.
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

static char *names[65536];
static char **lk; static int nlk;
static uint8_t *b; static long n, pos;
static FILE *o;

// Byte length of a value token's payload, or -1 if t is not a value type
// (i.e. it is a field-name token, a brace or '=').
static int vlen(uint16_t t, const uint8_t *p) {
  switch (t) {
    case 0x000c: case 0x000d: case 0x0014: return 4;      // i32 / f32 / u32
    case 0x000e: return 1;                                // bool
    case 0x000f: case 0x0017: return 2 + (p[0] | (p[1] << 8)); // quoted / unquoted string
    case 0x0167: case 0x029c: case 0x0317: return 8;      // f64? / u64 / i64
    case 0x0d40: return 1; case 0x0d3e: case 0x0d44: return 2; case 0x0d41: return 3; // string-lookup index
    case 0x0d47: return 0;                                // fixed-point zero
  }
  if (t >= 0x0d48 && t <= 0x0d4e) return t - 0x0d47;     // positive fixed-point, 1..7 bytes
  if (t >= 0x0d4f && t <= 0x0d55) return t - 0x0d4e;     // negative fixed-point, 1..7 bytes
  return -1;
}

static const int mdays[12] = {31,28,31,30,31,30,31,31,30,31,30,31};
// Dates are hours since year -5000 on a 365-day calendar.
static void put_date(int32_t v) {
  int h = v % 24; int days = v / 24; int y = days / 365 - 5000; int d = days % 365; int m = 0;
  while (d >= mdays[m]) { d -= mdays[m]; m++; }
  if (h) fprintf(o, "%d.%d.%d.%d", y, m + 1, d + 1, h); else fprintf(o, "%d.%d.%d", y, m + 1, d + 1);
}

// Fixed-point values carry five decimal places.
static void put_fixed(uint64_t mag, int neg) {
  char buf[64]; uint64_t ip = mag / 100000, fp = mag % 100000;
  if (fp == 0) { sprintf(buf, "%s%llu", neg ? "-" : "", (unsigned long long)ip); }
  else {
    sprintf(buf, "%s%llu.%05llu", neg ? "-" : "", (unsigned long long)ip, (unsigned long long)fp);
    int L = strlen(buf); while (buf[L - 1] == '0') buf[--L] = 0;
  }
  fputs(buf, o);
}

static void put_str(const uint8_t *s, int L, int quoted) {
  if (quoted) fputc('"', o);
  fwrite(s, 1, L, o);
  if (quoted) fputc('"', o);
}

// Write the value whose type token t has just been read; advance pos past it.
static void put_value(uint16_t t) {
  const uint8_t *p = b + pos; int L = vlen(t, p);
  switch (t) {
    case 0x000c: { int32_t v; memcpy(&v, p, 4);
      // i32 in this range is treated as a date (years ~0..2000); a guess, see README
      if (v >= 43800000 && v <= 61320000) put_date(v); else fprintf(o, "%d", v); break; }
    case 0x0014: { uint32_t v; memcpy(&v, p, 4); fprintf(o, "%u", v); break; }
    case 0x000d: { float v; memcpy(&v, p, 4); fprintf(o, "%g", v); break; }
    case 0x000e: fputs(p[0] ? "yes" : "no", o); break;
    case 0x000f: put_str(p + 2, p[0] | (p[1] << 8), 1); break;
    case 0x0017: put_str(p + 2, p[0] | (p[1] << 8), 0); break;
    case 0x0167: { int64_t v; memcpy(&v, p, 8); fprintf(o, "F64_%lld", (long long)v); break; } // raw; meaning unknown
    case 0x029c: { uint64_t v; memcpy(&v, p, 8); fprintf(o, "%llu", (unsigned long long)v); break; }
    case 0x0317: { int64_t v; memcpy(&v, p, 8); fprintf(o, "%lld", (long long)v); break; }
    case 0x0d40: case 0x0d3e: case 0x0d41: case 0x0d44: {
      uint32_t idx = 0; for (int k = 0; k < L; k++) idx |= (uint32_t)p[k] << (8 * k);
      if (idx < (uint32_t)nlk) {
        const char *q = lk[idx]; int ident = *q != 0;
        for (const char *c = q; *c; c++)
          if (!((*c>='a'&&*c<='z')||(*c>='A'&&*c<='Z')||(*c>='0'&&*c<='9')||*c=='_'||*c=='.'||*c=='-'||*c==':')) { ident = 0; break; }
        if (ident) fputs(q, o); else { fputc('"', o); fputs(q, o); fputc('"', o); }
      } else fprintf(o, "LOOKUP_%u", idx);
      break; }
    default:
      if (t >= 0x0d47 && t <= 0x0d55) {
        uint64_t mag = 0; for (int k = 0; k < L; k++) mag |= (uint64_t)p[k] << (8 * k);
        put_fixed(mag, t >= 0x0d4f);
      }
  }
  pos += L;
}

static uint16_t peek(long at) { return at + 2 <= n ? (b[at] | (b[at + 1] << 8)) : 0xffff; }

// Entries of a "database={ ... }" block are written one tab shallower than
// their nesting depth, to match the layout of the game's own text saves.
static int ded[4096];
static int dedtot(int d) { int t = 0; for (int i = 0; i <= d && i < 4096; i++) t += ded[i]; return t; }
static void indent(int d) { int x = d - dedtot(d); for (int i = 0; i < x; i++) fputc('\t', o); }
static int last_key_db = 0;

static uint8_t *slurp(const char *path, long *len) {
  FILE *f = fopen(path, "rb");
  if (!f) { fprintf(stderr, "b2t: cannot open %s\n", path); exit(2); }
  fseek(f, 0, SEEK_END); *len = ftell(f); fseek(f, 0, SEEK_SET);
  uint8_t *buf = malloc(*len ? *len : 1);
  if (!buf || fread(buf, 1, *len, f) != (size_t)*len) { fprintf(stderr, "b2t: cannot read %s\n", path); exit(2); }
  fclose(f);
  return buf;
}

int main(int argc, char **argv) {
  if (argc != 5) {
    fprintf(stderr, "usage: b2t <gamestate> <string_lookup> <tokens.txt> <out.txt>\n");
    return 1;
  }
  b = slurp(argv[1], &n);

  // string_lookup: 5-byte header, then (u16 length, bytes) records
  long sn; uint8_t *s = slurp(argv[2], &sn);
  int cap = 200000; lk = malloc(sizeof(char *) * cap); long i = 5;
  while (i + 2 <= sn) {
    int L = s[i] | (s[i + 1] << 8); i += 2;
    if (nlk == cap) { cap *= 2; lk = realloc(lk, sizeof(char *) * cap); }
    lk[nlk] = malloc(L + 1); memcpy(lk[nlk], s + i, L); lk[nlk][L] = 0; nlk++; i += L;
  }

  FILE *f = fopen(argv[3], "r");
  if (!f) { fprintf(stderr, "b2t: cannot open token table %s\n", argv[3]); return 2; }
  { char line[512]; while (fgets(line, sizeof line, f)) { unsigned id; char nm[400]; if (sscanf(line, "%x %399s", &id, nm) == 2 && id < 65536) names[id] = strdup(nm); } }
  fclose(f);

  o = fopen(argv[4], "w");
  if (!o) { fprintf(stderr, "b2t: cannot write %s\n", argv[4]); return 2; }
  setvbuf(o, NULL, _IOFBF, 1 << 22);

  int depth = 0;
  pos = 0;
  while (pos + 2 <= n) {
    uint16_t t = peek(pos); pos += 2;
    if (t == 0x0003) { fputs("{\n", o); depth++; if (depth < 4096) ded[depth] = last_key_db ? 2 : 0; last_key_db = 0; continue; }
    if (t == 0x0004) { if (depth < 4096) ded[depth] = 0; depth--; indent(depth); fputs("}\n", o); continue; }
    if (t == 0x0001) { fputc('=', o); continue; }
    // Anything else is a key or a value. It is a key if '=' follows it.
    int isval = vlen(t, b + pos) >= 0;
    long q = pos + (isval ? vlen(t, b + pos) : 0);
    int next_is_eq = (peek(q) == 0x0001);
    if (next_is_eq) indent(depth);
    if (isval) put_value(t);
    else if (names[t]) fputs(names[t], o);
    else fprintf(o, "T_%04x", t);
    last_key_db = (next_is_eq && !isval && names[t] && strcmp(names[t], "database") == 0);
    if (!next_is_eq) {
      // a value or bare list element; a following '{' (rgb { ... }, LIST { ... }) stays on this line
      if (peek(pos) == 0x0003) fputc(' ', o);
      else fputc('\n', o);
    }
  }
  fclose(o);
  fprintf(stderr, "done, %d lookups, depth %d\n", nlk, depth);
  return 0;
}
