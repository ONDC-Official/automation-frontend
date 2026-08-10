import { Link } from "react-router-dom";
import { ROUTES } from "@constants/routes";
import { Download, RefreshCw } from "lucide-react";

import { Button } from "@components/Shadcn/Button";
import PageHeader from "@components/PageHeader";
import { useSessionsPage } from "./useSessionsPage";
import FilterBar from "./FilterBar";
import PaginationBar from "./PaginationBar";
import SessionDetailSheet from "./SessionDetailSheet";
import SessionsTable from "./SessionsTable";

const Sessions = () => {
    const {
        filters,
        exportSearch,
        facets,
        isFacetsLoading,
        isFiltered,
        rows,
        total,
        page,
        limit,
        totalPages,
        isLoading,
        isFetching,
        isError,
        errorMessage,
        onRefresh,
        selectedSessionId,
        detail,
        isDetailLoading,
        isDetailError,
        onSelectSession,
        onCloseDetail,
        onFilterChange,
        onPageChange,
        onLimitChange,
        onSortChange,
        onReset,
    } = useSessionsPage();

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Sessions"
                description="Every automation and manual session, filtered server-side. The URL carries the filters, so this view is shareable."
                actions={
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isFetching}
                            onClick={() => onRefresh()}
                        >
                            <RefreshCw />
                            Refresh
                        </Button>
                        <Button size="sm" asChild>
                            <Link to={{ pathname: ROUTES.BUSINESS_EXPORT, search: exportSearch }}>
                                <Download />
                                Export this slice
                            </Link>
                        </Button>
                    </>
                }
            />

            <FilterBar
                filters={filters}
                facets={facets}
                isFacetsLoading={isFacetsLoading}
                isFiltered={isFiltered}
                onFilterChange={onFilterChange}
                onReset={onReset}
            />

            <SessionsTable
                rows={rows}
                sort={filters.sort}
                order={filters.order}
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                selectedSessionId={selectedSessionId}
                onSelectSession={onSelectSession}
                onSortChange={onSortChange}
            />

            <PaginationBar
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                isFetching={isFetching}
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
            />

            <SessionDetailSheet
                sessionId={selectedSessionId}
                detail={detail}
                isLoading={isDetailLoading}
                isError={isDetailError}
                onClose={onCloseDetail}
            />
        </div>
    );
};

export default Sessions;
