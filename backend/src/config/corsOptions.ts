import type { CorsOptions } from "cors";

export const ALLOWED_ORIGINS = [
	"http://localhost:5173",
	"http://localhost:4000",
	"https://saarthi.ondc.org.in",
	"https://preview--ondc-developer-portal.lovable.app",
	"https://workbench.ondc.tech",
];

/**
 * Extracted from app.ts so it can be asserted on without standing up Redis.
 * Evaluated at the same point in app.ts's module load as before, so the
 * NODE_ENV read behaves exactly as it always has.
 */
export function buildCorsOptions(): CorsOptions {
	return {
		origin:
			process.env.NODE_ENV === "development"
				? true // Allow all origins in development
				: ALLOWED_ORIGINS,
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: [
			"Content-Type",
			"Authorization",
			"Cookie",
			"x-proxy-target",
		],
		// Without this the browser hides the header from JS and every CSV
		// export downloads under a generated filename instead of the one the
		// server chose.
		exposedHeaders: ["Content-Disposition"],
	};
}
