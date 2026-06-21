import { type FC } from "react";
import { FiCode, FiList } from "react-icons/fi";
import type { SchemaView } from "./types";

interface SchemaViewToggleProps {
    view: SchemaView;
    onChange: (view: SchemaView) => void;
}

/** Schema/Raw JSON toggle shared by RequestTab and ResponseTab. */
const SchemaViewToggle: FC<SchemaViewToggleProps> = ({ view, onChange }) => (
    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
        <button
            type="button"
            onClick={() => onChange("schema")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === "schema"
                    ? "bg-white dark:bg-surface-elevated text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
            }`}
        >
            <FiList className="w-3.5 h-3.5" />
            Schema
        </button>
        <button
            type="button"
            onClick={() => onChange("raw")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === "raw"
                    ? "bg-white dark:bg-surface-elevated text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
            }`}
        >
            <FiCode className="w-3.5 h-3.5" />
            Raw JSON
        </button>
    </div>
);

export default SchemaViewToggle;
