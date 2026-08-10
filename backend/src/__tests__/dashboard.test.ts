import type { Server } from "node:http";
import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { dashboardRoutes } from "../routes/dashboardRoutes";
import type { DashboardConfig } from "../config/dashboardConfig";
import { buildCorsOptions } from "../config/corsOptions";
import { issueToken } from "../utils/dashboardSession";

/**
 * Ported from the standalone BFF (bff/src/__tests__/bff.test.ts). The proxy has
 * almost no logic, so these test the properties that actually matter: the API
 * key never reaches the browser, unauthenticated callers get nothing, and the
 * dashboard cannot write.
 *
 * Mounted on a bare express app rather than app.ts, which would drag in Redis
 * and the OTel SDK.
 */

const PASSWORD = "correct-horse-battery-staple";

/** A stand-in for automation-db that records what it was sent. */
function startUpstream(): {
	url: string;
	close: () => Promise<void>;
	received: Array<{ path: string; apiKey: string | undefined }>;
} {
	const received: Array<{ path: string; apiKey: string | undefined }> = [];
	const upstream = express();

	upstream.use((req, res) => {
		received.push({ path: req.originalUrl, apiKey: req.get("x-api-key") });

		if (req.path === "/api/sessions/export") {
			res.setHeader("Content-Type", "text/csv; charset=utf-8");
			res.setHeader(
				"Content-Disposition",
				'attachment; filename="sessions-2026-08-03.csv"'
			);
			res.end("sessionId\r\ns-1\r\n");
			return;
		}
		res.json({ ok: true, path: req.originalUrl });
	});

	const server: Server = upstream.listen(0);
	const address = server.address();
	const port = typeof address === "object" && address ? address.port : 0;

	return {
		url: `http://127.0.0.1:${port}`,
		close: () =>
			new Promise<void>((resolve, reject) =>
				server.close((e) => (e ? reject(e) : resolve()))
			),
		received,
	};
}

function createTestApp(config: DashboardConfig) {
	const app = express();
	app.use(express.json());
	app.use(cookieParser());
	app.use("/dashboard", dashboardRoutes(config));
	return app;
}

let upstream: ReturnType<typeof startUpstream>;
let config: DashboardConfig;
let server: Server;

beforeAll(() => {
	upstream = startUpstream();
	config = {
		dbServiceUrl: upstream.url,
		apiServiceKey: "upstream-secret-key",
		dashboardPassword: PASSWORD,
		sessionSecret: "x".repeat(48),
		cookieName: "wbd_session",
		sessionTtlMs: 60_000,
		secureCookies: false,
	};
	server = createTestApp(config).listen(0);
});

afterAll(async () => {
	await new Promise<void>((r) => server.close(() => r()));
	await upstream.close();
});

afterEach(() => {
	upstream.received.length = 0;
});

const api = () => request(server);
const sessionCookie = () => `wbd_session=${issueToken(config)}`;

describe("POST /dashboard/auth/login", () => {
	it("sets an httpOnly cookie for the correct password", async () => {
		const res = await api()
			.post("/dashboard/auth/login")
			.send({ password: PASSWORD });

		expect(res.status).toBe(204);

		const cookie = res.headers["set-cookie"][0];
		expect(cookie).toMatch(/^wbd_session=/);
		expect(cookie).toMatch(/HttpOnly/i);
		expect(cookie).toMatch(/SameSite=Lax/i);
	});

	it("401s for a wrong password and sets no cookie", async () => {
		const res = await api()
			.post("/dashboard/auth/login")
			.send({ password: "wrong" });

		expect(res.status).toBe(401);
		expect(res.headers["set-cookie"]).toBeUndefined();
	});

	it.each([{}, { password: null }, { password: 12345 }])(
		"401s for a malformed body %j",
		async (body) => {
			const res = await api().post("/dashboard/auth/login").send(body);

			expect(res.status).toBe(401);
		}
	);

	// The password must never come back in a response body.
	it("does not echo the password", async () => {
		const res = await api()
			.post("/dashboard/auth/login")
			.send({ password: "wrong" });

		expect(JSON.stringify(res.body)).not.toContain("wrong");
	});
});

