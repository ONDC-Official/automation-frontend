import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/Shadcn/Button/button";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import { cn } from "@/lib/utils";
import {
    IAirlineSeatSelectProps,
    ISelectPayload,
    IParsedFlightData,
    IVehicleGrid,
    ITag,
    ISeatDetail,
    IItem,
} from "../types/trv12-airline-seat-select-form-types";

export default function TRV12AirlineSeatSelectForm({ submitEvent }: IAirlineSeatSelectProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [parsedData, setParsedData] = useState<IParsedFlightData | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<Record<string, string>>({});
    const [activeItemId, setActiveItemId] = useState<string | null>(null);

    const processSelectPayload = (payload: ISelectPayload) => {
        const order = payload?.message?.order;
        if (!order) throw new Error("Invalid payload: Missing order");

        // 1. Find Trip Fulfillment
        const tripFulfillment = order.fulfillments.find((f) => f.type === "TRIP");
        if (!tripFulfillment) throw new Error("No fulfillment of type TRIP found");

        // 2. Extract Vehicle Grid Config
        const vehicleGridTag = tripFulfillment.tags?.find(
            (t) => t.descriptor.code === "VEHICLE_GRID"
        );
        // Valid to not have it, but we need defaults
        const getTagValue = (tag: ITag | undefined, code: string): number => {
            if (!tag) return 0;
            const item = tag.list.find((i) => i.descriptor?.code === code);
            return item?.value ? parseInt(item.value, 10) : 0;
        };

        const grid: IVehicleGrid = {
            xMax: getTagValue(vehicleGridTag, "X_MAX"), // Rows
            yMax: getTagValue(vehicleGridTag, "Y_MAX"), // Cols
            zMax: getTagValue(vehicleGridTag, "Z_MAX"),
            xLobbyStart: getTagValue(vehicleGridTag, "X_LOBBY_START"),
            xLobbySize: getTagValue(vehicleGridTag, "X_LOBBY_SIZE"),
            yLobbyStart: getTagValue(vehicleGridTag, "Y_LOBBY_START"),
            yLobbySize: getTagValue(vehicleGridTag, "Y_LOBBY_SIZE"),
        };

        // 3. Extract Available Seats from TICKET fulfillments or any fulfillment with SEAT_GRID
        // Also map FulfillmentID -> Seat Info for auto-selection later
        const fulfillmentMap = new Map<string, ISeatDetail>();

        const availableSeats = order.fulfillments
            .filter((f) => f.tags?.some((t) => t.descriptor.code === "SEAT_GRID"))
            .map((f) => {
                const seatGridTag = f.tags?.find((t) => t.descriptor.code === "SEAT_GRID");
                if (!seatGridTag) return null;

                const getVal = (code: string) => {
                    const v = seatGridTag.list.find((i) => i.descriptor?.code === code)?.value;
                    return v;
                };

                let x = getVal("X") ? parseInt(getVal("X")!, 10) : 0;
                let y = getVal("Y") ? parseInt(getVal("Y")!, 10) : 0;
                const z = getVal("Z") ? parseInt(getVal("Z")!, 10) : 0;
                const seatNumber = getVal("SEAT_NUMBER") || "";

                // Fix for payloads with bad coordinates (e.g. all 0,0) or need to infer from seatNumber
                if (seatNumber) {
                    const match =
                        seatNumber.match(/^([A-Z])(\d+)$/i) || seatNumber.match(/^(\d+)([A-Z])$/i);
                    if (match) {
                        // Determine which is letter and which is number
                        const part1 = match[1];
                        const part2 = match[2];
                        let letter = "";
                        let numberStr = "";

                        if (teamIsDigit(part1)) {
                            numberStr = part1;
                            letter = part2;
                        } else {
                            letter = part1;
                            numberStr = part2;
                        }

                        // Parse
                        // Assuming Letter is Column (Y) [A=0, B=1...]
                        // Assuming Number is Row (X) [1-based usually, so -1 to get index]
                        const parsedY = letter.toUpperCase().charCodeAt(0) - 65; // A->0
                        const parsedX = parseInt(numberStr, 10) - 1; // 1->0

                        // If the payload X/Y are 0,0 (suspiciously default), OR completely missing, override/set them.
                        // Also override if existing X/Y seem wrong/zero but we have a valid seatNumber parse
                        if ((x === 0 && y === 0) || (x === undefined && y === undefined)) {
                            x = parsedX >= 0 ? parsedX : 0;
                            y = parsedY >= 0 ? parsedY : 0;
                        }
                    }
                }

                const seatInfo = {
                    x,
                    y,
                    z,
                    seatNumber,
                    price: getVal("SEAT_PRICE") || "0",
                    available: ["true", "1", "yes"].includes(
                        (getVal("AVAILABLE") || "true").toLowerCase()
                    ),
                    fulfillmentId: f.id,
                };

                fulfillmentMap.set(f.id, seatInfo);
                return seatInfo;
            })
            .filter((s): s is NonNullable<typeof s> => s !== null);

        function teamIsDigit(val: string) {
            return /^\d+$/.test(val);
        }

        // 4. Extract Items (Passengers)
        const allItemIds = new Set(order.items.map((i: IItem) => i.id));
        const parentItemIds = new Set(
            order.items
                .map((i: IItem) => i.parent_item_id)
                .filter((id: string | undefined) => id && allItemIds.has(id))
        );

        const items = order.items.filter((i: IItem) => !parentItemIds.has(i.id));

        // 5. Auto-select seats based on item <-> fulfillment linkage
        // DISABLED per user request - user wants to select manually
        const initialSelectedSeats: Record<string, string> = {};
        /* 
      items.forEach((item: any) => {
        if (item.fulfillment_ids) {
          item.fulfillment_ids.forEach((fid: string) => {
            if (fulfillmentMap.has(fid)) {
              const seat = fulfillmentMap.get(fid);
              if (seat && seat.seatNumber) {
                initialSelectedSeats[item.id] = seat.seatNumber;
              }
            }
          });
        }
      });
      */
        setSelectedSeats(initialSelectedSeats);

        // Dynamic Grid Sizing: Ensure grid covers found seats AND meets minimum size requirements
        if (availableSeats.length > 0) {
            const maxSeatX = Math.max(...availableSeats.map((s) => s.x));
            const maxSeatY = Math.max(...availableSeats.map((s) => s.y));

            if (maxSeatX >= grid.xMax) grid.xMax = maxSeatX + 1;
            if (maxSeatY >= grid.yMax) grid.yMax = maxSeatY + 1;
        }

        // Enforce minimum standards for "Airplane" visual (ABCD = 4 cols)
        if (grid.yMax < 4) grid.yMax = 4;
        if (grid.xMax < 6) grid.xMax = 6;

        setParsedData({
            items,
            fulfillmentId: tripFulfillment.id,
            grid,
            availableSeats,
        });

        // Auto-select first passenger
        if (items.length > 0) setActiveItemId(items[0].id);

        toast.success(
            `Payload parsed: ${items.length} passengers, ${availableSeats.length} seats found.`
        );
    };

    const handlePaste = (payload: unknown) => {
        try {
            processSelectPayload(payload as ISelectPayload);
        } catch (e: unknown) {
            console.error(e);
            toast.error("Failed to parse payload: " + (e as Error).message);
        }
        setIsPayloadEditorActive(false);
    };

    const handleSeatClick = (seatCode: string) => {
        if (!activeItemId) {
            toast.warning("Please select a passenger first");
            return;
        }

        // Check if seat is already taken by another passenger
        const existingPassenger = Object.entries(selectedSeats).find(
            ([_, seat]) => seat === seatCode
        );
        if (existingPassenger && existingPassenger[0] !== activeItemId) {
            toast.error(`Seat ${seatCode} is already selected by another passenger`);
            return;
        }

        // Toggle selection
        setSelectedSeats((prev) => {
            const newState = { ...prev };
            if (newState[activeItemId] === seatCode) {
                delete newState[activeItemId]; // Deselect
            } else {
                newState[activeItemId] = seatCode; // Select
            }
            return newState;
        });
    };

    const onSubmit = async () => {
        if (!parsedData) return;

        // Check if all passengers have seats
        // Check if all passengers have seats
        const missingSeats = parsedData.items.filter((item) => !selectedSeats[item.id]);
        if (missingSeats.length > 0) {
            toast.error(
                `Please select seats for: ${missingSeats.map((i) => i.descriptor.name).join(", ")}`
            );
            return;
        }

        const formattedSeats = Object.entries(selectedSeats).map(([itemId, seatNumber]) => {
            // Find the full seat details to get fulfillmentId and price
            const seatDetails = parsedData.availableSeats.find((s) => s.seatNumber === seatNumber);
            // Find the item to get parent_item_id
            const item = parsedData.items.find((i) => i.id === itemId);

            return {
                item_id: itemId,
                parent_item_id: item?.parent_item_id || "",
                seat_id: seatNumber,
                fulfillment_id: seatDetails?.fulfillmentId || "",
                price: seatDetails?.price || "0",
            };
        });

        await submitEvent({
            jsonPath: {},
            formData: {
                seats: JSON.stringify(formattedSeats),
            },
        });
    };

    // Helper to check if a row is a lobby (gap)
    // We refine this: if a row HAS seats, it CANNOT be a lobby gap, regardless of config.
    // This handles bad config where lobby overlaps data.
    const isRowLobby = (rowIndex: number) => {
        if (!parsedData) return false;
        const { xLobbyStart, xLobbySize } = parsedData.grid;
        if (xLobbyStart === undefined || xLobbySize === undefined) return false;
        // Strict config check
        if (rowIndex >= xLobbyStart && rowIndex < xLobbyStart + xLobbySize) {
            // Data override check: Is there a seat here?
            const rowHasSeats = parsedData.availableSeats.some(
                (s) => s.x === rowIndex || s.x === rowIndex + 1 // lenient check
            );
            return !rowHasSeats; // Only true lobby if no seats
        }
        return false;
    };

    if (!parsedData) {
        return (
            <>
                {isPayloadEditorActive && (
                    <PayloadEditor
                        onAdd={handlePaste}
                        onClose={() => setIsPayloadEditorActive(false)}
                    />
                )}
                <FormDialogShell onSubmit={(e) => e.preventDefault()} footer={null}>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-text-primary">
                            Airline Seat Select
                        </p>
                        <p className="text-xs text-text-secondary">
                            Paste on_select payload to load passengers and seat layout
                        </p>
                    </div>
                    <PastePayloadButton
                        label="Paste on_select"
                        onClick={() => setIsPayloadEditorActive(true)}
                    />
                </FormDialogShell>
            </>
        );
    }

    return (
        <>
            {isPayloadEditorActive && (
                <PayloadEditor
                    onAdd={handlePaste}
                    onClose={() => setIsPayloadEditorActive(false)}
                />
            )}
            <FormDialogShell
                onSubmit={(e) => {
                    e.preventDefault();
                    void onSubmit();
                }}
                footer={
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setParsedData(null);
                                setSelectedSeats({});
                                setActiveItemId(null);
                            }}
                        >
                            Reset
                        </Button>
                        <Button type="submit">Confirm Selection</Button>
                    </>
                }
            >
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-text-primary">Select Seats</p>
                    <PastePayloadButton
                        label="Edit Payload"
                        onClick={() => setIsPayloadEditorActive(true)}
                        className="mb-0"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Passenger List */}
                    <div className="md:col-span-1 space-y-2">
                        <h4 className="font-semibold text-text-primary">Passengers</h4>
                        <div className="mb-3 flex items-center gap-2 px-1 text-xs text-text-secondary">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-muted text-[10px] font-bold text-brand-normal">
                                i
                            </span>
                            <span>Please click on a passenger below to select their seat</span>
                        </div>
                        {parsedData.items.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => setActiveItemId(item.id)}
                                className={cn(
                                    "cursor-pointer rounded border p-3 transition-colors",
                                    activeItemId === item.id
                                        ? "border-brand-normal bg-surface-muted"
                                        : "border-border-default hover:bg-surface-muted/50"
                                )}
                            >
                                <div className="font-medium text-text-primary">
                                    {item.descriptor.name}
                                    <div className="mt-0.5 text-xs font-normal text-text-secondary">
                                        {(() => {
                                            const specificFulfillments = (
                                                item.fulfillment_ids || []
                                            ).filter((id) => id !== parsedData.fulfillmentId);
                                            if (specificFulfillments.length === 0) return null;
                                            return (
                                                <span>
                                                    Fulfillment ID:{" "}
                                                    {specificFulfillments.join(", ")}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                                <div className="text-sm text-text-secondary">
                                    {selectedSeats[item.id] ? (
                                        <span className="font-bold text-green-600">
                                            Seat: {selectedSeats[item.id]}
                                        </span>
                                    ) : (
                                        <span className="text-destructive">No seat selected</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Seat Grid Area */}
                    <div className="md:col-span-2 overflow-x-auto">
                        <h4 className="mb-2 font-semibold text-text-primary">Aircraft Layout</h4>
                        {/* Structure Container */}
                        <div className="relative py-12 px-24 flex justify-center">
                            {/* Left Wing */}
                            <div className="absolute top-1/3 left-0 w-32 h-44 bg-gray-200 border-2 border-gray-300 transform skew-y-[-20deg] rounded-l-full shadow-lg z-0 origin-right translate-x-16 translate-y-16">
                                <div className="absolute bottom-[-15px] left-1/3 w-10 h-16 bg-gray-400 rounded-full border border-gray-500 shadow-xl bg-linear-to-r from-gray-300 to-gray-500"></div>
                            </div>

                            {/* Right Wing */}
                            <div className="absolute top-1/3 right-0 w-32 h-44 bg-gray-200 border-2 border-gray-300 transform skew-y-20 rounded-r-full shadow-lg z-0 origin-left -translate-x-16 translate-y-16">
                                <div className="absolute bottom-[-15px] right-1/3 w-10 h-16 bg-gray-400 rounded-full border border-gray-500 shadow-xl bg-linear-to-l from-gray-300 to-gray-500"></div>
                            </div>

                            {/* Tail Stabilizers */}
                            <div className="absolute bottom-0 left-[15%] w-24 h-24 bg-gray-200 border-2 border-gray-300 transform skew-y-[-20deg] rounded-tl-full shadow-md z-0"></div>
                            <div className="absolute bottom-0 right-[15%] w-24 h-24 bg-gray-200 border-2 border-gray-300 transform skew-y-20 rounded-tr-full shadow-md z-0"></div>

                            {/* Fuselage */}
                            <div className="relative z-10 bg-white border-4 border-gray-300 rounded-t-[50%] rounded-b-[4rem] shadow-2xl p-8 pb-20 min-w-max text-center overflow-hidden">
                                {/* Cockpit */}
                                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-48 h-24 bg-linear-to-b from-slate-700 to-slate-900 rounded-t-[40%] rounded-b-[3rem] border-b-4 border-slate-500 opacity-90 shadow-inner z-20 overflow-hidden">
                                    <div className="absolute top-3 left-6 w-16 h-8 bg-white opacity-10 rounded-full transform -rotate-12 blur-md"></div>
                                </div>

                                <div className="relative z-10 inline-block space-y-2 pt-32">
                                    {/* Cabin Separator */}
                                    <div className="w-full flex items-center justify-center gap-2 mb-6 opacity-70">
                                        <div className="h-0.5 w-full bg-slate-300"></div>
                                    </div>

                                    {/* Column Headers (A, B, C...) */}
                                    <div className="flex gap-2 mb-2 ml-8 justify-center">
                                        {Array.from({ length: parsedData.grid.yMax || 6 }).map(
                                            (_, colIndex) => {
                                                // Check if this column is a lobby (aisle) AND has no seats
                                                // const isYLobby =
                                                //   parsedData.grid.yLobbyStart !== undefined &&
                                                //   parsedData.grid.yLobbySize !== undefined &&
                                                //   colIndex >= parsedData.grid.yLobbyStart &&
                                                //   colIndex < parsedData.grid.yLobbyStart + parsedData.grid.yLobbySize;

                                                // If it IS a lobby, we only treat it as a gap if there are NO seats in this column
                                                // FORCE SHOW ALL COLUMNS even if they are marked as lobby/aisle in payload
                                                // User wants fixed ABCD layout
                                                // const colHasSeats = parsedData.availableSeats.some((s) => s.y === colIndex);
                                                // if (isYLobby && !colHasSeats) {
                                                //   return <div key={`head-gap-${colIndex}`} className="w-8" />;
                                                // }

                                                return (
                                                    <div
                                                        key={`head-${colIndex}`}
                                                        className="w-10 m-1 text-center font-bold text-gray-500"
                                                    >
                                                        {String.fromCharCode(65 + colIndex)}
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>

                                    {/* Rows */}
                                    {Array.from({ length: parsedData.grid.xMax }).map(
                                        (_, rowIndex) => {
                                            if (isRowLobby(rowIndex)) {
                                                return (
                                                    <div
                                                        key={`row-gap-${rowIndex}`}
                                                        className="h-6 w-full"
                                                    />
                                                );
                                            }

                                            return (
                                                <div
                                                    key={`row-${rowIndex}`}
                                                    className="flex gap-2 items-center justify-center"
                                                >
                                                    {/* Row Number */}
                                                    <div className="w-6 text-right font-bold text-gray-500 mr-2">
                                                        {rowIndex + 1}
                                                    </div>

                                                    {/* Seats in Row */}
                                                    {Array.from({
                                                        length: parsedData.grid.yMax || 6,
                                                    }).map((_, colIndex) => {
                                                        // Find seat - STRICT CHECK ONLY
                                                        const seat = parsedData.availableSeats.find(
                                                            (s) =>
                                                                s.x === rowIndex && s.y === colIndex
                                                        );

                                                        // const isYLobby =
                                                        //   parsedData.grid.yLobbyStart !== undefined &&
                                                        //   parsedData.grid.yLobbySize !== undefined &&
                                                        //   colIndex >= parsedData.grid.yLobbyStart &&
                                                        //   colIndex < parsedData.grid.yLobbyStart + parsedData.grid.yLobbySize;

                                                        // Only render gap if it's a lobby AND there's no seat here
                                                        // (Wait, if there are seats in this column elsewhere, we probably shouldn't render a gap spacer at all,
                                                        // just an empty cell if !seat. But for now, let's keep the gap logic if !seat to maintain aisle look)
                                                        // ACTUALLY: The user wants "ABCD". If we render a gap spacer (w-8) it breaks the grid structure vs headers.
                                                        // We should probably just render an empty cell (w-10) if the column is "active" (has seats anywhere).

                                                        // FORCE SHOW ALL COLUMNS
                                                        // const colHasSeats = parsedData.availableSeats.some((s) => s.y === colIndex);
                                                        // if (isYLobby && !seat && !colHasSeats) {
                                                        //   return <div key={`seat-gap-${colIndex}`} className="w-8" />;
                                                        // }

                                                        const seatNumber = seat
                                                            ? seat.seatNumber
                                                            : "";
                                                        // If we have no seatNumber but coordinates, make one up just for display? No.
                                                        // But we might have seatNumber from matching logic above.

                                                        const isAvailable = seat
                                                            ? seat.available
                                                            : false;
                                                        const price = seat ? seat.price : "";

                                                        const isSelectedByActive =
                                                            seatNumber &&
                                                            selectedSeats[activeItemId || ""] ===
                                                                seatNumber;
                                                        const isSelectedByOther =
                                                            seatNumber &&
                                                            Object.entries(selectedSeats).some(
                                                                ([id, s]) =>
                                                                    s === seatNumber &&
                                                                    id !== activeItemId
                                                            );

                                                        // Check Eligibility based on Fulfillment ID
                                                        // If active item has specific fulfillment_ids, the seat MUST match one of them
                                                        const activeItem = parsedData.items.find(
                                                            (i) => i.id === activeItemId
                                                        );
                                                        const isEligible =
                                                            !activeItem ||
                                                            !activeItem.fulfillment_ids ||
                                                            activeItem.fulfillment_ids.length ===
                                                                0 ||
                                                            (seat &&
                                                                activeItem.fulfillment_ids.includes(
                                                                    seat.fulfillmentId
                                                                ));

                                                        // Allow selection if available OR if it's already selected by US (to deselect)
                                                        // or if it was pre-selected from payload (we treat that as "Available" effectively for us)
                                                        const canSelect =
                                                            seat &&
                                                            (isAvailable || isSelectedByActive) &&
                                                            !isSelectedByOther &&
                                                            isEligible;

                                                        // Visual Placeholder for missing seat spot
                                                        if (!seat) {
                                                            return (
                                                                <div
                                                                    key={`empty-${rowIndex}-${colIndex}`}
                                                                    className="w-10 h-10 m-1 rounded bg-gray-100 border border-transparent"
                                                                /> // Invisible placeholder to keep alignment
                                                            );
                                                        }

                                                        return (
                                                            <button
                                                                key={
                                                                    seatNumber ||
                                                                    `${rowIndex}-${colIndex}`
                                                                }
                                                                type="button"
                                                                onClick={() =>
                                                                    canSelect &&
                                                                    seatNumber &&
                                                                    handleSeatClick(seatNumber)
                                                                }
                                                                disabled={!canSelect}
                                                                className={cn(
                                                                    "relative m-1 flex h-10 w-10 flex-col items-center justify-center rounded border-2 text-xs font-semibold transition-all group",
                                                                    isSelectedByActive &&
                                                                        "scale-105 border-green-700 bg-green-600 text-white shadow-md",
                                                                    !isSelectedByActive &&
                                                                        isSelectedByOther &&
                                                                        "cursor-not-allowed border-border-default bg-surface-muted text-text-secondary",
                                                                    !isSelectedByActive &&
                                                                        !isSelectedByOther &&
                                                                        !isEligible &&
                                                                        "cursor-not-allowed border-border-default bg-surface-muted/50 text-text-secondary opacity-50",
                                                                    !isSelectedByActive &&
                                                                        !isSelectedByOther &&
                                                                        isEligible &&
                                                                        isAvailable &&
                                                                        "border-brand-normal bg-surface text-text-primary shadow-xs hover:bg-surface-muted",
                                                                    !isSelectedByActive &&
                                                                        !isSelectedByOther &&
                                                                        isEligible &&
                                                                        !isAvailable &&
                                                                        "cursor-not-allowed border-border-default bg-surface-muted text-text-secondary"
                                                                )}
                                                                title={
                                                                    !isEligible
                                                                        ? "Not available for this passenger ticket type"
                                                                        : !isAvailable &&
                                                                            !isSelectedByActive &&
                                                                            !isSelectedByOther
                                                                          ? `Occupied (${seatNumber})`
                                                                          : isSelectedByOther
                                                                            ? "Selected by another passenger"
                                                                            : `Select Seat ${seatNumber} - ₹${price}`
                                                                }
                                                            >
                                                                {isSelectedByActive ? (
                                                                    <span className="text-lg">
                                                                        ✓
                                                                    </span>
                                                                ) : (
                                                                    <>
                                                                        <span className="text-[10px] leading-tight">
                                                                            {seatNumber}
                                                                        </span>
                                                                        {price &&
                                                                            (isAvailable ||
                                                                                isSelectedByOther) && (
                                                                                <span className="text-[8px] font-bold">
                                                                                    ₹{price}
                                                                                </span>
                                                                            )}
                                                                    </>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        }
                                    )}
                                </div>

                                {/* Legend */}
                                <div className="mt-6 flex justify-center gap-4 text-sm text-text-secondary">
                                    <div className="flex items-center gap-1">
                                        <div className="h-4 w-4 rounded border border-brand-normal bg-surface"></div>
                                        <span>Available</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="h-4 w-4 rounded bg-green-600"></div>
                                        <span>Selected</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="h-4 w-4 rounded bg-surface-muted"></div>
                                        <span>Occupied/Unavailable</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </FormDialogShell>
        </>
    );
}
