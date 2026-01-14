import { SubmitEventParams } from "@/types/flow-types";
import { IFormFieldConfigProps } from "@components/ConfigForm/types";

export interface IDynamicFormHandlerProps {
  submitEvent: (data: SubmitEventParams) => Promise<void>;
  referenceData?: Record<string, unknown>;
  sessionId: string;
  transactionId: string;
  formConfig?: IFormFieldConfigProps;
}
