import { useState } from "react";
import Editor from "@monaco-editor/react";
import Markdown from "react-markdown";
import axios from "axios";
import { toast } from "react-toastify";
import { IoMdHelp } from "react-icons/io";
import Modal from "./modal";
import { buttonClass } from "./ui/forms/loading-button";
import Heading from "./ui/mini-components/ondc-gradient-text";

interface IProps {
  isSidebarOpen: boolean;
}

const INSTRUCTION = [
  `1. Lorem ipsum dolor sit amet consectetur adipisicing elit. Numquam
perferendis consequuntur nihil debitis facere incidunt itaque aliquid,`,
  `  2. vel excepturi aspernatur ratione id, natus dolore, quibusdam sint
autem odio dolores voluptate!`,
];

const ApiTesting = ({ isSidebarOpen }: IProps) => {
  const [payload, setPayload] = useState("");
  const [responseValue, setResponseValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mdData, setMdData] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const verifyRequest = async () => {
    if (payload === "") {
      toast.warn("Add payload for the request");
      return;
    }

    const parsedPayload = JSON.parse(payload);
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
      }`}
    >
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h1 className="text-lg font-semibold text-gray-800">Instruction</h1>
        {INSTRUCTION?.map((item: string) => (
          <p className="text-sm text-gray-600">{item}</p>
        ))}
      </Modal>
      <div className="w-3/5 p-4 gap-4 flex flex-col">
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
        <Editor
          theme="vs-dark"
          height="70vh"
          defaultLanguage="json"
          onChange={(value: any) => setPayload(value)}
        />
        <button
          className={`${buttonClass}`}
          onClick={verifyRequest}
          disabled={payload === ""}
        >
          {isLoading ? "Sending" : "Send"}
        </button>
      </div>
      <div className="w-2/5 flex flex-col gap-4 my-4 ">
        <h1 className="text-lg font-semibold text-gray-800">Response</h1>
        <div className="h-2/5">
          <Editor
            theme="vs-dark"
            value={responseValue}
            defaultLanguage="json"
            options={{
              readOnly: true, // Makes the editor non-editable
              formatOnType: true, // Optional: Format as you type
              formatOnPaste: true,
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
