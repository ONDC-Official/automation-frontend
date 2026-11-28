/**
 * The FD pages' API: an FD session as the FD workbench holds it, its certification runs, the
 * judge's report on a run, and the certificate and go-live decision. Every call goes through the
 * session: the participant is always the session's, never one named by the browser, and a run or
 * certificate is reachable only from the session it belongs to.
 *
 * Like /flow-testing, an FD session is reached by its session id (the link the Scenario Testing
 * page opens).
 */
import { Request, Response } from "express";
import logger from "@ondc/automation-logger";
import { fdCall, FdWorkbenchError } from "../services/fdWorkbenchService";
import { getLoggerMeta } from "../utils/logger-meta-utilts";

type FdView = {
	session: { sessionId: string; participant: string; role: "INVESTOR_APP" | "DEPOSIT_ISSUER" };
	certificates: { certificateId: string }[];
	[k: string]: unknown;
};
type FdRun = { runId: string; sessionId?: string; participant: string; status: string };

const ID = /^[A-Za-z0-9_-]{1,128}$/;
const RUN_OR_CERT = /^[A-Z0-9-]{1,64}$/;

const fail = (req: Request, res: Response, e: unknown) => {
	if (e instanceof FdWorkbenchError) {
		res.status(e.status).send({ message: e.message });
		return;
	}
	logger.error("FD request failed", getLoggerMeta(req), e);
	res.status(500).send({ message: "FD request failed" });
};

const sessionOf = async (req: Request): Promise<FdView> => {
	const id = req.params.sessionId;
	if (!ID.test(id)) throw new FdWorkbenchError("not an FD session id", 400);
	return fdCall<FdView>("GET", `/control/sessions/${encodeURIComponent(id)}`);
};

/** A run of this session, or a 404. */
const runOf = async (req: Request, view: FdView): Promise<FdRun> => {
	const runId = req.params.runId;
	if (!RUN_OR_CERT.test(runId)) throw new FdWorkbenchError("not a run id", 400);
	const run = await fdCall<FdRun>("GET", `/control/runs/${runId}`);
	if (run.sessionId !== view.session.sessionId || run.participant !== view.session.participant) throw new FdWorkbenchError(`no run ${runId} in this session`, 404);
	return run;
};

const handle =
	(fn: (req: Request, res: Response) => Promise<unknown>) =>
	async (req: Request, res: Response) => {
		try {
			const out = await fn(req, res);
			if (!res.headersSent) res.send(out);
		} catch (e) {
			fail(req, res, e);
		}
	};

/** GET /fd/sessions/:sessionId — participant, plan, runs, certificates, go-live, counterpart. */
export const getFdSession = handle(async (req) => sessionOf(req));

/** GET /fd/sessions/:sessionId/exchanges?since=<seq> — the participant's exchanges, masked. */
export const getFdExchanges = handle(async (req) => {
	await sessionOf(req);
	const since = Number(req.query.since ?? 0);
	const q = Number.isFinite(since) && since > 0 ? `?since=${Math.floor(since)}` : "";
	return fdCall("GET", `/control/sessions/${encodeURIComponent(req.params.sessionId)}/exchanges${q}`);
});

/** POST /fd/sessions/:sessionId/runs — starts a run in this session. Playing it is a separate call. */
export const startFdRun = handle(async (req) => {
	const view = await sessionOf(req);
	return fdCall("POST", "/control/runs", { participant: view.session.participant, sessionId: view.session.sessionId });
});

/** GET /fd/sessions/:sessionId/runs/:runId */
export const getFdRun = handle(async (req) => runOf(req, await sessionOf(req)));

/**
 * POST /fd/sessions/:sessionId/runs/:runId/play {knownPan?} — what the workbench plays for the
 * role: an issuer gets the plan's scenarios and the coverage journey; an investor app gets the
 * conformance pack and every webhook it must receive (its own requests are its tester's to send).
 * Takes as long as the run does.
 */
export const playFdRun = handle(async (req) => {
	const view = await sessionOf(req);
	const run = await runOf(req, view);
	const knownPan = typeof req.body?.knownPan === "string" && req.body.knownPan.trim() ? req.body.knownPan.trim().toUpperCase() : undefined;
	const play = view.session.role === "DEPOSIT_ISSUER" ? { scenarios: true, sweep: true, ...(knownPan ? { knownPan } : {}) } : { pack: true, sweep: true };
	return fdCall("POST", `/control/runs/${run.runId}/play`, play, { timeoutMs: 15 * 60_000 });
});

/** POST /fd/sessions/:sessionId/runs/:runId/finish — judges the run and keeps its masked evidence. */
export const finishFdRun = handle(async (req) => {
	const run = await runOf(req, await sessionOf(req));
	return fdCall("POST", `/control/runs/${run.runId}/finish`);
});

/** DELETE /fd/sessions/:sessionId/runs/:runId — stops a run without judging it. */
export const stopFdRun = handle(async (req) => {
	const run = await runOf(req, await sessionOf(req));
	return fdCall("DELETE", `/control/runs/${run.runId}`);
});

/** GET /fd/sessions/:sessionId/runs/:runId/report — the judge's report on a finished run (HTML). */
export const getFdRunReport = handle(async (req, res) => {
	const run = await runOf(req, await sessionOf(req));
	const { html } = await fdCall<{ html: string }>("GET", `/control/runs/${run.runId}/report`);
	// A self-contained page: no scripts, no external resources.
	res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; img-src data:");
	res.type("html").send(html);
});

/** POST /fd/sessions/:sessionId/certificates {runs: [...]} — the Network Admin's decision on those runs. */
export const issueFdCertificate = handle(async (req) => {
	const view = await sessionOf(req);
	const runs = Array.isArray(req.body?.runs) ? (req.body.runs as unknown[]).map(String) : [];
	if (runs.length === 0) throw new FdWorkbenchError("name at least one finished run", 400);
	for (const runId of runs) await runOf({ ...req, params: { ...req.params, runId } } as unknown as Request, view);
	return fdCall("POST", "/cert/issue", { participant: view.session.participant, runs });
});

const certOf = async (req: Request) => {
	const view = await sessionOf(req);
	const id = req.params.certificateId;
	if (!RUN_OR_CERT.test(id) || !view.certificates.some((c) => c.certificateId === id)) throw new FdWorkbenchError(`no certificate ${id} for this session's participant`, 404);
	return id;
};

/** GET /fd/sessions/:sessionId/certificates/:certificateId — the signed certificate and its appeals. */
export const getFdCertificate = handle(async (req) => fdCall("GET", `/cert/${await certOf(req)}`, undefined, { control: false }));

/** GET /fd/sessions/:sessionId/certificates/:certificateId/verify — signature, status, evidence intact. */
export const verifyFdCertificate = handle(async (req) => fdCall("GET", `/cert/${await certOf(req)}/verify`, undefined, { control: false }));
