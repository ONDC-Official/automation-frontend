import axios from "axios";

const DB_SERVICE = process.env.DB_SERVICE;

export const getPayloadForSessionId = async (payload_id: string) => {
  try {
    const response = await axios.get(`${DB_SERVICE}/payload/id/${payload_id}`);

    console.log("repsonse", response.data);
    if (response?.data[0]?.jsonRequest) {
      return response.data[0].jsonRequest;
    } else {
      throw new Error("No payload present for provided payload_id");
    }
  } catch (e: any) {
    console.log("Error while fetching payload from db: ", e);
    throw new Error("Error while fetching payload from db");
  }
};
