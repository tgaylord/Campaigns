#!/usr/bin/env node
/* Turns dist/index.html into dist/register.html, the page fragment a claude.ai artifact wants (no doctype, head or body). */
import fs from "node:fs";
import path from "node:path";
const dist = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "dist");
const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const title = html.match(/<title>[\s\S]*?<\/title>/)[0];
const styles = [...html.matchAll(/<style[\s\S]*?<\/style>/g)].map((m) => m[0]).join("\n");
const scripts = [...html.matchAll(/<script[\s\S]*?<\/script>/g)].map((m) => m[0]).join("\n");
fs.writeFileSync(path.join(dist, "register.html"), `${title}\n<meta name="claude:viewport-fit-sides" content="cover">\n${styles}\n<div id="root"></div>\n${scripts}\n`);
console.log("dist/register.html", Math.round(fs.statSync(path.join(dist, "register.html")).size / 1024), "KB");
