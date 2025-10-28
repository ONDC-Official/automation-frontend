import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";

function getSaveDataMeta(
	actionId?: string,
	playgroundConfig?: MockPlaygroundConfigType
) {
	console.log("Getting save data meta for actionId:", actionId);
	if (!actionId || !playgroundConfig) {
		console.log(
			"❌ Missing actionId or playgroundConfig",
			actionId,
			playgroundConfig
		);
		return {};
	}
	const transactionHistory = playgroundConfig.transaction_history;
	const metaData: any = {};
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
	console.log("✅ Compiled metadata:", metaData);
	return metaData;
}

export const mockRunnerExtensions = {
	getSaveDataMeta,
};
