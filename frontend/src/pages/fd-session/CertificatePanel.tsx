import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckBadgeIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { Button } from "@components/Shadcn/Button";
import { Checkbox } from "@components/Shadcn/Checkbox";
import Alert from "@components/Shadcn/Alert";
import Spinner from "@components/Shadcn/Spinner";
import {
    useGetFdCertificateQuery,
    useIssueFdCertificateMutation,
    useLazyVerifyFdCertificateQuery,
} from "@store/api";
import type { FdSessionView } from "@pages/fd-session/types";
import { Empty, KeyValue, Mono, StatusBadge, errorText, time } from "@pages/fd-session/ui";

/**
 * The Network Admin's decision: a signed certificate over finished runs, VALID only when every
 * required item of the plan is met and no check failed; its verification; and go-live, which
 * follows the participant's latest certificate.
 */
export const CertificatePanel = ({ view }: { view: FdSessionView }) => {
    const sessionId = view.session.sessionId;
    const finished = useMemo(
        () =>
            view.runs
                .filter((r) => r.status === "FINISHED")
                .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
        [view.runs]
    );
    const [chosen, setChosen] = useState<string[]>([]);
    useEffect(() => {
        // Default: the latest finished run.
        if (chosen.length === 0 && finished[0]) setChosen([finished[0].runId]);
    }, [finished, chosen.length]);
    const [issue, { isLoading: issuing }] = useIssueFdCertificateMutation();
    const certs = [...view.certificates].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
    const [open, setOpen] = useState<string | null>(null);
    const shownId = open ?? certs[0]?.certificateId ?? null;

    const onIssue = async () => {
        try {
            const r = await issue({ sessionId, runs: chosen }).unwrap();
            const c = "certificate" in r ? r.certificate : r;
            setOpen(c.certificateId);
            if (c.verdict === "VALID") toast.success("Certificate issued: VALID");
            else toast.warning("Certificate issued: REFUSED. The reasons are listed below.");
        } catch (e) {
            toast.error(errorText(e));
        }
    };

    return (
        <div className="space-y-6">
            <GoLive view={view} />

            <div className="space-y-3 rounded-lg border border-n-30 p-4 dark:border-border-default">
                <h3 className="text-h6 font-semibold text-text-primary">Ask for a certificate</h3>
                <p className="text-body-2 text-n-300 dark:text-n-60">
                    Pick the finished runs it should rest on. The decision is signed by the Network
                    Admin key and cites each run's evidence.
                </p>
                {finished.length === 0 ? (
                    <Empty>No finished runs yet. Run and finish one in the Run tab first.</Empty>
                ) : (
                    <ul className="space-y-2">
                        {finished.map((r) => (
                            <li
                                key={r.runId}
                                className="flex flex-wrap items-center gap-3 text-body-2"
                            >
                                <Checkbox
                                    id={`run-${r.runId}`}
                                    checked={chosen.includes(r.runId)}
                                    onCheckedChange={(v) =>
                                        setChosen((c) =>
                                            v ? [...c, r.runId] : c.filter((x) => x !== r.runId)
                                        )
                                    }
                                />
                                <label
                                    htmlFor={`run-${r.runId}`}
                                    className="flex flex-wrap items-center gap-2"
                                >
                                    <Mono>{r.runId}</Mono>
                                    {r.verdict && <StatusBadge value={r.verdict.verdict} />}
                                    <span className="text-n-300 dark:text-n-60">
                                        finished {time(r.finishedAt)}
                                    </span>
                                </label>
                            </li>
                        ))}
                    </ul>
                )}
                <Button onClick={onIssue} disabled={issuing || chosen.length === 0}>
                    {issuing ? <Spinner /> : <CheckBadgeIcon />} Issue certificate
                </Button>
            </div>

            {certs.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-h6 font-semibold text-text-primary">Certificates</h3>
                    <div className="flex flex-wrap gap-2">
                        {certs.map((c) => (
                            <Button
                                key={c.certificateId}
                                variant={c.certificateId === shownId ? "default" : "outline"}
                                size="sm"
                                onClick={() => setOpen(c.certificateId)}
                            >
                                {c.certificateId} · {c.verdict}
                            </Button>
                        ))}
                    </div>
                    {shownId && <CertificateDetail sessionId={sessionId} certificateId={shownId} />}
                </div>
            )}
        </div>
    );
};

