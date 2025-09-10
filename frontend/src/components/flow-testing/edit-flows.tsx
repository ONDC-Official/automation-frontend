import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flow, SequenceStep } from "../../types/flow-types";
import InfoCard from "../ui/info-card";
// import DifficultyCards from "../ui/difficulty-cards";
import axios from "axios";
import { SessionCache } from "../../types/session-types";
import { SessionContext } from "../../context/context";
// import CircularProgress from "../ui/circular-cooldown";
import Modal from "../modal";
import FlowEditor from "./flow-editor/index";
import { FiX, FiSearch, FiPlus } from "react-icons/fi";

function EditFlows({
  subUrl,
  sessionId,
  flows,
  onNext,
}: {
  flows: any;
  subUrl: string;
  sessionId: string;
  onNext: (flow: Flow) => void;
}) {
  const [cacheSessionData, setCacheSessionData] = useState<SessionCache | null>(
    null
  );
  const apiCallFailCount = useRef(0);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [initialFlows, setInitialFlows] = useState<Flow[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [template, setTemplate] = useState<SequenceStep[]>([]);
  const [templateSelectionTrigger, setTemplateSelectionTrigger] = useState<boolean>(false)
  const navigate = useNavigate();

  const handleSelectTemplate = (currTemplate: Flow) => {
    console.log("Selected Template:", currTemplate);
    setTemplate(currTemplate.sequence);
    setTemplateSelectionTrigger(!templateSelectionTrigger)
  };

  useEffect(() => {
    fetchSessionData();
  }, [subUrl]);

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
        setCacheSessionData(response.data);
        apiCallFailCount.current = 0; // Reset fail count on successful fetch
      })
      .catch((e: any) => {
        console.error("Error while fetching session: ", e);
        apiCallFailCount.current = apiCallFailCount.current + 1;
      });
  }

  useEffect(() => {
    setInitialFlows(flows);
  }, []);

  console.log("initial Flows: ", initialFlows);

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        sessionData: cacheSessionData,
        activeFlowId: "",
        selectedTab: "Request",
        setRequestData: () => {},
        setResponseData: () => {},
      }}
    >
      <TemplatePickerModal
        templates={initialFlows}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectTemplate}
      />
      <Modal
        isOpen={isErrorModalOpen}
        onClose={() => {
          navigate("/home");
          setIsErrorModalOpen(false);
        }}
      >
        <h1 className="text-lg font-semibold text-gray-800">Alert</h1>
        <p className="text-sm text-gray-600">Sesson has expired.</p>
        <p className="text-sm text-gray-600">Check support to raise a query.</p>
      </Modal>
      <div className="w-full min-h-screen flex flex-col">
        <div className="space-y-2 pt-4 pr-4 pl-4">
          {cacheSessionData ? (
            <div className="flex gap-2 flex-col">
              <InfoCard
                title="Info"
                data={{
                  sessionId: sessionId,
                  subscriberUrl: subUrl,
                  activeFlow: "N/A",
                  subscriberType: cacheSessionData.npType,
                  domain: cacheSessionData.domain,
                  version: cacheSessionData.version,
                  env: cacheSessionData.env,
                  use_case: cacheSessionData.usecaseId,
                }}
                // children={
                //   <div className="w-full flex justify-between">
                //     <CircularProgress
                //       duration={5}
                //       id="flow-cool-down"
                //       loop={true}
                //       onComplete={async () => {
                //         if (apiCallFailCount.current < 5) {
                //           fetchSessionData();
                //         } else if (
                //           apiCallFailCount.current >= 5 &&
                //           !isErrorModalOpen
                //         ) {
                //           setIsErrorModalOpen(true);
                //           console.log("not calling the api");
                //         }
                //       }}
                //       // invisible={true}
                //       sqSize={16}
                //       strokeWidth={2}
                //     />
                //   </div>
                // }
              />
              {/* <DifficultyCards
                difficulty_cache={difficultyCache}
                sessionId={sessionId}
              /> */}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-sky-100 p-6">
              <style>
                {`
									@keyframes shimmer {
										0% { background-position: -200px 0; }
										100% { background-position: calc(200px + 100%) 0; }
									}
									.skeleton {
										background: linear-gradient(90deg, #e0f2fe 25%, #b3e5fc 50%, #e0f2fe 75%);
										background-size: 200px 100%;
										animation: shimmer 1.5s infinite;
									}
								`}
              </style>
              <div className="space-y-4">
                {/* Content skeleton */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-3 rounded skeleton"></div>
                    <div className="h-3 rounded w-4/5 skeleton"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 rounded skeleton"></div>
                    <div className="h-3 rounded w-3/5 skeleton"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className=" mt-2 ml-4 inline-flex max-w-fit items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors"
          aria-label="Add a template"
        >
          <FiPlus className="text-lg" />
          <span>Add a template</span>
        </button>

        {/* Main Content Area */}
        <FlowEditor
          sessionId={sessionId}
          onNext={onNext}
          template={template}
          sessionData={cacheSessionData}
          templateSelectionTrigger={templateSelectionTrigger}
        />
      </div>
    </SessionContext.Provider>
  );
}

// Accordion component for each flow

export default EditFlows;

interface TemplatePickerModalProps {
  templates: Flow[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Flow) => void;
}

function TemplatePickerModal({
  templates,
  isOpen,
  onClose,
  onSelect,
}: TemplatePickerModalProps) {
  const [query, setQuery] = useState("");

  if (!isOpen) return null;

  const filtered = templates.filter(
    (t) =>
      t.id.toLowerCase().includes(query.toLowerCase()) ||
      t.title?.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <FiX className="text-xl" />
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold mb-4">Select a Template</h2>

        {/* Search Bar */}
        <div className="flex items-center mb-4 border rounded-lg px-3 py-2">
          <FiSearch className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search templates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 outline-none bg-white"
          />
        </div>

        {/* Template List */}
        <div className="max-h-64 overflow-y-auto space-y-3">
          {filtered.length > 0 ? (
            filtered.map((template) => (
              <div
                key={template.id}
                className="border rounded-lg p-3 hover:bg-sky-50 cursor-pointer transition"
                onClick={() => {
                  onSelect(template);
                  onClose();
                }}
              >
                <h3 className="font-semibold text-sky-700">
                  {template.title || template.id}
                </h3>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No templates found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
