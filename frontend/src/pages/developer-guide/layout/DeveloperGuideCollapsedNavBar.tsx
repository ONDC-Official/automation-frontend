import { FC } from "react";
import { Link } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";
import DeveloperGuideNavBackButton from "./DeveloperGuideNavBackButton";
import { useDeveloperGuideBreadcrumb } from "./useDeveloperGuideBreadcrumb";

/** Persistent breadcrumb bar shown above the content area for every developer-guide page. */
const DeveloperGuideCollapsedNavBar: FC = () => {
    const crumbs = useDeveloperGuideBreadcrumb();

    if (crumbs.length === 0) return null;

    return (
        <div className="shrink-0 flex items-center gap-2 h-11 min-h-11 px-4 md:px-6 border-b border-slate-200 bg-slate-100 dark:bg-surface-muted shadow-xs">
            <DeveloperGuideNavBackButton />
            <nav
                className="flex items-center gap-1.5 text-sm min-w-0 overflow-hidden"
                aria-label="Breadcrumb"
            >
                {crumbs.map((crumb, index) => {
                    const isLast = index === crumbs.length - 1;
                    return (
                        <span key={crumb.id} className="flex items-center gap-1.5 min-w-0">
                            {index > 0 && (
                                <FiChevronRight size={13} className="shrink-0 text-slate-500" />
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
