import Spinner from "@components/Shadcn/Spinner";
import SearchableJsonView from "@components/DomainFlowRunner/SearchableJsonView";
import { FlowTabs, TabsContent } from "@components/Shadcn/Tabs";
import FlowHelperTab from "@components/DomainFlowRunner/HelperTab";
import RideMapTab from "@components/DomainFlowRunner/RideMapTab";
import { SESSION_SIDE_PANEL_MAX_HEIGHT } from "@components/DomainFlowRunner/constants";
import type { ISessionSidePanelProps } from "@components/DomainFlowRunner/types";
import { SESSION_EMPTY_RECORD } from "@store/slices/sessionConstants";
import type { SessionTab } from "@store/slices/sessionSlice";

/** Right-hand inspector for the flow-testing view: Request/Response/Guide/Application tabs. */
export function SessionSidePanel({
    sessionData,
    requestData,
    responseData,
    selectedTab,
    setSelectedTab,
    mapEnabled,
    activeFlowId,
}: ISessionSidePanelProps) {
    return (
        <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
            <div>
                <FlowTabs
                    options={[
                        { key: "Request", label: "Request" },
                        { key: "Response", label: "Response" },
                        { key: "Guide", label: "Guide" },
                        ...(mapEnabled ? [{ key: "Application", label: "Application" }] : []),
                    ]}
                    value={selectedTab}
                    onValueChange={(value) => setSelectedTab(value as SessionTab)}
                >
                    <TabsContent value="Request" className="pb-4 pt-3">
                        {sessionData ? (
                            <div
                                className="overflow-auto"
                                style={{ maxHeight: SESSION_SIDE_PANEL_MAX_HEIGHT }}
                            >
                                <SearchableJsonView value={requestData ?? SESSION_EMPTY_RECORD} />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-16">
                                <Spinner className="size-8 text-brand-normal" />
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="Response" className="pb-4 pt-3">
                        {sessionData ? (
                            <div
                                className="overflow-auto"
                                style={{ maxHeight: SESSION_SIDE_PANEL_MAX_HEIGHT }}
                            >
                                <SearchableJsonView value={responseData ?? SESSION_EMPTY_RECORD} />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-16">
                                <Spinner className="size-8 text-brand-normal" />
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="Guide" className="pb-4 pt-3">
                        {sessionData ? (
                            <div
                                className="overflow-auto rounded-lg border border-n-40 bg-surface-elevated p-3 dark:border-border-default dark:bg-surface-muted"
                                style={{ maxHeight: SESSION_SIDE_PANEL_MAX_HEIGHT }}
                            >
                                <FlowHelperTab
                                    domain={sessionData?.domain}
                                    version={sessionData?.version}
                                    npType={sessionData?.npType}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-16">
                                <Spinner className="size-8 text-brand-normal" />
                            </div>
                        )}
                    </TabsContent>
                    {mapEnabled ? (
                        <TabsContent value="Application" className="px-4 pb-4 pt-3">
                            {sessionData ? (
                                <div
                                    className="overflow-auto rounded-lg border border-n-40 bg-surface-elevated p-3 dark:border-border-default dark:bg-surface-muted"
                                    style={{ maxHeight: SESSION_SIDE_PANEL_MAX_HEIGHT }}
                                >
                                    <RideMapTab
                                        key={activeFlowId ?? "none"}
                                        flowId={activeFlowId}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-16">
                                    <Spinner className="size-8 text-brand-normal" />
                                </div>
                            )}
                        </TabsContent>
                    ) : null}
                </FlowTabs>
            </div>
        </div>
    );
}
