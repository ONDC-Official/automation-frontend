import { useMemo } from "react";
import { ExclamationCircleIcon, LockClosedIcon } from "@heroicons/react/24/outline";

import type { StudioContracts } from "@pages/protocol-studio/hooks/use-studio-contracts";
import type { ContractFileId } from "@pages/protocol-studio/ui/editor/contracts/github";
import {
    CONTRACT_MARKER_OWNER,
    toMonacoMarkers,
} from "@pages/protocol-studio/ui/editor/contracts/yaml/markers";
import { InspectorCodePane } from "@pages/protocol-studio/ui/editor/inspector/code-pane";

interface ISourcePaneProps {
    contracts: StudioContracts;
    file: ContractFileId;
    /** Line to scroll to (1-based) and a nonce so the same line scrolls again. */
    reveal?: { line: number; nonce: number } | null;
    /** Lines to tint: the selected api's block. */
    highlight?: { startLine: number; endLine: number } | null;
}

/** Monaco model path: under `studio://config/…`, which the shell never disposes. */
export const contractModelPath = (setKey: string, file: ContractFileId) =>
    `studio://config/contracts/${encodeURIComponent(setKey)}/${file}.yaml`;

/**
 * A contract file as YAML in Monaco: editable once imported (typing is parsed
 * as it settles; YAML errors are marked), read-only for the spec service's copy.
 */
export const SourcePane = ({ contracts, file, reveal, highlight }: ISourcePaneProps) => {
    const view = contracts.files[file];
    const markers = useMemo(
        () =>
            view.parsed
                ? { owner: CONTRACT_MARKER_OWNER, items: toMonacoMarkers(view.parsed) }
                : null,
        [view.parsed]
    );
    const revealTarget = useMemo(
        () => (reveal ? { line: reveal.line, column: 1, length: 0, nonce: reveal.nonce } : null),
        [reveal?.line, reveal?.nonce]
    );

    if (view.text === undefined) {
        return (
            <p className="studio-spec-empty">
                {view.loading
                    ? `Loading ${view.label}…`
                    : `No ${view.label} yet: import from GitHub or upload one.`}
            </p>
        );
    }

    const errors = view.parsed?.errors ?? [];
    return (
        <div className="studio-spec-source" data-file={file} data-parse-errors={errors.length}>
            <div className="studio-spec-source-bar">
                <span className="studio-mono truncate">{view.path ?? view.label}</span>
                {!view.editable ? (
                    <span
                        className="studio-badge"
                        title="The spec service's copy can't be edited: import the file from GitHub"
                    >
                        <LockClosedIcon className="size-3" />
                        read-only
                    </span>
                ) : null}
                <span className="min-w-0 flex-1" />
                {errors.length ? (
                    <span
                        className="studio-spec-bad"
                        title={errors.map((e) => `line ${e.line}: ${e.message}`).join("\n")}
                    >
                        <ExclamationCircleIcon className="inline size-3.5" /> {errors.length} YAML{" "}
                        {errors.length === 1 ? "error" : "errors"} · structured views show the last
                        version that parsed
                    </span>
                ) : (
                    <span className="studio-text-faint text-[11px]">
                        {view.parsed?.census.lines ?? 0} lines · {view.parsed?.census.anchors ?? 0}{" "}
                        anchors · {view.parsed?.census.aliases ?? 0} reuses
                    </span>
                )}
            </div>
            <div className="studio-well min-h-0 flex-1">
                <InspectorCodePane
                    path={contractModelPath(contracts.key, file)}
                    language="yaml"
                    value={view.text}
                    readOnly={!view.editable}
                    onChange={(text) => contracts.ops.setText(file, text)}
                    reveal={revealTarget}
                    markers={markers}
                    highlight={highlight}
                />
            </div>
        </div>
    );
};

export default SourcePane;
