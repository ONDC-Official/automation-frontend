import { type FC, lazy, Suspense, useState } from "react";
import GuideSearchInput from "../shared/components/GuideSearchInput";
import { EmptyState } from "../shared/components/states";
import ActionCard from "./ActionCard";
import EntryPointsBanner from "./EntryPointsBanner";
import Legend from "./Legend";
import ViewToggle from "./ViewToggle";
import { useActionFocus } from "./useActionFocus";
import type { SupportedActionsViewMode, SupportedActionsViewProps } from "./types";

const SupportedActionsGraph = lazy(() => import("../SupportedActionsGraph"));

const SupportedActionsView: FC<SupportedActionsViewProps> = ({ supportedActions }) => {
    const [view, setView] = useState<SupportedActionsViewMode>("cards");
    const {
        search,
        setSearch,
        focused,
        setFocused,
        toggleFocus,
        actionMap,
        apiProperties,
        entryPoints,
        allApis,
        filteredApis,
        getRelationship,
    } = useActionFocus(supportedActions);

    const hasSearch = search.trim().length > 0;

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                    <span className="font-medium text-slate-700">{filteredApis.length}</span>
                    {hasSearch ? ` of ${allApis.length} actions` : " actions"}
                    {entryPoints.size > 0 && !hasSearch && (
                        <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">
                            · {entryPoints.size} entry point{entryPoints.size !== 1 ? "s" : ""}
                        </span>
                    )}
                </p>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <ViewToggle view={view} onChange={setView} />
                    <GuideSearchInput
                        value={search}
                        onChange={setSearch}
                        accent="sky"
                        placeholder="Filter actions…"
                        className="sm:w-72"
                    />
                </div>
            </div>

            {view === "cards" && <Legend focused={focused} onClearFocus={() => setFocused(null)} />}

            {view === "graph" && (
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center h-64 rounded-2xl border border-slate-200 bg-slate-50 dark:bg-surface-muted text-sm text-slate-400">
                            Loading graph…
                        </div>
                    }
                >
                    <SupportedActionsGraph supportedActions={supportedActions} />
                </Suspense>
            )}

            {view === "cards" && entryPoints.size > 0 && !hasSearch && (
                <EntryPointsBanner
                    entryPoints={[...entryPoints]}
                    focused={focused}
                    onToggleFocus={toggleFocus}
                />
            )}

            {view === "cards" && (
                <div className="grid gap-4 sm:grid-cols-2">
                    {filteredApis.map((api) => {
                        const props = apiProperties[api];
                        return (
                            <ActionCard
                                key={api}
                                api={api}
                                nextActions={actionMap[api] ?? []}
                                requiredHistory={props?.transaction_partner ?? []}
                                asyncPredecessor={props?.async_predecessor ?? null}
                                isEntry={entryPoints.has(api)}
                                relationship={getRelationship(api)}
                                focused={focused}
                                onToggleFocus={toggleFocus}
                            />
                        );
                    })}
                </div>
            )}

            {view === "cards" && filteredApis.length === 0 && (
                <EmptyState
                    message="No actions match your search."
                    hint="Try a different keyword or clear the filter."
                />
            )}
        </div>
    );
};

export default SupportedActionsView;
