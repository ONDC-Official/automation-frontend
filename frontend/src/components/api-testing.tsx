import { useState } from "react";
import Editor from "@monaco-editor/react";
import Markdown from "react-markdown";
import axios from "axios";
import { toast } from "react-toastify";

interface IProps {
	isSidebarOpen: boolean;
}

const ApiTesting = ({ isSidebarOpen }: IProps) => {
	const [payload, setPayload] = useState("");
	const [responseValue, setResponseValue] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [mdData, setMdData] = useState("");

	const verifyRequest = async () => {
		if (payload === "") {
			toast.warn("Add payload for the request");
			return;
		}

		const parsedPayload = JSON.parse(payload);
		const action = parsedPayload?.context?.action;

		if (!action) {
			toast.warn("action missing from context");
			console.log("Action not available");
			return;
		}

		try {
			setIsLoading(true);
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/test/${action}`,
				parsedPayload
			);
			setResponseValue(JSON.stringify(response.data, null, 2));
			if (response.data?.error?.message) {
				setMdData(response.data?.error?.message);
			}
		} catch (e) {
			console.log(">>>>>", e);
			toast.error("Something went wrong");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div
			className={`fixed top-16 mt-1 h-full shadow-md flex flex-row transition-all duration-300 ${
				isSidebarOpen ? "w-4/5" : "w-11/12"
			}`}
		>
			<div className="w-3/5 p-4 gap-4 flex flex-col">
				<h1 className="text-lg font-semibold text-gray-800">Request</h1>
				<Editor
					theme="vs-dark"
					height="70vh"
					defaultLanguage="json"
					onChange={(value: any) => setPayload(value)}
				/>
				<button
					className=" bg-white text-blue-500 px-4 py-2 rounded shadow hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
					onClick={verifyRequest}
					disabled={payload === ""}
				>
					{isLoading ? "Sending" : "Send"}
				</button>
			</div>
			<div className="w-2/5 flex flex-col gap-4 my-4 ">
				<h1 className="text-lg font-semibold text-gray-800">Response</h1>
				<div className="h-2/5">
					<Editor
						theme="vs-dark"
						value={responseValue}
						defaultLanguage="json"
						options={{
							readOnly: true, // Makes the editor non-editable
							formatOnType: true, // Optional: Format as you type
							formatOnPaste: true,
						}}
					/>
				</div>
				<div className="h-2/5 p-3 border bg-white shadow-md">
					<Markdown
						components={{
							a: ({ href, children }: any) => (
								<a
									href={href}
									className="text-blue-500 underline hover:text-blue-700"
								>
									{children}
								</a>
							),
							ul: ({ children }: any) => (
								<ul className="list-disc pl-5">{children}</ul>
							),
							li: ({ children }: any) => <li className="mb-2">{children}</li>,
						}}
					>
						{mdData}
					</Markdown>
				</div>
			</div>
		</div>
	);
};

export default ApiTesting;
