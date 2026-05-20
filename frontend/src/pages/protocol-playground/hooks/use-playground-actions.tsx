import { useContext } from "react";
import { PlaygroundContext } from "../context/playground-context";
import { toast } from "react-toastify";
import MockRunner from "@ondc/automation-mock-runner";
import { getGroupSteps, setGroupSteps } from "../utils/step-group";
import { validateConfigGroups } from "../utils/step-group-rules";
// import { getDefaultStep } from "../mock-engine";

type UpdateActionFormData = {
    api: string;
    actionId: string;
    owner: string;
    unsolicited: string;
    responseFor?: string | null;
    description: string;
};

// hooks/usePlaygroundActions.ts
export const usePlaygroundActions = () => {
    const playgroundContext = useContext(PlaygroundContext);

    const addAction = (
        api: string,
        actionId: string,
        insertIndex?: number,
        stepType?: "action" | "form"
    ): boolean => {
        const currentConfig = playgroundContext.config;
        if (!currentConfig) {
            toast.error("No configuration found");
            return false;
        }
        const group = playgroundContext.stepGroup;
        let newStep;
        if (stepType === "form" && (api === "dynamic_form" || api === "html_form")) {
            newStep = new MockRunner(currentConfig).getDefaultStep(api, actionId, api);
        } else {
            newStep = new MockRunner(currentConfig).getDefaultStep(api, actionId);
        }

        const steps = [...getGroupSteps(currentConfig, group)];
        if (insertIndex !== undefined) {
            steps.splice(insertIndex, 0, newStep);
        } else {
            steps.push(newStep);
        }

        const candidate = setGroupSteps(currentConfig, group, steps);
        const ruleError = validateConfigGroups(candidate);
        if (ruleError) {
            toast.error(ruleError);
            return false;
        }

        playgroundContext.setCurrentConfig(candidate);
        return true;
    };

    const deleteAction = (actionId: string) => {
        const currentConfig = playgroundContext.config;
        if (!currentConfig) return false;
        const group = playgroundContext.stepGroup;

        const steps = [...getGroupSteps(currentConfig, group)];
        const stepIndex = steps.findIndex((step) => step.action_id === actionId);

        if (stepIndex !== -1) {
            steps.splice(stepIndex, 1);
            playgroundContext.setCurrentConfig(setGroupSteps(currentConfig, group, steps));
            return true;
        }
        return false;
    };

    const updateAction = (actionId: string, formData: unknown) => {
        const data = formData as UpdateActionFormData;
        const currentConfig = playgroundContext.config;
        if (!currentConfig) return false;
        const group = playgroundContext.stepGroup;

        const steps = [...getGroupSteps(currentConfig, group)];
        const stepIndex = steps.findIndex((step) => step.action_id === actionId);

        if (stepIndex !== -1) {
            steps[stepIndex] = {
                ...steps[stepIndex],
                api: data.api,
                action_id: data.actionId,
                owner: data.owner as "BAP" | "BPP",
                unsolicited: data.unsolicited === "yes",
                responseFor: data.responseFor || null,
                description: data.description,
            };
            const candidate = setGroupSteps(currentConfig, group, steps);
            const ruleError = validateConfigGroups(candidate);
            if (ruleError) {
                toast.error(ruleError);
                return false;
            }
            playgroundContext.setCurrentConfig(candidate);
            return true;
        }
        return false;
    };

    return { addAction, deleteAction, updateAction };
};
