import { useMemo, useState } from "react";
import jsonpath from "jsonpath";
import { AxiosResponse } from "axios";

import { SubmitEventParams } from "@/types/flow-types";
import { FormFieldConfigType } from "../config-form/config-form";
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

// --- Helpers ----------------------------------------------------------------

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

// --- Component --------------------------------------------------------------

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
    const formHtml = useMemo<string>(
        () =>
            jsonpath.query(
                { reference_data: referenceData },
                HtmlFormConfigInFlow.reference || ""
            )[0] || "",
        [referenceData, HtmlFormConfigInFlow.reference]
    );

    const parsed = useMemo<ParsedForm>(() => parseFormHtml(formHtml), [formHtml]);

    // Separate hidden (form-level) from visible (per-entry) fields
    const hiddenFields = useMemo(() => parsed.fields.filter((f) => f.kind === "hidden"), [parsed]);
    const visibleFields = useMemo(() => parsed.fields.filter((f) => f.kind !== "hidden"), [parsed]);

    // Multi-entry state
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
        // Clear field error
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

    // Validate all entries
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

    // Submit all entries as arrays
    const handleSubmit = async () => {
        if (!validateAll()) {
            setError("Please fill in all required fields for every member");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            // Build array payload: each visible field maps to an array of values
            const arrayPayload: Record<string, unknown> = {};

            // Hidden fields stay as single values (form-level metadata like formId)
            for (const f of hiddenFields) {
                arrayPayload[f.name] = (f as { value: string }).value;
            }

            // Visible fields become arrays
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

            // Parse response for submission_id
            const ct =
                typeof res.headers === "object"
                    ? res.headers["content-type"] || res.headers["Content-Type"] || ""
                    : "";
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

    // --- Render a single field for a given entry ---

    const renderField = (f: AnyField, entryIdx: number) => {
        if (f.kind === "hidden") return null;

        const values = entries[entryIdx];
        const errors = fieldErrors[entryIdx] || {};
        const setField = (name: string, val: unknown) => setEntryField(entryIdx, name, val);

        const labelEl = (children: JSX.Element) => (
            <div className="block">
                <label className="block text-sm font-medium text-gray-700">
                    {f.label ?? f.name}
                    <span className="text-red-600">{f.required ? " *" : ""}</span>
                </label>
                <div className="mt-1">{children}</div>
                {errors[f.name] && <p className="mt-1 text-sm text-red-600">{errors[f.name]}</p>}
            </div>
        );

        switch (f.kind) {
            case "textlike": {
                const v = (values[f.name] as string) ?? "";
                const tf = f as TextLikeField;
                const hasError = !!errors[f.name];
                return labelEl(
                    <input
                        type={tf.inputType}
                        name={f.name}
                        value={v}
                        onChange={(e) => setField(f.name, e.target.value)}
                        placeholder={tf.placeholder}
                        required={f.required}
                        disabled={f.disabled}
                        min={tf.min as number}
                        max={tf.max as number}
                        step={tf.step as number}
                        pattern={tf.pattern}
                        className={`w-full rounded-md border bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 ${
                            hasError
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-300 focus:ring-blue-500"
                        }`}
                    />
                );
            }
            case "textarea": {
                const v = (values[f.name] as string) ?? "";
                const ta = f as { placeholder?: string; rows?: number };
                const hasError = !!errors[f.name];
                return labelEl(
                    <textarea
                        name={f.name}
                        value={v}
                        onChange={(e) => setField(f.name, e.target.value)}
                        placeholder={ta.placeholder}
                        rows={ta.rows ?? 4}
                        required={f.required}
                        disabled={f.disabled}
                        className={`w-full rounded-md bg-gray-50 border px-3 py-2 focus:outline-none focus:ring-2 ${
                            hasError
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-300 focus:ring-blue-500"
                        }`}
                    />
                );
            }
            case "select": {
                const sel = f as SelectField;
                const v = values[f.name];
                const hasError = !!errors[f.name];
                return labelEl(
                    <select
                        name={f.name}
                        value={
                            (sel.multiple ? ((v as string[]) ?? []) : ((v as string) ?? "")) as
                                | string[]
                                | string
                        }
                        onChange={(e) => {
                            if (sel.multiple) {
                                const opts = Array.from(e.currentTarget.selectedOptions).map(
                                    (o) => o.value
                                );
                                setField(f.name, opts);
                            } else {
                                setField(f.name, e.currentTarget.value);
                            }
                        }}
                        multiple={!!sel.multiple}
                        required={f.required}
                        disabled={f.disabled}
                        className={`w-full rounded-md border bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 ${
                            hasError
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-300 focus:ring-blue-500"
                        }`}
                    >
                        {!sel.multiple && <option value="">-- Select --</option>}
                        {sel.options.map((o, i) => (
                            <option key={i} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                );
            }
            case "radio-group": {
                const rg = f as RadioGroupField;
                const v = (values[f.name] as string) ?? "";
                return (
                    <div className="block">
                        <fieldset className="space-y-2">
                            <legend className="block text-sm font-medium text-gray-700">
                                {f.label ?? f.name}
                                <span className="text-red-600">{f.required ? " *" : ""}</span>
                            </legend>
                            {rg.options.map((opt, i) => (
                                <label
                                    key={i}
                                    className="flex items-center gap-2 text-sm text-gray-800"
                                >
                                    <input
                                        type="radio"
                                        name={`${f.name}_${entryIdx}`}
                                        value={opt.value}
                                        checked={v === opt.value}
                                        onChange={() => setField(f.name, opt.value)}
                                        className="h-4 w-4"
                                    />
                                    <span>{opt.label ?? opt.value}</span>
                                </label>
                            ))}
                        </fieldset>
                        {errors[f.name] && (
                            <p className="mt-1 text-sm text-red-600">{errors[f.name]}</p>
                        )}
                    </div>
                );
            }
            case "checkbox-single": {
                const checked = Boolean(values[f.name]);
                return (
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <input
                            type="checkbox"
                            name={f.name}
                            checked={checked}
                            onChange={(e) => setField(f.name, e.target.checked)}
                            className="h-4 w-4"
                        />
                        <span>
                            {f.label ?? f.name}
                            <span className="text-red-600">{f.required ? " *" : ""}</span>
                        </span>
                    </label>
                );
            }
            case "checkbox-group": {
                const cg = f as CheckboxGroupField;
                const arr = (values[f.name] as string[]) ?? [];
                const toggle = (val: string, on: boolean) => {
                    if (on) setField(f.name, Array.from(new Set([...arr, val])));
                    else
                        setField(
                            f.name,
                            arr.filter((x) => x !== val)
                        );
                };
                return (
                    <div className="block">
                        <fieldset className="space-y-2">
                            <legend className="block text-sm font-medium text-gray-700">
                                {f.label ?? f.name}
                                <span className="text-red-600">{f.required ? " *" : ""}</span>
                            </legend>
                            {cg.options.map((opt, i) => {
                                const on = arr.includes(opt.value);
                                return (
                                    <label
                                        key={i}
                                        className="flex items-center gap-2 text-sm text-gray-800"
                                    >
                                        <input
                                            type="checkbox"
                                            name={f.name}
                                            checked={on}
                                            onChange={(e) => toggle(opt.value, e.target.checked)}
                                            className="h-4 w-4"
                                        />
                                        <span>{opt.label ?? opt.value}</span>
                                    </label>
                                );
                            })}
                        </fieldset>
                        {errors[f.name] && (
                            <p className="mt-1 text-sm text-red-600">{errors[f.name]}</p>
                        )}
                    </div>
                );
            }
            case "file": {
                const hasError = !!errors[f.name];
                const fileField = f as { multiple?: boolean; accept?: string | null };
                return labelEl(
                    <input
                        type="file"
                        name={f.name}
                        multiple={!!fileField.multiple}
                        accept={fileField.accept ?? undefined}
                        onChange={(e) => {
                            const files = e.currentTarget.files;
                            if (!files) return;
                            if (fileField.multiple) setField(f.name, Array.from(files));
                            else setField(f.name, files[0] ?? null);
                        }}
                        className={`block w-full text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200 ${
                            hasError ? "border-red-500" : ""
                        }`}
                    />
                );
            }
        }
    };

    // --- Total error count across all entries ---
    const totalErrors = fieldErrors.reduce((sum, errs) => sum + Object.keys(errs).length, 0);

    return (
        <div className="space-y-6 max-h-full overflow-y-auto overflow-x-hidden">
            {entries.map((_, entryIdx) => {
                const entryErrors = fieldErrors[entryIdx] || {};
                const entryErrorCount = Object.keys(entryErrors).length;

                return (
                    <div
                        key={entryIdx}
                        className={`rounded-lg border p-4 min-w-0 ${
                            entryErrorCount > 0 ? "border-red-300" : "border-gray-200"
                        }`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-800">
                                Member {entryIdx + 1}
                            </h3>
                            {entries.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeEntry(entryIdx)}
                                    className="text-sm text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {visibleFields.map((f, fIdx) => (
                                <div key={`${f.name}-${fIdx}`}>{renderField(f, entryIdx)}</div>
                            ))}
                        </div>

                        {entryErrorCount > 0 && (
                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-xs text-red-700">
                                    {entryErrorCount} required field
                                    {entryErrorCount > 1 ? "s" : ""} missing
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Add member button */}
            <button
                type="button"
                onClick={addEntry}
                className="w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
                + Add Family Member
            </button>

            {/* Validation summary */}
            {totalErrors > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700 font-medium">
                        Please fill in all required fields across {entries.length} member
                        {entries.length > 1 ? "s" : ""}
                    </p>
                </div>
            )}

            {/* Submit */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`px-4 py-2 rounded text-white disabled:opacity-60 flex-shrink-0 ${
                        totalErrors > 0
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                    {isSubmitting
                        ? "Submitting..."
                        : totalErrors > 0
                          ? `Fix ${totalErrors} Error${totalErrors > 1 ? "s" : ""}`
                          : `Submit ${entries.length} Member${entries.length > 1 ? "s" : ""}`}
                </button>

                {parsed.action && (
                    <span className="text-xs text-gray-500 break-words">
                        POST to <code className="break-all">{parsed.action}</code>
                    </span>
                )}
            </div>

            <div className="text-sm text-gray-700 break-words">
                {submissionId && (
                    <span className="text-green-700">
                        Received submission_id: <code className="break-all">{submissionId}</code>
                    </span>
                )}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <span className="text-red-600 break-words font-medium">Error: {error}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
