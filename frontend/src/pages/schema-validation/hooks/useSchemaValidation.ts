/**
 * Custom hook for managing schema validation state and operations
 */

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { trackEvent } from "@utils/analytics";
import { fetchFormFieldData } from "@utils/request-utils";
import {
    PAYLOAD_STORAGE_KEY,
    SUCCESS_MESSAGE,
    TOAST_MESSAGES,
} from "@pages/schema-validation/constants";
import {
    parsePayload,
    validateAction,
    validateDomainAndVersion,
} from "@pages/schema-validation/utils";
import type {
    UseSchemaValidationReturn,
    ActiveDomainConfig,
    ValidationResponse,
} from "@pages/schema-validation/types";

/**
 * Custom hook that manages schema validation state and operations
 *
 * @returns Object containing state and handler functions for schema validation
 */
export const useSchemaValidation = (): UseSchemaValidationReturn => {
    const [payload, setPayload] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [mdData, setMdData] = useState<string>("");
    const [isSuccessResponse, setIsSuccessResponse] = useState<boolean>(true);
    const [isValidationOpen, setIsValidationOpen] = useState<boolean>(false);
    const [isGuideOpen, setIsGuideOpen] = useState<boolean>(true);
    const [activeDomain, setActiveDomain] = useState<ActiveDomainConfig>({});

    /**
     * Load payload from localStorage on component mount
     */
    useEffect(() => {
        const savedPayload = localStorage.getItem(PAYLOAD_STORAGE_KEY);
        if (savedPayload) {
            setPayload(savedPayload);
        }
    }, []);

    /**
     * Fetch active domain configuration from the backend
     */
    const getFormFields = useCallback(async () => {
        try {
            const data = await fetchFormFieldData();
            setActiveDomain((data as ActiveDomainConfig) || {});
        } catch (error) {
            console.error("Error fetching form fields:", error);
            setActiveDomain({});
        }
    }, []);

    /**
     * Load active domain configuration on mount
     */
    useEffect(() => {
        getFormFields();
    }, [getFormFields]);

    /**
     * Handles payload changes and persists to localStorage
     *
     * @param value - The new payload value from the editor
     */
    const handlePayloadChange = useCallback((value: string | undefined) => {
        const newPayload = value || "";
        setPayload(newPayload);
        localStorage.setItem(PAYLOAD_STORAGE_KEY, newPayload);
    }, []);

    /**
     * Validates the payload against the schema
     */
    const verifyRequest = useCallback(async () => {
        trackEvent({
            category: "SCHEMA_VALIDATION",
            action: "Clicked validate",
        });

        // Parse and validate payload
        const parsedPayload = parsePayload(payload);
        if (!parsedPayload) {
            return;
        }

        // Validate action exists
        const action = validateAction(parsedPayload);
        if (!action) {
            return;
        }

        // Validate domain and version are active
        if (!validateDomainAndVersion(activeDomain, parsedPayload.context || {})) {
            return;
        }

        // Reset state
        setMdData("");
        setIsValidationOpen(false);

        try {
            setIsLoading(true);
            const response = await axios.post<ValidationResponse>(
                `${import.meta.env.VITE_BACKEND_URL}/flow/validate/${action}`,
                parsedPayload
            );

            setIsValidationOpen(true);
            setIsGuideOpen(false);

            if (response.data?.error?.message) {
                setMdData(response.data.error.message);
                setIsSuccessResponse(false);
            } else {
                setMdData(SUCCESS_MESSAGE);
                setIsSuccessResponse(true);
            }
        } catch (error) {
            console.error("Validation error:", error);
            toast.error(TOAST_MESSAGES.VALIDATION_ERROR);
        } finally {
            setIsLoading(false);
        }
    }, [payload, activeDomain]);

    /**
     * Handles Monaco editor mount event to track paste events
     *
     * @param editor - The Monaco editor instance
     */
    const handleEditorMount = useCallback((editor: unknown) => {
        const monacoEditor = editor as { getDomNode: () => HTMLElement | null };
        const editorDomNode = monacoEditor.getDomNode();

        if (editorDomNode) {
            editorDomNode.addEventListener("paste", () => {
                trackEvent({
                    category: "SCHEMA_VALIDATION",
                    action: "Pasted content",
                });
            });
        }
    }, []);

    return {
        payload,
        isLoading,
        mdData,
        isSuccessResponse,
        isValidationOpen,
        isGuideOpen,
        activeDomain,
        handlePayloadChange,
        verifyRequest,
        handleEditorMount,
    };
};
