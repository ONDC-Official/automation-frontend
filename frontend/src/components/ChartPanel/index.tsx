import { useMemo, useState } from "react";
import { BarChart3, Table2, TriangleAlert } from "lucide-react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { Button } from "@components/Shadcn/Button";
import { Card } from "@components/Shadcn/Card";
import { ChartContainer, type ChartConfig } from "@components/Shadcn/Chart";
import EmptyState from "@components/EmptyState";
import { cn } from "@/lib/utils";
import ChartPanelTable from "./ChartPanelTable";
import {
    AREA_FILL_OPACITY,
    AXIS_TICK_FONT_SIZE,
    BAR_RADIUS,
    CHART_SLOT_VARS,
    CHART_TONE_VARS,
    DEFAULT_HEIGHT,
    LINE_WIDTH,
    MAX_BAR_SIZE,
} from "./constants";
import type { ChartDatum, IChartPanelProps } from "./types";

/**
 * The one chart wrapper in the app. A new panel is a new
 * `{ title, description, data, series, type }` config — never new chart code.
 * Every colour comes from a CSS variable so the panel tracks the active theme,
 * and every panel ships a legend (≥2 series), a hover tooltip and a table view:
 * the light palette sits in the sub-3:1 contrast relief band, where colour alone
 * is not allowed to carry the meaning.
 *
 * Marks are recharts, drawn inside shadcn's ChartContainer so the series colours
 * arrive as `--color-<key>` custom properties.
 */
const ChartPanel = <TDatum extends ChartDatum>({
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
}: IChartPanelProps<TDatum>) => {
    const [showTable, setShowTable] = useState(false);

    const axisFormatter = yFormatter ?? ((value: number) => String(value));
    const readFormatter = valueFormatter ?? axisFormatter;

    /**
     * Status-toned series take the reserved scale; everything else takes the
     * next categorical slot. A panel never mixes the two — see ChartTone.
     */
    const config = useMemo<ChartConfig>(() => {
        let slot = 0;
        return series.reduce<ChartConfig>((accumulator, { key, label, tone }) => {
            accumulator[key] = {
                label,
                color: tone
                    ? CHART_TONE_VARS[tone]
                    : CHART_SLOT_VARS[slot++ % CHART_SLOT_VARS.length],
            };
            return accumulator;
        }, {});
    }, [series]);

    const rows = data as TDatum[];

    const plot = () => {
        /*
         * A keyed array, not a fragment. recharts scans its own children with
         * React.Children to find the axes, grid, tooltip and legend; that
         * flattens arrays but NOT fragments, so wrapping these in <>…</> makes
         * every one of them silently vanish while the bars still draw.
         */
        const axes = [
            <CartesianGrid key="grid" vertical={false} stroke="var(--chart-grid)" />,
            <XAxis
                key="x"
                dataKey={xKey}
                tickLine={false}
                axisLine={{ stroke: "var(--chart-axis)" }}
                tickMargin={8}
                fontSize={AXIS_TICK_FONT_SIZE}
                tickFormatter={(value) => xFormatter(String(value))}
            />,
            <YAxis
                key="y"
                tickLine={false}
                axisLine={false}
                width={48}
                fontSize={AXIS_TICK_FONT_SIZE}
                tickFormatter={(value) => axisFormatter(Number(value))}
            />,
            <Tooltip
                key="tooltip"
                cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }}
                formatter={(value, name) => [
                    readFormatter(Number(value)),
                    config[name as string]?.label ?? name,
                ]}
                labelFormatter={(label) => xFormatter(String(label))}
                contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--popover-foreground)",
                    fontSize: 12,
                }}
            />,
            series.length > 1 ? (
                <Legend key="legend" verticalAlign="top" height={28} iconType="circle" />
            ) : null,
        ];

        if (type === "line") {
            return (
                <LineChart data={rows} accessibilityLayer>
                    {axes}
                    {series.map(({ key }) => (
                        <Line
                            key={key}
                            dataKey={key}
                            type="monotone"
                            stroke={`var(--color-${key})`}
                            strokeWidth={LINE_WIDTH}
                            dot={false}
                        />
                    ))}
                </LineChart>
            );
        }

        if (type === "area") {
            return (
                <AreaChart data={rows} accessibilityLayer>
                    {axes}
                    {series.map(({ key }) => (
                        <Area
                            key={key}
                            dataKey={key}
                            type="monotone"
                            stroke={`var(--color-${key})`}
                            strokeWidth={LINE_WIDTH}
                            fill={`var(--color-${key})`}
                            fillOpacity={AREA_FILL_OPACITY}
                        />
                    ))}
                </AreaChart>
            );
        }

        return (
            <BarChart data={rows} accessibilityLayer>
                {axes}
                {series.map(({ key }, index) => (
                    <Bar
                        key={key}
                        dataKey={key}
                        stackId={type === "stacked-bar" ? "stack" : undefined}
                        fill={`var(--color-${key})`}
                        maxBarSize={MAX_BAR_SIZE}
                        // Only the top segment of a stack gets the rounded end.
                        radius={
                            type === "stacked-bar" && index < series.length - 1
                                ? undefined
                                : BAR_RADIUS
                        }
                    />
                ))}
            </BarChart>
        );
    };

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
                    message={error ?? "The dashboard could not load this panel."}
                />
            );
        }

        if (rows.length === 0) {
            return <EmptyState icon={BarChart3} title="Nothing to plot" message={emptyMessage} />;
        }

        if (showTable) {
            return (
                <ChartPanelTable
                    data={rows}
                    series={series}
                    xKey={xKey}
                    xLabel={title}
                    xFormatter={xFormatter}
                    valueFormatter={readFormatter}
                />
            );
        }

        return (
            <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
                {plot()}
            </ChartContainer>
        );
    };

    return (
        <Card
            title={title}
            description={description}
            headerAction={
                <div className="flex shrink-0 items-center gap-1">
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
            }
        >
            <div data-slot="chart-panel" className={cn("flex flex-col", className)}>
                {body()}
            </div>
        </Card>
    );
};

/** Public surface — panel configs import these, never ./types directly. */
export type { ChartDatum, ChartTone, ChartType, ISeries } from "./types";

export default ChartPanel;
