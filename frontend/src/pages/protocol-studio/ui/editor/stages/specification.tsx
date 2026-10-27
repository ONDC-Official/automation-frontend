import type { MockPlaygroundConfigV2Type } from "@ondc/automation-mock-runner";
import { ArrowDownTrayIcon, LockClosedIcon } from "@heroicons/react/24/outline";

import type { SpecTypes } from "@pages/protocol-studio/hooks/use-spec-types";
import { HELPERS_PATH } from "@pages/protocol-studio/hooks/use-helpers-typescript";
import {
    FORM_APIS,
    getCallbackApi,
    REQUEST_APIS,
    UNSOLICITED_APIS,
} from "@pages/protocol-studio/ui/editor/graph/catalog";
import { InspectorCodePane } from "@pages/protocol-studio/ui/editor/inspector/code-pane";
import { describeTypes } from "@pages/protocol-studio/ui/editor/types-control";
import { TypesViewer } from "@pages/protocol-studio/ui/editor/types-viewer";
import type { RevealRequest, StudioTypeFile } from "@pages/protocol-studio/ui/editor/types";

export interface ISpecificationStageProps {
    config: MockPlaygroundConfigV2Type;
    onConfigChange: (config: MockPlaygroundConfigV2Type) => void;
    specTypes: SpecTypes;
    usecase: string | null;
    onUsecaseChange: (usecase: string | null) => void;
    onDownloadSession: () => void;
    helpers: string;
    onHelpersChange: (value: string) => void;
    helperNames: string[];
    typeFiles: StudioTypeFile[];
    /** api → how many protocol nodes use it (every level). */
    usedApis: Map<string, number>;
    reveal: RevealRequest | null;
}

const Field = ({
    label,
    hint,
    value,
    placeholder,
    mono,
    multiline,
    onChange,
}: {
    label: string;
    hint?: string;
    value: string;
    placeholder?: string;
    mono?: boolean;
    multiline?: boolean;
    onChange: (value: string) => void;
}) => (
    <div className="bp-field" data-wide={multiline || undefined}>
        <label className="bp-field-label" title={hint}>
            {label}
        </label>
        {multiline ? (
            <textarea
                className="bp-input"
                rows={3}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
            />
        ) : (
            <input
                className={`bp-input${mono ? " studio-mono" : ""}`}
                value={value}
                placeholder={placeholder}
                spellCheck={false}
                onChange={(e) => onChange(e.target.value)}
            />
        )}
    </div>
);

/**
 * Stage 1 — what the spec provides and the config is about: domain, version,
 * use case, description; the APIs the spec types and how many the protocol
 * uses; the generated types; and `helpers.ts`, shared by every node. The
 * hand-authored `actions.yaml` / `validations.yaml` editors will sit here too.
 */
