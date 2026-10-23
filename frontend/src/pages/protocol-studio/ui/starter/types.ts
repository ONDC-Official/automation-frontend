import type { ComboBoxOptionInput } from "@components/Shadcn/ComboBox/combo-box-options";
import type { Control } from "react-hook-form";
import type { MockPlaygroundConfigV2Type } from "@ondc/automation-mock-runner";

/** v1's starter form values without `flowId` — a Studio config covers every flow. */
export interface IStudioStarterFormValues {
    domain: string;
    version: string;
    useCaseId: string;
    description: string;
}

export interface IStudioStarterScreenProps {
    onCreate: (config: MockPlaygroundConfigV2Type) => void;
}

export interface IStudioFlowFieldsProps {
    control: Control<IStudioStarterFormValues>;
    domainOptions: ComboBoxOptionInput[];
    versionOptions: string[];
    onDomainChange: () => void;
}
