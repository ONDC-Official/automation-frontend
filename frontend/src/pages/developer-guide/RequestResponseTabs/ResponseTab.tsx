import { CSSProperties, FC, useMemo, useState } from "react";
import JsonView from "@uiw/react-json-view";
import { githubDarkTheme } from "@uiw/react-json-view/githubDark";
import type { OpenAPISpecification } from "../types";
import type { SchemaView } from "./types";
import SchemaTree from "./SchemaTree";
import SchemaViewToggle from "./SchemaViewToggle";
import { useSchemaViewReadiness } from "./useSchemaViewReadiness";
import { getResponseSchema, getResponseExamples, deepResolveSchema } from "./specUtils";
import Spinner from "@/components/Shadcn/Spinner";

interface ResponseTabProps {
    spec: OpenAPISpecification;
    /** e.g. "search", "on_search" */
    api: string;
}

const ResponseTab: FC<ResponseTabProps> = ({ spec, api }) => {
    const [view, setView] = useState<SchemaView>("schema");
    const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);
    const { rawReady, schemaReady } = useSchemaViewReadiness(api, view);

    const schema = getResponseSchema(spec, api);
    const deepSchema = useMemo(
        () => (schema ? (deepResolveSchema(spec, schema) as object) : null),
        [spec, schema]
    );
    const examples = getResponseExamples(spec, api);
    const selectedExample = examples[selectedExampleIndex] ?? examples[0];

    return (
        <div className="flex flex-col gap-8">
            {/* ── Schema section ── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-slate-700">Response Schema</h4>
                    <SchemaViewToggle view={view} onChange={setView} />
                </div>

                {schema ? (
                    view === "schema" ? (
                        !schemaReady ? (
                            <div className="flex items-center justify-center h-40">
                                <Spinner className="size-8 text-brand-normal" />
                            </div>
                        ) : (
                            <SchemaTree schema={schema} spec={spec} showRequiredColumn={true} />
                        )
                    ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-900 overflow-hidden">
                            <div className="overflow-auto max-h-[600px] p-4 text-xs">
                                {!rawReady ? (
                                    <div className="flex items-center justify-center h-40">
                                        <Spinner className="size-8 text-brand-normal" />
                                    </div>
                                ) : deepSchema ? (
                                    <JsonView
                                        value={deepSchema}
                                        style={githubDarkTheme as CSSProperties}
                                        displayDataTypes={false}
                                        shortenTextAfterLength={120}
                                    />
                                ) : (
                                    <span className="text-slate-400">No schema</span>
                                )}
                            </div>
                        </div>
                    )
                ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center">
                        <p className="text-sm text-slate-500">
                            No response schema found for <code className="font-mono">/{api}</code>{" "}
                            in the spec.
                        </p>
                    </div>
                )}
            </div>

            {/* ── Response examples section ── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-slate-700">Response Example</h4>
                    {examples.length > 1 && (
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="res-example-select"
                                className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0"
                            >
                                Example
                            </label>
                            <div className="relative">
                                <select
                                    id="res-example-select"
                                    value={selectedExampleIndex}
                                    onChange={(e) =>
                                        setSelectedExampleIndex(Number(e.target.value))
                                    }
                                    className="pl-3 pr-8 py-1.5 rounded-lg text-sm border border-slate-200 bg-white dark:bg-surface-elevated text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-400/40 focus:border-sky-300 appearance-none shadow-xs"
                                >
                                    {examples.map((ex, i) => (
                                        <option key={i} value={i}>
                                            {ex.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                                    <svg
                                        className="w-4 h-4 text-slate-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {examples.length > 0 && selectedExample?.payload != null ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-900 overflow-hidden">
                        <div className="overflow-auto max-h-[600px] p-4 text-xs">
                            <JsonView
                                value={selectedExample.payload as object}
                                style={githubDarkTheme as CSSProperties}
                                displayDataTypes={false}
                                shortenTextAfterLength={120}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 text-center">
                        <p className="text-sm text-slate-500">
                            No response examples defined in the spec for this action.
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            ONDC response is typically an ACK/NACK envelope as shown in the schema
                            above.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResponseTab;
