import { useContext } from "react";
import { PlaygroundContext } from "../context/playground-context";
import { toast } from "react-toastify";
import { calcCurrentIndex, generatePayload } from "../mock-engine";

// hooks/useConfigOperations.ts
export const useConfigOperations = () => {
	const playgroundContext = useContext(PlaygroundContext);

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

	const runConfig = () => {
		if (
			!playgroundContext.config?.steps ||
			playgroundContext.config.steps.length === 0
		) {
			toast.error("No steps to run");
			return;
		}
		const currentIndex = calcCurrentIndex(playgroundContext.config);
		try {
			// open input first
			const payload = generatePayload(currentIndex, playgroundContext.config);
			console.log("Generated Payload:", payload);
		} catch (e) {
			console.error("Error generating payload:", e);
			toast.error("Error generating payload. Check console for details.");
			return;
		}
		toast.success("Payload generated. Check console for details.");
	};

	return { exportConfig, importConfig, clearConfig, runConfig };
};
