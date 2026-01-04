import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import Markdown from "react-markdown";
import axios from "axios";
import { toast } from "react-toastify";
import { fetchFormFieldData } from "@utils/request-utils";
import { trackEvent } from "@utils/analytics";

const INSTRUCTION = [
  `1. Paste/ Upload Your API Payload`,
  `2. Based on the payload pasted, the tool takes the domain and the version for testing compliance`,
  `3. Click “Validate” to check for errors in API schema, data types, required fields and enums`,
  `4. Review errors on missing or incorrect fields and fix issues`,
  "5. Copy corrected payload as required",
];

const SchemaValidation = () => {
  const [payload, setPayload] = useState("");
  const [_responseValue, setResponseValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mdData, setMdData] = useState("");
  const [isSuccessReponse, setIsSuccessResponse] = useState(true);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const [activeDomain, setActiveDomain] = useState({});
  // const [isModified, setIsModified] = useState(false);

  // Load payload from localStorage on component mount
  useEffect(() => {
    const savedPayload = localStorage.getItem("schema-validation-payload");
    if (savedPayload) {
      setPayload(savedPayload);
    }
  }, []);

  // Save payload to localStorage whenever it changes
  const handlePayloadChange = (value: string | undefined) => {
    const newPayload = value || "";
    setPayload(newPayload);
    localStorage.setItem("schema-validation-payload", newPayload);
  };
  const verifyRequest = async () => {
    trackEvent({
      category: "SCHEMA_VALITION",
      action: "Clicked validate",
    });

    if (payload === "") {
      toast.warn("Add payload for the request");
      return;
    }

    let parsedPayload: any;

    try {
      parsedPayload = JSON.parse(payload);
      if (Array.isArray(parsedPayload)) {
        toast.warn("Array of payloads not supported");
        return;
      }
    } catch (e) {
      console.error("error while parsing ", e);
      toast.error("Invalid payload");
      return;
    }

    const action = parsedPayload?.context?.action;

    if (!action) {
      toast.warn("action missing from context");

      return;
    }

    let isDomainActive = false;

    Object.entries(activeDomain).map((data: any) => {
      const [_key, domains] = data;

      domains.forEach((domain: any) => {
        if (domain.key === parsedPayload?.context?.domain) {
          domain.version.forEach((ver: any) => {
            if (ver.key === (parsedPayload?.context?.version || parsedPayload?.context?.core_version)) {
              isDomainActive = true;
            }
          });
        }
      });
    });

    if (!isDomainActive) {
      toast.warn("Domain or version not yet active. To check the list of active domain visit home page.");
      return;
    }

    setMdData("");
    setResponseValue("");

    try {
      setIsLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/flow/validate/${action}`, parsedPayload);
      setResponseValue(JSON.stringify(response.data, null, 2));
      setIsValidationOpen(true);
      setIsGuideOpen(false);
      if (response.data?.error?.message) {
        setMdData(response.data?.error?.message);
        setIsSuccessResponse(false);
      } else {
        setMdData("\n" + "**Schema validations passed!**" + "\n");
        setIsSuccessResponse(true);
      }
    } catch (e) {
      console.error(">>>>>", e);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const getFormFields = async () => {
    try {
      const data = await fetchFormFieldData();
      setActiveDomain(data as Record<string, any>);
    } catch (error) {
      console.error("Error fetching form fields:", error);
      setActiveDomain({});
    }
  };

  useEffect(() => {
    getFormFields();
  }, []);

  const handleEditorMount = (editor: any) => {
    const editorDomNode = editor.getDomNode();

    if (editorDomNode) {
      editorDomNode.addEventListener("paste", () => {
        trackEvent({
          category: "SCHEMA_VALIDATION",
          action: "Pasted content",
        });
      });
    }
  };

  return (
    <div className="h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Editor */}
        <div className="w-3/5 flex flex-col p-6 space-y-4">
          <div className="flex-1 bg-white border border-sky-100 shadow-sm flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-sky-50 to-sky-100/50 px-6 py-4 border-b border-sky-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Beckn JSON Payload</h2>
                <p className="text-sm text-sky-700 mt-1">Paste your JSON payload below for validation</p>
              </div>

              {/* Validate Button */}
              <button
                className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 
                       text-white font-semibold px-5 py-2 transition-all duration-300 
                       disabled:opacity-50 disabled:cursor-not-allowed min-w-32 shadow-md 
                       hover:shadow-lg transform hover:scale-105 active:scale-95"
                onClick={verifyRequest}
                disabled={payload === "" || isLoading}>
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 rounded-full border-white border-t-transparent animate-spin-slow"></div>
                    <span>Validating...</span>
                  </div>
                ) : (
                  "Validate"
                )}
              </button>
            </div>

            <div className="flex-1 min-h-0">
              <Editor
                theme="vs"
                height="100%"
                defaultLanguage="json"
                value={payload}
                onChange={handlePayloadChange}
                onMount={handleEditorMount}
                options={{
                  minimap: { enabled: false },
                  padding: { top: 16, bottom: 16 },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: "on",
                  formatOnPaste: true,
                  formatOnType: true,
                  scrollbar: {
                    vertical: "visible",
                    horizontal: "visible",
                    useShadows: false,
                    verticalHasArrows: false,
                    horizontalHasArrows: false,
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Instructions & Results */}
        <div className="w-2/5 flex flex-col p-6 space-y-4 overflow-hidden">
          {/* Instructions */}
          {isGuideOpen && !isValidationOpen && (
            <div className="bg-white border border-sky-100 shadow-sm flex flex-col overflow-hidden animate-fadeIn">
              <div className="bg-gradient-to-r from-sky-50 to-sky-100/50 px-6 py-4 border-b border-sky-100 flex-shrink-0">
                <h3 className="text-lg font-bold text-gray-900">How to Use</h3>
              </div>
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  {INSTRUCTION?.map((item: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 transform transition-all duration-300 hover:translate-x-1">
                      <div className="w-7 h-7 bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 hover:scale-110">
                        <span className="text-sky-700 text-sm font-bold">{index + 1}</span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{item.replace(/^\d+\.\s*/, "")}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Validation Results */}
          {isValidationOpen && (
            <div className="flex-1 bg-white border border-sky-100 shadow-sm flex flex-col overflow-hidden animate-slideIn">
              <div className="bg-gradient-to-r from-sky-50 to-sky-100/50 px-6 py-4 border-b border-sky-100 flex-shrink-0">
                <h3 className="text-lg font-bold text-gray-900">Validation Results</h3>
                {isSuccessReponse ? (
                  <div className="flex items-center space-x-2 mt-2 animate-fadeIn">
                    <div className="w-3 h-3 bg-green-500 animate-pulse"></div>
                    <span className="text-sm text-green-700 font-medium">Schema is valid</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 mt-2 animate-fadeIn">
                    <div className="w-3 h-3 bg-red-500 animate-pulse"></div>
                    <span className="text-sm text-red-700 font-medium">Validation errors found</span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100 custom-scrollbar min-h-0">
                <Markdown
                  components={{
                    a: ({ href, children }: any) => (
                      <a
                        href={href}
                        className="text-sky-600 underline hover:text-sky-700 transition-colors duration-200">
                        {children}
                      </a>
                    ),
                    blockquote: ({ children }: any) => (
                      <blockquote className="border-l-4 pl-1 pr-1 py-2 mr-2 italic text-gray-700">
                        {children}
                      </blockquote>
                    ),
                    ul: ({ children }: any) => <ul className="list-disc pl-6 space-y-2 mb-4">{children}</ul>,
                    li: ({ children }: any) => <li className="text-gray-700">{children}</li>,
                    code: ({ inline, children }: any) =>
                      inline ? (
                        <code className="bg-red-100 text-red-800 px-2 py-1 text-sm font-mono border border-red-200">
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-white text-black p-3 ml-2 overflow-x-auto border border-gray-700 custom-scrollbar">
                          <code className="font-mono">{children}</code>
                        </pre>
                      ),
                    p: ({ children }: any) => <p className="text-gray-700 mb-1 leading-relaxed">{children}</p>,
                    h3: ({ children }: any) => (
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">{children}</h3>
                    ),
                    h4: ({ children }: any) => (
                      <h4 className="text-base font-semibold text-gray-800 mb-2 mt-4">{children}</h4>
                    ),
                  }}>
                  {mdData}
                </Markdown>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isGuideOpen && !isValidationOpen && (
            <div className="flex-1 bg-white border border-sky-100 shadow-sm p-8 text-center flex flex-col justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Ready to Validate</h3>
              <p className="text-gray-500">Enter your JSON payload and click validate to see results here.</p>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
					@keyframes fadeIn {
						from { opacity: 0; transform: translateY(10px); }
						to { opacity: 1; transform: translateY(0); }
					}
					
					@keyframes slideIn {
						from { opacity: 0; transform: translateX(20px); }
						to { opacity: 1; transform: translateX(0); }
					}
					
					.animate-fadeIn {
						animation: fadeIn 0.5s ease-out;
					}
					
					.animate-slideIn {
						animation: slideIn 0.6s ease-out;
					}
					
					.custom-scrollbar {
						scrollbar-width: thin;
						scrollbar-color: #0ea5e9 #e2e8f0;
					}
					
					.custom-scrollbar::-webkit-scrollbar {
						width: 8px;
					}
					
					.custom-scrollbar::-webkit-scrollbar-track {
						background: #f1f5f9;
						border-radius: 4px;
					}
					
					.custom-scrollbar::-webkit-scrollbar-thumb {
						background: linear-gradient(to bottom, #0ea5e9, #0284c7);
						border-radius: 4px;
						transition: background 0.2s;
					}
					
					.custom-scrollbar::-webkit-scrollbar-thumb:hover {
						background: linear-gradient(to bottom, #0284c7, #0369a1);
					}

					.monaco-editor .scroll-decoration {
						box-shadow: none !important;
					}
				`}
      </style>
    </div>
  );
};

export default SchemaValidation;
