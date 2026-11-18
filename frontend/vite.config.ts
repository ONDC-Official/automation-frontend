import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    define: {
        // The browser has no Node Buffer, so nothing is one. The JSON Schema $ref
        // parser behind Studio's spec → TypeScript types calls this unguarded.
        "Buffer.isBuffer": "(() => false)",
    },
    optimizeDeps: {
        include: ["react-ga4", "@ondc/automation-mock-runner"],
        needsInterop: ["@ondc/automation-mock-runner"],
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@components": path.resolve(__dirname, "./src/components"),
            "@pages": path.resolve(__dirname, "./src/pages"),
            "@utils": path.resolve(__dirname, "./src/utils"),
            "@hooks": path.resolve(__dirname, "./src/hooks"),
            "@constants": path.resolve(__dirname, "./src/constants"),
            "@services": path.resolve(__dirname, "./src/services"),
            "@store": path.resolve(__dirname, "./src/store"),
            "@assets": path.resolve(__dirname, "./src/assets"),
            // Vite's empty stubs for these Node built-ins break the spec → TypeScript
            // converter (json-schema-to-typescript-lite): it calls process.cwd() when
            // it loads and path.basename() to name types.
            "node:process": path.resolve(__dirname, "./src/shims/node-process.ts"),
            "node:path": path.resolve(__dirname, "./src/shims/node-path.ts"),
        },
    },
});
