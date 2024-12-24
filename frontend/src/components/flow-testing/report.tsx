import { toast } from "react-toastify";
import Heading from "../ui/mini-components/ondc-gradient-text";
import axios from "axios";
import { useState } from "react";

export function ReportPage({
	sessionID,
	subUrl,
}: {
	sessionID: string;
	subUrl: string;
}) {
	console.log(subUrl);
	const [response, setResponse] = useState("");
	function generateReport() {
		axios
			.get(`${import.meta.env.VITE_BACKEND_URL}/flow/report`, {
				params: {
					sessionId: sessionID,
				},
			})
			.then((response) => {
				console.log(response.data);
				setResponse(response.data.data);
			})
			.catch((e) => {
				console.error(e);
				toast.error("error while generating report");
			});
	}
	return (
		<>
			<Heading>Report</Heading>
			<button
				onClick={generateReport}
				className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300"
			>
				Create Report
			</button>
			<div dangerouslySetInnerHTML={{ __html: response }}></div>
		</>
	);
}
