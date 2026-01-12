import { Fragment } from "react";
import { UseFormRegister, FieldValues, Path, RegisterOptions } from "react-hook-form";
import { inputClass, labelClass } from "@utils/input-class";

interface FormInputProps<TFieldValues extends FieldValues = FieldValues> {
  register: UseFormRegister<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  required?: boolean;
  errors: Record<string, { message?: string }>;
  type?: string;
  strip?: boolean;
  disable?: boolean;
  labelInfo?: string;
  validations?: RegisterOptions<TFieldValues>;
  onValueChange?: (value: string) => void;
}

const FormInput = <TFieldValues extends FieldValues = FieldValues>({
  register,
  name,
  label,
  required,
  errors,
  type = "text",
  strip = false,
  disable = false,
  labelInfo = "",
  validations = {},
  onValueChange,
}: FormInputProps<TFieldValues>) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (strip) {
      value = value.replace(/\s+/g, "");
    }
    e.target.value = value;
    if (typeof onValueChange === "function") {
      onValueChange(e.target.value);
    }
  };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  const registerProps = register(name, {
    required: required ? "This field is required" : false,
    ...validations,
  });

  return (
    <div className="mb-2 w-full bg-gray-50 border rounded-md p-2 flex">
      <LabelWithToolTip labelInfo={labelInfo} label={label} required={required} />
      <input
        onFocus={handleFocus}
        {...registerProps}
        disabled={disable}
        id={name as string}
        type={type}
        className={inputClass}
        placeholder="Type here..."
        onChange={handleChange}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
      />
      {errors[name as string] && (
        <p className="text-red-500 text-xs italic">
          {errors[name as string]?.message || "This field is required"}
        </p>
      )}
    </div>
  );
};

interface FormTextInputProps<TFieldValues extends FieldValues = FieldValues> {
  register: UseFormRegister<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  required?: boolean;
  errors: Record<string, { message?: string }>;
  strip?: boolean;
  disable?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  labelInfo?: string;
}

const FormTextInput = <TFieldValues extends FieldValues = FieldValues>({
  register,
  name,
  label,
  required,
  errors,
  strip = false,
  disable = false,
  onChange,
  labelInfo = "",
}: FormTextInputProps<TFieldValues>) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;
    if (strip) {
      // Replace all spaces globally
      value = value.replace(/\s+/g, "");
    }
    e.target.value = value;
    if (onChange) {
      onChange(e);
    }
  };
  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
  };

  const registerProps = register(name, {
    required: required ? "This field is required" : false,
  });

  return (
    <div className="mb-4 w-full bg-gray-50 border rounded-md p-2 flex">
      <LabelWithToolTip labelInfo={labelInfo} label={label} required={required} />
      <textarea
        onFocus={handleFocus}
        {...registerProps}
        disabled={disable}
        id={name as string}
        rows={10}
        cols={100}
        className={inputClass}
        onChange={handleChange} // Apply custom onChange to handle value transformation
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
      />
      {errors[name as string] && (
        <p className="text-red-500 text-xs italic">
          {errors[name as string]?.message || "This field is required"}
        </p>
      )}
    </div>
  );
};

export { FormInput, FormTextInput };

export function LabelWithToolTip({
  label,
  // labelInfo,
  required,
}: {
  label: string;
  labelInfo: string;
  required?: string | boolean;
}) {
  return (
    <div className="flex justify-between w-full">
      <label className={labelClass}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    </div>
  );
}

export function LabelToolTip({ label }: { label: string }) {
  const formattedLabelInfo = label.split("\n").map((line, index) => (
    <Fragment key={index}>
      {line}
      <br />
    </Fragment>
  ));

  return (
    <div className="relative p-2 pr-8 max-w-xs  shadow-lg bg-blue-50  backdrop-blur-lg text-white text-sm font-semibold text-center border border-white/20">
      <div className="absolute top-2 left-2"></div>
      <h1 className="text-black mb-1 ml-3">{formattedLabelInfo}</h1>
    </div>
  );
}
