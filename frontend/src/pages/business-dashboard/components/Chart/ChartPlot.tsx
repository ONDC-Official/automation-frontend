import { useCallback, useMemo } from "react";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { localPoint } from "@visx/event";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { TooltipWithBounds, useTooltip } from "@visx/tooltip";

import ChartTooltip from "./ChartTooltip";
import {
    AREA_FILL_OPACITY,
    AXIS_TICK,
    CHART_AXIS,
    CHART_GRID,
    CHART_SURFACE,
    LINE_WIDTH,
} from "./constants";
import { buildGeometry, read, stripBandKey } from "./geometry";
import { colorForSeries } from "./utils";
import type { ChartDatum, ChartType, ISeries } from "./types";

interface IProps {
    width: number;
    height: number;
    data: readonly ChartDatum[];
    series: ISeries[];
    type: ChartType;
    xKey: string;
    xFormatter: (value: string) => string;
    yFormatter: (value: number) => string;
    valueFormatter: (value: number) => string;
}

/**
 * The on-screen renderer. visx supplies the axes, grid and tooltip positioning;
 * every mark it draws is a path string straight out of the geometry core, which
 * is the same string the PDF renderer receives. Nothing here computes a scale.
 */
const ChartPlot = ({
    width,
    height,
    data,
    series,
    type,
    xKey,
    xFormatter,
    yFormatter,
    valueFormatter,
}: IProps) => {
    const geometry = useMemo(
        () => buildGeometry({ data, series, type, xKey, width, height }),
        [data, series, type, xKey, width, height]
    );

    const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, showTooltip, hideTooltip } =
        useTooltip<number>();

    const { margin, innerWidth, innerHeight, centres } = geometry;
    const isLineForm = type === "line" || type === "area";

    /** Nearest band to the pointer — the hit target is the full column, not the mark. */
    const onMove = useCallback(
        (event: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>) => {
            const point = localPoint(event);
            if (!point || centres.length === 0) return;

            const x = point.x - margin.left;
            let nearest = 0;
            for (let index = 1; index < centres.length; index += 1) {
                if (Math.abs(centres[index] - x) < Math.abs(centres[nearest] - x)) nearest = index;
            }

            showTooltip({
                tooltipData: nearest,
                tooltipLeft: centres[nearest] + margin.left,
                tooltipTop: point.y,
            });
        },
        [centres, margin.left, showTooltip]
    );

    if (innerWidth <= 0 || innerHeight <= 0) return null;

    const hovered = tooltipOpen && tooltipData !== undefined ? tooltipData : null;
    const hoveredDatum = hovered === null ? undefined : data[hovered];

    return (
        <div className="relative">
            <svg width={width} height={height}>
                <Group left={margin.left} top={margin.top}>
                    <GridRows
                        scale={geometry.yScale}
                        width={innerWidth}
                        tickValues={geometry.yTicks.map((tick) => Number(tick.value))}
                        stroke={CHART_GRID}
                    />

                    {/* The hovered column, drawn under the marks so it never dims them. */}
                    {hovered !== null && (
                        <rect
                            x={centres[hovered] - geometry.step / 2}
                            y={0}
                            width={geometry.step}
                            height={innerHeight}
                            fill={CHART_AXIS}
                            opacity={isLineForm ? 0 : 0.12}
                        />
                    )}
                    {hovered !== null && isLineForm && (
                        <line
                            x1={centres[hovered]}
                            x2={centres[hovered]}
                            y1={0}
                            y2={innerHeight}
                            stroke={CHART_AXIS}
                            strokeWidth={1}
                        />
                    )}

                    {geometry.fills.map((mark, index) => (
                        <path
                            key={`fill-${mark.seriesKey}-${index}`}
                            d={mark.d}
                            fill={colorForSeries(series[mark.seriesIndex], mark.seriesIndex)}
                            fillOpacity={type === "area" ? AREA_FILL_OPACITY : 1}
                        />
                    ))}

                    {geometry.strokes.map((mark) => (
                        <path
                            key={`stroke-${mark.seriesKey}`}
                            d={mark.d}
                            fill="none"
                            stroke={colorForSeries(series[mark.seriesIndex], mark.seriesIndex)}
                            strokeWidth={LINE_WIDTH}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    ))}

                    {/* ≥8px marker with a 2px surface ring so it stays legible where
              lines cross — the ring is part of the hit target. */}
                    {hovered !== null &&
                        isLineForm &&
                        series.map((entry, seriesIndex) => {
                            const value = read(data[hovered], entry.key);
                            if (typeof value !== "number") return null;

                            return (
                                <circle
                                    key={`dot-${entry.key}`}
                                    cx={centres[hovered]}
                                    cy={geometry.yScale(value)}
                                    r={4}
                                    fill={colorForSeries(entry, seriesIndex)}
                                    stroke={CHART_SURFACE}
                                    strokeWidth={2}
                                />
                            );
                        })}

                    <AxisLeft
                        scale={geometry.yScale}
                        tickValues={geometry.yTicks.map((tick) => Number(tick.value))}
                        hideAxisLine
                        hideTicks
                        tickFormat={(value) => yFormatter(Number(value))}
                        tickLabelProps={() => ({
                            ...AXIS_TICK,
                            textAnchor: "end" as const,
                            dx: "-0.4em",
                            dy: "0.33em",
                        })}
                    />

                    <AxisBottom
                        top={innerHeight}
                        scale={geometry.xScale}
                        tickValues={geometry.xTicks.map((tick) => tick.value)}
                        hideTicks
                        stroke={CHART_AXIS}
                        tickFormat={(value) => xFormatter(stripBandKey(String(value)))}
                        tickLabelProps={() => ({
                            ...AXIS_TICK,
                            textAnchor: "middle" as const,
                            dy: "0.6em",
                        })}
                    />

                    <rect
                        x={0}
                        y={0}
                        width={innerWidth}
                        height={innerHeight}
                        fill="transparent"
                        onMouseMove={onMove}
                        onMouseLeave={hideTooltip}
                        onTouchMove={onMove}
                        onTouchEnd={hideTooltip}
                    />
                </Group>
            </svg>

            {hoveredDatum !== undefined && (
                <TooltipWithBounds
                    left={tooltipLeft}
                    top={tooltipTop}
                    unstyled
                    applyPositionStyle
                    className="pointer-events-none z-10"
                >
                    <ChartTooltip
                        active
                        label={String(read(hoveredDatum, xKey) ?? "")}
                        activeKeys={series
                            .filter((entry) => typeof read(hoveredDatum, entry.key) === "number")
                            .map((entry) => entry.key)}
                        values={Object.fromEntries(
                            series.map((entry) => {
                                const value = read(hoveredDatum, entry.key);
                                return [entry.key, typeof value === "number" ? value : undefined];
                            })
                        )}
                        series={series}
                        labelFormatter={xFormatter}
                        valueFormatter={valueFormatter}
                    />
                </TooltipWithBounds>
            )}
        </div>
    );
};

export default ChartPlot;
