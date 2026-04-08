import React from "react";
import axios from "axios";
import type { DiscoveryResponse, PayloadResponse } from "@pages/seller-load-testing/types";

interface UseDiscoverySectionParams {
    sessionId: string;
    onDiscoveryComplete: () => void;
}

export const useDiscoverySection = ({
    sessionId,
    onDiscoveryComplete,
}: UseDiscoverySectionParams) => {
    const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
    const [payload, setPayload] = React.useState<Record<string, unknown> | null>(null);
    const [isStarting, setIsStarting] = React.useState<boolean>(false);
    const [showButtons, setShowButtons] = React.useState<boolean>(false);
    const [discoveryDone, setDiscoveryDone] = React.useState<boolean>(false);
    const [editedJson, setEditedJson] = React.useState<string>("");
    const [jsonError, setJsonError] = React.useState<string>("");
    const [discoveryResponse, setDiscoveryResponse] = React.useState<DiscoveryResponse | null>(
        null
    );

    const handleGeneratePayload = async () => {
        setIsGenerating(true);
        try {
            const response = await axios.get<PayloadResponse>(
                `${import.meta.env.VITE_LOAD_TEST_BACKEND_URL}/sessions/${sessionId}/discovery/payload`
            );
            setPayload(response.data.payload);
            setEditedJson(JSON.stringify(response.data.payload, null, 2));
            setShowButtons(true);
        } catch (error) {
            console.error("Error generating payload:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleStartDiscovery = async () => {
        setIsStarting(true);
        try {
            const response = await axios.post<DiscoveryResponse>(
                `${import.meta.env.VITE_LOAD_TEST_BACKEND_URL}/sessions/${sessionId}/discovery`,
                { payload }
            );
            setDiscoveryResponse(response.data);
            setPayload(null);
            setShowButtons(false);
            setDiscoveryDone(true);
            onDiscoveryComplete();
        } catch (error) {
            console.error("Error starting discovery:", error);
        } finally {
            setIsStarting(false);
        }
    };

    const handleEditedJsonChange = (value: string) => {
        setEditedJson(value);
        try {
            const parsed = JSON.parse(value);
            setPayload(parsed);
            setJsonError("");
        } catch {
            setJsonError("Invalid JSON");
        }
    };

    const handleCancel = () => {
        setPayload(null);
        setShowButtons(false);
    };

    return {
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
    };
};
