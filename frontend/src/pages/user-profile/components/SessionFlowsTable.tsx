import { Button } from "@/components/Shadcn/Button/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/Shadcn/Table/table";
import { cn } from "@/lib/utils";
import type { FlowStatus, ISessionFlowsTableProps } from "@pages/user-profile/types";

const FlowStatusBadge = ({ status }: { status: FlowStatus }) => {
    const config: Record<FlowStatus, { cls: string; label: string }> = {
        PASS: { cls: "bg-success-50 text-success-500 border-success-200", label: "Passed" },
        FAIL: { cls: "bg-error-50 text-error-500 border-error-50", label: "Failed" },
        RUN: { cls: "bg-alert-50 text-alert-800 border-alert-200", label: "Run" },
        NOT_RUN: { cls: "bg-error-50 text-error-500 border-error-50 rounded", label: "- Not Run" },
    };
    const { cls, label } = config[status] ?? config.NOT_RUN;

    return (
        <span
            className={cn(
                "inline-flex items-center px-1 py-0.5 text-caption-1 font-semibold whitespace-nowrap",
                cls
            )}
        >
            {label}
        </span>
    );
};

export const SessionFlowsTable = ({
    flowRows,
    reportExists,
    sessionId,
    viewingId,
    onViewReport,
}: ISessionFlowsTableProps) => (
    <div className="border border-n-30 overflow-hidden mt-4 rounded-xl dark:border-border-default">
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                    <TableHead className="bg-surface-muted text-body-2 font-regular text-text-secondary">
                        Flow Name
                    </TableHead>
                    <TableHead className="bg-surface-muted text-body-2 font-regular text-text-secondary">
                        Type
                    </TableHead>
                    <TableHead className="bg-surface-muted text-body-2 font-regular text-text-secondary">
                        Status
                    </TableHead>
                    <TableHead className="bg-surface-muted text-left text-body-2 font-regular text-text-secondary">
                        Action
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {flowRows.map((flow) => (
                    <TableRow key={flow.id} className="bg-surface-elevated">
                        <TableCell className="font-mono font-medium text-text-primary">
                            {flow.name}
                        </TableCell>
                        <TableCell>
                            <span className="inline-block px-1 py-0.5 rounded text-caption-1 font-semibold uppercase text-brand-normal border border-brand-light-active bg-brand-light dark:border-border-default dark:bg-surface-muted dark:text-brand-light">
                                {flow.type}
                            </span>
                        </TableCell>
                        <TableCell>
                            <FlowStatusBadge status={flow.status} />
                        </TableCell>
                        <TableCell className="text-left">
                            <Button
                                type="button"
                                variant="secondary"
                                size="xs"
                                className="px-1"
                                disabled={!reportExists || viewingId === sessionId}
                                isLoading={viewingId === sessionId}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewReport(sessionId);
                                }}
                            >
                                View
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
);
