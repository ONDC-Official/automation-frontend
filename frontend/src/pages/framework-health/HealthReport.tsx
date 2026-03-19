import { FC, useEffect, useState } from "react";
import JsonView from "@uiw/react-json-view";
import { githubLightTheme } from "@uiw/react-json-view/githubLight";
import { HealthReportData, DomainResult, VersionResult } from "@hooks/useFrameworkHealth";

interface Props {
    report: HealthReportData;
    lastChecked: Date | null;
}

const StatusBadge: FC<{ status: number | null; healthy: boolean }> = ({ status, healthy }) => (
    <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
            healthy
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-red-100 text-red-700 border border-red-200"
        }`}
    >
        <span className={`w-1.5 h-1.5 rounded-full ${healthy ? "bg-emerald-500" : "bg-red-500"}`} />
        {status !== null ? status : "ERR"}
    </span>
);

const VersionDetail: FC<{ v: VersionResult }> = ({ v }) => {
    const parsedError: object | null = (() => {
        if (!v.error) return null;
        const jsonError: { error: string } = {
            error: v.error,
        };
        try {
            return JSON.parse(JSON.stringify(jsonError));
        } catch {
            return null;
        }
    })();

    return (
        <div
            className={`rounded-lg border p-3 space-y-2 ${
                v.healthy ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
            }`}
        >
            <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                    v{v.version}
                </code>
                <StatusBadge status={v.status} healthy={v.healthy} />
            </div>
            <div className="flex flex-wrap gap-1">
                {v.usecases.map((uc) => (
                    <span
                        key={uc}
                        className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full"
                    >
                        {uc}
                    </span>
                ))}
            </div>
            {v.error && (
                <div className="rounded-md overflow-hidden border border-red-200">
                    {parsedError ? (
                        <JsonView
                            value={parsedError}
                            style={{
                                ...githubLightTheme,
                                backgroundColor: "#fff1f2",
                                padding: "10px",
                                fontSize: "12px",
                            }}
                            shortenTextAfterLength={0}
                            collapsed={2}
                        />
                    ) : (
                        <pre className="text-xs text-red-700 bg-red-50 p-2 whitespace-pre-wrap break-all font-mono">
                            {v.error}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
};

/** Modal that shows full domain details */
const DomainModal: FC<{ domain: DomainResult; onClose: () => void }> = ({ domain, onClose }) => {
    const allHealthy = domain.versions.every((v) => v.healthy);
    const healthyCount = domain.versions.filter((v) => v.healthy).length;

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const labelCls = allHealthy
        ? "bg-emerald-100 text-emerald-700"
        : healthyCount === 0
          ? "bg-red-100 text-red-700"
          : "bg-yellow-100 text-yellow-700";

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Panel — stop propagation so clicking inside doesn't close */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl border border-sky-100 w-full max-w-2xl max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <span
                            className={`w-3 h-3 rounded-full shrink-0 ${
                                allHealthy
                                    ? "bg-emerald-500"
                                    : healthyCount === 0
                                      ? "bg-red-500"
                                      : "bg-yellow-500"
                            }`}
                        />
                        <span className="font-mono font-bold text-gray-800 text-base truncate">
                            {domain.domain}
                        </span>
                        <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${labelCls}`}
                        >
                            {allHealthy ? "All OK" : healthyCount === 0 ? "All Failed" : "Partial"}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">
                            {healthyCount}/{domain.versions.length} healthy
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto px-6 py-4 space-y-3">
                    {domain.versions.map((v) => (
                        <VersionDetail key={v.version} v={v} />
                    ))}
                </div>
            </div>
        </div>
    );
};

