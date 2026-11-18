import {
    ArrowRightEndOnRectangleIcon,
    RectangleGroupIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";

import { PropSection, TextField } from "@pages/protocol-studio/ui/editor/inspector/property-fields";
import {
    GROUP_IN,
    GROUP_OUT,
    type IGroupPropertiesProps,
} from "@pages/protocol-studio/ui/editor/types";

/**
 * A group's fields: its name and description — both required, so a reader
 * can tell what the sub-protocol is without opening it — and what it holds.
 */
export const GroupProperties = ({ node, actions, onEnter }: IGroupPropertiesProps) => {
    const { group } = node;
    const { nodes, edges } = group.graph;
    const entries = edges.filter((e) => e.from === GROUP_IN).map((e) => e.to);
    const exits = edges.filter((e) => e.to === GROUP_OUT).map((e) => e.from);

    return (
        <div className="bp-props">
            <PropSection title="Sub-protocol">
                <TextField
                    label="name"
                    hint="What this part of the protocol is, e.g. “Seller cancellation”"
                    value={group.name}
                    wide
                    placeholder="Required"
                    onChange={(name) => actions.updateGroup(node.id, { name })}
                />
                <TextField
                    label="description"
                    hint="A sentence or two a reader can skim: what happens inside, who starts it, how it ends"
                    value={group.description}
                    multiline
                    placeholder="Required — explain what this group covers"
                    onChange={(description) => actions.updateGroup(node.id, { description })}
                />
                <TextField
                    label="id"
                    hint="Unique on the graph; renaming rewires edges"
                    value={node.id}
                    mono
                    onCommit={(value) => actions.renameNode(node.id, value)}
                />
            </PropSection>

            <PropSection title="Inside">
                <div className="bp-cases">
                    <p className="bp-props-note">
                        {nodes.length} {nodes.length === 1 ? "node" : "nodes"} · {edges.length}{" "}
                        {edges.length === 1 ? "wire" : "wires"}
                    </p>
                    <p className="bp-props-note">
                        <span className="studio-mono">Entry →</span>{" "}
                        {entries.length > 0
                            ? entries.join(", ")
                            : "nothing wired from the Entry yet"}
                    </p>
                    <p className="bp-props-note">
                        <span className="studio-mono">→ Exit</span>{" "}
                        {exits.length > 0 ? exits.join(", ") : "nothing wired to the Exit"}
                    </p>
                    <button type="button" className="studio-key studio-key-sm" onClick={onEnter}>
                        <ArrowRightEndOnRectangleIcon />
                        Open the group
                    </button>
                    <button
                        type="button"
                        className="studio-key studio-key-sm"
                        onClick={() => actions.ungroup(node.id)}
                        title="Dissolve the group: its nodes rejoin this level"
                    >
                        <RectangleGroupIcon />
                        Ungroup
                    </button>
                </div>
            </PropSection>

            <button
                type="button"
                className="studio-key studio-key-sm bp-props-delete"
                onClick={() => actions.removeNode(node.id)}
                title="Deletes the group and everything inside it"
            >
                <TrashIcon />
                Delete group
            </button>
        </div>
    );
};

export default GroupProperties;
