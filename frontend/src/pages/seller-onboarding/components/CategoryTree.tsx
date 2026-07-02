import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface CategoryTreeNodeData {
    key: string;
    title: ReactNode;
    icon?: ReactNode;
    children?: CategoryTreeNodeData[];
}

interface CategoryTreeNodeProps {
    node: CategoryTreeNodeData;
}

const CategoryTreeNodeItem = ({ node }: CategoryTreeNodeProps) => {
    const hasChildren = !!node.children?.length;

    return (
        <li className="relative">
            <div className="flex items-center gap-2 py-1.5">
                {node.icon && <span className="shrink-0">{node.icon}</span>}
                <div>{node.title}</div>
            </div>
            {hasChildren && (
                <ul className="ml-2.5 space-y-0 border-l border-dashed border-n-30 pl-4">
                    {node.children!.map((child) => (
                        <CategoryTreeNodeItem key={child.key} node={child} />
                    ))}
                </ul>
            )}
        </li>
    );
};

interface CategoryTreeProps {
    data: CategoryTreeNodeData[];
    className?: string;
}

export const CategoryTree = ({ data, className }: CategoryTreeProps) => (
    <ul className={cn("space-y-1", className)}>
        {data.map((node) => (
            <CategoryTreeNodeItem key={node.key} node={node} />
        ))}
    </ul>
);

export default CategoryTree;