const GoLive = ({ view }: { view: FdSessionView }) => {
    const g = view.goLive;
    return (
        <Alert
            variant={g.allowed ? "success" : "warning"}
            className="py-3"
            message={g.allowed ? "Go-live: allowed" : "Go-live: not allowed yet"}
            description={
                <span>
                    {g.reason}
                    {g.certificateId && (
                        <>
                            {" "}
                            · latest certificate <Mono>{g.certificateId}</Mono> ({g.status})
                        </>
                    )}
                </span>
            }
        />
    );
};

const CertificateDetail = ({
    sessionId,
    certificateId,
}: {
    sessionId: string;
    certificateId: string;
}) => {
    const { data, isFetching, error } = useGetFdCertificateQuery({ sessionId, certificateId });
    const [verify, verification] = useLazyVerifyFdCertificateQuery();
    if (isFetching && !data) return <Empty>Loading the certificate…</Empty>;
    if (error || !data)
        return (
            <Alert
                variant="error"
                className="py-3"
                message="Could not load the certificate"
                description={errorText(error)}
            />
        );
    const c = data.certificate;
    const unmet = c.items.filter((i) => i.outcome === "unmet");
    const met = c.items.filter((i) => i.outcome === "met").length;
    const required = c.items.filter((i) => i.requirement === "required").length;
    const v = verification.data;
    return (
        <article className="space-y-4 rounded-lg border border-n-30 p-4 dark:border-border-default">
            <header className="flex flex-wrap items-center gap-3">
                <StatusBadge value={c.verdict} className="text-sm" />
                <Mono>{c.certificateId}</Mono>
                <span className="text-body-2 text-n-300 dark:text-n-60">
                    issued {time(c.issuedAt)}
                </span>
            </header>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KeyValue label="Participant">{c.subscriberId}</KeyValue>
                <KeyValue label="Spec">{c.version}</KeyValue>
                <KeyValue label="Declaration">
                    v{c.declaration.version} · {c.declaration.actionGroups.join(", ")}
                </KeyValue>
                <KeyValue label="Required items met">
                    {met} of {required}
                </KeyValue>
                <KeyValue label="Runs cited">
                    {c.runs.map((r) => `${r.runId} (${r.exchanges} messages)`).join(", ")}
                </KeyValue>
                <KeyValue label="Signed by">{c.signer.keyId}</KeyValue>
            </dl>
            {c.reasons.length > 0 && (
                <div>
                    <h4 className="mb-1 font-semibold text-error-500">Why it was refused</h4>
                    <ul className="list-disc space-y-1 pl-5 text-body-2 text-error-500">
                        {c.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                        ))}
                    </ul>
                </div>
            )}
            {unmet.length > 0 && (
                <div>
                    <h4 className="mb-1 font-semibold text-text-primary">Required items not met</h4>
                    <ul className="space-y-1 text-body-2">
                        {unmet.map((i) => (
                            <li key={i.id}>
                                <Mono>{i.id}</Mono> {i.detail}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    variant="outline"
                    onClick={() => verify({ sessionId, certificateId })}
                    disabled={verification.isFetching}
                >
                    {verification.isFetching ? <Spinner /> : <ShieldCheckIcon />} Verify
                </Button>
                {v && (
                    <span className="flex flex-wrap items-center gap-2 text-body-2">
                        Signature{" "}
                        {v.signatureValid ? (
                            <StatusBadge value="pass" />
                        ) : (
                            <StatusBadge value="fail" />
                        )}
                        Status <StatusBadge value={v.status} />
                        Evidence{" "}
                        {v.evidenceIntact ? (
                            <StatusBadge value="pass" />
                        ) : (
                            <StatusBadge value="fail" />
                        )}
                        {v.reason && <span className="text-n-300">{v.reason}</span>}
                    </span>
                )}
            </div>
        </article>
    );
};
