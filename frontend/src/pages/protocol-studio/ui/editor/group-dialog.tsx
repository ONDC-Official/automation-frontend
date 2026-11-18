import { useEffect, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { RectangleGroupIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { GROUP_TEMPLATES, NODE_KINDS } from "@pages/protocol-studio/ui/editor/graph/catalog";
import type { StudioNode } from "@pages/protocol-studio/ui/editor/types";

export interface IGroupDialogProps {
    open: boolean;
    /** The nodes on the level being grouped. */
    nodes: StudioNode[];
    /** Ticked when the dialog opens. */
    preselected: string[];
    /** The editor root: the popup portals into it, so it keeps the Studio theme and fullscreen. */
    container: HTMLElement | null;
    onClose: () => void;
    onCreate: (nodeIds: string[], name: string, description: string) => void;
}

/**
 * "Group nodes…": picks the nodes to fold into a sub-protocol and asks for a
 * name and a description. Both are required — a collapsed group is only
 * useful if a reader can tell what it is without opening it.
 */
export const GroupDialog = ({
    open,
    nodes,
    preselected,
    container,
    onClose,
    onCreate,
}: IGroupDialogProps) => {
    const [picked, setPicked] = useState<Set<string>>(new Set(preselected));
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (open) {
            setPicked(new Set(preselected));
            setName("");
            setDescription("");
        }
        // Reset on open only; `preselected` is read then.
    }, [open]);

    const toggle = (id: string) =>
        setPicked((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const canCreate = picked.size > 0 && name.trim() !== "" && description.trim() !== "";

    return (
        <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogPrimitive.Portal container={container}>
                <DialogPrimitive.Overlay className="studio-dialog-overlay" />
                <DialogPrimitive.Content className="studio-glass studio-form-dialog">
                    <header className="flex items-center gap-3 px-4 pt-3 pb-2">
                        <RectangleGroupIcon
                            className="studio-code-dialog-icon"
                            aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                            <DialogPrimitive.Title className="studio-code-dialog-title">
                                Group nodes
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Description className="studio-text-dim truncate text-[12px]">
                                Fold the ticked nodes into one sub-protocol. Wires crossing the edge
                                become its In and Then pins.
                            </DialogPrimitive.Description>
                        </div>
                        <DialogPrimitive.Close
                            className="studio-key studio-key-icon"
                            aria-label="Close"
                            title="Close"
                        >
                            <XMarkIcon />
                        </DialogPrimitive.Close>
                    </header>

                    <div className="studio-form-dialog-body">
                        <div className="bp-props-section">
                            <p className="studio-eyebrow">What it is</p>
                            <div className="bp-field" data-wide>
                                <label className="bp-field-label" htmlFor="group-name">
                                    name · required
                                </label>
                                <input
                                    id="group-name"
                                    className="bp-input"
                                    value={name}
                                    placeholder="e.g. Seller cancellation"
                                    autoFocus
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="bp-field" data-wide>
                                <label className="bp-field-label" htmlFor="group-desc">
                                    description · required
                                </label>
                                <textarea
                                    id="group-desc"
                                    className="bp-input"
                                    rows={3}
                                    value={description}
                                    placeholder="What happens inside, who starts it, how it ends"
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {GROUP_TEMPLATES.map((template) => (
                                    <button
                                        key={template.name}
                                        type="button"
                                        className="studio-key studio-key-xs"
                                        onClick={() => {
                                            setName(template.name);
                                            setDescription(template.description);
                                        }}
                                        title={template.description}
                                    >
                                        {template.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bp-props-section min-h-0">
                            <p className="studio-eyebrow">
                                Nodes on this level · {picked.size} of {nodes.length} ticked
                            </p>
                            <ul className="studio-well studio-picklist">
                                {nodes.map((node) => {
                                    const { Icon } = NODE_KINDS[node.kind];
                                    return (
                                        <li key={node.id}>
                                            <label className="studio-pick">
                                                <input
                                                    type="checkbox"
                                                    checked={picked.has(node.id)}
                                                    onChange={() => toggle(node.id)}
                                                />
                                                <span
                                                    className="bp-tree-kind"
                                                    data-kind={node.kind}
                                                >
                                                    <Icon />
                                                </span>
                                                <span className="studio-mono truncate">
                                                    {node.group?.name || node.id}
                                                </span>
                                                <span className="studio-text-faint ml-auto text-[11px]">
                                                    {node.group ? "group" : node.api}
                                                </span>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>

                    <footer className="flex items-center justify-end gap-2 px-4 pt-1 pb-3">
                        <button type="button" className="studio-key" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="studio-key"
                            data-active
                            disabled={!canCreate}
                            title={
                                canCreate
                                    ? undefined
                                    : "Tick at least one node and give the group a name and a description"
                            }
                            onClick={() => onCreate([...picked], name.trim(), description.trim())}
                        >
                            <RectangleGroupIcon />
                            Create group
                        </button>
                    </footer>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};

export default GroupDialog;
