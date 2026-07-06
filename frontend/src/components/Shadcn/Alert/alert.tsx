import { cva } from "class-variance-authority";
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";

import { cn } from "@/lib/utils";

import type { IAlertProps } from "./types";

export const alertVariants = cva("flex gap-3 rounded-lg border p-4 text-sm", {
    variants: {
        variant: {
            info: "border-brand-light-active bg-brand-light text-brand-normal",
            success: "border-success-200 bg-success-50 text-success-800",
            warning: "border-alert-200 bg-alert-50 text-alert-800",
            error: "border-error-200 bg-error-50 text-error-800",
        },
        banner: {
            true: "rounded-none border-x-0",
            false: "",
        },
    },
    defaultVariants: {
        variant: "info",
        banner: false,
    },
});

const iconByVariant = {
    info: InformationCircleIcon,
    success: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    error: XCircleIcon,
};

export const Alert = ({
    variant = "info",
    banner = false,
    message,
    description,
    showIcon = true,
    className,
}: IAlertProps) => {
    const Icon = iconByVariant[variant ?? "info"];

    return (
        <div role="alert" className={cn(alertVariants({ variant, banner }), className)}>
            {showIcon && <Icon className="mt-0.5 size-5 shrink-0" />}
            <div className="flex flex-1 flex-col gap-1">
                <div className="font-medium">{message}</div>
                {description && <div className="text-current/80">{description}</div>}
            </div>
        </div>
    );
};

export default Alert;