export const SpecificationStage = ({
    config,
    onConfigChange,
    specTypes,
    usecase,
    onUsecaseChange,
    onDownloadSession,
    helpers,
    onHelpersChange,
    helperNames,
    typeFiles,
    usedApis,
    reveal,
}: ISpecificationStageProps) => {
    const { meta } = config;
    const setMeta = (patch: Partial<typeof meta>) =>
        onConfigChange({ ...config, meta: { ...meta, ...patch } });

    const known = [
        ...REQUEST_APIS,
        ...REQUEST_APIS.map(getCallbackApi),
        ...UNSOLICITED_APIS,
        ...FORM_APIS,
    ];
    const apis = [...new Set([...known, ...usedApis.keys()])];
    const typesLines = describeTypes(specTypes);

    return (
        <div className="studio-stage-page" data-stage="specification">
            <aside className="studio-glass studio-stage-side">
                <div className="studio-explorer-head">
                    <div className="min-w-0 flex-1">
                        <p className="studio-eyebrow">APIs</p>
                        <p className="studio-text-dim truncate text-[12px]">
                            {specTypes.apiCount > 0
                                ? `${specTypes.apiCount} typed from the spec`
                                : "standard set · spec types unavailable"}
                        </p>
                    </div>
                </div>
                <ul
                    className="studio-tree min-h-0 flex-1 overflow-auto px-2 pb-2"
                    aria-label="APIs"
                >
                    {apis.map((api) => {
                        const count = usedApis.get(api) ?? 0;
                        return (
                            <li
                                key={api}
                                className="studio-api-row"
                                data-used={count > 0 || undefined}
                            >
                                <span className="studio-mono truncate">{api}</span>
                                <span className="studio-text-faint ml-auto text-[11px]">
                                    {count > 0 ? `on protocol ×${count}` : "unused"}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </aside>

            <main className="studio-stage-main">
                <section className="studio-glass studio-card">
                    <header className="studio-card-head">
                        <div>
                            <p className="studio-eyebrow">Config</p>
                            <p className="studio-card-title">
                                {meta.domain} {meta.version}
                            </p>
                        </div>
                        <span className="studio-badge">draft · saved locally</span>
                    </header>
                    <div className="bp-props-grid px-4 pb-4">
                        <Field
                            label="domain"
                            value={meta.domain}
                            mono
                            onChange={(domain) => setMeta({ domain })}
                        />
                        <Field
                            label="version"
                            value={meta.version}
                            mono
                            onChange={(version) => setMeta({ version })}
                        />
                        <Field
                            label="use_case_id"
                            hint="Which of the spec's use cases this protocol is for"
                            value={meta.use_case_id ?? ""}
                            placeholder="e.g. UCS-001"
                            onChange={(value) => setMeta({ use_case_id: value || undefined })}
                        />
                        <Field
                            label="config_version"
                            value={meta.config_version ?? ""}
                            placeholder="optional"
                            onChange={(value) => setMeta({ config_version: value || undefined })}
                        />
                        <Field
                            label="description"
                            value={meta.description ?? ""}
                            placeholder="What this protocol covers"
                            multiline
                            onChange={(value) => setMeta({ description: value || undefined })}
                        />
                    </div>
                </section>

                <section className="studio-glass studio-card">
                    <header className="studio-card-head">
                        <div>
                            <p className="studio-eyebrow">Types</p>
                            <p className="studio-card-title">What step code is typed against</p>
                        </div>
                        <select
                            className="bp-input studio-card-select"
                            value={usecase ?? ""}
                            onChange={(e) => onUsecaseChange(e.target.value || null)}
                            aria-label="Use case sessionData is typed for"
                            disabled={specTypes.usecases.length === 0}
                        >
                            <option value="">All use cases</option>
                            {specTypes.usecases.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="studio-key studio-key-sm"
                            onClick={onDownloadSession}
                            disabled={!specTypes.session}
                            title="Download the inferred session schema (JSON, valid YAML) to curate"
                        >
                            <ArrowDownTrayIcon />
                            Session schema
                        </button>
                    </header>
                    <ul className="studio-facts px-4 pb-3">
                        {typesLines.map((line) => (
                            <li key={line}>
                                <span
                                    className="studio-types-dot"
                                    data-status={specTypes.status}
                                    aria-hidden="true"
                                />
                                {line}
                            </li>
                        ))}
                    </ul>
                    <div className="studio-card-body studio-card-body-tall">
                        <TypesViewer files={typeFiles} />
                    </div>
                </section>

                <section className="studio-glass studio-card">
                    <header className="studio-card-head">
                        <div>
                            <p className="studio-eyebrow">Shared code</p>
                            <p className="studio-card-title">
                                helpers<span className="studio-file-ext">.ts</span>
                            </p>
                        </div>
                        <span className="studio-text-faint text-[11px]">
                            {helperNames.length}{" "}
                            {helperNames.length === 1 ? "function" : "functions"} · compiled and
                            prepended to every generate
                        </span>
                    </header>
                    <div className="studio-well studio-card-body studio-card-body-tall mx-3 mb-3">
                        <InspectorCodePane
                            path={HELPERS_PATH}
                            language="typescript"
                            value={helpers}
                            onChange={onHelpersChange}
                            reveal={reveal?.tab === "helpers" ? reveal : null}
                            compileAs="helpers"
                        />
                    </div>
                </section>

                <div className="studio-stage-grid">
                    {(["actions.yaml", "validations.yaml"] as const).map((file) => (
                        <section key={file} className="studio-glass studio-card studio-card-muted">
                            <header className="studio-card-head">
                                <div>
                                    <p className="studio-eyebrow">API-service contract</p>
                                    <p className="studio-card-title studio-mono">{file}</p>
                                </div>
                                <span className="studio-badge">
                                    <LockClosedIcon className="size-3" /> coming
                                </span>
                            </header>
                            <p className="studio-text-dim px-4 pb-4 text-[12px]">
                                {file === "actions.yaml"
                                    ? "supportedActions and apiProperties, hand-authored as today. Studio will edit the file and warn where it disagrees with the protocol."
                                    : "The JVAL tests, hand-authored and reuse-first. Studio will edit the file range-preservingly and check the protocol's enums against it."}
                            </p>
                        </section>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default SpecificationStage;
