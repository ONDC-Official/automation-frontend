import { useEffect, useMemo, useState } from "react";
import { FaCodeBranch, FaSpinner } from "react-icons/fa";
import { Editor } from "@monaco-editor/react";
import Popup from "@components/ui/pop-up/pop-up";
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

interface SchemaGeneratorModalProps {
    isOpen: boolean;
    defaultDomain?: string;
    onClose: () => void;
}

export const SchemaGeneratorModal = ({
    isOpen,
    defaultDomain,
    onClose,
}: SchemaGeneratorModalProps) => {
    const [branches, setBranches] = useState<string[]>([]);
    const [selectedBranch, setSelectedBranch] = useState("");
    const [files, setFiles] = useState<GitHubFile[]>([]);

    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [openApiDoc, setOpenApiDoc] = useState<OpenApiDocument | null>(null);
    const [validationsYaml, setValidationsYaml] = useState<string | null>(null);
    const [outputFormat, setOutputFormat] = useState<"yaml" | "json">("yaml");

    // Fetch branches when modal opens
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

    // Fetch every YAML file across all flow folders when branch changes
    useEffect(() => {
        if (!selectedBranch) return;
        setFiles([]);
        setOpenApiDoc(null);
        setValidationsYaml(null);
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

    const crumbs = selectedBranch;

    return (
        <Popup
            isOpen={isOpen}
            onClose={resetAndClose}
            widthClass="max-w-lg sm:max-w-2xl md:max-w-3xl lg:max-w-5xl"
        >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-2 py-2 border-b border-gray-100">
                <FaCodeBranch size={18} className="text-sky-600" />
                <div>
                    <h2 className="text-base font-semibold text-gray-800 leading-tight">
                        Schema Generator
                    </h2>
                    {crumbs && (
                        <p className="text-xs text-sky-600 font-mono mt-0.5 truncate max-w-xs">
                            {crumbs}
                        </p>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex flex-col gap-5">
                {/* Branch / Domain */}
                <SelectBox
                    label="Domain (Branch)"
                    value={selectedBranch}
                    options={branches}
                    disabled={branches.length === 0}
                    loading={loadingBranches}
                    placeholder="Loading branches..."
                    onChange={(v) => setSelectedBranch(v)}
                />

                {/* File count */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                        Files
                        {loadingFiles && (
                            <FaSpinner className="animate-spin text-sky-500 ml-2" size={13} />
                        )}
                    </label>
                    {!selectedBranch ? (
                        <p className="text-xs text-gray-400 px-1">Select a domain first</p>
                    ) : loadingFiles ? (
                        <p className="text-xs text-gray-400 px-1">
                            Loading files from all flow folders...
                        </p>
                    ) : files.length === 0 ? (
                        <p className="text-xs text-gray-400 px-1">
                            No YAML files found on this branch
                        </p>
                    ) : (
                        <p className="text-xs text-gray-600 px-1">
                            {files.length} file{files.length === 1 ? "" : "s"} across all folders
                            will be fetched:{" "}
                            <span className="text-gray-400 font-mono">
                                {files.map((f) => f.name).join(", ")}
                            </span>
                        </p>
                    )}
                </div>

                {/* Inline error */}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                        {error}
                    </div>
                )}

                {/* Generated OpenAPI output (display only) */}
                {openApiDoc && (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-600">
                                Generated OpenAPI ({Object.keys(openApiDoc.paths).length} paths) ·
                                read-only
                                <span className="ml-2 font-normal text-gray-400">
                                    {validationsYaml
                                        ? "· validations fetched"
                                        : "· no validations on this branch"}
                                </span>
                            </label>
                            <div className="flex items-center rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                                {(["yaml", "json"] as const).map((fmt) => (
                                    <button
                                        key={fmt}
                                        onClick={() => setOutputFormat(fmt)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors uppercase
                                                ${
                                                    outputFormat === fmt
                                                        ? "bg-white text-sky-700 shadow-xs"
                                                        : "text-gray-500 hover:text-gray-700"
                                                }`}
                                    >
                                        {fmt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <Editor
                                theme="vs"
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

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
                <button
                    onClick={resetAndClose}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                    Close
                </button>
                <button
                    onClick={handleGenerate}
                    disabled={files.length === 0 || generating}
                    className={`flex items-center gap-2 px-5 py-2 text-sm rounded-lg font-medium transition-colors
                            ${
                                files.length === 0 || generating
                                    ? "bg-sky-200 text-sky-400 cursor-not-allowed"
                                    : "bg-sky-600 text-white hover:bg-sky-700"
                            }`}
                >
                    {generating && <FaSpinner className="animate-spin" size={13} />}
                    {generating ? "Generating..." : "Generate Schemas"}
                </button>
            </div>
        </Popup>
    );
};
