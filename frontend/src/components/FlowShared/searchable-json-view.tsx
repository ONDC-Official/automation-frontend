import { useState } from "react";
import JsonView from "@uiw/react-json-view";
import { githubDarkTheme } from "@uiw/react-json-view/githubDark";
import { HiSearch, HiX } from "react-icons/hi";

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
    placeholder = "Search JSON (keys or values)...",
}: SearchableJsonViewProps) {
    const [query, setQuery] = useState<string>("");

    return (
        <div className="space-y-2">
            <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-9 pr-9 py-2 text-sm bg-white text-black shadow-sm rounded-md focus:outline-none focus:ring-1 placeholder-gray-500"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                        aria-label="Clear search"
                    >
                        <HiX className="w-4 h-4" />
                    </button>
                )}
            </div>
            <JsonView
                value={filterJsonBySearch(value, query) as object}
                style={githubDarkTheme}
                className="rounded-md"
                displayDataTypes={false}
            />
        </div>
    );
}