describe("GET /dashboard/auth/me", () => {
	it("reports false without a cookie", async () => {
		const res = await api().get("/dashboard/auth/me");

		expect(res.body).toEqual({ authenticated: false });
	});

	it("reports true with a valid cookie", async () => {
		const res = await api()
			.get("/dashboard/auth/me")
			.set("Cookie", sessionCookie());

		expect(res.body).toEqual({ authenticated: true });
	});

	it("reports false for a tampered cookie", async () => {
		const token = issueToken(config);
		const tampered = token.replace(/.$/, (c) => (c === "a" ? "b" : "a"));

		const res = await api()
			.get("/dashboard/auth/me")
			.set("Cookie", `wbd_session=${tampered}`);

		expect(res.body).toEqual({ authenticated: false });
	});

	// A forged far-future expiry must not validate — the signature covers it.
	it("reports false for a cookie with a forged expiry", async () => {
		const forged = `${Date.now() + 10_000_000}.deadbeef`;

		const res = await api()
			.get("/dashboard/auth/me")
			.set("Cookie", `wbd_session=${forged}`);

		expect(res.body).toEqual({ authenticated: false });
	});

	it("reports false once the session has expired", async () => {
		const expired = issueToken(config, Date.now() - config.sessionTtlMs * 2);

		const res = await api()
			.get("/dashboard/auth/me")
			.set("Cookie", `wbd_session=${expired}`);

		expect(res.body).toEqual({ authenticated: false });
	});
});

describe("POST /dashboard/auth/logout", () => {
	it("clears the cookie", async () => {
		const res = await api()
			.post("/dashboard/auth/logout")
			.set("Cookie", sessionCookie());

		expect(res.status).toBe(204);
		expect(res.headers["set-cookie"][0]).toMatch(/wbd_session=;/);
	});
});

describe("proxy authentication", () => {
	it("401s an unauthenticated request and never calls upstream", async () => {
		const res = await api().get("/dashboard/api/sessions/");

		expect(res.status).toBe(401);
		expect(upstream.received).toHaveLength(0);
	});

	it("forwards an authenticated request", async () => {
		const res = await api()
			.get("/dashboard/api/sessions/")
			.set("Cookie", sessionCookie());

		expect(res.status).toBe(200);
		expect(upstream.received).toHaveLength(1);
	});
});

describe("api key handling", () => {
	it("injects the upstream API key", async () => {
		await api()
			.get("/dashboard/api/sessions/")
			.set("Cookie", sessionCookie());

		expect(upstream.received[0].apiKey).toBe("upstream-secret-key");
	});

	// The entire reason this proxy exists.
	it("never leaks the API key back to the browser", async () => {
		const res = await api()
			.get("/dashboard/api/sessions/")
			.set("Cookie", sessionCookie());

		const everything = JSON.stringify({
			headers: res.headers,
			body: res.body,
			text: res.text,
		});
		expect(everything).not.toContain("upstream-secret-key");
	});

	it("ignores a client-supplied API key and substitutes its own", async () => {
		await api()
			.get("/dashboard/api/sessions/")
			.set("Cookie", sessionCookie())
			.set("x-api-key", "attacker-supplied");

		expect(upstream.received[0].apiKey).toBe("upstream-secret-key");
	});
});

describe("read-only enforcement", () => {
	// automation-db's key grants full write access. The dashboard only reads,
	// so the proxy refuses to pass anything that could mutate.
	it.each(["post", "put", "patch", "delete"] as const)(
		"405s %s and never calls upstream",
		async (method) => {
			const res = await api()
				[method]("/dashboard/api/sessions/some-id")
				.set("Cookie", sessionCookie());

			expect(res.status).toBe(405);
			expect(upstream.received).toHaveLength(0);
		}
	);

	it("still allows GET", async () => {
		const res = await api()
			.get("/dashboard/api/sessions/some-id")
			.set("Cookie", sessionCookie());

		expect(res.status).toBe(200);
	});
});

