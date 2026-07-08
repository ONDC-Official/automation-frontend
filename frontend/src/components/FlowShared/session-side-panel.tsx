import Spinner from "@components/Shadcn/Spinner";
import SearchableJsonView from "@components/FlowShared/searchable-json-view";
import { FlowTabs, TabsContent } from "@components/Shadcn/Tabs";
import FlowHelperTab from "@components/FlowShared/helper-tab";
import RideMapTab from "@components/FlowShared/ride-map-tab";
import { SESSION_EMPTY_RECORD } from "@store/slices/sessionConstants";
import type { SessionTab } from "@store/slices/sessionSlice";
import type { SessionCache, SessionPayloadData } from "@/types/session-types";

interface SessionSidePanelProps {
    sessionData: SessionCache | null;
    requestData: SessionPayloadData;
    responseData: SessionPayloadData;
    selectedTab: SessionTab;
    setSelectedTab: (tab: SessionTab) => void;
    mapEnabled: boolean;
    activeFlowId: string | null;
}

/** Right-hand inspector for the flow-testing view: Request/Response/Guide/Application tabs. */
export function SessionSidePanel({
    sessionData,
    requestData,
    responseData,
    selectedTab,
    setSelectedTab,
    mapEnabled,
    activeFlowId,
}: SessionSidePanelProps) {
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
                            <div className="overflow-auto" style={{ maxHeight: "600px" }}>
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
                            <div className="overflow-auto" style={{ maxHeight: "600px" }}>
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
                                style={{ maxHeight: "600px" }}
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
                                    style={{ maxHeight: "600px" }}
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
