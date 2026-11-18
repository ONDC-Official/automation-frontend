import { useEffect, useMemo } from "react";
import type { MockPlaygroundConfigV2Type } from "@ondc/automation-mock-runner";
import { toast } from "sonner";
import {
    ArrowPathIcon,
    CloudArrowDownIcon,
    CodeBracketIcon,
    ExclamationTriangleIcon,
    Squares2X2Icon,
} from "@heroicons/react/24/outline";

import type { StudioContracts } from "@pages/protocol-studio/hooks/use-studio-contracts";
import type { ContractFileId } from "@pages/protocol-studio/ui/editor/contracts/github";
import { isModKey, isShortcutBlocked } from "@pages/protocol-studio/ui/editor/shortcuts";
import { ActionsFile } from "@pages/protocol-studio/ui/editor/stages/specification/actions-file";
import { ApiRail, orderApis } from "@pages/protocol-studio/ui/editor/stages/specification/api-rail";
import { ApiView } from "@pages/protocol-studio/ui/editor/stages/specification/api-view";
import { ContractBar } from "@pages/protocol-studio/ui/editor/stages/specification/contract-bar";
import { MetaStrip } from "@pages/protocol-studio/ui/editor/stages/specification/meta-strip";
import { SpecPortalContext } from "@pages/protocol-studio/ui/editor/stages/specification/portal";
import { SourcePane } from "@pages/protocol-studio/ui/editor/stages/specification/source-pane";
import { SpecsFile } from "@pages/protocol-studio/ui/editor/stages/specification/specs-file";
import {
    FACET_FILE,
    nextNonce,
    type SpecMode,
    type SpecSelection,
} from "@pages/protocol-studio/ui/editor/stages/specification/types";
import { ValidationsFile } from "@pages/protocol-studio/ui/editor/stages/specification/validations-file";

export type { SpecSelection } from "@pages/protocol-studio/ui/editor/stages/specification/types";

export interface ISpecificationStageProps {
    config: MockPlaygroundConfigV2Type;
    onConfigChange: (config: MockPlaygroundConfigV2Type) => void;
    contracts: StudioContracts;
    /** api → how many protocol nodes use it (every level). */
    usedApis: Map<string, number>;
    selection: SpecSelection | null;
    onSelectionChange: (selection: SpecSelection) => void;
    /** Switches to the Protocol stage with the api's first node in view. */
    onShowOnProtocol?: (api: string) => void;
    /** The editor root: menus portal into it. */
    container: HTMLElement | null;
}

const FILE_TITLES: Record<ContractFileId, { eyebrow: string; title: string }> = {
    actions: {
        eyebrow: "actions.yaml · supportedActions & apiProperties",
        title: "Every transition",
    },
    validations: { eyebrow: "validations.yaml · _TESTS_", title: "All tests" },
    specs: { eyebrow: "openapi.yaml · paths & components", title: "Schemas" },
};

/**
 * Stage 1: the API contract a domain + version is built on. Three
 * hand-authored files (actions, validations, openapi), browsed api by api
 * with links between them, and edited without reformatting: every change is
 * a minimal splice of the file. Import from GitHub to edit; until then the
 * spec service's copy is shown read-only.
 */
