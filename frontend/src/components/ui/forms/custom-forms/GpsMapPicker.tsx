import { useState } from "react";
import { createPortal } from "react-dom";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { HiOutlineLocationMarker, HiSearch } from "react-icons/hi";
import type { WidgetProps } from "@rjsf/utils";
import { geocodePlace, type GeocodeResult } from "@utils/request-utils";

/**
 * Real-Time Ride Map Integration — single-location picker.
 *
 * Each GPS field (start / end) gets its own pin icon and its own picker. The user can search a
 * place (Nominatim, via backend proxy) or click/drag a single pin, then confirm to write
 * "lat, lng" back into that one field.
 */

type LatLng = [number, number];

const toGps = (ll: LatLng) => `${ll[0].toFixed(6)}, ${ll[1].toFixed(6)}`;

const parseGps = (s?: string): LatLng | null => {
    if (!s) return null;
    const [lat, lng] = s.split(",").map((p) => Number(p.trim()));
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
};

const PIN = L.divIcon({
    className: "gps-pick-marker",
    html: `<div style="background:#2563eb;width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
});

function ClickCapture({ onPick }: { onPick: (ll: LatLng) => void }) {
    useMapEvents({
        click(e) {
            onPick([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null;
}

/** Imperatively flies the map to a target when it changes (after a search selection). */
function FlyTo({ target }: { target: LatLng | null }) {
    const map = useMap();
    if (target) map.flyTo(target, 15);
    return null;
}

export function SingleLocationPickerModal({
    open,
    title,
    initial,
    onClose,
    onConfirm,
}: {
    open: boolean;
    title: string;
    initial?: string;
    onClose: () => void;
    onConfirm: (gps: string) => void;
}) {
    const initialPin = parseGps(initial);
    const [pin, setPin] = useState<LatLng | null>(initialPin);
    const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<GeocodeResult[]>([]);
    const [searching, setSearching] = useState(false);

    if (!open) return null;

    const runSearch = async () => {
        if (!query.trim()) return;
        setSearching(true);
        try {
            setResults(await geocodePlace(query.trim()));
        } finally {
            setSearching(false);
        }
    };

    const selectResult = (r: GeocodeResult) => {
        const ll: LatLng = [r.lat, r.lng];
        setPin(ll);
        setFlyTarget(ll);
        setResults([]);
        setQuery(r.name);
    };

    // Rendered into document.body so the fixed overlay isn't clipped by the parent input-form
    // Popup (a transformed/overflow-hidden ancestor would otherwise cut off the search box and
    // the footer buttons). max-h + scroll keeps it within the viewport on short screens.
    return createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-lg leading-none"
                    >
                        &times;
                    </button>
                </div>

                {/* Search box */}
                <div className="px-4 pt-3">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && (e.preventDefault(), runSearch())
                            }
                            placeholder="Search a place…"
                            className="w-full border border-gray-300 rounded px-3 py-2 pr-9 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                        <button
                            type="button"
                            onClick={runSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-sky-600"
                        >
                            <HiSearch />
                        </button>
                    </div>
                    {searching && <p className="text-xs text-gray-400 mt-1">Searching…</p>}
                    {results.length > 0 && (
                        <ul className="mt-1 max-h-40 overflow-auto border border-gray-200 rounded text-sm">
                            {results.map((r, i) => (
                                <li
                                    key={i}
                                    onClick={() => selectResult(r)}
                                    className="px-3 py-1.5 hover:bg-sky-50 cursor-pointer border-b last:border-b-0"
                                >
                                    {r.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="p-4">
                    <div
                        className="rounded-md overflow-hidden border border-gray-200"
                        style={{ height: 360 }}
                    >
                        <MapContainer
                            center={initialPin ?? [28.6139, 77.209]}
                            zoom={initialPin ? 14 : 12}
                            style={{ height: "100%", width: "100%" }}
                            scrollWheelZoom
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <ClickCapture onPick={setPin} />
                            <FlyTo target={flyTarget} />
                            {pin && (
                                <Marker
                                    position={pin}
                                    icon={PIN}
                                    draggable
                                    eventHandlers={{
                                        dragend: (e) => {
                                            const m = e.target as L.Marker;
                                            const { lat, lng } = m.getLatLng();
                                            setPin([lat, lng]);
                                        },
                                    }}
                                />
                            )}
                        </MapContainer>
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                        {pin
                            ? `Selected: ${toGps(pin)}`
                            : "Search, click or drag to set the location."}
                    </p>
                </div>

                <div className="flex justify-end gap-2 px-4 py-3 border-t">
                    <button
                        onClick={onClose}
                        className="text-sm px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!pin}
                        onClick={() => pin && onConfirm(toGps(pin))}
                        className="text-sm px-3 py-1.5 rounded bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Use this location
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

/**
 * rjsf custom widget for a GPS field — a text input with a right-aligned pin icon. Clicking the
 * pin opens a single-location picker (map + click/drag pin + Nominatim place search) that writes
 * "lat, lng" back into this field. Used for start_gps / end_gps in the search form.
 */
export default function GpsWidget(props: WidgetProps) {
    const { id, value, required, disabled, readonly, placeholder, onChange } = props;
    const [open, setOpen] = useState(false);
    const strValue = typeof value === "string" ? value : "";
    const editable = !disabled && !readonly;

    return (
        <div className="relative">
            {/* type="text" so it inherits the rjsf form's standard (white) input styling like every
                other field; explicit paddingRight keeps text clear of the pin icon. */}
            <input
                id={id}
                type="text"
                value={strValue}
                required={required}
                disabled={disabled}
                readOnly={readonly}
                onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
                placeholder={placeholder || "lat, lng"}
                className="w-full"
                style={{ paddingRight: "2.25rem" }}
            />
            <button
                type="button"
                title="Pick on map"
                disabled={!editable}
                onClick={() => setOpen(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sky-600 hover:text-sky-700 disabled:opacity-40"
            >
                <HiOutlineLocationMarker className="text-lg" />
            </button>
            <SingleLocationPickerModal
                open={open}
                title="Pick location on map"
                initial={strValue}
                onClose={() => setOpen(false)}
                onConfirm={(gps) => {
                    onChange(gps);
                    setOpen(false);
                }}
            />
        </div>
    );
}
