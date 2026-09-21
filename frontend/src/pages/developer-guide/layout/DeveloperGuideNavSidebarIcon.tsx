import { forwardRef, type SVGProps } from "react";
import { cn } from "@/lib/utils";

export interface DeveloperGuideNavSidebarIconProps extends SVGProps<SVGSVGElement> {
    /** When true, the sidebar is open — render the collapse icon. */
    sidebarOpen: boolean;
}

/** Collapse path from Stripe docs sidebar toggle (docs.stripe.com). */
const STRIPE_SIDEBAR_COLLAPSE_PATH =
    "M14.125 1c.483 0 .875.392.875.875v12.25a.875.875 0 0 1-1.75 0V1.875c0-.483.392-.875.875-.875Zm-6.899.867c.35.333.363.887.03 1.237L3.418 7.125h6.706a.875.875 0 0 1 0 1.75H3.487l3.754 3.757a.875.875 0 1 1-1.238 1.236L.756 8.618a.873.873 0 0 1-.014-1.222l5.247-5.5a.875.875 0 0 1 1.237-.03Z";

/**
 * Stripe-docs sidebar toggle: filled arrow + edge bar (16×16). Open state mirrors collapse
 * horizontally (Stripe only ships collapse in SSR; expand is the same glyph flipped).
 */
export const DeveloperGuideNavSidebarIcon = forwardRef<
    SVGSVGElement,
    DeveloperGuideNavSidebarIconProps
>(function DeveloperGuideNavSidebarIcon({ sidebarOpen, className, ...props }, ref) {
    return (
        <svg
            ref={ref}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className={cn("size-4", className)}
            aria-hidden
            {...props}
        >
            {sidebarOpen ? (
                <path fillRule="evenodd" clipRule="evenodd" d={STRIPE_SIDEBAR_COLLAPSE_PATH} />
            ) : (
                <g transform="scale(-1,1) translate(-16,0)">
                    <path fillRule="evenodd" clipRule="evenodd" d={STRIPE_SIDEBAR_COLLAPSE_PATH} />
                </g>
            )}
        </svg>
    );
});
