import { colorForSeries } from "./utils";
import type { ISeries } from "./types";

interface IProps {
    active: boolean;
    label?: string | number;
    /** series keys carrying a numeric value at the hovered index */
    activeKeys: string[];
    values: Record<string, number | undefined>;
    series: ISeries[];
    labelFormatter: (value: string) => string;
    valueFormatter: (value: number) => string;
}

/** The hover layer. Ships by default on every chart form — never opt-in. */
const ChartTooltip = ({
    active,
    label,
    activeKeys,
    values,
    series,
    labelFormatter,
    valueFormatter,
}: IProps) => {
    if (!active || activeKeys.length === 0) return null;

    return (
        <div className="border-border bg-popover rounded-md border px-2.5 py-2 text-xs shadow-md">
            <p className="text-foreground mb-1.5 font-medium">
                {labelFormatter(String(label ?? ""))}
            </p>
            <ul className="flex flex-col gap-1">
                {series.map((entry, index) => {
                    if (!activeKeys.includes(entry.key)) return null;
                    const value = values[entry.key];

                    return (
                        <li key={entry.key} className="flex items-center gap-2">
                            <span
                                aria-hidden="true"
                                className="size-2 shrink-0 rounded-full"
                                style={{ backgroundColor: colorForSeries(entry, index) }}
                            />
                            <span className="text-muted-foreground">{entry.label}</span>
                            <span className="text-foreground ml-auto pl-3 font-medium tabular-nums">
                                {value === undefined ? "—" : valueFormatter(value)}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default ChartTooltip;
