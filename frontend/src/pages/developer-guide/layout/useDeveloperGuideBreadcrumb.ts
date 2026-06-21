import { matchPath, useLocation } from "react-router-dom";
import { ROUTES } from "@constants/routes";
import { useDeveloperGuideShell } from "./DeveloperGuideShellContext";
import { findBreadcrumbTrail, type BreadcrumbCrumb } from "./findBreadcrumbTrail";
import { useTopLevelView } from "../DeveloperGuideFlowPage/hooks/useTopLevelView";
import { VIEW_LABEL } from "../DeveloperGuideFlowPage/types";

const ROOT_CRUMB: BreadcrumbCrumb = {
    id: "root",
    label: "ONDC Developer Guide",
    path: ROUTES.DEVELOPER_GUIDE,
};

/** Full ancestor-to-leaf breadcrumb trail for the current developer-guide route, driven by the nav tree. */
export function useDeveloperGuideBreadcrumb(): BreadcrumbCrumb[] {
    const { navTree } = useDeveloperGuideShell();
    const { pathname, hash } = useLocation();
    const { activeView } = useTopLevelView();

    const trail = findBreadcrumbTrail(navTree, pathname, hash);
    if (trail.length === 0) return [];

    const isUseCaseRoute = matchPath(
        { path: ROUTES.DEVELOPER_GUIDE_USE_CASE, end: true },
        pathname
    );

    const crumbs = isUseCaseRoute
        ? [...trail, { id: `view-${activeView}`, label: VIEW_LABEL[activeView] }]
        : trail;

    return [ROOT_CRUMB, ...crumbs];
}
