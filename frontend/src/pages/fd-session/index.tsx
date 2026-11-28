import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import Spinner from "@components/Shadcn/Spinner";
import { FlowTabs, TabsContent } from "@components/Shadcn/Tabs";
import { useGetFdExchangesQuery, useGetFdSessionQuery } from "@store/api";
import { ROUTES } from "@constants/routes";
import { FD_ROLE_LABEL } from "@pages/fd-session/constants";
import { RunPanel } from "@pages/fd-session/RunPanel";
import { PlanPanel } from "@pages/fd-session/PlanPanel";
import { ExchangesPanel } from "@pages/fd-session/ExchangesPanel";
import { CertificatePanel } from "@pages/fd-session/CertificatePanel";
import type { FdSessionView } from "@pages/fd-session/types";
import { KeyValue, Mono, StatusBadge, errorText } from "@pages/fd-session/ui";

const TABS = [
    { key: "run", label: "Run" },
    { key: "plan", label: "Plan" },
    { key: "exchanges", label: "Exchanges" },
    { key: "certificate", label: "Certificate" },
];

/**
 * An FD (ONDC:FIS14:FD) Scenario Testing session. FD runs on its own workbench: this page shows
 * the participant it registered, the certification plan, runs and their verdicts, every message
 * exchanged (masked), and the certificate and go-live decision.
 */
const FdSessionPage = () => {
    const [params, setParams] = useSearchParams();
    const sessionId = params.get("sessionId") ?? "";
    const tab = TABS.some((t) => t.key === params.get("tab")) ? params.get("tab")! : "run";
    const setTab = (t: string) => {
        const next = new URLSearchParams(params);
        next.set("tab", t);
        setParams(next, { replace: true });
    };
    const [busy, setBusy] = useState(false);

    const session = useGetFdSessionQuery(
        { sessionId },
        { skip: !sessionId, pollingInterval: busy ? 3000 : 10_000 }
    );
    const live = busy || !!session.data?.runs.some((r) => r.status === "RUNNING");
    const exchanges = useGetFdExchangesQuery(
        { sessionId },
        {
            skip: !sessionId || !session.data,
            pollingInterval: live ? 2500 : tab === "exchanges" ? 10_000 : 0,
            refetchOnMountOrArgChange: true,
        }
    );

    if (!sessionId)
        return <Centered title="No FD session" text="Open an FD session from Scenario Testing." />;
    if (session.isLoading)
        return <Centered loading title="Loading the FD session" text="Asking the FD workbench…" />;
    if (session.error || !session.data) {
        return <Centered title="Could not load this FD session" text={errorText(session.error)} />;
    }
    const view = session.data;

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-page">
            <div className="mx-auto space-y-6 px-5 pt-6 pb-10 sm:px-8 md:px-10 lg:px-15 xl:px-20">
                <nav className="text-body-2 text-n-300 dark:text-n-60">
                    <Link to={ROUTES.SCENARIO} className="hover:text-brand-normal hover:underline">
                        Scenario Testing
                    </Link>
                    <span className="mx-2">/</span>
                    <span>FD session</span>
                </nav>
                <Header view={view} />
                <FlowTabs options={TABS} value={tab} onValueChange={setTab}>
                    <div className="pt-5">
                        <TabsContent value="run">
                            <RunPanel
                                view={view}
                                exchangeCount={exchanges.data?.length ?? 0}
                                busy={busy}
                                setBusy={setBusy}
                            />
                        </TabsContent>
                        <TabsContent value="plan">
                            <PlanPanel view={view} />
                        </TabsContent>
                        <TabsContent value="exchanges">
                            <ExchangesPanel
                                exchanges={exchanges.data}
                                isLoading={exchanges.isLoading}
                            />
                        </TabsContent>
                        <TabsContent value="certificate">
                            <CertificatePanel view={view} />
                        </TabsContent>
                    </div>
                </FlowTabs>
            </div>
        </div>
    );
};

const Header = ({ view }: { view: FdSessionView }) => {
    const p = view.participant;
    return (
        <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-brand-normal dark:text-n-0 md:text-4xl">
                    Fixed Deposit · {FD_ROLE_LABEL[view.session.role]}
                </h1>
                <StatusBadge
                    value={
                        view.goLive.allowed
                            ? "VALID"
                            : view.goLive.status === "NONE"
                              ? "not certified"
                              : view.goLive.status
                    }
                />
            </div>
            <dl className="grid gap-4 rounded-lg border border-n-30 p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-border-default">
                <KeyValue label="Subscriber ID">{view.session.participant}</KeyValue>
                <KeyValue label="Subscriber URL">{p?.subscriber_url ?? "—"}</KeyValue>
                <KeyValue label="Declaration">
                    {p?.hasDeclaration ? (
                        <>
                            v{p.declarationVersion} · {p.actionGroups.join(", ")}
                        </>
                    ) : (
                        "none: messages only, no certification plan"
                    )}
                </KeyValue>
                <KeyValue label="Spec">ONDC:FIS14:FD 0.1.4-draft</KeyValue>
                {view.counterpart && (
                    <div className="sm:col-span-2 lg:col-span-4">
                        <KeyValue
                            label={`The workbench plays the ${view.counterpart.role === "DEPOSIT_ISSUER" ? "deposit issuer" : "investor app"}`}
                        >
                            <Mono>{view.counterpart.subscriber_id}</Mono> at{" "}
                            <Mono>{view.counterpart.subscriber_url}</Mono>
                        </KeyValue>
                    </div>
                )}
            </dl>
        </header>
    );
};

const Centered = ({ title, text, loading }: { title: string; text: string; loading?: boolean }) => (
    <div className="flex min-h-[60vh] items-center justify-center bg-surface-page px-5">
        <div className="max-w-lg text-center">
            {loading ? (
                <Spinner className="mx-auto mb-4 size-12 text-brand-normal" />
            ) : (
                <ExclamationTriangleIcon className="mx-auto mb-4 size-14 text-alert-500" />
            )}
            <h2 className="mb-2 text-h5 font-semibold text-text-primary">{title}</h2>
            <p className="text-body-2 text-text-secondary">{text}</p>
            {!loading && (
                <Link
                    to={ROUTES.SCENARIO}
                    className="mt-4 inline-block text-brand-normal hover:underline"
                >
                    Back to Scenario Testing
                </Link>
            )}
        </div>
    </div>
);

export default FdSessionPage;
