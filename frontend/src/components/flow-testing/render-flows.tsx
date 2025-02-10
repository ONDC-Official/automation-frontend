import React, { useEffect, useRef, useState } from "react";
import { FetchFlowsResponse } from "../../types/flow-types";
import InfoCard from "../ui/info-card";
import DifficultyCards from "../ui/difficulty-cards";
import axios from "axios";
import { toast } from "react-toastify";
import { ApiData, SessionCache } from "../../types/session-types";
import {
  putCacheData,
  getCompletePayload,
  getTransactionData,
  getLogs,
} from "../../utils/request-utils";
import { Accordion } from "./flow-accordian";
import Loader from "../ui/mini-components/loader";
import JsonView from "@uiw/react-json-view";
import { githubDarkTheme } from "@uiw/react-json-view/githubDark";
import Tabs from "../ui/mini-components/tabs";
import Console from "../console";

function RenderFlows({
  flows,
  subUrl,
  sessionId,
  setStep,
  setReport,
}: {
  flows: FetchFlowsResponse;
  subUrl: string;
  sessionId: string;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setReport: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [sessionData, setSessionData] = useState<Record<string, string> | null>(
    null
  );
  const [activeFlow, setActiveFlow] = useState<string | null>(null);
  const activeFlowRef = useRef<string | null>(activeFlow);
  const [cacheSessionData, setCacheSessionData] = useState<SessionCache | null>(
    null
  );
  const [sideView, setSideView] = useState<any>({});
  const [difficultyCache, setDifficultyCache] = useState<any>({});
  const [isFlowStopped, setIsFlowStopped] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState("Request");
  const [requestData, setRequestData] = useState({});
  const [responseData, setResponseData] = useState({});
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (sessionId) {
      setInterval(async () => {
        const logs = await getLogs(sessionId);
        setLogs(logs);
      }, 3000);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSessionData();
  }, [subUrl]);

  useEffect(() => {
    if (sideView?.payload_id) {
      getCompletePayload([sideView.payload_id])
        .then((data: any) => {
          setRequestData(data[0].req);
        })
        .catch((e: any) => {
          console.log("Errro while fetching payload: ", e);
          console.log(">>>", sideView);
          setRequestData(sideView.request || {});
        });
      setResponseData(sideView?.response || {});
    } else {
      // console.log("sideView", sideView);
      setRequestData(sideView || {});
      setResponseData(sideView || {});
    }
  }, [sideView]);

  console.log("Side view'", sideView, requestData, responseData);

  useEffect(() => {
    if (activeFlow) {
      putCacheData(
        {
          flowId: activeFlow,
        },
        sessionId
      )
        .then((response) => {
          console.log("response", response.data);
        })
        .catch((e) => {
          console.error("error while sending response", e);
          toast.error("Error while updating session");
        });
    }
  }, [activeFlow, subUrl]);

  // Update the ref whenever activeFlow changes
  useEffect(() => {
    activeFlowRef.current = activeFlow;
  }, [activeFlow]);

  useEffect(() => {
    // Call fetchData initially
    fetchPayloads();

    // Set interval to call fetchData every 3 seconds
    const intervalId = setInterval(fetchPayloads, 3000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures this runs once

  async function fetchPayloads() {
    try {
      if (activeFlowRef.current === null) return;

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/sessions`,
        { params: { session_id: sessionId } }
      );
      const data: SessionCache = {
        subscriberUrl: subUrl,
        ...response.data,
      };

      setCacheSessionData(data);
    } catch (e) {
      toast.error("Error while fetching payloads");
      console.error("error while fetching payloads", e);
    }
  }

  function fetchSessionData() {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/sessions`, {
        params: {
          session_id: sessionId,
        },
      })
      .then((response: any) => {
        const filteredData = Object.entries(response.data)
          .filter(([_, value]) => typeof value === "string")
          .reduce((acc: any, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {});
        delete filteredData["active_session_id"];
        // delete filteredData["current_flow_id"];
        setDifficultyCache(response.data.sessionDifficulty);
        setSessionData(filteredData);
        setCacheSessionData(response.data);
      });
  }

  async function generateReport() {
    const body: any = {};
    console.log("cachedData", cacheSessionData);
    if (!cacheSessionData) {
      toast.error("Error while generating report");
      return;
    }
    let apiList: ApiData[] | undefined = undefined;

    for (const flow in cacheSessionData.flowMap) {
      const transactionId = cacheSessionData.flowMap[flow];
      if (!transactionId) continue;
      const transData = await getTransactionData(transactionId, subUrl);
      if (!transData) continue;
      apiList = transData.apiList;
    }

    Object.entries(apiList || {}).map((data) => {
      const [key, value]: any = data;
      if (value.length) {
        body[key] = value.map((val: any) => val.payload_id);
      }
    });

    axios
      .post(`${import.meta.env.VITE_BACKEND_URL}/flow/report`, body, {
        params: {
          sessionId: sessionId,
        },
      })
      .then((response) => {
        setReport(response.data.data);
        setStep((s: number) => s + 1);
      })
      .catch((e) => {
        console.error(e);
        toast.error("Error while generating report");
      });
  }

  const handleClearFlow = () => {
    setRequestData({});
    setResponseData({});
    fetchSessionData();
  };

  return (
    <div className="w-full min-h-screen flex flex-col">
      <div className="space-y-2 pt-4 pr-4 pl-4">
        {sessionData ? (
          <div className="flex gap-2 flex-col">
            <InfoCard
              title="Flow Challenges"
              data={{
                ...sessionData,
                activeFlow: activeFlow || "N/A",
                sessionId: sessionId,
              }}
            />
            <DifficultyCards
              difficulty_cache={difficultyCache}
              sessionId={sessionId}
            />
          </div>
        ) : (
          <div>Loading...</div>
        )}
        <div className="flex justify-end">
          <button
            className="bg-sky-500 text-white px-4 py-2 mt-1 rounded hover:bg-sky-600 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={async () => await generateReport()}
            disabled={!isFlowStopped}
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 w-full">
        {/* Left Column - Main Content */}
        <div className="w-full sm:w-[60%] overflow-y-auto p-4">
          {flows.domain.map((domain) => (
            <div key={domain.name} className="mb-8">
              {domain.flows.map((flow) => (
                <Accordion
                  key={flow.id}
                  flow={flow}
                  activeFlow={activeFlow}
                  sessionId={sessionId}
                  setActiveFlow={setActiveFlow}
                  sessionCache={cacheSessionData}
                  setSideView={setSideView}
                  subUrl={subUrl}
                  onFlowStop={() => setIsFlowStopped(true)}
                  onFlowClear={() => handleClearFlow()}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Right Column - Sticky Request & Response */}
        <div className="w-full sm:w-[40%] p-4">
          {/* Sticky Container */}
          <div className="bg-white rounded-md shadow-md border sticky top-20">
            {/* <h2 className="m-1 text-lg font-semibold">Request & Response</h2> */}
            <Tabs
              className="mt-4 ml-2"
              option1="Request"
              option2="Response"
              onSelectOption={(value: string) => {
                setSelectedTab(value);
              }}
            />
            <div className="p-2">
              {cacheSessionData ? (
                <div
                  className="rounded-md overflow-auto"
                  style={{ maxHeight: "500px" }} // Adjust maxHeight as needed
                >
                  <JsonView
                    value={
                      selectedTab === "Request" ? requestData : responseData
                    }
                    style={githubDarkTheme}
                    className="rounded-md"
                    displayDataTypes={false}
                  />
                </div>
              ) : (
                <Loader />
              )}
            </div>
          </div>
        </div>
      </div>
      <Console logs={logs} />
    </div>
  );
}

// Accordion component for each flow

export default RenderFlows;
