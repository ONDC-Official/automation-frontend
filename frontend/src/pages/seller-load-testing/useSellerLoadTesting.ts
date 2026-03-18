import React from "react";
import axios from "axios";
import { FormValues } from "./types";

interface SessionData {
    sessionId: string;
    bppId: string;
    bppUri: string;
    createdAt: string;
    expiresAt: string;
    status: string;
}

interface CreateSessionResponse {
    id: string;
    created_at: string;
    expires_at: string;
    status: string;
}

export const useSellerLoadTesting = () => {
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
    const [sessionData, setSessionData] = React.useState<SessionData | null>(() => {
        const saved = localStorage.getItem("seller_session");
        return saved ? JSON.parse(saved) : null;
    });
    const [discoveryComplete, setDiscoveryComplete] = React.useState<boolean>(false);

    const saveSession = (data: SessionData | null) => {
        if (data) {
            localStorage.setItem("seller_session", JSON.stringify(data));
        } else {
            localStorage.removeItem("seller_session");
        }
        setSessionData(data);
    };

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        try {
            const response = await axios.post<CreateSessionResponse>(
                `${import.meta.env.VITE_LOAD_TEST_BACKEND_URL}/sessions/`,
                {
                    bpp_id: data.bppId,
                    bpp_uri: data.bppUri,
                }
            );
            const result = response.data;
            saveSession({
                sessionId: result.id,
                bppId: data.bppId,
                bppUri: data.bppUri,
                createdAt: result.created_at || new Date().toLocaleString("en-GB"),
                expiresAt: result.expires_at || "",
                status: result.status || "active",
            });
        } catch (error) {
            console.error("Error creating session:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!sessionData) return;
        setIsDeleting(true);
        try {
            await axios.delete(
                `${import.meta.env.VITE_LOAD_TEST_BACKEND_URL}/sessions/${sessionData.sessionId}`
            );
            saveSession(null);
        } catch (error) {
            console.error("Error deleting session:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleNewSession = () => {
        saveSession(null);
    };

    return {
        isLoading,
        isDeleting,
        sessionData,
        discoveryComplete,
        setDiscoveryComplete,
        onSubmit,
        handleDelete,
        handleNewSession,
    };
};
