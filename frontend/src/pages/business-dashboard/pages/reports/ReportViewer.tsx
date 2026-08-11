import { Download, TriangleAlert, X } from "lucide-react";
import { Button } from "@components/Shadcn/Button";
import EmptyState from "@components/EmptyState";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@components/Shadcn/Drawer/drawer";

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
    <Drawer
        direction="right"
        open={Boolean(testId)}
        onOpenChange={(open) => {
            if (!open) onClose();
        }}
    >
        <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-5xl">
            <DrawerHeader>
                <DrawerTitle className="font-mono text-sm break-all">{testId}</DrawerTitle>
                <DrawerDescription>
                    Rendered in a sandboxed frame — the report cannot reach this page or its session
                    cookie.
                </DrawerDescription>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3 pt-4">
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
            </div>
            <DrawerClose
                aria-label="Close"
                className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 absolute top-4 right-4 rounded-sm p-1 transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
            >
                <X className="size-4" />
            </DrawerClose>
        </DrawerContent>
    </Drawer>
);

export default ReportViewer;
