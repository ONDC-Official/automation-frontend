import { FC } from "react";
import { Link } from "react-router-dom";
import { useDeveloperGuideBreadcrumb } from "./useDeveloperGuideBreadcrumb";
import { useDeveloperGuideShell } from "./DeveloperGuideShellContext";

/** Breadcrumb bar above content — route trail with `>` separators (no sidebar toggle). */
const DeveloperGuideCollapsedNavBar: FC = () => {
    const crumbs = useDeveloperGuideBreadcrumb();
    const { navSidebarOpen } = useDeveloperGuideShell();

    if (crumbs.length === 0) return null;

    return (
        <div
            className={`shrink-0 flex items-center h-11 min-h-11 pr-4 border-b border-slate-200 bg-slate-100 dark:bg-surface-muted shadow-xs ${
                navSidebarOpen ? "pl-4" : "pl-16"
            }`}
        >
            <nav
                className="flex items-center gap-2 text-sm min-w-0 overflow-hidden"
                aria-label="Breadcrumb"
            >
                {crumbs.map((crumb, index) => {
                    const isLast = index === crumbs.length - 1;
                    return (
                        <span key={crumb.id} className="flex items-center gap-2 min-w-0">
                            {index > 0 && (
                                <span className="shrink-0 text-slate-400" aria-hidden>
                                    &gt;
                                </span>
                            )}
                            {!isLast && crumb.path ? (
                                <Link
                                    to={crumb.path}
                                    className="min-w-0 font-medium text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors truncate"
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span
                                    className={`min-w-0 truncate ${
                                        isLast
                                            ? "font-semibold text-slate-800"
                                            : "font-medium text-slate-500"
                                    }`}
                                >
                                    {crumb.label}
                                </span>
                            )}
                        </span>
                    );
                })}
            </nav>
        </div>
    );
};

export default DeveloperGuideCollapsedNavBar;
