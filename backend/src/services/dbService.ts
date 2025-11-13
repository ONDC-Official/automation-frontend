import axios from "../utils/axios";
import axios2, { AxiosRequestConfig } from "axios";
import logger from "@ondc/automation-logger";
const DB_SERVICE = process.env.DB_SERVICE;
const DB_SERVICE_API_KEY = process.env.DB_SERVICE_API_KEY;

export const getPayloadForSessionId = async (payload_ids: string[]) => {
	try {
		const response = await axios.post(`${DB_SERVICE}/payload/ids`, {
			payload_ids: payload_ids,
		});

		if (!response.data.payloads.length) {
			throw new Error("No Payload found");
		}

		let filtetredPayloads: any[] = [];

		payload_ids.forEach((id) => {
			response.data.payloads.map((data: any) => {
				if (data.payloadId === id) {
					filtetredPayloads.push({
						req: data.jsonRequest,
						res: data.jsonResponse,
						signature: data.reqHeader,
					});
				}
			});
		});

		return filtetredPayloads;
	} catch (e: any) {
		logger.error("Error while fetching payload from db", { payload_ids }, e);
		throw new Error("Error while fetching payload from db");
	}
};

export const getReportForSessionId = async (sessionId: string) => {
	try {
		const response = await axios2.get(`${DB_SERVICE}/report/PW_${sessionId}`, {
			headers: {
				"x-api-key": DB_SERVICE_API_KEY,
			},
		});

		return response.data;
	} catch (e: any) {
		logger.error("Error while fetching report from db", { sessionId }, e);
		throw new Error("Error while fetching report from db");
	}
};

export const getSessionsForSubId = async (subId: string, npType: string) => {
	let config: AxiosRequestConfig = {
		method: "get",
		url: `${DB_SERVICE}/api/sessions/filter`,
		params: {
			np_type: npType,
			np_id: subId,
		},
		headers: {
			"Content-Type": "application/json",
			"x-api-key": DB_SERVICE_API_KEY,
		},
	};
	try {
		const response = await axios2.request(config);

		return response.data;
	} catch (e: any) {
		logger.error("Error while fetching report from db", { subId, npType }, e);
		throw new Error("Error while fetching report from db");
	}
};

export const getPayloadFromDomainVersionFromDb = async (
	domain: string,
	version: string,
	action: string,
	page: number = 1
) => {
	try {
		const response = await axios2.request({
			url: `${DB_SERVICE}/payload/stored/${domain}/${version}/${action}/${page}`,
			method: "get",
			headers: {
				"x-api-key": DB_SERVICE_API_KEY,
			},
		});
		logger.info("Fetched payload from db", { domain, version, page });
		return response.data;
	} catch (e: any) {
		logger.error(
			"Error while fetching payload from db",
			{ domain, version, page },
			e
		);
		throw new Error("Error while fetching payload from db");
	}
};
