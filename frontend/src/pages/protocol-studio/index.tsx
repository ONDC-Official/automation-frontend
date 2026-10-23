import { FC, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import type { MockPlaygroundConfigV2Type } from "@ondc/automation-mock-runner";

import PageReveal from "@components/Routes/page-reveal";
import { ROUTES } from "@constants/routes";
import { StudioStarterScreen } from "@pages/protocol-studio/ui/starter";
import { StudioEditor } from "@pages/protocol-studio/ui/editor";

/**
 * Protocol Studio — one config holds every flow for a domain + version,
 * executed with `MockRunnerV2` (v1 keeps `MockRunner` and is untouched).
 *
 * `/studio` is the starter form; once a config exists,
 * `/studio/editor` is the graph editor, filling the window under the
 * app header (no footer — see `isFooterlessRoute`).
 */
const ProtocolStudio: FC = () => {
    // TODO(persistence): CRITICAL — Studio configs are in-memory only, so a refresh
    // drops the user's work. Before Studio ships, persist them in a NEW Redux slice
    // (its own persist key + Redux Persist `version`/`migrate`; never the v1
    // `playgroundConfigs` slice, whose metadata requires a flowId), with a
    // flowId-free configId, then wire Load Saved and Import from GitHub.
    const [config, setConfig] = useState<MockPlaygroundConfigV2Type | undefined>(undefined);
    const navigate = useNavigate();

    const handleCreate = (created: MockPlaygroundConfigV2Type) => {
        setConfig(created);
        navigate(ROUTES.STUDIO_EDITOR);
    };

    const handleExit = () => {
        setConfig(undefined);
        navigate(ROUTES.STUDIO);
    };

    return (
        <Routes>
            <Route
                index
                element={
                    <PageReveal>
                        <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col px-5 sm:px-8 md:px-10 lg:px-15 xl:px-20">
                            <StudioStarterScreen onCreate={handleCreate} />
                        </div>
                    </PageReveal>
                }
            />
            <Route
                path="editor"
                element={
                    config ? (
                        <StudioEditor config={config} onExit={handleExit} />
                    ) : (
                        <Navigate to={ROUTES.STUDIO} replace />
                    )
                }
            />
            <Route path="*" element={<Navigate to={ROUTES.STUDIO} replace />} />
        </Routes>
    );
};

export default ProtocolStudio;
