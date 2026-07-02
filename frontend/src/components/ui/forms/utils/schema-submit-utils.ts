import type { RJSFSchema } from "@rjsf/utils";

import { formatFormFieldForPayload } from "@/components/ui/forms/utils/date-utils";

interface ISchemaSubmitFieldConfig {
    name: string;
    payloadField?: string;
    type?: string;
}

/** Build jsonPath + formData for RJSF schema forms used in flow modals. */
export const buildSchemaFormSubmit = (
    schema: RJSFSchema,
    data: Record<string, unknown>,
    formConfig: ISchemaSubmitFieldConfig[]
) => {
    const jsonPath: Record<string, string | number> = {};
    const formData: Record<string, string> = {};

    for (const [key, rawValue] of Object.entries(data)) {
        if (rawValue === undefined || rawValue === null) {
            continue;
        }

        const schemaProp = (schema.properties?.[key] ?? {}) as Record<string, unknown>;
        const payloadField =
            (schemaProp["x-payloadField"] as string | undefined) ??
            formConfig.find((field) => field.name === key)?.payloadField;

        const stringValue =
            typeof rawValue === "object" ? JSON.stringify(rawValue) : String(rawValue);
        formData[key] = stringValue;

        if (payloadField) {
            const fieldConfig = formConfig.find((field) => field.name === key);
            jsonPath[payloadField] = formatFormFieldForPayload(stringValue, {
                type: fieldConfig?.type,
                payloadField,
            });
        }
    }

    return { jsonPath, formData };
};
