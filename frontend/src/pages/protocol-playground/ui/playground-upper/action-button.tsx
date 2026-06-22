import { Button } from "@/components/Shadcn/Button/button";
import { cn } from "@/lib/utils";
import { ACTION_BUTTON_VARIANTS } from "@pages/protocol-playground/ui/playground-upper/constants";
import { IActionButtonProps } from "@pages/protocol-playground/ui/playground-upper/types";

export const ActionButton = ({ icon, label, onClick, variant = "default" }: IActionButtonProps) => (
    <Button
        onClick={(event) => {
            event.stopPropagation();
            onClick();
        }}
        className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2",
            "text-xs font-semibold transition-all duration-200",
            "hover:scale-[1.02] active:scale-[0.98]",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-elevated focus-visible:outline-none",
            ACTION_BUTTON_VARIANTS[variant]
        )}
    >
        {icon}
        <span>{label}</span>
    </Button>
);
