import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                outline: "border border-border bg-background hover:bg-muted",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-muted hover:text-foreground",
                link: "text-foreground underline-offset-4 hover:underline",
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            },
            size: {
                sm: "h-8 px-3",
                default: "h-9 px-4",
                lg: "h-10 px-6",
                icon: "size-9",
            },
        },
        defaultVariants: { variant: "default", size: "default" },
    }
);
