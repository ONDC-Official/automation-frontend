import { useMemo, useState } from "react";
import { FilterBadge } from "@components/Shadcn/Badge";
import Alert from "@components/Shadcn/Alert";
import type { FdSessionView, Requirement } from "@pages/fd-session/types";
import { Empty, Mono, StatusBadge } from "@pages/fd-session/ui";

const FILTERS: { key: Requirement | "all"; label: string }[] = [
    { key: "required", label: "Required" },
    { key: "when-seen", label: "When seen" },
    { key: "excluded", label: "Excluded" },
    { key: "all", label: "All" },
];

/** The certification plan: what this participant must show, from its capability declaration. */
export const PlanPanel = ({ view }: { view: FdSessionView }) => {
    const [filter, setFilter] = useState<Requirement | "all">("required");
    const items = useMemo(
        () => (view.plan?.items ?? []).filter((i) => filter === "all" || i.requirement === filter),
        [view.plan, filter]
    );
    if (!view.plan) {
        return (
            <Alert
                variant="warning"
                className="py-3"
                message="No certification plan"
                description={
                    view.planError ??
                    "The participant was registered without a capability declaration. Start a new session with one to get a plan."
                }
            />
        );
    }
    const count = (r: Requirement) => view.plan!.items.filter((i) => i.requirement === r).length;
    return (
        <div className="space-y-4">
            <p className="text-body-2 text-n-300 dark:text-n-60">
                Built from declaration version <Mono>{view.plan.declarationVersion}</Mono> over the
                action groups{" "}
                {view.plan.actionGroups
                    .map((g) => <Mono key={g}>{g}</Mono>)
                    .reduce<React.ReactNode[]>((a, g, i) => (i ? [...a, " ", g] : [g]), [])}
                . A certificate is <strong>VALID</strong> when every required item is met in a
                finished run. When-seen items are checked if they happen; excluded ones never count.
                {view.plan.packWebhook && (
                    <>
                        {" "}
                        The investor-app pack runs on <Mono>{view.plan.packWebhook}</Mono>.
                    </>
                )}
            </p>
            <div className="flex flex-wrap gap-1">
                {FILTERS.map((f) => (
                    <FilterBadge
                        key={f.key}
                        label={
                            f.key === "all"
                                ? `${f.label} (${view.plan!.items.length})`
                                : `${f.label} (${count(f.key)})`
                        }
                        selected={filter === f.key}
                        onClick={() => setFilter(f.key)}
                    />
                ))}
            </div>
            {items.length === 0 ? (
                <Empty>Nothing here.</Empty>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-n-30 dark:border-border-default">
                    <table className="w-full text-left text-body-2">
                        <thead className="bg-n-20 text-caption-1 uppercase tracking-wide text-n-300 dark:bg-surface-muted dark:text-n-60">
                            <tr>
                                <th className="px-3 py-2">Item</th>
                                <th className="px-3 py-2">Kind</th>
                                <th className="px-3 py-2">Requirement</th>
                                <th className="px-3 py-2">Why</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((i) => (
                                <tr
                                    key={i.id}
                                    className="border-t border-n-30 align-top dark:border-border-default"
                                >
                                    <td className="px-3 py-2">
                                        <Mono>{i.id.replace(/^(action|scenario|pack):/, "")}</Mono>
                                    </td>
                                    <td className="px-3 py-2 capitalize">{i.kind}</td>
                                    <td className="px-3 py-2">
                                        <StatusBadge value={i.requirement} />
                                    </td>
                                    <td className="px-3 py-2 text-n-300 dark:text-n-60">
                                        {i.note}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
