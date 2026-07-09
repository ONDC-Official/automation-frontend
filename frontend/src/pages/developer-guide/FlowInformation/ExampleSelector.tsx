import { type FC } from "react";
import { ComboBoxControl } from "@components/Shadcn/ComboBox";
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
            className="text-caption-2-size font-semibold text-slate-500 uppercase tracking-wider shrink-0"
        >
            Example
        </label>
        <div className="relative w-full max-w-xs">
            <ComboBoxControl
                id="example-select"
                value={String(selectedIndex)}
                onValueChange={(value) => onChange(Number(value))}
                options={examples.map((ex, i) => ({ value: String(i), label: ex.name }))}
            />
        </div>
    </div>
);

export default ExampleSelector;
