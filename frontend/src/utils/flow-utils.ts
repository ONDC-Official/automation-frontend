import { MappedStep } from "@/types/flow-state-type";
import { Flow } from "@/types/flow-types";
import { ApiData, SessionCache } from "@/types/session-types";

type AckResponse = {
  message?: {
    ack?: {
      status?: string;
    };
  };
};

function isAckResponse(response: unknown): response is AckResponse {
  return (
    response !== null &&
    typeof response === "object" &&
    "message" in response &&
    response.message !== null &&
    typeof response.message === "object" &&
    "ack" in response.message &&
    response.message.ack !== null &&
    typeof response.message.ack === "object" &&
    "status" in response.message.ack
  );
}

export function GetCurrentState(
  index: number,
  flowData: ApiData[],
  thisFlowId: string,
  currentFlow: string | undefined
): "success" | "error" | "pending" | "inactive" {
  if (currentFlow !== thisFlowId) {
    return "inactive";
  }
  if (flowData.length === index) {
    return "pending";
  }
  if (index > flowData.length) {
    return "inactive";
  }
  const response = flowData[index].response;
  if (isAckResponse(response) && response.message?.ack?.status === "ACK") {
    return "success";
  } else {
    return "error";
  }
}

export function getRequestResponse(index: number, action: string, flowData?: ApiData[]) {
  if (!flowData) {
    return {
      action: action,
      request: "request not yet made",
    };
  }
  if (flowData.length > index) {
    return {
      ...flowData[index],
    };
  }
  return {
    action: action,
    request: "request not yet made",
  };
}

export function getSequenceFromFlow(
  flow: Flow,
  sessionData: SessionCache | null | undefined,
  activeFlow: string | null
): MappedStep[] {
  return flow.sequence.map((step, index) => {
    let status: "WAITING" | "LISTENING" | "RESPONDING" | "INPUT-REQUIRED" = "WAITING";
    if (index === 0 && flow.id === activeFlow && sessionData) {
      if (step.input && step.owner !== sessionData.npType) {
        status = "INPUT-REQUIRED";
      } else if (step.owner === "BAP") {
        if (sessionData.npType === "BAP") status = "LISTENING";
        else status = "RESPONDING";
      } else if (step.owner === "BPP") {
        if (sessionData.npType === "BPP") status = "LISTENING";
        else status = "RESPONDING";
      }
    }

    return {
      status: status,
      actionId: step.key,
      owner: step.owner,
      actionType: step.type,
      input: step.input,
      index: index,
      unsolicited: step.unsolicited,
      pairActionId: step.pair,
      description: step.description,
      expect: step.expect,
      label: step.label,
    };
  });
}
