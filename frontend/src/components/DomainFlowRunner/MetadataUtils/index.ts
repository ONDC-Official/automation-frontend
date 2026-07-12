import { Flow, MetadataField } from "@/types/flow-types";
import { SessionCache, SessionMetadataValue } from "@/types/session-types";
import { queryJsonPath } from "@utils/jsonpath-query";
import { store } from "@store/index";
import { upsertSession } from "@store/slices/sessionHistorySlice";

export type SideViewResponse = {
    res?: Array<{ response?: Record<string, unknown> }>;
    [key: string]: unknown;
};

export type SideViewState = {
    payloadId?: string;
    request?: Record<string, unknown>;
    response?: SideViewResponse;
    [key: string]: unknown;
};

export function extractMetadataFromFlows(flows: Flow[]): Record<string, MetadataField[]> {
    const flowMetadataMap: Record<string, MetadataField[]> = {};

    flows.forEach((flow) => {
        const flowMetadata: MetadataField[] = [];

        flow.sequence.forEach((step) => {
            const metadataArray = step["meta-data"] || step.metadata;

            if (metadataArray && Array.isArray(metadataArray) && metadataArray.length > 0) {
                flowMetadata.push(...metadataArray);
            }
        });

        flowMetadataMap[flow.id] = flowMetadata;
    });

    return flowMetadataMap;
}

export function extractMetadataByFlowName(
    flowMetadataMap: Record<string, MetadataField[]>,
    flowName: string
): MetadataField[] {
    return flowMetadataMap[flowName] || [];
}

export function extractMetadataValues(
    payload: Record<string, unknown> | Record<string, unknown>[],
    metadataFields: MetadataField[]
): Record<string, SessionMetadataValue> {
    const extractedData: Record<string, SessionMetadataValue> = {};

    metadataFields.forEach((meta) => {
        try {
            const payloadData = Array.isArray(payload) ? payload[0] : payload;
            const result = queryJsonPath(payloadData, meta.path);

            const value = result.length > 0 ? result[0] : null;

            const displayValue =
                value === null ||
                value === undefined ||
                value === "" ||
                (typeof value === "string" && value.trim() === "") ||
                (Array.isArray(value) && value.length === 0) ||
                (typeof value === "object" && value !== null && Object.keys(value).length === 0)
                    ? "Data not available"
                    : value;

            extractedData[meta.description.name] = {
                value: displayValue,
            };
        } catch (error: unknown) {
            extractedData[meta.description.name] = {
                name: meta.description.name,
                value: "Data not available",
                errorMessage: error instanceof Error ? error.message : "Unknown error",
            };
        }
    });

    return extractedData;
}

export function sessionCacheMeaningfullyChanged(prev: SessionCache, next: SessionCache): boolean {
    return (
        prev.activeFlow !== next.activeFlow ||
        JSON.stringify(prev.flowMap) !== JSON.stringify(next.flowMap)
    );
}

export function upsertFlowSession(sessionData: SessionCache, sessionId: string) {
    if (sessionData.usecaseId === "PLAYGROUND-FLOW") {
        return;
    }
    const now = new Date();
    store.dispatch(
        upsertSession({
            sessionId: sessionId,
            subscriberUrl: sessionData.subscriberUrl,
            role: sessionData.npType,
            timestamp: now.toISOString(),
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        })
    );
}
