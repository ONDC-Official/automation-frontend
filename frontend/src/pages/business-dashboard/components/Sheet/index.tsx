import type { ComponentProps } from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@dashboard/lib/utils";

const Sheet = SheetPrimitive.Root;

export const SheetTrigger = (props: ComponentProps<typeof SheetPrimitive.Trigger>) => (
    <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
);

export const SheetClose = (props: ComponentProps<typeof SheetPrimitive.Close>) => (
    <SheetPrimitive.Close data-slot="sheet-close" {...props} />
);

export const SheetOverlay = ({
    className,
    ...props
}: ComponentProps<typeof SheetPrimitive.Overlay>) => (
    <SheetPrimitive.Overlay
        data-slot="sheet-overlay"
        className={cn(
            "bg-foreground/20 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in fixed inset-0 z-50 backdrop-blur-[1px]",
            className
        )}
        {...props}
    />
);

export const SheetContent = ({
    className,
    children,
    ...props
}: ComponentProps<typeof SheetPrimitive.Content>) => (
    <SheetPrimitive.Portal>
        <SheetOverlay />
        <SheetPrimitive.Content
            data-slot="sheet-content"
            className={cn(
                "border-border bg-background fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col gap-4 border-l shadow-lg outline-none sm:max-w-2xl",
                className
            )}
            {...props}
        >
            {children}
            <SheetPrimitive.Close
                aria-label="Close"
                className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 absolute top-4 right-4 rounded-sm p-1 transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
            >
                <X className="size-4" />
            </SheetPrimitive.Close>
        </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
);

export const SheetHeader = ({ className, ...props }: ComponentProps<"div">) => (
    <div
        data-slot="sheet-header"
        className={cn("border-border flex flex-col gap-1 border-b p-4 pr-12", className)}
        {...props}
    />
);

export const SheetBody = ({ className, ...props }: ComponentProps<"div">) => (
    <div
        data-slot="sheet-body"
        className={cn("flex-1 overflow-y-auto px-4 pb-4", className)}
        {...props}
    />
);

export const SheetFooter = ({ className, ...props }: ComponentProps<"div">) => (
    <div
        data-slot="sheet-footer"
        className={cn("border-border mt-auto flex items-center gap-2 border-t p-4", className)}
        {...props}
    />
);

export const SheetTitle = ({
    className,
    ...props
}: ComponentProps<typeof SheetPrimitive.Title>) => (
    <SheetPrimitive.Title
        data-slot="sheet-title"
        className={cn("text-foreground text-base font-semibold", className)}
        {...props}
    />
);

export const SheetDescription = ({
    className,
    ...props
}: ComponentProps<typeof SheetPrimitive.Description>) => (
    <SheetPrimitive.Description
        data-slot="sheet-description"
        className={cn("text-muted-foreground text-sm", className)}
        {...props}
    />
);

export default Sheet;
