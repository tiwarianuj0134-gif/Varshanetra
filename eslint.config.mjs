import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import typescriptEslint from "@typescript-eslint/eslint-plugin";

export default defineConfig([
  ...nextCoreWebVitals,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    rules: {
      // Allow unused vars prefixed with _ (convention for intentionally unused)
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      // Allow explicit any in some cases (data from DB/external APIs)
      "@typescript-eslint/no-explicit-any": "warn",
      // Existing client components intentionally hydrate local state in effects.
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      // Allow empty catch blocks (common in UI code)
      "no-empty": ["warn", { "allowEmptyCatch": true }],
      // React rules
      "react/no-unescaped-entities": "warn",
      // Next.js Image component - not all images need next/image
      "@next/next/no-img-element": "warn",
    },
  },
]);
