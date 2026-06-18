// hooks/useModalHandlers.ts
import { toast } from "sonner";

import {
    AddActionForm,
    DeleteConfirmationForm,
    EditActionForm,
    type IEditActionFormData,
} from "@pages/protocol-playground/ui/from-contents";
import { StepGroup, getGroupSteps } from "../utils/step-group";
import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";
import type { JSX } from "react";

interface ActionFormData {
    api?: string;
    actionId?: string;
    owner?: string;
    unsolicited?: boolean | string;
    responseFor?: string;
    description?: string;
    [key: string]: unknown;
}

interface StepConfig {
    action_id: string;
    api?: string;
    owner?: string;
    unsolicited?: boolean | string;
    responseFor?: string | null;
    description?: string;
    mock?: unknown;
    repeatCount?: number | string | null;
    [key: string]: unknown;
}

interface MockConfig {
    steps: StepConfig[];
    [key: string]: unknown;
}

interface ModalHandlersProps {
    activeApi: string | undefined;
    setActiveApi: (api: string | undefined) => void;
    openModal: (content: JSX.Element, options?: { className?: string }) => void;
    closeModal: () => void;
    addAction: (
        api: string,
        actionId: string,
        insertIndex?: number,
        stepType?: "action" | "form"
    ) => boolean;
    deleteAction: (actionId: string) => boolean;
    updateAction: (actionId: string, formData: ActionFormData) => boolean;
    clearConfig: () => void;
    config: MockConfig | undefined;
    stepGroup: StepGroup;
}

export const useModalHandlers = ({
    activeApi,
    setActiveApi,
    openModal,
    closeModal,
    addAction,
    deleteAction,
    updateAction,
    clearConfig,
    config,
    stepGroup,
}: ModalHandlersProps) => {
    const groupSteps = (): StepConfig[] =>
        getGroupSteps(
            config as MockPlaygroundConfigType | undefined,
            stepGroup
        ) as unknown as StepConfig[];

    const showAddAction = (insertIndex?: number, title = "Add Action") => {
        const handleSubmit = ({
            stepType,
            api,
            form,
            actionId,
        }: {
            stepType: "action" | "form";
            api: string;
            form: string;
            actionId: string;
        }) => {
            if (stepType === "form") {
                if (!addAction(form, actionId, insertIndex, stepType)) return;
                setActiveApi(actionId);
                closeModal();
                toast.success("Form added successfully");
                return;
            }

            if (!api || !actionId) {
                toast.error("Please fill all fields");
                return;
            }

            if (!addAction(api, actionId, insertIndex)) return;
            setActiveApi(actionId);
            closeModal();
            toast.success("Action added successfully");
        };

        openModal(<AddActionForm title={title} onSubmit={handleSubmit} onCancel={closeModal} />);
    };

    const addActionBefore = () => {
        if (!activeApi || !config) return;

        const currentIndex = groupSteps().findIndex(
            (step: StepConfig) => step.action_id === activeApi
        );

        if (currentIndex !== -1) {
            showAddAction(currentIndex, "Add Action Before");
        }
    };

    const addActionAfter = () => {
        if (!activeApi || !config) return;

        const currentIndex = groupSteps().findIndex(
            (step: StepConfig) => step.action_id === activeApi
        );

        if (currentIndex !== -1) {
            showAddAction(currentIndex + 1, "Add Action After");
        }
    };

    const deleteActionHandler = () => {
        const handleConfirm = () => {
            if (!activeApi) return;

            const success = deleteAction(activeApi);

            if (success) {
                setActiveApi(undefined);
                toast.success(`Action ${activeApi} deleted successfully`);
            } else {
                toast.error("Action ID not found");
            }

            closeModal();
        };

        openModal(
            <DeleteConfirmationForm
                title="Confirm Deletion"
                description={`Are you sure you want to delete action ${activeApi}? This action cannot be undone.`}
                onConfirm={handleConfirm}
                onCancel={closeModal}
            />
        );
    };

    const showEditAction = (actionId: string) => {
        if (!actionId || !config) return;

        const steps = groupSteps();
        const currentAction = steps.find((step: StepConfig) => step.action_id === actionId);

        if (!currentAction) return;

        const getPreviousSteps = () => {
            const currentIndex = steps.findIndex((step: StepConfig) => step.action_id === actionId);
            return steps.slice(0, currentIndex);
        };

        const handleUpdate = (formData: IEditActionFormData) => {
            if (!formData.api || !formData.actionId) {
                toast.error("API Name and Action ID are required");
                return;
            }

            const success = updateAction(actionId, formData as ActionFormData);

            if (success) {
                setActiveApi(formData.actionId);
                toast.success("Action updated successfully");
            }

            closeModal();
        };

        openModal(
            <EditActionForm
                currentAction={currentAction as never}
                activeActionId={actionId}
                previousSteps={getPreviousSteps() as never}
                onUpdate={handleUpdate}
                onCancel={closeModal}
            />,
            { className: "max-w-2xl" }
        );
    };

    const showDeleteConfirmation = () => {
        const handleConfirm = () => {
            clearConfig();
            setActiveApi(undefined);
            closeModal();
        };

        openModal(
            <DeleteConfirmationForm
                title="Confirm Deletion"
                description="Are you sure you want to delete all flow configurations? This action cannot be undone."
                onConfirm={handleConfirm}
                onCancel={closeModal}
            />
        );
    };

    return {
        showAddAction,
        addActionBefore,
        addActionAfter,
        deleteAction: deleteActionHandler,
        showEditAction,
        showDeleteConfirmation,
    };
};
