import { editor, Position } from "monaco-editor";
import { PLAYGROUND_RIGHT_TABS, PlaygroundRightTabType } from "@pages/protocol-playground/types";
import { useContext, useEffect, useRef, useState } from "react";
import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";
import SessionDataTab from "@pages/protocol-playground/ui/session-data-tab";
import { ExecutionResults } from "@pages/protocol-playground/ui/extras/terminal";
import OutputPayloadViewer from "@pages/protocol-playground/ui/extras/output-payload-viewer";
import { editorUtils } from "@pages/protocol-playground/utils/editor-utils";
import { mockRunnerExtensions } from "@pages/protocol-playground/utils/mock-runner-extentions";
import CommonLibView from "@pages/protocol-playground/ui/playground-upper/common-lib-view";
import { AIChatPanel } from "@pages/protocol-playground/ai/ui/AIChatPanel";
import {
    getFullSession,
    getSessionUpToActionId,
} from "@pages/protocol-playground/utils/transaction-view";
import { CodeEditor } from "@/components/PayloadEditor";
import { FlowTabs, TabsContent } from "@/components/Shadcn/Tabs";
import Spinner from "@/components/Shadcn/Spinner";
import { PLAYGROUND_EDITOR_OPTIONS } from "@pages/protocol-playground/constants";
import { cn } from "@/lib/utils";
import type { OnMount } from "@monaco-editor/react";

interface SavedMetadata {
    [key: string]: {
        actionId: string;
        path: string;
    };
}

interface WindowWithMonaco extends Window {
    __jsonHoverProviderDisposable?: { dispose: () => void };
}

export const RightSideView = (props: {
    width: string;
    activeRightTab: PlaygroundRightTabType;
    setActiveRightTab: (tab: PlaygroundRightTabType) => void;
    activeApi: string | undefined;
}) => {
    const { width, activeRightTab, setActiveRightTab } = props;
    const tabOptions = PLAYGROUND_RIGHT_TABS.map((tab) => ({ key: tab.id, label: tab.label }));

    return (
        <div
            className={cn(
                "flex min-h-0 flex-col self-stretch overflow-hidden bg-transparent dark:border-border-default",
                width
            )}
        >
            <FlowTabs
                variant="default"
                options={tabOptions}
                value={activeRightTab}
                onValueChange={(value) => setActiveRightTab(value as PlaygroundRightTabType)}
                className="flex h-full min-h-0 flex-1 flex-col [&_[data-slot=tabs-content][data-state=active]]:flex [&_[data-slot=tabs-content][data-state=active]]:min-h-0 [&_[data-slot=tabs-content][data-state=active]]:flex-1"
            >
                {PLAYGROUND_RIGHT_TABS.map((tab) => (
                    <TabsContent
                        key={tab.id}
                        value={tab.id}
                        className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
                    >
                        <GetRightSideContent tabId={tab.id} actionId={props.activeApi} />
                    </TabsContent>
                ))}
            </FlowTabs>
        </div>
    );
};

