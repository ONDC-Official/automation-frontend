import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface IProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    /** optional call to action, e.g. "Clear filters" */
    action?: ReactNode;
    className?: string;
}
