import React, { useState, useEffect } from "react";
import { FaClock } from "react-icons/fa";

import { Input } from "@components/Shadcn/Input";
import { SelectControl } from "@components/Shadcn/Select";
import { Button } from "@components/Shadcn/Button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@components/Shadcn/Dialog";
import { cn } from "@/lib/utils";

interface TimeInputProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    size?: "small" | "middle" | "large";
    disabled?: boolean;
    status?: "error" | "warning";
    format?: "24h" | "12h";
    allowFormatToggle?: boolean;
    onFormatChange?: (format: "24h" | "12h") => void;
    syncId?: string; // Identifier for format synchronization group
    className?: string;
}

const TimeInput: React.FC<TimeInputProps> = ({
    value = "",
    onChange,
    placeholder,
    disabled = false,
    status,
    format = "24h",
    allowFormatToggle = true,
    onFormatChange,
    className = "",
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentFormat, setCurrentFormat] = useState<"24h" | "12h">(format);
    const [tempTime, setTempTime] = useState({
        hours: "00",
        minutes: "00",
        period: "AM", // for 12h format
    });

    // Sync format changes from parent
    useEffect(() => {
        setCurrentFormat(format);
    }, [format]);

    // Convert value to display format
    const formatDisplayValue = (timeValue: string) => {
        if (!timeValue) return "";

        const [hours, minutes] = timeValue.split(":");
        if (!hours || !minutes) return timeValue;

        if (currentFormat === "12h") {
            const hour24 = parseInt(hours, 10);
            const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
            const period = hour24 >= 12 ? "PM" : "AM";
            return `${hour12.toString().padStart(2, "0")}:${minutes} ${period}`;
        }

        return `${hours}:${minutes}`;
    };

    // Parse value to set temp time
    const parseTimeValue = (timeValue: string) => {
        if (!timeValue) {
            setTempTime({ hours: "00", minutes: "00", period: "AM" });
            return;
        }

        const [hours, minutes] = timeValue.split(":");
        if (!hours || !minutes) {
            setTempTime({ hours: "00", minutes: "00", period: "AM" });
            return;
        }

        if (currentFormat === "12h") {
            const hour24 = parseInt(hours, 10);
            const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
            const period = hour24 >= 12 ? "PM" : "AM";
            setTempTime({
                hours: hour12.toString().padStart(2, "0"),
                minutes,
                period,
            });
        } else {
            setTempTime({
                hours,
                minutes,
                period: "AM",
            });
        }
    };

    const handleOpenModal = () => {
        parseTimeValue(value);
        setIsModalOpen(true);
    };

    const handleConfirm = () => {
        let finalHours = tempTime.hours;

        if (currentFormat === "12h") {
            let hour24 = parseInt(tempTime.hours, 10);
            if (tempTime.period === "AM" && hour24 === 12) {
                hour24 = 0;
            } else if (tempTime.period === "PM" && hour24 !== 12) {
                hour24 += 12;
            }
            finalHours = hour24.toString().padStart(2, "0");
        }

        const timeString = `${finalHours}:${tempTime.minutes}`;
        onChange?.(timeString);
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const handleFormatChange = (newFormat: "24h" | "12h") => {
        setCurrentFormat(newFormat);

        // Notify parent about format change for synchronization
        if (onFormatChange) {
            onFormatChange(newFormat);
        }

        // Convert current tempTime to new format
        if (newFormat === "12h" && currentFormat === "24h") {
            const hour24 = parseInt(tempTime.hours, 10);
            const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
            const period = hour24 >= 12 ? "PM" : "AM";
            setTempTime((prev) => ({
                ...prev,
                hours: hour12.toString().padStart(2, "0"),
                period,
            }));
        } else if (newFormat === "24h" && currentFormat === "12h") {
            let hour24 = parseInt(tempTime.hours, 10);
            if (tempTime.period === "AM" && hour24 === 12) {
                hour24 = 0;
            } else if (tempTime.period === "PM" && hour24 !== 12) {
                hour24 += 12;
            }
            setTempTime((prev) => ({
                ...prev,
                hours: hour24.toString().padStart(2, "0"),
                period: "AM",
            }));
        }
    };

    // Generate hour options
    const hourOptions =
        currentFormat === "12h"
            ? Array.from({ length: 12 }, (_, i) => {
                  const hour = i + 1;
                  return {
                      key: hour.toString().padStart(2, "0"),
                      value: hour.toString().padStart(2, "0"),
                  };
              })
            : Array.from({ length: 24 }, (_, i) => ({
                  key: i.toString().padStart(2, "0"),
                  value: i.toString().padStart(2, "0"),
              }));

    // Generate minute options
    const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
        key: i.toString().padStart(2, "0"),
        value: i.toString().padStart(2, "0"),
    }));

    const periodOptions = [
        { key: "AM", value: "AM" },
        { key: "PM", value: "PM" },
    ];

    const displayPlaceholder =
        placeholder ||
        (currentFormat === "12h" ? "Select time (12hr format)" : "Select time (24hr format)");

    return (
        <>
            <div className="relative">
                <Input
                    value={formatDisplayValue(value)}
                    placeholder={displayPlaceholder}
                    disabled={disabled}
                    aria-invalid={status === "error"}
                    className={cn("cursor-pointer pr-9", className)}
                    readOnly
                    onClick={handleOpenModal}
                />
                <FaClock className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400" />
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>
                            Select Time ({currentFormat === "12h" ? "12 Hour" : "24 Hour"} Format)
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Format Toggle */}
                        {allowFormatToggle && (
                            <div className="flex justify-center">
                                <div className="bg-gray-100 rounded-lg p-1 flex">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                            currentFormat === "12h"
                                                ? "bg-white text-sky-600 shadow-xs"
                                                : "text-gray-600 hover:text-gray-800"
                                        }`}
                                        onClick={() => handleFormatChange("12h")}
                                    >
                                        12 Hour
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                            currentFormat === "24h"
                                                ? "bg-white text-sky-600 shadow-xs"
                                                : "text-gray-600 hover:text-gray-800"
                                        }`}
                                        onClick={() => handleFormatChange("24h")}
                                    >
                                        24 Hour
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 justify-center">
                            {/* Hours */}
                            <div className="flex flex-col items-center">
                                <label className="text-sm font-medium text-gray-700 mb-2">
                                    Hours
                                </label>
                                <SelectControl
                                    value={tempTime.hours}
                                    onValueChange={(next) =>
                                        setTempTime((prev) => ({ ...prev, hours: next }))
                                    }
                                    options={hourOptions}
                                    className="w-20"
                                />
                            </div>

                            <div className="text-2xl font-bold text-gray-400 mt-6">:</div>

                            {/* Minutes */}
                            <div className="flex flex-col items-center">
                                <label className="text-sm font-medium text-gray-700 mb-2">
                                    Minutes
                                </label>
                                <SelectControl
                                    value={tempTime.minutes}
                                    onValueChange={(next) =>
                                        setTempTime((prev) => ({ ...prev, minutes: next }))
                                    }
                                    options={minuteOptions}
                                    className="w-20"
                                />
                            </div>

                            {/* Period (AM/PM) for 12h format */}
                            {currentFormat === "12h" && (
                                <div className="flex flex-col items-center">
                                    <label className="text-sm font-medium text-gray-700 mb-2">
                                        Period
                                    </label>
                                    <SelectControl
                                        value={tempTime.period}
                                        onValueChange={(next) =>
                                            setTempTime((prev) => ({ ...prev, period: next }))
                                        }
                                        options={periodOptions}
                                        className="w-20"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Preview */}
                        <div className="text-center pt-4 border-t">
                            <div className="text-sm text-gray-600 mb-1">Preview:</div>
                            <div className="text-lg font-semibold text-gray-800">
                                {currentFormat === "12h"
                                    ? `${tempTime.hours}:${tempTime.minutes} ${tempTime.period}`
                                    : `${tempTime.hours}:${tempTime.minutes}`}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirm}>Confirm</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default TimeInput;
