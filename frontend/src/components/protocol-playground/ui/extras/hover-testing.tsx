import Editor, { OnMount } from "@monaco-editor/react";

function TestEditorHover() {
	const handleOnMount: OnMount = (_, monaco) => {
		console.log("✅ Editor mounted successfully");

		monaco.languages.registerHoverProvider("json", {
			provideHover: (model, position) => {
				console.log("🖱️ Hover triggered at position:", position);

				const word = model.getWordAtPosition(position);
				console.log("📝 Word found:", word);

				if (!word) return null;

				const wordText = model.getValueInRange(
					new monaco.Range(
						position.lineNumber,
						word.startColumn,
						position.lineNumber,
						word.endColumn
					)
				);

				console.log("🔤 Word text:", wordText);

				// Simple hover descriptions
				const descriptions: Record<string, string> = {
					error: "This is an error message",
					status: "Current status of the operation",
					timestamp: "ISO 8601 date and time",
					message: "Descriptive message",
					userId: "Unique user identifier",
					success: "Operation completed successfully",
				};

				if (descriptions[wordText]) {
					console.log("✨ Showing hover for:", wordText);
					return {
						range: new monaco.Range(
							position.lineNumber,
							word.startColumn,
							position.lineNumber,
							word.endColumn
						),
						contents: [
							{ value: `**${wordText}**` },
							{ value: descriptions[wordText] },
						],
					};
				}

				console.log("❌ No description for:", wordText);
				return null;
			},
		});
	};

	const testJson = {
		error: "Something went wrong",
		status: "failed",
		timestamp: "2025-10-28T10:30:00Z",
		message: "Unable to process request",
		userId: "12345",
		success: false,
	};

	return (
		<div style={{ width: "100vw", height: "100vh" }}>
			<h2 style={{ padding: "20px" }}>Test Monaco Editor with Hover</h2>
			<div style={{ height: "calc(100vh - 80px)" }}>
				<Editor
					height="100%"
					defaultLanguage="json"
					defaultValue={JSON.stringify(testJson, null, 2)}
					onMount={handleOnMount}
					options={{
						minimap: { enabled: false },
						fontSize: 14,
						readOnly: true,
					}}
				/>
			</div>
		</div>
	);
}

export default TestEditorHover;
