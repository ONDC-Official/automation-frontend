/**
 * FD (ONDC:FIS14:FD) on its own workbench: with FD_WORKBENCH_URL set, an FD session's flows and
 * flow calls go to the FD workbench (with its control token), in place of the config and mock
 * services; every other domain, and FD without it, is untouched.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

for (const key of ["API_SERVICE", "DB_SERVICE", "CONFIG_SERVICE", "MOCK_SERVICE", "REPORTING_SERVICE", "API_SERVICE_KEY"]) {
	process.env[key] = process.env[key] ?? `http://localhost/${key}`;
}
vi.mock("../services/dbService", () => ({ upsertSessionInDb: vi.fn().mockResolvedValue({}), saveSessionSettingsInDb: vi.fn(), getUser: vi.fn(), createUser: vi.fn() }));

const fd = await import("../services/fdWorkbenchService");
const { RedisService } = (await import("@ondc/ondc-automation-cache-lib")) as any;
const { buildMockBaseURL } = await import("../utils");
const axiosInstance = (await import("../utils/axios")).default;

const runInterceptor = async (url: string) => {
	const handlers = (axiosInstance.interceptors.request as any).handlers as { fulfilled: (c: any) => any }[];
	return handlers[0].fulfilled({ url, headers: {} });
};

beforeEach(() => {
	RedisService.__reset();
	process.env.FD_WORKBENCH_URL = "https://fd.local:7443/";
	process.env.FD_CONTROL_TOKEN = "t".repeat(40);
	delete process.env.FD_WORKBENCH_INSECURE_TLS;
});

describe("the FD switch", () => {
	it("routes an FD session's flow calls to the FD workbench, and leaves other domains on the mock service", async () => {
		await RedisService.setKey("s-fd", JSON.stringify({ domain: "ONDC:FIS14:FD", version: "0.1.4", usecaseId: "FIXED DEPOSIT" }));
		await RedisService.setKey("s-fis12", JSON.stringify({ domain: "ONDC:FIS12", version: "2.3.0", usecaseId: "LAMF LOAN" }));
		expect(await buildMockBaseURL("flows/new", "s-fd")).toBe("https://fd.local:7443/control/workbench/mock/flows/new");
		expect(await buildMockBaseURL("flows/new", "s-fis12")).toBe("http://localhost/MOCK_SERVICE/ONDC:FIS12/2.3.0/flows/new");
		delete process.env.FD_WORKBENCH_URL;
		expect(await buildMockBaseURL("flows/new", "s-fd")).toBe("http://localhost/MOCK_SERVICE/ONDC:FIS14:FD/0.1.4/flows/new");
	});

	it("serves FD's flows from the FD workbench in place of the config service", () => {
		expect(fd.isFdSession("ONDC:FIS14:FD")).toBe(true);
		expect(fd.isFdSession("ONDC:FIS12")).toBe(false);
		expect(fd.fdFlowsUrl()).toBe("https://fd.local:7443/control/workbench/ui/flow");
	});

	it("sends the FD workbench its control token, never the services' API key, and the API key to no one else", async () => {
		const toFd = await runInterceptor("https://fd.local:7443/control/workbench/mock/flows/proceed");
		expect(toFd.headers["x-fd-control-token"]).toBe("t".repeat(40));
		expect(toFd.headers["x-api-key"]).toBeUndefined();
		const toConfig = await runInterceptor("http://localhost/CONFIG_SERVICE/ui/flow");
		expect(toConfig.headers["x-fd-control-token"]).toBeUndefined();
		expect(toConfig.headers["x-api-key"]).toBe(process.env.API_SERVICE_KEY);
	});

	it("adds FD to the domain list only when enabled and missing", () => {
		const list = { domain: [{ key: "ONDC:FIS12", version: [] }] };
		expect(fd.withFdDomain(list).domain.map((d) => d.key)).toEqual(["ONDC:FIS12", "ONDC:FIS14:FD"]);
		const already = { domain: [{ key: "ONDC:FIS14:FD", version: [] }] };
		expect(fd.withFdDomain(already)).toBe(already);
		delete process.env.FD_WORKBENCH_URL;
		expect(fd.withFdDomain(list)).toBe(list);
	});
});
