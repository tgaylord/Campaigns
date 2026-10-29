// GitHub Pages serves 404.html for unknown paths; making it a copy of the app
// lets deep links like /wars/some-war load the app, which then routes itself.
import { copyFile } from "node:fs/promises";
await copyFile(new URL("../dist/index.html", import.meta.url), new URL("../dist/404.html", import.meta.url));
