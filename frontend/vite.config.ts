import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
        include: ["react-ga4", "@ondc/automation-mock-runner"],
        needsInterop: ["@ondc/automation-mock-runner"],
    },
    resolve: {
        alias: {
            "@components/ui/forms": path.resolve(__dirname, "./src/components/Forms"),
            "@": path.resolve(__dirname, "./src"),
            "@components": path.resolve(__dirname, "./src/components"),
            "@pages": path.resolve(__dirname, "./src/pages"),
            "@utils": path.resolve(__dirname, "./src/utils"),
            "@hooks": path.resolve(__dirname, "./src/hooks"),
            "@context": path.resolve(__dirname, "./src/context"),
            "@constants": path.resolve(__dirname, "./src/constants"),
            "@services": path.resolve(__dirname, "./src/services"),
            "@store": path.resolve(__dirname, "./src/store"),
            "@assets": path.resolve(__dirname, "./src/assets"),
        },
    },
});
