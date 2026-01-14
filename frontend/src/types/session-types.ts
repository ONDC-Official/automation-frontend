import { IFormConfigProps } from "@components/ConfigForm/types";
import { Flow } from "@/types/flow-types";

export interface ApiData {
  action: string;
  payloadId: string;
  messageId: string;
  response: unknown;
  timestamp: string;
}

export interface TransactionCache {
  sessionId?: string;
  flowId?: string;
  latestAction: string;
  latestTimestamp: string;
  type: "default" | "manual";
  subscriberType: "BAP" | "BPP";
  messageIds: string[];
  apiList: ApiData[];
}

export type SessionDifficulty = {
  sensitiveTTL: boolean;
  useGateway: boolean;
  stopAfterFirstNack: boolean;
  protocolValidations: boolean;
  timeValidations: boolean;
  headerValidaton: boolean;
  useGzip: boolean;
};
export interface SessionCache {
  // against session_id
  transactionIds: string[];
  flowMap: Record<string, string | null>;
  npType: "BAP" | "BPP";
  domain: string;
  version: string;
  subscriberId?: string;
  subscriberUrl: string;
  usecaseId: string;
  env: "STAGING" | "PRE-PRODUCTION" | "LOGGED-IN";
  sessionDifficulty: SessionDifficulty;
  flowConfigs: Record<string, Flow>;
  activeFlow: null | string;
  formSubmissions?: Record<
    string,
    {
      submitted: boolean;
      submission_id: string;
      timestamp: string;
    }
  >;
}

export interface State {
  type: string;
  key: string;
  description: string;
  stepIndex: number;
  owner: "BAP" | "BPP";
  // state?: "success" | "error" | "pending" | "inactive";
  flowId: string;
  transactionData?: TransactionCache;
  sessionData: SessionCache;
  sessionId: string;
  setSideView: React.Dispatch<React.SetStateAction<unknown>>;
  subscriberUrl: string;
  input?: IFormConfigProps;
  expect?: boolean;
  activeFlowId: string;
}

export interface SequenceCardProps {
  step: State;
  pair?: State;
}

export interface FlowInDB {
  id: string;
  status: "PENDING" | "COMPLETED";
  payloads?: string[];
}
