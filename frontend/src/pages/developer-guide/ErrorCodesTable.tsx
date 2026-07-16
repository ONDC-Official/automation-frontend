import { type FC, useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Badge } from "@components/Shadcn/Badge";
import { Button } from "@components/Shadcn/Button";
import type { ErrorCodes } from "./types";
import GuideSearchInput from "./shared/components/GuideSearchInput";
import GuideTable, { type GuideTableColumn } from "./shared/components/GuideTable";
import { EmptyState } from "./shared/components/states";

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
    const [selectedSource, setSelectedSource] = useState<"ALL" | "BAP" | "BPP">("ALL");

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return errorCodes.code.filter((row) => {
            const source = row.From.trim().toUpperCase() as "BAP" | "BPP";
            if (selectedSource !== "ALL" && selectedSource !== source) return false;
            if (!q) return true;
            return [row.Event, row.Description, row.From, String(row.code)]
                .join(" ")
                .toLowerCase()
                .includes(q);
        });
    }, [errorCodes.code, search, selectedSource]);

    const hasSearch = search.trim().length > 0;
    const sourceCounts = useMemo(
        () => ({
            ALL: errorCodes.code.length,
            BAP: errorCodes.code.filter((row) => row.From.trim().toUpperCase() === "BAP").length,
            BPP: errorCodes.code.filter((row) => row.From.trim().toUpperCase() === "BPP").length,
        }),
        [errorCodes.code]
    );

    const columns: GuideTableColumn<ErrorCodeRow>[] = [
        {
            key: "code",
            header: "Code",
            headerClassName: "w-28",
            render: (row) => (
                <Badge variant="error" className="font-mono normal-case tracking-tight">
                    {row.code}
                </Badge>
            ),
        },
        {
            key: "event",
            header: "Event",
            cellClassName:
                "text-body-2 text-n-800 dark:text-n-0 whitespace-pre-wrap wrap-break-word leading-snug",
            render: (row) => row.Event,
        },
        {
            key: "from",
            header: "From",
            headerClassName: "w-40",
            render: (row) => <Badge variant="info">{row.From}</Badge>,
        },
    ];

    return (
        <div className="w-full">
            <GuideTable
                columns={columns}
                rows={rows}
                rowKey={(row, i) => `${row.code}-${i}`}
                rowClassName={() =>
                    "group transition-colors hover:bg-n-10 dark:hover:bg-surface-muted"
                }
                maxHeight="calc(100svh - 280px)"
                toolbar={
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 min-w-0 flex-1">
                            <GuideSearchInput
                                value={search}
                                onChange={setSearch}
                                accent="rose"
                                placeholder="Search error codes…"
                                className="w-full sm:w-72 shrink-0"
                            />
                            <p className="text-body-2 text-n-300 dark:text-n-60 whitespace-nowrap">
                                <span className="font-semibold text-n-800 dark:text-n-0">
                                    {rows.length}
                                </span>
                                {hasSearch
                                    ? ` of ${errorCodes.code.length} error codes`
                                    : " error codes"}
                            </p>
                        </div>
                        <div className="inline-flex w-fit shrink-0 items-center gap-1 rounded-xl border border-n-30 bg-n-0 p-1 dark:border-border-default dark:bg-surface-elevated">
                            {(["ALL", "BAP", "BPP"] as const).map((option) => {
                                const isSelected = selectedSource === option;
                                return (
                                    <Button
                                        variant="secondary"
                                        key={option}
                                        type="button"
                                        onClick={() => setSelectedSource(option)}
                                        className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${
                                            isSelected
                                                ? "bg-brand-normal text-n-0 hover:bg-brand-normal-hover"
                                                : "text-n-300 hover:bg-n-20 hover:text-n-800 dark:text-n-60 dark:hover:bg-surface-muted dark:hover:text-n-0"
                                        }`}
                                    >
                                        {option}
                                        <span
                                            className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                                                isSelected
                                                    ? "bg-white/20 text-n-0"
                                                    : "bg-n-20 text-n-300 dark:bg-surface-muted dark:text-n-60"
                                            }`}
                                        >
                                            {sourceCounts[option]}
                                        </span>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                }
                emptyState={
                    <EmptyState
                        icon={MagnifyingGlassIcon}
                        message="No error codes match your search."
                        hint="Try a different keyword or clear the filter."
                    />
                }
            />
        </div>
    );
};

export default ErrorCodesTable;
