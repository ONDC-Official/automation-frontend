import { SubmitEventParams } from "@/types/flow-types";

// Airline Select interfaces
export interface IFormItem {
  itemId: string;
  count: number;
  addOnId: string;
  addOnCount: number;
}

export interface IFormData {
  provider: string;
  fulfillment: string;
  items: IFormItem[];
}

export interface ICatalogItem {
  id: string;
  name: string;
  addOns: { id: string; name: string }[];
}

export interface IAirlineSelectProps {
  submitEvent: (data: SubmitEventParams) => Promise<void>;
  defaultValues?: IFormData;
}

// Airline Seat Select interfaces
export interface ISeatFormData {
  seats: { seatNumber: string }[];
}

export interface IAirlineSeatSelectProps {
  submitEvent: (data: SubmitEventParams) => Promise<void>;
  defaultValues?: ISeatFormData;
}

// Default values for components - used as fallback when no props provided
export const DEFAULT_FORM_DATA: IFormData = {
  provider: "",
  fulfillment: "",
  items: [
    {
      itemId: "",
      count: 1,
      addOnId: "",
      addOnCount: 1,
    },
  ],
};

export const DEFAULT_SEAT_FORM_DATA: ISeatFormData = {
  seats: [{ seatNumber: "" }],
};

// Shared style constants
export const FORM_STYLES = {
  inputStyle: "border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white",
  labelStyle: "mb-1 font-semibold text-sm",
  fieldWrapperStyle: "flex flex-col mb-2",
} as const;
