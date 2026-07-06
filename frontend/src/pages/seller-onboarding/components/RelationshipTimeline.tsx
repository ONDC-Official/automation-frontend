import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface RelationshipTimelineItem {
    key: string;
    label?: ReactNode;
    dot?: ReactNode;
    content: ReactNode;
}

interface RelationshipTimelineProps {
    items: RelationshipTimelineItem[];
    className?: string;
}

export const RelationshipTimeline = ({ items, className }: RelationshipTimelineProps) => (
    <div className={cn(className)}>
        {items.map((item, index) => (
            <div key={item.key} className="grid grid-cols-[minmax(80px,140px)_28px_1fr] gap-4">
                <div className="pt-1 text-right text-sm text-gray-600">{item.label}</div>
                <div className="flex flex-col items-center">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-blue-600 bg-white text-xs">
                        {item.dot}
                    </span>
                    {index < items.length - 1 && (
                        <span className="w-px flex-1 bg-gray-300" aria-hidden />
                    )}
                </div>
                <div className={cn("min-w-0", index < items.length - 1 ? "pb-8" : "pb-1")}>
                    {item.content}
                </div>
            </div>
        ))}
    </div>
);

export default RelationshipTimeline;
