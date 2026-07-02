import type { ReactNode } from "react";

import { Badge } from "@/components/Shadcn/Badge/badge";
import { cn } from "@/lib/utils";

const tagColorClasses = {
    blue: "border-blue-200 bg-blue-100 text-blue-800",
    purple: "border-purple-200 bg-purple-100 text-purple-800",
    orange: "border-orange-200 bg-orange-100 text-orange-800",
    cyan: "border-cyan-200 bg-cyan-100 text-cyan-800",
    green: "border-green-200 bg-green-100 text-green-800",
    red: "border-red-200 bg-red-100 text-red-800",
} as const;

export type TagColor = keyof typeof tagColorClasses;

interface TagProps {
    color?: TagColor;
    className?: string;
    children: ReactNode;
}

export const Tag = ({ color = "blue", className, children }: TagProps) => (
    <Badge variant="outline" className={cn(tagColorClasses[color], className)}>
        {children}
    </Badge>
);

interface CardProps {
    title?: ReactNode;
    small?: boolean;
    inner?: boolean;
    className?: string;
    children: ReactNode;
}

export const Card = ({ title, small = false, inner = false, className, children }: CardProps) => (
    <div
        className={cn(
            "rounded-lg border bg-white",
            inner ? "border-n-30 bg-n-10" : "border-n-30",
            small ? "p-3" : "p-4",
            className
        )}
    >
        {title && <div className="mb-3 font-medium">{title}</div>}
        {children}
    </div>
);
