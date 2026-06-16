import { useEffect, useMemo, useRef, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    Polygon,
    useMap,
    useMapEvents,
} from "react-leaflet";
import { INDIA_RINGS } from "@components/FlowShared/india-boundary";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getRoute } from "@utils/request-utils";
import {
    bearing,
    parseGps,
    splitPathAt,
    RIDE_STATE_ORDER,
    RIDE_STATE_BUTTON_LABEL,
    RIDE_CANCEL_STATE,
    type LatLng,
} from "@components/FlowShared/ride-map-utils";

/**
 * Real-Time Ride Map Integration — map panel.
 *
 * Role-aware: the seller (BPP) gets a draggable driver arrow, ride-state controls and a reset;
 * the buyer (BAP) sees a read-only view. The map instance is created once; only the driver
 * marker, route polyline and phase label update as data arrives (no reload — Problem 10).
 *
 * Coordinates are TRV10 "lat, lng" strings.
 */

const toGpsString = (ll: LatLng): string => `${ll[0]}, ${ll[1]}`;

// Restrict the map to India (SW + NE corners, with a small margin) so it never shows the
// whole repeating world. Panning is locked to this box and you can't zoom out past it.
const INDIA_BOUNDS = L.latLngBounds([6.0, 67.0], [37.6, 98.0]);

// World rectangle (lat,lng) used as the OUTER ring of the mask; the India rings are the holes,
// so everything outside India's border is filled solid and only India shows.
const WORLD_RING: [number, number][] = [
    [-89, -179],
    [89, -179],
    [89, 179],
    [-89, 179],
];

/** Solid-grey mask covering everything outside India's border (India rings = holes). */
function IndiaMask() {
    return (
        <Polygon
            positions={[WORLD_RING, ...INDIA_RINGS]}
            pathOptions={{ stroke: false, fillColor: "#e5e7eb", fillOpacity: 1 }}
            interactive={false}
        />
    );
}

export interface MapPanelProps {
    pickupGps?: string;
    dropGps?: string;
    driverGps?: string;
    phaseLabel?: string;
    interactive: boolean;
    onDriverMove?: (gps: string) => void;
    onReset?: () => void;
    locked?: boolean;
    /** Route geometry [lat,lng][] supplied by the parent (so the same path drives animation + ETA).
     *  When omitted, the panel fetches pickup→drop itself. */
    route?: LatLng[];
    /** The full pickup→destination trip path, drawn as a persistent blue base so the trip route
     *  stays visible even while the active segment is driver→pickup (enroute). */
    tripRoute?: LatLng[];
    /** Fraction (0..1) of the route covered — splits the polyline into covered/remaining. */
    progress?: number;
    /** The current ride state (highlights the matching button). */
    currentState?: string;
    /** Fired when the controller clicks a ride-state button (passes the RIDE_* code). */
    onRideState?: (state: string) => void;
    /** Changes when the pickup/drop change — re-fits the map to the fresh locations. */
    fitKey?: string;
}

const pinIcon = (color: string, glyph: string) =>
    L.divIcon({
        className: "ride-map-marker",
        html: `<div style="background:${color};width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:12px;line-height:1;">${glyph}</span></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 26],
        popupAnchor: [0, -26],
    });

/** Top-down car marker, rotated to `heading` degrees (0 = North, clockwise). */
const driverArrowIcon = (heading: number) =>
    L.divIcon({
        className: "ride-map-driver",
        html: `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45));">
            <svg width="34" height="34" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="11.5" fill="#fff"/>
              <g transform="rotate(${heading} 12 12)">
                <rect x="8" y="4.5" width="8" height="15" rx="3" fill="#2563eb"/>
                <rect x="9.2" y="6" width="5.6" height="3.6" rx="1" fill="#bfdbfe"/>
                <rect x="9.2" y="14.6" width="5.6" height="2.6" rx="1" fill="#1e40af"/>
              </g>
            </svg>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
    });

const PICKUP_ICON = pinIcon("#16a34a", "P");
const DROP_ICON = pinIcon("#dc2626", "D");

/** Small inline swatches that mirror the real map markers, for the legend. */
const LegendPin = ({ color, glyph }: { color: string; glyph: string }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2C7.6 2 4 5.6 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.4-3.6-8-8-8z" fill={color} />
        <text x="12" y="13" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">
            {glyph}
        </text>
    </svg>
);
const LegendCar = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="11" fill="#fff" stroke="#e5e7eb" />
        <rect x="8" y="5" width="8" height="14" rx="3" fill="#2563eb" />
        <rect x="9.2" y="6.5" width="5.6" height="3.4" rx="1" fill="#bfdbfe" />
    </svg>
);

