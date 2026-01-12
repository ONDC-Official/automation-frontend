import { useContext, useState, useMemo, useCallback } from "react";
import { Editor } from "@monaco-editor/react";
import MockRunner, { CodeValidator, getFunctionSchema } from "@ondc/automation-mock-runner";

import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";
import { PLAYGROUND_LEFT_TABS } from "@pages/protocol-playground/types";
import { DarkSkyBlueTheme } from "@pages/protocol-playground/ui/editor-themes";
import { CodeStatistics } from "@pages/protocol-playground/ui/extras/statistics";

export function LeftSideView(props: { width: string; activeApi?: string }) {
  const { width, activeApi } = props;
  const playgroundContext = useContext(PlaygroundContext);

  const stepData = playgroundContext.config?.steps.find((f) => f.action_id === activeApi);

  const [activeLeftTab, setActiveLeftTab] = useState<string>(PLAYGROUND_LEFT_TABS[0].id);
  const activeTabConfig = PLAYGROUND_LEFT_TABS.find((tab) => tab.id === activeLeftTab)!;

  // Get the current editor content
  const getEditorContent = useCallback(() => {
    if (!stepData) return "";
    const value = stepData.mock[activeTabConfig.property];
    if (typeof value === "string") {
      return MockRunner.decodeBase64(value);
    }
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }, [stepData, activeTabConfig.property]);

  // Calculate statistics and validation for JavaScript code
  const codeAnalysis = useMemo(() => {
    // Only calculate stats for JavaScript/code tabs, not JSON
    if (activeTabConfig.language !== "javascript") {
      return null;
    }

    const content = getEditorContent();
    if (!content || content.trim() === "") {
      return null;
    }

    try {
      // Get statistics
      const statistics = CodeValidator.getCodeStatistics(content);

      // Get validation warnings (if we have a schema for this property)
      let validation = null;
      const baseProperty = activeTabConfig.property;
      if (
        baseProperty === "generate" ||
        baseProperty === "validate" ||
        baseProperty === "requirements"
      ) {
        const property = baseProperty === "requirements" ? "meetsRequirements" : baseProperty;
        const schema = getFunctionSchema(property);
        if (schema) {
          validation = CodeValidator.validate(content, schema);
        }
      }

      return {
        statistics,
        validation,
      };
    } catch (error) {
      console.error("Error analyzing code:", error);
      return null;
    }
  }, [activeTabConfig.language, activeTabConfig.property, getEditorContent]);

  // Handle editor changes
  const handleEditorChange = (value: string | undefined) => {
    if (!value || !stepData || !playgroundContext.updateStepMock) return;
    playgroundContext.updateStepMock(stepData.action_id, activeTabConfig.property, value);
  };

  const handleEditorWillMount = (monaco: typeof import("monaco-editor")) => {
    monaco.editor.defineTheme(
      "dark-skyblue",
      DarkSkyBlueTheme as Parameters<typeof monaco.editor.defineTheme>[1]
    );
  };

  return (
    <div
      className={`border rounded-md ${width} flex flex-col overflow-hidden transition-all duration-500 ease-in-out`}
    >
      {/* Header with Tabs */}
      <div className="flex border-b bg-gray-50 items-center h-8">
        <div className="ml-auto flex overflow-auto">
          {PLAYGROUND_LEFT_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveLeftTab(tab.id)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeLeftTab === tab.id
                  ? "bg-white border-b-2 border-sky-500 text-sky-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {/* Statistics & Warnings Footer - Only show for JavaScript code */}
      {codeAnalysis && (
        <div className="px-4 py-2">
          <CodeStatistics
            statistics={codeAnalysis.statistics}
            validation={codeAnalysis.validation}
          />
        </div>
      )}
      {/* Editor - takes remaining space */}
      <div className="flex-1 p-2 overflow-hidden">
        <Editor
          key={`${activeApi}-${activeLeftTab}`}
          theme="dark-skyblue"
          beforeMount={handleEditorWillMount}
          height="100%"
          language={activeTabConfig.language}
          value={getEditorContent()}
          onChange={handleEditorChange}
          options={{
            padding: { top: 16, bottom: 16 },
            fontSize: 16,
            lineNumbers: "on",
            scrollBeyondLastLine: true,
            automaticLayout: true,
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
    </div>
  );
}
