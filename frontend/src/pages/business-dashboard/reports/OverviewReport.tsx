import { Document, Page, Text, View } from "@react-pdf/renderer";

import { read } from "@pages/business-dashboard/components/Chart/geometry";
import { printColorForSeries } from "@pages/business-dashboard/components/Chart/utils";
import type { ChartDatum, ChartType, ISeries } from "@pages/business-dashboard/components/Chart";
import {
    formatCompact,
    formatDateTime,
    formatDay,
    formatNumber,
    formatPercent,
} from "@pages/business-dashboard/lib/utils";
import type { SessionStatsResponse } from "@pages/business-dashboard/services/types";
import { DOMAIN_SERIES, TREND_SERIES } from "@pages/business-dashboard/pages/overview/constants";
import ReportChart from "./ReportChart";
import { CHART_HEIGHT, CONTENT_WIDTH, styles } from "./styles";
import { describeRange, type IReportRange } from "./utils";

export interface IReportInput {
    range: IReportRange;
    totals?: SessionStatsResponse["totals"];
    trend: SessionStatsResponse["byDay"];
    domains: Array<{ domain: string; sessions: number }>;
    /** Passed in rather than read from the clock here, so the document is pure. */
    generatedAt: string;
}

const Legend = ({ series }: { series: ISeries[] }) => {
    if (series.length < 2) return null;

    return (
        <View style={styles.legendRow}>
            {series.map((entry, index) => (
                <View key={entry.key} style={styles.legendItem}>
                    <View
                        style={[
                            styles.legendSwatch,
                            { backgroundColor: printColorForSeries(entry, index) },
                        ]}
                    />
                    <Text style={styles.legendLabel}>{entry.label}</Text>
                </View>
            ))}
        </View>
    );
};

/**
 * The printed table under each chart. This is the dataviz relief rule following
 * the data onto paper: on screen the reader can toggle a table when a fill sits
 * below 3:1 against the surface, and a PDF has no toggle — so the numbers are
 * simply always there.
 */
const ReportTable = ({
    data,
    series,
    xKey,
    xLabel,
    xFormatter,
    valueFormatter,
}: {
    data: readonly ChartDatum[];
    series: ISeries[];
    xKey: string;
    xLabel: string;
    xFormatter: (value: string) => string;
    valueFormatter: (value: number) => string;
}) => (
    <View>
        <View style={styles.tableHeaderRow} fixed>
            <Text style={[styles.tableHeadCell, { flex: 2 }]}>{xLabel}</Text>
            {series.map((entry) => (
                <Text
                    key={entry.key}
                    style={[styles.tableHeadCell, { flex: 1, textAlign: "right" }]}
                >
                    {entry.label}
                </Text>
            ))}
        </View>

        {data.map((datum, index) => (
            <View
                key={`${String(read(datum, xKey))}-${index}`}
                style={styles.tableRow}
                wrap={false}
            >
                <Text style={[styles.tableCell, { flex: 2 }]}>
                    {xFormatter(String(read(datum, xKey) ?? ""))}
                </Text>
                {series.map((entry) => {
                    const value = read(datum, entry.key);
                    return (
                        <Text
                            key={entry.key}
                            style={[styles.tableCell, { flex: 1, textAlign: "right" }]}
                        >
                            {typeof value === "number" ? valueFormatter(value) : "—"}
                        </Text>
                    );
                })}
            </View>
        ))}
    </View>
);

const Panel = ({
    title,
    description,
    data,
    series,
    type,
    xKey,
    xFormatter = (value) => value,
}: {
    title: string;
    description: string;
    data: readonly ChartDatum[];
    series: ISeries[];
    type: ChartType;
    xKey: string;
    xFormatter?: (value: string) => string;
}) => (
    <View style={styles.panel}>
        <View wrap={false}>
            <Text style={styles.panelTitle}>{title}</Text>
            <Text style={styles.panelDescription}>{description}</Text>
            <Legend series={series} />
            <ReportChart
                data={data}
                series={series}
                type={type}
                xKey={xKey}
                xFormatter={xFormatter}
                yFormatter={formatNumber}
                width={CONTENT_WIDTH}
                height={CHART_HEIGHT}
            />
        </View>

        <ReportTable
            data={data}
            series={series}
            xKey={xKey}
            xLabel={title}
            xFormatter={xFormatter}
            valueFormatter={formatNumber}
        />
    </View>
);

const Kpi = ({ label, value, hint }: { label: string; value: string; hint: string }) => (
    <View style={styles.kpiTile}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <Text style={styles.kpiValue}>{value}</Text>
        <Text style={styles.kpiHint}>{hint}</Text>
    </View>
);

/**
 * The Overview page as a document. Everything it plots comes from the same
 * geometry core the screen uses, so this is a faithful print of what the reader
 * was looking at — not a second implementation that happens to look similar.
 */
const OverviewReport = ({ range, totals, trend, domains, generatedAt }: IReportInput) => (
    <Document
        title={`Automation overview — ${describeRange(range)}`}
        author="Workbench Business Dashboard"
    >
        <Page size="A4" style={styles.page}>
            <View style={styles.headerRow} fixed>
                <View>
                    <Text style={styles.title}>Automation overview</Text>
                    <Text style={styles.subtitle}>{describeRange(range)}</Text>
                </View>
                <Text style={styles.subtitle}>Generated {formatDateTime(generatedAt)}</Text>
            </View>

            <View style={styles.kpiRow}>
                <Kpi
                    label="Sessions"
                    value={formatCompact(totals?.sessions)}
                    hint="In the selected window"
                />
                <Kpi
                    label="Flow pass rate"
                    value={formatPercent(totals?.passRate)}
                    hint={`${formatCompact(totals?.flowsPassed)} of ${formatCompact(totals?.flowsTotal)} flows`}
                />
                <Kpi
                    label="Flows failed"
                    value={formatCompact(totals?.flowsFailed)}
                    hint="Across all sessions in range"
                />
                <Kpi
                    label="Reports generated"
                    value={formatCompact(totals?.withReports)}
                    hint={`of ${formatCompact(totals?.sessions)} sessions`}
                />
            </View>

            <Panel
                title="Flow outcomes per day"
                description="Passed and failed flows, stacked by the day the session was created."
                type="stacked-bar"
                xKey="date"
                data={trend}
                series={TREND_SERIES}
                xFormatter={formatDay}
            />

            <Panel
                title="Sessions by domain"
                description={`The ${domains.length} busiest domains in the selected window.`}
                type="bar"
                xKey="domain"
                data={domains}
                series={DOMAIN_SERIES}
            />

            <View style={styles.footer} fixed>
                <Text>Workbench Business Dashboard</Text>
                <Text
                    render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                />
            </View>
        </Page>
    </Document>
);

export default OverviewReport;
