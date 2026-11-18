import { useMemo } from "react";

import type { StudioRun } from "@pages/protocol-studio/hooks/use-studio-run";
import { InspectorCodePane } from "@pages/protocol-studio/ui/editor/inspector/code-pane";

export interface ISessionPanelProps {
    run: StudioRun;
}

/**
 * The Session tab: the session data the next step will see, rebuilt from the
 * run's events (v1's Session Manager view), with each key's provenance — the
 * node that last wrote it — beside the JSON.
 */
export const SessionPanel = ({ run }: ISessionPanelProps) => {
    const text = useMemo(() => `${JSON.stringify(run.sessionData, null, 2)}\n`, [run.sessionData]);
    const keys = Object.keys(run.sessionData);

    if (!run.active) {
        return (
            <div className="studio-well flex h-full flex-col">
                <p className="studio-text-faint px-3 py-3 text-[12px]">
                    Start a run to see the session data each step reads and writes.
                </p>
            </div>
        );
    }

    return (
        <div className="studio-well flex h-full min-h-0">
            <div className="min-h-0 min-w-0 flex-1">
                <InspectorCodePane
                    path="studio://run/session.json"
                    language="json"
                    value={text}
                    readOnly
                />
            </div>
            <aside className="studio-hairline-l studio-session-keys">
                <p className="studio-eyebrow px-3 pt-2">
                    {keys.length} {keys.length === 1 ? "key" : "keys"}
                </p>
                <ul className="min-h-0 flex-1 overflow-auto px-2 pb-2">
                    {keys.map((key) => (
                        <li key={key} className="studio-session-key">
                            <span className="studio-mono truncate">{key}</span>
                            <span
                                className="studio-text-faint truncate text-[11px]"
                                title="last written by"
                            >
                                {run.provenance[key] ??
                                    (key === "user_inputs" ? "inputs" : "config")}
                            </span>
                        </li>
                    ))}
                </ul>
            </aside>
        </div>
    );
};

export default SessionPanel;
