import { XMarkIcon } from "@heroicons/react/24/outline";
import { DismissableLayer } from "radix-ui/internal";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/context/theme/themeContext";

export const Toaster = ({ position = "bottom-right", duration = 3000, ...rest }: ToasterProps) => {
    const { resolvedTheme } = useTheme();

    return (
        // Marks the toast layer as a "branch" so Radix's DismissableLayer (Dialog,
        // Popover, Select, ...) doesn't treat clicks on toasts as outside clicks
        // and dismiss the open layer. See @radix-ui/react-dismissable-layer.
        <DismissableLayer.Branch>
            <Sonner
                theme={resolvedTheme}
                className="toaster group z-80 pointer-events-auto"
                position={position}
                duration={duration}
                closeButton
                icons={{ close: <XMarkIcon className="size-5" /> }}
                toastOptions={{
                    classNames: {
                        toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                        description: "group-[.toast]:text-muted-foreground",
                        actionButton:
                            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                        cancelButton:
                            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                        // Standard close affordance: inline on the right of the toast
                        // content row, matching the pre-existing scenario tip-banner close
                        // action (ghost Button, size-5 brand-normal XMarkIcon, no fill/border).
                        closeButton:
                            "!static !left-auto !right-auto !top-auto !transform-none order-last ml-auto shrink-0 !h-8 !w-auto !rounded-md !border-0 !bg-transparent !px-2.5 !text-brand-normal hover:!bg-accent hover:!text-accent-foreground dark:hover:!bg-accent/50 focus-visible:!ring-[3px] focus-visible:!ring-ring/50 focus-visible:!outline-none",
                    },
                }}
                {...rest}
            />
        </DismissableLayer.Branch>
    );
};
