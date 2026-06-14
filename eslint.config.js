import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "target", "node_modules", "coverage"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "three", message: "Three.js is prohibited. Use raw WebGL2." },
            { name: "@react-three/fiber", message: "3D libraries are prohibited." },
            { name: "babylonjs", message: "3D libraries are prohibited." },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        {
          name: "localStorage",
          message: "Use Zustand stores and Tauri filesystem for session state.",
        },
        {
          name: "sessionStorage",
          message: "Use Zustand stores and Tauri filesystem for session state.",
        },
      ],
    },
  },
  {
    files: ["packages/audio/**/*.{ts,tsx}", "packages/state/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='setTimeout']",
          message: "Musical timing must be driven by ConsequenceStream transport state.",
        },
        {
          selector: "CallExpression[callee.name='setInterval']",
          message: "Musical timing must be driven by ConsequenceStream transport state.",
        },
      ],
    },
  },
  {
    files: [
      "packages/ui/**/*.{ts,tsx}",
      "apps/studio-desktop/**/*.{ts,tsx}",
    ],
    rules: {
      "max-lines": ["warn", { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
);
