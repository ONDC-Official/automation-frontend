import { SubmitEventParams } from "@/types/flow-types";

export interface IFinvuRedirectFormProps {
  submitEvent: (data: SubmitEventParams) => Promise<void>;
  referenceData?: Record<string, unknown>;
  sessionId: string;
  transactionId: string;
}
