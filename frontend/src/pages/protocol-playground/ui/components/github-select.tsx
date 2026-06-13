import { useEffect, useMemo, useRef, useState } from "react";
import { FaSpinner, FaChevronDown } from "react-icons/fa";

export const Spinner = () => (
    <FaSpinner className="animate-spin text-sky-500 inline-block ml-2" size={13} />
);

export const SelectBox = ({
    label,
    value,
    options,
    disabled,
    loading,
    placeholder,
    onChange,
}: {
    label: string;
    value: string;
    options: string[];
    disabled: boolean;
    loading: boolean;
    placeholder: string;
    onChange: (v: string) => void;
}) => {
    const selectId = `select-${label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}`;

    const isDisabled = disabled || loading;

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [highlight, setHighlight] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // While closed, the input mirrors the selected value. While open, it holds the typed filter.
    const inputValue = open ? query : value;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((o) => o.toLowerCase().includes(q));
    }, [options, query]);

    // Close on outside click.
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const openMenu = () => {
        if (isDisabled) return;
        setQuery("");
        setHighlight(Math.max(0, options.indexOf(value)));
        setOpen(true);
    };

    const select = (opt: string) => {
        onChange(opt);
        setOpen(false);
        setQuery("");
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (isDisabled) return;
        if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
            openMenu();
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[highlight]) select(filtered[highlight]);
        } else if (e.key === "Escape") {
            setOpen(false);
            setQuery("");
        }
    };

    return (
        <div className="flex flex-col gap-1" ref={containerRef}>
            <label
                htmlFor={selectId}
                className="text-sm font-semibold text-gray-600 flex items-center gap-1"
            >
                {label}
                {loading && <Spinner />}
            </label>
            <div className="relative">
                <input
                    id={selectId}
                    type="text"
                    role="combobox"
                    aria-expanded={open}
                    aria-autocomplete="list"
                    autoComplete="off"
                    value={inputValue}
                    disabled={isDisabled}
                    placeholder={placeholder}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setHighlight(0);
                        if (!open) setOpen(true);
                    }}
                    onFocus={openMenu}
                    onKeyDown={onKeyDown}
                    className={`w-full appearance-none border rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-400 transition-colors
                    ${isDisabled ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white text-gray-800 border-sky-200 hover:border-sky-400 cursor-text"}`}
                />
                <FaChevronDown
                    size={11}
                    onClick={() => (open ? setOpen(false) : openMenu())}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform ${open ? "rotate-180" : ""} ${isDisabled ? "pointer-events-none" : "cursor-pointer"}`}
                />
                {open && (
                    <ul
                        role="listbox"
                        className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-sky-200 bg-white shadow-lg py-1 text-sm"
                    >
                        {filtered.length === 0 ? (
                            <li className="px-3 py-2 text-gray-400 select-none">No matches</li>
                        ) : (
                            filtered.map((opt, i) => (
                                <li
                                    key={opt}
                                    role="option"
                                    aria-selected={opt === value}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        select(opt);
                                    }}
                                    onMouseEnter={() => setHighlight(i)}
                                    className={`px-3 py-2 cursor-pointer truncate ${
                                        i === highlight ? "bg-sky-100 text-sky-800" : "text-gray-800"
                                    } ${opt === value ? "font-semibold" : ""}`}
                                >
                                    {opt}
                                </li>
                            ))
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
};
