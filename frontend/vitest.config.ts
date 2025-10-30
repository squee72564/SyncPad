import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    include: [
      "__tests__/**/*.{ts,tsx}"
    ],
    coverage: {
      reporter: ["text", "lcov"],
      exclude: ["next.config.ts", "postcss.config.mjs", "components.json"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
