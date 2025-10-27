import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Flow } from "../../types/flow-types";
import RenderFlows from "./render-flows";
import { toast } from "react-toastify";
import { ReportPage } from "./report";
import { FormGuide } from "./guides";
import InitialFlowForm from "./initial-form";
import NotFound from "../ui/not-found";
import EditFlows from "./edit-flows";
import { useSession } from "../../context/context";
import { putCacheData } from "../../utils/request-utils";
import { trackEvent } from "../../utils/analytics";

interface FlowContentProps {
  type: "SCENARIO" | "CUSTOM";
}

export default function FlowContent({ type }: FlowContentProps) {
  const [step, setStep] = useState(0);
  const [session, setSession] = useState<string>("");
  const [subUrl, setSubUrl] = useState<string>("");
  const [flows, setFlows] = useState<Flow[] | null>(null);
  const [report, setReport] = useState("");
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [dynamicList, setDynamicList] = useState<{
    domain: any[];
    version: any[];
    usecase: any[];
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
  const {
    sessionId: contextSessionId,
    setSessionId,
    cfSessionId: contextcfSessionId,
    setcfSessionId,
  } = useSession();

  const onSubmit = async (data: any) => {
    try {
      console.log("data", data);
      data = {
        ...data,
        subscriberUrl: data?.subscriberUrl?.replace(/\/+$/, ""),
      };
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/sessions`,
        {
          ...data,
          difficulty_cache: {
            stopAfterFirstNack: true,
            timeValidations: true,
            protocolValidations: true,
            useGateway: true,
            headerValidaton: true,
            totalDifficulty: 100,
          },
        }
      );
      setSubUrl(data.subscriberUrl);
      console.log("response", response.data);
      const localData =
        JSON.parse(localStorage.getItem("sessionIdForSupport") as string) || {};
      localStorage.setItem(
        "sessionIdForSupport",
        JSON.stringify({
          scenarioSession: response.data.sessionId,
          ...localData,
        })
      );
      setSession(response.data.sessionId);
      if (type === "SCENARIO") {
        setSessionId(response.data.sessionId);
      } else {
        setcfSessionId(response.data.sessionId);
      }
      if (type === "SCENARIO") {
        console.log("wokring get settng to 1");
        setStep(1);
      } else {
        setStep(3);
      }
    } catch (e) {
      toast.error("Error while creating session");
      console.error("error while sending response", e);
    }
  };
  const fetchFlows = async (data: any) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/config/flows`,
        {
          params: {
            domain: data.domain,
            version: data.version,
            usecase: data.usecaseId,
            options: ["WORKBENCH"],
          },
        }
      );
      setFlows(response.data.data.flows);
      console.log("flows", response.data);
    } catch (e) {
      console.log("error while fetching flows", e);
    }
  };

  const onSubmitHandler = async (data: any) => {
    trackEvent({
      category: "SCHEMA_VALIDATION-FORM",
      action: "Form submitted",
    })
    setIsFormSubmitted(true);
    await fetchFlows(data);
    await onSubmit(data);
  };

  const fetchFormFieldData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/config/senarioFormData`
      );
      setDynamicList((prev) => {
        return { ...prev, domain: response.data.domain || [] };
      });
      console.log("form field data", response.data);
    } catch (e) {
      console.log("error while fetching form field data", e);
    }
  };

  useEffect(() => {
    fetchFormFieldData();
  }, []);

  function fetchSessionData(sessId: string) {
    console.log("get got working");
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/sessions`, {
        params: {
          session_id: sessId,
        },
      })
      .then((response: any) => {
        console.log("get got working???");
        if (response.data.flowConfigs) {
          setFlows(Object.values(response.data.flowConfigs));
        }
        setSubUrl(response.data.subscriberUrl);
        setSession(sessId);
        console.log("Setting strep get got", response.data.activeStep);
        setStep(response.data.activeStep);
      })
      .catch((e: any) => {
        console.error("Error while fetching session: ", e);
      });
  }

  const newSession = () => {
    formData.current = {
      domain: "",
      version: "",
      usecaseId: "",
      subscriberUrl: "",
      npType: "BAP",
      env: "STAGING",
    };
    setStep(0);
  };

  useEffect(() => {
    if ((contextSessionId || contextcfSessionId) && !isFormSubmitted) {
      fetchSessionData(
        type === "SCENARIO" ? contextSessionId : contextcfSessionId
      );
    }
  }, [contextSessionId, contextcfSessionId, type, isFormSubmitted]);

  useEffect(() => {
    setStep(0);
    setIsFormSubmitted(false)
  }, [type]);

  useEffect(() => {
    if (session) {
      putCacheData({ activeStep: step }, session);
    }
  }, [step, session]);

  const Body = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-1 w-full">
            <div className="sm:w-[60%] p-2 bg-white rounded-sm border">
              <div className="mb-4">
                <div className="flex gap-2 items-center">
                  <h1 className="text-lg font-semibold mb-2">
                    {type === "SCENARIO" ? "Scenario testing" : "Custom Flow"}
                  </h1>
                  {type === "CUSTOM" && (
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200"
                      role="status"
                      aria-label="Beta release"
                    >
                      Beta release
                    </span>
                  )}
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
            subUrl={subUrl}
            sessionId={session}
            type={type}
            setStep={setStep}
            setReport={setReport}
            newSession={newSession}
          />
        );
      case 2:
        if (!session) return <h1>Loading...</h1>;
        return (
          <ReportPage sessionId={session} report={report} setStep={setStep} />
        );
      case 3:
        // if (!flows) return <h1>Loading...</h1>;
        return (
          <EditFlows
            subUrl={subUrl}
            sessionId={session}
            flows={flows}
            newSession={newSession}
            onNext={(flow: Flow) => {
              setFlows([flow]);
              setStep(1);
            }}
          />
        );
      default:
        return <NotFound />;
    }
  };
  return (
    <>
      <div className="w-full items-center">
        {/* <Stepper
					steps={[
						{
							icon: <TbFileInfo className=" text-2xl" />,
							label: "FILL DETAILS",
						},
						// {
						// 	icon: <PiSwordBold className=" text-2xl" />,
						// 	label: "SELECT DIFICULTY",
						// },
						{
							icon: <MdOutlineDomainVerification className=" text-2xl" />,
							label: "TEST FLOWS",
						},
						{
							icon: <HiOutlineDocumentReport className=" text-2xl" />,
							label: "VIEW REPORT",
						},
					]}
					currentStep={step}
				/> */}
        <div className="p-2 mt-2">
          <Body />
        </div>
      </div>
    </>
  );
}
