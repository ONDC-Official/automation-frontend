import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { DocumentTextIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import RenderFlows from "@components/DomainFlowRunner/RenderFlows";
import Spinner from "@components/Shadcn/Spinner";
import { useLazyGetFlowsQuery, useLazyGetSessionByIdQuery } from "@store/api";
import { Flow } from "@/types/flow-types";

type SessionFlowResponse = {
    flowConfigs?: Record<string, Flow>;
    domain?: string;
    version?: string;
    usecaseId?: string;
};

/** Session Redis can lose flow.tags during a run; restore from config for filters. */
async function hydrateFlowTagsFromConfig(
    flows: Flow[],
    session: SessionFlowResponse,
    fetchFlows: ReturnType<typeof useLazyGetFlowsQuery>[0]
): Promise<Flow[]> {
    const hasTags = flows.some((f) => (f.tags?.length ?? 0) > 0);
    if (hasTags || !session.domain || !session.version || !session.usecaseId) {
        return flows;
    }

    try {
        const configResponse = await fetchFlows({
            domain: session.domain,
            version: session.version,
            usecase: session.usecaseId,
        }).unwrap();
        const configFlows = configResponse?.data?.flows ?? [];
        const tagsById = new Map(
            configFlows.map((f) => [f.id, f.tags as string[] | undefined] as const)
        );
        return flows.map((flow) => {
            const tags = tagsById.get(flow.id);
            return tags?.length ? { ...flow, tags: tags as Flow["tags"] } : flow;
        });
    } catch (error) {
        console.error("Failed to hydrate flow tags from config", error);
        return flows;
    }
}

export default function FlowTestingWrapper() {
    const [searchParams] = useSearchParams();
    const [flows, setFlows] = useState<Flow[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchFailed, setFetchFailed] = useState(false);

    const sessionId = searchParams.get("sessionId");
    const subscriberUrl = searchParams.get("subscriberUrl");
    const role = searchParams.get("role");
    const [triggerGetSessionById] = useLazyGetSessionByIdQuery();
    const [triggerGetFlows] = useLazyGetFlowsQuery();

    const fetchSessionData = useCallback(async () => {
        try {
            setLoading(true);
            setFetchFailed(false);
            const response = (await triggerGetSessionById({
                sessionId: sessionId ?? "",
            }).unwrap()) as SessionFlowResponse;
            const flowConfigs = response.flowConfigs;

            if (flowConfigs) {
                const flowList = await hydrateFlowTagsFromConfig(
                    Object.values(flowConfigs),
                    response,
                    triggerGetFlows
                );
                setFlows(flowList);
            } else {
                toast.error("No flow configurations found in session");
            }
        } catch (error: unknown) {
            console.error("Error fetching session data:", error);
            toast.error("Failed to load session data");
            setFetchFailed(true);
        } finally {
            setLoading(false);
        }
    }, [sessionId, triggerGetSessionById, triggerGetFlows]);

    useEffect(() => {
        if (!sessionId || !subscriberUrl || !role) {
            toast.error("Missing required parameters for flow testing");
            setLoading(false);
            return;
        }

        fetchSessionData();
    }, [sessionId, subscriberUrl, role, fetchSessionData]);

    return loading ? (
        <div className="flex min-h-screen items-center justify-center bg-surface-page">
            <div className="text-center">
                <Spinner className="mx-auto mb-4 size-12 text-brand-normal" />
                <h2 className="mb-2 text-h5 font-semibold text-text-primary">
                    Loading Flow Session
                </h2>
                <p className="text-body-2 text-text-secondary">
                    Fetching session data for flow testing...
                </p>
            </div>
        </div>
    ) : !sessionId || !subscriberUrl || !role ? (
        <div className="flex min-h-screen items-center justify-center bg-surface-page">
            <div className="text-center">
                <ExclamationTriangleIcon className="mx-auto mb-4 size-16 text-error-500" />
                <h2 className="mb-2 text-h5 font-semibold text-text-primary">
                    Invalid Flow Session
                </h2>
                <p className="text-body-2 text-text-secondary">
                    Missing required parameters. Please create a new flow session from the
                    playground.
                </p>
            </div>
        </div>
    ) : flows.length === 0 ? (
        <div className="flex min-h-screen items-center justify-center bg-surface-page">
            <div className="text-center">
                <DocumentTextIcon className="mx-auto mb-4 size-16 text-alert-500" />
                <h2 className="mb-2 text-h5 font-semibold text-text-primary">
                    {fetchFailed ? "Couldn't Load Flows" : "No Flows Found"}
                </h2>
                <p className="text-body-2 text-text-secondary">
                    {fetchFailed
                        ? "We couldn't load this session's flow data. Please try again."
                        : "No flow configurations found for this session."}
                </p>
            </div>
        </div>
    ) : (
        <div className="mx-auto px-5 sm:px-8 md:px-10 lg:px-15 xl:px-20 w-full min-h-screen bg-surface-page">
            <RenderFlows
                flows={flows}
                subUrl={decodeURIComponent(subscriberUrl)}
                sessionId={sessionId}
            />
        </div>
    );
}
