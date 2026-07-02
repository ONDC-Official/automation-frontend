import { FC, useState, useMemo } from "react";
import type { OpenAPISpecification } from "../types";
import type { SchemaView } from "./types";
import SchemaTree from "./SchemaTree";
import SchemaViewToggle from "./SchemaViewToggle";
import { useSchemaViewReadiness } from "./useSchemaViewReadiness";
import { getRequestSchema, deepResolveSchema } from "./specUtils";
import Spinner from "@/components/Shadcn/Spinner";
import CodeBlock from "@components/CodeBlock";
import AppJsonViewer from "@/components/AppJsonViewer";

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
                <div className="flex items-center justify-between py-2">
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
                        <CodeBlock
                            language="JSON"
                            code={deepSchema ? JSON.stringify(deepSchema, null, 2) : ""}
                            maxHeightClass="max-h-150"
                        >
                            {!rawReady ? (
                                <div className="flex items-center justify-center h-40">
                                    <Spinner className="size-8 text-brand-normal" />
                                </div>
                            ) : deepSchema ? (
                                <AppJsonViewer value={deepSchema} shortenTextAfterLength={120} />
                            ) : (
                                <span className="text-muted-foreground">No schema</span>
                            )}
                        </CodeBlock>
                    )
                ) : (
                    <div className="rounded-xl border border-border bg-muted/30 py-12 text-center">
                        <p className="text-sm text-muted-foreground">
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
