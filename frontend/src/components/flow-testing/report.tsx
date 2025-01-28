import { toast } from "react-toastify";
import Heading from "../ui/mini-components/ondc-gradient-text";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import InfoCard from "../ui/info-card";
import { useReactToPrint } from "react-to-print";
import { IoMdArrowRoundBack } from "react-icons/io";

export function ReportPage({
  subUrl,
  report,
  setStep,
}: {
  subUrl: string;
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
        { params: { subscriber_url: subUrl } }
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

        {/* <div className="mt-4 ">
          <PDFDownloadLink
            document={<PdfDocument />}
            fileName="download.pdf"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          >
            {({ loading }: any) =>
              loading ? "Generating PDF..." : "Download PDF"
            }
          </PDFDownloadLink>
        </div> */}

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
            city: sessionData?.city || "-",
            flow_id: sessionData?.current_flow_id || "-",
            difficulty:
              sessionData?.difficulty_cache?.totalDifficulty?.toString() || "-",
            domain: sessionData?.domain || "-",
            type: sessionData?.type,
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
