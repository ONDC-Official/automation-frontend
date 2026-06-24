import { useContext, useState, useEffect, useMemo } from "react";
import {
    ArrowRightIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    ClockIcon,
    DocumentIcon,
    FolderIcon,
    FolderPlusIcon,
    InboxIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/Shadcn/Button/button";
import { Input } from "@/components/Shadcn/TextField/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/Shadcn/Dialog";
import GitHubIcon from "@/assets/svgs/GitHubIcon";
import { cn } from "@/lib/utils";
import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";
import { SavedConfigMetadata } from "@pages/protocol-playground/utils/config-storage";
import type {
    IDomainFolderProps,
    IFlowRowProps,
    ISavedConfigsModalProps,
    IVersionFolderProps,
    DomainNode,
} from "@pages/protocol-playground/ui/types";

const toggleSetItem = (prev: Set<string>, key: string) => {
    const next = new Set(prev);
    if (next.has(key)) {
        next.delete(key);
    } else {
        next.add(key);
    }
    return next;
};

const FlowRow = ({ config, onLoad, onDelete }: IFlowRowProps) => {
    const isGist = config.configId.startsWith("gist_");

    return (
        <div className="group flex items-center gap-2 rounded-lg border border-transparent py-2 pr-2 pl-4 transition-colors hover:border-brand-light-active hover:bg-brand-light dark:hover:border-border-default dark:hover:bg-surface-muted">
            <div className="flex shrink-0 items-center gap-2 text-text-secondary">
                <span className="h-px w-4 bg-border-default" />
                <DocumentIcon className="size-3.5 shrink-0 text-brand-normal" />
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate text-sm font-medium text-text-primary">
                    {config.flowId}
                </span>
                {isGist && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded border border-border-default bg-surface-muted px-1.5 py-0.5 text-xs font-medium text-text-secondary">
                        <GitHubIcon className="size-2.5" />
                        Gist
                    </span>
                )}
            </div>

            <div className="mr-2 flex shrink-0 items-center gap-1 text-xs text-text-secondary">
                <ClockIcon className="size-3" />
                {new Date(config.savedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                })}
            </div>

            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button size="xs" onClick={() => onLoad(config)} title="Load configuration">
                    Load
                    <ArrowRightIcon className="size-3" />
                </Button>
                <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => onDelete(config)}
                    title="Delete configuration"
                    className="text-text-secondary hover:bg-error-50 hover:text-error-500"
                >
                    <TrashIcon className="size-3.5" />
                </Button>
            </div>
        </div>
    );
};

