import { useMemo, useState } from "react";
import { queryJsonPath } from "../../../../utils/jsonpath-query";
import { AxiosResponse } from "axios";

import { Button } from "@/components/Shadcn/Button/button";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import ProtocolHtmlFieldRenderer from "./protocol-html-field-renderer";
import type {
    BaseField,
    TextLikeField,
    TextareaField,
    SelectField,
    RadioGroupField,
    CheckboxSingleField,
    CheckboxGroupField,
    FileField,
    HiddenField,
    AnyField,
    ParsedForm,
    ValueState,
    IProtocolHtmlFormProps,
} from "../types/protocol-html-form-types";

import { htmlFormSubmit } from "@utils/request-utils";
// --- Helper: label resolution -------------------------------------------------

function getLabelForInput(input: Element, formEl: HTMLFormElement): string | undefined {
    const id = (input as HTMLInputElement).id;
    if (id) {
        const byFor = formEl.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (byFor && byFor.textContent) return byFor.textContent.trim();
    }
    // If input is wrapped by a <label> ancestor
    let parent: Element | null = input.parentElement;
    while (parent) {
        if (parent.tagName.toLowerCase() === "label" && parent.textContent) {
            return parent.textContent.trim();
        }
        parent = parent.parentElement;
    }
    return undefined;
}

// --- Parser: from HTML to field metadata -------------------------------------

export function parseFormHtml(formHtml: string): ParsedForm {
    const doc = new DOMParser().parseFromString(formHtml, "text/html");
    const formEl = doc.querySelector("form") as HTMLFormElement | null;
    if (!formEl) {
        return {
            method: "GET",
            action: "",
            fields: [],
        };
    }

    const method = (formEl.getAttribute("method") || "GET").toUpperCase();
    const action = formEl.getAttribute("action") || "";
    const enctype = formEl.getAttribute("enctype");

    // Collect candidates
    const inputs = Array.from(formEl.querySelectorAll("input"));
    const textareas = Array.from(formEl.querySelectorAll("textarea"));
    const selects = Array.from(formEl.querySelectorAll("select"));

    // Group radios/checkboxes by name
    const radioMap = new Map<string, HTMLInputElement[]>();
    const checkboxMap = new Map<string, HTMLInputElement[]>();

    const fields: AnyField[] = [];

    // First pass: handle inputs except radio/checkbox (they’re grouped later)
    for (const input of inputs) {
        const type = (input.getAttribute("type") || "text").toLowerCase();
        const name = input.getAttribute("name") || "";
        if (!name) continue;

        const common: Partial<BaseField> = {
            name,
            label: getLabelForInput(input, formEl),
            required: input.hasAttribute("required"),
            disabled: input.hasAttribute("disabled"),
            id: input.id || null,
        };

        if (type === "radio") {
            const arr = radioMap.get(name) || [];
            arr.push(input);
            radioMap.set(name, arr);
            continue;
        }

        if (type === "checkbox") {
            const arr = checkboxMap.get(name) || [];
            arr.push(input);
            checkboxMap.set(name, arr);
            continue;
        }

        if (type === "hidden") {
            fields.push({
                kind: "hidden",
                ...common,
                value: input.getAttribute("value") ?? "",
            } as HiddenField);
            continue;
        }

        if (type === "file") {
            fields.push({
                kind: "file",
                ...common,
                multiple: input.hasAttribute("multiple"),
                accept: input.getAttribute("accept"),
            } as FileField);
            continue;
        }

        // Text-like inputs
        const supportedTypes = new Set([
            "text",
            "password",
            "email",
            "number",
            "date",
            "datetime-local",
            "month",
            "time",
            "url",
            "tel",
            "search",
        ]);
        const inputType = supportedTypes.has(type) ? (type as TextLikeField["inputType"]) : "text";

        fields.push({
            kind: "textlike",
            ...common,
            inputType,
            defaultValue: input.getAttribute("value") ?? "",
            placeholder: input.getAttribute("placeholder") ?? undefined,
            min: input.getAttribute("min") ?? undefined,
            max: input.getAttribute("max") ?? undefined,
            step: input.getAttribute("step") ?? undefined,
            pattern: input.getAttribute("pattern") ?? undefined,
        } as TextLikeField);
    }

    // Textareas
    for (const ta of textareas) {
        const name = ta.getAttribute("name") || "";
        if (!name) continue;
        fields.push({
            kind: "textarea",
            name,
            label: getLabelForInput(ta, formEl),
            required: ta.hasAttribute("required"),
            disabled: ta.hasAttribute("disabled"),
            id: ta.id || null,
            defaultValue: ta.value ?? ta.textContent ?? "",
            placeholder: ta.getAttribute("placeholder") ?? undefined,
            rows: ta.hasAttribute("rows") ? Number(ta.getAttribute("rows")) : undefined,
        } as TextareaField);
    }

    // Selects
    for (const sel of selects) {
        const name = sel.getAttribute("name") || "";
        if (!name) continue;
        const options = Array.from(sel.querySelectorAll("option")).map((opt) => ({
            value: opt.getAttribute("value") ?? opt.textContent ?? "",
            label: opt.textContent ?? "",
            selected: opt.hasAttribute("selected"),
        }));
        fields.push({
            kind: "select",
            name,
            label: getLabelForInput(sel, formEl),
            required: sel.hasAttribute("required"),
            disabled: sel.hasAttribute("disabled"),
            id: sel.id || null,
            multiple: sel.hasAttribute("multiple"),
            options,
        } as SelectField);
    }

    // Radios as groups
    for (const [name, radios] of radioMap.entries()) {
        const label = radios.map((r) => getLabelForInput(r, formEl)).find(Boolean);
        fields.push({
            kind: "radio-group",
            name,
            label,
            required: radios.some((r) => r.hasAttribute("required")),
            id: null,
            options: radios.map((r) => ({
                value: r.getAttribute("value") ?? "",
                label: getLabelForInput(r, formEl),
                checked: r.hasAttribute("checked"),
            })),
        } as RadioGroupField);
    }

    // Checkboxes: single vs group
    for (const [name, boxes] of checkboxMap.entries()) {
        if (boxes.length === 1) {
            const box = boxes[0];
            fields.push({
                kind: "checkbox-single",
                name,
                label: getLabelForInput(box, formEl),
                required: box.hasAttribute("required"),
                id: box.id || null,
                valueAttr: box.getAttribute("value") ?? "on",
                checked: box.hasAttribute("checked"),
            } as CheckboxSingleField);
        } else {
            fields.push({
                kind: "checkbox-group",
                name,
                label: boxes.map((b) => getLabelForInput(b, formEl)).find(Boolean),
                required: boxes.some((b) => b.hasAttribute("required")),
                id: null,
                options: boxes.map((b) => ({
                    value: b.getAttribute("value") ?? "on",
                    label: getLabelForInput(b, formEl),
                    checked: b.hasAttribute("checked"),
                })),
            } as CheckboxGroupField);
        }
    }

    return { method, action, enctype, fields };
}