/** Legend describing the map markers + route, shown directly under the map. */
function MapLegend({ hasRoute }: { hasRoute: boolean }) {
    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
                <LegendPin color="#16a34a" glyph="P" /> Pickup
            </span>
            <span className="flex items-center gap-1.5">
                <LegendPin color="#dc2626" glyph="D" /> Destination
            </span>
            <span className="flex items-center gap-1.5">
                <LegendCar /> Driver
            </span>
            {hasRoute && (
                <>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-1 w-5 rounded-full bg-[#2563eb]" />{" "}
                        Remaining route
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-1 w-5 rounded-full bg-[#94a3b8]" /> Covered
                        route
                    </span>
                </>
            )}
        </div>
    );
}

/** Lets the seller click the map to PLACE the driver when none exists yet. */
function PlaceDriverOnClick({
    enabled,
    onPlace,
}: {
    enabled: boolean;
    onPlace: (gps: string) => void;
}) {
    useMapEvents({
        click(e) {
            if (enabled) onPlace(`${e.latlng.lat}, ${e.latlng.lng}`);
        },
    });
    return null;
}

/** Pans/zooms to fit the points — once per `fitKey` (i.e. re-fits when pickup/drop change), but
 *  never on every driver-position update. */
function FitOnce({ points, fitKey }: { points: LatLng[]; fitKey?: string }) {
    const map = useMap();
    const lastKey = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (points.length === 0 || lastKey.current === fitKey) return;
        lastKey.current = fitKey;
        if (points.length === 1) map.setView(points[0], 14);
        else map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }, [map, points, fitKey]);
    return null;
}

