import type { Flow } from "@/types/flow-types";
import type { FlowStatus, IFlowRow } from "@pages/user-profile/types";

export const buildFlowRows = (
    flows: Record<string, Flow> | Flow[],
    deriveStatus: (id: string) => FlowStatus
): IFlowRow[] => {
    const entries = Array.isArray(flows)
        ? flows.map((flow) => [flow.id, flow] as const)
        : Object.entries(flows);

    return entries.map(([id, flow]) => {
        const tags = flow.tags ?? [];
        const type = tags.find((t) => ["MANDATORY", "OPTIONAL"].includes(t)) ?? "OPTIONAL";
        return { id, name: id, type, status: deriveStatus(id) };
    });
};
