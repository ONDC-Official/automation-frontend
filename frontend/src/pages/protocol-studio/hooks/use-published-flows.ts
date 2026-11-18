import { useMemo } from "react";

import { useGetSpecQuery } from "@store/api";
import { toPublishedFlow } from "@pages/protocol-studio/ui/editor/flows/published-flow";
import type { PublishedFlow, PublishedFlows } from "@pages/protocol-studio/ui/editor/types";

/**
 * Every flow the ONDC team has published for a domain + version, through the
 * developer guide's spec endpoint (cached for an hour). Each comes as a full v1
 * playground config, so its steps carry real code and default payloads.
 */
export const usePublishedFlows = (domain: string, version: string): PublishedFlows => {
    const { data, isLoading, isError, refetch } = useGetSpecQuery({
        domain,
        version,
        include: ["flows"],
    });

    const flows = useMemo(() => {
        const unique = new Map<string, PublishedFlow>();
        for (const entry of data?.["x-flows"] ?? []) {
            if (!entry.flowId) continue;
            const flow = toPublishedFlow(entry);
            if (!unique.has(flow.key)) unique.set(flow.key, flow);
        }
        return [...unique.values()];
    }, [data]);

    const byKey = useMemo(() => new Map(flows.map((flow) => [flow.key, flow])), [flows]);

    return {
        flows,
        byKey,
        isLoading,
        isError,
        refetch: () => void refetch(),
    };
};

export default usePublishedFlows;
