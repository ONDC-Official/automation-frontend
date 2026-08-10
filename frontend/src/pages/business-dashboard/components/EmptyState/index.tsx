import { Inbox } from "lucide-react";
import { cn } from "@pages/business-dashboard/lib/utils";
import type { IProps } from "./types";

const EmptyState = ({ title, description, icon: Icon = Inbox, action, className }: IProps) => (
    <div
        data-slot="empty-state"
        className={cn(
            "flex flex-col items-center justify-center gap-2 px-6 py-14 text-center",
            className
        )}
    >
        <span className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
            <Icon className="size-5" />
        </span>
        <p className="text-sm font-medium">{title}</p>
        {description && (
            <p className="text-muted-foreground max-w-sm text-sm text-balance">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
    </div>
);

export default EmptyState;
