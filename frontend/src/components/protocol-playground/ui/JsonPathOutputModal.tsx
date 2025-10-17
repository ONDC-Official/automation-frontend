import React, { useEffect, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { MdClose, MdContentCopy, MdCode } from "react-icons/md";
import { IoCheckmarkCircle } from "react-icons/io5";
import { DarkSkyBlueTheme } from "./editor-themes";

interface JsonPathOutputPopupProps {
	jsonPath: string;
	output: any;
	onClose: () => void;
}

const JsonPathOutputPopup: React.FC<JsonPathOutputPopupProps> = ({
	jsonPath,
	output,
	onClose,
}) => {
	const [isVisible, setIsVisible] = useState(false);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		// Trigger entrance animation
		setIsVisible(true);
	}, []);

	const handleClose = () => {
		setIsVisible(false);
		// Wait for exit animation to complete before closing
		setTimeout(onClose, 200);
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(JSON.stringify(output, null, 2));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error("Failed to copy:", error);
		}
	};

	const handleEditorWillMount = (monaco: any) => {
		monaco.editor.defineTheme("dark-skyblue", DarkSkyBlueTheme);
	};

	return (
		<div
			className={`absolute inset-0 flex items-center justify-center z-50 transition-all duration-300 ${
				isVisible ? "bg-black/50 backdrop-blur-sm" : "bg-transparent"
			}`}
			onClick={handleClose}
		>
			<div
				className={`relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl w-[85%] h-[75%] border border-gray-600/50 overflow-hidden transform transition-all duration-300 ease-out ${
					isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
				}`}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Animated gradient border */}
				<div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-sm -z-10"></div>

				{/* Header */}
				<div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm">
					<div className="flex items-center gap-2">
						<div className="p-1 bg-sky-500/10 rounded-lg border border-sky-500/20">
							<MdCode className="text-sky-400 text-lg" />
						</div>
						<div>
							<h2 className="text-base font-semibold text-white flex items-center gap-2">
								JSON Output
							</h2>
							<div className="flex items-center gap-1 mt-0.5">
								<span className="text-xs text-gray-400 font-medium">Path:</span>
								<code className="text-xs text-sky-300 font-mono bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
									{jsonPath}
								</code>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<button
							onClick={handleCopy}
							className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
								copied
									? "bg-green-500/20 text-green-300 border border-green-500/30"
									: "bg-gray-700/50 text-gray-300 border border-gray-600/50 hover:bg-gray-600/50 hover:border-gray-500/50 hover:text-white"
							}`}
							title="Copy JSON"
						>
							{copied ? (
								<>
									<IoCheckmarkCircle className="text-base" />
									<span>Copied!</span>
								</>
							) : (
								<>
									<MdContentCopy className="text-base" />
									<span>Copy</span>
								</>
							)}
						</button>

						<button
							onClick={handleClose}
							className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 rounded-lg transition-all duration-200 border border-gray-600/50"
							title="Close (ESC)"
						>
							<MdClose size={20} />
						</button>
					</div>
				</div>

				{/* Monaco JSON Viewer */}
				<div className="h-full relative">
					{/* Loading shimmer effect */}
					<div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/10 to-transparent animate-pulse opacity-20"></div>

					<Editor
						height="calc(100% - 73px)"
						defaultLanguage="json"
						value={JSON.stringify(output, null, 2)}
						beforeMount={handleEditorWillMount}
						theme="dark-skyblue"
						options={{
							padding: { top: 16, bottom: 16 },
							fontSize: 16,
							lineNumbers: "on",
							scrollBeyondLastLine: true,
							automaticLayout: true,
							// wordWrap: "on",
							formatOnPaste: true,
							formatOnType: true,
							readOnly: true,
						}}
					/>

					{/* Bottom gradient overlay for better visual separation */}
					<div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-900/20 to-transparent pointer-events-none"></div>
				</div>
			</div>
		</div>
	);
};

export default JsonPathOutputPopup;
