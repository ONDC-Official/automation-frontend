import { scaleBand, scaleLinear, type ScaleBand, type ScaleLinear } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";

import {
    AXIS_LABEL_WIDTH,
    BAR_CORNER_RADIUS,
    MARGIN,
    MAX_BAR_SIZE,
    SURFACE_GAP,
    Y_TICK_COUNT,
} from "./constants";
import type { ChartDatum, ChartType, ISeries } from "./types";

/**
 * The geometry core. Pure maths over d3-scale and d3-shape: no React, no DOM,
 * no colour. It runs unchanged in the browser (where visx draws the axes around
 * it) and in `@react-pdf/renderer` (where there is no DOM at all), which is the
 * whole reason the charts and the PDF cannot drift apart — one scale, one set of
 * path strings, two thin renderers.
 *
 * Every mark leaves here as an SVG `d` string rather than a rect or a point
 * list, because `d` is the one primitive both renderers accept verbatim.
 */

/** Rows arrive as the caller's own domain type; reading a dynamic key needs this. */
export const read = (datum: ChartDatum, key: string) => (datum as Record<string, unknown>)[key];

const readNumber = (datum: ChartDatum, key: string) => {
    const value = read(datum, key);
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

export interface IMark {
    /** series key — the renderer pairs this with `colorForSeries` */
    seriesKey: string;
    /** declaration index of the series, i.e. its fixed colour slot */
    seriesIndex: number;
    /** SVG path data, ready for `<path d>` or react-pdf's `<Path d>` */
    d: string;
}

export interface ITick {
    /** pixel offset along the axis */
    offset: number;
    /** raw value, pre-formatting */
    value: string;
}

/**
 * Band keys are `${index}:${value}`, so two rows sharing a category (or an
 * empty one) still occupy distinct bands. `stripBandKey` puts the label back.
 */
export const stripBandKey = (key: string) => key.slice(key.indexOf(":") + 1);

export interface IGeometry {
    innerWidth: number;
    innerHeight: number;
    margin: typeof MARGIN;
    /** filled marks for bar forms, stroked marks for line, both for area */
    fills: IMark[];
    strokes: IMark[];
    xTicks: ITick[];
    yTicks: ITick[];
    /** x pixel centre of each datum, for crosshair and hover hit-testing */
    centres: number[];
    /** band width, i.e. the width of one datum's hover slice */
    step: number;
    /**
     * The scales themselves, so visx's axis components can draw on screen while
     * still being fed `tickValues` from the arrays above — one source of ticks,
     * whichever renderer is drawing them.
     */
    xScale: ScaleBand<string>;
    yScale: ScaleLinear<number, number>;
}

/**
 * A rect with only its top corners rounded — the 4px data-end anchored to a
 * square baseline from the dataviz mark spec. Emitted as a path because neither
 * SVG `<rect>` nor react-pdf can round two corners selectively.
 */
function roundedTopRect(x: number, y: number, width: number, height: number, radius: number) {
    if (height <= 0 || width <= 0) return "";
    const r = Math.min(radius, width / 2, height);

    return [
        `M${x},${y + height}`,
        `L${x},${y + r}`,
        `Q${x},${y} ${x + r},${y}`,
        `L${x + width - r},${y}`,
        `Q${x + width},${y} ${x + width},${y + r}`,
        `L${x + width},${y + height}`,
        "Z",
    ].join("");
}

/**
 * Thin x labels until they stop colliding. A band axis with one tick per day
 * over a 30-day window cannot label every band, so this keeps every Nth —
 * always including the first, so the axis never appears to start late.
 */
function thinTicks(count: number, innerWidth: number) {
    if (count === 0) return [] as number[];
    const affordable = Math.max(1, Math.floor(innerWidth / AXIS_LABEL_WIDTH));
    const stride = Math.max(1, Math.ceil(count / affordable));

    const kept: number[] = [];
    for (let index = 0; index < count; index += stride) kept.push(index);
    return kept;
}

export function buildGeometry({
    data,
    series,
    type,
    xKey,
    width,
    height,
}: {
    data: readonly ChartDatum[];
    series: ISeries[];
    type: ChartType;
    xKey: string;
    width: number;
    height: number;
}): IGeometry {
    const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
    const innerHeight = Math.max(0, height - MARGIN.top - MARGIN.bottom);

    const categories = data.map((datum) => String(read(datum, xKey) ?? ""));
    const stacked = type === "stacked-bar";

    /* Every form here shares a categorical x — dates and domain names alike — so
     bands stay evenly spaced and a sparse day never widens its own slot. */
    const xScale = scaleBand<string>()
        .domain(categories.map((value, index) => `${index}:${value}`))
        .range([0, innerWidth])
        .paddingInner(0.25)
        .paddingOuter(0.125);

    const ceiling = data.reduce((runningMax, datum) => {
        const rowTotal = stacked
            ? series.reduce((sum, entry) => sum + readNumber(datum, entry.key), 0)
            : series.reduce((rowMax, entry) => Math.max(rowMax, readNumber(datum, entry.key)), 0);
        return Math.max(runningMax, rowTotal);
    }, 0);

    const yScale = scaleLinear()
        .domain([0, ceiling === 0 ? 1 : ceiling])
        .range([innerHeight, 0])
        .nice(Y_TICK_COUNT);

    const band = xScale.bandwidth();
    const centres = categories.map((value, index) => (xScale(`${index}:${value}`) ?? 0) + band / 2);

    const fills: IMark[] = [];
    const strokes: IMark[] = [];

    if (type === "line" || type === "area") {
        series.forEach((entry, seriesIndex) => {
            const points = data.map((datum, index) => ({
                x: centres[index],
                y: yScale(readNumber(datum, entry.key)),
            }));

            const stroke = line<{ x: number; y: number }>()
                .x((point) => point.x)
                .y((point) => point.y)
                .curve(curveMonotoneX)(points);

            if (stroke) strokes.push({ seriesKey: entry.key, seriesIndex, d: stroke });

            if (type === "area") {
                const fill = area<{ x: number; y: number }>()
                    .x((point) => point.x)
                    .y0(innerHeight)
                    .y1((point) => point.y)
                    .curve(curveMonotoneX)(points);

                if (fill) fills.push({ seriesKey: entry.key, seriesIndex, d: fill });
            }
        });
    } else if (stacked) {
        const barWidth = Math.min(band, MAX_BAR_SIZE);

        data.forEach((datum, index) => {
            const x = centres[index] - barWidth / 2;
            let cumulative = 0;

            series.forEach((entry, seriesIndex) => {
                const value = readNumber(datum, entry.key);
                if (value <= 0) {
                    cumulative += value;
                    return;
                }

                const top = yScale(cumulative + value);
                const bottom = yScale(cumulative);
                const isTop = seriesIndex === series.length - 1;

                /* Each non-top segment gives up 2px at its head, so touching fills read
           as air rather than as a border. Only the true top of the stack keeps
           the rounded data-end. */
                const inset = isTop ? 0 : SURFACE_GAP;
                const segmentHeight = Math.max(0, bottom - top - inset);

                const d = roundedTopRect(
                    x,
                    top + inset,
                    barWidth,
                    segmentHeight,
                    isTop ? BAR_CORNER_RADIUS : 0
                );
                if (d) fills.push({ seriesKey: entry.key, seriesIndex, d });

                cumulative += value;
            });
        });
    } else {
        /* Grouped bars: split the band between the series, 2px of air between
       neighbours, and never wider than the mark spec allows. */
        const slot = Math.min(band / series.length, MAX_BAR_SIZE);
        const groupWidth = slot * series.length;
        const barWidth = Math.max(1, slot - (series.length > 1 ? SURFACE_GAP : 0));

        data.forEach((datum, index) => {
            const start = centres[index] - groupWidth / 2;

            series.forEach((entry, seriesIndex) => {
                const value = readNumber(datum, entry.key);
                if (value <= 0) return;

                const top = yScale(value);
                const d = roundedTopRect(
                    start + seriesIndex * slot + (slot - barWidth) / 2,
                    top,
                    barWidth,
                    Math.max(0, innerHeight - top),
                    BAR_CORNER_RADIUS
                );
                if (d) fills.push({ seriesKey: entry.key, seriesIndex, d });
            });
        });
    }

    /* `value` is the band key, not the label — visx feeds it straight back as a
     `tickValues` entry, and `stripBandKey` recovers the label for display. */
    const xTicks = thinTicks(categories.length, innerWidth).map((index) => ({
        offset: centres[index],
        value: `${index}:${categories[index]}`,
    }));

    const yTicks = yScale.ticks(Y_TICK_COUNT).map((value) => ({
        offset: yScale(value),
        value: String(value),
    }));

    return {
        innerWidth,
        innerHeight,
        margin: MARGIN,
        fills,
        strokes,
        xTicks,
        yTicks,
        centres,
        step: band,
        xScale,
        yScale,
    };
}
