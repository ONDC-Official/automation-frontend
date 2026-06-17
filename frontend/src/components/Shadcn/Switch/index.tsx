import { InformationCircleIcon } from "@heroicons/react/24/outline";
import CustomTooltip from "@components/ui/mini-components/tooltip";
import { Switch } from "@/components/Shadcn/Switch/switch";
import { cn } from "@/lib/utils";
import type { SwitchFieldGroupProps, SwitchFieldProps } from "@/components/Shadcn/Switch/types";

export const SwitchField = ({
    id,
    label,
    checked,
    onCheckedChange,
    info,
    disabled,
    className,
}: SwitchFieldProps) => (
    <div
        className={cn(
            "flex items-center justify-between rounded-lg border border-n-30 p-2 transition-colors",
            "hover:border-brand-light-active hover:bg-brand-light",
            "dark:border-border-default dark:hover:border-brand-normal/40 dark:hover:bg-surface-muted",
            className
        )}
    >
        <label htmlFor={id} className="cursor-pointer text-body-2 font-medium text-text-primary">
            {label}
        </label>
        <div className="flex items-center gap-2">
            <Switch
                id={id}
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
            />
            {info ? (
                <CustomTooltip content={info}>
                    <span
                        tabIndex={0}
                        aria-label={`Info: ${label}`}
                        className="shrink-0 cursor-help text-text-secondary transition-colors hover:text-brand-normal"
                    >
                        <InformationCircleIcon className="size-6 text-brand-normal" />
                    </span>
                </CustomTooltip>
            ) : null}
        </div>
    </div>
);

export const SwitchFieldGroup = ({
    title,
    subtitle,
    children,
    className,
    layout = "default",
}: SwitchFieldGroupProps) => (
    <section className={className}>
        {title ? (
            <h4 className="mb-1 text-left text-caption-1 font-regular tracking-wider text-text-secondary">
                {title}
            </h4>
        ) : null}
        {subtitle ? <p className="mb-3 text-caption-1 text-text-secondary">{subtitle}</p> : null}
        <div
            className={cn(
                "grid gap-y-2",
                layout === "single"
                    ? "grid-cols-1"
                    : "grid-cols-1 gap-x-6 sm:grid-cols-2 md:grid-cols-4"
            )}
        >
            {children}
        </div>
    </section>
);

export { Switch };
