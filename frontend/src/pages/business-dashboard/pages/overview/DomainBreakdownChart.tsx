import ChartPanel from "@components/ChartPanel";
import { formatNumber } from "@/lib/utils";
import type { SessionStatsResponse } from "@pages/business-dashboard/services/types";
import { DOMAIN_SERIES, MAX_DOMAIN_BARS } from "./constants";

interface IProps {
    data: SessionStatsResponse["byDomain"];
    isLoading: boolean;
    isError: boolean;
    errorMessage?: string;
}

const DomainBreakdownChart = ({ data, isLoading, isError, errorMessage }: IProps) => (
    <ChartPanel
        title="Sessions by domain"
        description={`The ${MAX_DOMAIN_BARS} busiest domains in the selected window.`}
        type="bar"
        xKey="domain"
        data={data}
        series={DOMAIN_SERIES}
        yFormatter={formatNumber}
        isLoading={isLoading}
        isError={isError}
        error={errorMessage}
        emptyMessage="No domains recorded any sessions in this window."
    />
);

export default DomainBreakdownChart;
