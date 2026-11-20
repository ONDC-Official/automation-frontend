import { Controller, FieldValues } from "react-hook-form";

import { normalizeComboBoxOptions } from "@components/Shadcn/ComboBox/combo-box-options";
import { Field, FieldError, FieldLabel } from "@components/Shadcn/TextField/field";
import {
    Combobox as ShadCnComboBox,
    ComboboxInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxItem,
    ComboboxList,
} from "@components/Shadcn/ComboBox/combobox";
import { IComboBoxProps } from "@components/Shadcn/ComboBox/types";
import { FieldTooltip } from "@components/Shadcn/TextField/field-tooltip";
import { cn } from "@/lib/utils";

export const ComboBox = <T extends FieldValues>({
    control,
    name,
    label,
    options,
    placeholder,
    required = false,
    disabled = false,
    onValueChange,
    tooltip,
    floatingLabel = false,
}: IComboBoxProps<T>) => {
    const normalizedOptions = normalizeComboBoxOptions(options);
    const items = normalizedOptions.map((option) => option.value);

    const getLabel = (value: string) =>
        normalizedOptions.find((option) => option.value === value)?.label ?? value;

    if (!control) {
        return null;
    }

    return (
        <Controller
            control={control}
            name={name}
            rules={{ required: required ? "Field required" : false }}
            render={({ field, fieldState }) =>
                floatingLabel ? (
                    <Field data-invalid={!!fieldState.error}>
                        <div className="group/float relative">
                            <ShadCnComboBox
                                items={items}
                                value={field.value || null}
                                itemToStringLabel={getLabel}
                                onValueChange={(value) => {
                                    field.onChange(value ?? "");
                                    if (value) {
                                        onValueChange?.(value);
                                    }
                                }}
                                disabled={disabled}
                            >
                                <ComboboxInput
                                    ref={field.ref}
                                    id={`${name}-combobox`}
                                    className="h-13 w-full rounded-lg bg-n-0 dark:bg-surface-muted [&_input]:pt-5 [&_input]:pb-1 [&_input]:text-base"
                                    placeholder=""
                                    disabled={disabled}
                                    aria-invalid={!!fieldState.error}
                                >
                                    {tooltip ? (
                                        <>
                                            <span
                                                aria-hidden="true"
                                                className="order-last h-5 w-px shrink-0 bg-n-30 dark:bg-border-default"
                                            />
                                            <span
                                                className="order-last flex shrink-0 items-center pr-3 pl-2.5"
                                                onPointerDown={(event) => event.stopPropagation()}
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                <FieldTooltip label={label} content={tooltip} />
                                            </span>
                                        </>
                                    ) : null}
                                </ComboboxInput>
                                <ComboboxContent>
                                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                                    <ComboboxList>
                                        {(item) => (
                                            <ComboboxItem key={item} value={item}>
                                                {getLabel(item)}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </ShadCnComboBox>
                            {/* Centred like placeholder text while empty; small at the top once picked or focused. */}
                            <label
                                htmlFor={`${name}-combobox`}
                                className={cn(
                                    "pointer-events-none absolute left-3 text-text-secondary transition-all",
                                    field.value
                                        ? "top-2 text-caption-1"
                                        : "top-1/2 -translate-y-1/2 text-body-1 group-focus-within/float:top-2 group-focus-within/float:translate-y-0 group-focus-within/float:text-caption-1",
                                    disabled && "opacity-60"
                                )}
                            >
                                {label}
                                {required && <span className="ml-0.5 text-destructive">*</span>}
                            </label>
                        </div>
                        {fieldState.error?.message && (
                            <FieldError>{fieldState.error.message}</FieldError>
                        )}
                    </Field>
                ) : (
                    <Field data-invalid={!!fieldState.error}>
                        {tooltip ? (
                            <div className="flex items-center gap-1.5">
                                <FieldLabel className="font-semibold">
                                    {label}
                                    {required && <span className="text-destructive">*</span>}
                                </FieldLabel>
                                <FieldTooltip label={label} content={tooltip} />
                            </div>
                        ) : (
                            <FieldLabel className="font-semibold">
                                {label}
                                {required && <span className="text-destructive">*</span>}
                            </FieldLabel>
                        )}
                        <ShadCnComboBox
                            items={items}
                            value={field.value || null}
                            itemToStringLabel={getLabel}
                            onValueChange={(value) => {
                                field.onChange(value ?? "");
                                if (value) {
                                    onValueChange?.(value);
                                }
                            }}
                            disabled={disabled}
                        >
                            <ComboboxInput
                                ref={field.ref}
                                className="w-full"
                                placeholder={placeholder ?? "Select a value"}
                                disabled={disabled}
                                aria-invalid={!!fieldState.error}
                            />
                            <ComboboxContent>
                                <ComboboxEmpty>No items found.</ComboboxEmpty>
                                <ComboboxList>
                                    {(item) => (
                                        <ComboboxItem key={item} value={item}>
                                            {getLabel(item)}
                                        </ComboboxItem>
                                    )}
                                </ComboboxList>
                            </ComboboxContent>
                        </ShadCnComboBox>
                        {fieldState.error?.message && (
                            <FieldError>{fieldState.error.message}</FieldError>
                        )}
                    </Field>
                )
            }
        />
    );
};

export { ComboBoxControl } from "@components/Shadcn/ComboBox/combobox-control";
export type { IComboBoxControlProps } from "@components/Shadcn/ComboBox/combobox-control";
export { ComboBoxMultiControl } from "@components/Shadcn/ComboBox/combobox-multi-control";
export type { IComboBoxMultiControlProps } from "@components/Shadcn/ComboBox/combobox-multi-control";
export type {
    ComboBoxOptionInput,
    IComboBoxOption,
} from "@components/Shadcn/ComboBox/combo-box-options";

export default ComboBox;
