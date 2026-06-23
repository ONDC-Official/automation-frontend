import { type FC } from "react";
import { CodeBracketIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import type { SchemaView } from "./types";

interface SchemaViewToggleProps {
    view: SchemaView;
    onChange: (view: SchemaView) => void;
}

/** Schema/Raw JSON toggle shared by RequestTab and ResponseTab. */
const SchemaViewToggle: FC<SchemaViewToggleProps> = ({ view, onChange }) => (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
        <button
            type="button"
            onClick={() => onChange("schema")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === "schema"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
            }`}
        >
            <ListBulletIcon className="w-3.5 h-3.5" />
            Schema
        </button>
        <button
            type="button"
            onClick={() => onChange("raw")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === "raw"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
            }`}
        >
            <CodeBracketIcon className="w-3.5 h-3.5" />
            Raw JSON
        </button>
    </div>
);

export default SchemaViewToggle;
