import React, {useEffect, useState} from "react";
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
	setSelectedValue = (_: string) => {},
	defaultValue,
	labelInfo = "",
	nonSelectedValue = false,
	disabled = false
}: any) => {
	const [value, setValue] = useState("")

	useEffect(() => {
		console.log(">>>>>>>>>>>>>>>>>>> changeing options <<<<<<<<<<<<<<<<<<<,")
		setValue("")
	}, [options])

	const onSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		console.log(e.target.value, "index");
		setSelectedValue(e.target.value);
		setValue(e.target.value)
	};
	return (
		<>
			<div className="mb-4 w-full">
				<LabelWithToolTip labelInfo={labelInfo} label={label} />
				<select
					{...register(name)}
					className={inputClass}
					onChange={onSelectChange}
					defaultValue={defaultValue}
					disabled={disabled}
					value={value}
				>
					{
						nonSelectedValue && <option value="" disabled selected>Select a value</option>
					}

					{options.map((option: string | IOption, index: number) => {
						let value

						if(typeof option === "string") {
							value = option
						} else {
							value = option.value
							option = option.key
						}

						if (defaultValue === option)
							return (
								<option selected value={value} key={index}>
									{option}
								</option>
							);
						return (
							<option value={value} key={index}>
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
