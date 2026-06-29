import { memo, useMemo, useState } from "react";
import { format } from "date-fns";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Controller, type FieldValues } from "react-hook-form";

import { Calendar } from "@/components/Shadcn/Calendar";
import { Field, FieldError, FieldLabel } from "@/components/Shadcn/TextField/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Shadcn/Popover";
import { formatDateOnly, parseDateOnly } from "@/components/ui/forms/utils/date-utils";
import { cn } from "@/lib/utils";

import type { IDatePickerProps } from "./types";

const DatePickerControl = memo(function DatePickerControl({
    value = "",
    onChange,
    label,
    id,
    required,
    disabled,
    error,
    placeholder = "Select date",
    className,
}: Omit<IDatePickerProps, "name" | "register" | "control" | "errors" | "rules">) {
    const [open, setOpen] = useState(false);
    const selectedDate = useMemo(() => parseDateOnly(value), [value]);
    const fieldId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : "date-picker");

    const handleSelect = (date: Date | undefined) => {
        onChange?.(date ? formatDateOnly(date) : "");
        setOpen(false);
    };

    return (
        <Field data-invalid={!!error} className={className}>
            {label && (
                <FieldLabel htmlFor={fieldId} className="font-semibold">
                    {label}
                    {required && <span className="text-destructive">*</span>}
                </FieldLabel>
            )}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        id={fieldId}
                        disabled={disabled}
                        data-empty={!selectedDate}
                        className={cn(
                            "inline-flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-left text-sm font-normal shadow-xs transition-[color,box-shadow] outline-none",
                            "focus-visible:border-ring focus-visible:ring focus-visible:ring-ring/50",
                            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                            "dark:bg-input/30",
                            selectedDate ? "text-foreground" : "text-muted-foreground",
                            error && "border-destructive"
                        )}
                    >
                        {selectedDate ? format(selectedDate, "PPP") : placeholder}
                        <ChevronDownIcon className="size-4 opacity-50" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        defaultMonth={selectedDate}
                        captionLayout="dropdown"
                        onSelect={handleSelect}
                    />
                </PopoverContent>
            </Popover>
            {error && <FieldError>{error}</FieldError>}
        </Field>
    );
});

const DatePicker = <T extends FieldValues = FieldValues>({
    name,
    register,
    control,
    errors,
    rules,
    value,
    onChange,
    required,
    ...fieldProps
}: IDatePickerProps<T>) => {
    const validationRules = {
        required: required ? (typeof required === "string" ? required : "Field required") : false,
        ...rules,
    };

    const fieldError =
        fieldProps.error ??
        (name && errors?.[name]?.message ? String(errors[name]?.message) : undefined);

    if (control && name) {
        return (
            <Controller
                name={name}
                control={control}
                rules={validationRules}
                render={({ field }) => (
                    <DatePickerControl
                        {...fieldProps}
                        id={fieldProps.id ?? name}
                        required={required}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        error={fieldError}
                    />
                )}
            />
        );
    }

    if (register && name) {
        const registration = register(name, validationRules);

        return (
            <>
                <input type="hidden" {...registration} />
                <DatePickerControl
                    {...fieldProps}
                    id={fieldProps.id ?? name}
                    required={required}
                    value={value}
                    onChange={(nextValue) => {
                        registration.onChange({ target: { value: nextValue, name } });
                        onChange?.(nextValue);
                    }}
                    error={fieldError}
                />
            </>
        );
    }

    return (
        <DatePickerControl
            {...fieldProps}
            required={required}
            value={value}
            onChange={onChange}
            error={fieldError}
        />
    );
};

export { DatePicker, DatePickerControl };
export default DatePicker;
