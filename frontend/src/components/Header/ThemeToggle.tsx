import { MoonIcon, SunIcon } from "@heroicons/react/20/solid";
import { cn } from "@/lib/utils";
import { Button } from "@/components/shadcn/button";
import { useTheme } from "@/context/theme/themeContext";

export const ThemeToggle = () => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            className={cn(
                "rounded-full border p-0 shadow-none hover:opacity-80",
                isDark ? "border-border-default bg-surface-elevated" : "border-n-30 bg-n-0"
            )}
        >
            {isDark ? (
                <SunIcon className="size-4 text-brand-normal" />
            ) : (
                <MoonIcon className="size-4 text-brand-normal" />
            )}
        </Button>
    );
};
