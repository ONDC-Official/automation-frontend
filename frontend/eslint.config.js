import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["dist"] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            "react-hooks/exhaustive-deps": "off",
            "react-refresh/only-export-components": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "no-console": ["warn", { allow: ["warn", "error"] }],
        },
    },
    {
        files: ["src/**/*.{ts,tsx}"],
        ignores: ["src/store/**"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["@store/api/*"],
                            message:
                                "Import RTK Query hooks only from the public barrel '@store/api'. " +
                                "Everything under it (main/, developerGuide/, loadTest/, endpoints/) is internal.",
                        },
                    ],
                },
            ],
        },
    },
    {
        // Persisted frontend state belongs in Redux, persisted via Redux Persist
        // (see src/store/persistConfig.ts). Direct localStorage/sessionStorage
        // access is only allowed in the two files that implement that adapter,
        // plus the temporary one-time legacy-key import.
        files: ["src/**/*.{ts,tsx}"],
        ignores: ["src/store/storage.ts", "src/store/legacyStorageMigration.ts"],
        rules: {
            "no-restricted-globals": [
                "error",
                {
                    name: "localStorage",
                    message:
                        "Do not use localStorage directly. Persist frontend state via Redux Persist " +
                        "(add a slice + persistConfig entry, see src/store/persistConfig.ts).",
                },
                {
                    name: "sessionStorage",
                    message:
                        "Do not use sessionStorage directly. Persist frontend state via Redux Persist " +
                        "(add a slice + persistConfig entry using the sessionStorage engine, see " +
                        "src/store/persistConfig.ts).",
                },
            ],
            "no-restricted-properties": [
                "error",
                {
                    object: "window",
                    property: "localStorage",
                    message: "Do not use window.localStorage directly. See src/store/persistConfig.ts.",
                },
                {
                    object: "window",
                    property: "sessionStorage",
                    message: "Do not use window.sessionStorage directly. See src/store/persistConfig.ts.",
                },
            ],
        },
    }
);
