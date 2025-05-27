import axios from "../utils/axios";

const DB_SERVICE = process.env.DB_SERVICE;

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
    console.log("Error while fetching payload from db: ", e);
    throw new Error("Error while fetching payload from db");
  }
};