describe("path allowlist", () => {
	it.each([
		"/api/sessions/",
		"/api/sessions/stats",
		"/report/",
		"/report/PW_1",
	])("allows %s", async (path) => {
		const res = await api()
			.get(`/dashboard${path}`)
			.set("Cookie", sessionCookie());

		expect(res.status).toBe(200);
	});

	// These exist upstream but have no business being reachable from a browser.
	it.each(["/payload/", "/user/", "/protocol-specs/builds"])(
		"blocks %s and never calls upstream",
		async (path) => {
			const res = await api()
				.get(`/dashboard${path}`)
				.set("Cookie", sessionCookie());

			expect(res.status).toBe(404);
			expect(upstream.received).toHaveLength(0);
		}
	);

	// A prefix match must not let /reportage through on the strength of /report.
	it("does not allow a path that merely starts with an allowed prefix", async () => {
		const res = await api()
			.get("/dashboard/api/sessions-secret")
			.set("Cookie", sessionCookie());

		expect(res.status).toBe(404);
		expect(upstream.received).toHaveLength(0);
	});
});

describe("request forwarding", () => {
	it("preserves the query string and strips the mount prefix", async () => {
		await api()
			.get("/dashboard/api/sessions/?domain=ONDC:FIS10&page=2&limit=10")
			.set("Cookie", sessionCookie());

		expect(upstream.received[0].path).toBe(
			"/api/sessions/?domain=ONDC:FIS10&page=2&limit=10"
		);
	});

	it("passes through the CSV body and its Content-Disposition", async () => {
		const res = await api()
			.get("/dashboard/api/sessions/export")
			.set("Cookie", sessionCookie());

		expect(res.status).toBe(200);
		expect(res.headers["content-type"]).toMatch(/text\/csv/);
		expect(res.headers["content-disposition"]).toBe(
			'attachment; filename="sessions-2026-08-03.csv"'
		);
		expect(res.text).toBe("sessionId\r\ns-1\r\n");
	});

	it("502s when upstream is unreachable", async () => {
		const brokenConfig = { ...config, dbServiceUrl: "http://127.0.0.1:1" };
		const broken = createTestApp(brokenConfig).listen(0);

		try {
			const res = await request(broken)
				.get("/dashboard/api/sessions/")
				.set("Cookie", `wbd_session=${issueToken(brokenConfig)}`);

			expect(res.status).toBe(502);
		} finally {
			await new Promise<void>((r) => broken.close(() => r()));
		}
	});
});

describe("CORS", () => {
	// app.ts's options, asserted without standing up Redis.
	const corsApp = () => {
		const app = express();
		app.use(cors(buildCorsOptions()));
		app.get("/ping", (_req, res) => {
			res.json({ ok: true });
		});
		return app;
	};

	it("allows the configured origin with credentials", async () => {
		const res = await request(corsApp())
			.get("/ping")
			.set("Origin", "http://localhost:5173");

		expect(res.headers["access-control-allow-origin"]).toBe(
			"http://localhost:5173"
		);
		expect(res.headers["access-control-allow-credentials"]).toBe("true");
	});

	// Without this the browser hides the header and the CSV loses its filename.
	it("exposes Content-Disposition to the browser", async () => {
		const res = await request(corsApp())
			.get("/ping")
			.set("Origin", "http://localhost:5173");

		expect(res.headers["access-control-expose-headers"]).toMatch(
			/Content-Disposition/i
		);
	});

	it("does not echo an unapproved origin", async () => {
		const res = await request(corsApp())
			.get("/ping")
			.set("Origin", "https://evil.example.com");

		expect(res.headers["access-control-allow-origin"]).not.toBe(
			"https://evil.example.com"
		);
	});
});

describe("unconfigured server", () => {
	// A missing dashboard password must disable the dashboard, not take the
	// whole workbench backend down.
	it("503s every dashboard route when config is incomplete", async () => {
		const saved = { ...process.env };
		for (const key of [
			"DASHBOARD_PASSWORD",
			"DASHBOARD_SESSION_SECRET",
			"DB_SERVICE",
			"DB_SERVICE_API_KEY",
		]) {
			delete process.env[key];
		}

		try {
			// Re-imported fresh so the lazy config resolution runs again.
			vi.resetModules();
			const mod = await import("../routes/dashboardRoutes");
			const app = express();
			app.use(cookieParser());
			app.use("/dashboard", mod.default);

			const res = await request(app).get("/dashboard/auth/me");
			expect(res.status).toBe(503);
		} finally {
			process.env = saved;
		}
	});
});
