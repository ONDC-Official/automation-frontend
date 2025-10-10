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
			"px-3 py-1 rounded text-xs font-semibold transition-all duration-200 relative";
		const statusClass = action.completed
			? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
			: "bg-white text-gray-700 border border-gray-200 hover:border-sky-300 hover:bg-sky-50";
		const activeClass =
			activeApi === action.id
				? "ring-1 ring-sky-500 ring-offset-1 shadow-sm"
				: "";

		return `${baseClass} ${statusClass} ${activeClass}`;
	};

	return (
		<div className="h-9 flex items-center px-4 bg-white border-b border-sky-100 overflow-x-auto">
			<div className="flex items-center gap-2">
				{actionData.map((action, index) => (
					<div key={action.id} className="flex items-center gap-2">
						<button
							onClick={() => onApiSelect(action.id)}
							className={getActionButtonClass(action)}
						>
							{action.completed && (
								<span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
							)}
							{action.id}
						</button>
						{index !== actionData.length - 1 && (
							<span className="inline-block w-3 h-3 text-sky-400">
								<svg
									viewBox="0 0 12 12"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									className="w-full h-full"
								>
									<path
										d="M3 2L8 6L3 10"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</span>
						)}
					</div>
				))}
				{actionData.length === 0 && (
					<button
						onClick={onAddAction}
						className="px-3 py-1 flex items-center gap-1.5 bg-sky-500 text-white rounded hover:bg-sky-600 transition-all duration-200 font-medium text-xs"
					>
						<IoMdAdd size={14} /> Add Action
					</button>
				)}
			</div>
		</div>
	);
};
