import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
	resolve: {
		alias: {
			// The real logger ships to Loki and pulls in the OTel SDK.
			"@ondc/automation-logger": path.resolve(
				import.meta.dirname,
				"src/__tests__/stubs/logger.ts"
			),
		},
	},
	test: {
		environment: "node",
		include: ["src/__tests__/**/*.test.ts"],
	},
});
