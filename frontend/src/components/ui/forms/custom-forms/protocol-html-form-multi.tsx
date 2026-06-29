import { useMemo, useState } from "react";
import { queryJsonPath } from "../../../../utils/jsonpath-query";
import { AxiosResponse } from "axios";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/Shadcn/Button/button";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { SubmitEventParams } from "@/types/flow-types";
import { FormFieldConfigType } from "../config-form/config-form";
import ProtocolHtmlFieldRenderer from "./protocol-html-field-renderer";
import { cn } from "@/lib/utils";
import { htmlFormSubmit } from "@utils/request-utils";
import {
    parseFormHtml,
    ParsedForm,
    AnyField,
    ValueState,
    TextLikeField,
    SelectField,
    RadioGroupField,
    CheckboxSingleField,
    CheckboxGroupField,
} from "./protocol-html-form";

function createDefaultEntry(fields: AnyField[]): ValueState {
    const v: ValueState = {};
    for (const f of fields) {
        switch (f.kind) {
            case "hidden":
                v[f.name] = (f as { value: string }).value;
                break;
            case "textlike":
                v[f.name] = (f as TextLikeField).defaultValue ?? "";
                break;
            case "textarea":
                v[f.name] = (f as { defaultValue?: string }).defaultValue ?? "";
                break;
            case "select": {
                const sel = f as SelectField;
                const selected = sel.options.filter((o) => o.selected).map((o) => o.value);
                v[f.name] = sel.multiple ? selected : (selected[0] ?? "");
                break;
            }
            case "radio-group": {
                const rg = f as RadioGroupField;
                v[f.name] = rg.options.find((o) => o.checked)?.value ?? "";
                break;
            }
            case "checkbox-single": {
                const cs = f as CheckboxSingleField;
                v[f.name] = !!cs.checked;
                break;
            }
            case "checkbox-group": {
                const cg = f as CheckboxGroupField;
                v[f.name] = cg.options.filter((o) => o.checked).map((o) => o.value);
                break;
            }
            case "file":
                v[f.name] = null;
                break;
        }
    }
    return v;
}

type Props = {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    referenceData?: Record<string, unknown>;
    HtmlFormConfigInFlow: FormFieldConfigType;
};

