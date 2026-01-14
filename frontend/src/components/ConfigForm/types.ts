export interface IFormFieldConfigProps {
  name: string;
  label: string;
  type:
    | "text"
    | "select"
    | "textarea"
    | "list"
    | "checkbox"
    | "boolean"
    | "trv12_bus_seat_selection"
    | "airline_select"
    | "ret10_grocery_select"
    | "nestedSelect"
    | "trv_select"
    | "trv10_select"
    | "trv10_schedule"
    | "trv10_schedule_rental"
    | "trv11_select"
    | "HTML_FORM"
    | "FINVU_REDIRECT"
    | "DYNAMIC_FORM";
  payloadField: string;
  values?: string[];
  defaultValue?: string;
  input?: IFormFieldConfigProps[];
  options?: unknown;
  default?: unknown;
  display?: boolean;
  reference?: string;
  schema?: unknown;
}

export type IFormConfigProps = IFormFieldConfigProps[];
