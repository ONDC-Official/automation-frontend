import { useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import Markdown from "react-markdown";
import axios from "axios";
import { toast } from "react-toastify";
import { IoMdHelp } from "react-icons/io";
import Modal from "../components/modal";
import { buttonClass } from "../components/ui/forms/loading-button";
import Heading from "../components/ui/mini-components/ondc-gradient-text";
import { MdEdit } from "react-icons/md";
import FlowDetails from "../components/ui/mini-components/flow-details";
import { GrRefresh } from "react-icons/gr";
import FormSelect from "../components/ui/forms/form-select";
import { useForm } from "react-hook-form";
import ToggleButton from "../components/ui/mini-components/toggle-button";
import { v4 as uuidv4 } from "uuid";
import { getTransactionData, getCompletePayload } from "../utils/request-utils";

const INSTRUCTION = [
  `The unit testing tool helps NPs run isolated API pair tests to validate request-response pairs. Enter your details (NP Type, Subscriber Url, Domain, Version, Usecase) and get started. `,
  `For buyer network participants, the tool shall act as a seller app. Here NP shall be sending an API call from their side once the tool starts listening. Once the payload is received, NP can select a sample response and edit the same as required. Once ready, NP can send this payload and the API call will be sent to the provided URL. `,
  `For seller network participants, the tool shall act as a buyer app. Here NP can select an API to test and a sample payload is auto-loaded. The payload can be edited as required. Once ready, NP can send this payload and the API call will be sent to the provided URL. The NP can then respond with their API and the same will be rendered on the interface.`,
];

const ApiTesting = () => {
  const [payload, setPayload] = useState("");
  const [responseValue, setResponseValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mdData, setMdData] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdittable, setIsEdittable] = useState(true);
  const [defaultPayload, setDefaultPayload] = useState("");
  const [npType, setNpType] = useState("BAP");
  const [actions, setActions] = useState([]);
  const [subUrl, setSubUrl] = useState("");
  const [sessionData, setSessionData] = useState<any>({});
  const [cuurentTranscationId, setCurrentTransactionId] = useState("");
  const [selectedActionId, setSelectedActionId] = useState("");
  const [isAutomatedResponse, setIsAutomatedResponse] = useState(false);
  const [allActions, setAllActions] = useState([]);
  const [action, setAction] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [sessionIdState, setSessionIdState] = useState("");
  // const [currentTimestamp, setCurrentTimestamp] = useState("");
  const intervalRef = useRef<any>(null);
  const currentTimestamp = useRef("");
  const transactionIntervalRed = useRef<any>(null);

  const {
    register,
    formState: { errors },
  } = useForm();

  function fetchSessionData(sessionId: string) {
    if (!sessionId) {
      console.error("session Id not present");
      return;
    }

    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/sessions`, {
        params: {
          session_id: sessionId,
        },
      })
      .then(async (response: any) => {
        if (npType === "BAP") {
          const transactionId = response.data?.flowMap?.unit;
          setSessionData(response.data);
          console.log("trnasctionId::::::::::", transactionId);

          if (transactionId) {
            const transactionData = await getTransactionData(
              transactionId,
              subUrl
            );
            console.log("trnsactiondata", transactionData);

            let currentPayloadID = "";
            let currentApiData: any = {};

            transactionData?.apiList?.forEach((apiData) => {
              console.log(
                "conditions: ",
                !apiData.action.startsWith("on_"),
                new Date(currentTimestamp.current) <
                  new Date(apiData.timestamp),
                apiData.action,
                currentTimestamp.current,
                apiData.timestamp
              );
              console.log("Cuurent", currentTimestamp.current);
              console.log("apiTimestamp", apiData.timestamp);
              if (
                !apiData.action.startsWith("on_") &&
                new Date(currentTimestamp.current) < new Date(apiData.timestamp)
              ) {
                currentPayloadID = apiData.payloadId;
                currentApiData = apiData;
              }
            });

            if (!currentPayloadID) {
              return;
            }

            clearInterval(intervalRef.current);

            setActions([]);
            setPayload("");
            setIsSent(false);

            const completePayload = await getCompletePayload([
              currentPayloadID,
            ]);

            setResponseValue(
              JSON.stringify(completePayload[0].req || {}, null, 2)
            );

            if (currentApiData?.response?.error) {
              setMdData(currentApiData.response.error.message);
            } else {
              setMdData(
                "```\n" +
                  JSON.stringify(currentApiData.response.message, null, 2) +
                  "\n```"
              );
            }

            toast.info("Request recieved.");
            getAvailableActions(transactionId, sessionId);
            setCurrentTransactionId(transactionId);
          }
        }

        if (npType === "BPP") {
          const transactionId = response.data?.flowMap?.unit;

          clearInterval(intervalRef.current);

          transactionIntervalRed.current = setInterval(async () => {
            const transactionData = await getTransactionData(
              transactionId,
              subUrl
            );

            transactionData?.apiList?.map(async (payload: any) => {
              if (payload.action === `on_${action}`) {
                clearInterval(transactionIntervalRed.current);

                const completePayload = await getCompletePayload([
                  payload.payloadId,
                ]);

                setResponseValue(
                  JSON.stringify(completePayload[0].req || {}, null, 2)
                );
                if (payload?.response?.error) {
                  setMdData(payload.response.error.message);
                } else {
                  setMdData(
                    "```\n" +
                      JSON.stringify(payload.response.message, null, 2) +
                      "\n```"
                  );
                }
                toast.info("Request recieved.");
              }
            });
          }, 3000);
        }
      })
      .catch((e: any) => {
        console.log("something went wrong while fetching session: ", e);
        toast.error("Something went wrong while fetching session");
      });
  }

  const getAvailableActions = async (
    transcation_id: string,
    sessionId?: string
  ) => {
    console.log("session id:::::", sessionId, sessionData);
    try {
      toast.info("Getting available actions.");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/unit/safe-actions`,
        {
          params: {
            transaction_id: transcation_id,
            mock_type: npType === "BAP" ? "BPP" : "BAP",
            session_id: sessionId || sessionData?.sessionId,
          },
        }
      );

      setAllActions(response.data);
      const filteredActions: any = [];
      response.data.map((action: any) => {
        filteredActions.push(action.action_id);
      });

      setActions(filteredActions);
      toast.info("Select an action");
    } catch (e) {
      console.log("Error while getting actions", e);
      toast.error("Something went wrong while getting actions");
    }
  };

  const getPayload = async (
    action_id: string,
    session_id: string,
    filteredAction?: string
  ) => {
    console.log("sessionData", session_id, sessionData);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/unit/trigger/${
          filteredAction || action
        }`,
        {
          params: {
            transaction_id: cuurentTranscationId,
            subscriber_url: subUrl,
            action_id: action_id,
            session_id: session_id || sessionIdState,
          },
        }
      );

      const stringifiedPayload = JSON.stringify(response.data, null, 2);

      setPayload(stringifiedPayload);
      setDefaultPayload(stringifiedPayload);

      if (isAutomatedResponse) {
        console.log("automated respomnse");
        toast.info("Automated response.");
        sendPayload(stringifiedPayload, action_id);
      }
    } catch (e) {
      console.log("Error while creating unit session", e);
      toast.error("Something went wrong");
    }
  };

  const sendPayload = async (data?: any, action_id?: string) => {
    let body;
    try {
      body = {
        payload: JSON.parse(payload || data),
      };
    } catch (e) {
      console.log("Error parsing json");
      toast.error("Error parsing json.");
    }

    console.log("sessionData", sessionData);

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/unit/trigger/${action}`,
        body,
        {
          params: {
            transaction_id: cuurentTranscationId,
            subscriber_url: subUrl,
            action_id: selectedActionId || action_id,
            version: sessionData?.version,
            session_id: sessionData?.sessionId || sessionIdState,
            flow_id: "unit",
          },
        }
      );

      console.log("Response snet payload", response.data);
      toast.info("Response sent.");

      if (npType === "BPP") {
        setTimeout(() => {
          toast.info("Waiting for request");
        }, 500);
        intervalRef.current = setInterval(() => {
          fetchSessionData(sessionData?.sessionId);
        }, 3000);
      }
      setIsSent(true);
    } catch (e) {
      console.log("Error while creating unit session", e);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const onContinueHandler = () => {
    if (npType === "BAP") {
      setResponseValue("");
      setMdData("");
      currentTimestamp.current = new Date().toISOString();
      setTimeout(() => {
        toast.info("Waiting for request");
      }, 500);
      intervalRef.current = setInterval(() => {
        fetchSessionData(sessionIdState);
      }, 3000);
    } else {
      setActions([]);
      setPayload("");
      setIsSent(false);
      getAvailableActions(cuurentTranscationId, sessionData.sessionId);
    }
  };

  const filterActionsData = (data: string) => {
    let seletedAction = "";
    allActions.map((action: any) => {
      if (action.action_id === data) {
        setAction(action.action);
        seletedAction = action.action;
      }
    });
    return seletedAction;
  };

  return (
    <div
      className={`w-[100%] mt-1 shadow-md flex flex-col transition-all duration-300 overflow-y-scroll`}
    >
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h1 className="text-lg font-semibold text-gray-800">Instruction</h1>
        {INSTRUCTION?.map((item: string) => (
          <p className="text-sm text-gray-600">{item}</p>
        ))}
      </Modal>
      <FlowDetails
        getSubUrl={(data: string) => {
          setSubUrl(data);
          // setSessionId(sessionId)
        }}
        onNpChange={(data: string) => setNpType(data)}
        onGetActions={(sessionData: any) => {
          const tempTransactionId = uuidv4();
          setSessionData(sessionData);
          getAvailableActions(tempTransactionId, sessionData.sessionId);
          setCurrentTransactionId(tempTransactionId);
        }}
        onSetListning={(data: string, sessionData: any) => {
          // setCurrentTimestamp(new Date().toISOString());
          setSubUrl(data);
          setSessionIdState(sessionData.sessionId);
          currentTimestamp.current = new Date().toISOString();
          setTimeout(() => {
            toast.info("Waiting for request");
          }, 500);
          intervalRef.current = setInterval(() => {
            fetchSessionData(sessionData.sessionId);
          }, 3000);
        }}
      />
      <div className="w-[100%] flex flex-row">
        <div className="w-3/6 p-4 gap-4 flex flex-col">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-4">
              <h1 className="text-lg font-semibold text-gray-800">
                {npType === "BAP" ? "On Action" : "Action"}
              </h1>
              <div
                className="flex flex-row items-center cursor-pointer group"
                onClick={() => setIsModalOpen(true)}
              >
                <Heading className="text-sm transition-all duration-300 shadow-sm group-hover:text-blue-600">
                  help
                </Heading>
                <IoMdHelp className="text-sky-500 transition-all duration-300 shadow-sm group-hover:bg-blue-100 group-hover:text-blue-600" />
              </div>
            </div>
            {npType === "BAP" && (
              <ToggleButton
                toggleOffText={"Manual Response"}
                toggleOnText={"Auto Response"}
                onToggle={(data: boolean) => setIsAutomatedResponse(data)}
                initialValue={false}
              />
            )}
          </div>
          <div className="flex flex-col">
            <div className="bg-white p-4 rounded shadow-lg">
              <FormSelect
                label="APIs"
                name="actions"
                required={true}
                options={actions}
                disbaled={actions.length === 0}
                nonSelectedValue
                register={register}
                errors={errors}
                setSelectedValue={(data: any) => {
                  setSelectedActionId(data);
                  const filteredAction = filterActionsData(data);
                  getPayload(data, sessionData?.sessionId, filteredAction);
                }}
              />
            </div>
            <div className={`relative mt-4 flex`}>
              <div
                className={`absolute right-5 top-2 z-10 ${
                  !isEdittable ? "bg-blue-200" : "bg-gray-200"
                } p-2 rounded-md`}
                onClick={() => setIsEdittable(!isEdittable)}
              >
                <MdEdit />
              </div>
              <div
                className={`absolute right-5 top-12 z-10 bg-gray-200 p-2 rounded-md`}
                onClick={() => {
                  // setIsModified(false);
                  setPayload(defaultPayload);
                }}
              >
                <GrRefresh />
              </div>

              <div className="h-96 flex-1">
                <Editor
                  theme="vs"
                  // height={"54vh"}
                  defaultLanguage="json"
                  onChange={(value: any) => {
                    setPayload(value);
                  }}
                  value={payload}
                  options={{
                    minimap: { enabled: false },
                    readOnly: isEdittable,
                  }}
                />
              </div>
            </div>
            <div className="flex flex-row gap-4 mt-4">
              <button
                className={`${buttonClass} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={sendPayload}
                disabled={isLoading || isSent}
              >
                {isLoading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
        <div className="w-3/6 flex flex-col gap-4 my-4 ">
          <div className="flex flex-row justify-between">
            <h1 className="text-lg font-semibold text-gray-800">
              {npType === "BAP" ? "Action" : "On Action"}
            </h1>
          </div>
          <div className="h-[47%]">
            <Editor
              theme="vs"
              value={responseValue}
              defaultLanguage="json"
              options={{
                readOnly: true, // Makes the editor non-editable
                formatOnType: true, // Optional: Format as you type
                formatOnPaste: true,
                minimap: { enabled: false },
              }}
            />
          </div>
          <div className="h-[47%] p-3 border bg-white shadow-md overflow-y-scroll flex flex-wrap">
            <div className="pr-4">
              <Markdown
                className="break-words"
                components={{
                  a: ({ href, children }: any) => (
                    <a
                      href={href}
                      className="text-blue-500 underline hover:text-blue-700"
                    >
                      {children}
                    </a>
                  ),
                  ul: ({ children }: any) => (
                    <ul className="list-disc pl-5">{children}</ul>
                  ),
                  li: ({ children }: any) => (
                    <li className="mb-2">{children}</li>
                  ),
                  code: ({ inline, children }: any) =>
                    inline ? (
                      <code className="bg-gray-100 text-red-600 rounded px-1">
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto w-[500px]">
                        <code>{children}</code>
                      </pre>
                    ),
                }}
              >
                {mdData}
              </Markdown>
            </div>
          </div>
          <button
            className={`${buttonClass} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={onContinueHandler}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiTesting;
