import React from "react";
import { LabelWithToolTip } from "./form-input";

interface FormCheckboxProps {
	register: any; // For react-hook-form registration
	name: string; // Name of the checkbox
	label: string; // Label for the checkbox
	required?: boolean; // Is the checkbox required?
	errors: Record<string, any>; // Errors object from react-hook-form
	disable?: boolean; // Disable the checkbox
	labelInfo?: string; // Tooltip information
}

const FormCheckbox: React.FC<FormCheckboxProps> = ({
	register,
	name,
	label,
	required = false,
	errors,
	disable = false,
	labelInfo = "",
}) => {
	const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		e.stopPropagation();
	};

	return (
		<div className="mb-4">
			<LabelWithToolTip labelInfo={labelInfo} label={label} />
			<div className="flex items-center">
				<input
					onFocus={handleFocus}
					{...register(name, { required })}
					disabled={disable}
					id={name}
					type="checkbox"
					className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-300 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
				/>
				<label
					htmlFor={name}
					className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
				>
					{label}
				</label>
			</div>
			{errors[name] && (
				<p className="text-red-500 text-xs italic dark:text-red-400">
					{errors[name]?.message || "This field is required"}
				</p>
			)}
		</div>
	);
};

export default FormCheckbox;
