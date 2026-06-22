import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { TOP_LEVEL_VIEWS, type TopLevelView } from "../types";

function parseActiveView(searchParams: URLSearchParams): TopLevelView {
    const viewParam = searchParams.get("view");
    if (viewParam && TOP_LEVEL_VIEWS.includes(viewParam as TopLevelView)) {
        return viewParam as TopLevelView;
    }
    return "docs";
}

/** Owns the top-level tab (the `view` URL param) and the handler to change it. */
export function useTopLevelView() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeView = useMemo(() => parseActiveView(searchParams), [searchParams]);

    const handleViewChange = useCallback(
        (view: TopLevelView) => {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    next.set("view", view);
                    return next;
                },
                { replace: true }
            );
        },
        [setSearchParams]
    );

    return { activeView, handleViewChange };
}
