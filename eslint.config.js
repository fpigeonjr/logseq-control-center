import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import sveltePlugin from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  // Base JS rules
  eslint.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // Node environment for server/indexer files
  {
    files: ["src/server/**/*.ts", "src/indexer/**/*.ts", "src/shared/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Svelte component files — browser environment
  {
    files: ["**/*.svelte"],
    plugins: { svelte: sveltePlugin },
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
      },
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      ...sveltePlugin.configs.recommended.rules,
      // @typescript-eslint/no-unused-vars can't see Svelte template usage
      // eslint-plugin-svelte handles variable checking for .svelte files
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
    },
  },

  // Web TS files (stores, lib helpers) — browser environment
  {
    files: ["src/web/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // Test files — node + browser globals
  {
    files: ["src/**/__tests__/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },

  // Project-wide rule overrides
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
    },
  },

  // Prettier owns formatting
  prettierConfig,

  // Final override: re-disable TS unused-vars for Svelte files
  // (must come after the global rules block above)
  {
    files: ["**/*.svelte"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
    },
  },

  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
    ],
  }
);
