import { useMemo } from "react";
import { Controller, type FieldValues } from "react-hook-form";
import { Input } from "@/components/Shadcn/TextField/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/Shadcn/TextField/field";
import { formatDateTimeLocal, parseDateTimeLocal } from "@/components/ui/forms/utils/date-utils";
import { DatePickerControl } from "@/components/Shadcn/DatePicker";
import type { IDateTimePickerProps } from "@/components/Shadcn/DatePicker/types";
import { cn } from "@/lib/utils";

const DateTimePickerControl = ({
    value = "",
    onChange,
    label,
    dateLabel = "Date",
    timeLabel = "Time",
    id,
    required,
    disabled,
    error,
    placeholder,
    className,
    timeStep = 60,
}: Omit<IDateTimePickerProps, "name" | "register" | "control" | "errors" | "rules">) => {
    const { date, time } = useMemo(() => parseDateTimeLocal(value), [value]);
    const fieldId = id ?? "datetime-picker";

    const updateValue = (nextDate: string, nextTime: string) => {
        onChange?.(formatDateTimeLocal(nextDate, nextTime));
    };

    if (label) {
        return (
            <Field data-invalid={!!error} className={className}>
                <FieldLabel className="font-semibold">
                    {label}
                    {required && <span className="text-destructive">*</span>}
                </FieldLabel>
                <FieldGroup className="flex-row gap-3">
                    <DatePickerControl
                        value={date}
                        onChange={(nextDate) => updateValue(nextDate, time)}
                        label={dateLabel}
                        id={`${fieldId}-date`}
                        required={required}
                        disabled={disabled}
                        placeholder={placeholder ?? "Select date"}
                        className="min-w-0 flex-1"
                    />
                    <Field className="min-w-0 flex-1">
                        <FieldLabel htmlFor={`${fieldId}-time`} className="font-semibold">
                            {timeLabel}
                            {required && <span className="text-destructive">*</span>}
                        </FieldLabel>
                        <Input
                            id={`${fieldId}-time`}
                            type="time"
                            step={timeStep}
                            value={time}
                            disabled={disabled}
                            onChange={(event) => updateValue(date, event.target.value)}
                            className={cn(
                                "appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
                                error && "border-destructive"
                            )}
                        />
                    </Field>
                </FieldGroup>
                {error && <FieldError>{error}</FieldError>}
            </Field>
        );
    }

    return (
        <FieldGroup className={cn("flex-row gap-3", className)} data-invalid={!!error}>
            <DatePickerControl
                value={date}
                onChange={(nextDate) => updateValue(nextDate, time)}
                label={dateLabel}
                id={`${fieldId}-date`}
                required={required}
                disabled={disabled}
                placeholder={placeholder ?? "Select date"}
                className="min-w-0 flex-1"
            />
            <Field className="min-w-0 flex-1" data-invalid={!!error}>
                <FieldLabel htmlFor={`${fieldId}-time`} className="font-semibold">
                    {timeLabel}
                    {required && <span className="text-destructive">*</span>}
                </FieldLabel>
                <Input
                    id={`${fieldId}-time`}
                    type="time"
                    step={timeStep}
                    value={time}
                    disabled={disabled}
                    onChange={(event) => updateValue(date, event.target.value)}
                    className={cn(
                        "appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
                        error && "border-destructive"
                    )}
                />
            </Field>
            {error && <FieldError className="w-full">{error}</FieldError>}
        </FieldGroup>
    );
};

const DateTimePicker = <T extends FieldValues = FieldValues>({
    name,
    register,
    control,
    errors,
    rules,
    value,
    onChange,
    required,
    ...fieldProps
}: IDateTimePickerProps<T>) => {
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
                    <DateTimePickerControl
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
                <DateTimePickerControl
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
        <DateTimePickerControl
            {...fieldProps}
            required={required}
            value={value}
            onChange={onChange}
            error={fieldError}
        />
    );
};

export { DateTimePicker, DateTimePickerControl };
export default DateTimePicker;
