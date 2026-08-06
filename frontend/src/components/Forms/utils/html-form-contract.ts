import type {
    AnyField,
    IBaseField,
    ParsedForm,
    TextLikeField,
} from "../types/protocol-html-form-types";

import { protocolIdKindFor } from "./html-form-values";

// Contract validation answers "is this seller form usable / as specified?" — it runs once per
// fetched HTML, before the tester types anything. It is deliberately separate from value
// validation (which checks what the tester entered on submit).

/** One field the flow expects the seller form to expose. Authored per HTML_FORM input in the flow YAML. */
export interface IExpectedField {
    name: string;
    kind?: IBaseField["kind"];
    /** Only meaningful for kind "textlike". */
    inputType?: TextLikeField["inputType"];
    /** True when the seller form is expected to mark the field required. */
    required?: boolean;
}

export type FormContractSeverity = "error" | "warning";

export type FormContractIssueCode =
    | "empty-response"
    | "non-html-response"
    | "no-form"
    | "no-fields"
    | "multiple-forms"
    | "missing-action"
    | "unsubstituted-action-template"
    | "relative-action"
    | "insecure-action"
    | "unexpected-method"
    | "missing-field"
    | "kind-mismatch"
    | "input-type-mismatch"
    | "required-not-marked"
    | "extra-field"
    | "unfillable-hidden"
    | "required-disabled"
    | "contract-ambiguous";

export interface IFormContractIssue {
    code: FormContractIssueCode;
    severity: FormContractSeverity;
    message: string;
    /** Field name the issue belongs to, when it is field-scoped. */
    field?: string;
}

export interface IValidateFormContractArgs {
    parsed: ParsedForm;
    /** Raw HTML the parser was given — used to tell "empty"/"not HTML" apart from "no <form>". */
    formHtml: string;
    expectedFields?: IExpectedField[];
    /** Final value per hidden field name, as resolved by resolveHiddenValues. */
    hiddenValues?: Record<string, string>;
    /** True when the HTML came from a seller URL rather than embedded reference_data. */
    isUrlSource?: boolean;
}

const KIND_LABEL: Record<IBaseField["kind"], string> = {
    textlike: "text input",
    textarea: "textarea",
    select: "select",
    "radio-group": "radio group",
    "checkbox-single": "checkbox",
    "checkbox-group": "checkbox group",
    file: "file input",
    hidden: "hidden input",
};

const SEVERITY_ORDER: Record<FormContractSeverity, number> = { error: 0, warning: 1 };

function describeField(field: AnyField): string {
    return KIND_LABEL[field.kind];
}

/**
 * Checks the parsed seller form against the flow's expectations plus a set of structural rules.
 * Returns errors first, then warnings; an empty array means the form looks usable.
 */
