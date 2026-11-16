import { useMemo, useState } from "react";
import { CodeBracketIcon, ShareIcon, Squares2X2Icon } from "@heroicons/react/24/outline";

import type { StudioContracts } from "@pages/protocol-studio/hooks/use-studio-contracts";
import { getSchemaRoot } from "@pages/protocol-studio/ui/editor/contracts/specs/schema";
import { linesAt } from "@pages/protocol-studio/ui/editor/contracts/yaml/lines";
import { UNSOLICITED_APIS } from "@pages/protocol-studio/ui/editor/graph/catalog";
import { FlowFacet } from "@pages/protocol-studio/ui/editor/stages/specification/flow-facet";
import { SchemaTree } from "@pages/protocol-studio/ui/editor/stages/specification/schema-tree";
import { SourcePane } from "@pages/protocol-studio/ui/editor/stages/specification/source-pane";
import {
    FACET_FILE,
    nextNonce,
    type SpecFacet,
    type SpecMode,
    type SpecSelection,
} from "@pages/protocol-studio/ui/editor/stages/specification/types";
import {
    testKeyFor,
    ValidationsFacet,
} from "@pages/protocol-studio/ui/editor/stages/specification/validations-facet";

type ApiSelection = Extract<SpecSelection, { kind: "api" }>;

interface IApiViewProps {
    selection: ApiSelection;
    contracts: StudioContracts;
    usedApis: Map<string, number>;
    /** Rail order. */
    allApis: string[];
    onSelectionChange: (selection: SpecSelection) => void;
    onShowOnProtocol?: (api: string) => void;
}

const kindOf = (api: string) =>
    (UNSOLICITED_APIS as readonly string[]).includes(api)
        ? "callback · may also arrive unsolicited"
        : api.startsWith("on_")
          ? "callback"
          : api.endsWith("_form")
            ? "form"
            : "request";

