import { memo } from "react";
import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    type EdgeProps,
    type EdgeTypes,
} from "@xyflow/react";

import { EDGE_KINDS } from "@pages/protocol-studio/ui/editor/graph/catalog";
import type { StudioGraphEdge } from "@pages/protocol-studio/ui/editor/types";

/**
 * A Blueprint wire: a bezier from exec-out to exec-in, coloured by kind in
 * studio-editor.css. Every kind but `next` carries a label at its midpoint.
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

    return (
        <>
            <BaseEdge id={id} path={path} interactionWidth={18} />
            {edge && (edge.kind !== "next" || !edge.mandated || edge.case !== undefined) ? (
                <EdgeLabelRenderer>
                    <div
                        className="bp-edge-label"
                        data-kind={edge.kind}
                        data-selected={data.isSelected || undefined}
                        style={{
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        }}
                    >
                        {edge.case ?? EDGE_KINDS[edge.kind].label}
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
