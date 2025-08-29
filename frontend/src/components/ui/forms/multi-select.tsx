import React from "react";
import { Select } from "antd";
import { LabelWithToolTip } from "./form-input";

interface IOption {
	key: string;
	value: string;
}

interface MultiSelectProps {
	name: string;
	label: string;
	options: (string | IOption)[];
	selectedValues: string[];
	onChange: (values: string[]) => void;
	labelInfo?: string;
	disabled?: boolean;
	required?: boolean;
	placeholder?: string;
	errors?: any;
	allowClear?: boolean;
	showSearch?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
	name,
	label,
	options,
	selectedValues = [],
	onChange,
	labelInfo = "",
	disabled = false,
	placeholder = "Select options...",
	errors,
	allowClear = true,
	showSearch = true
}) => {
	// Normalize options to Ant Design format
	const normalizedOptions = options.map((option, index) => {
		if (typeof option === "string") {
			return { 
				label: option, 
				value: option,
				key: index
			};
		}
		return { 
			label: option.key, 
			value: option.value,
			key: index
		};
	});

	const handleChange = (values: string[]) => {
		onChange(values);
	};

	return (
		<div className="mb-4 w-full">
			<LabelWithToolTip labelInfo={labelInfo} label={label} />
			
			<Select
				mode="multiple"
				placeholder={placeholder}
				value={selectedValues}
				onChange={handleChange}
				options={normalizedOptions}
				disabled={disabled}
				allowClear={allowClear}
				showSearch={showSearch}
				style={{ width: '100%' }}
				size="large"
				filterOption={(input, option) =>
					(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
				}
				maxTagCount="responsive"
				className="antd-select"
			/>

			{/* Error message */}
			{errors && errors[name] && (
				<p className="text-red-500 text-xs italic dark:text-red-400 mt-1">
					{errors[name].message}
				</p>
			)}
		</div>
	);
};

export default MultiSelect;