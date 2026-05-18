import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";
import { StepGroup, configForGroup } from "./step-group";

function getSaveDataMeta(
    actionId?: string,
    playgroundConfig?: MockPlaygroundConfigType,
    stepGroup: StepGroup = "main"
) {
    if (!actionId || !playgroundConfig) {
        return {};
    }
    const groupConfig = configForGroup(playgroundConfig, stepGroup);
    const transactionHistory = groupConfig.transaction_history;
    const metaData: Record<string, { path: string; actionId: string }> = {};
    for (let index = 0; index < transactionHistory.length; index++) {
        const record = transactionHistory[index];
        if (actionId === record.action_id) break;
        const stepData = groupConfig.steps[index];
        if (!stepData) continue;
        const saveData = stepData.mock.saveData;
        for (const key in saveData) {
            metaData[key] = {
                path: saveData[key],
                actionId: record.action_id,
            };
        }
    }

    return metaData;
}

export const mockRunnerExtensions = {
    getSaveDataMeta,
};
