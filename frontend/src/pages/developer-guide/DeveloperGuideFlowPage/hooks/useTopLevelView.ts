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

/** Drops anchor/panel and other params that belong only to the previous top-level view. */
function applyViewChangeParams(prev: URLSearchParams, view: TopLevelView): URLSearchParams {
    const next = new URLSearchParams(prev);
    next.set("view", view);

    // Shared between docs (section slug) and flows (JSON path) — always reset on view switch.
    next.delete("attr");
    next.delete("panel");

    if (view !== "docs") {
        next.delete("doc");
    }
    if (view !== "flows") {
        next.delete("flow");
        next.delete("action");
        next.delete("tab");
    }

    return next;
}

/** Owns the top-level tab (the `view` URL param) and the handler to change it. */
export function useTopLevelView() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeView = useMemo(() => parseActiveView(searchParams), [searchParams]);

    const handleViewChange = useCallback(
        (view: TopLevelView) => {
            if (view !== "docs" && window.location.hash) {
                window.history.replaceState(
                    null,
                    "",
                    `${window.location.pathname}${window.location.search}`
                );
            }

            setSearchParams((prev) => applyViewChangeParams(prev, view), { replace: true });
        },
        [setSearchParams]
    );

    return { activeView, handleViewChange };
}
