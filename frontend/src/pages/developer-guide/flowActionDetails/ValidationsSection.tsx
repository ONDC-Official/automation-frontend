import { FC, useState, useMemo } from "react";
import { getValidationsIntroMessage } from "../xValidationsReadme";
import {
    type RawTableRow,
    safeDescription,
    splitByJsonPaths,
    extractJsonPaths,
    pathMatches,
    normalizePathForMatch,
} from "./attributePanelUtils";

// ─── Description renderer with inline highlighted JSON paths ─────────────────

const DescriptionText: FC<{ text: string }> = ({ text }) => {
    const parts = splitByJsonPaths(text);
    return (
        <>
            {parts.map((part, i) =>
                part.isPath ? (
                    <code
                        key={i}
                        className="inline-flex items-center px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-mono text-[11px] border border-sky-200 leading-normal"
                    >
                        {part.text}
                    </code>
                ) : (
                    <span key={i}>{safeDescription(part.text)}</span>
                )
            )}
        </>
    );
};

// ─── Single validation-rule card ─────────────────────────────────────────────

const RawTableCard: FC<{ row: RawTableRow }> = ({ row }) => {
    const hasSkipIf = row.skipIf.trim() !== "";
    const hasErrorCode = row.errorCode.trim() !== "";

    return (
        <div className="rounded-xl border border-sky-100 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 px-4 py-2.5 bg-sky-50/60 border-b border-sky-100">
                <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-mono text-xs font-bold text-sky-800 break-all">
                        {row.name}
                    </span>
                    {row.group.trim() && (
                        <span className="text-[10px] text-slate-600 truncate" title={row.group}>
                            {row.group}
                        </span>
                    )}
                </div>
                {hasErrorCode && (
                    <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-semibold">
                        {row.errorCode}
                    </span>
                )}
            </div>
            {/* Body */}
            <div className="px-4 py-3 space-y-3 text-sm">
                <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500">
                        Rule
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                        <DescriptionText text={row.description} />
                    </p>
                </div>
                {hasSkipIf && (
                    <div className="space-y-1 pt-2 border-t border-sky-50">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500">
                            Skip If
                        </span>
                        <p className="text-slate-500 leading-relaxed">
                            <DescriptionText text={row.skipIf} />
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Validations section ──────────────────────────────────────────────────────

interface ValidationsSectionProps {
    /** All leaf rows for the current action — provided by the parent via props (not imported directly). */
    rawTableRows: RawTableRow[];
    /** The jsonPath of the currently selected attribute (without leading $.). */
    selectedPath?: string;
}

const ValidationsSection: FC<ValidationsSectionProps> = ({ rawTableRows, selectedPath }) => {
    const [searchQuery, setSearchQuery] = useState("");

    const matchingRows = useMemo((): RawTableRow[] => {
        if (!selectedPath) return [];
        const normSelected = normalizePathForMatch(selectedPath.trim());
        if (!normSelected) return [];
        return rawTableRows.filter((row) => {
            const paths = extractJsonPaths(row.description);
            return paths.some((p) => pathMatches(p, selectedPath));
        });
    }, [rawTableRows, selectedPath]);

    const filteredRows = useMemo((): RawTableRow[] => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return matchingRows;
        return matchingRows.filter(
            (row) =>
                row.name.toLowerCase().includes(q) ||
                row.description.toLowerCase().includes(q) ||
                row.group.toLowerCase().includes(q)
        );
    }, [matchingRows, searchQuery]);

    if (rawTableRows.length === 0) return null;

    return (
        <section className="pt-5">
            <div className="flex items-center gap-2 mb-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-sky-600">
                    sync-validations
                </h4>
                <div className="flex-1 h-px bg-sky-100" />
                {matchingRows.length > 0 && (
                    <span className="text-[10px] font-semibold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full">
                        {matchingRows.length}
                    </span>
                )}
            </div>
            <p className="text-slate-500 text-xs leading-relaxed mb-4 bg-sky-50/60 border border-sky-100 rounded-lg px-3 py-2.5">
                {getValidationsIntroMessage()}
            </p>
            {matchingRows.length > 1 && (
                <div className="mb-4">
                    <input
                        type="search"
                        placeholder="Filter rules by name, path or description…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-shadow"
                        aria-label="Filter validation rules"
                    />
                    {searchQuery.trim() && (
                        <p className="text-slate-400 text-xs mt-2">
                            {filteredRows.length === 0
                                ? "No rules match your search."
                                : `Showing ${filteredRows.length} of ${matchingRows.length} rules`}
                        </p>
                    )}
                </div>
            )}
            <div className="space-y-3">
                {matchingRows.length === 0 ? (
                    <p className="text-slate-400 text-sm py-8 text-center rounded-xl bg-slate-50 border border-slate-200">
                        No validation rules found for this field.
                    </p>
                ) : filteredRows.length === 0 && searchQuery.trim() ? (
                    <p className="text-slate-400 text-sm py-8 text-center rounded-xl bg-slate-50 border border-slate-200">
                        No rules match &quot;{searchQuery.trim()}&quot;.
                    </p>
                ) : (
                    filteredRows.map((row) => <RawTableCard key={row.name} row={row} />)
                )}
            </div>
        </section>
    );
};

export default ValidationsSection;
