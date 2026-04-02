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
                .includes(q)
        );
    }, [errorCodes.code, search]);

    const hasSearch = search.trim().length > 0;

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 shadow-sm flex-shrink-0">
                        <svg
                            className="h-5 w-5 text-rose-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.75}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-800 leading-tight">
                            Error Codes
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {hasSearch ? (
                                <>
                                    <span className="font-medium text-slate-700">
                                        {rows.length}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-medium text-slate-700">
                                        {errorCodes.code.length}
                                    </span>{" "}
                                    codes match
                                </>
                            ) : (
                                <>
                                    <span className="font-medium text-slate-700">
                                        {errorCodes.code.length}
                                    </span>{" "}
                                    error codes
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by code, event, or description…"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400"
                    />
                    <svg
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
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
                    {hasSearch && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                            aria-label="Clear search"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
                <div className="max-h-[720px] overflow-auto">
                    <table className="min-w-full table-fixed text-left">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b-2 border-slate-200">
                            <tr>
                                <th className="px-5 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-widest w-28">
                                    Code
                                </th>
                                <th className="px-5 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-widest w-80">
                                    Event
                                </th>
                                <th className="px-5 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-widest">
                                    Description
                                </th>
                                <th className="px-5 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-widest w-40">
                                    From
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((row, i) => (
                                <tr
                                    key={`${row.code}-${i}`}
                                    className="group transition-colors hover:bg-rose-50/40"
                                >
                                    <td className="px-5 py-4 align-top">
                                        <span className="inline-flex items-center rounded-lg px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 font-mono text-xs font-semibold tracking-tight shadow-sm">
                                            {row.code}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 align-top text-sm font-semibold text-slate-800 whitespace-pre-wrap break-words leading-snug">
                                        {row.Event}
                                    </td>
                                    <td className="px-5 py-4 align-top text-sm text-slate-600 whitespace-pre-wrap break-words leading-relaxed">
                                        {row.Description}
                                    </td>
                                    <td className="px-5 py-4 align-top">
                                        <span className="inline-flex items-center rounded-lg px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold shadow-sm">
                                            {row.From}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg
                                                className="h-8 w-8 text-slate-300"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={1.5}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                                                />
                                            </svg>
                                            <p className="text-sm font-medium text-slate-500">
                                                No error codes match your search.
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Try a different keyword or clear the filter.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                {rows.length > 0 && (
                    <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-2.5 flex items-center justify-between">
                        <p className="text-xs text-slate-400">
                            Showing{" "}
                            <span className="font-medium text-slate-600">{rows.length}</span> of{" "}
                            <span className="font-medium text-slate-600">
                                {errorCodes.code.length}
                            </span>{" "}
                            entries
                        </p>
                        {hasSearch && (
                            <button
                                onClick={() => setSearch("")}
                                className="text-xs text-rose-500 hover:text-rose-700 font-medium transition"
                            >
                                Clear filter
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ErrorCodesTable;
