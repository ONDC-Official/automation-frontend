import { UseFormRegister, Path, FieldValues } from "react-hook-form";

interface ICheckboxGroupOptionProps {
  name: string;
  code: string;
}

export interface ICheckboxGroupProps<TFieldValues extends FieldValues = FieldValues> {
  options: ICheckboxGroupOptionProps[];
  label: string;
  labelInfo?: string;
  name: Path<TFieldValues>; // form field name
  register?: UseFormRegister<TFieldValues>;
  required?: boolean;
  disabled?: boolean;
  onChange?: (selectedCodes: string[]) => void;
  defaultValue?: string[];
}
