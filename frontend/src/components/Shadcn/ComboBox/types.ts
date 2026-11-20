import { Control, FieldPath, FieldValues } from "react-hook-form";

import type { ComboBoxOptionInput } from "@components/Shadcn/ComboBox/combo-box-options";

export interface IComboBoxProps<T extends FieldValues> {
    control?: Control<T>;
    name: FieldPath<T>;
    label: string;
    options: ComboBoxOptionInput[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    onValueChange?: (value: string) => void;
    /** Optional help text shown from an "i" icon next to the label. */
    tooltip?: string;
    /**
     * Label inside the box (like placeholder text) that moves up small once a value
     * is picked or the field has focus; a tooltip then sits inside, after the arrow.
     */
    floatingLabel?: boolean;
}
