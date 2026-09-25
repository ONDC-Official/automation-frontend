import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLazyGetFlowsQuery, useLazyGetSessionByIdQuery } from "@store/api";
import { SessionCache } from "@/types/session-types";
import { buildFlowRows } from "@pages/user-profile/utils/buildFlowRows";
import type { FlowStatus, IFlowRow, Session } from "@pages/user-profile/types";

export const useSessionFlows = (session: Session, isExpanded: boolean) => {
    const [flowRows, setFlowRows] = useState<IFlowRow[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const detailFetched = useRef(false);
    const [triggerGetFlows] = useLazyGetFlowsQuery();
    const [triggerGetSessionById] = useLazyGetSessionByIdQuery();

    useEffect(() => {
        if (!isExpanded || detailFetched.current) return;

        detailFetched.current = true;
        setLoadingDetail(true);

        const fetchFlows = async () => {
            try {
                // Two independent sources, deliberately kept apart.
                //
                // `session.flowMap` is automation-db's VERDICT map — only "PASS" and
                // "FAIL" mean anything in it. Anything else is legacy pollution from
                // when the workbench backend stamped "RUN" into this field, and must
                // fall through to the attempted logic rather than be trusted.
                const resultMap = session.flowMap ?? {};
                const verdictOf = (id: string): FlowStatus | null =>
                    resultMap[id] === "PASS" || resultMap[id] === "FAIL" ? resultMap[id] : null;

                // Kicked off here so it overlaps the catalog fetch below; the two are
                // independent. Failure is swallowed on purpose — the Redis session
                // expires after four days and then 500s, which is normal for an old
                // session and must not fail the whole load.
                const detailPromise: Promise<SessionCache | undefined> = triggerGetSessionById({
                    sessionId: session.sessionId,
                })
                    .unwrap()
                    .then((res: unknown) => res as SessionCache)
                    .catch(() => undefined);

                /**
                 * "Was this flow started?" — answered from both sources, because
                 * each alone drops flows: `session.flows[]` is durable but written
                 * fire-and-forget on Start, so a failed POST loses one; the live
                 * Redis map is authoritative but gone once the session expires.
                 */
                const attemptedIn = (detail: SessionCache | undefined) => {
                    const attempted = new Set((session.flows ?? []).map((flow) => flow.id));
                    // A cleared flow keeps its key but loses its transaction id, so
                    // test the value — `id in flowMap` would count it forever.
                    for (const [id, transactionId] of Object.entries(detail?.flowMap ?? {})) {
                        if (transactionId != null) attempted.add(id);
                    }
                    return attempted;
                };

                const statusFrom =
                    (attempted: Set<string>) =>
                    (id: string): FlowStatus =>
                        verdictOf(id) ?? (attempted.has(id) ? "RUN" : "NOT_RUN");

                if (session.domain && session.version && session.usecaseId) {
                    const [res, detail] = await Promise.all([
                        triggerGetFlows({
                            domain: session.domain,
                            version: session.version,
                            usecase: session.usecaseId,
                        }),
                        detailPromise,
                    ]);
                    if (res.error) throw res.error;
                    setFlowRows(
                        buildFlowRows(res.data?.data?.flows ?? [], statusFrom(attemptedIn(detail)))
                    );
                    return;
                }

                const detail = await detailPromise;
                const attempted = attemptedIn(detail);
                const deriveStatus = statusFrom(attempted);
                const flowConfigs = detail?.flowConfigs ?? {};

                if (Object.keys(flowConfigs).length > 0) {
                    setFlowRows(buildFlowRows(flowConfigs, deriveStatus));
                    return;
                }

                // Last resort: no catalog to enumerate, so the attempted set IS the
                // flow list. Every id in it was started by construction.
                setFlowRows(
                    [...attempted].map((id) => ({
                        id,
                        name: id.replace(/_/g, " "),
                        type: "OPTIONAL",
                        status: deriveStatus(id),
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
        session.flows,
        session.sessionId,
        session.usecaseId,
        session.version,
    ]);

    return { flowRows, loadingDetail };
};
