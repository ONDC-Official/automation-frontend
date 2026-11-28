/**
 * The FD (ONDC:FIS14:FD) workbench runs on its own stack (automation-framework `fd/`), not on the
 * Beckn config, mock and API services. An FD Scenario Testing session is opened there, and the
 * FD pages read and drive it through this backend, which holds the workbench's control token:
 * the browser never sees it.
 *
 *   FD_WORKBENCH_URL            the workbench origin, e.g. https://localhost:7443 (unset: FD is off)
 *   FD_CONTROL_TOKEN            its control token (the workbench's FD_CONTROL_TOKEN, or the
 *                               contents of <state>/control-token for a local playground)
 *   FD_WORKBENCH_INSECURE_TLS   "true" to accept the local playground's self-signed certificate
 */
import https from "node:https";
import axios, { AxiosError } from "axios";

export const FD_DOMAIN = "ONDC:FIS14:FD";
export const FD_VERSION = "0.1.4";
export const FD_USECASE = "FIXED DEPOSIT";

export const isFdDomain = (domain: unknown) => domain === FD_DOMAIN;
export const fdEnabled = () => !!process.env.FD_WORKBENCH_URL;

/** A refusal from the workbench (or a missing configuration), with the status to pass on. */
export class FdWorkbenchError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
		this.name = "FdWorkbenchError";
	}
}

const origin = () => {
	const url = process.env.FD_WORKBENCH_URL;
	if (!url) throw new FdWorkbenchError("FD is not enabled on this workbench (FD_WORKBENCH_URL is not set)", 503);
	return url.replace(/\/+$/, "");
};

let agent: https.Agent | undefined;
const httpsAgent = () =>
	process.env.FD_WORKBENCH_INSECURE_TLS === "true"
		? (agent ??= new https.Agent({ rejectUnauthorized: false }))
		: undefined;

/**
 * Calls the workbench. `control` sends the control token (everything under /control and the
 * Network Admin's /cert/issue); the public certificate and go-live checks go without it.
 */
export async function fdCall<T = any>(
	method: "GET" | "POST" | "DELETE",
	path: string,
	body?: unknown,
	opts: { control?: boolean; timeoutMs?: number } = {},
): Promise<T> {
	const control = opts.control ?? true;
	const token = process.env.FD_CONTROL_TOKEN;
	if (control && !token) throw new FdWorkbenchError("FD_CONTROL_TOKEN is not set", 503);
	try {
		const r = await axios.request<T>({
			method,
			url: `${origin()}${path}`,
			data: body,
			headers: { "content-type": "application/json", ...(control ? { "x-fd-control-token": token } : {}) },
			httpsAgent: httpsAgent(),
			timeout: opts.timeoutMs ?? 30_000,
		});
		return r.data;
	} catch (e) {
		if (e instanceof FdWorkbenchError) throw e;
		const err = e as AxiosError<{ error?: string }>;
		if (err.response) {
			const message = err.response.data?.error ?? `the FD workbench answered HTTP ${err.response.status}`;
			// A refused control token is this backend's misconfiguration, not the user's mistake.
			throw new FdWorkbenchError(err.response.status === 401 ? "the FD workbench refused this backend's control token" : message, err.response.status === 401 ? 502 : err.response.status);
		}
		throw new FdWorkbenchError(`the FD workbench is not reachable (${err.message})`, 502);
	}
}

export type FdRole = "INVESTOR_APP" | "DEPOSIT_ISSUER";
/** BAP is the investor app, BPP the deposit issuer. */
export const fdRole = (npType: unknown): FdRole => (npType === "BPP" ? "DEPOSIT_ISSUER" : "INVESTOR_APP");

export interface FdRegistration {
	subscriberId?: string;
	ukId?: string;
	signingPublicKey?: string;
	/** The capability declaration: the spec's Participant object, as JSON text or an object. */
	declaration?: unknown;
}

/** The body for the workbench's POST /control/sessions, checked here so a user gets a plain message. */
export function fdSessionBody(sessionId: string, data: { npType?: unknown; subscriberUrl?: unknown; userId?: unknown; fd?: FdRegistration }) {
	const fd = data.fd ?? {};
	const missing = (
		[
			["subscriberId", "Subscriber ID"],
			["ukId", "Unique key ID"],
			["signingPublicKey", "Signing public key"],
		] as const
	).filter(([k]) => typeof fd[k] !== "string" || !(fd[k] as string).trim());
	if (missing.length) throw new FdWorkbenchError(`${missing.map(([, l]) => l).join(", ")} ${missing.length > 1 ? "are" : "is"} required for an FD session`, 400);
	if (typeof data.subscriberUrl !== "string" || !data.subscriberUrl.trim()) throw new FdWorkbenchError("Subscriber URL is required", 400);
	let declaration: unknown = fd.declaration;
	if (typeof declaration === "string") {
		const text = declaration.trim();
		if (!text) declaration = undefined;
		else {
			try {
				declaration = JSON.parse(text);
			} catch {
				throw new FdWorkbenchError("The capability declaration is not valid JSON", 400);
			}
		}
	}
	if (declaration !== undefined && (declaration === null || typeof declaration !== "object" || Array.isArray(declaration))) {
		throw new FdWorkbenchError("The capability declaration must be a JSON object (the spec's Participant)", 400);
	}
	return {
		sessionId,
		role: fdRole(data.npType),
		subscriber_id: fd.subscriberId!.trim(),
		ukId: fd.ukId!.trim(),
		signing_public_key: fd.signingPublicKey!.trim(),
		subscriber_url: data.subscriberUrl.trim().replace(/\/+$/, ""),
		...(typeof data.userId === "string" && data.userId ? { userId: data.userId } : {}),
		...(declaration !== undefined ? { declaration } : {}),
	};
}

/** Adds the FD domain to the Scenario Testing domain list when FD is enabled and the list lacks it. */
export function withFdDomain<T extends { domain?: { key: string }[] }>(data: T): T {
	if (!fdEnabled() || !data || !Array.isArray(data.domain)) return data;
	if (data.domain.some((d) => d.key === FD_DOMAIN)) return data;
	return { ...data, domain: [...data.domain, { key: FD_DOMAIN, version: [{ key: FD_VERSION, usecase: [FD_USECASE] }] }] };
}