const VersionFolder = ({
    node,
    domainKey,
    openVersions,
    onToggle,
    onLoad,
    onDelete,
}: IVersionFolderProps) => {
    const key = `${domainKey}::${node.version}`;
    const isOpen = openVersions.has(key);

    return (
        <div>
            <button
                type="button"
                onClick={() => onToggle(key)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-muted"
            >
                <div className="flex items-center gap-1.5 text-text-secondary">
                    <span className="h-px w-4 bg-border-default" />
                    {isOpen ? (
                        <ChevronDownIcon className="size-3.5" />
                    ) : (
                        <ChevronRightIcon className="size-3.5" />
                    )}
                </div>
                {isOpen ? (
                    <FolderPlusIcon className="size-4 shrink-0 text-alert-500" />
                ) : (
                    <FolderIcon className="size-4 shrink-0 text-alert-500" />
                )}
                <span className="text-sm font-semibold text-text-secondary">v{node.version}</span>
                <span className="ml-auto text-xs font-normal text-text-secondary">
                    {node.flows.length} flow{node.flows.length !== 1 ? "s" : ""}
                </span>
            </button>

            {isOpen && (
                <div className="mt-0.5 ml-8 space-y-0.5 border-l border-border-default pl-2">
                    {node.flows.map((f) => (
                        <FlowRow
                            key={f.config.configId}
                            config={f.config}
                            onLoad={onLoad}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const DomainFolder = ({
    node,
    openDomains,
    openVersions,
    onToggleDomain,
    onToggleVersion,
    onLoad,
    onDelete,
}: IDomainFolderProps) => {
    const isOpen = openDomains.has(node.domain);

    return (
        <div className="overflow-hidden rounded-xl border border-n-30 bg-surface-elevated shadow-sm dark:border-border-default">
            <button
                type="button"
                onClick={() => onToggleDomain(node.domain)}
                className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
            >
                {isOpen ? (
                    <ChevronDownIcon className="size-4 shrink-0 text-text-secondary" />
                ) : (
                    <ChevronRightIcon className="size-4 shrink-0 text-text-secondary" />
                )}
                {isOpen ? (
                    <FolderPlusIcon className="size-5 shrink-0 text-brand-normal" />
                ) : (
                    <FolderIcon className="size-5 shrink-0 text-brand-normal" />
                )}
                <span className="text-sm font-semibold text-text-primary">{node.domain}</span>
                <div className="ml-auto flex items-center gap-2">
                    <span className="rounded-full border border-brand-light-active bg-brand-light px-2 py-0.5 text-xs font-medium text-brand-normal dark:border-border-default dark:bg-surface-muted dark:text-text-secondary">
                        {node.versions.length} version{node.versions.length !== 1 ? "s" : ""}
                    </span>
                    <span className="rounded-full border border-border-default bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-secondary">
                        {node.totalConfigs} config{node.totalConfigs !== 1 ? "s" : ""}
                    </span>
                </div>
            </button>

            {isOpen && (
                <div className="space-y-0.5 border-t border-border-default bg-surface-muted/40 px-3 pt-1 pb-3">
                    {node.versions.map((v) => (
                        <VersionFolder
                            key={v.version}
                            node={v}
                            domainKey={node.domain}
                            openVersions={openVersions}
                            onToggle={onToggleVersion}
                            onLoad={onLoad}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const SavedConfigsModal = ({
    isOpen,
    onClose,
    onConfigSelected,
}: ISavedConfigsModalProps) => {
    const { getSavedConfigs, loadSavedConfig, deleteSavedConfig } = useContext(PlaygroundContext);

    const [savedConfigs, setSavedConfigs] = useState<SavedConfigMetadata[]>([]);
    const [openDomains, setOpenDomains] = useState<Set<string>>(new Set());
    const [openVersions, setOpenVersions] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (isOpen) {
            const configs = getSavedConfigs();
            setSavedConfigs(configs);

            const domains = [...new Set(configs.map((c) => c.domain))];
            if (domains.length === 1) {
                setOpenDomains(new Set(domains));
            }
        }
    }, [isOpen, getSavedConfigs]);

    const tree = useMemo<DomainNode[]>(() => {
        const q = search.toLowerCase().trim();
        const filtered = q
            ? savedConfigs.filter(
                  (c) =>
                      c.domain.toLowerCase().includes(q) ||
                      c.version.toLowerCase().includes(q) ||
                      c.flowId.toLowerCase().includes(q)
              )
            : savedConfigs;

        const domainMap = new Map<string, Map<string, SavedConfigMetadata[]>>();
        for (const cfg of filtered) {
            if (!domainMap.has(cfg.domain)) domainMap.set(cfg.domain, new Map());
            const verMap = domainMap.get(cfg.domain)!;
            if (!verMap.has(cfg.version)) verMap.set(cfg.version, []);
            verMap.get(cfg.version)!.push(cfg);
        }

        return [...domainMap.entries()].map(([domain, verMap]) => {
            const versions = [...verMap.entries()].map(([version, cfgs]) => ({
                version,
                flows: cfgs
                    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
                    .map((c) => ({ config: c })),
            }));
            versions.sort((a, b) => a.version.localeCompare(b.version));
            return {
                domain,
                versions,
                totalConfigs: versions.reduce((s, v) => s + v.flows.length, 0),
            };
        });
    }, [savedConfigs, search]);

    useEffect(() => {
        if (search.trim()) {
            const allDomains = new Set(tree.map((d) => d.domain));
            const allVersionKeys = new Set(
                tree.flatMap((d) => d.versions.map((v) => `${d.domain}::${v.version}`))
            );
            setOpenDomains(allDomains);
            setOpenVersions(allVersionKeys);
        }
    }, [search, tree]);

    const toggleDomain = (domain: string) => {
        setOpenDomains((prev) => toggleSetItem(prev, domain));
    };

    const toggleVersion = (key: string) => {
        setOpenVersions((prev) => toggleSetItem(prev, key));
    };

    const handleLoad = (config: SavedConfigMetadata) => {
        const success = loadSavedConfig(config.configId);
        if (success) {
            onConfigSelected(config.domain, config.version, config.flowId);
            onClose();
        }
    };

    const handleDelete = (config: SavedConfigMetadata) => {
        if (window.confirm(`Delete "${config.domain} / v${config.version} / ${config.flowId}"?`)) {
            deleteSavedConfig(config.configId);
            setSavedConfigs(getSavedConfigs());
        }
    };

    const domainCount = useMemo(
        () => new Set(savedConfigs.map((c) => c.domain)).size,
        [savedConfigs]
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="flex max-h-[80vh] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="border-b border-border-default px-6 py-4">
                    <DialogTitle>Saved Configurations</DialogTitle>
                    <DialogDescription>
                        {savedConfigs.length} configuration{savedConfigs.length !== 1 ? "s" : ""}{" "}
                        across {domainCount} domain{domainCount !== 1 ? "s" : ""}
                    </DialogDescription>
                </DialogHeader>

                {savedConfigs.length > 0 && (
                    <div className="border-b border-border-default px-6 py-3">
                        <Input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter by domain, version, or flow…"
                        />
                    </div>
                )}

                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                    {tree.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-border-default bg-surface-muted">
                                <InboxIcon className="size-6 text-text-secondary" />
                            </div>
                            <p className="text-sm font-medium text-text-secondary">
                                {search ? "No matching configurations" : "No saved configurations"}
                            </p>
                            <p className="mt-1 max-w-xs text-xs text-text-secondary">
                                {search
                                    ? "Try a different search term"
                                    : "Save a configuration from the playground to access it here"}
                            </p>
                        </div>
                    ) : (
                        tree.map((domainNode) => (
                            <DomainFolder
                                key={domainNode.domain}
                                node={domainNode}
                                openDomains={openDomains}
                                openVersions={openVersions}
                                onToggleDomain={toggleDomain}
                                onToggleVersion={toggleVersion}
                                onLoad={handleLoad}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>

                <DialogFooter
                    className={cn("border-t border-border-default bg-surface-muted/60 px-6 py-3")}
                >
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
