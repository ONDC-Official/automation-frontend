import axios from "axios";
import { CacheSessionData } from "../types/session-types";
import { toast } from "react-toastify";

export const triggerSearch = async (
	session: CacheSessionData,
	subUrl: string
) => {
	if (session.type === "BAP") {
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

export const putCacheData = async (data: any, subUrl: string) => {
	return await axios.put(
		`${import.meta.env.VITE_BACKEND_URL}/sessions`,
		{
			...data,
		},
		{
			params: {
				subscriber_url: subUrl,
			},
		}
	);
};

export const triggerRequest = async (
	action: string,
	actionId: string,
	transaction_id: string,
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

export const clearFlowData = async (subUrl: string, flowId: string) => {
	try {
		console.log("clearing flow", subUrl, flowId);
		await axios.delete(
			`${import.meta.env.VITE_BACKEND_URL}/sessions/clearFlow`,
			{
				params: {
					subscriber_url: subUrl,
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

export const getCompletePayload = async (payload_ids: string[]) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/db/payload`,
        {
          payload_ids: payload_ids
        }
      );

      return response.data;
    } catch (e: any) {
      console.log("error while fetching complete paylaod: ", e);
	  throw new Error(e)
    }
  };