export const SpecificationStage = ({
    config,
    onConfigChange,
    contracts,
    usedApis,
    selection,
    onSelectionChange,
    onShowOnProtocol,
    container,
}: ISpecificationStageProps) => {
    const allApis = useMemo(
        () => orderApis(contracts.apis.map((row) => row.api)),
        [contracts.apis]
    );

    // Default: the first api the protocol uses (else the first api), its validations.
    const fallback = useMemo<SpecSelection | null>(() => {
        const api = allApis.find((name) => (usedApis.get(name) ?? 0) > 0) ?? allApis[0];
        return api ? { kind: "api", api, facet: "validations", mode: "structured" } : null;
    }, [allApis, usedApis]);
    const current =
        selection && (selection.kind === "file" || allApis.includes(selection.api))
            ? selection
            : fallback;

    // ⌘Z / ⌘⇧Z undo structured edits of the file in view (Monaco keeps its own while typing).
    useEffect(() => {
        if (!current || current.mode === "source") return;
        const file = current.kind === "api" ? FACET_FILE[current.facet] : current.file;
        const onKey = (e: KeyboardEvent) => {
            if (!isModKey(e) || e.key.toLowerCase() !== "z" || isShortcutBlocked(e.target)) return;
            e.preventDefault();
            const done = e.shiftKey ? contracts.ops.redo(file) : contracts.ops.undo(file);
            if (!done) toast.info(e.shiftKey ? "Nothing to redo" : "Nothing to undo");
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [current, contracts.ops]);

    const selectApi = (api: string) =>
        onSelectionChange({
            kind: "api",
            api,
            facet: current?.kind === "api" ? current.facet : "validations",
            mode: "structured",
        });
    const selectFile = (file: ContractFileId) =>
        onSelectionChange({ kind: "file", file, mode: "structured" });

    const { branch, set } = contracts;
    const readOnlyBanner = !set ? (
        <div className="studio-spec-banner" data-tone="info">
            <CloudArrowDownIcon />
            <p className="min-w-0 flex-1">
                {contracts.sourceKind === "endpoint"
                    ? "Viewing the spec service's copy: read-only, with comments and shared anchors resolved. Import the files from GitHub to edit them."
                    : contracts.summary.loading
                      ? "Loading the spec…"
                      : "The spec service has no contract for this domain and version. Import the files from GitHub or upload them."}
            </p>
            {branch.suggested ? (
                <button
                    type="button"
                    className="studio-key studio-key-sm"
                    data-action="import-contracts"
                    disabled={contracts.importing}
                    onClick={async () => {
                        const ok = await contracts.ops.importFromGithub(
                            branch.suggested!.branch,
                            branch.suggested!.sha
                        );
                        if (ok) toast.success(`Imported ${branch.suggested!.branch}`);
                    }}
                >
                    {contracts.importing ? "Importing…" : `Import ${branch.suggested.branch}`}
                </button>
            ) : branch.loading ? (
                <span className="studio-text-faint text-[11px]">finding the branch…</span>
            ) : null}
        </div>
    ) : null;

    const fileView = current?.kind === "file" ? current : null;
    const fileMode: SpecMode = fileView?.mode ?? "structured";

    return (
        <SpecPortalContext.Provider value={container}>
            <div
                className="studio-stage-page studio-spec-page"
                data-stage="specification"
                data-contract-source={contracts.sourceKind}
            >
                {current ? (
                    <ApiRail
                        contracts={contracts}
                        selection={current}
                        onSelectApi={selectApi}
                        onSelectFile={selectFile}
                    />
                ) : null}
                <main className="studio-spec-main">
                    <div className="studio-glass studio-spec-header">
                        <MetaStrip config={config} onConfigChange={onConfigChange} />
                        <ContractBar contracts={contracts} onSelectFile={selectFile} />
                    </div>
                    {readOnlyBanner}
                    {contracts.summary.failed.length ? (
                        <div className="studio-spec-banner" data-tone="warn" data-load-error>
                            <ExclamationTriangleIcon />
                            <p className="min-w-0 flex-1">
                                Couldn't load{" "}
                                {contracts.summary.failed
                                    .map((id) => contracts.files[id].label)
                                    .join(", ")}{" "}
                                from GitHub ({contracts.loadError}). Your edits are safe; the
                                unedited files are read again from the imported commit.
                            </p>
                            <button
                                type="button"
                                className="studio-key studio-key-sm"
                                onClick={contracts.retry}
                            >
                                <ArrowPathIcon />
                                Retry
                            </button>
                        </div>
                    ) : null}
                    {contracts.importError ? (
                        <div className="studio-spec-banner" data-tone="warn">
                            <ExclamationTriangleIcon />
                            <p>{contracts.importError}</p>
                        </div>
                    ) : null}
                    {contracts.storageFull || contracts.persistFailed ? (
                        <div className="studio-spec-banner" data-tone="warn">
                            <ExclamationTriangleIcon />
                            <p>
                                This browser's storage is full: new edits aren't being kept across
                                reloads. Export the edited files (Export › Edited files) so nothing
                                is lost.
                            </p>
                        </div>
                    ) : null}

                    {!current ? (
                        <div className="studio-glass studio-card studio-spec-view">
                            <div className="studio-spec-empty-state">
                                <p className="studio-empty-hint-title">
                                    {contracts.summary.loading
                                        ? "Loading the contract…"
                                        : contracts.summary.failed.length
                                          ? "Couldn't load the contract"
                                          : "No apis yet"}
                                </p>
                                <p className="studio-empty-hint-sub">
                                    Import the spec's files from GitHub, or upload them.
                                </p>
                            </div>
                        </div>
                    ) : current.kind === "api" ? (
                        <ApiView
                            selection={current}
                            contracts={contracts}
                            usedApis={usedApis}
                            allApis={allApis}
                            onSelectionChange={onSelectionChange}
                            onShowOnProtocol={onShowOnProtocol}
                        />
                    ) : (
                        <section
                            className="studio-glass studio-card studio-spec-view"
                            aria-label={FILE_TITLES[current.file].title}
                        >
                            <header className="studio-spec-view-head">
                                <div className="min-w-0 flex-1">
                                    <p className="studio-eyebrow">
                                        {FILE_TITLES[current.file].eyebrow}
                                    </p>
                                    <p className="studio-card-title">
                                        {FILE_TITLES[current.file].title}
                                    </p>
                                </div>
                                <div className="studio-segmented" role="tablist" aria-label="View">
                                    {(["structured", "source"] as SpecMode[]).map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            role="tab"
                                            className="studio-segment studio-segment-xs"
                                            data-mode={m}
                                            data-state={fileMode === m ? "active" : undefined}
                                            aria-selected={fileMode === m}
                                            onClick={() =>
                                                onSelectionChange({
                                                    ...current,
                                                    mode: m,
                                                    focus: undefined,
                                                })
                                            }
                                        >
                                            {m === "structured" ? (
                                                <Squares2X2Icon />
                                            ) : (
                                                <CodeBracketIcon />
                                            )}
                                            {m === "structured" ? "Structured" : "Source"}
                                        </button>
                                    ))}
                                </div>
                            </header>
                            <div
                                className="studio-spec-view-body"
                                data-file={current.file}
                                data-mode={fileMode}
                            >
                                {fileMode === "source" ? (
                                    <SourcePane
                                        contracts={contracts}
                                        file={current.file}
                                        reveal={
                                            current.focus?.line
                                                ? {
                                                      line: current.focus.line,
                                                      nonce: current.focus.nonce,
                                                  }
                                                : null
                                        }
                                    />
                                ) : current.file === "actions" ? (
                                    <ActionsFile
                                        contracts={contracts}
                                        allApis={allApis}
                                        onSelectApi={selectApi}
                                    />
                                ) : current.file === "validations" ? (
                                    <ValidationsFile
                                        contracts={contracts}
                                        onSelectApi={(api) =>
                                            onSelectionChange({
                                                kind: "api",
                                                api,
                                                facet: "validations",
                                                mode: "structured",
                                            })
                                        }
                                        onReveal={(line) =>
                                            onSelectionChange({
                                                ...current,
                                                mode: "source",
                                                focus: { line, nonce: nextNonce() },
                                            })
                                        }
                                    />
                                ) : (
                                    <SpecsFile
                                        contracts={contracts}
                                        onSelectApi={(api) =>
                                            onSelectionChange({
                                                kind: "api",
                                                api,
                                                facet: "schema",
                                                mode: "structured",
                                            })
                                        }
                                        component={current.focus?.component}
                                        componentNonce={current.focus?.nonce}
                                    />
                                )}
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </SpecPortalContext.Provider>
    );
};

/** For the stage pill: e.g. "TRV11 2.1.0 · 24 apis · 3 files (1 edited)". */
export const describeContracts = (contracts: StudioContracts, domain: string, version: string) => {
    const { summary } = contracts;
    const head = `${domain.replace(/^ONDC:/i, "")} ${version}`;
    if (summary.loading && !summary.fileCount) return `${head} · loading contract…`;
    if (!summary.fileCount) return `${head} · no contract files`;
    const files = `${summary.fileCount} ${summary.fileCount === 1 ? "file" : "files"}`;
    if (summary.readOnly) return `${head} · ${summary.apiCount} apis · spec service (read-only)`;
    return `${head} · ${summary.apiCount} apis · ${files}${summary.edited ? ` (${summary.edited} edited)` : ""}`;
};

export default SpecificationStage;
