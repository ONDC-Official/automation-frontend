import axios from "axios";

const DB_SERVICE = process.env.DB_SERVICE;

export const getPayloadForSessionId = async (session_id: string) => {
  try {
    const response = await axios.get(
      `${DB_SERVICE}/api/sessions/${session_id}`
    );

    if (response.data?.payloads?.length) {
      return response.data.payloads[0].jsonRequest;
    } else {
      throw new Error("No payload present for provided session_id");
    }
  } catch (e: any) {
    console.log("Error while fetching payload from db: ", e);
    throw new Error("Error while fetching payload from db");
  }
};
