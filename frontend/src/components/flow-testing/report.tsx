import { toast } from "react-toastify";
import Heading from "../ui/mini-components/ondc-gradient-text";
import axios from "axios";
import { useState } from "react";

export function ReportPage({ sessionID }: { sessionID: string }) {
	const [response, setResponse] = useState("");
	// const response = {
	// 	message: "Report generated successfully",
	// 	data: '\n      <!DOCTYPE html>\n      <html lang="en">\n      <head>\n        <meta charset="UTF-8">\n        <meta name="viewport" content="width=device-width, initial-scale=1.0">\n        <title>Flow Validation Report</title>\n        <style>\n          body {\n            font-family: Arial, sans-serif;\n            margin: 0;\n            padding: 20px;\n            background-color: #f7f7f7;\n            color: #333;\n          }\n          h1 {\n            text-align: center;\n            color: #0056a6;\n            margin-bottom: 30px;\n            font-size: 26px;\n          }\n          .flow-card {\n            background: #fff;\n            margin-bottom: 25px;\n            padding: 15px;\n            border-radius: 8px;\n            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\n            border: 1px solid #ddd;\n            margin-top: 15px;\n          }\n          .flow-header {\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n            margin-bottom: 10px;\n          }\n          .flow-id {\n            font-size: 18px;\n            font-weight: bold;\n            color: #0056a6;\n          }\n          .validity {\n            font-size: 14px;\n            padding: 5px 12px;\n            border-radius: 18px;\n            color: #fff;\n            font-weight: bold;\n          }\n          .validity.valid {\n            background-color: #28a745;\n          }\n          .validity.invalid {\n            background-color: #dc3545;\n          }\n          .section-title {\n            font-size: 15px;\n            font-weight: bold;\n            margin-top: 15px;\n            color: #333;\n            margin-bottom: 8px;\n          }\n          .api-header {\n            font-size: 15px;\n            font-weight: bold;\n            display: flex;\n            align-items: center;\n            justify-content: space-between;\n            margin-top: 12px;\n            margin-bottom: 10px;\n          }\n          .api-header .right-section {\n            display: flex;\n            align-items: center;\n          }\n          .ack-status {\n            font-size: 12px;\n            padding: 4px 8px;\n            border-radius: 18px;\n            color: #fff;\n            font-weight: bold;\n            margin-left: 10px;\n          }\n          .ack-status.ack {\n            background-color: #4caf50; /* Green for ACK */\n          }\n          .ack-status.nack {\n            background-color: #D9534F; /* Light Red for NACK */\n          }\n          .ack-status.no-response {\n            background-color: #5bc0de; /* Blue for No Response */\n          }\n          .error-details {\n            font-size: 12px;\n            color: #721c24;\n            background-color: #fce8e6;\n            padding: 4px 8px;\n            border-radius: 4px;\n            margin-left: 10px;\n            display: inline-block;\n          }\n          .result-list {\n            list-style: none;\n            padding: 0;\n            margin: 0;\n          }\n          .result-item {\n            display: flex;\n            align-items: center;\n            padding: 6px 15px;\n            margin-bottom: 8px;\n            border-radius: 6px;\n            font-size: 14px;\n            border: 1px solid #ddd;\n          }\n          .result-item.passed {\n            background-color: #e7f9ed;\n            border-color: #28a745;\n            color: #155724;\n          }\n          .result-item.failed {\n            background-color: #fce8e6;\n            border-color: #dc3545;\n            color: #721c24;\n          }\n          .icon {\n            margin-right: 8px;\n            font-size: 16px;\n          }\n          .icon.pass {\n            color: #28a745;\n          }\n          .icon.fail {\n            color: #dc3545;\n          }\n        </style>\n      </head>\n   <body>\n        <h1>Flow Validation Report</h1>\n        \n              <div class="flow-card">\n                <div class="flow-header">\n                  <div class="flow-id">Flow ID: STATION_CODE_FLOW</div>\n                  <div class="validity invalid">\n                    Invalid\n                  </div>\n                </div>\n                <div class="section">\n                  <div class="section-title">Flow Sequence Errors</div>\n                  <ul class="result-list"><li class="result-item failed"><span class="icon fail">✘</span>Error: Expected \'on_search\' after \'search\', but found \'undefined\'.</li></ul>\n                </div>\n                <div class="section">\n                  <div class="section-title">Validations</div>\n                  \n                    <div class="api-header">\n                      <span>search_1</span>\n                      <div class="right-section">\n                        <span class="ack-status ack">ACK</span>\n                              \n                      </div>\n                    </div>\n                    <ul class="result-list">\n                      <li class="result-item passed"><span class="icon pass">✔</span>Should have valid context with transactionId and timestamp</li>\n                      <li class="result-item failed"><span class="icon fail">✘</span>Should have valid message with intent</li>\n                    </ul>\n                  \n                    <div class="api-header">\n                      <span>on_search_1</span>\n                      <div class="right-section">\n                        <span class="ack-status ack">ACK</span>\n                              \n                      </div>\n                    </div>\n                    <ul class="result-list">\n                      <li class="result-item passed"><span class="icon pass">✔</span>Should have valid context with transactionId and timestamp</li>\n                      <li class="result-item failed"><span class="icon fail">✘</span>Should have valid message with intent</li>\n                    </ul>\n                  \n                    <div class="api-header">\n                      <span>search_2</span>\n                      <div class="right-section">\n                        <span class="ack-status no-response">invalid response</span>\n                              \n                      </div>\n                    </div>\n                    <ul class="result-list">\n                      <li class="result-item passed"><span class="icon pass">✔</span>Should have valid context with transactionId and timestamp</li>\n                      <li class="result-item failed"><span class="icon fail">✘</span>Issue with sync response: "value" must be of type object</li><li class="result-item failed"><span class="icon fail">✘</span>Should have valid message with intent</li>\n                    </ul>\n                  \n                </div>\n              </div>\n            \n      </body>\n      </html>\n    ',
	// };
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
