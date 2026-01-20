import { useState } from "react";
import { Flow } from "../types/flow-types";

export function useWorkbenchFlows() {
    const [flowStepNum, setFlowStepNum] = useState(0);
    const [session, setSession] = useState<string>("");
    const [report, setReport] = useState("");
    const [flows, setFlows] = useState<Flow[]>([]);
    const [subscriberUrl, setSubscriberUrl] = useState<string>("");

    return {
        flowStepNum,
        setFlowStepNum,
        session,
        setSession,
        report,
        setReport,
        flows,
        setFlows,
        subscriberUrl,
        setSubscriberUrl,
    };
}

export type WorkbenchFlowType = ReturnType<typeof useWorkbenchFlows>;
