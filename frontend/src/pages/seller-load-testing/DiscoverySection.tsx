import React from "react";
import { Button } from "@components/Shadcn/Button";
import Spinner from "@components/Shadcn/Spinner";
import { Textarea } from "@/components/Shadcn/TextArea/text-area";
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
            <div className="px-5 py-4 bg-linear-to-r from-sky-600 to-sky-500 flex items-center justify-between">
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
                        <Button
                            type="button"
                            isLoading={isGenerating}
                            onClick={handleGeneratePayload}
                        >
                            {isGenerating ? (
                                <>
                                    <Spinner className="size-4" />
                                    Loading...
                                </>
                            ) : (
                                "Generate Search Payload"
                            )}
                        </Button>
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
                        <Textarea
                            value={editedJson}
                            onChange={(e) => handleEditedJsonChange(e.target.value)}
                            className="w-full h-80 min-h-80 border-0 shadow-none rounded-none bg-gray-900 text-green-400 font-mono text-xs p-4 focus:outline-hidden focus-visible:ring-0 resize-none"
                            spellCheck={false}
                        />
                    </div>
                )}

                {payload && showButtons && (
                    <div className="flex items-center gap-3 mt-4">
                        <Button type="button" isLoading={isStarting} onClick={handleStartDiscovery}>
                            {isStarting ? (
                                <>
                                    <Spinner className="size-4" />
                                    Loading...
                                </>
                            ) : (
                                "Start Search"
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </Button>
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
