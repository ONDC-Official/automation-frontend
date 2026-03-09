import { useContext } from "react";
import Tippy from "@tippyjs/react";
import { MockPlaygroundConfigType, TransactionHistoryItem } from "@ondc/automation-mock-runner";
import { FaExchangeAlt, FaLongArrowAltRight } from "react-icons/fa";
import { IoMdAdd } from "react-icons/io";
import { FiCheck } from "react-icons/fi";

import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";
import ActionDetailsCard from "@pages/protocol-playground/ui/playground-upper/action-details-card";

import "tippy.js/animations/shift-away-subtle.css";

interface ActionTimelineProps {
    steps: MockPlaygroundConfigType["steps"];
    transactionHistory: TransactionHistoryItem[];
    activeApi: string | undefined;
    onApiSelect: (actionId: string) => void;
    onAddAction: () => void;
    onEditAction?: (actionId: string) => void;
    onDeleteAction?: (actionId: string) => void;
    onAddBefore?: (actionId: string) => void;
    onAddAfter?: (actionId: string) => void;
}

export const ActionTimeline = ({
    steps,
    transactionHistory,
    activeApi,
    onApiSelect,
    onAddAction,
    onEditAction,
    onDeleteAction,
    onAddBefore,
    onAddAfter,
}: ActionTimelineProps) => {
    const playgroundContext = useContext(PlaygroundContext);

    const actionData = steps.map((step, index) => ({
        id: step.action_id,
        stepNumber: index + 1,
        config: step,
        responseFor: step.responseFor,
        completed: transactionHistory.some((th) => th.action_id === step.action_id) || false,
    }));

    return (
        <div className="h-16 flex items-center px-6 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 overflow-x-auto">
            <div className="flex items-center gap-0 min-w-max">
                {actionData.map((action, index) => {
                    const isActive = activeApi === action.id;
                    const isCompleted = action.completed;

                    let nextAction: (typeof actionData)[0] | null = null;
                    if (index + 1 < actionData.length) {
                        nextAction = actionData[index + 1];
                    }
                    const isPair = nextAction && nextAction.responseFor === action.id;

                    return (
                        <div key={action.id} className="flex items-center">
                            {/* Action Step with Hover Card */}
                            <Tippy
                                content={
                                    <ActionDetailsCard
                                        action={action}
                                        onAddAfter={onAddAfter}
                                        onAddBefore={onAddBefore}
                                        onEditAction={onEditAction}
                                        onDeleteAction={onDeleteAction}
                                        playgroundContext={playgroundContext}
                                    />
                                }
                                interactive={true}
                                animation="shift-away-subtle"
                                placement="bottom"
                                arrow={false}
                                offset={[0, 12]}
                                maxWidth="none"
                                appendTo={() => document.body}
                            >
                                <button
                                    onClick={() => onApiSelect(action.id)}
                                    className={`
										group relative flex items-center gap-3 px-2 py-2 transition-all duration-200
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
                                                        ? "bg-blue-500 text-white ring-4 ring-blue-100"
                                                        : isActive
                                                          ? "bg-sky-500 text-white ring-4 ring-sky-100"
                                                          : "bg-white text-gray-600 border-2 border-gray-300 group-hover:border-sky-400 group-hover:text-sky-600"
                                                }
											`}
                                        >
                                            {isCompleted ? (
                                                <FiCheck className="w-4 h-4 stroke-[3]" />
                                            ) : (
                                                action.stepNumber
                                            )}
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
                                                        ? "text-sky-950"
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
                            </Tippy>

                            {index !== actionData.length - 1 && (
                                <div className="flex items-center justify-center w-10">
                                    {isPair ? (
                                        <FaExchangeAlt
                                            size={18}
                                            className={`transition-all duration-300 ${
                                                action.completed ? "text-blue-500" : "text-gray-400"
                                            }`}
                                        />
                                    ) : (
                                        <FaLongArrowAltRight
                                            size={18}
                                            className={`transition-all duration-300 ${
                                                action.completed ? "text-blue-500" : "text-gray-400"
                                            }`}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Add Action Button */}
                {actionData.length === 0 && (
                    <button
                        onClick={onAddAction}
                        className="
							flex items-center gap-2 px-5 py-2.5 
							bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-lg 
							hover:from-sky-600 hover:to-sky-700 active:scale-95
							transition-all duration-200 
							font-semibold text-sm
							shadow-md hover:shadow-lg
							backdrop-blur-sm
						"
                    >
                        <IoMdAdd size={18} />
                        <span>Add First Action</span>
                    </button>
                )}
            </div>
        </div>
    );
};
