import type { ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";

import type { alertVariants } from "./alert";

export interface IAlertProps extends VariantProps<typeof alertVariants> {
    message: ReactNode;
    description?: ReactNode;
    showIcon?: boolean;
    className?: string;
}
