import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XCircleIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { DismissableLayer } from "radix-ui/internal";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/theme/hooks/useTheme";

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
                // Semantic status icons colored via design tokens. The card itself
                // stays neutral (surface-elevated) so status is communicated by the
                // icon, not by tinting the whole toast.
                icons={{
                    success: <CheckCircleIcon className="size-5 text-success-500" />,
                    error: <XCircleIcon className="size-5 text-error-500" />,
                    warning: <ExclamationTriangleIcon className="size-5 text-alert-500" />,
                    info: <InformationCircleIcon className="size-5 text-brand-normal" />,
                    close: <XMarkIcon className="size-5" />,
                }}
                toastOptions={{
                    classNames: {
                        // Hug the content width (sonner defaults to a fixed 356px) and cap
                        // at the toaster column so long messages wrap. Shrunk absolute-
                        // positioned toasts must be re-anchored to their column edge.
                        toast: "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg !text-sm !w-fit !max-w-full data-[x-position=right]:!left-auto data-[x-position=right]:!right-0 data-[x-position=left]:!left-0 data-[x-position=left]:!right-auto",
                        // Top-align the status icon with the title line. Sonner's [data-icon]
                        // container is 16px by default, so a 20px icon overflows 2px above it
                        // and reads as floating above the text — size the container to the
                        // icon (20px, matching the text-sm line height) so their centers match.
                        icon: "!self-start !size-5",
                        // Title + description stack: bold title, muted description. When only
                        // a single message is passed (no description) sonner renders the title
                        // alone and this styling still applies cleanly.
                        title: "!font-semibold group-[.toast]:text-foreground",
                        description: "group-[.toast]:text-muted-foreground",
                        actionButton:
                            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                        cancelButton:
                            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                        // Close affordance: top-aligned on the right of the toast so it sits
                        // level with the title in multi-line toasts. The -mt offset centers
                        // the 32px hit area on the 20px title line. Neutral (muted-foreground)
                        // so it reads near-black in light mode and grey in dark mode.
                        closeButton:
                            "!static !left-auto !right-auto !top-auto !transform-none order-last ml-auto !self-start -mt-1.5 shrink-0 !h-8 !w-auto !rounded-md !border-0 !bg-transparent !px-2.5 !text-muted-foreground hover:!bg-accent hover:!text-accent-foreground dark:hover:!bg-accent/50 focus-visible:!ring-[3px] focus-visible:!ring-ring/50 focus-visible:!outline-none",
                    },
                }}
                {...rest}
            />
        </DismissableLayer.Branch>
    );
};
