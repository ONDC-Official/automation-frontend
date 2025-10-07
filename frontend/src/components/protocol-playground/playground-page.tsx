import { useContext, useState } from "react";
import { IoMdAdd, IoMdTrash } from "react-icons/io";
import { FaDownload, FaUpload, FaPlay } from "react-icons/fa";
import { PlaygroundContext } from "./context/playground-context";
import { getDefaultStep } from "./mock-engine";
import { toast } from "react-toastify";
import Popup from "../ui/pop-up/pop-up";
import IconButton from "../ui/mini-components/icon-button";
import { ActionIdConfigurationPanel } from "./ui/action-id-config-panel";
import {
	AddActionForm,
	DeleteConfirmationForm,
	EditActionForm,
} from "./ui/from-contents";
import { PlaygroundLeftTabType, PlaygroundRightTabType } from "./types";
import { LeftSideView } from "./ui/LeftSideView";
import { RightSideView } from "./ui/RightSideView";

// Helper function to get form values from DOM
const getFormValues = (formIds: Record<string, string>) => {
	const values: Record<string, string> = {};
	Object.entries(formIds).forEach(([key, id]) => {
		const element = document.getElementById(id) as
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement;
		values[key] = element?.value || "";
	});
	return values;
};

// Helper function to determine step properties based on API
const getStepProperties = (api: string) => ({
	owner: api.startsWith("on") ? ("BPP" as const) : ("BAP" as const),
	unsolicited: api.startsWith("on"),
});

