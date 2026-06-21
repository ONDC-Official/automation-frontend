import { CSSProperties, FC, useMemo, useState } from "react";
import JsonView from "@uiw/react-json-view";
import { githubDarkTheme } from "@uiw/react-json-view/githubDark";
import type { OpenAPISpecification } from "../types";
import type { SchemaView } from "./types";
import SchemaTree from "./SchemaTree";
import SchemaViewToggle from "./SchemaViewToggle";
import { useSchemaViewReadiness } from "./useSchemaViewReadiness";
import { getRequestSchema, deepResolveSchema } from "./specUtils";
import Spinner from "@/components/Shadcn/Spinner";

interface RequestTabProps {
    spec: OpenAPISpecification;
    /** e.g. "search", "on_search" */
    api: string;
}

const RequestTab: FC<RequestTabProps> = ({ spec, api }) => {
    const [view, setView] = useState<SchemaView>("schema");
    const { rawReady, schemaReady } = useSchemaViewReadiness(api, view);

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
                    <SchemaViewToggle view={view} onChange={setView} />
                </div>

                {schema ? (
                    view === "schema" ? (
                        !schemaReady ? (
                            <div className="flex items-center justify-center h-40">
                                <Spinner className="size-8 text-brand-normal" />
                            </div>
                        ) : (
                            <SchemaTree schema={schema} spec={spec} showRequiredColumn={false} />
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
