import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import sveltePlugin from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  // Base JS rules
  eslint.configs.recommended,

  // TypeScript rules (non-type-checked for speed; upgrade to type-checked later)
  ...tseslint.configs.recommended,

  // Svelte files
  {
    files: ["**/*.svelte"],
    plugins: { svelte: sveltePlugin },
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      ...sveltePlugin.configs.recommended.rules,
    },
  },

  // Project-wide rule overrides
  {
    rules: {
      // Allow unused vars prefixed with _ (common in TS destructuring)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // LogSeq data comes in as unknown strings → allow explicit any sparingly
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow non-null assertions in tests and known contexts
      "@typescript-eslint/no-non-null-assertion": "warn",
    },
  },

  // Disable ESLint formatting rules (Prettier owns that)
  prettierConfig,

  // Ignore build artifacts and generated files
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      ".svelte-kit/**",
    ],
  }
);
