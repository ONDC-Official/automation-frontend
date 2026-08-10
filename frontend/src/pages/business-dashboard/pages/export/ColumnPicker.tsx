import { Check, Lock } from "lucide-react";
import { Button } from "@components/Shadcn/Button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@components/Shadcn/Card/card";
import { cn } from "@pages/business-dashboard/lib/utils";
import { COLUMN_GROUPS, EXPORT_COLUMNS, LOCKED_COLUMN_IDS } from "./constants";

interface IProps {
    selected: string[];
    onToggleColumn: (id: string) => void;
    onSelectAll: () => void;
    onSelectDefaults: () => void;
}

const ColumnPicker = ({ selected, onToggleColumn, onSelectAll, onSelectDefaults }: IProps) => (
    <Card>
        <CardHeader>
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                    <CardTitle>Columns</CardTitle>
                    <CardDescription>
                        {selected.length} of {EXPORT_COLUMNS.length} columns, written in this order.
                    </CardDescription>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={onSelectDefaults}>
                        Defaults
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onSelectAll}>
                        Select all
                    </Button>
                </div>
            </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
            {COLUMN_GROUPS.map((group) => (
                <div key={group} className="flex flex-col gap-2">
                    <p className="text-muted-foreground text-xs font-medium">{group}</p>
                    <div className="flex flex-wrap gap-2">
                        {EXPORT_COLUMNS.filter((column) => column.group === group).map((column) => {
                            const isSelected = selected.includes(column.id);
                            const isLocked = LOCKED_COLUMN_IDS.includes(column.id);

                            return (
                                <button
                                    key={column.id}
                                    type="button"
                                    aria-pressed={isSelected}
                                    disabled={isLocked}
                                    onClick={() => onToggleColumn(column.id)}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                                        isSelected
                                            ? "bg-primary text-primary-foreground border-transparent"
                                            : "border-border text-muted-foreground hover:bg-muted",
                                        isLocked && "cursor-not-allowed opacity-80"
                                    )}
                                >
                                    {isLocked ? (
                                        <Lock className="size-3" />
                                    ) : (
                                        isSelected && <Check className="size-3" />
                                    )}
                                    {column.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </CardContent>
    </Card>
);

export default ColumnPicker;
