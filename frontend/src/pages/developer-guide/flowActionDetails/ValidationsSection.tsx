import { FC, useMemo } from "react";
import { getValidationsIntroMessage } from "../xValidationsReadme";
import {
    type RawTableRow,
    safeDescription,
    splitByJsonPaths,
    extractJsonPaths,
    pathMatches,
    normalizePathForMatch,
} from "./attributePanelUtils";
import { SectionHeader, InlineCodeRef } from "./AttributeSections/atoms";

// ─── Description renderer with inline highlighted JSON paths ─────────────────

const DescriptionText: FC<{ text: string }> = ({ text }) => {
    const parts = splitByJsonPaths(text);
    return (
        <>
            {parts.map((part, i) =>
                part.isPath ? (
                    <InlineCodeRef key={i}>{part.text}</InlineCodeRef>
                ) : (
                    <span key={i}>{safeDescription(part.text)}</span>
                )
            )}
        </>
    );
};

// ─── Single validation group: name + breadcrumb, rules listed underneath ─────

const ValidationGroupItem: FC<{ row: RawTableRow }> = ({ row }) => {
    const hasSkipIf = row.skipIf.trim() !== "";
    const hasErrorCode = row.errorCode.trim() !== "";

    return (
        <div className="space-y-2.5 border-l-2 border-sky-100 dark:border-sky-500/20 pl-3">
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-300 break-all">
                        {row.name}
                    </span>
                    {row.group.trim() && (
                        <span className="text-[11px] text-slate-400 truncate" title={row.group}>
                            {row.group}
                        </span>
                    )}
                </div>
                {hasErrorCode && (
                    <span className="shrink-0 text-[10px] font-semibold text-rose-500 dark:text-rose-400">
                        {row.errorCode}
                    </span>
                )}
            </div>
            <div className="space-y-1.5">
                <SectionHeader>Rules</SectionHeader>
                <p className="text-sm text-slate-700 leading-relaxed">
                    <DescriptionText text={row.description} />
                </p>
            </div>
            {hasSkipIf && (
                <div className="space-y-1.5">
                    <SectionHeader>Skip If</SectionHeader>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        <DescriptionText text={row.skipIf} />
                    </p>
                </div>
            )}
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
    const matchingRows = useMemo((): RawTableRow[] => {
        if (!selectedPath) return [];
        const normSelected = normalizePathForMatch(selectedPath.trim());
        if (!normSelected) return [];
        return rawTableRows.filter((row) => {
            const paths = extractJsonPaths(row.description);
            return paths.some((p) => pathMatches(p, selectedPath));
        });
    }, [rawTableRows, selectedPath]);

    if (rawTableRows.length === 0) return null;

    return (
        <section className="pt-5">
            <SectionHeader>Sync-validations</SectionHeader>
            <p className="text-slate-500 text-xs leading-relaxed mb-4">
                {getValidationsIntroMessage()}
            </p>
            <div className="space-y-5">
                {matchingRows.length === 0 ? (
                    <p className="text-slate-400 text-sm py-6">
                        No validation rules found for this field.
                    </p>
                ) : (
                    matchingRows.map((row) => <ValidationGroupItem key={row.name} row={row} />)
                )}
            </div>
        </section>
    );
};

export default ValidationsSection;
