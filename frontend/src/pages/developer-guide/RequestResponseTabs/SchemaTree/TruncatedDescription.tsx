import { type FC, useState } from "react";
import { DESC_CHAR_LIMIT } from "./constants";

const TruncatedDescription: FC<{ text: string }> = ({ text }) => {
    const [expanded, setExpanded] = useState(false);
    if (text.length <= DESC_CHAR_LIMIT) {
        return <span>{text}</span>;
    }
    return (
        <span>
            {expanded ? text : `${text.slice(0, DESC_CHAR_LIMIT)}…`}
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="ml-1 text-[11px] text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 font-medium cursor-pointer"
            >
                {expanded ? "less" : "more"}
            </button>
        </span>
    );
};

export default TruncatedDescription;