/** The selected api through its three facets: schema, validations, flow rules. */
export const ApiView = ({
    selection,
    contracts,
    usedApis,
    allApis,
    onSelectionChange,
    onShowOnProtocol,
}: IApiViewProps) => {
    const { api, facet, mode, focus } = selection;
    const { models, files } = contracts;
    const summary = contracts.apis.find((row) => row.api === api);
    const [schemaFilter, setSchemaFilter] = useState("");
    const go = (patch: Partial<ApiSelection>) => onSelectionChange({ ...selection, ...patch });
    const selectApi = (next: string) =>
        onSelectionChange({ kind: "api", api: next, facet, mode: "structured" });

    const root = useMemo(
        () => (models.spec ? getSchemaRoot(models.spec, api) : null),
        [models.spec, api]
    );
    const testKey = testKeyFor(models.validations, api);
    const index = testKey ? models.testIndex.get(testKey) : undefined;

    // Source: the file this facet edits, scrolled to (and tinting) this api's part of it.
    const file = FACET_FILE[facet];
    const source = useMemo(() => {
        const parsed = files[file].parsed;
        if (!parsed) return null;
        const block =
            file === "validations"
                ? ((testKey ? models.validations?.apiLines.get(testKey) : undefined) ?? null)
                : file === "actions"
                  ? linesAt(parsed, ["supportedActions", api])
                  : linesAt(parsed, ["paths", `/${api}`]);
        return block;
    }, [files, file, testKey, models.validations, api]);
    const revealLine = focus?.line ?? source?.line;

    const tabs: { id: SpecFacet; label: string; count?: string; hint: string }[] = [
        {
            id: "schema",
            label: "Schema",
            count: summary?.hasSchema ? undefined : "none",
            hint: "The request payload, from openapi.yaml",
        },
        {
            id: "validations",
            label: "Validations",
            count: String(summary?.tests ?? 0),
            hint: "The api-service's L1 tests, from validations.yaml",
        },
        {
            id: "flow",
            label: "Flow rules",
            count:
                summary?.next === null || summary?.next === undefined
                    ? "–"
                    : `←${summary.prev} →${summary.next}`,
            hint: "Which calls it may come after, and which may come next, from actions.yaml",
        },
    ];

    return (
        <section className="studio-glass studio-card studio-spec-view" aria-label={api}>
            <header className="studio-spec-view-head">
                <div className="min-w-0 flex-1">
                    <p className="studio-eyebrow">{kindOf(api)}</p>
                    <p className="studio-card-title studio-mono">{api}</p>
                </div>
                {summary?.used ? (
                    <button
                        type="button"
                        className="studio-key studio-key-sm"
                        onClick={() => onShowOnProtocol?.(api)}
                        disabled={!onShowOnProtocol}
                        title="Show the nodes that use it on the protocol"
                    >
                        <ShareIcon />
                        On protocol ×{summary.used}
                    </button>
                ) : (
                    <span className="studio-text-faint text-[11px]">not on the protocol</span>
                )}
            </header>
            <div className="studio-spec-tabs">
                <div className="studio-spec-facets" role="tablist" aria-label="Facets">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            className="studio-spec-facet"
                            data-facet={tab.id}
                            data-state={facet === tab.id ? "active" : undefined}
                            aria-selected={facet === tab.id}
                            title={tab.hint}
                            onClick={() => go({ facet: tab.id, focus: undefined })}
                        >
                            {tab.label}
                            {tab.count ? <span className="studio-count">{tab.count}</span> : null}
                        </button>
                    ))}
                </div>
                <div className="studio-segmented" role="tablist" aria-label="View">
                    {(["structured", "source"] as SpecMode[]).map((m) => (
                        <button
                            key={m}
                            type="button"
                            role="tab"
                            className="studio-segment studio-segment-xs"
                            data-mode={m}
                            data-state={mode === m ? "active" : undefined}
                            aria-selected={mode === m}
                            onClick={() => go({ mode: m, focus: undefined })}
                        >
                            {m === "structured" ? <Squares2X2Icon /> : <CodeBracketIcon />}
                            {m === "structured" ? "Structured" : "Source"}
                        </button>
                    ))}
                </div>
            </div>
            <div className="studio-spec-view-body" data-facet={facet} data-mode={mode}>
                {mode === "source" ? (
                    <SourcePane
                        contracts={contracts}
                        file={file}
                        reveal={revealLine ? { line: revealLine, nonce: focus?.nonce ?? 0 } : null}
                        highlight={
                            source ? { startLine: source.line, endLine: source.endLine } : null
                        }
                    />
                ) : facet === "schema" ? (
                    models.spec && root ? (
                        <div className="studio-spec-schema-pane">
                            <div className="studio-spec-toolbar">
                                <input
                                    className="bp-input studio-spec-search"
                                    placeholder="Find a field…"
                                    value={schemaFilter}
                                    onChange={(e) => setSchemaFilter(e.target.value)}
                                />
                                <span className="studio-spec-hint">
                                    ⚑ how many tests check a field · req = required
                                </span>
                            </div>
                            <SchemaTree
                                spec={models.spec}
                                root={root}
                                index={index}
                                filter={schemaFilter}
                                focusPath={focus?.path}
                                focusNonce={focus?.nonce}
                                onTests={(path) =>
                                    go({
                                        facet: "validations",
                                        focus: { path, nonce: nextNonce() },
                                    })
                                }
                                onRef={(component) =>
                                    onSelectionChange({
                                        kind: "file",
                                        file: "specs",
                                        mode: "structured",
                                        focus: { component, nonce: nextNonce() },
                                    })
                                }
                            />
                        </div>
                    ) : (
                        <div className="studio-spec-empty-state">
                            <p className="studio-empty-hint-title">
                                {files.specs.parsed?.errors.length
                                    ? "openapi.yaml doesn't parse"
                                    : `No request schema for ${api}`}
                            </p>
                            <p className="studio-empty-hint-sub">
                                {models.spec
                                    ? `openapi.yaml has no paths./${api} entry.`
                                    : "Import the spec's files from GitHub, or upload openapi.yaml."}
                            </p>
                        </div>
                    )
                ) : facet === "validations" ? (
                    <ValidationsFacet
                        api={api}
                        contracts={contracts}
                        focus={focus}
                        onShowPath={(path) =>
                            go({ facet: "schema", focus: { path, nonce: nextNonce() } })
                        }
                        onReveal={(line) =>
                            go({ mode: "source", focus: { line, nonce: nextNonce() } })
                        }
                    />
                ) : (
                    <FlowFacet
                        api={api}
                        contracts={contracts}
                        allApis={allApis}
                        usedApis={usedApis}
                        onSelectApi={selectApi}
                        onOpenMatrix={() =>
                            onSelectionChange({ kind: "file", file: "actions", mode: "structured" })
                        }
                    />
                )}
            </div>
        </section>
    );
};

export default ApiView;
