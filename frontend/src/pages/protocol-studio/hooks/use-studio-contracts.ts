import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    useGetSpecContractsQuery,
    useGetSpecQuery,
    useGetSpecRepoRefsQuery,
    useLazyGetSpecContractsQuery,
} from "@store/api";
import {
    contractSetKey,
    importContractSet,
    persistedContractChars,
    revertContractFile,
    selectContractSet,
    setContractFileText,
    uploadContractFile,
    type ContractSet,
} from "@store/slices/studioContractsSlice";
import { STUDIO_PERSIST_FAILED_EVENT } from "@store/persistConfig";
import { useSettledValue } from "@pages/protocol-studio/hooks/use-settled-value";
import {
    buildActionsModel,
    ENTRY_KEY,
    type ActionsModel,
} from "@pages/protocol-studio/ui/editor/contracts/actions/model";
import {
    detectContractKind,
    endpointText,
    type SpecServiceDoc,
} from "@pages/protocol-studio/ui/editor/contracts/endpoint";
import {
    CONTRACT_FILE_IDS,
    pickDefaultBranch,
    rankBranches,
    SPEC_REPO,
    type ContractFileId,
    type RankedBranch,
} from "@pages/protocol-studio/ui/editor/contracts/github";
import { fnv1a, matchesBase } from "@pages/protocol-studio/ui/editor/contracts/hash";
import {
    buildRefUsers,
    getSpecApis,
    type SpecJson,
} from "@pages/protocol-studio/ui/editor/contracts/specs/schema";
import {
    buildValidationsModel,
    flattenTests,
    type ValidationsModel,
} from "@pages/protocol-studio/ui/editor/contracts/validations/model";
import {
    buildTestIndex,
    type ApiTestIndex,
} from "@pages/protocol-studio/ui/editor/contracts/validations/test-index";
import {
    parseContract,
    toPlain,
    type ParsedContract,
} from "@pages/protocol-studio/ui/editor/contracts/yaml/parse";
import {
    applyPatches,
    invertPatches,
    lineDelta,
    type TextPatch,
} from "@pages/protocol-studio/ui/editor/contracts/yaml/patch";
import {
    EditBlockedError,
    type ContractEdit,
} from "@pages/protocol-studio/ui/editor/contracts/yaml/plan";
import type { SharedImpact } from "@pages/protocol-studio/ui/editor/contracts/yaml/shared";
import { applyEdits } from "@pages/protocol-studio/ui/editor/contracts/yaml/verify";

export const CONTRACT_FILE_LABELS: Record<ContractFileId, string> = {
    actions: "actions.yaml",
    validations: "validations.yaml",
    specs: "openapi.yaml",
};

/** Persisted edits beyond this many characters stop being saved in the browser (localStorage is ~5 MB, shared). */
const PERSIST_LIMIT_CHARS = 2_000_000;
const PARSE_SETTLE_MS = 300;
const PERSIST_SETTLE_MS = 600;
const HISTORY_CAP = 100;

export type ContractSourceKind = "github" | "upload" | "endpoint" | "none";

export interface ContractFileView {
    id: ContractFileId;
    label: string;
    /** Repo path, or the uploaded file's name. */
    path?: string;
    /** The text as typed (not yet settled). */
    text?: string;
    source: ContractSourceKind;
    editable: boolean;
    /** Differs from the GitHub base (or is an upload). */
    dirty: boolean;
    /** The settled parse of `text`. */
    parsed?: ParsedContract;
    /** Lines added / removed against the GitHub base. */
    delta?: { added: number; removed: number };
    loading: boolean;
}

export interface ApiSummary {
    api: string;
    hasSchema: boolean;
    /** Rules (leaf tests) on the api. */
    tests: number;
    /** Apis allowed next, or null when actions has no row for it. */
    next: number | null;
    prev: number;
    /** Allowed as a first call. */
    entry: boolean;
    /** Protocol nodes using it. */
    used: number;
    /** Which files mention it. */
    inActions: boolean;
    inValidations: boolean;
}

