import axios from "../utils/axios";
import axios2 from "axios"
import logger from "@ondc/automation-logger";
const DB_SERVICE = process.env.DB_SERVICE;
const DB_SERVICE_API_KEY = process.env.DB_SERVICE_API_KEY

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
