import { FC } from "react";
import { Button } from "@components/Shadcn/Button";
import { cn } from "@/lib/utils";
import { DeveloperGuideNavSidebarIcon } from "./DeveloperGuideNavSidebarIcon";

export interface DeveloperGuideNavSidebarToggleProps {
    sidebarOpen: boolean;
    onClick: () => void;
    className?: string;
}

/** Stripe-docs-style sidebar toggle: plain ghost icon, no pill chrome. */
export const DeveloperGuideNavSidebarToggle: FC<DeveloperGuideNavSidebarToggleProps> = ({
    sidebarOpen,
    onClick,
    className,
}) => (
    <Button
        type="button"
        variant="ghost"
        onClick={onClick}
        className={cn(
            "size-7 shrink-0 rounded-md p-0 text-slate-600 hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-900 dark:hover:bg-white/10 dark:hover:text-slate-200",
            className
        )}
        aria-label={sidebarOpen ? "Collapse navigation" : "Open navigation"}
        title={sidebarOpen ? "Collapse navigation" : "Open navigation"}
    >
        <DeveloperGuideNavSidebarIcon sidebarOpen={sidebarOpen} />
    </Button>
);
