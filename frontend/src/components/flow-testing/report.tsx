import { toast } from "react-toastify";
import Heading from "../ui/mini-components/ondc-gradient-text";
import axios from "axios";

export function ReportPage({ sessionID }: { sessionID: string }) {
	function generateReport() {
		axios
			.get(`${import.meta.env.VITE_BACKEND_URL}/flow/report`, {
				params: {
					sessionId: sessionID,
				},
			})
			.then((response) => {
				console.log(response.data);
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
		</>
	);
}
