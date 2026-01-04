// components/ExecutionResults.tsx
import { ExecutionResult } from "@ondc/automation-mock-runner";
import { useState } from "react";
import {
  IoCheckmarkCircle,
  IoCloseCircle,
  IoChevronDown,
  IoChevronUp,
  IoTime,
  IoTerminal,
  IoWarning,
  IoBug,
  IoCodeSlash,
  IoAlertCircle,
} from "react-icons/io5";

interface ExecutionResultsProps {
  results: ExecutionResult[];
}

export function ExecutionResults({ results }: ExecutionResultsProps) {
  results = results.filter(r => r !== null && r !== undefined).reverse();

  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [expandedSections, setExpandedSections] = useState<{
    [key: number]: {
      result?: boolean;
      logs?: boolean;
      error?: boolean;
      validation?: boolean;
    };
  }>({});

  const toggleSection = (index: number, section: "result" | "logs" | "error" | "validation") => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [section]: !prev[index]?.[section],
      },
    }));
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatLogTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      // fractionalSecondDigits: 3,
    });
  };

  const getLogIcon = (type: "log" | "error" | "warn") => {
    switch (type) {
      case "error":
        return <IoCloseCircle className="text-red-400" />;
      case "warn":
        return <IoWarning className="text-yellow-400" />;
      default:
        return <IoTerminal className="text-sky-400" />;
    }
  };

  const getLogColor = (type: "log" | "error" | "warn") => {
    switch (type) {
      case "error":
        return "text-red-300";
      case "warn":
        return "text-yellow-300";
      default:
        return "text-gray-300";
    }
  };

  if (results.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center border border-gray-800">
        <IoTerminal className="text-gray-600 text-4xl mx-auto mb-3" />
        <p className="text-gray-400 text-sm">No execution results yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-auto h-full">
      {results.map((result, index) => {
        const isExpanded = expandedIndex === index;
        const sections = expandedSections[index] || {};

        return (
          <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition"
              onClick={() => setExpandedIndex(isExpanded ? null : index)}>
              <div className="flex items-center gap-3">
                {result.success ? (
                  <IoCheckmarkCircle className="text-green-500 text-xl flex-shrink-0" />
                ) : (
                  <IoCloseCircle className="text-red-500 text-xl flex-shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">Execution #{results.length - index}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        result.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                      {result.success ? "Success" : "Failed"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{formatTimestamp(result.timestamp)}</span>
                    {result.executionTime !== undefined && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <IoTime className="text-sky-500" />
                        {result.executionTime.toFixed(2)}ms
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {isExpanded ? (
                <IoChevronUp className="text-gray-400 text-lg" />
              ) : (
                <IoChevronDown className="text-gray-400 text-lg" />
              )}
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-200">
                {/* Result Section */}
                {result.result !== undefined && (
                  <div className="border-b border-gray-200">
                    <button
                      onClick={() => toggleSection(index, "result")}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition text-left">
                      <div className="flex items-center gap-2">
                        <IoCodeSlash className="text-sky-500" />
                        <span className="text-xs font-semibold text-gray-700">Result</span>
                      </div>
                      {sections.result ? (
                        <IoChevronUp className="text-gray-400 text-sm" />
                      ) : (
                        <IoChevronDown className="text-gray-400 text-sm" />
                      )}
                    </button>
                    {sections.result && (
                      <div className="bg-gray-900 p-3 max-h-96 overflow-auto">
                        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-words">
                          {JSON.stringify(result.result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Section */}
                {result.error && (
                  <div className="border-b border-gray-200">
                    <button
                      onClick={() => toggleSection(index, "error")}
                      className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 transition text-left">
                      <div className="flex items-center gap-2">
                        <IoBug className="text-red-500" />
                        <span className="text-xs font-semibold text-red-700">Error: {result.error.name}</span>
                      </div>
                      {sections.error ? (
                        <IoChevronUp className="text-red-400 text-sm" />
                      ) : (
                        <IoChevronDown className="text-red-400 text-sm" />
                      )}
                    </button>
                    {sections.error && (
                      <div className="bg-gray-900 p-3 max-h-96 overflow-auto">
                        <div className="text-xs space-y-2">
                          <div>
                            <span className="text-red-400 font-semibold">Message:</span>
                            <p className="text-red-300 mt-1 font-mono break-words">{result.error.message}</p>
                          </div>
                          {result.error.stack && (
                            <div>
                              <span className="text-red-400 font-semibold">Stack Trace:</span>
                              <pre className="text-gray-400 mt-1 font-mono whitespace-pre-wrap break-words text-xs">
                                {result.error.stack}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Logs Section */}
                {result.logs.length > 0 && (
                  <div className="border-b border-gray-200">
                    <button
                      onClick={() => toggleSection(index, "logs")}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition text-left">
                      <div className="flex items-center gap-2">
                        <IoTerminal className="text-sky-500" />
                        <span className="text-xs font-semibold text-gray-700">Console Logs ({result.logs.length})</span>
                      </div>
                      {sections.logs ? (
                        <IoChevronUp className="text-gray-400 text-sm" />
                      ) : (
                        <IoChevronDown className="text-gray-400 text-sm" />
                      )}
                    </button>
                    {sections.logs && (
                      <div className="bg-gray-900 p-3 max-h-64 overflow-y-auto">
                        <div className="space-y-1.5">
                          {result.logs.map((log, logIndex) => (
                            <div key={logIndex} className="flex items-start gap-2 text-xs font-mono">
                              <span className="text-gray-500 flex-shrink-0">{formatLogTimestamp(log.timestamp)}</span>
                              <span className="flex-shrink-0 mt-0.5">{getLogIcon(log.type)}</span>
                              <span className={`${getLogColor(log.type)} break-all`}>{log.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Validation Section */}
                {(!result.validation.isValid || result.validation.warnings.length > 0) && (
                  <div>
                    <button
                      onClick={() => toggleSection(index, "validation")}
                      className="w-full flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 transition text-left">
                      <div className="flex items-center gap-2">
                        <IoAlertCircle className="text-yellow-600" />
                        <span className="text-xs font-semibold text-yellow-800">
                          Validation Issues ({result.validation.errors.length + result.validation.warnings.length})
                        </span>
                      </div>
                      {sections.validation ? (
                        <IoChevronUp className="text-yellow-400 text-sm" />
                      ) : (
                        <IoChevronDown className="text-yellow-400 text-sm" />
                      )}
                    </button>
                    {sections.validation && (
                      <div className="p-3 bg-gray-50">
                        {result.validation.errors.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs font-semibold text-red-700 mb-1 block">Errors:</span>
                            <ul className="space-y-1">
                              {result.validation.errors.map((error, i) => (
                                <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                                  <IoCloseCircle className="flex-shrink-0 mt-0.5" />
                                  <span>{error}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {result.validation.warnings.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold text-yellow-700 mb-1 block">Warnings:</span>
                            <ul className="space-y-1">
                              {result.validation.warnings.map((warning, i) => (
                                <li key={i} className="text-xs text-yellow-600 flex items-start gap-1.5">
                                  <IoWarning className="flex-shrink-0 mt-0.5" />
                                  <span>{warning}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
