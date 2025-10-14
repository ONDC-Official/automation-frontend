import { useContext, useState } from "react";
import jsonpath from "jsonpath";
import { inputClass } from "../../ui/forms/inputClass";
// import { MockPlaygroundConfigType } from "../mock-engine/types";
import { FaExclamationTriangle, FaPlus } from "react-icons/fa";
import { PlaygroundContext } from "../context/playground-context";
import { useEffect } from "react";
import JsonViewer from "./Json-path-extractor";
import JsonPathInput from "./json-path-input";
import { handleAddParam } from "./json-path-input";
import JsonPathOutputPopup from "./JsonPathOutputModal";

export enum SelectedType {
  SavedInfo = "saved_info",
  SaveData = "saveData",
}

export default function SessionDataTab() {
  const [selectedCall, setSelectedCall] = useState("");
  const {
    config: playgroundConfig,
    setCurrentConfig: setPlayGroundConfig,
    resetTransactionHistory,
  } = useContext(PlaygroundContext);
  const [showAlert, setShowAlert] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [alias, setAlias] = useState("");
  const [path, setPath] = useState("");
  const [error, setError] = useState("");
  const [isViewActive, setIsViewActive] = useState(false);
  const [viewPath, setViewPath] = useState("");

  useEffect(() => {
    const currentLength = playgroundConfig?.steps?.length || 0;

    if (!currentLength && currentLength < 2) {
      setSelectedCall("");
      return;
    }

    const secondLastActionId =
      playgroundConfig?.steps[currentLength - 2]?.action_id || "";
    console.log("cuurentLenght: ", currentLength, secondLastActionId);
    setSelectedCall(secondLastActionId);
  }, []);

  const handleContinue = () => {
    setPlayGroundConfig((prev) => {
      // Find the step matching the selected action_id
      const stepIndex = prev.steps.findIndex(
        (s) => s.action_id === selectedCall
      );
      if (stepIndex === -1) return prev;

      const updatedSteps = [...prev.steps];
      const currentStep = updatedSteps[stepIndex];

      // Clone saveData safely
      const updatedSaveData = { ...currentStep.mock.saveData };

      // Remove the alias if it exists
      delete updatedSaveData[alias];

      // Update step and return new config
      updatedSteps[stepIndex] = {
        ...currentStep,
        mock: {
          ...currentStep.mock,
          saveData: updatedSaveData,
        },
      };

      return { ...prev, steps: updatedSteps };
    });
    setShowAlert(false);
    setAlias("");
    // Add your logic to remove saveData here
  };

  const handleCancel = () => {
    setShowAlert(false);
  };

  const handleKeyClick = (path: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const baseAlias = `payload_${key}`;

    const step = playgroundConfig?.steps?.find(
      (s) => s.action_id === selectedCall
    );

    // ✅ Check if path is already in saveData
    const saveData = step?.mock.saveData || {};
    const existingAlias = Object.keys(saveData).find(
      (alias) => saveData[alias] === path
    );

    if (existingAlias) {
      console.log(
        `⚠️ This item (alias: ${existingAlias}) is already saved in saveData and cannot be modified.`
      );
      setAlias(existingAlias);
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

      // ✅ Find the corresponding step to access saveData
      const step = prev.steps.find((s) => s.action_id === selectedCall);
      const saveData = step?.mock.saveData || {};

      // ✅ Check if path already exists — remove if it does
      const existingAlias = Object.keys(savedInfo).find(
        (alias) => savedInfo[alias] === path
      );

      if (existingAlias) {
        // Remove if the same path already exists
        delete savedInfo[existingAlias];
      } else {
        // ✅ Generate a unique alias not present in saved_info or saveData
        let alias = baseAlias;
        let counter = 1;
        while (
          savedInfo.hasOwnProperty(alias) ||
          saveData.hasOwnProperty(alias)
        ) {
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

  const payloadFromTranscationHistory = (action_id: string) => {
    const history = playgroundConfig.transaction_history.find(
      (h) => h.action_id === action_id
    );
    return history?.payload ?? {};
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

  const editSavedInfo = (
    oldAlias: string,
    newAlias: string,
    newPath: string
  ) => {
    setPlayGroundConfig((prev) => {
      // 🔹 Find the history entry for the selected call
      const index = prev.transaction_history.findIndex(
        (h) => h.action_id === selectedCall
      );
      if (index === -1) return prev;

      const updatedHistory = [...prev.transaction_history];
      const current = updatedHistory[index];

      // Ensure saved_info exists
      const savedInfo = { ...(current.saved_info || {}) };

      // 🔹 If the alias doesn’t exist, do nothing
      if (!savedInfo.hasOwnProperty(oldAlias)) {
        console.warn(`Alias "${oldAlias}" not found in saved_info`);
        return prev;
      }

      // 🔹 Check if the new alias already exists (and is not the same as oldAlias)
      if (newAlias !== oldAlias && savedInfo.hasOwnProperty(newAlias)) {
        console.warn(
          `Alias "${newAlias}" already exists. Choose a different alias.`
        );
        return prev;
      }

      // 🔹 Delete the old alias if it's being renamed
      if (oldAlias !== newAlias) {
        delete savedInfo[oldAlias];
      }

      // 🔹 Update (or create) the new alias → path mapping
      savedInfo[newAlias] = newPath;

      // 🔹 Update transaction history immutably
      updatedHistory[index] = {
        ...current,
        saved_info: savedInfo,
      };

      return { ...prev, transaction_history: updatedHistory };
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

  const handleAdd = ({
    currAlias,
    currPath,
    oldAlias,
  }: {
    currAlias?: string;
    currPath?: string;
    oldAlias?: string;
  }) => {
    const finalAlias = (currAlias || alias).trim();
    const finalPath = (currPath || path).trim();

    if (!finalAlias) return setError("Alias is required");

    try {
      jsonpath.query(payloadFromTranscationHistory(selectedCall), finalPath);
    } catch (err) {
      setError("Invalid JSONPath format");
      console.error("❌ JSONPath validation failed:", err);
      return;
    }

    onAdd(finalAlias, finalPath, oldAlias);
    setAlias("");
    setPath("");
    setShowInput(false);
    setError("");
  };

  const onAdd = (alias: string, path: string, oldAlias?: string) => {
    setPlayGroundConfig((prev) => {
      const stepIndex = prev.steps.findIndex(
        (s) => s.action_id === selectedCall
      );
      if (stepIndex === -1) return prev;

      const updatedSteps = [...prev.steps];
      const currentStep = updatedSteps[stepIndex];
      const saveData = { ...currentStep.mock.saveData }; // clone

      // 🧠 Determine if we're editing or adding
      const isEditing = oldAlias && oldAlias in saveData;

      // 🧩 Prevent duplicate paths under different aliases
      const duplicatePathEntry = Object.entries(saveData).find(
        ([existingAlias, existingPath]) =>
          existingPath === path && existingAlias !== (oldAlias || alias)
      );

      if (duplicatePathEntry) {
        console.warn(
          `⚠️ This path is already assigned to alias "${duplicatePathEntry[0]}".`
        );
        return prev;
      }

      if (isEditing) {
        // 📝 Editing existing entry
        if (oldAlias !== alias) {
          // Alias changed → delete old key
          delete saveData[oldAlias];
        }

        // Update alias → path
        saveData[alias] = path;

        console.log(
          `✏️ Updated entry: ${oldAlias !== alias ? `renamed to "${alias}"` : `"${alias}"`} with path "${path}".`
        );
      } else {
        // ➕ Adding new entry
        saveData[alias] = path;
        console.log(`✅ Added new alias "${alias}" → "${path}".`);
      }

      // 💾 Update step
      updatedSteps[stepIndex] = {
        ...currentStep,
        mock: {
          ...currentStep.mock,
          saveData,
        },
      };

      return { ...prev, steps: updatedSteps };
    });
  };

  const selectedHistory = playgroundConfig?.transaction_history.find(
    (history) => history.action_id === selectedCall
  );

  const savedInfo = selectedHistory?.saved_info || {};
  const savedInfoLength = Object.keys(savedInfo).length;

  const saveData =
    playgroundConfig?.steps.find((s) => s.action_id === selectedCall)?.mock
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

      {isViewActive && (
        <JsonPathOutputPopup
          jsonPath={viewPath}
          output={jsonpath.query(
            payloadFromTranscationHistory(selectedCall),
            viewPath
          )}
          onClose={() => setIsViewActive(false)}
        />
      )}

      <div>
        <label className="text-sm text-gray-400">Select a call</label>
        <select
          id="apiNameInput"
          className={inputClass}
          value={selectedCall}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setSelectedCall(e.target.value)
          }
        >
          {playgroundConfig?.steps?.length > 1 &&
            playgroundConfig?.steps
              .slice(0, playgroundConfig.steps.length - 1) // skip last element
              .map((step) => (
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
            <JsonViewer
              data={payloadFromTranscationHistory(selectedCall)}
              isSelected={isSelected}
              handleKeyClick={handleKeyClick}
            />
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
              onClick={() => {
                setError("");
                setShowInput((prev) => !prev);
              }}
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
                  <JsonPathInput
                    onDelete={(aliasToDelete: string) => {
                      setShowAlert(true);
                      setAlias(aliasToDelete);
                      // handleRemoveSavedData(alias)
                    }}
                    alias={alias}
                    path={path}
                    selectedCall={selectedCall}
                    error={error}
                    setError={setError}
                    handleAdd={handleAdd}
                    onView={(path: string) => {
                      setIsViewActive(true);
                      setViewPath(path);
                    }}
                  />
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
                  <JsonPathInput
                    onDelete={() => {
                      removePath(alias);
                    }}
                    alias={alias}
                    path={path}
                    selectedCall={selectedCall}
                    error={error}
                    setError={setError}
                    handleAdd={({
                      oldAlias,
                      currAlias,
                      currPath,
                    }: handleAddParam) =>
                      editSavedInfo(oldAlias || "", currAlias, currPath)
                    }
                    onView={(path: string) => {
                      setIsViewActive(true);
                      setViewPath(path);
                    }}
                  />
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
