/**
 * FD (ONDC:FIS14:FD) sessions open on the FD workbench, not the Beckn config service: the
 * session body is checked here, the control token goes only to the workbench, refusals keep
 * their status and message, and the domain list gains FD when FD is enabled.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

for (const key of ["API_SERVICE", "DB_SERVICE", "CONFIG_SERVICE", "MOCK_SERVICE", "REPORTING_SERVICE", "API_SERVICE_KEY"]) {
	process.env[key] = process.env[key] ?? `http://localhost/${key}`;
}

const request = vi.fn();
const get = vi.fn();
vi.mock("axios", () => {
	const instance = { get: (...a: unknown[]) => get(...a), interceptors: { request: { use: () => 0 } } };
	return { default: { request: (...a: unknown[]) => request(...a), get: (...a: unknown[]) => get(...a), create: () => instance }, AxiosError: class {} };
});
const upsertSessionInDb = vi.fn().mockResolvedValue({});
vi.mock("../services/dbService", () => ({
	upsertSessionInDb: (...a: unknown[]) => upsertSessionInDb(...a),
	saveSessionSettingsInDb: vi.fn(),
}));

const { RedisService } = (await import("@ondc/ondc-automation-cache-lib")) as any;
const fd = await import("../services/fdWorkbenchService");
const { createSessionService } = await import("../services/sessionService");

const registration = { subscriberId: "issuer.example.in", ukId: "k1", signingPublicKey: "PUBKEY", declaration: '{"subscriberId":"issuer.example.in"}' };
const form = { domain: "ONDC:FIS14:FD", version: "0.1.4", usecaseId: "FIXED DEPOSIT", npType: "BPP", env: "PRE-PRODUCTION", subscriberUrl: "https://issuer.example.in/fd/", userId: "tester", fd: registration } as any;

beforeEach(() => {
	request.mockReset();
	get.mockReset();
	upsertSessionInDb.mockClear();
	RedisService.__reset();
	process.env.FD_WORKBENCH_URL = "https://fd.local:7443/";
	process.env.FD_CONTROL_TOKEN = "t".repeat(40);
	delete process.env.FD_WORKBENCH_INSECURE_TLS;
});

describe("fdSessionBody", () => {
	it("maps the form to the workbench's session body: BPP is the issuer, the declaration parsed", () => {
		expect(fd.fdSessionBody("sess-0001", form)).toEqual({
			sessionId: "sess-0001",
			role: "DEPOSIT_ISSUER",
			subscriber_id: "issuer.example.in",
			ukId: "k1",
			signing_public_key: "PUBKEY",
			subscriber_url: "https://issuer.example.in/fd",
			userId: "tester",
			declaration: { subscriberId: "issuer.example.in" },
		});
		expect(fd.fdSessionBody("s", { ...form, npType: "BAP" }).role).toBe("INVESTOR_APP");
		expect("declaration" in fd.fdSessionBody("s", { ...form, fd: { ...registration, declaration: "  " } })).toBe(false);
	});

	it("names every missing field, and refuses a declaration that is not a JSON object", () => {
		expect(() => fd.fdSessionBody("s", { ...form, fd: { subscriberId: "x" } })).toThrow("Unique key ID, Signing public key are required");
		expect(() => fd.fdSessionBody("s", { ...form, fd: { ...registration, declaration: "{oops" } })).toThrow("not valid JSON");
		expect(() => fd.fdSessionBody("s", { ...form, fd: { ...registration, declaration: "[1]" } })).toThrow("JSON object");
	});
});

describe("withFdDomain", () => {
	it("adds FD to the domain list when enabled and missing; leaves the list alone otherwise", () => {
		const list = { domain: [{ key: "ONDC:FIS12", version: [] }] };
		expect(fd.withFdDomain(list).domain.map((d) => d.key)).toEqual(["ONDC:FIS12", "ONDC:FIS14:FD"]);
		const already = { domain: [{ key: "ONDC:FIS14:FD", version: [] }] };
		expect(fd.withFdDomain(already)).toBe(already);
		delete process.env.FD_WORKBENCH_URL;
		expect(fd.withFdDomain(list)).toBe(list);
	});
});

describe("fdCall", () => {
	it("sends the control token to the workbench, and none on public calls", async () => {
		request.mockResolvedValue({ data: { ok: 1 } });
		await fd.fdCall("GET", "/control/sessions/abc");
		await fd.fdCall("GET", "/cert/FDC-1/verify", undefined, { control: false });
		expect(request.mock.calls[0][0]).toMatchObject({ url: "https://fd.local:7443/control/sessions/abc", headers: { "x-fd-control-token": "t".repeat(40) } });
		expect(request.mock.calls[1][0].headers["x-fd-control-token"]).toBeUndefined();
	});

	it("keeps the workbench's refusal; a refused token or an unreachable workbench is a 502", async () => {
		request.mockRejectedValueOnce({ response: { status: 409, data: { error: "session s is already for x" } } });
		await expect(fd.fdCall("POST", "/control/sessions", {})).rejects.toMatchObject({ status: 409, message: "session s is already for x" });
		request.mockRejectedValueOnce({ response: { status: 401, data: { error: "token" } } });
		await expect(fd.fdCall("GET", "/control/info")).rejects.toMatchObject({ status: 502 });
		request.mockRejectedValueOnce({ message: "ECONNREFUSED" });
		await expect(fd.fdCall("GET", "/control/info")).rejects.toMatchObject({ status: 502, message: expect.stringContaining("not reachable") });
	});

	it("is a 503 when FD is not configured", async () => {
		delete process.env.FD_CONTROL_TOKEN;
		await expect(fd.fdCall("GET", "/control/info")).rejects.toMatchObject({ status: 503 });
	});
});

describe("createSessionService for FD", () => {
	it("opens the session on the FD workbench, never the config service, and keeps the session record", async () => {
		request.mockResolvedValue({ data: { session: { participant: "issuer.example.in", role: "DEPOSIT_ISSUER" } } });
		const message = await createSessionService("sess-0001", form, {});
		expect(message).toBe("FD session created");
		expect(get).not.toHaveBeenCalled();
		expect(request.mock.calls[0][0]).toMatchObject({ method: "POST", url: "https://fd.local:7443/control/sessions" });
		const cached = JSON.parse(RedisService.__store.get("sess-0001"));
		expect(cached).toMatchObject({ domain: "ONDC:FIS14:FD", flowConfigs: {}, fd: { participant: "issuer.example.in", role: "DEPOSIT_ISSUER" } });
		expect(JSON.stringify(cached)).not.toContain("PUBKEY");
		expect(upsertSessionInDb).toHaveBeenCalledWith("sess-0001", expect.objectContaining({ domain: "ONDC:FIS14:FD", npId: "https://issuer.example.in/fd" }));
	});

	it("stores nothing when the workbench refuses", async () => {
		request.mockRejectedValue({ response: { status: 400, data: { error: "declaration: regulatoryLicence is required" } } });
		await expect(createSessionService("sess-0002", form, {})).rejects.toMatchObject({ status: 400 });
		expect(RedisService.__store.has("sess-0002")).toBe(false);
	});

	it("leaves FD to the Beckn path when FD is not enabled", async () => {
		delete process.env.FD_WORKBENCH_URL;
		get.mockResolvedValue({ data: { data: { flows: [] } } });
		await createSessionService("sess-0003", form, {});
		expect(request).not.toHaveBeenCalled();
		expect(get).toHaveBeenCalled();
	});
});
