import { useContext } from "react";
import { FormInput } from "../form-input";
import FormSelect from "../form-select";
import CheckboxGroup from "../checkbox";
import ItemCustomisationSelector from "../nested-select";
import GenericForm from "../generic-form";
import { SubmitEventParams } from "../../../../types/flow-types";
import Ret10GrocerySelect from "../custom-forms/ret10-grocery-select";
import ProtocolHTMLForm from "../custom-forms/protocol-html-form";
import TRVSelect from "../custom-forms/trv-select";
import TRV10Select from "../custom-forms/trv10-select";
import TRV10ScheduleForm from "../custom-forms/trv10-schedule";
import TRV10ScheduleRentalForm from "../custom-forms/trv10-scheduleRental";
import TRV11Select from "../custom-forms/trv11-select";
import JsonSchemaForm from "../../../protocol-playground/ui/extras/rsjf-form";
import AirlineSelect from "../custom-forms/airline-select";
import TRV12busSeatSelection from "../custom-forms/trv-seat-count";
import FinvuRedirectForm from "../custom-forms/finvu-redirect-form";
import DynamicFormHandler from "../custom-forms/dynamic-form-handler";
import { SessionContext } from "../../../../context/context";

export interface FormFieldConfigType {
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
  input?: FormFieldConfigType[];
  options?: any;
  default?: any;
  display?: boolean;
  reference?: string;
  schema?: any;
}

export type FormConfigType = FormFieldConfigType[];

export default function FormConfig({
  formConfig,
  submitEvent,
  referenceData,
  flowId,
}: {
  formConfig: FormConfigType;
  submitEvent: (data: SubmitEventParams) => Promise<void>;
  referenceData?: Record<string, any>;
  flowId?: string;
}) {
  const sessionContext = useContext(SessionContext);
  const sessionId = sessionContext?.sessionId || "";
  const sessionData = sessionContext?.sessionData;

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

  const defaultValues: any = {};
  let isNoFieldVisible = false;

  formConfig.forEach((field) => {
    const { display = true } = field;

    if (field.default) {
      defaultValues[field.name] = field.default;
    }

    if (display) {
      isNoFieldVisible = true;
    }
  });

  // Check for schema form
  if (formConfig.find((f) => f.schema)) {
    const schemaField = formConfig.find((f) => f.schema);
    return JsonSchemaForm({
      schema: schemaField!.schema,
      onSubmit: onSubmit,
    });
  }

  // Check for DYNAMIC_FORM type
  if (formConfig.find((field) => field.type === "DYNAMIC_FORM")) {
    // Get transaction ID from session context using flowId
    let transactionId: string | undefined = undefined;
    if (flowId && sessionData && sessionData.flowMap) {
      transactionId = sessionData.flowMap[flowId] || undefined;
    }

    const dynamicFormField = formConfig.find(
      (field) => field.type === "DYNAMIC_FORM"
    );

    return (
      <DynamicFormHandler
        submitEvent={submitEvent}
        referenceData={referenceData}
        sessionId={sessionId}
        transactionId={transactionId || ""}
        formConfig={dynamicFormField}
      />
    );
  }

  // Check for FINVU_REDIRECT type
  if (formConfig.find((field) => field.type === "FINVU_REDIRECT")) {
    // Get transaction ID from session context using flowId
    let transactionId: string | undefined = undefined;
    if (flowId && sessionData && sessionData.flowMap) {
      transactionId = sessionData.flowMap[flowId] || undefined;
    }

    return (
      <FinvuRedirectForm
        submitEvent={submitEvent}
        referenceData={referenceData}
        sessionId={sessionId}
        transactionId={transactionId || ""}
      />
    );
  }

  if (formConfig.find((field) => field.type === "ret10_grocery_select")) {
    return <Ret10GrocerySelect submitEvent={submitEvent} />;
  }

  if (formConfig.find((field) => field.type === "trv12_bus_seat_selection")) {
    return <TRV12busSeatSelection submitEvent={submitEvent} />;
  }

  if (formConfig.find((field) => field.type === "HTML_FORM")) {
    return ProtocolHTMLForm({
      submitEvent: submitEvent,
      referenceData: referenceData,
      HtmlFormConfigInFlow: formConfig.find(
        (field) => field.type === "HTML_FORM"
      ) as FormFieldConfigType,
    });
  }

  // Default: GenericForm
  if (formConfig.find((field) => field.type === "trv10_select")) {
    return <TRV10Select submitEvent={submitEvent} />;
  }

  if (formConfig.find((field) => field.type === "trv10_schedule")) {
    return <TRV10ScheduleForm submitEvent={submitEvent} />;
  }

  if (formConfig.find((field) => field.type === "trv10_schedule_rental")) {
    return <TRV10ScheduleRentalForm submitEvent={submitEvent} />;
  }

  if (formConfig.find((field) => field.type === "trv_select")) {
    return <TRVSelect submitEvent={submitEvent} />;
  }

  if (formConfig.find((field) => field.type === "trv11_select")) {
    return <TRV11Select submitEvent={submitEvent} />;
  }

  if (formConfig.find((field) => field.type === "airline_select")) {
    return <AirlineSelect submitEvent={submitEvent} />;
  }

  return (
    <GenericForm
      defaultValues={defaultValues}
      className="h-[500px] overflow-scroll"
      onSubmit={onSubmit}
      triggerSubmit={!isNoFieldVisible}
    >
      {formConfig.map((field) => {
        const { display = true } = field;
        if (!display) {
          return <></>;
        }

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
                defaultValue={field.default}
              />
            );
          case "nestedSelect":
            return (
              <ItemCustomisationSelector
                label={field.label}
                name={field.name}
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
