import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/Shadcn/ComboBox/combobox";
import { cn } from "@/lib/utils";
import type { IHistoryFilterComboBoxProps } from "@pages/user-profile/types";

export const HistoryFilterComboBox = ({
    items,
    value,
    onValueChange,
    placeholder,
    disabled = false,
    className,
}: IHistoryFilterComboBoxProps) => (
    <Combobox
        items={items}
        value={value || null}
        onValueChange={(next) => onValueChange(next ?? "")}
        disabled={disabled}
    >
        <ComboboxInput
            placeholder={placeholder}
            disabled={disabled}
            showClear={false}
            className={cn(
                "min-w-32 rounded-xl border-border-default bg-surface-elevated text-body-2 text-text-primary",
                className
            )}
        />
        <ComboboxContent className="rounded-xl border-border-default bg-surface-elevated">
            <ComboboxEmpty>No options found.</ComboboxEmpty>
            <ComboboxList>
                {(item) => (
                    <ComboboxItem key={item} value={item} className="text-body-2 text-text-primary">
                        {item}
                    </ComboboxItem>
                )}
            </ComboboxList>
        </ComboboxContent>
    </Combobox>
);
