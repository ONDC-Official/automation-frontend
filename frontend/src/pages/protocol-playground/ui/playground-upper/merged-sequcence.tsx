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

    // const ActionDetailsCard = ({
    // 	action,
    // }: {
    // 	action: (typeof actionData)[0];
    // }) => {
    // 	const method = "POST"; // Extract from config if available
    // 	const methodStyles: Record<string, string> = {
    // 		POST: "bg-sky-500/90",
    // 		GET: "bg-blue-500/90",
    // 		PUT: "bg-amber-500/90",
    // 		DELETE: "bg-red-500/90",
    // 	};

    // 	const ActionButton = ({
    // 		icon,
    // 		label,
    // 		onClick,
    // 		variant = "default",
    // 	}: {
    // 		icon: React.ReactNode;
    // 		label: string;
    // 		onClick: () => void;
    // 		variant?: "default" | "primary" | "danger";
    // 	}) => {
    // 		const variants = {
    // 			default: "bg-white/60 hover:bg-white/80 text-gray-800 border-white/40",
    // 			primary: "bg-sky-500/90 hover:bg-sky-600 text-white border-sky-400/50",
    // 			danger: "bg-red-500/90 hover:bg-red-600 text-white border-red-400/50",
    // 		};

    // 		return (
    // 			<button
    // 				onClick={(e) => {
    // 					e.stopPropagation();
    // 					onClick();
    // 				}}
    // 				className={`
    // 				flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg
    // 				backdrop-blur-xl border transition-all duration-200
    // 				text-xs font-medium shadow-sm hover:shadow
    // 				${variants[variant]}
    // 			`}
    // 			>
    // 				{icon}
    // 				<span>{label}</span>
    // 			</button>
    // 		);
    // 	};

    // 	return (
    // 		<div className="w-[320px] backdrop-blur-2xl bg-white/70 border border-white/40 rounded-2xl shadow-xl overflow-hidden">
    // 			{/* Header */}
    // 			<div className="px-4 py-3 bg-gradient-to-br from-white/80 to-white/60 border-b border-white/30">
    // 				<div className="flex items-center justify-between mb-2">
    // 					<div className="flex items-center gap-2">
    // 						<span
    // 							className={`px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-sm ${methodStyles[method]}`}
    // 						>
    // 							{method}
    // 						</span>
    // 						<span className="text-xs text-gray-700 font-mono">
    // 							/{action.config.api}
    // 						</span>
    // 					</div>
    // 					{action.completed && (
    // 						<span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/30 border border-sky-400/40 text-sky-800 text-[10px] font-semibold">
    // 							<FiCheck size={10} strokeWidth={3} /> Done
    // 						</span>
    // 					)}
    // 				</div>
    // 				<h4 className="text-sm font-bold text-gray-900 font-mono">
    // 					{action.id}
    // 				</h4>
    // 			</div>

    // 			{/* Properties */}
    // 			<div className="px-4 py-3 space-y-2 bg-white/50">
    // 				<div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/60 backdrop-blur-xl border border-white/30 shadow-sm">
    // 					<span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
    // 						Owner
    // 					</span>
    // 					<span
    // 						className={`text-xs font-bold px-2 py-0.5 rounded ${
    // 							action.config.owner === "BPP"
    // 								? "bg-purple-500/30 text-purple-800"
    // 								: "bg-sky-500/30 text-sky-800"
    // 						}`}
    // 					>
    // 						{action.config.owner}
    // 					</span>
    // 				</div>

    // 				{action.config.responseFor &&
    // 					action.config.responseFor !== "NONE" && (
    // 						<div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/60 backdrop-blur-xl border border-white/30 shadow-sm">
    // 							<span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
    // 								Response For
    // 							</span>
    // 							<span className="text-xs font-bold text-indigo-800 font-mono">
    // 								{action.config.responseFor}
    // 							</span>
    // 						</div>
    // 					)}
    // 				{action.config.unsolicited !== undefined && (
    // 					<div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/60 backdrop-blur-xl border border-white/30 shadow-sm">
    // 						<span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
    // 							Unsolicited
    // 						</span>
    // 						<span
    // 							className={`text-xs font-bold px-2 py-0.5 rounded ${
    // 								action.config.unsolicited
    // 									? "bg-green-500/30 text-green-800"
    // 									: "bg-red-500/30 text-red-800"
    // 							}`}
    // 						>
    // 							{action.config.unsolicited ? "Yes" : "No"}
    // 						</span>
    // 					</div>
    // 				)}

    // 				{action.config.description && (
    // 					<div className="py-2 px-3 rounded-lg bg-white-500/15 backdrop-blur-xl border border-blue-400/30 shadow-sm">
    // 						<p className="text-xs text-gray-800 leading-snug">
    // 							{action.config.description}
    // 						</p>
    // 					</div>
    // 				)}
    // 			</div>

    // 			{/* Actions */}
    // 			<div className="px-4 py-3 bg-gradient-to-br from-white/60 to-white/50 border-t border-white/30">
    // 				<div className="grid grid-cols-3 gap-1.5 mb-1.5">
    // 					<ActionButton
    // 						icon={<TbColumnInsertLeft size={14} />}
    // 						label="Before"
    // 						onClick={() => onAddBefore?.(action.id)}
    // 					/>
    // 					<ActionButton
    // 						icon={<TbColumnInsertRight size={14} />}
    // 						label="After"
    // 						onClick={() => onAddAfter?.(action.id)}
    // 					/>
    // 					<ActionButton
    // 						icon={<RxReset size={14} />}
    // 						label="Reset"
    // 						onClick={() =>
    // 							playgroundContext?.resetTransactionHistory(action.id)
    // 						}
    // 					/>
    // 				</div>
    // 				<div className="grid grid-cols-2 gap-1.5">
    // 					<ActionButton
    // 						icon={<MdEdit size={14} />}
    // 						label="Edit"
    // 						onClick={() => onEditAction?.(action.id)}
    // 						variant="primary"
    // 					/>
    // 					<ActionButton
    // 						icon={<IoMdTrash size={14} />}
    // 						label="Delete"
    // 						onClick={() => onDeleteAction?.(action.id)}
    // 						variant="danger"
    // 					/>
    // 				</div>
    // 			</div>
    // 		</div>
    // 	);
    // };

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
