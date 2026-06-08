import {
    RIDE_TIMELINE,
    RIDE_TIMELINE_LABEL,
    formatKm,
    formatMin,
    type RideDriver,
    type RideVehicle,
    type RideFare,
} from "@components/FlowShared/ride-map-utils";

const money = (fare?: RideFare): string | undefined => {
    if (!fare?.value) return undefined;
    const sym = fare.currency === "INR" || !fare.currency ? "₹" : `${fare.currency} `;
    return `${sym}${fare.value}`;
};

const initials = (name?: string): string =>
    (name || "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("") || "🚕";

const fmtTime = (iso?: string): string =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

/**
 * Status stepper: Assigned → Enroute → Arrived → Started → Ended → Completed.
 * Steps up to (and including) the current state are "done/active"; the rest are pending.
 * `times` holds the time each state was first observed (works for both seller & buyer).
 */
export function RideTimeline({
    currentState,
    times,
    cancelled,
}: {
    currentState?: string;
    times: Record<string, string>;
    cancelled?: boolean;
}) {
    const currentIdx = currentState
        ? RIDE_TIMELINE.indexOf(currentState as (typeof RIDE_TIMELINE)[number])
        : -1;

    return (
        <div className="w-full overflow-x-auto py-1">
            <div className="flex items-start min-w-max gap-0">
                {RIDE_TIMELINE.map((state, i) => {
                    const done = currentIdx >= 0 && i < currentIdx;
                    const active = i === currentIdx;
                    const dotColor = active
                        ? "bg-sky-600 ring-4 ring-sky-100"
                        : done
                          ? "bg-sky-500"
                          : "bg-gray-300";
                    const lineColor = i < currentIdx ? "bg-sky-500" : "bg-gray-200";
                    return (
                        <div key={state} className="flex items-start">
                            {i > 0 && <div className={`h-0.5 w-8 mt-2 ${lineColor}`} />}
                            <div className="flex flex-col items-center w-16">
                                <div className={`w-3.5 h-3.5 rounded-full ${dotColor}`} />
                                <span
                                    className={`mt-1 text-[11px] leading-tight text-center ${
                                        active
                                            ? "font-semibold text-sky-700"
                                            : done
                                              ? "text-gray-600"
                                              : "text-gray-400"
                                    }`}
                                >
                                    {RIDE_TIMELINE_LABEL[state]}
                                </span>
                                <span className="text-[10px] text-gray-400 h-3">
                                    {fmtTime(times[state])}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            {cancelled && (
                <div className="mt-1 text-xs font-semibold text-red-600">Ride cancelled</div>
            )}
        </div>
    );
}

/**
 * Live ETA / distance / progress panel. Shows the remaining distance & time to the current
 * target (pickup while enroute, destination while started) plus a progress bar.
 */
export function RideInfoPanel({
    targetLabel,
    totalDistanceM,
    totalDurationS,
    progress,
}: {
    targetLabel: string;
    totalDistanceM?: number;
    totalDurationS?: number;
    progress: number; // 0..1 along the current route
}) {
    const remainFrac = Math.max(0, Math.min(1, 1 - progress));
    const remainDist = totalDistanceM != null ? totalDistanceM * remainFrac : undefined;
    const remainDur = totalDurationS != null ? totalDurationS * remainFrac : undefined;
    const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);

    return (
        <div className="rounded-md border border-sky-200 bg-sky-50/60 px-3 py-2">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 text-sky-800">
                    {remainDur != null && (
                        <span className="font-semibold">⏱ {formatMin(remainDur)}</span>
                    )}
                    {remainDist != null && <span>📍 {formatKm(remainDist)}</span>}
                    <span className="text-gray-500">{targetLabel}</span>
                </div>
                <span className="text-xs text-gray-500">{pct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-sky-100 overflow-hidden">
                <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

/** ②/⑤ Compact driver + vehicle + fare card shown above the map during the ride. */
export function RideInfoCard({
    driver,
    vehicle,
    fare,
}: {
    driver?: RideDriver;
    vehicle?: RideVehicle;
    fare?: RideFare;
}) {
    if (!driver && !vehicle && !fare) return null;
    const veh = [vehicle?.make, vehicle?.model].filter(Boolean).join(" ");
    const cost = money(fare);
    return (
        <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
                {initials(driver?.name)}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <span className="truncate">{driver?.name || "Driver"}</span>
                    {driver?.rating && (
                        <span className="text-xs font-normal text-amber-600">
                            ⭐ {driver.rating}
                        </span>
                    )}
                </div>
                <div className="truncate text-xs text-gray-500">
                    {[vehicle?.registration, veh, vehicle?.category].filter(Boolean).join(" · ") ||
                        "Vehicle details pending"}
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
                {cost && (
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-sm font-semibold text-emerald-700">
                        {cost}
                    </span>
                )}
                {driver?.phone && (
                    <a
                        href={`tel:${driver.phone}`}
                        title={driver.phone}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100"
                    >
                        📞
                    </a>
                )}
            </div>
        </div>
    );
}

/**
 * Read-only status panel for non-active outcomes derived from order.status + ride state:
 * driver not found, ride cancelled, cancellation in progress, or driver not assigned yet.
 * No map, no controls.
 */
export function RideStatusPanel({
    kind,
    title,
    detail,
}: {
    kind: string;
    title: string;
    detail?: string;
}) {
    const failure = kind === "DRIVER_NOT_FOUND" || kind === "CANCELLED";
    const warn = kind === "CANCELLING";
    const icon = failure ? "🚫" : warn ? "⚠️" : kind === "AWAITING_DRIVER" ? "⏳" : "ℹ️";
    const tone = failure
        ? { border: "border-red-200", bg: "bg-red-50", text: "text-red-700" }
        : warn
          ? { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700" }
          : { border: "border-sky-200", bg: "bg-sky-50", text: "text-sky-700" };
    return (
        <div className="p-4">
            <div
                className={`flex flex-col items-center gap-2 rounded-lg border ${tone.border} ${tone.bg} px-4 py-10 text-center`}
            >
                <span className="text-3xl" aria-hidden>
                    {icon}
                </span>
                <h3 className={`text-base font-semibold ${tone.text}`}>{title}</h3>
                {detail && <p className="max-w-xs text-sm text-gray-600">{detail}</p>}
            </div>
        </div>
    );
}

/** ⑥ Trip summary shown when the ride is completed/cancelled. */
export function CompletionSummary({
    cancelled,
    driver,
    vehicle,
    fare,
    distanceM,
    durationS,
}: {
    cancelled?: boolean;
    driver?: RideDriver;
    vehicle?: RideVehicle;
    fare?: RideFare;
    distanceM?: number;
    durationS?: number;
}) {
    const cost = money(fare);
    const veh = [vehicle?.make, vehicle?.model].filter(Boolean).join(" ");
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">{cancelled ? "🚫" : "✅"}</span>
                <h3
                    className={`text-base font-semibold ${cancelled ? "text-red-700" : "text-emerald-700"}`}
                >
                    {cancelled ? "Ride Cancelled" : "Ride Completed"}
                </h3>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {cost && (
                    <>
                        <dt className="text-gray-500">Fare {cancelled ? "" : "(settled)"}</dt>
                        <dd className="text-right font-semibold text-gray-800">{cost}</dd>
                    </>
                )}
                {distanceM != null && (
                    <>
                        <dt className="text-gray-500">Distance</dt>
                        <dd className="text-right text-gray-800">{formatKm(distanceM)}</dd>
                    </>
                )}
                {durationS != null && (
                    <>
                        <dt className="text-gray-500">Duration</dt>
                        <dd className="text-right text-gray-800">{formatMin(durationS)}</dd>
                    </>
                )}
                {driver?.name && (
                    <>
                        <dt className="text-gray-500">Driver</dt>
                        <dd className="truncate text-right text-gray-800">
                            {driver.name}
                            {vehicle?.registration ? ` · ${vehicle.registration}` : ""}
                        </dd>
                    </>
                )}
                {veh && (
                    <>
                        <dt className="text-gray-500">Vehicle</dt>
                        <dd className="text-right text-gray-800">{veh}</dd>
                    </>
                )}
                {!cancelled && (
                    <>
                        <dt className="text-gray-500">Order status</dt>
                        <dd className="text-right font-medium text-emerald-700">COMPLETE</dd>
                    </>
                )}
            </dl>
        </div>
    );
}
