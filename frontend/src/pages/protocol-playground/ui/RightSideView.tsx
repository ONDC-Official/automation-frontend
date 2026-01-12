import { Editor, OnMount } from "@monaco-editor/react";
import MockRunner from "@ondc/automation-mock-runner";
import { PLAYGROUND_RIGHT_TABS, PlaygroundRightTabType } from "@pages/protocol-playground/types";
import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";
import SessionDataTab from "@pages/protocol-playground/ui/session-data-tab";
import { ExecutionResults } from "@pages/protocol-playground/ui/extras/terminal";
import OutputPayloadViewer from "@pages/protocol-playground/ui/extras/output-payload-viewer";
import { editorUtils } from "@pages/protocol-playground/utils/editor-utils";

export function RightSideView(props: {
  width: string;
  activeRightTab: PlaygroundRightTabType;
  setActiveRightTab: (tab: PlaygroundRightTabType) => void;
  activeApi: string | undefined;
}) {
  const { width, activeRightTab, setActiveRightTab } = props;

  return (
    <div
      className={`border rounded-md ${width} flex flex-col overflow-hidden transition-all duration-500 ease-in-out`}
    >
      <div className="flex border-b bg-gray-50 items-center h-8">
        {PLAYGROUND_RIGHT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveRightTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeRightTab === tab.id
                ? "bg-white border-b-2 border-sky-500 text-sky-600"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 p-4 overflow-auto max-h-[82vh]">
        <GetRightSideContent tabId={activeRightTab} actionId={props.activeApi} />
      </div>
    </div>
  );
}

function GetRightSideContent({ tabId, actionId }: { tabId: string; actionId: string | undefined }) {
  const playgroundContext = useContext(PlaygroundContext);
  const [sessionData, setSessionData] = useState<string>("");
  // const [savedMeta, setSaveMeta] = useState<Record<string, unknown>>({});
  const savedMetaRef = useRef<Record<string, { path: string; actionId: string }>>({}); // Add this ref

  const getSessionData = useCallback(async () => {
    try {
      if (!playgroundContext.config) {
        return JSON.stringify(
          {
            error: "No configuration available",
            timestamp: new Date().toISOString(),
          },
          null,
          2
        );
      }

      const currentIndex =
        playgroundContext.config?.steps.findIndex((step) => step.action_id === actionId) ?? 0;
      const mockRunner = new MockRunner(playgroundContext.config);
      const sessionData = await mockRunner.getSessionDataUpToStep(currentIndex);

      return JSON.stringify(sessionData, null, 2);
    } catch (error: unknown) {
      const currentIndex =
        playgroundContext.config?.steps.findIndex((step) => step.action_id === actionId) ?? 0;
      const errorInfo = {
        error: "Failed to generate session data",
        message:
          error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string"
            ? error.message
            : "Unknown error occurred",
        type:
          error && typeof error === "object" && "name" in error && typeof error.name === "string"
            ? error.name
            : "Error",
        step: currentIndex,
        actionId: actionId,
        timestamp: new Date().toISOString(),
      };

      try {
        return JSON.stringify(errorInfo, null, 2);
      } catch {
        // Fallback if even error serialization fails
        return JSON.stringify(
          {
            error: "Critical error - unable to serialize data",
            originalError: String(error),
            timestamp: new Date().toISOString(),
          },
          null,
          2
        );
      }
    }
  }, [playgroundContext.config, actionId]);

  useEffect(() => {
    if (tabId === "session" && actionId) {
      getSessionData().then((data) => {
        setSessionData(data);
      });
    }
  }, [tabId, actionId, getSessionData]);

  const handleOnMount: OnMount = (editor, monaco) => {
    const modelUri = editor.getModel()?.uri.toString();
    // check if hover provider is already registered
    interface WindowWithHoverProvider extends Window {
      __jsonHoverProviderDisposable?: { dispose: () => void };
    }

    if ((window as WindowWithHoverProvider).__jsonHoverProviderDisposable) {
      (window as WindowWithHoverProvider).__jsonHoverProviderDisposable?.dispose();
    }

    if (!monaco?.languages?.registerHoverProvider) return;
    const disposable = monaco.languages.registerHoverProvider("json", {
      provideHover: (
        model: {
          uri?: { toString: () => string };
          getWordAtPosition: (position: {
            lineNumber: number;
            column: number;
          }) => { word: string; startColumn: number; endColumn: number } | null;
          getValue: () => string;
        },
        position: { lineNumber: number; column: number }
      ) => {
        if (modelUri !== model?.uri?.toString()) {
          return null;
        }

        try {
          const word = model.getWordAtPosition(position);
          if (!word) return null;
          const jsonText = model.getValue();
          const jsonPath = editorUtils.getJsonPath(jsonText, position.lineNumber, position.column);
          const firstKey = jsonPath.split(".")[1].split("[")[0];
          // Use ref instead of state
          const currentSavedMeta = savedMetaRef.current;
          if (!currentSavedMeta || !firstKey || !(firstKey in currentSavedMeta)) {
            return null;
          }
          const metaInfo = currentSavedMeta[firstKey];
          return {
            range: new monaco.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn
            ),
            contents: [
              { value: `last modified at: **${metaInfo.actionId}**` },
              { value: `**from:** \`${metaInfo.path}\`` },
              { value: `ref: sessionData[${firstKey}]` },
            ],
          };
        } catch (e) {
          console.error("Error in hover provider:", e);
          return null;
        }
      },
    });

    // Save the disposable globally (or in React ref)
    (window as WindowWithHoverProvider).__jsonHoverProviderDisposable = disposable;
  };

  switch (tabId) {
    case "session":
      return (
        <Editor
          key={`${actionId}-${tabId}`}
          theme="dark-skyblue"
          onMount={handleOnMount}
          height="100%"
          language="json"
          value={sessionData}
          options={{
            padding: { top: 16, bottom: 16 },
            fontSize: 16,
            lineNumbers: "on",
            scrollBeyondLastLine: true,
            automaticLayout: true,
            formatOnPaste: true,
            formatOnType: true,
            readOnly: true,
          }}
        />
      );
    case "transaction":
      return <SessionDataTab />;
    case "terminal":
      return <ExecutionResults results={playgroundContext.activeTerminalData} />;
    case "output_payload": {
      const activePayload =
        playgroundContext.config?.transaction_history.find((h) => h.action_id === actionId)
          ?.payload ?? {};
      return <OutputPayloadViewer payload={activePayload} actionId={actionId} />;
    }
  }
  return <></>;
}
