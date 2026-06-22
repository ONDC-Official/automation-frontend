import { type FC, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface GuideHeaderProps {
    className?: string;
    children: ReactNode;
}

/** Sticky `bg-white/90 backdrop-blur-md border-b` shell shared by FlowPageHeader and ValidationsPage. */
const GuideHeader: FC<GuideHeaderProps> = ({ className, children }) => (
    <header
        className={cn(
            "z-20 bg-white/90 dark:bg-surface-elevated/90 backdrop-blur-md border-b border-gray-200",
            className
        )}
    >
        {children}
    </header>
);

export default GuideHeader;
