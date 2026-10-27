import { memo } from "react";
import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    type EdgeProps,
    type EdgeTypes,
} from "@xyflow/react";

import { EDGE_KINDS } from "@pages/protocol-studio/ui/editor/graph/catalog";
import type { StudioEdge, StudioGraphEdge } from "@pages/protocol-studio/ui/editor/types";

/** What a wire is called: its label, else the decision case, else its kind. */
export const getEdgeLabel = (edge: StudioEdge) =>
    edge.label?.trim() || edge.case || EDGE_KINDS[edge.kind].label;

/**
 * A Blueprint wire: a bezier from exec-out to exec-in, coloured by kind in
 * studio-editor.css. Every kind but a mandated `next` carries a label at its
 * midpoint; an alternative (one of several wires out of a pin) always does,
 * because that label is what tells the alternatives apart.
 */
const BlueprintEdgeBase = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
}: EdgeProps<StudioGraphEdge>) => {
    const [path, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.4,
    });
    const edge = data?.edge;
    if (!edge) return <BaseEdge id={id} path={path} interactionWidth={18} />;

    const isAlternative = data.isAlternative;
    const unnamed = isAlternative && !edge.label?.trim();
    const show =
        edge.kind !== "next" ||
        !edge.mandated ||
        edge.case !== undefined ||
        isAlternative ||
        !!edge.label;

    return (
        <>
            <BaseEdge id={id} path={path} interactionWidth={18} />
            {show ? (
                <EdgeLabelRenderer>
                    <div
                        className="bp-edge-label"
                        data-kind={edge.kind}
                        data-selected={data.isSelected || undefined}
                        data-alternative={isAlternative || undefined}
                        data-unnamed={unnamed || undefined}
                        data-lit={data.lit}
                        data-pending={data.pending || undefined}
                        style={{
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        }}
                        title={
                            unnamed
                                ? "An alternative without a name: give it one in the wire's properties"
                                : undefined
                        }
                    >
                        {unnamed ? "unnamed alternative" : getEdgeLabel(edge)}
                        {edge.mandated ? null : (
                            <span className="bp-edge-label-loose">· loose</span>
                        )}
                    </div>
                </EdgeLabelRenderer>
            ) : null}
        </>
    );
};

export const EDGE_TYPES: EdgeTypes = {
    studioEdge: memo(BlueprintEdgeBase),
};
