import { type FC, useState } from "react";
import { Button } from "@/components/Shadcn/Button/button";
import { DESC_CHAR_LIMIT } from "./constants";

const TruncatedDescription: FC<{ text: string }> = ({ text }) => {
    const [expanded, setExpanded] = useState(false);
    if (text.length <= DESC_CHAR_LIMIT) {
        return <span>{text}</span>;
    }
    return (
        <span>
            {expanded ? text : `${text.slice(0, DESC_CHAR_LIMIT)}…`}
            <Button
                type="button"
                variant="ghost"
                onClick={() => setExpanded((v) => !v)}
                className="h-auto rounded-none p-0 ml-1 text-[11px] text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 font-medium cursor-pointer"
            >
                {expanded ? "less" : "more"}
            </Button>
        </span>
    );
};

export default TruncatedDescription;
