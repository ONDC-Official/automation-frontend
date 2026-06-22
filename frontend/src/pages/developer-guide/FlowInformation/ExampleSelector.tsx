import { type FC } from "react";
import type { FlowExample } from "./types";

interface ExampleSelectorProps {
    examples: FlowExample[];
    selectedIndex: number;
    onChange: (index: number) => void;
}

const ExampleSelector: FC<ExampleSelectorProps> = ({ examples, selectedIndex, onChange }) => (
    <div className="flex items-center gap-3">
        <label
            htmlFor="example-select"
            className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0"
        >
            Example
        </label>
        <div className="relative w-full max-w-xs">
            <select
                id="example-select"
                value={selectedIndex}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full pl-4 pr-9 py-2 rounded-lg text-sm border border-slate-200 bg-white dark:bg-surface-elevated text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300 appearance-none shadow-xs"
            >
                {examples.map((ex, i) => (
                    <option key={i} value={i}>
                        {ex.name}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    </div>
);

export default ExampleSelector;
