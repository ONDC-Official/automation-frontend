import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

import { Badge } from "@components/Shadcn/Badge/badge";
import { cn } from "@/lib/utils";

interface TagsInputProps {
    value?: string[];
    onChange?: (value: string[]) => void;
    suggestions?: string[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

const TagsInput = ({
    value = [],
    onChange,
    suggestions = [],
    placeholder = "Type and press Enter to add",
    disabled = false,
    className,
}: TagsInputProps) => {
    const [inputValue, setInputValue] = useState("");

    const addTag = (raw: string) => {
        const tag = raw.trim();
        if (!tag || value.includes(tag)) return;
        onChange?.([...value, tag]);
        setInputValue("");
    };

    const removeTag = (tag: string) => {
        onChange?.(value.filter((item) => item !== tag));
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            addTag(inputValue);
        } else if (event.key === "Backspace" && !inputValue && value.length > 0) {
            removeTag(value[value.length - 1]);
        }
    };

    const remainingSuggestions = suggestions.filter((suggestion) => !value.includes(suggestion));

    return (
        <div className={cn("space-y-2", className)}>
            <div
                className={cn(
                    "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2.5 py-1.5 shadow-xs focus-within:border-ring focus-within:ring focus-within:ring-ring/50",
                    disabled && "pointer-events-none opacity-50"
                )}
            >
                {value.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 py-1 pr-1">
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="rounded-full p-0.5 hover:bg-n-30"
                            aria-label={`Remove ${tag}`}
                        >
                            <XMarkIcon className="size-3" />
                        </button>
                    </Badge>
                ))}
                <input
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => addTag(inputValue)}
                    placeholder={value.length === 0 ? placeholder : ""}
                    disabled={disabled}
                    className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
            </div>
            {remainingSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {remainingSuggestions.map((suggestion) => (
                        <button
                            key={suggestion}
                            type="button"
                            onClick={() => addTag(suggestion)}
                            disabled={disabled}
                            className="rounded-full border border-n-30 px-2 py-0.5 text-xs text-n-600 hover:bg-n-30/40"
                        >
                            + {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TagsInput;
