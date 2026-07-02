import { FC } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/Shadcn/Button";
import { cn } from "@/lib/utils";
import { useDeveloperGuideShell } from "./DeveloperGuideShellContext";
import type { DeveloperGuideNavBackButtonProps } from "./navTypes";

/** Sidebar expand toggle — fixed on the left edge, aligned with the breadcrumb bar. */
const DeveloperGuideNavBackButton: FC<DeveloperGuideNavBackButtonProps> = ({ className = "" }) => {
    const { navSidebarOpen, openNavSidebar } = useDeveloperGuideShell();

    if (navSidebarOpen) return null;

    return (
        <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={openNavSidebar}
            className={cn(
                "h-7 w-12 shrink-0 rounded-3xl border-n-40 bg-brand-light text-brand-normal hover:bg-brand-light-active hover:text-brand-normal-hover",
                className
            )}
            aria-label="Open navigation"
            title="Open navigation"
        >
            <ArrowRightIcon className="size-4" aria-hidden />
        </Button>
    );
};

export default DeveloperGuideNavBackButton;
