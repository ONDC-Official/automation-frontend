import { useState } from "react";
import { ParentSize } from "@visx/responsive";
import { BarChart3, Table2, TriangleAlert } from "lucide-react";

import Card, {
    CardAction,
    CardDescription,
    CardHeader,
    CardTitle,
    CardContent,
} from "@dashboard/components/Card";
import Button from "@dashboard/components/Button";
import EmptyState from "@dashboard/components/EmptyState";
import { cn } from "@dashboard/lib/utils";
import ChartLegend from "./ChartLegend";
import ChartPlot from "./ChartPlot";
import ChartTable from "./ChartTable";
import { DEFAULT_HEIGHT } from "./constants";
import { identityFormatter } from "./utils";
import type { ChartDatum, IProps } from "./types";

/**
 * The one chart wrapper in the app. A new panel is a new `{ title, description,
 * data, series, type }` config — never new chart code. Every colour comes from a
 * CSS variable so the panel tracks the active theme, and every panel ships a
 * legend (≥2 series), a hover tooltip and a table view.
 *
 * Marks are drawn by `ChartPlot` from the geometry core in `./geometry.ts`;
 * `reportGeometry` feeds that same core to the PDF renderer, so a chart on the
 * page and its printed twin cannot disagree.
 */
const Chart = <TDatum extends ChartDatum>({
    title,
    description,
    data,
    series,
    type,
    xKey,
    xFormatter = (value) => value,
    yFormatter,
    valueFormatter,
    height = DEFAULT_HEIGHT,
    isLoading,
    isError,
    error,
    emptyMessage = "No data for the selected filters.",
    actions,
    className,
}: IProps<TDatum>) => {
    const [showTable, setShowTable] = useState(false);

    const axisFormatter = yFormatter ?? identityFormatter;
    const readFormatter = valueFormatter ?? axisFormatter;

    const body = () => {
        if (isLoading) {
            return (
                <div
                    className="bg-muted animate-pulse rounded-md"
                    style={{ height }}
                    aria-label="Loading chart"
                />
            );
        }

        if (isError) {
            return (
                <EmptyState
                    icon={TriangleAlert}
                    title="Query failed"
                    description={error ?? "The dashboard could not load this panel."}
                />
            );
        }

        if (data.length === 0) {
            return (
                <EmptyState icon={BarChart3} title="Nothing to plot" description={emptyMessage} />
            );
        }

        if (showTable) {
            return (
                <ChartTable
                    data={data}
                    series={series}
                    xKey={xKey}
                    xLabel={title}
                    xFormatter={xFormatter}
                    valueFormatter={readFormatter}
                />
            );
        }

        return (
            <div style={{ height }}>
                <ParentSize debounceTime={0}>
                    {({ width }) =>
                        width > 0 ? (
                            <ChartPlot
                                width={width}
                                height={height}
                                data={data}
                                series={series}
                                type={type}
                                xKey={xKey}
                                xFormatter={xFormatter}
                                yFormatter={axisFormatter}
                                valueFormatter={readFormatter}
                            />
                        ) : null
                    }
                </ParentSize>
            </div>
        );
    };

    return (
        <Card data-slot="chart" className={cn("gap-3", className)}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
                <CardAction>
                    <div className="flex items-center gap-1">
                        {actions}
                        <Button
                            variant="ghost"
                            size="sm"
                            aria-pressed={showTable}
                            onClick={() => setShowTable((current) => !current)}
                        >
                            {showTable ? <BarChart3 /> : <Table2 />}
                            {showTable ? "Chart" : "Table"}
                        </Button>
                    </div>
                </CardAction>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
                {!showTable && !isLoading && !isError && data.length > 0 && (
                    <ChartLegend series={series} />
                )}
                {body()}
            </CardContent>
        </Card>
    );
};

/** Public surface — panel configs import these, never `@/components/Chart/types`. */
export type { ChartDatum, ChartTone, ChartType, ISeries } from "./types";

export default Chart;
