import { Control, FieldPath, FieldValues } from "react-hook-form";

export interface IComboBoxProps<T extends FieldValues> {
    control: Control<T>;
    name: FieldPath<T>;
    label: string;
    options: string[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    onValueChange?: (value: string) => void;
}
