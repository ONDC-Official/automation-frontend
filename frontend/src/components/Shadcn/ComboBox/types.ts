import { Control, FieldPath, FieldValues } from "react-hook-form";

import type { ComboBoxOptionInput } from "@/components/Shadcn/ComboBox/combo-box-options";

export interface IComboBoxProps<T extends FieldValues> {
    control?: Control<T>;
    name: FieldPath<T>;
    label: string;
    options: ComboBoxOptionInput[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    onValueChange?: (value: string) => void;
}
