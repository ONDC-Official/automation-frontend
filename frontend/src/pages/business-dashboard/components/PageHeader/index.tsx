import { cn } from "@dashboard/lib/utils";
import type { IProps } from "./types";

const PageHeader = ({ title, description, actions, className }: IProps) => (
    <header
        data-slot="page-header"
        className={cn("flex flex-wrap items-start justify-between gap-3 pb-1", className)}
    >
        <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
);

export default PageHeader;
