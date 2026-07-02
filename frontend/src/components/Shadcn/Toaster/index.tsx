import { useEffect } from "react";
import { Toaster as Sonner, toast, type ToasterProps, type ExternalToast } from "sonner";
import { useTheme } from "@/context/theme/themeContext";

interface IToasterProps extends ToasterProps {
    initialToastMessage?: string;
    initialToastOptions?: Omit<ExternalToast, "description">;
}

export const Toaster = ({
    position = "bottom-right",
    duration = 3000,
    initialToastMessage,
    initialToastOptions,
    ...rest
}: IToasterProps) => {
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        if (!initialToastMessage) return;

        let id: string | number | undefined;
        const timeoutId = setTimeout(() => {
            id = toast(initialToastMessage, initialToastOptions);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            if (id !== undefined) toast.dismiss(id);
        };
    }, [initialToastMessage, initialToastOptions]);

    return (
        <Sonner
            theme={resolvedTheme}
            className="toaster group z-80"
            position={position}
            duration={duration}
            toastOptions={{
                classNames: {
                    toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                },
            }}
            {...rest}
        />
    );
};
