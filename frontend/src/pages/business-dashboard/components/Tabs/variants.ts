import { cva } from "class-variance-authority";

export const tabsListVariants = cva("inline-flex items-center gap-1", {
    variants: {
        variant: {
            default: "h-9 w-fit justify-center rounded-lg bg-muted p-1",
            underline: "h-9 w-full justify-start border-b border-border",
        },
    },
    defaultVariants: { variant: "default" },
});

export const tabsTriggerVariants = cva(
    "inline-flex flex-1 items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default:
                    "h-7 rounded-md px-3 text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs",
                underline:
                    "h-9 flex-none border-b-2 border-transparent px-3 text-muted-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground",
            },
        },
        defaultVariants: { variant: "default" },
    }
);
