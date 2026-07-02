import React from "react";
import { useCreateLoadTestSessionMutation, useDeleteLoadTestSessionMutation } from "@store/api";
import { FormValues } from "./types";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    selectSellerSession,
    setSellerSession,
    type ISellerSessionData,
} from "@store/slices/sellerLoadTestSlice";

type SessionData = ISellerSessionData;

export const useSellerLoadTesting = () => {
    const [createLoadTestSession] = useCreateLoadTestSessionMutation();
    const [deleteLoadTestSession] = useDeleteLoadTestSessionMutation();
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
    const sessionData = useAppSelector(selectSellerSession);
    const [discoveryComplete, setDiscoveryComplete] = React.useState<boolean>(false);

    const saveSession = (data: SessionData | null) => {
        dispatch(setSellerSession(data));
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
