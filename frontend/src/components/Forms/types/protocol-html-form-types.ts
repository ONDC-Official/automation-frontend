import { SubmitEventParams } from "@/types/flow-types";
import { FormFieldConfigType } from "../config-form";
import type { IFormContractContext } from "../utils/resolve-form-contract";

export interface IBaseField {
    kind:
        | "textlike"
        | "textarea"
        | "select"
        | "radio-group"
        | "checkbox-single"
        | "checkbox-group"
        | "file"
        | "hidden";
    name: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    id?: string | null;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    pattern?: string;
    minLength?: string | number;
    maxLength?: string | number;
}

export type ITextLikeField = IBaseField & {
    kind: "textlike";
    inputType:
        | "text"
        | "password"
        | "email"
        | "number"
        | "date"
        | "datetime-local"
        | "month"
        | "time"
        | "url"
        | "tel"
        | "search";
    defaultValue?: string;
    placeholder?: string;
};

export type ITextareaField = IBaseField & {
    kind: "textarea";
    defaultValue?: string;
    placeholder?: string;
    rows?: number;
};

export interface ISelectOption {
    value: string;
    label: string;
    selected?: boolean;
}

export type ISelectField = IBaseField & {
    kind: "select";
    multiple?: boolean;
    options: ISelectOption[];
};

export type IRadioGroupField = IBaseField & {
    kind: "radio-group";
    options: { value: string; label?: string; checked?: boolean }[];
};

export type ICheckboxSingleField = IBaseField & {
    kind: "checkbox-single";
    valueAttr?: string;
    checked?: boolean;
};

export type ICheckboxGroupField = IBaseField & {
    kind: "checkbox-group";
    options: { value: string; label?: string; checked?: boolean }[];
};

export type IFileField = IBaseField & {
    kind: "file";
    multiple?: boolean;
    accept?: string | null;
};

export type IHiddenField = IBaseField & {
    kind: "hidden";
    value: string;
};

export type IAnyField =
    | ITextLikeField
    | ITextareaField
    | ISelectField
    | IRadioGroupField
    | ICheckboxSingleField
    | ICheckboxGroupField
    | IFileField
    | IHiddenField;

export type IParsedForm = {
    method: string;
    action: string;
    enctype?: string | null;
    fields: IAnyField[];
    /** False when the HTML contained no <form> element at all (method/action are then defaults). */
    hasForm: boolean;
    /** Number of <form> elements in the document; only the first one is parsed. */
    formCount: number;
};

export type IValueState = Record<
    string,
    string | string[] | boolean | File | File[] | null | undefined
>;

export interface IProtocolHtmlFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    referenceData?: Record<string, unknown>;
    HtmlFormConfigInFlow: FormFieldConfigType;
    /** Session domain + hints used to resolve this form's contract in FORM_CONTRACTS. */
    contractContext?: IFormContractContext;
    /** Live transaction id for the flow, injected into the form's hidden transactionId field. */
    transactionId?: string;
}

export type BaseField = IBaseField;
export type SelectOption = ISelectOption;
// Backward-compatible aliases used by protocol-html-form-multi and field-renderer
export type TextLikeField = ITextLikeField;
export type TextareaField = ITextareaField;
export type SelectField = ISelectField;
export type RadioGroupField = IRadioGroupField;
export type CheckboxSingleField = ICheckboxSingleField;
export type CheckboxGroupField = ICheckboxGroupField;
export type FileField = IFileField;
export type HiddenField = IHiddenField;
export type AnyField = IAnyField;
export type ParsedForm = IParsedForm;
export type ValueState = IValueState;
