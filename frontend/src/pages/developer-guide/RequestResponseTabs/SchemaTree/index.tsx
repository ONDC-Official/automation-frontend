import { type FC, useCallback, useMemo, useState } from "react";
import {
    ChevronDoubleDownIcon,
    ChevronDoubleUpIcon,
    ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import type { OpenAPISchema, OpenAPISpecification } from "../../types";
import { resolveSchema } from "../specUtils";
import GuideTable from "../../shared/components/GuideTable";
import { buildSchemaColumns } from "./columns";
import { countProperties, flattenSchema } from "./utils";

interface SchemaTreeProps {
    schema: OpenAPISchema;
    spec: OpenAPISpecification;
    showRequiredColumn?: boolean;
}

const PAGE_SIZE = 10;

const SchemaTree: FC<SchemaTreeProps> = ({ schema, spec, showRequiredColumn = true }) => {
    const [globalExpanded, setGlobalExpanded] = useState(true);
    const [overrides, setOverrides] = useState<Record<string, boolean>>({});

    const resolved = resolveSchema(spec, schema) ?? schema;
    const totalProps = useMemo(() => countProperties(schema, spec), [schema, spec]);

    const isExpanded = useCallback(
        (key: string) => overrides[key] ?? globalExpanded,
        [overrides, globalExpanded]
    );

    const toggleRow = useCallback(
        (key: string) => {
            setOverrides((prev) => ({ ...prev, [key]: !(prev[key] ?? globalExpanded) }));
        },
        [globalExpanded]
    );

    const toggleGlobal = useCallback(() => {
        setGlobalExpanded((v) => !v);
        setOverrides({});
    }, []);

    const exportAll = useCallback(() => {
        const blob = new Blob([JSON.stringify(resolved, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "schema.json";
        a.click();
        URL.revokeObjectURL(url);
    }, [resolved]);

    const flatRows = useMemo(
        () => flattenSchema(schema, spec, isExpanded),
        [schema, spec, isExpanded]
    );

    const columns = useMemo(
        () => buildSchemaColumns(showRequiredColumn, toggleRow),
        [showRequiredColumn, toggleRow]
    );

    if (!resolved.properties) {
        return (
            <p className="text-sm text-slate-500 py-6 text-center">
                Schema has no properties to display.
            </p>
        );
    }

    const topLevelCount = Object.values(resolved.properties).filter((v) => v != null).length;

    return (
        <GuideTable
            columns={columns}
            rows={flatRows}
            rowKey={(row) => row.key}
            rowClassName={(row) => (row.depth % 2 === 1 ? "bg-sky-50/30 dark:bg-sky-500/5" : "")}
            density="spacious"
            shadow="xs"
            rounded="xl"
            pagination={{ pageSize: PAGE_SIZE }}
            toolbar={
                <div className="flex items-center justify-between">
                    <span className="text-body-2 font-semibold font-mono tracking-normal">
                        {topLevelCount} top-level {topLevelCount === 1 ? "property" : "properties"}
                        {totalProps > topLevelCount && <span> · {totalProps} total</span>}
                    </span>
                    <div className="flex gap-1.5">
                        <button
                            type="button"
                            onClick={toggleGlobal}
                            className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-sky-600 dark:text-sky-300 hover:text-sky-800 dark:hover:text-sky-200 bg-white dark:bg-surface-elevated hover:bg-sky-100 dark:hover:bg-sky-500/20 rounded border border-sky-200/60 dark:border-sky-500/30 transition-colors"
                        >
                            {globalExpanded ? (
                                <ChevronDoubleUpIcon className="w-3 h-3" />
                            ) : (
                                <ChevronDoubleDownIcon className="w-3 h-3" />
                            )}
                            {globalExpanded ? "Collapse all" : "Expand all"}
                        </button>
                        <button
                            type="button"
                            onClick={exportAll}
                            className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-white bg-sky-500 hover:bg-sky-600 rounded border border-sky-500 transition-colors"
                        >
                            <ArrowDownTrayIcon className="w-3 h-3" />
                            Export All
                        </button>
                    </div>
                </div>
            }
        />
    );
};

export default SchemaTree;