const GetRightSideContent = ({
    tabId,
    actionId,
}: {
    tabId: string;
    actionId: string | undefined;
}) => {
    const playgroundContext = useContext(PlaygroundContext);
    const [sessionData, setSessionData] = useState<string>("{}");
    const [isSessionLoading, setIsSessionLoading] = useState(false);
    const savedMetaRef = useRef<SavedMetadata>({});

    useEffect(() => {
        if (tabId !== "session") return;
        let cancelled = false;
        savedMetaRef.current = mockRunnerExtensions.getSaveDataMeta(
            actionId,
            playgroundContext.config
        );

        setIsSessionLoading(true);
        getSessionData().then((data) => {
            if (cancelled) return;
            setSessionData(data);
            setIsSessionLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [tabId, actionId, playgroundContext.config, playgroundContext.stepGroup]);

    const payloadRuns = (playgroundContext.config?.transaction_history ?? [])
        .filter((f) => f.action_id === actionId)
        .map((e) => e.payload);
    const activePayload = payloadRuns[payloadRuns.length - 1] || undefined;

    const getSessionData = async () => {
        try {
            if (!playgroundContext.config) {
                return JSON.stringify(
                    {
                        error: "No configuration available",
                        timestamp: new Date().toISOString(),
                    },
                    null,
                    2
                );
            }

            const sessionData =
                playgroundContext.stepGroup === "extra"
                    ? await getFullSession(playgroundContext.config)
                    : await getSessionUpToActionId(playgroundContext.config, actionId);

            return JSON.stringify(sessionData, null, 2);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            const errorName = error instanceof Error ? error.name : "Error";

            const errorInfo = {
                error: "Failed to generate session data",
                message: errorMessage,
                type: errorName,
                actionId: actionId,
                timestamp: new Date().toISOString(),
            };

            try {
                return JSON.stringify(errorInfo, null, 2);
            } catch (newError: unknown) {
                console.error("Error serializing data:", newError);
                return JSON.stringify(
                    {
                        error: "Critical error - unable to serialize data",
                        originalError: String(error),
                        timestamp: new Date().toISOString(),
                    },
                    null,
                    2
                );
            }
        }
    };

    const handleOnMount: OnMount = (monacoEditor, monaco) => {
        const modelUri = monacoEditor.getModel()?.uri.toString();
        const windowWithMonaco = window as WindowWithMonaco;
        if (windowWithMonaco.__jsonHoverProviderDisposable) {
            windowWithMonaco.__jsonHoverProviderDisposable.dispose();
        }

        const disposable = monaco?.languages?.registerHoverProvider?.("json", {
            provideHover: (model: editor.ITextModel, position: Position) => {
                if (modelUri !== model?.uri?.toString()) {
                    return null;
                }

                try {
                    const word = model.getWordAtPosition(position);
                    if (!word) return null;
                    const jsonText = model.getValue();
                    const jsonPath = editorUtils.getJsonPath(
                        jsonText,
                        position.lineNumber,
                        position.column
                    );
                    const firstKey = jsonPath.split(".")[1].split("[")[0];
                    const currentSavedMeta = savedMetaRef.current;
                    if (!currentSavedMeta || !firstKey || !(firstKey in currentSavedMeta)) {
                        return null;
                    }
                    const metaInfo = currentSavedMeta[firstKey];
                    return {
                        range: new monaco.Range(
                            position.lineNumber,
                            word.startColumn,
                            position.lineNumber,
                            word.endColumn
                        ),
                        contents: [
                            { value: `last modified at: **${metaInfo.actionId}**` },
                            { value: `**from:** \`${metaInfo.path}\`` },
                            { value: `ref: sessionData[${firstKey}]` },
                        ],
                    };
                } catch (e) {
                    console.error("Error in hover provider:", e);
                    return null;
                }
            },
        });

        windowWithMonaco.__jsonHoverProviderDisposable = disposable;
    };

    switch (tabId) {
        case "session":
            return (
                <div className="relative flex min-h-0 flex-1 flex-col self-stretch overflow-hidden mt-2">
                    <CodeEditor
                        editorKey="session-data-editor"
                        value={sessionData}
                        language="json"
                        readOnly
                        onMount={handleOnMount}
                        className="h-full w-full border rounded-lg"
                        options={{
                            ...PLAYGROUND_EDITOR_OPTIONS,
                            formatOnPaste: true,
                            formatOnType: true,
                        }}
                    />
                    {isSessionLoading ? (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-surface-elevated/80 backdrop-blur-[1px]">
                            <div className="flex items-center gap-2 rounded-md bg-surface-page px-3 py-1.5 shadow-xs dark:bg-surface-muted">
                                <Spinner className="size-3.5 text-brand-normal" />
                                <span className="text-xs font-medium text-text-primary">
                                    Computing session…
                                </span>
                            </div>
                        </div>
                    ) : null}
                </div>
            );
        case "transaction":
            return <SessionDataTab />;
        case "terminal":
            return <ExecutionResults results={playgroundContext.activeTerminalData} />;
        case "output_payload":
            return (
                <OutputPayloadViewer
                    payload={activePayload}
                    runs={payloadRuns}
                    actionId={actionId}
                />
            );
        case "common_lib":
            return <CommonLibView />;
        case "ai_chat":
            return <AIChatPanel actionId={actionId} />;
    }
    return null;
};
