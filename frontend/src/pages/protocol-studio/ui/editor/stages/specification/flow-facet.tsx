import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
    ArrowRightIcon,
    PlayIcon,
    PlusIcon,
    TableCellsIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

import type { StudioContracts } from "@pages/protocol-studio/hooks/use-studio-contracts";
import {
    addApiRow,
    ENTRY_KEY,
    setAsyncPredecessor,
    toggleNext,
    togglePartner,
} from "@pages/protocol-studio/ui/editor/contracts/actions/model";
import type { ContractEdit } from "@pages/protocol-studio/ui/editor/contracts/yaml/plan";
import {
    ApiKindTile,
    specApiKind,
} from "@pages/protocol-studio/ui/editor/stages/specification/api-kind";

interface IFlowFacetProps {
    api: string;
    contracts: StudioContracts;
    /** Every api known (rail order), for the add pickers. */
    allApis: string[];
    usedApis: Map<string, number>;
    onSelectApi: (api: string) => void;
    onOpenMatrix: () => void;
}

/** A chip per api, clickable to go there, removable when editing. */
const ApiChips = ({
    apis,
    onOpen,
    onRemove,
    empty,
}: {
    apis: string[];
    onOpen: (api: string) => void;
    onRemove?: (api: string) => void;
    empty?: string;
}) =>
    apis.length ? (
        <div className="studio-spec-chips">
            {apis.map((api) => (
                <span key={api} className="studio-spec-chip">
                    <button
                        type="button"
                        className="studio-mono"
                        onClick={() => onOpen(api)}
                        title={`Open ${api}`}
                    >
                        {api}
                    </button>
                    {onRemove ? (
                        <button
                            type="button"
                            aria-label={`Remove ${api}`}
                            onClick={() => onRemove(api)}
                        >
                            <XMarkIcon />
                        </button>
                    ) : null}
                </span>
            ))}
        </div>
    ) : empty ? (
        <p className="studio-spec-hint">{empty}</p>
    ) : null;

/** A select of apis not already in `exclude`, protocol apis first. */
const AddApi = ({
    allApis,
    usedApis,
    exclude,
    label,
    className,
    onAdd,
}: {
    allApis: string[];
    usedApis: Map<string, number>;
    exclude: string[];
    label: string;
    className?: string;
    onAdd: (api: string) => void;
}) => {
    const [value, setValue] = useState("");
    const options = allApis.filter((api) => !exclude.includes(api));
    const used = options.filter((api) => usedApis.has(api));
    const rest = options.filter((api) => !usedApis.has(api));
    return (
        <select
            className={`bp-input studio-spec-add-select ${className ?? ""}`}
            value={value}
            aria-label={label}
            onChange={(e) => {
                if (e.target.value) onAdd(e.target.value);
                setValue("");
            }}
        >
            <option value="">+ {label}</option>
            {used.length ? (
                <optgroup label="On the protocol">
                    {used.map((api) => (
                        <option key={api} value={api}>
                            {api}
                        </option>
                    ))}
                </optgroup>
            ) : null}
            <optgroup label={used.length ? "Others" : "Apis"}>
                {rest.map((api) => (
                    <option key={api} value={api}>
                        {api}
                    </option>
                ))}
            </optgroup>
        </select>
    );
};

/** One side of the api: the calls it may come after, or the calls that may come next. */
const Lane = ({
    side,
    title,
    hint,
    count,
    children,
    footer,
}: {
    side: "before" | "after";
    title: string;
    hint: string;
    count?: number;
    children: ReactNode;
    footer?: ReactNode;
}) => (
    <section className="studio-spec-lane" data-side={side} aria-label={title}>
        <header className="studio-spec-lane-head">
            <p className="studio-spec-lane-title">
                {title}
                {count !== undefined ? <span className="studio-count">{count}</span> : null}
            </p>
            <p className="studio-spec-hint">{hint}</p>
        </header>
        <ul className="studio-spec-lane-list">{children}</ul>
        {footer}
    </section>
);

