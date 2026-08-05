import type {
    AnyField,
    HiddenField,
    SelectField,
    TextLikeField,
    TextareaField,
    ValueState,
} from "../types/protocol-html-form-types";

// Value validation checks what the tester entered, against the constraints the seller's HTML
// declares. It is separate from contract validation (which checks the form's shape, once, at render
// time) and it does block submission — an invalid value would just produce a pointless NACK.

/** HTML5 spec email regex (whatwg "valid e-mail address" production). */
const EMAIL_PATTERN =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const DATE_FORMATS: Partial<Record<TextLikeField["inputType"], { re: RegExp; label: string }>> = {
    date: { re: /^\d{4}-\d{2}-\d{2}$/, label: "YYYY-MM-DD" },
    "datetime-local": {
        re: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/,
        label: "YYYY-MM-DDTHH:MM",
    },
    month: { re: /^\d{4}-\d{2}$/, label: "YYYY-MM" },
    time: { re: /^\d{2}:\d{2}(:\d{2})?$/, label: "HH:MM" },
};

// --- Protocol-owned hidden fields -------------------------------------------------------------
// Seller forms carry `formId` / `transactionId` as hidden inputs, but the values they ship are
// placeholders (`FO1`, or a stale UUID hardcoded into the reference form). The workbench owns these
// two: whatever the HTML declares, the session's real transaction id and the xinput form id win.

export type ProtocolIdKind = "transactionId" | "formId";

export interface IProtocolIds {
    transactionId?: string;
    formId?: string;
}

const HIDDEN_FIELD_ALIASES: Record<string, ProtocolIdKind> = {
    transactionid: "transactionId",
    txnid: "transactionId",
    formid: "formId",
};

/** Which protocol id, if any, a hidden field's name refers to (`transaction_id`, `transactionId`, …). */
export function protocolIdKindFor(name: string): ProtocolIdKind | undefined {
    return HIDDEN_FIELD_ALIASES[name.toLowerCase().replace(/[_\-\s]/g, "")];
}

/**
 * Final value for every hidden field in the form, in precedence order:
 *   1. the resolved protocol id, for `formId` / `transactionId` — overrides the declared placeholder
 *   2. the value the HTML declared
 *   3. a matching query param on the seller form URL
 */
export function resolveHiddenValues(
    fields: AnyField[],
    options: { ids?: IProtocolIds; urlParams?: Record<string, string> } = {}
): Record<string, string> {
    const { ids, urlParams = {} } = options;
    const resolved: Record<string, string> = {};

    for (const field of fields) {
        if (field.kind !== "hidden") continue;

        const kind = protocolIdKindFor(field.name);
        const injected = kind ? ids?.[kind]?.trim() : undefined;
        if (injected) {
            resolved[field.name] = injected;
            continue;
        }

        const declared = (field as HiddenField).value;
        resolved[field.name] =
            declared || urlParams[field.name] || urlParams[field.name.toLowerCase()] || "";
    }

    return resolved;
}

/** Kinds whose value changes in one discrete step, so they are worth re-checking on change. */
export function isDiscreteField(field: AnyField): boolean {
    return (
        field.kind === "select" ||
        field.kind === "radio-group" ||
        field.kind === "checkbox-single" ||
        field.kind === "checkbox-group" ||
        field.kind === "file"
    );
}

function labelOf(field: AnyField): string {
    return field.label || field.name;
}

