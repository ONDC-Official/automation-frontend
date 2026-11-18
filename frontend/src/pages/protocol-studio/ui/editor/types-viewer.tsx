import { useState } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { InspectorCodePane } from "@pages/protocol-studio/ui/editor/inspector/code-pane";
import { splitFileName } from "@pages/protocol-studio/ui/editor/inspector/constants";
import type { StudioTypeFile } from "@pages/protocol-studio/ui/editor/types";

/**
 * The generated declarations step code is checked against, one tab per file:
 * the spec's payloads, sessionData, the sandbox's globals, the helpers, and
 * the session schema they came from. Read-only: they regenerate from the spec,
 * the chosen use case and helpers.ts.
 */
export const TypesViewer = ({ files }: { files: StudioTypeFile[] }) => {
    const [activeId, setActiveId] = useState(files[0]?.id);
    const file = files.find(({ id }) => id === activeId) ?? files[0];
    if (!file) return null;

    return (
        <TabsPrimitive.Root
            value={file.id}
            onValueChange={setActiveId}
            className="flex min-h-0 flex-1 flex-col"
        >
            <TabsPrimitive.List className="studio-filepicker mx-3" aria-label="Type files">
                <div className="studio-filerow">
                    {files.map((entry) => {
                        const { base, ext } = splitFileName(entry.label);
                        return (
                            <TabsPrimitive.Trigger
                                key={entry.id}
                                value={entry.id}
                                className="studio-file"
                                title={entry.description}
                            >
                                <span className="studio-file-name">
                                    {base}
                                    <span className="studio-file-ext">{ext}</span>
                                </span>
                            </TabsPrimitive.Trigger>
                        );
                    })}
                </div>
            </TabsPrimitive.List>
            <p className="studio-text-dim truncate px-4 pt-2 text-[12px]" title={file.description}>
                {file.description}
            </p>
            <TabsPrimitive.Content
                value={file.id}
                className="studio-well m-3 mt-1.5 min-h-0 flex-1 outline-none"
            >
                <InspectorCodePane
                    path={`studio-view://types/${file.label}`}
                    language={file.language}
                    value={file.content}
                    readOnly
                />
            </TabsPrimitive.Content>
        </TabsPrimitive.Root>
    );
};

export default TypesViewer;
