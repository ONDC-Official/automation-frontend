export function GetCurrentState(
	index: number,
	flowData: {
		request: any;
		response: any;
	}[],
	thisFlowId: string,
	currentFlow: string
): "success" | "error" | "pending" | "inactive" {
	if (currentFlow !== thisFlowId) {
		return "inactive";
	}
	if (flowData.length === index) {
		return "pending";
	}
	if (index > flowData.length) {
		return "inactive";
	}
	const response = flowData[index].response;
	if (response?.message?.ack?.status === "ACK") {
		return "success";
	} else {
		return "error";
	}
}

// "message": {
//             "ack": {
//               "status": "NACK"
//             }
