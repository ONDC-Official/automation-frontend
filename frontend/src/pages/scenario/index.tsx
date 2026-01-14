import { useState, useEffect, useRef, useCallback } from "react";
import { LuHistory } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

import RenderFlows from "@components/FlowShared/render-flows";
import { ReportPage } from "@components/FlowShared/report";
import { FormGuide } from "@components/FlowShared/guides";
import InitialFlowForm from "@components/FlowShared/initial-form";
import NotFound from "@components/NotFound";
import { useSession } from "@context/sessionContext";
import { putCacheData } from "@utils/request-utils";
import { trackEvent } from "@utils/analytics";
import { useWorkbenchFlows } from "@hooks/useWorkbenchFlow";
import { sessionIdSupport } from "@utils/localStorageManager";
import { ROUTES } from "@constants/routes";
import { Flow } from "@/types/flow-types";

export default function FlowContent() {
  const {
    flowStepNum,
    setFlowStepNum,
    session,
    setSession,
    subscriberUrl,
    setSubscriberUrl,
    flows,
    setFlows,
    report,
    // setReport,
  } = useWorkbenchFlows();
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  interface DynamicListItem {
    key: string;
    version?: DynamicListItem[];
    usecase?: DynamicListItem[];
  }

  const [dynamicList, setDynamicList] = useState<{
    domain: DynamicListItem[];
    version: DynamicListItem[];
    usecase: DynamicListItem[];
  }>({
    domain: [],
    version: [],
    usecase: [],
  });
  const [dynamicValue, setDyanmicValue] = useState({
    domain: "",
    version: "",
    usecaseId: "",
    subscriberUrl: "",
    npType: "BAP",
    env: "STAGING",
  });
  const formData = useRef({
    domain: "",
    version: "",
    usecaseId: "",
    subscriberUrl: "",
    npType: "BAP",
    env: "STAGING",
  });
  const { sessionId: contextSessionId, setSessionId } = useSession();
  const navigate = useNavigate();

  interface FormData {
    domain: string;
    version: string;
    usecaseId: string;
    subscriberUrl: string;
    npType: "BAP" | "BPP";
    env: string;
  }

  const onSubmit = async (data: FormData) => {
    try {
      data = {
        ...data,
        subscriberUrl: data?.subscriberUrl?.replace(/\/+$/, ""),
      };
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/sessions`, {
        ...data,
        difficulty_cache: {
          stopAfterFirstNack: true,
          timeValidations: true,
          protocolValidations: true,
          useGateway: true,
          headerValidaton: true,
          totalDifficulty: 100,
        },
      });
      setSubscriberUrl(data.subscriberUrl);

      sessionIdSupport.setScenarioSession(response.data.sessionId);
      setSession(response.data.sessionId);
      setSessionId(response.data.sessionId);
      setFlowStepNum(1);
    } catch (e) {
      toast.error("Error while creating session");
      console.error("error while sending response", e);
    }
  };
  const fetchFlows = async (data: { domain: string; version: string; usecaseId: string }) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/config/flows`, {
        params: {
          domain: data.domain,
          version: data.version,
          usecase: data.usecaseId,
          options: ["WORKBENCH"],
        },
      });
      setFlows(response.data.data.flows);
    } catch (e) {
      console.error("error while fetching flows", e);
    }
  };

  const onSubmitHandler = async (data: {
    domain: string;
    version: string;
    usecaseId: string;
    subscriberUrl: string;
    npType: string;
    env: string;
    config?: string;
  }) => {
    trackEvent({
      category: "SCHEMA_VALIDATION-FORM",
      action: "Form submitted",
    });
    setIsFormSubmitted(true);
    await fetchFlows(data);
    await onSubmit(data as FormData);
  };

  const fetchFormFieldData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/config/senarioFormData`
      );
      setDynamicList((prev) => {
        return { ...prev, domain: response.data.domain || [] };
      });
    } catch (e) {
      console.error("error while fetching form field data", e);
    }
  };

  useEffect(() => {
    fetchFormFieldData();
  }, []);

  const fetchSessionData = useCallback(
    (sessId: string) => {
      axios
        .get(`${import.meta.env.VITE_BACKEND_URL}/sessions`, {
          params: {
            session_id: sessId,
          },
        })
        .then(
          (response: {
            data: {
              flowConfigs?: Record<string, unknown>;
              subscriberUrl?: string;
              activeStep?: number;
            };
          }) => {
            if (response.data.flowConfigs) {
              setFlows(Object.values(response.data.flowConfigs) as Flow[]);
            }
            if (response.data.subscriberUrl) {
              setSubscriberUrl(response.data.subscriberUrl);
            }
            setSession(sessId);

            if (response.data.activeStep !== undefined) {
              setFlowStepNum(response.data.activeStep);
            }
          }
        )
        .catch((e: unknown) => {
          console.error("Error while fetching session: ", e);
        });
    },
    [setFlows, setSubscriberUrl, setSession, setFlowStepNum]
  );

  const newSession = () => {
    formData.current = {
      domain: "",
      version: "",
      usecaseId: "",
      subscriberUrl: "",
      npType: "BAP",
      env: "STAGING",
    };
    setFlowStepNum(0);
  };

  useEffect(() => {
    if (contextSessionId && !isFormSubmitted) {
      fetchSessionData(contextSessionId);
    }
  }, [contextSessionId, isFormSubmitted, fetchSessionData]);

  // useEffect(() => {
  // 	setFlowStepNum(0);
  // 	setIsFormSubmitted(false);
  // }, [type]);

  useEffect(() => {
    if (session) {
      putCacheData({ activeStep: flowStepNum }, session);
    }
  }, [flowStepNum, session]);

  const Body = () => {
    switch (flowStepNum) {
      case 0:
        return (
          <div className="flex flex-1 w-full">
            <div className="sm:w-[60%] p-2 bg-white rounded-sm border">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  {/* Left side: heading + optional beta tag */}
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold mb-2">{"Scenario testing"}</h1>
                  </div>

                  <button
                    onClick={() => navigate(ROUTES.HISTORY)}
                    className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition shadow-sm"
                  >
                    <LuHistory className="w-6 h-6 text-white" />
                    <span className="font-medium text-lg">Past Sessions</span>
                  </button>
                </div>
                <p className="text-gray-600 text-sm">
                  Please fill in the details below to begin flow testing.
                </p>
              </div>
              <InitialFlowForm
                formData={formData}
                onSubmitHandler={onSubmitHandler}
                dynamicList={dynamicList}
                setDyanmicValue={setDyanmicValue}
                dynamicValue={dynamicValue}
                setDynamicList={setDynamicList}
              />
            </div>
            <div className="w-full sm:w-[40%] ml-1">
              <FormGuide />
            </div>
          </div>
        );
      case 1:
        if (!flows) return <h1>Loading...</h1>;
        return (
          <RenderFlows
            flows={flows}
            subUrl={subscriberUrl}
            sessionId={session}
            // setStep={setFlowStepNum}
            // setReport={setReport}
            newSession={newSession}
          />
        );
      case 2:
        if (!session) return <h1>Loading...</h1>;
        return <ReportPage sessionId={session} report={report} setStep={setFlowStepNum} />;
      default:
        return <NotFound />;
    }
  };
  return (
    <>
      <div className="w-full items-center">
        <div className="p-2 mt-2">
          <Body />
        </div>
      </div>
    </>
  );
}
