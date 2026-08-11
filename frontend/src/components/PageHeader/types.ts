import type { ReactNode } from "react";

export interface IProps {
    title: string;
    description?: string;
    /** right-aligned action row (buttons, exports, refresh) */
    actions?: ReactNode;
    className?: string;
}
