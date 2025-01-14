import { toast } from "react-toastify";
import Heading from "../ui/mini-components/ondc-gradient-text";
import axios from "axios";
import { useEffect, useState } from "react";
import InfoCard from "../ui/info-card";

export function ReportPage({
  sessionID,
  subUrl,
}: {
  sessionID: string;
  subUrl: string;
}) {
  console.log(subUrl);
  const [response, setResponse] = useState("");
  const [sessionData, setSessionData] = useState<any>({});

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
    generateReport();
  }, []);

  function generateReport() {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/flow/report`, {
        params: {
          sessionId: sessionID,
        },
      })
      .then((response) => {
        console.log(response.data);
        setResponse(response.data.data);
      })
      .catch((e) => {
        console.error(e);
        toast.error("error while generating report");
      });
  }
  return (
    <>
      <Heading>Report</Heading>
      {/* <button
				onClick={generateReport}
				className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300"
			>
				Create Report
			</button> */}
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
      <div dangerouslySetInnerHTML={{ __html: response }}></div>
    </>
  );
}
