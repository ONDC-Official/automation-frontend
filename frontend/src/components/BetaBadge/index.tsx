import { FC, ReactNode } from "react";
import { Badge } from "@components/Shadcn/Badge/badge";
import { cn } from "@/lib/utils";

/** Wraps `children` in a `position: relative` box and pins a small "Beta"
 * pill to its top-right corner, without affecting the wrapped element's own
 * layout — used to flag beta-scoped entry points (e.g. the Developer Guide
 * while VITE_ENABLE_DEV_GUIDE is enabled). */
const BetaBadge: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
    <span className={cn("relative inline-flex", className)}>
        {children}
        <Badge
            variant="default"
            className="absolute -top-2 -right-2 border-transparent px-1.5 py-0 text-[9px] leading-none text-white"
            style={{ backgroundColor: "rgb(245, 166, 35)" }}
        >
            Beta
        </Badge>
    </span>
);

export default BetaBadge;