export function validateFormContract({
    parsed,
    formHtml,
    expectedFields,
    hiddenValues = {},
    isUrlSource = false,
}: IValidateFormContractArgs): IFormContractIssue[] {
    const issues: IFormContractIssue[] = [];
    const add = (
        code: FormContractIssueCode,
        severity: FormContractSeverity,
        message: string,
        field?: string
    ) => issues.push({ code, severity, message, ...(field ? { field } : {}) });

    const html = (formHtml ?? "").trim();
    const source = isUrlSource ? "Seller returned" : "Flow reference_data holds";

    // --- Payload sanity: nothing to validate against ---------------------------------
    if (!html) {
        add("empty-response", "error", `${source} an empty form body.`);
        return issues;
    }
    if (!html.includes("<")) {
        add(
            "non-html-response",
            "error",
            `${source} a body with no HTML markup (likely a plain-text or JSON error response).`
        );
        return issues;
    }
    if (html.startsWith("{") || html.startsWith("[")) {
        add(
            "non-html-response",
            "error",
            `${source} JSON instead of an HTML form (likely an error payload from the form endpoint).`
        );
        return issues;
    }

    // --- Structure -------------------------------------------------------------------
    if (!parsed.hasForm) {
        add("no-form", "error", "No <form> element found in the returned HTML.");
        return issues;
    }
    if ((parsed.formCount ?? 1) > 1) {
        add(
            "multiple-forms",
            "warning",
            `${parsed.formCount} <form> elements found — only the first one is rendered and submitted.`
        );
    }
    if (parsed.fields.length === 0) {
        add(
            "no-fields",
            "error",
            "The <form> has no named inputs — every field needs a name attribute to be submitted."
        );
    }

    const action = (parsed.action || "").trim();
    if (action.includes("<%") || action.includes("${") || action.includes("{{")) {
        add(
            "unsubstituted-action-template",
            "error",
            `Form action still contains an unsubstituted template placeholder ("${action}").`
        );
    } else if (!action) {
        add(
            "missing-action",
            "error",
            "Form has no action attribute — submitting would post back to the workbench instead of the seller."
        );
    } else if (/^http:\/\//i.test(action)) {
        add("insecure-action", "warning", `Form action uses plain http:// ("${action}").`);
    } else if (!/^https?:\/\//i.test(action)) {
        add(
            "relative-action",
            "warning",
            `Form action "${action}" is relative — the workbench proxy needs an absolute URL to submit it.`
        );
    }

    if (parsed.method && parsed.method.toUpperCase() !== "POST") {
        add(
            "unexpected-method",
            "warning",
            `Form method is ${parsed.method.toUpperCase()} — xInput forms are expected to be POST.`
        );
    }

    // --- Per-field fillability -------------------------------------------------------
    for (const field of parsed.fields) {
        if (field.kind === "hidden") {
            if (!hiddenValues[field.name]) {
                const kind = protocolIdKindFor(field.name);
                add(
                    "unfillable-hidden",
                    "error",
                    kind
                        ? `Hidden field "${field.name}" is empty — the session has no ${kind} to inject, so it will be submitted blank.`
                        : `Hidden field "${field.name}" is empty and cannot be filled by the tester — it will be submitted blank.`,
                    field.name
                );
            }
            continue;
        }
        if (field.required && field.disabled) {
            add(
                "required-disabled",
                "error",
                `Field "${field.name}" is required but disabled — the tester cannot provide a value.`,
                field.name
            );
        }
    }

    // --- Expected-field contract -----------------------------------------------------
    if (expectedFields?.length) {
        const byName = new Map<string, AnyField>();
        for (const field of parsed.fields) {
            if (!byName.has(field.name)) byName.set(field.name, field);
        }

        for (const expected of expectedFields) {
            const field = byName.get(expected.name);
            if (!field) {
                add(
                    "missing-field",
                    "error",
                    `Expected field "${expected.name}" is not present in the seller form.`,
                    expected.name
                );
                continue;
            }
            if (expected.kind && field.kind !== expected.kind) {
                add(
                    "kind-mismatch",
                    "warning",
                    `Field "${expected.name}" is a ${describeField(field)} but the flow expects a ${KIND_LABEL[expected.kind]}.`,
                    expected.name
                );
            } else if (
                expected.inputType &&
                field.kind === "textlike" &&
                (field as TextLikeField).inputType !== expected.inputType
            ) {
                add(
                    "input-type-mismatch",
                    "warning",
                    `Field "${expected.name}" has type="${(field as TextLikeField).inputType}" but the flow expects type="${expected.inputType}".`,
                    expected.name
                );
            }
            if (expected.required && !field.required) {
                add(
                    "required-not-marked",
                    "warning",
                    `Field "${expected.name}" is expected to be required but the seller form does not mark it required.`,
                    expected.name
                );
            }
        }

        const expectedNames = new Set(expectedFields.map((expected) => expected.name));
        for (const field of parsed.fields) {
            // Hidden fields are plumbing (transaction ids etc.), not part of the authored contract.
            if (field.kind === "hidden" || expectedNames.has(field.name)) continue;
            add(
                "extra-field",
                "warning",
                `Seller form has an extra field "${field.name}" (${describeField(field)}) that the flow does not expect.`,
                field.name
            );
        }
    }

    return issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
