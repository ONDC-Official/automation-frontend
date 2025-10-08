import { IoMdAdd } from "react-icons/io";

// components/playground/ActionIdsButtons.tsx
interface ActionIdsButtonsProps {
	steps: any[];
	transactionHistory: any[];
	activeApi: string | undefined;
	onApiSelect: (actionId: string) => void;
	onAddAction: () => void;
}

export const ActionIdsButtons = ({
	steps,
	transactionHistory,
	activeApi,
	onApiSelect,
	onAddAction,
}: ActionIdsButtonsProps) => {
	const actionData = steps.map((step) => ({
		id: step.action_id,
		completed:
			transactionHistory.some((th) => th.action_id === step.action_id) || false,
	}));

	const getActionButtonClass = (action: (typeof actionData)[0]) => {
		const baseClass =
			"px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 relative";
		const statusClass = action.completed
			? "bg-sky-100 text-sky-700 border-2 border-sky-300 hover:bg-sky-200 shadow-sm"
			: "bg-white text-gray-700 border-2 border-gray-200 hover:border-sky-300 hover:bg-sky-50";
		const activeClass =
			activeApi === action.id
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
							onClick={() => onApiSelect(action.id)}
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
						onClick={onAddAction}
						className="px-4 py-2 flex items-center gap-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-all duration-200 font-medium shadow-sm"
					>
						<IoMdAdd size={18} /> Add Action
					</button>
				)}
			</div>
		</div>
	);
};
