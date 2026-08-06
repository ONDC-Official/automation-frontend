import { FC } from "react";
import {
    NAV_STATUS_LABEL,
    NAV_STATUS_STYLES,
    NAV_STATUS_VALUES,
} from "../shared/statusPlaceholders";

/** Fixed footer legend for version-pill lifecycle colors in the Developer Guide sidebar. */
const VersionStatusLegend: FC = () => (
    <aside
        className="shrink-0 border-t border-slate-200 dark:border-border-default px-4 py-3"
        aria-label="Version status legend"
    >
        <p className="text-xs text-slate-600 dark:text-text-secondary mb-2 leading-relaxed">
            <span className="text-xs font-semibold text-slate-800 dark:text-text-primary">
                Note -{" "}
            </span>
            Color depicts usecase version status.
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2">
            {NAV_STATUS_VALUES.map((status) => (
                <span
                    key={status}
                    className={`rounded-full px-2 py-1 text-caption-2-size font-semibold leading-none ${NAV_STATUS_STYLES[status]}`}
                >
                    {NAV_STATUS_LABEL[status]}
                </span>
            ))}
        </div>
    </aside>
);

export default VersionStatusLegend;
