import { useContext, useState } from "react";

import { PlaygroundContext } from "../context/playground-context";
import { Editor } from "@monaco-editor/react";
import { PLAYGROUND_LEFT_TABS } from "../types";
import { DarkSkyBlueTheme } from "./editor-themes";

export function LeftSideView(props: { width: string; activeApi?: string }) {
	const { width, activeApi } = props;
	const playgroundContext = useContext(PlaygroundContext);

	const stepData = playgroundContext.config?.steps.find(
		(f) => f.action_id === activeApi
	);
	console.log("stepData:", stepData, activeApi);
	// Define tabs for different mock properties

	const [activeLeftTab, setActiveLeftTab] = useState<string>(
		PLAYGROUND_LEFT_TABS[0].id
	);
	const activeTabConfig = PLAYGROUND_LEFT_TABS.find(
		(tab) => tab.id === activeLeftTab
	)!;
	// Get the current editor content
	const getEditorContent = () => {
		if (!stepData) return "";
		const value = stepData.mock[activeTabConfig.property];
		return typeof value === "string" ? value : JSON.stringify(value, null, 2);
	};

	// Handle editor changes
	const handleEditorChange = (value: string | undefined) => {
		if (!value || !stepData || !playgroundContext.updateStepMock) return;

		console.log("value changed:", value);
		// Update the config in context
		playgroundContext.updateStepMock(
			stepData.action_id,
			activeTabConfig.property,
			value
		);
	};

	const handleEditorWillMount = (monaco: any) => {
		monaco.editor.defineTheme("dark-skyblue", DarkSkyBlueTheme);
	};

	return (
		<div
			className={`border rounded-md ${width} flex flex-col overflow-hidden transition-all duration-500 ease-in-out`}
		>
			<div className="flex border-b bg-gray-50 items-center h-8">
				{/* Title on left side */}
				{/* <div className="px-4 py-3">
					<span className="text-lg font-semibold text-gray-700">Editor</span>
				</div> */}
				{/* Tabs on right side */}
				<div className="ml-auto flex overflow-auto">
					{PLAYGROUND_LEFT_TABS.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveLeftTab(tab.id)}
							className={`px-4 py-2 font-medium transition-colors ${
								activeLeftTab === tab.id
									? "bg-white border-b-2 border-sky-500 text-sky-600"
									: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>
			<div className="flex-1 p-4">
				<Editor
					key={`${activeApi}-${activeLeftTab}`} // Key ensures re-render when switching
					theme="dark-skyblue"
					beforeMount={handleEditorWillMount}
					height="100%"
					language={activeTabConfig.language}
					value={getEditorContent()}
					onChange={handleEditorChange}
					options={{
						padding: { top: 16, bottom: 16 },
						fontSize: 16,
						lineNumbers: "on",
						scrollBeyondLastLine: true,
						automaticLayout: true,
						// wordWrap: "on",
						formatOnPaste: true,
						formatOnType: true,
					}}
				/>
			</div>
		</div>
	);
}
