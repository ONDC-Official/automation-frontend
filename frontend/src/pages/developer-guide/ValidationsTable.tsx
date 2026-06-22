import { type FC, type ReactNode, useCallback, useMemo, useState } from "react";
import { FiChevronsDown, FiChevronsUp, FiDownload } from "react-icons/fi";
import type { ValidationTableAction, ValidationTableRow } from "./types";
import GuideTable, { type GuideTableColumn } from "./shared/components/GuideTable";
import { EMPTY_PLACEHOLDER, emptyCell, isEmptyCell } from "./shared/components/tableCells";

// Re-export for backward compat
export type ValidationTable = ValidationTableAction;
export type ValidationRow = ValidationTableRow;

interface ValidationsTableProps {
    validations: ValidationTableAction;
}

const PAGE_SIZE = 10;

/** Renders text with **wrapped** segments as bold. */
function renderWithBold(text: string): ReactNode {
    const parts = text.split("**");
    return parts.map((part, i) =>
        i % 2 === 1 ? (
            <span key={i} className="font-bold">
                {part}
            </span>
        ) : (
            <span key={i} className="font-bold">
                {part}
            </span>
        )
    );
}

const ValidationsTable: FC<ValidationsTableProps> = ({ validations }) => {
    const [globalExpanded, setGlobalExpanded] = useState(true);

    const toggleGlobal = useCallback(() => setGlobalExpanded((v) => !v), []);

    const exportAll = useCallback(() => {
        const blob = new Blob([JSON.stringify(validations, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${validations.action}-validations.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [validations]);

    const visibleRows = useMemo(
        () =>
            globalExpanded
                ? validations.rows
                : validations.rows.filter((row) => row.rowType !== "leaf"),
        [validations.rows, globalExpanded]
    );

    const columns: GuideTableColumn<ValidationRow>[] = [
        {
            key: "index",
            header: "#",
            headerClassName: "max-w-[200px]",
            cellClassName:
                "text-[11px] text-slate-500 max-w-[200px] whitespace-pre-wrap wrap-break-word",
            render: (_row, index) => index + 1,
        },
        {
            key: "rowType",
            header: "Type",
            headerClassName: "max-w-[200px]",
            cellClassName: "text-[11px] max-w-[200px] whitespace-pre-wrap wrap-break-word",
            render: (row) =>
                isEmptyCell(row.rowType) ? (
                    emptyCell()
                ) : (
                    <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 border text-[10px] font-medium ${
                            row.rowType === "group"
                                ? "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-100 dark:border-sky-500/30"
                                : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/30"
                        }`}
                    >
                        {row.rowType}
                    </span>
                ),
        },
        {
            key: "name",
            header: "Test Name",
            headerClassName: "max-w-[200px]",
            cellClassName:
                "text-xs font-semibold text-slate-800 whitespace-pre-wrap wrap-break-word max-w-[200px]",
            render: (row) => (isEmptyCell(row.name) ? emptyCell() : renderWithBold(row.name)),
        },
        {
            key: "group",
            header: "Group",
            headerClassName: "max-w-[200px]",
            cellClassName:
                "text-xs text-slate-600 whitespace-pre-wrap wrap-break-word max-w-[200px]",
            render: (row) => (isEmptyCell(row.group) ? emptyCell() : row.group),
        },
        {
            key: "scope",
            header: "Scope",
            headerClassName: "max-w-[200px]",
            cellClassName:
                "text-xs text-slate-600 whitespace-pre-wrap wrap-break-word max-w-[200px]",
            render: (row) => (isEmptyCell(row.scope) ? emptyCell() : row.scope),
        },
        {
            key: "description",
            header: "Description",
            headerClassName: "w-[300px] max-w-[300px]",
            cellClassName:
                "text-xs text-slate-700 whitespace-pre-wrap wrap-break-word leading-relaxed w-[300px] max-w-[300px]",
            render: (row) => (isEmptyCell(row.description) ? emptyCell() : row.description),
        },
        {
            key: "skipIf",
            header: "Skip If",
            headerClassName: "max-w-[200px]",
            cellClassName:
                "text-xs text-slate-500 whitespace-pre-wrap wrap-break-word leading-relaxed max-w-[200px]",
            render: (row) => (isEmptyCell(row.skipIf) ? emptyCell() : row.skipIf),
        },
        {
            key: "errorCode",
            header: "Error Code",
            headerClassName: "max-w-[200px]",
            cellClassName: "max-w-[200px] whitespace-pre-wrap wrap-break-word",
            render: (row) =>
                isEmptyCell(row.errorCode) ? (
                    <span className="text-slate-300 font-mono">{EMPTY_PLACEHOLDER}</span>
                ) : (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-500/30 font-mono">
                        {row.errorCode}
                    </span>
                ),
        },
    ];

    return (
        <GuideTable
            columns={columns}
            rows={visibleRows}
            rowKey={(row, index) => `${row.name}-${index}`}
            rowClassName={(row, index) =>
                row.rowType === "group"
                    ? "bg-slate-50/80 dark:bg-surface-muted/80 border-t border-slate-200"
                    : index % 2 === 0
                      ? "bg-white dark:bg-surface-elevated hover:bg-slate-50/80 dark:hover:bg-surface-muted/80"
                      : "bg-slate-50/40 dark:bg-surface-muted/40 hover:bg-slate-100/80 dark:hover:bg-surface-muted/80"
            }
            density="spacious"
            shadow="xs"
            rounded="xl"
            pagination={{ pageSize: PAGE_SIZE }}
            toolbar={
                <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-mono">
                        Showing validation rules for{" "}
                        <span className="text-slate-700">{validations.action}</span>.{" "}
                        {visibleRows.length} of {validations.numLeafTests} leaf tests visible
                    </span>
                    <div className="flex gap-1.5">
                        <button
                            type="button"
                            onClick={toggleGlobal}
                            className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-sky-600 dark:text-sky-300 hover:text-sky-800 dark:hover:text-sky-200 bg-white dark:bg-surface-elevated hover:bg-sky-100 dark:hover:bg-sky-500/20 rounded border border-sky-200/60 dark:border-sky-500/30 transition-colors"
                        >
                            {globalExpanded ? (
                                <FiChevronsUp className="w-3 h-3" />
                            ) : (
                                <FiChevronsDown className="w-3 h-3" />
                            )}
                            {globalExpanded ? "Collapse all" : "Expand all"}
                        </button>
                        <button
                            type="button"
                            onClick={exportAll}
                            className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-white bg-sky-500 hover:bg-sky-600 rounded border border-sky-500 transition-colors"
                        >
                            <FiDownload className="w-3 h-3" />
                            Export All
                        </button>
                    </div>
                </div>
            }
        />
    );
};

export default ValidationsTable;
