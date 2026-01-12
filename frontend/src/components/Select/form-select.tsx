import React from "react";
import { UseFormRegisterReturn } from "react-hook-form";
import { LabelWithToolTip } from "@components/Input";
import { inputClass } from "@utils/input-class";

interface IOption {
  key: string;
  value: string;
}

interface FormSelectProps {
  register?: (name: string, rules?: Record<string, unknown>) => UseFormRegisterReturn<string>;
  name: string;
  label: string;
  options: (string | IOption)[];
  errors?: Record<string, { message?: string }>;
  setSelectedValue?: (value: string) => void;
  defaultValue?: string;
  labelInfo?: string;
  nonSelectedValue?: boolean;
  disabled?: boolean;
  required?: boolean | string;
  currentValue?: string;
  setValue?: (name: string, value: unknown, options?: Record<string, unknown>) => void;
}

const FormSelect = ({
  register = (): UseFormRegisterReturn<string> => ({
    onChange: async () => {},
    onBlur: async () => {},
    ref: () => {},
    name: "",
  }),
  name,
  label,
  options,
  errors,
  setSelectedValue = (_: string) => {},
  defaultValue,
  labelInfo = "",
  nonSelectedValue = false,
  disabled = false,
  required = false,
  currentValue,
  setValue,
}: FormSelectProps) => {
  // Register field with react-hook-form for validation
  const registerProps = register(name, {
    required: required
      ? typeof required === "string"
        ? required
        : "This field is required"
      : false,
  });

  // If currentValue is explicitly provided (including empty string), use controlled mode
  const isControlled = currentValue !== undefined;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;

    if (isControlled) {
      // Controlled mode: manually sync with react-hook-form
      if (setValue) {
        setValue(name, newValue);
      }
    } else {
      // Uncontrolled mode: use react-hook-form's onChange
      registerProps.onChange?.(e);
    }

    // Call external callback for state management
    setSelectedValue(newValue);
  };

  const selectProps = isControlled
    ? {
        value: currentValue,
        onChange: handleChange,
        name,
        ref: registerProps.ref, // Keep ref for react-hook-form validation
      }
    : {
        ...registerProps,
        onChange: handleChange,
        defaultValue,
      };

  return (
    <div className="mb-2 w-full bg-gray-50 border rounded-md p-2 flex">
      <LabelWithToolTip labelInfo={labelInfo} label={label} required={required} />
      <select {...selectProps} className={inputClass} disabled={disabled}>
        {nonSelectedValue && (
          <option value="" disabled>
            Select a value
          </option>
        )}

        {options.map((option: string | IOption, index: number) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.key;

          return (
            <option value={optionValue} key={index}>
              {optionLabel}
            </option>
          );
        })}
      </select>
      {errors?.[name] && <p className="text-red-500 text-xs italic">{errors[name].message}</p>}
    </div>
  );
};

export default FormSelect;
