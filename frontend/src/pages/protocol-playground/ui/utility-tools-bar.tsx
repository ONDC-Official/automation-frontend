import { useState } from "react";

import { FlowConverterModal } from "@pages/protocol-playground/ui/components/flow-converter";

const UtilityToolsBar = () => {
    const [showFlowConverter, setShowFlowConverter] = useState(false);

    return (
        <>
            <div className="w-full max-w-lg mt-4">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide mr-1">
                        Tools
                    </span>
                    <button
                        onClick={() => setShowFlowConverter(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-sky-700 hover:bg-sky-50 transition-all duration-200"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                            />
                        </svg>
                        Flow Converter
                    </button>
                    <div className="w-px h-5 bg-gray-200" />
                    <button
                        onClick={() => {}}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-sky-700 hover:bg-sky-50 transition-all duration-200"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        Config Validator
                    </button>
                </div>
            </div>

            <FlowConverterModal
                isOpen={showFlowConverter}
                onClose={() => setShowFlowConverter(false)}
            />
        </>
    );
};

export default UtilityToolsBar;
