import { type FC, type ReactNode } from "react";
import GuideHeader from "./GuideHeader";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

export interface GuidePageHeaderProps {
    /** Breadcrumb row content (nav with `>` separators). Omit when a page-level breadcrumb is shown elsewhere. */
    breadcrumb?: ReactNode;
    /** Page title shown below the breadcrumb. Omit to skip the title/description row entirely. */
    title?: string;
    /** One-line description shown under the title. */
    description?: ReactNode;
    /** Tab strip row (e.g. a `<GuideTabs />`). */
    tabs?: ReactNode;
    className?: string;
}

/**
 * Sticky breadcrumb + optional title/description + tab-strip shell shared by
 * the top-level Developer Guide flow page header and the standalone
 * Validations page. Stacks rows top-to-bottom to match the design (breadcrumb,
 * then H1 + description, then tabs) instead of the previous single-row layout.
 */
const GuidePageHeader: FC<GuidePageHeaderProps> = ({
    breadcrumb,
    title,
    description,
    tabs,
    className,
}) => (
    <GuideHeader className={className}>
        {breadcrumb && <div className="px-4 md:px-6 py-3 bg-slate-100">{breadcrumb}</div>}

        {title && (
            <div className="px-4 md:px-6 pt-4 lg:border-t">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                    {title === "Error Codes" ? (
                        <div className="flex items-center gap-2">
                            <ExclamationTriangleIcon className="size-10 text-error-500 dark:text-error-500" />
                            {title}
                        </div>
                    ) : (
                        title
                    )}
                </h1>
                {description && (
                    <div className="mt-1.5 pb-4 text-sm text-slate-500 border-b border-n-30 dark:border-brand-normal/30 w-full leading-relaxed">
                        {description}
                    </div>
                )}
            </div>
        )}

        {tabs && <div className="px-4 md:px-6">{tabs}</div>}
    </GuideHeader>
);

export default GuidePageHeader;
