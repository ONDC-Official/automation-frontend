import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import type { GuideTableColumn } from "../../shared/components/GuideTable";
import { emptyCell } from "../../shared/components/tableCells";
import type { SchemaRow } from "./utils";
import { getTypeLabel, typeColor } from "./utils";
import TreeIndent from "./TreeIndent";
import TruncatedDescription from "./TruncatedDescription";

/** Column set shared by RequestTab/ResponseTab's schema table (mirrors ValidationsTable's column shape). */
export function buildSchemaColumns(
    showRequiredColumn: boolean,
    onToggleRow: (key: string) => void
): GuideTableColumn<SchemaRow>[] {
    const columns: GuideTableColumn<SchemaRow>[] = [
        {
            key: "property",
            header: "Property",
            headerClassName: "w-2/5",
            cellClassName: "whitespace-nowrap",
            render: (row) => (
                <div className="flex items-center gap-1 min-w-0">
                    <TreeIndent depth={row.depth} />
                    {row.hasChildren ? (
                        <button
                            type="button"
                            onClick={() => onToggleRow(row.key)}
                            className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {row.isExpanded ? (
                                <FiChevronDown className="w-3.5 h-3.5" />
                            ) : (
                                <FiChevronRight className="w-3.5 h-3.5" />
                            )}
                        </button>
                    ) : (
                        <span className="shrink-0 inline-block w-3.5" aria-hidden="true" />
                    )}
                    <span className="font-mono text-xs font-semibold text-slate-800">
                        {row.name}
                    </span>
                    {row.hasChildren && (
                        <span className="ml-1 text-[10px] text-slate-400 font-mono">
                            {`{${row.childCount}}`}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: "type",
            header: "Type",
            headerClassName: "w-28",
            cellClassName: "whitespace-nowrap",
            render: (row) => (
                <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ring-1 ${typeColor(row.resolved)}`}
                >
                    {getTypeLabel(row.resolved, row.resolvedItems)}
                </span>
            ),
        },
    ];

    if (showRequiredColumn) {
        columns.push({
            key: "requirement",
            header: "Requirement",
            headerClassName: "w-28",
            cellClassName: "whitespace-nowrap",
            render: (row) =>
                row.required ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-500/30">
                        Required
                    </span>
                ) : (
                    emptyCell()
                ),
        });
    }

    columns.push({
        key: "description",
        header: "Description",
        cellClassName: "text-xs text-slate-500 leading-relaxed",
        render: (row) => (
            <>
                {row.resolved.description && (
                    <TruncatedDescription text={row.resolved.description} />
                )}
                {Array.isArray(row.resolved.enum) && (
                    <span className="block mt-0.5 text-[10px] text-slate-400">
                        enum:{" "}
                        {(row.resolved.enum as unknown[]).map((v) => (
                            <code
                                key={String(v)}
                                className="mx-0.5 px-1 py-px bg-slate-50 rounded font-mono text-slate-700 ring-1 ring-slate-200/60"
                            >
                                {String(v)}
                            </code>
                        ))}
                    </span>
                )}
            </>
        ),
    });

    return columns;
}
