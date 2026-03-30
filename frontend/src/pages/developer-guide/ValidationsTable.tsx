import { type FC, type ReactNode, useMemo, useState } from "react";
import type { ValidationTableAction, ValidationTableRow } from "./types";

// Re-export for backward compat
export type ValidationTable = ValidationTableAction;
export type ValidationRow = ValidationTableRow;

interface ValidationsTableProps {
    validations: ValidationTableAction;
}

const EMPTY_PLACEHOLDER = "—";

function isEmpty(value: string | undefined | null): boolean {
    return value == null || String(value).trim() === "";
}

/** Renders text with **wrapped** segments as bold. */
function renderWithBold(text: string): ReactNode {
    const parts = text.split("**");
    return parts.map((part, i) =>
        i % 2 === 1 ? (
            <span key={i} className="font-bold">
                {part}
            </span>
        ) : (
            <span className="font-bold">{part}</span>
        )
    );
}

function filterRows(rows: ValidationRow[], query: string): ValidationRow[] {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
        const haystack = [
            row.rowType,
            row.name,
            row.group,
            row.scope,
            row.description,
            row.skipIf,
            row.errorCode,
        ]
            .join(" ")
            .toLowerCase();
        return haystack.includes(q);
    });
}

const ValidationsTable: FC<ValidationsTableProps> = ({ validations }) => {
    const [search, setSearch] = useState("");
    const filteredRows = useMemo(
        () => filterRows(validations.rows, search),
        [validations.rows, search]
    );

    return (
        <div className="w-full flex flex-col gap-4 h-full">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        X-Validations
                    </p>
                    <p className="text-sm text-slate-600">
                        Showing validation rules for{" "}
                        <span className="font-mono text-slate-800">{validations.action}</span>.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        {filteredRows.length} of {validations.numLeafTests} leaf tests visible
                    </p>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                    <div className="text-right text-xs text-slate-400">
                        <p>Code: {validations.codeName}</p>
                        <p>Generated: {validations.generated}</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search tests, groups, descriptions…"
                            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                        />
                        <svg
                            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="max-h-[700px] overflow-auto">
                    <table className="min-w-full table-fixed text-left text-xs">
                        <thead className="bg-slate-50/90 backdrop-blur sticky top-0 z-10 border-b border-slate-200">
                            <tr>
                                <th className="px-3 py-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider max-w-[200px]">
                                    #
                                </th>
                                <th className="px-3 py-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider max-w-[200px]">
                                    Type
                                </th>
                                <th className="px-3 py-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider max-w-[200px]">
                                    Test Name
                                </th>
                                <th className="px-3 py-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider max-w-[200px]">
                                    Group
                                </th>
                                <th className="px-3 py-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider max-w-[200px]">
                                    Scope
                                </th>
                                <th className="px-3 py-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider w-[300px] max-w-[300px]">
                                    Description
                                </th>
                                <th className="px-3 py-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider max-w-[200px]">
                                    Skip If
                                </th>
                                <th className="px-3 py-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider max-w-[200px]">
                                    Error Code
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.map((row, index) => {
                                const isGroup = row.rowType === "group";
                                return (
                                    <tr
                                        key={`${row.name}-${index}`}
                                        className={
                                            isGroup
                                                ? "bg-slate-50/80 border-t border-slate-200"
                                                : index % 2 === 0
                                                  ? "bg-white hover:bg-slate-50/80"
                                                  : "bg-slate-50/40 hover:bg-slate-100/80"
                                        }
                                    >
                                        <td className="px-3 py-2 align-top text-[11px] text-slate-500 max-w-[200px] whitespace-pre-wrap break-words">
                                            {index + 1}
                                        </td>
                                        <td className="px-3 py-2 align-top text-[11px] max-w-[200px] whitespace-pre-wrap break-words">
                                            {isEmpty(row.rowType) ? (
                                                <span className="text-slate-300">
                                                    {EMPTY_PLACEHOLDER}
                                                </span>
                                            ) : (
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 border text-[10px] font-medium ${
                                                        isGroup
                                                            ? "bg-sky-50 text-sky-700 border-sky-100"
                                                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                    }`}
                                                >
                                                    {row.rowType}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 align-top text-xs font-semibold text-slate-800 whitespace-pre-wrap break-words max-w-[200px]">
                                            {isEmpty(row.name) ? (
                                                <span className="text-slate-300">
                                                    {EMPTY_PLACEHOLDER}
                                                </span>
                                            ) : (
                                                renderWithBold(row.name)
                                            )}
                                        </td>
                                        <td className="px-3 py-2 align-top text-xs text-slate-600 whitespace-pre-wrap break-words max-w-[200px]">
                                            {isEmpty(row.group) ? (
                                                <span className="text-slate-300">
                                                    {EMPTY_PLACEHOLDER}
                                                </span>
                                            ) : (
                                                row.group
                                            )}
                                        </td>
                                        <td className="px-3 py-2 align-top text-xs text-slate-600 whitespace-pre-wrap break-words max-w-[200px]">
                                            {isEmpty(row.scope) ? (
                                                <span className="text-slate-300">
                                                    {EMPTY_PLACEHOLDER}
                                                </span>
                                            ) : (
                                                row.scope
                                            )}
                                        </td>
                                        <td className="px-3 py-2 align-top text-xs text-slate-700 whitespace-pre-wrap break-words leading-relaxed w-[300px] max-w-[300px]">
                                            {isEmpty(row.description) ? (
                                                <span className="text-slate-300">
                                                    {EMPTY_PLACEHOLDER}
                                                </span>
                                            ) : (
                                                row.description
                                            )}
                                        </td>
                                        <td className="px-3 py-2 align-top text-xs text-slate-500 whitespace-pre-wrap break-words leading-relaxed max-w-[200px]">
                                            {isEmpty(row.skipIf) ? (
                                                <span className="text-slate-300">
                                                    {EMPTY_PLACEHOLDER}
                                                </span>
                                            ) : (
                                                row.skipIf
                                            )}
                                        </td>
                                        <td className="px-3 py-2 align-top text-xs max-w-[200px] whitespace-pre-wrap break-words">
                                            {isEmpty(row.errorCode) ? (
                                                <span className="text-slate-300 font-mono">
                                                    {EMPTY_PLACEHOLDER}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 font-mono">
                                                    {row.errorCode}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ValidationsTable;
