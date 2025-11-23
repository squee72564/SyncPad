import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.spec.ts", "src/**/*.test.ts", "src/__tests__/**/*.ts"],
    coverage: {
      reporter: ["text", "lcov"],
      exclude: [
        "src/config/**",
        "src/lib/prisma.ts",
        "src/server.ts",
        "src/types/**",
        "src/utils/ApiError.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@generated": path.resolve(__dirname, "../prisma/generated"),
    },
  },
});
