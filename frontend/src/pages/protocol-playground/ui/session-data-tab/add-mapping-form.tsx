import Input from "@components/Shadcn/Input";
import { Button } from "@components/Shadcn/Button";

interface AddMappingFormProps {
    alias: string;
    path: string;
    error: string;
    onAliasChange: (value: string) => void;
    onPathChange: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
}

/** Manual alias→JSONPath entry panel used inside the Session Data tab. */
export function AddMappingForm({
    alias,
    path,
    error,
    onAliasChange,
    onPathChange,
    onSave,
    onCancel,
}: AddMappingFormProps) {
    return (
        <div className="bg-gray-800 mt-4 p-4 rounded-lg border border-sky-500/30">
            <div className="flex flex-col gap-2 items-center">
                <Input
                    type="text"
                    value={alias}
                    onChange={(e) => onAliasChange(e.target.value)}
                    placeholder="Enter alias (e.g. userInfo)"
                    className="px-3 w-full py-2 rounded bg-gray-900 text-white border border-gray-700 focus:border-sky-500 outline-hidden"
                />
                :
                <Input
                    type="text"
                    value={path}
                    onChange={(e) => onPathChange(e.target.value)}
                    placeholder="Enter JSON path (e.g. $.context.city)"
                    className="px-3 w-full py-2 rounded bg-gray-900 text-white border border-gray-700 focus:border-sky-500 outline-hidden"
                />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2 mt-2">
                <Button
                    onClick={onSave}
                    className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition-colors"
                >
                    Save
                </Button>
                <Button
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}
