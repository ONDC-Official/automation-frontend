import React from "react";
import { useCreateLoadTestSessionMutation, useDeleteLoadTestSessionMutation } from "@store/api";
import { FormValues } from "./types";

interface SessionData {
    sessionId: string;
    bppId: string;
    bppUri: string;
    createdAt: string;
    expiresAt: string;
    status: string;
}

export const useSellerLoadTesting = () => {
    const [createLoadTestSession] = useCreateLoadTestSessionMutation();
    const [deleteLoadTestSession] = useDeleteLoadTestSessionMutation();
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
            const result = await createLoadTestSession({
                bppId: data.bppId,
                bppUri: data.bppUri,
            }).unwrap();
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
            await deleteLoadTestSession(sessionData.sessionId).unwrap();
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