export default function ProtocolHTMLFormMulti({
    submitEvent,
    referenceData,
    HtmlFormConfigInFlow,
}: Props) {
    const formHtml = useMemo<string>(() => {
        const value = queryJsonPath(
            { reference_data: referenceData },
            HtmlFormConfigInFlow.reference || ""
        )[0];
        return typeof value === "string" ? value : "";
    }, [referenceData, HtmlFormConfigInFlow.reference]);

    const parsed = useMemo<ParsedForm>(() => parseFormHtml(formHtml), [formHtml]);

    const hiddenFields = useMemo(() => parsed.fields.filter((f) => f.kind === "hidden"), [parsed]);
    const visibleFields = useMemo(() => parsed.fields.filter((f) => f.kind !== "hidden"), [parsed]);

    const [entries, setEntries] = useState<ValueState[]>(() => [createDefaultEntry(visibleFields)]);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>[]>([{}]);
    const [submissionId, setSubmissionId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addEntry = () => {
        setEntries((prev) => [...prev, createDefaultEntry(visibleFields)]);
        setFieldErrors((prev) => [...prev, {}]);
    };

    const removeEntry = (idx: number) => {
        setEntries((prev) => prev.filter((_, i) => i !== idx));
        setFieldErrors((prev) => prev.filter((_, i) => i !== idx));
    };

    const setEntryField = (entryIdx: number, name: string, val: unknown) => {
        setEntries((prev) =>
            prev.map((entry, i) =>
                i === entryIdx ? { ...entry, [name]: val as ValueState[string] } : entry
            )
        );
        if (fieldErrors[entryIdx]?.[name]) {
            setFieldErrors((prev) =>
                prev.map((errs, i) => {
                    if (i !== entryIdx) return errs;
                    const next = { ...errs };
                    delete next[name];
                    return next;
                })
            );
        }
    };

    const validateAll = (): boolean => {
        const allErrors: Record<string, string>[] = entries.map((entry) => {
            const errs: Record<string, string> = {};
            for (const field of visibleFields) {
                if (!field.required) continue;
                const value = entry[field.name];

                if (field.kind === "textlike" || field.kind === "textarea") {
                    if (!value || (typeof value === "string" && value.trim() === "")) {
                        errs[field.name] = `${field.label || field.name} is required`;
                    }
                } else if (field.kind === "select" || field.kind === "radio-group") {
                    if (!value || (typeof value === "string" && value === "")) {
                        errs[field.name] = `${field.label || field.name} is required`;
                    }
                } else if (field.kind === "checkbox-group") {
                    if (!value || !Array.isArray(value) || value.length === 0) {
                        errs[field.name] = `${field.label || field.name} is required`;
                    }
                } else if (field.kind === "file") {
                    if (!value || (Array.isArray(value) && value.length === 0)) {
                        errs[field.name] = `${field.label || field.name} is required`;
                    }
                }
            }
            return errs;
        });

        setFieldErrors(allErrors);
        return allErrors.every((errs) => Object.keys(errs).length === 0);
    };

    const handleSubmit = async () => {
        if (!validateAll()) {
            setError("Please fill in all required fields for every member");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const arrayPayload: Record<string, unknown> = {};

            for (const f of hiddenFields) {
                arrayPayload[f.name] = (f as { value: string }).value;
            }

            for (const f of visibleFields) {
                arrayPayload[f.name] = entries.map((entry) => {
                    const val = entry[f.name];
                    if (f.kind === "checkbox-single") {
                        return val === true ? ((f as CheckboxSingleField).valueAttr ?? "on") : "";
                    }
                    if (typeof val === "boolean") return val ? "on" : "";
                    if (val == null) return "";
                    return val;
                });
            }

            const res = (await htmlFormSubmit(
                parsed.action || window.location.href,
                arrayPayload
            )) as AxiosResponse<unknown, unknown>;

            const rawCt =
                typeof res.headers === "object"
                    ? (res.headers["content-type"] ?? res.headers["Content-Type"])
                    : undefined;
            const ct =
                typeof rawCt === "string" ? rawCt : Array.isArray(rawCt) ? (rawCt[0] ?? "") : "";
            let data: {
                submission_id?: string;
                data?: { submission_id?: string };
                result?: { submission_id?: string };
            };
            if (ct.includes("application/json")) {
                data = res.data as typeof data;
            } else {
                const text = typeof res.data === "string" ? res.data : String(res.data);
                const match = text.match(/"submission_id"\s*:\s*"([^"]+)"/i);
                data = match ? { submission_id: match[1] } : (res.data as typeof data);
            }

            const finalSubmissionId =
                data?.submission_id ??
                data?.data?.submission_id ??
                data?.result?.submission_id ??
                "";
            if (!finalSubmissionId) {
                throw new Error("No submission_id returned by the form endpoint.");
            }

            setSubmissionId(finalSubmissionId);

            await submitEvent({
                jsonPath: { submission_id: finalSubmissionId },
                formData: { submission_id: finalSubmissionId },
            });
        } catch (e: unknown) {
            console.error(e);
            setError((e as Error)?.message || "Submission failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalErrors = fieldErrors.reduce((sum, errs) => sum + Object.keys(errs).length, 0);

    return (
        <FormDialogShell
            onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
            }}
            footer={
                <>
                    <Button type="button" variant="outline" className="gap-1" onClick={addEntry}>
                        <PlusIcon className="size-4" />
                        Add Family Member
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                            ? "Submitting..."
                            : totalErrors > 0
                              ? `Fix ${totalErrors} Error${totalErrors > 1 ? "s" : ""}`
                              : `Submit ${entries.length} Member${entries.length > 1 ? "s" : ""}`}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                {entries.map((entry, entryIdx) => {
                    const entryErrors = fieldErrors[entryIdx] || {};
                    const entryErrorCount = Object.keys(entryErrors).length;

                    return (
                        <div
                            key={entryIdx}
                            className={cn(
                                "min-w-0 rounded-lg border p-4",
                                entryErrorCount > 0
                                    ? "border-destructive/40"
                                    : "border-border-default"
                            )}
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-text-primary">
                                    Member {entryIdx + 1}
                                </h3>
                                {entries.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="gap-1 text-destructive hover:text-destructive"
                                        onClick={() => removeEntry(entryIdx)}
                                    >
                                        <TrashIcon className="size-4" />
                                        Remove
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {visibleFields.map((field, fieldIdx) => (
                                    <div key={`${field.name}-${fieldIdx}`}>
                                        <ProtocolHtmlFieldRenderer
                                            field={field}
                                            value={entry[field.name]}
                                            onValueChange={(nextValue) =>
                                                setEntryField(entryIdx, field.name, nextValue)
                                            }
                                            error={entryErrors[field.name]}
                                            radioNameSuffix={`_${entryIdx}`}
                                        />
                                    </div>
                                ))}
                            </div>

                            {entryErrorCount > 0 && (
                                <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-2">
                                    <p className="text-xs text-destructive">
                                        {entryErrorCount} required field
                                        {entryErrorCount > 1 ? "s" : ""} missing
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}

                {totalErrors > 0 && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                        <p className="text-sm font-medium text-destructive">
                            Please fill in all required fields across {entries.length} member
                            {entries.length > 1 ? "s" : ""}
                        </p>
                    </div>
                )}

                {parsed.action && (
                    <p className="text-xs text-text-secondary wrap-break-word">
                        POST to <code className="break-all">{parsed.action}</code>
                    </p>
                )}

                <div className="text-sm text-text-secondary wrap-break-word">
                    {submissionId && (
                        <p className="text-success-600">
                            Received submission_id:{" "}
                            <code className="break-all">{submissionId}</code>
                        </p>
                    )}
                    {error && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                            <span className="font-medium text-destructive wrap-break-word">
                                Error: {error}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </FormDialogShell>
    );
}
