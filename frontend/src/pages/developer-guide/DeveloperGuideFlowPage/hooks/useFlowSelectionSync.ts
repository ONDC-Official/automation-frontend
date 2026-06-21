import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getActionId } from "../../utils";
import type { FlowEntry, OpenAPISpecification } from "../../types";
import type { TopLevelView } from "../types";

interface UseFlowSelectionSyncParams {
    activeView: TopLevelView;
    isLoading: boolean;
    specData: OpenAPISpecification | null;
    flows: FlowEntry[];
    slug: string;
    apiUsecase: string;
}

/** Owns selected flow/action state and keeps it in sync with the `flow`/`action` URL params. */
export function useFlowSelectionSync({
    activeView,
    isLoading,
    specData,
    flows,
    slug,
    apiUsecase,
}: UseFlowSelectionSyncParams) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedFlow, setSelectedFlow] = useState<string>("");
    const [selectedFlowAction, setSelectedFlowAction] = useState<string>("");
    const didInitialSync = useRef(false);

    // Sync flow/action selection when Flows tab is active
    useEffect(() => {
        if (activeView !== "flows" || isLoading || !specData || flows.length === 0) return;

        const urlFlowId = searchParams.get("flow");
        const matchingFlow =
            (urlFlowId ? flows.find((f) => f.flowId === urlFlowId) : null) ??
            flows.find((f) => f.usecase === apiUsecase || f.usecase === slug) ??
            flows[0];
        if (!matchingFlow) return;

        const flowId = matchingFlow.flowId;
        const urlAction = searchParams.get("action");
        const steps = matchingFlow.config?.steps ?? [];
        const urlStep = urlAction ? steps.find((s) => getActionId(s) === urlAction) : undefined;
        const targetStep = urlStep ?? steps[0];
        const resolvedAction = targetStep ? getActionId(targetStep) : "";

        setSelectedFlow(flowId);
        setSelectedFlowAction(resolvedAction || "");

        setSearchParams(
            (prev) => {
                const currentFlow = prev.get("flow");
                const currentAction = prev.get("action") ?? "";
                if (currentFlow === flowId && currentAction === (resolvedAction || "")) {
                    return prev;
                }
                const next = new URLSearchParams(prev);
                next.set("flow", flowId);
                if (resolvedAction) next.set("action", resolvedAction);
                else next.delete("action");
                return next;
            },
            { replace: true }
        );

        didInitialSync.current = true;
        // searchParams read once per sync; omit from deps to avoid update loops
    }, [activeView, isLoading, specData, flows, slug, apiUsecase, setSearchParams]);

    // Keep URL in sync once the user changes flow/action via UI
    useEffect(() => {
        if (activeView !== "flows" || !didInitialSync.current || !selectedFlow) return;
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set("flow", selectedFlow);
                if (selectedFlowAction) next.set("action", selectedFlowAction);
                else next.delete("action");
                return next;
            },
            { replace: true }
        );
    }, [activeView, selectedFlow, selectedFlowAction, setSearchParams]);

    const resetForNewRoute = useCallback(() => {
        setSelectedFlow("");
        setSelectedFlowAction("");
        didInitialSync.current = false;
    }, []);

    return {
        selectedFlow,
        setSelectedFlow,
        selectedFlowAction,
        setSelectedFlowAction,
        resetForNewRoute,
    };
}
