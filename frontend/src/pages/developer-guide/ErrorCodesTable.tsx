import { type FC, useMemo, useState } from "react";
import type { ErrorCodes } from "./types";

interface ErrorCodesTableProps {
    errorCodes: ErrorCodes;
}

const ErrorCodesTable: FC<ErrorCodesTableProps> = ({ errorCodes }) => {
    const [search, setSearch] = useState("");

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return errorCodes.code;
        return errorCodes.code.filter((row) =>
            [row.Event, row.Description, row.From, String(row.code)]
                .join(" ")
                .toLowerCase()
                .includes(q),
        );
    }, [errorCodes.code, search]);

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Error Codes
                    </p>
                    <p className="text-sm text-slate-600">
                        {rows.length} of {errorCodes.code.length} codes
                    </p>
                </div>
                <div className="relative w-full sm:w-64">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search error codes..."
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

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="max-h-[700px] overflow-auto">
                    <table className="min-w-full table-fixed text-left text-xs">
                        <thead className="bg-slate-50/90 backdrop-blur sticky top-0 z-10 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-2.5 font-semibold text-[11px] text-slate-500 uppercase tracking-wider w-24">
                                    Code
                                </th>
                                <th className="px-4 py-2.5 font-semibold text-[11px] text-slate-500 uppercase tracking-wider w-48">
                                    Event
                                </th>
                                <th className="px-4 py-2.5 font-semibold text-[11px] text-slate-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-4 py-2.5 font-semibold text-[11px] text-slate-500 uppercase tracking-wider w-36">
                                    From
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <tr
                                    key={`${row.code}-${i}`}
                                    className={
                                        i % 2 === 0
                                            ? "bg-white hover:bg-slate-50/80"
                                            : "bg-slate-50/40 hover:bg-slate-100/80"
                                    }
                                >
                                    <td className="px-4 py-2.5 align-top">
                                        <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 font-mono text-[11px] font-medium">
                                            {row.code}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 align-top text-xs font-semibold text-slate-800 whitespace-pre-wrap break-words">
                                        {row.Event}
                                    </td>
                                    <td className="px-4 py-2.5 align-top text-xs text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                                        {row.Description}
                                    </td>
                                    <td className="px-4 py-2.5 align-top">
                                        <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-100 text-[11px] font-medium">
                                            {row.From}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-10 text-center text-sm text-slate-400"
                                    >
                                        No error codes match your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ErrorCodesTable;
