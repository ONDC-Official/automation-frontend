import { toast } from "react-toastify";
import Heading from "../ui/mini-components/ondc-gradient-text";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import InfoCard from "../ui/info-card";
import { useReactToPrint } from "react-to-print";
import { IoMdArrowRoundBack } from "react-icons/io";

export function ReportPage({
  sessionId,
  report,
  setStep,
}: {
  sessionId: string;
  report: string;
  setStep: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [sessionData, setSessionData] = useState<any>({});
  const htmlRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: htmlRef,
    documentTitle: "report",
  });

  async function fetchPayloads() {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/sessions`,
        { params: { session_id: sessionId } }
      );

      setSessionData(response.data);
    } catch (e) {
      toast.error("Error while fetching session data");
      console.error("error while fetching session data", e);
    }
  }

  useEffect(() => {
    fetchPayloads();
  }, []);

  return (
    <>
      <div className="flex flex-row justify-between">
        <div className="flex flex-row gap-2 justify-center items-center">
          <button
            onClick={() => setStep((s: number) => s - 1)}
            className="p-2 rounded-full border border-sky-500 hover:bg-blue-100 text-sky-500 hover:text-blue-600 transition-all duration-300 shadow-sm"
          >
            <IoMdArrowRoundBack size={12} />
          </button>
          <Heading>Report</Heading>
        </div>

        <button
          onClick={() => handlePrint()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        >
          Download PDF
        </button>
      </div>

      <div className="my-4">
        <InfoCard
          title="Session Data"
          data={{
            Domain: sessionData?.domain || "-",
            Usecase: sessionData?.usecaseId || "-",
            Version: sessionData?.version || "-",
            "NP Type": sessionData?.npType || "-",
            Environment: sessionData?.env || "-",
          }}
        />
      </div>
      <div
        id="report-html"
        ref={htmlRef}
        dangerouslySetInnerHTML={{ __html: report }}
      ></div>
    </>
  );
}
