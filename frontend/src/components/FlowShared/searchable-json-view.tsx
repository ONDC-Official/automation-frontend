import { useMemo, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import SearchField from "@/components/Shadcn/SearchField";
import { Button } from "@/components/Shadcn/Button/button";
import { cn } from "@/lib/utils";
import AppJsonViewer from "@/components/AppJsonViewer";

function filterJsonBySearch(data: unknown, query: string): unknown {
    if (!query) return data;
    const q = query.toLowerCase();

    const primitiveMatches = (val: unknown): boolean => {
        if (val === null || val === undefined) return false;
        if (typeof val === "string") return val.toLowerCase().includes(q);
        if (typeof val === "number" || typeof val === "boolean") {
            return String(val).toLowerCase().includes(q);
        }
        return false;
    };

    const walk = (val: unknown): unknown => {
        if (Array.isArray(val)) {
            const filtered = val.map((item) => walk(item)).filter((item) => item !== undefined);
            return filtered.length > 0 ? filtered : undefined;
        }
        if (val && typeof val === "object") {
            const result: Record<string, unknown> = {};
            let hasMatch = false;
            for (const [key, value] of Object.entries(val as Record<string, unknown>)) {
                if (key.toLowerCase().includes(q)) {
                    result[key] = value;
                    hasMatch = true;
                    continue;
                }
                const childResult = walk(value);
                if (childResult !== undefined) {
                    result[key] = childResult;
                    hasMatch = true;
                }
            }
            return hasMatch ? result : undefined;
        }
        return primitiveMatches(val) ? val : undefined;
    };

    const result = walk(data);
    return result === undefined ? {} : result;
}

interface SearchableJsonViewProps {
    value: unknown;
    placeholder?: string;
}

export default function SearchableJsonView({
    value,
    placeholder = "Search",
}: SearchableJsonViewProps) {
    const [query, setQuery] = useState<string>("");

    const filteredValue = useMemo(() => filterJsonBySearch(value, query) as object, [value, query]);

    return (
        <div className="space-y-3">
            <div className="relative">
                <SearchField
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    containerClassName="w-full"
                />
                {query ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Clear search"
                        onClick={() => setQuery("")}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                    >
                        <XMarkIcon className="size-4" />
                    </Button>
                ) : null}
            </div>
            <AppJsonViewer
                value={filteredValue}
                className={cn(
                    "min-h-[320px] rounded-lg border border-n-40 bg-surface-elevated p-3",
                    "dark:border-border-default dark:bg-surface-muted"
                )}
            />
        </div>
    );
}
