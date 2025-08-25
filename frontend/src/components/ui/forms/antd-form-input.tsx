import React from "react";
import { Input } from "antd";
import { LabelWithToolTip } from "./form-input";

interface AntdFormInputProps {
  name: string;
  label: string;
  value: string | number;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  labelInfo?: string;
  errors?: any;
  className?: string;
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  size?: "small" | "middle" | "large";
  min?: string | number;
  max?: string | number;
}

const AntdFormInput: React.FC<AntdFormInputProps> = ({
  name,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
  labelInfo = "",
  errors,
  className = "",
  maxLength,
  showCount = false,
  prefix,
  suffix,
  size = "large",
  min,
  max,
}) => {
  const commonProps = {
    value: String(value),
    onChange,
    placeholder,
    disabled,
    size,
    className: `antd-input ${className}`,
    maxLength,
    showCount,
    prefix,
    suffix,
  };

  const renderInput = () => {
    switch (type) {
      // case "textarea":
      //   return (
      //     <Input.TextArea
      //       {...commonProps}
      //       rows={rows || 3}
      //       autoSize={rows ? false : { minRows: 3, maxRows: 6 }}
      //     />
      //   );
      case "password":
        return <Input.Password {...commonProps} />;
      case "email":
        return <Input {...commonProps} type="email" />;
      case "number":
        return (
          <Input
            {...commonProps}
            type="number"
            min={min !== undefined ? min : "0"}
            max={max}
          />
        );
      case "tel":
        return <Input {...commonProps} type="tel" />;
      case "url":
        return <Input {...commonProps} type="url" />;
      default:
        return <Input {...commonProps} type={type} />;
    }
  };

  return (
    <div className="mb-4 w-full">
      <LabelWithToolTip labelInfo={labelInfo} label={label} />
      {renderInput()}
      {errors && errors[name] && (
        <p className="text-red-500 text-xs italic dark:text-red-400 mt-1">
          {errors[name].message}
        </p>
      )}
    </div>
  );
};

export default AntdFormInput;