// ===== MAIN COMPONENT =====
export default function PlaygroundPage() {
	const playgroundContext = useContext(PlaygroundContext);
	const [popupOpen, setPopupOpen] = useState(false);
	const [popupContent, setPopupContent] = useState<JSX.Element | null>(null);
	const [activeActionId, setActiveActionId] = useState<string | undefined>(
		undefined
	);
	const handleExport = () => {
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

	const handleImport = () => {
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

	const handleRun = () => {
		if (
			!playgroundContext.config?.steps ||
			playgroundContext.config.steps.length === 0
		) {
			toast.error("No steps to run");
			return;
		}
		toast.info("Running playground steps...");
		// Add your run logic here
	};

	const showDeleteConfirmationPopup = () => {
		const handleConfirm = () => {
			playgroundContext.setCurrentConfig(undefined);
			setPopupOpen(false);
			toast.success("All configurations deleted");
		};

		const handleCancel = () => {
			setPopupOpen(false);
		};

		setPopupContent(
			<DeleteConfirmationForm
				title="Confirm Deletion"
				description="Are you sure you want to delete all flow configurations? This action cannot be undone."
				onConfirm={handleConfirm}
				onCancel={handleCancel}
			/>
		);
		setPopupOpen(true);
	};

	const addAction = (api: string, actionId: string, insertIndex?: number) => {
		const currentConfig = playgroundContext.config;
		if (!currentConfig) {
			toast.error("No configuration found");
			return;
		}

		const { owner, unsolicited } = getStepProperties(api);
		const newStep = getDefaultStep(
			api,
			actionId,
			owner,
			null,
			unsolicited,
			playgroundContext.config as any
		);

		if (!currentConfig.steps) {
			currentConfig.steps = [];
		}

		if (insertIndex !== undefined) {
			currentConfig.steps.splice(insertIndex, 0, newStep);
		} else {
			currentConfig.steps.push(newStep);
		}

		playgroundContext.setCurrentConfig(currentConfig);
	};

	const showAddActionPopup = (insertIndex?: number, title = "Add Action") => {
		const handleSubmit = () => {
			const { api, actionId } = getFormValues({
				api: "apiNameInput",
				actionId: "actionIdInput",
			});

			if (!api || !actionId) {
				toast.error("Please fill all fields");
				return;
			}

			addAction(api, actionId, insertIndex);
			setPopupOpen(false);
		};

		const handleCancel = () => {
			setPopupOpen(false);
		};

		setPopupContent(
			<AddActionForm
				title={title}
				onSubmit={handleSubmit}
				onCancel={handleCancel}
			/>
		);
		setPopupOpen(true);
	};

	const addActionBeforeHandler = () => {
		if (!activeActionId || !playgroundContext.config) return;

		const currentIndex = playgroundContext.config.steps.findIndex(
			(step) => step.action_id === activeActionId
		);

		if (currentIndex !== -1) {
			showAddActionPopup(currentIndex, "Add Action Before");
		}
	};

	const addActionAfterHandler = () => {
		if (!activeActionId || !playgroundContext.config) return;

		const currentIndex = playgroundContext.config.steps.findIndex(
			(step) => step.action_id === activeActionId
		);

		if (currentIndex !== -1) {
			showAddActionPopup(currentIndex + 1, "Add Action After");
		}
	};

	const deleteActionHandler = () => {
		const handleConfirm = () => {
			if (!activeActionId || !playgroundContext.config) return;

			const currentConfig = playgroundContext.config;
			const stepIndex = currentConfig.steps.findIndex(
				(step) => step.action_id === activeActionId
			);

			if (stepIndex !== -1) {
				currentConfig.steps.splice(stepIndex, 1);
				playgroundContext.setCurrentConfig(currentConfig);
				setActiveActionId(undefined);
				toast.success(`Action ${activeActionId} deleted successfully`);
			} else {
				toast.error("Action ID not found");
			}
			setPopupOpen(false);
		};
		const handleCancel = () => {
			setPopupOpen(false);
		};
		setPopupContent(
			<DeleteConfirmationForm
				title="Confirm Deletion"
				description={`Are you sure you want to delete action ${activeActionId}? This action cannot be undone.`}
				onConfirm={handleConfirm}
				onCancel={handleCancel}
			/>
		);
		setPopupOpen(true);
	};

	const showEditActionPopup = () => {
		if (!activeActionId) return;

		const currentAction = playgroundContext.config?.steps.find(
			(step) => step.action_id === activeActionId
		);

		if (!currentAction) return;

		const getPreviousSteps = () => {
			const currentIndex = playgroundContext.config!.steps.findIndex(
				(step) => step.action_id === activeActionId
			);
			return playgroundContext.config!.steps.slice(0, currentIndex);
		};

		const handleUpdate = () => {
			const formData = getFormValues({
				api: "editApiNameInput",
				actionId: "editActionIdInput",
				owner: "editOwnerInput",
				unsolicited: "editUnsolicitedInput",
				responseFor: "editResponseForInput",
				description: "editDescriptionInput",
			});

			if (!formData.api || !formData.actionId) {
				toast.error("API Name and Action ID are required");
				return;
			}

			const currentConfig = playgroundContext.config;
			if (!currentConfig) return;

			const updatedConfig = { ...currentConfig };
			const stepIndex = updatedConfig.steps.findIndex(
				(step) => step.action_id === activeActionId
			);

			if (stepIndex !== -1) {
				updatedConfig.steps[stepIndex] = {
					...updatedConfig.steps[stepIndex],
					api: formData.api,
					action_id: formData.actionId,
					owner: formData.owner as "BAP" | "BPP",
					unsolicited: formData.unsolicited === "yes",
					responseFor: formData.responseFor || null,
					description: formData.description,
				};
				playgroundContext.setCurrentConfig(updatedConfig);
				setActiveActionId(formData.actionId);
				toast.success("Action updated successfully");
			}

			setPopupOpen(false);
		};

		const handleCancel = () => {
			setPopupOpen(false);
		};

		setPopupContent(
			<EditActionForm
				currentAction={currentAction}
				activeActionId={activeActionId}
				previousSteps={getPreviousSteps()}
				onUpdate={handleUpdate}
				onCancel={handleCancel}
			/>
		);
		setPopupOpen(true);
	};

	const ActionIdsButtons = () => {
		const steps = playgroundContext.config?.steps || [];
		const actionData = steps.map((step) => ({
			id: step.action_id,
			completed:
				playgroundContext.config?.transaction_history.some(
					(th) => th.action_id === step.action_id
				) || false,
		}));

		const getActionButtonClass = (action: (typeof actionData)[0]) => {
			const baseClass =
				"px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 relative";
			const statusClass = action.completed
				? "bg-sky-100 text-sky-700 border-2 border-sky-300 hover:bg-sky-200 shadow-sm"
				: "bg-white text-gray-700 border-2 border-gray-200 hover:border-sky-300 hover:bg-sky-50";
			const activeClass =
				activeActionId === action.id
					? "ring-2 ring-sky-500 ring-offset-2 scale-105 shadow-md"
					: "";

			return `${baseClass} ${statusClass} ${activeClass}`;
		};

		return (
			<div className="h-14 flex items-center px-6 bg-white border-b border-sky-100 overflow-x-auto">
				<div className="flex items-center gap-3">
					{actionData.map((action, index) => (
						<div key={action.id} className="flex items-center gap-3">
							<button
								onClick={() => setActiveActionId(action.id)}
								className={getActionButtonClass(action)}
							>
								{action.completed && (
									<span className="absolute -top-1 -right-1 w-3 h-3 bg-sky-500 rounded-full border-2 border-white"></span>
								)}
								{action.id}
							</button>
							{index !== actionData.length - 1 && (
								<svg
									className="w-4 h-4 text-sky-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 5l7 7-7 7"
									/>
								</svg>
							)}
						</div>
					))}
					{actionData.length === 0 && (
						<button
							onClick={() => showAddActionPopup()}
							className="px-4 py-2 flex items-center gap-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-all duration-200 font-medium shadow-sm"
						>
							<IoMdAdd size={18} /> Add Action
						</button>
					)}
				</div>
			</div>
		);
	};

	const PlaygroundHeader = () => (
		<div className="h-16 flex items-center justify-between px-6 bg-gradient-to-r from-white to-sky-50 border-b border-sky-100 shadow-sm">
			<div className="flex items-center gap-6">
				<div className="flex items-center gap-3">
					{/* <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-600 rounded-lg flex items-center justify-center shadow-md">
						<span className="text-white font-bold text-xl">O</span>
					</div> */}
					<span className="text-xl font-bold bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 bg-clip-text text-transparent tracking-tight">
						PLAYGROUND MODE
					</span>
				</div>

				<div className="hidden md:flex items-center gap-4 text-sm">
					<div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-sky-100">
						<span className="text-gray-500">Domain:</span>
						<span className="font-semibold text-gray-800">
							{playgroundContext.config?.meta.domain}
						</span>
					</div>
					<div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-sky-100">
						<span className="text-gray-500">Version:</span>
						<span className="font-semibold text-gray-800">
							{playgroundContext.config?.meta.version}
						</span>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-2">
				{/* Update IconButton colors to use sky theme */}
				<IconButton
					icon={<FaDownload size={16} />}
					label="Export"
					onClick={handleExport}
					color="sky"
				/>
				<IconButton
					icon={<FaUpload size={16} />}
					label="Import"
					onClick={handleImport}
					color="sky"
				/>
				<IconButton
					icon={<IoMdTrash size={16} />}
					label="Clear"
					onClick={showDeleteConfirmationPopup}
					color="red"
				/>
				<IconButton
					icon={<FaPlay size={16} />}
					label="Run"
					onClick={handleRun}
					color="orange"
				/>
			</div>
		</div>
	);
	const [activeRightTab, setActiveRightTab] =
		useState<PlaygroundRightTabType>("session");

	const isTransactionViewerActive = activeRightTab === "transaction";
	const leftPanelWidth = isTransactionViewerActive ? "w-[30%]" : "w-1/2";
	const rightPanelWidth = isTransactionViewerActive ? "w-[70%]" : "w-1/2";

	return (
		<div className="w-full h-screen flex flex-col">
			<div>
				<PlaygroundHeader />
				<ActionIdsButtons />
				<ActionIdConfigurationPanel
					actionId={activeActionId}
					onEditActionClick={showEditActionPopup}
					onAddBeforeClick={addActionBeforeHandler}
					onAddAfterClick={addActionAfterHandler}
					onDeleteClick={deleteActionHandler}
				/>
			</div>
			<div className="flex gap-4 h-full mt-1">
				<LeftSideView width={leftPanelWidth} activeApi={activeActionId} />
				<RightSideView
					width={rightPanelWidth}
					activeRightTab={activeRightTab}
					setActiveRightTab={setActiveRightTab}
					activeApi={activeActionId}
				/>
			</div>
			<Popup isOpen={popupOpen} onClose={() => setPopupOpen(false)}>
				{popupContent}
			</Popup>
		</div>
	);
}
