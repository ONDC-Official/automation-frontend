import { useMemo, useState } from "react";
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import {
    RJSFSchema,
    UiSchema,
    FieldTemplateProps,
    ObjectFieldTemplateProps,
    ArrayFieldTemplateProps,
    ValidatorType,
    GenericObjectType,
    RegistryWidgetsType,
} from "@rjsf/utils";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/Shadcn/Button/button";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import GpsWidget from "@/components/ui/forms/GpsMapPicker";

import "./rsjs.css";

const PLAYGROUND_RJSF_FORM_ID = "playground-rjsf-form";
export const FLOW_RJSF_FORM_ID = "flow-rjsf-form";

const WIDGETS: RegistryWidgetsType = { gps: GpsWidget };

/** A schema property is a GPS coordinate if it maps to a *.location.gps payload field
 * or its name looks like a gps field (e.g. start_gps / end_gps). */
function isGpsProperty(name: string, prop: Record<string, unknown>): boolean {
    const payloadField = prop?.["x-payloadField"];
    if (typeof payloadField === "string" && payloadField.includes("location.gps")) return true;
    return /(^|_)gps$/i.test(name);
}

/** Build a uiSchema that routes GPS properties (recursively) to the custom map-picker widget. */
function buildGpsUiSchema(
    schema: RJSFSchema
): UiSchema<Record<string, unknown>, RJSFSchema, GenericObjectType> {
    const ui: UiSchema<Record<string, unknown>, RJSFSchema, GenericObjectType> = {};
    const props = (schema?.properties ?? {}) as Record<string, RJSFSchema>;
    for (const [name, prop] of Object.entries(props)) {
        if (prop && typeof prop === "object" && prop.type === "object" && prop.properties) {
            const nested = buildGpsUiSchema(prop);
            if (Object.keys(nested).length) ui[name] = nested;
        } else if (isGpsProperty(name, prop as Record<string, unknown>)) {
            ui[name] = { "ui:widget": "gps" };
        }
    }
    return ui;
}

interface FormChangeEvent {
    formData?: Record<string, unknown>;
}

interface JsonSchemaFormProps {
    schema: RJSFSchema;
    formData?: Record<string, unknown>;
    onSubmit: (data: Record<string, unknown>) => Promise<void>;
    onChange?: (data: Record<string, unknown>) => void;
    title?: string;
    /** Route GPS fields to the Leaflet map-picker. Only enabled for the ride-map domain
     *  (TRV10 2.1.0); for every other domain GPS fields render as plain text inputs. */
    mapEnabled?: boolean;
    /** `flow` wraps content in FormDialogShell and moves submit to the footer. */
    variant?: "playground" | "flow";
}

function CustomFieldTemplate(props: FieldTemplateProps) {
    const { id, label, required, description, errors, help, children, hidden, displayLabel } =
        props;

    if (hidden) {
        return <div className="field-hidden">{children}</div>;
    }

    return (
        <div className="form-group">
            {displayLabel && label && (
                <label htmlFor={id} className={required ? "required" : ""}>
                    {label}
                </label>
            )}
            {description && <div className="field-description">{description}</div>}
            <div className="field-input">{children}</div>
            {errors && <div className="field-error">{errors}</div>}
            {help && <div className="help-block">{help}</div>}
        </div>
    );
}

function CustomObjectFieldTemplate(props: ObjectFieldTemplateProps) {
    const { title, description, properties } = props;
    const useGrid = properties.length > 1;
    const gridClass = useGrid ? "field-object" : "field-object single-field";

    return (
        <fieldset className={gridClass}>
            {title && <legend>{title}</legend>}
            {description && <div className="field-description">{description}</div>}
            <div className="object-properties">
                {properties.map((element) => (
                    <div key={element.name} className="property-wrapper">
                        {element.content}
                    </div>
                ))}
            </div>
        </fieldset>
    );
}

function CustomArrayFieldTemplate(props: ArrayFieldTemplateProps) {
    const { title, items, canAdd, onAddClick } = props;

    return (
        <div className="array-field">
            {title && <span className="array-title">{title}</span>}
            <div className="array-items">
                {items.map((element) => (
                    <div key={element.key} className="array-item">
                        <div className="array-item-content">{element.children}</div>
                        {element.hasRemove && (
                            <button
                                type="button"
                                className="array-item-remove"
                                onClick={element.onDropIndexClick(element.index)}
                                aria-label={`Remove item ${element.index + 1}`}
                            >
                                <TrashIcon className="size-4" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {canAdd && (
                <button
                    type="button"
                    className="array-add-button"
                    onClick={onAddClick}
                    aria-label="Add new item"
                >
                    <PlusIcon className="size-3.5" />
                    Add
                </button>
            )}
        </div>
    );
}

export { PLAYGROUND_RJSF_FORM_ID };
export default function JsonSchemaForm({
    schema,
    formData,
    onSubmit,
    onChange,
    title,
    mapEnabled = false,
    variant = "playground",
}: JsonSchemaFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isFlowVariant = variant === "flow";
    const formId = isFlowVariant ? FLOW_RJSF_FORM_ID : PLAYGROUND_RJSF_FORM_ID;

    const handleSubmit = async ({ formData: nextFormData }: FormChangeEvent) => {
        setIsLoading(true);
        try {
            await onSubmit(nextFormData as Record<string, unknown>);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = ({ formData: nextFormData }: FormChangeEvent) => {
        onChange?.(nextFormData as Record<string, unknown>);
    };

    const uiSchema = useMemo(() => {
        const gpsUi = mapEnabled
            ? buildGpsUiSchema(schema)
            : ({} as UiSchema<Record<string, unknown>, RJSFSchema, GenericObjectType>);

        return {
            ...gpsUi,
            ...(isFlowVariant ? { "ui:submitButtonOptions": { norender: true } } : {}),
        } as UiSchema<Record<string, unknown>, RJSFSchema, GenericObjectType>;
    }, [schema, mapEnabled, isFlowVariant]);

    const formBody = (
        <div className={isFlowVariant ? "flow-schema-form" : undefined}>
            <div className="rjsf-custom-form">
                {title && <h2 className="form-title">{title}</h2>}
                <Form
                    id={formId}
                    schema={schema}
                    uiSchema={uiSchema}
                    widgets={WIDGETS}
                    formData={formData}
                    validator={
                        validator as ValidatorType<GenericObjectType, RJSFSchema, GenericObjectType>
                    }
                    onSubmit={handleSubmit}
                    onChange={handleChange}
                    templates={{
                        FieldTemplate: CustomFieldTemplate,
                        ObjectFieldTemplate: CustomObjectFieldTemplate,
                        ArrayFieldTemplate: CustomArrayFieldTemplate,
                    }}
                    showErrorList={false}
                />
            </div>
        </div>
    );

    if (isFlowVariant) {
        return (
            <FormDialogShell
                footer={
                    <Button type="submit" form={formId} isLoading={isLoading}>
                        Submit
                    </Button>
                }
            >
                {formBody}
            </FormDialogShell>
        );
    }

    return formBody;
}
