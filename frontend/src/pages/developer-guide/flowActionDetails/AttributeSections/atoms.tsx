import { FC, type ReactNode } from "react";
import { DASH } from "../attributePanelUtils";

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

/**
 * Section header rendered as a filled chip/block — "Description",
 * "Sync-validations", "Rules" etc. read as standalone documentation-style
 * header blocks rather than plain text headings.
 */
export const SectionHeader: FC<{ children: ReactNode }> = ({ children }) => (
    <span className="inline-block px-2.5 py-1 mb-2 rounded-md bg-sky-50 dark:bg-sky-500/10 text-[11px] font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">
        {children}
    </span>
);

/** Neutral chip used for metadata field labels ("Required", "Owner", "Type" ...). */
export const LabelBadge: FC<{ children: ReactNode }> = ({ children }) => (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-light dark:bg-white/5 text-[11px] font-semibold uppercase tracking-wide text-sky-700 dark:text-slate-300 shrink-0">
        {children}
    </span>
);

/** Inline highlighted code chip — used for primary technical values (json path, type, enum code). */
export const ValueBadge: FC<{ children: ReactNode }> = ({ children }) => (
    <code className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 font-mono text-[11px] break-all dark:border dark:border-sky-500/20">
        {children}
    </code>
);

/** Softer inline code reference — for JSON-path mentions inside rule/description prose. */
export const InlineCodeRef: FC<{ children: ReactNode }> = ({ children }) => (
    <code className="inline-flex items-center px-1 py-px rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-mono text-[10.5px] break-all">
        {children}
    </code>
);

function formatRequired(required?: string): string {
    if (!required || required === DASH) return DASH;
    if (required === "true") return "Mandatory";
    if (required === "false") return "Optional";
    return required;
}

/** One metadata row: a label chip followed by its value (chip for technical values, plain text otherwise). */
const DetailRow: FC<{ label: string; value: ReactNode; chip?: boolean }> = ({
    label,
    value,
    chip = false,
}) => (
    <div className="flex items-center gap-2 py-1 text-sm leading-relaxed flex-wrap">
        <LabelBadge>{label}</LabelBadge>
        {chip ? (
            <ValueBadge>{value ?? DASH}</ValueBadge>
        ) : (
            <span className="text-slate-700 break-all">{value ?? DASH}</span>
        )}
    </div>
);

/**
 * Flat "JSON Path / Required / Usage / Owner / Type" field list shared by
 * AttributeSection, EnumSection and TagSection. Each row pairs a chip label
 * with its value, rather than a boxed grid card or plain key/value text.
 */
export const DetailsList: FC<{
    jsonPath: string;
    required?: string;
    usage?: string;
    owner?: string;
    type?: string;
}> = ({ jsonPath, required, usage, owner, type }) => (
    <div>
        <DetailRow label="JSON Path" value={jsonPath} chip />
        <DetailRow label="Required" value={formatRequired(required)} />
        <DetailRow label="Usage" value={usage ?? DASH} />
        <DetailRow label="Owner" value={owner ?? DASH} />
        <DetailRow label="Type" value={type ?? DASH} chip />
    </div>
);
