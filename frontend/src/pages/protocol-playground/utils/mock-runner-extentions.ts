import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";

function getSaveDataMeta(actionId?: string, playgroundConfig?: MockPlaygroundConfigType) {
    if (!actionId || !playgroundConfig) {
        return {};
    }
    const transactionHistory = playgroundConfig.transaction_history;
    const metaData: Record<string, { path: string; actionId: string }> = {};
    for (let index = 0; index < transactionHistory.length; index++) {
        const record = transactionHistory[index];
        if (actionId === record.action_id) break;
        const stepData = playgroundConfig.steps[index];
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
