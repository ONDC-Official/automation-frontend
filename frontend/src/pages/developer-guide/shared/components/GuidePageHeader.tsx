import { type FC, type ReactNode } from "react";
import GuideStickyHeader from "./GuideStickyHeader";

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
    <GuideStickyHeader className={className}>
        {breadcrumb && <div className="px-4 md:px-6 py-3 bg-slate-100">{breadcrumb}</div>}

        {title && (
            <div className="px-4 md:px-6 pb-4 pt-4 lg:border-t">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">{title}</h1>
                {description && (
                    <p className="mt-1.5 text-sm text-slate-500 leading-relaxed max-w-3xl">
                        {description}
                    </p>
                )}
            </div>
        )}

        {tabs && <div className="px-4 md:px-6">{tabs}</div>}
    </GuideStickyHeader>
);

export default GuidePageHeader;
