/**
 * The session owner (userId, orgId) comes from the login service when the
 * request carries a login token, so the organisation a session is filed under
 * cannot be faked in the request body.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
vi.mock("axios", () => ({ default: { get: (...args: unknown[]) => get(...args) } }));

const { resolveSessionOwner } = await import("../services/sessionOwnerService");

describe("resolveSessionOwner", () => {
	beforeEach(() => {
		get.mockReset();
		process.env.DEVELOPER_GUIDE_SERVICE = "http://login-service";
	});

	it("keeps the body userId and sets no organisation without a token", async () => {
		const owner = await resolveSessionOwner(undefined, "someone", {});

		expect(owner).toEqual({ userId: "someone" });
		expect(get).not.toHaveBeenCalled();
	});

	it("always overrides an orgId sent in the request body", async () => {
		const owner = await resolveSessionOwner(undefined, "someone", {});
		const body = { userId: "someone", orgId: "faked-org" };

		expect("orgId" in owner).toBe(true);
		expect({ ...body, ...owner }.orgId).toBeUndefined();
	});

	it("takes the user and organisation from the login service, not the body", async () => {
		get.mockResolvedValue({
			data: { ok: true, user: { username: "25716", organisationId: "11899" } },
		});

		const owner = await resolveSessionOwner("Bearer good", "faked", {});

		expect(owner).toEqual({ userId: "25716", orgId: "11899" });
		expect(get).toHaveBeenCalledWith("http://login-service/auth/api/me", {
			headers: { Authorization: "Bearer good" },
			timeout: 5000,
		});
	});

	it("leaves the organisation unset for a GitHub login", async () => {
		get.mockResolvedValue({ data: { ok: true, user: { username: "octocat" } } });

		expect(await resolveSessionOwner("Bearer gh", undefined, {})).toEqual({
			userId: "octocat",
			orgId: undefined,
		});
	});

	it("falls back to the body userId when the token is rejected or the service is down", async () => {
		get.mockRejectedValueOnce({ response: { status: 401 } });
		expect(await resolveSessionOwner("Bearer expired", "someone", {})).toEqual({
			userId: "someone",
		});

		get.mockRejectedValueOnce(new Error("ECONNREFUSED"));
		expect(await resolveSessionOwner("Bearer good", "someone", {})).toEqual({
			userId: "someone",
		});
	});
});
