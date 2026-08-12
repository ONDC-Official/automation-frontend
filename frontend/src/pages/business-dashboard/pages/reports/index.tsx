import { RefreshCw, User } from "lucide-react";

import { Button } from "@components/Shadcn/Button";
import PageHeader from "@components/PageHeader";
import SearchInput from "@pages/business-dashboard/components/SearchInput";
import TablePagination from "@components/TablePagination";
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
        isPending,
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
                        isLoading={isPending}
                        onClick={() => onRefresh()}
                    >
                        <RefreshCw />
                        Refresh
                    </Button>
                }
            />

            <div className="border-border bg-card flex flex-wrap items-center gap-2 rounded-lg border p-3">
                <SearchInput
                    value={filters.q}
                    placeholder="Search test id"
                    label="Search test id"
                    onChange={(q) => onSearch(q ?? "")}
                />
                <SearchInput
                    value={filters.userId}
                    placeholder="Filter by user id"
                    label="Filter by user id"
                    icon={User}
                    className="flex-none"
                    onChange={(userId) => onUserFilter(userId ?? "")}
                />
            </div>

            <ReportsTable
                rows={rows}
                isLoading={isLoading}
                isPending={isPending}
                isError={isError}
                errorMessage={errorMessage}
                onOpenReport={onOpenReport}
            />

            <TablePagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                disabled={isPending}
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
