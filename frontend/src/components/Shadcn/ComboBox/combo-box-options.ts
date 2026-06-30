export interface IComboBoxOption {
    label: string;
    value: string;
}

export type ComboBoxOptionInput = string | IComboBoxOption;

export const normalizeComboBoxOptions = (options: ComboBoxOptionInput[]): IComboBoxOption[] =>
    options.map((option) =>
        typeof option === "string" ? { label: option, value: option } : option
    );
