import { useEffect, useState } from "react";
import { parse as yamlParse } from "yaml";
import MockRunner, { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";
import {
    fetchBranches,
    fetchFlowFolders,
    fetchYamlFiles,
    fetchRawYaml,
    matchDomainToBranch,
    GitHubFile,
} from "@pages/protocol-playground/utils/fetch-github";
import { FaGithub, FaSpinner } from "react-icons/fa";
import Popup from "@components/ui/pop-up/pop-up";
import { SelectBox, Spinner } from "@pages/protocol-playground/ui/components/github-select";

interface GitHubImportModalProps {
    isOpen: boolean;
    defaultDomain?: string;
    onClose: () => void;
    onImport: (config: MockPlaygroundConfigType) => void;
}

export const GitHubImportModal = ({
    isOpen,
    defaultDomain,
    onClose,
    onImport,
}: GitHubImportModalProps) => {
    const [branches, setBranches] = useState<string[]>([]);
    const [selectedBranch, setSelectedBranch] = useState("");
    const [folders, setFolders] = useState<string[]>([]);
    const [selectedFolder, setSelectedFolder] = useState("");
    const [files, setFiles] = useState<GitHubFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<GitHubFile | null>(null);

    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch branches when modal opens
    useEffect(() => {
        if (!isOpen) return;
        setLoadingBranches(true);
        setError(null);
        fetchBranches()
            .then((data) => {
                setBranches(data);
                // Auto-select branch matching the current domain
                const matched = defaultDomain
                    ? matchDomainToBranch(defaultDomain, data)
                    : undefined;
                const initial = matched ?? data[0] ?? "";
                setSelectedBranch(initial);
            })
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoadingBranches(false));
    }, [isOpen, defaultDomain]);

    // Fetch folders when branch changes
    useEffect(() => {
        if (!selectedBranch) return;
        setSelectedFolder("");
        setFiles([]);
        setSelectedFile(null);
        setFolders([]);
        setLoadingFolders(true);
        setError(null);
        fetchFlowFolders(selectedBranch)
            .then((data) => {
                setFolders(data);
                if (data.length > 0) setSelectedFolder(data[0]);
            })
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoadingFolders(false));
    }, [selectedBranch]);

    // Fetch files when folder changes
    useEffect(() => {
        if (!selectedBranch || !selectedFolder) return;
        setFiles([]);
        setSelectedFile(null);
        setLoadingFiles(true);
        setError(null);
        fetchYamlFiles(selectedBranch, selectedFolder)
            .then(setFiles)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoadingFiles(false));
    }, [selectedBranch, selectedFolder]);

    const resetAndClose = () => {
        setBranches([]);
        setSelectedBranch("");
        setFolders([]);
        setSelectedFolder("");
        setFiles([]);
        setSelectedFile(null);
        setError(null);
        onClose();
    };

    const handleImport = async () => {
        if (!selectedFile) return;
        setImporting(true);
        setError(null);
        try {
            const rawYaml = await fetchRawYaml(selectedFile.download_url);
            const parsed = yamlParse(rawYaml) as MockPlaygroundConfigType;
            const validation = new MockRunner(parsed).validateConfig();
            if (!validation.success) {
                setError(`Invalid config: ${validation.errors?.join(", ") || "unknown error"}`);
                return;
            }
            onImport(parsed);
            resetAndClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to import file");
        } finally {
            setImporting(false);
        }
    };

    // Breadcrumb: show what is selected so far
    const crumbs = [selectedBranch, selectedFolder, selectedFile?.name].filter(Boolean).join(" / ");

    return (
        <Popup isOpen={isOpen} onClose={resetAndClose}>
            {/* Header */}
            <div className="flex items-center gap-2.5 px-2 py-2 border-b border-gray-100">
                <FaGithub size={20} className="text-gray-800" />
                <div>
                    <h2 className="text-base font-semibold text-gray-800 leading-tight">
                        Import Flow from GitHub
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

                {/* Flow Folder */}
                <SelectBox
                    label="Flow Folder"
                    value={selectedFolder}
                    options={folders}
                    disabled={!selectedBranch || loadingFolders || folders.length === 0}
                    loading={loadingFolders}
                    placeholder={selectedBranch ? "Select a flow folder" : "Select domain first"}
                    onChange={(v) => setSelectedFolder(v)}
                />

                {/* File list */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                        Flow File
                        {loadingFiles && <Spinner />}
                    </label>

                    {!selectedFolder ? (
                        <p className="text-xs text-gray-400 px-1">Select a flow folder first</p>
                    ) : loadingFiles ? (
                        <p className="text-xs text-gray-400 px-1">Loading files...</p>
                    ) : files.length === 0 ? (
                        <p className="text-xs text-gray-400 px-1">
                            No YAML files found in this folder
                        </p>
                    ) : (
                        <div className="border border-sky-100 rounded-lg overflow-y-auto max-h-48 divide-y divide-gray-50">
                            {files.map((file) => {
                                const isSelected = selectedFile?.name === file.name;
                                return (
                                    <button
                                        key={file.name}
                                        onClick={() => setSelectedFile(file)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors
                                                ${
                                                    isSelected
                                                        ? "bg-sky-50 text-sky-700 font-medium"
                                                        : "text-gray-700 hover:bg-gray-50"
                                                }`}
                                    >
                                        <span
                                            className={`w-3 h-3 rounded-full border-2 shrink-0 transition-colors
                                                    ${isSelected ? "border-sky-500 bg-sky-500" : "border-gray-300"}`}
                                        />
                                        {file.name}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Inline error */}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                        {error}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
                <button
                    onClick={resetAndClose}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleImport}
                    disabled={!selectedFile || importing}
                    className={`flex items-center gap-2 px-5 py-2 text-sm rounded-lg font-medium transition-colors
                            ${
                                !selectedFile || importing
                                    ? "bg-sky-200 text-sky-400 cursor-not-allowed"
                                    : "bg-sky-600 text-white hover:bg-sky-700"
                            }`}
                >
                    {importing && <FaSpinner className="animate-spin" size={13} />}
                    {importing ? "Importing..." : "Import Selected File"}
                </button>
            </div>
        </Popup>
    );
};
