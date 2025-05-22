import axios from "../utils/axios";

const DB_SERVICE = process.env.DB_SERVICE;

export const getPayloadForSessionId = async (payload_ids: string) => {
  try {
    const response = await axios.post(`${DB_SERVICE}/payload/ids`, {
      payload_ids: payload_ids,
    });

    if(!response.data.payloads.length) {
      throw new Error("No Payload found")
    }

    let filtetredPayloads: any[] = []

    response.data.payloads.map((payload: any) => {
      filtetredPayloads.push({
        req: payload.jsonRequest,
        res: payload.jsonResponse,
        signature: payload.reqHeader
      })
    })

    return filtetredPayloads

    // console.log("repsonse", response.data);
    // if (response?.data[0]?.jsonRequest) {
    //   return response.data[0].jsonRequest;
    // } else {
    //   throw new Error("No payload present for provided payload_id");
    // }
  } catch (e: any) {
    console.log("Error while fetching payload from db: ", e);
    throw new Error("Error while fetching payload from db");
  }
};
