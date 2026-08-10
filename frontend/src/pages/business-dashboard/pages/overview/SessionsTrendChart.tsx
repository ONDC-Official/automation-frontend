import ChartPanel from "@components/ChartPanel";
import { formatDay, formatNumber } from "@pages/business-dashboard/lib/utils";
import type { SessionStatsResponse } from "@pages/business-dashboard/services/types";
import { TREND_SERIES } from "./constants";

interface IProps {
    data: SessionStatsResponse["byDay"];
    isLoading: boolean;
    isError: boolean;
    errorMessage?: string;
}

const SessionsTrendChart = ({ data, isLoading, isError, errorMessage }: IProps) => (
    <ChartPanel
        title="Flow outcomes per day"
        description="Passed and failed flows, stacked by the day the session was created."
        type="stacked-bar"
        xKey="date"
        data={data}
        series={TREND_SERIES}
        xFormatter={formatDay}
        yFormatter={formatNumber}
        isLoading={isLoading}
        isError={isError}
        error={errorMessage}
        emptyMessage="No sessions were created in this window."
    />
);

export default SessionsTrendChart;
