import { FC } from "react";
import { PlayCircleIcon, SignalIcon } from "@heroicons/react/24/outline";
import { useFrameworkHealth } from "@hooks/useFrameworkHealth";
import { Badge } from "@components/Shadcn/Badge";
import { Button } from "@components/Shadcn/Button";
import Spinner from "@components/Shadcn/Spinner";
import { cn } from "@/lib/utils";
import HealthReport from "./HealthReport";

interface TestCard {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    action: () => void;
    isRunning: boolean;
    actionLabel: string;
    icon: React.ReactNode;
}

const FrameworkHealthPage: FC = () => {
    const { isRunning, report, lastChecked, runApiServiceCheck } = useFrameworkHealth();

    const testCards: TestCard[] = [
        {
            id: "api-service",
            title: "API Services",
            subtitle: "Domain & version health",
            description:
                "Runs a test search request against every domain & version registered in the config service and reports which are returning 200.",
            action: runApiServiceCheck,
            isRunning: isRunning,
            actionLabel: "Test API Services",
            icon: <SignalIcon className="size-5 text-brand-normal" aria-hidden />,
        },
        // Future tests can be added here as additional cards
    ];

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-white dark:bg-surface-page">
            <div className="mx-auto px-5 sm:px-8 md:px-10 lg:px-15 xl:px-20 pt-6 pb-8 space-y-10">
                <header className="mb-6">
                    <h1 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-brand-normal dark:text-n-0 md:text-4xl">
                        Healthcheck Dashboard
                    </h1>
                    <p className="text-body-1 text-n-300 dark:text-n-60">
                        Run health checks across ONDC framework services. Each card below represents
                        an independent test suite — click to run it.
                    </p>
                </header>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 mb-6">
                    {testCards.map((card) => {
                        const statusBadge =
                            report && card.id === "api-service" ? (
                                <Badge
                                    variant={
                                        report.summary.totalUnhealthy === 0 ? "success" : "error"
                                    }
                                >
                                    {report.summary.totalUnhealthy === 0
                                        ? "All OK"
                                        : `${report.summary.totalUnhealthy} failing`}
                                </Badge>
                            ) : null;

                        return (
                            <article
                                key={card.id}
                                className={cn(
                                    "group relative flex h-full min-w-0 flex-col gap-5 overflow-hidden rounded-2xl border border-n-40 bg-white p-6 dark:border-n-60 dark:bg-surface-elevated",
                                    "transition-all duration-200 hover:border-brand-normal/40 hover:shadow-lg hover:shadow-brand-normal/10 dark:hover:border-brand-normal/30 dark:hover:shadow-brand-normal/5"
                                )}
                            >
                                <div className="absolute inset-x-0 top-0 h-0.75 rounded-t-2xl bg-linear-to-r from-brand-normal to-brand-normal/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-n-40 bg-brand-light transition-colors duration-200 group-hover:bg-brand-light-active dark:border-n-60 dark:bg-brand-normal/10 dark:group-hover:bg-brand-normal/20">
                                        {card.icon}
                                    </div>
                                    {statusBadge}
                                </div>

                                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                                    <h2 className="mb-1 text-base font-bold text-n-900 transition-colors duration-200 group-hover:text-brand-normal dark:text-n-0">
                                        {card.title}
                                    </h2>
                                    <p className="mb-2 text-caption-2-size font-semibold uppercase tracking-wide text-brand-normal">
                                        {card.subtitle}
                                    </p>
                                    <p className="mb-5 flex-1 text-body-2 leading-relaxed text-n-300 dark:text-n-60">
                                        {card.description}
                                    </p>
                                    <Button
                                        className="w-full"
                                        onClick={card.action}
                                        disabled={card.isRunning}
                                        isLoading={card.isRunning}
                                    >
                                        {card.isRunning ? (
                                            "Running…"
                                        ) : (
                                            <>
                                                <PlayCircleIcon className="size-4" aria-hidden />
                                                {card.actionLabel}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </article>
                        );
                    })}
                </div>

                {isRunning && (
                    <div className="flex items-center gap-4 rounded-2xl border border-n-40 bg-brand-light/40 px-6 py-5 dark:border-n-60 dark:bg-surface-elevated">
                        <Spinner className="size-8 shrink-0 text-brand-normal" />
                        <div>
                            <p className="text-body-1 font-medium text-n-900 dark:text-n-0">
                                Health check in progress…
                            </p>
                            <p className="mt-0.5 text-body-2 text-n-300 dark:text-n-60">
                                Sending test requests to all registered domain/version combinations.
                                This may take up to 5 minutes.
                            </p>
                        </div>
                    </div>
                )}

                {report && !isRunning && (
                    <section className="space-y-5">
                        <div>
                            <h2 className="text-xl font-semibold text-brand-normal">Results</h2>
                            <p className="mt-1 text-body-2 text-n-300 dark:text-n-60">
                                Domain and version health from the latest API Services check.
                            </p>
                        </div>
                        <HealthReport report={report} lastChecked={lastChecked} />
                    </section>
                )}
            </div>
        </div>
    );
};

export default FrameworkHealthPage;
