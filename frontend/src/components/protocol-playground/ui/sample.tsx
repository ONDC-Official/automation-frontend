import { Editor } from "@monaco-editor/react";
import { useState } from "react";
import JsonPathSelector from "./Json-path-extractor";

type LeftTabType = "generator" | "default" | "inputs" | "requirements";
type RightTabType = "session" | "transaction" | "terminal";

interface TabConfig {
	id: LeftTabType;
	label: string;
	language: string;
	defaultContent: string;
}

interface RightTabConfig {
	id: RightTabType;
	label: string;
}

const LEFT_TABS: TabConfig[] = [
	{
		id: "generator",
		label: "generator.js",
		language: "javascript",
		defaultContent: `function generate(defaultPayload, sessionData) {
  // Your logic here
  return defaultPayload;
}`,
	},
	{
		id: "default",
		label: "default.json",
		language: "json",
		defaultContent: JSON.stringify(
			{
				DUMMY: "CONTEXT IS INJECTED EACH TIME",
				context: {
					domain: "nic2004:52110",
					country: "IND",
					city: "std:080",
					action: "on_status",
					core_version: "1.1.0",
					bap_id: "buyer-app.ondc.org",
					bap_uri: "https://buyer-app.ondc.org/protocol/v1",
					bpp_id: "sample-seller-app.ondc.org",
					bpp_uri: "https://sample-seller-app.ondc.org/protocol/v1",
					transaction_id: "b6f8e8e2-9f3d-4d3a-8a5f-1e2b3c4d5e6f",
					message_id: "123e4567-e89b-12d3-a456-426614174000",
					timestamp: "2023-10-01T12:00:00Z",
				},
				message: {
					order: {
						id: "order-123",
						state: "Pending",
					},
				},
			},
			null,
			2
		),
	},
	{
		id: "inputs",
		label: "inputs.json",
		language: "json",
		defaultContent: JSON.stringify(
			{
				$schema: "http://json-schema.org/draft-07/schema#",
				type: "object",
				properties: {
					email: {
						type: "string",
						format: "email",
						minLength: 5,
						maxLength: 50,
						description: "User's email address",
					},
					age: {
						type: "integer",
						minimum: 18,
						maximum: 120,
						description: "User's age",
					},
					password: {
						type: "string",
						minLength: 8,
						pattern: "^(?=.*[A-Z])(?=.*[0-9]).+$",
						description: "Must contain uppercase and number",
					},
					website: {
						type: "string",
						format: "uri",
					},
					country: {
						type: "string",
						enum: ["US", "UK", "CA", "AU"],
					},
				},
				required: ["email", "password"],
				additionalProperties: false,
			},
			null,
			2
		),
	},
	{
		id: "requirements",
		label: "requirements.js",
		language: "javascript",
		defaultContent: `function getRequirements() {
  return {
	valid: true,
  };
}`,
	},
];

const RIGHT_TABS: RightTabConfig[] = [
	{ id: "session", label: "Live Session Viewer" },
	{ id: "transaction", label: "Transaction Viewer" },
	{ id: "terminal", label: "Console" },
];