export default function MapPanel({
    pickupGps,
    dropGps,
    driverGps,
    phaseLabel,
    interactive,
    onDriverMove,
    onReset,
    route: routeProp,
    tripRoute,
    progress = 0,
    currentState,
    onRideState,
    fitKey,
}: MapPanelProps) {
    const pickup = useMemo(() => parseGps(pickupGps), [pickupGps]);
    const drop = useMemo(() => parseGps(dropGps), [dropGps]);
    const driver = useMemo(() => parseGps(driverGps), [driverGps]);

    const [fetchedRoute, setFetchedRoute] = useState<LatLng[]>([]);
    // Parent-supplied route wins (keeps animation/ETA/render on the same geometry).
    const route = routeProp?.length ? routeProp : fetchedRoute;
    const [covered, remaining] = useMemo(
        () => (route.length > 1 ? splitPathAt(route, progress) : [[], route]),
        [route, progress]
    );

    // Track previous driver position to derive heading for the arrow.
    const prevDriverRef = useRef<LatLng | null>(null);
    const [heading, setHeading] = useState(0);
    useEffect(() => {
        if (!driver) return;
        const prev = prevDriverRef.current;
        if (prev && (prev[0] !== driver[0] || prev[1] !== driver[1])) {
            setHeading(bearing(prev, driver));
        } else if (!prev && drop) {
            // Stationary: point toward the destination so the arrow isn't arbitrary.
            setHeading(bearing(driver, drop));
        }
        prevDriverRef.current = driver;
    }, [driver, drop]);

    // Road-following route between pickup and drop (only when the parent doesn't supply one).
    useEffect(() => {
        if (routeProp?.length) return;
        let cancelled = false;
        if (!pickup || !drop) {
            setFetchedRoute([]);
            return;
        }
        getRoute(toGpsString(pickup), toGpsString(drop)).then((res) => {
            if (cancelled) return;
            setFetchedRoute(res?.geometry?.length ? res.geometry : [pickup, drop]);
        });
        return () => {
            cancelled = true;
        };
    }, [pickupGps, dropGps, routeProp]);

    const fitPoints = useMemo(
        () => [pickup, drop, driver].filter((p): p is LatLng => Boolean(p)),
        [pickup, drop, driver]
    );
    const initialCenter: LatLng = pickup ?? driver ?? drop ?? [28.6139, 77.209];
    // The seller can always reposition the driver / change state — independent of the derived
    // "locked" state (which only affects the help text). Avoids a mis-derived state disabling
    // all manual control.
    const canDrag = interactive;
    // Rebuild the arrow icon only when the heading actually changes, so the marker stays stable
    // during a drag (recreating the icon every render breaks dragging).
    const driverIcon = useMemo(() => driverArrowIcon(Math.round(heading)), [heading]);

    const mapRef = useRef<L.Map | null>(null);
    const recenter = () => {
        if (!mapRef.current || fitPoints.length === 0) return;
        if (fitPoints.length === 1) mapRef.current.setView(fitPoints[0], 14);
        else mapRef.current.fitBounds(L.latLngBounds(fitPoints), { padding: [40, 40] });
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-5 bg-sky-600 rounded-full" />
                    <h3 className="text-sm font-semibold text-sky-700">Ride Map</h3>
                    {phaseLabel && (
                        <span className="rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-xs font-medium text-sky-700">
                            {phaseLabel}
                        </span>
                    )}
                </div>
                {interactive && onReset && (
                    <button
                        type="button"
                        onClick={onReset}
                        className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                        Reset Tracking
                    </button>
                )}
            </div>

            {/* Controller ride-state buttons — each click sends an unsolicited on_status. */}
            {interactive && (
                <div className="flex flex-wrap gap-2">
                    {RIDE_STATE_ORDER.map((state) => {
                        const active = state === currentState;
                        return (
                            <button
                                key={state}
                                type="button"
                                onClick={() => onRideState?.(state)}
                                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                    active
                                        ? "border-sky-500 bg-sky-100 text-sky-800 font-semibold"
                                        : "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100"
                                }`}
                            >
                                {RIDE_STATE_BUTTON_LABEL[state]}
                            </button>
                        );
                    })}
                    {/* Terminal cancel branch — distinct red styling. */}
                    <button
                        type="button"
                        onClick={() => onRideState?.(RIDE_CANCEL_STATE)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            currentState === RIDE_CANCEL_STATE
                                ? "border-red-500 bg-red-100 text-red-800 font-semibold"
                                : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                        }`}
                    >
                        {RIDE_STATE_BUTTON_LABEL[RIDE_CANCEL_STATE]}
                    </button>
                </div>
            )}

            <div
                className="relative rounded-md overflow-hidden border border-gray-200"
                style={{ height: 360 }}
            >
                <button
                    type="button"
                    onClick={recenter}
                    title="Recenter / fit"
                    className="absolute bottom-3 left-3 z-[500] flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 shadow hover:bg-gray-50"
                >
                    ⊕
                </button>
                <MapContainer
                    ref={mapRef}
                    center={initialCenter}
                    zoom={13}
                    minZoom={4}
                    maxBounds={INDIA_BOUNDS}
                    maxBoundsViscosity={1.0}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        noWrap
                        bounds={INDIA_BOUNDS}
                    />
                    {/* Hide everything outside India's border (grey mask; India = holes). */}
                    <IndiaMask />
                    <FitOnce points={fitPoints} fitKey={fitKey} />
                    <PlaceDriverOnClick
                        enabled={canDrag && !driver}
                        onPlace={(gps) => onDriverMove?.(gps)}
                    />

                    {/* Persistent pickup→destination trip path (blue base) — stays visible while the
                        active segment is driver→pickup during enroute. */}
                    {tripRoute && tripRoute.length > 1 && (
                        <Polyline
                            positions={tripRoute}
                            pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.85 }}
                        />
                    )}

                    {/* Two-tone route: covered (dim) + remaining (bright). */}
                    {remaining.length > 1 && (
                        <Polyline
                            positions={remaining}
                            pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.85 }}
                        />
                    )}
                    {covered.length > 1 && (
                        <Polyline
                            positions={covered}
                            pathOptions={{ color: "#94a3b8", weight: 5, opacity: 0.6 }}
                        />
                    )}

                    {pickup && (
                        <Marker position={pickup} icon={PICKUP_ICON}>
                            <Popup>Pickup</Popup>
                        </Marker>
                    )}
                    {drop && (
                        <Marker position={drop} icon={DROP_ICON}>
                            <Popup>Drop</Popup>
                        </Marker>
                    )}
                    {driver && (
                        <Marker
                            position={driver}
                            icon={driverIcon}
                            draggable={canDrag}
                            eventHandlers={
                                canDrag
                                    ? {
                                          dragend: (e) => {
                                              const m = e.target as L.Marker;
                                              const { lat, lng } = m.getLatLng();
                                              onDriverMove?.(`${lat}, ${lng}`);
                                          },
                                      }
                                    : undefined
                            }
                        >
                            <Popup>Driver{canDrag ? " (drag to move)" : ""}</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>

            {/* Legend describing the map markers + route. */}
            <MapLegend hasRoute={route.length > 1 || (tripRoute?.length ?? 0) > 1} />

            {interactive && !driver && (
                <p className="text-xs text-amber-600">
                    Click anywhere on the map to place the driver, then drag it to move.
                </p>
            )}
            {interactive && driver && (
                <p className="text-xs text-gray-500">
                    Drag the driver arrow to update the rider&rsquo;s location (sent via on_track).
                    Reaching the pickup or drop auto-advances the ride state.
                </p>
            )}
        </div>
    );
}
