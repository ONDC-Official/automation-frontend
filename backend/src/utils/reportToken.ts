import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed, short-lived tokens for report links. A report_url can carry one as
 * `?rt=<exp>.<hmac>`, so a browser can open the report by clicking the link
 * (which cannot send an Authorization header) while the link still can't be
 * forged, reused for a different report, or used after it expires.
 */

const DELIM = ".";

const signature = (payload: string, secret: string): string =>
	createHmac("sha256", secret).update(payload).digest("hex");

/** `<exp>.<hmac>` tying the link to one org + session + expiry. */
export const signReportToken = (
	orgId: string,
	sessionId: string,
	secret: string,
	ttlSeconds: number
): string => {
	const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
	return `${exp}${DELIM}${signature(`${orgId}:${sessionId}:${exp}`, secret)}`;
};

/** True only for an unexpired token whose signature matches this org + session. */
export const verifyReportToken = (
	rt: string,
	orgId: string,
	sessionId: string,
	secret: string
): boolean => {
	const at = rt.indexOf(DELIM);
	if (at <= 0) return false;
	const exp = Number(rt.slice(0, at));
	const given = rt.slice(at + 1);
	// Reject a missing/garbled expiry or one already in the past.
	if (!Number.isInteger(exp) || exp * 1000 < Date.now()) return false;
	const expected = signature(`${orgId}:${sessionId}:${exp}`, secret);
	const a = Buffer.from(given);
	const b = Buffer.from(expected);
	// Constant-time compare; lengths must match for timingSafeEqual.
	return a.length === b.length && timingSafeEqual(a, b);
};
