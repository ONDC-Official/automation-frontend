import { toast } from "react-toastify";
import Heading from "../ui/mini-components/ondc-gradient-text";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import InfoCard from "../ui/info-card";
import IconButton from "../ui/mini-components/icon-button";
import { IoMdDownload } from "react-icons/io";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
// import { PDFDownloadLink, Document, Page, View } from "@react-pdf/renderer";
// import Html from "react-pdf-html";
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
  console.log(subUrl);
  // const [response, setResponse] = useState("");
  const [sessionData, setSessionData] = useState<any>({});
  const htmlRef = useRef<HTMLDivElement>(null);

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

  // useEffect(() => {
  //   if (sessionData?.session_payloads) {
  //     generateReport();
  //   }
  // }, [sessionData]);

  // function generateReport() {
  //   let body: any = {};

  //   Object.entries(sessionData.session_payloads).map((data) => {
  //     const [key, value]: any = data;
  //     if (value.length) {
  //       body[key] = value.map((val: any) => val.payload_id);
  //     }
  //   });

  //   axios
  //     .post(`${import.meta.env.VITE_BACKEND_URL}/flow/report`, body, {
  //       params: {
  //         sessionId: sessionID,
  //       },
  //     })
  //     .then((response) => {
  //       console.log(response.data);
  //       setResponse(response.data.data);
  //     })
  //     .catch((e) => {
  //       console.error(e);
  //       toast.error("error while generating report");
  //     });
  // }

  // const PdfDocument = () => (
  //   <Document>
  //     <Page size="A4" style={{ padding: 10 }}>
  //       <View>
  //         <Html>{report}</Html>
  //       </View>
  //     </Page>
  //   </Document>
  // );

  const downloadAsPdf = async () => {
    if (htmlRef.current) {
      try {
        // Convert the HTML div to canvas
        const canvas = await html2canvas(htmlRef.current);
        const imgData = canvas.toDataURL("image/png");

        // Generate PDF
        const pdf = new jsPDF();
        const imgWidth = 190; // PDF page width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

        // Trigger the download
        pdf.save("download.pdf");
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }
  };

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

        <IconButton
          icon={<IoMdDownload className=" text-md" />}
          label="Download Report"
          color="green"
          onClick={async (e) => {
            e.stopPropagation();
            downloadAsPdf();
          }}
        />
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
      <div ref={htmlRef} dangerouslySetInnerHTML={{ __html: report }}></div>
    </>
  );
}
