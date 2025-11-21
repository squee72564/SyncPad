import js from "@eslint/js";
import globals from "globals";
import tseslint, {} from "typescript-eslint";
import prettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";
export default defineConfig([
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "src/db/generated/**",
      "prisma/generated/**",
      "coverage/**",
      "*.config.js",              // ecosystem.config.js, etc.
      "**/*.log",                 // Log files
      ".husky/**",                // Git hooks
      "pnpm-lock.yaml",
      "package-lock.json",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: {
      js,
    },
    languageOptions: { globals: globals.browser },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_",
        },
      ],
    }
  },
  prettier,
]);
