import { useContext } from "react";
import { FormInput } from "../form-input";
import FormSelect from "../form-select";
import CheckboxGroup from "../checkbox";
import ItemCustomisationSelector from "../nested-select";
import GenericForm from "../generic-form";
import { SubmitEventParams } from "../../../../types/flow-types";
import Ret10GrocerySelect from "../custom-forms/ret10-grocery-select";
import ProtocolHTMLForm from "../custom-forms/protocol-html-form";
import TRVSelect from "../custom-forms/trv-select";
import JsonSchemaForm from "../../../protocol-playground/ui/extras/rsjf-form";
import FinvuRedirectForm from "../custom-forms/finvu-redirect-form";
import { SessionContext } from "../../../../context/context";

export interface FormFieldConfigType {
	name: string;
	label: string;
	type:
		| "text"
		| "select"
		| "textarea"
		| "list"
		| "checkbox"
		| "boolean"
		| "ret10_grocery_select"
		| "nestedSelect"
		| "trv_select"
		| "HTML_FORM"
		| "FINVU_REDIRECT";
	payloadField: string;
	values?: string[];
	defaultValue?: string;
	input?: FormFieldConfigType[];
	options?: any;
	default?: any;
	display?: boolean;
	reference?: string;
	schema?: any;
}

export type FormConfigType = FormFieldConfigType[];

export default function FormConfig({
	formConfig,
	submitEvent,
	referenceData,
	flowId,
}: {
	formConfig: FormConfigType;
	submitEvent: (data: SubmitEventParams) => Promise<void>;
	referenceData?: Record<string, any>;
	flowId?: string;
}) {
	const sessionContext = useContext(SessionContext);
	const sessionId = sessionContext?.sessionId || '';
	const sessionData = sessionContext?.sessionData;

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

	// Check for schema form
	if (formConfig.find((f) => f.schema)) {
		const schemaField = formConfig.find((f) => f.schema);
		return JsonSchemaForm({
			schema: schemaField!.schema,
			onSubmit: onSubmit,
		});
	}

	// Check for FINVU_REDIRECT type
	if (formConfig.find((field) => field.type === "FINVU_REDIRECT")) {
		// Get transaction ID from session context using flowId
		let transactionId: string | undefined = undefined;
		if (flowId && sessionData && sessionData.flowMap) {
			transactionId = sessionData.flowMap[flowId] || undefined;
		}

		return (
			<FinvuRedirectForm
				submitEvent={submitEvent}
				referenceData={referenceData}
				sessionId={sessionId}
				transactionId={transactionId || ''}
			/>
		);
	}

	if (formConfig.find((field) => field.type === "ret10_grocery_select")) {
		return <Ret10GrocerySelect submitEvent={submitEvent} />;
	}

	if (formConfig.find((field) => field.type === "HTML_FORM")) {
		return ProtocolHTMLForm({
			submitEvent: submitEvent,
			referenceData: referenceData,
			HtmlFormConfigInFlow: formConfig.find(
				(field) => field.type === "HTML_FORM"
			) as FormFieldConfigType,
		});
	}

	if (formConfig.find((field) => field.type === "trv_select")) {
		return <TRVSelect submitEvent={submitEvent} />;
	}

	// Default: GenericForm
	if (formConfig.find((field) => field.type === "trv_select")) {
		return <TRVSelect submitEvent={submitEvent} />;
	}

	if (formConfig.find((field) => field.type === "airline_select")) {
		return <AirlineSelect submitEvent={submitEvent} />;
	}

	if (formConfig.find((field) => field.type === "airline_select")) {
		return <AirlineSelect submitEvent={submitEvent} />;
	}

	 if (formConfig.find((field) => field.type === "airline_select")) {
                return <AirlineSelect submitEvent={submitEvent} />;
        }
        if(formConfig.find((field) => field.type === "airline_select")) {
                return <AirlineSelect submitEvent={submitEvent} />
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
								key={field.name}
							/>
						);
					case "select":
						return (
							<FormSelect
								name={field.name}
								label={field.label}
								options={field.values}
								key={field.name}
							/>
						);
					case "checkbox":
						return (
							<CheckboxGroup
								options={field.options}
								label={field.label}
								name={field.name}
								defaultValue={field.default}
								key={field.name}
							/>
						);
					case "nestedSelect":
						return (
							<ItemCustomisationSelector
								label={field.label}
								name={field.name}
								key={field.name}
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
