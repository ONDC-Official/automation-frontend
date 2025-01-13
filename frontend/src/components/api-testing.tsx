import { useState } from "react";
import Editor from "@monaco-editor/react";
import Markdown from "react-markdown";
import axios from "axios";
import { toast } from "react-toastify";
import { IoMdHelp } from "react-icons/io";
import Modal from "./modal";
import { buttonClass } from "./ui/forms/loading-button";
import Heading from "./ui/mini-components/ondc-gradient-text";
import { MdEdit } from "react-icons/md";
import ToggleButton from "./ui/mini-components/toggle-button";
import FlowDetails from "./ui/mini-components/flow-details";
import { GrRefresh } from "react-icons/gr";
import Tabs from "./ui/mini-components/tabs";

interface IProps {
  isSidebarOpen: boolean;
}

const INSTRUCTION = [
  `1. Request can be made using just the payload to recieve response in sync or async mode`,
  `2. Async Mode: Ack or nack is returned as the response.
      Sync Mode: on_action payload is returned as response.`,
  `3. Request can be manual or custom`,
  `4. Manual: Paste any beckn payload in the request to reviceve the response.
      Custom: Select a particular domain, usecase and type to generate the request payload and recieve response`,
];

const ApiTesting = ({ isSidebarOpen }: IProps) => {
  const [payload, setPayload] = useState("");
  const [responseValue, setResponseValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mdData, setMdData] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isToggled, setIsToggled] = useState(false);
  const [isEdittable, setIsEdittable] = useState(true);
  const [defaultPayload, setDefaultPayload] = useState("");
  // const [isModified, setIsModified] = useState(false);

  const verifyRequest = async () => {
    if (payload === "") {
      toast.warn("Add payload for the request");
      return;
    }

    let parsedPayload;

    try {
      parsedPayload = JSON.parse(payload);
    } catch (e) {
      console.log("error while parsing ", e);
      toast.error("Invalid payload");
      return;
    }

    const action = parsedPayload?.context?.action;

    if (!action) {
      toast.warn("action missing from context");
      console.log("Action not available");
      return;
    }

    setMdData("");
    setResponseValue("");

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/flow/validate/${action}`,
        parsedPayload
      );
      setResponseValue(JSON.stringify(response.data, null, 2));
      if (response.data?.error?.message) {
        setMdData(response.data?.error?.message);
      } else {
        setMdData("```\n" + JSON.stringify(response.data, null, 2) + "\n```");
      }
    } catch (e) {
      console.log(">>>>>", e);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`fixed top-16 mt-1 h-full shadow-md flex flex-row transition-all duration-300 ${
        isSidebarOpen ? "w-4/5" : "w-11/12"
      } `}
    >
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h1 className="text-lg font-semibold text-gray-800">Instruction</h1>
        {INSTRUCTION?.map((item: string) => (
          <p className="text-sm text-gray-600">{item}</p>
        ))}
      </Modal>
      <div className="w-3/6 p-4 gap-4 flex flex-col">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-800">Request</h1>
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
          <ToggleButton
            toggleOffText="Manual"
            toggleOnText="Predefined"
            onToggle={(isToggle: boolean) => {
              setIsEdittable(false);
              setIsToggled(isToggle);
            }}
          />
        </div>

        <div className="flex flex-col">
          <div
            className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
              isToggled ? "max-h-40" : "max-h-0"
            }`}
          >
            <FlowDetails
              onLoadPayload={(data: any) => {
                {
                  setPayload(JSON.stringify(data, null, 2));
                  setDefaultPayload(JSON.stringify(data, null, 2));
                }
              }}
            />
          </div>
          <div className={`relative`}>
            {isToggled && (
              <div
                className={`absolute right-5 top-2 z-10 ${
                  isEdittable ? "bg-blue-200" : "bg-gray-200"
                } p-2 rounded-md`}
                onClick={() => setIsEdittable(!isEdittable)}
              >
                <MdEdit />
              </div>
            )}
            {isToggled && (
              <div
                className={`absolute right-5 top-12 z-10 bg-gray-200 p-2 rounded-md`}
                onClick={() => {
                  // setIsModified(false);
                  setPayload(defaultPayload);
                }}
              >
                <GrRefresh />
              </div>
            )}

            <Editor
              theme="vs"
              height={isToggled ? "54vh" : "70vh"}
              defaultLanguage="json"
              onChange={(value: any) => {
                // setIsModified(true);
                setPayload(value);
              }}
              value={payload}
              options={{
                minimap: { enabled: false },
                readOnly: isToggled && !isEdittable,
              }}
            />
          </div>
        </div>
        <div className="flex flex-row gap-4">
          <button className={`${buttonClass}`} onClick={() => setPayload("")}>
            Clear
          </button>
          <button
            className={`${buttonClass}`}
            onClick={verifyRequest}
            disabled={payload === ""}
          >
            {isLoading ? "Sending" : "Send"}
          </button>
        </div>
      </div>
      <div className="w-3/6 flex flex-col gap-4 my-4 ">
        <div className="flex flex-row justify-between">
          <h1 className="text-lg font-semibold text-gray-800">Response</h1>
          {/* <ToggleButton
            toggleOffText="Async Mode"
            toggleOnText="Sync Mode"
            onToggle={(isToggle: boolean) => {
              // setIsEdittable(false);
              // setIsToggled(isToggle);
            }}
          /> */}
          <Tabs option1="Sync" option2="Async" onSelectOption={() => {
            // handle selection
          }} />
        </div>
        <div className="h-2/5">
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
        <div className="h-2/5 p-3 border bg-white shadow-md overflow-y-scroll">
          <div className="pr-4">
            <Markdown
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
                li: ({ children }: any) => <li className="mb-2">{children}</li>,
                code: ({ inline, children }: any) =>
                  inline ? (
                    <code className="bg-gray-100 text-red-600 rounded px-1">
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                      <code>{children}</code>
                    </pre>
                  ),
              }}
            >
              {mdData}
            </Markdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTesting;
