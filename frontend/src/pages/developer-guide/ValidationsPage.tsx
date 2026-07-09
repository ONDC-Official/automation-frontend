import { type FC, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useGetValidationTableQuery } from "@store/api";
import ValidationsTable from "./ValidationsTable";
import Spinner from "@components/Shadcn/Spinner";
import { Button } from "@/components/Shadcn/Button";
import GuideTabs, { type GuideTabItem } from "./shared/components/GuideTabs";
import GuideHeader from "./shared/components/GuideHeader";

const ValidationsPage: FC = () => {
    const { domain: rawDomain, version: rawVersion } = useParams<{
        domain: string;
        version: string;
    }>();
    const domain = rawDomain ? decodeURIComponent(rawDomain) : "";
    const version = rawVersion ? decodeURIComponent(rawVersion) : "";

    const [selectedAction, setSelectedAction] = useState<string>("");

    const {
        data: validationTableSection,
        isFetching,
        isError,
        refetch,
    } = useGetValidationTableQuery({ domain, version }, { skip: !domain || !version });

    const table =
        validationTableSection?.table && Object.keys(validationTableSection.table).length > 0
            ? validationTableSection.table
            : null;

    const loading = Boolean(domain && version) && isFetching;
    const error =
        !domain || !version
            ? "Missing domain or version in URL."
            : isError
              ? "Failed to load validations. Check domain/version and try again."
              : null;

    useEffect(() => {
        if (!domain || !version) return;
        setSelectedAction(table ? Object.keys(table).sort()[0] : "");
    }, [table, domain, version]);

    const sortedActions = useMemo(() => (table ? Object.keys(table).sort() : []), [table]);

    const tabs: GuideTabItem[] = useMemo(
        () => sortedActions.map((action) => ({ id: action, label: action })),
        [sortedActions]
    );

    const selectedValidations = table && selectedAction ? table[selectedAction] : undefined;

    return (
        <div className="relative bg-white dark:bg-surface-page min-h-screen flex flex-col">
            <GuideHeader>
                <div className="px-6 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            X-Validations
                        </p>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-sm text-slate-800 truncate">{domain}</span>
                        {version && (
                            <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-mono font-semibold">
                                v{version}
                            </span>
                        )}
                    </div>
                </div>
                {tabs.length > 0 && (
                    <div className="px-6 pt-3 pb-2 bg-white dark:bg-surface-elevated shadow-xs overflow-x-auto">
                        <GuideTabs
                            tabs={tabs}
                            active={selectedAction}
                            onChange={setSelectedAction}
                        />
                    </div>
                )}
            </GuideHeader>

            <div className="grow px-6 py-6">
                {loading && (
                    <div className="flex h-[60vh] items-center justify-center">
                        <Spinner className="size-8 text-brand-normal" />
                    </div>
                )}
                {!loading && error && (
                    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
                        <p className="text-sm text-slate-600">{error}</p>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => refetch()}
                            className="px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 text-sm font-medium"
                        >
                            Retry
                        </Button>
                    </div>
                )}
                {!loading && !error && !selectedValidations && (
                    <div className="flex items-center justify-center h-[60vh]">
                        <p className="text-sm text-slate-500">
                            No validations found for {domain} v{version}.
                        </p>
                    </div>
                )}
                {!loading && !error && selectedValidations && (
                    <ValidationsTable validations={selectedValidations} />
                )}
            </div>
        </div>
    );
};

export default ValidationsPage;
