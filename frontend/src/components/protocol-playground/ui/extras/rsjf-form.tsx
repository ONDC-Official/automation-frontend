// components/RJSFForm.tsx
// Enhanced with automatic grid layout for object fields
// Two fields will automatically display side-by-side in object schemas
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import {
	RJSFSchema,
	FieldTemplateProps,
	ObjectFieldTemplateProps,
} from "@rjsf/utils";
import "./rsjs.css";

interface JsonSchemaFormProps {
	schema: RJSFSchema;
	formData?: any;
	onSubmit: (data: any) => void;
	onChange?: (data: any) => void;
}

// Custom Field Template
function CustomFieldTemplate(props: FieldTemplateProps) {
	const {
		id,
		label,
		required,
		description,
		errors,
		help,
		children,
		hidden,
		displayLabel,
	} = props;

	if (hidden) {
		return <div className="hidden">{children}</div>;
	}

	return (
		<div className="form-group">
			{displayLabel && label && (
				<label htmlFor={id} className={required ? "required" : ""}>
					{label}
				</label>
			)}
			{description && <div className="field-description">{description}</div>}
			{children}
			{errors && <div className="field-error">{errors}</div>}
			{help && <div className="field-description">{help}</div>}
		</div>
	);
}

// Custom Object Field Template with Grid Layout
function CustomObjectFieldTemplate(props: ObjectFieldTemplateProps) {
	const { title, description, properties } = props;

	// Determine if this object should use grid layout
	const useGrid = properties.length > 1;
	const gridClass = useGrid ? "field-object" : "field-object single-field";

	return (
		<fieldset className={gridClass}>
			{title && <legend>{title}</legend>}
			{description && <div className="field-description">{description}</div>}
			<div className="object-properties">
				{properties.map((element) => (
					<div key={element.name} className="property-wrapper">
						{element.content}
					</div>
				))}
			</div>
		</fieldset>
	);
}

export default function JsonSchemaForm({
	schema,
	formData,
	onSubmit,
	onChange,
}: JsonSchemaFormProps) {
	return (
		<div className="rjsf-custom-form w-full">
			<Form
				schema={schema}
				formData={formData}
				validator={validator}
				templates={{
					FieldTemplate: CustomFieldTemplate,
					ObjectFieldTemplate: CustomObjectFieldTemplate,
				}}
				onSubmit={({ formData }) => onSubmit(formData)}
				onChange={({ formData }) => onChange?.(formData)}
			/>
		</div>
	);
}
