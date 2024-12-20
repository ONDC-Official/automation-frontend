import React from "react";
import { LabelWithToolTip } from "./form-input";
import { inputClass } from "./inputClass";

const FormSelect = ({
	register = (_: any) => {},
	name,
	label,
	options,
	errors,
	setSelectedValue = (_: string) => {},
	defaultValue,
	labelInfo = "",
}: any) => {
	const onSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		console.log(e.target.value, "index");
		setSelectedValue(e.target.value);
	};
	return (
		<>
			<div className="mb-4">
				<LabelWithToolTip labelInfo={labelInfo} label={label} />
				<select
					{...register(name)}
					className={inputClass}
					onChange={onSelectChange}
					defaultValue={defaultValue}
				>
					{options.map((option: string, index: number) => {
						if (defaultValue === option)
							return (
								<option selected value={option} key={index}>
									{option}
								</option>
							);
						return (
							<option value={option} key={index}>
								{option}
							</option>
						);
					})}
				</select>
				{errors && errors[name] && (
					<p className="text-red-500">{errors[name].message}</p>
				)}
			</div>
		</>
	);
};

export default FormSelect;
