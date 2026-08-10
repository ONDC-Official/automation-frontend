import { RefreshCw, Search, User } from "lucide-react";

import Button from "@pages/business-dashboard/components/Button";
import Input from "@pages/business-dashboard/components/Input";
import PageHeader from "@pages/business-dashboard/components/PageHeader";
import Pagination from "@pages/business-dashboard/components/Pagination";
import { useReportsPage } from "./useReportsPage";
import ReportViewer from "./ReportViewer";
import ReportsTable from "./ReportsTable";

const Reports = () => {
    const {
        filters,
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
        openTestId,
        reportHtml,
        isBlobLoading,
        isBlobError,
        blobErrorMessage,
        onOpenReport,
        onCloseReport,
        onDownloadReport,
        onSearch,
        onUserFilter,
        onPageChange,
        onLimitChange,
    } = useReportsPage();

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Reports"
                description="Generated test reports, keyed by test id (PW_ + session id)."
                actions={
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isFetching}
                        onClick={() => onRefresh()}
                    >
                        <RefreshCw />
                        Refresh
                    </Button>
                }
            />

            <div className="border-border bg-card flex flex-wrap items-center gap-2 rounded-lg border p-3">
                <div className="relative min-w-56 flex-1">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                    <Input
                        value={filters.q ?? ""}
                        onChange={(event) => onSearch(event.target.value)}
                        placeholder="Search test id"
                        aria-label="Search test id"
                        className="pl-8"
                    />
                </div>
                <div className="relative min-w-56">
                    <User className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                    <Input
                        value={filters.userId ?? ""}
                        onChange={(event) => onUserFilter(event.target.value)}
                        placeholder="Filter by user id"
                        aria-label="Filter by user id"
                        className="pl-8"
                    />
                </div>
            </div>

            <ReportsTable
                rows={rows}
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                onOpenReport={onOpenReport}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                disabled={isFetching}
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
            />

            <ReportViewer
                testId={openTestId}
                html={reportHtml}
                isLoading={isBlobLoading}
                isError={isBlobError}
                errorMessage={blobErrorMessage}
                onDownload={onDownloadReport}
                onClose={onCloseReport}
            />
        </div>
    );
};

export default Reports;
