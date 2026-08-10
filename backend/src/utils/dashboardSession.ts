import crypto from "node:crypto";
import type { DashboardConfig } from "../config/dashboardConfig";

/**
 * Stateless signed session tokens for the business dashboard.
 *
 * `<expiresAt>.<hmac>` — no server-side store, because the only fact worth
 * carrying is "this browser proved it knows the shared password, until then".
 * Adding real users later means putting a subject in the payload; the shape
 * already allows it.
 *
 * Deliberately separate from the express-session/Redis machinery in app.ts:
 * that carries workbench OAuth identity, this carries a shared-password claim,
 * and conflating them would let one grant the other.
 */

const sign = (payload: string, secret: string): string =>
	crypto.createHmac("sha256", secret).update(payload).digest("base64url");

export function issueToken(
	config: DashboardConfig,
	now = Date.now()
): string {
	const expiresAt = String(now + config.sessionTtlMs);
	return `${expiresAt}.${sign(expiresAt, config.sessionSecret)}`;
}

export function verifyToken(
	token: string | undefined,
	config: DashboardConfig,
	now = Date.now()
): boolean {
	if (!token) return false;

	const separator = token.lastIndexOf(".");
	if (separator === -1) return false;

	const payload = token.slice(0, separator);
	const signature = token.slice(separator + 1);

	const expected = sign(payload, config.sessionSecret);

	// Compare in constant time so a forged cookie cannot be refined byte by
	// byte from response timing.
	const a = Buffer.from(signature);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

	const expiresAt = Number(payload);
	return Number.isFinite(expiresAt) && expiresAt > now;
}

/** Constant-time password check, for the same reason. */
export function passwordMatches(
	supplied: unknown,
	expected: string
): boolean {
	if (typeof supplied !== "string") return false;

	const a = Buffer.from(supplied);
	const b = Buffer.from(expected);
	if (a.length !== b.length) return false;

	return crypto.timingSafeEqual(a, b);
}
