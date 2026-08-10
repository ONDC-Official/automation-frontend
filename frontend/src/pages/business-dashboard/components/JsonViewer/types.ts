export interface IProps {
    /** any JSON-serialisable value */
    data: unknown;
    /** collapse depth on first render; nodes deeper than this start closed */
    initialDepth?: number;
    /** rows taller than this scroll inside the viewer */
    maxHeightClassName?: string;
    className?: string;
}

export interface INodeProps {
    nodeKey: string;
    value: unknown;
    depth: number;
    path: string;
    expanded: Set<string>;
    onToggle: (path: string) => void;
    search: string;
}
