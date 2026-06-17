import { cn } from "@/lib/utils";
import { Button } from "@/components/Shadcn/Button/button";
import { useTheme } from "@/context/theme/themeContext";
import { MoonIcon, SunIcon } from "@heroicons/react/20/solid";

export const ThemeToggle = () => {
    const { isDark, toggleTheme } = useTheme();
    const Icon = isDark ? SunIcon : MoonIcon;

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
            <Icon className="size-4 text-brand-normal" />
        </Button>
    );
};
