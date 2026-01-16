// import { IoMdAdd } from "react-icons/io";

// // components/playground/ActionIdsButtons.tsx
// interface ActionIdsButtonsProps {
// 	steps: any[];
// 	transactionHistory: any[];
// 	activeApi: string | undefined;
// 	onApiSelect: (actionId: string) => void;
// 	onAddAction: () => void;
// }

// export const ActionIdsButtons = ({
// 	steps,
// 	transactionHistory,
// 	activeApi,
// 	onApiSelect,
// 	onAddAction,
// }: ActionIdsButtonsProps) => {
// 	const actionData = steps.map((step) => ({
// 		id: step.action_id,
// 		completed:
// 			transactionHistory.some((th) => th.action_id === step.action_id) || false,
// 	}));

// 	const getActionButtonClass = (action: (typeof actionData)[0]) => {
// 		const baseClass =
// 			"px-3 py-1 rounded text-xs font-semibold transition-all duration-200 relative";
// 		const statusClass = action.completed
// 			? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
// 			: "bg-white text-gray-700 border border-gray-200 hover:border-sky-300 hover:bg-sky-50";
// 		const activeClass =
// 			activeApi === action.id
// 				? "ring-1 ring-sky-500 ring-offset-1 shadow-sm"
// 				: "";

// 		return `${baseClass} ${statusClass} ${activeClass}`;
// 	};

// 	return (
// 		<div className="h-9 flex items-center px-4 bg-white border-b border-sky-100 overflow-x-auto">
// 			<div className="flex items-center gap-2">
// 				{actionData.map((action, index) => (
// 					<div key={action.id} className="flex items-center gap-2">
// 						<button
// 							onClick={() => onApiSelect(action.id)}
// 							className={getActionButtonClass(action)}
// 						>
// 							{action.completed && (
// 								<span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
// 							)}
// 							{action.id}
// 						</button>
// 						{index !== actionData.length - 1 && (
// 							<span className="inline-block w-3 h-3 text-sky-400">
// 								<svg
// 									viewBox="0 0 12 12"
// 									fill="none"
// 									xmlns="http://www.w3.org/2000/svg"
// 									className="w-full h-full"
// 								>
// 									<path
// 										d="M3 2L8 6L3 10"
// 										stroke="currentColor"
// 										strokeWidth="2"
// 										strokeLinecap="round"
// 										strokeLinejoin="round"
// 									/>
// 								</svg>
// 							</span>
// 						)}
// 					</div>
// 				))}
// 				{actionData.length === 0 && (
// 					<button
// 						onClick={onAddAction}
// 						className="px-3 py-1 flex items-center gap-1.5 bg-sky-500 text-white rounded hover:bg-sky-600 transition-all duration-200 font-medium text-xs"
// 					>
// 						<IoMdAdd size={14} /> Add Action
// 					</button>
// 				)}
// 			</div>
// 		</div>
// 	);
// };

import { IoMdAdd } from "react-icons/io";
import { FiCheck } from "react-icons/fi";
import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";

// components/playground/ActionIdsButtons.tsx
interface ActionIdsButtonsProps {
  steps: MockPlaygroundConfigType["steps"];
  transactionHistory: MockPlaygroundConfigType["transaction_history"];
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
  const actionData = steps.map((step, index) => ({
    id: step.action_id,
    stepNumber: index + 1,
    completed:
      transactionHistory.some((th: { action_id: string }) => th.action_id === step.action_id) ||
      false,
  }));

  return (
    <div className="h-16 flex items-center px-4 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 overflow-x-auto">
      <div className="flex items-center gap-0 min-w-max">
        {actionData.map((action, index) => {
          const isActive = activeApi === action.id;
          const isCompleted = action.completed;

          return (
            <div key={action.id} className="flex items-center">
              {/* Action Step */}
              <button
                onClick={() => onApiSelect(action.id)}
                className={`
									group relative flex items-center gap-3 px-4 py-2 transition-all duration-200
									${isActive ? "scale-105" : "hover:scale-102"}
								`}
              >
                {/* Step Circle */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`
											w-8 h-8 rounded-full flex items-center justify-center
											font-semibold text-sm transition-all duration-200
											${
                        isCompleted
                          ? "bg-green-500 text-white ring-4 ring-green-100"
                          : isActive
                            ? "bg-sky-500 text-white ring-4 ring-sky-100"
                            : "bg-white text-gray-600 border-2 border-gray-300 group-hover:border-sky-400 group-hover:text-sky-600"
                      }
										`}
                  >
                    {isCompleted ? <FiCheck className="w-4 h-4 stroke-[3]" /> : action.stepNumber}
                  </div>

                  {/* Active Pulse Effect */}
                  {isActive && !isCompleted && (
                    <span className="absolute inset-0 rounded-full bg-sky-400 animate-ping opacity-20"></span>
                  )}
                </div>

                {/* Action Label */}
                <div className="flex flex-col items-start">
                  <span
                    className={`
											text-sm font-semibold transition-colors
											${
                        isCompleted
                          ? "text-green-700"
                          : isActive
                            ? "text-sky-900"
                            : "text-gray-700 group-hover:text-gray-900"
                      }
										`}
                  >
                    {action.id}
                  </span>
                </div>

                {/* Active Border Indicator */}
                {isActive && (
                  <div className="absolute inset-0 rounded-lg border-2 border-sky-400 pointer-events-none"></div>
                )}
              </button>

              {/* Connector Line */}
              {index !== actionData.length - 1 && (
                <div className="flex items-center px-2">
                  <div
                    className={`
											h-0.5 w-8 transition-all duration-300
											${action.completed ? "bg-green-400" : "bg-gray-300"}
										`}
                  >
                    <div
                      className={`
												h-full transition-all duration-500
												${action.completed ? "w-full bg-green-500" : "w-0 bg-sky-400"}
											`}
                    ></div>
                  </div>
                  <div
                    className={`
											w-2 h-2 rounded-full -ml-1 transition-all duration-300
											${action.completed ? "bg-green-400" : "bg-gray-300"}
										`}
                  ></div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Action Button */}
        {actionData.length === 0 ? (
          <button
            onClick={onAddAction}
            className="
							flex items-center gap-2 px-5 py-2.5 
							bg-sky-500 text-white rounded-lg 
							hover:bg-sky-600 active:scale-95
							transition-all duration-200 
							font-semibold text-sm
							shadow-sm hover:shadow-md
						"
          >
            <IoMdAdd size={18} />
            <span>Add First Action</span>
          </button>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};