/** Compact grid box — click opens popup */
const DomainBox: FC<{ domain: DomainResult; onOpen: () => void }> = ({ domain, onOpen }) => {
    const allHealthy = domain.versions.every((v) => v.healthy);
    const healthyCount = domain.versions.filter((v) => v.healthy).length;
    const totalCount = domain.versions.length;

    const borderColor = allHealthy
        ? "border-emerald-300"
        : healthyCount === 0
          ? "border-red-300"
          : "border-yellow-300";

    const headerBg = allHealthy
        ? "bg-emerald-50 hover:bg-emerald-100"
        : healthyCount === 0
          ? "bg-red-50 hover:bg-red-100"
          : "bg-yellow-50 hover:bg-yellow-100";

    const dotColor = allHealthy
        ? "bg-emerald-500"
        : healthyCount === 0
          ? "bg-red-500"
          : "bg-yellow-500";

    const labelCls = allHealthy
        ? "bg-emerald-100 text-emerald-700"
        : healthyCount === 0
          ? "bg-red-100 text-red-700"
          : "bg-yellow-100 text-yellow-700";

    return (
        <button
            onClick={onOpen}
            className={`w-full text-left rounded-xl border-2 ${borderColor} bg-white shadow-sm ${headerBg} transition-all hover:shadow-md active:scale-[0.98] px-4 py-3`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${dotColor}`} />
                    <span className="font-mono font-semibold text-sm text-gray-800 break-all leading-tight">
                        {domain.domain}
                    </span>
                </div>
                {/* Expand icon */}
                <svg
                    className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                </svg>
            </div>

            <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${labelCls}`}>
                    {allHealthy ? "All OK" : healthyCount === 0 ? "All Failed" : "Partial"}
                </span>
                <span className="text-xs text-gray-500">
                    {healthyCount}/{totalCount} versions
                </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
                {domain.versions.map((v) => (
                    <span
                        key={v.version}
                        className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                            v.healthy
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                        }`}
                    >
                        v{v.version}
                    </span>
                ))}
            </div>
        </button>
    );
};

const HealthReport: FC<Props> = ({ report, lastChecked }) => {
    const { summary, results } = report;
    const healthPct = summary.totalChecked
        ? Math.round((summary.totalHealthy / summary.totalChecked) * 100)
        : 0;

    const [filter, setFilter] = useState<"all" | "healthy" | "unhealthy">("all");
    const [selected, setSelected] = useState<DomainResult | null>(null);

    const filtered = results.filter((d) => {
        if (filter === "healthy") return d.versions.every((v) => v.healthy);
        if (filter === "unhealthy") return d.versions.some((v) => !v.healthy);
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-sky-100 rounded-xl p-4 text-center shadow-sm">
                    <p className="text-2xl font-bold text-gray-800">{summary.totalChecked}</p>
                    <p className="text-xs text-gray-500 mt-1">Total Checked</p>
                </div>
                <div className="bg-white border border-emerald-200 rounded-xl p-4 text-center shadow-sm">
                    <p className="text-2xl font-bold text-emerald-600">{summary.totalHealthy}</p>
                    <p className="text-xs text-emerald-600 mt-1">Healthy</p>
                </div>
                <div className="bg-white border border-red-200 rounded-xl p-4 text-center shadow-sm">
                    <p className="text-2xl font-bold text-red-600">{summary.totalUnhealthy}</p>
                    <p className="text-xs text-red-500 mt-1">Unhealthy</p>
                </div>
                <div className="bg-white border border-sky-100 rounded-xl p-4 text-center shadow-sm">
                    <p
                        className={`text-2xl font-bold ${healthPct === 100 ? "text-emerald-600" : healthPct >= 50 ? "text-yellow-600" : "text-red-600"}`}
                    >
                        {healthPct}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Health Rate</p>
                </div>
            </div>

            {/* Filter + timestamp row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    {(["all", "healthy", "unhealthy"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors ${
                                filter === f
                                    ? "bg-sky-500 text-white"
                                    : "bg-white border border-sky-200 text-gray-600 hover:border-sky-400"
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                    <span className="text-xs text-gray-400 ml-1">{filtered.length} domains</span>
                </div>
                {lastChecked && (
                    <p className="text-xs text-gray-400">
                        Last checked: {lastChecked.toLocaleTimeString()}
                    </p>
                )}
            </div>

            {/* Domain grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((d) => (
                    <DomainBox key={d.domain} domain={d} onOpen={() => setSelected(d)} />
                ))}
            </div>

            {/* Detail modal */}
            {selected && <DomainModal domain={selected} onClose={() => setSelected(null)} />}
        </div>
    );
};

export default HealthReport;
