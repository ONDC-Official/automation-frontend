import { Link } from "react-router-dom";
import { ROUTES } from "@constants/routes";
import { Download, ListFilter, RefreshCw } from "lucide-react";

import Button from "@dashboard/components/Button";
import DateRangePicker from "@dashboard/components/DateRangePicker";
import PageHeader from "@dashboard/components/PageHeader";
import { useOverviewPage } from "./useOverviewPage";
import DomainBreakdownChart from "./DomainBreakdownChart";
import KpiRow from "./KpiRow";
import SessionsTrendChart from "./SessionsTrendChart";

const Overview = () => {
    const {
        range,
        onRangeChange,
        sessionsSearch,
        totals,
        trend,
        domains,
        sessionsSparkline,
        isLoading,
        isFetching,
        isError,
        errorMessage,
        onRefresh,
        isGeneratingReport,
        canDownloadReport,
        onDownloadReport,
    } = useOverviewPage();

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Overview"
                description="What the automation stack has been doing, aggregated server-side."
                actions={
                    <>
                        <DateRangePicker value={range} onChange={onRangeChange} />
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isFetching}
                            onClick={() => onRefresh()}
                        >
                            <RefreshCw />
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!canDownloadReport || isGeneratingReport}
                            onClick={() => void onDownloadReport()}
                        >
                            <Download />
                            {isGeneratingReport ? "Building…" : "Download report"}
                        </Button>
                        <Button size="sm" asChild>
                            <Link
                                to={{ pathname: ROUTES.BUSINESS_SESSIONS, search: sessionsSearch }}
                            >
                                <ListFilter />
                                Explore sessions
                            </Link>
                        </Button>
                    </>
                }
            />

            <KpiRow totals={totals} sparkline={sessionsSparkline} isLoading={isLoading} />

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <SessionsTrendChart
                    data={trend}
                    isLoading={isLoading}
                    isError={isError}
                    errorMessage={errorMessage}
                />
                <DomainBreakdownChart
                    data={domains}
                    isLoading={isLoading}
                    isError={isError}
                    errorMessage={errorMessage}
                />
            </div>
        </div>
    );
};

export default Overview;
