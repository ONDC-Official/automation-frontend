import { colorForSeries } from "./utils";
import type { ISeries } from "./types";

interface IProps {
    series: ISeries[];
}

/**
 * Always present for two or more series — identity is never carried by colour
 * alone. A single series gets no legend box: the panel title already names it.
 * Legend text wears the muted text token; the swatch beside it carries the hue.
 */
const ChartLegend = ({ series }: IProps) => {
    if (series.length < 2) return null;

    return (
        <ul data-slot="chart-legend" className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {series.map((entry, index) => (
                <li
                    key={entry.key}
                    className="text-muted-foreground flex items-center gap-1.5 text-xs"
                >
                    <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: colorForSeries(entry, index) }}
                    />
                    {entry.label}
                </li>
            ))}
        </ul>
    );
};

export default ChartLegend;
