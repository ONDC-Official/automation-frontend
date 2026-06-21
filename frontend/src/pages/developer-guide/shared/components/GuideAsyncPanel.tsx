import { type FC, type ReactNode } from "react";
import GuidePanel from "./GuidePanel";
import { ErrorState, LoadingState } from "./states";

export interface GuideAsyncPanelProps {
    title: string;
    loading: boolean;
    error: string | null;
    children: ReactNode;
}

/** GuidePanel + loading/error gate shared by CommentsPanel and NotesPanel. */
const GuideAsyncPanel: FC<GuideAsyncPanelProps> = ({ title, loading, error, children }) => (
    <GuidePanel title={title}>
        {error && <ErrorState message={error} />}
        {loading ? <LoadingState /> : children}
    </GuidePanel>
);

export default GuideAsyncPanel;
