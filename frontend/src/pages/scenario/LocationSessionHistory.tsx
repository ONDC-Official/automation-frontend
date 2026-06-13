import { useState, useMemo, useRef, useEffect } from "react";
import { LocalSessionHistoryCard } from "@/pages/scenario/LocalSessionHistoryCard";
import { Pagination } from "@components/Pagination";
import { LS_KEY, SESSIONS_PER_PAGE } from "@/pages/scenario/constants";
import { ILocationSessionHistoryProps } from "@/pages/scenario/types";
import { Button } from "@/components/shadcn/button";
import { SearchField } from "@/components/ui/SearchField";

export const LocationSessionHistory = ({
    sessions,
    onOpenSession,
    onSessionsChange,
    sessionsPerPage = SESSIONS_PER_PAGE,
}: ILocationSessionHistoryProps) => {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const confirmRef = useRef<HTMLDivElement>(null);

    const filtered = useMemo(() => {
        if (!search.trim()) return sessions;
        const q = search.toLowerCase();
        return sessions.filter(
            (s) =>
                (s.sessionId ?? "").toLowerCase().includes(q) ||
                (s.subscriberUrl ?? "").toLowerCase().includes(q) ||
                (s.role ?? "").toLowerCase().includes(q)
        );
    }, [sessions, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / sessionsPerPage));

    useEffect(() => {
        setPage(1);
    }, [search]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const paginated = filtered.slice((page - 1) * sessionsPerPage, page * sessionsPerPage);

    useEffect(() => {
        if (!showDeleteConfirm) return;
        const handler = (e: MouseEvent) => {
            if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) {
                setShowDeleteConfirm(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showDeleteConfirm]);

    const handleDeleteAll = () => {
        localStorage.removeItem(LS_KEY);
        onSessionsChange?.([]);
        setShowDeleteConfirm(false);
        setPage(1);
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-n-30 bg-white">
            <h3 className="px-5 pt-5 text-lg font-semibold text-n-800">Local Session History</h3>

            <div className="mx-5 mt-4 flex flex-col gap-3 rounded-xl bg-brand-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-n-500">
                    {sessions.length} saved · {filtered.length} shown
                </p>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <SearchField value={search} onChange={(e) => setSearch(e.target.value)} />

                    <div className="relative shrink-0" ref={confirmRef}>
                        <Button
                            type="button"
                            onClick={() => setShowDeleteConfirm((v) => !v)}
                            className="w-full rounded-lg bg-brand-normal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-normal-hover sm:w-auto"
                        >
                            Clear all
                        </Button>
                        {showDeleteConfirm && (
                            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-n-30 bg-white p-4 shadow-lg">
                                <p className="mb-3 text-xs font-medium text-n-500">
                                    This will permanently delete all {sessions.length} saved
                                    sessions.
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        onClick={handleDeleteAll}
                                        className="flex-1 rounded-lg bg-error-500 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-error-800"
                                    >
                                        Delete all
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 rounded-lg bg-n-20 py-1.5 text-xs font-medium text-n-300 transition-colors hover:bg-n-30"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                    <p className="text-sm font-medium text-n-300">No sessions yet</p>
                    <p className="mt-1 text-xs text-n-100">
                        Sessions will appear here after you run flow tests
                    </p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                    <p className="text-sm font-medium text-n-300">No results found</p>
                    <p className="mt-1 text-xs text-n-100">Try a different search term</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
                        {paginated.map((session, index) => (
                            <LocalSessionHistoryCard
                                key={`${session.sessionId}-${index}`}
                                sessionId={session.sessionId}
                                subscriberUrl={session.subscriberUrl}
                                role={session.role ?? "Unknown"}
                                onOpen={() => onOpenSession(session)}
                            />
                        ))}
                    </div>
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </>
            )}
        </div>
    );
};

export default LocationSessionHistory;
