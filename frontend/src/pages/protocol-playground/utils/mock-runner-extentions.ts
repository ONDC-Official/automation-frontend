import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";
import { buildLinearConfig } from "./transaction-view";

function getSaveDataMeta(actionId?: string, playgroundConfig?: MockPlaygroundConfigType) {
    if (!actionId || !playgroundConfig) {
        return {};
    }
    // Linear view: steps & history positionally aligned across both groups and retriggers.
    const linear = buildLinearConfig(playgroundConfig);
    const transactionHistory = linear.transaction_history;
    const metaData: Record<string, { path: string; actionId: string }> = {};
    for (let index = 0; index < transactionHistory.length; index++) {
        const record = transactionHistory[index];
        if (actionId === record.action_id) break;
        const stepData = linear.steps[index];
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
