import { useContext } from "react";
import { PlaygroundContext } from "../context/playground-context";
import { toast } from "react-toastify";
import JsonSchemaForm from "../ui/extras/rsjf-form";
import { calcCurrentIndex } from "../mock-engine";
import MockRunner from "@ondc/automation-mock-runner";

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

	const executePayload = async (data: { actionId: string; inputs: any }) => {
		const config = playgroundContext.config;
		if (!config) {
			toast.error("No configuration found");
			return false;
		}
		const result = await new MockRunner(config).runGeneratePayload(
			data.actionId,
			data.inputs
		);
		console.log("Generate Result:", result);
		if (!result) {
			toast.error("No result from code execution");
			return false;
		}
		playgroundContext.setActiveTerminalData((s) => [...s, result]);
		if (result.success) {
			playgroundContext.updateTransactionHistory(data.actionId, result.result);
		}
		modal.closeModal();
		toast.success("Payload generated. Check console for details.");
		return true;
	};

	const runConfig = async () => {
		if (
			!playgroundContext.config?.steps ||
			playgroundContext.config.steps.length === 0
		) {
			toast.error("No steps to run");
			return;
		}
		const currentIndex = calcCurrentIndex(playgroundContext.config);
		if (currentIndex === -1) {
			toast.info("All steps have been executed");
			return;
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
			if (inputs === null || Object.keys(inputs).length === 0) {
				await executePayload({
					actionId: currentStep.action_id,
					inputs: {},
				});
				return;
			}

			const handleFormSubmit = async (formData: any) => {
				console.log("Form submitted with data:", formData);
				modal.closeModal();
				// data.sessionData.user_inputs = formData;
				await executePayload({
					actionId: currentStep.action_id,
					inputs: formData,
				});
			};
			if (!currentStep.mock.inputs.jsonSchema) {
				toast.error("No input schema defined for this action");
				return;
			}
			showFormModal(currentStep.mock.inputs.jsonSchema, handleFormSubmit);
		} catch (e) {
			console.error("Error generating payload:", e);
			toast.error("Error generating payload. Check console for details.");
			return;
		}
	};

	return { exportConfig, importConfig, clearConfig, runConfig };
};
