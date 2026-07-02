import { useEffect, useMemo, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { ArrowPathIcon, CodeBracketIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/Shadcn/Button/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/Shadcn/Dialog";
import { cn } from "@/lib/utils";
import { useAppliedTheme } from "@/context/theme/useAppliedTheme";
import { SelectBox } from "@pages/protocol-playground/ui/components/github-select";
import {
    fetchBranches,
    fetchAllYamlFiles,
    fetchAllRawFiles,
    fetchValidations,
    matchDomainToBranch,
    GitHubFile,
} from "@pages/protocol-playground/utils/fetch-github";
import { generateSchemasFromFiles } from "@pages/protocol-playground/utils/schema-generator";
import {
    OpenApiDocument,
    openApiToYaml,
} from "@pages/protocol-playground/utils/openapi-schema-builder";
import type { ISchemaGeneratorModalProps } from "@pages/protocol-playground/ui/types";

export const SchemaGeneratorModal = ({
    isOpen,
    defaultDomain,
    onClose,
}: ISchemaGeneratorModalProps) => {
    const appliedTheme = useAppliedTheme();
    const [branches, setBranches] = useState<string[]>([]);
    const [selectedBranch, setSelectedBranch] = useState("");
    const [files, setFiles] = useState<GitHubFile[]>([]);

    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [openApiDoc, setOpenApiDoc] = useState<OpenApiDocument | null>(null);
    const [validationsYaml, setValidationsYaml] = useState<string | null>(null);
    const [outputFormat, setOutputFormat] = useState<"yaml" | "json">("yaml");

    useEffect(() => {
        if (!isOpen) return;
        setLoadingBranches(true);
        setError(null);
        fetchBranches()
            .then((data) => {
                setBranches(data);
                const matched = defaultDomain
                    ? matchDomainToBranch(defaultDomain, data)
                    : undefined;
                setSelectedBranch(matched ?? data[0] ?? "");
            })
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoadingBranches(false));
    }, [isOpen, defaultDomain]);

    useEffect(() => {
        if (!selectedBranch) return;
        setFiles([]);
        setOpenApiDoc(null);
        setValidationsYaml(null);
        setIsGenerated(false);
        setLoadingFiles(true);
        setError(null);
        fetchAllYamlFiles(selectedBranch)
            .then(setFiles)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoadingFiles(false));
    }, [selectedBranch]);

    const resetAndClose = () => {
        setBranches([]);
        setSelectedBranch("");
        setFiles([]);
        setOpenApiDoc(null);
        setValidationsYaml(null);
        setIsGenerated(false);
        setError(null);
        onClose();
    };

    const handleGenerate = async () => {
        if (files.length === 0) return;
        setGenerating(true);
        setError(null);
        setOpenApiDoc(null);
        setValidationsYaml(null);
        try {
            const [fetched, validations] = await Promise.all([
                fetchAllRawFiles(files),
                fetchValidations(selectedBranch),
            ]);
            setValidationsYaml(validations);
            setOpenApiDoc(generateSchemasFromFiles(fetched, validations));
            setIsGenerated(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to generate schemas");
        } finally {
            setGenerating(false);
        }
    };

    const output = useMemo(() => {
        if (!openApiDoc) return "";
        return outputFormat === "yaml"
            ? openApiToYaml(openApiDoc)
            : JSON.stringify(openApiDoc, null, 2);
    }, [openApiDoc, outputFormat]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
            <DialogContent className="flex max-h-[85vh] w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl md:max-w-3xl lg:max-w-5xl">
                <DialogHeader className="flex flex-row items-center gap-2.5 border-b border-border-default px-6 py-4">
                    <CodeBracketIcon className="size-5 text-brand-normal" />
                    <div className="min-w-0">
                        <DialogTitle>Schema Generator</DialogTitle>
                        {selectedBranch && (
                            <DialogDescription className="mt-0.5 max-w-xs truncate font-mono text-brand-normal">
                                {selectedBranch}
                            </DialogDescription>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
                    <SelectBox
                        label="Domain (Branch)"
                        value={selectedBranch}
                        options={branches}
                        disabled={branches.length === 0}
                        loading={loadingBranches}
                        placeholder="Loading branches..."
                        onChange={(v) => setSelectedBranch(v)}
                    />

                    <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-1 text-sm font-semibold text-text-secondary">
                            Files
                            {loadingFiles && (
                                <ArrowPathIcon className="ml-2 size-3.5 animate-spin text-brand-normal" />
                            )}
                        </label>
                        {!selectedBranch ? (
                            <p className="px-1 text-xs text-text-secondary">
                                Select a domain first
                            </p>
                        ) : loadingFiles ? (
                            <p className="px-1 text-xs text-text-secondary">
                                Loading files from all flow folders...
                            </p>
                        ) : files.length === 0 ? (
                            <p className="px-1 text-xs text-text-secondary">
                                No YAML files found on this branch
                            </p>
                        ) : (
                            <p className="px-1 text-xs text-text-primary">
                                {files.length} file{files.length === 1 ? "" : "s"} across all
                                folders will be fetched:{" "}
                                <span className="font-mono text-text-secondary">
                                    {files.map((f) => f.name).join(", ")}
                                </span>
                            </p>
                        )}
                    </div>

                    {error && (
                        <div className="rounded-lg border border-error-500/40 bg-error-50 px-3 py-2 text-sm text-error-500">
                            {error}
                        </div>
                    )}

                    {openApiDoc && (
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-text-secondary">
                                    Generated OpenAPI ({Object.keys(openApiDoc.paths).length} paths)
                                    · read-only
                                    <span className="ml-2 font-normal text-text-secondary">
                                        {validationsYaml
                                            ? "· validations fetched"
                                            : "· no validations on this branch"}
                                    </span>
                                </label>
                                <div className="flex items-center rounded-lg border border-border-default bg-surface-muted p-0.5">
                                    {(["yaml", "json"] as const).map((fmt) => (
                                        <button
                                            type="button"
                                            key={fmt}
                                            onClick={() => setOutputFormat(fmt)}
                                            className={cn(
                                                "rounded-md px-3 py-1 text-xs font-medium uppercase transition-colors",
                                                outputFormat === fmt
                                                    ? "bg-surface-elevated text-brand-normal shadow-xs"
                                                    : "text-text-secondary hover:text-text-primary"
                                            )}
                                        >
                                            {fmt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="overflow-hidden rounded-lg border border-border-default">
                                <Editor
                                    theme={appliedTheme === "dark" ? "vs-dark" : "vs"}
                                    height="420px"
                                    language={outputFormat}
                                    value={output}
                                    options={{
                                        fontSize: 13,
                                        lineNumbers: "on",
                                        automaticLayout: true,
                                        readOnly: true,
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        padding: { top: 12 },
                                        wordWrap: "on",
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t border-border-default bg-surface-muted px-6 py-4">
                    <Button variant="outline" onClick={resetAndClose}>
                        Close
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={files.length === 0 || generating || isGenerated}
                        isLoading={generating}
                    >
                        {generating ? "Generating..." : "Generate Schemas"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
