import type { ReactNode } from "react";

export type ChartType = "line" | "area" | "bar" | "stacked-bar";

/**
 * Only pass and fail. As a pair they clear every dataviz gate in both modes
 * (CVD ΔE 9.0 light / 10.5 dark); adding amber pushes the all-pairs check below
 * the floor. A third status meaning belongs on a Badge, where the label carries
 * it — not on a chart mark.
 */
export type ChartTone = "pass" | "fail";

/**
 * A chart row. Deliberately just "an object": panels feed their own domain
 * types straight in, and an `interface` from `services/types.ts` gets no
 * implicit index signature, so a `Record<string, …>` here would force every
 * caller to launder its types. `xKey`/`series[].key` index into it.
 */
export type ChartDatum = object;

export interface ISeries {
    /** key into each datum */
    key: string;
    /** legend and tooltip label */
    label: string;
    /**
     * Reserved status colour, for a series that *means* good/bad (passed /
     * failed). Omit it and the series takes the next categorical slot instead —
     * never both in one chart.
     */
    tone?: ChartTone;
}

export interface IProps<TDatum extends ChartDatum = ChartDatum> {
    title: string;
    description?: string;
    data: readonly TDatum[];
    series: ISeries[];
    type: ChartType;
    /** key holding the category / time value on the x axis */
    xKey: string;
    xFormatter?: (value: string) => string;
    yFormatter?: (value: number) => string;
    /** formats values inside the tooltip and the table view; defaults to yFormatter */
    valueFormatter?: (value: number) => string;
    height?: number;
    isLoading?: boolean;
    isError?: boolean;
    /** message rendered in place of the plot when the query failed */
    error?: string;
    emptyMessage?: string;
    /** extra controls in the panel header, left of the table toggle */
    actions?: ReactNode;
    className?: string;
}
