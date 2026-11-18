import { useRef, useState } from "react";
import { DropdownMenu, Popover } from "radix-ui";
import { toast } from "sonner";
import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ArrowUpTrayIcon,
    ArrowUturnLeftIcon,
    ChevronDownIcon,
    CloudArrowDownIcon,
} from "@heroicons/react/24/outline";

import type { StudioContracts } from "@pages/protocol-studio/hooks/use-studio-contracts";
import { useSpecPortal } from "@pages/protocol-studio/ui/editor/stages/specification/portal";
import {
    CONTRACT_FILE_IDS,
    decodeText,
    type ContractFileId,
    type RankedBranch,
} from "@pages/protocol-studio/ui/editor/contracts/github";

interface IContractBarProps {
    contracts: StudioContracts;
    onSelectFile: (file: ContractFileId) => void;
}

const short = (sha?: string) => (sha ? sha.slice(0, 7) : "");

const downloadText = (fileName: string, text: string) => {
    const url = URL.createObjectURL(new Blob([text], { type: "application/yaml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

/** Download names: `<domain>_<version>_<file path with / → _>`, e.g. `TRV11_2.1.0_config_validations_index.yaml`. */
const exportName = (contracts: StudioContracts, id: ContractFileId) => {
    const set = contracts.set;
    const base = `${set?.domain.replace(/^ONDC:/i, "").replace(/:/g, "-") ?? "spec"}_${set?.version ?? ""}`;
    const path = contracts.files[id].path ?? contracts.files[id].label;
    return `${base}_${path.replace(/\//g, "_")}`;
};

/**
 * Where the contract files come from and what has changed: the branch and
 * commit they were imported at, each file's state, and import / upload /
 * refresh / export / revert.
 */
export const ContractBar = ({ contracts, onSelectFile }: IContractBarProps) => {
    const { branch, files, set } = contracts;
    const [pickerOpen, setPickerOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [armed, setArmed] = useState<string | null>(null);
    const uploadRef = useRef<HTMLInputElement>(null);
    const portal = useSpecPortal();
    const dirty = CONTRACT_FILE_IDS.filter((id) => files[id].dirty);

    /** Importing drops edits: with edits pending it takes a second click. */
    const importBranch = async (target: { branch: string; sha: string }) => {
        const token = `${target.branch}@${target.sha}`;
        if (dirty.length && armed !== token) {
            setArmed(token);
            return;
        }
        setArmed(null);
        setPickerOpen(false);
        const ok = await contracts.ops.importFromGithub(target.branch, target.sha);
        if (ok) toast.success(`Imported ${target.branch} @ ${short(target.sha)}`);
    };

    const exportFiles = (ids: ContractFileId[]) => {
        for (const id of ids) {
            const text = files[id].text;
            if (text !== undefined) downloadText(exportName(contracts, id), text);
        }
    };

    const onUpload = async (list: FileList | null) => {
        for (const file of Array.from(list ?? [])) {
            const text = decodeText(await file.arrayBuffer());
            const result = contracts.ops.upload(file.name, text);
            if (result.ok) toast.success(`${file.name} → ${files[result.id].label}`);
            else toast.error(result.error);
        }
        if (uploadRef.current) uploadRef.current.value = "";
    };

    const branchRow = (ref: RankedBranch | { branch: string; sha: string }, label?: string) => {
        const token = `${ref.branch}@${ref.sha}`;
        const current = branch.current?.branch === ref.branch && branch.current?.sha === ref.sha;
        return (
            <li key={ref.branch}>
                <button
                    type="button"
                    className="studio-spec-branch"
                    data-current={current || undefined}
                    onClick={() => void importBranch(ref)}
                >
                    <span className="studio-mono truncate">{ref.branch}</span>
                    {label ? <span className="studio-badge">{label}</span> : null}
                    <span className="studio-text-faint studio-mono ml-auto text-[11px]">
                        {short(ref.sha)}
                    </span>
                    {armed === token ? (
                        <span className="studio-spec-bad">
                            click again: drops {dirty.length} edited
                        </span>
                    ) : null}
                </button>
            </li>
        );
    };

    const needle = query.trim().toLowerCase();
    const suggested = branch.ranked.filter(
        (r) => r.score >= 50 && (!needle || r.branch.toLowerCase().includes(needle))
    );
    const others = branch.ranked.filter(
        (r) => r.score < 50 && (!needle || r.branch.toLowerCase().includes(needle))
    );

    return (
        <div
            className="studio-spec-header-row studio-spec-bar"
            data-row="contract"
            data-contract-source={contracts.sourceKind}
            data-contract-branch={branch.current?.branch}
            data-contract-sha={branch.current?.sha}
            data-contract-dirty={dirty.length}
        >
            <span className="studio-eyebrow studio-spec-header-label">Contract</span>
            <Popover.Root
                open={pickerOpen}
                onOpenChange={(open) => {
                    setPickerOpen(open);
                    setArmed(null);
                    if (open) branch.load();
                }}
            >
                <Popover.Trigger asChild>
                    <button
                        type="button"
                        className="studio-key studio-key-sm studio-spec-branch-trigger"
                        data-action="choose-branch"
                    >
                        <CloudArrowDownIcon />
                        {branch.current ? (
                            <>
                                <span className="studio-mono truncate">
                                    {branch.current.branch}
                                </span>
                                <span className="studio-text-faint studio-mono">
                                    @{short(branch.current.sha)}
                                </span>
                            </>
                        ) : set?.source.kind === "upload" ? (
                            <span>uploaded files</span>
                        ) : (
                            <span>Import from GitHub</span>
                        )}
                        <ChevronDownIcon />
                    </button>
                </Popover.Trigger>
                <Popover.Portal container={portal}>
                    <Popover.Content
                        className="studio-glass studio-spec-picker"
                        align="start"
                        sideOffset={6}
                    >
                        <p className="studio-eyebrow">ONDC-Official/automation-specifications</p>
                        <input
                            className="bp-input"
                            autoFocus
                            placeholder="Find a branch…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {branch.loading && !branch.ranked.length ? (
                            <p className="studio-spec-hint">Loading branches…</p>
                        ) : null}
                        {branch.error ? <p className="studio-spec-bad">{branch.error}</p> : null}
                        {suggested.length ? (
                            <>
                                <p className="studio-spec-hint">For this domain and version</p>
                                <ul>
                                    {suggested.map((ref) =>
                                        branchRow(
                                            ref,
                                            ref.label === "match" ? undefined : ref.label
                                        )
                                    )}
                                </ul>
                            </>
                        ) : null}
                        {others.length ? (
                            <>
                                <p className="studio-spec-hint">Same domain</p>
                                <ul>{others.slice(0, 40).map((ref) => branchRow(ref))}</ul>
                            </>
                        ) : null}
                        {!branch.loading && !suggested.length && !others.length && !branch.error ? (
                            <p className="studio-spec-hint">No branch matches.</p>
                        ) : null}
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>

            <div className="studio-spec-pills">
                {CONTRACT_FILE_IDS.map((id) => {
                    const view = files[id];
                    const errors = view.parsed?.errors.length ?? 0;
                    // A file whose GitHub copy didn't load: the pill retries it.
                    if (view.error !== undefined) {
                        return (
                            <button
                                key={id}
                                type="button"
                                className="studio-spec-pill"
                                data-contract-file={id}
                                data-state="failed"
                                onClick={() => {
                                    contracts.retry();
                                    onSelectFile(id);
                                }}
                                title={`Couldn't load ${view.path ?? view.label} from GitHub: ${view.error}. Click to retry.`}
                            >
                                <span
                                    className="studio-spec-dot"
                                    data-state="failed"
                                    aria-hidden="true"
                                />
                                <span className="studio-mono">{view.label}</span>
                                <span className="studio-spec-delta">Couldn't load — Retry</span>
                            </button>
                        );
                    }
                    const state = errors
                        ? "error"
                        : view.dirty
                          ? view.source === "upload"
                              ? "uploaded"
                              : "edited"
                          : view.source === "endpoint"
                            ? "readonly"
                            : view.text === undefined
                              ? "missing"
                              : "clean";
                    return (
                        <button
                            key={id}
                            type="button"
                            className="studio-spec-pill"
                            data-contract-file={id}
                            data-state={state}
                            onClick={() => onSelectFile(id)}
                            title={
                                state === "readonly"
                                    ? "The spec service's copy: read-only until imported"
                                    : state === "missing"
                                      ? view.loading
                                          ? "Loading…"
                                          : "Not in this branch"
                                      : (view.path ?? view.label)
                            }
                        >
                            <span
                                className="studio-spec-dot"
                                data-state={state}
                                aria-hidden="true"
                            />
                            <span className="studio-mono">{view.label}</span>
                            {view.delta ? (
                                <span className="studio-spec-delta">
                                    +{view.delta.added} −{view.delta.removed}
                                </span>
                            ) : state === "uploaded" ? (
                                <span className="studio-spec-delta">uploaded</span>
                            ) : errors ? (
                                <span className="studio-spec-delta">{errors} err</span>
                            ) : null}
                        </button>
                    );
                })}
            </div>

            <span className="min-w-0 flex-1" />

            {branch.upstreamChanged && branch.headSha && branch.current ? (
                <button
                    type="button"
                    className="studio-key studio-key-sm"
                    data-tone="accent"
                    onClick={() =>
                        void importBranch({ branch: branch.current!.branch, sha: branch.headSha! })
                    }
                    title={`${branch.current.branch} moved to ${short(branch.headSha)}`}
                >
                    {armed === `${branch.current.branch}@${branch.headSha}`
                        ? `Drop ${dirty.length} edited & update?`
                        : `Newer commit · update`}
                </button>
            ) : null}
            {branch.current ? (
                <button
                    type="button"
                    className="studio-key studio-key-sm studio-key-icon"
                    onClick={() => {
                        branch.load();
                        toast.info("Checking GitHub for a newer commit…");
                    }}
                    title="Check the branch for newer commits"
                    aria-label="Refresh"
                >
                    <ArrowPathIcon />
                </button>
            ) : null}
            <button
                type="button"
                className="studio-key studio-key-sm"
                onClick={() => uploadRef.current?.click()}
                data-action="upload-contract"
                title="Upload actions / validations / openapi YAML (kind is detected)"
            >
                <ArrowUpTrayIcon />
                Upload
            </button>
            <input
                ref={uploadRef}
                type="file"
                accept=".yaml,.yml"
                multiple
                hidden
                onChange={(e) => void onUpload(e.target.files)}
            />
            <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                    <button
                        type="button"
                        className="studio-key studio-key-sm"
                        data-action="export-contracts"
                        disabled={!set}
                    >
                        <ArrowDownTrayIcon />
                        Export
                        <ChevronDownIcon />
                    </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal container={portal}>
                    <DropdownMenu.Content
                        className="studio-glass studio-spec-menu"
                        align="end"
                        sideOffset={6}
                    >
                        <DropdownMenu.Item
                            className="studio-menu-item"
                            disabled={!dirty.length}
                            onSelect={() => exportFiles(dirty)}
                        >
                            Edited files ({dirty.length})
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            className="studio-menu-item"
                            onSelect={() => exportFiles(CONTRACT_FILE_IDS)}
                        >
                            All three
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="studio-spec-menu-sep" />
                        {CONTRACT_FILE_IDS.map((id) => (
                            <DropdownMenu.Item
                                key={id}
                                className="studio-menu-item"
                                disabled={files[id].text === undefined}
                                onSelect={() => exportFiles([id])}
                            >
                                {files[id].label}
                                {files[id].dirty ? (
                                    <span className="studio-badge ml-auto">edited</span>
                                ) : null}
                            </DropdownMenu.Item>
                        ))}
                        {dirty.length ? (
                            <>
                                <DropdownMenu.Separator className="studio-spec-menu-sep" />
                                {dirty.map((id) => (
                                    <DropdownMenu.Item
                                        key={id}
                                        className="studio-menu-item"
                                        data-tone="danger"
                                        data-action="revert-contract"
                                        onSelect={() => {
                                            contracts.ops.revert(id);
                                            toast.success(
                                                `${files[id].label} is back to ${files[id].source === "upload" ? "nothing" : "the GitHub version"}`
                                            );
                                        }}
                                    >
                                        <ArrowUturnLeftIcon />
                                        Revert {files[id].label}
                                    </DropdownMenu.Item>
                                ))}
                            </>
                        ) : null}
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
        </div>
    );
};

export default ContractBar;
