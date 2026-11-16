import { useMemo, useState } from "react";
import {
    DocumentTextIcon,
    ExclamationTriangleIcon,
    ShareIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";

import type {
    ApiSummary,
    StudioContracts,
} from "@pages/protocol-studio/hooks/use-studio-contracts";
import { ApiKindTile } from "@pages/protocol-studio/ui/editor/stages/specification/api-kind";
import {
    CONTRACT_FILE_IDS,
    type ContractFileId,
} from "@pages/protocol-studio/ui/editor/contracts/github";
import {
    FORM_APIS,
    getCallbackApi,
    REQUEST_APIS,
    UNSOLICITED_APIS,
} from "@pages/protocol-studio/ui/editor/graph/catalog";
import type { SpecSelection } from "@pages/protocol-studio/ui/editor/stages/specification/types";

type RailFilter = "all" | "used" | "tests" | "gaps";

const FILTERS: { id: RailFilter; label: string; hint: string }[] = [
    { id: "all", label: "All", hint: "Every api any file or the protocol names" },
    { id: "used", label: "Protocol", hint: "Apis the protocol graph uses" },
    { id: "tests", label: "Tested", hint: "Apis with validations" },
    { id: "gaps", label: "Gaps", hint: "Missing from a file: no schema, no tests or no flow row" },
];

/** Requests each followed by their callback, then unsolicited and form apis, then the rest A–Z. */
export const orderApis = (names: string[]) => {
    const order: string[] = [];
    for (const api of REQUEST_APIS) order.push(api, getCallbackApi(api));
    order.push(...UNSOLICITED_APIS, ...FORM_APIS);
    const rank = new Map(order.map((api, i) => [api, i]));
    return [...names].sort(
        (a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999) || a.localeCompare(b)
    );
};

/** What a file is missing for the api, worded for the gap marker's tooltip. */
const gapsOf = (row: ApiSummary) =>
    [
        row.hasSchema ? null : "No request schema in openapi.yaml",
        row.inValidations ? null : "No tests in validations.yaml",
        row.next === null ? "No flow rules row in actions.yaml" : null,
    ].filter((gap): gap is string => gap !== null);

const isGap = (row: ApiSummary) => gapsOf(row).length > 0;

interface IApiRailProps {
    contracts: StudioContracts;
    selection: SpecSelection;
    onSelectApi: (api: string) => void;
    onSelectFile: (file: ContractFileId) => void;
}

/**
 * Every api the contract or the protocol names, with what each file says
 * about it at a glance; below, the three files as wholes.
 */
export const ApiRail = ({ contracts, selection, onSelectApi, onSelectFile }: IApiRailProps) => {
    const [filter, setFilter] = useState<RailFilter>("all");
    const [query, setQuery] = useState("");
    const ordered = useMemo(() => {
        const byName = new Map(contracts.apis.map((row) => [row.api, row]));
        return orderApis([...byName.keys()]).map((api) => byName.get(api)!);
    }, [contracts.apis]);
    const shown = ordered.filter((row) => {
        if (query && !row.api.includes(query.trim().toLowerCase())) return false;
        if (filter === "used") return row.used > 0;
        if (filter === "tests") return row.tests > 0;
        if (filter === "gaps") return isGap(row);
        return true;
    });
    const gaps = ordered.filter(isGap).length;

    return (
        <aside className="studio-glass studio-stage-side studio-spec-rail" aria-label="Apis">
            <div className="studio-spec-rail-head">
                <input
                    className="bp-input"
                    placeholder={`${ordered.length} apis…`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Filter apis"
                />
                <div className="studio-segmented" role="tablist" aria-label="Show">
                    {FILTERS.map(({ id, label, hint }) => (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            className="studio-segment studio-segment-xs"
                            data-state={filter === id ? "active" : undefined}
                            aria-selected={filter === id}
                            title={hint}
                            onClick={() => setFilter(id)}
                        >
                            {label}
                            {id === "gaps" && gaps ? (
                                <span className="studio-count">{gaps}</span>
                            ) : null}
                        </button>
                    ))}
                </div>
            </div>
            <ul className="studio-spec-rail-list" aria-label="Apis">
                {shown.map((row) => {
                    const selected = selection.kind === "api" && selection.api === row.api;
                    return (
                        <li key={row.api}>
                            <button
                                type="button"
                                className="studio-spec-api"
                                data-api-row={row.api}
                                data-selected={selected || undefined}
                                data-used={row.used > 0 || undefined}
                                data-tests={row.tests}
                                data-next={row.next ?? undefined}
                                data-has-schema={row.hasSchema || undefined}
                                aria-current={selected || undefined}
                                onClick={() => onSelectApi(row.api)}
                            >
                                <ApiKindTile api={row.api} />
                                <span className="studio-mono truncate">{row.api}</span>
                                <span
                                    className="studio-spec-api-used"
                                    title={
                                        row.used
                                            ? `Used by ${row.used} ${row.used === 1 ? "node" : "nodes"} on the protocol`
                                            : "Not on the protocol"
                                    }
                                >
                                    {row.used ? (
                                        <>
                                            <ShareIcon />
                                            {row.used}
                                        </>
                                    ) : null}
                                </span>
                                <span
                                    className="studio-spec-api-tests"
                                    data-on={row.tests > 0 || undefined}
                                    title={
                                        row.tests
                                            ? `${row.tests} ${row.tests === 1 ? "test" : "tests"} in validations.yaml`
                                            : "No tests"
                                    }
                                >
                                    {row.tests ? (
                                        <>
                                            <ShieldCheckIcon />
                                            {row.tests}
                                        </>
                                    ) : (
                                        "–"
                                    )}
                                </span>
                                <span
                                    className="studio-spec-api-gap"
                                    title={gapsOf(row).join(" · ") || undefined}
                                >
                                    {isGap(row) ? <ExclamationTriangleIcon /> : null}
                                </span>
                            </button>
                        </li>
                    );
                })}
                {shown.length === 0 ? <li className="studio-spec-empty">No api matches.</li> : null}
            </ul>
            <div className="studio-spec-rail-files" aria-label="Whole files">
                <p className="studio-eyebrow">Whole file</p>
                {CONTRACT_FILE_IDS.map((id) => {
                    const view = contracts.files[id];
                    const selected = selection.kind === "file" && selection.file === id;
                    const state = view.parsed?.errors.length
                        ? "error"
                        : view.dirty
                          ? "edited"
                          : view.source === "endpoint"
                            ? "readonly"
                            : view.text === undefined
                              ? "missing"
                              : "clean";
                    return (
                        <button
                            key={id}
                            type="button"
                            className="studio-spec-api"
                            data-selected={selected || undefined}
                            data-contract-file={id}
                            data-state={state}
                            onClick={() => onSelectFile(id)}
                        >
                            <DocumentTextIcon className="size-3.5 shrink-0" />
                            <span className="studio-mono truncate">{view.label}</span>
                            <span className="studio-text-faint ml-auto text-[11px]">
                                {view.parsed
                                    ? `${view.parsed.census.lines} lines`
                                    : view.loading
                                      ? "…"
                                      : "—"}
                            </span>
                            <span
                                className="studio-spec-dot"
                                data-state={state}
                                aria-hidden="true"
                            />
                        </button>
                    );
                })}
            </div>
        </aside>
    );
};

export default ApiRail;
