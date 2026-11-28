/**
 * FD (ONDC:FIS14:FD) runs on its own workbench (automation-framework `fd/`), which stands in for
 * the Beckn services a domain normally has: it serves FD's flows in place of the config service
 * and answers the flow calls (flows/new, flows/proceed, flows/current-status) in place of the
 * mock service. Everything else about an FD session is the same as any domain's.
 *
 *   FD_WORKBENCH_URL            the FD workbench origin, e.g. https://localhost:7443 (unset: FD is
 *                               served like any other domain, by the config and mock services)
 *   FD_CONTROL_TOKEN            the FD workbench's control token, sent server to server
 *   FD_WORKBENCH_INSECURE_TLS   "true" to accept a local FD workbench's self-signed certificate
 */
import https from "node:https";

export const FD_DOMAIN = "ONDC:FIS14:FD";

export const fdEnabled = () => !!process.env.FD_WORKBENCH_URL;
export const isFdSession = (domain: unknown) => domain === FD_DOMAIN && fdEnabled();
const origin = () => (process.env.FD_WORKBENCH_URL ?? "").replace(/\/+$/, "");

/** The FD workbench's answer to the config service's /ui/flow. */
export const fdFlowsUrl = () => `${origin()}/control/workbench/ui/flow`;
/** The FD workbench's answer to the mock service's `<path>` (flows/new, flows/proceed, flows/current-status). */
export const fdMockUrl = (path: string) => `${origin()}/control/workbench/mock/${path}`;

/** Whether a request goes to the FD workbench (it then carries the control token). */
export const isFdWorkbenchUrl = (url?: string) => fdEnabled() && !!url && url.startsWith(`${origin()}/`);

let agent: https.Agent | undefined;
export const fdHttpsAgent = () =>
	process.env.FD_WORKBENCH_INSECURE_TLS === "true"
		? (agent ??= new https.Agent({ rejectUnauthorized: false }))
		: undefined;

/** Adds the FD domain to the Scenario Testing domain list when FD is enabled and the list lacks it. */
export function withFdDomain<T extends { domain?: { key: string }[] }>(data: T): T {
	if (!fdEnabled() || !data || !Array.isArray(data.domain)) return data;
	if (data.domain.some((d) => d.key === FD_DOMAIN)) return data;
	return {
		...data,
		domain: [...data.domain, { key: FD_DOMAIN, version: [{ key: "0.1.4", usecase: ["FIXED DEPOSIT"], usecaseStatus: [] }] }],
	};
}
