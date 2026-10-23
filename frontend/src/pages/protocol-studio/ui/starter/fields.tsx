import { ComboBox } from "@components/Shadcn/ComboBox";
import type { ComboBoxOptionInput } from "@components/Shadcn/ComboBox/combo-box-options";
import { TextField } from "@components/Shadcn/TextField";
import type {
    IStudioFlowFieldsProps,
    IStudioStarterFormValues,
} from "@pages/protocol-studio/ui/starter/types";
import type { Control, FieldPath } from "react-hook-form";

interface IOptionOrTextFieldProps {
    control: Control<IStudioStarterFormValues>;
    name: FieldPath<IStudioStarterFormValues>;
    label: string;
    options: ComboBoxOptionInput[];
    comboPlaceholder: string;
    textPlaceholder: string;
    required?: boolean;
    onValueChange?: () => void;
}

const OptionOrTextField = ({
    control,
    name,
    label,
    options,
    comboPlaceholder,
    textPlaceholder,
    required,
    onValueChange,
}: IOptionOrTextFieldProps) =>
    options.length > 0 ? (
        <ComboBox
            control={control}
            name={name}
            label={label}
            options={options}
            placeholder={comboPlaceholder}
            required={required}
            onValueChange={onValueChange}
        />
    ) : (
        <TextField
            control={control}
            name={name}
            label={label}
            placeholder={textPlaceholder}
            required={required}
        />
    );

/** v1's `FlowFields` without Flow ID. */
export const StudioFlowFields = ({
    control,
    domainOptions,
    versionOptions,
    onDomainChange,
}: IStudioFlowFieldsProps) => (
    <div className="flex flex-col gap-5">
        <OptionOrTextField
            control={control}
            name="domain"
            label="Domain"
            options={domainOptions}
            comboPlaceholder="Select a domain..."
            textPlaceholder="e.g., mobility, logistics, retail"
            required
            onValueChange={onDomainChange}
        />

        <OptionOrTextField
            control={control}
            name="version"
            label="Version"
            options={versionOptions}
            comboPlaceholder="Select a version..."
            textPlaceholder="e.g., 2.0.1, 1.5.3"
            required
        />

        <TextField
            control={control}
            name="useCaseId"
            label="Use Case ID"
            placeholder="e.g. UCS-001"
        />

        <TextField
            control={control}
            name="description"
            label="Description"
            placeholder="What do these flows test?"
        />
    </div>
);

export default StudioFlowFields;
