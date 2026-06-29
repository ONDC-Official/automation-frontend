import { Textarea } from "@/components/Shadcn/ComboBox/textarea";
import { Checkbox } from "@/components/Shadcn/Checkbox";
import { SelectControl } from "@/components/Shadcn/Select/select-control";
import { Input } from "@/components/Shadcn/TextField/input";
import { Field, FieldError, FieldLabel } from "@/components/Shadcn/TextField/field";
import { cn } from "@/lib/utils";

import type {
    AnyField,
    CheckboxGroupField,
    FileField,
    RadioGroupField,
    SelectField,
    TextLikeField,
    TextareaField,
    ValueState,
} from "./protocol-html-form";

const nativeSelectClassName = cn(
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none",
    "focus-visible:border-ring focus-visible:ring focus-visible:ring-ring/50",
    "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20"
);

export interface IProtocolHtmlFieldRendererProps {
    field: AnyField;
    value: ValueState[string];
    onValueChange: (value: ValueState[string]) => void;
    error?: string;
    radioNameSuffix?: string;
}

export const ProtocolHtmlFieldRenderer = ({
    field,
    value,
    onValueChange,
    error,
    radioNameSuffix = "",
}: IProtocolHtmlFieldRendererProps) => {
    if (field.kind === "hidden") {
        return null;
    }

    const labelText = (
        <>
            {field.label ?? field.name}
            {field.required ? <span className="text-destructive"> *</span> : null}
        </>
    );

    switch (field.kind) {
        case "textlike": {
            const textField = field as TextLikeField;
            const textValue = (value as string) ?? "";
            return (
                <Field data-invalid={!!error}>
                    <FieldLabel>{labelText}</FieldLabel>
                    <Input
                        type={textField.inputType}
                        name={field.name}
                        value={textValue}
                        onChange={(event) => onValueChange(event.target.value)}
                        placeholder={textField.placeholder}
                        required={field.required}
                        disabled={field.disabled}
                        min={textField.min as number}
                        max={textField.max as number}
                        step={textField.step as number}
                        pattern={textField.pattern}
                        aria-invalid={!!error}
                    />
                    {error && <FieldError>{error}</FieldError>}
                </Field>
            );
        }
        case "textarea": {
            const textareaField = field as TextareaField;
            const textValue = (value as string) ?? "";
            return (
                <Field data-invalid={!!error}>
                    <FieldLabel>{labelText}</FieldLabel>
                    <Textarea
                        name={field.name}
                        value={textValue}
                        onChange={(event) => onValueChange(event.target.value)}
                        placeholder={textareaField.placeholder}
                        rows={textareaField.rows ?? 4}
                        required={field.required}
                        disabled={field.disabled}
                        aria-invalid={!!error}
                    />
                    {error && <FieldError>{error}</FieldError>}
                </Field>
            );
        }
        case "select": {
            const selectField = field as SelectField;
            if (selectField.multiple) {
                const selectedValues = (value as string[]) ?? [];
                return (
                    <Field data-invalid={!!error}>
                        <FieldLabel>{labelText}</FieldLabel>
                        <select
                            name={field.name}
                            value={selectedValues}
                            onChange={(event) => {
                                const opts = Array.from(event.currentTarget.selectedOptions).map(
                                    (option) => option.value
                                );
                                onValueChange(opts);
                            }}
                            multiple
                            required={field.required}
                            disabled={field.disabled}
                            className={cn(nativeSelectClassName, "min-h-24")}
                            aria-invalid={!!error}
                        >
                            {selectField.options.map((option, index) => (
                                <option key={index} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {error && <FieldError>{error}</FieldError>}
                    </Field>
                );
            }

            const selectedValue = (value as string) ?? "";
            return (
                <Field data-invalid={!!error}>
                    <FieldLabel>{labelText}</FieldLabel>
                    <SelectControl
                        value={selectedValue}
                        onValueChange={(nextValue) => onValueChange(nextValue)}
                        options={selectField.options.map((option) => ({
                            key: option.label,
                            value: option.value,
                        }))}
                        placeholder="-- Select --"
                        disabled={field.disabled}
                    />
                    {error && <FieldError>{error}</FieldError>}
                </Field>
            );
        }
        case "radio-group": {
            const radioField = field as RadioGroupField;
            const selectedValue = (value as string) ?? "";
            return (
                <Field data-invalid={!!error}>
                    <fieldset className="space-y-2">
                        <legend className="text-sm font-semibold text-text-primary">
                            {labelText}
                        </legend>
                        {radioField.options.map((option, index) => (
                            <label
                                key={index}
                                className="flex cursor-pointer items-center gap-2 text-sm text-text-primary"
                            >
                                <input
                                    type="radio"
                                    name={`${field.name}${radioNameSuffix}`}
                                    value={option.value}
                                    checked={selectedValue === option.value}
                                    onChange={() => onValueChange(option.value)}
                                    className="size-4 accent-brand-normal"
                                />
                                <span>{option.label ?? option.value}</span>
                            </label>
                        ))}
                    </fieldset>
                    {error && <FieldError>{error}</FieldError>}
                </Field>
            );
        }
        case "checkbox-single": {
            const checked = Boolean(value);
            return (
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-text-primary">
                    <Checkbox
                        checked={checked}
                        onCheckedChange={(nextChecked) => onValueChange(nextChecked === true)}
                    />
                    <span>{labelText}</span>
                </label>
            );
        }
        case "checkbox-group": {
            const checkboxField = field as CheckboxGroupField;
            const selectedValues = (value as string[]) ?? [];
            const toggle = (optionValue: string, isChecked: boolean) => {
                if (isChecked) {
                    onValueChange(Array.from(new Set([...selectedValues, optionValue])));
                    return;
                }
                onValueChange(selectedValues.filter((item) => item !== optionValue));
            };

            return (
                <Field data-invalid={!!error}>
                    <fieldset className="space-y-2">
                        <legend className="text-sm font-semibold text-text-primary">
                            {labelText}
                        </legend>
                        {checkboxField.options.map((option, index) => {
                            const isChecked = selectedValues.includes(option.value);
                            return (
                                <label
                                    key={index}
                                    className="flex cursor-pointer items-center gap-2 text-sm text-text-primary"
                                >
                                    <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(nextChecked) =>
                                            toggle(option.value, nextChecked === true)
                                        }
                                    />
                                    <span>{option.label ?? option.value}</span>
                                </label>
                            );
                        })}
                    </fieldset>
                    {error && <FieldError>{error}</FieldError>}
                </Field>
            );
        }
        case "file": {
            const fileField = field as FileField;
            return (
                <Field data-invalid={!!error}>
                    <FieldLabel>{labelText}</FieldLabel>
                    <Input
                        type="file"
                        name={field.name}
                        multiple={!!fileField.multiple}
                        accept={fileField.accept ?? undefined}
                        onChange={(event) => {
                            const files = event.currentTarget.files;
                            if (!files) return;
                            if (fileField.multiple) {
                                onValueChange(Array.from(files));
                                return;
                            }
                            onValueChange(files[0] ?? null);
                        }}
                        className="h-auto cursor-pointer py-2 file:mr-4 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-text-primary hover:file:bg-surface-muted/80"
                        aria-invalid={!!error}
                    />
                    {error && <FieldError>{error}</FieldError>}
                </Field>
            );
        }
        default:
            return null;
    }
};

export default ProtocolHtmlFieldRenderer;
