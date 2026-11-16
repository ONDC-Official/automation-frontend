import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { ContractFileId } from "@pages/protocol-studio/ui/editor/contracts/github";

/**
 * Protocol Studio's API contract files for a domain + version: `actions`,
 * `validations` and `specs` (the spec repo's `config/actions/index.yaml`,
 * `config/validations/index.yaml`, `config/specs/openapi.yaml`). Persisted
 * under `persist:studioContracts`, apart from the draft, so the draft's
 * frequent autosave never re-serialises these large texts.
 *
 * Only text that can't be fetched again is stored: a GitHub import keeps the
 * commit it came from and each file's hash; a file's text is stored once it
 * is edited (or uploaded). Unedited files are re-read from GitHub by commit.
 *
 * Bump `STUDIO_CONTRACTS_VERSION` when the shape changes, and add a step to
 * `MIGRATIONS` (see `studioDraftSlice` for the same pattern).
 */
export const STUDIO_CONTRACTS_VERSION = 1;

export type ContractSetSource =
    | { kind: "github"; repo: string; branch: string; sha: string; importedAt: string }
    | { kind: "upload" };

export interface ContractFileState {
    /** Repo path of the GitHub file, or the uploaded file's name. */
    path: string;
    /** A GitHub base exists for this file (else it only exists as an upload). */
    hasBase: boolean;
    /** fnv1a + length of the GitHub base text. */
    baseHash: string;
    baseSize: number;
    /** The current text, ONLY when it differs from the base (edited) or came from an upload. */
    text?: string;
    /** The upload's file name, while the text is an upload. */
    uploadedAs?: string;
    editedAt?: string;
}

export interface ContractSet {
    domain: string;
    version: string;
    source: ContractSetSource;
    files: Partial<Record<ContractFileId, ContractFileState>>;
    updatedAt: string;
}

export interface IStudioContractsState {
    version: number;
    /** By `contractSetKey(domain, version)`. */
    sets: Record<string, ContractSet>;
}

export const contractSetKey = (domain: string, version: string) => `${domain}::${version}`;

const initialState: IStudioContractsState = { version: STUDIO_CONTRACTS_VERSION, sets: {} };

const now = () => new Date().toISOString();

const studioContractsSlice = createSlice({
    name: "studioContracts",
    initialState,
    reducers: {
        /** A fresh import replaces the set: edits to the old one are dropped (the UI confirms first). */
        importContractSet: (
            state,
            action: PayloadAction<{
                domain: string;
                version: string;
                source: Extract<ContractSetSource, { kind: "github" }>;
                files: Partial<
                    Record<ContractFileId, { path: string; baseHash: string; baseSize: number }>
                >;
            }>
        ) => {
            const { domain, version, source, files } = action.payload;
            const set: ContractSet = { domain, version, source, files: {}, updatedAt: now() };
            for (const [id, file] of Object.entries(files)) {
                if (file) set.files[id as ContractFileId] = { ...file, hasBase: true };
            }
            state.sets[contractSetKey(domain, version)] = set;
        },
        /** The file's current text; null = it matches its base again (nothing to store). */
        setContractFileText: (
            state,
            action: PayloadAction<{ key: string; file: ContractFileId; text: string | null }>
        ) => {
            const { key, file, text } = action.payload;
            const entry = state.sets[key]?.files[file];
            if (!entry) return;
            if (text === null) {
                delete entry.text;
                delete entry.editedAt;
                delete entry.uploadedAs;
            } else {
                entry.text = text;
                entry.editedAt = now();
            }
            state.sets[key]!.updatedAt = now();
        },
        uploadContractFile: (
            state,
            action: PayloadAction<{
                domain: string;
                version: string;
                file: ContractFileId;
                fileName: string;
                text: string;
            }>
        ) => {
            const { domain, version, file, fileName, text } = action.payload;
            const key = contractSetKey(domain, version);
            const set =
                state.sets[key] ??
                (state.sets[key] = {
                    domain,
                    version,
                    source: { kind: "upload" },
                    files: {},
                    updatedAt: now(),
                });
            const existing = set.files[file];
            set.files[file] = {
                path: existing?.hasBase ? existing.path : fileName,
                hasBase: existing?.hasBase ?? false,
                baseHash: existing?.baseHash ?? "",
                baseSize: existing?.baseSize ?? 0,
                text,
                uploadedAs: fileName,
                editedAt: now(),
            };
            set.updatedAt = now();
        },
        /** Back to the GitHub base; a file that only exists as an upload is dropped. */
        revertContractFile: (
            state,
            action: PayloadAction<{ key: string; file: ContractFileId }>
        ) => {
            const set = state.sets[action.payload.key];
            const entry = set?.files[action.payload.file];
            if (!set || !entry) return;
            if (entry.hasBase) {
                delete entry.text;
                delete entry.editedAt;
                delete entry.uploadedAs;
            } else {
                delete set.files[action.payload.file];
            }
            set.updatedAt = now();
        },
        forgetContractSet: (state, action: PayloadAction<{ key: string }>) => {
            delete state.sets[action.payload.key];
        },
    },
});

export const {
    importContractSet,
    setContractFileText,
    uploadContractFile,
    revertContractFile,
    forgetContractSet,
} = studioContractsSlice.actions;

/** Brings an older persisted shape forward, by version (none yet). */
const MIGRATIONS: Record<number, (state: IStudioContractsState) => IStudioContractsState> = {};

export const migrateStudioContracts = (state: IStudioContractsState): IStudioContractsState => {
    let current: IStudioContractsState | null = state;
    while (current && current.version !== STUDIO_CONTRACTS_VERSION) {
        const migrate: ((s: IStudioContractsState) => IStudioContractsState) | undefined =
            MIGRATIONS[current.version];
        current = migrate ? migrate(current) : null;
    }
    // A shape no migration reaches is ignored (left in storage), never deleted.
    return current ?? initialState;
};

export const selectContractSet = (state: { studioContracts: IStudioContractsState }, key: string) =>
    migrateStudioContracts(state.studioContracts).sets[key] ?? null;

/** Characters of text the slice persists (edited and uploaded files only), for the quota guard. */
export const persistedContractChars = (state: { studioContracts: IStudioContractsState }) =>
    Object.values(state.studioContracts.sets).reduce(
        (sum, set) =>
            sum + Object.values(set.files).reduce((n, f) => n + (f?.text?.length ?? 0), 0),
        0
    );

export default studioContractsSlice;
