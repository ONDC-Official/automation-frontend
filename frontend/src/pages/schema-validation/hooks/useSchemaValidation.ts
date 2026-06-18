/**
 * Custom hook for managing schema validation state and operations
 */

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import type { editor as MonacoEditor } from "monaco-editor";
import type { MonacoModule } from "@pages/schema-validation/types";
import { trackEvent } from "@utils/analytics";
import { fetchFormFieldData } from "@utils/request-utils";
import { PAYLOAD_STORAGE_KEY, TOAST_MESSAGES } from "@pages/schema-validation/constants";
import {
    parsePayload,
    validateAction,
    validateDomainAndVersion,
} from "@pages/schema-validation/utils/helpers";
import {
    applyEditorErrorDecorations,
    clearEditorErrorDecorations,
} from "@pages/schema-validation/utils/editorErrorDecorations";
import { parseValidationErrors } from "@pages/schema-validation/utils/parseValidationErrors";
import type {
    IUseSchemaValidationReturn,
    IActiveDomainConfig,
    IValidationResponse,
} from "@pages/schema-validation/types";

/**
 * Custom hook that manages schema validation state and operations
 *
 * @returns Object containing state and handler functions for schema validation
 */
export const useSchemaValidation = (): IUseSchemaValidationReturn => {
    const [payload, setPayload] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [validationErrors, setValidationErrors] = useState<
        ReturnType<typeof parseValidationErrors>
    >([]);
    const [isSuccessResponse, setIsSuccessResponse] = useState<boolean>(false);
    const [isValidationVisible, setIsValidationVisible] = useState<boolean>(false);
    const [isErrorsExpanded, setIsErrorsExpanded] = useState<boolean>(false);
    const [activeDomain, setActiveDomain] = useState<IActiveDomainConfig>({});

    const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<MonacoModule | null>(null);

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
            setActiveDomain((data as IActiveDomainConfig) || {});
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
     * Clears editor decorations whenever the payload changes.
     */
    useEffect(() => {
        if (editorRef.current && monacoRef.current) {
            clearEditorErrorDecorations(editorRef.current, monacoRef.current);
        }
        setIsValidationVisible(false);
        setIsErrorsExpanded(false);
        setValidationErrors([]);
    }, [payload]);

    /**
     * Applies Monaco error highlights after validation errors are available.
     */
    useLayoutEffect(() => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;

        if (!editor || !monaco || isSuccessResponse || validationErrors.length === 0) {
            return;
        }

        const source = editor.getModel()?.getValue() ?? "";
        applyEditorErrorDecorations(editor, monaco, source, validationErrors);
    }, [validationErrors, isSuccessResponse]);

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

        const parsedPayload = parsePayload(payload);
        if (!parsedPayload) {
            return;
        }

        const action = validateAction(parsedPayload);
        if (!action) {
            return;
        }

        if (!validateDomainAndVersion(activeDomain, parsedPayload.context || {})) {
            return;
        }

        setValidationErrors([]);
        setIsValidationVisible(false);
        setIsErrorsExpanded(false);

        if (editorRef.current && monacoRef.current) {
            clearEditorErrorDecorations(editorRef.current, monacoRef.current);
        }

        try {
            setIsLoading(true);
            const response = await axios.post<IValidationResponse>(
                `${import.meta.env.VITE_BACKEND_URL}/flow/validate/${action}`,
                parsedPayload
            );

            setIsValidationVisible(true);

            if (response.data?.error?.message) {
                const parsedErrors = parseValidationErrors(response.data.error.message);
                setValidationErrors(parsedErrors);
                setIsSuccessResponse(false);

                const editor = editorRef.current;
                const monaco = monacoRef.current;
                if (editor && monaco) {
                    applyEditorErrorDecorations(
                        editor,
                        monaco,
                        editor.getModel()?.getValue() ?? payload,
                        parsedErrors
                    );
                }
            } else {
                setValidationErrors([]);
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
     * @param monaco - Monaco module reference
     */
    const handleEditorMount = useCallback((editor: unknown, monaco: unknown) => {
        editorRef.current = editor as MonacoEditor.IStandaloneCodeEditor;
        monacoRef.current = monaco as MonacoModule;

        const editorDomNode = editorRef.current.getDomNode();
        if (editorDomNode) {
            editorDomNode.addEventListener("paste", () => {
                trackEvent({
                    category: "SCHEMA_VALIDATION",
                    action: "Pasted content",
                });
            });
        }
    }, []);

    /**
     * Expands the validation error panel to show all errors.
     */
    const expandValidationErrors = useCallback(() => {
        setIsErrorsExpanded(true);
    }, []);

    /**
     * Collapses the expanded validation error panel.
     */
    const collapseValidationErrors = useCallback(() => {
        setIsErrorsExpanded(false);
    }, []);

    return {
        payload,
        isLoading,
        validationErrors,
        isSuccessResponse,
        isValidationVisible,
        isErrorsExpanded,
        activeDomain,
        handlePayloadChange,
        verifyRequest,
        handleEditorMount,
        expandValidationErrors,
        collapseValidationErrors,
    };
};
