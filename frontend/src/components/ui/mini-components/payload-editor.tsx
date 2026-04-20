import { useState } from "react";
import ReactDOM from "react-dom";
import Editor from "@monaco-editor/react";
import { IoArrowBack } from "react-icons/io5";
import { AiOutlineMinus, AiOutlineExpand } from "react-icons/ai";

interface PayloadEditorProps {
    onAdd: (parsedPayload: unknown) => void;
    onClose?: () => void;
}

const PayloadEditor = ({ onAdd, onClose }: PayloadEditorProps) => {
    const [payload, setPayload] = useState("");
    const [errorText, setErrorText] = useState("");
    const [isMinimized, setIsMinimized] = useState(false);

    const handleAddClick = () => {
        let parsedText: unknown = null;
        try {
            parsedText = JSON.parse(payload);
        } catch (error: unknown) {
            console.error("Error parsing JSON:", error);
            setErrorText("Invalid json format");
            return;
        }

        onAdd(parsedText as unknown);
    };

    if (isMinimized) {
        return ReactDOM.createPortal(
            <div className="fixed bottom-4 right-4 z-50">
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
                    <span className="text-sm font-semibold text-gray-700">Paste payload</span>
                    <button
                        onClick={() => setIsMinimized(false)}
                        title="Maximize"
                        className="flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 hover:bg-blue-100 hover:text-blue-600 text-gray-500 transition"
                    >
                        <AiOutlineExpand size={14} />
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            title="Close"
                            className="flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-500 transition text-lg leading-none"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>,
            document.fullscreenElement ?? document.body
        );
    }

    return ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-[#f7f7f7] bg-white rounded-2xl shadow-lg p-6 w-full max-w-3xl">
                {/* Back button above */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition mb-3"
                    >
                        <IoArrowBack size={18} />
                        <span>Back</span>
                    </button>
                )}
                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                    <label className="text-lg font-semibold">Paste payload</label>
                    <div className="flex items-center gap-3">
                        {errorText && <p className="text-red-500 text-sm italic">{errorText}</p>}
                        <button
                            onClick={() => setIsMinimized(true)}
                            title="Minimize"
                            className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                        >
                            <AiOutlineMinus size={16} />
                        </button>
                        <button
                            onClick={handleAddClick}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Add
                        </button>
                    </div>
                </div>
                <div className="h-96">
                    <Editor
                        height="100%"
                        value={payload}
                        onChange={(value: string | undefined) => {
                            setPayload(value as unknown as string);
                        }}
                        defaultLanguage="json"
                        theme="vs"
                        options={{
                            minimap: { enabled: false },
                        }}
                    />
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PayloadEditor;
