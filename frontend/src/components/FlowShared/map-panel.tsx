import { useEffect, useMemo, useRef, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMap,
    useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getRoute } from "@utils/request-utils";
import {
    bearing,
    parseGps,
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

export interface MapPanelProps {
    pickupGps?: string;
    dropGps?: string;
    driverGps?: string;
    phaseLabel?: string;
    interactive: boolean;
    onDriverMove?: (gps: string) => void;
    onReset?: () => void;
    locked?: boolean;
    /** The current ride state (highlights the matching button). */
    currentState?: string;
    /** Fired when the controller clicks a ride-state button (passes the RIDE_* code). */
    onRideState?: (state: string) => void;
}

const pinIcon = (color: string, glyph: string) =>
    L.divIcon({
        className: "ride-map-marker",
        html: `<div style="background:${color};width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:12px;line-height:1;">${glyph}</span></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 26],
        popupAnchor: [0, -26],
    });

/** Directional driver arrow, rotated to `heading` degrees (0 = North, clockwise). */
const driverArrowIcon = (heading: number) =>
    L.divIcon({
        className: "ride-map-driver",
        html: `<div style="transform:rotate(${heading}deg);width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
            <svg width="34" height="34" viewBox="0 0 24 24" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.5));">
              <circle cx="12" cy="12" r="11" fill="#fff"/>
              <path d="M12 2 L19 21 L12 16 L5 21 Z" fill="#2563eb"/>
            </svg>
        </div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -17],
    });

const PICKUP_ICON = pinIcon("#16a34a", "P");
const DROP_ICON = pinIcon("#dc2626", "D");

/** Lets the seller click the map to PLACE the driver when none exists yet. */
function PlaceDriverOnClick({ enabled, onPlace }: { enabled: boolean; onPlace: (gps: string) => void }) {
    useMapEvents({
        click(e) {
            if (enabled) onPlace(`${e.latlng.lat}, ${e.latlng.lng}`);
        },
    });
    return null;
}

/** Pans/zooms to fit the points ONCE on first mount — never re-centers on updates. */
function FitOnce({ points }: { points: LatLng[] }) {
    const map = useMap();
    const done = useRef(false);
    useEffect(() => {
        if (done.current || points.length === 0) return;
        done.current = true;
        if (points.length === 1) map.setView(points[0], 14);
        else map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }, [map, points]);
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
    currentState,
    onRideState,
}: MapPanelProps) {
    const pickup = useMemo(() => parseGps(pickupGps), [pickupGps]);
    const drop = useMemo(() => parseGps(dropGps), [dropGps]);
    const driver = useMemo(() => parseGps(driverGps), [driverGps]);

    const [route, setRoute] = useState<LatLng[]>([]);

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

    // Road-following route between pickup and drop (static for the ride).
    useEffect(() => {
        let cancelled = false;
        if (!pickup || !drop) {
            setRoute([]);
            return;
        }
        getRoute(toGpsString(pickup), toGpsString(drop)).then((res) => {
            if (cancelled) return;
            setRoute(res?.geometry?.length ? res.geometry : [pickup, drop]);
        });
        return () => {
            cancelled = true;
        };
    }, [pickupGps, dropGps]);

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
                className="rounded-md overflow-hidden border border-gray-200"
                style={{ height: 360 }}
            >
                <MapContainer
                    center={initialCenter}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <FitOnce points={fitPoints} />
                    <PlaceDriverOnClick
                        enabled={canDrag && !driver}
                        onPlace={(gps) => onDriverMove?.(gps)}
                    />

                    {route.length > 0 && (
                        <Polyline
                            positions={route}
                            pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.7 }}
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
