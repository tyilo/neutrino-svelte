import { defineConfig } from "vite";
import svelte from "@sveltejs/vite-plugin-svelte";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/GameDetail_init.ts"),
      name: "GameDetail",
    },
  },
});
