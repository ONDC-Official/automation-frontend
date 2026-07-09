import type { ComponentProps } from "react";
import JsonPathInput from "@pages/protocol-playground/ui/json-path-input";

/** Card wrapper around a single saved/tentative JSONPath mapping row. */
export function SavedPathRow(props: ComponentProps<typeof JsonPathInput>) {
    return (
        <div className="bg-gray-800 p-3 rounded-lg border border-sky-500/30 flex items-center justify-between group hover:border-sky-500/50 transition-colors">
            <JsonPathInput {...props} />
        </div>
    );
}
