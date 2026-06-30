import type {
    Control,
    FieldErrors,
    FieldPath,
    FieldValues,
    RegisterOptions,
    UseFormRegister,
} from "react-hook-form";

export interface IDateFieldRhfProps<T extends FieldValues = FieldValues> {
    name?: FieldPath<T>;
    register?: UseFormRegister<T>;
    control?: Control<T>;
    errors?: FieldErrors<T>;
    rules?: RegisterOptions<T>;
}

export interface IDatePickerProps<
    T extends FieldValues = FieldValues,
> extends IDateFieldRhfProps<T> {
    value?: string;
    onChange?: (value: string) => void;
    label?: string;
    id?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    placeholder?: string;
    className?: string;
}

export interface IDateTimePickerProps<
    T extends FieldValues = FieldValues,
> extends IDatePickerProps<T> {
    dateLabel?: string;
    timeLabel?: string;
    timeStep?: number;
}