export interface ContractModels {
    actions: ActionsModel | null;
    validations: ValidationsModel | null;
    testIndex: Map<string, ApiTestIndex>;
    spec: SpecJson | null;
    specApis: string[];
    refUsers: () => Map<string, Set<string>>;
}

export type EditResult = { ok: true; impact: SharedImpact | null } | { ok: false; error: string };

interface HistoryEntry {
    inverse: TextPatch[];
    forward: TextPatch[];
    beforeHash: string;
    afterHash: string;
}

const emptyHistory = () => ({ undo: [] as HistoryEntry[], redo: [] as HistoryEntry[] });

/**
 * The last model built from a file that parsed: a typo in Source keeps the
 * structured views on what was there, instead of blanking them.
 */
const useLastGood = <T>(value: T | null, broken: boolean): T | null => {
    const [last, setLast] = useState<T | null>(null);
    useEffect(() => {
        if (value || !broken) setLast(value);
    }, [value, broken]);
    return value ?? (broken ? last : null);
};

/**
 * Protocol Studio's contract files for one domain + version: where they come
 * from (GitHub import, upload, or the spec service read-only), their current
 * text, parsed models, and every way to change them. See
 * `STUDIO_SPECIFICATION_PLAN.md`.
 */
export const useStudioContracts = (
    domain: string,
    version: string,
    usedApis: Map<string, number>
) => {
    const dispatch = useAppDispatch();
    const key = contractSetKey(domain, version);
    const set = useAppSelector((state) => selectContractSet(state, key));
    const persistedChars = useAppSelector(persistedContractChars);

    // ─── Sources ─────────────────────────────────────────────────────────────
    const spec = useGetSpecQuery(
        { domain, version, include: ["meta"] },
        { skip: !domain || !version }
    );
    const specDoc = spec.data as SpecServiceDoc | undefined;
    const github = set?.source.kind === "github" ? set.source : null;
    const needsBase =
        !!github &&
        CONTRACT_FILE_IDS.some(
            (id) => set?.files[id]?.hasBase && set.files[id]?.text === undefined
        );
    const base = useGetSpecContractsQuery(
        github
            ? { repo: github.repo, branch: github.branch, sha: github.sha }
            : { repo: "", branch: "", sha: "" },
        { skip: !github || !needsBase }
    );
    const [fetchContracts, importing] = useLazyGetSpecContractsQuery();
    const needsEndpointValidations = !set?.files.validations;
    const endpointValidations = useGetSpecQuery(
        { domain, version, include: ["validations"] },
        { skip: !domain || !version || !needsEndpointValidations }
    );

    const [wantRefs, setWantRefs] = useState(false);
    const refs = useGetSpecRepoRefsQuery({ repo: SPEC_REPO }, { skip: !wantRefs && !!set });
    const hint = specDoc?.info?.["x-branch-name"];
    const ranked = useMemo<RankedBranch[]>(
        () => (refs.data ? rankBranches(refs.data, domain, version, hint) : []),
        [refs.data, domain, version, hint]
    );
    const suggested = pickDefaultBranch(ranked);
    const head = github ? refs.data?.find((r) => r.branch === github.branch) : undefined;
    const upstreamChanged = !!github && !!head && head.sha !== github.sha;

    // ─── Current text, per keystroke ─────────────────────────────────────────
    const [drafts, setDrafts] = useState<Partial<Record<ContractFileId, string>>>({});
    useEffect(() => setDrafts({}), [key]);
    const baseTexts = base.data?.sha === github?.sha ? base.data?.texts : undefined;

    const sourceOf = useCallback(
        (id: ContractFileId, s: ContractSet | null): ContractSourceKind => {
            const file = s?.files[id];
            if (file?.uploadedAs) return "upload";
            if (file?.hasBase) return "github";
            if (file) return "upload";
            return endpointText(
                id === "validations"
                    ? (endpointValidations.data as SpecServiceDoc | undefined)
                    : specDoc,
                id
            )
                ? "endpoint"
                : "none";
        },
        [endpointValidations.data, specDoc]
    );

    const currentText = useCallback(
        (id: ContractFileId): string | undefined => {
            const draft = drafts[id];
            if (draft !== undefined) return draft;
            const file = set?.files[id];
            if (file?.text !== undefined) return file.text;
            if (file?.hasBase) return baseTexts?.[id];
            if (file) return undefined;
            const doc =
                id === "validations"
                    ? (endpointValidations.data as SpecServiceDoc | undefined)
                    : specDoc;
            return endpointText(doc, id);
        },
        [drafts, set, baseTexts, endpointValidations.data, specDoc]
    );

    const texts = useMemo(
        () =>
            Object.fromEntries(CONTRACT_FILE_IDS.map((id) => [id, currentText(id)])) as Record<
                ContractFileId,
                string | undefined
            >,
        [currentText]
    );
    // Typing is parsed once it settles; structured edits, imports and reverts at once.
    const [typed, setTyped] = useState<Partial<Record<ContractFileId, boolean>>>({});
    const settled = useSettledValue(texts, PARSE_SETTLE_MS);
    const parseInput = (id: ContractFileId) => (typed[id] ? settled[id] : texts[id]);
    const actionsInput = parseInput("actions");
    const validationsInput = parseInput("validations");
    const specsInput = parseInput("specs");
    const parsedActions = useMemo(
        () => (actionsInput !== undefined ? parseContract(actionsInput) : undefined),
        [actionsInput]
    );
    const parsedValidations = useMemo(
        () => (validationsInput !== undefined ? parseContract(validationsInput) : undefined),
        [validationsInput]
    );
    const parsedSpecs = useMemo(
        () => (specsInput !== undefined ? parseContract(specsInput) : undefined),
        [specsInput]
    );
    const parsedOf: Record<ContractFileId, ParsedContract | undefined> = {
        actions: parsedActions,
        validations: parsedValidations,
        specs: parsedSpecs,
    };
    const markTyped = (id: ContractFileId, value: boolean) =>
        setTyped((prev) => (prev[id] === value ? prev : { ...prev, [id]: value }));

    // ─── Models (last good parse) ────────────────────────────────────────────
    const actionsNow = useMemo(
        () =>
            parsedActions && !parsedActions.errors.length ? buildActionsModel(parsedActions) : null,
        [parsedActions]
    );
    const validationsNow = useMemo(
        () =>
            parsedValidations && !parsedValidations.errors.length
                ? buildValidationsModel(parsedValidations)
                : null,
        [parsedValidations]
    );
    const specNow = useMemo(
        () =>
            parsedSpecs && !parsedSpecs.errors.length
                ? ((toPlain(parsedSpecs) as SpecJson | undefined) ?? null)
                : null,
        [parsedSpecs]
    );
    const actions = useLastGood(actionsNow, !!parsedActions?.errors.length);
    const validations = useLastGood(validationsNow, !!parsedValidations?.errors.length);
    const specJson = useLastGood(specNow, !!parsedSpecs?.errors.length);
    const testIndex = useMemo(
        () => (validations ? buildTestIndex(validations) : new Map()),
        [validations]
    );
    const specApis = useMemo(() => (specJson ? getSpecApis(specJson) : []), [specJson]);
    const refUsersRef = useRef<{ spec: SpecJson | null; users: Map<string, Set<string>> } | null>(
        null
    );
    const refUsers = useCallback(() => {
        if (refUsersRef.current?.spec !== specJson) {
            refUsersRef.current = {
                spec: specJson,
                users: specJson ? buildRefUsers(specJson) : new Map(),
            };
        }
        return refUsersRef.current.users;
    }, [specJson]);

    const models: ContractModels = useMemo(
        () => ({ actions, validations, testIndex, spec: specJson, specApis, refUsers }),
        [actions, validations, testIndex, specJson, specApis, refUsers]
    );

    // ─── Persisting edits ────────────────────────────────────────────────────
    const [storageFull, setStorageFull] = useState(false);
    const [persistFailed, setPersistFailed] = useState(false);
    useEffect(() => {
        const onFail = () => setPersistFailed(true);
        window.addEventListener(STUDIO_PERSIST_FAILED_EVENT, onFail);
        return () => window.removeEventListener(STUDIO_PERSIST_FAILED_EVENT, onFail);
    }, []);

    const persistTimers = useRef<Partial<Record<ContractFileId, number>>>({});
    const persistedCharsRef = useRef(persistedChars);
    persistedCharsRef.current = persistedChars;
    const setRef = useRef(set);
    setRef.current = set;

    const persist = useCallback(
        (id: ContractFileId, text: string) => {
            window.clearTimeout(persistTimers.current[id]);
            persistTimers.current[id] = window.setTimeout(() => {
                const file = setRef.current?.files[id];
                if (!file) return;
                const clean = file.hasBase && !file.uploadedAs && matchesBase(text, file);
                const others = persistedCharsRef.current - (file.text?.length ?? 0);
                if (!clean && others + text.length > PERSIST_LIMIT_CHARS) {
                    setStorageFull(true);
                    return;
                }
                setStorageFull(false);
                dispatch(setContractFileText({ key, file: id, text: clean ? null : text }));
            }, PERSIST_SETTLE_MS);
        },
        [dispatch, key]
    );
    useEffect(() => {
        const timers = persistTimers.current;
        return () => Object.values(timers).forEach((t) => window.clearTimeout(t));
    }, [key]);

    // ─── History (structured edits) ──────────────────────────────────────────
    const history = useRef(new Map<ContractFileId, ReturnType<typeof emptyHistory>>());
    const historyOf = (id: ContractFileId) => {
        let entry = history.current.get(id);
        if (!entry) {
            entry = emptyHistory();
            history.current.set(id, entry);
        }
        return entry;
    };
    const [, bumpHistory] = useState(0);
    useEffect(() => history.current.clear(), [key]);

    const editableOf = (id: ContractFileId) => {
        const source = sourceOf(id, set);
        return (source === "github" || source === "upload") && texts[id] !== undefined;
    };

    /** Typing in Source: the text as typed; parsed once it settles, persisted a little after. */
    const setText = useCallback(
        (id: ContractFileId, text: string) => {
            if (!setRef.current?.files[id]) return;
            markTyped(id, true);
            setDrafts((prev) => ({ ...prev, [id]: text }));
            persist(id, text);
        },
        [persist]
    );

    /** Structured edits, applied as one undo step. Refused edits change nothing and say why. */
    const applyEdit = useCallback(
        (id: ContractFileId, edits: ContractEdit[]): EditResult => {
            const text = texts[id];
            if (text === undefined || !setRef.current?.files[id]) {
                return {
                    ok: false,
                    error: "Import the files from GitHub (or upload one) to edit.",
                };
            }
            try {
                const before = parseContract(text);
                const result = applyEdits(before, edits);
                if (result.text === text) return { ok: true, impact: result.planned.impact };
                const forward = minimalPatch(text, result.text);
                const entry: HistoryEntry = {
                    forward: [forward],
                    inverse: invertPatches(text, [forward]),
                    beforeHash: fnv1a(text),
                    afterHash: fnv1a(result.text),
                };
                const h = historyOf(id);
                h.undo.push(entry);
                if (h.undo.length > HISTORY_CAP) h.undo.shift();
                h.redo = [];
                markTyped(id, false);
                setDrafts((prev) => ({ ...prev, [id]: result.text }));
                persist(id, result.text);
                bumpHistory((n) => n + 1);
                return { ok: true, impact: result.planned.impact };
            } catch (e) {
                if (e instanceof EditBlockedError) return { ok: false, error: e.message };
                return {
                    ok: false,
                    error: `Studio couldn't apply this (${e instanceof Error ? e.message : String(e)}). Edit it in Source.`,
                };
            }
        },
        [texts, persist]
    );

    const step = useCallback(
        (id: ContractFileId, direction: "undo" | "redo") => {
            const text = texts[id];
            const h = historyOf(id);
            const entry = (direction === "undo" ? h.undo : h.redo).pop();
            if (!entry || text === undefined) return false;
            const expected = direction === "undo" ? entry.afterHash : entry.beforeHash;
            if (fnv1a(text) !== expected) {
                // The text moved on (typed in Source): this history no longer applies.
                history.current.set(id, emptyHistory());
                bumpHistory((n) => n + 1);
                return false;
            }
            const next = applyPatches(text, direction === "undo" ? entry.inverse : entry.forward);
            (direction === "undo" ? h.redo : h.undo).push(entry);
            markTyped(id, false);
            setDrafts((prev) => ({ ...prev, [id]: next }));
            persist(id, next);
            bumpHistory((n) => n + 1);
            return true;
        },
        [texts, persist]
    );

    const revert = useCallback(
        (id: ContractFileId) => {
            window.clearTimeout(persistTimers.current[id]);
            dispatch(revertContractFile({ key, file: id }));
            markTyped(id, false);
            setDrafts((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            history.current.delete(id);
            bumpHistory((n) => n + 1);
        },
        [dispatch, key]
    );

    // ─── Import / upload / export ────────────────────────────────────────────
    const [importError, setImportError] = useState<string | null>(null);
    const importFromGithub = useCallback(
        async (branch: string, sha: string) => {
            setImportError(null);
            const result = await fetchContracts({ repo: SPEC_REPO, branch, sha });
            if (!result.data) {
                const error = result.error as { error?: string } | undefined;
                setImportError(error?.error ?? "Couldn't import from GitHub.");
                return false;
            }
            const { texts: fetched, paths } = result.data;
            const files: Partial<
                Record<ContractFileId, { path: string; baseHash: string; baseSize: number }>
            > = {};
            for (const id of CONTRACT_FILE_IDS) {
                const t = fetched[id];
                if (t !== undefined)
                    files[id] = { path: paths[id], baseHash: fnv1a(t), baseSize: t.length };
            }
            Object.values(persistTimers.current).forEach((t) => window.clearTimeout(t));
            dispatch(
                importContractSet({
                    domain,
                    version,
                    source: {
                        kind: "github",
                        repo: SPEC_REPO,
                        branch,
                        sha,
                        importedAt: new Date().toISOString(),
                    },
                    files,
                })
            );
            setDrafts({});
            setTyped({});
            history.current.clear();
            return true;
        },
        [dispatch, domain, version, fetchContracts]
    );

    /** Adds an uploaded file; its kind comes from its keys. Returns what it was taken as, or an error. */
    const upload = useCallback(
        (
            fileName: string,
            text: string
        ): { ok: true; id: ContractFileId } | { ok: false; error: string } => {
            const id = detectContractKind(text);
            if (!id) {
                return {
                    ok: false,
                    error: `${fileName} isn't an actions, validations or OpenAPI file (no supportedActions, _TESTS_ or paths).`,
                };
            }
            dispatch(uploadContractFile({ domain, version, file: id, fileName, text }));
            markTyped(id, false);
            setDrafts((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            history.current.delete(id);
            return { ok: true, id };
        },
        [dispatch, domain, version]
    );

    // ─── Views ───────────────────────────────────────────────────────────────
    const files = useMemo(() => {
        const out = {} as Record<ContractFileId, ContractFileView>;
        for (const id of CONTRACT_FILE_IDS) {
            const file = set?.files[id];
            const source = sourceOf(id, set);
            const text = texts[id];
            const baseText = file?.hasBase ? baseTexts?.[id] : undefined;
            const dirty =
                !!file &&
                (file.uploadedAs !== undefined ||
                    (text !== undefined && file.hasBase && !matchesBase(text, file)));
            out[id] = {
                id,
                label: CONTRACT_FILE_LABELS[id],
                path: file?.path,
                text,
                source,
                editable: (source === "github" || source === "upload") && text !== undefined,
                dirty,
                parsed: parsedOf[id],
                delta:
                    dirty && baseText !== undefined && text !== undefined
                        ? lineDelta(baseText, text)
                        : undefined,
                loading: !!file && text === undefined && (base.isFetching || base.isLoading),
            };
        }
        return out;
    }, [
        set,
        texts,
        baseTexts,
        parsedActions,
        parsedValidations,
        parsedSpecs,
        base.isFetching,
        base.isLoading,
        sourceOf,
    ]);

    const apis = useMemo<ApiSummary[]>(() => {
        const names = new Set<string>([
            ...specApis,
            ...(actions?.apis ?? []),
            ...(validations?.apis ?? []),
            ...usedApis.keys(),
        ]);
        names.delete(ENTRY_KEY);
        return [...names].map((api) => {
            const testKey = validations?.tests.has(api) ? api : api.replace(/\d+$/, "");
            const tests = validations?.tests.get(testKey);
            return {
                api,
                hasSchema: specApis.includes(api),
                tests: tests ? flattenTests(tests).filter((t) => t.kind === "rule").length : 0,
                next: actions?.next.has(api) ? (actions.next.get(api)?.length ?? 0) : null,
                prev: actions?.prev.get(api)?.length ?? 0,
                entry: !!actions?.entry?.includes(api),
                used: usedApis.get(api) ?? 0,
                inActions: !!actions?.apis.includes(api),
                inValidations: !!tests,
            };
        });
    }, [specApis, actions, validations, usedApis]);

    const sourceKind: ContractSourceKind = set
        ? set.source.kind
        : CONTRACT_FILE_IDS.some((id) => files[id].source === "endpoint")
          ? "endpoint"
          : "none";

    const summary = useMemo(() => {
        const present = CONTRACT_FILE_IDS.filter((id) => files[id].text !== undefined);
        return {
            apiCount: apis.length,
            fileCount: present.length,
            edited: CONTRACT_FILE_IDS.filter((id) => files[id].dirty).length,
            errors: CONTRACT_FILE_IDS.filter((id) => (files[id].parsed?.errors.length ?? 0) > 0)
                .length,
            readOnly: !set,
            loading: spec.isLoading || CONTRACT_FILE_IDS.some((id) => files[id].loading),
        };
    }, [apis.length, files, set, spec.isLoading]);

    return {
        key,
        set,
        sourceKind,
        files,
        models,
        apis,
        summary,
        branch: {
            current: github ? { branch: github.branch, sha: github.sha } : null,
            suggested,
            ranked,
            loading: refs.isFetching,
            error: (refs.error as { error?: string } | undefined)?.error ?? null,
            upstreamChanged,
            headSha: head?.sha,
            load: () => {
                setWantRefs(true);
                if (refs.data || refs.isError) void refs.refetch();
            },
        },
        importing: importing.isFetching,
        importError,
        storageFull,
        persistFailed,
        canUndo: (id: ContractFileId) => (history.current.get(id)?.undo.length ?? 0) > 0,
        canRedo: (id: ContractFileId) => (history.current.get(id)?.redo.length ?? 0) > 0,
        ops: {
            importFromGithub,
            upload,
            setText,
            applyEdit,
            undo: (id: ContractFileId) => step(id, "undo"),
            redo: (id: ContractFileId) => step(id, "redo"),
            revert,
            isEditable: editableOf,
        },
    };
};

/** One patch covering the changed middle of two texts. */
const minimalPatch = (before: string, after: string): TextPatch => {
    let start = 0;
    const max = Math.min(before.length, after.length);
    while (start < max && before[start] === after[start]) start++;
    let endB = before.length;
    let endA = after.length;
    while (endB > start && endA > start && before[endB - 1] === after[endA - 1]) {
        endB--;
        endA--;
    }
    return { from: start, to: endB, insert: after.slice(start, endA) };
};

export type StudioContracts = ReturnType<typeof useStudioContracts>;
