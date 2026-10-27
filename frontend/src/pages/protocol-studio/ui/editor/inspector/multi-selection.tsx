import {
    ClipboardDocumentIcon,
    DocumentDuplicateIcon,
    RectangleGroupIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";

import { NODE_KINDS } from "@pages/protocol-studio/ui/editor/graph/catalog";
import { PropSection } from "@pages/protocol-studio/ui/editor/inspector/property-fields";
import { formatShortcut } from "@pages/protocol-studio/ui/editor/shortcuts";
import type { IMultiSelectionProps } from "@pages/protocol-studio/ui/editor/types";

/** Several nodes selected: what they are, and what can be done to all of them at once. */
export const MultiSelection = ({
    nodes,
    onDuplicate,
    onCopy,
    onGroup,
    onDelete,
}: IMultiSelectionProps) => (
    <div className="bp-props">
        <PropSection title={`${nodes.length} nodes`}>
            <div className="bp-cases">
                {nodes.map((node) => (
                    <p key={node.id} className="bp-props-note">
                        <span className="studio-mono studio-text">{node.id}</span> ·{" "}
                        {node.group ? "Sub-protocol" : NODE_KINDS[node.kind].label}
                    </p>
                ))}
            </div>
        </PropSection>

        <PropSection title="All of them">
            <div className="bp-cases">
                <button
                    type="button"
                    className="studio-key studio-key-sm"
                    onClick={onDuplicate}
                    title={`Duplicate, with the wires between them (${formatShortcut("D")})`}
                >
                    <DocumentDuplicateIcon />
                    Duplicate
                </button>
                <button
                    type="button"
                    className="studio-key studio-key-sm"
                    onClick={onCopy}
                    title={`Copy, to paste here or in another tab (${formatShortcut("C")})`}
                >
                    <ClipboardDocumentIcon />
                    Copy
                </button>
                <button
                    type="button"
                    className="studio-key studio-key-sm"
                    onClick={onGroup}
                    title="Fold them into a sub-protocol"
                >
                    <RectangleGroupIcon />
                    Group…
                </button>
            </div>
        </PropSection>

        <button
            type="button"
            className="studio-key studio-key-sm bp-props-delete"
            onClick={onDelete}
            title="Delete (Delete / Backspace)"
        >
            <TrashIcon />
            Delete {nodes.length} nodes
        </button>
    </div>
);

export default MultiSelection;
