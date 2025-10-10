import JsonView from "@uiw/react-json-view";
import { toast } from "react-toastify";
import { fetchFormFieldData } from "../../../../utils/request-utils";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import axios from "axios";

export default function OutputPayloadViewer({ payload }: { payload: any }) {
	const [activeDomain, setActiveDomain] = useState<any>({});
	useEffect(() => {
		const getFormFields = async () => {
			const data = await fetchFormFieldData();
			setActiveDomain(data);
		};
		getFormFields();
	}, []);
	const [mdData, setMdData] = useState("");
	const [loading, setIsLoading] = useState(false);
	const verifyRequestL0 = async () => {
		if (payload === "") {
			toast.warn("Add payload for the request");
			return;
		}

		let parsedPayload: any;

		try {
			parsedPayload = JSON.parse(payload);
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

		try {
			setIsLoading(true);
			const response = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/flow/validate/${action}`,
				parsedPayload
			);
			setMdData(response.data?.error?.message);
		} catch (e) {
			console.log(">>>>>", e);
			toast.error("Something went wrong");
		} finally {
			setIsLoading(false);
		}
	};

	if (!payload) {
		return <div>No payload available for this action.</div>;
	}

	return (
		<div className="p-4 border border-gray-200 rounded-md overflow-auto h-full">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold mb-2">Output Payload</h3>
				<div className="flex gap-2">
					<button onClick={verifyRequestL0}>Run L1 Validations</button>
					<button>Run L2 Validations</button>
				</div>
			</div>
			<JsonView value={payload} />
			<div>
				<h4 className="text-md font-semibold mt-4 mb-2">Validation Result:</h4>
				<Markdown
					components={{
						a: ({ href, children }: any) => (
							<a
								href={href}
								className="text-sky-600 underline hover:text-sky-700 transition-colors duration-200"
							>
								{children}
							</a>
						),
						blockquote: ({ children }: any) => (
							<blockquote className="border-l-4 pl-1 pr-1 py-2 mr-2 italic text-gray-700">
								{children}
							</blockquote>
						),
						ul: ({ children }: any) => (
							<ul className="list-disc pl-6 space-y-2 mb-4">{children}</ul>
						),
						li: ({ children }: any) => (
							<li className="text-gray-700">{children}</li>
						),
						code: ({ inline, children }: any) =>
							inline ? (
								<code className="bg-red-100 text-red-800 px-2 py-1 text-sm font-mono border border-red-200">
									{children}
								</code>
							) : (
								<pre className="bg-white text-black p-3 ml-2 overflow-x-auto border border-gray-700 custom-scrollbar">
									<code className="font-mono">{children}</code>
								</pre>
							),
						p: ({ children }: any) => (
							<p className="text-gray-700 mb-1 leading-relaxed">{children}</p>
						),
						h3: ({ children }: any) => (
							<h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">
								{children}
							</h3>
						),
						h4: ({ children }: any) => (
							<h4 className="text-base font-semibold text-gray-800 mb-2 mt-4">
								{children}
							</h4>
						),
					}}
				>
					{mdData}
				</Markdown>
			</div>
		</div>
	);
}
