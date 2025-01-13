import { FormInput } from "../form-input";
import FormSelect from "../form-select";
import GenericForm from "../generic-form";

export interface FormFieldConfigType {
	name: string;
	label: string;
	type: "text" | "select" | "textarea" | "list";
	payloadField: string;
	values?: string[];
	defaultValue?: string;
	input?: FormFieldConfigType[];
}

export type FormConfigType = FormFieldConfigType[];

export default function FormConfig({
	formConfig,
	submitEvent,
}: {
	formConfig: FormConfigType;
	submitEvent: (data: Record<string, string>) => Promise<void>;
}) {
	const onSubmit = async (data: Record<string, string>) => {
		const formatedData: Record<string, string> = {};
		for (const key in data) {
			const payloadField = formConfig.find(
				(field) => field.name === key
			)?.payloadField;
			if (payloadField) {
				formatedData[payloadField] = data[key];
			}
		}
		await submitEvent(formatedData);
		console.log(formatedData);
	};

	return (
		<GenericForm onSubmit={onSubmit}>
			{formConfig.map((field) => {
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
					default:
						console.log("Invalid field type");
						return <></>;
				}
			})}
		</GenericForm>
	);
}
