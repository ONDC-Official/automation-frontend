import { FormInput } from "../form-input";
import FormSelect from "../form-select";
import CheckboxGroup from "../checkbox";
import GenericForm from "../generic-form";
import { SubmitEventParams } from "../../../../types/flow-types";

export interface FormFieldConfigType {
  name: string;
  label: string;
  type: "text" | "select" | "textarea" | "list" | "checkbox";
  payloadField: string;
  values?: string[];
  defaultValue?: string;
  input?: FormFieldConfigType[];
  options?: any;
}

export type FormConfigType = FormFieldConfigType[];

export default function FormConfig({
  formConfig,
  submitEvent,
}: {
  formConfig: FormConfigType;
  submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
  const onSubmit = async (data: Record<string, string>) => {
    const formatedData: Record<string, string> = {};
    const formData: Record<string, string> = data;
    for (const key in data) {
      const payloadField = formConfig.find(
        (field) => field.name === key
      )?.payloadField;
      if (payloadField) {
        formatedData[payloadField] = data[key];
      }
    }
    await submitEvent({ jsonPath: formatedData, formData: formData });
    console.log({ jsonPath: formatedData, formData: formData });
  };

  return (
    <GenericForm className="h-[500px] overflow-scroll" onSubmit={onSubmit}>
      {formConfig.map((field) => {
        switch (field.type) {
          case "text":
            return (
              <FormInput
                name={field.name}
                label={field.label}
                required={true}
                // key={field.payloadField}
              />
            );
          case "select":
            return (
              <FormSelect
                name={field.name}
                label={field.label}
                options={field.values}
                // key={field.payloadField}
              />
            );
          case "checkbox":
            return (
              <CheckboxGroup
                options={field.options}
                label={field.label}
                name={field.name}
                onChange={(data) =>
                  console.log("data::::::::: checkbixes", data)
                }
              />
            );
          default:
            console.log("Invalid field type");
            return <></>;
        }
      })}
    </GenericForm>
  );
}