function toNumber(raw: string | number | undefined): number | undefined {
    if (raw === undefined || raw === "") return undefined;
    const parsed = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function validateTextConstraints(
    field: TextLikeField | TextareaField,
    value: string
): string | undefined {
    const label = labelOf(field);

    const minLength = toNumber(field.minLength);
    if (minLength !== undefined && value.length < minLength) {
        return `${label} must be at least ${minLength} characters`;
    }
    const maxLength = toNumber(field.maxLength);
    if (maxLength !== undefined && value.length > maxLength) {
        return `${label} must be at most ${maxLength} characters`;
    }

    if (field.pattern) {
        try {
            // HTML pattern semantics: the whole value must match.
            if (!new RegExp(`^(?:${field.pattern})$`).test(value)) {
                return `${label} does not match the required format (${field.pattern})`;
            }
        } catch {
            // An invalid pattern in the seller's HTML is a contract problem, not a value problem.
        }
    }

    if (field.kind !== "textlike") return undefined;
    const inputType = field.inputType;

    if (inputType === "number") {
        const parsed = toNumber(value);
        if (parsed === undefined) return `${label} must be a number`;

        const min = toNumber(field.min);
        if (min !== undefined && parsed < min) return `${label} must be ${min} or more`;
        const max = toNumber(field.max);
        if (max !== undefined && parsed > max) return `${label} must be ${max} or less`;

        const step = field.step === "any" ? undefined : toNumber(field.step);
        if (step !== undefined && step > 0) {
            const base = min ?? 0;
            const offset = Math.abs((parsed - base) / step);
            if (Math.abs(offset - Math.round(offset)) > 1e-9) {
                return `${label} must be in steps of ${step}${base ? ` from ${base}` : ""}`;
            }
        }
        return undefined;
    }

    if (inputType === "email") {
        return EMAIL_PATTERN.test(value) ? undefined : `${label} must be a valid email address`;
    }

    if (inputType === "url") {
        try {
            new URL(value);
            return undefined;
        } catch {
            return `${label} must be a valid URL`;
        }
    }

    const dateFormat = DATE_FORMATS[inputType];
    if (dateFormat) {
        if (!dateFormat.re.test(value)) return `${label} must be in ${dateFormat.label} format`;
        // These formats sort lexicographically, so plain string compares work for min/max.
        const min = field.min === undefined ? undefined : String(field.min);
        if (min && value < min) return `${label} must be ${min} or later`;
        const max = field.max === undefined ? undefined : String(field.max);
        if (max && value > max) return `${label} must be ${max} or earlier`;
    }

    return undefined;
}

/** Returns an error message for one field's value, or undefined when it is acceptable. */
export function validateFieldValue(field: AnyField, value: ValueState[string]): string | undefined {
    const label = labelOf(field);
    const requiredMessage = `${label} is required`;

    switch (field.kind) {
        case "textlike":
        case "textarea": {
            const text = typeof value === "string" ? value : "";
            if (text.trim() === "") return field.required ? requiredMessage : undefined;
            return validateTextConstraints(field as TextLikeField | TextareaField, text);
        }
        case "select": {
            // A multi-select holds an array, so the old `!value` test passed on an empty selection.
            if ((field as SelectField).multiple) {
                const selected = Array.isArray(value) ? value : [];
                return field.required && selected.length === 0 ? requiredMessage : undefined;
            }
            const selected = typeof value === "string" ? value : "";
            return field.required && selected === "" ? requiredMessage : undefined;
        }
        case "radio-group": {
            const selected = typeof value === "string" ? value : "";
            return field.required && selected === "" ? requiredMessage : undefined;
        }
        case "checkbox-single": {
            // A required single checkbox is a consent box: it must actually be checked.
            const checked = value === true;
            if (!field.required || checked) return undefined;
            return `${label} must be checked`;
        }
        case "checkbox-group": {
            const selected = Array.isArray(value) ? value : [];
            return field.required && selected.length === 0 ? requiredMessage : undefined;
        }
        case "file": {
            const empty = value == null || (Array.isArray(value) && value.length === 0);
            return field.required && empty ? requiredMessage : undefined;
        }
    }
    return undefined;
}

/**
 * Validates every fillable field, keyed by field name.
 *
 * Hidden fields are deliberately skipped: the tester cannot fix one, so blocking submission on an
 * empty hidden field would be a dead end. Contract validation owns that case instead, reporting it
 * as `unfillable-hidden` at render time — before the tester has filled anything in.
 */
export function validateFormValues(fields: AnyField[], values: ValueState): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const field of fields) {
        if (field.kind === "hidden") continue;
        const message = validateFieldValue(field, values[field.name]);
        if (message && !errors[field.name]) errors[field.name] = message;
    }
    return errors;
}
