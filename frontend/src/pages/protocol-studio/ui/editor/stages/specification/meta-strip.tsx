import { useState } from "react";
import type { MockPlaygroundConfigV2Type } from "@ondc/automation-mock-runner";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

interface IMetaStripProps {
    config: MockPlaygroundConfigV2Type;
    onConfigChange: (config: MockPlaygroundConfigV2Type) => void;
}

/** An inline "label value" field that applies on blur / Enter. */
const InlineField = ({
    label,
    metaKey,
    value,
    placeholder,
    width,
    onCommit,
}: {
    label: string;
    /** The meta key it edits, for the tooltip. */
    metaKey: string;
    value: string;
    placeholder?: string;
    width: string;
    onCommit: (value: string) => void;
}) => {
    const [draft, setDraft] = useState<string | null>(null);
    const commit = () => {
        if (draft !== null && draft !== value) onCommit(draft);
        setDraft(null);
    };
    return (
        <label className="studio-spec-meta-field" title={`meta.${metaKey}`}>
            <span>{label}</span>
            <input
                className="studio-mono"
                style={{ width }}
                value={draft ?? value}
                placeholder={placeholder}
                spellCheck={false}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === "Enter") commit();
                    if (e.key === "Escape") setDraft(null);
                }}
            />
        </label>
    );
};

/** What the config is about: domain, version, use case, config version, description. */
export const MetaStrip = ({ config, onConfigChange }: IMetaStripProps) => {
    const { meta } = config;
    const [open, setOpen] = useState(false);
    const setMeta = (patch: Partial<typeof meta>) =>
        onConfigChange({ ...config, meta: { ...meta, ...patch } });
    return (
        <>
            <div className="studio-spec-header-row studio-spec-meta" data-row="config">
                <span className="studio-eyebrow studio-spec-header-label">Config</span>
                <InlineField
                    label="Domain"
                    metaKey="domain"
                    value={meta.domain}
                    width="7.5rem"
                    onCommit={(domain) => setMeta({ domain })}
                />
                <InlineField
                    label="Version"
                    metaKey="version"
                    value={meta.version}
                    width="4rem"
                    onCommit={(version) => setMeta({ version })}
                />
                <InlineField
                    label="Use case"
                    metaKey="use_case_id"
                    value={meta.use_case_id ?? ""}
                    placeholder="—"
                    width="6rem"
                    onCommit={(value) => setMeta({ use_case_id: value || undefined })}
                />
                <InlineField
                    label="Config version"
                    metaKey="config_version"
                    value={meta.config_version ?? ""}
                    placeholder="—"
                    width="5rem"
                    onCommit={(value) => setMeta({ config_version: value || undefined })}
                />
                <button
                    type="button"
                    className="studio-key studio-key-sm"
                    aria-expanded={open}
                    onClick={() => setOpen((v) => !v)}
                    title={meta.description || "What this protocol covers"}
                >
                    Description
                    <ChevronDownIcon className={open ? "rotate-180" : undefined} />
                </button>
            </div>
            {open ? (
                <div className="studio-spec-header-row" data-row="description">
                    <span className="studio-spec-header-label" aria-hidden="true" />
                    <textarea
                        className="bp-input studio-spec-meta-desc"
                        rows={2}
                        autoFocus
                        defaultValue={meta.description ?? ""}
                        placeholder="What this protocol covers"
                        aria-label="Description"
                        onBlur={(e) => {
                            const value = e.target.value.trim();
                            if (value !== (meta.description ?? ""))
                                setMeta({ description: value || undefined });
                        }}
                    />
                </div>
            ) : null}
        </>
    );
};

export default MetaStrip;
