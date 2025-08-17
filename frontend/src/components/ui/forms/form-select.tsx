import React, { useEffect, useState } from "react";
import { LabelWithToolTip } from "./form-input";
import { inputClass } from "./inputClass";

interface IOption {
  key: string;
  value: string;
}

const FormSelect = ({
  register = (_: any) => {},
  name,
  label,
  options,
  errors,
  setSelectedValue = (_: string | string[]) => {},
  defaultValue,
  labelInfo = "",
  nonSelectedValue = false,
  disabled = false,
  required = false,
  currentValue = "",
  multiple = false,
}: any) => {
  const [value, setValue] = useState<string | string[]>(multiple ? [] : "");

  useEffect(() => {
    if (nonSelectedValue && !currentValue) {
      setValue(multiple ? [] : "");
    }
  }, [options, multiple, nonSelectedValue, currentValue]);

  const onSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (multiple) {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      console.log(selectedOptions, "selectedOptions");
      setSelectedValue(selectedOptions);
      setValue(selectedOptions);
    } else {
      console.log(e.target.value, "index");
      setSelectedValue(e.target.value);
      console.log("reaching till here>>>???");
      setValue(e.target.value);
    }
  };
  return (
    <>
      <div className="mb-4 w-full">
        <LabelWithToolTip labelInfo={labelInfo} label={label} />
        <select
          {...register(name, {
            required: required && `This field is required`,
          })}
          className={`${inputClass} ${multiple ? 'h-32' : ''}`}
          onChange={onSelectChange}
          defaultValue={defaultValue}
          disabled={disabled}
          value={currentValue || value}
          multiple={multiple}
        >
          {nonSelectedValue && !multiple && (
            <option value="" disabled>
              Select a value
            </option>
          )}

          {options.map((option: string | IOption, index: number) => {
            let optionValue;
            let optionDisplay;

            if (typeof option === "string") {
              optionValue = option;
              optionDisplay = option;
            } else {
              optionValue = option.value;
              optionDisplay = option.key;
            }

            return (
              <option value={optionValue} key={index}>
                {optionDisplay}
              </option>
            );
          })}
        </select>
        {errors && errors[name] && (
          <p className="text-red-500 text-xs italic dark:text-red-400">
            {errors[name].message}
          </p>
        )}
        {multiple && (
          <p className="text-gray-500 text-xs mt-1">
            Hold Ctrl (Windows) or Cmd (Mac) to select multiple options
          </p>
        )}
      </div>
    </>
  );
};

export default FormSelect;
