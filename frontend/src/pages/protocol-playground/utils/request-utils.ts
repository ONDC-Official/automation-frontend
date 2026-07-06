import {
    convertToFlowConfig,
    MockPlaygroundConfigType,
    createOptimizedMockConfig,
} from "@ondc/automation-mock-runner";
import { toast } from "sonner";
import { SessionCache } from "@/types/session-types";

export async function createFlowSessionWithPlayground(
    config: MockPlaygroundConfigType,
    subscriberUrl: string,
    type: "BAP" | "BPP",
    createPlaygroundSession: (args: {
        sessionData: unknown;
        playgroundConfig: unknown;
    }) => Promise<{ data?: { sessionId: string } }>
): Promise<string | undefined> {
    try {
        const flowConfig = convertToFlowConfig(config);
        const newSession: SessionCache = {
            transactionIds: [],
            flowMap: {},
            subscriberUrl: subscriberUrl,
            npType: type,
            domain: config.meta.domain,
            version: config.meta.version,
            usecaseId: "PLAYGROUND-FLOW",
            env: "LOGGED-IN",
            sessionDifficulty: {
                sensitiveTTL: false,
                useGateway: false,
                stopAfterFirstNack: false,
                protocolValidations: true,
                timeValidations: true,
                headerValidaton: false,
                useGzip: false,
                encryptionValidation: false,
                useCare: false,
            },
            flowConfigs: {
                [flowConfig.id]: flowConfig,
            },
            activeFlow: null,
        };
        const result = await createPlaygroundSession({
            sessionData: newSession,
            playgroundConfig: await createOptimizedMockConfig(config),
        });
        if (!result.data) throw new Error("No session created");
        return result.data.sessionId;
    } catch (err) {
        toast.error("Error creating playground session");
        console.error("Error creating playground session:", err);
        return undefined;
    }
}
