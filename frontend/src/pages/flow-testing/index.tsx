import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { DocumentTextIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import RenderFlows from "@components/FlowShared/render-flows";
import Spinner from "@/components/Shadcn/Spinner";
import { apiClient } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";
import { Flow } from "@/types/flow-types";

export default function FlowTestingWrapper() {
    const [searchParams] = useSearchParams();
    const [flows, setFlows] = useState<Flow[]>([]);
    const [loading, setLoading] = useState(true);

    const sessionId = searchParams.get("sessionId");
    const subscriberUrl = searchParams.get("subscriberUrl");
    const role = searchParams.get("role");

    const fetchSessionData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get<{ flowConfigs?: Record<string, Flow> }>(
                API_ROUTES.SESSIONS.BASE,
                { params: { session_id: sessionId } }
            );

            if (response.data.flowConfigs) {
                setFlows(Object.values(response.data.flowConfigs));
            } else {
                toast.error("No flow configurations found in session");
            }
        } catch (error: unknown) {
            console.error("Error fetching session data:", error);
            toast.error("Failed to load session data");
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

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
                <h2 className="mb-2 text-h5 font-semibold text-text-primary">No Flows Found</h2>
                <p className="text-body-2 text-text-secondary">
                    No flow configurations found for this session.
                </p>
            </div>
        </div>
    ) : (
        <div className="max-w-7xl mx-auto w-full min-h-screen bg-surface-page">
            <RenderFlows
                flows={flows}
                subUrl={decodeURIComponent(subscriberUrl)}
                sessionId={sessionId}
            />
        </div>
    );
}
