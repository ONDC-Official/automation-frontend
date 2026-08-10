import { Download, TriangleAlert } from "lucide-react";
import { Button } from "@components/Shadcn/Button";
import EmptyState from "@components/EmptyState";
import Sheet, {
    SheetBody,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@pages/business-dashboard/components/Sheet";

interface IProps {
    testId: string | null;
    html: string | null;
    isLoading: boolean;
    isError: boolean;
    errorMessage?: string;
    onDownload: () => void;
    onClose: () => void;
}

const ReportViewer = ({
    testId,
    html,
    isLoading,
    isError,
    errorMessage,
    onDownload,
    onClose,
}: IProps) => (
    <Sheet
        open={Boolean(testId)}
        onOpenChange={(open) => {
            if (!open) onClose();
        }}
    >
        <SheetContent className="sm:max-w-5xl">
            <SheetHeader>
                <SheetTitle className="font-mono text-sm break-all">{testId}</SheetTitle>
                <SheetDescription>
                    Rendered in a sandboxed frame — the report cannot reach this page or its session
                    cookie.
                </SheetDescription>
            </SheetHeader>

            <SheetBody className="flex flex-col gap-3 pt-4">
                <div>
                    <Button variant="outline" size="sm" disabled={!html} onClick={onDownload}>
                        <Download />
                        Download HTML
                    </Button>
                </div>

                {isError && (
                    <EmptyState
                        icon={TriangleAlert}
                        title="Could not load this report"
                        message={errorMessage ?? "The report blob did not come back."}
                    />
                )}

                {isLoading && <div className="bg-muted h-[70vh] w-full animate-pulse rounded-lg" />}

                {html && (
                    /* No `allow-same-origin`: the frame gets an opaque origin, so the
             report's own scripts can render it but cannot read our cookies,
             storage or DOM. */
                    <iframe
                        title={`Report ${testId}`}
                        srcDoc={html}
                        sandbox="allow-scripts"
                        className="border-border bg-background h-[70vh] w-full rounded-lg border"
                    />
                )}
            </SheetBody>
        </SheetContent>
    </Sheet>
);

export default ReportViewer;
