import { useEffect } from "react";
import { useContext, useState } from "react";
import { FiEdit, FiEye, FiTrash } from "react-icons/fi";
import { PlaygroundContext } from "../context/playground-context";

export interface handleAddParam {
  currPath: string;
  currAlias: string;
  oldAlias?: string;
}

const JsonPathInput = ({
  onView,
  onDelete,
  alias,
  path,
  selectedCall,
  error,
  setError,
  handleAdd,
}: {
  onView?: (path: string) => void;
  onDelete?: (aliasToDelete: string) => void;
  alias: string;
  path: any;
  selectedCall: string;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  handleAdd: (data: handleAddParam) => void;
}) => {
  const [isEdit, setIsEdit] = useState(false);
  const [newAlias, setNewAlisa] = useState(alias);
  const [newPath, setNewPath] = useState(path);

  useEffect(() => {
    setError("");
  }, []);

  const { config: playgroundConfig } = useContext(PlaygroundContext);

  const isAliasTaken = (alias: string): boolean => {
    if (!selectedCall) return false;

    // Find the history entry
    const history = playgroundConfig?.transaction_history.find(
      (h) => h.action_id === selectedCall
    );

    // Find the step
    const step = playgroundConfig?.steps.find(
      (s) => s.action_id === selectedCall
    );

    const savedInfo = history?.saved_info || {};
    const saveData = step?.mock.saveData || {};

    return savedInfo.hasOwnProperty(alias) || saveData.hasOwnProperty(alias);
  };

  if (isEdit) {
    return (
      //   <div className="bg-gray-800 mt-4 p-4 rounded-lg border border-sky-500/30">
      <div className="w-full">
        <div className="flex flex-row gap-2 items-center">
          <input
            type="text"
            value={newAlias}
            onChange={(e) => setNewAlisa(e.target.value)}
            placeholder="Enter alias (e.g. userInfo)"
            className="px-3 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:border-sky-500 outline-none"
          />
          :
          <input
            type="text"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            placeholder="Enter JSON path (e.g. $.context.city)"
            className="px-3 w-full py-2 rounded bg-gray-900 text-white border border-gray-700 focus:border-sky-500 outline-none"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              const status = isAliasTaken(newAlias);
              if (status) {
                setError(
                  `Alias "${newAlias}" already exists. Choose a different alias.`
                );
                return;
              }
              handleAdd({
                currAlias: newAlias,
                currPath: newPath,
                oldAlias: alias,
              });
              setIsEdit(false);
            }}
            className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => {
              //   setShowInput(false);
              setIsEdit(false);
              setError("");
            }}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group flex items-center justify-between w-full">
      <div className="font-mono text-sm flex-1">
        <span className="text-sky-300 font-semibold">{alias}</span>
        <span className="text-gray-400 mx-2">:</span>
        <span className="text-gray-300">{path}</span>
      </div>

      {/* Hover-visible button group */}
      <div className="absolute right-0 opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
        {/* View */}
        <button
          onClick={() => onView(path)}
          className="p-1.5 rounded bg-sky-500/20 text-sky-400 relative group/button"
        >
          <FiEye size={16} />
          <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] bg-gray-800 text-white px-2 py-0.5 rounded opacity-0 group-hover/button:opacity-100 transition-opacity">
            View
          </span>
        </button>

        {/* Edit */}
        <button
          onClick={() => setIsEdit(true)}
          className="p-1.5 rounded bg-yellow-500/20 text-yellow-400 relative group/button"
        >
          <FiEdit size={16} />
          <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] bg-gray-800 text-white px-2 py-0.5 rounded opacity-0 group-hover/button:opacity-100 transition-opacity">
            Edit
          </span>
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(alias)}
          className="p-1.5 rounded bg-red-500/20 text-red-400 relative group/button"
        >
          <FiTrash size={16} />
          <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] bg-gray-800 text-white px-2 py-0.5 rounded opacity-0 group-hover/button:opacity-100 transition-opacity">
            Delete
          </span>
        </button>
      </div>
    </div>
  );
};

export default JsonPathInput;
