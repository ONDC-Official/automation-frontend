import { type FC } from "react";
import { CodeBracketIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import type { SchemaView } from "./types";
import { Button } from "@/components/Shadcn/Button";
import { cn } from "@/lib/utils";

interface SchemaViewToggleProps {
    view: SchemaView;
    onChange: (view: SchemaView) => void;
}

const TOGGLE_OPTIONS: { id: SchemaView; label: string; icon: typeof ListBulletIcon }[] = [
    { id: "schema", label: "Schema", icon: ListBulletIcon },
    { id: "raw", label: "Raw JSON", icon: CodeBracketIcon },
];

const toggleBtnClass = (isActive: boolean) =>
    cn(
        "h-auto min-h-6 gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium shadow-none",
        "hover:!bg-transparent dark:hover:!bg-transparent",
        isActive
            ? "!bg-white !text-slate-800 shadow-xs hover:!bg-white dark:!bg-surface-elevated dark:!text-n-0 dark:hover:!bg-surface-elevated"
            : "!bg-transparent !text-slate-500 hover:!text-slate-700 dark:!text-n-60 dark:hover:!text-n-0"
    );

/** Schema/Raw JSON toggle shared by RequestTab and ResponseTab. */
const SchemaViewToggle: FC<SchemaViewToggleProps> = ({ view, onChange }) => (
    <div
        className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-surface-muted"
        role="group"
        aria-label="Schema view"
    >
        {TOGGLE_OPTIONS.map(({ id, label, icon: Icon }) => {
            const isActive = view === id;

            return (
                <Button
                    key={id}
                    type="button"
                    variant="ghost"
                    size="xs"
                    aria-pressed={isActive}
                    onClick={() => onChange(id)}
                    className={toggleBtnClass(isActive)}
                >
                    <Icon className="size-3.5" aria-hidden />
                    {label}
                </Button>
            );
        })}
    </div>
);

export default SchemaViewToggle;