/** An api in a lane: opens it on click; × drops the transition. */
const LaneRow = ({
    api,
    next,
    onOpen,
    onRemove,
    removeHint,
}: {
    api: string;
    next?: boolean;
    onOpen: (api: string) => void;
    onRemove?: () => void;
    removeHint: string;
}) => (
    <li className="studio-spec-lane-row" data-flow-next={next ? api : undefined}>
        <button
            type="button"
            className="studio-spec-lane-open"
            onClick={() => onOpen(api)}
            title={`Open ${api}`}
        >
            <ApiKindTile api={api} />
            <span className="studio-mono truncate">{api}</span>
        </button>
        {onRemove ? (
            <button
                type="button"
                className="studio-spec-lane-remove"
                aria-label={`Remove ${api}`}
                title={removeHint}
                onClick={onRemove}
            >
                <XMarkIcon />
            </button>
        ) : null}
    </li>
);

/**
 * Where an api sits in a transaction (actions.yaml), laid out as a flow: the
 * calls it may come after on the left (and whether it may open one), the
 * calls that may come next on the right. The api-service's context validator
 * rejects any transition these don't allow. Below, apiProperties in plain
 * words: the request it answers and the calls it needs earlier.
 */
export const FlowFacet = ({
    api,
    contracts,
    allApis,
    usedApis,
    onSelectApi,
    onOpenMatrix,
}: IFlowFacetProps) => {
    const model = contracts.models.actions;
    const editable = contracts.ops.isEditable("actions");
    const edit = (edits: ContractEdit[]) => {
        const result = contracts.ops.applyEdit("actions", edits);
        if (!result.ok) toast.error(result.error);
    };

    if (!model) {
        return (
            <div className="studio-spec-empty-state">
                <p className="studio-empty-hint-title">
                    {contracts.files.actions.parsed?.errors.length
                        ? "actions.yaml doesn't parse"
                        : "No actions.yaml"}
                </p>
                <p className="studio-empty-hint-sub">
                    {contracts.files.actions.parsed?.errors.length
                        ? "Fix it in Source; the flow rules show again once it parses."
                        : "Import the spec's files from GitHub, or upload actions.yaml."}
                </p>
            </div>
        );
    }

    const next = model.next.get(api);
    const prev = model.prev.get(api) ?? [];
    const isEntry = !!model.entry?.includes(api);
    const props = model.props.get(api);

    return (
        <div className="studio-spec-flow" data-facet="flow">
            <div className="studio-spec-flow-intro">
                <p className="studio-spec-hint">
                    Where <code>{api}</code> may appear in a transaction. The api-service rejects
                    any call these rules don't allow.
                </p>
                <button type="button" className="studio-key studio-key-sm" onClick={onOpenMatrix}>
                    <TableCellsIcon />
                    Every transition
                </button>
            </div>

            <div className="studio-spec-lanes">
                <Lane
                    side="before"
                    title="Comes after"
                    hint={`${api} is accepted after these.`}
                    count={prev.length}
                    footer={
                        editable ? (
                            <AddApi
                                allApis={allApis}
                                usedApis={usedApis}
                                exclude={prev}
                                label="Add a call before"
                                className="studio-spec-lane-add"
                                onAdd={(from) => edit(toggleNext(model, from, api))}
                            />
                        ) : null
                    }
                >
                    <li className="studio-spec-lane-row" data-entry data-on={isEntry || undefined}>
                        <label
                            className="studio-spec-lane-open"
                            title={
                                'Listed under "null" in supportedActions: allowed as the first call'
                            }
                        >
                            <span className="studio-spec-kind" data-kind="start" aria-hidden="true">
                                <PlayIcon />
                            </span>
                            <span className="min-w-0 flex-1 truncate">Start of a transaction</span>
                            <input
                                type="checkbox"
                                role="switch"
                                className="studio-spec-toggle"
                                checked={isEntry}
                                disabled={!editable}
                                aria-label="Can start a transaction"
                                onChange={() => edit(toggleNext(model, ENTRY_KEY, api))}
                                data-action="toggle-entry"
                            />
                        </label>
                    </li>
                    {prev.map((from) => (
                        <LaneRow
                            key={from}
                            api={from}
                            onOpen={onSelectApi}
                            onRemove={
                                editable ? () => edit(toggleNext(model, from, api)) : undefined
                            }
                            removeHint={`Stop allowing ${api} after ${from}`}
                        />
                    ))}
                    {!prev.length && !isEntry ? (
                        <li className="studio-spec-lane-empty">
                            Nothing allows it yet, so the api-service rejects it.
                        </li>
                    ) : null}
                </Lane>

                <div className="studio-spec-lane-center" aria-hidden="true">
                    <ArrowRightIcon />
                    <span className="studio-spec-lane-self" data-kind={specApiKind(api)}>
                        <ApiKindTile api={api} />
                        <span className="studio-mono">{api}</span>
                    </span>
                    <ArrowRightIcon />
                </div>

                <Lane
                    side="after"
                    title="Comes next"
                    hint={`After ${api}, only these are accepted.`}
                    count={next?.length}
                    footer={
                        editable && next !== undefined ? (
                            <AddApi
                                allApis={allApis}
                                usedApis={usedApis}
                                exclude={next}
                                label="Add a call after"
                                className="studio-spec-lane-add"
                                onAdd={(to) => edit(toggleNext(model, api, to))}
                            />
                        ) : null
                    }
                >
                    {next === undefined ? (
                        <li className="studio-spec-lane-empty" data-tone="warn">
                            <span>
                                {api} has no row in supportedActions, so nothing may follow it.
                            </span>
                            {editable ? (
                                <button
                                    type="button"
                                    className="studio-key studio-key-xs"
                                    onClick={() => edit(addApiRow(model, api))}
                                >
                                    <PlusIcon />
                                    Add row
                                </button>
                            ) : null}
                        </li>
                    ) : next.length ? (
                        next.map((to) => (
                            <LaneRow
                                key={to}
                                api={to}
                                next
                                onOpen={onSelectApi}
                                onRemove={
                                    editable ? () => edit(toggleNext(model, api, to)) : undefined
                                }
                                removeHint={`Stop allowing ${to} after ${api}`}
                            />
                        ))
                    ) : (
                        <li className="studio-spec-lane-empty">
                            Nothing may follow it: the transaction ends here.
                        </li>
                    )}
                </Lane>
            </div>

            <section className="studio-spec-pairing" aria-label="Pairing">
                <header className="studio-spec-lane-head">
                    <p className="studio-spec-lane-title">Pairing</p>
                    <p className="studio-spec-hint">
                        From <code>apiProperties</code>
                        {props ? "." : ": no entry yet, setting either adds one."}
                    </p>
                </header>
                <div className="studio-spec-pair-row">
                    <div className="studio-spec-pair-label">
                        <p>Answers</p>
                        <p className="studio-spec-hint">
                            The request this call is the response to ·{" "}
                            <code>async_predecessor</code>
                        </p>
                    </div>
                    <select
                        className="bp-input studio-mono studio-spec-pair-select"
                        value={props?.asyncPredecessor ?? ""}
                        disabled={!editable}
                        aria-label="async_predecessor"
                        onChange={(e) =>
                            edit(setAsyncPredecessor(model, api, e.target.value || null))
                        }
                    >
                        <option value="">none</option>
                        {allApis.map((a) => (
                            <option key={a} value={a}>
                                {a}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="studio-spec-pair-row">
                    <div className="studio-spec-pair-label">
                        <p>Needs earlier</p>
                        <p className="studio-spec-hint">
                            Calls that must already be in the transaction ·{" "}
                            <code>transaction_partner</code>
                        </p>
                    </div>
                    <div className="studio-spec-pair-control">
                        <ApiChips
                            apis={props?.partners ?? []}
                            onOpen={onSelectApi}
                            onRemove={
                                editable ? (p) => edit(togglePartner(model, api, p)) : undefined
                            }
                            empty={editable ? undefined : "none"}
                        />
                        {editable ? (
                            <AddApi
                                allApis={allApis}
                                usedApis={usedApis}
                                exclude={props?.partners ?? []}
                                label="Add"
                                onAdd={(p) => edit(togglePartner(model, api, p))}
                            />
                        ) : null}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default FlowFacet;
