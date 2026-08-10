import { G, Line, Path, Svg, Text } from "@react-pdf/renderer";

import {
    AREA_FILL_OPACITY,
    LINE_WIDTH,
    PRINT_GRID,
    PRINT_MUTED,
} from "@pages/business-dashboard/components/Chart/constants";
import { buildGeometry, stripBandKey } from "@pages/business-dashboard/components/Chart/geometry";
import { printColorForSeries } from "@pages/business-dashboard/components/Chart/utils";
import type { ChartDatum, ChartType, ISeries } from "@pages/business-dashboard/components/Chart";

interface IProps {
    data: readonly ChartDatum[];
    series: ISeries[];
    type: ChartType;
    xKey: string;
    xFormatter: (value: string) => string;
    yFormatter: (value: number) => string;
    width: number;
    height: number;
}

/**
 * The print renderer. It shares `buildGeometry` with the on-screen chart, so the
 * bars land on the same bands, the y axis picks the same ticks and the x labels
 * thin at the same stride — the two cannot drift, because neither owns the
 * maths. All it adds is react-pdf primitives and the literal print palette,
 * since a PDF resolves no CSS variables.
 */
const ReportChart = ({
    data,
    series,
    type,
    xKey,
    xFormatter,
    yFormatter,
    width,
    height,
}: IProps) => {
    const geometry = buildGeometry({ data, series, type, xKey, width, height });
    const { margin, innerWidth, innerHeight } = geometry;

    return (
        <Svg width={width} height={height}>
            <G transform={`translate(${margin.left}, ${margin.top})`}>
                {geometry.yTicks.map((tick) => (
                    <Line
                        key={`grid-${tick.value}`}
                        x1={0}
                        x2={innerWidth}
                        y1={tick.offset}
                        y2={tick.offset}
                        strokeWidth={0.5}
                        stroke={PRINT_GRID}
                    />
                ))}

                {geometry.fills.map((mark, index) => (
                    <Path
                        key={`fill-${mark.seriesKey}-${index}`}
                        d={mark.d}
                        fill={printColorForSeries(series[mark.seriesIndex], mark.seriesIndex)}
                        fillOpacity={type === "area" ? AREA_FILL_OPACITY : 1}
                    />
                ))}

                {geometry.strokes.map((mark) => (
                    <Path
                        key={`stroke-${mark.seriesKey}`}
                        d={mark.d}
                        stroke={printColorForSeries(series[mark.seriesIndex], mark.seriesIndex)}
                        strokeWidth={LINE_WIDTH}
                        fill="none"
                    />
                ))}

                {geometry.yTicks.map((tick) => (
                    <Text
                        key={`y-${tick.value}`}
                        x={-6}
                        y={tick.offset + 2.5}
                        style={{ fontSize: 7, textAlign: "right" }}
                        fill={PRINT_MUTED}
                        textAnchor="end"
                    >
                        {yFormatter(Number(tick.value))}
                    </Text>
                ))}

                {geometry.xTicks.map((tick) => (
                    <Text
                        key={`x-${tick.value}`}
                        x={tick.offset}
                        y={innerHeight + 12}
                        style={{ fontSize: 7 }}
                        fill={PRINT_MUTED}
                        textAnchor="middle"
                    >
                        {xFormatter(stripBandKey(tick.value))}
                    </Text>
                ))}
            </G>
        </Svg>
    );
};

export default ReportChart;
