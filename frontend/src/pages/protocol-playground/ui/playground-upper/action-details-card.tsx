import { FiCheck } from "react-icons/fi";
import { TbColumnInsertLeft, TbColumnInsertRight } from "react-icons/tb";
import { RxReset } from "react-icons/rx";
import { MdEdit } from "react-icons/md";
import { IoMdTrash } from "react-icons/io";
import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";

import { PlaygroundContextProps } from "@pages/protocol-playground/context/playground-context";

interface ActionData {
    id: string;
    stepNumber?: number;
    config: MockPlaygroundConfigType["steps"][number];
    responseFor?: string | null;
    completed: boolean;
}

interface ActionDetailsCardProps {
    action: ActionData;
    onAddBefore?: (id: string) => void;
    onAddAfter?: (id: string) => void;
    onEditAction?: (id: string) => void;
    onDeleteAction?: (id: string) => void;
    playgroundContext?: PlaygroundContextProps;
}

interface FieldData {
    label: string;
    value: string;
    valueClass: string;
}

const ActionDetailsCard = ({
    action,
    onAddBefore,
    onAddAfter,
    onEditAction,
    onDeleteAction,
    playgroundContext,
}: ActionDetailsCardProps) => {
    const method = "POST";

    const methodStyles: Record<string, string> = {
        POST: "bg-sky-500 text-white",
        GET: "bg-blue-500 text-white",
        PUT: "bg-amber-500 text-white",
        DELETE: "bg-red-500 text-white",
    };

    const ActionButton = ({
        icon,
        label,
        onClick,
        variant = "default",
    }: {
        icon: React.ReactNode;
        label: string;
        onClick: () => void;
        variant?: "default" | "primary" | "danger";
    }) => {
        const variants = {
            default:
                "bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300",
            primary:
                "bg-sky-500 hover:bg-sky-600 text-white border-sky-500 hover:border-sky-600 shadow-sm",
            danger: "bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 shadow-sm",
        };

        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                className={`
					flex items-center justify-center gap-1.5 px-3 py-2
					rounded-lg border-2 transition-all duration-200
					text-xs font-semibold
					${variants[variant]}
					hover:scale-[1.02] active:scale-[0.98]
				`}
            >
                {icon}
                <span>{label}</span>
            </button>
        );
    };

    return (
        <div className="w-[340px] bg-white rounded-2xl border-2 border-gray-100 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            {/* Header with colored accent */}
            <div className="relative">
                <div className="h-1 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600" />

                <div className="px-2 py-2 bg-gradient-to-b from-sky-50 to-white">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span
                                className={`
									px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide
									${methodStyles[method]}
								`}
                            >
                                {method}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                                /{action.config.api}
                            </span>
                        </div>

                        {action.completed && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                                <FiCheck size={12} strokeWidth={3} /> Done
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Properties Section */}
            <div className="px-2 py-2 space-y-1 bg-white">
                {[
                    {
                        label: "Owner",
                        value: action.config.owner,
                        valueClass:
                            action.config.owner === "BPP"
                                ? "bg-purple-100 text-purple-700 border-purple-200"
                                : "bg-sky-100 text-sky-700 border-sky-200",
                    },
                    action.config.responseFor &&
                        action.config.responseFor !== "NONE" && {
                            label: "Response For",
                            value: action.config.responseFor,
                            valueClass: "bg-indigo-100 text-indigo-700 border-indigo-200",
                        },
                    action.config.unsolicited !== undefined && {
                        label: "Unsolicited",
                        value: action.config.unsolicited ? "Yes" : "No",
                        valueClass: action.config.unsolicited
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-red-100 text-red-700 border-red-200",
                    },
                ]
                    .filter((field): field is FieldData => Boolean(field))
                    .map((field, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 border border-gray-100"
                        >
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                {field!.label}
                            </span>
                            <span
                                className={`text-xs font-bold px-2 py-1 rounded-md border ${field!.valueClass}`}
                            >
                                {field!.value}
                            </span>
                        </div>
                    ))}

                {action.config.description && (
                    <div className="py-3 px-3.5 rounded-lg bg-sky-50 border-l-2 border-sky-400">
                        <p className="text-xs text-gray-700 leading-relaxed font-bold">
                            {action.config.description}
                        </p>
                    </div>
                )}
            </div>

            {/* Actions Footer */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-2 mb-2">
                    <ActionButton
                        icon={<TbColumnInsertLeft size={14} />}
                        label="Before"
                        onClick={() => onAddBefore?.(action.id)}
                    />
                    <ActionButton
                        icon={<TbColumnInsertRight size={14} />}
                        label="After"
                        onClick={() => onAddAfter?.(action.id)}
                    />
                    <ActionButton
                        icon={<RxReset size={14} />}
                        label="Reset"
                        onClick={() => playgroundContext?.resetTransactionHistory(action.id)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <ActionButton
                        icon={<MdEdit size={14} />}
                        label="Edit"
                        onClick={() => onEditAction?.(action.id)}
                        variant="primary"
                    />
                    <ActionButton
                        icon={<IoMdTrash size={14} />}
                        label="Delete"
                        onClick={() => onDeleteAction?.(action.id)}
                        variant="danger"
                    />
                </div>
            </div>
        </div>
    );
};

export default ActionDetailsCard;
