import { useMemo, useState } from "react";
import { stringify as yamlStringify } from "yaml";

import type { XValidationTestGroup } from "@/types/apiShared/developerGuide/developerGuide.types";
import { useGetSpecQuery } from "@store/api";
import { InspectorCodePane } from "@pages/protocol-studio/ui/editor/inspector/code-pane";
import { getTestKey, RESERVED } from "@pages/protocol-studio/ui/editor/contracts/validations/model";

export interface IValidationsViewProps {
    api: string;
    domain: string;
    version: string;
    /** validations.yaml as imported in the Specification stage; null / absent reads the spec service's copy. */
    imported?: { tests: Tests; source: string } | null;
    /** Opens these tests in the Specification stage, where they can be edited. */
    onOpenTests?: (api: string) => void;
}

type Tests = Record<string, XValidationTestGroup[]>;

const asText = (value: unknown) =>
    typeof value === "string" ? value : value == null ? "" : JSON.stringify(value);

/** One rule, or a nested group of rules (`_RETURN_` can be a list). */
const Rule = ({ rule, depth }: { rule: XValidationTestGroup; depth: number }) => {
    const operands = Object.entries(rule).filter(([key]) => !RESERVED.has(key));
    const ret = rule._RETURN_;
    return (
        <li className="studio-val-rule" style={{ "--depth": depth } as React.CSSProperties}>
            <div className="studio-val-head">
                <span className="studio-mono studio-text">{rule._NAME_ || "(unnamed)"}</span>
                {rule._SCOPE_ ? (
                    <span className="studio-chip" title="_SCOPE_">
                        <span className="studio-chip-label">scope</span>
                        <span className="studio-chip-value studio-mono">
                            {asText(rule._SCOPE_)}
                        </span>
                    </span>
                ) : null}
                {rule._CONTINUE_ ? (
                    <span className="studio-chip" title="_CONTINUE_">
                        <span className="studio-chip-label">continue</span>
                        <span className="studio-chip-value studio-mono">
                            {asText(rule._CONTINUE_)}
                        </span>
                    </span>
                ) : null}
            </div>
            {rule._DESCRIPTION_ ? (
                <p className="studio-text-dim text-[11.5px]">{asText(rule._DESCRIPTION_)}</p>
            ) : null}
            {operands.length ? (
                <dl className="studio-val-operands">
                    {operands.map(([key, value]) => (
                        <div key={key}>
                            <dt className="studio-mono">{key}</dt>
                            <dd className="studio-mono">{asText(value)}</dd>
                        </div>
                    ))}
                </dl>
            ) : null}
            {typeof ret === "string" ? (
                <p className="studio-val-return studio-mono" title="_RETURN_">
                    {ret}
                </p>
            ) : Array.isArray(ret) ? (
                <ul className="studio-val-list">
                    {ret.map((child, index) => (
                        <Rule key={index} rule={child as XValidationTestGroup} depth={depth + 1} />
                    ))}
                </ul>
            ) : null}
        </li>
    );
};

/**
 * The api's tests, read-only: a tree of test groups and rules, or the YAML.
 * They come from validations.yaml as imported in the Specification stage
 * (where they're edited), else from the spec service (`x-validations._TESTS_`).
 */
export const ValidationsView = ({
    api,
    domain,
    version,
    imported,
    onOpenTests,
}: IValidationsViewProps) => {
    const {
        data,
        isLoading: loadingSpec,
        isError: specError,
    } = useGetSpecQuery({ domain, version, include: ["validations"] }, { skip: !!imported });
    const isLoading = !imported && loadingSpec;
    const isError = !imported && specError;
    const [mode, setMode] = useState<"tree" | "source">("tree");

    const tests = useMemo<Tests | null>(() => {
        if (imported) return imported.tests;
        const raw = data?.["x-validations"]?.["_TESTS_"];
        return raw && typeof raw === "object" ? (raw as Tests) : null;
    }, [data, imported]);
    const key = tests ? getTestKey(tests, api) : undefined;
    const groups = key ? tests?.[key] : undefined;
    const source = useMemo(
        () => (key && groups ? yamlStringify({ _TESTS_: { [key]: groups } }) : ""),
        [key, groups]
    );

    let body: React.ReactNode;
    if (isLoading) {
        body = <p className="studio-text-faint px-3 py-3 text-[12px]">Loading the contract…</p>;
    } else if (isError || !tests) {
        body = (
            <p className="studio-text-faint px-3 py-3 text-[12px]">
                {isError
                    ? "Couldn't fetch the spec's validations."
                    : `No validations.yaml is published for ${domain} ${version}.`}
            </p>
        );
    } else if (!groups || groups.length === 0) {
        body = (
            <p className="studio-text-faint px-3 py-3 text-[12px]">
                No tests for <span className="studio-mono">{api}</span> in validations.yaml ·{" "}
                {Object.keys(tests).length} apis have tests.
            </p>
        );
    } else if (mode === "source") {
        body = (
            <InspectorCodePane
                // Under `config`: the shell disposes `studio://` models of any other authority that isn't a node.
                path={`studio://config/validations/${encodeURIComponent(key ?? api)}.yaml`}
                language="yaml"
                value={source}
                readOnly
            />
        );
    } else {
        body = (
            <ul className="studio-val-list min-h-0 flex-1 overflow-auto px-3 py-2">
                {groups.map((group, index) => (
                    <Rule key={index} rule={group} depth={0} />
                ))}
            </ul>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="studio-hairline-b flex items-center gap-2 px-3 py-1.5">
                <span className="studio-eyebrow">validations.yaml</span>
                <span className="studio-text-faint truncate text-[11px]" title={imported?.source}>
                    {key ? `_TESTS_.${key}` : api} ·{" "}
                    {imported ? imported.source : "spec service · read-only"}
                </span>
                {onOpenTests ? (
                    <button
                        type="button"
                        className="studio-key studio-key-xs"
                        onClick={() => onOpenTests(key ?? api)}
                        title="Open these tests in the Specification stage to edit them"
                    >
                        Edit
                    </button>
                ) : null}
                {groups?.length ? (
                    <div className="studio-segmented ml-auto" role="tablist" aria-label="View">
                        {(["tree", "source"] as const).map((m) => (
                            <button
                                key={m}
                                type="button"
                                role="tab"
                                className="studio-segment studio-segment-xs"
                                data-state={mode === m ? "active" : undefined}
                                aria-selected={mode === m}
                                onClick={() => setMode(m)}
                            >
                                {m === "tree" ? "Tree" : "Source"}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>
            {body}
        </div>
    );
};

export default ValidationsView;
