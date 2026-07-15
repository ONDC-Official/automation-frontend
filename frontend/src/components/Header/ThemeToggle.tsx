import { cn } from "@/lib/utils";
import { Button } from "@components/Shadcn/Button";
import { useTheme } from "@/theme/hooks/useTheme";
import { MoonIcon, SunIcon } from "@heroicons/react/20/solid";

export const ThemeToggle = () => {
    const { toggleTheme } = useTheme();

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            className={cn(
                "rounded-full border p-0 shadow-none hover:opacity-80",
                "dark:border-border-default dark:bg-surface-elevated"
            )}
        >
            {/* Visibility follows `.dark` (same tick as the view transition), not Redux isDark */}
            <SunIcon className="hidden size-4 text-alert-500 dark:block" />
            <MoonIcon className="size-4 text-brand-normal dark:hidden" />
        </Button>
    );
};
