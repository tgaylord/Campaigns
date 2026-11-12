/* A small Markdown for tellings: paragraphs, lists, bold, italic, and links to people. Nothing else is needed. */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function inline(s: string, names: (id: string) => boolean): string {
  return esc(s)
    .replace(/\[([^\]]+)\]\((person|place|war):([a-z0-9-]+)\)/g, (_m, text: string, kind: string, id: string) =>
      kind === "person" && names(id) ? `<a href="#who-${id}">${text}</a>` : kind === "war" ? `<a href="#thread-${id}">${text}</a>` : text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
}

export function md(src: string, names: (id: string) => boolean = () => false): { html: string; verse: string | null } {
  const blocks = src.trim().split(/\n{2,}/);
  let verse: string | null = null;
  const last = blocks.at(-1) ?? "";
  if (/^\*[^*][\s\S]*\*$/.test(last) && !last.slice(1, -1).includes("*")) { verse = esc(last.slice(1, -1)); blocks.pop(); }
  const html = blocks.map((b) => {
    const lines = b.split("\n");
    if (lines.every((l) => /^\s*- /.test(l) || /^\s{2,}\S/.test(l))) {
      let out = "<ul>", depth = 0;
      for (const l of lines) {
        const m = l.match(/^(\s*)- (.*)$/);
        if (!m) { out = out.replace(/<\/li>$/, "") + " " + inline(l.trim(), names) + "</li>"; continue; }
        const d = m[1].length >= 2 ? 1 : 0;
        if (d > depth) out = out.replace(/<\/li>$/, "") + "<ul>";
        if (d < depth) out += "</ul></li>";
        depth = d;
        out += `<li>${inline(m[2], names)}</li>`;
      }
      return out + (depth ? "</ul></li>" : "") + "</ul>";
    }
    return `<p>${inline(lines.join(" "), names)}</p>`;
  }).join("");
  return { html, verse };
}
