import { apiClient } from "../services/apiClient";
import { API_ROUTES } from "../services/apiRoutes";
import { SessionCache, TransactionCache, FlowInDB } from "../types/session-types";
import { FlowMap } from "../types/flow-state-type";
import { FormConfigType } from "../components/ui/forms/config-form/config-form";
import { toast } from "react-toastify";

// Type definitions for API responses
interface SessionsResponse {
  sessions: Array<{
    sessionId: string;
    reportExists: boolean;
    createdAt: string;
  }>;
}

interface ReportResponse {
  data: string;
}

interface ActionsResponse {
  actions: string[];
}

interface PayloadResponse {
  req: any;
  res: {
    response: any;
  };
}

interface FlowResponse {
  inputs?: FormConfigType;
  [key: string]: any;
}

export const triggerSearch = async (session: TransactionCache, subUrl: string) => {
  if (session.subscriberType === "BAP") {
    return;
  }

  const data = {
    subscriberUrl: subUrl,
    initiateSearch: true,
  };

  await apiClient.post(API_ROUTES.FLOW.TRIGGER, data);
  toast.info("search triggered");
};

export const putCacheData = async (data: any, sessionId: string) => {
  return await apiClient.put(
    API_ROUTES.SESSIONS.BASE,
    {
      ...data,
    },
    {
      params: {
        session_id: sessionId,
      },
    },
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
  body?: any,
) => {
  try {
    const response = await apiClient.post(API_ROUTES.FLOW.TRIGGER_ACTION(action), body, {
      params: {
        action_id: actionId,
        transaction_id: transaction_id,
        subscriber_url: subscriberUrl,
        version: sessionData.version,
        session_id: session_id,
        flow_id: flowId,
      },
    });
    toast.info(`${action} triggered`);
    return response;
  } catch (e) {
    // toast.error(`Error triggering ${action}`);
    console.error(e);
  }
};

export const clearFlowData = async (sessionId: string, flowId: string) => {
  try {
    await apiClient.delete(API_ROUTES.SESSIONS.CLEAR_FLOW, {
      params: {
        session_id: sessionId,
        flow_id: flowId,
      },
    });
    toast.info("Flow cleared");
  } catch (e) {
    toast.error("Error clearing flow");
    console.error(e);
  }
};

export const getCompletePayload = async (payload_ids: string[]): Promise<PayloadResponse[]> => {
  try {
    const response = await apiClient.post<PayloadResponse[]>(API_ROUTES.DB.PAYLOAD, {
      payload_ids: payload_ids,
    });

    return response.data;
  } catch (e: any) {
    console.error("error while fetching complete paylaod: ", e);
    throw new Error(e);
  }
};

export const getTransactionData = async (transaction_id: string, subscriber_url: string) => {
  try {
    const response = await apiClient.get(API_ROUTES.SESSIONS.TRANSACTION, {
      params: {
        transaction_id,
        subscriber_url,
      },
    });

    return response.data as TransactionCache;
  } catch (e) {
    toast.error("Error while fetching transaction data");
    console.error("error while fetching transaction data", e);
  }
};

export const addExpectation = async (action: string, flowId: string, subscriberUrl: string, sessionId: string) => {
  try {
    await apiClient.post(
      API_ROUTES.SESSIONS.EXPECTATION,
      {},
      {
        params: {
          expected_action: action,
          flow_id: flowId,
          subscriber_url: subscriberUrl,
          session_id: sessionId,
        },
      },
    );
    // toast.info("Expectation added");
  } catch (e: any) {
    console.error(e);
    toast.error(e?.message ?? "Error adding expectation");
  }
};

export const deleteExpectation = async (session_id: string, subscriber_url: string) => {
  try {
    await apiClient.delete(API_ROUTES.SESSIONS.EXPECTATION, {
      params: {
        session_id,
        subscriber_url,
      },
    });
  } catch (e: any) {
    console.error(e);
  }
};

export const requestForFlowPermission = async (action: string, subscriberUrl: string) => {
  try {
    const data = await apiClient.get<{ valid: boolean; message: string }>(API_ROUTES.SESSIONS.FLOW_PERMISSION, {
      params: {
        action,
        subscriber_url: subscriberUrl,
      },
    });

    if (!data.data.valid) {
      toast.error(data.data.message);
    }
    return data.data.valid;
  } catch (e: any) {
    console.error(e);
  }
};

export const getLogs = async (sessionId: string) => {
  try {
    const response = await apiClient.get(API_ROUTES.LOGS.BASE, {
      params: {
        sessionId: sessionId,
      },
    });

    return response.data;
  } catch (e) {
    console.error("Something went wrong while fetching logs: ", e);
  }
};

export const fetchFormFieldData = async () => {
  try {
    const response = await apiClient.get(API_ROUTES.CONFIG.SCENARIO_FORM_DATA);

    return response.data;
  } catch (e) {
    console.error("error while fetching form field data", e);
  }
};

export const getMappedFlow = async (transactionId: string, sessionId: string): Promise<FlowMap> => {
  try {
    const response = await apiClient.get<FlowMap>(API_ROUTES.FLOW.CURRENT_STATE, {
      params: {
        transaction_id: transactionId,
        session_id: sessionId,
      },
    });

    return response.data;
  } catch (e) {
    toast.error("Error while fetching mapped flow data");
    throw new Error("Error while fetching mapped flow data");
  }
};

export const proceedFlow = async (
  sessionId: string,
  transactionId: string,
  jsonPathChanges?: Record<string, any>,
  inputs?: any,
): Promise<FlowResponse> => {
  try {
    const response = await apiClient.post<FlowResponse>(API_ROUTES.FLOW.PROCEED, {
      session_id: sessionId,
      transaction_id: transactionId,
      json_path_changes: jsonPathChanges,
      inputs: inputs,
    });

    return response.data;
  } catch (e: any) {
    console.error("❌ [proceedFlow] Error:", {
      message: e.message,
      response: e.response?.data,
      status: e.response?.status,
    });
    throw new Error("Error while proceeding flow");
  }
};

export const newFlow = async (
  sessionId: string,
  flowId: string,
  transactionId: string,
  json_path_changes?: Record<string, any>,
  inputs?: any,
): Promise<FlowResponse | undefined> => {
  try {
    const response = await apiClient.post<FlowResponse>(API_ROUTES.FLOW.NEW, {
      session_id: sessionId,
      flow_id: flowId,
      transaction_id: transactionId,
      json_path_changes: json_path_changes,
      inputs: inputs,
    });
    return response.data;
  } catch (e) {
    toast.error("Error while starting new flow");
    console.error("Error while creating new flow", e);
    return undefined;
  }
};

export const getReportingStatus = async (domain: string, version: string) => {
  try {
    const response = await apiClient.get<{ data: unknown }>(API_ROUTES.CONFIG.REPORTING_STATUS, {
      params: {
        domain,
        version,
      },
    });

    return response.data.data;
  } catch (e) {
    console.error("error while fetching repoting", e);
  }
};

export async function htmlFormSubmit(link: string, data: any) {
  try {
    const res = await apiClient.post(API_ROUTES.FLOW.EXTERNAL_FORM, {
      link: link,
      data: data,
    });
    return res;
  } catch (error) {
    throw new Error("ERROR");
  }
}
export const updateCustomFlow = async (sessionId: string, flow: any) => {
  try {
    const data = {
      session_id: sessionId,
      flows: [flow],
    };

    await apiClient.post(API_ROUTES.FLOW.CUSTOM_FLOW, data);
  } catch (e) {
    console.error("error setting custom flow", e);
  }
};

export const getActions = async (domain: string, version: string): Promise<ActionsResponse> => {
  try {
    const res = await apiClient.post<ActionsResponse>(API_ROUTES.FLOW.ACTIONS, {
      domain: domain,
      version: version,
    });

    return res.data;
  } catch (error) {
    console.error("errror while getting action: ", error);
    throw new Error("ERROR while getting action");
  }
};

export const getReport = async (sessionId: string): Promise<ReportResponse> => {
  try {
    const res = await apiClient.get<ReportResponse>(API_ROUTES.DB.REPORT, {
      params: {
        session_id: sessionId,
      },
      timeout: 120000, // 2 minutes
    });

    return res.data;
  } catch (error) {
    console.error("error while getting action: ", error);
    throw new Error("ERROR while getting action");
  }
};

export const getSessions = async (subId: string, npType: string): Promise<SessionsResponse> => {
  try {
    const res = await apiClient.get<SessionsResponse>(API_ROUTES.DB.SESSIONS, {
      params: {
        sub_id: subId,
        np_type: npType,
      },
    });

    return res.data;
  } catch (error) {
    console.error("errror while getting sessions from db: ", error);
    throw new Error("ERROR while getting sessions from db");
  }
};

export const addFlowToSessionInDB = async (sessionId: string, flow: FlowInDB) => {
  try {
    const res = await apiClient.post(API_ROUTES.API.SESSIONS_FLOWS(sessionId), flow, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_DB_SERVICE_API_KEY,
      },
    });

    return res.data;
  } catch (error) {
    console.error("Error while adding flow to session:", error);
    throw new Error("ERROR while adding flow to session");
  }
};

export const updateFlowInSession = async (sessionId: string, flow: FlowInDB) => {
  try {
    const res = await apiClient.put(
      API_ROUTES.API.SESSIONS_FLOWS(sessionId),
      { flow },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_DB_SERVICE_API_KEY,
        },
      },
    );

    return res.data;
  } catch (error) {
    console.error("Error while updating flow in session:", error);
    throw new Error("ERROR while updating flow in session");
  }
};
