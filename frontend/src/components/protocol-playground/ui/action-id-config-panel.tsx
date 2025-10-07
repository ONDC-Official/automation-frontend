import { useContext } from "react";
import { PlaygroundContext } from "../context/playground-context";
import { MdEdit } from "react-icons/md";
import { TbColumnInsertLeft, TbColumnInsertRight } from "react-icons/tb";
import IconButton from "../../ui/mini-components/icon-button";
import { IoMdTrash } from "react-icons/io";

interface ActionIdConfigurationPanelProps {
	actionId: string | undefined;
	onEditActionClick?: () => void;
	onAddBeforeClick?: () => void;
	onAddAfterClick?: () => void;
	onDeleteClick?: () => void;
}

export function ActionIdConfigurationPanel({
	actionId,
	onEditActionClick,
	onAddBeforeClick,
	onAddAfterClick,
	onDeleteClick,
}: ActionIdConfigurationPanelProps) {
	const playgroundContext = useContext(PlaygroundContext);

	if (!actionId) {
		return (
			<div className="px-6 py-4 bg-gradient-to-r from-sky-50 to-white border-b border-sky-100">
				<div className="text-center py-6 text-gray-400">
					<p className="text-sm font-medium">
						Select an Action ID to configure
					</p>
				</div>
			</div>
		);
	}

	const actionConfig = playgroundContext.config?.steps.find(
		(step) => step.action_id === actionId
	);

	if (!actionConfig) {
		return (
			<div className="px-6 py-4 bg-red-50 border-b border-red-200">
				<div className="text-center text-red-600 text-sm font-medium">
					! Action ID not found in configuration
				</div>
			</div>
		);
	}

	const Tag = ({
		children,
		variant = "default",
	}: {
		children: React.ReactNode;
		variant?: string;
	}) => {
		const variants: Record<string, string> = {
			default: "bg-sky-50 text-sky-700 border-sky-200",
			owner:
				actionConfig.owner === "BPP"
					? "bg-purple-50 text-purple-700 border-purple-200"
					: "bg-sky-50 text-sky-700 border-sky-200",
			api: "bg-gradient-to-r from-sky-100 to-sky-50 text-sky-800 border-sky-300 font-mono",
		};

		return (
			<span
				className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${variants[variant]}`}
			>
				{children}
			</span>
		);
	};

	return (
		<div className="px-6 py-2 bg-gradient-to-r from-white to-sky-50 border-b border-sky-100">
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-2 flex-wrap flex-1">
					<Tag variant="api">POST /{actionConfig.api}</Tag>
					<Tag>Id: {actionConfig.action_id}</Tag>
					<Tag variant="owner">Owner: {actionConfig.owner}</Tag>
					<Tag>
						Unsolicited:{" "}
						<span
							className={
								actionConfig.unsolicited ? "text-green-600" : "text-gray-600"
							}
						>
							{actionConfig.unsolicited ? "Yes" : "No"}
						</span>
					</Tag>

					<Tag>Response For: {actionConfig.responseFor ?? "NONE"}</Tag>

					{actionConfig.description && (
						<div
							className="px-3 py-1.5 bg-white rounded-lg border border-sky-100 text-xs text-gray-600 max-w-xs truncate"
							title={actionConfig.description}
						>
							Description: {actionConfig.description}
						</div>
					)}
				</div>

				<div className="flex items-center gap-1 flex-shrink-0">
					<IconButton
						icon={<TbColumnInsertLeft size={16} />}
						onClick={onAddBeforeClick}
						color="gray"
						label="Before"
					/>
					<IconButton
						icon={<TbColumnInsertRight size={16} />}
						onClick={onAddAfterClick}
						color="gray"
						label="After"
					/>
					<IconButton
						icon={<MdEdit size={16} />}
						onClick={onEditActionClick}
						color="sky"
						label="Edit"
					/>
					<IconButton
						icon={<IoMdTrash size={16} />}
						onClick={onDeleteClick}
						color="red"
						label={`Delete ${actionId}`}
					/>
				</div>
			</div>
		</div>
	);
}
