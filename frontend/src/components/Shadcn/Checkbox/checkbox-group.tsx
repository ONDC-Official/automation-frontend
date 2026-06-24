import type { Control, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";

import { Checkbox } from "@/components/Shadcn/Checkbox";
import { Field } from "@/components/Shadcn/TextField/field";
import { LabelWithToolTip } from "@/components/Shadcn/TextField/label-with-tooltip";
import { cn } from "@/lib/utils";

export interface ICheckboxOption {
    name: string;
    code: string;
}

export interface ICheckboxGroupProps<T extends FieldValues = FieldValues> {
    options: ICheckboxOption[];
    label: string;
    labelInfo?: string;
    name: string;
    control?: Control<T>;
    required?: boolean;
    disabled?: boolean;
    onChange?: (selectedCodes: string[]) => void;
    defaultValue?: string[];
    className?: string;
}

export const CheckboxGroup = <T extends FieldValues = FieldValues>({
    control,
    options,
    name,
    label,
    labelInfo = "",
    required = false,
    disabled = false,
    onChange,
    defaultValue = [],
    className,
}: ICheckboxGroupProps<T>) => {
    if (!control) {
        return null;
    }

    const groupClassName = cn(
        "max-w-md space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm",
        className
    );

    return (
        <Controller
            name={name as never}
            control={control}
            defaultValue={defaultValue as never}
            rules={{ required: required ? "Field required" : false }}
            render={({ field }) => {
                const selectedValues: string[] = Array.isArray(field.value) ? field.value : [];

                return (
                    <Field className={groupClassName}>
                        <LabelWithToolTip labelInfo={labelInfo} label={label} />
                        {options.map(({ name: optionName, code }) => (
                            <label
                                key={code}
                                className={cn(
                                    "flex cursor-pointer items-center gap-2",
                                    disabled && "cursor-not-allowed opacity-50"
                                )}
                            >
                                <Checkbox
                                    checked={selectedValues.includes(code)}
                                    disabled={disabled}
                                    onCheckedChange={(checked) => {
                                        const nextValues = checked
                                            ? [...selectedValues, code]
                                            : selectedValues.filter((value) => value !== code);
                                        field.onChange(nextValues);
                                        onChange?.(nextValues);
                                    }}
                                />
                                <span className="text-sm text-foreground">
                                    {optionName} ({code})
                                </span>
                            </label>
                        ))}
                    </Field>
                );
            }}
        />
    );
};

export default CheckboxGroup;
