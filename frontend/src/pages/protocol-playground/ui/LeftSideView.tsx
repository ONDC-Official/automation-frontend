import { useContext, useState, useMemo, useEffect, useRef } from "react";
import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";
import { PLAYGROUND_LEFT_TABS, PLAYGROUND_LEFT_TABS_FORM } from "@pages/protocol-playground/types";
import { CodeValidator, getFunctionSchema } from "@ondc/automation-mock-runner";
import { decodeBase64 } from "@pages/protocol-playground/utils/base64";
import { CodeStatistics } from "@pages/protocol-playground/ui/extras/statistics";
import { getGroupSteps } from "@pages/protocol-playground/utils/step-group";
import { CodeEditor } from "@/components/PayloadEditor";
import { FlowTabs, TabsContent } from "@/components/Shadcn/Tabs";
import { PLAYGROUND_EDITOR_OPTIONS } from "@pages/protocol-playground/constants";
import { cn } from "@/lib/utils";

export const LeftSideView = (props: { width: string; activeApi?: string }) => {
    const { width, activeApi } = props;
    const playgroundContext = useContext(PlaygroundContext);

    const stepData = getGroupSteps(playgroundContext.config, playgroundContext.stepGroup).find(
        (f) => f.action_id === activeApi
    );

    const isForm =
        stepData?.api === "dynamic_form" ||
        stepData?.api === "html_form" ||
        stepData?.api === "DYNAMIC_FORM";

    const tabs = isForm ? PLAYGROUND_LEFT_TABS_FORM : PLAYGROUND_LEFT_TABS;

    const [activeLeftTab, setActiveLeftTab] = useState<string>(tabs[0].id);
    useEffect(() => {
        if (!tabs.some((tab) => tab.id === activeLeftTab)) {
            setActiveLeftTab(tabs[0].id);
        }
    }, [tabs, activeLeftTab]);

    const activeTabConfig = useMemo(
        () => tabs.find((tab) => tab.id === activeLeftTab) ?? tabs[0],
        [tabs, activeLeftTab]
    );

    const getEditorContent = () => {
        if (!stepData) return "";
        const value = stepData.mock[activeTabConfig.property];
        if (typeof value === "string") {
            return decodeBase64(value);
        }
        return typeof value === "string" ? value : JSON.stringify(value, null, 2);
    };

    const codeAnalysis = useMemo(() => {
        if (activeTabConfig.language !== "javascript") {
            return null;
        }

        const content = getEditorContent();
        if (!content || content.trim() === "") {
            return null;
        }

        try {
            const statistics = CodeValidator.getCodeStatistics(content);

            let validation = null;
            const baseProperty = activeTabConfig.property;
            if (
                baseProperty === "generate" ||
                baseProperty === "validate" ||
                baseProperty === "requirements"
            ) {
                const property =
                    baseProperty === "requirements" ? "meetsRequirements" : baseProperty;
                const schema = getFunctionSchema(property);
                if (schema) {
                    validation = CodeValidator.validate(content, schema);
                }
            }

            return {
                statistics,
                validation,
            };
        } catch (error) {
            console.error("Error analyzing code:", error);
            return null;
        }
    }, [activeLeftTab, stepData, activeApi]);

    const pendingRef = useRef<{ timer: number | null; flush: (() => void) | null }>({
        timer: null,
        flush: null,
    });

    const handleEditorChange = (value: string | undefined) => {
        if (!value || !stepData || !playgroundContext.updateStepMock) return;
        const stepId = stepData.action_id;
        const property = activeTabConfig.property;
        if (pendingRef.current.timer !== null) {
            window.clearTimeout(pendingRef.current.timer);
        }
        pendingRef.current.flush = () => playgroundContext.updateStepMock(stepId, property, value);
        pendingRef.current.timer = window.setTimeout(() => {
            pendingRef.current.flush?.();
            pendingRef.current.timer = null;
            pendingRef.current.flush = null;
        }, 150);
    };

    useEffect(
        () => () => {
            if (pendingRef.current.timer !== null) {
                window.clearTimeout(pendingRef.current.timer);
                pendingRef.current.flush?.();
                pendingRef.current.timer = null;
                pendingRef.current.flush = null;
            }
        },
        [activeApi, activeLeftTab]
    );

    const tabOptions = tabs.map((tab) => ({ key: tab.id, label: tab.label }));

    return (
        <div
            className={cn(
                "flex min-h-0 flex-1 flex-col self-stretch overflow-hidden bg-transparent transition-all duration-500 ease-in-out dark:border-border-default",
                width
            )}
        >
            <FlowTabs
                variant="default"
                options={tabOptions}
                value={activeLeftTab}
                onValueChange={setActiveLeftTab}
                className="flex h-full min-h-0 flex-1 flex-col [&_[data-slot=tabs-content][data-state=active]]:flex [&_[data-slot=tabs-content][data-state=active]]:min-h-0 [&_[data-slot=tabs-content][data-state=active]]:flex-1"
            >
                {tabs.map((tab) => (
                    <TabsContent
                        key={tab.id}
                        value={tab.id}
                        className="flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
                    >
                        {tab.id === activeLeftTab && codeAnalysis ? (
                            <div className="shrink-0 px-3 py-2 dark:border-border-default">
                                <CodeStatistics
                                    statistics={codeAnalysis.statistics}
                                    validation={codeAnalysis.validation}
                                />
                            </div>
                        ) : null}
                        <div className="flex min-h-0 flex-1 flex-col self-stretch overflow-hidden mt-2">
                            <CodeEditor
                                editorKey={`${activeApi}-${activeTabConfig.id}-${activeTabConfig.language}`}
                                path={`${activeApi ?? "no-api"}-${activeTabConfig.id}.${
                                    activeTabConfig.language === "javascript"
                                        ? "js"
                                        : activeTabConfig.language
                                }`}
                                language={activeTabConfig.language}
                                defaultValue={getEditorContent()}
                                onChange={handleEditorChange}
                                className="h-full w-full border rounded-lg"
                                options={{
                                    ...PLAYGROUND_EDITOR_OPTIONS,
                                    formatOnPaste: false,
                                    formatOnType: false,
                                }}
                            />
                        </div>
                    </TabsContent>
                ))}
            </FlowTabs>
        </div>
    );
};
