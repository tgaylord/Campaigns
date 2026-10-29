import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import { remarkEntityLinks } from "./src/lib/remark-entity-links.mjs";

// Published at https://tgaylord.github.io/Campaigns/eu5-nasrid/
const BASE = "/Campaigns/eu5-nasrid";

export default defineConfig({
  site: "https://tgaylord.github.io",
  base: BASE,
  trailingSlash: "always",
  markdown: {
    processor: unified({ remarkPlugins: [[remarkEntityLinks, { base: BASE }]] }),
  },
});
