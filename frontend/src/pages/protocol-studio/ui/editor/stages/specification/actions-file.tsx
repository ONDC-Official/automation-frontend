import { lazy, Suspense, useMemo, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { toast } from "sonner";

import type { StudioContracts } from "@pages/protocol-studio/hooks/use-studio-contracts";
import {
    ENTRY_KEY,
    setAsyncPredecessor,
    toggleNext,
} from "@pages/protocol-studio/ui/editor/contracts/actions/model";

const SupportedActionsGraph = lazy(() => import("@pages/developer-guide/SupportedActionsGraph"));

interface IActionsFileProps {
    contracts: StudioContracts;
    /** Rail order. */
    allApis: string[];
    onSelectApi: (api: string) => void;
}

/**
 * actions.yaml whole: every transition as a matrix (row → may be followed by
 * column; click to toggle), or as the developer guide's graph; then each
 * api's properties.
 */
export const ActionsFile = ({ contracts, allApis, onSelectApi }: IActionsFileProps) => {
    const model = contracts.models.actions;
    const editable = contracts.ops.isEditable("actions");
    const [view, setView] = useState<"matrix" | "graph">("matrix");
    const [hover, setHover] = useState<{ row?: string; col?: string }>({});

    const apis = useMemo(() => {
        const known = model?.apis ?? [];
        return [
            ...allApis.filter((api) => known.includes(api)),
            ...known.filter((api) => !allApis.includes(api)),
        ];
    }, [allApis, model]);

    const graphData = useMemo(() => {
        if (!model) return null;
        const supportedActions: Record<string, string[]> = { [ENTRY_KEY]: model.entry ?? [] };
        for (const [from, to] of model.next) supportedActions[from] = to;
        const apiProperties: Record<
            string,
            { async_predecessor: string | null; transaction_partner: string[] }
        > = {};
        for (const [api, props] of model.props) {
            apiProperties[api] = {
                async_predecessor: props.asyncPredecessor,
                transaction_partner: props.partners,
            };
        }
        return { supportedActions, apiProperties };
    }, [model]);

    if (!model) {
        return <p className="studio-spec-empty">No actions.yaml to show.</p>;
    }

    const toggle = (from: string, to: string) => {
        const result = contracts.ops.applyEdit("actions", toggleNext(model, from, to));
        if (!result.ok) toast.error(result.error);
    };
    const rows = [ENTRY_KEY, ...apis];
    const transitions = [...model.next.values()].reduce(
        (n, list) => n + list.length,
        model.entry?.length ?? 0
    );

    return (
        <div className="studio-spec-file" data-file="actions">
            <div className="studio-spec-toolbar">
                <p className="studio-spec-hint min-w-0 flex-1">
                    {apis.length} apis · {transitions} allowed transitions
                    {editable ? " · click a cell to allow or forbid it" : ""}
                </p>
                <div className="studio-segmented" role="tablist" aria-label="View">
                    {(["matrix", "graph"] as const).map((v) => (
                        <button
                            key={v}
                            type="button"
                            role="tab"
                            className="studio-segment studio-segment-xs"
                            data-state={view === v ? "active" : undefined}
                            aria-selected={view === v}
                            onClick={() => setView(v)}
                        >
                            {v === "matrix" ? "Matrix" : "Graph"}
                        </button>
                    ))}
                </div>
            </div>

            {view === "graph" && graphData ? (
                <div className="studio-spec-graph">
                    <ReactFlowProvider>
                        <Suspense
                            fallback={<p className="studio-spec-empty">Loading the graph…</p>}
                        >
                            <SupportedActionsGraph supportedActions={graphData} />
                        </Suspense>
                    </ReactFlowProvider>
                </div>
            ) : (
                <div className="studio-spec-matrix-wrap" onMouseLeave={() => setHover({})}>
                    <table className="studio-spec-matrix">
                        <thead>
                            <tr>
                                <th className="studio-spec-matrix-corner">
                                    <span>after ↓</span>
                                    <span>next →</span>
                                </th>
                                {apis.map((col) => (
                                    <th
                                        key={col}
                                        scope="col"
                                        data-hover={hover.col === col || undefined}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => onSelectApi(col)}
                                            title={`Open ${col}`}
                                        >
                                            {col}
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => {
                                const allowed =
                                    row === ENTRY_KEY
                                        ? (model.entry ?? [])
                                        : (model.next.get(row) ?? []);
                                const hasRow =
                                    row === ENTRY_KEY ? model.entry !== null : model.next.has(row);
                                return (
                                    <tr key={row} data-entry={row === ENTRY_KEY || undefined}>
                                        <th scope="row" data-hover={hover.row === row || undefined}>
                                            {row === ENTRY_KEY ? (
                                                <span title={'The "null" key: calls allowed first'}>
                                                    first call
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectApi(row)}
                                                    title={
                                                        hasRow
                                                            ? `Open ${row}`
                                                            : `${row} has no row yet`
                                                    }
                                                >
                                                    {row}
                                                    {!hasRow ? (
                                                        <span className="studio-text-faint">
                                                            {" "}
                                                            ·
                                                        </span>
                                                    ) : null}
                                                </button>
                                            )}
                                        </th>
                                        {apis.map((col) => {
                                            const on = allowed.includes(col);
                                            return (
                                                <td key={col}>
                                                    <button
                                                        type="button"
                                                        className="studio-spec-cell"
                                                        data-on={on || undefined}
                                                        data-transition={`${row}->${col}`}
                                                        disabled={!editable}
                                                        onMouseEnter={() => setHover({ row, col })}
                                                        onClick={() => toggle(row, col)}
                                                        aria-label={`${row === ENTRY_KEY ? "Start with" : `${row} then`} ${col}: ${on ? "allowed" : "not allowed"}`}
                                                        title={`${row === ENTRY_KEY ? "first call" : row} → ${col}`}
                                                    >
                                                        {on ? "●" : ""}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <section className="studio-spec-props-table">
                <p className="studio-eyebrow">apiProperties</p>
                <table>
                    <thead>
                        <tr>
                            <th>api</th>
                            <th>async_predecessor</th>
                            <th>transaction_partner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {apis.map((api) => {
                            const props = model.props.get(api);
                            return (
                                <tr key={api}>
                                    <td>
                                        <button
                                            type="button"
                                            className="studio-mono"
                                            onClick={() => onSelectApi(api)}
                                        >
                                            {api}
                                        </button>
                                    </td>
                                    <td>
                                        <select
                                            className="bp-input studio-mono"
                                            value={props?.asyncPredecessor ?? ""}
                                            disabled={!editable}
                                            onChange={(e) => {
                                                const result = contracts.ops.applyEdit(
                                                    "actions",
                                                    setAsyncPredecessor(
                                                        model,
                                                        api,
                                                        e.target.value || null
                                                    )
                                                );
                                                if (!result.ok) toast.error(result.error);
                                            }}
                                        >
                                            <option value="">{props ? "null" : "—"}</option>
                                            {apis.map((a) => (
                                                <option key={a} value={a}>
                                                    {a}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="studio-mono studio-text-dim">
                                        {props?.partners.length
                                            ? props.partners.join(", ")
                                            : props
                                              ? "[]"
                                              : "—"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default ActionsFile;
