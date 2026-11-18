import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

import type { SpecTypes } from "@pages/protocol-studio/hooks/use-spec-types";

interface ITypesControlProps {
    types: SpecTypes;
    /** Opens the generated declarations in a popup. */
    onViewTypes: () => void;
    /** The use case `sessionData` is typed for; null types it across all of them. */
    usecase: string | null;
    onUsecaseChange: (usecase: string | null) => void;
    /** Downloads the session schema in use, to curate and publish with the spec. */
    onDownloadSession: () => void;
}

/** Where step code's types came from, one fact per line. */
export const describeTypes = (types: SpecTypes): string[] => {
    if (types.status === "loading") return ["Generating types from the spec…"];
    if (types.status === "unavailable") {
        return [`${types.error ?? "No spec"}: payloads and sessionData are untyped (any)`];
    }
    const lines = [`${types.apiCount} APIs typed from the spec's JSON Schemas (Payload<"…">)`];
    const session = types.session;
    if (session) {
        const single = Object.values(session.schema.keys).filter(
            (key) => key.cardinality === "one"
        ).length;
        lines.push(
            `sessionData: ${session.schema.id}, inferred from ${session.report.flows} published flows`,
            `${session.report.keys} keys, ${single} single-valued (unwrapped in SessionData)`,
            `${session.report.conflicts.length} saved from several paths (union types)`,
            `${session.report.unresolved.length} paths not in the API schema (typed any)`
        );
    } else {
        lines.push("sessionData: untyped until the published flows load");
    }
    return lines;
};

/**
 * Header control for what step code is typed against: the spec's API schemas
 * and a use case's session data. Picking a use case retypes `sessionData`.
 */
export const TypesControl = ({
    types,
    onViewTypes,
    usecase,
    onUsecaseChange,
    onDownloadSession,
}: ITypesControlProps) => (
    <div className="studio-chip studio-types" title={describeTypes(types).join("\n")}>
        <button
            type="button"
            className="studio-types-open"
            onClick={onViewTypes}
            title="View the generated types"
        >
            <span className="studio-types-dot" data-status={types.status} aria-hidden="true" />
            <span className="studio-chip-label">Types</span>
        </button>
        <select
            className="studio-types-select"
            value={usecase ?? ""}
            onChange={(e) => onUsecaseChange(e.target.value || null)}
            aria-label="Use case sessionData is typed for"
            disabled={types.usecases.length === 0}
        >
            <option value="">All use cases</option>
            {types.usecases.map((name) => (
                <option key={name} value={name}>
                    {name}
                </option>
            ))}
        </select>
        <button
            type="button"
            className="studio-types-download"
            onClick={onDownloadSession}
            disabled={!types.session}
            aria-label="Download the session schema"
            title="Download the inferred session schema (JSON, valid YAML) to curate"
        >
            <ArrowDownTrayIcon />
        </button>
    </div>
);

export default TypesControl;
