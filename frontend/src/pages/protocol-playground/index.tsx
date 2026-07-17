import { useEffect, useState, useCallback, type SetStateAction } from "react";
import { toast } from "sonner";
import {
    MockRunner,
    ExecutionResult,
    MockPlaygroundConfigType,
} from "@ondc/automation-mock-runner";
import { PlaygroundRuntimeProvider } from "@pages/protocol-playground/hooks/playground-runtime";
import GetPlaygroundComponent from "@pages/protocol-playground/starter-page";
import { usePlaygroundModals } from "@pages/protocol-playground/hooks/use-playground-modal";
import { PlaygroundModal } from "@pages/protocol-playground/ui/playground-modal";
import { useWorkbenchFlows } from "@hooks/useWorkbenchFlow";
import RenderFlows from "@components/DomainFlowRunner/RenderFlows";
import {
    saveConfig,
    loadConfig,
    getSavedConfigsMetadata,
    deleteConfig,
    SavedConfigMetadata,
    saveGistConfig,
} from "@pages/protocol-playground/utils/config-storage";

import { fetchGistData, getFirstGistFile } from "@pages/protocol-playground/utils/fetch-gist";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { store } from "@store/index";
import { setDraftConfig } from "@store/slices/playgroundConfigsSlice";
import {
    setActiveApi as setActiveApiAction,
    setStepGroup as setStepGroupAction,
} from "@store/slices/playgroundUiSlice";
import {
    StepGroup,
    getGroupSteps,
    setGroupSteps,
} from "@pages/protocol-playground/utils/step-group";
import { validateConfigGroups } from "@pages/protocol-playground/utils/step-group-rules";
import { encodeBase64 } from "@pages/protocol-playground/utils/base64";

const Body = ({ workbenchFlow }: { workbenchFlow: ReturnType<typeof useWorkbenchFlows> }) => {
    const content = (() => {
        switch (workbenchFlow.flowStepNum) {
            case 0:
                return <GetPlaygroundComponent />;
            case 1:
                return (
                    <RenderFlows
                        flows={workbenchFlow.flows}
                        subUrl={workbenchFlow.subscriberUrl}
                        sessionId={workbenchFlow.session}
                    />
                );
            default:
                return null;
        }
    })();

    return <div className="flex min-h-0 flex-1 flex-col">{content}</div>;
};

