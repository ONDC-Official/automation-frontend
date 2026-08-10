import { CheckCircle2, CircleDashed, TriangleAlert, XCircle } from "lucide-react";
import { Badge } from "@components/Shadcn/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@components/Shadcn/Card/card";
import EmptyState from "@components/EmptyState";
import JsonViewer from "@pages/business-dashboard/components/JsonViewer";
import Sheet, {
    SheetBody,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@pages/business-dashboard/components/Sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/Shadcn/Tabs";
import { formatDateTime } from "@pages/business-dashboard/lib/utils";
import type { SessionDetails } from "@pages/business-dashboard/services/types";
import FlowSummaryCard from "./FlowSummaryCard";
import { flowMapTotals } from "./utils";

interface IProps {
    sessionId: string | null;
    detail: SessionDetails | null;
    isLoading: boolean;
    isError: boolean;
    onClose: () => void;
}

const META_FIELDS = [
    { label: "NP type", read: (s: SessionDetails) => s.npType || "—" },
    { label: "NP id", read: (s: SessionDetails) => s.npId ?? "—" },
    { label: "Domain", read: (s: SessionDetails) => s.domain ?? "—" },
    { label: "Version", read: (s: SessionDetails) => s.version ?? "—" },
    { label: "Session type", read: (s: SessionDetails) => s.sessionType },
    { label: "Usecase", read: (s: SessionDetails) => s.usecaseId ?? "—" },
    { label: "User", read: (s: SessionDetails) => s.userId ?? "—" },
    {
        label: "Created",
        read: (s: SessionDetails) => formatDateTime(s.createdAt),
    },
] as const;

const SessionDetailSheet = ({ sessionId, detail, isLoading, isError, onClose }: IProps) => (
    <Sheet
        open={Boolean(sessionId)}
        onOpenChange={(open) => {
            if (!open) onClose();
        }}
    >
        <SheetContent>
            <SheetHeader>
                <SheetTitle className="font-mono text-sm break-all">{sessionId}</SheetTitle>
                <SheetDescription>
                    Flows, per-flow verdicts and the raw stored document.
                </SheetDescription>
            </SheetHeader>

            <SheetBody>
                {isError && (
                    <EmptyState
                        icon={TriangleAlert}
                        title="Could not load this session"
                        message="The detail endpoint did not respond. The row data above is what the list returned."
                    />
                )}

                {isLoading && !detail && (
                    <div className="flex flex-col gap-3 pt-4">
                        {Array.from({ length: 4 }, (_, index) => (
                            <div
                                key={index}
                                className="bg-muted h-16 w-full animate-pulse rounded-lg"
                            />
                        ))}
                    </div>
                )}

                {detail && (
                    <Tabs defaultValue="overview" className="pt-4">
                        <TabsList variant="line">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="flows">Flows</TabsTrigger>
                            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="flex flex-col gap-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Session</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                        {META_FIELDS.map(({ label, read }) => (
                                            <div key={label} className="flex flex-col">
                                                <dt className="text-muted-foreground text-xs">
                                                    {label}
                                                </dt>
                                                <dd className="truncate">{read(detail)}</dd>
                                            </div>
                                        ))}
                                        <div className="flex flex-col">
                                            <dt className="text-muted-foreground text-xs">
                                                Report
                                            </dt>
                                            <dd>
                                                <Badge
                                                    variant={
                                                        detail.reportExists
                                                            ? "success"
                                                            : "secondary"
                                                    }
                                                >
                                                    {detail.reportExists ? "Generated" : "None"}
                                                </Badge>
                                            </dd>
                                        </div>
                                    </dl>
                                </CardContent>
                            </Card>

                            <FlowSummaryCard flowSummary={detail.flowSummary} />
                        </TabsContent>

                        <TabsContent value="flows" className="flex flex-col gap-3">
                            <FlowMapCard flowMap={detail.flowMap} />
                            <FlowListCard detail={detail} />
                        </TabsContent>

                        <TabsContent value="raw">
                            <JsonViewer
                                data={detail}
                                initialDepth={1}
                                maxHeightClassName="max-h-[60vh]"
                            />
                        </TabsContent>
                    </Tabs>
                )}
            </SheetBody>
        </SheetContent>
    </Sheet>
);

const FlowMapCard = ({ flowMap }: { flowMap: SessionDetails["flowMap"] }) => {
    const { entries, passed, failed } = flowMapTotals(flowMap);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Flow results</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                {entries.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        No per-flow verdicts recorded yet.
                    </p>
                ) : (
                    <>
                        <div className="flex items-center gap-2 text-xs">
                            <Badge variant="success">
                                <CheckCircle2 />
                                {passed} passed
                            </Badge>
                            <Badge variant="error">
                                <XCircle />
                                {failed} failed
                            </Badge>
                        </div>
                        <ul className="divide-border flex flex-col divide-y">
                            {entries.map(([flowId, result]) => (
                                <li
                                    key={flowId}
                                    className="flex items-center justify-between gap-3 py-1.5 text-sm"
                                >
                                    <span className="truncate font-mono text-xs">{flowId}</span>
                                    <Badge variant={result === "PASS" ? "success" : "error"}>
                                        {result === "PASS" ? <CheckCircle2 /> : <XCircle />}
                                        {result}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

const FlowListCard = ({ detail }: { detail: SessionDetails }) => {
    const flows = detail.flows ?? [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Flows</CardTitle>
            </CardHeader>
            <CardContent>
                {flows.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        This session has no flows attached.
                    </p>
                ) : (
                    <ul className="divide-border flex flex-col divide-y">
                        {flows.map((flow) => (
                            <li
                                key={flow.id}
                                className="flex items-center justify-between gap-3 py-1.5 text-sm"
                            >
                                <span className="truncate font-mono text-xs">{flow.id}</span>
                                <span className="flex items-center gap-2">
                                    <span className="text-muted-foreground text-xs">
                                        {flow.payloads?.length ?? 0} payloads
                                    </span>
                                    <Badge
                                        variant={flow.status === "COMPLETED" ? "success" : "alert"}
                                    >
                                        {flow.status === "COMPLETED" ? (
                                            <CheckCircle2 />
                                        ) : (
                                            <CircleDashed />
                                        )}
                                        {flow.status}
                                    </Badge>
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
};

export default SessionDetailSheet;
