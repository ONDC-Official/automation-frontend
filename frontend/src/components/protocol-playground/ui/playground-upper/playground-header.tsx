import IconButton from "../../../ui/mini-components/icon-button";
import { FaDownload, FaUpload, FaPlay } from "react-icons/fa";
import { IoMdTrash } from "react-icons/io";

// components/playground/PlaygroundHeader.tsx
interface PlaygroundHeaderProps {
	domain?: string;
	version?: string;
	flowId?: string;
	onExport: () => void;
	onImport: () => void;
	onClear: () => void;
	onRun: () => void;
}

export const PlaygroundHeader = ({
	domain,
	version,
	flowId,
	onExport,
	onImport,
	onClear,
	onRun,
}: PlaygroundHeaderProps) => (
	<div className="h-16 flex items-center justify-between px-6 bg-gradient-to-r from-white to-sky-50 border-b border-sky-100 shadow-sm">
		<div className="flex items-center gap-6">
			<div className="flex items-center gap-3">
				<span className="text-xl font-bold bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 bg-clip-text text-transparent tracking-tight">
					PLAYGROUND MODE
				</span>
			</div>

			<div className="hidden md:flex items-center gap-4 text-sm">
				<div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-sky-100">
					<span className="text-gray-500">Domain:</span>
					<span className="font-semibold text-gray-800">{domain}</span>
				</div>
				<div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-sky-100">
					<span className="text-gray-500">Version:</span>
					<span className="font-semibold text-gray-800">{version}</span>
				</div>
				<div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-sky-100">
					<span className="text-gray-500">Flow ID:</span>
					<span className="font-semibold text-gray-800">{flowId}</span>
				</div>
			</div>
		</div>

		<div className="flex items-center gap-2">
			<IconButton
				icon={<FaDownload size={16} />}
				label="Export"
				onClick={onExport}
				color="sky"
			/>
			<IconButton
				icon={<FaUpload size={16} />}
				label="Import"
				onClick={onImport}
				color="sky"
			/>
			<IconButton
				icon={<IoMdTrash size={16} />}
				label="Clear"
				onClick={onClear}
				color="red"
			/>
			<IconButton
				icon={<FaPlay size={16} />}
				label="Run"
				onClick={onRun}
				color="orange"
			/>
		</div>
	</div>
);
