import { FormInput } from "../form-input";
import FormSelect from "../form-select";
import CheckboxGroup from "../checkbox";
import ItemCustomisationSelector from "../nested-select";
import GenericForm from "../generic-form";
import { SubmitEventParams } from "../../../../types/flow-types";
import Ret10GrocerySelect from "../custom-forms/ret10-grocery-select";
import TRVSelect from "../custom-forms/trv-select";

export interface FormFieldConfigType {
	name: string;
	label: string;
	type:
		| "text"
		| "select"
		| "textarea"
		| "list"
		| "checkbox"
		| "ret10_grocery_select"
		| "nestedSelect"
		| "trv_select"
	payloadField: string;
	values?: string[];
	defaultValue?: string;
	input?: FormFieldConfigType[];
	options?: any;
	default?: any;
	display?: boolean;
}

export type FormConfigType = FormFieldConfigType[];

export default function FormConfig({
	formConfig,
	submitEvent,
}: {
	formConfig: FormConfigType;
	submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
	const onSubmit = async (data: Record<string, string>) => {
		const formatedData: Record<string, string> = {};
		const formData: Record<string, string> = data;
		for (const key in data) {
			const payloadField = formConfig.find(
				(field) => field.name === key
			)?.payloadField;
			if (payloadField) {
				formatedData[payloadField] = data[key];
			}
		}
		await submitEvent({ jsonPath: formatedData, formData: formData });
		console.log({ jsonPath: formatedData, formData: formData });
	};

	const defaultValues: any = {};
	let isNoFieldVisible = false;

	formConfig.forEach((field) => {
		const { display = true } = field;

		if (field.default) {
			defaultValues[field.name] = field.default;
		}

		if (display) {
			isNoFieldVisible = true;
		}
	});

	if (formConfig.find((field) => field.type === "ret10_grocery_select")) {
		return <Ret10GrocerySelect submitEvent={submitEvent} />;
	}

	if(formConfig.find((field) => field.type === "trv_select")) {
		return <TRVSelect submitEvent={submitEvent} />
	}

	return (
		<GenericForm
			defaultValues={defaultValues}
			className="h-[500px] overflow-scroll"
			onSubmit={onSubmit}
			triggerSubmit={!isNoFieldVisible}
		>
			{formConfig.map((field) => {
				const { display = true } = field;
				if (!display) {
					return <></>;
				}

				switch (field.type) {
					case "text":
						return (
							<FormInput
								name={field.name}
								label={field.label}
								required={true}
								// key={field.payloadField}
							/>
						);
					case "select":
						return (
							<FormSelect
								name={field.name}
								label={field.label}
								options={field.values}
								// key={field.payloadField}
							/>
						);
					case "checkbox":
						return (
							<CheckboxGroup
								options={field.options}
								label={field.label}
								name={field.name}
								defaultValue={field.default}
							/>
						);
						case "nestedSelect":
							return (
							  <ItemCustomisationSelector
								label={field.label}
								name={field.name}
							  />
							);
					default:
						console.log("Invalid field type");
						return <></>;
				}
			})}
		</GenericForm>
	);
}
