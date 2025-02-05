import axios from "axios";
import { SessionCache, TransactionCache } from "../types/session-types";
import { toast } from "react-toastify";

export const triggerSearch = async (
	session: TransactionCache,
	subUrl: string
) => {
	if (session.subscriberType === "BAP") {
		return;
	}
	console.log("session", session);
	const data = {
		subscriberUrl: subUrl,
		initiateSearch: true,
	};

	const response = await axios.post(
		`${import.meta.env.VITE_BACKEND_URL}/flow/trigger`,
		data
	);
	toast.info("search triggered");

	console.log("trigger response", response);
};

export const putCacheData = async (data: any, sessionId: string) => {
	return await axios.put(
		`${import.meta.env.VITE_BACKEND_URL}/sessions`,
		{
			...data,
		},
		{
			params: {
				session_id: sessionId,
			},
		}
	);
};

export const triggerRequest = async (
	action: string,
	actionId: string,
	transaction_id: string,
	session_id: string,
	flowId: string,
	sessionData: SessionCache,
	subscriberUrl?: string,
	body?: any
) => {
	try {
		console.log("triggering request", action, actionId, transaction_id);
		const response = await axios.post(
			`${import.meta.env.VITE_BACKEND_URL}/flow/trigger/${action}`,
			body,
			{
				params: {
					action_id: actionId,
					transaction_id: transaction_id,
					subscriber_url: subscriberUrl,
					version: sessionData.version,
					session_id: session_id,
					flowId: flowId,
				},
			}
		);
		toast.info(`${action} triggered`);
		return response;
	} catch (e) {
		// toast.error(`Error triggering ${action}`);
		console.log(e);
	}
};

export const clearFlowData = async (sessionId: string, flowId: string) => {
	try {
		console.log("clearing flow", sessionId, flowId);
		await axios.delete(
			`${import.meta.env.VITE_BACKEND_URL}/sessions/clearFlow`,
			{
				params: {
					session_id: sessionId,
					flow_id: flowId,
				},
			}
		);
		toast.info("Flow cleared");
	} catch (e) {
		toast.error("Error clearing flow");
		console.log(e);
	}
};

export const getCompletePayload = async (payload_id: string) => {
	try {
		const response = await axios.get(
			`${import.meta.env.VITE_BACKEND_URL}/db/payload`,
			{
				params: {
					payload_id: payload_id,
				},
			}
		);

		return response.data;
	} catch (e: any) {
		console.log("error while fetching complete paylaod: ", e);
		throw new Error(e);
	}
};

export const getTransactionData = async (
	transaction_id: string,
	subscriber_url: string
) => {
	const url = `${import.meta.env.VITE_BACKEND_URL}/sessions/transaction`;
	try {
		const response = await axios.get(url, {
			params: {
				transaction_id,
				subscriber_url,
			},
		});
		console.log("transaction data", response.data);
		return response.data as TransactionCache;
	} catch (e) {
		toast.error("Error while fetching transaction data");
		console.error("error while fetching transaction data", e);
	}
};

export const addExpectation = async (
	action: string,
	flowId: string,
	subscriberUrl: string,
	sessionId: string
) => {
	try {
		await axios.post(
			`${import.meta.env.VITE_BACKEND_URL}/sessions/expectation`,
			{},
			{
				params: {
					expected_action: action,
					flow_id: flowId,
					subscriber_url: subscriberUrl,
					session_id: sessionId,
				},
			}
		);
		toast.info("Expectation added");
	} catch (e: any) {
		console.log(e);
		toast.error(e?.message ?? "Error adding expectation");
	}
};

export const deleteExpectation = async (
	session_id: string,
	subscriber_url: string
) => {
	try {
		await axios.delete(
			`${import.meta.env.VITE_BACKEND_URL}/sessions/expectation`,
			{
				params: {
					session_id,
					subscriber_url,
				},
			}
		);
	} catch (e: any) {
		console.log(e);
	}
};

export const requestForFlowPermission = async (
	action: string,
	subscriberUrl: string
) => {
	try {
		const data: {
			data: { valid: boolean; message: string };
		} = await axios.get(
			`${import.meta.env.VITE_BACKEND_URL}/sessions/flowPermission`,
			{
				params: {
					action,
					subscriber_url: subscriberUrl,
				},
			}
		);
		console.log("flow permission data", data);
		if (!data.data.valid) {
			toast.error(data.data.message);
		}
		return data.data.valid;
	} catch (e: any) {
		console.error(e);
	}
};
