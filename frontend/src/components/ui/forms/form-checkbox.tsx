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
					className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-2 focus:ring-sky-500"
				/>
				<label
					htmlFor={name}
					className="ml-2 text-sm font-medium text-gray-900"
				>
					{label}
				</label>
			</div>
			{errors[name] && (
				<p className="text-red-500 text-xs italic">
					{errors[name]?.message || "This field is required"}
				</p>
			)}
		</div>
	);
};

export default FormCheckbox;
