import React, { useState } from "react";
import { toast } from "sonner";
import {
    ClipboardDocumentIcon,
    ArrowDownTrayIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/Shadcn/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Shadcn/Tabs";
import { useClipboard } from "@hooks/useClipboard";

interface OnboardingSuccessPayloadProps {
    submittedData: Record<string, unknown>;
    onSearchPayload: Record<string, unknown>;
    onBack: () => void;
    payloadType?: "single-domain" | "multi-domain";
}

const OnboardingSuccessPayload: React.FC<OnboardingSuccessPayloadProps> = ({
    submittedData,
    onSearchPayload,
    onBack,
    payloadType = "single-domain",
}) => {
    const { copyToClipboard } = useClipboard();
    const isMultiDomain =
        payloadType === "multi-domain" &&
        typeof onSearchPayload === "object" &&
        !Array.isArray(onSearchPayload);

    const [activeTab, setActiveTab] = useState(isMultiDomain ? "domain-0" : "1");

    const handleCopy = (text: string) => {
        void copyToClipboard(text);
    };

    const handleDownload = (data: Record<string, unknown>, filename: string) => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`${filename} downloaded!`);
    };

    const formatJson = (data: Record<string, unknown>) => {
        return JSON.stringify(data, null, 2);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="mx-auto px-20">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <CheckCircleIcon className="size-16 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Seller Onboarding Successful!</h2>
                    <p className="text-gray-600">
                        Your seller profile has been created successfully. Below you can view and
                        copy the generated payloads.
                    </p>
                </div>

                <div className="rounded-lg border border-n-30 bg-white p-6 shadow-lg">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList variant="line" className="mb-4 border-b border-n-30">
                            {isMultiDomain ? (
                                Object.keys(onSearchPayload).map((domain, index) => (
                                    <TabsTrigger key={`domain-${index}`} value={`domain-${index}`}>
                                        {domain} Payload
                                    </TabsTrigger>
                                ))
                            ) : (
                                <TabsTrigger value="1">On Search Payload</TabsTrigger>
                            )}
                            <TabsTrigger value="2">Submitted Data</TabsTrigger>
                        </TabsList>

                        {isMultiDomain ? (
                            Object.entries(onSearchPayload).map(([domain, payload], index) => (
                                <TabsContent key={`domain-${index}`} value={`domain-${index}`}>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-lg font-semibold mb-0">
                                                {domain} on_search Payload
                                            </h4>
                                            <div className="space-x-2">
                                                <Button
                                                    variant="outline"
                                                    icon={<ClipboardDocumentIcon />}
                                                    onClick={() =>
                                                        handleCopy(
                                                            formatJson(
                                                                payload as Record<string, unknown>
                                                            )
                                                        )
                                                    }
                                                >
                                                    Copy
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    icon={<ArrowDownTrayIcon />}
                                                    onClick={() =>
                                                        handleDownload(
                                                            payload as Record<string, unknown>,
                                                            `on_search_${domain.toLowerCase()}_payload.json`
                                                        )
                                                    }
                                                >
                                                    Download
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                                            <pre className="text-green-400 text-sm font-mono whitespace-pre">
                                                {formatJson(payload as Record<string, unknown>)}
                                            </pre>
                                        </div>

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <p className="text-sm text-blue-800">
                                                <strong>Note:</strong> This {domain} payload is
                                                formatted according to ONDC specifications and can
                                                be used for integration with ONDC network.
                                            </p>
                                        </div>
                                    </div>
                                </TabsContent>
                            ))
                        ) : (
                            <TabsContent value="1">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-lg font-semibold mb-0">
                                            on_search Payload
                                        </h4>
                                        <div className="space-x-2">
                                            <Button
                                                variant="outline"
                                                icon={<ClipboardDocumentIcon />}
                                                onClick={() =>
                                                    handleCopy(formatJson(onSearchPayload))
                                                }
                                            >
                                                Copy
                                            </Button>
                                            <Button
                                                variant="outline"
                                                icon={<ArrowDownTrayIcon />}
                                                onClick={() =>
                                                    handleDownload(
                                                        onSearchPayload as Record<string, unknown>,
                                                        "on_search_payload.json"
                                                    )
                                                }
                                            >
                                                Download
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                                        <pre className="text-green-400 text-sm font-mono whitespace-pre">
                                            {formatJson(onSearchPayload as Record<string, unknown>)}
                                        </pre>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-800">
                                            <strong>Note:</strong> This payload is formatted
                                            according to ONDC specifications and can be used for
                                            integration with ONDC network.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>
                        )}

                        <TabsContent value="2">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-lg font-semibold mb-0">
                                        Original Submitted Data
                                    </h4>
                                    <div className="space-x-2">
                                        <Button
                                            variant="outline"
                                            icon={<ClipboardDocumentIcon />}
                                            onClick={() =>
                                                handleCopy(
                                                    formatJson(
                                                        submittedData as Record<string, unknown>
                                                    )
                                                )
                                            }
                                        >
                                            Copy
                                        </Button>
                                        <Button
                                            variant="outline"
                                            icon={<ArrowDownTrayIcon />}
                                            onClick={() =>
                                                handleDownload(
                                                    submittedData as Record<string, unknown>,
                                                    "submitted_data.json"
                                                )
                                            }
                                        >
                                            Download
                                        </Button>
                                    </div>
                                </div>

                                <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                                    <pre className="text-green-400 text-sm font-mono whitespace-pre">
                                        {formatJson(submittedData as Record<string, unknown>)}
                                    </pre>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="mt-8 text-center space-x-4">
                    <Button variant="outline" size="lg" onClick={onBack}>
                        Back to Dashboard
                    </Button>
                    {isMultiDomain && (
                        <Button
                            variant="outline"
                            size="lg"
                            icon={<ArrowDownTrayIcon />}
                            onClick={() =>
                                handleDownload(
                                    onSearchPayload as Record<string, unknown>,
                                    "all_domain_payloads.json"
                                )
                            }
                        >
                            Download All Payloads
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingSuccessPayload;
