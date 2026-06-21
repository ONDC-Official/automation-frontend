import { type FC, type ReactNode } from "react";
import GuideCard from "./GuideCard";

export interface GuidePanelProps {
    title: string;
    children: ReactNode;
}

/** Header + scrollable body shell shared by NotesPanel and CommentsPanel. */
const GuidePanel: FC<GuidePanelProps> = ({ title, children }) => (
    <GuideCard layout="column">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0">
                {title}
            </h3>
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-4">{children}</div>
    </GuideCard>
);

export default GuidePanel;
