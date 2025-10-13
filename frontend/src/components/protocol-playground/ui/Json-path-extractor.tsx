import { useState } from "react";
import { inputClass } from "../../ui/forms/inputClass";
import { MockPlaygroundConfigType } from "../mock-engine/types";
import { FaExclamationTriangle, FaPlus } from "react-icons/fa";

interface JsonNode {
  [key: string]: any;
}

enum SelectedType {
  SavedInfo = "saved_info",
  SaveData = "saveData",
}

export default function JsonPathSelector() {
  const [selectedCall, setSelectedCall] = useState("search-001");
  const [collapsedPaths, setCollapsedPaths] = useState<Record<string, boolean>>({});

  const [playgroundConfig, setPlayGroundConfig] =
    useState<MockPlaygroundConfigType>({
      meta: {
        domain: "ONDC:TRV14",
        version: "2.0.1",
      },
      transaction_data: {
        transaction_id: "123e4567-e89b-12d3-a456-426614174000",
        latest_timestamp: "2023-10-05T12:00:00Z",
        bap_id: "sample-bap-id",
        bap_uri: "https://bap.example.com",
        bpp_id: "sample-bpp-id",
        bpp_uri: "https://bpp.example.com",
      },
      contextFunc: `return {
		  domain: meta.domain,
		  action: meta.action,
		  location: {
		 	country: {
				code: "IND"
			} ,
			city: {
				code: meta.city
			}
		  },
		  version: "2.0.1",
		  timestamp: new Date().toISOString(),
		  transaction_id: meta.transaction_id,
		  message_id: meta.message_id,
		  bap_id: meta.bap_id,
		  bap_uri: meta.bap_uri,
		  bpp_id: meta.bpp_id,
		  bpp_uri: meta.bpp_uri,
	}`,
      steps: [
        {
          api: "search",
          action_id: "search-001",
          owner: "BAP",
          responseFor: null,
          unsolicited: false,
          description: "",
          mock: {
            generate: `
				console.log("Session Data in generateMock:", sessionData);
				return defaultPayload;
				`,
            validate: `return { valid: true, errors: [] };`,
            requirements: `{ return { valid: true }; }`,
            defaultPayload: `{"message": { "catalog": { "bpp/providers": [ { "id": "provider-1", "name": "Provider One", "items": [ { "id": "item-1", "name": "Item One", "price": { "currency": "INR", "value": "100.00" } } ] } ] } } }`,
            saveData: {},
            inputs: "{}",
          },
        },
        {
          api: "on_search",
          action_id: "on_search-001",
          owner: "BPP",
          responseFor: "search-001",
          unsolicited: false,
          description: "",
          mock: {
            generate: `function generateMock(defaultPayload, sessionData) {return defaultPayload;}`,
            validate: `function validateMock(requestPayload, sessionData) {return { valid: true, errors: [] };}`,
            requirements: `function getRequirements() { return { valid: true }; }`,
            defaultPayload: `{"message": { "catalog": { "bpp/providers": [ { "id": "provider-1", "name": "Provider One", "items": [ { "id": "item-1", "name": "Item One", "price": { "currency": "INR", "value": "100.00" } } ] } ] } } }`,
            saveData: {},
            inputs: JSON.stringify(
              {
                $schema: "http://json-schema.org/draft-07/schema#",
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    minLength: 5,
                    maxLength: 50,
                    description: "User's email address",
                  },
                  age: {
                    type: "integer",
                    minimum: 18,
                    maximum: 120,
                    description: "User's age",
                  },
                  password: {
                    type: "string",
                    minLength: 8,
                    pattern: "^(?=.*[A-Z])(?=.*[0-9]).+$",
                    description: "Must contain uppercase and number",
                  },
                  website: {
                    type: "string",
                    format: "uri",
                  },
                  country: {
                    type: "string",
                    enum: ["US", "UK", "CA", "AU"],
                  },
                },
                required: ["email", "password"],
                additionalProperties: false,
              },
              null,
              2
            ),
          },
        },
      ],
      transaction_history: [
        {
          action_id: "search-001",
          payload: {
            context: {
              domain: "nic2004:52110",
              country: "IND",
              city: "std:080",
              action: "search",
              core_version: "1.1.0",
              bap_id: "buyer-app.ondc.org",
              bap_uri: "https://buyer-app.ondc.org/protocol/v1",
              bpp_id: "sample-seller-app.ondc.org",
              bpp_uri: "https://sample-seller-app.ondc.org/protocol/v1",
              transaction_id: "b6f8e8e2-9f3d-4d3a-8a5f-1e2b3c4d5e6f",
              message_id: "123e4567-e89b-12d3-a456-426614174000",
              timestamp: "2023-10-01T12:00:00Z",
            },
            message: {
              order: {
                id: "order-123",
                state: "Pending",
                fulfillment: [
                  {
                    id: "F1",
                  },
                ],
                tags: [
                  {
                    code: "something",
                    list: [{ code: "something", value: "asdas" }],
                  },
                ],
              },
              catalog: {
                id: "I1",
              },
            },
          },
          saved_info: {},
        },
        {
          action_id: "on_search-001",
          payload: {
            context: {
              domain: "nic2004:52110",
              country: "IND",
              city: "std:080",
              action: "on_search",
              core_version: "1.1.0",
              bap_id: "buyer-app.ondc.org",
              bap_uri: "https://buyer-app.ondc.org/protocol/v1",
              bpp_id: "sample-seller-app.ondc.org",
              bpp_uri: "https://sample-seller-app.ondc.org/protocol/v1",
              transaction_id: "b6f8e8e2-9f3d-4d3a-8a5f-1e2b3c4d5e6f",
              message_id: "123e4567-e89b-12d3-a456-426614174000",
              timestamp: "2023-10-01T12:00:00Z",
            },
            message: {
              order: {
                id: "order-123",
                state: "Pending",
              },
            },
          },
          saved_info: {},
        },
      ],
    });
  const [showAlert, setShowAlert] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [alias, setAlias] = useState("");
  const [path, setPath] = useState("");
  const [error, setError] = useState("");

  const handleContinue = () => {
    console.log("Remove confirmed");
    setShowAlert(false);
    // Add your logic to remove saveData here
  };

  const handleCancel = () => {
    setShowAlert(false);
  };

  const handleKeyClick = (path: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const baseAlias = `payload_${key}`;

    const step = playgroundConfig.steps.find(
      (s) => s.action_id === selectedCall
    );

    // ✅ Check if path is already in saveData
    const saveData = step?.mock.saveData || {};
    if (Object.values(saveData).includes(path)) {
      console.log(
        "⚠️ This item is already saved in saveData and cannot be modified."
      );
      setShowAlert(true);
      return;
    }

    setPlayGroundConfig((prev) => {
      const index = prev.transaction_history.findIndex(
        (h) => h.action_id === selectedCall
      );
      if (index === -1) return prev;

      const updatedHistory = [...prev.transaction_history];
      const current = updatedHistory[index];

      // ✅ Ensure saved_info is an object
      const savedInfo =
        current.saved_info && typeof current.saved_info === "object"
          ? { ...current.saved_info }
          : {};

      // ✅ Check if path already exists — remove if it does
      const existingAlias = Object.keys(savedInfo).find(
        (alias) => savedInfo[alias] === path
      );

      if (existingAlias) {
        // Remove if the same path already exists
        delete savedInfo[existingAlias];
      } else {
        // ✅ Generate a unique alias if needed
        let alias = baseAlias;
        let counter = 1;
        while (savedInfo.hasOwnProperty(alias)) {
          alias = `${baseAlias}_${counter}`;
          counter++;
        }

        // Add the new alias → path mapping
        savedInfo[alias] = path;
      }

      updatedHistory[index] = {
        ...current,
        saved_info: savedInfo,
      };

      return { ...prev, transaction_history: updatedHistory };
    });
  };

  const isSelected = (
    path: string
  ): { status: boolean; type: SelectedType | null } => {
    const history = playgroundConfig.transaction_history.find(
      (history) => history.action_id === selectedCall
    );
    const step = playgroundConfig.steps.find(
      (s) => s.action_id === selectedCall
    );

    const savedInfo = history?.saved_info || {};
    const saveData = step?.mock.saveData || {};

    if (Object.values(savedInfo).includes(path)) {
      return { status: true, type: SelectedType.SavedInfo };
    } else if (Object.values(saveData).includes(path)) {
      return { status: true, type: SelectedType.SaveData };
    } else {
      return { status: false, type: null };
    }
  };

  const renderValue = (value: any, path: string, key: string) => {
    const isPrimitive =
      typeof value !== "object" || value === null || value === undefined;
    const selected = isSelected(path);

    if (isPrimitive) {
      let className = "cursor-pointer px-2 py-0.5 rounded transition-colors ";

      if (selected.status) {
        if (selected.type === SelectedType.SavedInfo) {
          // Temporary / unsaved selection
          className += "bg-gray-500/30 text-gray-200 font-semibold";
        } else if (selected.type === SelectedType.SaveData) {
          // Permanent / saved selection
          className += "bg-sky-500/30 text-sky-300 font-semibold";
        }
      } else {
        className += "hover:bg-sky-500/10";
      }

      return (
        <span
          onClick={(e) => handleKeyClick(path, key, e)}
          className={className}
        >
          {JSON.stringify(value)}
        </span>
      );
    }

    return null;
  };

  const renderJson = (
    obj: JsonNode,
    currentPath: string = "$",
    level: number = 0
  ): JSX.Element => {
    const indent = level * 24;

    return (
      <div>
        {Object.entries(obj).map(([key, value]) => {
          const newPath = `${currentPath}.${key}`;
          const isObject =
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value);
          const isArray = Array.isArray(value);
          const isKeySelected = isSelected(newPath);

          console.log("isKeySelecteD", isKeySelected);

          return (
            <div key={key} style={{ marginLeft: `${indent}px` }}>
              <div className="flex items-start py-1">
                <span
                  onClick={(e) =>
                    (isObject || isArray) && handleKeyClick(newPath, key, e)
                  }
                  className={`font-mono select-none transition-colors ${
                    isObject || isArray ? "cursor-pointer" : "cursor-default"
                  } ${
                    isKeySelected.status
                      ? isKeySelected.type === SelectedType.SaveData
                        ? "bg-sky-500/30 text-sky-300 font-semibold px-2 py-0.5 rounded"
                        : "bg-gray-500/30 text-gray-200 px-2 py-0.5 font-semibold"
                      : isObject || isArray
                        ? "text-sky-400 hover:bg-sky-500/10 px-2 py-0.5 rounded"
                        : "text-sky-400"
                  }`}
                >
                  "{key}":
                </span>
                <span className="ml-2">
                  {isObject && (
                    <span className="text-gray-400 font-mono">{"{"}</span>
                  )}
                  {isArray && (
                    <span className="text-gray-400 font-mono">{"["}</span>
                  )}
                  {!isObject && !isArray && renderValue(value, newPath, key)}
                </span>
              </div>

              {isObject && (
                <>
                  {renderJson(value, newPath, level + 1)}
                  <div
                    style={{ marginLeft: `${indent}px` }}
                    className="text-gray-400 font-mono"
                  >
                    {"}"}
                  </div>
                </>
              )}

              {isArray && (
                <>
                  {value.map((item: any, index: number) => {
                    const arrayPath = `${newPath}[${index}]`;
                    if (typeof item === "object" && item !== null) {
                      return (
                        <div key={index}>
                          {renderJson(item, arrayPath, level + 1)}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={index}
                        style={{ marginLeft: `${(level + 1) * 24}px` }}
                      >
                        {renderValue(item, arrayPath, `${key}_${index}`)}
                      </div>
                    );
                  })}
                  <div
                    style={{ marginLeft: `${indent}px` }}
                    className="text-gray-400 font-mono"
                  >
                    {"]"}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const removePath = (aliasToRemove: string) => {
    setPlayGroundConfig((prev) => {
      const index = prev.transaction_history.findIndex(
        (h) => h.action_id === selectedCall
      );
      if (index === -1) return prev;

      const updatedHistory = [...prev.transaction_history];
      const current = updatedHistory[index];

      const newSavedInfo = { ...current.saved_info };
      delete newSavedInfo[aliasToRemove];

      updatedHistory[index] = { ...current, saved_info: newSavedInfo };

      return { ...prev, transaction_history: updatedHistory };
    });
  };

  const payloadFromTranscationHistory = (action_id: string) => {
    const history = playgroundConfig.transaction_history.find(
      (h) => h.action_id === action_id
    );
    return history?.payload ?? {};
  };

  const handleSave = () => {
    setPlayGroundConfig((prev) => {
      // Clone transaction_history and steps for immutability
      const updatedHistory = [...prev.transaction_history];
      const updatedSteps = prev.steps.map((step) => ({ ...step }));

      // Find the history entry for selectedCall
      const historyIndex = updatedHistory.findIndex(
        (h) => h.action_id === selectedCall
      );

      if (historyIndex === -1) return prev;

      const history = updatedHistory[historyIndex];

      if (!history.saved_info || Object.keys(history.saved_info).length === 0) {
        return prev; // Nothing to save
      }

      // Find the corresponding step
      const stepIndex = updatedSteps.findIndex(
        (s) => s.action_id === selectedCall
      );
      if (stepIndex === -1) return prev;

      // Update the step's mock.saveData
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        mock: {
          ...updatedSteps[stepIndex].mock,
          saveData: {
            ...updatedSteps[stepIndex].mock.saveData,
            ...history.saved_info,
          },
        },
      };

      // Clear saved_info in transaction_history
      updatedHistory[historyIndex] = {
        ...history,
        saved_info: {},
      };

      return {
        ...prev,
        transaction_history: updatedHistory,
        steps: updatedSteps,
      };
    });
  };

  const handleRemoveSavedData = (aliasToRemove: string) => {
    setPlayGroundConfig((prev) => {
      const updatedSteps = prev.steps.map((step) => {
        if (step.action_id === selectedCall) {
          const newSaveData = { ...step.mock.saveData };
          delete newSaveData[aliasToRemove];
          return {
            ...step,
            mock: {
              ...step.mock,
              saveData: newSaveData,
            },
          };
        }
        return step;
      });

      return { ...prev, steps: updatedSteps };
    });
  };

  const validateJsonPath = (input: string) => {
    const jsonPathRegex = /^\$((\.[a-zA-Z_][\w]*)|(\[['"][^'"]+['"]\]))*$/;
    return jsonPathRegex.test(input);
  };

  const handleAdd = () => {
    if (!alias.trim()) return setError("Alias is required");
    if (!validateJsonPath(path)) return setError("Invalid JSON path format");

    onAdd(alias, path);
    setAlias("");
    setPath("");
    setShowInput(false);
    setError("");
  };

  const onAdd = (alias: string, path: string) => {
    setPlayGroundConfig((prev) => {
      // Find the index of the step for the selected action
      const stepIndex = prev.steps.findIndex(
        (s) => s.action_id === selectedCall
      );
      if (stepIndex === -1) return prev;

      const updatedSteps = [...prev.steps];
      const currentStep = updatedSteps[stepIndex];

      const saveData = currentStep.mock.saveData;

      // Add or update alias → path mapping
      saveData[alias] = path;

      // Update mock and step
      updatedSteps[stepIndex] = {
        ...currentStep,
        mock: {
          ...currentStep.mock,
          saveData,
        },
      };

      // Return the updated state
      return {
        ...prev,
        steps: updatedSteps,
      };
    });
  };

  const selectedHistory = playgroundConfig.transaction_history.find(
    (history) => history.action_id === selectedCall
  );

  const savedInfo = selectedHistory?.saved_info || {};
  const savedInfoLength = Object.keys(savedInfo).length;

  const saveData =
    playgroundConfig.steps.find((s) => s.action_id === selectedCall)?.mock
      .saveData || {};
  const saveDataLength = Object.keys(saveData).length;

  return (
    <div className="relative flex flex-col gap-4 h-full p-4">
      {/* Alert at the top */}
      {showAlert && (
        <div className="absolute bottom-20 right-8 w-full max-w-md z-50 flex items-start gap-4 p-4 rounded-lg bg-red-50 border border-red-300 shadow-lg">
          {/* Alert Icon */}
          <FaExclamationTriangle className="w-6 h-6 text-red-600 mt-1" />

          {/* Alert Text and Buttons */}
          <div className="flex-1">
            <p className="text-red-700 font-semibold mb-2">
              Are you sure you want to remove this saved data? Removing it will
              reset the transaction history from the call and ahead.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleContinue}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Continue
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="text-sm text-gray-400">Select a call</label>
        <select
          id="apiNameInput"
          className={inputClass}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setSelectedCall(e.target.value)
          }
        >
          {playgroundConfig.steps.map((step) => (
            <option key={step.action_id} value={step.action_id}>
              {step.action_id}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-1 bg-gray-900 text-gray-100 min-h-0 p-4">
        {/* Left side - JSON Viewer */}
        <div className="w-1/2 p-6 overflow-auto border-r border-gray-700">
          <div className="text-sm text-gray-400 mb-3">
            💡 Click on object keys (like "context") or primitive values
          </div>
          <div className="bg-gray-800 p-4 rounded-lg font-mono text-sm">
            <div className="text-gray-400">{"{"}</div>
            {renderJson(payloadFromTranscationHistory(selectedCall), "$", 1)}
            <div className="text-gray-400">{"}"}</div>
          </div>
        </div>

        {/* Right side - Selected Paths */}
        <div className="w-1/2 p-6 overflow-auto bg-gray-850">
          <div className="flex justify-between items-center">
            <h2 className="text-xl mb-0 font-bold text-sky-400">
              Save Data ({saveDataLength})
            </h2>
            <button
              onClick={() => setShowInput((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-3 bg-sky-500/20 text-sky-300 rounded hover:bg-sky-500/30 transition-colors"
            >
              <FaPlus className="text-sky-300" />
              Add Manually
            </button>
          </div>

          {showInput && (
            <div className="bg-gray-800 mt-4 p-4 rounded-lg border border-sky-500/30">
              <div className="flex flex-row gap-2 items-center">
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="Enter alias (e.g. userInfo)"
                  className="px-3 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:border-sky-500 outline-none"
                />
                :
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="Enter JSON path (e.g. $.context.city)"
                  className="px-3 w-full py-2 rounded bg-gray-900 text-white border border-gray-700 focus:border-sky-500 outline-none"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowInput(false);
                    setError("");
                  }}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {savedInfoLength + saveDataLength === 0 ? (
            <div className="text-gray-500 text-center mt-8">
              No paths selected. Click on any key or value in the JSON to add
              it.
            </div>
          ) : (
            <div className="space-y-2 mt-4">
              {Object.entries(
                playgroundConfig.steps.find((s) => s.action_id === selectedCall)
                  ?.mock.saveData || {}
              ).map(([alias, path]) => (
                <div
                  key={alias}
                  className="bg-gray-800 p-3 rounded-lg border border-sky-500/30 flex items-center justify-between group hover:border-sky-500/50 transition-colors"
                >
                  <div className="font-mono text-sm flex-1">
                    <span className="text-sky-300 font-semibold">{alias}</span>
                    <span className="text-gray-400 mx-2">:</span>
                    <span className="text-gray-300">{path}</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowAlert(true);
                      // handleRemoveSavedData(alias);
                    }}
                    className="ml-4 px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {savedInfoLength > 0 && (
                <div className="my-6 border-t border-gray-700" />
              )}
              {savedInfoLength > 0 && (
                <h2 className="text-xl font-bold mb-4 text-sky-400">
                  Tentative Save Data ({savedInfoLength})
                </h2>
              )}
              {Object.entries(savedInfo).map(([alias, path]) => (
                <div
                  key={alias}
                  className="bg-gray-800 p-3 rounded-lg border border-sky-500/30 flex items-center justify-between group hover:border-sky-500/50 transition-colors"
                >
                  <div className="font-mono text-sm flex-1">
                    <span className="text-sky-300 font-semibold">{alias}</span>
                    <span className="text-gray-400 mx-2">:</span>
                    <span className="text-gray-300">{path}</span>
                  </div>
                  <button
                    onClick={() => removePath(alias)}
                    className="ml-4 px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {savedInfoLength > 0 && (
            <div className="mt-6 flex flex row gap-4">
              <button
                onClick={() => {}}
                className="w-full px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleSave}
                className="w-full px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
