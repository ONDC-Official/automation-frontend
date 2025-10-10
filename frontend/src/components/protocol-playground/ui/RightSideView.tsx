import { Editor } from "@monaco-editor/react";
import { PLAYGROUND_RIGHT_TABS, PlaygroundRightTabType } from "../types";
import { useContext } from "react";
import { PlaygroundContext } from "../context/playground-context";
import { getSessionDataUpToStep } from "../mock-engine";
import { DarkSkyBlueTheme } from "./editor-themes";
import SessionDataTab from "./session-data-tab";
import JsonSchemaForm from "./extras/rsjf-form";
import { ExecutionResults } from "./extras/terminal";
import OutputPayloadViewer from "./extras/output-payload-viewer";

export function RightSideView(props: {
	width: string;
	activeRightTab: PlaygroundRightTabType;
	setActiveRightTab: (tab: PlaygroundRightTabType) => void;
	activeApi: string | undefined;
}) {
	const { width, activeRightTab, setActiveRightTab } = props;

	return (
		<div
			className={`border rounded-md ${width} flex flex-col overflow-hidden transition-all duration-500 ease-in-out`}
		>
			<div className="flex border-b bg-gray-50 items-center h-8">
				{PLAYGROUND_RIGHT_TABS.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveRightTab(tab.id)}
						className={`px-4 py-2 font-medium transition-colors ${
							activeRightTab === tab.id
								? "bg-white border-b-2 border-sky-500 text-sky-600"
								: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>
			<div className="flex-1 p-4 overflow-auto max-h-[82vh]">
				<GetRightSideContent
					tabId={activeRightTab}
					actionId={props.activeApi}
				/>
			</div>
		</div>
	);
}

function GetRightSideContent({
	tabId,
	actionId,
}: {
	tabId: string;
	actionId: string | undefined;
}) {
	const handleEditorWillMount = (monaco: any) => {
		monaco.editor.defineTheme("dark-skyblue", DarkSkyBlueTheme);
	};
	const playgroundContext = useContext(PlaygroundContext);
	const index =
		playgroundContext.config?.steps.findIndex(
			(step) => step.action_id === actionId
		) ?? 0;
	const activePayload =
		playgroundContext.config?.transaction_history.find(
			(f) => f.action_id === actionId
		)?.payload || undefined;
	switch (tabId) {
		case "session":
			return (
				<Editor
					key={`${actionId}-${tabId}`} // Key ensures re-render when switching
					theme="dark-skyblue"
					beforeMount={handleEditorWillMount}
					height="100%"
					language="json"
					value={JSON.stringify(
						getSessionDataUpToStep(index, playgroundContext.config),
						null,
						2
					)}
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
			);
		case "transaction":
			return <SessionDataTab />;
		case "terminal":
			return (
				<ExecutionResults results={playgroundContext.activeTerminalData} />
			);
		case "output_payload":
			return <OutputPayloadViewer payload={activePayload} />;
	}
	return <></>;
}
