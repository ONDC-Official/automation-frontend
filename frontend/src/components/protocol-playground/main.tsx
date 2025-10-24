import { useEffect, useState } from "react";
import { PlaygroundContext } from "./context/playground-context";

import GetPlaygroundComponent from "./starter-page";
import { usePlaygroundModals } from "./hooks/use-playground-modal";

import { toast } from "react-toastify";
import MockRunner, {
	ExecutionResult,
	MockPlaygroundConfigType,
} from "@ondc/automation-mock-runner";
import { useWorkbenchFlows } from "../../hooks/useWorkbenchFlow";
import RenderFlows from "../flow-testing/render-flows";

export default function ProtocolPlayGround() {
	const [playgroundState, setPlaygroundState] = useState<
		MockPlaygroundConfigType | undefined
	>(undefined);
	const [currentState, setCurrentState] = useState<"editing" | "running">(
		"editing"
	);
	const [loading, setLoading] = useState(false);
	const [activeApi, setActiveApi] = useState<string | undefined>(undefined);
	const [activeTerminalData, setActiveTerminalData] = useState<
		ExecutionResult[]
	>([]);
	const [dirtyConfig, setDirtyConfig] = useState(true);
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
		if (
			property === "generate" ||
			property === "validate" ||
			property === "requirements"
		) {
			value = MockRunner.encodeBase64(value);
		} else {
			try {
				value = JSON.parse(value);
			} catch (e) {
				console.error("Invalid JSON value:", e);
				return;
			}
		}
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

	const updateTransactionHistory = (
		actionId: string,
		newPayload: any,
		savedInfo?: any
	) => {
		const current = playgroundState;
		if (!current) return;
		const historyEntry = {
			action_id: actionId,
			payload: newPayload,
			saved_info: savedInfo || {},
		};
		current.transaction_history.push(historyEntry);
		setCurrentConfig({ ...current });
	};

	// Reset transaction history (optionally from a specific action ID)
	const resetTransactionHistory = (actionId?: string) => {
		const current = playgroundState;
		if (!current) return;
		if (actionId === undefined) {
			current.transaction_history = [];
		} else {
			const index = current.transaction_history.findIndex(
				(entry) => entry.action_id === actionId
			);
			if (index === -1) {
				toast.error("Action ID not found in transaction history");
				return;
			}
			current.transaction_history = current.transaction_history.slice(0, index);
		}
		setCurrentConfig({ ...current });
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

	const workbenchFlow = useWorkbenchFlows();

	// const Body = () => {
	// 	switch (workbenchFlow.flowStepNum) {
	// 		case 0:
	// 			return <GetPlaygroundComponent />;
	// 		case 1:
	// 			return (
	// 				<RenderFlows
	// 					flows={workbenchFlow.flows}
	// 					subUrl={workbenchFlow.subscriberUrl}
	// 					sessionId={workbenchFlow.session}
	// 					type={"SCENARIO"}
	// 					setStep={workbenchFlow.setFlowStepNum}
	// 					setReport={workbenchFlow.setReport}
	// 				/>
	// 			);
	// 	}
	// };

	return (
		<PlaygroundContext.Provider
			value={{
				config: playgroundState,
				setCurrentConfig: setCurrentConfig,
				currentState,
				setCurrentState,
				dirtyConfig,
				setDirtyConfig,
				updateStepMock,
				activeApi,
				setActiveApi,
				activeTerminalData,
				setActiveTerminalData,
				useModal: usePlaygroundModals(),
				updateTransactionHistory,
				resetTransactionHistory,
				loading,
				setLoading,
				workbenchFlow,
			}}
		>
			<div className="mt-2 w-full h-screen flex flex-col">
				<Body workbenchFlow={workbenchFlow} />
				{/* <GetPlaygroundComponent /> */}
			</div>
		</PlaygroundContext.Provider>
	);
}

const Body = ({
	workbenchFlow,
}: {
	workbenchFlow: ReturnType<typeof useWorkbenchFlows>;
}) => {
	switch (workbenchFlow.flowStepNum) {
		case 0:
			return <GetPlaygroundComponent />;
		case 1:
			return (
				<RenderFlows
					flows={workbenchFlow.flows}
					subUrl={workbenchFlow.subscriberUrl}
					sessionId={workbenchFlow.session}
					type={"SCENARIO"}
					setStep={workbenchFlow.setFlowStepNum}
					setReport={workbenchFlow.setReport}
				/>
			);
		default:
			return null;
	}
};
