import { type FC } from "react";
import { INDENT_PX } from "./constants";

const TreeIndent: FC<{ depth: number }> = ({ depth }) => {
    if (depth === 0) return null;

    return (
        <span className="inline-flex items-center shrink-0" style={{ width: depth * INDENT_PX }}>
            {Array.from({ length: depth }).map((_, i) => (
                <span key={i} className="inline-block h-full shrink-0" style={{ width: INDENT_PX }}>
                    {i === depth - 1 ? (
                        <span className="inline-block w-3 border-l border-b border-sky-400 dark:border-sky-500/50 h-3 ml-1.5 -mb-0.5" />
                    ) : (
                        <span className="inline-block border-l border-sky-400 dark:border-sky-500/50 h-full ml-1.5" />
                    )}
                </span>
            ))}
        </span>
    );
};

export default TreeIndent;
