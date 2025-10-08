import { useContext, useState } from "react";
import { PlaygroundContext } from "./context/playground-context";
import Popup from "../ui/pop-up/pop-up";
import { ActionIdConfigurationPanel } from "./ui/action-id-config-panel";
import { PlaygroundRightTabType } from "./types";
import { LeftSideView } from "./ui/LeftSideView";
import { RightSideView } from "./ui/RightSideView";
import { useConfigOperations } from "./hooks/use-config";
import { PlaygroundHeader } from "./ui/playground-upper/playground-header";
import { ActionIdsButtons } from "./ui/playground-upper/action-id-buttons";
import { useModalHandlers } from "./hooks/use-modal";
import { usePlaygroundActions } from "./hooks/use-playground-actions";
import { usePlaygroundModals } from "./hooks/use-playground-modal";

// ===== MAIN COMPONENT =====
export default function PlaygroundPage() {
	const playgroundContext = useContext(PlaygroundContext);

	const { activeApi, setActiveApi } = playgroundContext;

	const { exportConfig, importConfig, clearConfig, runConfig } =
		useConfigOperations();
	const { addAction, deleteAction, updateAction } = usePlaygroundActions();
	const { popupOpen, openModal, closeModal, popupContent } =
		usePlaygroundModals();
	const modalHandlers = useModalHandlers({
		activeApi,
		setActiveApi,
		openModal,
		closeModal,
		addAction,
		deleteAction,
		updateAction,
		clearConfig,
		config: playgroundContext.config,
	});

	const [activeRightTab, setActiveRightTab] =
		useState<PlaygroundRightTabType>("session");

	const isTransactionViewerActive = activeRightTab === "transaction";
	const leftPanelWidth = isTransactionViewerActive ? "w-[30%]" : "w-1/2";
	const rightPanelWidth = isTransactionViewerActive ? "w-[70%]" : "w-1/2";

	return (
		<div className="w-full h-screen flex flex-col">
			<div>
				<PlaygroundHeader
					domain={playgroundContext.config?.meta.domain || "N/A"}
					version={playgroundContext.config?.meta.version || "N/A"}
					onExport={exportConfig}
					onImport={importConfig}
					onClear={modalHandlers.showDeleteConfirmation}
					onRun={runConfig}
				/>
				<ActionIdsButtons
					steps={playgroundContext.config?.steps || []}
					activeApi={activeApi}
					onApiSelect={setActiveApi}
					onAddAction={modalHandlers.showAddAction}
					transactionHistory={
						playgroundContext.config?.transaction_history || []
					}
				/>
				<ActionIdConfigurationPanel
					actionId={activeApi}
					onEditActionClick={modalHandlers.showEditAction}
					onAddBeforeClick={modalHandlers.addActionBefore}
					onAddAfterClick={modalHandlers.addActionAfter}
					onDeleteClick={modalHandlers.deleteAction}
				/>
			</div>
			<div className="flex gap-4 h-full mt-1">
				<LeftSideView width={leftPanelWidth} activeApi={activeApi} />
				<RightSideView
					width={rightPanelWidth}
					activeRightTab={activeRightTab}
					setActiveRightTab={setActiveRightTab}
					activeApi={activeApi}
				/>
			</div>
			<Popup isOpen={popupOpen} onClose={closeModal}>
				{popupContent}
			</Popup>
		</div>
	);
}
