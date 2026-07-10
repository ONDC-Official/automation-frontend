/**
 * Custom hook for managing schema validation state and operations
 */

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import type { editor as MonacoEditor } from "monaco-editor";
import type { MonacoModule, IParsedValidationError } from "@pages/schema-validation/types";
import { trackEvent } from "@utils/analytics";
import { useGetScenarioFormDataQuery, useValidateActionMutation } from "@store/api";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { selectSchemaDraftPayload, setDraftPayload } from "@store/slices/schemaValidationSlice";
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
import { buildValidationError } from "@pages/schema-validation/utils/validationErrors";
import type {
    IUseSchemaValidationReturn,
    IActiveDomainConfig,
} from "@pages/schema-validation/types";

/**
 * Custom hook that manages schema validation state and operations
 *
 * @returns Object containing state and handler functions for schema validation
 */
export const useSchemaValidation = (): IUseSchemaValidationReturn => {
    const dispatch = useAppDispatch();
    const payload = useAppSelector(selectSchemaDraftPayload);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [validationErrors, setValidationErrors] = useState<
        ReturnType<typeof parseValidationErrors>
    >([]);
    const [isSuccessResponse, setIsSuccessResponse] = useState<boolean>(false);
    const [triggerValidateAction] = useValidateActionMutation();
    const [isValidationVisible, setIsValidationVisible] = useState<boolean>(false);
    const [isErrorsExpanded, setIsErrorsExpanded] = useState<boolean>(false);
    const [activeDomain, setActiveDomain] = useState<IActiveDomainConfig>({});

    const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<MonacoModule | null>(null);

    /**
     * Fetch active domain configuration from the backend
     */
    const { data: scenarioFormData } = useGetScenarioFormDataQuery();

    /**
     * Sync active domain configuration once it's loaded
     */
    useEffect(() => {
        setActiveDomain((scenarioFormData as unknown as IActiveDomainConfig) || {});
    }, [scenarioFormData]);

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
     * Handles payload changes and persists to Redux (schemaValidation slice, via Redux Persist)
     *
     * @param value - The new payload value from the editor
     */
    const handlePayloadChange = useCallback(
        (value: string | undefined) => {
            const newPayload = value || "";
            dispatch(setDraftPayload(newPayload));
        },
        [dispatch]
    );

    /**
     * Shows validation errors in the panel and applies editor highlights.
     */
    const showValidationErrors = useCallback(
        (errors: IParsedValidationError[]) => {
            setValidationErrors(errors);
            setIsValidationVisible(true);
            setIsSuccessResponse(false);
            setIsErrorsExpanded(false);

            const editor = editorRef.current;
            const monaco = monacoRef.current;

            if (editor && monaco) {
                applyEditorErrorDecorations(
                    editor,
                    monaco,
                    editor.getModel()?.getValue() ?? payload,
                    errors
                );
            }
        },
        [payload]
    );

    /**
     * Validates the payload against the schema
     */
    const verifyRequest = useCallback(async () => {
        trackEvent({
            category: "SCHEMA_VALIDATION",
            action: "Clicked validate",
        });

        const parsedPayloadResult = parsePayload(payload);
        if (!parsedPayloadResult.ok) {
            showValidationErrors(parsedPayloadResult.errors);
            return;
        }

        const actionResult = validateAction(parsedPayloadResult.value);
        if (!actionResult.ok) {
            showValidationErrors(actionResult.errors);
            return;
        }

        const domainResult = validateDomainAndVersion(
            activeDomain,
            parsedPayloadResult.value.context || {}
        );
        if (!domainResult.ok) {
            showValidationErrors(domainResult.errors);
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
            const response = await triggerValidateAction({
                action: actionResult.value,
                payload: parsedPayloadResult.value,
            }).unwrap();

            setIsValidationVisible(true);

            if (response?.error?.message) {
                showValidationErrors(parseValidationErrors(response.error.message));
            } else {
                setValidationErrors([]);
                setIsSuccessResponse(true);
            }
        } catch (error) {
            console.error("Validation error:", error);
            showValidationErrors([buildValidationError("VALIDATION_ERROR")]);
        } finally {
            setIsLoading(false);
        }
    }, [payload, activeDomain, showValidationErrors]);

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