export default function ProtocolHTMLForm({
    submitEvent,
    referenceData,
    HtmlFormConfigInFlow,
}: IProtocolHtmlFormProps) {
    const formHtml = useMemo<string>(() => {
        const value = queryJsonPath(
            { reference_data: referenceData },
            HtmlFormConfigInFlow.reference || ""
        )[0];
        return typeof value === "string" ? value : "";
    }, [referenceData, HtmlFormConfigInFlow.reference]);

    // Parse once per formHtml
    const parsed = useMemo<ParsedForm>(() => parseFormHtml(formHtml), [formHtml]);

    // Build initial state from defaults/selected
    const [values, setValues] = useState<ValueState>(() => {
        const v: ValueState = {};
        for (const f of parsed.fields) {
            switch (f.kind) {
                case "hidden":
                    v[f.name] = f.value;
                    break;
                case "textlike":
                    v[f.name] = f.defaultValue ?? "";
                    break;
                case "textarea":
                    v[f.name] = f.defaultValue ?? "";
                    break;
                case "select": {
                    const sel = f as SelectField;
                    const selected = sel.options.filter((o) => o.selected).map((o) => o.value);
                    v[f.name] = sel.multiple ? selected : (selected[0] ?? "");
                    break;
                }
                case "radio-group": {
                    const rg = f as RadioGroupField;
                    const selected = rg.options.find((o) => o.checked)?.value ?? "";
                    v[f.name] = selected;
                    break;
                }
                case "checkbox-single": {
                    const cs = f as CheckboxSingleField;
                    v[f.name] = !!cs.checked;
                    break;
                }
                case "checkbox-group": {
                    const cg = f as CheckboxGroupField;
                    const selected = cg.options.filter((o) => o.checked).map((o) => o.value);
                    v[f.name] = selected;
                    break;
                }
                case "file": {
                    v[f.name] = null; // File or File[]
                    break;
                }
            }
        }
        return v;
    });

    const [submissionId, setSubmissionId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Change handlers
    const setField = (name: string, val: unknown) => {
        setValues((prev: ValueState) => ({
            ...prev,
            [name]: val as ValueState[string],
        }));
        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Validation function
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        for (const field of parsed.fields) {
            if (field.required) {
                const value = values[field.name];

                // Check if field is empty or invalid
                if (field.kind === "textlike" || field.kind === "textarea") {
                    if (!value || (typeof value === "string" && value.trim() === "")) {
                        errors[field.name] = `${field.label || field.name} is required`;
                    }
                } else if (field.kind === "select") {
                    if (!value || (typeof value === "string" && value === "")) {
                        errors[field.name] = `${field.label || field.name} is required`;
                    }
                } else if (field.kind === "radio-group") {
                    if (!value || (typeof value === "string" && value === "")) {
                        errors[field.name] = `${field.label || field.name} is required`;
                    }
                } else if (field.kind === "checkbox-group") {
                    if (!value || !Array.isArray(value) || value.length === 0) {
                        errors[field.name] = `${field.label || field.name} is required`;
                    }
                } else if (field.kind === "file") {
                    if (!value || (Array.isArray(value) && value.length === 0)) {
                        errors[field.name] = `${field.label || field.name} is required`;
                    }
                }
            }
        }

        setFieldErrors(errors);
        const isValid = Object.keys(errors).length === 0;
        return isValid;
    };

    // Submit the rebuilt form
    const handleSubmit = async () => {
        // Validate form before submission
        const isValid = validateForm();

        if (!isValid) {
            setError("Please fill in all required fields");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            // Decide encoding: default url-encoded; fallback to multipart if file fields exist
            // Only use FormData when enctype is explicitly multipart.
            // File inputs are handled inline (as text) in the urlencoded path below.
            const hasFile = (parsed.enctype || "").toLowerCase().includes("multipart");

            let res: AxiosResponse<unknown, unknown>;
            if (hasFile) {
                const fd = new FormData();
                for (const f of parsed.fields) {
                    const val = values[f.name];
                    if (f.kind === "checkbox-single") {
                        if (val === true) {
                            const v = (f as CheckboxSingleField).valueAttr ?? "on";
                            fd.append(f.name, v);
                        }
                    } else if (f.kind === "checkbox-group") {
                        const arr = (val as string[]) || [];
                        for (const item of arr) fd.append(f.name, item);
                    } else if (f.kind === "radio-group") {
                        if (typeof val === "string" && val !== "") fd.append(f.name, val);
                    } else if (f.kind === "select") {
                        if ((f as SelectField).multiple) {
                            const arr = (val as string[]) || [];
                            for (const item of arr) fd.append(f.name, item);
                        } else if (typeof val === "string") {
                            fd.append(f.name, val);
                        }
                    } else if (f.kind === "file") {
                        const v = values[f.name];
                        if (Array.isArray(v)) {
                            for (const file of v) fd.append(f.name, file as File);
                        } else if (v instanceof File) {
                            fd.append(f.name, v);
                        }
                    } else if (
                        f.kind === "hidden" ||
                        f.kind === "textlike" ||
                        f.kind === "textarea"
                    ) {
                        if (val != null) fd.append(f.name, String(val));
                    }
                }

                // res = await fetch(parsed.action || window.location.href, {
                // 	method: parsed.method,
                // 	body: fd,
                // });
                res = (await htmlFormSubmit(
                    parsed.action || window.location.href,
                    fd
                )) as AxiosResponse<unknown, unknown>;
            } else {
                const params = new URLSearchParams();
                for (const f of parsed.fields) {
                    const val = values[f.name];
                    if (f.kind === "checkbox-single") {
                        if (val === true) {
                            const v = (f as CheckboxSingleField).valueAttr ?? "on";
                            params.append(f.name, v);
                        }
                    } else if (f.kind === "checkbox-group") {
                        const arr = (val as string[]) || [];
                        for (const item of arr) params.append(f.name, item);
                    } else if (f.kind === "radio-group") {
                        if (typeof val === "string" && val !== "") params.append(f.name, val);
                    } else if (f.kind === "select") {
                        if ((f as SelectField).multiple) {
                            const arr = (val as string[]) || [];
                            for (const item of arr) params.append(f.name, item);
                        } else if (typeof val === "string") {
                            params.append(f.name, val);
                        }
                    } else if (f.kind === "file") {
                        // no files -> skip in urlencoded mode
                    } else if (
                        f.kind === "hidden" ||
                        f.kind === "textlike" ||
                        f.kind === "textarea"
                    ) {
                        if (val != null) params.append(f.name, String(val));
                    }
                }

                res = (await htmlFormSubmit(
                    parsed.action || window.location.href,
                    params.toString()
                )) as AxiosResponse<unknown, unknown>;
            }
            // Parse response
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
                data = res.data as {
                    submission_id?: string;
                    data?: { submission_id?: string };
                    result?: { submission_id?: string };
                };
            } else {
                const text = typeof res.data === "string" ? res.data : String(res.data);
                const match = text.match(/"submission_id"\s*:\s*"([^"]+)"/i);
                data = match
                    ? { submission_id: match[1] }
                    : (res.data as {
                          submission_id?: string;
                          data?: { submission_id?: string };
                          result?: { submission_id?: string };
                      });
                // data = match ? { submission_id: match[1] } : { raw: text };
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

            // Build a simple key/value payload for your pipeline
            const plainPayload: Record<string, string> = {};
            for (const f of parsed.fields) {
                const val = values[f.name];
                if (f.kind === "checkbox-group" || (f.kind === "select" && f.multiple)) {
                    (val as string[] | undefined)?.forEach((v, i) => {
                        plainPayload[`${f.name}[${i}]`] = v;
                    });
                } else if (f.kind === "file") {
                    // send filenames only to your submitEvent; upstream already got binary
                    if (Array.isArray(val)) {
                        val.forEach(
                            (file, i) =>
                                (plainPayload[`${f.name}[${i}]`] = (file as File)?.name ?? "")
                        );
                    } else if (val instanceof File) {
                        plainPayload[f.name] = val.name;
                    }
                } else if (typeof val === "boolean") {
                    if (val) {
                        // emulate HTML checkbox submit value
                        const v = (f as CheckboxSingleField).valueAttr ?? "on";
                        plainPayload[f.name] = v;
                    }
                } else if (val != null) {
                    plainPayload[f.name] = String(val);
                }
            }
            // const Subdata = {
            //   jsonpath: { submission_id: finalSubmissionId },
            //   formData: { submission_id: finalSubmissionId },
            // };

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

    const errorCount = Object.keys(fieldErrors).length;

    return (
        <FormDialogShell
            onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
            }}
            footer={
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                        ? "Submitting..."
                        : errorCount > 0
                          ? `Fix ${errorCount} Error${errorCount > 1 ? "s" : ""}`
                          : "Submit"}
                </Button>
            }
        >
            <div className="space-y-4 rounded-lg border border-border-default p-4">
                <div className="grid grid-cols-1 gap-4">
                    {parsed.fields.map((field, index) => (
                        <div key={`${field.name}-${index}`}>
                            <ProtocolHtmlFieldRenderer
                                field={field}
                                value={values[field.name]}
                                onValueChange={(nextValue) => setField(field.name, nextValue)}
                                error={fieldErrors[field.name]}
                            />
                        </div>
                    ))}
                </div>

                {errorCount > 0 && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                        <p className="text-sm font-medium text-destructive">
                            Please fill in {errorCount} required field
                            {errorCount > 1 ? "s" : ""}:
                        </p>
                        <ul className="mt-1 list-inside list-disc text-sm text-destructive">
                            {Object.values(fieldErrors).map((fieldError, index) => (
                                <li key={index}>{fieldError}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {parsed.action && (
                    <p className="text-xs text-text-secondary wrap-break-word">
                        POST to <code className="break-all">{parsed.action}</code>
                    </p>
                )}

                <div className="space-y-2 text-sm wrap-break-word">
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
