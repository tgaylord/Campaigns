import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Published at https://tgaylord.github.io/Campaigns/eu5-nasrid/
export default defineConfig({
  base: "/Campaigns/eu5-nasrid/",
  plugins: [react()],
});
