import { type FC, type ReactNode } from "react";
import LoadingOverlay from "@components/Shadcn/LoadingOverlay";
import GuidePanel from "./GuidePanel";
import { ErrorState } from "./states";

export interface GuideAsyncPanelProps {
    title: string;
    loading: boolean;
    error: string | null;
    children: ReactNode;
}

/** GuidePanel + loading/error gate shared by CommentsPanel and NotesPanel. */
const GuideAsyncPanel: FC<GuideAsyncPanelProps> = ({ title, loading, error, children }) => (
    <GuidePanel title={title}>
        {loading && <LoadingOverlay />}
        {error && <ErrorState message={error} />}
        {children}
    </GuidePanel>
);

export default GuideAsyncPanel;
