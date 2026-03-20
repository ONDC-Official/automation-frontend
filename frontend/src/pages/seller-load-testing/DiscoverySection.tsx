import React from "react";
import LoadingButton from "@/components/ui/forms/loading-button";
import type { DiscoverySectionProps } from "@pages/seller-load-testing/types";
import { useDiscoverySection } from "@pages/seller-load-testing/useDiscoverySection";

const DiscoverySection: React.FC<DiscoverySectionProps> = ({
    sessionId,
    bppUri,
    createdAt,
    status,
    onDiscoveryComplete,
}) => {
    const {
        isGenerating,
        payload,
        isStarting,
        showButtons,
        discoveryDone,
        editedJson,
        jsonError,
        discoveryResponse,
        handleGeneratePayload,
        handleStartDiscovery,
        handleEditedJsonChange,
        handleCancel,
    } = useDiscoverySection({ sessionId, onDiscoveryComplete });

    return (
        <div className="mt-6 rounded-2xl border border-sky-100 bg-white overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-sky-600 to-sky-500 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-white text-base leading-tight">Discovery</h2>
                    <p className="text-sky-200 text-xs mt-0.5">
                        Generate the search payload, review/edit it, then send to the BPP.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-medium">
                        {status}
                    </span>
                    <span className="text-sky-200 text-xs">{createdAt}</span>
                </div>
            </div>

            <div className="px-5 py-4 space-y-4">
                {!discoveryDone && (
                    <div className="flex items-center gap-3">
                        <LoadingButton
                            type="button"
                            buttonText="Generate Search Payload"
                            isLoading={isGenerating}
                            onClick={handleGeneratePayload}
                        />
                    </div>
                )}

                {payload && (
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">BPP Target: </span>
                        <span className="text-sky-500">{bppUri}</span>
                    </div>
                )}

                {payload && (
                    <div className="rounded-xl border border-gray-700 bg-gray-900 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                            <span className="text-xs text-gray-400 font-mono">payload.json</span>
                            {jsonError && <span className="text-red-400 text-xs">{jsonError}</span>}
                        </div>
                        <textarea
                            value={editedJson}
                            onChange={(e) => handleEditedJsonChange(e.target.value)}
                            className="w-full h-80 bg-gray-900 text-green-400 font-mono text-xs p-4 focus:outline-none resize-none"
                            spellCheck={false}
                        />
                    </div>
                )}

                {payload && showButtons && (
                    <div className="flex items-center gap-3 mt-4">
                        <LoadingButton
                            type="button"
                            buttonText="Start Search"
                            isLoading={isStarting}
                            onClick={handleStartDiscovery}
                        />
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {discoveryResponse && (
                    <div className="rounded-xl border border-gray-700 bg-gray-900 overflow-hidden">
                        <div className="px-4 py-2 border-b border-gray-700">
                            <span className="text-xs text-gray-400 font-mono">
                                On Search Received
                            </span>
                        </div>
                        <pre className="w-full h-80 bg-gray-900 text-sky-400 font-mono text-xs p-4 overflow-auto">
                            {JSON.stringify(discoveryResponse, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiscoverySection;
