import { type FC, useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import type { ErrorCodes } from "./types";
import GuideSearchInput from "./shared/components/GuideSearchInput";
import GuideTable, { type GuideTableColumn } from "./shared/components/GuideTable";
import { EmptyState } from "./shared/components/states";

const PAGE_SIZE = 10;

interface ErrorCodesTableProps {
    errorCodes: ErrorCodes;
}

interface ErrorCodeRow {
    Event: string;
    Description: string;
    From: string;
    code: string | number;
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

    const columns: GuideTableColumn<ErrorCodeRow>[] = [
        {
            key: "code",
            header: "Code",
            headerClassName: "w-28",
            render: (row) => (
                <span className="inline-flex items-center rounded-lg px-2.5 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 font-mono text-xs font-semibold tracking-tight shadow-xs">
                    {row.code}
                </span>
            ),
        },
        {
            key: "event",
            header: "Event",
            cellClassName:
                "text-sm font-semibold text-slate-800 whitespace-pre-wrap wrap-break-word leading-snug",
            render: (row) => row.Event,
        },
        {
            key: "from",
            header: "From",
            headerClassName: "w-40",
            render: (row) => (
                <span className="inline-flex items-center rounded-lg px-2.5 py-1 bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30 text-xs font-semibold shadow-xs">
                    {row.From}
                </span>
            ),
        },
    ];

    return (
        <div className="w-full">
            <GuideTable
                columns={columns}
                rows={rows}
                rowKey={(row, i) => `${row.code}-${i}`}
                rowClassName={() =>
                    "group transition-colors hover:bg-rose-50/40 dark:hover:bg-rose-500/10"
                }
                pagination={{ pageSize: PAGE_SIZE }}
                toolbar={
                    <GuideSearchInput
                        value={search}
                        onChange={setSearch}
                        accent="rose"
                        placeholder="Search by code, event, or description…"
                    />
                }
                emptyState={
                    <EmptyState
                        icon={FiSearch}
                        message="No error codes match your search."
                        hint="Try a different keyword or clear the filter."
                    />
                }
                footer={
                    rows.length > 0 &&
                    hasSearch && (
                        <div className="border-t border-slate-100 bg-slate-50/60 dark:bg-surface-muted/60 px-5 py-2.5 flex items-center justify-end">
                            <button
                                onClick={() => setSearch("")}
                                className="text-xs text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium transition"
                            >
                                Clear filter
                            </button>
                        </div>
                    )
                }
            />
        </div>
    );
};

export default ErrorCodesTable;
