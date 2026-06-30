import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/context/theme/themeContext";

export const Toaster = ({ ...props }: ToasterProps) => {
    const { resolvedTheme } = useTheme();

    return (
        <Sonner
            theme={resolvedTheme}
            className="toaster group z-80"
            position="bottom-right"
            duration={3000}
            toastOptions={{
                classNames: {
                    toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                },
            }}
            {...props}
        />
    );
};
