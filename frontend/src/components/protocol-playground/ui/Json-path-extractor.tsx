import { useState } from "react";

interface JsonNode {
	[key: string]: any;
}

interface SelectedPath {
	path: string;
	alias: string;
}

export default function JsonPathSelector() {
	const [selectedPaths, setSelectedPaths] = useState<SelectedPath[]>([]);

	const jsonData = {
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
	};

	const handleKeyClick = (path: string, key: string, e: React.MouseEvent) => {
		e.stopPropagation();
		const alias = `payload_${key}`;
		const existingIndex = selectedPaths.findIndex((p) => p.path === path);

		if (existingIndex >= 0) {
			// Remove if already selected
			setSelectedPaths(selectedPaths.filter((_, i) => i !== existingIndex));
		} else {
			// Add new selection
			setSelectedPaths([...selectedPaths, { path, alias }]);
		}
	};

	const isSelected = (path: string) => {
		return selectedPaths.some((p) => p.path === path);
	};

	const renderValue = (value: any, path: string, key: string) => {
		const isPrimitive =
			typeof value !== "object" || value === null || value === undefined;
		const selected = isSelected(path);

		if (isPrimitive) {
			return (
				<span
					onClick={(e) => handleKeyClick(path, key, e)}
					className={`cursor-pointer px-2 py-0.5 rounded transition-colors ${
						selected
							? "bg-sky-500/30 text-sky-300 font-semibold"
							: "hover:bg-sky-500/10"
					}`}
				>
					{JSON.stringify(value)}
				</span>
			);
		}

		return null;
	};

	const renderJson = (
		obj: JsonNode,
		currentPath: string = "$",
		level: number = 0
	): JSX.Element => {
		const indent = level * 24;

		return (
			<div>
				{Object.entries(obj).map(([key, value]) => {
					const newPath = `${currentPath}.${key}`;
					const isObject =
						typeof value === "object" &&
						value !== null &&
						!Array.isArray(value);
					const isArray = Array.isArray(value);
					const isKeySelected = isSelected(newPath);

					return (
						<div key={key} style={{ marginLeft: `${indent}px` }}>
							<div className="flex items-start py-1">
								<span
									onClick={(e) =>
										(isObject || isArray) && handleKeyClick(newPath, key, e)
									}
									className={`font-mono select-none transition-colors ${
										isObject || isArray ? "cursor-pointer" : "cursor-default"
									} ${
										isKeySelected
											? "bg-sky-500/30 text-sky-300 font-semibold px-2 py-0.5 rounded"
											: isObject || isArray
											? "text-sky-400 hover:bg-sky-500/10 px-2 py-0.5 rounded"
											: "text-sky-400"
									}`}
								>
									"{key}":
								</span>
								<span className="ml-2">
									{isObject && (
										<span className="text-gray-400 font-mono">{"{"}</span>
									)}
									{isArray && (
										<span className="text-gray-400 font-mono">{"["}</span>
									)}
									{!isObject && !isArray && renderValue(value, newPath, key)}
								</span>
							</div>

							{isObject && (
								<>
									{renderJson(value, newPath, level + 1)}
									<div
										style={{ marginLeft: `${indent}px` }}
										className="text-gray-400 font-mono"
									>
										{"}"}
									</div>
								</>
							)}

							{isArray && (
								<>
									{value.map((item: any, index: number) => {
										const arrayPath = `${newPath}[${index}]`;
										if (typeof item === "object" && item !== null) {
											return (
												<div key={index}>
													{renderJson(item, arrayPath, level + 1)}
												</div>
											);
										}
										return (
											<div
												key={index}
												style={{ marginLeft: `${(level + 1) * 24}px` }}
											>
												{renderValue(item, arrayPath, `${key}_${index}`)}
											</div>
										);
									})}
									<div
										style={{ marginLeft: `${indent}px` }}
										className="text-gray-400 font-mono"
									>
										{"]"}
									</div>
								</>
							)}
						</div>
					);
				})}
			</div>
		);
	};

	const removePath = (index: number) => {
		setSelectedPaths(selectedPaths.filter((_, i) => i !== index));
	};

	return (
		<div className="flex h-full bg-gray-900 text-gray-100">
			{/* Left side - JSON Viewer */}
			<div className="w-1/2 p-6 overflow-auto border-r border-gray-700">
				<div className="text-sm text-gray-400 mb-3">
					💡 Click on object keys (like "context") or primitive values
				</div>
				<div className="bg-gray-800 p-4 rounded-lg font-mono text-sm">
					<div className="text-gray-400">{"{"}</div>
					{renderJson(jsonData, "$", 1)}
					<div className="text-gray-400">{"}"}</div>
				</div>
			</div>

			{/* Right side - Selected Paths */}
			<div className="w-1/2 p-6 overflow-auto bg-gray-850">
				<h2 className="text-xl font-bold mb-4 text-sky-400">
					Selected Paths ({selectedPaths.length})
				</h2>

				{selectedPaths.length === 0 ? (
					<div className="text-gray-500 text-center mt-8">
						No paths selected. Click on any key or value in the JSON to add it.
					</div>
				) : (
					<div className="space-y-2">
						{selectedPaths.map((item, index) => (
							<div
								key={index}
								className="bg-gray-800 p-3 rounded-lg border border-sky-500/30 flex items-center justify-between group hover:border-sky-500/50 transition-colors"
							>
								<div className="font-mono text-sm flex-1">
									<span className="text-sky-300 font-semibold">
										{item.alias}
									</span>
									<span className="text-gray-400 mx-2">:</span>
									<span className="text-gray-300">{item.path}</span>
								</div>
								<button
									onClick={() => removePath(index)}
									className="ml-4 px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-xs"
								>
									Remove
								</button>
							</div>
						))}
					</div>
				)}

				{selectedPaths.length > 0 && (
					<div className="mt-6">
						<button
							onClick={() => setSelectedPaths([])}
							className="w-full px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
						>
							Clear All
						</button>
					</div>
				)}

				{/* Export code snippet */}
				{selectedPaths.length > 0 && (
					<div className="mt-6">
						<h3 className="text-lg font-semibold mb-2 text-sky-400">
							Generated Code
						</h3>
						<div className="bg-gray-800 p-4 rounded-lg font-mono text-xs overflow-x-auto">
							<pre className="text-gray-300">
								{selectedPaths
									.map((item) => `const ${item.alias} = ${item.path};`)
									.join("\n")}
							</pre>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