const ProtocolPlayGround = () => {
    const dispatch = useAppDispatch();
    const [playgroundState, setPlaygroundState] = useState<MockPlaygroundConfigType | undefined>(
        undefined
    );
    const [currentState, setCurrentState] = useState<"editing" | "running">("editing");
    const [loading, setLoading] = useState(false);

    // Persisted navigation state — restored across reloads/navigation so the user
    // returns to the same step + group they left. See playgroundUiSlice.
    const activeApi = useAppSelector((s) => s.playgroundUi.activeApi) ?? undefined;
    const stepGroup = useAppSelector((s) => s.playgroundUi.stepGroup);
    const setActiveApi = useCallback(
        (value: SetStateAction<string | undefined>) => {
            const next =
                typeof value === "function"
                    ? value(store.getState().playgroundUi.activeApi ?? undefined)
                    : value;
            dispatch(setActiveApiAction(next ?? null));
        },
        [dispatch]
    );
    const setStepGroup = useCallback(
        (value: SetStateAction<StepGroup>) => {
            const next =
                typeof value === "function"
                    ? value(store.getState().playgroundUi.stepGroup)
                    : value;
            dispatch(setStepGroupAction(next));
        },
        [dispatch]
    );

    const [activeTerminalData, setActiveTerminalData] = useState<ExecutionResult[]>([]);
    const [dirtyConfig, setDirtyConfig] = useState(true);

    // Auto-save function
    const autoSaveConfig = useCallback((config: MockPlaygroundConfigType) => {
        if (config && config.meta) {
            const { domain, version, flowId } = config.meta;
            // Auto-save to the new storage system
            const saved = saveConfig(domain, version, flowId, config);
            if (!saved) {
                toast.error("Auto-save failed — your latest changes may not survive a refresh");
            }
        }
    }, []);

    function setCurrentConfig(config: MockPlaygroundConfigType | undefined) {
        if (!config) {
            dispatch(setDraftConfig(null));
            setPlaygroundState(undefined);
            return;
        }
        // `config` may come from anywhere — a freshly built object, the Redux-owned
        // persisted draft, or a saved config read straight out of the `configs`
        // slice via `loadConfig()` (config-storage.ts) — and anything sourced from
        // Redux is Immer-frozen. `playgroundState` is mutated in place by the
        // helpers below (resetTransactionHistory, updateTransactionHistory, etc.),
        // so it must always be an independently mutable working copy regardless of
        // where `config` came from. Clone unconditionally here rather than relying
        // on every caller to hand in a fresh object.
        const workingConfig = structuredClone(config);
        setPlaygroundState(workingConfig);
        // Dispatch a separate clone: the store must not share identity with
        // `workingConfig` either, or freezing the store's copy would freeze it too.
        dispatch(setDraftConfig(structuredClone(workingConfig)));

        // Auto-save whenever config is set/updated
        autoSaveConfig(workingConfig);
    }

    const updateStepMock = (stepId: string, property: string, value: string): { ok: boolean } => {
        const current = playgroundState;
        if (!current) return { ok: false };
        if (
            property === "generate" ||
            property === "validate" ||
            property === "requirements" ||
            property === "formHtml"
        ) {
            value = encodeBase64(value);
        } else {
            try {
                value = JSON.parse(value);
            } catch (e) {
                console.error("Invalid JSON value:", e);
                return { ok: false };
            }
        }
        const newSteps = getGroupSteps(current, stepGroup).map((step) => {
            if (step.action_id === stepId) {
                return {
                    ...step,
                    mock: {
                        ...step.mock,
                        [property]: value,
                    },
                };
            }
            return step;
        });
        const newConfig = setGroupSteps(current, stepGroup, newSteps);
        setCurrentConfig(newConfig);
        return { ok: true };
    };

    type TransactionHistoryEntry = MockPlaygroundConfigType["transaction_history"][number];
    type TransactionPayload = TransactionHistoryEntry extends { payload: infer P } ? P : unknown;
    type TransactionSavedInfo = TransactionHistoryEntry extends { saved_info?: infer S }
        ? S
        : Record<string, unknown>;

    const updateTransactionHistory = (
        actionId: string,
        action: string,
        newPayload: TransactionPayload,
        savedInfo?: TransactionSavedInfo
    ) => {
        const current = playgroundState;
        if (!current) return;
        const historyEntry = {
            action_id: actionId,
            payload: newPayload,
            action: action,
            saved_info: savedInfo || ({} as TransactionSavedInfo),
        };
        current.transaction_history.push(historyEntry);
        setCurrentConfig({ ...current });
    };

    // Record one run of an extra step as its OWN chronological transaction_history
    // entry. Extra steps can run multiple times and in any order, so appending a
    // fresh entry (instead of merging into a payload[] on the first entry)
    // preserves true execution order — session calculation then sees every run
    // interleaved exactly as it happened. Mutates in place (like
    // updateTransactionHistory) so a sequential run loop sees each run immediately.
    const appendExtraStepRun = (
        actionId: string,
        action: string,
        newPayload: TransactionPayload
    ) => {
        const current = playgroundState;
        if (!current) return;
        current.transaction_history.push({
            action_id: actionId,
            action,
            payload: newPayload,
            saved_info: {} as TransactionSavedInfo,
        });
        setCurrentConfig({ ...current });
    };

    type Meta = MockPlaygroundConfigType["meta"];
    const updateConfigMeta = (patch: Partial<Meta>) => {
        if (!playgroundState) return;
        const updated = { ...playgroundState, meta: { ...playgroundState.meta, ...patch } };
        setCurrentConfig(updated);
    };

    const updateHelperLib = (newCode: string) => {
        const current = playgroundState;
        if (!current) return;
        current.helperLib = encodeBase64(newCode);
        setCurrentConfig(current);
    };

    // Reset transaction history (optionally from a specific action ID)
    const resetTransactionHistory = (actionId?: string) => {
        const current = playgroundState;
        if (!current) return;
        if (actionId === undefined) {
            current.transaction_history = [];
        } else {
            const index = current.transaction_history.findIndex(
                (entry) => entry.action_id === actionId
            );
            if (index === -1) {
                toast.error("Action ID not found in transaction history");
                return;
            }
            current.transaction_history = current.transaction_history.slice(0, index);
        }
        setCurrentConfig({ ...current });
    };

    // Config management functions
    const loadSavedConfig = (configId: string): boolean => {
        const savedConfig = loadConfig(configId);
        if (savedConfig) {
            setCurrentConfig(savedConfig.config);
            toast.success(
                `Loaded config: ${savedConfig.domain}_${savedConfig.version}_${savedConfig.flowId}`
            );
            return true;
        } else {
            toast.error("Failed to load config");
            return false;
        }
    };

    const getSavedConfigs = (): SavedConfigMetadata[] => {
        return getSavedConfigsMetadata();
    };

    const deleteSavedConfig = (configId: string): boolean => {
        const success = deleteConfig(configId);
        if (success) {
            toast.success("Config deleted successfully");
        } else {
            toast.error("Failed to delete config");
        }
        return success;
    };

    const loadConfigFromGist = useCallback(async (gistUrl: string): Promise<boolean> => {
        try {
            const gistResult = await fetchGistData(gistUrl);
            if (!gistResult.success || !gistResult.data) {
                toast.error(gistResult.error || "Failed to fetch gist");
                return false;
            }

            const firstFile = getFirstGistFile(gistResult.data);
            if (!firstFile) {
                toast.error("No files found in gist");
                return false;
            }

            const config = JSON.parse(firstFile.content);
            const isValid = new MockRunner(config).validateConfig();
            if (!isValid.success) {
                toast.error(`Invalid config in gist: ${isValid.errors?.join(", ") || ""}`);
                return false;
            }
            const ruleError = validateConfigGroups(config);
            if (ruleError) {
                toast.error(`Invalid config in gist: ${ruleError}`);
                return false;
            }
            // Always create a new config instead of replacing current
            // Save gist config with gist_ prefix (will overwrite if same gist URL)
            const saveSuccess = saveGistConfig(gistUrl, config);
            if (saveSuccess) {
                toast.success(
                    `Config loaded and saved from gist: ${config.meta.domain}_${config.meta.version}_${config.meta.flowId}`
                );
            }

            // Set as current config
            setCurrentConfig(config);
            return true;
        } catch (error) {
            toast.error("Failed to parse config from gist check console for details");
            console.error("Gist loading error:", error);
            return false;
        }
    }, []);

    // Check for gist parameter in URL on component mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const gistParam = urlParams.get("gist");

        if (gistParam) {
            loadConfigFromGist(gistParam);
            // Remove the gist parameter from URL after loading
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete("gist");
            window.history.replaceState({}, "", newUrl.toString());
        } else {
            // Restore the draft config from the persisted Redux store if present.
            // Clone it: the stored object is Immer-frozen, but playgroundState must
            // stay a mutable object (mutated in place by the helpers below).
            const savedConfig = store.getState().playgroundConfigs.draft;
            if (savedConfig) {
                setPlaygroundState(structuredClone(savedConfig));
            }
        }
    }, [loadConfigFromGist]);

    // Auto-save whenever playgroundState changes
    useEffect(() => {
        if (playgroundState) {
            autoSaveConfig(playgroundState);
        }
    }, [playgroundState, autoSaveConfig]);

    const workbenchFlow = useWorkbenchFlows();
    const { popupOpen, popupContent, modalClassName, openModal, closeModal } =
        usePlaygroundModals();

    const playgroundRuntime = {
        config: playgroundState,
        setCurrentConfig,
        currentState,
        setCurrentState,
        dirtyConfig,
        setDirtyConfig,
        updateStepMock,
        activeApi,
        setActiveApi,
        stepGroup,
        setStepGroup,
        activeTerminalData,
        setActiveTerminalData,
        useModal: { openModal, closeModal },
        updateHelperLib,
        updateTransactionHistory,
        appendExtraStepRun,
        resetTransactionHistory,
        loading,
        setLoading,
        workbenchFlow,
        updateConfigMeta,
        loadSavedConfig,
        getSavedConfigs,
        deleteSavedConfig,
        loadConfigFromGist,
    };

    return (
        <PlaygroundRuntimeProvider value={playgroundRuntime}>
            <div className="flex h-full min-h-0 w-full flex-1 flex-col px-5 sm:px-8 md:px-10 lg:px-15 xl:px-20 mx-auto">
                <Body workbenchFlow={workbenchFlow} />
            </div>
            <PlaygroundModal isOpen={popupOpen} onClose={closeModal} className={modalClassName}>
                {popupContent}
            </PlaygroundModal>
        </PlaygroundRuntimeProvider>
    );
};

export default ProtocolPlayGround;
