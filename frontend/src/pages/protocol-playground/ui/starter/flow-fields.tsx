import { Controller, type Control, type FieldPath } from "react-hook-form";

import { ComboBox } from "@/components/Shadcn/ComboBox";
import { TextField } from "@/components/Shadcn/TextField";
import type { IFlowFieldsProps, IStarterFormValues } from "@pages/protocol-playground/ui/starter/types";

interface IControlledTextFieldProps {
    control: Control<IStarterFormValues>;
    name: FieldPath<IStarterFormValues>;
    label: string;
    placeholder: string;
    required?: boolean;
}

const ControlledTextField = ({
    control,
    name,
    label,
    placeholder,
    required,
}: IControlledTextFieldProps) => (
    <Controller
        control={control}
        name={name}
        rules={{ required: required ? "Field required" : false }}
        render={({ field, fieldState }) => (
            <TextField
                label={label}
                placeholder={placeholder}
                required={required}
                error={fieldState.error?.message}
                {...field}
            />
        )}
    />
);

interface IOptionOrTextFieldProps {
    control: Control<IStarterFormValues>;
    name: FieldPath<IStarterFormValues>;
    label: string;
    options: string[];
    comboPlaceholder: string;
    textPlaceholder: string;
    onValueChange?: () => void;
}

const OptionOrTextField = ({
    control,
    name,
    label,
    options,
    comboPlaceholder,
    textPlaceholder,
    onValueChange,
}: IOptionOrTextFieldProps) =>
    options.length > 0 ? (
        <ComboBox
            control={control}
            name={name}
            label={label}
            options={options}
            placeholder={comboPlaceholder}
            onValueChange={onValueChange}
        />
    ) : (
        <ControlledTextField
            control={control}
            name={name}
            label={label}
            placeholder={textPlaceholder}
        />
    );

export const FlowFields = ({
    control,
    domainOptions,
    versionOptions,
    usecaseOptions,
    onDomainChange,
    onVersionChange,
}: IFlowFieldsProps) => (
    <div className="flex flex-col gap-5">
        <OptionOrTextField
            control={control}
            name="domain"
            label="Domain"
            options={domainOptions}
            comboPlaceholder="Select a domain..."
            textPlaceholder="e.g., mobility, logistics, retail"
            onValueChange={onDomainChange}
        />

        <OptionOrTextField
            control={control}
            name="version"
            label="Version"
            options={versionOptions}
            comboPlaceholder="Select a version..."
            textPlaceholder="e.g., 2.0.1, 1.5.3"
            onValueChange={onVersionChange}
        />

        <ControlledTextField
            control={control}
            name="flowId"
            label="Flow ID"
            placeholder="Enter unique flow identifier"
        />

        <OptionOrTextField
            control={control}
            name="usecase"
            label="Select Usecase"
            options={usecaseOptions}
            comboPlaceholder="Select a usecase..."
            textPlaceholder="Enter usecase identifier"
        />

        <ControlledTextField
            control={control}
            name="useCaseId"
            label="Use Case ID"
            placeholder="e.g. UCS-001"
        />

        <ControlledTextField
            control={control}
            name="description"
            label="Description"
            placeholder="What does this flow test?"
        />
    </div>
);

export default FlowFields;
