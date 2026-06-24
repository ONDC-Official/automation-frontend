import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/Shadcn/Select/select";
import { cn } from "@/lib/utils";

export interface ISelectControlOption {
    key: string;
    value: string;
}

export interface ISelectControlProps {
    value?: string;
    onValueChange?: (value: string) => void;
    options: ISelectControlOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export const SelectControl = ({
    value,
    onValueChange,
    options,
    placeholder = "Select a value",
    disabled = false,
    className,
}: ISelectControlProps) => (
    <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={cn("w-full", className)}>
            <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
            {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                    {option.key}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
);

export default SelectControl;
