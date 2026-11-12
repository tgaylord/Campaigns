import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
// One self-contained HTML file: the data, the fonts and the code travel together.
export default defineConfig({ plugins: [react(), viteSingleFile()], build: { assetsInlineLimit: 100000000, chunkSizeWarningLimit: 100000 } });
