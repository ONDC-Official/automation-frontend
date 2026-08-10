import { CalendarDays, Check } from "lucide-react";
import Button from "@dashboard/components/Button";
import DropdownMenu, {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@dashboard/components/DropdownMenu";
import Input from "@dashboard/components/Input";
import { cn, isoDaysAgo, toIsoDate } from "@dashboard/lib/utils";
import { RANGE_PRESETS } from "./constants";
import type { IProps, IRange } from "./types";

function presetRange(days: number | null): IRange {
    if (days === null) return {};
    return { from: isoDaysAgo(days), to: toIsoDate(new Date()) };
}

function labelFor(value: IRange) {
    const matched = RANGE_PRESETS.find((preset) => {
        const range = presetRange(preset.days);
        return range.from === value.from && range.to === value.to;
    });
    if (matched) return matched.label;
    if (value.from && value.to) return `${value.from} → ${value.to}`;
    if (value.from) return `From ${value.from}`;
    if (value.to) return `Until ${value.to}`;
    return "All time";
}

/**
 * Preset rows with a custom range behind a hairline in the footer. Selection is
 * marked with a check, never by colour alone.
 */
const DateRangePicker = ({ value, onChange, disabled, className }: IProps) => {
    const activeLabel = labelFor(value);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn("justify-start font-normal", className)}
                >
                    <CalendarDays className="text-muted-foreground" />
                    {activeLabel}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Date range</DropdownMenuLabel>
                {RANGE_PRESETS.map((preset) => (
                    <DropdownMenuItem
                        key={preset.label}
                        onSelect={() => onChange(presetRange(preset.days))}
                        className="justify-between"
                    >
                        {preset.label}
                        {activeLabel === preset.label && <Check className="size-4 stroke-[3]" />}
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                <div
                    className="flex flex-col gap-2 p-2"
                    onKeyDown={(event) => event.stopPropagation()}
                >
                    <label className="text-muted-foreground text-xs">
                        From
                        <Input
                            type="date"
                            className="mt-1"
                            value={value.from ?? ""}
                            max={value.to}
                            onChange={(event) =>
                                onChange({ ...value, from: event.target.value || undefined })
                            }
                        />
                    </label>
                    <label className="text-muted-foreground text-xs">
                        To
                        <Input
                            type="date"
                            className="mt-1"
                            value={value.to ?? ""}
                            min={value.from}
                            onChange={(event) =>
                                onChange({ ...value, to: event.target.value || undefined })
                            }
                        />
                    </label>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

/** Public surface — callers import the range type from here, not from `./types`. */
export type { IRange } from "./types";

export default DateRangePicker;
