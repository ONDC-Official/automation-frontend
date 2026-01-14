import { useContext } from "react";
import { FormInput } from "@components/Input";
import FormSelect from "@/components/Select/form-select";
import CheckboxGroup from "@components/CheckboxGroup";
import ItemCustomisationSelector from "@/components/Select/nested-select";
import GenericForm from "@components/GenericForm";
import { SubmitEventParams } from "@/types/flow-types";
import Ret10GrocerySelect from "@components/Select/ret10-grocery-select";
import ProtocolHTMLForm from "@components/ProtocolHtmlForm";
import TRVSelect from "@components/Select/trv-select";
import TRV10Select from "@components/Select/trv10-select";
import TRV10ScheduleForm from "@/components/TrvSchedule";
import TRV10ScheduleRentalForm from "@/components/TrvSchedule/Rental";
import TRV11Select from "@components/Select/trv11-select";
import JsonSchemaForm from "@pages/protocol-playground/ui/extras/rsjf-form";
import AirlineSelect from "@components/Select/airline-select";
import TRV12busSeatSelection from "@components/TrvSeatCount";
import FinvuRedirectForm from "@components/FinvuRedirectForm";
import DynamicFormHandler from "@components/DynamicFormHandler";
import { SessionContext } from "@context/sessionContext";
import { IFormConfigProps, IFormFieldConfigProps } from "@components/ConfigForm/types";
import { JSONSchema7 } from "json-schema";
import { UseFormRegister, FieldValues, Path } from "react-hook-form";

const FormConfig = ({
  formConfig,
  submitEvent,
  referenceData,
  flowId,
}: {
  formConfig: IFormConfigProps;
  submitEvent: (data: SubmitEventParams) => Promise<void>;
  referenceData?: Record<string, unknown>;
  flowId?: string;
}) => {
  const sessionContext = useContext(SessionContext);
  const sessionId = sessionContext?.sessionId || "";
  const sessionData = sessionContext?.sessionData;

  const onSubmit = async (data: Record<string, unknown>) => {
    const formatedData: Record<string, string | number> = {};
    const formData: Record<string, string> = {};
    for (const key in data) {
      const value = data[key];
      const stringValue = typeof value === "string" ? value : String(value || "");
      formData[key] = stringValue;

      const payloadField = formConfig.find(
        (field: IFormFieldConfigProps) => field.name === key
      )?.payloadField;
      if (payloadField) {
        // Convert to integer if the payloadField contains 'count' or 'quantity'
        if (payloadField.includes("count") || payloadField.includes("quantity")) {
          formatedData[payloadField] = parseInt(stringValue, 10) || 0;
        } else {
          formatedData[payloadField] = stringValue;
        }
      }
    }
    await submitEvent({ jsonPath: formatedData, formData: formData });
  };

  const defaultValues: Record<string, unknown> = {};
  let isNoFieldVisible = false;

  formConfig.forEach((field: IFormFieldConfigProps) => {
    const { display = true } = field;

    if (field.default) {
      defaultValues[field.name] = field.default;
    }

    if (display) {
      isNoFieldVisible = true;
    }
  });

  // Check for schema form
  if (formConfig.find((f: IFormFieldConfigProps) => f.schema)) {
    const schemaField = formConfig.find((f) => f.schema);
    return JsonSchemaForm({
      schema: schemaField!.schema as JSONSchema7,
      onSubmit: onSubmit,
    });
  }

  // Check for DYNAMIC_FORM type
  if (formConfig.find((field: IFormFieldConfigProps) => field.type === "DYNAMIC_FORM")) {
    // Get transaction ID from session context using flowId
    let transactionId: string | undefined = undefined;
    if (flowId && sessionData && sessionData.flowMap) {
      transactionId = sessionData.flowMap[flowId] || undefined;
    }

    const dynamicFormField = formConfig.find(
      (field: IFormFieldConfigProps) => field.type === "DYNAMIC_FORM"
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
  if (formConfig.find((field: IFormFieldConfigProps) => field.type === "FINVU_REDIRECT")) {
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

  if (formConfig.find((field: IFormFieldConfigProps) => field.type === "ret10_grocery_select")) {
    return <Ret10GrocerySelect submitEvent={submitEvent} />;
  }

  if (
    formConfig.find((field: IFormFieldConfigProps) => field.type === "trv12_bus_seat_selection")
  ) {
    return <TRV12busSeatSelection submitEvent={submitEvent} />;
  }

  if (formConfig.find((field: IFormFieldConfigProps) => field.type === "HTML_FORM")) {
    return ProtocolHTMLForm({
      submitEvent: submitEvent,
      referenceData: referenceData,
      HtmlFormConfigInFlow: formConfig.find(
        (field: IFormFieldConfigProps) => field.type === "HTML_FORM"
      ) as IFormFieldConfigProps,
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
    return <TRVSelect submitEvent={submitEvent} flowId={flowId} />;
  }

  if (formConfig.find((field) => field.type === "trv11_select")) {
    return <TRV11Select submitEvent={submitEvent} />;
  }

  if (formConfig.find((field) => field.type === "airline_select")) {
    return <AirlineSelect submitEvent={submitEvent} />;
  }

  // Placeholder register function that will be overridden by GenericForm
  // GenericForm injects the real register function via React.cloneElement
  const placeholderRegister = (() => ({})) as unknown as UseFormRegister<FieldValues>;

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
                register={placeholderRegister}
                name={field.name as Path<FieldValues>}
                label={field.label}
                required={true}
                errors={{}}
                // key={field.payloadField}
              />
            );
          case "select":
            return (
              <FormSelect
                register={placeholderRegister}
                name={field.name as Path<FieldValues>}
                label={field.label}
                options={field.values || []}
                errors={{}}
                // key={field.payloadField}
              />
            );
          case "checkbox":
            return (
              <CheckboxGroup
                options={
                  Array.isArray(field.options)
                    ? (field.options as Array<{ name: string; code: string }>)
                    : []
                }
                label={field.label}
                name={field.name as Path<FieldValues>}
                defaultValue={
                  Array.isArray(field.default)
                    ? (field.default as string[])
                    : typeof field.default === "string"
                      ? [field.default]
                      : []
                }
              />
            );
          case "nestedSelect":
            return (
              <ItemCustomisationSelector
                label={field.label}
                name={field.name}
                setValue={() => {}}
              />
            );
          default:
            return <></>;
        }
      })}
    </GenericForm>
  );
};

export default FormConfig;
