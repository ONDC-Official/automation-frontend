import { LocationSessionHistory } from "@/pages/scenario/LocationSessionHistory";
import { IPreviousSessionsPanelProps } from "@/pages/scenario/types";

export const PreviousSessionsPanel = (props: IPreviousSessionsPanelProps) => (
    <LocationSessionHistory {...props} />
);
