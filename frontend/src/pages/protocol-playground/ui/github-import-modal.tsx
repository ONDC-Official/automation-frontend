import { useEffect, useState } from "react";
import { parse as yamlParse } from "yaml";
import { MockRunner, MockPlaygroundConfigType } from "@ondc/automation-mock-runner";

import { Button } from "@/components/Shadcn/Button/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/Shadcn/Dialog/dialog";
import GitHubIcon from "@/assets/svgs/GitHubIcon";
import { cn } from "@/lib/utils";
import {
    fetchBranches,
    fetchFlowFolders,
    fetchYamlFiles,
    fetchRawYaml,
    matchDomainToBranch,
    GitHubFile,
} from "@pages/protocol-playground/utils/fetch-github";
import { SelectBox, Spinner } from "@pages/protocol-playground/ui/components/github-select";

interface IGitHubImportModalProps {
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
}: IGitHubImportModalProps) => {
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
                const initial = matched ?? data[0] ?? "";
                setSelectedBranch(initial);
            })
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoadingBranches(false));
    }, [isOpen, defaultDomain]);

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

    const crumbs = [selectedBranch, selectedFolder, selectedFile?.name].filter(Boolean).join(" / ");

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
            <DialogContent className="flex max-w-lg flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="flex flex-row items-center gap-2.5 border-b border-border-default px-6 py-4">
                    <GitHubIcon className="size-5 text-text-primary" />
                    <div className="min-w-0">
                        <DialogTitle>Import Flow from GitHub</DialogTitle>
                        {crumbs && (
                            <DialogDescription className="mt-0.5 max-w-xs truncate font-mono text-brand-normal">
                                {crumbs}
                            </DialogDescription>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex flex-col gap-5 px-6 py-5">
                    <SelectBox
                        label="Domain (Branch)"
                        value={selectedBranch}
                        options={branches}
                        disabled={branches.length === 0}
                        loading={loadingBranches}
                        placeholder="Loading branches..."
                        onChange={(v) => setSelectedBranch(v)}
                    />

                    <SelectBox
                        label="Flow Folder"
                        value={selectedFolder}
                        options={folders}
                        disabled={!selectedBranch || loadingFolders || folders.length === 0}
                        loading={loadingFolders}
                        placeholder={
                            selectedBranch ? "Select a flow folder" : "Select domain first"
                        }
                        onChange={(v) => setSelectedFolder(v)}
                    />

                    <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-1 text-sm font-semibold text-text-secondary">
                            Flow File
                            {loadingFiles && <Spinner />}
                        </label>

                        {!selectedFolder ? (
                            <p className="px-1 text-xs text-text-secondary">
                                Select a flow folder first
                            </p>
                        ) : loadingFiles ? (
                            <p className="px-1 text-xs text-text-secondary">Loading files...</p>
                        ) : files.length === 0 ? (
                            <p className="px-1 text-xs text-text-secondary">
                                No YAML files found in this folder
                            </p>
                        ) : (
                            <div className="max-h-48 divide-y divide-border-default overflow-y-auto rounded-lg border border-border-default">
                                {files.map((file) => {
                                    const isSelected = selectedFile?.name === file.name;
                                    return (
                                        <button
                                            type="button"
                                            key={file.name}
                                            onClick={() => setSelectedFile(file)}
                                            className={cn(
                                                "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                                                isSelected
                                                    ? "bg-brand-light font-medium text-brand-normal dark:bg-surface-muted"
                                                    : "text-text-primary hover:bg-surface-muted"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "size-3 shrink-0 rounded-full border-2 transition-colors",
                                                    isSelected
                                                        ? "border-brand-normal bg-brand-normal"
                                                        : "border-border-default"
                                                )}
                                            />
                                            {file.name}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="rounded-lg border border-error-500/40 bg-error-50 px-3 py-2 text-sm text-error-500">
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t border-border-default bg-surface-muted px-6 py-4">
                    <Button variant="outline" onClick={resetAndClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!selectedFile || importing}
                        isLoading={importing}
                    >
                        {importing ? "Importing..." : "Import Selected File"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
