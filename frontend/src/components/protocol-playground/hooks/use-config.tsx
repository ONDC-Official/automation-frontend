import { useContext } from "react";
import { PlaygroundContext } from "../context/playground-context";
import { toast } from "react-toastify";
import JsonSchemaForm from "../ui/extras/rsjf-form";
import { calcCurrentIndex } from "../mock-engine";
import MockRunner, { convertToFlowConfig } from "@ondc/automation-mock-runner";
import { createFlowSessionWithPlayground } from "../utils/request-utils";

// hooks/useConfigOperations.ts
export const useConfigOperations = () => {
	const playgroundContext = useContext(PlaygroundContext);
	// const generateRunner = useCodeRunner("generate");
	// const generateResult = generateRunner.result;
	const modal = playgroundContext.useModal;

	const exportConfig = () => {
		if (!playgroundContext.config) {
			toast.error("No configuration to export");
			return;
		}
		const dataStr = JSON.stringify(playgroundContext.config, null, 2);
		const dataUri =
			"data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
		const exportFileDefaultName = "playground-config.json";
		const linkElement = document.createElement("a");
		linkElement.setAttribute("href", dataUri);
		linkElement.setAttribute("download", exportFileDefaultName);
		linkElement.click();
		toast.success("Configuration exported successfully");
	};

	const importConfig = () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json";
		input.onchange = (event: any) => {
			const file = event.target.files[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					try {
						const config = JSON.parse(e.target?.result as string);
						playgroundContext.setCurrentConfig(config);
						toast.success("Configuration imported successfully");
					} catch (error) {
						toast.error("Invalid JSON file");
					}
				};
				reader.readAsText(file);
			}
		};
		input.click();
	};

	const clearConfig = () => {
		playgroundContext.setCurrentConfig(undefined);
		playgroundContext.setActiveApi(undefined);
		toast.success("All configurations deleted");
	};

	const showFormModal = (schema: any, onSubmit: (formData: any) => void) => {
		modal.openModal(
			<div className="p-1">
				<h2 className="text-l font-semibold mb-1">Enter Input Data</h2>
				<JsonSchemaForm
					schema={schema}
					// formData={data.sessionData}
					onSubmit={onSubmit}
				/>
			</div>
		);
		toast.success("Please fill in the form to continue");
	};

	// return true if payload execution was successful
	const executePayload = async (data: { actionId: string; inputs: any }) => {
		playgroundContext.setLoading(true);
		try {
			const config = playgroundContext.config;
			if (!config) {
				toast.error("No configuration found");
				playgroundContext.setLoading(false);
				return false;
			}
			const result = await new MockRunner(config).runGeneratePayload(
				data.actionId,
				data.inputs
			);
			console.log("Generate Result:", result);
			if (!result) {
				toast.error("No result from code execution");
				playgroundContext.setLoading(false);
				return false;
			}
			playgroundContext.setActiveTerminalData((s) => [...s, result]);
			if (result.success) {
				playgroundContext.updateTransactionHistory(
					data.actionId,
					result.result
				);
			}
			modal.closeModal();
			playgroundContext.setLoading(false);
			toast.success("Payload generated. Check console for details.");
			return result.success;
		} catch (e) {
			playgroundContext.setLoading(false);
			console.error("Error executing payload:", e);
			return false;
		}
	};

	const runConfig = async () => {
		if (
			!playgroundContext.config?.steps ||
			playgroundContext.config.steps.length === 0
		) {
			toast.error("No steps to run");
			return { success: false };
		}
		if (
			playgroundContext.config.steps.length ===
			playgroundContext.config.transaction_history.length
		) {
			toast.info("All steps have already been executed");
			return { success: false };
		}
		const currentIndex = calcCurrentIndex(playgroundContext.config);
		if (currentIndex === -1) {
			toast.info("All steps have been executed");
			return { success: false };
		}
		const currentStep = playgroundContext.config.steps[currentIndex];
		try {
			const inputs = currentStep.mock.inputs || {};
			console.log(
				"Current Step Inputs:",
				inputs,
				inputs === null,
				Object.keys(inputs)
			);

			// No inputs needed - execute immediately
			if (inputs === null || Object.keys(inputs).length === 0) {
				const res = await executePayload({
					actionId: currentStep.action_id,
					inputs: {},
				});
				return {
					success: res,
				};
			}

			// Inputs needed - return a Promise that resolves when form is submitted
			return new Promise((resolve) => {
				const handleFormSubmit = async (formData: any) => {
					console.log("Form submitted with data:", formData);
					modal.closeModal();
					const res = await executePayload({
						actionId: currentStep.action_id,
						inputs: formData,
					});
					resolve({ success: res });
				};

				if (!currentStep.mock.inputs.jsonSchema) {
					toast.error("No input schema defined for this action");
					resolve({ success: false });
					return;
				}

				showFormModal(currentStep.mock.inputs.jsonSchema, handleFormSubmit);
			});
		} catch (e) {
			console.error("Error generating payload:", e);
			toast.error("Error generating payload. Check console for details.");
			return {
				success: false,
			};
		}
	};

	const createFlowSession = () => {
		async function handleFormSubmit(formData: any) {
			if (!playgroundContext.config) {
				toast.error("No configuration found");
				return;
			}
			console.log("Form submitted with data:", formData);
			playgroundContext.setLoading(true);
			const result = await createFlowSessionWithPlayground(
				playgroundContext.config,
				formData.subscriber_url,
				formData.role
			);
			if (!result) {
				toast.error("Error creating flow session");
				playgroundContext.setLoading(false);
				return;
			}
			playgroundContext.workbenchFlow.setFlowStepNum(1);
			playgroundContext.workbenchFlow.setSession(result);
			playgroundContext.workbenchFlow.setFlows([
				convertToFlowConfig(playgroundContext.config),
			]);
			playgroundContext.workbenchFlow.setSubscriberUrl(formData.subscriber_url);
			playgroundContext.setLoading(false);
		}

		modal.openModal(
			<div>
				<h2 className="text-l font-semibold mb-1">Create Live Flow Session</h2>
				<p className="mb-2">Enter details to create a live session.</p>
				<JsonSchemaForm
					schema={{
						type: "object",
						properties: {
							subscriber_url: {
								type: "string",
								// format: "uri",
								title: "Your Subscriber URL",
							},
							role: {
								type: "string",
								enum: ["BAP", "BPP"],
								default: "BAP",
								title: "Your Role",
							},
						},
						required: ["subscriber_url", "role"],
						additionalProperties: false,
					}}
					onSubmit={handleFormSubmit}
				/>
			</div>
		);
	};

	const runCurrentConfig = async () => {
		if (!playgroundContext.config) {
			toast.error("No configuration found");
			return;
		}
		const activeApi = playgroundContext.activeApi;
		if (!activeApi) {
			toast.error("No active API selected");
			return;
		}
		try {
			playgroundContext.resetTransactionHistory();
			for (const step of playgroundContext.config.steps) {
				const res = (await runConfig()) as any;
				if (!res?.success) {
					toast.error(`Execution stopped at action ${step.action_id}`);
					break;
				}
				if (step.action_id === activeApi) {
					break;
				}
			}
		} catch (e) {
			console.error("Error running current config:", e);
		}
	};

	return {
		exportConfig,
		importConfig,
		clearConfig,
		runConfig,
		createFlowSession,
		runCurrentConfig,
	};
};
