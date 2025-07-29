import { useEffect, useState } from "react";
import { Select } from "antd";
import { LabelWithToolTip } from "./form-input";

interface IOption {
  label: string;

  value: string;
}

const FormSelect = ({
  register = (_: any) => {},
  name,
  label,
  options,
  errors,
  setSelectedValue = (_: string | string[]) => {},
  labelInfo = "",
  nonSelectedValue = false,
  disabled = false,
  required = false,
  currentValue = "",
  multiple = false,
}: any) => {
  const [value, setValue] = useState<string | string[]>(multiple ? [] : "");

  useEffect(() => {
    if (nonSelectedValue) {
      setValue(multiple ? [] : "");
    }
  }, [options, multiple]);

  useEffect(() => {
    if (currentValue !== undefined && currentValue !== null) {
      setValue(currentValue);
    }
  }, [currentValue]);

  const onSelectChange = (value: string | string[]) => {
    if (multiple) {
      const selectedOptions = Array.isArray(value) ? value : [value];
      console.log(selectedOptions, "selected options");
      setSelectedValue(selectedOptions);
      setValue(selectedOptions);
    } else {
      const selectedValue = Array.isArray(value) ? value[0] : value;
      console.log(selectedValue, "selected value");
      setSelectedValue(selectedValue);
      setValue(selectedValue);
    }
  };

  return (
    <>
      <div className="mb-4 w-full">
        <LabelWithToolTip labelInfo={labelInfo} label={label} />

        <Select
          {...register(name, {
            required: required && `This field is required`,
          })}
          placeholder={nonSelectedValue ? "Select a value" : undefined}
          value={currentValue || value}
          onChange={onSelectChange}
          disabled={disabled}
          mode={multiple ? "multiple" : undefined}
          style={{ width: "100%" }}
          size="large"
          allowClear={multiple}
          showSearch={multiple}
          filterOption={(input, option) =>
            String(option?.label ?? "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          maxTagCount={multiple ? "responsive" : undefined}
          // className="antd-select"
        >
          {options.map((option: string | IOption, index: number) => {
            let optionValue, optionLabel;

            if (typeof option === "string") {
              optionValue = option;
              optionLabel = option;
            } else {
              optionValue = option.value;
              optionLabel = option.label;
            }

            return (
              <Select.Option value={optionValue} key={index}>
                {optionLabel}
              </Select.Option>
            );
          })}
        </Select>

        {errors && errors[name] && (
          <p className="text-red-500 text-xs italic dark:text-red-400 mt-1">
            {errors[name].message}
          </p>
        )}
      </div>
    </>
  );
};

export default FormSelect;
