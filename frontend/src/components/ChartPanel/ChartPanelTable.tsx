import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/Shadcn/Table/table";
import type { ChartDatum, ISeries } from "./types";

interface IProps<TDatum extends ChartDatum> {
    data: readonly TDatum[];
    series: ISeries[];
    xKey: string;
    xLabel: string;
    xFormatter: (value: string) => string;
    valueFormatter: (value: number) => string;
}

/**
 * The table behind every panel's toggle. Not a debug affordance: a chart that
 * cannot be read — by a screen reader, or by anyone who needs the actual
 * numbers — is only half a chart.
 */
const ChartPanelTable = <TDatum extends ChartDatum>({
    data,
    series,
    xKey,
    xLabel,
    xFormatter,
    valueFormatter,
}: IProps<TDatum>) => (
    <div className="max-h-72 overflow-y-auto">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{xLabel}</TableHead>
                    {series.map(({ key, label }) => (
                        <TableHead key={key} className="text-right">
                            {label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((datum, index) => {
                    const row = datum as Record<string, unknown>;
                    return (
                        <TableRow key={`${String(row[xKey])}:${index}`}>
                            <TableCell>{xFormatter(String(row[xKey] ?? ""))}</TableCell>
                            {series.map(({ key }) => (
                                <TableCell key={key} className="text-right">
                                    {valueFormatter(Number(row[key] ?? 0))}
                                </TableCell>
                            ))}
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    </div>
);

export default ChartPanelTable;
