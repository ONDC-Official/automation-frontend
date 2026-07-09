import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useLazyGetSessionByIdQuery } from "@store/api";
import { Button } from "@components/Shadcn/Button";
import { InfoSection } from "@components/DomainFlowRunner/InfoSection";
import { REPORT_INFO_LABELS } from "@components/DomainFlowRunner/constants";
import type { IReportPageProps } from "@components/DomainFlowRunner/types";

export function ReportPage({ sessionId, report, setStep }: IReportPageProps) {
    const [sessionData, setSessionData] = useState<Record<string, unknown> | null>(null);
    const htmlRef = useRef<HTMLDivElement>(null);
    const [triggerGetSessionById] = useLazyGetSessionByIdQuery();

    const handlePrint = useReactToPrint({
        contentRef: htmlRef,
        documentTitle: "report",
    });

    async function fetchPayloads() {
        try {
            const response = await triggerGetSessionById({ sessionId }).unwrap();
            setSessionData(response);
        } catch (e) {
            toast.error("Error while fetching session data");
            console.error("error while fetching session data", e);
        }
    }

    useEffect(() => {
        fetchPayloads();
    }, []);

    const infoData: Record<string, string> = {
        domain: (sessionData?.domain as string) || "-",
        usecaseId: (sessionData?.usecaseId as string) || "-",
        version: (sessionData?.version as string) || "-",
        npType: (sessionData?.npType as string) || "-",
        env: (sessionData?.env as string) || "-",
    };

    return (
        <>
            <div className="flex flex-row justify-between">
                <div className="flex flex-row items-center justify-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setStep((s: number) => s - 1)}
                        className="rounded-full border-sky-500 text-sky-500 hover:bg-blue-100 hover:text-blue-600"
                        aria-label="Back to flows"
                    >
                        <IoMdArrowRoundBack size={12} />
                    </Button>
                    <h2 className="text-h5 font-bold text-brand-primary dark:text-neutral-900">
                        Report
                    </h2>
                </div>

                <Button type="button" onClick={() => handlePrint()}>
                    Download PDF
                </Button>
            </div>

            <div className="my-4">
                <InfoSection data={infoData} labels={REPORT_INFO_LABELS} />
            </div>
            <div id="report-html" ref={htmlRef} dangerouslySetInnerHTML={{ __html: report }} />
        </>
    );
}
