import { useEffect, useState } from "react";
import { FiEdit, FiEye, FiTrash } from "react-icons/fi";
import { Button } from "@/components/Shadcn/Button/button";
import { Input } from "@/components/Shadcn/TextField/input";

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
    error,
    setError,
    handleAdd,
}: {
    onView: (path: string) => void;
    onDelete: (aliasToDelete: string) => void;
    alias: string;
    path: string;
    error: string;
    setError: React.Dispatch<React.SetStateAction<string>>;
    handleAdd: (data: handleAddParam) => void;
}) => {
    const [isEdit, setIsEdit] = useState(false);
    const [newAlias, setNewAlisa] = useState(alias);
    const [newPath, setNewPath] = useState(path);

    useEffect(() => {
        setError("");
    }, [setError]);

    if (isEdit) {
        return (
            //   <div className="bg-gray-800 mt-4 p-4 rounded-lg border border-sky-500/30">
            <div className="w-full">
                <div className="flex flex-col gap-2 items-center">
                    <Input
                        type="text"
                        value={newAlias}
                        onChange={(e) => setNewAlisa(e.target.value)}
                        placeholder="Enter alias (e.g. userInfo)"
                        className="rounded bg-gray-900 text-white border-gray-700 focus-visible:border-sky-500"
                    />
                    :
                    <Input
                        type="text"
                        value={newPath}
                        onChange={(e) => setNewPath(e.target.value)}
                        placeholder="Enter JSON path (e.g. $.context.city)"
                        className="w-full rounded bg-gray-900 text-white border-gray-700 focus-visible:border-sky-500"
                    />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div className="flex gap-2 mt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
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
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            //   setShowInput(false);
                            setIsEdit(false);
                            setError("");
                        }}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative group flex items-start justify-between w-full">
            <div className="font-mono text-sm flex-1 min-w-0 pr-2">
                <div>
                    <span className="text-sky-300 font-semibold">{alias}</span>
                    <span className="text-gray-400">:</span>
                </div>
                <div className="text-gray-300 break-all ml-2 mt-1">{path}</div>
            </div>

            {/* Hover-visible button group */}
            <div className="absolute right-0 opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                {/* View */}
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onView(path)}
                    className="h-auto rounded p-1.5 bg-sky-500/20 text-sky-400 relative group/button"
                >
                    <FiEye size={16} />
                    <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] bg-gray-800 text-white px-2 py-0.5 rounded opacity-0 group-hover/button:opacity-100 transition-opacity">
                        View
                    </span>
                </Button>

                {/* Edit */}
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsEdit(true)}
                    className="h-auto rounded p-1.5 bg-yellow-500/20 text-yellow-400 relative group/button"
                >
                    <FiEdit size={16} />
                    <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] bg-gray-800 text-white px-2 py-0.5 rounded opacity-0 group-hover/button:opacity-100 transition-opacity">
                        Edit
                    </span>
                </Button>

                {/* Delete */}
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onDelete(alias)}
                    className="h-auto rounded p-1.5 bg-red-500/20 text-red-400 relative group/button"
                >
                    <FiTrash size={16} />
                    <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] bg-gray-800 text-white px-2 py-0.5 rounded opacity-0 group-hover/button:opacity-100 transition-opacity">
                        Delete
                    </span>
                </Button>
            </div>
        </div>
    );
};

export default JsonPathInput;
