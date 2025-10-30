// hooks/useModalHandlers.ts
import { toast } from "react-toastify";

import {
	AddActionForm,
	DeleteConfirmationForm,
	EditActionForm,
} from "../ui/from-contents";
import { getFormValues } from "../utils/form-helper";

interface ModalHandlersProps {
	activeApi: string | undefined;
	setActiveApi: (api: string | undefined) => void;
	openModal: (content: JSX.Element) => void;
	closeModal: () => void;
	addAction: (api: string, actionId: string, insertIndex?: number) => void;
	deleteAction: (actionId: string) => boolean;
	updateAction: (actionId: string, formData: any) => boolean;
	clearConfig: () => void;
	config: any;
}

export const useModalHandlers = ({
	activeApi,
	setActiveApi,
	openModal,
	closeModal,
	addAction,
	deleteAction,
	updateAction,
	clearConfig,
	config,
}: ModalHandlersProps) => {
	const showAddAction = (insertIndex?: number, title = "Add Action") => {
		const handleSubmit = () => {
			const { api, actionId } = getFormValues({
				api: "apiAddNameInput",
				actionId: "actionAddIdInput",
			});

			if (!api || !actionId) {
				toast.error("Please fill all fields");
				return;
			}

			addAction(api, actionId, insertIndex);
			setActiveApi(actionId);
			closeModal();
			toast.success("Action added successfully");
		};

		openModal(
			<AddActionForm
				title={title}
				onSubmit={handleSubmit}
				onCancel={closeModal}
			/>
		);
	};

	const addActionBefore = () => {
		if (!activeApi || !config) return;

		const currentIndex = config.steps.findIndex(
			(step: any) => step.action_id === activeApi
		);

		if (currentIndex !== -1) {
			showAddAction(currentIndex, "Add Action Before");
		}
	};

	const addActionAfter = () => {
		if (!activeApi || !config) return;

		const currentIndex = config.steps.findIndex(
			(step: any) => step.action_id === activeApi
		);

		if (currentIndex !== -1) {
			showAddAction(currentIndex + 1, "Add Action After");
		}
	};

	const deleteActionHandler = () => {
		const handleConfirm = () => {
			if (!activeApi) return;

			const success = deleteAction(activeApi);

			if (success) {
				setActiveApi(undefined);
				toast.success(`Action ${activeApi} deleted successfully`);
			} else {
				toast.error("Action ID not found");
			}

			closeModal();
		};

		openModal(
			<DeleteConfirmationForm
				title="Confirm Deletion"
				description={`Are you sure you want to delete action ${activeApi}? This action cannot be undone.`}
				onConfirm={handleConfirm}
				onCancel={closeModal}
			/>
		);
	};

	const showEditAction = () => {
		if (!activeApi) return;

		const currentAction = config?.steps.find(
			(step: any) => step.action_id === activeApi
		);

		if (!currentAction) return;

		const getPreviousSteps = () => {
			const currentIndex = config.steps.findIndex(
				(step: any) => step.action_id === activeApi
			);
			return config.steps.slice(0, currentIndex);
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

			const success = updateAction(activeApi, formData);

			if (success) {
				setActiveApi(formData.actionId);
				toast.success("Action updated successfully");
			}

			closeModal();
		};

		openModal(
			<EditActionForm
				currentAction={currentAction}
				activeActionId={activeApi}
				previousSteps={getPreviousSteps()}
				onUpdate={handleUpdate}
				onCancel={closeModal}
			/>
		);
	};

	const showDeleteConfirmation = () => {
		const handleConfirm = () => {
			clearConfig();
			setActiveApi(undefined);
			closeModal();
		};
		console.log("In showDeleteConfirmation");
		openModal(
			<DeleteConfirmationForm
				title="Confirm Deletion"
				description="Are you sure you want to delete all flow configurations? This action cannot be undone."
				onConfirm={handleConfirm}
				onCancel={closeModal}
			/>
		);
	};

	return {
		showAddAction,
		addActionBefore,
		addActionAfter,
		deleteAction: deleteActionHandler,
		showEditAction,
		showDeleteConfirmation,
	};
};
