import type { Dispatch, JSX, SetStateAction } from "react";
import type { ExecutionResult, MockPlaygroundConfigType } from "@ondc/automation-mock-runner";
import type { WorkbenchFlowType } from "@hooks/useWorkbenchFlow";
import type { SavedConfigMetadata } from "@pages/protocol-playground/utils/config-storage";
import type { StepGroup } from "@pages/protocol-playground/utils/step-group";

type TransactionHistoryEntry = MockPlaygroundConfigType["transaction_history"][number];
type TransactionPayload = TransactionHistoryEntry extends { payload: infer P } ? P : unknown;
type TransactionSavedInfo = TransactionHistoryEntry extends { saved_info?: infer S }
    ? S
    : Record<string, unknown>;
type Meta = MockPlaygroundConfigType["meta"];

export interface PlaygroundRuntimeValue {
    config: MockPlaygroundConfigType | undefined;
    setCurrentConfig: (config: MockPlaygroundConfigType | undefined) => void;
    dirtyConfig: boolean;
    setDirtyConfig: Dispatch<SetStateAction<boolean>>;
    currentState: "editing" | "running";
    setCurrentState: Dispatch<SetStateAction<"editing" | "running">>;
    updateStepMock: (stepId: string, property: string, value: string) => void;
    activeApi: string | undefined;
    setActiveApi: Dispatch<SetStateAction<string | undefined>>;
    stepGroup: StepGroup;
    setStepGroup: Dispatch<SetStateAction<StepGroup>>;
    activeTerminalData: ExecutionResult[];
    setActiveTerminalData: Dispatch<SetStateAction<ExecutionResult[]>>;
    updateTransactionHistory: (
        actionId: string,
        action: string,
        newPayload: TransactionPayload,
        savedInfo?: TransactionSavedInfo
    ) => void;
    appendExtraStepRun: (actionId: string, action: string, newPayload: TransactionPayload) => void;
    updateHelperLib: (newCode: string) => void;
    resetTransactionHistory: (actionId?: string) => void;
    updateConfigMeta: (patch: Partial<Meta>) => void;
    useModal: {
        openModal: (content: JSX.Element, options?: { className?: string }) => void;
        closeModal: () => void;
    };
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    workbenchFlow: WorkbenchFlowType;
    loadSavedConfig: (configId: string) => boolean;
    getSavedConfigs: () => SavedConfigMetadata[];
    deleteSavedConfig: (configId: string) => boolean;
    loadConfigFromGist: (gistUrl: string) => Promise<boolean>;
}

/** @deprecated Use {@link PlaygroundRuntimeValue} */
export type PlaygroundContextProps = PlaygroundRuntimeValue;
