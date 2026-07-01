import { useState } from "react";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { SCENARIO_TIP_BANNER_MESSAGE } from "@/pages/scenario/constants";
import { Button } from "@/components/Shadcn/Button";

const isDev = import.meta.env.VITE_ENVIRONMENT === "development";

export const ScenarioTipBanner = () => {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    return (
        <div
            role="status"
            className={cn(
                "fixed right-4 z-80 flex max-w-sm items-start gap-3 rounded-lg border border-border bg-background p-4 text-sm text-foreground shadow-lg",
                isDev ? "top-24" : "top-20"
            )}
        >
            <InformationCircleIcon
                className="mt-0.5 size-5 shrink-0 text-brand-normal"
                aria-hidden
            />
            <p className="flex-1 leading-relaxed">{SCENARIO_TIP_BANNER_MESSAGE}</p>
            <Button
                variant="ghost"
                onClick={() => setVisible(false)}
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Dismiss tip"
            >
                <XMarkIcon className="size-4" />
            </Button>
        </div>
    );
};
