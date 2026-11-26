import { describe, expect, it } from "vitest";
import { signReportToken, verifyReportToken } from "../utils/reportToken";

const SECRET = "report-signing-secret-0123456789";

describe("report token", () => {
	it("verifies a token it just signed", () => {
		const rt = signReportToken("org1", "sess1", SECRET, 3600);
		expect(verifyReportToken(rt, "org1", "sess1", SECRET)).toBe(true);
	});

	it("rejects a token for a different org or session", () => {
		const rt = signReportToken("org1", "sess1", SECRET, 3600);
		expect(verifyReportToken(rt, "org2", "sess1", SECRET)).toBe(false);
		expect(verifyReportToken(rt, "org1", "sess2", SECRET)).toBe(false);
	});

	it("rejects a token signed with a different secret", () => {
		const rt = signReportToken("org1", "sess1", SECRET, 3600);
		expect(verifyReportToken(rt, "org1", "sess1", "a-totally-different-secret-xxxx")).toBe(false);
	});

	it("rejects an expired token", () => {
		const rt = signReportToken("org1", "sess1", SECRET, -1); // already in the past
		expect(verifyReportToken(rt, "org1", "sess1", SECRET)).toBe(false);
	});

	it("rejects a tampered signature", () => {
		const rt = signReportToken("org1", "sess1", SECRET, 3600);
		const tampered = rt.slice(0, -1) + (rt.endsWith("a") ? "b" : "a");
		expect(verifyReportToken(tampered, "org1", "sess1", SECRET)).toBe(false);
	});

	it("rejects garbage tokens", () => {
		for (const bad of ["", "nope", ".", "abc.", ".def", "999999999.deadbeef"]) {
			expect(verifyReportToken(bad, "org1", "sess1", SECRET)).toBe(false);
		}
	});
});
