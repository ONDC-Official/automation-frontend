import { useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTopLevelView } from "./hooks/useTopLevelView";
import { useSpecData } from "./hooks/useSpecData";
import { useLazyChangelog } from "./hooks/useLazyChangelog";
import { useFlowSelectionSync } from "./hooks/useFlowSelectionSync";

/**
 * Owns all data-fetching and URL-synced state for the Developer Guide flow page:
 * resolving the route into a spec, loading builds/spec/docs/changelog, and keeping
 * the selected flow/action and active tab in sync with the URL.
 *
 * Composes four focused hooks (view, spec data, changelog, flow selection) and owns
 * only the cross-cutting "route changed" reset that spans all four.
 */
export function useDeveloperGuideFlowPageData() {
    const {
        domain: domainParam,
        version: versionParam,
        useCase: useCaseSlug,
    } = useParams<{ domain: string; version: string; useCase: string }>();
    const [, setSearchParams] = useSearchParams();

    const domainKey = domainParam != null ? decodeURIComponent(domainParam) : "";
    const versionKey = versionParam != null ? decodeURIComponent(versionParam) : "";
    const slug = useCaseSlug ? decodeURIComponent(useCaseSlug) : "";
    const routeKey = `${domainKey}|${versionKey}|${slug}`;
    const prevRouteKeyRef = useRef<string | null>(null);

    const { activeView, handleViewChange } = useTopLevelView();
    const specDataState = useSpecData(domainKey, versionKey, slug);
    const changelogState = useLazyChangelog(domainKey, versionKey, activeView);
    const flowSelection = useFlowSelectionSync({
        activeView,
        isLoading: specDataState.isLoading,
        specData: specDataState.specData,
        flows: specDataState.flows,
        slug,
        apiUsecase: specDataState.apiUsecase,
    });

    // Reset tab + flow state only when domain / version / use case route changes
    useEffect(() => {
        if (prevRouteKeyRef.current === routeKey) return;
        prevRouteKeyRef.current = routeKey;

        flowSelection.resetForNewRoute();
        changelogState.resetForNewRoute();
        specDataState.resetForNewRoute();

        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set("view", "docs");
                next.delete("flow");
                next.delete("action");
                return next;
            },
            { replace: true }
        );
    }, [
        routeKey,
        setSearchParams,
        flowSelection.resetForNewRoute,
        changelogState.resetForNewRoute,
        specDataState.resetForNewRoute,
    ]);

    return {
        domainKey,
        versionKey,
        slug,
        activeView,
        handleViewChange,
        selectedFlow: flowSelection.selectedFlow,
        setSelectedFlow: flowSelection.setSelectedFlow,
        selectedFlowAction: flowSelection.selectedFlowAction,
        setSelectedFlowAction: flowSelection.setSelectedFlowAction,
        specData: specDataState.specData,
        isLoading: specDataState.isLoading,
        notFound: specDataState.notFound,
        flows: specDataState.flows,
        errorCodes: specDataState.errorCodes,
        supportedActions: specDataState.supportedActions,
        hasErrorCodes: specDataState.hasErrorCodes,
        hasSupportedActions: specDataState.hasSupportedActions,
        usecaseLabel: specDataState.usecaseLabel,
        lazyChangelog: changelogState.lazyChangelog,
        changelogLoading: changelogState.changelogLoading,
    };
}
