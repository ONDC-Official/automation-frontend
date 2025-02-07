import { ApiData } from "../types/session-types";

export function GetCurrentState(
	index: number,
	flowData: ApiData[],
	thisFlowId: string,
	currentFlow: string | undefined
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

export function getRequestResponse(
	index: number,
	action: string,
	flowData?: ApiData[]
) {
	if (!flowData) {
		return {
			action: action,
			request: "request not yet made",
		};
	}
	if (flowData.length > index) {
		return {
			...flowData[index],
		};
	}
	return {
		action: action,
		request: "request not yet made",
	};
}
