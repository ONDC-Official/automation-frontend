import { FC, useCallback, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import type { MockPlaygroundConfigV2Type } from "@ondc/automation-mock-runner";

import PageReveal from "@components/Routes/page-reveal";
import { ROUTES } from "@constants/routes";
import { useStudioDraft, type StudioDraft } from "@pages/protocol-studio/persistence/studio-draft";
import { StudioStarterScreen } from "@pages/protocol-studio/ui/starter";
import { StudioEditor } from "@pages/protocol-studio/ui/editor";
import { DEFAULT_STAGE, isStudioStage } from "@pages/protocol-studio/ui/editor/constants";
import type { StudioStage } from "@pages/protocol-studio/ui/editor/types";

const stagePath = (stage: StudioStage) => `${ROUTES.STUDIO_EDITOR}/${stage}`;

/**
 * Protocol Studio — one config holds every flow for a domain + version,
 * executed with `MockRunnerV2` (v1 keeps `MockRunner` and is untouched).
 *
 * `/studio` is the starter form; once a config exists, `/studio/editor/:stage`
 * is the editor — Specification, Protocol, Journeys or Review — filling the
 * window under the app header (no footer — see `isFooterlessRoute`). The
 * config lives in this page's state, so moving between stages keeps
 * everything; the editor mirrors it, with the graph, journeys and helpers,
 * into the local draft, so a reload resumes where the user was.
 */
const ProtocolStudio: FC = () => {
    // TODO(persistence): the `studioDraft` slice holds ONE draft (the config
    // being worked on, with its graph, journeys and helpers) so iteration survives
    // a reload. Still to come, as additions to that slice: several saved configs
    // with a flowId-free configId, Load Saved and Import from GitHub. Never the v1
    // `playgroundConfigs` slice, whose metadata requires a flowId.
    const { draft, clear: clearDraft } = useStudioDraft();
    const [config, setConfig] = useState<MockPlaygroundConfigV2Type | undefined>(
        () => draft?.config
    );
    // What the editor mounts from: the draft as it was when it was (re)opened.
    // The editor's later writes land in the slice and are read on the next mount.
    const [resumed, setResumed] = useState<StudioDraft | null>(draft);
    const navigate = useNavigate();

    const handleCreate = (created: MockPlaygroundConfigV2Type) => {
        // A new config replaces the draft: its graph and journeys belong to the old one.
        clearDraft();
        setResumed(null);
        setConfig(created);
        navigate(stagePath(DEFAULT_STAGE));
    };

    const handleResume = () => {
        if (!draft) return;
        setResumed(draft);
        setConfig(draft.config);
        navigate(stagePath(DEFAULT_STAGE));
    };

    const handleExit = () => {
        // The draft stays, so the starter can offer to resume it.
        setConfig(undefined);
        navigate(ROUTES.STUDIO);
    };

    const handleStageChange = useCallback(
        (stage: StudioStage) => navigate(stagePath(stage)),
        [navigate]
    );

    return (
        <Routes>
            <Route
                index
                element={
                    <PageReveal>
                        <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col px-5 sm:px-8 md:px-10 lg:px-15 xl:px-20">
                            <StudioStarterScreen
                                onCreate={handleCreate}
                                draft={
                                    draft ? { config: draft.config, savedAt: draft.savedAt } : null
                                }
                                onResume={handleResume}
                            />
                        </div>
                    </PageReveal>
                }
            />
            <Route
                path="editor/:stage?"
                element={
                    config ? (
                        <EditorRoute
                            config={config}
                            draft={resumed}
                            onConfigChange={setConfig}
                            onStageChange={handleStageChange}
                            onExit={handleExit}
                        />
                    ) : (
                        <Navigate to={ROUTES.STUDIO} replace />
                    )
                }
            />
            <Route path="*" element={<Navigate to={ROUTES.STUDIO} replace />} />
        </Routes>
    );
};

/** Reads the stage from the URL; an unknown one goes to the default. */
const EditorRoute = ({
    config,
    draft,
    onConfigChange,
    onStageChange,
    onExit,
}: {
    config: MockPlaygroundConfigV2Type;
    draft: StudioDraft | null;
    onConfigChange: (config: MockPlaygroundConfigV2Type) => void;
    onStageChange: (stage: StudioStage) => void;
    onExit: () => void;
}) => {
    const { stage } = useParams();
    if (stage !== undefined && !isStudioStage(stage)) {
        return <Navigate to={stagePath(DEFAULT_STAGE)} replace />;
    }
    return (
        <StudioEditor
            config={config}
            draft={draft}
            onConfigChange={onConfigChange}
            stage={isStudioStage(stage) ? stage : DEFAULT_STAGE}
            onStageChange={onStageChange}
            onExit={onExit}
        />
    );
};

export default ProtocolStudio;
