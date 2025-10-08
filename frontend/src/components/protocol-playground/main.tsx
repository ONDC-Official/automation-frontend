import { useEffect, useState } from "react";
import { PlaygroundContext } from "./context/playground-context";
import { MockPlaygroundConfigType } from "./mock-engine/types";
import GetPlaygroundComponent from "./starter-page";

export default function ProtocolPlayGround() {
	const [playgroundState, setPlaygroundState] = useState<
		MockPlaygroundConfigType | undefined
	>(undefined);
	const [currentState, setCurrentState] = useState<"editing" | "running">(
		"editing"
	);
	const [activeApi, setActiveApi] = useState<string | undefined>(undefined);

	function setCurrentConfig(config: MockPlaygroundConfigType | undefined) {
		if (!config) {
			localStorage.removeItem("playgroundConfig");
			setPlaygroundState(undefined);
			return;
		}
		setPlaygroundState(config);
		localStorage.setItem("playgroundConfig", JSON.stringify(config));
	}

	const updateStepMock = (stepId: string, property: string, value: string) => {
		const current = playgroundState;
		if (!current) return;
		const newSteps = current.steps.map((step) => {
			if (step.action_id === stepId) {
				return {
					...step,
					mock: {
						...step.mock,
						[property]: value,
					},
				};
			}
			return step;
		});
		const newConfig = {
			...current,
			steps: newSteps,
		};
		setCurrentConfig(newConfig);
	};

	// try to load from local storage
	useEffect(() => {
		const savedConfig = localStorage.getItem("playgroundConfig");
		if (savedConfig) {
			try {
				const parsedConfig = JSON.parse(savedConfig);
				setPlaygroundState(parsedConfig);
			} catch (e) {
				console.error("Failed to parse saved config:", e);
			}
		}
	}, []);

	return (
		<PlaygroundContext.Provider
			value={{
				config: playgroundState,
				setCurrentConfig: setCurrentConfig,
				currentState,
				setCurrentState,
				updateStepMock,
				activeApi,
				setActiveApi,
			}}
		>
			<div className="mt-2 w-full h-screen flex flex-col">
				<GetPlaygroundComponent />
			</div>
		</PlaygroundContext.Provider>
	);
}