export default function ProtocolPlayGroundSample() {
	const [activeLeftTab, setActiveLeftTab] = useState<LeftTabType>("generator");
	const [activeRightTab, setActiveRightTab] = useState<RightTabType>("session");
	const [editorContent, setEditorContent] = useState<
		Record<LeftTabType, string>
	>({
		generator: LEFT_TABS[0].defaultContent,
		default: LEFT_TABS[1].defaultContent,
		inputs: LEFT_TABS[2].defaultContent,
		requirements: LEFT_TABS[3].defaultContent,
	});

	// Calculate dynamic widths based on active tab
	const isTransactionViewerActive = activeRightTab === "transaction";
	const leftPanelWidth = isTransactionViewerActive ? "w-[30%]" : "w-1/2";
	const rightPanelWidth = isTransactionViewerActive ? "w-[70%]" : "w-1/2";

	const [sessionData] = useState(
		JSON.stringify(
			{
				sessionId: "sess_abc123",
				userId: "user_456",
				startTime: "2023-10-01T12:00:00Z",
				actions: ["SEARCH", "ON_SEARCH_CATALOG"],
				currentState: "active",
			},
			null,
			2
		)
	);

	const [terminalLogs, setTerminalLogs] = useState<string[]>([
		"Terminal initialized...",
		"Ready to execute code",
	]);

	const activeLeftTabConfig = LEFT_TABS.find(
		(tab) => tab.id === activeLeftTab
	)!;

	const handleEditorWillMount = (monaco: any) => {
		monaco.editor.defineTheme("dark-skyblue", {
			base: "vs-dark",
			inherit: true,
			rules: [
				{ token: "comment", foreground: "6A9FB5", fontStyle: "italic" },
				{ token: "keyword", foreground: "87CEEB", fontStyle: "bold" },
				{ token: "string", foreground: "7DD3C0" },
				{ token: "number", foreground: "4FC3F7" },
				{ token: "type", foreground: "00BCD4" },
				{ token: "function", foreground: "26C6DA" },
			],
			colors: {
				"editor.background": "#0A1929",
				"editor.foreground": "#E0F7FA",
				"editor.lineHighlightBackground": "#1A2B3D",
				"editor.selectionBackground": "#2C5364",
				"editorCursor.foreground": "#87CEEB",
				"editorLineNumber.foreground": "#4A90A4",
				"editorLineNumber.activeForeground": "#87CEEB",
				"editor.selectionHighlightBackground": "#2C536450",
				"editorIndentGuide.background": "#1A2B3D",
				"editorIndentGuide.activeBackground": "#2C5364",
			},
		});
	};

	const handleEditorChange = (value: string | undefined) => {
		if (value !== undefined) {
			setEditorContent((prev) => ({
				...prev,
				[activeLeftTab]: value,
			}));
		}
	};

	const renderRightContent = () => {
		switch (activeRightTab) {
			case "session":
				return (
					<div className="flex-1 p-4 text-lg rounded-sm shadow-sm ">
						<Editor
							theme="dark-skyblue"
							beforeMount={handleEditorWillMount}
							height="100%"
							language="json"
							value={sessionData}
							options={{
								padding: { top: 16, bottom: 16 },
								fontSize: 16,
								scrollBeyondLastLine: false,
								wordWrap: "on",
								readOnly: true,
							}}
						/>
					</div>
				);

			case "transaction":
				return (
					<div className="flex-1 p-4 overflow-auto">
						<JsonPathSelector />
					</div>
				);

			case "terminal":
				return (
					<div className="flex-1 flex flex-col bg-black text-green-400 font-mono text-sm">
						<div className="flex-1 p-4 overflow-auto">
							{terminalLogs.map((log, index) => (
								<div key={index} className="mb-1">
									<span className="text-gray-500">$</span> {log}
								</div>
							))}
						</div>
						<div className="border-t border-gray-700 p-2 flex items-center">
							<span className="text-gray-500 mr-2">$</span>
							<input
								type="text"
								className="flex-1 bg-transparent outline-none text-green-400"
								placeholder="Enter command..."
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										const input = e.currentTarget.value;
										if (input.trim()) {
											setTerminalLogs((prev) => [
												...prev,
												input,
												`Output: ${input} executed`,
											]);
											e.currentTarget.value = "";
										}
									}
								}}
							/>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div className="mt-4 w-full h-screen flex flex-col">
			{/* Top Navbar */}
			<div className="h-16 bg-gray-100 flex items-center px-4 shadow">
				<div className="flex items-center space-x-2">
					<button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
						SEARCH
					</button>
					{`-->`}
					<button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-400">
						ON_SEARCH_CATALOG
					</button>
					{`-->`}
					<button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-400">
						ON_UPDATE
					</button>
					{`-->`}
					<button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-400">
						ON_STATUS
					</button>
				</div>

				<div className="ml-auto flex items-center space-x-2 bg-gray-400 rounded-md p-2">
					<button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
						EXPORT
					</button>
					<button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
						IMPORT
					</button>
					<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
						RUN STEP
					</button>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 p-4 overflow-hidden">
				{/* Top section to display information */}
				<div className="mb-4 flex gap-4 bg-gray-300 p-4 rounded-md">
					<h1 className="font-bold mt-2">Action Config</h1>
					<div className="px-4 py-2 bg-gray-100 rounded-full shadow flex items-center">
						<span className="font-semibold text-gray-700">POST /on_status</span>
					</div>
					<div className="px-4 py-2 bg-gray-100 rounded-full shadow flex items-center">
						<span className="font-semibold text-gray-700">
							ACTION ID: on_status_pending
						</span>
					</div>
					<div className="px-4 py-2 bg-gray-100 rounded-full shadow flex items-center">
						<span className="font-semibold text-gray-700">
							UNSOLICITED: yes
						</span>
					</div>
					<div className="px-4 py-2 bg-gray-100 rounded-full shadow flex items-center">
						<span className="font-semibold text-gray-700">
							response_for:{" "}
							<span className="font-normal text-red-500">None</span>
						</span>
					</div>
					<div className="px-4 py-2 bg-gray-100 rounded-full shadow flex items-center">
						<span className="font-semibold text-gray-700">
							description:{" "}
							<span className="font-normal text-sky-500">
								on_status to mark rider as assigned
							</span>
						</span>
					</div>
				</div>

				<div className="flex gap-4 h-full">
					{/* Left: Code Editor with Tabs */}
					<div
						className={`border rounded-md ${leftPanelWidth} flex flex-col overflow-hidden transition-all duration-500 ease-in-out`}
					>
						{/* Tab Header */}
						<div className="flex border-b bg-gray-50 items-center">
							{/* Title on left side */}
							<div className="px-4 py-3">
								<span className="text-xl font-extrabold bg-gradient-to-r from-sky-500 via-sky-400 to-sky-600 bg-clip-text text-transparent tracking-tighter drop-shadow-lg">
									ONDC PLAYGROUND
								</span>
							</div>
							{/* Tabs on right side */}
							<div className="ml-auto flex">
								{LEFT_TABS.map((tab) => (
									<button
										key={tab.id}
										onClick={() => setActiveLeftTab(tab.id)}
										className={`px-4 py-3 font-medium transition-colors ${
											activeLeftTab === tab.id
												? "bg-white border-b-2 border-blue-500 text-blue-600"
												: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
										}`}
									>
										{tab.label}
									</button>
								))}
							</div>
						</div>

						{/* Editor Content */}
						<div className="flex-1 p-4">
							<Editor
								key={activeLeftTab}
								theme="dark-skyblue"
								beforeMount={handleEditorWillMount}
								height="100%"
								language={activeLeftTabConfig.language}
								value={editorContent[activeLeftTab]}
								onChange={handleEditorChange}
								options={{
									padding: { top: 16, bottom: 16 },
									fontSize: 16,
									lineNumbers: "on",
									scrollBeyondLastLine: false,
									automaticLayout: true,
									wordWrap: "on",
									formatOnPaste: true,
									formatOnType: true,
								}}
							/>
						</div>
					</div>

					{/* Right: Viewer Tabs */}
					<div
						className={`border rounded-md ${rightPanelWidth} flex flex-col overflow-hidden transition-all duration-500 ease-in-out`}
					>
						{/* Tab Header */}
						<div className="flex border-b bg-gray-50">
							{RIGHT_TABS.map((tab) => (
								<button
									key={tab.id}
									onClick={() => setActiveRightTab(tab.id)}
									className={`px-4 py-3 font-medium transition-colors ${
										activeRightTab === tab.id
											? "bg-white border-b-2 border-blue-500 text-blue-600"
											: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
									}`}
								>
									{tab.label}
								</button>
							))}
						</div>

						{/* Right Content */}
						{renderRightContent()}
					</div>
				</div>
			</div>
		</div>
	);
}
