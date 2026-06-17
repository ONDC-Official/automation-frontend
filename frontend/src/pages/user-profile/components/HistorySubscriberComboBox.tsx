import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/Shadcn/ComboBox/combobox";
import { cn } from "@/lib/utils";
import type { IHistorySubscriberComboBoxProps } from "@pages/user-profile/types";

export const HistorySubscriberComboBox = ({
    items,
    value,
    onValueChange,
    placeholder,
    disabled = false,
    className,
    onEnter,
}: IHistorySubscriberComboBoxProps) => (
    <Combobox
        items={items}
        value={value || null}
        onValueChange={(next) => onValueChange(next ?? "")}
        inputValue={value}
        onInputValueChange={(next) => onValueChange(next)}
        disabled={disabled}
    >
        <ComboboxInput
            placeholder={placeholder}
            disabled={disabled}
            showClear={false}
            onKeyDown={(e) => {
                if (e.key === "Enter") onEnter?.();
            }}
            className={cn(
                "w-full rounded-xl border-border-default bg-surface-elevated text-body-2 text-text-primary",
                className
            )}
        />
        <ComboboxContent className="rounded-xl border-border-default bg-surface-elevated">
            <ComboboxEmpty>No subscribers found.</ComboboxEmpty>
            <ComboboxList>
                {(item) => (
                    <ComboboxItem key={item} value={item} className="text-body-2 text-text-primary truncate">
                        {item}
                    </ComboboxItem>
                )}
            </ComboboxList>
        </ComboboxContent>
    </Combobox>
);
