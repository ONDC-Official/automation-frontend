import Table, {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@pages/business-dashboard/components/Table";
import type { ChartDatum, ISeries } from "./types";

interface IProps {
    data: readonly ChartDatum[];
    series: ISeries[];
    xKey: string;
    xLabel: string;
    xFormatter: (value: string) => string;
    valueFormatter: (value: number) => string;
}

/** Rows arrive as the caller's own domain type; reading a dynamic key needs this. */
const read = (datum: ChartDatum, key: string) => (datum as Record<string, unknown>)[key];

/**
 * The table view. Present on every panel, which is what discharges the dataviz
 * relief rule: the light-mode chart slots sit below 3:1 against the card
 * surface, so every value has to be readable another way.
 */
const ChartTable = ({ data, series, xKey, xLabel, xFormatter, valueFormatter }: IProps) => (
    <div className="border-border max-h-72 overflow-auto rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{xLabel}</TableHead>
                    {series.map((entry) => (
                        <TableHead key={entry.key} className="text-right">
                            {entry.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((datum, index) => (
                    <TableRow key={`${String(read(datum, xKey))}-${index}`}>
                        <TableCell className="font-medium">
                            {xFormatter(String(read(datum, xKey) ?? ""))}
                        </TableCell>
                        {series.map((entry) => {
                            const value = read(datum, entry.key);
                            return (
                                <TableCell key={entry.key} className="text-right">
                                    {typeof value === "number" ? valueFormatter(value) : "—"}
                                </TableCell>
                            );
                        })}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
);

export default ChartTable;
