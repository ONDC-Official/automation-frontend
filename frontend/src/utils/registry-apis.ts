// src/api/index.ts

import axios from "axios";
import { SubscriberData } from "../components/registry-components/registry-types";
import { toast } from "react-toastify";
import { UserDetails } from "@components/Header";

export const post = async (participantId: string, subscriberData: SubscriberData) => {
  try {
    const url = `${import.meta.env.VITE_BACKEND_URL}/auth/subscribe`;
    const res = await axios.post(
      url,
      {
        participant_id: participantId,
        ...subscriberData,
        request_id: `request-${new Date().toISOString()}`,
      },
      {
        withCredentials: true,
      },
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      toast.error(`Error: ${error.response?.data?.details || error.message}`);
    }
    console.error("Error in post request:", error);
    throw new Error("Failed to post data");
  }
};

export const patch = async (data: any, user?: UserDetails) => {
  try {
    const participantId = user?.participantId;
    if (!participantId) {
      toast.error("Participant ID is required for patching");
      return;
    }
    const url = `${import.meta.env.VITE_BACKEND_URL}/auth/subscribe`;
    const res = await axios.patch(
      url,
      {
        participant_id: participantId,
        ...data,
        request_id: `request-${new Date().toISOString()}`,
      },
      {
        withCredentials: true,
      },
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      toast.error(`Error: ${error.response?.data?.details || error.message}`);
    }
    console.error("Error in patch request:", error);
    throw new Error("Failed to patch data");
  }
};

export const delSubscriberDetails = async (deleteData: any, user?: UserDetails) => {
  try {
    const participantId = user?.participantId;
    if (!participantId) {
      toast.error("Participant ID is required for deletion");
    }
    const url = `${import.meta.env.VITE_BACKEND_URL}/auth/subscribe`;
    const res = await axios.delete(url, {
      data: {
        participant_id: participantId,
        ...deleteData,
        request_id: `request-${new Date().toISOString()}`,
      },
      withCredentials: true,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      toast.error(`Error: ${error.response?.data?.details || error.message}`);
    }
    console.error("Error in delete request:", error);
    throw new Error("Failed to delete data");
  }
};

export const getSubscriberDetails = async (user: UserDetails | undefined): Promise<SubscriberData> => {
  try {
    const participantId = user?.participantId;
    if (!participantId) {
      throw new Error("Participant ID is required");
    }
    const url = `${import.meta.env.VITE_BACKEND_URL}/auth/lookup`;
    const res = await axios.post(
      url,
      {
        participant_id: participantId,
      },
      {
        withCredentials: true,
      },
    );
    const data = res.data;

    const locations: {
      id: string;
      country: string[];
      city: string[];
    }[] = data.locations || [];
    const uris: {
      id: string;
      uri: string;
    }[] = data.uris || [];

    const convertedData: SubscriberData = {
      keys: data.keys,
      mappings: data.mappings.map((mapping: any) => {
        return {
          id: mapping.id,
          domain: mapping.domain,
          type: mapping.type,
          uri: uris.find((u: any) => u.id === mapping.uri_id)?.uri || "",
          location_country: locations.find((l: any) => l.id === mapping.location_id)?.country[0] || "",
          location_city: locations.find((l: any) => l.id === mapping.location_id)?.city || ["*"],
        };
      }),
    };

    return convertedData;
  } catch (error) {
    console.error("Error in get request:", error);
    throw new Error("Failed to fetch subscriber details");
  }
};
