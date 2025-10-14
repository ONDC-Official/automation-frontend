// components/OutputPayloadViewer.tsx
import JsonView from "@uiw/react-json-view";
import { toast } from "react-toastify";
import { fetchFormFieldData } from "../../../../utils/request-utils";
import { useContext, useEffect, useState } from "react";
import Markdown from "react-markdown";
import axios from "axios";
import {
	IoCheckmarkCircle,
	IoCloseCircle,
	IoChevronDown,
	IoChevronUp,
	IoCodeSlash,
	IoShieldCheckmark,
	IoPlayCircle,
	IoAlertCircle,
	IoTerminal,
	IoDocumentText,
} from "react-icons/io5";
import MockRunner from "@ondc/automation-mock-runner";
import { PlaygroundContext } from "../../context/playground-context";

export default function OutputPayloadViewer({
	payload,
	actionId,
}: {
	payload: any;
	actionId: string | undefined;
}) {
	const [activeDomain, setActiveDomain] = useState<any>({});
	const [mdData, setMdData] = useState("");
	const [loading, setIsLoading] = useState(false);
	const [validationSuccess, setValidationSuccess] = useState<boolean | null>(
		null
	);

	// Section toggles
	const [showPayload, setShowPayload] = useState(true);
	const [showValidation, setShowValidation] = useState(true);
	const [showL2Results, setShowL2Results] = useState(true);

	const playgroundContext = useContext(PlaygroundContext);
	const [l2Result, setL2Result] = useState<
		| {
				valid: boolean;
				code: number;
				description: string;
		  }
		| undefined
	>(undefined);

	useEffect(() => {
		const getFormFields = async () => {
			const data = await fetchFormFieldData();
			setActiveDomain(data);
		};
		getFormFields();
	}, []);

	const verifyRequestL0 = async () => {
		if (payload === "") {
			toast.warn("Add payload for the request");
			return;
		}

		const parsedPayload = payload;

		try {
			if (Array.isArray(parsedPayload)) {
				toast.warn("Array of payloads not supported");
				return;
			}
		} catch (e) {
			console.log("error while parsing ", e);
			toast.error("Invalid payload");
			return;
		}

		const action = parsedPayload?.context?.action;

		if (!action) {
			toast.warn("action missing from context");
			console.log("Action not available");
			return;
		}

		let isDomainActive = false;

		Object.entries(activeDomain).map((data: any) => {
			const [_key, domains] = data;

			domains.forEach((domain: any) => {
				if (domain.key === parsedPayload?.context?.domain) {
					domain.version.forEach((ver: any) => {
						if (
							ver.key ===
							(parsedPayload?.context?.version ||
								parsedPayload?.context?.core_version)
						) {
							isDomainActive = true;
						}
					});
				}
			});
		});

		if (!isDomainActive) {
			toast.warn(
				"Domain or version not yet active. To check the list of active domain visit home page."
			);
			return;
		}

		setMdData("");
		setValidationSuccess(null);
		setShowValidation(true);

		try {
			setIsLoading(true);
			const response = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/flow/validate/${action}`,
				parsedPayload
			);
			setMdData(
				response.data?.error?.message || "✓ Validation passed successfully"
			);
			setValidationSuccess(response.data?.error ? false : true);
		} catch (e) {
			console.log(">>>>>", e);
			toast.error("Something went wrong");
			setValidationSuccess(false);
			setMdData("Validation failed due to server error");
		} finally {
			setIsLoading(false);
		}
	};

	const verifyRequestL2 = async () => {
		setIsLoading(true);
		try {
			const config = playgroundContext.config;
			if (!config) {
				toast.error("No configuration found");
				setIsLoading(false);
				return;
			}
			const l2Result = await new MockRunner(config).runValidatePayload(
				actionId || "",
				payload
			);
			playgroundContext.setActiveTerminalData((s) => [...s, l2Result]);
			setL2Result(l2Result.result);
		} catch (e) {
			console.log("error in l2", e);
		}
		setIsLoading(false);
	};

	if (!payload || !actionId) {
		return (
			<div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
				<div className="text-center p-8">
					<IoDocumentText className="text-gray-400 text-5xl mx-auto mb-3" />
					<p className="text-gray-500 text-sm font-medium">
						No payload available
					</p>
					<p className="text-gray-400 text-xs mt-1">
						Execute a function to see the output
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-sky-50 to-white border-b border-sky-100">
				<div className="flex items-center gap-2">
					<IoTerminal className="text-sky-500 text-xl" />
					<h3 className="text-base font-semibold text-gray-900">
						Output Payload
					</h3>
				</div>
				<div className="flex gap-2">
					<button
						onClick={verifyRequestL0}
						disabled={loading}
						className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 text-white text-xs font-semibold rounded-md hover:bg-sky-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-sm"
					>
						{loading ? (
							<>
								<div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
								<span>Running...</span>
							</>
						) : (
							<>
								<IoShieldCheckmark className="text-base" />
								<span>L1 Validation</span>
							</>
						)}
					</button>
					<button
						className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 text-white text-xs font-semibold rounded-md hover:bg-sky-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-sm"
						onClick={verifyRequestL2}
					>
						{loading ? (
							<>
								<div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
								<span>Running...</span>
							</>
						) : (
							<>
								<IoShieldCheckmark className="text-base" />
								<span>L2 Validation</span>
							</>
						)}
					</button>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				{/* Payload Section */}
				<div className="border-b border-gray-200">
					<button
						onClick={() => setShowPayload(!showPayload)}
						className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition text-left"
					>
						<div className="flex items-center gap-2">
							<IoCodeSlash className="text-sky-500 text-base" />
							<span className="text-sm font-semibold text-gray-700">
								Payload Data
							</span>
						</div>
						{showPayload ? (
							<IoChevronUp className="text-gray-400" />
						) : (
							<IoChevronDown className="text-gray-400" />
						)}
					</button>
					{showPayload && (
						<div className="bg-white p-4">
							<div className="rounded overflow-hidden">
								<JsonView value={payload} collapsed={1} />
							</div>
						</div>
					)}
				</div>

				{/* L1 Validation Results Section */}
				{mdData && (
					<div className="border-b border-gray-200">
						<button
							onClick={() => setShowValidation(!showValidation)}
							className={`w-full flex items-center justify-between p-3 transition text-left ${
								validationSuccess === false
									? "bg-red-50 hover:bg-red-100"
									: validationSuccess === true
										? "bg-green-50 hover:bg-green-100"
										: "bg-yellow-50 hover:bg-yellow-100"
							}`}
						>
							<div className="flex items-center gap-2">
								{validationSuccess === false ? (
									<IoCloseCircle className="text-red-500 text-base" />
								) : validationSuccess === true ? (
									<IoCheckmarkCircle className="text-green-500 text-base" />
								) : (
									<IoAlertCircle className="text-yellow-500 text-base" />
								)}
								<span
									className={`text-sm font-semibold ${
										validationSuccess === false
											? "text-red-700"
											: validationSuccess === true
												? "text-green-700"
												: "text-yellow-700"
									}`}
								>
									L1 Validation Results
								</span>
								{validationSuccess !== null && (
									<span
										className={`px-2 py-0.5 rounded text-xs font-medium ${
											validationSuccess
												? "bg-green-100 text-green-700"
												: "bg-red-100 text-red-700"
										}`}
									>
										{validationSuccess ? "Passed" : "Failed"}
									</span>
								)}
							</div>
							{showValidation ? (
								<IoChevronUp
									className={
										validationSuccess === false
											? "text-red-400"
											: validationSuccess === true
												? "text-green-400"
												: "text-yellow-400"
									}
								/>
							) : (
								<IoChevronDown
									className={
										validationSuccess === false
											? "text-red-400"
											: validationSuccess === true
												? "text-green-400"
												: "text-yellow-400"
									}
								/>
							)}
						</button>
						{showValidation && (
							<div className="p-4 bg-white prose prose-sm max-w-none">
								<Markdown
									components={{
										a: ({ href, children }: any) => (
											<a
												href={href}
												target="_blank"
												rel="noopener noreferrer"
												className="text-sky-600 underline hover:text-sky-700 transition-colors duration-200 font-medium"
											>
												{children}
											</a>
										),
										blockquote: ({ children }: any) => (
											<blockquote className="border-l-4 border-sky-500 bg-sky-50 pl-4 pr-4 py-3 my-3 italic text-gray-700 rounded-r">
												{children}
											</blockquote>
										),
										ul: ({ children }: any) => (
											<ul className="list-disc pl-5 space-y-1.5 my-3 text-sm">
												{children}
											</ul>
										),
										ol: ({ children }: any) => (
											<ol className="list-decimal pl-5 space-y-1.5 my-3 text-sm">
												{children}
											</ol>
										),
										li: ({ children }: any) => (
											<li className="text-gray-700 leading-relaxed">
												{children}
											</li>
										),
										code: ({ inline, children }: any) =>
											inline ? (
												<code className="bg-red-100 text-red-800 px-1.5 py-0.5 text-xs font-mono rounded border border-red-200">
													{children}
												</code>
											) : (
												<pre className="bg-gray-900 text-gray-100 p-3 my-3 overflow-x-auto rounded border border-gray-700 text-xs">
													<code className="font-mono">{children}</code>
												</pre>
											),
										p: ({ children }: any) => (
											<p className="text-gray-700 mb-2 leading-relaxed text-sm">
												{children}
											</p>
										),
										h3: ({ children }: any) => (
											<h3 className="text-base font-semibold text-gray-900 mb-2 mt-4 border-b border-gray-200 pb-1">
												{children}
											</h3>
										),
										h4: ({ children }: any) => (
											<h4 className="text-sm font-semibold text-gray-800 mb-2 mt-3">
												{children}
											</h4>
										),
										h5: ({ children }: any) => (
											<h5 className="text-xs font-semibold text-gray-700 mb-1.5 mt-2">
												{children}
											</h5>
										),
										strong: ({ children }: any) => (
											<strong className="font-semibold text-gray-900">
												{children}
											</strong>
										),
										em: ({ children }: any) => (
											<em className="italic text-gray-700">{children}</em>
										),
										hr: () => <hr className="my-4 border-gray-300" />,
										table: ({ children }: any) => (
											<div className="overflow-x-auto my-3">
												<table className="min-w-full divide-y divide-gray-300 text-xs border border-gray-300">
													{children}
												</table>
											</div>
										),
										thead: ({ children }: any) => (
											<thead className="bg-gray-50">{children}</thead>
										),
										tbody: ({ children }: any) => (
											<tbody className="divide-y divide-gray-200 bg-white">
												{children}
											</tbody>
										),
										tr: ({ children }: any) => <tr>{children}</tr>,
										th: ({ children }: any) => (
											<th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
												{children}
											</th>
										),
										td: ({ children }: any) => (
											<td className="px-3 py-2 text-xs text-gray-700">
												{children}
											</td>
										),
									}}
								>
									{mdData}
								</Markdown>
							</div>
						)}
					</div>
				)}

				{/* L2 Validation Results Section */}
				{l2Result && (
					<div className="border-b border-gray-200">
						<button
							onClick={() => setShowL2Results(!showL2Results)}
							className={`w-full flex items-center justify-between p-3 transition text-left ${
								!l2Result.valid
									? "bg-red-50 hover:bg-red-100"
									: "bg-green-50 hover:bg-green-100"
							}`}
						>
							<div className="flex items-center gap-2">
								{!l2Result.valid ? (
									<IoCloseCircle className="text-red-500 text-base" />
								) : (
									<IoCheckmarkCircle className="text-green-500 text-base" />
								)}
								<span
									className={`text-sm font-semibold ${
										!l2Result.valid ? "text-red-700" : "text-green-700"
									}`}
								>
									L2 Validation Results
								</span>
								<span
									className={`px-2 py-0.5 rounded text-xs font-medium ${
										l2Result.valid
											? "bg-green-100 text-green-700"
											: "bg-red-100 text-red-700"
									}`}
								>
									{l2Result.valid ? "Passed" : "Failed"}
								</span>
							</div>
							{showL2Results ? (
								<IoChevronUp
									className={
										!l2Result.valid ? "text-red-400" : "text-green-400"
									}
								/>
							) : (
								<IoChevronDown
									className={
										!l2Result.valid ? "text-red-400" : "text-green-400"
									}
								/>
							)}
						</button>
						{showL2Results && (
							<div className="p-4 bg-white">
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<span className="text-sm font-medium text-gray-600">
											Status Code:
										</span>
										<span
											className={`px-2 py-1 rounded text-xs font-mono ${
												l2Result.code === 200
													? "bg-green-100 text-green-800 border border-green-200"
													: "bg-red-100 text-red-800 border border-red-200"
											}`}
										>
											{l2Result.code}
										</span>
									</div>
									<div>
										<span className="text-sm font-medium text-gray-600 block mb-1">
											Description:
										</span>
										<p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
											{l2Result.description}
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Empty state when no validation run yet */}
				{!mdData && !loading && (
					<div className="p-8 text-center">
						<IoPlayCircle className="text-gray-300 text-5xl mx-auto mb-3" />
						<p className="text-gray-500 text-sm font-medium">
							Ready to validate
						</p>
						<p className="text-gray-400 text-xs mt-1">
							Click "L1 Validation" to run validation checks
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
