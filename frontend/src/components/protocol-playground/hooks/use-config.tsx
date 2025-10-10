import { useContext } from "react";
import { PlaygroundContext } from "../context/playground-context";
import { toast } from "react-toastify";
import { calcCurrentIndex, generatePayload } from "../mock-engine";
import { useCodeRunner } from "./use-code-runner";
import JsonSchemaForm from "../ui/extras/rsjf-form";

// hooks/useConfigOperations.ts
export const useConfigOperations = () => {
	const playgroundContext = useContext(PlaygroundContext);
	const generateRunner = useCodeRunner("generate");
	const generateResult = generateRunner.result;
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

	const showFormModal = (data: any, onSubmit: (formData: any) => void) => {
		modal.openModal(
			<div className="p-1">
				<h2 className="text-l font-semibold mb-1">Enter Input Data</h2>
				<JsonSchemaForm
					schema={data.requiredInputs.jsonSchema}
					formData={data.sessionData}
					onSubmit={onSubmit}
				/>
			</div>
		);
		toast.success("Please fill in the form to continue");
	};

	const executePayload = async (data: {
		defaultPayload: any;
		sessionData: any;
		functionCode: string;
		requiredInputs: any;
		actionId: string;
	}) => {
		const result = await generateRunner.executeCode(data.functionCode, [
			data.defaultPayload,
			data.sessionData,
		]);
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

		try {
			const data = generatePayload(currentIndex, playgroundContext.config);
			if (
				data.requiredInputs === null ||
				Object.keys(data.requiredInputs).length === 0
			) {
				await executePayload(data);
				return;
			}

			const handleFormSubmit = async (formData: any) => {
				console.log("Form submitted with data:", formData);
				modal.closeModal();
				data.sessionData.user_inputs = formData;
				await executePayload(data);
			};

			showFormModal(data, handleFormSubmit);
		} catch (e) {
			console.error("Error generating payload:", e);
			toast.error("Error generating payload. Check console for details.");
			return;
		}
	};

	return { exportConfig, importConfig, clearConfig, runConfig, generateResult };
};
