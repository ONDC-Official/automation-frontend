import { FC, useEffect, useMemo, useState } from "react";
import { FiCode, FiList } from "react-icons/fi";
import JsonView from "@uiw/react-json-view";
import { githubDarkTheme } from "@uiw/react-json-view/githubDark";
import type { OpenAPISpecification } from "../types";
import SchemaTree from "./SchemaTree";
import { getRequestSchema, deepResolveSchema } from "./specUtils";
import Loader from "@components/ui/mini-components/loader";

interface RequestTabProps {
    spec: OpenAPISpecification;
    /** e.g. "search", "on_search" */
    api: string;
}

type View = "schema" | "raw";

const RequestTab: FC<RequestTabProps> = ({ spec, api }) => {
    const [view, setView] = useState<View>("schema");
    const [rawReady, setRawReady] = useState(false);

    // Defer heavy JsonView render so the browser paints the spinner first
    useEffect(() => {
        if (view === "raw") {
            setRawReady(false);
            const id = setTimeout(() => setRawReady(true), 0);
            return () => clearTimeout(id);
        } else {
            setRawReady(false);
        }
    }, [view, api]);

    const schema = getRequestSchema(spec, api);
    const deepSchema = useMemo(
        () => (schema ? (deepResolveSchema(spec, schema) as object) : null),
        [spec, schema]
    );

    return (
        <div className="flex flex-col gap-8">
            {/* ── Schema section ── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-slate-700">Request Schema</h4>
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                        <button
                            type="button"
                            onClick={() => setView("schema")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                view === "schema"
                                    ? "bg-white text-slate-800 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <FiList className="w-3.5 h-3.5" />
                            Schema
                        </button>
                        <button
                            type="button"
                            onClick={() => setView("raw")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                view === "raw"
                                    ? "bg-white text-slate-800 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <FiCode className="w-3.5 h-3.5" />
                            Raw JSON
                        </button>
                    </div>
                </div>

                {schema ? (
                    view === "schema" ? (
                        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                            <div className="overflow-auto max-h-[600px] p-4">
                                <SchemaTree
                                    schema={schema}
                                    spec={spec}
                                    showRequiredColumn={false}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-900 overflow-hidden">
                            <div className="overflow-auto max-h-[600px] p-4 text-xs">
                                {!rawReady ? (
                                    <div className="flex items-center justify-center h-40">
                                        <Loader />
                                    </div>
                                ) : deepSchema ? (
                                    <JsonView
                                        value={deepSchema}
                                        style={githubDarkTheme}
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
                            No request schema found for <code className="font-mono">/{api}</code> in
                            the spec.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequestTab;
