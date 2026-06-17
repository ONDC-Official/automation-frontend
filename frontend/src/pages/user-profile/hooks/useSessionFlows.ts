import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { apiClient } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";
import { SessionCache } from "@/types/session-types";
import { Flow } from "@/types/flow-types";
import { buildFlowRows } from "@pages/user-profile/utils/buildFlowRows";
import type { FlowStatus, IFlowRow, Session } from "@pages/user-profile/types";

export const useSessionFlows = (session: Session, isExpanded: boolean) => {
    const [flowRows, setFlowRows] = useState<IFlowRow[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const detailFetched = useRef(false);

    useEffect(() => {
        if (!isExpanded || detailFetched.current) return;

        detailFetched.current = true;
        setLoadingDetail(true);

        const fetchFlows = async () => {
            try {
                const resultMap = session.flowMap ?? {};
                const deriveStatus = (id: string): FlowStatus =>
                    resultMap[id] === "PASS" || resultMap[id] === "FAIL" || resultMap[id] === "RUN"
                        ? resultMap[id]
                        : "NOT_RUN";

                if (session.domain && session.version && session.usecaseId) {
                    const res = await apiClient.get<{ data: { flows: Flow[] } }>(
                        API_ROUTES.CONFIG.FLOWS,
                        {
                            params: {
                                domain: session.domain,
                                version: session.version,
                                usecase: session.usecaseId,
                            },
                        }
                    );
                    setFlowRows(buildFlowRows(res.data?.data?.flows ?? [], deriveStatus));
                    return;
                }

                const res = await apiClient.get<SessionCache>(API_ROUTES.SESSIONS.BASE, {
                    params: { session_id: session.sessionId },
                });
                const detail = res.data;
                const attemptedMap = detail.flowMap ?? {};
                const flowConfigs = detail.flowConfigs ?? {};

                if (Object.keys(flowConfigs).length > 0) {
                    setFlowRows(
                        buildFlowRows(flowConfigs, (id) =>
                            resultMap[id] === "PASS" || resultMap[id] === "FAIL"
                                ? resultMap[id]
                                : id in attemptedMap
                                  ? "RUN"
                                  : "NOT_RUN"
                        )
                    );
                    return;
                }

                setFlowRows(
                    Object.keys(attemptedMap).map((id) => ({
                        id,
                        name: id.replace(/_/g, " "),
                        type: "OPTIONAL",
                        status: "NOT_RUN" as FlowStatus,
                    }))
                );
            } catch (e) {
                console.error("Failed to fetch session flows", e);
                toast.error("Failed to load session details");
                detailFetched.current = false;
            } finally {
                setLoadingDetail(false);
            }
        };

        fetchFlows();
    }, [
        isExpanded,
        session.domain,
        session.flowMap,
        session.sessionId,
        session.usecaseId,
        session.version,
    ]);

    return { flowRows, loadingDetail };
};
