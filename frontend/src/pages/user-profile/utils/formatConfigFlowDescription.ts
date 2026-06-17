import type { Flow } from "@/types/flow-types";
import { toTitleCase } from "@/utils/formatUtils";

const getStepLabel = (label?: string, type?: string): string | undefined => {
    if (label?.trim()) return label.trim();
    if (type?.trim()) return toTitleCase(type.trim());
    return undefined;
};

export const formatConfigFlowDescription = (flows: Flow[]): string | undefined => {
    if (!flows.length) return undefined;

    const primaryFlow = flows.find((flow) => flow.tags?.includes("MANDATORY")) ?? flows[0];
    const labels = primaryFlow.sequence
        .map((step) => getStepLabel(step.label, step.type))
        .filter((label): label is string => Boolean(label));

    const uniqueLabels = [...new Set(labels)];
    return uniqueLabels.length ? uniqueLabels.join(" → ") : undefined;
};
