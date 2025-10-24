import { FiCheck } from "react-icons/fi";
import { TbColumnInsertLeft, TbColumnInsertRight } from "react-icons/tb";
import { RxReset } from "react-icons/rx";
import { MdEdit } from "react-icons/md";
import { IoMdTrash } from "react-icons/io";

const ActionDetailsCard = ({
	action,
	onAddBefore,
	onAddAfter,
	onEditAction,
	onDeleteAction,
	playgroundContext,
}: {
	action: any;
	onAddBefore?: (id: string) => void;
	onAddAfter?: (id: string) => void;
	onEditAction?: (id: string) => void;
	onDeleteAction?: (id: string) => void;
	playgroundContext?: any;
}) => {
	const method = "POST";

	const methodStyles: Record<string, string> = {
		POST: "bg-gradient-to-r from-sky-500 to-sky-400",
		GET: "bg-gradient-to-r from-blue-500 to-blue-400",
		PUT: "bg-gradient-to-r from-amber-500 to-amber-400",
		DELETE: "bg-gradient-to-r from-red-500 to-red-400",
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
			default: "bg-white text-gray-700 border-white/30 shadow-inner",
			primary:
				"bg-sky-500/90 hover:bg-sky-600 text-white border-sky-400/40 shadow-md",
			danger:
				"bg-red-500/90 hover:bg-red-600 text-white border-red-400/40 shadow-md",
		};

		return (
			<button
				onClick={(e) => {
					e.stopPropagation();
					onClick();
				}}
				className={`
					group flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl
					backdrop-blur-lg border transition-all duration-200
					text-xs font-semibold tracking-wide
					${variants[variant]}
					hover:-translate-y-[1px] hover:shadow-lg active:scale-[0.98]
				`}
			>
				{icon}
				<span>{label}</span>
			</button>
		);
	};

	return (
		<div
			className="
				w-[340px] rounded-3xl overflow-hidden
				bg-gradient-to-br from-white/70 to-white/40 
				backdrop-blur-2xl border border-white/40
				shadow-[0_8px_20px_rgba(0,0,0,0.1)] 
				transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.15)]
			"
		>
			{/* Header */}
			<div className="px-4 py-3 bg-gradient-to-br from-white/70 to-white/40 border-b border-white/30">
				<div className="flex items-center justify-between mb-1.5">
					<div className="flex items-center gap-2">
						<span
							className={`
								px-2 py-0.5 rounded-md text-[10px] font-bold text-white uppercase shadow-sm
								${methodStyles[method]}
							`}
						>
							{method}
						</span>
						<span className="text-xs text-gray-700 font-mono truncate max-w-[150px]">
							/{action.config.api}
						</span>
					</div>

					{action.completed && (
						<span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/30 border border-emerald-300/40 text-emerald-700 text-[10px] font-semibold">
							<FiCheck size={10} strokeWidth={3} /> Done
						</span>
					)}
				</div>

				<h4 className="text-sm font-bold text-gray-900 font-mono truncate">
					{action.id}
				</h4>
			</div>

			{/* Properties */}
			<div className="px-4 py-3 space-y-2 bg-gradient-to-br from-white/60 to-white/30">
				{[
					{
						label: "Owner",
						value: action.config.owner,
						valueClass:
							action.config.owner === "BPP"
								? "bg-purple-500/30 text-purple-800"
								: "bg-sky-500/30 text-sky-800",
					},
					action.config.responseFor &&
						action.config.responseFor !== "NONE" && {
							label: "Response For",
							value: action.config.responseFor,
							valueClass: "text-indigo-800 font-mono",
						},
					action.config.unsolicited !== undefined && {
						label: "Unsolicited",
						value: action.config.unsolicited ? "Yes" : "No",
						valueClass: action.config.unsolicited
							? "bg-green-500/30 text-green-800"
							: "bg-red-500/30 text-red-800",
					},
				]
					.filter(Boolean)
					.map((field, i) => (
						<div
							key={i}
							className="flex items-center justify-between py-1.5 px-3 rounded-lg 
								bg-white/50 backdrop-blur-xl border border-white/30 shadow-sm"
						>
							<span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
								{field!.label}
							</span>
							<span
								className={`text-xs font-bold px-2 py-0.5 rounded ${field!.valueClass}`}
							>
								{field!.value}
							</span>
						</div>
					))}

				{action.config.description && (
					<div className="py-2 px-3 rounded-lg bg-white/40 border border-blue-400/30 shadow-inner">
						<p className="text-xs text-gray-700 leading-snug font-bold">
							{action.config.description}
						</p>
					</div>
				)}
			</div>

			{/* Actions */}
			<div className="px-4 py-3 bg-gradient-to-br from-white/60 to-white/40 border-t border-white/30">
				<div className="grid grid-cols-3 gap-1.5 mb-1.5">
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
						onClick={() =>
							playgroundContext?.resetTransactionHistory(action.id)
						}
					/>
				</div>
				<div className="grid grid-cols-2 gap-1.5">
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
