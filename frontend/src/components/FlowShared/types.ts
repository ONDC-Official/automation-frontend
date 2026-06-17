import { Flow } from "@/types/flow-types";
import { SessionCache } from "@/types/session-types";

export interface IAccordionProps {
    flow: Flow;
    activeFlow: string | null;
    setActiveFlow: (flowId: string | null) => void;
    sessionCache?: SessionCache | null;
    sessionId: string;
    setSideView: React.Dispatch<unknown>;
    subUrl: string;
    onFlowStop: () => void;
    onFlowClear: () => void;
}
